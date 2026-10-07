import 'dart:convert';
import 'dart:io';

import 'package:drift/drift.dart' show Value;
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/app_info.dart';
import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/forms.dart';
import '../../core/widgets/widgets.dart';
import '../../data/backup.dart';
import '../../data/db/app_database.dart';
import '../../data/providers.dart';
import '../../domain/enums.dart';
import '../../domain/format.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(companyProfileProvider);
    final epoch = ref.watch(restoreEpochProvider);
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: AsyncView(
          value: profile,
          // Mentés után NEM épül újra a szerkesztés közbeni űrlap (állandó kulcs);
          // biztonsági mentés visszaállítása után viszont igen (epoch).
          data: (p) => _CompanyForm(key: ValueKey('company-$epoch'), initial: p),
        ),
      ),
    );
  }
}

class _CompanyForm extends ConsumerStatefulWidget {
  const _CompanyForm({super.key, required this.initial});
  final CompanyProfile initial;

  @override
  ConsumerState<_CompanyForm> createState() => _CompanyFormState();
}

class _CompanyFormState extends ConsumerState<_CompanyForm> {
  final _form = GlobalKey<FormState>();
  late final _company = TextEditingController(text: widget.initial.companyName);
  late final _owner = TextEditingController(text: widget.initial.ownerName);
  late final _address = TextEditingController(text: widget.initial.address);
  late final _tax = TextEditingController(text: widget.initial.taxNumber);
  late final _phone = TextEditingController(text: widget.initial.phone);
  late final _email = TextEditingController(text: widget.initial.email);
  late final _prefix = TextEditingController(text: widget.initial.quotePrefix);
  late final _footer = TextEditingController(text: widget.initial.quoteFooter);
  late int _vat = widget.initial.defaultVatRateBp;
  bool _saving = false;
  bool _dirty = false;

