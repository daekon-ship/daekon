import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:printing/printing.dart';

import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/widgets.dart';
import '../../data/db/app_database.dart';
import '../../data/providers.dart';
import '../../data/repositories.dart';
import '../../domain/enums.dart';
import '../../domain/format.dart';
import '../../domain/quote_calculator.dart';
import 'project_hub_screen.dart';
import 'quote_pdf.dart';

class QuotePreviewScreen extends ConsumerWidget {
  const QuotePreviewScreen({super.key, required this.projectId});
  final int projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final project = ref.watch(projectProvider(projectId));
    final lines = ref.watch(quoteLinesProvider(projectId)).valueOrNull;
    final company = ref.watch(companyProfileProvider).valueOrNull;

    return project.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator(strokeWidth: 2.4))),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Padding(padding: const EdgeInsets.all(MpSpace.x6), child: Text(friendlyError(e), style: MpText.body)),
        ),
      ),
      data: (pc) {
        if (pc == null) return const ProjectNotFound();
        if (lines == null || company == null) {
          return const Scaffold(body: Center(child: CircularProgressIndicator(strokeWidth: 2.4)));
        }
        final p = pc.project;
        // Az összesítő UGYANABBÓL a sorlistából készül, amit megjelenítünk —
        // így a tételek és a soronkénti összegek indexe sosem csúszhat el.
        final totals = totalsFor(p, lines);
        return Scaffold(
          backgroundColor: MpColors.surfaceSunken,
          appBar: AppBar(
            backgroundColor: MpColors.surfaceSunken,
            title: const Text('Árajánlat'),
            actions: [
              IconButton(
                tooltip: p.quoteNumber == null ? 'PDF megosztása (tervezet, szám nélkül)' : 'PDF megosztása',
                icon: const Icon(Icons.picture_as_pdf_outlined),
                onPressed: () => _sharePdf(context, pc, lines, company),
              ),
              IconButton(
                tooltip: 'Nyomtatás',
                icon: const Icon(Icons.print_outlined),
                onPressed: () => _printPdf(context, pc, lines, company),
              ),
              IconButton(
                tooltip: 'Másolás szövegként',
                icon: const Icon(Icons.copy_all_outlined),
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: quoteAsText(pc, lines, company)));
                  if (context.mounted) showInfo(context, 'Ajánlat vágólapra másolva');
                },
              ),
            ],
          ),
          bottomNavigationBar: _ActionBar(pc: pc, lines: lines, company: company, totals: totals),
          body: ListView(
            padding: const EdgeInsets.all(MpSpace.x4),
            children: [
              _Paper(pc: pc, lines: lines, totals: totals, company: company),
            ],
          ),
        );
      },
    );
  }
}

Future<Uint8List?> _buildPdf(
  BuildContext context,
  ProjectWithCustomer pc,
  List<QuoteLine> lines,
  CompanyProfile company, {
  bool companyChecked = false,
}) async {
  if (!companyChecked && !await _confirmCompany(context, company)) return null;
  try {
    final pdf = await QuotePdf.load();
    return await pdf.build(pc: pc, lines: lines, company: company);
  } catch (e) {
    if (context.mounted) showInfo(context, 'Nem sikerült a PDF elkészítése. ${friendlyError(e)}');
    return null;
  }
}

/// Üres cégnévnél rákérdez (a fejléc üres lenne). Igazat ad, ha mehet tovább.
Future<bool> _confirmCompany(BuildContext context, CompanyProfile company) async {
  if (company.companyName.trim().isEmpty) {
    final go = await confirmDialog(
      context,
      title: 'Hiányzó cégadatok',
      message: 'A cégnév nincs megadva a Beállításokban, így az ajánlat fejléce üres lesz. Folytatod?',
      confirmLabel: 'Folytatom',
      destructive: false,
    );
    return go;
  }
  return true;
}

