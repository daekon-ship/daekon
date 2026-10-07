import 'package:drift/drift.dart';

import '../domain/enums.dart';
import '../domain/errors.dart';
import '../domain/format.dart';
import '../domain/survey_geometry.dart';
import 'db/app_database.dart';

class AreaUpdateResult {
  const AreaUpdateResult({required this.updatedLines, required this.manualLines});

  /// Automatikusan az új méretre frissített tételek.
  final int updatedLines;

  /// Helyiséghez kötött, de kézi mennyiségű tételek — ezeket érdemes átnézni.
  final int manualLines;
}

class ProjectWithCustomer {
  const ProjectWithCustomer(this.project, this.customer);
  final Project project;
  final Customer customer;
}

/// Üres / csak szóközös szöveget null-ra normalizál (opcionális mezőkhöz).
String? _clean(String? s) {
  final t = s?.trim();
  return (t == null || t.isEmpty) ? null : t;
}

// ─────────────────────────────────────────────────────────────────────────────

class CustomerRepository {
  CustomerRepository(this._db);
  final AppDatabase _db;

  /// Magyar betűrend szerint (Á az A után, nem a Z után).
  Stream<List<Customer>> watchAll() => _db
      .select(_db.customers)
      .watch()
      .map((list) => [...list]..sort((a, b) => Fmt.compareHu(a.name, b.name)));

  Stream<Customer?> watch(int id) =>
      (_db.select(_db.customers)..where((t) => t.id.equals(id))).watchSingleOrNull();

  Future<int> create({
    required String name,
    String? phone,
    String? email,
    String? address,
    String? taxNumber,
    String? notes,
  }) {
    return _db.into(_db.customers).insert(CustomersCompanion.insert(
          name: name.trim(),
          phone: Value(_clean(phone)),
          email: Value(_clean(email)),
          address: Value(_clean(address)),
          taxNumber: Value(_clean(taxNumber)),
          notes: Value(_clean(notes)),
        ));
  }

  Future<void> update(
    int id, {
    required String name,
    String? phone,
    String? email,
    String? address,
    String? taxNumber,
    String? notes,
  }) async {
    await (_db.update(_db.customers)..where((t) => t.id.equals(id))).write(CustomersCompanion(
      name: Value(name.trim()),
      phone: Value(_clean(phone)),
      email: Value(_clean(email)),
      address: Value(_clean(address)),
      taxNumber: Value(_clean(taxNumber)),
      notes: Value(_clean(notes)),
      updatedAt: Value(DateTime.now()),
    ));
  }

  Future<int> projectCount(int customerId) async {
    final rows = await (_db.select(_db.projects)
          ..where((t) => t.customerId.equals(customerId)))
        .get();
    return rows.length;
  }

