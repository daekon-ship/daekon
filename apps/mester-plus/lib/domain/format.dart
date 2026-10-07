import 'money.dart';

/// Magyar formázás és beviteli feldolgozás. Szándékosan intl nélkül, hogy
/// determinisztikus legyen és ne függjön a locale inicializálásától.
abstract final class Fmt {
  static const String _nbsp = '\u00A0';

  /// 1234567 → "1 234 567"
  static String groupThousands(int value) {
    final negative = value < 0;
    final digits = value.abs().toString();
    final buf = StringBuffer();
    for (var i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 == 0) buf.write(_nbsp);
      buf.write(digits[i]);
    }
    return negative ? '−$buf' : buf.toString();
  }

  /// 1234567 → "1 234 567 Ft"
  static String huf(int value) => '${groupThousands(value)}${_nbsp}Ft';

  /// Előjeles összeg kedvezményhez/felárhoz: "−12 000 Ft" / "+12 000 Ft".
  static String hufSigned(int value) => value > 0 ? '+${huf(value)}' : huf(value);

  /// 12500 (milli) → "12,5"; 3000 → "3"; 1234567 → "1 234,567"
  static String quantity(int milli) {
    final negative = milli < 0;
    final abs = milli.abs();
    final whole = abs ~/ quantityScale;
    final frac = abs % quantityScale;
    var s = groupThousands(whole);
    if (frac != 0) {
      var f = frac.toString().padLeft(3, '0');
      while (f.endsWith('0')) {
        f = f.substring(0, f.length - 1);
      }
      s = '$s,$f';
    }
    return negative ? '−$s' : s;
  }

  /// 2700 → "27%", 750 → "7,5%", 1225 → "12,25%"
  static String percentBp(int bp) {
    final whole = bp ~/ 100;
    final frac = bp % 100;
    if (frac == 0) return '$whole%';
    var f = frac.toString().padLeft(2, '0');
    if (f.endsWith('0')) f = f.substring(0, 1);
    return '$whole,$f%';
  }

  /// 2026. 10. 02.
  static String date(DateTime d) =>
      '${d.year}. ${d.month.toString().padLeft(2, '0')}. ${d.day.toString().padLeft(2, '0')}.';

  /// Magyar decimális bevitel → milli. Elfogad: "12", "12,5", "12.5",
  /// "1 234,25". Max 3 tizedes. Hibás bevitelnél null.
  static int? parseQuantityMilli(String input) => _parseScaled(input, 3, 6);

  /// Százalék bevitel → bázispont. "10" → 1000, "7,5" → 750. Max 2 tizedes.
  static int? parsePercentBp(String input) => _parseScaled(input, 2, 3);

  /// Egész forint bevitel. "12 500" → 12500. Tizedest nem fogad el.
  /// Felső korlát 99 999 999 Ft/egység, a mennyiség 999 999 — így a
  /// szorzat biztosan belefér a 64 bites egészbe.
  static int? parseHuf(String input) {
    final s = input.replaceAll(RegExp(r'[\s\u00A0]'), '').replaceAll('Ft', '');
    if (s.isEmpty) return null;
    if (!RegExp(r'^\d{1,8}$').hasMatch(s)) return null;
    return int.parse(s);
  }

  static int? _parseScaled(String input, int decimals, int maxWholeDigits) {
    final s = input.replaceAll(RegExp(r'[\s\u00A0]'), '').replaceAll('.', ',');
    if (s.isEmpty) return null;
    final m = RegExp('^(\\d{1,$maxWholeDigits})(?:,(\\d{1,$decimals}))?\$').firstMatch(s);
    if (m == null) return null;
    final whole = int.parse(m.group(1)!);
    final fracStr = (m.group(2) ?? '').padRight(decimals, '0');
    final frac = fracStr.isEmpty ? 0 : int.parse(fracStr);
    var scale = 1;
    for (var i = 0; i < decimals; i++) {
      scale *= 10;
    }
    return whole * scale + frac;
  }

  /// Bevitelhez visszaalakítás (szerkesztéskor a mezőbe): 12500 → "12,5".
  static String quantityInput(int milli) => quantity(milli).replaceAll(_nbsp, '');
  static String percentInput(int bp) => percentBp(bp).replaceAll('%', '');
  /// Szerkesztéshez: 1500000 → "1 500 000" (a HufInputFormatter formátumában).
  static String hufInput(int huf) => huf == 0 ? '' : groupThousands(huf).replaceAll(_nbsp, ' ');

  /// Magyar betűrend szerinti összehasonlítás (egyszerűsített, a kettős
  /// betűket nem kezeli külön). Az a/á, e/é, i/í, o/ó, u/ú elsődlegesen
  /// azonos; az ö/ő az o után, az ü/ű az u után külön betű. Kis- és nagybetű
  /// nem számít. Egyezésnél az ékezet nélküli áll elöl (Ede, Éde).
  /// Az SQLite NOCASE csak az angol ábécét ismeri, azzal az „Ádám” a „Zsolt”
  /// mögé kerülne.
  static int compareHu(String a, String b) {
    final p = _huKey(a, _huPrimary).compareTo(_huKey(b, _huPrimary));
    if (p != 0) return p;
    final s = _huKey(a, _huSecondary).compareTo(_huKey(b, _huSecondary));
    return s != 0 ? s : a.compareTo(b);
  }

  static const Map<String, String> _huPrimary = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'ö': 'o~', 'ő': 'o~', 'ü': 'u~', 'ű': 'u~',
  };
  static const Map<String, String> _huSecondary = {
    'á': 'a~', 'é': 'e~', 'í': 'i~', 'ó': 'o~', 'ú': 'u~',
    'ö': 'o~~', 'ő': 'o~~~', 'ü': 'u~~', 'ű': 'u~~~',
  };

  static String _huKey(String s, Map<String, String> map) {
    final b = StringBuffer();
    for (final ch in s.toLowerCase().split('')) {
      b.write(map[ch] ?? ch);
    }
    return b.toString();
  }
}
