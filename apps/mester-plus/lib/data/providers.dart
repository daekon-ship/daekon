import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/enums.dart';
import '../domain/quote_calculator.dart';
import '../domain/quote_validity.dart';
import 'backup.dart';
import 'db/app_database.dart';
import 'repositories.dart';

// ── Infrastruktúra ──────────────────────────────────────────────────────────

final databaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});

final customerRepoProvider = Provider((ref) => CustomerRepository(ref.watch(databaseProvider)));
final projectRepoProvider = Provider((ref) => ProjectRepository(ref.watch(databaseProvider)));
final priceListRepoProvider = Provider((ref) => PriceListRepository(ref.watch(databaseProvider)));
final surveyRepoProvider = Provider(
  (ref) => SurveyRepository(ref.watch(databaseProvider), ref.watch(projectRepoProvider)),
);
final quoteLineRepoProvider = Provider(
  (ref) => QuoteLineRepository(
    ref.watch(databaseProvider),
    ref.watch(projectRepoProvider),
    ref.watch(priceListRepoProvider),
  ),
);
final companyRepoProvider = Provider((ref) => CompanyRepository(ref.watch(databaseProvider)));
final backupServiceProvider = Provider((ref) => BackupService(ref.watch(databaseProvider)));

/// Visszaállítás után nő: a szerkesztés alatt álló űrlapok (pl. Beállítások)
/// ezzel a kulccsal újraépülnek, így nem írják vissza a régi adatot.
final restoreEpochProvider = StateProvider<int>((ref) => 0);

// ── Adatfolyamok ─────────────────────────────────────────────────────────────

final customersProvider = StreamProvider<List<Customer>>(
  (ref) => ref.watch(customerRepoProvider).watchAll(),
);

final customerProvider = StreamProvider.autoDispose.family<Customer?, int>(
  (ref, id) => ref.watch(customerRepoProvider).watch(id),
);

final customerProjectsProvider = StreamProvider.autoDispose.family<List<Project>, int>(
  (ref, id) => ref.watch(projectRepoProvider).watchForCustomer(id),
);

final projectsProvider = StreamProvider<List<ProjectWithCustomer>>(
  (ref) => ref.watch(projectRepoProvider).watchAll(),
);

final projectProvider = StreamProvider.autoDispose.family<ProjectWithCustomer?, int>(
  (ref, id) => ref.watch(projectRepoProvider).watch(id),
);

final surveyAreasProvider = StreamProvider.autoDispose.family<List<SurveyArea>, int>(
  (ref, projectId) => ref.watch(surveyRepoProvider).watchForProject(projectId),
);

final quoteLinesProvider = StreamProvider.autoDispose.family<List<QuoteLine>, int>(
  (ref, projectId) => ref.watch(quoteLineRepoProvider).watchForProject(projectId),
);

final allQuoteLinesProvider = StreamProvider<List<QuoteLine>>(
  (ref) => ref.watch(quoteLineRepoProvider).watchAll(),
);

final priceItemsProvider = StreamProvider<List<PriceItem>>(
  (ref) => ref.watch(priceListRepoProvider).watchActive(),
);

final priceListItemProvider = StreamProvider.autoDispose.family<PriceItem?, int>(
  (ref, id) => ref.watch(priceListRepoProvider).watch(id),
);

final companyProfileProvider = StreamProvider<CompanyProfile>(
  (ref) => ref.watch(companyRepoProvider).watch(),
);

// ── Számított értékek (mind a QuoteCalculator-on át) ────────────────────────

CalcLine toCalcLine(QuoteLine l) => CalcLine(
      quantityMilli: l.quantityMilli,
      laborUnitPriceHuf: l.laborUnitPriceHuf,
      materialUnitPriceHuf: l.materialUnitPriceHuf,
    );

QuoteTotals totalsFor(Project p, List<QuoteLine> lines) => QuoteCalculator.calculate(
      lines: [for (final l in lines) toCalcLine(l)],
      adjustmentType: p.adjustmentType,
      adjustmentPercentBp: p.adjustmentPercentBp,
      vatRateBp: p.vatRateBp,
    );

