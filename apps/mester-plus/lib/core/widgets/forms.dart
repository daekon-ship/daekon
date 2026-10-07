import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../domain/format.dart';
import '../theme/tokens.dart';
import '../theme/typography.dart';

/// Címkés beviteli mező: a címke a mező FELETT áll (nem lebegő), mert
/// munkaterületen, kesztyűben, napfényben ez olvashatóbb.
class MpField extends StatelessWidget {
  const MpField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.validator,
    this.keyboardType,
    this.textInputAction = TextInputAction.next,
    this.maxLines = 1,
    this.suffixText,
    this.autofocus = false,
    this.inputFormatters,
    this.textCapitalization = TextCapitalization.sentences,
    this.onChanged,
    this.helper,
    this.monospace = false,
    this.maxLength,
    this.obscure = false,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final TextInputAction textInputAction;
  final int maxLines;
  final String? suffixText;
  final bool autofocus;
  final List<TextInputFormatter>? inputFormatters;
  final TextCapitalization textCapitalization;
  final ValueChanged<String>? onChanged;
  final String? helper;
  final bool monospace;

  /// Karakterkorlát (az adatbázis-oszlop hosszával összhangban). Számláló nélkül.
  final int? maxLength;

  /// Rejtett bevitel (PIN).
  final bool obscure;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: MpSpace.x4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: MpText.small.copyWith(color: MpColors.inkSoft, fontWeight: FontWeight.w500)),
          const SizedBox(height: 6),
          TextFormField(
            controller: controller,
            validator: validator,
            keyboardType: keyboardType,
            textInputAction: maxLines > 1 ? TextInputAction.newline : textInputAction,
            maxLines: obscure ? 1 : maxLines,
            minLines: 1,
            obscureText: obscure,
            enableSuggestions: !obscure,
            autocorrect: !obscure,
            autofocus: autofocus,
            inputFormatters: [
              ...?inputFormatters,
              if (maxLength != null) LengthLimitingTextInputFormatter(maxLength),
            ],
            textCapitalization: textCapitalization,
            onChanged: onChanged,
            style: monospace ? MpText.money : MpText.bodyStrong.copyWith(fontWeight: FontWeight.w400),
            decoration: InputDecoration(
              hintText: hint,
              suffixText: suffixText,
              suffixStyle: MpText.small,
              helperText: helper,
              helperStyle: MpText.small.copyWith(fontSize: 12),
              helperMaxLines: 2,
            ),
          ),
        ],
      ),
    );
  }
}

/// Csak számjegyek, szóköz, vessző, pont — mennyiséghez/százalékhoz.
final decimalInputFormatters = <TextInputFormatter>[
  FilteringTextInputFormatter.allow(RegExp(r'[0-9,.\s]')),
];

/// Forint-mező: csak számjegy, legfeljebb 8 jegy, gépelés közben ezres tagolással.
final hufInputFormatters = <TextInputFormatter>[HufInputFormatter()];

/// „1500000” → „1 500 000” gépelés közben. A kurzor a beírt számjegyhez
/// képest ugyanott marad (a szóközök beszúrása nem ugratja el).
class HufInputFormatter extends TextInputFormatter {
  static const int maxDigits = 8;

  static int _digitCount(String s) => s.codeUnits.where((c) => c >= 0x30 && c <= 0x39).length;

  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    var cursor = newValue.selection.baseOffset < 0 ? newValue.text.length : newValue.selection.baseOffset;
    // Visszatörlés egy tagoló szóközön: a szóköz törlése önmagában semmit nem
    // változtatna, ezért az előtte álló számjegyet töröljük — ahogy a felhasználó várja.
    if (newValue.text.length == oldValue.text.length - 1 &&
        _digitCount(newValue.text) == _digitCount(oldValue.text) &&
        cursor > 0) {
      final t = newValue.text;
      var i = cursor - 1;
      while (i >= 0 && (t.codeUnitAt(i) < 0x30 || t.codeUnitAt(i) > 0x39)) {
        i--;
      }
      if (i >= 0) {
        newValue = TextEditingValue(
          text: t.substring(0, i) + t.substring(i + 1),
          selection: TextSelection.collapsed(offset: i),
        );
        cursor = i;
      }
    }
    var digitsBeforeCursor = 0;
    final digits = StringBuffer();
    for (var i = 0; i < newValue.text.length; i++) {
      final c = newValue.text.codeUnitAt(i);
      if (c >= 0x30 && c <= 0x39) {
        if (digits.length >= maxDigits) continue;
        digits.writeCharCode(c);
        if (i < cursor) digitsBeforeCursor++;
      }
    }
    // Vezető nullák nélkül (de egyetlen „0” maradhat).
    final raw = digits.toString().replaceFirst(RegExp(r'^0+(?=\d)'), '');
    final removedZeros = digits.length - raw.length;
    digitsBeforeCursor = (digitsBeforeCursor - removedZeros).clamp(0, raw.length);

