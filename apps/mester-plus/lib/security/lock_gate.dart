import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/tokens.dart';
import '../core/theme/typography.dart';
import 'pin_lock.dart';

final pinLockProvider = Provider((_) => PinLock());

/// A zár állapota: null = még nem tudjuk (betöltés), true = zárva.
class LockState extends Notifier<bool?> {
  static const Duration relockAfter = Duration(minutes: 2);
  DateTime? _hiddenAt;

  @override
  bool? build() {
    _load();
    return null;
  }

  Future<void> _load() async {
    final enabled = await ref.read(pinLockProvider).isEnabled();
    state = enabled;
  }

  void unlock() => state = false;

  /// Beállítások: PIN be/ki után az állapot frissítése.
  Future<void> refresh() => _load();

  void appHidden() => _hiddenAt = DateTime.now();

  Future<void> appResumed() async {
    final hidden = _hiddenAt;
    _hiddenAt = null;
    if (hidden == null || state == true) return;
    if (DateTime.now().difference(hidden) >= relockAfter) {
      if (await ref.read(pinLockProvider).isEnabled()) state = true;
    }
  }
}

final lockStateProvider = NotifierProvider<LockState, bool?>(LockState.new);

/// Az egész app elé kerül: figyeli a háttérbe kerülést, és zárva PIN-képernyőt mutat.
class LockGate extends ConsumerStatefulWidget {
  const LockGate({super.key, required this.child});
  final Widget child;

  @override
  ConsumerState<LockGate> createState() => _LockGateState();
}

class _LockGateState extends ConsumerState<LockGate> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final lock = ref.read(lockStateProvider.notifier);
    switch (state) {
      case AppLifecycleState.paused:
      case AppLifecycleState.hidden:
        lock.appHidden();
      case AppLifecycleState.resumed:
        lock.appResumed();
      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final locked = ref.watch(lockStateProvider);
    return Stack(
      fit: StackFit.expand,
      children: [
        // Zárva a tartalom nem kap érintést és nem látszik.
        ExcludeSemantics(excluding: locked != false, child: widget.child),
        if (locked != false)
          Positioned.fill(
            child: locked == null ? const ColoredBox(color: MpColors.canvas) : const _PinScreen(),
          ),
      ],
    );
  }
}

class _PinScreen extends ConsumerStatefulWidget {
  const _PinScreen();

  @override
  ConsumerState<_PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends ConsumerState<_PinScreen> {
  String _entered = '';
  int _failed = 0;
  DateTime? _lockedUntil;
  bool _checking = false;
  Timer? _tick;

  @override
  void dispose() {
    _tick?.cancel();
    super.dispose();
  }

  int get _waitSeconds {
    final until = _lockedUntil;
    if (until == null) return 0;
    final s = until.difference(DateTime.now()).inSeconds;
    return s > 0 ? s : 0;
  }

  Future<void> _press(String d) async {
    if (_checking || _waitSeconds > 0) return;
    HapticFeedback.selectionClick();
    setState(() => _entered += d);
    if (_entered.length >= PinLock.minLength) await _tryUnlock();
  }

  Future<void> _tryUnlock() async {
    if (_entered.length < PinLock.minLength) return;
    setState(() => _checking = true);
    final ok = await ref.read(pinLockProvider).verify(_entered);
    if (!mounted) return;
    if (ok) {
      ref.read(lockStateProvider.notifier).unlock();
      return;
    }
    _failed++;
    final wait = PinLock.lockoutSeconds(_failed);
    HapticFeedback.heavyImpact();
    setState(() {
      _entered = '';
      _checking = false;
      if (wait > 0) {
        _lockedUntil = DateTime.now().add(Duration(seconds: wait));
        _tick?.cancel();
        _tick = Timer.periodic(const Duration(seconds: 1), (_) {
          if (!mounted) return;
          setState(() {
            if (_waitSeconds == 0) _tick?.cancel();
          });
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final wait = _waitSeconds;
    final hint = wait > 0
        ? 'Túl sok hibás próbálkozás. Várj $wait másodpercet.'
        : _failed > 0
            ? 'Hibás PIN. Próbáld újra.'
            : 'Írd be a PIN-kódot.';
    return Material(
      color: MpColors.canvas,
      child: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 360),
            child: Padding(
              padding: const EdgeInsets.all(MpSpace.x6),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.lock_outline, size: 36, color: MpColors.brand),
                  const SizedBox(height: MpSpace.x3),
                  const Text('Mester+', style: MpText.title),
                  const SizedBox(height: MpSpace.x2),
                  Text(hint, style: MpText.body.copyWith(color: _failed > 0 ? MpColors.danger : MpColors.inkMuted),
                      textAlign: TextAlign.center),
                  const SizedBox(height: MpSpace.x6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      for (var i = 0; i < PinLock.maxLength; i++)
                        if (i < PinLock.minLength || i < _entered.length)
                          Container(
                            width: 14,
                            height: 14,
                            margin: const EdgeInsets.symmetric(horizontal: 6),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: i < _entered.length ? MpColors.brand : Colors.transparent,
                              border: Border.all(color: MpColors.brand, width: 1.5),
                            ),
                          ),
                    ],
                  ),
                  const SizedBox(height: MpSpace.x6),
                  for (final row in const [
                    ['1', '2', '3'],
                    ['4', '5', '6'],
                    ['7', '8', '9'],
                    ['', '0', '⌫'],
                  ])
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        for (final k in row)
                          Padding(
                            padding: const EdgeInsets.all(6),
                            child: SizedBox(
                              width: 72,
                              height: 60,
                              child: k.isEmpty
                                  ? null
                                  : k == '⌫'
                                      ? TextButton(
                                          onPressed: _entered.isEmpty
                                              ? null
                                              : () => setState(() => _entered = _entered.substring(0, _entered.length - 1)),
                                          child: const Icon(Icons.backspace_outlined, color: MpColors.inkSoft),
                                        )
                                      : OutlinedButton(
                                          onPressed: wait > 0 || _checking || _entered.length >= PinLock.maxLength
                                              ? null
                                              : () => _press(k),
                                          style: OutlinedButton.styleFrom(
                                            side: const BorderSide(color: MpColors.line),
                                            backgroundColor: MpColors.surface,
                                            shape: const RoundedRectangleBorder(borderRadius: MpRadius.mdAll),
                                          ),
                                          child: Text(k, style: MpText.moneyLarge.copyWith(fontSize: 20)),
                                        ),
                            ),
                          ),
                      ],
                    ),
                  const SizedBox(height: MpSpace.x4),
                  if (_entered.length >= PinLock.minLength && wait == 0)
                    TextButton(onPressed: _checking ? null : _tryUnlock, child: const Text('Belépés')),
                  const SizedBox(height: MpSpace.x6),
                  Text(
                    'Elfelejtett PIN esetén az app újratelepítése után a biztonsági mentésből tudod visszatölteni az adataidat.',
                    style: MpText.small.copyWith(fontSize: 12),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
