import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/forms.dart';
import '../../core/widgets/widgets.dart';
import '../../data/db/app_database.dart';
import '../../data/providers.dart';
import '../../data/repositories.dart';
import '../../domain/enums.dart';
import '../../domain/format.dart';
import '../../domain/quote_validity.dart';
import '../customers/customer_picker.dart';
import 'work_screen.dart';

/// Közös "nem található" állapot a projekt-alképernyőkhöz (pl. törlés után).
class ProjectNotFound extends StatelessWidget {
  const ProjectNotFound({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: EmptyState(
        icon: Icons.search_off,
        title: 'A projekt nem található',
        message: 'Lehet, hogy időközben törölted.',
        action: MpButton(label: 'Vissza a projektekhez', onPressed: () => context.go(Routes.projects)),
      ),
    );
  }
}

/// Figyelmeztetés: a projekthez már kiküldött ajánlat tartozik — a módosítás
/// az ajánlat tartalmát is megváltoztatja (adatkonzisztencia a megrendelő felé).
class QuotedNotice extends StatelessWidget {
  const QuotedNotice({super.key, required this.project});
  final Project project;

  @override
  Widget build(BuildContext context) {
    if (project.quoteNumber == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: MpSpace.x3),
      child: MpCard(
        color: MpColors.infoSoft,
        borderColor: MpColors.infoSoft,
        padding: const EdgeInsets.all(MpSpace.x3),
        child: Row(
          children: [
            const Icon(Icons.info_outline, color: MpColors.info, size: 20),
            const SizedBox(width: MpSpace.x3),
            Expanded(
              child: Text(
                'A(z) ${project.quoteNumber} ajánlat már ki lett küldve. Ha itt módosítasz, '
                'jelezd a megrendelőnek is.',
                style: MpText.small.copyWith(color: MpColors.info),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ProjectHubScreen extends ConsumerWidget {
  const ProjectHubScreen({super.key, required this.projectId});
  final int projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectAsync = ref.watch(projectProvider(projectId));

    return projectAsync.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator(strokeWidth: 2.4))),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Padding(padding: const EdgeInsets.all(MpSpace.x6), child: Text(friendlyError(e), style: MpText.body)),
        ),
      ),
      data: (pc) {
        if (pc == null) return const ProjectNotFound();
        final p = pc.project;
        final areasAsync = ref.watch(surveyAreasProvider(projectId));
        final linesAsync = ref.watch(quoteLinesProvider(projectId));
        final areas = areasAsync.valueOrNull ?? const <SurveyArea>[];
        final lines = linesAsync.valueOrNull ?? const <QuoteLine>[];
        final totals = ref.watch(projectTotalsProvider(projectId)).valueOrNull;
        final unpriced = totals?.unpricedLineCount ?? 0;

        return Scaffold(
          appBar: AppBar(
            actions: [
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_horiz),
                onSelected: (v) {
                  if (v == 'edit') _editBasics(context, ref, p);
                  if (v == 'duplicate') _duplicate(context, ref, pc);
                  // Még töltődő listánál nem írunk félrevezető „0 tétel”-t a megerősítésbe.
                  if (v == 'delete') {
                    _delete(context, ref, p, areasAsync.valueOrNull?.length, linesAsync.valueOrNull?.length);
                  }
                },
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'edit', child: Text('Alapadatok szerkesztése')),
                  PopupMenuItem(value: 'duplicate', child: Text('Másolat új munkához')),
                  PopupMenuItem(
                    value: 'delete',
                    child: Text('Projekt törlése', style: TextStyle(color: MpColors.danger)),
                  ),
                ],
              ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(MpSpace.gutter, 0, MpSpace.gutter, MpSpace.x10),
            children: [
              Text(p.title, style: MpText.display),
              const SizedBox(height: MpSpace.x2),
              Wrap(
                spacing: MpSpace.x2,
                runSpacing: MpSpace.x2,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  InkWell(
                    borderRadius: BorderRadius.circular(MpRadius.pill),
                    onTap: () => _changeStatus(context, ref, p),
                    child: StatusChip(p.status),
                  ),
                  InkWell(
                    onTap: () => context.push(Routes.customer(pc.customer.id)),
                    child: Pill(pc.customer.name, icon: Icons.person_outline),
                  ),
                  if (p.quoteNumber != null) Pill(p.quoteNumber!, icon: Icons.tag),
                ],
              ),
              if (p.siteAddress != null) ...[
                const SizedBox(height: MpSpace.x3),
                Row(
                  children: [
                    const Icon(Icons.place_outlined, size: 16, color: MpColors.inkMuted),
                    const SizedBox(width: 6),
                    Expanded(child: Text(p.siteAddress!, style: MpText.small)),
                  ],
                ),
              ],
              const SizedBox(height: MpSpace.x5),
              _TotalBanner(
                grossHuf: totals?.grossTotalHuf ?? 0,
                netHuf: totals?.netTotalHuf ?? 0,
                unpriced: unpriced,
                hasLines: lines.isNotEmpty,
              ),
              _NextStep(project: p),
              const SectionLabel('Lépések'),
              _StepTile(
                index: 1,
                title: 'Felmérés',
                subtitle: areas.isEmpty
                    ? 'Helyiségek, méretek felvétele'
                    : '${areas.length} helyiség / felület',
                done: areas.isNotEmpty,
                onTap: () => context.push(Routes.survey(projectId)),
              ),
              _StepTile(
                index: 2,
                title: 'Munkatételek',
                subtitle: lines.isEmpty ? 'Tételek az árlistából vagy egyedileg' : '${lines.length} tétel',
                done: lines.isNotEmpty,
                onTap: () => context.push(Routes.items(projectId)),
              ),
              _StepTile(
                index: 3,
                title: 'Saját árazás',
                subtitle: lines.isEmpty
                    ? 'Előbb vegyél fel tételeket'
                    : unpriced == 0
                        ? 'Minden tétel árazva'
                        : '$unpriced tételnél hiányzik az ár',
                done: lines.isNotEmpty && unpriced == 0,
                warning: unpriced > 0,
                enabled: lines.isNotEmpty,
                onTap: () => context.push(Routes.pricing(projectId)),
              ),
              _StepTile(
                index: 4,
                title: 'Kalkuláció',
                subtitle: _calcSubtitle(p),
                done: lines.isNotEmpty && unpriced == 0,
                enabled: lines.isNotEmpty,
                onTap: () => context.push(Routes.calculation(projectId)),
              ),
              _StepTile(
                index: 5,
                title: 'Árajánlat',
                subtitle: p.quoteNumber == null ? 'Előnézet és kiküldés' : 'Kiküldve · ${p.quoteNumber}',
                done: p.quoteNumber != null,
                enabled: lines.isNotEmpty,
                isLast: true,
                onTap: () => context.push(Routes.quote(projectId)),
              ),
              if (p.status.isWon) ...[
                const SectionLabel('A munka'),
                _WorkTiles(projectId: projectId, project: p),
              ],
              if (p.notes != null) ...[
                const SectionLabel('Megjegyzés'),
                MpCard(child: Text(p.notes!, style: MpText.body)),
              ],
            ],
          ),
        );
      },
    );
  }

  String _calcSubtitle(Project p) {
    final adj = switch (p.adjustmentType) {
      AdjustmentType.none => 'Nincs kedvezmény',
      AdjustmentType.discount => 'Kedvezmény ${Fmt.percentBp(p.adjustmentPercentBp)}',
      AdjustmentType.surcharge => 'Felár ${Fmt.percentBp(p.adjustmentPercentBp)}',
    };
    return '$adj · ÁFA ${VatRates.label(p.vatRateBp)}';
  }

  Future<void> _changeStatus(BuildContext context, WidgetRef ref, Project p) async {
    final s = await showModalBottomSheet<ProjectStatus>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(MpSpace.gutter, 0, MpSpace.gutter, MpSpace.x3),
              child: Text('Projekt állapota', style: MpText.title),
            ),
            for (final s in ProjectStatus.values)
              ListTile(
                onTap: () => Navigator.of(ctx).pop(s),
                leading: StatusChip(s),
                trailing: s == p.status ? const Icon(Icons.check, color: MpColors.brand) : null,
              ),
            const SizedBox(height: MpSpace.x3),
          ],
        ),
      ),
    );
    if (s == null || s == p.status || !context.mounted) return;
    await runGuarded(context, () => ref.read(projectRepoProvider).setStatus(p.id, s));
  }

  Future<void> _editBasics(BuildContext context, WidgetRef ref, Project p) async {
    final title = TextEditingController(text: p.title);
    final site = TextEditingController(text: p.siteAddress ?? '');
    final notes = TextEditingController(text: p.notes ?? '');
    final form = GlobalKey<FormState>();
    final repo = ref.read(projectRepoProvider);
    await showMpSheet<void>(
      context,
      title: 'Alapadatok',
      child: Form(
        key: form,
        child: Builder(
          builder: (ctx) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              MpField(label: 'Projekt megnevezése *', controller: title, validator: requiredText, maxLength: 200),
              MpField(label: 'Munka helyszíne', controller: site),
              MpField(label: 'Megjegyzés', controller: notes, maxLines: 3),
              MpButton(
                label: 'Mentés',
                expand: true,
                onPressed: () async {
                  if (!form.currentState!.validate()) return;
                  final ok = await runGuarded(
                    ctx,
                    () => repo.updateBasics(
                          p.id,
                          title: title.text,
                          siteAddress: site.text,
                          notes: notes.text,
                        ),
                  );
                  if (ok && ctx.mounted) Navigator.of(ctx).pop();
                },
              ),
            ],
          ),
        ),
      ),
    );
    // Vezérlők: lásd survey_screen.dart — a záró animáció miatt nem dispose-oljuk.
  }

  Future<void> _duplicate(BuildContext context, WidgetRef ref, ProjectWithCustomer pc) async {
    final choice = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(MpSpace.gutter, 0, MpSpace.gutter, MpSpace.x2),
              child: Text('Másolat készítése', style: MpText.title),
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(MpSpace.gutter, 0, MpSpace.gutter, MpSpace.x3),
              child: Text(
                'A helyiségek, tételek és árak átkerülnek egy új piszkozatba. Az eredeti ajánlat nem változik.',
                style: MpText.small,
              ),
            ),
            ListTile(
              leading: const Icon(Icons.person_outline),
              title: Text('Ugyanannak az ügyfélnek (${pc.customer.name})', style: MpText.bodyStrong),
              onTap: () => Navigator.of(ctx).pop('same'),
            ),
            ListTile(
              leading: const Icon(Icons.person_search_outlined),
              title: const Text('Másik ügyfélnek', style: MpText.bodyStrong),
              onTap: () => Navigator.of(ctx).pop('other'),
            ),
            const SizedBox(height: MpSpace.x3),
          ],
        ),
      ),
    );
    if (choice == null || !context.mounted) return;
    var customerId = pc.customer.id;
    if (choice == 'other') {
      final picked = await pickCustomer(context);
      if (picked == null || !context.mounted) return;
      customerId = picked;
    }
    int? newId;
    final ok = await runGuarded(context, () async {
      newId = await ref.read(projectRepoProvider).duplicate(pc.project.id, customerId: customerId);
    });
    if (ok && newId != null && context.mounted) {
      context.pushReplacement(Routes.project(newId!));
      showInfo(context, 'Kész a másolat. Piszkozatként mentettem.');
    }
  }

  Future<void> _delete(BuildContext context, WidgetRef ref, Project p, int? areaCount, int? lineCount) async {
    final ok = await confirmDialog(
      context,
      title: 'Projekt törlése?',
      message: (areaCount == null || lineCount == null)
          ? 'A(z) „${p.title}” projekt a felmérésével és az összes munkatételével együtt véglegesen törlődik. '
              'Ez nem vonható vissza.'
          : 'A(z) „${p.title}” projekt, a hozzá tartozó $areaCount felmért helyiség '
              'és $lineCount munkatétel véglegesen törlődik. Ez nem vonható vissza.',
    );
    if (!ok || !context.mounted) return;
    final done = await runGuarded(context, () => ref.read(projectRepoProvider).delete(p.id));
    if (done && context.mounted) {
      context.go(Routes.projects);
      showInfo(context, 'Projekt törölve');
    }
  }
}