  /// Csak projekt nélküli ügyfél törölhető. Igazat ad, ha törölt.
  Future<bool> deleteIfUnused(int id) {
    return _db.transaction(() async {
      if (await projectCount(id) > 0) return false;
      await (_db.delete(_db.customers)..where((t) => t.id.equals(id))).go();
      return true;
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class ProjectRepository {
  ProjectRepository(this._db);
  final AppDatabase _db;

  JoinedSelectStatement<HasResultSet, dynamic> _joined() {
    return _db.select(_db.projects).join([
      innerJoin(_db.customers, _db.customers.id.equalsExp(_db.projects.customerId)),
    ]);
  }

  Stream<List<ProjectWithCustomer>> watchAll() {
    final q = _joined()..orderBy([OrderingTerm.desc(_db.projects.updatedAt)]);
    return q.watch().map((rows) => [
          for (final r in rows)
            ProjectWithCustomer(r.readTable(_db.projects), r.readTable(_db.customers)),
        ]);
  }

  Stream<List<Project>> watchForCustomer(int customerId) => (_db.select(_db.projects)
        ..where((t) => t.customerId.equals(customerId))
        ..orderBy([(t) => OrderingTerm.desc(t.updatedAt)]))
      .watch();

  Stream<ProjectWithCustomer?> watch(int id) {
    final q = _joined()..where(_db.projects.id.equals(id));
    return q.watchSingleOrNull().map((r) => r == null
        ? null
        : ProjectWithCustomer(r.readTable(_db.projects), r.readTable(_db.customers)));
  }

  Future<int> create({
    required int customerId,
    required String title,
    String? siteAddress,
    String? notes,
  }) async {
    final profile = await (_db.select(_db.companyProfiles)..where((t) => t.id.equals(1)))
        .getSingleOrNull();
    return _db.into(_db.projects).insert(ProjectsCompanion.insert(
          customerId: customerId,
          title: title.trim(),
          siteAddress: Value(_clean(siteAddress)),
          notes: Value(_clean(notes)),
          vatRateBp: Value(profile?.defaultVatRateBp ?? VatRates.standard),
        ));
  }

  Future<void> updateBasics(int id, {required String title, String? siteAddress, String? notes}) {
    return _write(id, ProjectsCompanion(
      title: Value(title.trim()),
      siteAddress: Value(_clean(siteAddress)),
      notes: Value(_clean(notes)),
    ));
  }

  Future<void> setStatus(int id, ProjectStatus status) =>
      _write(id, ProjectsCompanion(status: Value(status)));

  Future<void> setVatRate(int id, int vatRateBp) {
    if (vatRateBp < 0 || vatRateBp > 10000) throw ArgumentError.value(vatRateBp);
    return _write(id, ProjectsCompanion(vatRateBp: Value(vatRateBp)));
  }

  /// "Nincs" típusnál a százalékot is NULLÁZZUK, hogy egy későbbi visszaváltás
  /// ne aktiváljon csendben egy régi értéket.
  Future<void> setAdjustment(int id, AdjustmentType type, int percentBp) {
    if (percentBp < 0 || percentBp > 10000) throw ArgumentError.value(percentBp);
    return _write(id, ProjectsCompanion(
      adjustmentType: Value(type),
      adjustmentPercentBp: Value(type == AdjustmentType.none ? 0 : percentBp),
    ));
  }

  /// Tervezett kezdés / befejezés. Csak dátum (óra nélkül). Üres = nincs ütemezve.
  Future<void> setSchedule(int id, {DateTime? start, DateTime? end}) {
    DateTime? d(DateTime? x) => x == null ? null : DateTime(x.year, x.month, x.day);
    final s = d(start), e = d(end);
    if (s != null && e != null && e.isBefore(s)) {
      throw UserInputError('A befejezés nem lehet korábban a kezdésnél.');
    }
    return _write(id, ProjectsCompanion(startDate: Value(s), endDate: Value(e)));
  }

  Future<void> setValidityDays(int id, int days) {
    if (days < 1 || days > 365) throw ArgumentError.value(days, 'days', '1..365');
    return _write(id, ProjectsCompanion(validityDays: Value(days)));
  }

  /// Ajánlat kiküldöttnek jelölése: sorszámot oszt (ha még nincs) és dátumot rögzít.
  Future<String> markQuoted(int id) {
    return _db.transaction(() async {
      final p = await (_db.select(_db.projects)..where((t) => t.id.equals(id))).getSingle();
      var number = p.quoteNumber;
      if (number == null) {
        final profile = await (_db.select(_db.companyProfiles)..where((t) => t.id.equals(1)))
            .getSingleOrNull();
        final rawPrefix = (profile?.quotePrefix ?? 'MP').trim();
        final prefix = rawPrefix.isEmpty ? 'MP' : rawPrefix;
        final year = DateTime.now().year;
        final stem = '$prefix-$year-';
        // A következő sorszám a számláló ÉS a ténylegesen létező számok
        // maximumánál eggyel nagyobb (régi, számláló előtti adatoknál is helyes).
        var maxSeq = (profile != null && profile.quoteSeqYear == year) ? profile.quoteSeq : 0;
        final existing = await (_db.select(_db.projects)..where((t) => t.quoteNumber.like('$stem%'))).get();
        for (final e in existing) {
          final seq = int.tryParse(e.quoteNumber!.substring(stem.length)) ?? 0;
          if (seq > maxSeq) maxSeq = seq;
        }
        final next = maxSeq + 1;
        number = '$stem${next.toString().padLeft(3, '0')}';
        await _db.into(_db.companyProfiles).insertOnConflictUpdate(CompanyProfilesCompanion(
              id: const Value(1),
              quoteSeqYear: Value(year),
              quoteSeq: Value(next),
            ));
      }
      await _write(id, ProjectsCompanion(
        quoteNumber: Value(number),
        quotedAt: Value(p.quotedAt ?? DateTime.now()),
        status: Value(p.status == ProjectStatus.draft ? ProjectStatus.quoted : p.status),
      ));
      return number;
    });
  }

  /// Projekt másolása (sablonként új munkához): alapadatok, kedvezmény/ÁFA,
  /// felmért helyiségek és tételek az aktuális áraikkal. A másolat mindig
  /// piszkozat, ajánlatszám és kiküldési dátum nélkül — nem keverhető össze
  /// a már kiadott ajánlattal. A tételek helyiség-hivatkozása az ÚJ
  /// helyiségekre mutat. Az új projekt azonosítójával tér vissza.
  Future<int> duplicate(int sourceId, {required int customerId, String? title}) {
    return _db.transaction(() async {
      final src = await (_db.select(_db.projects)..where((t) => t.id.equals(sourceId))).getSingle();
      final newTitle = (title ?? '').trim().isEmpty ? '${src.title} (másolat)' : title!.trim();
      final newId = await _db.into(_db.projects).insert(ProjectsCompanion.insert(
            customerId: customerId,
            title: newTitle.length > 200 ? newTitle.substring(0, 200) : newTitle,
            siteAddress: Value(customerId == src.customerId ? src.siteAddress : null),
            vatRateBp: Value(src.vatRateBp),
            adjustmentType: Value(src.adjustmentType),
            adjustmentPercentBp: Value(src.adjustmentPercentBp),
            validityDays: Value(src.validityDays),
            notes: Value(src.notes),
          ));

      final areaMap = <int, int>{};
      final areas = await (_db.select(_db.surveyAreas)..where((t) => t.projectId.equals(sourceId))).get();
      for (final a in areas) {
        areaMap[a.id] = await _db.into(_db.surveyAreas).insert(SurveyAreasCompanion.insert(
              projectId: newId,
              name: a.name,
              lengthCm: Value(a.lengthCm),
              widthCm: Value(a.widthCm),
              heightCm: Value(a.heightCm),
              openingsMilliM2: Value(a.openingsMilliM2),
              notes: Value(a.notes),
              sortOrder: Value(a.sortOrder),
            ));
      }

      final lines = await (_db.select(_db.quoteLines)..where((t) => t.projectId.equals(sourceId))).get();
      for (final l in lines) {
        await _db.into(_db.quoteLines).insert(QuoteLinesCompanion.insert(
              projectId: newId,
              priceItemId: Value(l.priceItemId),
              areaId: Value(l.areaId == null ? null : areaMap[l.areaId]),
              name: l.name,
              unit: l.unit,
              quantityMilli: l.quantityMilli,
              laborUnitPriceHuf: Value(l.laborUnitPriceHuf),
              materialUnitPriceHuf: Value(l.materialUnitPriceHuf),
              sortOrder: Value(l.sortOrder),
            ));
      }
      final mats = await (_db.select(_db.materialItems)..where((t) => t.projectId.equals(sourceId))).get();
      for (final m in mats) {
        await _db.into(_db.materialItems).insert(MaterialItemsCompanion.insert(
              projectId: newId,
              name: m.name,
              quantityMilli: m.quantityMilli,
              unit: m.unit,
              note: Value(m.note),
              sortOrder: Value(m.sortOrder),
            ));
      }
      // Fizetések, kiadások, munkanapló NEM másolódik: azok a konkrét munkáé.
      return newId;
    });
  }

  /// Projekt törlése a gyermekrekordokkal együtt. Az FK cascade mellett
  /// explicit is töröljük őket egy tranzakcióban — így akkor is helyes,
  /// ha valamiért a PRAGMA nem élne.
  Future<void> delete(int id) {
    return _db.transaction(() async {
      await (_db.delete(_db.payments)..where((t) => t.projectId.equals(id))).go();
      await (_db.delete(_db.expenses)..where((t) => t.projectId.equals(id))).go();
      await (_db.delete(_db.workLogs)..where((t) => t.projectId.equals(id))).go();
      await (_db.delete(_db.materialItems)..where((t) => t.projectId.equals(id))).go();
      await (_db.delete(_db.quoteLines)..where((t) => t.projectId.equals(id))).go();
      await (_db.delete(_db.surveyAreas)..where((t) => t.projectId.equals(id))).go();
      await (_db.delete(_db.projects)..where((t) => t.id.equals(id))).go();
    });
  }

  Future<void> touch(int id) => _write(id, const ProjectsCompanion());

  Future<void> _write(int id, ProjectsCompanion c) async {
    await (_db.update(_db.projects)..where((t) => t.id.equals(id)))
        .write(c.copyWith(updatedAt: Value(DateTime.now())));
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class SurveyRepository {
  SurveyRepository(this._db, this._projects);
  final AppDatabase _db;
  final ProjectRepository _projects;

  Stream<List<SurveyArea>> watchForProject(int projectId) => (_db.select(_db.surveyAreas)
        ..where((t) => t.projectId.equals(projectId))
        ..orderBy([(t) => OrderingTerm.asc(t.sortOrder), (t) => OrderingTerm.asc(t.id)]))
      .watch();

  Future<int> create({
    required int projectId,
    required String name,
    int? lengthCm,
    int? widthCm,
    int? heightCm,
    int openingsMilliM2 = 0,
    String? notes,
  }) {
    return _db.transaction(() async {
      final existing = await (_db.select(_db.surveyAreas)
            ..where((t) => t.projectId.equals(projectId)))
          .get();
      final nextOrder = existing.fold<int>(0, (m, a) => a.sortOrder > m ? a.sortOrder : m) + 1;
      final id = await _db.into(_db.surveyAreas).insert(SurveyAreasCompanion.insert(
            projectId: projectId,
            name: name.trim(),
            lengthCm: Value(lengthCm),
            widthCm: Value(widthCm),
            heightCm: Value(heightCm),
            openingsMilliM2: Value(openingsMilliM2),
            notes: Value(_clean(notes)),
            sortOrder: Value(nextOrder),
          ));
      await _projects.touch(projectId);
      return id;
    });
  }

  /// Helyiség módosítása. A helyiséghez kötött tételek közül azokat, amelyek
  /// mennyisége pontosan a RÉGI felmért értéket vette át (padló/fal m², kerület
  /// fm), az új méretre frissíti — így egy méret-pontosítás után nem marad az
  /// ajánlatban elavult mennyiség. Kézzel megadott mennyiséghez nem nyúl.
  Future<AreaUpdateResult> update(
    SurveyArea area, {
    required String name,
    int? lengthCm,
    int? widthCm,
    int? heightCm,
    int openingsMilliM2 = 0,
    String? notes,
  }) {
    return _db.transaction(() async {
      await (_db.update(_db.surveyAreas)..where((t) => t.id.equals(area.id)))
          .write(SurveyAreasCompanion(
        name: Value(name.trim()),
        lengthCm: Value(lengthCm),
        widthCm: Value(widthCm),
        heightCm: Value(heightCm),
        openingsMilliM2: Value(openingsMilliM2),
        notes: Value(_clean(notes)),
      ));

      final before = AreaMeasurements(
        lengthCm: area.lengthCm,
        widthCm: area.widthCm,
        heightCm: area.heightCm,
        openingsMilliM2: area.openingsMilliM2,
      );
      final after = AreaMeasurements(
        lengthCm: lengthCm,
        widthCm: widthCm,
        heightCm: heightCm,
        openingsMilliM2: openingsMilliM2,
      );

      var updated = 0;
      var manual = 0;
      final linked = await (_db.select(_db.quoteLines)..where((t) => t.areaId.equals(area.id))).get();
      for (final l in linked) {
        int? next;
        if (l.unit == WorkUnit.m2 && l.quantityMilli == before.floorMilliM2) {
          next = after.floorMilliM2;
        } else if (l.unit == WorkUnit.m2 && l.quantityMilli == before.wallMilliM2) {
          next = after.wallMilliM2;
        } else if (l.unit == WorkUnit.fm && l.quantityMilli == before.perimeterMilliM) {
          next = after.perimeterMilliM;
        } else {
          manual++;
          continue;
        }
        if (next == null || next <= 0) {
          manual++; // az új méretből nem számolható — kézi ellenőrzés kell
        } else if (next != l.quantityMilli) {
          await (_db.update(_db.quoteLines)..where((t) => t.id.equals(l.id)))
              .write(QuoteLinesCompanion(quantityMilli: Value(next)));
          updated++;
        }
      }
      await _projects.touch(area.projectId);
      return AreaUpdateResult(updatedLines: updated, manualLines: manual);
    });
  }

  /// A helyiséghez kötött tételek megmaradnak, "általános" tétellé válnak.
  Future<void> delete(SurveyArea area) {
    return _db.transaction(() async {
      await (_db.update(_db.quoteLines)..where((t) => t.areaId.equals(area.id)))
          .write(const QuoteLinesCompanion(areaId: Value(null)));
      await (_db.delete(_db.surveyAreas)..where((t) => t.id.equals(area.id))).go();
      await _projects.touch(area.projectId);
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class PriceListRepository {
  PriceListRepository(this._db);
  final AppDatabase _db;

  /// Kategória (a felsorolás sorrendjében), azon belül magyar betűrend.
  Stream<List<PriceItem>> watchActive() => (_db.select(_db.priceItems)..where((t) => t.archived.equals(false)))
      .watch()
      .map((list) => [...list]
        ..sort((a, b) {
          final c = a.category.index.compareTo(b.category.index);
          return c != 0 ? c : Fmt.compareHu(a.name, b.name);
        }));

  Stream<PriceItem?> watch(int id) =>
      (_db.select(_db.priceItems)..where((t) => t.id.equals(id))).watchSingleOrNull();

  Future<int> create({
    required String name,
    required WorkUnit unit,
    required TradeCategory category,
    required int laborUnitPriceHuf,
    required int materialUnitPriceHuf,
    String? notes,
  }) {
    return _db.into(_db.priceItems).insert(PriceItemsCompanion.insert(
          name: name.trim(),
          unit: unit,
          category: category,
          laborUnitPriceHuf: Value(laborUnitPriceHuf),
          materialUnitPriceHuf: Value(materialUnitPriceHuf),
          notes: Value(_clean(notes)),
        ));
  }

  Future<void> update(
    int id, {
    required String name,
    required WorkUnit unit,
    required TradeCategory category,
    required int laborUnitPriceHuf,
    required int materialUnitPriceHuf,
    String? notes,
  }) async {
    await (_db.update(_db.priceItems)..where((t) => t.id.equals(id))).write(PriceItemsCompanion(
      name: Value(name.trim()),
      unit: Value(unit),
      category: Value(category),
      laborUnitPriceHuf: Value(laborUnitPriceHuf),
      materialUnitPriceHuf: Value(materialUnitPriceHuf),
      notes: Value(_clean(notes)),
      updatedAt: Value(DateTime.now()),
    ));
  }

  Future<void> updatePrices(int id, {required int laborUnitPriceHuf, required int materialUnitPriceHuf}) async {
    await (_db.update(_db.priceItems)..where((t) => t.id.equals(id))).write(PriceItemsCompanion(
      laborUnitPriceHuf: Value(laborUnitPriceHuf),
      materialUnitPriceHuf: Value(materialUnitPriceHuf),
      updatedAt: Value(DateTime.now()),
    ));
  }

  /// Archiválás törlés helyett: a meglévő ajánlatok pillanatképei érintetlenek.
  Future<void> archive(int id) async {
    await (_db.update(_db.priceItems)..where((t) => t.id.equals(id)))
        .write(PriceItemsCompanion(archived: const Value(true), updatedAt: Value(DateTime.now())));
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class QuoteLineRepository {
  QuoteLineRepository(this._db, this._projects, this._prices);
  final AppDatabase _db;
  final ProjectRepository _projects;
  final PriceListRepository _prices;

  Stream<List<QuoteLine>> watchForProject(int projectId) => (_db.select(_db.quoteLines)
        ..where((t) => t.projectId.equals(projectId))
        ..orderBy([(t) => OrderingTerm.asc(t.sortOrder), (t) => OrderingTerm.asc(t.id)]))
      .watch();

  /// Minden sor — a dashboard projektenkénti összesítéséhez.
  Stream<List<QuoteLine>> watchAll() => _db.select(_db.quoteLines).watch();

  Future<int> add({
    required int projectId,
    int? priceItemId,
    int? areaId,
    required String name,
    required WorkUnit unit,
    required int quantityMilli,
    required int laborUnitPriceHuf,
    required int materialUnitPriceHuf,
  }) {
    _validate(quantityMilli, laborUnitPriceHuf, materialUnitPriceHuf);
    return _db.transaction(() async {
      final existing = await (_db.select(_db.quoteLines)
            ..where((t) => t.projectId.equals(projectId)))
          .get();
      final nextOrder = existing.fold<int>(0, (m, l) => l.sortOrder > m ? l.sortOrder : m) + 1;
      final id = await _db.into(_db.quoteLines).insert(QuoteLinesCompanion.insert(
            projectId: projectId,
            priceItemId: Value(priceItemId),
            areaId: Value(areaId),
            name: name.trim(),
            unit: unit,
            quantityMilli: quantityMilli,
            laborUnitPriceHuf: Value(laborUnitPriceHuf),
            materialUnitPriceHuf: Value(materialUnitPriceHuf),
            sortOrder: Value(nextOrder),
          ));
      await _projects.touch(projectId);
      return id;
    });
  }

  Future<void> update(
    QuoteLine line, {
    required String name,
    required WorkUnit unit,
    required int quantityMilli,
    int? areaId,
  }) {
    _validate(quantityMilli, 0, 0);
    return _db.transaction(() async {
      await (_db.update(_db.quoteLines)..where((t) => t.id.equals(line.id))).write(
        QuoteLinesCompanion(
          name: Value(name.trim()),
          unit: Value(unit),
          quantityMilli: Value(quantityMilli),
          areaId: Value(areaId),
        ),
      );
      await _projects.touch(line.projectId);
    });
  }

  /// Sor árazása. [alsoUpdatePriceList] esetén a kapcsolt árlista-tétel is frissül
  /// (csak ha a sor árlistából jött).
  Future<void> setPrices(
    QuoteLine line, {
    required int laborUnitPriceHuf,
    required int materialUnitPriceHuf,
    bool alsoUpdatePriceList = false,
  }) {
    _validate(line.quantityMilli, laborUnitPriceHuf, materialUnitPriceHuf);
    return _db.transaction(() async {
      await (_db.update(_db.quoteLines)..where((t) => t.id.equals(line.id))).write(
        QuoteLinesCompanion(
          laborUnitPriceHuf: Value(laborUnitPriceHuf),
          materialUnitPriceHuf: Value(materialUnitPriceHuf),
        ),
      );
      if (alsoUpdatePriceList && line.priceItemId != null) {
        await _prices.updatePrices(
          line.priceItemId!,
          laborUnitPriceHuf: laborUnitPriceHuf,
          materialUnitPriceHuf: materialUnitPriceHuf,
        );
      }
      await _projects.touch(line.projectId);
    });
  }

  Future<void> delete(QuoteLine line) {
    return _db.transaction(() async {
      await (_db.delete(_db.quoteLines)..where((t) => t.id.equals(line.id))).go();
      await _projects.touch(line.projectId);
    });
  }

  void _validate(int qty, int labor, int material) {
    if (qty <= 0) throw UserInputError('A mennyiségnek nagyobbnak kell lennie nullánál.');
    if (labor < 0 || material < 0) throw UserInputError('Az egységár nem lehet negatív.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class CompanyRepository {
  CompanyRepository(this._db);
  final AppDatabase _db;

  Stream<CompanyProfile> watch() => (_db.select(_db.companyProfiles)
        ..where((t) => t.id.equals(1)))
      .watchSingleOrNull()
      .map((p) => p ?? const CompanyProfile(
            id: 1,
            companyName: '',
            ownerName: '',
            address: '',
            taxNumber: '',
            phone: '',
            email: '',
            defaultVatRateBp: VatRates.standard,
            quotePrefix: 'MP',
            quoteFooter: '',
            quoteSeqYear: 0,
            quoteSeq: 0,
          ));

  Future<void> save(CompanyProfilesCompanion c) async {
    await _db.into(_db.companyProfiles).insertOnConflictUpdate(c.copyWith(id: const Value(1)));
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/// Pénzügy: befolyt összegek és kiadások. Bruttó, egész forint, 0 < összeg ≤ 999 999 999.
class FinanceRepository {
  FinanceRepository(this._db, this._projects);
  final AppDatabase _db;
  final ProjectRepository _projects;

  static const int maxAmountHuf = 999999999;

  static void _checkAmount(int huf) {
    if (huf <= 0) throw UserInputError('Az összeg legyen nagyobb nullánál.');
    if (huf > maxAmountHuf) throw UserInputError('Az összeg túl nagy (legfeljebb 999 999 999 Ft).');
  }

  static DateTime _day(DateTime d) => DateTime(d.year, d.month, d.day);

  Stream<List<Payment>> watchPayments(int projectId) => (_db.select(_db.payments)
        ..where((t) => t.projectId.equals(projectId))
        ..orderBy([(t) => OrderingTerm.desc(t.paidAt), (t) => OrderingTerm.desc(t.id)]))
      .watch();

  Stream<List<Payment>> watchAllPayments() => _db.select(_db.payments).watch();

  Future<int> addPayment({
    required int projectId,
    required int amountHuf,
    required DateTime paidAt,
    required PaymentMethod method,
    String? note,
  }) {
    _checkAmount(amountHuf);
    return _db.transaction(() async {
      final id = await _db.into(_db.payments).insert(PaymentsCompanion.insert(
            projectId: projectId,
            amountHuf: amountHuf,
            paidAt: _day(paidAt),
            method: method,
            note: Value(_clean(note)),
          ));
      await _projects.touch(projectId);
      return id;
    });
  }

  Future<void> deletePayment(Payment p) => _db.transaction(() async {
        await (_db.delete(_db.payments)..where((t) => t.id.equals(p.id))).go();
        await _projects.touch(p.projectId);
      });

  Stream<List<Expense>> watchExpenses(int projectId) => (_db.select(_db.expenses)
        ..where((t) => t.projectId.equals(projectId))
        ..orderBy([(t) => OrderingTerm.desc(t.spentAt), (t) => OrderingTerm.desc(t.id)]))
      .watch();

  Stream<List<Expense>> watchAllExpenses() => _db.select(_db.expenses).watch();

  Future<int> addExpense({
    required int projectId,
    required String title,
    required ExpenseCategory category,
    required int amountHuf,
    required DateTime spentAt,
    String? note,
  }) {
    _checkAmount(amountHuf);
    if (title.trim().isEmpty) throw UserInputError('Add meg, mire ment a pénz.');
    return _db.transaction(() async {
      final id = await _db.into(_db.expenses).insert(ExpensesCompanion.insert(
            projectId: projectId,
            title: title.trim(),
            category: category,
            amountHuf: amountHuf,
            spentAt: _day(spentAt),
            note: Value(_clean(note)),
          ));
      await _projects.touch(projectId);
      return id;
    });
  }

  Future<void> deleteExpense(Expense e) => _db.transaction(() async {
        await (_db.delete(_db.expenses)..where((t) => t.id.equals(e.id))).go();
        await _projects.touch(e.projectId);
      });
}

// ─────────────────────────────────────────────────────────────────────────────

/// Munkanapló: napi bejegyzések, percben. Egy napra több bejegyzés is lehet.
class WorkLogRepository {
  WorkLogRepository(this._db, this._projects);
  final AppDatabase _db;
  final ProjectRepository _projects;

  static const int maxMinutesPerEntry = 24 * 60;

  Stream<List<WorkLog>> watchForProject(int projectId) => (_db.select(_db.workLogs)
        ..where((t) => t.projectId.equals(projectId))
        ..orderBy([(t) => OrderingTerm.desc(t.day), (t) => OrderingTerm.desc(t.id)]))
      .watch();

  Stream<List<WorkLog>> watchAll() => _db.select(_db.workLogs).watch();

  Future<int> add({required int projectId, required DateTime day, required int minutes, String? note}) {
    if (minutes <= 0 || minutes > maxMinutesPerEntry) {
      throw UserInputError('Az idő 0 és 24 óra között legyen.');
    }
    return _db.transaction(() async {
      final id = await _db.into(_db.workLogs).insert(WorkLogsCompanion.insert(
            projectId: projectId,
            day: DateTime(day.year, day.month, day.day),
            minutes: minutes,
            note: Value(_clean(note)),
          ));
      await _projects.touch(projectId);
      return id;
    });
  }

  Future<void> delete(WorkLog w) => _db.transaction(() async {
        await (_db.delete(_db.workLogs)..where((t) => t.id.equals(w.id))).go();
        await _projects.touch(w.projectId);
      });
}

// ─────────────────────────────────────────────────────────────────────────────

/// Anyaglista (bevásárlólista).
class MaterialRepository {
  MaterialRepository(this._db, this._projects);
  final AppDatabase _db;
  final ProjectRepository _projects;

  Stream<List<MaterialItem>> watchForProject(int projectId) => (_db.select(_db.materialItems)
        ..where((t) => t.projectId.equals(projectId))
        ..orderBy([(t) => OrderingTerm.asc(t.purchased), (t) => OrderingTerm.asc(t.sortOrder), (t) => OrderingTerm.asc(t.id)]))
      .watch();

  Future<int> add({
    required int projectId,
    required String name,
    required int quantityMilli,
    required String unit,
    String? note,
  }) {
    if (name.trim().isEmpty) throw UserInputError('Add meg az anyag nevét.');
    if (quantityMilli <= 0) throw UserInputError('A mennyiség legyen nagyobb nullánál.');
    final u = unit.trim();
    if (u.isEmpty || u.length > 20) throw UserInputError('Add meg a mértékegységet (max. 20 karakter).');
    return _db.transaction(() async {
      final existing = await (_db.select(_db.materialItems)..where((t) => t.projectId.equals(projectId))).get();
      final next = existing.fold<int>(0, (m, e) => e.sortOrder > m ? e.sortOrder : m) + 1;
      final id = await _db.into(_db.materialItems).insert(MaterialItemsCompanion.insert(
            projectId: projectId,
            name: name.trim(),
            quantityMilli: quantityMilli,
            unit: u,
            note: Value(_clean(note)),
            sortOrder: Value(next),
          ));
      await _projects.touch(projectId);
      return id;
    });
  }

  Future<void> setPurchased(MaterialItem m, bool purchased) async {
    await (_db.update(_db.materialItems)..where((t) => t.id.equals(m.id)))
        .write(MaterialItemsCompanion(purchased: Value(purchased)));
  }

  Future<void> delete(MaterialItem m) => _db.transaction(() async {
        await (_db.delete(_db.materialItems)..where((t) => t.id.equals(m.id))).go();
        await _projects.touch(m.projectId);
      });
}
