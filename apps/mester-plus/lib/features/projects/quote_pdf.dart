import 'dart:typed_data';

import 'package:flutter/services.dart' show rootBundle;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import '../../data/db/app_database.dart';
import '../../data/providers.dart';
import '../../data/repositories.dart';
import '../../domain/enums.dart';
import '../../domain/format.dart';

/// Az ajánlat PDF-je. Ugyanazt a [totalsFor] számítást használja, mint a
/// képernyő — a PDF és az előnézet összegei definíció szerint azonosak.
///
/// A betűk az app saját IBM Plex fontjai (beágyazva), így az ő/ű és a
/// nem-törő szóköz minden PDF-olvasóban helyesen jelenik meg.
class QuotePdf {
  QuotePdf._(this._sans, this._sansBold, this._mono, this._monoBold);

  final pw.Font _sans;
  final pw.Font _sansBold;
  final pw.Font _mono;
  final pw.Font _monoBold;

  static Future<QuotePdf> load() async {
    Future<pw.Font> f(String path) async => pw.Font.ttf(await rootBundle.load(path));
    return QuotePdf._(
      await f('assets/fonts/IBMPlexSans-Regular.ttf'),
      await f('assets/fonts/IBMPlexSans-SemiBold.ttf'),
      await f('assets/fonts/IBMPlexMono-Regular.ttf'),
      await f('assets/fonts/IBMPlexMono-SemiBold.ttf'),
    );
  }

  // Színek a design tokenekből (PDF-színre átírva).
  static const _ink = PdfColor.fromInt(0xFF151A23);
  static const _inkSoft = PdfColor.fromInt(0xFF3A4150);
  static const _muted = PdfColor.fromInt(0xFF6B7180);
  static const _brand = PdfColor.fromInt(0xFF1B2B44);
  static const _line = PdfColor.fromInt(0xFFCBC5B8);
  static const _shade = PdfColor.fromInt(0xFFF5F3EE);

  /// Fájlnév: `Arajanlat_MP-2026-001.pdf`, tervezetnél `Arajanlat_tervezet_(projektnév).pdf`.
  static String fileName(Project p) {
    final base = p.quoteNumber ?? 'tervezet_${p.title}';
    final safe = base
        .replaceAll(RegExp('[áÁ]'), 'a')
        .replaceAll(RegExp('[éÉ]'), 'e')
        .replaceAll(RegExp('[íÍ]'), 'i')
        .replaceAll(RegExp('[óÓöÖőŐ]'), 'o')
        .replaceAll(RegExp('[úÚüÜűŰ]'), 'u')
        .replaceAll(RegExp(r'[^A-Za-z0-9\-_]+'), '_');
    final trimmed = safe.length > 60 ? safe.substring(0, 60) : safe;
    return 'Arajanlat_$trimmed.pdf';
  }