class _TotalBanner extends StatelessWidget {
  const _TotalBanner({required this.grossHuf, required this.netHuf, required this.unpriced, required this.hasLines});
  final int grossHuf;
  final int netHuf;
  final int unpriced;
  final bool hasLines;

  @override
  Widget build(BuildContext context) {
    return MpCard(
      padding: const EdgeInsets.all(MpSpace.x5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('AJÁNLAT ÖSSZESEN (BRUTTÓ)', style: MpText.label),
          const SizedBox(height: MpSpace.x2),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: MoneyText(grossHuf, style: MpText.moneyLarge),
          ),
          const SizedBox(height: 2),
          Text('Nettó ${Fmt.huf(netHuf)}', style: MpText.mono),
          if (hasLines && unpriced > 0) ...[
            const SizedBox(height: MpSpace.x3),
            Pill(
              '$unpriced tételnek nincs ára, az összeg még nem végleges',
              bg: MpColors.warningSoft,
              fg: MpColors.warning,
              icon: Icons.warning_amber_rounded,
            ),
          ],
        ],
      ),
    );
  }
}

class _StepTile extends StatelessWidget {
  const _StepTile({
    required this.index,
    required this.title,
    required this.subtitle,
    required this.done,
    required this.onTap,
    this.warning = false,
    this.enabled = true,
    this.isLast = false,
  });

