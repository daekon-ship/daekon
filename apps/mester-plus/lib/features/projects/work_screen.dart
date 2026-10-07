import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/forms.dart';
import '../../core/widgets/widgets.dart';
import '../../data/providers.dart';
import '../../domain/format.dart';
import 'project_hub_screen.dart';

/// Munka: ütemezés (kezdés, befejezés) és napi munkanapló.
class WorkScreen extends ConsumerWidget {
  const WorkScreen({super.key, required this.projectId});
  final int projectId;

  static String hours(int minutes) => '${Fmt.quantity(minutes * 1000 ~/ 60)} óra';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final project = ref.watch(projectProvider(projectId));
    final logs = ref.watch(workLogsProvider(projectId));

    return project.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator(strokeWidth: 2.4))),
      error: (e, _) => Scaffold(appBar: AppBar(), body: Center(child: Text(friendlyError(e), style: MpText.body))),
      data: (pc) {
        if (pc == null) return const ProjectNotFound();
        final p = pc.project;
        return Scaffold(
          appBar: AppBar(title: const Text('Munka')),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => _addLog(context, ref),
            icon: const Icon(Icons.add),
            label: const Text('Mai munka', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, 96),
            children: [
              const SectionLabel('Ütemezés'),
              MpCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    MpDateField(
                      label: 'Kezdés',
                      value: p.startDate,
                      allowClear: true,
                      onChanged: (d) => runGuarded(
                        context,
                        () => ref.read(projectRepoProvider).setSchedule(p.id, start: d, end: p.endDate),
                      ),
                    ),
                    MpDateField(
                      label: 'Tervezett befejezés',
                      value: p.endDate,
                      allowClear: true,
                      onChanged: (d) => runGuarded(
                        context,
                        () => ref.read(projectRepoProvider).setSchedule(p.id, start: p.startDate, end: d),
                      ),
                    ),
                    if (p.startDate != null && p.endDate != null)
                      Text(
                        '${p.endDate!.difference(p.startDate!).inDays + 1} naptári nap',
                        style: MpText.small,
                      ),
                  ],
                ),
              ),
              AsyncView(
                value: logs,
                data: (list) {
                  final total = list.fold<int>(0, (a, w) => a + w.minutes);
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SectionLabel(
                        'Munkanapló',
                        trailing: Text(
                          list.isEmpty ? '' : '${list.length} nap · ${hours(total)}',
                          style: MpText.small,
                        ),
                      ),
                      if (list.isEmpty)
                        const Text(
                          'Írd be naponta, mennyit dolgoztál. A Pénzügy ebből számolja, mennyit hoz egy óra.',
                          style: MpText.small,
                        )
                      else
                        MpCard(
                          padding: EdgeInsets.zero,
                          child: Column(
                            children: [
                              for (var i = 0; i < list.length; i++) ...[
                                if (i > 0) const Divider(),
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(MpSpace.x4, MpSpace.x3, MpSpace.x1, MpSpace.x3),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(Fmt.date(list[i].day), style: MpText.bodyStrong),
                                            if (list[i].note != null)
                                              Text(list[i].note!, style: MpText.small, maxLines: 2, overflow: TextOverflow.ellipsis),
                                          ],
                                        ),
                                      ),
                                      Text(hours(list[i].minutes), style: MpText.money),
                                      IconButton(
                                        tooltip: 'Törlés',
                                        icon: const Icon(Icons.delete_outline, size: 20, color: MpColors.inkFaint),
                                        onPressed: () async {
                                          final ok = await confirmDialog(context,
                                              title: 'Bejegyzés törlése?', message: 'Ez nem vonható vissza.');
                                          if (ok && context.mounted) {
                                            await runGuarded(context, () => ref.read(workLogRepoProvider).delete(list[i]));
                                          }
                                        },
                                      ),
                                    ],
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
            ],
          ),
        );
      },
    );
  }

  Future<void> _addLog(BuildContext context, WidgetRef ref) async {
    final hoursCtl = TextEditingController(text: '8');
    final note = TextEditingController();
    var day = DateTime.now();
    final form = GlobalKey<FormState>();
    final repo = ref.read(workLogRepoProvider);
    await showMpSheet<void>(
      context,
      title: 'Munkanapló',
      child: Form(
        key: form,
        child: StatefulBuilder(
          builder: (ctx, setLocal) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              MpDateField(label: 'Nap', value: day, onChanged: (d) => setLocal(() => day = d ?? day)),
              MpField(
                label: 'Ledolgozott idő *',
                controller: hoursCtl,
                suffixText: 'óra',
                keyboardType: decimalKeyboard,
                inputFormatters: decimalInputFormatters,
                monospace: true,
                autofocus: true,
                validator: (v) {
                  final q = Fmt.parseQuantityMilli(v ?? '');
                  if (q == null || q <= 0) return 'Pl. 8 vagy 6,5';
                  if (q > 24000) return 'Legfeljebb 24 óra';
                  return null;
                },
              ),
              MpField(label: 'Mi készült', controller: note, hint: 'pl. fürdő fal csempézve', maxLines: 2, maxLength: 300),
              MpButton(
                label: 'Mentés',
                expand: true,
                onPressed: () async {
                  if (!form.currentState!.validate()) return;
                  final milliHours = Fmt.parseQuantityMilli(hoursCtl.text)!;
                  final minutes = (milliHours * 60 + 500) ~/ 1000;
                  final ok = await runGuarded(
                    ctx,
                    () => repo.add(projectId: projectId, day: day, minutes: minutes, note: note.text),
                  );
                  if (ok && ctx.mounted) Navigator.of(ctx).pop();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
