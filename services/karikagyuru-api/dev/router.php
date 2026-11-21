<?php
declare(strict_types=1);
// Fejlesztői router: a weboldal és az API egy címen, úgy, ahogy a tárhelyen lesz (oldal + /api).
// Indítás:  KG_DATA=/tmp/kg-adat php -S 127.0.0.1:8792 dev/router.php
$site = realpath(getenv('KG_SITE') ?: __DIR__ . '/../../../public/latvanytervek/karikagyuru');
$path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (str_starts_with($path, '/api/') || $path === '/api') {
    require __DIR__ . '/../src/App.php';
    (new App())->handle();
    return true;
}
$file = realpath($site . ($path === '/' ? '/index.html' : $path));
if ($file === false || !str_starts_with($file, $site) || !is_file($file)) { http_response_code(404); echo 'Nincs ilyen fájl.'; return true; }
$types = ['html' => 'text/html; charset=utf-8', 'js' => 'text/javascript', 'mjs' => 'text/javascript', 'css' => 'text/css', 'json' => 'application/json',
          'png' => 'image/png', 'jpg' => 'image/jpeg', 'webp' => 'image/webp', 'svg' => 'image/svg+xml', 'woff2' => 'font/woff2', 'md' => 'text/plain; charset=utf-8'];
header('Content-Type: ' . ($types[strtolower(pathinfo($file, PATHINFO_EXTENSION))] ?? 'application/octet-stream'));
if (basename($file) === 'index.html') {
    // Ugyanaz, mint telepítéskor: a <meta name="kg-api"> kitöltése kapcsolja be a szerveres mentést.
    echo str_replace('<meta name="kg-api" content="">', '<meta name="kg-api" content="api/">', (string) file_get_contents($file));
    return true;
}
readfile($file);
return true;
