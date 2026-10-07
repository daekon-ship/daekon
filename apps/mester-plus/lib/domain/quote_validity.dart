/// Az ajánlat érvényessége naptári napokban (a kiállítás napja + N nap,
/// az utolsó nap még érvényes). Időzóna- és nyári időszámítás-biztos:
/// csak dátumokkal számol, órákkal nem.
library;

DateTime _day(DateTime d) => DateTime(d.year, d.month, d.day);

/// Az utolsó érvényes nap.
DateTime validUntil(DateTime issued, int validityDays) {
  final d = _day(issued);
  return DateTime(d.year, d.month, d.day + validityDays);
}

/// Hány nap van hátra a lejáratig (0 = ma az utolsó nap, negatív = lejárt).
int daysLeft(DateTime issued, int validityDays, DateTime now) {
  final end = validUntil(issued, validityDays);
  final today = _day(now);
  // A DST-váltás miatt a különbség 23 vagy 25 óra is lehet: kerekítünk.
  return (end.difference(today).inHours / 24).round();
}

enum ValidityState { valid, expiringSoon, expired }

/// Ennyi nappal a lejárat előtt jelezzük, hogy hamarosan lejár.
const int expiringSoonDays = 7;

ValidityState validityState(DateTime issued, int validityDays, DateTime now) {
  final left = daysLeft(issued, validityDays, now);
  if (left < 0) return ValidityState.expired;
  if (left <= expiringSoonDays) return ValidityState.expiringSoon;
  return ValidityState.valid;
}
