<?php
declare(strict_types=1);
// Bemutató mintaadat betöltése egy ÜRES adatbázisba (külön adatmappa!).
// Használat:  KG_DATA=/tmp/kg-bemutato php bin/demo-seed.php allapot.json
// Védelem: csak „demo: true” jelölésű állapotot tölt be, és csak akkor, ha az adatbázisban még nincs mentett változat –
// így éles adatbázisba véletlenül sem kerülhet mintaadat.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/src/App.php';
require dirname(__DIR__) . '/src/Mailer.php';
$file = $argv[1] ?? '';
$s = json_decode((string) @file_get_contents($file), true);
if (!is_array($s) || ($s['demo'] ?? false) !== true) { fwrite(STDERR, "Hiba: csak „demo: true” jelölésű állapot tölthető be.\n"); exit(1); }
try { (new App())->seedDemo($s); fwrite(STDOUT, "Kész: bemutató mintaadat betöltve.\n"); }
catch (Throwable $e) { fwrite(STDERR, 'Hiba: ' . $e->getMessage() . "\n"); exit(1); }
