import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mester_plus/core/widgets/forms.dart';
import 'package:mester_plus/domain/format.dart';

TextEditingValue _v(String text, int cursor) =>
    TextEditingValue(text: text, selection: TextSelection.collapsed(offset: cursor));

void main() {
  final f = HufInputFormatter();

  test('gépelés közben ezres tagolás, a kurzor a végén marad', () {
    final r = f.formatEditUpdate(_v('150 000', 7), _v('1500000', 7));
    expect(r.text, '1 500 000');
    expect(r.selection.baseOffset, 9);
  });

  test('beszúrás középre: a kurzor a beírt számjegy után', () {
    final r = f.formatEditUpdate(_v('150 000', 3), _v('1500 000', 4)); // "5" a "15" után? → 1 500 000
    expect(r.text, '1 500 000');
    expect(r.text.substring(0, r.selection.baseOffset).replaceAll(' ', ''), '1500');
  });

  test('visszatörlés a tagoló szóközön az előtte álló számjegyet törli', () {
    // "1 500" — a kurzor a szóköz után (2), backspace → a szóköz tűnne el
    final r = f.formatEditUpdate(_v('1 500', 2), _v('1500', 1));
    expect(r.text, '500');
    expect(r.selection.baseOffset, 0);
  });

  test('betű, tizedes és vezető nulla kiszűrve, max. 8 jegy', () {
    expect(f.formatEditUpdate(_v('', 0), _v('12a,5', 5)).text, '125');
    expect(f.formatEditUpdate(_v('', 0), _v('007', 3)).text, '7');
    expect(f.formatEditUpdate(_v('', 0), _v('123456789', 9)).text, '12 345 678');
  });

  test('a formázott érték visszaolvasható', () {
    final r = f.formatEditUpdate(_v('', 0), _v('99999999', 8));
    expect(Fmt.parseHuf(r.text), 99999999);
    expect(Fmt.hufInput(1500000), '1 500 000');
    expect(Fmt.parseHuf(Fmt.hufInput(1500000)), 1500000);
  });
}
