<?php
declare(strict_types=1);
// Használat:  KG_DATA=/utvonal/a/webgyokeren/kivul php bin/setup.php
// A jelszót bekéri (vagy a KG_ADMIN_PASSWORD környezeti változóból veszi). Sehova nem írja ki, nem naplózza.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/src/App.php';
$pw = getenv('KG_ADMIN_PASSWORD');
if ($pw === false || $pw === '') { fwrite(STDOUT, "Új admin jelszó (legalább 12 karakter): "); $pw = trim((string) fgets(STDIN)); }
try { (new App())->setPassword($pw); fwrite(STDOUT, "Kész: a jelszó beállítva.\n"); }
catch (Throwable $e) { fwrite(STDERR, 'Hiba: ' . $e->getMessage() . "\n"); exit(1); }
