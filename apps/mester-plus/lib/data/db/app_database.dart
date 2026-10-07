import 'package:drift/drift.dart';

import '../../domain/enums.dart';
import '../../security/db_key_store.dart';
import 'encrypted_open.dart';

part 'app_database.g.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Táblák
// Pénz: egész Ft. Mennyiség: milli (×1000). Százalék: bázispont (×100).
// ─────────────────────────────────────────────────────────────────────────────

class Customers extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get name => text().withLength(min: 1, max: 200)();
  TextColumn get phone => text().nullable()();
  TextColumn get email => text().nullable()();
  TextColumn get address => text().nullable()();
  TextColumn get taxNumber => text().nullable()();
  TextColumn get notes => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
}

class Projects extends Table {
  IntColumn get id => integer().autoIncrement()();

  /// Ügyfél törlése tiltott, amíg projektje van (restrict) — a UI ezt jelzi.
  IntColumn get customerId =>
      integer().references(Customers, #id, onDelete: KeyAction.restrict)();
  TextColumn get title => text().withLength(min: 1, max: 200)();
  TextColumn get siteAddress => text().nullable()();
  TextColumn get status =>
      textEnum<ProjectStatus>().withDefault(Constant(ProjectStatus.draft.name))();
  IntColumn get vatRateBp => integer().withDefault(const Constant(2700))();
  TextColumn get adjustmentType =>
      textEnum<AdjustmentType>().withDefault(Constant(AdjustmentType.none.name))();
  IntColumn get adjustmentPercentBp => integer().withDefault(const Constant(0))();
  /// Egyedi: két ajánlat nem kaphatja ugyanazt a sorszámot.
  TextColumn get quoteNumber => text().nullable().unique()();
  DateTimeColumn get quotedAt => dateTime().nullable()();
  IntColumn get validityDays => integer().withDefault(const Constant(30))();

  /// Ütemezés (v3): tervezett kezdés és befejezés napja.
  DateTimeColumn get startDate => dateTime().nullable()();
  DateTimeColumn get endDate => dateTime().nullable()();
  TextColumn get notes => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
}

/// Felmérés: helyiségek / felületek méretekkel.
class SurveyAreas extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get projectId =>
      integer().references(Projects, #id, onDelete: KeyAction.cascade)();
  TextColumn get name => text().withLength(min: 1, max: 120)();
  IntColumn get lengthCm => integer().nullable()();
  IntColumn get widthCm => integer().nullable()();
  IntColumn get heightCm => integer().nullable()();
  IntColumn get openingsMilliM2 => integer().withDefault(const Constant(0))();
  TextColumn get notes => text().nullable()();
  IntColumn get sortOrder => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
}

/// Saját árlista. Seed: csak megnevezés + egység, ár NINCS kitalálva (0 Ft).
class PriceItems extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get name => text().withLength(min: 1, max: 200)();
  TextColumn get unit => textEnum<WorkUnit>()();
  TextColumn get category => textEnum<TradeCategory>()();
  IntColumn get laborUnitPriceHuf => integer().withDefault(const Constant(0))();
  IntColumn get materialUnitPriceHuf => integer().withDefault(const Constant(0))();
  TextColumn get notes => text().nullable()();
  BoolColumn get archived => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
}

