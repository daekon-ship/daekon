import 'package:flutter/foundation.dart';

/// A Mester+ Cloud elérése környezetenként.
///
/// - **production** (alap, kiadott app): `https://api.mesterplus.daekon.hu`.
/// - **staging / development**: CSAK fordításkor adható meg (`--dart-define=MP_API_BASE=<https-cím>`
///   és `--dart-define=MP_ENV=staging`), és csak nem-release buildben él (ld. docs/OPERATIONS.md).
///
/// Release buildben a cím kizárólag HTTPS lehet, és csak az engedélyezett éles hoszt –
/// minden más (helyi gép, IP-cím, teszt-szerver, titkosítatlan http) esetén a felhő kikapcsol, az app
/// offline működik tovább. A forráskódban teszt-szerver címe szándékosan NINCS (a CI a kész csomagot is ellenőrzi).
class CloudConfig {
  const CloudConfig({required this.baseUri, required this.enabled, required this.environment});

  static const String productionHost = 'api.mesterplus.daekon.hu';
  static const Set<String> releaseAllowedHosts = {productionHost};

  static const String _defineBase = String.fromEnvironment('MP_API_BASE');
  static const String _defineEnv = String.fromEnvironment('MP_ENV');

  final Uri baseUri;
  final bool enabled;
  final String environment;

  static CloudConfig fromEnvironment() => resolve(
        defineBase: _defineBase,
        defineEnv: _defineEnv,
        isRelease: kReleaseMode,
      );

  /// Tesztelhető feloldás (a release-szabály egységtesztben is igazolható).
  static CloudConfig resolve({required String defineBase, required String defineEnv, required bool isRelease}) {
    final base = Uri.tryParse(defineBase.isEmpty ? 'https://$productionHost' : defineBase);
    final env = defineEnv.isEmpty ? (defineBase.isEmpty ? 'production' : 'development') : defineEnv;
    if (base == null || !base.hasScheme || base.host.isEmpty) {
      return CloudConfig(baseUri: Uri.parse('https://$productionHost'), enabled: false, environment: env);
    }
    final secure = base.scheme == 'https';
    if (isRelease) {
      final ok = secure && releaseAllowedHosts.contains(base.host) && env == 'production' && !base.hasPort;
      return CloudConfig(baseUri: base, enabled: ok, environment: env);
    }
    // Fejlesztői build: HTTPS kötelező (a cleartext Androidon is tiltva), teszt-szerver megengedett.
    return CloudConfig(baseUri: base, enabled: secure, environment: env);
  }
}
