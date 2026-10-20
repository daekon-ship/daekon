import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../cloud/cloud_errors.dart';
import '../../cloud/cloud_providers.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/widgets.dart';
import '../../domain/format.dart';
import 'account_screen.dart';

/// Tördelődő címke (a közös Pill egysoros; itt a hosszú magyar szöveg keskeny kijelzőn is elfér).
class _Tag extends StatelessWidget {
  const _Tag(this.text, {this.bg = MpColors.surfaceSunken, this.fg = MpColors.inkSoft});
  final String text;
  final Color bg;
  final Color fg;

  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(MpRadius.md)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          child: Text(text, style: MpText.small.copyWith(color: fg, fontWeight: FontWeight.w600, fontSize: 12)),
        ),
      );
}

/// Címke–érték sor, amelyben az érték is tördelődhet (a közös KeyValueRow értéke egysoros).
class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(child: Text(label, style: MpText.body)),
          const SizedBox(width: MpSpace.x3),
          Flexible(child: Text(value, style: MpText.small.copyWith(color: MpColors.ink), textAlign: TextAlign.right)),
        ]),
      );
}

String _when(DateTime? d) => d == null ? '–' : '${Fmt.date(d)} ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';

/// MESTER+ FIÓK kártya a Beállításokban.
class CloudAccountSection extends ConsumerWidget {
  const CloudAccountSection({super.key});

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    final ok = await confirmDialog(context,
        title: 'Kijelentkezés?',
        message: 'A felhős funkciók szünetelnek ezen a telefonon. A helyi adataid MEGMARADNAK.',
        confirmLabel: 'Kijelentkezés',
        destructive: false);
    if (!ok) return;
    await ref.read(cloudSessionProvider).logout();
    if (context.mounted) showInfo(context, 'Kijelentkeztél');
  }

  Future<void> _export(BuildContext context, WidgetRef ref) async {
    try {
      final json = await ref.read(cloudSessionProvider).exportData();
      final bytes = utf8.encode(json);
      final path = await FilePicker.platform.saveFile(
        dialogTitle: 'Felhős adataim exportja',
        fileName: 'mester_plus_fiok_export_${DateTime.now().toIso8601String().substring(0, 10)}.json',
        type: FileType.custom,
        allowedExtensions: const ['json'],
        bytes: bytes,
      );
      if (path == null) return;
      if (Platform.isWindows || Platform.isMacOS || Platform.isLinux) await File(path).writeAsBytes(bytes, flush: true);
      if (context.mounted) showInfo(context, 'Export elkészült');
    } on CloudException catch (e) {
      if (context.mounted) showInfo(context, e.message);
    } catch (e, st) {
      if (context.mounted) showInfo(context, friendlyError(e, st));
    }
  }

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final ok = await confirmDialog(context,
        title: 'Mester+ fiók törlése?',
        message: 'A szerveren MINDEN felhős adatod törlődik: felhőmentések, online ajánlat-linkek, eszközök. '
            'A telefonon lévő ügyfelek, projektek és ajánlatok MEGMARADNAK. A törlés nem vonható vissza.\n\n'
            'Ha van Google Play-előfizetésed, azt a Play Áruházban mondd le.',
        confirmLabel: 'Tovább');
    if (!ok || !context.mounted) return;
    final pw = await askPassword(context, title: 'Fiók törlése', message: 'A törléshez add meg a jelszavadat.');
    if (pw == null || !context.mounted) return;
    try {
      await ref.read(cloudSessionProvider).deleteAccount(pw);
      if (context.mounted) showInfo(context, 'A Mester+ fiókod törölve. A helyi adataid megmaradtak.');
    } on CloudException catch (e) {
      if (context.mounted) showInfo(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(cloudSessionProvider);
    final ent = ref.watch(entitlementsProvider);
    if (!s.isSignedIn) {
      return MpCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Row(children: [
              Icon(Icons.person_outline, color: MpColors.inkMuted),
              SizedBox(width: MpSpace.x3),
              Expanded(child: Text('Fiók nélkül használod', style: MpText.bodyStrong)),
            ]),
            const SizedBox(height: MpSpace.x2),
            const Text('Minden funkció működik fiók nélkül is. Mester+ fiók csak a felhőmentéshez és az online ajánlathoz kell.', style: MpText.small),
            const SizedBox(height: MpSpace.x3),
            MpButton.secondary(label: 'Bejelentkezés / Regisztráció', icon: Icons.login, expand: true, onPressed: () => context.push(Routes.cloudAccount)),
          ],
        ),
      );
    }
    final acc = s.account!;
    final snap = s.entitlementSnapshot;
    return MpCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(children: [
            const Icon(Icons.account_circle_outlined, color: MpColors.inkMuted),
            const SizedBox(width: MpSpace.x3),
            Expanded(child: Text(acc.email, style: MpText.bodyStrong, overflow: TextOverflow.ellipsis)),
          ]),
          const SizedBox(height: MpSpace.x2),
          Wrap(spacing: MpSpace.x2, runSpacing: MpSpace.x2, children: [
            _Tag(snap.isPilot && snap.pilotUntil != null ? '${snap.planName} · ${Fmt.date(snap.pilotUntil!.toLocal())}-ig' : snap.planName, bg: snap.isPro ? MpColors.accentSoft : MpColors.surfaceSunken, fg: snap.isPro ? MpColors.onAccent : MpColors.inkSoft),
            if (!acc.emailVerified) const _Tag('E-mail megerősítésre vár', bg: MpColors.warningSoft, fg: MpColors.warning),
            if (ent.needsRefresh) const _Tag('Csatlakozz az internethez a frissítéshez'),
          ]),
          if (!acc.emailVerified) ...[
            const SizedBox(height: MpSpace.x2),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                onPressed: () async {
                  try {
                    await s.resendVerification();
                    if (context.mounted) showInfo(context, 'Megerősítő levél kérve.');
                  } on CloudException catch (e) {
                    if (context.mounted) showInfo(context, e.message);
                  }
                },
                child: const Text('Megerősítő levél újraküldése'),
              ),
            ),
          ],
          const SizedBox(height: MpSpace.x3),
          MpButton.secondary(label: 'Eszközeim', icon: Icons.devices_outlined, expand: true, onPressed: () => context.push(Routes.cloudDevices)),
          const SizedBox(height: MpSpace.x2),
          MpButton.secondary(label: 'Adataim exportálása', icon: Icons.file_download_outlined, expand: true, onPressed: () => _export(context, ref)),
          const SizedBox(height: MpSpace.x2),
          MpButton.ghost(label: 'Kijelentkezés', icon: Icons.logout, expand: true, onPressed: () => _logout(context, ref)),
          const SizedBox(height: MpSpace.x1),
          MpButton(label: 'Fiók törlése', icon: Icons.delete_outline, variant: MpButtonVariant.danger, expand: true, onPressed: () => _delete(context, ref)),
        ],
      ),
    );
  }
}