  final int index;
  final String title;
  final String subtitle;
  final bool done;
  final bool warning;
  final bool enabled;
  final bool isLast;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final Color badgeBg = done ? MpColors.success : (warning ? MpColors.warningSoft : MpColors.surface);
    final Color badgeFg = done ? Colors.white : (warning ? MpColors.warning : MpColors.inkSoft);

    return Opacity(
      opacity: enabled ? 1 : 0.5,
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: MpRadius.mdAll,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(
                width: 36,
                child: Column(
                  children: [
                    const SizedBox(height: 14),
                    Container(
                      width: 30,
                      height: 30,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: badgeBg,
                        shape: BoxShape.circle,
                        border: Border.all(color: done ? MpColors.success : MpColors.lineStrong),
                      ),
                      child: done
                          ? const Icon(Icons.check, size: 17, color: Colors.white)
                          : Text('$index', style: MpText.mono.copyWith(color: badgeFg, fontWeight: FontWeight.w600)),
                    ),
                    if (!isLast)
                      Expanded(
                        child: Container(
                          width: 2,
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          color: done ? MpColors.success.withValues(alpha: 0.35) : MpColors.line,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: MpSpace.x3),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: MpSpace.x3),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: MpText.heading),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: MpText.small.copyWith(color: warning ? MpColors.warning : MpColors.inkMuted),
                      ),
                    ],
                  ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(top: 18),
                child: Icon(Icons.chevron_right, color: MpColors.inkFaint),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A projekt állapotától függő következő lépés, egy koppintással.
/// (Az állapot-címkére koppintva továbbra is bármelyik állapot választható.)
class _NextStep extends ConsumerWidget {
  const _NextStep({required this.project});
  final Project project;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = project;
    Future<void> set(ProjectStatus s, String done) async {
      final ok = await runGuarded(context, () => ref.read(projectRepoProvider).setStatus(p.id, s));
      if (ok && context.mounted) showInfo(context, done);
    }

