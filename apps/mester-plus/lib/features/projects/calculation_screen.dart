import 'dart:async';

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
import '../../domain/quote_calculator.dart';
import 'project_hub_screen.dart';

class CalculationScreen extends ConsumerWidget {
  const CalculationScreen({super.key, required this.projectId});
  final int projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final project = ref.watch(projectProvider(projectId));
    final totals = ref.watch(projectTotalsProvider(projectId));

    return project.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator(strokeWidth: 2.4))),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Padding(padding: const EdgeInsets.all(MpSpace.x6), child: Text(friendlyError(e), style: MpText.body)),
        ),
      ),
      data: (pc) {
        if (pc == null) return const ProjectNotFound();
        return Scaffold(
          appBar: AppBar(title: const Text('Kalkuláció')),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, MpSpace.x10),
            children: [
              QuotedNotice(project: pc.project),
              const SectionLabel('Kedvezmény / felár'),
              _AdjustmentEditor(key: ValueKey(pc.project.id), project: pc.project),
              const SectionLabel('ÁFA'),
              _VatEditor(project: pc.project),
              const SectionLabel('Ajánlat érvényessége'),
              _ValidityEditor(project: pc.project),
              const SectionLabel('Összesítés'),
              AsyncView(value: totals, data: (t) => _Breakdown(totals: t)),
              const SizedBox(height: MpSpace.x6),
              MpButton(
                label: 'Árajánlat előnézet',
                icon: Icons.description_outlined,
                expand: true,
                onPressed: () => context.pushReplacement(Routes.quote(projectId)),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _AdjustmentEditor extends ConsumerStatefulWidget {
  const _AdjustmentEditor({super.key, required this.project});
  final Project project;

  @override
  ConsumerState<_AdjustmentEditor> createState() => _AdjustmentEditorState();
}

class _AdjustmentEditorState extends ConsumerState<_AdjustmentEditor> {
  late AdjustmentType _type = widget.project.adjustmentType;
  late final _percent = TextEditingController(
    text: widget.project.adjustmentPercentBp == 0 ? '' : Fmt.percentInput(widget.project.adjustmentPercentBp),
  );
  late final ProjectRepository _repo;
  String? _error;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _repo = ref.read(projectRepoProvider);
  }

  @override
  void dispose() {
    // Képernyő elhagyásakor a még nem mentett százalékot azonnal mentjük.
    if (_debounce?.isActive ?? false) {
      _debounce!.cancel();
      final bp = _parsed();
      // Dispose-ból nem tudunk üzenetet mutatni: a hibát elnyeljük és naplózzuk,
      // hogy ne legyen kezeletlen aszinkron kivétel.
      if (bp != null) {
        _repo.setAdjustment(widget.project.id, _type, bp).catchError((Object e) => debugPrint('Mester+ mentés: $e'));
      }
    }
    _percent.dispose();
    super.dispose();
  }

  /// Az érvényes bázispont, vagy null ha a bevitel hibás.
  int? _parsed() {
    if (_type == AdjustmentType.none) return 0;
    final v = _percent.text.trim().isEmpty ? 0 : Fmt.parsePercentBp(_percent.text);
    return (v == null || v > 10000) ? null : v;
  }

  Future<void> _persist() async {
    final bp = _parsed();
    if (bp == null) {
      setState(() => _error = '0 és 100 közötti szám, max. 2 tizedes');
      return;
    }
    setState(() => _error = null);
    await runGuarded(context, () => _repo.setAdjustment(widget.project.id, _type, bp));
  }

  void _changeType(AdjustmentType t) {
    _debounce?.cancel();
    setState(() {
      _type = t;
      // "Nincs"-re váltáskor a mezőt is ürítjük — így visszaváltáskor nem
      // éled fel csendben a korábbi százalék (az adatbázisban is 0 lesz).
      if (t == AdjustmentType.none) _percent.clear();
    });
    _persist();
  }

  void _onPercentChanged() {
    _debounce?.cancel();
    final ok = _parsed() != null;
    setState(() => _error = ok ? null : '0 és 100 közötti szám, max. 2 tizedes');
    if (ok) _debounce = Timer(const Duration(milliseconds: 600), _persist);
  }

  @override
  Widget build(BuildContext context) {
    return MpCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SegmentedButton<AdjustmentType>(
            segments: [
              for (final t in AdjustmentType.values)
                ButtonSegment(
                  value: t,
                  // Keskeny telefonon (320–360 dp) se törjön a felirat.
                  label: FittedBox(fit: BoxFit.scaleDown, child: Text(t.label, maxLines: 1)),
                ),
            ],
            selected: {_type},
            showSelectedIcon: false,
            onSelectionChanged: (s) => _changeType(s.first),
          ),
          if (_type != AdjustmentType.none) ...[
            const SizedBox(height: MpSpace.x4),
            MpField(
              label: _type == AdjustmentType.discount ? 'Kedvezmény mértéke' : 'Felár mértéke',
              controller: _percent,
              suffixText: '%',
              hint: '0',
              keyboardType: decimalKeyboard,
              inputFormatters: decimalInputFormatters,
              monospace: true,
              textInputAction: TextInputAction.done,
              onChanged: (_) => _onPercentChanged(),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: MpSpace.x2),
                child: Text(_error!, style: MpText.small.copyWith(color: MpColors.danger)),
              ),
            Text(
              'A nettó részösszegre vonatkozik, az ÁFA előtt. Automatikusan mentődik.',
              style: MpText.small.copyWith(fontSize: 12),
            ),
          ],
        ],
      ),
    );
  }
}

