import 'dart:convert';

import 'package:drift/drift.dart';

import 'db/app_database.dart';
import 'repositories.dart';

/// Biztonsági mentés JSON-formátumban. Offline-first appnál ez az egyetlen
/// védelem telefoncsere / elvesztés ellen, ezért szigorú:
///  - visszaállításkor ELŐBB minden sort beolvas és ellenőriz, az adatbázishoz
///    csak hibátlan fájl után nyúl;
///  - a csere egyetlen tranzakció: hiba esetén a régi adat érintetlen marad;
///  - az idegen kulcsokat a visszaállított adatokon is ellenőrzi.
class BackupService {
  BackupService(this._db);
  final AppDatabase _db;

  static const String appId = 'mester_plus';
  static const int formatVersion = 2;

  static const _tables = ['customers', 'projects', 'surveyAreas', 'priceItems', 'quoteLines', 'companyProfiles'];
  // v2 formátumtól (opcionális régi mentésben):
  static const _tablesV2 = ['payments', 'expenses', 'workLogs', 'materialItems'];

  Future<String> exportJson({DateTime? now}) async {
    final data = <String, List<Map<String, dynamic>>>{
      'customers': [for (final r in await _db.select(_db.customers).get()) r.toJson()],
      'projects': [for (final r in await _db.select(_db.projects).get()) r.toJson()],
      'surveyAreas': [for (final r in await _db.select(_db.surveyAreas).get()) r.toJson()],
      'priceItems': [for (final r in await _db.select(_db.priceItems).get()) r.toJson()],
      'quoteLines': [for (final r in await _db.select(_db.quoteLines).get()) r.toJson()],
      'companyProfiles': [for (final r in await _db.select(_db.companyProfiles).get()) r.toJson()],
      'payments': [for (final r in await _db.select(_db.payments).get()) r.toJson()],
      'expenses': [for (final r in await _db.select(_db.expenses).get()) r.toJson()],
      'workLogs': [for (final r in await _db.select(_db.workLogs).get()) r.toJson()],
      'materialItems': [for (final r in await _db.select(_db.materialItems).get()) r.toJson()],
    };
    return const JsonEncoder.withIndent(' ').convert({
      'app': appId,
      'format': formatVersion,
      'schemaVersion': _db.schemaVersion,
      'exportedAt': (now ?? DateTime.now()).toIso8601String(),
      'tables': data,
    });
  }

  /// Fájlnév: mester_plus_mentes_2026-10-07.json
  static String fileName(DateTime d) =>
      'mester_plus_mentes_${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}.json';

  /// Beolvasás és teljes ellenőrzés adatbázis-írás NÉLKÜL.
  /// Hibás fájlnál [BackupFormatException]-t dob, érthető magyar üzenettel.
  ParsedBackup parse(String source) {
    final Object? root;
    try {
      root = jsonDecode(source);
    } on FormatException {
      throw const BackupFormatException('Ez a fájl nem Mester+ mentés.');
    }
    if (root is! Map<String, dynamic> || root['app'] != appId) {
      throw const BackupFormatException('Ez nem Mester+ biztonsági mentés.');
    }
    final format = root['format'];
    if (format is! int || format > formatVersion) {
      throw const BackupFormatException('A mentés egy újabb app-verzióval készült. Frissítsd az appot.');
    }
    final schema = root['schemaVersion'];
    if (schema is! int || schema > _db.schemaVersion) {
      throw const BackupFormatException('A mentés újabb adatbázis-szerkezetű. Frissítsd az appot.');
    }
    final tables = root['tables'];
    if (tables is! Map<String, dynamic>) {
      throw const BackupFormatException('Hiányzó adatok a mentésben.');
    }
    List<Map<String, dynamic>> rows(String name, {bool optional = false}) {
      final v = tables[name];
      if (v == null && optional) return const [];
      if (v is! List) throw BackupFormatException('Hiányzó tábla a mentésben: $name');
      return [
        for (final e in v)
          if (e is Map<String, dynamic>) e else throw BackupFormatException('Hibás sor a(z) $name táblában.'),
      ];
    }

    T each<T>(String table, Map<String, dynamic> json, T Function(Map<String, dynamic>) f) {
      try {
        return f(json);
      } catch (_) {
        throw BackupFormatException('Hibás vagy hiányos sor a(z) $table táblában (id: ${json['id']}).');
      }
    }

    for (final t in _tables) {
      rows(t); // minden kötelező tábla létezik és lista
    }
    for (final t in _tablesV2) {
      rows(t, optional: true);
    }
    final parsed = ParsedBackup(
      exportedAt: DateTime.tryParse('${root['exportedAt']}'),
      customers: [for (final j in rows('customers')) each('customers', j, Customer.fromJson)],
      // v2 (schema 2) mentésben még nincs ütemezés: null.
      projects: [for (final j in rows('projects')) each('projects', {'startDate': null, 'endDate': null, ...j}, Project.fromJson)],
      surveyAreas: [for (final j in rows('surveyAreas')) each('surveyAreas', j, SurveyArea.fromJson)],
      priceItems: [for (final j in rows('priceItems')) each('priceItems', j, PriceItem.fromJson)],
      quoteLines: [for (final j in rows('quoteLines')) each('quoteLines', j, QuoteLine.fromJson)],
      companyProfiles: [
        for (final j in rows('companyProfiles'))
          // v1 (schema 1) mentésben még nincs ajánlatszám-számláló: alapérték 0.
          each('companyProfiles', {'quoteSeqYear': 0, 'quoteSeq': 0, ...j}, CompanyProfile.fromJson),
      ],
      payments: [for (final j in rows('payments', optional: true)) each('payments', j, Payment.fromJson)],
      expenses: [for (final j in rows('expenses', optional: true)) each('expenses', j, Expense.fromJson)],
      workLogs: [for (final j in rows('workLogs', optional: true)) each('workLogs', j, WorkLog.fromJson)],
      materialItems: [for (final j in rows('materialItems', optional: true)) each('materialItems', j, MaterialItem.fromJson)],
    );
    _checkIntegrity(parsed);
    return parsed;
  }