Future<void> _sharePdf(
  BuildContext context,
  ProjectWithCustomer pc,
  List<QuoteLine> lines,
  CompanyProfile co, {
  bool companyChecked = false,
}) async {
  final bytes = await _buildPdf(context, pc, lines, co, companyChecked: companyChecked);
  if (bytes == null) return;
  try {
    await Printing.sharePdf(bytes: bytes, filename: QuotePdf.fileName(pc.project));
  } catch (e) {
    if (context.mounted) showInfo(context, 'A megosztás nem sikerült. ${friendlyError(e)}');
  }
}

Future<void> _printPdf(BuildContext context, ProjectWithCustomer pc, List<QuoteLine> lines, CompanyProfile co) async {
  final bytes = await _buildPdf(context, pc, lines, co);
  if (bytes == null) return;
  try {
    await Printing.layoutPdf(onLayout: (_) async => bytes, name: QuotePdf.fileName(pc.project));
  } catch (e) {
    if (context.mounted) showInfo(context, 'A nyomtatás nem sikerült. ${friendlyError(e)}');
  }
}

class _ActionBar extends ConsumerWidget {
  const _ActionBar({required this.pc, required this.lines, required this.company, required this.totals});
  final ProjectWithCustomer pc;
  final List<QuoteLine> lines;
  final CompanyProfile company;
  final QuoteTotals totals;

  /// Kiküldés egy lépésben: ajánlatszám kiosztása → a MÁR SZÁMOZOTT PDF megosztása.
  /// (Korábban a PDF-et ki lehetett küldeni „tervezet” felirattal, szám nélkül.)
  Future<void> _send(BuildContext context, WidgetRef ref) async {
    if (!totals.isComplete) {
      final go = await confirmDialog(
        context,
        title: 'Hiányos ajánlat',
        message: totals.lines.isEmpty
            ? 'Az ajánlatban nincs tétel.'
            : '${totals.unpricedLineCount} tételnél nincs ár. Így is elküldöd?',
        confirmLabel: 'Elküldöm',
        destructive: false,
      );
      if (!go || !context.mounted) return;
    }
    // A cégadatokat a szám kiosztása ELŐTT ellenőrizzük: ha itt megszakítja,
    // ne maradjon kiküldöttnek jelölt, de el nem küldött ajánlat.
    if (!await _confirmCompany(context, company) || !context.mounted) return;
    final repo = ref.read(projectRepoProvider);
    final ok = await runGuarded(context, () => repo.markQuoted(pc.project.id));
    if (!ok || !context.mounted) return;
    // A friss, már számozott projekttel készül a PDF.
    final fresh = await repo.watch(pc.project.id).first;
    if (fresh == null || !context.mounted) return;
    await _sharePdf(context, fresh, lines, company, companyChecked: true);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final project = pc.project;
    final sent = project.quoteNumber != null;
    return Container(
      decoration: const BoxDecoration(
        color: MpColors.surface,
        border: Border(top: BorderSide(color: MpColors.line)),
      ),
      padding: EdgeInsets.fromLTRB(
        MpSpace.gutter,
        MpSpace.x3,
        MpSpace.gutter,
        MpSpace.x3 + MediaQuery.paddingOf(context).bottom,
      ),
      child: sent
          ? Row(
              children: [
                const Icon(Icons.verified_outlined, color: MpColors.success),
                const SizedBox(width: MpSpace.x2),
                Expanded(
                  child: Text(
                    'Kiküldve: ${project.quoteNumber}\n${Fmt.date(project.quotedAt ?? project.updatedAt)}',
                    style: MpText.small.copyWith(color: MpColors.ink, fontWeight: FontWeight.w600),
                  ),
                ),
                MpButton.secondary(
                  label: 'Újraküldés',
                  icon: Icons.send_outlined,
                  onPressed: () => _sharePdf(context, pc, lines, company),
                ),
              ],
            )
          : MpButton(
              label: 'Ajánlat küldése PDF-ben',
              icon: Icons.send_outlined,
              expand: true,
              onPressed: () => _send(context, ref),
            ),
    );
  }
}

class _Paper extends StatelessWidget {
  const _Paper({required this.pc, required this.lines, required this.totals, required this.company});
  final ProjectWithCustomer pc;
  final List<QuoteLine> lines;
  final QuoteTotals totals;
  final CompanyProfile company;

