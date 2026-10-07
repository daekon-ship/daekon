import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/forms.dart';
import '../../core/widgets/widgets.dart';
import '../../data/db/app_database.dart';
import '../../data/providers.dart';
import '../../domain/enums.dart';
import '../../domain/format.dart';

class PriceItemFormScreen extends ConsumerStatefulWidget {
  const PriceItemFormScreen({super.key, this.priceItemId});
  final int? priceItemId;

  @override
  ConsumerState<PriceItemFormScreen> createState() => _PriceItemFormScreenState();
}

class _PriceItemFormScreenState extends ConsumerState<PriceItemFormScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _labor = TextEditingController();
  final _material = TextEditingController();
  final _notes = TextEditingController();
  WorkUnit _unit = WorkUnit.m2;
  TradeCategory _category = TradeCategory.burkolas;
  bool _loaded = false;
  bool _saving = false;
  bool _dirty = false;

  bool get _isEdit => widget.priceItemId != null;

  @override
  void dispose() {
    for (final c in [_name, _labor, _material, _notes]) {
      c.dispose();
    }
    super.dispose();
  }

  void _fill(PriceItem p) {
    _name.text = p.name;
    _labor.text = Fmt.hufInput(p.laborUnitPriceHuf);
    _material.text = Fmt.hufInput(p.materialUnitPriceHuf);
    _notes.text = p.notes ?? '';
    _unit = p.unit;
    _category = p.category;
    _loaded = true;
  }

  String? _hufValidator(String? v) {
    if (v == null || v.trim().isEmpty) return null;
    return Fmt.parseHuf(v) == null ? 'Egész forint, max. 99 999 999' : null;
  }

  int _huf(TextEditingController c) => c.text.trim().isEmpty ? 0 : Fmt.parseHuf(c.text)!;

  Future<void> _save() async {
    if (_saving || !_form.currentState!.validate()) return;
    setState(() => _saving = true);
    final repo = ref.read(priceListRepoProvider);
    final ok = await runGuarded(context, () async {
      if (_isEdit) {
        await repo.update(
          widget.priceItemId!,
          name: _name.text,
          unit: _unit,
          category: _category,
          laborUnitPriceHuf: _huf(_labor),
          materialUnitPriceHuf: _huf(_material),
          notes: _notes.text,
        );
      } else {
        await repo.create(
          name: _name.text,
          unit: _unit,
          category: _category,
          laborUnitPriceHuf: _huf(_labor),
          materialUnitPriceHuf: _huf(_material),
          notes: _notes.text,
        );
      }
    });
    if (!mounted) return;
    if (ok) {
      context.pop();
    } else {
      setState(() => _saving = false);
    }
  }

  Future<void> _archive() async {
    final ok = await confirmDialog(
      context,
      title: 'Tétel eltávolítása?',
      message: 'A tétel kikerül az árlistából. A már elkészült ajánlatokban változatlanul megmarad.',
      confirmLabel: 'Eltávolítás',
    );
    if (!ok || !mounted) return;
    final done = await runGuarded(context, () => ref.read(priceListRepoProvider).archive(widget.priceItemId!));
    if (done && mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    if (_isEdit && !_loaded) {
      final p = ref.watch(priceListItemProvider(widget.priceItemId!));
      if (p.isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator(strokeWidth: 2.4)));
      final value = p.valueOrNull;
      if (value == null) {
        return Scaffold(
          appBar: AppBar(),
          body: const EmptyState(icon: Icons.search_off, title: 'A tétel nem található', message: 'Lehet, hogy közben eltávolítottad.'),
        );
      }
      _fill(value);
    }

    return UnsavedGuard(
      dirty: _dirty && !_saving,
      child: Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'Árlista-tétel' : 'Új árlista-tétel'),
        actions: [
          if (_isEdit) IconButton(tooltip: 'Eltávolítás', icon: const Icon(Icons.delete_outline), onPressed: _archive),
        ],
      ),
      body: Form(
        key: _form,
        onChanged: () {
          if (!_dirty) setState(() => _dirty = true);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, MpSpace.x10),
          children: [
            MpField(label: 'Megnevezés *', controller: _name, validator: requiredText, autofocus: !_isEdit, maxLength: 200),
            Text('Kategória', style: MpText.small.copyWith(color: MpColors.inkSoft, fontWeight: FontWeight.w500)),
            const SizedBox(height: 6),
            Wrap(
              spacing: MpSpace.x2,
              runSpacing: MpSpace.x2,
              children: [
                for (final c in TradeCategory.values)
                  ChoiceChip(
                    label: Text(c.label),
                    selected: _category == c,
                    showCheckmark: false,
                    selectedColor: MpColors.brand,
                    labelStyle: MpText.small.copyWith(
                      fontWeight: FontWeight.w600,
                      color: _category == c ? MpColors.onBrand : MpColors.inkSoft,
                    ),
                    onSelected: (_) => setState(() {
                      _category = c;
                      _dirty = true;
                    }),
                  ),
              ],
            ),
            const SizedBox(height: MpSpace.x4),
            Text('Mértékegység', style: MpText.small.copyWith(color: MpColors.inkSoft, fontWeight: FontWeight.w500)),
            const SizedBox(height: 6),
            Wrap(
              spacing: MpSpace.x2,
              runSpacing: MpSpace.x2,
              children: [
                for (final u in WorkUnit.values)
                  ChoiceChip(
                    label: Text(u.symbol),
                    selected: _unit == u,
                    showCheckmark: false,
                    selectedColor: MpColors.brand,
                    labelStyle: MpText.small.copyWith(
                      fontWeight: FontWeight.w600,
                      color: _unit == u ? MpColors.onBrand : MpColors.inkSoft,
                    ),
                    onSelected: (_) => setState(() {
                      _unit = u;
                      _dirty = true;
                    }),
                  ),
              ],
            ),
            const SizedBox(height: MpSpace.x5),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: MpField(
                    label: 'Munkadíj / ${_unit.symbol}',
                    controller: _labor,
                    suffixText: 'Ft',
                    hint: '0',
                    keyboardType: integerKeyboard,
                    inputFormatters: hufInputFormatters,
                    validator: _hufValidator,
                    monospace: true,
                  ),
                ),
                const SizedBox(width: MpSpace.x3),
                Expanded(
                  child: MpField(
                    label: 'Anyag / ${_unit.symbol}',
                    controller: _material,
                    suffixText: 'Ft',
                    hint: '0',
                    keyboardType: integerKeyboard,
                    inputFormatters: hufInputFormatters,
                    validator: _hufValidator,
                    monospace: true,
                  ),
                ),
              ],
            ),
            Text(
              'Nettó egységárak. Az új ajánlatok ezt az árat kapják; a már meglévő ajánlatok nem változnak.',
              style: MpText.small.copyWith(fontSize: 12),
            ),
            const SizedBox(height: MpSpace.x4),
            MpField(label: 'Megjegyzés', controller: _notes, maxLines: 2),
            MpButton(label: 'Mentés', onPressed: _save, loading: _saving, expand: true),
          ],
        ),
      ),
    ),
    );
  }
}
