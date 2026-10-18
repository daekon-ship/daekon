import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../cloud/cloud_errors.dart';
import '../../cloud/cloud_providers.dart';
import '../../cloud/online_quotes.dart';
import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/widgets.dart';
import '../../data/db/app_database.dart';
import '../../data/repositories.dart';
import '../../domain/format.dart';

/// ONLINE AJÁNLAT (Pro) az ajánlat-előnézetben: állapot + küldés / frissítés / visszavonás.
/// A PDF-ajánlat ettől függetlenül működik; ha nincs Pro / fiók / internet, ez a kártya nem zavar.
class OnlineQuoteCard extends ConsumerStatefulWidget {
  const OnlineQuoteCard({super.key, required this.pc, required this.lines, required this.company});
  final ProjectWithCustomer pc;
  final List<QuoteLine> lines;
  final CompanyProfile company;

  @override
  ConsumerState<OnlineQuoteCard> createState() => _OnlineQuoteCardState();
}

class _OnlineQuoteCardState extends ConsumerState<OnlineQuoteCard> {
  OnlineQuoteStatus? _status;
  bool _busy = false;
  String? _note;

  String? get _qn => widget.pc.project.quoteNumber;

  @override
  void initState() {
    super.initState();
    _loadCachedThenRefresh();
  }

  Future<void> _loadCachedThenRefresh() async {
    final qn = _qn;
    if (qn == null) return;
    final svc = ref.read(onlineQuoteServiceProvider);
    final c = await svc.cached(qn);
    if (mounted && c != null) setState(() => _status = c);
    await _refresh(quiet: true);
  }

  Future<void> _refresh({bool quiet = false}) async {
    final qn = _qn;
    if (qn == null || !ref.read(entitlementsProvider).canUseOnlineQuotes()) return;
    try {
      final s = await ref.read(onlineQuoteServiceProvider).refresh(qn);
      if (mounted) {
        setState(() {
          _status = s ?? _status;
          _note = null;
        });
      }
    } on CloudException catch (e) {
      if (mounted) setState(() => _note = quiet && e.kind == CloudErrorKind.offline ? 'Offline – a legutóbbi ismert állapot.' : e.message);
    }
  }

