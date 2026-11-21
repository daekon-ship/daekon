<?php
declare(strict_types=1);
/**
 * Jelszóval védett bemutató telepítése egy ÚJ, ÜRES adatmappába (V5.6).
 *
 *   KG_DATA=/utvonal/kg-bemutato-adat php bin/demo-install.php [allapot.json]
 *
 * - Csak üres adatmappába telepít (meglévő adatbázist – pl. éleset – soha nem ír felül).
 * - Két külön jelszót állít be, és csak egyszer írja ki: a bemutató belépési jelszavát (az egész oldalhoz)
 *   és az admin jelszót (a kezelőfelülethez). Megadhatók KG_DEMO_PASSWORD és KG_ADMIN_PASSWORD változóval is.
 * - A mintaadat alapból: demo/minta-allapot.json (3 mintagyűrű, szemléltető árak, „demo” jelöléssel).
 * - E-mail-beállítást nem készít; a bemutató kapuja az e-mailt mindig kikapcsolja.
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = dirname(__DIR__);
require $root . '/src/App.php';
require $root . '/src/Mailer.php';
require $root . '/src/DemoGate.php';
$data = rtrim((string) getenv('KG_DATA'), '/');
if ($data === '') { fwrite(STDERR, "Hiba: add meg a bemutató külön adatmappáját: KG_DATA=/utvonal php bin/demo-install.php\n"); exit(1); }
if (is_file($data . '/kg.sqlite') || is_file($data . '/demo-kapu.json')) { fwrite(STDERR, "Hiba: az adatmappa nem üres ($data). A bemutató csak új, üres adatmappába telepíthető.\n"); exit(1); }
$file = $argv[1] ?? $root . '/demo/minta-allapot.json';
$s = json_decode((string) @file_get_contents($file), true);
if (!is_array($s) || ($s['demo'] ?? false) !== true) { fwrite(STDERR, "Hiba: csak „demo: true” jelölésű mintaállapot telepíthető ($file).\n"); exit(1); }
$gen = static fn (string $p) => $p . '-' . substr(strtr(base64_encode(random_bytes(9)), '+/', 'kx'), 0, 12);
$demoPw = getenv('KG_DEMO_PASSWORD') ?: $gen('bemutato');
$adminPw = getenv('KG_ADMIN_PASSWORD') ?: $gen('admin');
try {
    if (!is_dir($data)) mkdir($data, 0700, true);
    $app = new App($data);
    $app->setPassword($adminPw);
    $app->seedDemo($s);
    DemoGate::install($data, $demoPw);
    @chmod($data, 0700);
} catch (Throwable $e) { fwrite(STDERR, 'Hiba: ' . $e->getMessage() . "\n"); exit(1); }
$showDemo = getenv('KG_DEMO_PASSWORD') ? '(a megadott)' : $demoPw;
$showAdmin = getenv('KG_ADMIN_PASSWORD') ? '(a megadott)' : $adminPw;
fwrite(STDOUT, "Kész: a bemutató telepítve ide: $data\n  Bemutató jelszava (az egész oldalhoz): $showDemo\n  Admin jelszó (a kezelőfelülethez):     $showAdmin\nA jelszavakat most jegyezd fel – sehol máshol nem jelennek meg.\n");