/// Egy projekt teljes kalkulációja (kedvezmény/felár + ÁFA benne).
final projectTotalsProvider = Provider.autoDispose.family<AsyncValue<QuoteTotals>, int>((ref, projectId) {
  final project = ref.watch(projectProvider(projectId));
  final lines = ref.watch(quoteLinesProvider(projectId));
  if (project case AsyncError(:final error, :final stackTrace)) {
    return AsyncError(error, stackTrace);
  }
  if (lines case AsyncError(:final error, :final stackTrace)) {
    return AsyncError(error, stackTrace);
  }
  if (!project.hasValue || !lines.hasValue) return const AsyncLoading();
  final p = project.requireValue;
  // Törölt projekt: üres összesítő, nem végtelen töltés.
  if (p == null) return const AsyncData(QuoteTotals.empty);
  return AsyncData(totalsFor(p.project, lines.requireValue));
});

/// Figyelmet igénylő projekt az áttekintésen.
enum AttentionKind { expired, expiringSoon, unpriced }

class AttentionItem {
  const AttentionItem(this.item, this.kind, this.value);
  final ProjectWithCustomer item;
  final AttentionKind kind;

  /// expired/expiringSoon: hátralévő napok (negatív = ennyi napja lejárt);
  /// unpriced: ár nélküli tételek száma.
  final int value;
}

class DashboardStats {
  const DashboardStats({
    required this.activeProjects,
    required this.draftCount,
    required this.quotedCount,
    required this.pipelineGrossHuf,
    required this.wonGrossHuf,
    required this.grossByProject,
    required this.attention,
  });

  final int activeProjects;
  final int draftCount;
  final int quotedCount;

  /// Nyitott ajánlatok (piszkozat + kiküldött) bruttó értéke —
  /// projektenként a saját kedvezményével/felárával és ÁFA-jával.
  final int pipelineGrossHuf;

  /// Elfogadott / folyamatban / befejezett munkák bruttó értéke.
  final int wonGrossHuf;
  final Map<int, int> grossByProject;

  /// Teendők: lejárt / hamarosan lejáró ajánlatok, ár nélküli tételek.
  /// Sürgősség szerint rendezve (lejárt elöl).
  final List<AttentionItem> attention;
}

final dashboardStatsProvider = Provider<AsyncValue<DashboardStats>>((ref) {
  final projects = ref.watch(projectsProvider);
  final lines = ref.watch(allQuoteLinesProvider);
  if (projects case AsyncError(:final error, :final stackTrace)) {
    return AsyncError(error, stackTrace);
  }
  if (lines case AsyncError(:final error, :final stackTrace)) {
    return AsyncError(error, stackTrace);
  }
  final ps = projects.valueOrNull;
  final ls = lines.valueOrNull;
  if (ps == null || ls == null) return const AsyncLoading();

  final byProject = <int, List<QuoteLine>>{};
  for (final l in ls) {
    (byProject[l.projectId] ??= []).add(l);
  }

  final now = DateTime.now();
  var pipeline = 0;
  var won = 0;
  var active = 0;
  var drafts = 0;
  var quoted = 0;
  final gross = <int, int>{};
  final attention = <AttentionItem>[];
  for (final pc in ps) {
    final p = pc.project;
    final QuoteTotals t;
    try {
      t = totalsFor(p, byProject[p.id] ?? const []);
    } catch (_) {
      // Egy hibás (pl. tartományon kívüli) projekt ne döntse le az egész áttekintést.
      continue;
    }
    gross[p.id] = t.grossTotalHuf;
    if (p.status.isActive) active++;
    if (p.status == ProjectStatus.draft) drafts++;
    if (p.status == ProjectStatus.quoted) quoted++;
    if (p.status.isPipeline) pipeline += t.grossTotalHuf;
    if (p.status.isWon) won += t.grossTotalHuf;

    if (p.status == ProjectStatus.quoted && p.quotedAt != null) {
      final left = daysLeft(p.quotedAt!, p.validityDays, now);
      if (left < 0) {
        attention.add(AttentionItem(pc, AttentionKind.expired, left));
      } else if (left <= expiringSoonDays) {
        attention.add(AttentionItem(pc, AttentionKind.expiringSoon, left));
      }
    }
    if (p.status.isPipeline && t.unpricedLineCount > 0) {
      attention.add(AttentionItem(pc, AttentionKind.unpriced, t.unpricedLineCount));
    }
  }
  attention.sort((a, b) {
    final k = a.kind.index.compareTo(b.kind.index);
    return k != 0 ? k : a.value.compareTo(b.value);
  });

  return AsyncData(DashboardStats(
    activeProjects: active,
    draftCount: drafts,
    quotedCount: quoted,
    pipelineGrossHuf: pipeline,
    wonGrossHuf: won,
    grossByProject: gross,
    attention: List.unmodifiable(attention),
  ));
});
