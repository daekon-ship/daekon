/// A felhő-műveletek hibái – a felhasználó MINDIG érthető magyar mondatot lát,
/// soha nem SocketException-t, HTTP-kódot, SQL-t vagy stack trace-t.
enum CloudErrorKind {
  /// Nincs internetkapcsolat (a telefon nem ér ki).
  offline,

  /// A szerver nem válaszol / karbantartás / időtúllépés.
  serverUnavailable,

  /// Lejárt vagy visszavont bejelentkezés.
  sessionExpired,

  /// A funkcióhoz Mester+ Pro kell.
  notPro,

  /// Túl sok kérés.
  rateLimited,

  /// A szerver érthető okkal elutasította (a szerver magyar üzenetével).
  api,

  /// A felhő ki van kapcsolva ebben a buildben.
  disabled,
}

class CloudException implements Exception {
  const CloudException(this.kind, this.message, {this.code, this.status});

  final CloudErrorKind kind;
  final String message;

  /// A szerver gépi hibakódja (pl. QUOTA_EXCEEDED) – csak logikához, nem megjelenítésre.
  final String? code;
  final int? status;

  static const offlineMessage = 'Nincs internetkapcsolat. A helyi adataid megvannak, a felhő-művelet később újrapróbálható.';
  static const unavailableMessage = 'A Mester+ szerver most nem érhető el. Próbáld újra később.';
  static const sessionMessage = 'A bejelentkezésed lejárt. Jelentkezz be újra a Mester+ fiókodba.';
  static const notProMessage = 'Ehhez a funkcióhoz Mester+ Pro szükséges.';
  static const rateMessage = 'Túl sok próbálkozás. Próbáld újra kicsit később.';
  static const disabledMessage = 'A felhős funkciók ebben a verzióban nem érhetők el.';
  static const genericMessage = 'A felhő-művelet nem sikerült. Próbáld újra később.';

  @override
  String toString() => message;
}
