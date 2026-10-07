import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/forms.dart';
import '../../core/widgets/widgets.dart';
import '../../data/db/app_database.dart';
import '../../data/providers.dart';
import '../../domain/format.dart';
import '../../domain/project_finance.dart';
import 'project_hub_screen.dart';
import 'survey_screen.dart';

/// Anyaglista: mit kell megvenni, mi van már meg. Csempekalkulátorral.
class MaterialsScreen extends ConsumerWidget {
  const MaterialsScreen({super.key, required this.projectId});
  final int projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final project = ref.watch(projectProvider(projectId));
    if (project.hasValue && project.value == null) return const ProjectNotFound();
    final items = ref.watch(materialItemsProvider(projectId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Anyaglista'),
        actions: [
          IconButton(
            tooltip: 'Csempekalkulátor',
            icon: const Icon(Icons.grid_on_outlined),
            onPressed: () => _tileCalculator(context, ref),
          ),
          IconButton(
            tooltip: 'Lista másolása',
            icon: const Icon(Icons.copy_all_outlined),
            onPressed: () async {
              final list = items.valueOrNull ?? const <MaterialItem>[];
              final text = [
                for (final m in list.where((m) => !m.purchased)) '• ${m.name}: ${Fmt.quantity(m.quantityMilli)} ${m.unit}',
              ].join('\n');
              await Clipboard.setData(ClipboardData(text: text.isEmpty ? 'Minden megvan.' : text));
              if (context.mounted) showInfo(context, 'Bevásárlólista a vágólapon');
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _addItem(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Anyag', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
      body: AsyncView(
        value: items,
        data: (list) {
          if (list.isEmpty) {
            return EmptyState(
              icon: Icons.shopping_bag_outlined,
              title: 'Üres az anyaglista',
              message: 'Írd fel, mit kell venni. A csempekalkulátor a felmérésből számolja a dobozokat.',
              action: MpButton.secondary(
                label: 'Csempekalkulátor',
                icon: Icons.grid_on_outlined,
                onPressed: () => _tileCalculator(context, ref),
              ),
            );
          }
          final left = list.where((m) => !m.purchased).length;
          return ListView(
            padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, 96),
            children: [
              Text(left == 0 ? 'Minden megvan.' : 'Még $left tételt kell megvenni.', style: MpText.small),
              const SizedBox(height: MpSpace.x3),
              MpCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    for (var i = 0; i < list.length; i++) ...[
                      if (i > 0) const Divider(),
                      CheckboxListTile(
                        value: list[i].purchased,
                        onChanged: (v) => runGuarded(
                          context,
                          () => ref.read(materialRepoProvider).setPurchased(list[i], v ?? false),
                        ),
                        controlAffinity: ListTileControlAffinity.leading,
                        title: Text(
                          list[i].name,
                          style: MpText.bodyStrong.copyWith(
                            decoration: list[i].purchased ? TextDecoration.lineThrough : null,
                            color: list[i].purchased ? MpColors.inkMuted : MpColors.ink,
                          ),
                        ),
                        subtitle: Text(
                          '${Fmt.quantity(list[i].quantityMilli)} ${list[i].unit}'
                          '${list[i].note == null ? '' : ' · ${list[i].note}'}',
                          style: MpText.small,
                        ),
                        secondary: IconButton(
                          tooltip: 'Törlés',
                          icon: const Icon(Icons.delete_outline, size: 20, color: MpColors.inkFaint),
                          onPressed: () => runGuarded(context, () => ref.read(materialRepoProvider).delete(list[i])),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _addItem(BuildContext context, WidgetRef ref, {String? name, int? quantityMilli, String? unit}) async {
    final nameCtl = TextEditingController(text: name ?? '');
    final qtyCtl = TextEditingController(text: quantityMilli == null ? '' : Fmt.quantityInput(quantityMilli));
    final unitCtl = TextEditingController(text: unit ?? 'db');
    final note = TextEditingController();
    final form = GlobalKey<FormState>();
    final repo = ref.read(materialRepoProvider);
    await showMpSheet<void>(
      context,
      title: 'Anyag felvétele',
      child: Form(
        key: form,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            MpField(label: 'Megnevezés *', controller: nameCtl, validator: requiredText, maxLength: 200, autofocus: name == null),
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: MpField(
                    label: 'Mennyiség *',
                    controller: qtyCtl,
                    keyboardType: decimalKeyboard,
                    inputFormatters: decimalInputFormatters,
                    monospace: true,
                    validator: (v) => (Fmt.parseQuantityMilli(v ?? '') ?? 0) > 0 ? null : 'Adj meg mennyiséget',
                  ),
                ),
                const SizedBox(width: MpSpace.x2),
                Expanded(
                  child: MpField(
                    label: 'Egység *',
                    controller: unitCtl,
                    hint: 'db, zsák, m²',
                    maxLength: 20,
                    validator: requiredText,
                    textCapitalization: TextCapitalization.none,
                  ),
                ),
              ],
            ),
            MpField(label: 'Megjegyzés', controller: note, hint: 'pl. típus, szín, bolt', maxLength: 200),
            Builder(
              builder: (ctx) => MpButton(
                label: 'Mentés',
                expand: true,
                onPressed: () async {
                  if (!form.currentState!.validate()) return;
                  final ok = await runGuarded(
                    ctx,
                    () => repo.add(
                      projectId: projectId,
                      name: nameCtl.text,
                      quantityMilli: Fmt.parseQuantityMilli(qtyCtl.text)!,
                      unit: unitCtl.text,
                      note: note.text,
                    ),
                  );
                  if (ok && ctx.mounted) Navigator.of(ctx).pop();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Csempekalkulátor: felület (a felmérésből átvehető) + doboz + ráhagyás → dobozszám.
  Future<void> _tileCalculator(BuildContext context, WidgetRef ref) async {
    final areas = ref.read(surveyAreasProvider(projectId)).valueOrNull ?? const <SurveyArea>[];
    final areaCtl = TextEditingController();
    final boxCtl = TextEditingController(text: '1,44');
    final wasteCtl = TextEditingController(text: '10');
    await showMpSheet<void>(
      context,
      title: 'Csempekalkulátor',
      child: StatefulBuilder(
        builder: (ctx, setLocal) {
          final area = Fmt.parseQuantityMilli(areaCtl.text) ?? 0;
          final box = Fmt.parseQuantityMilli(boxCtl.text) ?? 0;
          final waste = Fmt.parsePercentBp(wasteCtl.text) ?? 0;
          final calc = TileCalc(areaMilliM2: area, boxMilliM2: box, wasteBp: waste);
          final valid = area > 0 && box > 0 && waste <= 10000;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (areas.isNotEmpty) ...[
                Text('Felület a felmérésből', style: MpText.small.copyWith(color: MpColors.inkSoft, fontWeight: FontWeight.w500)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: MpSpace.x2,
                  runSpacing: MpSpace.x2,
                  children: [
                    for (final a in areas)
                      for (final (label, milli) in [
                        ('${a.name} padló', measurementsOf(a).floorMilliM2),
                        ('${a.name} fal', measurementsOf(a).wallMilliM2),
                      ])
                        if (milli != null && milli > 0)
                          ActionChip(
                            label: Text('$label ${Fmt.quantity(milli)} m²'),
                            onPressed: () => setLocal(() => areaCtl.text = Fmt.quantityInput(milli)),
                          ),
                  ],
                ),
                const SizedBox(height: MpSpace.x4),
              ],
              MpField(
                label: 'Burkolandó felület',
                controller: areaCtl,
                suffixText: 'm²',
                keyboardType: decimalKeyboard,
                inputFormatters: decimalInputFormatters,
                monospace: true,
                autofocus: areas.isEmpty,
                onChanged: (_) => setLocal(() {}),
              ),
              Row(
                children: [
                  Expanded(
                    child: MpField(
                      label: 'Egy doboz',
                      controller: boxCtl,
                      suffixText: 'm²',
                      keyboardType: decimalKeyboard,
                      inputFormatters: decimalInputFormatters,
                      monospace: true,
                      helper: 'A dobozon írva',
                      onChanged: (_) => setLocal(() {}),
                    ),
                  ),
                  const SizedBox(width: MpSpace.x3),
                  Expanded(
                    child: MpField(
                      label: 'Ráhagyás',
                      controller: wasteCtl,
                      suffixText: '%',
                      keyboardType: decimalKeyboard,
                      inputFormatters: decimalInputFormatters,
                      monospace: true,
                      helper: 'Egyenes 5–10, átlós 15',
                      onChanged: (_) => setLocal(() {}),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(MpSpace.x4),
                decoration: const BoxDecoration(color: MpColors.surfaceSunken, borderRadius: MpRadius.mdAll),
                child: valid
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${calc.boxes} doboz', style: MpText.moneyLarge),
                          const SizedBox(height: 4),
                          Text(
                            'Ráhagyással ${Fmt.quantity(calc.neededMilliM2)} m² kell, a dobozokban ${Fmt.quantity(calc.purchasedMilliM2)} m² lesz.',
                            style: MpText.small,
                          ),
                        ],
                      )
                    : const Text('Add meg a felületet és a doboz méretét.', style: MpText.small),
              ),
              const SizedBox(height: MpSpace.x4),
              MpButton(
                label: 'Felvétel az anyaglistára',
                icon: Icons.add,
                expand: true,
                onPressed: valid
                    ? () {
                        Navigator.of(ctx).pop();
                        _addItem(context, ref, name: 'Burkolólap', quantityMilli: calc.boxes * 1000, unit: 'doboz');
                      }
                    : null,
              ),
            ],
          );
        },
      ),
    );
  }
}
