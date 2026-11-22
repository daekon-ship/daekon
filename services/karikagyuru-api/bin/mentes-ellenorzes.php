<?php
declare(strict_types=1);
// Egy kész mentés ellenőrzése visszaállítás nélkül (méret, SHA-256, adatbázis-épség, rekordszámok, hivatkozott fájlok).
// Használat:  php bin/mentes-ellenorzes.php <mentésmappa>   → 0 = rendben, 2 = hibás
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/src/Backup.php';
$d = $argv[1] ?? '';
if ($d === '' || !is_dir($d)) { fwrite(STDERR, "Használat: php bin/mentes-ellenorzes.php <mentésmappa>\n"); exit(1); }
$e = Backup::verify(realpath($d));
if ($e === null) { $m = json_decode((string) file_get_contents("$d/manifest.json"), true); fwrite(STDOUT, "Rendben: " . basename($d) . ' – ' . count($m['files']) . " fájl és az adatbázis ellenőrizve.\n"); exit(0); }
fwrite(STDERR, "HIBÁS mentés: $e\n"); exit(2);
