import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/widgets.dart';
import '../../data/providers.dart';
import '../../domain/format.dart';
import '../projects/project_card.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 9) return 'Jó reggelt';
    if (h < 18) return 'Jó napot';
    return 'Jó estét';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(dashboardStatsProvider);
    final projects = ref.watch(projectsProvider);
    final company = ref.watch(companyProfileProvider).valueOrNull;
    final name = company?.ownerName.trim().isNotEmpty == true
        ? company!.ownerName.trim().split(' ').last
        : null;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.only(bottom: MpSpace.x10),
          children: [
            PageHeader(
              title: name == null ? '${_greeting()}!' : '${_greeting()}, $name!',
              subtitle: Fmt.date(DateTime.now()),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: MpSpace.gutter),
              child: AsyncView(
                value: stats,
                data: (s) => _HeroCard(
                  pipelineHuf: s.pipelineGrossHuf,
                  wonHuf: s.wonGrossHuf,
                  openCount: s.draftCount + s.quotedCount,
                  activeCount: s.activeProjects,
                  outstandingHuf: s.outstandingHuf,
                  paidThisMonthHuf: s.paidThisMonthHuf,
                ),
              ),
            ),
            const SizedBox(height: MpSpace.x4),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: MpSpace.gutter),
              child: Row(
                children: [
                  Expanded(
                    child: _QuickAction(
                      icon: Icons.add_home_work_outlined,
                      label: 'Új árajánlat',
                      primary: true,
                      onTap: () => context.push(Routes.newProject()),
                    ),
                  ),
                  const SizedBox(width: MpSpace.x3),
                  Expanded(
                    child: _QuickAction(
                      icon: Icons.person_add_alt_outlined,
                      label: 'Új ügyfél',
                      onTap: () => context.push(Routes.newCustomer),
                    ),
                  ),
                ],
              ),
            ),
            if (company != null && company.companyName.trim().isEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x4, MpSpace.gutter, 0),
                child: MpCard(
                  color: MpColors.accentSoft,
                  borderColor: MpColors.accentSoft,
                  onTap: () => context.go(Routes.settings),
                  child: Row(
                    children: [
                      const Icon(Icons.badge_outlined, color: MpColors.warning),
                      const SizedBox(width: MpSpace.x3),
                      Expanded(
                        child: Text(
                          'Add meg a cégadataidat. Ezek kerülnek az árajánlat fejlécébe.',
                          style: MpText.body.copyWith(color: MpColors.onAccent),
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: MpColors.warning),
                    ],
                  ),
                ),
              ),
            if ((stats.valueOrNull?.attention ?? const <AttentionItem>[]).isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: MpSpace.gutter),
                child: _AttentionList(items: stats.requireValue.attention),
              ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: MpSpace.gutter),
              child: SectionLabel(
                'Legutóbbi projektek',
                trailing: TextButton(
                  onPressed: () => context.go(Routes.projects),
                  child: const Text('Összes'),
                ),
              ),
            ),
            AsyncView(
              value: projects,
              data: (list) {
                if (list.isEmpty) {
                  return EmptyState(
                    icon: Icons.home_work_outlined,
                    title: 'Még nincs projekted',
                    message: 'Válassz ügyfelet, mérd fel a helyszínt, írd be a tételeket, és kész az ajánlat.',
                    action: MpButton(
                      label: 'Első ajánlat elkészítése',
                      icon: Icons.add,
                      onPressed: () => context.push(Routes.newProject()),
                    ),
                  );
                }
                final gross = stats.valueOrNull?.grossByProject ?? const <int, int>{};
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: MpSpace.gutter),
                  child: Column(
                    children: [
                      for (final item in list.take(5)) ...[
                        ProjectCard(item: item, grossHuf: gross[item.project.id]),
                        const SizedBox(height: MpSpace.x3),
                      ],
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.pipelineHuf,
    required this.wonHuf,
    required this.openCount,
    required this.activeCount,
    required this.outstandingHuf,
    required this.paidThisMonthHuf,
  });

  final int pipelineHuf;
  final int wonHuf;
  final int openCount;
  final int activeCount;
  final int outstandingHuf;
  final int paidThisMonthHuf;

  @override
  Widget build(BuildContext context) {
    final onBrandMuted = MpColors.onBrand.withValues(alpha: 0.62);
    return Container(
      padding: const EdgeInsets.all(MpSpace.x5),
      decoration: const BoxDecoration(
        borderRadius: MpRadius.xlAll,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [MpColors.brand, MpColors.brandSoft],
        ),
        boxShadow: MpShadow.raised,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('NYITOTT AJÁNLATOK', style: MpText.label.copyWith(color: onBrandMuted)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: MpColors.accent,
                  borderRadius: BorderRadius.circular(MpRadius.pill),
                ),
                child: Text(
                  '$openCount db',
                  style: MpText.small.copyWith(color: MpColors.onAccent, fontWeight: FontWeight.w700, fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: MpSpace.x2),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: MoneyText(pipelineHuf, style: MpText.moneyLarge.copyWith(color: MpColors.onBrand, fontSize: 24)),
          ),
          Text('bruttó, kedvezményekkel és ÁFA-val', style: MpText.small.copyWith(color: onBrandMuted)),
          const SizedBox(height: MpSpace.x5),
          Container(height: 1, color: MpColors.onBrand.withValues(alpha: 0.12)),
          const SizedBox(height: MpSpace.x4),
          Row(
            children: [
              Expanded(child: _HeroStat(label: 'Megnyert munkák', child: MoneyText(wonHuf, style: MpText.money.copyWith(color: MpColors.onBrand)))),
              Expanded(
                child: _HeroStat(
                  label: 'Ügyfelek tartozása',
                  child: MoneyText(
                    outstandingHuf,
                    style: MpText.money.copyWith(color: outstandingHuf > 0 ? MpColors.accent : MpColors.onBrand),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: MpSpace.x3),
          Row(
            children: [
              Expanded(child: _HeroStat(label: 'Befolyt e hónapban', child: MoneyText(paidThisMonthHuf, style: MpText.money.copyWith(color: MpColors.onBrand)))),
              Expanded(
                child: _HeroStat(
                  label: 'Aktív projektek',
                  child: Text('$activeCount', style: MpText.money.copyWith(color: MpColors.onBrand)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({required this.label, required this.child});
  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: MpText.small.copyWith(color: MpColors.onBrand.withValues(alpha: 0.62))),
        const SizedBox(height: 2),
        FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerLeft, child: child),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.onTap, this.primary = false});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool primary;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: primary ? MpColors.accent : MpColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: MpRadius.lgAll,
        side: BorderSide(color: primary ? MpColors.accent : MpColors.line),
      ),
      child: InkWell(
        borderRadius: MpRadius.lgAll,
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: MpSpace.x4, vertical: MpSpace.x4),
          child: Row(
            children: [
              Icon(icon, size: 22, color: primary ? MpColors.onAccent : MpColors.ink),
              const SizedBox(width: MpSpace.x3),
              Flexible(
                child: Text(
                  label,
                  style: MpText.bodyStrong.copyWith(
                    color: primary ? MpColors.onAccent : MpColors.ink,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Teendők: ami miatt ma érdemes ránézni egy projektre.
class _AttentionList extends StatelessWidget {
  const _AttentionList({required this.items});
  final List<AttentionItem> items;

  static const _max = 4;

  (IconData, Color, Color, String) _style(AttentionItem a) => switch (a.kind) {
        AttentionKind.expired => (
            Icons.event_busy_outlined,
            MpColors.dangerSoft,
            MpColors.danger,
            a.value == -1 ? 'Tegnap lejárt az ajánlat' : '${-a.value} napja lejárt az ajánlat',
          ),
        AttentionKind.expiringSoon => (
            Icons.schedule,
            MpColors.warningSoft,
            MpColors.warning,
            a.value == 0 ? 'Ma jár le az ajánlat' : '${a.value} nap múlva lejár az ajánlat',
          ),
        AttentionKind.unpriced => (
            Icons.sell_outlined,
            MpColors.warningSoft,
            MpColors.warning,
            '${a.value} tételnek nincs ára',
          ),
        AttentionKind.awaitingPayment => (
            Icons.payments_outlined,
            MpColors.accentSoft,
            MpColors.warning,
            'Fizetésre vár: ${Fmt.huf(a.value)}',
          ),
        AttentionKind.startingSoon => (
            Icons.construction_outlined,
            MpColors.infoSoft,
            MpColors.info,
            a.value == 0 ? 'Ma kezdődik a munka' : 'Kezdés ${a.value} nap múlva',
          ),
      };

  @override
  Widget build(BuildContext context) {
    final shown = items.take(_max).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionLabel(
          'Teendők',
          trailing: items.length > _max ? Text('+${items.length - _max}', style: MpText.small) : null,
        ),
        MpCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              for (var i = 0; i < shown.length; i++) ...[
                if (i > 0) const Divider(indent: 56),
                Builder(builder: (context) {
                  final a = shown[i];
                  final (icon, bg, fg, text) = _style(a);
                  return InkWell(
                    onTap: () => context.push(Routes.project(a.item.project.id)),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: MpSpace.x4, vertical: MpSpace.x3),
                      child: Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(color: bg, borderRadius: MpRadius.smAll),
                            child: Icon(icon, size: 18, color: fg),
                          ),
                          const SizedBox(width: MpSpace.x3),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(a.item.project.title,
                                    style: MpText.bodyStrong, maxLines: 1, overflow: TextOverflow.ellipsis),
                                Text('$text · ${a.item.customer.name}',
                                    style: MpText.small.copyWith(color: fg), maxLines: 1, overflow: TextOverflow.ellipsis),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right, color: MpColors.inkFaint),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