  /// Hivatkozások ellenőrzése a fájlon belül (a DB FK-ja is véd, de így
  /// pontos hibaüzenetet adunk, és nem is kezdünk bele a cserébe).
  void _checkIntegrity(ParsedBackup b) {
    void unique(String table, Iterable<int> ids) {
      final seen = <int>{};
      for (final id in ids) {
        if (!seen.add(id)) throw BackupFormatException('Ismétlődő azonosító a(z) $table táblában: $id');
      }
    }

    unique('customers', b.customers.map((e) => e.id));
    unique('projects', b.projects.map((e) => e.id));
    unique('surveyAreas', b.surveyAreas.map((e) => e.id));
    unique('priceItems', b.priceItems.map((e) => e.id));
    unique('quoteLines', b.quoteLines.map((e) => e.id));

    final customerIds = {for (final c in b.customers) c.id};
    final projectIds = {for (final p in b.projects) p.id};
    final areaIds = {for (final a in b.surveyAreas) a.id};
    final priceIds = {for (final p in b.priceItems) p.id};
    for (final p in b.projects) {
      if (!customerIds.contains(p.customerId)) {
        throw BackupFormatException('A(z) „${p.title}” projekt ügyfele hiányzik a mentésből.');
      }
    }
    for (final a in b.surveyAreas) {
      if (!projectIds.contains(a.projectId)) throw const BackupFormatException('Árva helyiség a mentésben.');
    }
    for (final l in b.quoteLines) {
      if (!projectIds.contains(l.projectId)) throw const BackupFormatException('Árva munkatétel a mentésben.');
      if (l.areaId != null && !areaIds.contains(l.areaId)) {
        throw const BackupFormatException('Munkatétel nem létező helyiségre hivatkozik.');
      }
      if (l.priceItemId != null && !priceIds.contains(l.priceItemId)) {
        throw const BackupFormatException('Munkatétel nem létező árlista-tételre hivatkozik.');
      }
      if (l.quantityMilli <= 0 || l.laborUnitPriceHuf < 0 || l.materialUnitPriceHuf < 0) {
        throw const BackupFormatException('Érvénytelen mennyiség vagy ár a mentésben.');
      }
    }
    unique('payments', b.payments.map((e) => e.id));
    unique('expenses', b.expenses.map((e) => e.id));
    unique('workLogs', b.workLogs.map((e) => e.id));
    unique('materialItems', b.materialItems.map((e) => e.id));
    for (final x in b.payments) {
      if (!projectIds.contains(x.projectId)) throw const BackupFormatException('Árva befizetés a mentésben.');
      if (x.amountHuf <= 0 || x.amountHuf > FinanceRepository.maxAmountHuf) {
        throw const BackupFormatException('Érvénytelen befizetett összeg a mentésben.');
      }
    }
    for (final x in b.expenses) {
      if (!projectIds.contains(x.projectId)) throw const BackupFormatException('Árva kiadás a mentésben.');
      if (x.amountHuf <= 0 || x.amountHuf > FinanceRepository.maxAmountHuf) {
        throw const BackupFormatException('Érvénytelen kiadási összeg a mentésben.');
      }
    }
    for (final x in b.workLogs) {
      if (!projectIds.contains(x.projectId)) throw const BackupFormatException('Árva munkanapló-bejegyzés a mentésben.');
      if (x.minutes <= 0 || x.minutes > WorkLogRepository.maxMinutesPerEntry) {
        throw const BackupFormatException('Érvénytelen munkaidő a mentésben.');
      }
    }
    for (final x in b.materialItems) {
      if (!projectIds.contains(x.projectId)) throw const BackupFormatException('Árva anyaglista-tétel a mentésben.');
      if (x.quantityMilli <= 0) throw const BackupFormatException('Érvénytelen anyagmennyiség a mentésben.');
    }
    for (final p in b.projects) {
      if (p.startDate != null && p.endDate != null && p.endDate!.isBefore(p.startDate!)) {
        throw BackupFormatException('A(z) „${p.title}” projekt befejezése korábbi a kezdésnél.');
      }
    }
    final quoteNumbers = <String>{};
    for (final p in b.projects) {
      if (p.quoteNumber != null && !quoteNumbers.add(p.quoteNumber!)) {
        throw BackupFormatException('Ismétlődő ajánlatszám a mentésben: ${p.quoteNumber}');
      }
    }
  }

