import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../cloud/cloud_errors.dart';
import '../../cloud/cloud_providers.dart';
import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/forms.dart';
import '../../core/widgets/widgets.dart';

/// MESTER+ FIÓK – bejelentkezés / regisztráció. A fiók OPCIONÁLIS: csak a felhős (Pro)
/// funkciókhoz kell; a helyi app fiók nélkül is teljes értékű.
class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({super.key, this.startWithRegister = false});
  final bool startWithRegister;

  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _password2 = TextEditingController();
  late bool _register = widget.startWithRegister;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _password2.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy || !_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final session = ref.read(cloudSessionProvider);
    try {
      if (_register) {
        await session.register(email: _email.text, password: _password.text);
      } else {
        await session.login(email: _email.text, password: _password.text);
      }
      if (!mounted) return;
      showInfo(context, _register ? 'Mester+ fiók létrehozva' : 'Bejelentkezve');
      Navigator.of(context).maybePop();
    } on CloudException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e, st) {
      if (mounted) setState(() => _error = friendlyError(e, st));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _forgot() async {
    final email = _email.text.trim();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      setState(() => _error = 'Írd be az e-mail címedet, és nyomd meg újra az „Elfelejtett jelszó” gombot.');
      return;
    }
    try {
      await ref.read(cloudSessionProvider).forgotPassword(email);
      if (mounted) showInfo(context, 'Ha van ilyen fiók, elküldtük a jelszó-visszaállító linket.');
    } on CloudException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final enabled = ref.watch(cloudSessionProvider).cloudEnabled;
    return Scaffold(
      appBar: AppBar(title: const Text('Mester+ fiók')),
      body: SafeArea(
        top: false,
        child: Form(
          key: _form,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x4, MpSpace.gutter, MpSpace.x10),
            children: [
              MpCard(
                color: MpColors.infoSoft,
                borderColor: MpColors.infoSoft,
                child: Text(
                  'A fiók a felhős funkciókhoz kell (felhőmentés, online ajánlat). '
                  'Az app fiók nélkül is teljes értékű: az ügyfelek, projektek, ajánlatok és a PDF továbbra is csak a telefonodon vannak.',
                  style: MpText.small.copyWith(color: MpColors.ink),
                ),
              ),
              const SizedBox(height: MpSpace.x4),
              SegmentedButton<bool>(
                segments: const [
                  ButtonSegment(value: false, label: Text('Bejelentkezés')),
                  ButtonSegment(value: true, label: Text('Új fiók')),
                ],
                selected: {_register},
                showSelectedIcon: false,
                onSelectionChanged: (s) => setState(() {
                  _register = s.first;
                  _error = null;
                }),
              ),
              const SizedBox(height: MpSpace.x4),
              MpField(
                label: 'E-mail cím',
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                textCapitalization: TextCapitalization.none,
                maxLength: 254,
                validator: (v) => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v?.trim() ?? '') ? null : 'Érvénytelen e-mail cím',
              ),
              MpField(
                label: _register ? 'Jelszó (legalább 10 karakter)' : 'Jelszó',
                controller: _password,
                obscure: true,
                textCapitalization: TextCapitalization.none,
                maxLength: 200,
                textInputAction: _register ? TextInputAction.next : TextInputAction.done,
                validator: (v) => (v ?? '').length < (_register ? 10 : 1) ? (_register ? 'Legalább 10 karakter' : 'Kötelező mező') : null,
              ),
              if (_register)
                MpField(
                  label: 'Jelszó még egyszer',
                  controller: _password2,
                  obscure: true,
                  textCapitalization: TextCapitalization.none,
                  maxLength: 200,
                  textInputAction: TextInputAction.done,
                  validator: (v) => v == _password.text ? null : 'A két jelszó nem egyezik',
                ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: MpSpace.x3),
                  child: Text(_error!, style: MpText.small.copyWith(color: MpColors.danger, fontWeight: FontWeight.w600)),
                ),
              MpButton(
                label: _register ? 'Fiók létrehozása' : 'Bejelentkezés',
                expand: true,
                loading: _busy,
                onPressed: enabled ? _submit : null,
              ),
              if (!enabled)
                Padding(
                  padding: const EdgeInsets.only(top: MpSpace.x2),
                  child: Text(CloudException.disabledMessage, style: MpText.small.copyWith(color: MpColors.warning)),
                ),
              if (!_register) ...[
                const SizedBox(height: MpSpace.x2),
                MpButton.ghost(label: 'Elfelejtett jelszó', onPressed: enabled ? _forgot : null, expand: true),
              ],
              const SizedBox(height: MpSpace.x4),
              MpButton.secondary(
                label: 'Folytatás fiók nélkül',
                expand: true,
                onPressed: () => Navigator.of(context).maybePop(),
              ),
              const SizedBox(height: MpSpace.x4),
              const Text(
                'A regisztrációval elfogadod a Mester+ felhős szolgáltatás feltételeit és adatkezelési tájékoztatóját '
                '(daekon.hu/mester-plus/adatvedelem.html).',
                style: MpText.small,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Jelszó megerősítése érzékeny művelet előtt (fiók törlése).
Future<String?> askPassword(BuildContext context, {required String title, required String message}) async {
  final c = TextEditingController();
  String? result;
  await showMpSheet<void>(
    context,
    title: title,
    child: Builder(
      builder: (ctx) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(message, style: MpText.body),
          const SizedBox(height: MpSpace.x3),
          MpField(
            label: 'Jelszó',
            controller: c,
            obscure: true,
            autofocus: true,
            textCapitalization: TextCapitalization.none,
            inputFormatters: [LengthLimitingTextInputFormatter(200)],
            textInputAction: TextInputAction.done,
          ),
          MpButton(
            label: 'Megerősítés',
            variant: MpButtonVariant.danger,
            expand: true,
            onPressed: () {
              if (c.text.isEmpty) return;
              result = c.text;
              Navigator.of(ctx).pop();
            },
          ),
        ],
      ),
    ),
  );
  return result;
}