  Future<void> _send() async {
    if (widget.company.companyName.trim().isEmpty) {
      showInfo(context, 'Az online ajánlathoz add meg a cégnevet a Beállításokban.');
      return;
    }
    final again = _status != null && _status!.state != OnlineQuoteState.revoked;
    if (again) {
      final ok = await confirmDialog(context,
          title: 'Új online változat?',
          message: 'Az eddigi link érvénytelen lesz, az ügyfél az új változatot látja.',
          confirmLabel: 'Új link',
          destructive: false);
      if (!ok || !mounted) return;
    }
    setState(() => _busy = true);
    try {
      final s = await ref.read(onlineQuoteServiceProvider).share(widget.pc, widget.lines, widget.company);
      if (!mounted) return;
      setState(() => _status = s);
      await _offerLink(s);
    } on CloudException catch (e) {
      if (mounted) showInfo(context, e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _offerLink(OnlineQuoteStatus s) async {
    final url = s.url;
    if (url == null) return;
    await Clipboard.setData(ClipboardData(text: url));
    if (mounted) showInfo(context, 'Online ajánlat elkészült – a link a vágólapon');
  }

  Future<void> _sendVia(String scheme) async {
    final url = _status?.url;
    if (url == null) return;
    final c = widget.pc.customer;
    final text = 'Kedves ${c.name}!\n\nAz árajánlatot itt tudod megnézni és elfogadni:\n$url\n\n${widget.company.companyName}';
    final uri = scheme == 'sms'
        ? Uri(scheme: 'sms', path: c.phone ?? '', queryParameters: {'body': text})
        : Uri(scheme: 'mailto', path: c.email ?? '', queryParameters: {'subject': 'Árajánlat – ${_qn ?? ''}', 'body': text});
    if (!await launchUrl(uri) && mounted) showInfo(context, 'Nem található alkalmazás a küldéshez. A link a vágólapra másolható.');
  }

  Future<void> _revoke() async {
    final s = _status;
    if (s == null) return;
    final ok = await confirmDialog(context, title: 'Online ajánlat visszavonása?', message: 'Az ügyfél linkje azonnal érvénytelen lesz.', confirmLabel: 'Visszavonás');
    if (!ok || !mounted) return;
    setState(() => _busy = true);
    try {
      final n = await ref.read(onlineQuoteServiceProvider).revoke(s);
      if (mounted) setState(() => _status = n);
    } on CloudException catch (e) {
      if (mounted) showInfo(context, e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  (Color, Color) _colors(OnlineQuoteState s) => switch (s) {
        OnlineQuoteState.accepted => (MpColors.successSoft, MpColors.success),
        OnlineQuoteState.declined => (MpColors.dangerSoft, MpColors.danger),
        OnlineQuoteState.opened => (MpColors.infoSoft, MpColors.info),
        OnlineQuoteState.expired || OnlineQuoteState.revoked => (MpColors.surfaceSunken, MpColors.inkSoft),
        _ => (MpColors.accentSoft, MpColors.onAccent),
      };

  @override
  Widget build(BuildContext context) {
    final ent = ref.watch(entitlementsProvider);
    if (!ent.canUseOnlineQuotes()) return const SizedBox.shrink();
    final s = _status;
    final state = s?.state ?? OnlineQuoteState.notSent;
    final (bg, fg) = _colors(state);
    final live = s != null && (state == OnlineQuoteState.available || state == OnlineQuoteState.opened);
    return Padding(
      padding: const EdgeInsets.only(top: MpSpace.x4),
      child: MpCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(children: [
            const Icon(Icons.public, color: MpColors.inkMuted),
            const SizedBox(width: MpSpace.x3),
            const Expanded(child: Text('Online ajánlat', style: MpText.bodyStrong)),
            Pill(state.label, bg: bg, fg: fg),
          ]),
          const SizedBox(height: MpSpace.x2),
          Text(
            _qn == null
                ? 'Előbb küldd ki az ajánlatot (ajánlatszám kell), utána online linket is kaphat az ügyfél.'
                : switch (state) {
                    OnlineQuoteState.notSent => 'Az ügyfél egy linken megnézheti és elfogadhatja az ajánlatot. A PDF ettől függetlenül megmarad.',
                    OnlineQuoteState.accepted => 'Az ügyfél elfogadta${s?.decidedAt == null ? '' : ': ${Fmt.date(s!.decidedAt!)}'}.',
                    OnlineQuoteState.declined => 'Az ügyfél nem kérte az ajánlatot.',
                    OnlineQuoteState.opened => 'Az ügyfél megnyitotta${s?.openedAt == null ? '' : ': ${Fmt.date(s!.openedAt!)}'}.',
                    OnlineQuoteState.expired => 'A link lejárt (az ajánlat érvényessége szerint).',
                    OnlineQuoteState.revoked => 'A link vissza van vonva.',
                    OnlineQuoteState.available => 'A link él, az ügyfél még nem nyitotta meg.',
                  },
            style: MpText.small,
          ),
          if (_note != null) Padding(padding: const EdgeInsets.only(top: MpSpace.x1), child: Text(_note!, style: MpText.small.copyWith(color: MpColors.warning))),
          if (_qn != null) ...[
            const SizedBox(height: MpSpace.x3),
            if (state == OnlineQuoteState.notSent || state == OnlineQuoteState.revoked || state == OnlineQuoteState.expired)
              MpButton(label: 'Online ajánlat küldése', icon: Icons.link, expand: true, loading: _busy, onPressed: _busy ? null : _send),
            if (live && s.url != null) ...[
              Wrap(spacing: MpSpace.x2, runSpacing: MpSpace.x2, children: [
                MpButton.secondary(label: 'Link másolása', icon: Icons.copy, onPressed: () => _offerLink(s)),
                if ((widget.pc.customer.phone ?? '').isNotEmpty) MpButton.secondary(label: 'SMS', icon: Icons.sms_outlined, onPressed: () => _sendVia('sms')),
                if ((widget.pc.customer.email ?? '').isNotEmpty) MpButton.secondary(label: 'E-mail', icon: Icons.mail_outline, onPressed: () => _sendVia('mailto')),
              ]),
              const SizedBox(height: MpSpace.x2),
            ],
            Row(children: [
              Expanded(child: MpButton.ghost(label: 'Állapot frissítése', icon: Icons.refresh, onPressed: _busy ? null : () => _refresh())),
              if (live) ...[
                const SizedBox(width: MpSpace.x2),
                Expanded(child: MpButton.ghost(label: 'Új változat', icon: Icons.autorenew, onPressed: _busy ? null : _send)),
              ],
            ]),
            if (live)
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton(onPressed: _busy ? null : _revoke, child: const Text('Link visszavonása', style: TextStyle(color: MpColors.danger))),
              ),
          ],
        ]),
      ),
    );
  }
}
