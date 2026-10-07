import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/forms.dart';
import '../../core/widgets/widgets.dart';
import '../../data/providers.dart';
import '../customers/customer_picker.dart';

class NewProjectScreen extends ConsumerStatefulWidget {
  const NewProjectScreen({super.key, this.initialCustomerId});
  final int? initialCustomerId;

  @override
  ConsumerState<NewProjectScreen> createState() => _NewProjectScreenState();
}

class _NewProjectScreenState extends ConsumerState<NewProjectScreen> {
  final _form = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _site = TextEditingController();
  final _notes = TextEditingController();
  int? _customerId;
  bool _customerMissing = false;
  bool _saving = false;
  bool _dirty = false;

  @override
  void initState() {
    super.initState();
    _customerId = widget.initialCustomerId;
  }

  @override
  void dispose() {
    _title.dispose();
    _site.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _chooseCustomer() async {
    final id = await pickCustomer(context);
    if (id == null || !mounted) return;
    setState(() {
      _customerId = id;
      _customerMissing = false;
      _dirty = true;
    });
  }

  Future<void> _save() async {
    final valid = _form.currentState!.validate();
    setState(() => _customerMissing = _customerId == null);
    if (!valid || _customerId == null || _saving) return;
    setState(() => _saving = true);
    try {
      final id = await ref.read(projectRepoProvider).create(
            customerId: _customerId!,
            title: _title.text,
            siteAddress: _site.text,
            notes: _notes.text,
          );
      if (mounted) context.pushReplacement(Routes.project(id));
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        showInfo(context, 'Nem sikerült létrehozni. ${friendlyError(e)}');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final customer = _customerId == null ? null : ref.watch(customerProvider(_customerId!)).valueOrNull;

    return UnsavedGuard(
      dirty: _dirty && !_saving,
      child: Scaffold(
      appBar: AppBar(title: const Text('Új projekt')),
      body: Form(
        key: _form,
        onChanged: () {
          if (!_dirty) setState(() => _dirty = true);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, MpSpace.x10),
          children: [
            const Text('Kinek és hová?', style: MpText.title),
            const SizedBox(height: MpSpace.x1),
            const Text('Az ügyfél és a munka helyszíne. A többit lépésenként töltjük ki.', style: MpText.body),
            const SizedBox(height: MpSpace.x6),
            Text('Ügyfél *', style: MpText.small.copyWith(color: MpColors.inkSoft, fontWeight: FontWeight.w500)),
            const SizedBox(height: 6),
            MpCard(
              onTap: _chooseCustomer,
              borderColor: _customerMissing ? MpColors.danger : MpColors.line,
              padding: const EdgeInsets.symmetric(horizontal: MpSpace.x4, vertical: MpSpace.x3),
              child: Row(
                children: [
                  if (customer != null)
                    CustomerAvatar(name: customer.name, size: 36)
                  else
                    const Icon(Icons.person_search_outlined, color: MpColors.inkMuted),
                  const SizedBox(width: MpSpace.x3),
                  Expanded(
                    child: customer == null
                        ? Text('Ügyfél kiválasztása vagy felvétele', style: MpText.body.copyWith(color: MpColors.inkMuted))
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(customer.name, style: MpText.bodyStrong),
                              if (customer.address != null) Text(customer.address!, style: MpText.small),
                            ],
                          ),
                  ),
                  const Icon(Icons.unfold_more, color: MpColors.inkMuted),
                ],
              ),
            ),
            if (_customerMissing)
              Padding(
                padding: const EdgeInsets.only(top: 6, left: 14),
                child: Text('Válassz ügyfelet', style: MpText.small.copyWith(color: MpColors.danger, fontSize: 12)),
              ),
            const SizedBox(height: MpSpace.x5),
            MpField(
              label: 'Projekt megnevezése *',
              controller: _title,
              hint: 'pl. Fürdőszoba felújítás',
              validator: requiredText,
              maxLength: 200,
            ),
            MpField(
              label: 'Munka helyszíne',
              controller: _site,
              hint: 'Cím, ha eltér az ügyfél címétől',
              maxLength: 300,
              onChanged: (_) => setState(() {}),
            ),
            if (customer?.address != null && _site.text.trim().isEmpty)
              Align(
                alignment: Alignment.centerLeft,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: MpSpace.x3),
                  child: TextButton.icon(
                    onPressed: () => setState(() => _site.text = customer!.address!),
                    icon: const Icon(Icons.place_outlined, size: 18),
                    label: const Text('Ügyfél címének használata'),
                  ),
                ),
              ),
            MpField(label: 'Megjegyzés', controller: _notes, maxLines: 3),
            const SizedBox(height: MpSpace.x4),
            MpButton(
              label: 'Projekt létrehozása',
              icon: Icons.arrow_forward,
              onPressed: _save,
              loading: _saving,
              expand: true,
            ),
          ],
        ),
      ),
    ),
    );
  }
}