  /// A teljes adatbázis cseréje a mentés tartalmára, EGY tranzakcióban.
  Future<void> restore(ParsedBackup b) {
    return _db.transaction(() async {
      // Törlés a gyermekektől a szülők felé.
      await _db.delete(_db.payments).go();
      await _db.delete(_db.expenses).go();
      await _db.delete(_db.workLogs).go();
      await _db.delete(_db.materialItems).go();
      await _db.delete(_db.quoteLines).go();
      await _db.delete(_db.surveyAreas).go();
      await _db.delete(_db.projects).go();
      await _db.delete(_db.customers).go();
      await _db.delete(_db.priceItems).go();
      await _db.delete(_db.companyProfiles).go();

      await _db.batch((batch) {
        batch.insertAll(_db.customers, b.customers);
        batch.insertAll(_db.priceItems, b.priceItems);
        batch.insertAll(_db.projects, b.projects);
        batch.insertAll(_db.surveyAreas, b.surveyAreas);
        batch.insertAll(_db.quoteLines, b.quoteLines);
        batch.insertAll(_db.companyProfiles, b.companyProfiles);
        batch.insertAll(_db.payments, b.payments);
        batch.insertAll(_db.expenses, b.expenses);
        batch.insertAll(_db.workLogs, b.workLogs);
        batch.insertAll(_db.materialItems, b.materialItems);
      });
      // A cégprofil sora mindig létezzen (régi/hiányos mentésnél is).
      await _db.into(_db.companyProfiles).insert(
            const CompanyProfilesCompanion(id: Value(1)),
            mode: InsertMode.insertOrIgnore,
          );
    });
  }
}

class ParsedBackup {
  const ParsedBackup({
    required this.exportedAt,
    required this.customers,
    required this.projects,
    required this.surveyAreas,
    required this.priceItems,
    required this.quoteLines,
    required this.companyProfiles,
    this.payments = const [],
    this.expenses = const [],
    this.workLogs = const [],
    this.materialItems = const [],
  });

  final DateTime? exportedAt;
  final List<Customer> customers;
  final List<Project> projects;
  final List<SurveyArea> surveyAreas;
  final List<PriceItem> priceItems;
  final List<QuoteLine> quoteLines;
  final List<CompanyProfile> companyProfiles;
  final List<Payment> payments;
  final List<Expense> expenses;
  final List<WorkLog> workLogs;
  final List<MaterialItem> materialItems;
}

class BackupFormatException implements Exception {
  const BackupFormatException(this.message);
  final String message;

  @override
  String toString() => message;
}
