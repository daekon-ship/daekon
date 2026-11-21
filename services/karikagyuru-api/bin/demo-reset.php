<?php
declare(strict_types=1);
/**
 * Jelszóval védett bemutató visszaállítása a kiinduló mintaadatra (V5.6).
 *
 *   KG_DATA=/utvonal/kg-bemutato-adat php bin/demo-reset.php [allapot.json]
 *
 * Törli a bemutatóban mentett árváltozásokat, jóváhagyásokat, érdeklődéseket, csatolt és feltöltött képeket,
 * és visszatölti a mintaadatot. A két jelszó megmarad. Csak „demo” jelölésű adatbázison fut – éles adatbázist nem töröl.
 * Időzítve (pl. éjjelente):  0 4 * * * KG_DATA=/utvonal php /utvonal/bin/demo-reset.php
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = dirname(__DIR__);
require $root . '/src/App.php';
require $root . '/src/Mailer.php';
$data = rtrim((string) getenv('KG_DATA'), '/');
if ($data === '' || !is_file($data . '/demo-kapu.json')) { fwrite(STDERR, "Hiba: ez nem bemutató-adatmappa (nincs demo-kapu.json): " . ($data ?: '(üres KG_DATA)') . "\n"); exit(1); }
$file = $argv[1] ?? $root . '/demo/minta-allapot.json';
$s = json_decode((string) @file_get_contents($file), true);
if (!is_array($s) || ($s['demo'] ?? false) !== true) { fwrite(STDERR, "Hiba: csak „demo: true” jelölésű mintaállapot tölthető vissza.\n"); exit(1); }
try { (new App($data))->resetDemo($s); fwrite(STDOUT, "Kész: a bemutató visszaállítva a kiinduló mintaadatra.\n"); }
catch (Throwable $e) { fwrite(STDERR, 'Hiba: ' . $e->getMessage() . "\n"); exit(1); }