class _VatEditor extends ConsumerWidget {
  const _VatEditor({required this.project});
  final Project project;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final options = {...VatRates.presets, project.vatRateBp}.toList()..sort((a, b) => b.compareTo(a));
    return MpCard(
      padding: const EdgeInsets.symmetric(vertical: MpSpace.x2),
      child: Column(
        children: [
          for (final bp in options)
            ListTile(
              onTap: bp == project.vatRateBp
                  ? null
                  : () => runGuarded(context, () => ref.read(projectRepoProvider).setVatRate(project.id, bp)),
              leading: Icon(
                bp == project.vatRateBp ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                color: bp == project.vatRateBp ? MpColors.brand : MpColors.inkFaint,
              ),
              title: Text(VatRates.label(bp), style: MpText.bodyStrong),
              subtitle: bp == VatRates.exempt
                  ? const Text('Alanyi adómentes, vagy fordított adózás (pl. építési szolgáltatás cégnek)',
                      style: MpText.small)
                  : bp == VatRates.reduced5
                      ? const Text('Csak a jogszabályban meghatározott esetekben', style: MpText.small)
                      : null,
            ),
        ],
      ),
    );
  }
}

class _ValidityEditor extends ConsumerWidget {
  const _ValidityEditor({required this.project});
  final Project project;

  static const _options = [15, 30, 60, 90];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final options = {..._options, project.validityDays}.toList()..sort();
    return MpCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: MpSpace.x2,
            runSpacing: MpSpace.x2,
            children: [
              for (final d in options)
                ChoiceChip(
                  label: Text('$d nap'),
                  selected: project.validityDays == d,
                  showCheckmark: false,
                  selectedColor: MpColors.brand,
                  labelStyle: MpText.small.copyWith(
                    fontWeight: FontWeight.w600,
                    color: project.validityDays == d ? MpColors.onBrand : MpColors.inkSoft,
                  ),
                  onSelected: (_) =>
                      runGuarded(context, () => ref.read(projectRepoProvider).setValidityDays(project.id, d)),
                ),
            ],
          ),
          const SizedBox(height: MpSpace.x2),
          Text(
            'Ennyi ideig tartod az árat a kiállítás napjától számítva.',
            style: MpText.small.copyWith(fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _Breakdown extends StatelessWidget {
  const _Breakdown({required this.totals});
  final QuoteTotals totals;

  @override
  Widget build(BuildContext context) {
    final t = totals;
    return MpCard(
      padding: const EdgeInsets.all(MpSpace.x5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          KeyValueRow(label: 'Munkadíj', value: MoneyText(t.laborSubtotalHuf)),
          KeyValueRow(label: 'Anyagköltség', value: MoneyText(t.materialSubtotalHuf)),
          const Divider(height: MpSpace.x5),
          KeyValueRow(label: 'Részösszeg', value: MoneyText(t.subtotalHuf), emphasize: true),
          if (t.adjustmentType != AdjustmentType.none)
            KeyValueRow(
              label: '${t.adjustmentType.label} (${Fmt.percentBp(t.adjustmentPercentBp)})',
              value: MoneyText(
                t.adjustmentHuf,
                signed: true,
                color: t.adjustmentHuf < 0 ? MpColors.success : MpColors.warning,
              ),
            ),
          KeyValueRow(label: 'Nettó összesen', value: MoneyText(t.netTotalHuf), emphasize: true),
          KeyValueRow(label: 'ÁFA (${Fmt.percentBp(t.vatRateBp)})', value: MoneyText(t.vatHuf)),
          const Divider(height: MpSpace.x5),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Expanded(child: Text('Bruttó végösszeg', style: MpText.heading)),
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerRight,
                  child: MoneyText(t.grossTotalHuf, style: MpText.moneyLarge.copyWith(fontSize: 20)),
                ),
              ),
            ],
          ),
          if (t.unpricedLineCount > 0) ...[
            const SizedBox(height: MpSpace.x4),
            Pill(
              '${t.unpricedLineCount} tétel ár nélkül szerepel',
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
