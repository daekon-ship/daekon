import 'dart:convert';

/// A szerver által megadott jogosultság, a telefonon gyorsítótárazva.
///
/// A HELYI (offline) funkciók SOHA nem függenek ettől. Ez csak azt mondja meg, mely FELHŐS
/// funkció kínálható fel. A gyorstár a szerver `cache_until` időpontjáig érvényes (alap: 7 nap
/// türelmi idő internet nélkül) – utána újra meg kell kérdezni a szervert. A szerver minden felhős
/// kérésnél maga is ellenőrzi a jogosultságot, így egy hamisított kliens-állapottal sem lehet
/// felhős Pro-funkciót használni.
class EntitlementSnapshot {
  const EntitlementSnapshot({
    required this.planCode,
    required this.planName,
    required this.features,
    required this.fetchedAt,
    required this.cacheUntil,
    this.subscriptionStatus,
    this.periodEnd,
    this.quotaBytes = 0,
    this.pilotUntil,
  });

  final String planCode;
  final String planName;
  final Set<String> features;
  final DateTime fetchedAt;
  final DateTime cacheUntil;
  final String? subscriptionStatus;
  final DateTime? periodEnd;
  final int quotaBytes;

  /// PILOT (béta-tesztelő) jogosultság lejárata – a szerver adja; nem előfizetés.
  final DateTime? pilotUntil;

  static final EntitlementSnapshot none = EntitlementSnapshot(
    planCode: 'free',
    planName: 'Mester+ Offline',
    features: const {},
    fetchedAt: DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
    cacheUntil: DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
  );

  /// Érvényes-e még a gyorstár. Ha a készülék órája a lekérés elé ugrott vissza (manipuláció), nem.
  bool isFresh(DateTime now) => now.isBefore(cacheUntil) && !now.isBefore(fetchedAt.subtract(const Duration(days: 1)));

  bool has(String feature, DateTime now) => isFresh(now) && features.contains(feature);

  bool get isPro => planCode == 'pro' || planCode == 'team' || planCode == 'pilot';

  bool get isPilot => planCode == 'pilot';

  factory EntitlementSnapshot.fromServer(Map<String, dynamic> j, DateTime now) {
    final plan = (j['plan'] as Map?) ?? const {};
    final sub = j['subscription'] as Map?;
    final policy = (j['backup_policy'] as Map?) ?? const {};
    final serverNow = DateTime.tryParse('${j['server_time']}')?.toUtc();
    final until = DateTime.tryParse('${j['cache_until']}')?.toUtc();
    // A gyorstár hosszát a szerver adja, de a saját órához igazítjuk (eltérő telefon-óra ellen).
    final ttl = (serverNow != null && until != null) ? until.difference(serverNow) : const Duration(days: 7);
    return EntitlementSnapshot(
      planCode: '${plan['code'] ?? 'free'}',
      planName: '${plan['name'] ?? 'Mester+ Offline'}',
      features: {for (final f in (j['entitlements'] as List? ?? const [])) '$f'},
      fetchedAt: now.toUtc(),
      cacheUntil: now.toUtc().add(ttl.isNegative || ttl > const Duration(days: 30) ? const Duration(days: 7) : ttl),
      subscriptionStatus: sub?['status'] as String?,
      periodEnd: DateTime.tryParse('${sub?['current_period_end']}'),
      quotaBytes: (policy['quota'] as num?)?.toInt() ?? 0,
      pilotUntil: DateTime.tryParse('${j['pilot_until']}')?.toUtc(),
    );
  }

  String toJsonString() => jsonEncode({
        'plan': planCode,
        'name': planName,
        'features': features.toList()..sort(),
        'fetched': fetchedAt.toIso8601String(),
        'until': cacheUntil.toIso8601String(),
        'status': subscriptionStatus,
        'period_end': periodEnd?.toIso8601String(),
        'quota': quotaBytes,
        'pilot_until': pilotUntil?.toIso8601String(),
      });

  static EntitlementSnapshot? fromJsonString(String? s) {
    if (s == null) return null;
    try {
      final j = jsonDecode(s) as Map<String, dynamic>;
      return EntitlementSnapshot(
        planCode: j['plan'] as String,
        planName: j['name'] as String,
        features: {for (final f in j['features'] as List) '$f'},
        fetchedAt: DateTime.parse(j['fetched'] as String),
        cacheUntil: DateTime.parse(j['until'] as String),
        subscriptionStatus: j['status'] as String?,
        periodEnd: j['period_end'] == null ? null : DateTime.tryParse(j['period_end'] as String),
        quotaBytes: (j['quota'] as num?)?.toInt() ?? 0,
        pilotUntil: j['pilot_until'] == null ? null : DateTime.tryParse(j['pilot_until'] as String),
      );
    } catch (_) {
      return null;
    }
  }
}

/// Központi jogosultság-feloldó: a felület CSAK ezekre épít (nincs szétszórt `plan == 'pro'`).
class Entitlements {
  const Entitlements(this.snapshot, this.signedIn, {DateTime Function()? clock}) : _clock = clock;
  final EntitlementSnapshot snapshot;
  final bool signedIn;
  final DateTime Function()? _clock;

  DateTime get _now => (_clock ?? DateTime.now)().toUtc();

  bool _can(String f) => signedIn && snapshot.has(f, _now);

  bool canUseCloudBackup() => _can('cloud_backup');
  bool canUseCloudRestore() => _can('cloud_restore') || _can('cloud_backup');
  bool canUseOnlineQuotes() => _can('online_quotes');
  bool canUseMultiDevice() => _can('multiple_devices');

  /// A gyorstár lejárt (sokáig nem volt internet): a felhős funkcióhoz újra kapcsolódni kell.
  bool get needsRefresh => signedIn && !snapshot.isFresh(_now);
}