/// FELHŐMENTÉS kártya. Pro nélkül egy visszafogott ismertető (nem tolakodó fizetőfal).
class CloudBackupSection extends ConsumerWidget {
  const CloudBackupSection({super.key});

  Future<void> _now(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(autoBackupProvider).runNow();
      if (context.mounted) showInfo(context, 'Felhőmentés elkészült');
    } on CloudException catch (e) {
      if (context.mounted) showInfo(context, e.message);
    } catch (e, st) {
      if (context.mounted) showInfo(context, friendlyError(e, st));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(cloudSessionProvider);
    final ent = ref.watch(entitlementsProvider);
    final auto = ref.watch(autoBackupProvider);
    if (!s.isSignedIn || (!ent.canUseCloudBackup() && !ent.canUseCloudRestore())) {
      return const ProTeaser(
        title: 'Felhőmentés – Mester+ Pro',
        lines: [
          'Napi automatikus, titkosított mentés a felhőbe',
          'Telefoncsere után belépéssel visszaállítható',
          'Online ajánlat elfogadás-követéssel',
        ],
      );
    }
    final st = auto.state;
    final canBackup = ent.canUseCloudBackup();
    return MpCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(children: [
            Icon(Icons.cloud_done_outlined, color: st.lastSuccessAt != null ? MpColors.success : MpColors.inkMuted),
            const SizedBox(width: MpSpace.x3),
            Expanded(
              child: Text(
                auto.running
                    ? 'Mentés folyamatban…'
                    : st.lastSuccessAt != null
                        ? 'Utolsó sikeres mentés: ${_when(st.lastSuccessAt!.toLocal())}'
                        : 'Még nincs felhőmentés',
                style: MpText.bodyStrong,
              ),
            ),
          ]),
          const SizedBox(height: MpSpace.x2),
          _InfoRow('Állapot', st.lastError != null && st.failures > 0 ? 'Hiba – újrapróbálja' : 'Rendben'),
          if (canBackup)
            _InfoRow('Következő tervezett', st.auto ? _when(auto.nextScheduled?.toLocal()) : 'kikapcsolva'),
          const _InfoRow('Eszköz', 'ez a telefon'),
          if (st.lastError != null && st.failures > 0)
            Padding(
              padding: const EdgeInsets.only(top: MpSpace.x1),
              child: Text(st.lastError!, style: MpText.small.copyWith(color: MpColors.warning)),
            ),
          if (canBackup)
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Automatikus napi mentés', style: MpText.body),
              subtitle: const Text('Ha változott valami, naponta egyszer, amikor megnyitod az appot.', style: MpText.small),
              value: st.auto,
              onChanged: (v) => ref.read(autoBackupProvider).setAuto(v),
            ),
          const SizedBox(height: MpSpace.x2),
          if (canBackup)
            MpButton(label: 'Mentés most', icon: Icons.cloud_upload_outlined, expand: true, loading: auto.running, onPressed: auto.running ? null : () => _now(context, ref)),
          if (!canBackup)
            const Padding(
              padding: EdgeInsets.only(bottom: MpSpace.x2),
              child: Text('Az előfizetésed lejárt: új mentés nem készül, a meglévők még 30 napig visszaállíthatók.', style: MpText.small),
            ),
          const SizedBox(height: MpSpace.x2),
          MpButton.secondary(label: 'Felhőmentések és visszaállítás', icon: Icons.restore, expand: true, onPressed: () => context.push(Routes.cloudBackups)),
        ],
      ),
    );
  }
}

