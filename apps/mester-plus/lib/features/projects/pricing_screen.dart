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
import '../../domain/format.dart';
import '../../domain/quote_calculator.dart';
import 'project_hub_screen.dart';

/// Saját árazás: soronként munkadíj + anyagár egységre vetítve.
/// Az árakat a szaki adja meg — az app semmilyen "piaci árat" nem javasol.
class PricingScreen extends ConsumerWidget {
  const PricingScreen({super.key, required this.projectId});
  final int projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final project = ref.watch(projectProvider(projectId));
    if (project.hasValue && project.value == null) return const ProjectNotFound();
    final lines = ref.watch(quoteLinesProvider(projectId));
    final priceItemsAsync = ref.watch(priceItemsProvider);
    final priceItems = {for (final i in priceItemsAsync.valueOrNull ?? const <PriceItem>[]) i.id: i};
    final totals = ref.watch(projectTotalsProvider(projectId)).valueOrNull;

    return Scaffold(
      appBar: AppBar(title: const Text('Saját árazás')),
      bottomNavigationBar: totals == null
          ? null
          : _SubtotalBar(
              subtotalHuf: totals.subtotalHuf,
              unpriced: totals.unpricedLineCount,
              onNext: () => context.pushReplacement(Routes.calculation(projectId)),
            ),
      // Az árlistát is megvárjuk: a szerkesztők alapértéke ettől függ.
      body: AsyncView(
        value: priceItemsAsync.hasValue ? lines : const AsyncLoading<List<QuoteLine>>(),
        data: (list) {
          if (list.isEmpty) {
            return EmptyState(
              icon: Icons.sell_outlined,
              title: 'Nincs mit árazni',
              message: 'Előbb vegyél fel munkatételeket.',
              action: MpButton(
                label: 'Munkatételek',
                onPressed: () => context.pushReplacement(Routes.items(projectId)),
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, MpSpace.x8),
            itemCount: list.length + 1,
            separatorBuilder: (_, _) => const SizedBox(height: MpSpace.x3),
            itemBuilder: (_, i) {
              if (i == 0) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (project.valueOrNull != null) QuotedNotice(project: project.value!.project),
                    const Text(
                      'Add meg a saját egységáraidat nettóban. Az ÁFA és a kedvezmény a kalkulációban kerül rá. '
                      'A beírt ár automatikusan mentődik.',
                      style: MpText.body,
                    ),
                  ],
                );
              }
              final l = list[i - 1];
              final item = l.priceItemId == null ? null : priceItems[l.priceItemId];
              return _PriceEditor(
                key: ValueKey(l.id),
                line: l,
                // Ha az árlista-tételnek még nincs ára, az első árazás töltse fel;
                // ha már van, egy egyedi (pl. alkudott) ár NE írja felül alapból.
                defaultUpdateList: item != null && item.laborUnitPriceHuf == 0 && item.materialUnitPriceHuf == 0,
              );
            },
          );
        },
      ),
    );
  }
}

class _PriceEditor extends ConsumerStatefulWidget {
  const _PriceEditor({super.key, required this.line, required this.defaultUpdateList});
  final QuoteLine line;
  final bool defaultUpdateList;

  @override
  ConsumerState<_PriceEditor> createState() => _PriceEditorState();
}

class _PriceEditorState extends ConsumerState<_PriceEditor> {
  late final _labor = TextEditingController(text: Fmt.hufInput(widget.line.laborUnitPriceHuf));
  late final _material = TextEditingController(text: Fmt.hufInput(widget.line.materialUnitPriceHuf));
  // Az alapértéket csak egyszer, létrehozáskor vesszük át: az első mentés után
  // az árlista-tételnek már lesz ára, de a folyamatban lévő szerkesztés közben
  // nem szabad csendben átváltani.
  late bool _updateList = widget.defaultUpdateList;
  bool _saving = false;
  String? _error;
  Timer? _debounce;

  // Dispose közben a ref már nem használható, ezért a repót előre elkérjük.
  late final QuoteLineRepository _repo;

  @override
  void initState() {
    super.initState();
    _repo = ref.read(quoteLineRepoProvider);
  }

  @override
  void dispose() {
    // Elhagyáskor a függő módosítást azonnal mentjük — nincs adatvesztés.
    if (_debounce?.isActive ?? false) {
      _debounce!.cancel();
      _flush().catchError((Object e) => debugPrint('Mester+ mentés: $e'));
    }
    _labor.dispose();
    _material.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant _PriceEditor old) {
    super.didUpdateWidget(old);
    // Külső változás (pl. másik sor frissítette az árlistát, vagy mentésünk
    // visszaért): csak akkor írjuk felül a mezőt, ha nincs függő helyi szerkesztés.
    final pending = _debounce?.isActive ?? false;
    if (!pending && !_saving) {
      if (_val(_labor) != widget.line.laborUnitPriceHuf) {
        _labor.text = Fmt.hufInput(widget.line.laborUnitPriceHuf);
      }
      if (_val(_material) != widget.line.materialUnitPriceHuf) {
        _material.text = Fmt.hufInput(widget.line.materialUnitPriceHuf);
      }
    }
  }

