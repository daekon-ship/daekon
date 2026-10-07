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
import '../../domain/enums.dart';
import '../../domain/format.dart';
import '../../domain/quote_calculator.dart';
import 'project_hub_screen.dart';
import 'survey_screen.dart';

class WorkItemsScreen extends ConsumerWidget {
  const WorkItemsScreen({super.key, required this.projectId});
  final int projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final project = ref.watch(projectProvider(projectId));
    if (project.hasValue && project.value == null) return const ProjectNotFound();
    final lines = ref.watch(quoteLinesProvider(projectId));
    final areas = ref.watch(surveyAreasProvider(projectId)).valueOrNull ?? const <SurveyArea>[];
    final areaNames = {for (final a in areas) a.id: a.name};

    return Scaffold(
      appBar: AppBar(title: const Text('Munkatételek')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _addFlow(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Tétel', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
      body: AsyncView(
        value: lines,
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(
              icon: Icons.format_list_bulleted_add,
              title: 'Még nincs munkatétel',
              message: 'Válassz az árlistádból, vagy vegyél fel egyedi tételt. '
                  'A mennyiséget a felmérésből egy érintéssel átveheted.',
            );
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, 96),
            children: [
              if (project.valueOrNull != null) QuotedNotice(project: project.value!.project),
              for (final l in list) ...[
                _LineCard(line: l, areaName: areaNames[l.areaId]),
                const SizedBox(height: MpSpace.x3),
              ],
              const SizedBox(height: MpSpace.x2),
              MpButton.secondary(
                label: 'Tovább az árazáshoz',
                icon: Icons.arrow_forward,
                expand: true,
                onPressed: () => context.pushReplacement(Routes.pricing(projectId)),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _addFlow(BuildContext context, WidgetRef ref) async {
    final choice = await showModalBottomSheet<_PickResult>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => const _PriceItemPicker(),
    );
    if (choice == null || !context.mounted) return;
    await showLineForm(context, ref, projectId: projectId, fromPriceItem: choice.item);
  }
}

class _LineCard extends ConsumerWidget {
  const _LineCard({required this.line, required this.areaName});
  final QuoteLine line;
  final String? areaName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final calc = CalcLine(
      quantityMilli: line.quantityMilli,
      laborUnitPriceHuf: line.laborUnitPriceHuf,
      materialUnitPriceHuf: line.materialUnitPriceHuf,
    );
    final total = QuoteCalculator.line(calc).totalHuf;
    return MpCard(
      onTap: () => showLineForm(context, ref, projectId: line.projectId, existing: line),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(line.name, style: MpText.bodyStrong),
                const SizedBox(height: 2),
                Text(
                  '${Fmt.quantity(line.quantityMilli)} ${line.unit.symbol}'
                  '${areaName == null ? '' : ' · $areaName'}',
                  style: MpText.mono,
                ),
              ],
            ),
          ),
          const SizedBox(width: MpSpace.x3),
          if (calc.isUnpriced)
            const Pill('Nincs ár', bg: MpColors.warningSoft, fg: MpColors.warning)
          else
            MoneyText(total),
        ],
      ),
    );
  }
}

// ── Árlista-választó ────────────────────────────────────────────────────────

class _PickResult {
  const _PickResult(this.item);

  /// null = egyedi tétel
  final PriceItem? item;
}

class _PriceItemPicker extends ConsumerStatefulWidget {
  const _PriceItemPicker();

  @override
  ConsumerState<_PriceItemPicker> createState() => _PriceItemPickerState();
}