    final Widget? content = switch (p.status) {
      ProjectStatus.quoted => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (p.quotedAt != null) _ValidityLine(issued: p.quotedAt!, days: p.validityDays),
            const SizedBox(height: MpSpace.x2),
            const Text('Mit mondott az ügyfél?', style: MpText.bodyStrong),
            const SizedBox(height: MpSpace.x3),
            Row(
              children: [
                Expanded(
                  child: MpButton(
                    label: 'Elfogadta',
                    icon: Icons.check,
                    expand: true,
                    onPressed: () => set(ProjectStatus.accepted, 'Elfogadottnak jelölve.'),
                  ),
                ),
                const SizedBox(width: MpSpace.x3),
                Expanded(
                  child: MpButton.secondary(
                    label: 'Nem kérte',
                    expand: true,
                    onPressed: () => set(ProjectStatus.lost, 'Elutasítottnak jelölve.'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ProjectStatus.accepted => MpButton(
          label: 'Munka elkezdve',
          icon: Icons.construction,
          expand: true,
          onPressed: () => set(ProjectStatus.inProgress, 'Folyamatban lévőnek jelölve.'),
        ),
      ProjectStatus.inProgress => MpButton(
          label: 'Munka befejezve',
          icon: Icons.task_alt,
          expand: true,
          onPressed: () => set(ProjectStatus.completed, 'Befejezettnek jelölve.'),
        ),
      ProjectStatus.draft || ProjectStatus.completed || ProjectStatus.lost => null,
    };
    if (content == null) return const SizedBox.shrink();
    return Padding(padding: const EdgeInsets.only(top: MpSpace.x3), child: MpCard(child: content));
  }
}

class _ValidityLine extends StatelessWidget {
  const _ValidityLine({required this.issued, required this.days});
  final DateTime issued;
  final int days;

  @override
  Widget build(BuildContext context) {
    final left = daysLeft(issued, days, DateTime.now());
    final until = Fmt.date(validUntil(issued, days));
    final (Color fg, String text) = switch (validityState(issued, days, DateTime.now())) {
      ValidityState.expired => (MpColors.danger, 'Lejárt: $until. Ha még áll az ajánlat, küldd újra.'),
      ValidityState.expiringSoon =>
        (MpColors.warning, left == 0 ? 'Ma jár le ($until).' : 'Még $left napig érvényes ($until).'),
      ValidityState.valid => (MpColors.inkMuted, 'Érvényes: $until'),
    };
    return Row(
      children: [
        Icon(Icons.schedule, size: 16, color: fg),
        const SizedBox(width: 6),
        Expanded(child: Text(text, style: MpText.small.copyWith(color: fg))),
      ],
    );
  }
}

/// Elfogadott munkánál: pénzügy, ütemezés/napló, anyaglista egy sorban.
class _WorkTiles extends ConsumerWidget {
  const _WorkTiles({required this.projectId, required this.project});
  final int projectId;
  final Project project;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final f = ref.watch(projectFinanceProvider(projectId)).valueOrNull;
    final mats = ref.watch(materialItemsProvider(projectId)).valueOrNull ?? const <MaterialItem>[];
    final toBuy = mats.where((m) => !m.purchased).length;
    final due = f?.outstandingHuf;
    final startText = project.startDate == null
        ? 'Kezdés nincs beírva'
        : 'Kezdés: ${Fmt.date(project.startDate!)}';
    return Row(
      children: [
        Expanded(
          child: _Tile(
            icon: Icons.payments_outlined,
            title: 'Pénzügy',
            value: due == null ? '…' : (due == 0 && f!.quoteGrossHuf > 0 ? 'Kifizetve' : Fmt.huf(due)),
            sub: due == null || due == 0 ? '' : 'még fizetendő',
            accent: due != null && due > 0,
            onTap: () => context.push(Routes.finance(projectId)),
          ),
        ),
        const SizedBox(width: MpSpace.x2),
        Expanded(
          child: _Tile(
            icon: Icons.construction_outlined,
            title: 'Munka',
            value: f == null ? '…' : WorkScreen.hours(f.workMinutes),
            sub: startText,
            onTap: () => context.push(Routes.work(projectId)),
          ),
        ),
        const SizedBox(width: MpSpace.x2),
        Expanded(
          child: _Tile(
            icon: Icons.shopping_bag_outlined,
            title: 'Anyag',
            value: mats.isEmpty ? 'Üres' : (toBuy == 0 ? 'Megvan' : '$toBuy tétel'),
            sub: mats.isEmpty ? '' : (toBuy == 0 ? 'minden' : 'venni kell'),
            accent: toBuy > 0,
            onTap: () => context.push(Routes.materials(projectId)),
          ),
        ),
      ],
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({
    required this.icon,
    required this.title,
    required this.value,
    required this.sub,
    required this.onTap,
    this.accent = false,
  });
  final IconData icon;
  final String title;
  final String value;
  final String sub;
  final VoidCallback onTap;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return MpCard(
      onTap: onTap,
      padding: const EdgeInsets.all(MpSpace.x3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: accent ? MpColors.warning : MpColors.inkMuted),
          const SizedBox(height: MpSpace.x2),
          Text(title, style: MpText.small.copyWith(fontWeight: FontWeight.w600, color: MpColors.ink)),
          const SizedBox(height: 2),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(value, style: MpText.money.copyWith(fontSize: 14, fontWeight: FontWeight.w600)),
          ),
          Text(sub, style: MpText.small.copyWith(fontSize: 11.5), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}
