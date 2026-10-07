import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/forms.dart';
import '../../core/widgets/widgets.dart';
import '../../data/db/app_database.dart';
import '../../data/providers.dart';
import '../../domain/enums.dart';
import '../../domain/format.dart';
import '../../domain/project_finance.dart';
import 'project_hub_screen.dart';

/// Pénzügy: mennyi jött be, mennyi ment ki, mennyi maradt.
class FinanceScreen extends ConsumerWidget {
  const FinanceScreen({super.key, required this.projectId});
  final int projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final project = ref.watch(projectProvider(projectId));
    if (project.hasValue && project.value == null) return const ProjectNotFound();
    final finance = ref.watch(projectFinanceProvider(projectId));
    final payments = ref.watch(paymentsProvider(projectId)).valueOrNull ?? const <Payment>[];
    final expenses = ref.watch(expensesProvider(projectId)).valueOrNull ?? const <Expense>[];

    return Scaffold(
      appBar: AppBar(title: const Text('Pénzügy')),
      body: AsyncView(
        value: finance,
        data: (f) => ListView(
          padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, MpSpace.x10),
          children: [
            _Summary(f: f),
            SectionLabel(
              'Befolyt',
              trailing: TextButton.icon(
                onPressed: () => _addPayment(context, ref),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Rögzítés'),
              ),
            ),
            if (payments.isEmpty)
              const Text('Még nem érkezett pénz erre a munkára.', style: MpText.small)
            else
              MpCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    for (var i = 0; i < payments.length; i++) ...[
                      if (i > 0) const Divider(),
                      _Row(
                        title: payments[i].method.label,
                        subtitle: [Fmt.date(payments[i].paidAt), if (payments[i].note != null) payments[i].note!].join(' · '),
                        amount: payments[i].amountHuf,
                        amountColor: MpColors.success,
                        onDelete: () => _confirmDelete(
                          context,
                          'Befolyt összeg törlése?',
                          () => ref.read(financeRepoProvider).deletePayment(payments[i]),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            SectionLabel(
              'Kiadások',
              trailing: TextButton.icon(
                onPressed: () => _addExpense(context, ref),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Rögzítés'),
              ),
            ),
            if (expenses.isEmpty)
              const Text('Nincs rögzített kiadás. Anyag, alvállalkozó, szállítás: ami pénzbe került.', style: MpText.small)
            else
              MpCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    for (var i = 0; i < expenses.length; i++) ...[
                      if (i > 0) const Divider(),
                      _Row(
                        title: expenses[i].title,
                        subtitle: '${expenses[i].category.label} · ${Fmt.date(expenses[i].spentAt)}',
                        amount: -expenses[i].amountHuf,
                        amountColor: MpColors.danger,
                        onDelete: () => _confirmDelete(
                          context,
                          'Kiadás törlése?',
                          () => ref.read(financeRepoProvider).deleteExpense(expenses[i]),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, String title, Future<void> Function() action) async {
    final ok = await confirmDialog(context, title: title, message: 'Ez nem vonható vissza.');
    if (ok && context.mounted) await runGuarded(context, action);
  }

  Future<void> _addPayment(BuildContext context, WidgetRef ref) async {
    final amount = TextEditingController();
    final note = TextEditingController();
    var method = PaymentMethod.transfer;
    var date = DateTime.now();
    final form = GlobalKey<FormState>();
    final repo = ref.read(financeRepoProvider);
    await showMpSheet<void>(
      context,
      title: 'Befolyt összeg',
      child: Form(
        key: form,
        child: StatefulBuilder(
          builder: (ctx, setLocal) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              MpField(
                label: 'Összeg (bruttó) *',
                controller: amount,
                suffixText: 'Ft',
                keyboardType: integerKeyboard,
                inputFormatters: hufInputFormatters,
                monospace: true,
                autofocus: true,
                validator: (v) => (Fmt.parseHuf(v ?? '') ?? 0) > 0 ? null : 'Add meg az összeget',
              ),
              _Choice<PaymentMethod>(
                label: 'Mód',
                values: PaymentMethod.values,
                selected: method,
                labelOf: (m) => m.label,
                onChanged: (m) => setLocal(() => method = m),
              ),
              MpDateField(label: 'Mikor', value: date, onChanged: (d) => setLocal(() => date = d ?? date)),
              MpField(label: 'Megjegyzés', controller: note, hint: 'pl. előleg, 1. részlet', maxLength: 200),
              MpButton(
                label: 'Mentés',
                expand: true,
                onPressed: () async {
                  if (!form.currentState!.validate()) return;
                  final ok = await runGuarded(
                    ctx,
                    () => repo.addPayment(
                      projectId: projectId,
                      amountHuf: Fmt.parseHuf(amount.text)!,
                      paidAt: date,
                      method: method,
                      note: note.text,
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
  }

  Future<void> _addExpense(BuildContext context, WidgetRef ref) async {
    final title = TextEditingController();
    final amount = TextEditingController();
    final note = TextEditingController();
    var category = ExpenseCategory.material;
    var date = DateTime.now();
    final form = GlobalKey<FormState>();
    final repo = ref.read(financeRepoProvider);
    await showMpSheet<void>(
      context,
      title: 'Kiadás',
      child: Form(
        key: form,
        child: StatefulBuilder(
          builder: (ctx, setLocal) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              MpField(
                label: 'Mire ment *',
                controller: title,
                hint: 'pl. ragasztó, fuga',
                validator: requiredText,
                maxLength: 200,
                autofocus: true,
              ),
              MpField(
                label: 'Összeg (bruttó) *',
                controller: amount,
                suffixText: 'Ft',
                keyboardType: integerKeyboard,
                inputFormatters: hufInputFormatters,
                monospace: true,
                validator: (v) => (Fmt.parseHuf(v ?? '') ?? 0) > 0 ? null : 'Add meg az összeget',
              ),
              _Choice<ExpenseCategory>(
                label: 'Típus',
                values: ExpenseCategory.values,
                selected: category,
                labelOf: (c) => c.label,
                onChanged: (c) => setLocal(() => category = c),
              ),
              MpDateField(label: 'Mikor', value: date, onChanged: (d) => setLocal(() => date = d ?? date)),
              MpField(label: 'Megjegyzés', controller: note, maxLength: 200),
              MpButton(
                label: 'Mentés',
                expand: true,
                onPressed: () async {
                  if (!form.currentState!.validate()) return;
                  final ok = await runGuarded(
                    ctx,
                    () => repo.addExpense(
                      projectId: projectId,
                      title: title.text,
                      category: category,
                      amountHuf: Fmt.parseHuf(amount.text)!,
                      spentAt: date,
                      note: note.text,
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
  }
}

class _Summary extends StatelessWidget {
  const _Summary({required this.f});
  final ProjectFinance f;

  @override
  Widget build(BuildContext context) {
    final perHour = f.marginPerHourHuf;
    return MpCard(
      padding: const EdgeInsets.all(MpSpace.x5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('MÉG FIZETENDŐ AZ ÜGYFÉLNEK', style: MpText.label),
          const SizedBox(height: MpSpace.x2),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: MoneyText(
              f.outstandingHuf,
              style: MpText.moneyLarge.copyWith(color: f.isFullyPaid ? MpColors.success : MpColors.ink),
            ),
          ),
          const SizedBox(height: MpSpace.x3),
          ClipRRect(
            borderRadius: BorderRadius.circular(MpRadius.pill),
            child: LinearProgressIndicator(
              value: f.paidRatio,
              minHeight: 8,
              backgroundColor: MpColors.surfaceSunken,
              color: f.isFullyPaid ? MpColors.success : MpColors.accent,
            ),
          ),
          const SizedBox(height: MpSpace.x2),
          Text(
            f.isFullyPaid
                ? 'Kifizetve.${f.overpaidHuf > 0 ? ' Túlfizetés: ${Fmt.huf(f.overpaidHuf)}.' : ''}'
                : 'Befolyt ${Fmt.huf(f.paidHuf)} a ${Fmt.huf(f.quoteGrossHuf)} ajánlati összegből.',
            style: MpText.small,
          ),
          const Divider(height: MpSpace.x6),
          KeyValueRow(label: 'Ajánlat (bruttó)', value: MoneyText(f.quoteGrossHuf)),
          KeyValueRow(label: 'Kiadások', value: MoneyText(-f.expensesHuf, signed: true, color: MpColors.danger)),
          KeyValueRow(
            label: 'Ami marad a munkán',
            value: MoneyText(f.marginHuf, color: f.marginHuf < 0 ? MpColors.danger : MpColors.success),
            emphasize: true,
          ),
          if (perHour != null)
            KeyValueRow(
              label: 'Egy órára (${Fmt.quantity(f.workMinutes * 1000 ~/ 60)} óra alapján)',
              value: MoneyText(perHour),
            ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({
    required this.title,
    required this.subtitle,
    required this.amount,
    required this.amountColor,
    required this.onDelete,
  });
  final String title;
  final String subtitle;
  final int amount;
  final Color amountColor;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(MpSpace.x4, MpSpace.x3, MpSpace.x1, MpSpace.x3),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: MpText.bodyStrong, maxLines: 1, overflow: TextOverflow.ellipsis),
                Text(subtitle, style: MpText.small, maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          const SizedBox(width: MpSpace.x2),
          MoneyText(amount, signed: true, color: amountColor),
          IconButton(
            tooltip: 'Törlés',
            icon: const Icon(Icons.delete_outline, size: 20, color: MpColors.inkFaint),
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}

class _Choice<T> extends StatelessWidget {
  const _Choice({
    required this.label,
    required this.values,
    required this.selected,
    required this.labelOf,
    required this.onChanged,
  });
  final String label;
  final List<T> values;
  final T selected;
  final String Function(T) labelOf;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: MpSpace.x4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: MpText.small.copyWith(color: MpColors.inkSoft, fontWeight: FontWeight.w500)),
          const SizedBox(height: 6),
          Wrap(
            spacing: MpSpace.x2,
            runSpacing: MpSpace.x2,
            children: [
              for (final v in values)
                ChoiceChip(
                  label: Text(labelOf(v)),
                  selected: v == selected,
                  showCheckmark: false,
                  selectedColor: MpColors.brand,
                  labelStyle: MpText.small.copyWith(
                    fontWeight: FontWeight.w600,
                    color: v == selected ? MpColors.onBrand : MpColors.inkSoft,
                  ),
                  onSelected: (_) => onChanged(v),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
