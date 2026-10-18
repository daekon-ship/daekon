import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../data/providers.dart';
import 'api_client.dart';
import 'auto_backup.dart';
import 'cloud_backup_service.dart';
import 'cloud_config.dart';
import 'cloud_session.dart';
import 'entitlements.dart';
import 'online_quotes.dart';
import 'secure_kv.dart';

final cloudConfigProvider = Provider<CloudConfig>((ref) => CloudConfig.fromEnvironment());

final cloudStoreProvider = Provider<KeyValueStore>((ref) => SecureKeyValueStore());

final cloudHttpProvider = Provider<http.Client>((ref) {
  final c = http.Client();
  ref.onDispose(c.close);
  return c;
});

final cloudSessionProvider = ChangeNotifierProvider<CloudSession>((ref) {
  final api = ApiClient(client: ref.watch(cloudHttpProvider), config: ref.watch(cloudConfigProvider));
  return CloudSession(store: ref.watch(cloudStoreProvider), api: api);
});

/// A felület EZT használja a felhős funkciók felkínálásához (canUseCloudBackup(), canUseOnlineQuotes() …).
final entitlementsProvider = Provider<Entitlements>((ref) => ref.watch(cloudSessionProvider).entitlements);

/// Visszaállítás előtti biztonsági másolat a jelenlegi helyi adatokról (az app saját, privát mappájában;
/// a legutóbbi 3 marad meg).
Future<void> writeSafetyCopy(String json) async {
  final dir = Directory(p.join((await getApplicationDocumentsDirectory()).path, 'biztonsagi_mentesek'));
  await dir.create(recursive: true);
  final ts = DateTime.now().toIso8601String().replaceAll(RegExp(r'[^0-9]'), '').substring(0, 14);
  final f = File(p.join(dir.path, 'visszaallitas_elott_$ts.json'));
  await f.writeAsString(json, flush: true);
  final all = dir.listSync().whereType<File>().where((x) => x.path.endsWith('.json')).toList()
    ..sort((a, b) => b.path.compareTo(a.path));
  for (final old in all.skip(3)) {
    await old.delete();
  }
}

final cloudBackupServiceProvider = Provider<CloudBackupService>((ref) => CloudBackupService(
      session: ref.watch(cloudSessionProvider),
      local: ref.watch(backupServiceProvider),
      writeSafetyCopy: writeSafetyCopy,
    ));

final autoBackupProvider = ChangeNotifierProvider<AutoBackup>((ref) => AutoBackup(
      session: ref.watch(cloudSessionProvider),
      service: ref.watch(cloudBackupServiceProvider),
      local: ref.watch(backupServiceProvider),
      store: ref.watch(cloudStoreProvider),
    ));

final onlineQuoteServiceProvider = Provider<OnlineQuoteService>((ref) => OnlineQuoteService(
      session: ref.watch(cloudSessionProvider),
      store: ref.watch(cloudStoreProvider),
    ));