  int? _val(TextEditingController c) => c.text.trim().isEmpty ? 0 : Fmt.parseHuf(c.text);

  bool get _dirty =>
      _val(_labor) != widget.line.laborUnitPriceHuf || _val(_material) != widget.line.materialUnitPriceHuf;

  void _onChanged() {
    final valid = _val(_labor) != null && _val(_material) != null;
    setState(() => _error = valid ? null : 'Csak egész forint adható meg (max. 99 999 999).');
    _debounce?.cancel();
    if (valid && _dirty) _debounce = Timer(const Duration(milliseconds: 700), _save);
  }

  /// Mentés widget-állapot nélkül (dispose közben is hívható).
  Future<void> _flush() {
    final labor = _val(_labor);
    final material = _val(_material);
    if (labor == null || material == null || !_dirty) return Future.value();
    return _repo.setPrices(
          widget.line,
          laborUnitPriceHuf: labor,
          materialUnitPriceHuf: material,
          alsoUpdatePriceList: _updateList,
        );
  }

  Future<void> _save() async {
    if (!mounted || !_dirty) return;
    setState(() => _saving = true);
    await runGuarded(context, _flush);
    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    final l = widget.line;
    final labor = _val(_labor) ?? 0;
    final material = _val(_material) ?? 0;
    final preview = QuoteCalculator.line(CalcLine(
      quantityMilli: l.quantityMilli,
      laborUnitPriceHuf: labor,
      materialUnitPriceHuf: material,
    ));
    final unpriced = l.laborUnitPriceHuf == 0 && l.materialUnitPriceHuf == 0;
    final pending = _saving || (_debounce?.isActive ?? false);

    return MpCard(
      borderColor: unpriced ? MpColors.warning.withValues(alpha: 0.5) : MpColors.line,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: Text(l.name, style: MpText.bodyStrong)),
              const SizedBox(width: MpSpace.x2),
              Text('${Fmt.quantity(l.quantityMilli)} ${l.unit.symbol}', style: MpText.mono),
            ],
          ),
          const SizedBox(height: MpSpace.x3),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: MpField(
                  label: 'Munkadíj / ${l.unit.symbol}',
                  controller: _labor,
                  suffixText: 'Ft',
                  hint: '0',
                  keyboardType: integerKeyboard,
                  inputFormatters: hufInputFormatters,
                  monospace: true,
                  onChanged: (_) => _onChanged(),
                ),
              ),
              const SizedBox(width: MpSpace.x3),
              Expanded(
                child: MpField(
                  label: 'Anyag / ${l.unit.symbol}',
                  controller: _material,
                  suffixText: 'Ft',
                  hint: '0',
                  keyboardType: integerKeyboard,
                  inputFormatters: hufInputFormatters,
                  monospace: true,
                  onChanged: (_) => _onChanged(),
                ),
              ),
            ],
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: MpSpace.x2),
              child: Text(_error!, style: MpText.small.copyWith(color: MpColors.danger)),
            ),
          Row(
            children: [
              const Text('Sor összesen ', style: MpText.small),
              Flexible(child: MoneyText(preview.totalHuf, style: MpText.money.copyWith(fontWeight: FontWeight.w600))),
              const Spacer(),
              if (pending)
                const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
              else if (_error == null && !unpriced)
                const Icon(Icons.check_circle, color: MpColors.success, size: 20),
            ],
          ),
          if (l.priceItemId != null)
            CheckboxListTile(
              value: _updateList,
              onChanged: (v) => setState(() => _updateList = v ?? false),
              dense: true,
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: const Text('Az árlistámban is ez legyen az ár (a jövőbeli ajánlatokhoz)', style: MpText.small),
            ),
        ],
      ),
    );
  }
}

class _SubtotalBar extends StatelessWidget {
  const _SubtotalBar({required this.subtotalHuf, required this.unpriced, required this.onNext});
  final int subtotalHuf;
  final int unpriced;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: MpColors.surface,
        border: Border(top: BorderSide(color: MpColors.line)),
      ),
      padding: EdgeInsets.fromLTRB(
        MpSpace.gutter,
        MpSpace.x3,
        MpSpace.gutter,
        MpSpace.x3 + MediaQuery.paddingOf(context).bottom,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(unpriced == 0 ? 'Nettó részösszeg' : '$unpriced tétel ár nélkül',
                    style: MpText.small.copyWith(color: unpriced == 0 ? MpColors.inkMuted : MpColors.warning)),
                MoneyText(subtotalHuf, style: MpText.money.copyWith(fontSize: 16, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          MpButton(label: 'Kalkuláció', icon: Icons.arrow_forward, onPressed: onNext),
        ],
      ),
    );
  }
}
