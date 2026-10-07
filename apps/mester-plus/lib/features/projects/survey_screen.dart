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
import '../../domain/survey_geometry.dart';
import 'project_hub_screen.dart';

AreaMeasurements measurementsOf(SurveyArea a) => AreaMeasurements(
      lengthCm: a.lengthCm,
      widthCm: a.widthCm,
      heightCm: a.heightCm,
      openingsMilliM2: a.openingsMilliM2,
    );

class SurveyScreen extends ConsumerWidget {
  const SurveyScreen({super.key, required this.projectId});
  final int projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final project = ref.watch(projectProvider(projectId));
    if (project.hasValue && project.value == null) return const ProjectNotFound();
    final areas = ref.watch(surveyAreasProvider(projectId));

    return Scaffold(
      appBar: AppBar(title: const Text('Felmérés')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showAreaForm(context, ref, projectId: projectId),
        icon: const Icon(Icons.add),
        label: const Text('Helyiség', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
      body: AsyncView(
        value: areas,
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(
              icon: Icons.straighten,
              title: 'Mérd fel a helyszínt',
              message: 'Vedd fel a helyiségeket méretekkel (cm). A terület, kerület és falfelület '
                  'automatikusan számolódik, és munkatételhez mennyiségként használható.',
            );
          }
          var floor = 0;
          var wall = 0;
          for (final a in list) {
            final m = measurementsOf(a);
            floor += m.floorMilliM2 ?? 0;
            wall += m.wallMilliM2 ?? 0;
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, 96),
            children: [
              Row(
                children: [
                  Expanded(child: _Metric(label: 'Össz. alapterület', value: '${Fmt.quantity(floor)} m²')),
                  const SizedBox(width: MpSpace.x3),
                  Expanded(child: _Metric(label: 'Össz. falfelület', value: '${Fmt.quantity(wall)} m²')),
                ],
              ),
              const SectionLabel('Helyiségek'),
              for (final a in list) ...[
                _AreaCard(area: a),
                const SizedBox(height: MpSpace.x3),
              ],
              const SizedBox(height: MpSpace.x2),
              MpButton.secondary(
                label: 'Tovább a munkatételekhez',
                icon: Icons.arrow_forward,
                expand: true,
                onPressed: () => context.pushReplacement(Routes.items(projectId)),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return MpCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: MpText.small),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(value, style: MpText.money.copyWith(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

class _AreaCard extends ConsumerWidget {
  const _AreaCard({required this.area});
  final SurveyArea area;

  String _cm(int? v) => v == null ? '–' : Fmt.quantity(v * 10);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final m = measurementsOf(area);
    return MpCard(
      onTap: () => showAreaForm(context, ref, projectId: area.projectId, existing: area),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.crop_square, size: 20, color: MpColors.inkMuted),
              const SizedBox(width: MpSpace.x2),
              Expanded(child: Text(area.name, style: MpText.heading)),
              const Icon(Icons.edit_outlined, size: 18, color: MpColors.inkFaint),
            ],
          ),
          const SizedBox(height: MpSpace.x2),
          Text(
            'H ${_cm(area.lengthCm)} × Sz ${_cm(area.widthCm)} × M ${_cm(area.heightCm)} cm',
            style: MpText.mono,
          ),
          const SizedBox(height: MpSpace.x3),
          Wrap(
            spacing: MpSpace.x2,
            runSpacing: MpSpace.x2,
            children: [
              if (m.floorMilliM2 != null) Pill('Padló ${Fmt.quantity(m.floorMilliM2!)} m²'),
              if (m.perimeterMilliM != null) Pill('Kerület ${Fmt.quantity(m.perimeterMilliM!)} fm'),
              if (m.wallMilliM2 != null) Pill('Fal ${Fmt.quantity(m.wallMilliM2!)} m²'),
              if (!m.hasFloor)
                const Pill('Hiányzó méretek', bg: MpColors.warningSoft, fg: MpColors.warning),
            ],
          ),
          if (area.notes != null) ...[
            const SizedBox(height: MpSpace.x2),
            Text(area.notes!, style: MpText.small),
          ],
        ],
      ),
    );
  }
}

/// cm-ben megadott méret. Tizedes cm-t (pl. "245,5") is elfogad, egészre kerekít.
int? _parseCm(String s) {
  if (s.trim().isEmpty) return null;
  final milli = Fmt.parseQuantityMilli(s);
  if (milli == null) return -1;
  return (milli + 500) ~/ 1000;
}

Future<void> showAreaForm(
  BuildContext context,
  WidgetRef ref, {
  required int projectId,
  SurveyArea? existing,
}) async {
  final name = TextEditingController(text: existing?.name ?? '');
  final len = TextEditingController(text: existing?.lengthCm?.toString() ?? '');
  final wid = TextEditingController(text: existing?.widthCm?.toString() ?? '');
  final hei = TextEditingController(text: existing?.heightCm?.toString() ?? '');
  final open = TextEditingController(
    text: (existing?.openingsMilliM2 ?? 0) == 0 ? '' : Fmt.quantityInput(existing!.openingsMilliM2),
  );
  final notes = TextEditingController(text: existing?.notes ?? '');
  final form = GlobalKey<FormState>();
  // Lásd showLineForm: a repót a lap megnyitásakor kérjük el.
  final repo = ref.read(surveyRepoProvider);

  String? cmValidator(String? v) {
    final r = _parseCm(v ?? '');
    if (r == -1) return 'Érvénytelen szám';
    if (r != null && (r <= 0 || r > 100000)) return '1 és 100 000 cm között';
    return null;
  }

  await showMpSheet<void>(
    context,
    title: existing == null ? 'Új helyiség' : 'Helyiség szerkesztése',
    child: Form(
      key: form,
      child: StatefulBuilder(
        builder: (ctx, setLocal) {
          final l = _parseCm(len.text);
          final w = _parseCm(wid.text);
          final h = _parseCm(hei.text);
          final preview = AreaMeasurements(
            lengthCm: (l ?? 0) > 0 ? l : null,
            widthCm: (w ?? 0) > 0 ? w : null,
            heightCm: (h ?? 0) > 0 ? h : null,
            openingsMilliM2: Fmt.parseQuantityMilli(open.text) ?? 0,
          );
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              MpField(
                label: 'Megnevezés *',
                controller: name,
                hint: 'pl. Fürdőszoba',
                validator: requiredText,
                maxLength: 120,
                autofocus: existing == null,
              ),
              Row(
                children: [
                  for (final (label, c) in [('Hossz', len), ('Szélesség', wid), ('Magasság', hei)]) ...[
                    Expanded(
                      child: MpField(
                        label: label,
                        controller: c,
                        suffixText: 'cm',
                        keyboardType: decimalKeyboard,
                        inputFormatters: decimalInputFormatters,
                        validator: cmValidator,
                        monospace: true,
                        onChanged: (_) => setLocal(() {}),
                      ),
                    ),
                    if (c != hei) const SizedBox(width: MpSpace.x2),
                  ],
                ],
              ),
              MpField(
                label: 'Nyílászárók levonása',
                controller: open,
                suffixText: 'm²',
                keyboardType: decimalKeyboard,
                inputFormatters: decimalInputFormatters,
                monospace: true,
                helper: 'Ajtók és ablakok felülete. Ennyit levonunk a falfelületből.',
                validator: (v) => (v == null || v.trim().isEmpty || Fmt.parseQuantityMilli(v) != null)
                    ? null
                    : 'Érvénytelen szám',
                onChanged: (_) => setLocal(() {}),
              ),
              Container(
                padding: const EdgeInsets.all(MpSpace.x3),
                margin: const EdgeInsets.only(bottom: MpSpace.x4),
                decoration: const BoxDecoration(color: MpColors.surfaceSunken, borderRadius: MpRadius.mdAll),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _calc('Padló', preview.floorMilliM2, 'm²'),
                    _calc('Kerület', preview.perimeterMilliM, 'fm'),
                    _calc('Fal', preview.wallMilliM2, 'm²'),
                  ],
                ),
              ),
              MpField(label: 'Megjegyzés', controller: notes, maxLines: 2),
              Row(
                children: [
                  if (existing != null) ...[
                    MpButton(
                      label: 'Törlés',
                      variant: MpButtonVariant.danger,
                      onPressed: () async {
                        final ok = await confirmDialog(
                          ctx,
                          title: 'Helyiség törlése?',
                          message: 'A hozzá rendelt munkatételek megmaradnak, helyiség nélkül.',
                        );
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
                        final openings = Fmt.parseQuantityMilli(open.text) ?? 0;
                        AreaUpdateResult? result;
                        final ok = await runGuarded(ctx, () async {
                          if (existing == null) {
                            await repo.create(
                              projectId: projectId,
                              name: name.text,
                              lengthCm: _parseCm(len.text),
                              widthCm: _parseCm(wid.text),
                              heightCm: _parseCm(hei.text),
                              openingsMilliM2: openings,
                              notes: notes.text,
                            );
                          } else {
                            result = await repo.update(
                              existing,
                              name: name.text,
                              lengthCm: _parseCm(len.text),
                              widthCm: _parseCm(wid.text),
                              heightCm: _parseCm(hei.text),
                              openingsMilliM2: openings,
                              notes: notes.text,
                            );
                          }
                        });
                        if (ok && ctx.mounted) {
                          Navigator.of(ctx).pop();
                          final r = result;
                          if (r != null && (r.updatedLines > 0 || r.manualLines > 0) && context.mounted) {
                            showInfo(
                              context,
                              [
                                if (r.updatedLines > 0) '${r.updatedLines} kapcsolódó tétel mennyisége frissült.',
                                if (r.manualLines > 0)
                                  '${r.manualLines} tételnél kézzel adtad meg a mennyiséget, ezeket nézd át.',
                              ].join(' '),
                            );
                          }
                        }
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
  // A vezérlőket szándékosan nem dispose-oljuk itt: a lap záró animációja
  // még használja őket, és a korai dispose futásidejű hibát okoz. A GC elviszi.
}

Widget _calc(String label, int? milli, String unit) => Column(
      children: [
        Text(label, style: MpText.small.copyWith(fontSize: 12)),
        const SizedBox(height: 2),
        Text(milli == null ? '–' : '${Fmt.quantity(milli)} $unit', style: MpText.money.copyWith(fontSize: 14)),
      ],
    );