  @override
  Widget build(BuildContext context) {
    final p = pc.project;
    final c = pc.customer;
    final issued = p.quotedAt ?? DateTime.now();
    final valid = issued.add(Duration(days: p.validityDays));
    const small = TextStyle(fontFamily: MpFonts.sans, fontSize: 11.5, height: 1.45, color: MpColors.inkSoft);

    return Container(
      padding: const EdgeInsets.all(MpSpace.x5),
      decoration: const BoxDecoration(
        color: MpColors.surface,
        borderRadius: MpRadius.smAll,
        boxShadow: MpShadow.raised,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Fejléc
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      company.companyName.isEmpty ? 'Cégnév nincs megadva' : company.companyName,
                      style: MpText.heading.copyWith(
                        color: company.companyName.isEmpty ? MpColors.danger : MpColors.ink,
                      ),
                    ),
                    for (final s in [company.address, company.taxNumber.isEmpty ? '' : 'Adószám: ${company.taxNumber}', company.phone, company.email])
                      if (s.isNotEmpty) Text(s, style: small),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('ÁRAJÁNLAT', style: MpText.label.copyWith(color: MpColors.brand, fontSize: 13)),
                  const SizedBox(height: 2),
                  Text(p.quoteNumber ?? 'tervezet', style: MpText.mono.copyWith(color: MpColors.ink)),
                ],
              ),
            ],
          ),
          const SizedBox(height: MpSpace.x4),
          Container(height: 2, color: MpColors.brand),
          const SizedBox(height: MpSpace.x4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('MEGRENDELŐ', style: MpText.label.copyWith(fontSize: 10)),
                    const SizedBox(height: 2),
                    Text(c.name, style: MpText.bodyStrong.copyWith(fontSize: 13.5)),
                    for (final s in [c.address, c.taxNumber == null ? null : 'Adószám: ${c.taxNumber}', c.phone, c.email])
                      if (s != null) Text(s, style: small),
                  ],
                ),
              ),
              const SizedBox(width: MpSpace.x3),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('Kelt: ${Fmt.date(issued)}', style: small),
                  Text('Érvényes: ${Fmt.date(valid)}', style: small),
                ],
              ),
            ],
          ),
          const SizedBox(height: MpSpace.x4),
          Text(p.title, style: MpText.heading.copyWith(fontSize: 15)),
          if (p.siteAddress != null) Text('Helyszín: ${p.siteAddress}', style: small),
          const SizedBox(height: MpSpace.x4),

          // Tételek — két soros elrendezés: telefonon is olvasható, nem tördel számot.
          Container(
            padding: const EdgeInsets.only(bottom: 6),
            decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: MpColors.lineStrong))),
            child: Row(
              children: [
                Expanded(child: Text('TÉTEL', style: MpText.label.copyWith(fontSize: 10))),
                Text('ÖSSZEG', style: MpText.label.copyWith(fontSize: 10)),
              ],
            ),
          ),
          for (var i = 0; i < lines.length; i++) _lineRow(i + 1, lines[i], totals.lines[i], shaded: i.isOdd),
          const SizedBox(height: MpSpace.x4),

          // Összesítő
          Align(
            alignment: Alignment.centerRight,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 280),
              child: Column(
                children: [
                  _sum('Munkadíj', Fmt.huf(totals.laborSubtotalHuf)),
                  _sum('Anyagköltség', Fmt.huf(totals.materialSubtotalHuf)),
                  if (totals.adjustmentType != AdjustmentType.none)
                    _sum('${totals.adjustmentType.label} ${Fmt.percentBp(totals.adjustmentPercentBp)}',
                        Fmt.hufSigned(totals.adjustmentHuf)),
                  _sum('Nettó', Fmt.huf(totals.netTotalHuf), bold: true),
                  _sum('ÁFA ${VatRates.label(totals.vatRateBp)}', Fmt.huf(totals.vatHuf)),
                  const Divider(),
                  _sum('Fizetendő (bruttó)', Fmt.huf(totals.grossTotalHuf), big: true),
                ],
              ),
            ),
          ),
          if (totals.vatRateBp == 0) ...[
            const SizedBox(height: MpSpace.x3),
            const Text('Az ajánlat ÁFA-t nem tartalmaz (adómentes vagy fordított adózás alá eső).', style: small),
          ],
          if (company.quoteFooter.trim().isNotEmpty) ...[
            const SizedBox(height: MpSpace.x5),
            Text(company.quoteFooter.trim(), style: small),
          ],
          const SizedBox(height: MpSpace.x8),
          Row(
            children: [
              const Spacer(),
              SizedBox(
                width: 160,
                child: Column(
                  children: [
                    Container(height: 1, color: MpColors.lineStrong),
                    const SizedBox(height: 4),
                    Text(company.ownerName.isEmpty ? 'aláírás' : company.ownerName, style: small),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _lineRow(int no, QuoteLine l, LineTotals lt, {required bool shaded}) {
    const mono = TextStyle(
      fontFamily: MpFonts.mono,
      fontSize: 11,
      color: MpColors.inkSoft,
      fontFeatures: [FontFeature.tabularFigures()],
    );
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 4),
      decoration: BoxDecoration(color: shaded ? MpColors.canvas : null),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('$no. ${l.name}',
              style: const TextStyle(fontFamily: MpFonts.sans, fontSize: 12.5, height: 1.35, color: MpColors.ink)),
          const SizedBox(height: 2),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Text(
                  '${Fmt.quantity(l.quantityMilli)} ${l.unit.symbol} × '
                  '${Fmt.huf(l.laborUnitPriceHuf + l.materialUnitPriceHuf)}',
                  style: mono,
                ),
              ),
              const SizedBox(width: MpSpace.x2),
              Text(Fmt.huf(lt.totalHuf), style: mono.copyWith(color: MpColors.ink, fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _sum(String label, String value, {bool bold = false, bool big = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontFamily: MpFonts.sans,
                fontSize: big ? 13.5 : 12,
                fontWeight: bold || big ? FontWeight.w600 : FontWeight.w400,
                color: MpColors.ink,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontFamily: MpFonts.mono,
              fontSize: big ? 15 : 12,
              fontWeight: bold || big ? FontWeight.w600 : FontWeight.w400,
              color: MpColors.ink,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }
}

/// Egyszerű szöveges ajánlat (üzenetben, e-mailben küldhető).
String quoteAsText(ProjectWithCustomer pc, List<QuoteLine> lines, CompanyProfile co) {
  final p = pc.project;
  final t = totalsFor(p, lines);
  final b = StringBuffer()
    ..writeln('ÁRAJÁNLAT${p.quoteNumber == null ? '' : ' – ${p.quoteNumber}'}')
    ..writeln(co.companyName)
    ..writeln()
    ..writeln('Megrendelő: ${pc.customer.name}')
    ..writeln('Munka: ${p.title}');
  if (p.siteAddress != null) b.writeln('Helyszín: ${p.siteAddress}');
  b.writeln();
  for (var i = 0; i < lines.length; i++) {
    final l = lines[i];
    b.writeln('• ${l.name}: ${Fmt.quantity(l.quantityMilli)} ${l.unit.symbol} = ${Fmt.huf(t.lines[i].totalHuf)}');
  }
  b
    ..writeln()
    ..writeln('Részösszeg: ${Fmt.huf(t.subtotalHuf)}');
  if (t.adjustmentType != AdjustmentType.none) {
    b.writeln('${t.adjustmentType.label} (${Fmt.percentBp(t.adjustmentPercentBp)}): ${Fmt.hufSigned(t.adjustmentHuf)}');
  }
  b
    ..writeln('Nettó: ${Fmt.huf(t.netTotalHuf)}')
    ..writeln('ÁFA (${VatRates.label(t.vatRateBp)}): ${Fmt.huf(t.vatHuf)}')
    ..writeln('Fizetendő: ${Fmt.huf(t.grossTotalHuf)}')
    ..writeln()
    ..writeln('Az ajánlat ${p.validityDays} napig érvényes.');
  if (co.quoteFooter.trim().isNotEmpty) b.writeln(co.quoteFooter.trim());
  return b.toString().replaceAll(' ', ' ');
}
