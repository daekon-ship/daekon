import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../cloud/cloud_errors.dart';
import '../../cloud/cloud_providers.dart';
import '../../cloud/cloud_session.dart';
import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/widgets.dart';
import '../../domain/format.dart';

/// SAJÁT ESZKÖZEIM: melyik telefon van bejelentkezve; egy eszköz kijelentkeztetése / visszavonása.
class DevicesScreen extends ConsumerStatefulWidget {
  const DevicesScreen({super.key});

  @override
  ConsumerState<DevicesScreen> createState() => _DevicesScreenState();
}

class _DevicesScreenState extends ConsumerState<DevicesScreen> {
  late Future<List<CloudDevice>> _future = ref.read(cloudSessionProvider).devices();

  Future<void> _reload() async {
    final f = ref.read(cloudSessionProvider).devices();
    setState(() => _future = f);
    await f.catchError((_) => <CloudDevice>[]);
  }

  Future<void> _revoke(CloudDevice d) async {
    final ok = await confirmDialog(context,
        title: 'Eszköz visszavonása?', message: '„${d.name}” azonnal kijelentkezik, és újra be kell lépnie a felhős funkciókhoz.', confirmLabel: 'Visszavonás');
    if (!ok || !mounted) return;
    try {
      await ref.read(cloudSessionProvider).revokeDevice(d.id);
      if (mounted) showInfo(context, 'Eszköz visszavonva');
      await _reload();
    } on CloudException catch (e) {
      if (mounted) showInfo(context, e.message);
    }
  }

  Future<void> _logoutAll() async {
    final ok = await confirmDialog(context,
        title: 'Kijelentkezés minden eszközről?', message: 'Minden telefon (ez is) kijelentkezik. A helyi adatok megmaradnak.', confirmLabel: 'Kijelentkezés');
    if (!ok || !mounted) return;
    try {
      await ref.read(cloudSessionProvider).logoutAll();
      if (mounted) Navigator.of(context).maybePop();
    } on CloudException catch (e) {
      if (mounted) showInfo(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Eszközeim')),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<CloudDevice>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator(strokeWidth: 2.4));
            }
            if (snap.hasError) {
              return ListView(padding: const EdgeInsets.all(MpSpace.gutter), children: [
                Text(snap.error is CloudException ? (snap.error as CloudException).message : CloudException.genericMessage, style: MpText.body),
              ]);
            }
            final list = snap.data ?? const [];
            return ListView(
              padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x4, MpSpace.gutter, MpSpace.x10),
              children: [
                for (final d in list)
                  Padding(
                    padding: const EdgeInsets.only(bottom: MpSpace.x3),
                    child: MpCard(
                      child: Row(children: [
                        Icon(d.platform == 'android' ? Icons.phone_android : Icons.devices_other, color: MpColors.inkMuted),
                        const SizedBox(width: MpSpace.x3),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(d.current ? '${d.name} (ez a telefon)' : d.name, style: MpText.bodyStrong),
                            Text(
                              d.revoked
                                  ? 'Visszavonva'
                                  : 'Utoljára: ${d.lastSeen == null ? '–' : Fmt.date(d.lastSeen!)} · app ${d.appVersion}${d.signedIn ? '' : ' · kijelentkezett'}',
                              style: MpText.small,
                            ),
                          ]),
                        ),
                        if (!d.current && !d.revoked)
                          TextButton(onPressed: () => _revoke(d), child: const Text('Visszavonás', style: TextStyle(color: MpColors.danger))),
                      ]),
                    ),
                  ),
                const SizedBox(height: MpSpace.x2),
                MpButton.secondary(label: 'Kijelentkezés minden eszközről', icon: Icons.logout, expand: true, onPressed: _logoutAll),
              ],
            );
          },
        ),
      ),
    );
  }
}