    final out = StringBuffer();
    var newCursor = 0;
    for (var i = 0; i < raw.length; i++) {
      if (i > 0 && (raw.length - i) % 3 == 0) out.write(' ');
      out.write(raw[i]);
      if (i + 1 == digitsBeforeCursor) newCursor = out.length;
    }
    if (digitsBeforeCursor == 0) newCursor = 0;
    final text = out.toString();
    return TextEditingValue(text: text, selection: TextSelection.collapsed(offset: newCursor.clamp(0, text.length)));
  }
}

const decimalKeyboard = TextInputType.numberWithOptions(decimal: true);
const integerKeyboard = TextInputType.number;

String? requiredText(String? v) =>
    (v == null || v.trim().isEmpty) ? 'Kötelező mező' : null;

/// Egységes alsó lap (bottom sheet) űrlapokhoz: billentyűzet fölé tolja magát.
Future<T?> showMpSheet<T>(BuildContext context, {required String title, required Widget child}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    // Véletlen mellé-koppintás ne dobja el a begépelt adatot: csak a
    // bezárás gombbal vagy mentéssel zárul.
    isDismissible: false,
    enableDrag: false,
    showDragHandle: false,
    builder: (ctx) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(MpSpace.gutter, 0, MpSpace.gutter, MpSpace.x6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: MpSpace.x3),
              child: Row(
                children: [
                  Expanded(child: Text(title, style: MpText.title)),
                  IconButton(
                    tooltip: 'Bezárás mentés nélkül',
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: MpSpace.x3),
            child,
          ],
        ),
      ),
    ),
  );
}

/// Nem mentett módosítás esetén visszalépés előtt rákérdez — ne vesszen el a
/// begépelt adat egy véletlen vissza-gombtól.
class UnsavedGuard extends StatelessWidget {
  const UnsavedGuard({super.key, required this.dirty, required this.child});
  final bool dirty;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !dirty,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final leave = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Elveted a módosításokat?'),
            content: const Text('A begépelt adatok nincsenek elmentve.'),
            actions: [
              TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Maradok')),
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                child: const Text('Elvetés', style: TextStyle(color: MpColors.danger, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        );
        if ((leave ?? false) && context.mounted) Navigator.of(context).pop();
      },
      child: child,
    );
  }
}

/// Dátumválasztó mező: koppintásra naptár, magyar formátumban mutatja az értéket.
class MpDateField extends StatelessWidget {
  const MpDateField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.allowClear = false,
    this.firstDate,
    this.lastDate,
  });

  final String label;
  final DateTime? value;
  final ValueChanged<DateTime?> onChanged;
  final bool allowClear;
  final DateTime? firstDate;
  final DateTime? lastDate;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    return Padding(
      padding: const EdgeInsets.only(bottom: MpSpace.x4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: MpText.small.copyWith(color: MpColors.inkSoft, fontWeight: FontWeight.w500)),
          const SizedBox(height: 6),
          InkWell(
            borderRadius: MpRadius.mdAll,
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: value ?? now,
                firstDate: firstDate ?? DateTime(now.year - 5),
                lastDate: lastDate ?? DateTime(now.year + 5),
                locale: const Locale('hu', 'HU'),
              );
              if (picked != null) onChanged(DateTime(picked.year, picked.month, picked.day));
            },
            child: InputDecorator(
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.event_outlined, size: 20),
                suffixIcon: allowClear && value != null
                    ? IconButton(
                        tooltip: 'Törlés',
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () => onChanged(null),
                      )
                    : null,
              ),
              child: Text(
                value == null ? 'Válassz napot' : Fmt.date(value!),
                style: value == null ? MpText.body.copyWith(color: MpColors.inkFaint) : MpText.money,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