class _PriceItemPickerState extends ConsumerState<_PriceItemPicker> {
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = ref.watch(priceItemsProvider);
    final q = _search.text.trim().toLowerCase();
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.8,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: MpSpace.gutter),
            child: Row(
              children: [
                const Expanded(child: Text('Tétel hozzáadása', style: MpText.title)),
                TextButton.icon(
                  onPressed: () => Navigator.of(context).pop(const _PickResult(null)),
                  icon: const Icon(Icons.edit_note, size: 20),
                  label: const Text('Egyedi'),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x3, MpSpace.gutter, MpSpace.x2),
            child: TextField(
              controller: _search,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                hintText: 'Keresés az árlistában',
                prefixIcon: Icon(Icons.search, size: 20),
              ),
            ),
          ),
          Expanded(
            child: AsyncView(
              value: items,
              data: (all) {
                final list = all.where((i) => q.isEmpty || i.name.toLowerCase().contains(q)).toList();
                if (list.isEmpty) {
                  return const Center(child: Text('Nincs ilyen tétel. Vedd fel egyediként.', style: MpText.body));
                }
                return ListView.builder(
                  itemCount: list.length,
                  itemBuilder: (_, i) {
                    final it = list[i];
                    final showHeader = i == 0 || list[i - 1].category != it.category;
                    final priced = it.laborUnitPriceHuf > 0 || it.materialUnitPriceHuf > 0;
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (showHeader)
                          Padding(
                            padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x4, MpSpace.gutter, MpSpace.x1),
                            child: Text(it.category.label.toUpperCase(), style: MpText.label),
                          ),
                        ListTile(
                          onTap: () => Navigator.of(context).pop(_PickResult(it)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: MpSpace.gutter),
                          title: Text(it.name, style: MpText.bodyStrong),
                          subtitle: Text(
                            priced
                                ? '${Fmt.huf(it.laborUnitPriceHuf + it.materialUnitPriceHuf)} / ${it.unit.symbol}'
                                : 'Még nincs saját ár · ${it.unit.symbol}',
                            style: MpText.mono,
                          ),
                          trailing: const Icon(Icons.add_circle_outline, color: MpColors.brand),
                        ),
                      ],
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ── Tétel űrlap ─────────────────────────────────────────────────────────────

Future<void> showLineForm(
  BuildContext context,
  WidgetRef ref, {
  required int projectId,
  QuoteLine? existing,
  PriceItem? fromPriceItem,
}) async {
  final name = TextEditingController(text: existing?.name ?? fromPriceItem?.name ?? '');
  final qty = TextEditingController(text: existing == null ? '' : Fmt.quantityInput(existing.quantityMilli));
  var unit = existing?.unit ?? fromPriceItem?.unit ?? WorkUnit.m2;
  var areaId = existing?.areaId;
  final form = GlobalKey<FormState>();
  final areas = ref.read(surveyAreasProvider(projectId)).valueOrNull ?? const <SurveyArea>[];
  // A repót MOST kérjük el: a megnyitó listaelem (és vele a `ref`) a lap nyitva
  // tartása alatt újraépülhet vagy eltűnhet, és egy elhalt `ref` kivételt dobna.
  final repo = ref.read(quoteLineRepoProvider);

  await showMpSheet<void>(
    context,
    title: existing == null ? 'Új tétel' : 'Tétel szerkesztése',
    child: Form(
      key: form,
      child: StatefulBuilder(
        builder: (ctx, setLocal) {
          final area = areas.where((a) => a.id == areaId).firstOrNull;
          final m = area == null ? null : measurementsOf(area);
          final suggestions = <(String, int)>[
            if (m?.floorMilliM2 != null && unit == WorkUnit.m2) ('Padló', m!.floorMilliM2!),
            if (m?.wallMilliM2 != null && unit == WorkUnit.m2) ('Fal', m!.wallMilliM2!),
            if (m?.perimeterMilliM != null && unit == WorkUnit.fm) ('Kerület', m!.perimeterMilliM!),
          ];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              MpField(label: 'Megnevezés *', controller: name, validator: requiredText, maxLength: 200),
              Text('Mértékegység', style: MpText.small.copyWith(color: MpColors.inkSoft, fontWeight: FontWeight.w500)),
              const SizedBox(height: 6),
              Wrap(
                spacing: MpSpace.x2,
                runSpacing: MpSpace.x2,
                children: [
                  for (final u in WorkUnit.values)
                    ChoiceChip(
                      label: Text(u.symbol),
                      selected: unit == u,
                      showCheckmark: false,
                      selectedColor: MpColors.brand,
                      labelStyle: MpText.small.copyWith(
                        fontWeight: FontWeight.w600,
                        color: unit == u ? MpColors.onBrand : MpColors.inkSoft,
                      ),
                      onSelected: (_) => setLocal(() => unit = u),
                    ),
                ],
              ),
              const SizedBox(height: MpSpace.x4),
              if (areas.isNotEmpty) ...[
                Text('Helyiség', style: MpText.small.copyWith(color: MpColors.inkSoft, fontWeight: FontWeight.w500)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: MpSpace.x2,
                  runSpacing: MpSpace.x2,
                  children: [
                    for (final (id, label) in <(int?, String)>[(null, 'Általános'), for (final a in areas) (a.id, a.name)])
                      ChoiceChip(
                        label: Text(label),
                        selected: areaId == id,
                        showCheckmark: false,
                        selectedColor: MpColors.brand,
                        labelStyle: MpText.small.copyWith(
                          fontWeight: FontWeight.w600,
                          color: areaId == id ? MpColors.onBrand : MpColors.inkSoft,
                        ),
                        onSelected: (_) => setLocal(() => areaId = id),
                      ),
                  ],
                ),
                const SizedBox(height: MpSpace.x4),
              ],
              MpField(
                label: 'Mennyiség *',
                controller: qty,
                suffixText: unit.symbol,
                keyboardType: decimalKeyboard,
                inputFormatters: decimalInputFormatters,
                monospace: true,
                validator: (v) {
                  final q = Fmt.parseQuantityMilli(v ?? '');
                  if (q == null) return 'Adj meg mennyiséget (max. 3 tizedes)';
                  if (q <= 0) return 'Nagyobb legyen nullánál';
                  return null;
                },
              ),
              if (suggestions.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: MpSpace.x4),
                  child: Wrap(
                    spacing: MpSpace.x2,
                    children: [
                      for (final (label, value) in suggestions)
                        ActionChip(
                          avatar: const Icon(Icons.straighten, size: 16),
                          label: Text('$label: ${Fmt.quantity(value)} ${unit.symbol}'),
                          onPressed: () => setLocal(() => qty.text = Fmt.quantityInput(value)),
                        ),
                    ],
                  ),
                ),
              Row(
                children: [
                  if (existing != null) ...[
                    MpButton(
                      label: 'Törlés',
                      variant: MpButtonVariant.danger,
                      onPressed: () async {
                        final ok = await confirmDialog(ctx, title: 'Tétel törlése?', message: '„${existing.name}” kikerül az ajánlatból.');
                        if (!ok || !ctx.mounted) return;
                        final done = await runGuarded(ctx, () => repo.delete(existing));
                        if (done && ctx.mounted) Navigator.of(ctx).pop();
                      },
                    ),
                    const SizedBox(width: MpSpace.x3),
                  ],
                  Expanded(
                    child: MpButton(
                      label: 'Mentés',
                      expand: true,
                      onPressed: () async {
                        if (!form.currentState!.validate()) return;
                        final q = Fmt.parseQuantityMilli(qty.text)!;
                        final ok = await runGuarded(ctx, () async {
                          if (existing == null) {
                            await repo.add(
                              projectId: projectId,
                              priceItemId: fromPriceItem?.id,
                              areaId: areaId,
                              name: name.text,
                              unit: unit,
                              quantityMilli: q,
                              // Az árlista aktuális ára pillanatképként kerül a sorba.
                              laborUnitPriceHuf: fromPriceItem?.laborUnitPriceHuf ?? 0,
                              materialUnitPriceHuf: fromPriceItem?.materialUnitPriceHuf ?? 0,
                            );
                          } else {
                            await repo.update(existing, name: name.text, unit: unit, quantityMilli: q, areaId: areaId);
                          }
                        });
                        if (ok && ctx.mounted) Navigator.of(ctx).pop();
                      },
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    ),
  );
  // Vezérlők: a lap záró animációja miatt nem dispose-oljuk (lásd survey_screen.dart).
}
