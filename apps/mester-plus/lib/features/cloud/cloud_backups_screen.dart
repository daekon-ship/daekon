import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../cloud/cloud_backup_service.dart';
import '../../cloud/cloud_errors.dart';
import '../../cloud/cloud_providers.dart';
import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/widgets.dart';
import '../../data/backup.dart';
import '../../data/providers.dart';
import '../../domain/format.dart';

String _size(int b) => b < 1024 * 1024 ? '${(b / 1024).toStringAsFixed(0)} kB' : '${(b / 1024 / 1024).toStringAsFixed(1)} MB';
String _when(DateTime d) => '${Fmt.date(d)} ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';

/// FELHŐMENTÉSEK: lista (dátum, eszköz, app-verzió, méret), visszaállítás, törlés.
class CloudBackupsScreen extends ConsumerStatefulWidget {
  const CloudBackupsScreen({super.key});

  @override
  ConsumerState<CloudBackupsScreen> createState() => _CloudBackupsScreenState();
}

class _CloudBackupsScreenState extends ConsumerState<CloudBackupsScreen> {
  late Future<CloudBackupList> _future = ref.read(cloudBackupServiceProvider).list();
  bool _busy = false;
  String? _step;

  Future<void> _reload() async {
    final f = ref.read(cloudBackupServiceProvider).list();
    setState(() => _future = f);
    await f.then((_) {}, onError: (_) {});
  }

  /// Visszaállítás: figyelmeztetés → letöltés → ellenőrzőösszeg → visszafejtés → teljes ellenőrzés →
  /// megerősítés a tartalommal → biztonsági másolat a mostani adatokról → egy-tranzakciós csere.
  /// Bármely hiba esetén a helyi adat érintetlen.
  Future<void> _restore(CloudBackupInfo b) async {
    final first = await confirmDialog(context,
        title: 'Visszaállítás a felhőből?',
        message: 'Mentés: ${_when(b.createdAt)} (${b.deviceName ?? 'ismeretlen eszköz'}).\n\n'
            'A telefonon lévő JELENLEGI adatok lecserélődnek. Előtte az app automatikusan biztonsági másolatot készít róluk.',
        confirmLabel: 'Tovább');
    if (!first || !mounted) return;
    final svc = ref.read(cloudBackupServiceProvider);
    setState(() {
      _busy = true;
      _step = 'Letöltés és ellenőrzés…';
    });
    PreparedRestore prepared;
    try {
      prepared = await svc.prepareRestore(b);
    } on CloudException catch (e) {
      _done(e.message);
      return;
    } on BackupFormatException catch (e) {
      _done(e.message);
      return;
    } catch (e, st) {
      _done(friendlyError(e, st));
      return;
    }
    if (!mounted) return;
    setState(() => _step = null);
    final p = prepared.parsed;
    final ok = await confirmDialog(context,
        title: 'A mentés ellenőrizve',
        message: '${p.customers.length} ügyfél · ${p.projects.length} projekt · ${p.quoteLines.length} tétel · ${p.priceItems.length} árlista-tétel\n\n'
            'Lecseréled vele a telefonon lévő adatokat?',
        confirmLabel: 'Visszaállítás');
    if (!ok || !mounted) {
      setState(() => _busy = false);
      return;
    }
    setState(() => _step = 'Visszaállítás…');
    try {
      await svc.restore(prepared);
      ref.read(restoreEpochProvider.notifier).state++;
      _done('Adatok visszaállítva a felhőmentésből');
    } catch (e, st) {
      _done('A visszaállítás nem sikerült, a helyi adatok változatlanok. ${friendlyError(e, st)}');
    }
  }

  void _done(String msg) {
    if (!mounted) return;
    setState(() {
      _busy = false;
      _step = null;
    });
    showInfo(context, msg);
  }

  Future<void> _delete(CloudBackupInfo b) async {
    final ok = await confirmDialog(context, title: 'Felhőmentés törlése?', message: '${_when(b.createdAt)} – ${_size(b.sizeBytes)}', confirmLabel: 'Törlés');
    if (!ok || !mounted) return;
    try {
      await ref.read(cloudBackupServiceProvider).delete(b.id);
      await _reload();
    } on CloudException catch (e) {
      if (mounted) showInfo(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Felhőmentések')),
      body: Stack(children: [
        RefreshIndicator(
          onRefresh: _reload,
          child: FutureBuilder<CloudBackupList>(
            future: _future,
            builder: (context, snap) {
              if (snap.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator(strokeWidth: 2.4));
              }
              if (snap.hasError) {
                final e = snap.error;
                return ListView(padding: const EdgeInsets.all(MpSpace.gutter), children: [
                  Text(e is CloudException ? e.message : CloudException.genericMessage, style: MpText.body),
                  const SizedBox(height: MpSpace.x3),
                  MpButton.secondary(label: 'Újra', onPressed: _reload),
                ]);
              }
              final data = snap.data!;
              return ListView(
                padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x4, MpSpace.gutter, MpSpace.x10),
                children: [
                  if (data.quotaBytes > 0)
                    Padding(
                      padding: const EdgeInsets.only(bottom: MpSpace.x3),
                      child: Text('Felhőtárhely: ${_size(data.usedBytes)} / ${_size(data.quotaBytes)}', style: MpText.small),
                    ),
                  if (data.backups.isEmpty)
                    const EmptyState(icon: Icons.cloud_off_outlined, title: 'Még nincs felhőmentés', message: 'A Beállításokban a „Mentés most” gombbal készíthetsz egyet.'),
                  for (final b in data.backups)
                    Padding(
                      padding: const EdgeInsets.only(bottom: MpSpace.x3),
                      child: MpCard(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                          Text(_when(b.createdAt), style: MpText.bodyStrong),
                          const SizedBox(height: 2),
                          Text('${b.deviceName ?? 'ismeretlen eszköz'} · app ${b.appVersion} · ${_size(b.sizeBytes)}', style: MpText.small),
                          const SizedBox(height: MpSpace.x3),
                          Row(children: [
                            Expanded(child: MpButton.secondary(label: 'Visszaállítás', icon: Icons.restore, onPressed: _busy ? null : () => _restore(b))),
                            const SizedBox(width: MpSpace.x2),
                            IconButton(tooltip: 'Törlés', onPressed: _busy ? null : () => _delete(b), icon: const Icon(Icons.delete_outline, color: MpColors.danger)),
                          ]),
                        ]),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
        if (_busy && _step != null)
          Positioned.fill(
            child: ColoredBox(
              color: const Color(0x66000000),
              child: Center(
                child: MpCard(
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4)),
                    const SizedBox(width: MpSpace.x3),
                    Text(_step!, style: MpText.body),
                  ]),
                ),
              ),
            ),
          ),
      ]),
    );
  }
}
