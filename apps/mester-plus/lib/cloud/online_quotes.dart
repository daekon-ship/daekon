import 'dart:convert';

import '../data/db/app_database.dart';
import '../data/providers.dart';
import '../data/repositories.dart';
import '../domain/enums.dart';
import '../domain/quote_calculator.dart';
import '../domain/quote_validity.dart';
import 'cloud_session.dart';
import 'secure_kv.dart';

/// Az app által mutatott online-ajánlat állapot.
enum OnlineQuoteState {
  notSent('Nem küldött'),
  available('Elérhető'),
  opened('Megnyitva'),
  accepted('Elfogadva'),
  declined('Elutasítva'),
  expired('Lejárt'),
  revoked('Visszavonva');

  const OnlineQuoteState(this.label);
  final String label;
}

class OnlineQuoteStatus {
  const OnlineQuoteStatus({required this.id, required this.quoteNumber, required this.version, required this.state,
      this.url, this.openedAt, this.decidedAt, this.validUntil, this.checkedAt});
  final String id;
  final String quoteNumber;
  final int version;
  final OnlineQuoteState state;
  final String? url;
  final DateTime? openedAt;
  final DateTime? decidedAt;
  final String? validUntil;
  final DateTime? checkedAt;

  static OnlineQuoteState stateOf(Map j) => switch ('${j['status']}') {
        'ACCEPTED' => OnlineQuoteState.accepted,
        'DECLINED' => OnlineQuoteState.declined,
        'EXPIRED' => OnlineQuoteState.expired,
        'REVOKED' => OnlineQuoteState.revoked,
        _ => j['opened'] == true ? OnlineQuoteState.opened : OnlineQuoteState.available,
      };

  factory OnlineQuoteStatus.fromServer(Map j, {String? url, DateTime? now}) => OnlineQuoteStatus(
        id: '${j['id']}',
        quoteNumber: '${j['quote_number']}',
        version: (j['quote_version'] as num?)?.toInt() ?? 1,
        state: stateOf(j),
        url: url ?? (j['url'] is String ? j['url'] as String : null),
        openedAt: DateTime.tryParse('${j['first_opened_at']}')?.toLocal(),
        decidedAt: DateTime.tryParse('${j['decided_at']}')?.toLocal(),
        validUntil: j['valid_until'] as String?,
        checkedAt: now,
      );

  Map<String, Object?> toJson() => {
        'id': id, 'qn': quoteNumber, 'v': version, 's': state.name, 'url': url,
        'o': openedAt?.toIso8601String(), 'd': decidedAt?.toIso8601String(), 'vu': validUntil, 'c': checkedAt?.toIso8601String(),
      };

  static OnlineQuoteStatus? fromJson(Map j) {
    try {
      return OnlineQuoteStatus(
        id: j['id'] as String,
        quoteNumber: j['qn'] as String,
        version: (j['v'] as num).toInt(),
        state: OnlineQuoteState.values.byName(j['s'] as String),
        url: j['url'] as String?,
        openedAt: j['o'] == null ? null : DateTime.tryParse(j['o'] as String),
        decidedAt: j['d'] == null ? null : DateTime.tryParse(j['d'] as String),
        validUntil: j['vu'] as String?,
        checkedAt: j['c'] == null ? null : DateTime.tryParse(j['c'] as String),
      );
    } catch (_) {
      return null;
    }
  }
}

/// ONLINE AJÁNLAT: megváltoztathatatlan pillanatkép a szerverre + publikus link az ügyfélnek.
/// A PDF-ajánlat változatlanul megmarad; ez egy plusz küldési mód.
class OnlineQuoteService {
  OnlineQuoteService({required CloudSession session, required KeyValueStore store, DateTime Function()? clock})
      : _session = session,
        _kv = store,
        _clock = clock ?? DateTime.now;

  final CloudSession _session;
  final KeyValueStore _kv;
  final DateTime Function() _clock;

