<?php
declare(strict_types=1);
/**
 * Karikagyuru – JELSZÓVAL VÉDETT, KÜLÖNÁLLÓ BEMUTATÓ: egyetlen belépési pont a teljes oldalhoz (V5.6).
 *
 * Minden kérés ide fut (Apache: .htaccess; helyben: php -S … demo/kapu.php). Ez a fájl:
 *  - bemutató módba kapcsolja az API-t (KG_DEMO=1): minden mentés „demo” jelölést kap, e-mail SOHA nem megy ki (KG_MAIL_MODE=off),
 *  - minden válaszra noindex fejlécet tesz, a robots.txt mindent tilt,
 *  - jelszót kér a teljes oldalhoz (src/DemoGate.php) – az admin felület ezen felül saját jelszót kér,
 *  - csak „demo” jelölésű adatbázissal indul el: éles adatmappára állítva megtagadja a működést.
 *
 * Beállítás: KG_DATA (külön, csak a bemutatóé, a webgyökéren kívül) és KG_SITE (a weboldal fájljai) környezeti változó,
 * vagy a mellette lévő config.php (minta: config.minta.php). Telepítés: bin/demo-install.php. Visszaállítás: bin/demo-reset.php.
 */
$cfg = is_file(__DIR__ . '/config.php') ? (array) require __DIR__ . '/config.php' : [];
$data = rtrim((string) ($cfg['data'] ?? getenv('KG_DATA') ?: ''), '/');
$site = realpath((string) ($cfg['site'] ?? getenv('KG_SITE') ?: (is_dir(__DIR__ . '/site') ? __DIR__ . '/site' : __DIR__ . '/../../../public/latvanytervek/karikagyuru')));
$src = (string) ($cfg['src'] ?? dirname(__DIR__) . '/src');

putenv('KG_DEMO=1');
putenv('KG_MAIL_MODE=off');
if ($data !== '') putenv('KG_DATA=' . $data);

header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('X-Frame-Options: SAMEORIGIN');

// A bemutató URL-előtagja (pl. /bemutato/). Beépített PHP-szerveren mindig a gyökér.
$base = PHP_SAPI === 'cli-server' ? '/' : rtrim(str_replace('\\', '/', dirname((string) ($_SERVER['SCRIPT_NAME'] ?? '/'))), '/') . '/';
$uriPath = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$path = '/' . ltrim(str_starts_with($uriPath, $base) ? substr($uriPath, strlen($base)) : $uriPath, '/');

$plain = static function (int $code, string $msg): void { http_response_code($code); header('Content-Type: text/plain; charset=utf-8'); header('Cache-Control: no-store'); echo $msg, "\n"; };

if ($path === '/robots.txt') { header('Content-Type: text/plain; charset=utf-8'); echo "User-agent: *\nDisallow: /\n"; return true; }
if ($data === '' || $site === false) { $plain(500, 'A bemutató nincs beállítva (KG_DATA / KG_SITE).'); return true; }

require $src . '/App.php';
require $src . '/Mailer.php';
require $src . '/DemoGate.php';

$gate = new DemoGate($data);
if (!$gate->installed()) { $plain(503, 'A bemutató nincs telepítve. Telepítés: php bin/demo-install.php'); return true; }

$app = new App($data);
if (!$app->isDemoData()) { $plain(503, 'Ez az adatmappa nem bemutató-adatbázis – a bemutató nem indul el. (Éles adatmappát a bemutató soha nem használ.)'); return true; }

if (!$gate->handle($app, $path, $base)) return true;

if ($path === '/api' || str_starts_with($path, '/api/')) { $app->handle(); return true; }

// A weboldal fájljai – csak a weboldal mappájából, csak engedélyezett típusok; a tesztek és a dokumentáció nem.
$types = ['html' => 'text/html; charset=utf-8', 'js' => 'text/javascript; charset=utf-8', 'mjs' => 'text/javascript; charset=utf-8', 'css' => 'text/css; charset=utf-8',
          'json' => 'application/json', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp', 'svg' => 'image/svg+xml',
          'woff2' => 'font/woff2', 'ico' => 'image/x-icon'];
if (preg_match('#^/(tests|docs)(/|$)#', $path) || preg_match('#\.(md|py|php|sh)$#i', $path)) { $plain(404, 'Nincs ilyen fájl.'); return true; }
$file = realpath($site . ($path === '/' ? '/index.html' : $path));
$ext = $file ? strtolower(pathinfo($file, PATHINFO_EXTENSION)) : '';
if ($file === false || !str_starts_with($file, $site . DIRECTORY_SEPARATOR) || !is_file($file) || !isset($types[$ext])) { $plain(404, 'Nincs ilyen fájl.'); return true; }
header('Content-Type: ' . $types[$ext]);
if (basename($file) === 'index.html') {
    header('Cache-Control: no-store');
    // szerver mód bekapcsolása + biztosan noindex
    $html = str_replace('<meta name="kg-api" content="">', '<meta name="kg-api" content="api/">', (string) file_get_contents($file));
    if (!str_contains($html, 'name="robots"')) $html = str_replace('<head>', '<head><meta name="robots" content="noindex,nofollow">', $html);
    echo $html;
    return true;
}
header('Cache-Control: private, max-age=3600');
readfile($file);
return true;
