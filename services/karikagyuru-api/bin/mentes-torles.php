<?php
declare(strict_types=1);
// Régi mentések törlése (V5.8.1). Alapból CSAK KIÍRJA, mi lenne törölhető; törölni a --torles kapcsolóval lehet.
// Használat:  php bin/mentes-torles.php <mentések mappája> --napok N [--megtart K] [--torles]
//   N: ennyi napnál régebbi mentés törölhető – az ügyféllel (adatkezelési tájékoztató) egyeztetett érték; nincs alapértelmezés.
//   K: a legújabb K mentés mindig megmarad (alapból 7).
//   Csak kg-mentes-ÉÉÉÉHHNN-ÓÓPPMM nevű, manifest.json-t tartalmazó mappához nyúl; mást nem töröl.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/src/Backup.php';
$a = array_slice($argv, 1);
$dir = ''; $days = 0; $keep = 7; $apply = false;
for ($i = 0; $i < count($a); $i++) {
    if ($a[$i] === '--napok') $days = (int) ($a[++$i] ?? 0);
    elseif ($a[$i] === '--megtart') $keep = (int) ($a[++$i] ?? 0);
    elseif ($a[$i] === '--torles') $apply = true;
    elseif (!str_starts_with($a[$i], '--') && $dir === '') $dir = $a[$i];
    else { fwrite(STDERR, "Ismeretlen kapcsoló: {$a[$i]}\n"); exit(1); }
}
if ($dir === '' || $days < 1) { fwrite(STDERR, "Használat: php bin/mentes-torles.php <mappa> --napok N [--megtart K] [--torles]  (N az ügyféllel egyeztetett megőrzési idő)\n"); exit(1); }
$r = Backup::prune($dir, $days, $keep, $apply);
fwrite($r['code'] === 0 ? STDOUT : STDERR, $r['msg'] . "\n");
exit($r['code']);