  @override
  void dispose() {
    for (final c in [_company, _owner, _address, _tax, _phone, _email, _prefix, _footer]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (_saving || !_form.currentState!.validate()) return;
    setState(() => _saving = true);
    final ok = await runGuarded(
      context,
      () => ref.read(companyRepoProvider).save(CompanyProfilesCompanion(
            companyName: Value(_company.text.trim()),
            ownerName: Value(_owner.text.trim()),
            address: Value(_address.text.trim()),
            taxNumber: Value(_tax.text.trim()),
            phone: Value(_phone.text.trim()),
            email: Value(_email.text.trim()),
            defaultVatRateBp: Value(_vat),
            quotePrefix: Value(_prefix.text.trim().toUpperCase()),
            quoteFooter: Value(_footer.text.trim()),
          )),
    );
    if (!mounted) return;
    setState(() {
      _saving = false;
      if (ok) _dirty = false;
    });
    if (ok) showInfo(context, 'Beállítások mentve');
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _form,
      onChanged: () {
        if (!_dirty) setState(() => _dirty = true);
      },
      child: ListView(
        padding: const EdgeInsets.only(bottom: MpSpace.x10),
        children: [
          const PageHeader(title: 'Beállítások', subtitle: 'Ezek az adatok kerülnek az árajánlatra.'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: MpSpace.gutter),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SectionLabel('Cégadatok'),
                MpField(label: 'Cégnév / vállalkozás neve', controller: _company, maxLength: 200),
                MpField(label: 'Kapcsolattartó neve', controller: _owner, textCapitalization: TextCapitalization.words),
                MpField(label: 'Cím', controller: _address),
                MpField(
                  label: 'Adószám',
                  controller: _tax,
                  hint: '12345678-1-23',
                  keyboardType: TextInputType.number,
                  validator: (v) {
                    final s = v?.trim() ?? '';
                    if (s.isEmpty) return null;
                    return RegExp(r'^\d{8}-?\d-?\d{2}$').hasMatch(s) ? null : 'Formátum: 12345678-1-23';
                  },
                ),
                MpField(label: 'Telefon', controller: _phone, keyboardType: TextInputType.phone),
                MpField(
                  label: 'E-mail',
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  textCapitalization: TextCapitalization.none,
                  validator: (v) {
                    final s = v?.trim() ?? '';
                    if (s.isEmpty) return null;
                    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(s) ? null : 'Érvénytelen e-mail cím';
                  },
                ),
                const SectionLabel('Ajánlat alapértelmezések'),
                Text('Alapértelmezett ÁFA új projekteknél',
                    style: MpText.small.copyWith(color: MpColors.inkSoft, fontWeight: FontWeight.w500)),
                const SizedBox(height: 6),
                SegmentedButton<int>(
                  segments: [
                    for (final bp in VatRates.presets) ButtonSegment(value: bp, label: Text(VatRates.label(bp).split(' ').first)),
                  ],
                  selected: {VatRates.presets.contains(_vat) ? _vat : VatRates.standard},
                  showSelectedIcon: false,
                  onSelectionChanged: (s) => setState(() {
                    _vat = s.first;
                    _dirty = true;
                  }),
                ),
                const SizedBox(height: MpSpace.x4),
                MpField(
                  label: 'Ajánlatszám előtag',
                  controller: _prefix,
                  helper: 'Pl. „MP” → MP-2026-001',
                  textCapitalization: TextCapitalization.characters,
                  validator: (v) {
                    final s = v?.trim() ?? '';
                    if (s.isEmpty) return null;
                    return RegExp(r'^[A-Za-z0-9]{1,8}$').hasMatch(s) ? null : 'Max. 8 betű/szám, szóköz nélkül';
                  },
                ),
                MpField(
                  label: 'Lábléc szöveg az ajánlaton',
                  controller: _footer,
                  maxLines: 4,
                  maxLength: 600,
                  hint: 'pl. fizetési feltételek, garancia, kezdés várható időpontja',
                ),
                if (_dirty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: MpSpace.x2),
                    child: Text('Nem mentett módosításaid vannak.',
                        style: MpText.small.copyWith(color: MpColors.warning, fontWeight: FontWeight.w600)),
                  ),
                MpButton(label: 'Mentés', onPressed: _dirty ? _save : null, loading: _saving, expand: true),
                const SectionLabel('Adatmentés'),
                const _BackupSection(),
                const SizedBox(height: MpSpace.x8),
                const Center(child: Text('Mester+ $appVersion · minden adat ezen a telefonon van', style: MpText.small)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Biztonsági mentés és visszaállítás. Minden adat csak a készüléken van,
/// ezért ez véd a telefon elvesztése / cseréje ellen.
class _BackupSection extends ConsumerStatefulWidget {
  const _BackupSection();

  @override
  ConsumerState<_BackupSection> createState() => _BackupSectionState();
}

class _BackupSectionState extends ConsumerState<_BackupSection> {
  bool _busy = false;

  bool get _isDesktop => Platform.isWindows || Platform.isMacOS || Platform.isLinux;

  Future<void> _export() async {
    setState(() => _busy = true);
    try {
      final json = await ref.read(backupServiceProvider).exportJson();
      final bytes = utf8.encode(json); // Uint8List
      final path = await FilePicker.platform.saveFile(
        dialogTitle: 'Biztonsági mentés helye',
        fileName: BackupService.fileName(DateTime.now()),
        type: FileType.custom,
        allowedExtensions: const ['json'],
        bytes: bytes,
      );
      if (path == null) return; // a felhasználó megszakította
      // Asztali gépen a file_picker csak az útvonalat adja vissza — a fájlt nekünk kell kiírni.
      if (_isDesktop) await File(path).writeAsBytes(bytes, flush: true);
      if (mounted) showInfo(context, 'Biztonsági mentés elkészült');
    } catch (e) {
      if (mounted) showInfo(context, 'A mentés nem sikerült. ${friendlyError(e)}');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _restore() async {
    final service = ref.read(backupServiceProvider);
    final ParsedBackup parsed;
    try {
      final picked = await FilePicker.platform.pickFiles(
        dialogTitle: 'Mentési fájl kiválasztása',
        type: FileType.custom,
        allowedExtensions: const ['json'],
        withData: true,
      );
      final file = picked?.files.singleOrNull;
      if (file == null) return;
      final bytes = file.bytes ?? (file.path == null ? null : await File(file.path!).readAsBytes());
      if (bytes == null) throw const BackupFormatException('A fájl nem olvasható.');
      if (bytes.length > 50 * 1024 * 1024) throw const BackupFormatException('A fájl túl nagy (50 MB felett).');
      parsed = service.parse(utf8.decode(bytes, allowMalformed: false));
    } on BackupFormatException catch (e) {
      if (mounted) showInfo(context, e.message);
      return;
    } on FormatException {
      if (mounted) showInfo(context, 'Ez a fájl nem Mester+ mentés.');
      return;
    } catch (e) {
      if (mounted) showInfo(context, 'A fájl megnyitása nem sikerült. ${friendlyError(e)}');
      return;
    }
    if (!mounted) return;

    final when = parsed.exportedAt == null ? 'ismeretlen időpontban' : Fmt.date(parsed.exportedAt!);
    final ok = await confirmDialog(
      context,
      title: 'Visszaállítás a mentésből?',
      message: 'Mentés dátuma: $when\n'
          '${parsed.customers.length} ügyfél · ${parsed.projects.length} projekt · '
          '${parsed.quoteLines.length} tétel · ${parsed.priceItems.length} árlista-tétel\n\n'
          'A készüléken lévő JELENLEGI adatok teljesen lecserélődnek. '
          'Ha bizonytalan vagy, előbb készíts mentést a mostani állapotról.',
      confirmLabel: 'Visszaállítás',
    );
    if (!ok || !mounted) return;

    setState(() => _busy = true);
    final done = await runGuarded(context, () => service.restore(parsed));
    if (!mounted) return;
    setState(() => _busy = false);
    if (done) {
      ref.read(restoreEpochProvider.notifier).state++;
      showInfo(context, 'Adatok visszaállítva');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MpCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Minden adatod csak ezen a telefonon van. Ha elveszik vagy lecseréled, a mentésből tudod visszahozni. '
            'Készíts mentést rendszeresen, és tedd el máshová: Google Drive, e-mail vagy pendrive.',
            style: MpText.small,
          ),
          const SizedBox(height: MpSpace.x4),
          MpButton.secondary(
            label: 'Mentés készítése',
            icon: Icons.download_outlined,
            expand: true,
            loading: _busy,
            onPressed: _export,
          ),
          const SizedBox(height: MpSpace.x2),
          MpButton(
            label: 'Visszaállítás mentésből',
            icon: Icons.restore,
            variant: MpButtonVariant.danger,
            expand: true,
            onPressed: _busy ? null : _restore,
          ),
        ],
      ),
    );
  }
}