  Future<Uint8List> build({
    required ProjectWithCustomer pc,
    required List<QuoteLine> lines,
    required CompanyProfile company,
  }) {
    final p = pc.project;
    final c = pc.customer;
    final t = totalsFor(p, lines);
    final issued = p.quotedAt ?? DateTime.now();
    final valid = issued.add(Duration(days: p.validityDays));

    pw.TextStyle sans(double size, {bool bold = false, PdfColor color = _ink}) =>
        pw.TextStyle(font: bold ? _sansBold : _sans, fontSize: size, color: color, lineSpacing: 1.5);
    pw.TextStyle mono(double size, {bool bold = false, PdfColor color = _ink}) =>
        pw.TextStyle(font: bold ? _monoBold : _mono, fontSize: size, color: color);

    pw.Widget infoLines(List<String?> items) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            for (final s in items)
              if (s != null && s.trim().isNotEmpty) pw.Text(s, style: sans(8.5, color: _inkSoft)),
          ],
        );

    pw.Widget sumRow(String label, String value, {bool strong = false}) => pw.Padding(
          padding: const pw.EdgeInsets.symmetric(vertical: 2),
          child: pw.Row(
            children: [
              pw.Expanded(child: pw.Text(label, style: sans(strong ? 10 : 9, bold: strong))),
              pw.Text(value, style: mono(strong ? 10.5 : 9, bold: strong)),
            ],
          ),
        );

    final doc = pw.Document(
      title: p.quoteNumber == null ? 'Árajánlat (tervezet)' : 'Árajánlat ${p.quoteNumber}',
      author: company.companyName,
      creator: 'Mester+',
    );

    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.fromLTRB(40, 40, 40, 36),
        footer: (ctx) => pw.Container(
          alignment: pw.Alignment.centerRight,
          margin: const pw.EdgeInsets.only(top: 12),
          child: pw.Text(
            '${p.quoteNumber ?? 'Tervezet'} · ${ctx.pageNumber}/${ctx.pagesCount}. oldal',
            style: sans(7.5, color: _muted),
          ),
        ),
        build: (ctx) => [
          // Fejléc
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Expanded(
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(company.companyName.isEmpty ? '' : company.companyName, style: sans(13, bold: true)),
                    pw.SizedBox(height: 2),
                    infoLines([
                      company.address,
                      company.taxNumber.isEmpty ? null : 'Adószám: ${company.taxNumber}',
                      company.phone,
                      company.email,
                    ]),
                  ],
                ),
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text('ÁRAJÁNLAT', style: sans(12, bold: true, color: _brand)),
                  pw.SizedBox(height: 2),
                  pw.Text(p.quoteNumber ?? 'tervezet', style: mono(9.5)),
                ],
              ),
            ],
          ),
          pw.SizedBox(height: 10),
          pw.Container(height: 1.5, color: _brand),
          pw.SizedBox(height: 12),

          // Megrendelő + dátumok
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Expanded(
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('MEGRENDELŐ', style: sans(7, bold: true, color: _muted)),
                    pw.SizedBox(height: 2),
                    pw.Text(c.name, style: sans(10.5, bold: true)),
                    infoLines([
                      c.address,
                      c.taxNumber == null ? null : 'Adószám: ${c.taxNumber}',
                      c.phone,
                      c.email,
                    ]),
                  ],
                ),
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text('Kelt: ${Fmt.date(issued)}', style: sans(8.5, color: _inkSoft)),
                  pw.Text('Érvényes: ${Fmt.date(valid)}', style: sans(8.5, color: _inkSoft)),
                ],
              ),
            ],
          ),
          pw.SizedBox(height: 14),
          pw.Text(p.title, style: sans(11.5, bold: true)),
          if (p.siteAddress != null) pw.Text('Helyszín: ${p.siteAddress}', style: sans(8.5, color: _inkSoft)),
          pw.SizedBox(height: 10),

          // Tételek
          pw.Table(
            columnWidths: const {
              0: pw.FixedColumnWidth(22),
              1: pw.FlexColumnWidth(5),
              2: pw.FlexColumnWidth(2.2),
              3: pw.FlexColumnWidth(2.6),
              4: pw.FlexColumnWidth(2.8),
            },
            border: const pw.TableBorder(
              horizontalInside: pw.BorderSide(color: _line, width: 0.4),
              bottom: pw.BorderSide(color: _line, width: 0.4),
            ),
            children: [
              pw.TableRow(
                decoration: const pw.BoxDecoration(border: pw.Border(bottom: pw.BorderSide(color: _ink, width: 0.8))),
                children: [
                  for (final (h, right) in const [
                    ('#', false),
                    ('Megnevezés', false),
                    ('Mennyiség', true),
                    ('Egységár', true),
                    ('Összeg', true),
                  ])
                    pw.Padding(
                      padding: const pw.EdgeInsets.symmetric(vertical: 5, horizontal: 3),
                      child: pw.Text(h,
                          style: sans(7.5, bold: true, color: _muted),
                          textAlign: right ? pw.TextAlign.right : pw.TextAlign.left),
                    ),
                ],
              ),
              for (var i = 0; i < lines.length; i++)
                pw.TableRow(
                  decoration: i.isOdd ? const pw.BoxDecoration(color: _shade) : null,
                  children: [
                    _cell('${i + 1}', mono(8.5, color: _muted)),
                    _cell(lines[i].name, sans(9)),
                    _cell('${Fmt.quantity(lines[i].quantityMilli)} ${lines[i].unit.symbol}', mono(8.5),
                        right: true),
                    _cell(Fmt.huf(lines[i].laborUnitPriceHuf + lines[i].materialUnitPriceHuf), mono(8.5),
                        right: true),
                    _cell(Fmt.huf(t.lines[i].totalHuf), mono(8.5, bold: true), right: true),
                  ],
                ),
            ],
          ),
          pw.SizedBox(height: 12),

          // Összesítő
          pw.Align(
            alignment: pw.Alignment.centerRight,
            child: pw.SizedBox(
              width: 230,
              child: pw.Column(
                children: [
                  sumRow('Munkadíj', Fmt.huf(t.laborSubtotalHuf)),
                  sumRow('Anyagköltség', Fmt.huf(t.materialSubtotalHuf)),
                  if (t.adjustmentType != AdjustmentType.none)
                    sumRow('${t.adjustmentType.label} (${Fmt.percentBp(t.adjustmentPercentBp)})',
                        Fmt.hufSigned(t.adjustmentHuf)),
                  sumRow('Nettó összesen', Fmt.huf(t.netTotalHuf), strong: true),
                  sumRow('ÁFA (${VatRates.label(t.vatRateBp)})', Fmt.huf(t.vatHuf)),
                  pw.Divider(color: _ink, thickness: 0.8, height: 8),
                  sumRow('Fizetendő (bruttó)', Fmt.huf(t.grossTotalHuf), strong: true),
                ],
              ),
            ),
          ),
          if (t.vatRateBp == 0) ...[
            pw.SizedBox(height: 8),
            pw.Text('Az ajánlat ÁFA-t nem tartalmaz (adómentes vagy fordított adózás alá eső).',
                style: sans(8, color: _inkSoft)),
          ],
          if (company.quoteFooter.trim().isNotEmpty) ...[
            pw.SizedBox(height: 16),
            pw.Text(company.quoteFooter.trim(), style: sans(8.5, color: _inkSoft)),
          ],
          pw.SizedBox(height: 36),
          pw.Align(
            alignment: pw.Alignment.centerRight,
            child: pw.SizedBox(
              width: 170,
              child: pw.Column(
                children: [
                  pw.Container(height: 0.6, color: _line),
                  pw.SizedBox(height: 3),
                  pw.Text(company.ownerName.isEmpty ? 'aláírás' : company.ownerName,
                      style: sans(8.5, color: _inkSoft)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
    return doc.save();
  }

  pw.Widget _cell(String text, pw.TextStyle style, {bool right = false}) => pw.Padding(
        padding: const pw.EdgeInsets.symmetric(vertical: 5, horizontal: 3),
        child: pw.Text(text, style: style, textAlign: right ? pw.TextAlign.right : pw.TextAlign.left),
      );
}