  static String _ymd(DateTime d) => '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  /// A pillanatkép CSAK az ajánlathoz szükséges adatot tartalmazza (nem az ügyféladatbázist):
  /// az ügyfél neve igen, telefonja / e-mailje / megjegyzése nem. Az összegek a közös
  /// [QuoteCalculator]-ból jönnek – ugyanaz, amit az app és a PDF mutat; a szerver újraszámolja.
  static Map<String, Object?> buildPayload(ProjectWithCustomer pc, List<QuoteLine> lines, CompanyProfile company) {
    final p = pc.project;
    if (p.quoteNumber == null) throw StateError('Az ajánlatnak még nincs száma.');
    final issued = p.quotedAt ?? DateTime.now();
    final totals = totalsFor(p, lines);
    return {
      'snapshot': {
        'schema': 1,
        'quote_number': p.quoteNumber,
        'quote_version': 1,
        'quoted_at': _ymd(issued),
        'valid_until': _ymd(validUntil(issued, p.validityDays)),
        'seller': {
          'company_name': company.companyName.trim(),
          'owner_name': company.ownerName.trim(),
          'address': company.address.trim(),
          'tax_number': company.taxNumber.trim(),
          'phone': company.phone.trim(),
          'email': company.email.trim(),
        },
        'customer': {'name': pc.customer.name.trim()},
        'project': {'title': p.title.trim(), 'site_address': (p.siteAddress ?? '').trim()},
        'lines': [
          for (final l in lines)
            {
              'name': l.name,
              'unit': l.unit.symbol,
              'quantity_milli': l.quantityMilli,
              'labor_unit_price_huf': l.laborUnitPriceHuf,
              'material_unit_price_huf': l.materialUnitPriceHuf,
            },
        ],
        'adjustment': {'type': p.adjustmentType.name, 'percent_bp': p.adjustmentType == AdjustmentType.none ? 0 : p.adjustmentPercentBp},
        'vat_rate_bp': p.vatRateBp,
        'footer': company.quoteFooter.trim(),
      },
      'totals': totalsJson(totals),
    };
  }

  static Map<String, Object?> totalsJson(QuoteTotals t) => {
        'labor_subtotal_huf': t.laborSubtotalHuf,
        'material_subtotal_huf': t.materialSubtotalHuf,
        'adjustment_huf': t.adjustmentHuf,
        'net_total_huf': t.netTotalHuf,
        'vat_huf': t.vatHuf,
        'gross_total_huf': t.grossTotalHuf,
        'lines': [for (final l in t.lines) {'total_huf': l.totalHuf}],
      };

  Future<OnlineQuoteStatus> share(ProjectWithCustomer pc, List<QuoteLine> lines, CompanyProfile company) async {
    final api = _session.api;
    final r = await api.postJson('/api/v1/quotes', buildPayload(pc, lines, company), idempotencyKey: api.newIdempotencyKey());
    final s = OnlineQuoteStatus.fromServer(r, now: _clock());
    await _save(s);
    return s;
  }

  /// Friss állapot a szerverről (app indításkor / húzásra). Offline: a legutóbbi ismert állapot.
  Future<OnlineQuoteStatus?> refresh(String quoteNumber) async {
    final r = await _session.api.getJson('/api/v1/quotes', query: {'quote_number': quoteNumber});
    final list = (r['quotes'] as List? ?? const []).whereType<Map>().toList();
    if (list.isEmpty) return null;
    final prev = await cached(quoteNumber);
    final latest = list.first;
    final s = OnlineQuoteStatus.fromServer(latest, url: prev?.id == '${latest['id']}' ? prev?.url : null, now: _clock());
    await _save(s);
    return s;
  }

  Future<OnlineQuoteStatus> revoke(OnlineQuoteStatus s) async {
    if (!RegExp(r'^[0-9a-z]{26}$').hasMatch(s.id)) throw ArgumentError.value(s.id, 'id');
    final r = await _session.api.postJson('/api/v1/quotes/${s.id}/revoke', const {});
    final n = OnlineQuoteStatus.fromServer(r, url: null, now: _clock());
    await _save(n);
    return n;
  }

  Future<Map<String, OnlineQuoteStatus>> _all() async {
    try {
      final j = jsonDecode(await _kv.read(CloudKeys.quoteLinks) ?? '{}') as Map<String, dynamic>;
      return {for (final e in j.entries) if (OnlineQuoteStatus.fromJson(e.value as Map) case final s?) e.key: s};
    } catch (_) {
      return {};
    }
  }

  Future<OnlineQuoteStatus?> cached(String quoteNumber) async => (await _all())[quoteNumber];

  Future<void> _save(OnlineQuoteStatus s) async {
    final all = await _all();
    all[s.quoteNumber] = s;
    // Legfeljebb 300 ajánlat állapota (a legrégebbiek kiesnek).
    final keys = all.keys.toList();
    if (keys.length > 300) {
      for (final k in keys.take(keys.length - 300)) {
        all.remove(k);
      }
    }
    await _kv.write(CloudKeys.quoteLinks, jsonEncode({for (final e in all.entries) e.key: e.value.toJson()}));
  }
}
