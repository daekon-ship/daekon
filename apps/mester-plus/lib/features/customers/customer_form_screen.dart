import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/forms.dart';
import '../../core/widgets/widgets.dart';
import '../../data/db/app_database.dart';
import '../../data/providers.dart';

/// Új ügyfél ([customerId] == null) vagy meglévő szerkesztése.
class CustomerFormScreen extends ConsumerStatefulWidget {
  const CustomerFormScreen({super.key, this.customerId});
  final int? customerId;

  @override
  ConsumerState<CustomerFormScreen> createState() => _CustomerFormScreenState();
}

class _CustomerFormScreenState extends ConsumerState<CustomerFormScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _address = TextEditingController();
  final _tax = TextEditingController();
  final _notes = TextEditingController();
  bool _loaded = false;
  bool _saving = false;
  bool _dirty = false;

  bool get _isEdit => widget.customerId != null;

  @override
  void dispose() {
    for (final c in [_name, _phone, _email, _address, _tax, _notes]) {
      c.dispose();
    }
    super.dispose();
  }

  void _fill(Customer c) {
    _name.text = c.name;
    _phone.text = c.phone ?? '';
    _email.text = c.email ?? '';
    _address.text = c.address ?? '';
    _tax.text = c.taxNumber ?? '';
    _notes.text = c.notes ?? '';
    _loaded = true;
  }

  String? _emailValidator(String? v) {
    final s = v?.trim() ?? '';
    if (s.isEmpty) return null;
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(s) ? null : 'Érvénytelen e-mail cím';
  }

  Future<void> _save() async {
    if (_saving || !_form.currentState!.validate()) return;
    setState(() => _saving = true);
    final repo = ref.read(customerRepoProvider);
    try {
      if (_isEdit) {
        await repo.update(
          widget.customerId!,
          name: _name.text,
          phone: _phone.text,
          email: _email.text,
          address: _address.text,
          taxNumber: _tax.text,
          notes: _notes.text,
        );
        if (mounted) context.pop();
      } else {
        final id = await repo.create(
          name: _name.text,
          phone: _phone.text,
          email: _email.text,
          address: _address.text,
          taxNumber: _tax.text,
          notes: _notes.text,
        );
        if (mounted) context.pushReplacement(Routes.customer(id));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        showInfo(context, 'Nem sikerült menteni. ${friendlyError(e)}');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isEdit && !_loaded) {
      final c = ref.watch(customerProvider(widget.customerId!));
      if (c.isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator(strokeWidth: 2.4)));
      final value = c.valueOrNull;
      if (value == null) {
        return Scaffold(
          appBar: AppBar(),
          body: const EmptyState(icon: Icons.search_off, title: 'Az ügyfél nem található', message: 'Lehet, hogy közben törölted.'),
        );
      }
      _fill(value);
    }

    return UnsavedGuard(
      dirty: _dirty && !_saving,
      child: Scaffold(
      appBar: AppBar(title: Text(_isEdit ? 'Ügyfél szerkesztése' : 'Új ügyfél')),
      body: Form(
        key: _form,
        onChanged: () {
          if (!_dirty) setState(() => _dirty = true);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, MpSpace.x10),
          children: [
            MpField(
              label: 'Név *',
              controller: _name,
              validator: requiredText,
              autofocus: !_isEdit,
              maxLength: 200,
              textCapitalization: TextCapitalization.words,
            ),
            MpField(label: 'Telefon', controller: _phone, keyboardType: TextInputType.phone),
            MpField(
              label: 'E-mail',
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              textCapitalization: TextCapitalization.none,
              validator: _emailValidator,
            ),
            MpField(label: 'Cím', controller: _address),
            MpField(
              label: 'Adószám',
              controller: _tax,
              hint: 'Cég esetén',
              helper: 'Cégnek végzett építési munkánál fordított ÁFA lehet. Ezt a kalkulációnál állítod be.',
            ),
            MpField(label: 'Megjegyzés', controller: _notes, maxLines: 3),
            const SizedBox(height: MpSpace.x2),
            MpButton(label: 'Mentés', onPressed: _save, loading: _saving, expand: true),
          ],
        ),
      ),
    ),
    );
  }
}
