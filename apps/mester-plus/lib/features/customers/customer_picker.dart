import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/forms.dart';
import '../../core/widgets/widgets.dart';
import '../../data/db/app_database.dart';
import '../../data/providers.dart';

/// Ügyfélválasztó alsó lap keresővel és gyors új-ügyfél felvétellel.
/// A kiválasztott (vagy újonnan létrehozott) ügyfél id-jával tér vissza.
Future<int?> pickCustomer(BuildContext context) {
  return showModalBottomSheet<int>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (_) => const _CustomerPickerSheet(),
  );
}

class _CustomerPickerSheet extends ConsumerStatefulWidget {
  const _CustomerPickerSheet();

  @override
  ConsumerState<_CustomerPickerSheet> createState() => _CustomerPickerSheetState();
}

class _CustomerPickerSheetState extends ConsumerState<_CustomerPickerSheet> {
  final _search = TextEditingController();
  bool _creating = false;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final customers = ref.watch(customersProvider);
    final q = _search.text.trim().toLowerCase();

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.78,
        child: _creating
            ? SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(MpSpace.gutter, 0, MpSpace.gutter, MpSpace.x6),
                child: _QuickCustomerForm(
                  onCancel: () => setState(() => _creating = false),
                  onCreated: (id) => Navigator.of(context).pop(id),
                ),
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: MpSpace.gutter),
                    child: Row(
                      children: [
                        const Expanded(child: Text('Ügyfél kiválasztása', style: MpText.title)),
                        TextButton.icon(
                          onPressed: () => setState(() => _creating = true),
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('Új'),
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
                        hintText: 'Keresés név vagy telefon alapján',
                        prefixIcon: Icon(Icons.search, size: 20),
                      ),
                    ),
                  ),
                  Expanded(
                    child: AsyncView(
                      value: customers,
                      data: (all) {
                        final list = all
                            .where((c) =>
                                q.isEmpty ||
                                c.name.toLowerCase().contains(q) ||
                                (c.phone ?? '').toLowerCase().contains(q))
                            .toList();
                        if (all.isEmpty) {
                          return EmptyState(
                            icon: Icons.person_add_alt_outlined,
                            title: 'Még nincs ügyfeled',
                            message: 'Vedd fel az elsőt pár másodperc alatt.',
                            action: MpButton(
                              label: 'Új ügyfél',
                              icon: Icons.add,
                              onPressed: () => setState(() => _creating = true),
                            ),
                          );
                        }
                        if (list.isEmpty) {
                          return const Center(child: Text('Nincs találat', style: MpText.body));
                        }
                        return ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: MpSpace.x2),
                          itemCount: list.length,
                          separatorBuilder: (_, _) => const Divider(indent: 72),
                          itemBuilder: (_, i) => _CustomerTile(
                            customer: list[i],
                            onTap: () => Navigator.of(context).pop(list[i].id),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _CustomerTile extends StatelessWidget {
  const _CustomerTile({required this.customer, required this.onTap});
  final Customer customer;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: CustomerAvatar(name: customer.name),
      title: Text(customer.name, style: MpText.bodyStrong),
      subtitle: Text(
        [customer.phone, customer.address].whereType<String>().join(' · '),
        style: MpText.small,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}

class CustomerAvatar extends StatelessWidget {
  const CustomerAvatar({super.key, required this.name, this.size = 40});
  final String name;
  final double size;

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    final first = parts.first.characters.first;
    final last = parts.length > 1 ? parts.last.characters.first : '';
    return (first + last).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: MpColors.surfaceSunken,
        borderRadius: BorderRadius.circular(size * 0.32),
        border: Border.all(color: MpColors.line),
      ),
      child: Text(
        _initials,
        style: MpText.small.copyWith(color: MpColors.ink, fontWeight: FontWeight.w600, fontSize: size * 0.34),
      ),
    );
  }
}

class _QuickCustomerForm extends ConsumerStatefulWidget {
  const _QuickCustomerForm({required this.onCancel, required this.onCreated});
  final VoidCallback onCancel;
  final ValueChanged<int> onCreated;

  @override
  ConsumerState<_QuickCustomerForm> createState() => _QuickCustomerFormState();
}

class _QuickCustomerFormState extends ConsumerState<_QuickCustomerForm> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _address = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _address.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_saving || !_form.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final id = await ref.read(customerRepoProvider).create(
            name: _name.text,
            phone: _phone.text,
            address: _address.text,
          );
      widget.onCreated(id);
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        showInfo(context, 'Nem sikerült menteni. ${friendlyError(e)}');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _form,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Új ügyfél', style: MpText.title),
          const SizedBox(height: MpSpace.x5),
          MpField(
            label: 'Név *',
            controller: _name,
            autofocus: true,
            validator: requiredText,
            maxLength: 200,
            textCapitalization: TextCapitalization.words,
          ),
          MpField(label: 'Telefon', controller: _phone, keyboardType: TextInputType.phone),
          MpField(
            label: 'Cím',
            controller: _address,
            textInputAction: TextInputAction.done,
            helper: 'Később bővítheted (e-mail, adószám) az Ügyfelek fülön.',
          ),
          const SizedBox(height: MpSpace.x2),
          Row(
            children: [
              Expanded(child: MpButton.secondary(label: 'Vissza', onPressed: widget.onCancel, expand: true)),
              const SizedBox(width: MpSpace.x3),
              Expanded(
                child: MpButton(label: 'Mentés', onPressed: _save, loading: _saving, expand: true),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