/// Visszafogott Pro-ismertető: nem blokkol semmit, a helyi funkciók mind elérhetők.
class ProTeaser extends ConsumerWidget {
  const ProTeaser({super.key, required this.title, required this.lines});
  final String title;
  final List<String> lines;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final signedIn = ref.watch(cloudSessionProvider).isSignedIn;
    return MpCard(
      color: MpColors.surface,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(children: [
            const Icon(Icons.workspace_premium_outlined, color: MpColors.accent),
            const SizedBox(width: MpSpace.x3),
            Expanded(child: Text(title, style: MpText.bodyStrong)),
            const _Tag('Hamarosan', bg: MpColors.accentSoft, fg: MpColors.onAccent),
          ]),
          const SizedBox(height: MpSpace.x2),
          for (final l in lines)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Padding(padding: EdgeInsets.only(top: 3), child: Icon(Icons.check, size: 16, color: MpColors.success)),
                const SizedBox(width: MpSpace.x2),
                Expanded(child: Text(l, style: MpText.small)),
              ]),
            ),
          const SizedBox(height: MpSpace.x2),
          Text(
            signedIn
                ? 'A Mester+ Pro előfizetés hamarosan indul. A helyi mentés (lent) addig is ingyenes és teljes értékű.'
                : 'A Pro-funkciókhoz Mester+ fiók szükséges. A helyi mentés (lent) fiók nélkül is működik.',
            style: MpText.small,
          ),
        ],
      ),
    );
  }
}
