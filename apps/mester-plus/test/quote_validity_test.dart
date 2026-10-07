import 'package:flutter_test/flutter_test.dart';
import 'package:mester_plus/domain/quote_validity.dart';

void main() {
  test('utolsó érvényes nap: kiállítás + N nap', () {
    expect(validUntil(DateTime(2026, 10, 6, 17, 45), 30), DateTime(2026, 11, 5));
    expect(validUntil(DateTime(2026, 12, 20), 15), DateTime(2027, 1, 4));
  });

  test('hátralévő napok: ma = 0, tegnap lejárt = -1', () {
    final issued = DateTime(2026, 10, 1);
    expect(daysLeft(issued, 10, DateTime(2026, 10, 11, 23, 59)), 0);
    expect(daysLeft(issued, 10, DateTime(2026, 10, 12, 0, 1)), -1);
    expect(daysLeft(issued, 10, DateTime(2026, 10, 4, 8)), 7);
  });

  test('nyári időszámítás vége (október utolsó vasárnapja) nem csúsztat napot', () {
    // 2026. 10. 25-én Magyarországon 25 órás a nap.
    expect(daysLeft(DateTime(2026, 10, 20), 10, DateTime(2026, 10, 24)), 6);
    expect(daysLeft(DateTime(2026, 3, 25), 10, DateTime(2026, 3, 28)), 7);
  });

  test('állapot', () {
    final issued = DateTime(2026, 10, 1);
    expect(validityState(issued, 30, DateTime(2026, 10, 2)), ValidityState.valid);
    expect(validityState(issued, 30, DateTime(2026, 10, 25)), ValidityState.expiringSoon);
    expect(validityState(issued, 30, DateTime(2026, 10, 31)), ValidityState.expiringSoon); // utolsó nap
    expect(validityState(issued, 30, DateTime(2026, 11, 1)), ValidityState.expired);
  });
}
