<?php
declare(strict_types=1);
// Visszaállítás mentésből (V5.8.1) – ÚJ, ÜRES adatmappába. Meglévő adatot soha nem ír felül.
// Használat:  KG_DATA=/home/<fiók>/kg-adat-uj php bin/visszaallitas.php <mentésmappa> [--bemutato] [--hianyos-engedve]
//   Előbb a teljes mentést ellenőrzi (méret, SHA-256, adatbázis-épség, rekordszámok); hibánál semmi nem változik.
//   Bemutató (minta)adat mentése csak --bemutato kapcsolóval állítható vissza, éles mentés azzal nem.
// Lépések élesben: docs/MENTES_ES_VISSZAALLITAS.md
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/src/Backup.php';
umask(0077);
$args = array_slice($argv, 1);
$flags = array_values(array_filter($args, fn ($a) => str_starts_with($a, '--')));
$pos = array_values(array_filter($args, fn ($a) => !str_starts_with($a, '--')));
foreach ($flags as $f) if (!in_array($f, ['--bemutato', '--hianyos-engedve'], true)) { fwrite(STDERR, "Ismeretlen kapcsoló: $f\n"); exit(1); }
$data = getenv('KG_DATA');
if (!$data || !isset($pos[0])) { fwrite(STDERR, "Használat: KG_DATA=<új, üres adatmappa> php bin/visszaallitas.php <mentésmappa>\n"); exit(1); }
$r = Backup::restore($pos[0], $data, ['demo' => in_array('--bemutato', $flags, true), 'allowMissing' => in_array('--hianyos-engedve', $flags, true)]);
fwrite($r['code'] === 0 ? STDOUT : STDERR, $r['msg'] . "\n");
exit($r['code']);
