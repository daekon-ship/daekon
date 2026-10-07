import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/backup.dart';
import '../../domain/enums.dart';
import '../../domain/errors.dart';
import '../../domain/format.dart';
import '../theme/tokens.dart';
import '../theme/typography.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Kártya
// ─────────────────────────────────────────────────────────────────────────────

class MpCard extends StatelessWidget {
  const MpCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(MpSpace.x4),
    this.onTap,
    this.color = MpColors.surface,
    this.borderColor = MpColors.line,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color color;
  final Color borderColor;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color,
        borderRadius: MpRadius.lgAll,
        border: Border.all(color: borderColor),
        boxShadow: MpShadow.card,
      ),
      child: Material(
        // Átlátszó, de lekerekített és vágó: a benne lévő koppintás-hullámok
        // (pl. listasorok) nem lógnak ki a kártya sarkain.
        color: Colors.transparent,
        shape: const RoundedRectangleBorder(borderRadius: MpRadius.lgAll),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Gombok
// ─────────────────────────────────────────────────────────────────────────────

enum MpButtonVariant { primary, secondary, ghost, danger }

class MpButton extends StatelessWidget {
  const MpButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.variant = MpButtonVariant.primary,
    this.expand = false,
    this.loading = false,
  });

  const MpButton.secondary({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.expand = false,
    this.loading = false,
  }) : variant = MpButtonVariant.secondary;

  const MpButton.ghost({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.expand = false,
    this.loading = false,
  }) : variant = MpButtonVariant.ghost;

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final MpButtonVariant variant;
  final bool expand;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, border) = switch (variant) {
      MpButtonVariant.primary => (MpColors.brand, MpColors.onBrand, MpColors.brand),
      MpButtonVariant.secondary => (MpColors.surface, MpColors.ink, MpColors.lineStrong),
      MpButtonVariant.ghost => (Colors.transparent, MpColors.brand, Colors.transparent),
      MpButtonVariant.danger => (MpColors.dangerSoft, MpColors.danger, MpColors.dangerSoft),
    };
    final enabled = onPressed != null && !loading;

    final content = Row(
      mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (loading)
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2, color: fg),
          )
        else if (icon != null)
          Icon(icon, size: 18, color: fg),
        if (loading || icon != null) const SizedBox(width: MpSpace.x2),
        Flexible(
          child: Text(
            label,
            overflow: TextOverflow.ellipsis,
            style: MpText.bodyStrong.copyWith(color: fg, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );

    return AnimatedOpacity(
      duration: MpDuration.fast,
      opacity: enabled ? 1 : 0.45,
      child: Material(
        color: bg,
        shape: RoundedRectangleBorder(
          borderRadius: MpRadius.mdAll,
          side: BorderSide(color: border),
        ),
        child: InkWell(
          borderRadius: MpRadius.mdAll,
          onTap: enabled ? onPressed : null,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 48),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: MpSpace.x5, vertical: MpSpace.x3),
              child: content,
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Szöveg-elemek
// ─────────────────────────────────────────────────────────────────────────────

class MoneyText extends StatelessWidget {
  const MoneyText(this.huf, {super.key, this.style = MpText.money, this.signed = false, this.color});

  final int huf;
  final TextStyle style;
  final bool signed;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Text(
      signed ? Fmt.hufSigned(huf) : Fmt.huf(huf),
      style: color == null ? style : style.copyWith(color: color),
      maxLines: 1,
      softWrap: false,
    );
  }
}

class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key, this.trailing});
  final String text;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: MpSpace.x6, bottom: MpSpace.x2),
      child: Row(
        children: [
          Expanded(child: Text(text.toUpperCase(), style: MpText.label)),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class KeyValueRow extends StatelessWidget {
  const KeyValueRow({super.key, required this.label, required this.value, this.emphasize = false});
  final String label;
  final Widget value;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.baseline,
        textBaseline: TextBaseline.alphabetic,
        children: [
          Expanded(
            child: Text(label, style: emphasize ? MpText.bodyStrong : MpText.body),
          ),
          const SizedBox(width: MpSpace.x3),
          value,
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Állapot-címke
// ─────────────────────────────────────────────────────────────────────────────

class StatusChip extends StatelessWidget {
  const StatusChip(this.status, {super.key});
  final ProjectStatus status;

  static (Color, Color) colorsFor(ProjectStatus s) => switch (s) {
        ProjectStatus.draft => (MpColors.surfaceSunken, MpColors.inkSoft),
        ProjectStatus.quoted => (MpColors.infoSoft, MpColors.info),
        ProjectStatus.accepted => (MpColors.successSoft, MpColors.success),
        ProjectStatus.inProgress => (MpColors.accentSoft, MpColors.warning),
        ProjectStatus.completed => (MpColors.successSoft, MpColors.success),
        ProjectStatus.lost => (MpColors.dangerSoft, MpColors.danger),
      };

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = colorsFor(status);
    return DecoratedBox(
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(MpRadius.pill)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(color: fg, shape: BoxShape.circle),
            ),
            const SizedBox(width: 6),
            Text(status.label, style: MpText.small.copyWith(color: fg, fontWeight: FontWeight.w600, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

class Pill extends StatelessWidget {
  const Pill(this.text, {super.key, this.bg = MpColors.surfaceSunken, this.fg = MpColors.inkSoft, this.icon});
  final String text;
  final Color bg;
  final Color fg;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(MpRadius.pill)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[Icon(icon, size: 14, color: fg), const SizedBox(width: 4)],
            Text(text, style: MpText.small.copyWith(color: fg, fontWeight: FontWeight.w600, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Üres állapot, aszinkron nézet
// ─────────────────────────────────────────────────────────────────────────────

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.action,
  });

  final IconData icon;
  final String title;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    // Görgethető: kis kijelzőn, nagy betűmérettel vagy nyitott billentyűzettel se lógjon ki.
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: MpSpace.x8, vertical: MpSpace.x10),
        child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(color: MpColors.accentSoft, borderRadius: MpRadius.lgAll),
            child: Icon(icon, size: 30, color: MpColors.warning),
          ),
          const SizedBox(height: MpSpace.x5),
          Text(title, style: MpText.heading, textAlign: TextAlign.center),
          const SizedBox(height: MpSpace.x2),
          Text(message, style: MpText.body, textAlign: TextAlign.center),
          if (action != null) ...[const SizedBox(height: MpSpace.x6), action!],
        ],
      ),
      ),
    );
  }
}

