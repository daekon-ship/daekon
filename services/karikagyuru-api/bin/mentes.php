<?php
declare(strict_types=1);
// V5.8 – Biztonsági mentés: az adatbázis (árak, változatok, érdeklődések) és a feltöltött képek másolata.
// Használat:  KG_DATA=/utvonal php bin/mentes.php <celmappa>
//   A célmappában új, dátumozott almappa készül (pl. kg-mentes-20261122-101500/):
//   kg.sqlite (VACUUM INTO – futó oldal mellett is egységes pillanatkép), photos/, inquiry-files/.
// A célmappa NE legyen a webgyökérben: a mentés személyes adatot (érdeklődéseket, referenciaképeket) tartalmaz.
// Visszaállítás: a weboldal leállítása után a mentés tartalmát a KG_DATA mappába kell másolni.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$data = rtrim(getenv('KG_DATA') ?: dirname(__DIR__) . '/data', '/');
$target = rtrim((string) ($argv[1] ?? ''), '/');
if ($target === '') { fwrite(STDERR, "Adja meg a célmappát: php bin/mentes.php /mentesek\n"); exit(1); }
if (!is_file("$data/kg.sqlite")) { fwrite(STDERR, "Nincs adatbázis itt: $data\n"); exit(1); }
$realData = realpath($data);
$abs = str_starts_with($target, '/') ? $target : getcwd() . '/' . $target;
if (str_starts_with($abs . '/', $realData . '/') || str_starts_with($abs . '/', $data . '/')) { fwrite(STDERR, "A mentés nem kerülhet az adatmappába.\n"); exit(1); }
if (!is_dir($target) && !mkdir($target, 0700, true)) { fwrite(STDERR, "A célmappa nem hozható létre.\n"); exit(1); }
$realTarget = realpath($target);
if ($realTarget === $realData || str_starts_with($realTarget . '/', $realData . '/')) { fwrite(STDERR, "A mentés nem kerülhet az adatmappába.\n"); exit(1); }

$dir = $realTarget . '/kg-mentes-' . gmdate('Ymd-His');
if (is_dir($dir)) { fwrite(STDERR, "Ez a mentés már létezik: $dir\n"); exit(1); }
mkdir($dir, 0700);
$db = new PDO('sqlite:' . $realData . '/kg.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec('VACUUM INTO ' . $db->quote($dir . '/kg.sqlite'));
$db = null;

$copied = 0;
$copy = static function (string $from, string $to) use (&$copy, &$copied): void {
    if (!is_dir($from)) return;
    if (!is_dir($to)) mkdir($to, 0700, true);
    foreach (scandir($from) ?: [] as $f) {
        if ($f === '.' || $f === '..') continue;
        if (is_link("$from/$f")) continue;
        if (is_dir("$from/$f")) $copy("$from/$f", "$to/$f");
        elseif (is_file("$from/$f")) { copy("$from/$f", "$to/$f"); chmod("$to/$f", 0600); $copied++; }
    }
};
$copy($realData . '/photos', $dir . '/photos');
$copy($realData . '/inquiry-files', $dir . '/inquiry-files');

// ellenőrzés: a másolat megnyitható és ugyanannyi változatot tartalmaz
$chk = new PDO('sqlite:' . $dir . '/kg.sqlite');
$n = (int) $chk->query('SELECT COUNT(*) FROM state_version')->fetchColumn();
$ok = $chk->query('PRAGMA integrity_check')->fetchColumn() === 'ok';
if (!$ok) { fwrite(STDERR, "HIBA: a mentett adatbázis sérült.\n"); exit(2); }
fwrite(STDOUT, "Mentés kész: $dir\n  árváltozatok: $n, fájlok: $copied\n");