/// Az ajánlat munkatételei. Név/egység/ár PILLANATKÉP: az árlista későbbi
/// módosítása nem írja át a már kiadott ajánlatot.
class QuoteLines extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get projectId =>
      integer().references(Projects, #id, onDelete: KeyAction.cascade)();
  IntColumn get priceItemId =>
      integer().nullable().references(PriceItems, #id, onDelete: KeyAction.setNull)();
  IntColumn get areaId =>
      integer().nullable().references(SurveyAreas, #id, onDelete: KeyAction.setNull)();
  TextColumn get name => text().withLength(min: 1, max: 200)();
  TextColumn get unit => textEnum<WorkUnit>()();
  IntColumn get quantityMilli => integer()();
  IntColumn get laborUnitPriceHuf => integer().withDefault(const Constant(0))();
  IntColumn get materialUnitPriceHuf => integer().withDefault(const Constant(0))();
  IntColumn get sortOrder => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
}

/// Befolyt pénz (előleg, részlet, végösszeg). Bruttó, egész forint.
class Payments extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get projectId => integer().references(Projects, #id, onDelete: KeyAction.cascade)();
  IntColumn get amountHuf => integer()();
  DateTimeColumn get paidAt => dateTime()();
  TextColumn get method => textEnum<PaymentMethod>()();
  TextColumn get note => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
}

/// Kiadás a projekten (anyagvásárlás, alvállalkozó…). Bruttó, egész forint.
class Expenses extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get projectId => integer().references(Projects, #id, onDelete: KeyAction.cascade)();
  TextColumn get title => text().withLength(min: 1, max: 200)();
  TextColumn get category => textEnum<ExpenseCategory>()();
  IntColumn get amountHuf => integer()();
  DateTimeColumn get spentAt => dateTime()();
  TextColumn get note => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
}

/// Munkanapló: egy nap munkája. Az időt percben tároljuk (7,5 óra = 450).
class WorkLogs extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get projectId => integer().references(Projects, #id, onDelete: KeyAction.cascade)();
  DateTimeColumn get day => dateTime()();
  IntColumn get minutes => integer()();
  TextColumn get note => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
}

/// Anyaglista (bevásárlólista) a projekthez.
class MaterialItems extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get projectId => integer().references(Projects, #id, onDelete: KeyAction.cascade)();
  TextColumn get name => text().withLength(min: 1, max: 200)();
  IntColumn get quantityMilli => integer()();
  TextColumn get unit => text().withLength(min: 1, max: 20)();
  BoolColumn get purchased => boolean().withDefault(const Constant(false))();
  TextColumn get note => text().nullable()();
  IntColumn get sortOrder => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
}

/// Egysoros cégprofil (id = 1).
@DataClassName('CompanyProfile')
class CompanyProfiles extends Table {
  IntColumn get id => integer()();
  TextColumn get companyName => text().withDefault(const Constant(''))();
  TextColumn get ownerName => text().withDefault(const Constant(''))();
  TextColumn get address => text().withDefault(const Constant(''))();
  TextColumn get taxNumber => text().withDefault(const Constant(''))();
  TextColumn get phone => text().withDefault(const Constant(''))();
  TextColumn get email => text().withDefault(const Constant(''))();
  IntColumn get defaultVatRateBp => integer().withDefault(const Constant(2700))();
  TextColumn get quotePrefix => text().withDefault(const Constant('MP'))();
  TextColumn get quoteFooter => text().withDefault(const Constant(''))();

  /// Ajánlatszám-számláló (v2). Monoton nő: egy törölt projekt sorszáma sem
  /// kerül újra kiosztásra, így kint nem keringhet két azonos számú ajánlat.
  IntColumn get quoteSeqYear => integer().withDefault(const Constant(0))();
  IntColumn get quoteSeq => integer().withDefault(const Constant(0))();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

// ─────────────────────────────────────────────────────────────────────────────
// Adatbázis
// ─────────────────────────────────────────────────────────────────────────────

@DriftDatabase(tables: [
  Customers,
  Projects,
  SurveyAreas,
  PriceItems,
  QuoteLines,
  CompanyProfiles,
  Payments,
  Expenses,
  WorkLogs,
  MaterialItems,
])
class AppDatabase extends _$AppDatabase {
  /// Teszteléshez / egyedi végrehajtóval (pl. `NativeDatabase.memory()`).
  AppDatabase(QueryExecutor executor) : super(executor);

  /// Éles: titkosított adatbázis a készüléken, a kulcs a biztonságos tárolóból.
  AppDatabase.encrypted(DatabaseKeyStore keys)
      : super(DatabaseConnection.delayed(openEncryptedDatabase(keys)));

  @override
  int get schemaVersion => 3;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async {
          await m.createAll();
          await _seed();
        },
        onUpgrade: (m, from, to) async {
          if (from < 2) {
            await m.addColumn(companyProfiles, companyProfiles.quoteSeqYear);
            await m.addColumn(companyProfiles, companyProfiles.quoteSeq);
          }
          if (from < 3) {
            await m.addColumn(projects, projects.startDate);
            await m.addColumn(projects, projects.endDate);
            await m.createTable(payments);
            await m.createTable(expenses);
            await m.createTable(workLogs);
            await m.createTable(materialItems);
          }
        },
        beforeOpen: (details) async {
          // SQLite-ban a FK-kényszer kapcsolatonként alapból KI van kapcsolva.
          // Enélkül a cascade / restrict csak papíron létezne.
          await customStatement('PRAGMA foreign_keys = ON');
        },
      );

  Future<void> _seed() async {
    await into(companyProfiles).insert(
      const CompanyProfilesCompanion(id: Value(1)),
      mode: InsertMode.insertOrIgnore,
    );

    // Szándékosan ár nélkül: a szaki saját árait mi nem találjuk ki.
    const seed = <(String, WorkUnit, TradeCategory)>[
      ('Padlóburkolás (ragasztott)', WorkUnit.m2, TradeCategory.burkolas),
      ('Falburkolás (csempézés)', WorkUnit.m2, TradeCategory.burkolas),
      ('Nagylapos burkolás (60×120 felett)', WorkUnit.m2, TradeCategory.burkolas),
      ('Lábazat készítése', WorkUnit.fm, TradeCategory.burkolas),
      ('Fugázás', WorkUnit.m2, TradeCategory.burkolas),
      ('Élvédő / sarokprofil elhelyezése', WorkUnit.fm, TradeCategory.burkolas),
      ('Kenhető vízszigetelés', WorkUnit.m2, TradeCategory.szigeteles),
      ('Hajlaterősítő szalag', WorkUnit.fm, TradeCategory.szigeteles),
      ('Aljzatkiegyenlítés (önterülő)', WorkUnit.m2, TradeCategory.aljzat),
      ('Esztrich betonozás', WorkUnit.m2, TradeCategory.aljzat),
      ('Válaszfal falazása', WorkUnit.m2, TradeCategory.falazas),
      ('Teherhordó fal falazása', WorkUnit.m2, TradeCategory.falazas),
      ('Gépi vakolás', WorkUnit.m2, TradeCategory.vakolas),
      ('Kézi javítóvakolás', WorkUnit.m2, TradeCategory.vakolas),
      ('Régi burkolat bontása', WorkUnit.m2, TradeCategory.bontas),
      ('Sitt elszállítása', WorkUnit.m3, TradeCategory.bontas),
      ('Glettelés, festés', WorkUnit.m2, TradeCategory.festes),
      ('Rezsióra', WorkUnit.ora, TradeCategory.egyeb),
    ];
    await batch((b) {
      b.insertAll(priceItems, [
        for (final (name, unit, cat) in seed)
          PriceItemsCompanion.insert(name: name, unit: unit, category: cat),
      ]);
    });
  }
}