class AsyncView<T> extends StatelessWidget {
  const AsyncView({super.key, required this.value, required this.data});
  final AsyncValue<T> value;
  final Widget Function(T data) data;

  @override
  Widget build(BuildContext context) {
    return value.when(
      data: data,
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(MpSpace.x10),
          child: CircularProgressIndicator(strokeWidth: 2.4),
        ),
      ),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(MpSpace.x6),
          child: Text(friendlyError(e), style: MpText.body.copyWith(color: MpColors.danger)),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Oldalfejléc (nagy cím + alcím) — a fül-képernyők közös felső része
// ─────────────────────────────────────────────────────────────────────────────

class PageHeader extends StatelessWidget {
  const PageHeader({super.key, required this.title, this.subtitle, this.trailing});
  final String title;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x4, MpSpace.gutter, MpSpace.x2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: MpText.display),
                if (subtitle != null) ...[
                  const SizedBox(height: MpSpace.x1),
                  Text(subtitle!, style: MpText.body.copyWith(color: MpColors.inkMuted)),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Párbeszédek
// ─────────────────────────────────────────────────────────────────────────────

Future<bool> confirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Törlés',
  bool destructive = true,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Mégse')),
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(true),
          child: Text(
            confirmLabel,
            style: TextStyle(
              color: destructive ? MpColors.danger : MpColors.brand,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    ),
  );
  return result ?? false;
}

void showInfo(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

/// Felhasználónak megjeleníthető hibaszöveg. A saját, magyar nyelvű hibák
/// (bevitel, mentési fájl) változatlanul átmennek; minden más technikai hiba
/// (SQLite, fájlrendszer, plugin) helyett érthető mondat jelenik meg, a
/// részletek pedig a naplóba kerülnek — a felhasználó sosem lát nyers kivételt.
String friendlyError(Object e, [StackTrace? st]) {
  if (e is UserInputError) return e.message;
  if (e is BackupFormatException) return e.message;
  debugPrint('Mester+ hiba: $e');
  if (st != null) debugPrintStack(stackTrace: st);
  return 'Váratlan hiba történt. Próbáld újra. Ha ismét előfordul, indítsd újra az appot.';
}

/// Hiba közös kezelése mentési műveleteknél.
Future<bool> runGuarded(BuildContext context, Future<void> Function() action) async {
  try {
    await action();
    return true;
  } catch (e, st) {
    if (context.mounted) showInfo(context, friendlyError(e, st));
    return false;
  }
}
