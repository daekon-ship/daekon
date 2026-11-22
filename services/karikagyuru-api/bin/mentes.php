<?php
declare(strict_types=1);
// Biztonsági mentés (V5.8.1): adatbázis + termékfotók + referenciaképek + beállítások, ellenőrzött másolással.
// Használat:  KG_DATA=/home/<fiók>/kg-adat php bin/mentes.php <célmappa> [--letrehoz] [--hianyos-engedve]
//   <célmappa>: létező mappa a webgyökéren és az adatmappán KÍVÜL (ide kerül a kg-mentes-ÉÉÉÉHHNN-ÓÓPPMM/ mappa).
//   --letrehoz:         ha a célmappa nem létezik, létrehozza (0700)
//   --hianyos-engedve:  ha a forrásból hivatkozott fájl hiányzik, a mentés -HIANYOS végű névvel elkészül (kilépési kód 4)
// Kilépési kód: 0 = kész és ellenőrizve · 1 = hibás használat/tiltott cél · 2 = másolási/ellenőrzési hiba
//               3 = nem sikerült zárolni · 4 = hiányos forrás · 5 = megszakítva
// A mentés alatt az írások (mentés, érdeklődés, fotó) várnak (KG_MENTES_VARAKOZAS mp, alapból 20), így a mentés konzisztens.
// Részletek: docs/MENTES_ES_VISSZAALLITAS.md
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/src/Backup.php';
umask(0077);
$args = array_slice($argv, 1);
$flags = array_values(array_filter($args, fn ($a) => str_starts_with($a, '--')));
$pos = array_values(array_filter($args, fn ($a) => !str_starts_with($a, '--')));
foreach ($flags as $f) if (!in_array($f, ['--letrehoz', '--hianyos-engedve'], true)) { fwrite(STDERR, "Ismeretlen kapcsoló: $f\n"); exit(1); }
$b = new Backup();
if (function_exists('pcntl_async_signals')) {
    pcntl_async_signals(true);
    $stop = function () use ($b) { $b->cleanupPartial(); fwrite(STDERR, "HIBA: a mentés megszakítva, a félkész mappa törölve. Nem készült használható mentés.\n"); exit(5); };
    pcntl_signal(SIGINT, $stop); pcntl_signal(SIGTERM, $stop);
}
$r = $b->backup(getenv('KG_DATA') ?: dirname(__DIR__) . '/data', $pos[0] ?? '', [
    'create' => in_array('--letrehoz', $flags, true),
    'allowMissing' => in_array('--hianyos-engedve', $flags, true),
    'lockWait' => (float) (getenv('KG_MENTES_ZAR_VARAKOZAS') ?: 60),
    'slowMs' => (int) (getenv('KG_MENTES_TESZT_LASSITAS_MS') ?: 0),   // csak tesztekhez
]);
fwrite($r['code'] === 0 ? STDOUT : STDERR, $r['msg'] . "\n");
exit($r['code']);
