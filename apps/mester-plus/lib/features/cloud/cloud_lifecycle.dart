import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../cloud/cloud_providers.dart';

/// A felhő háttér-teendői az app életciklusához kötve – úgy, hogy a helyi működést SOHA ne lassítsák:
///  - indításkor csak a helyi (biztonságos tárolós) állapot töltődik be;
///  - a hálózati frissítés (fiók, jogosultság) és az automatikus mentés késleltetve, az első kép után fut;
///  - előtérbe kerüléskor ugyanez (legfeljebb 10 percenként);
///  - internet nélkül minden csendben kimarad, kivétel nem jut a felületre.
class CloudLifecycle extends ConsumerStatefulWidget {
  const CloudLifecycle({super.key, required this.child});
  final Widget child;

  @override
  ConsumerState<CloudLifecycle> createState() => _CloudLifecycleState();
}

class _CloudLifecycleState extends ConsumerState<CloudLifecycle> with WidgetsBindingObserver {
  Timer? _timer;
  DateTime? _lastSync;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        await ref.read(cloudSessionProvider).load();
        await ref.read(autoBackupProvider).load();
      } catch (_) {
        // a felhő-állapot betöltése nem akaszthatja meg az appot
      }
      _schedule(const Duration(seconds: 15));
    });
  }

  void _schedule(Duration delay) {
    _timer?.cancel();
    _timer = Timer(delay, _sync);
  }

  Future<void> _sync() async {
    final now = DateTime.now();
    if (_lastSync != null && now.difference(_lastSync!) < const Duration(minutes: 10)) return;
    _lastSync = now;
    try {
      final s = ref.read(cloudSessionProvider);
      if (!s.isSignedIn || !s.cloudEnabled) return;
      await s.refreshQuietly();
      await ref.read(autoBackupProvider).maybeRun();
    } catch (_) {
      // csendben: a következő előtérbe kerüléskor újra
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _schedule(const Duration(seconds: 5));
    } else if (state == AppLifecycleState.paused) {
      _timer?.cancel();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
