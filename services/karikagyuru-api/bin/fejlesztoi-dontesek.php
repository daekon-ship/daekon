<?php
declare(strict_types=1);
// V5.9 – Fejlesztői nyilvántartás (a 25 tisztázandó ügyfélkérdés válaszai). CSAK parancssorból.
// A tulajdonosi kezelőfelület és az API ezt nem adja ki és nem írhatja felül (lásd App::getState / putState).
// Használat:
//   KG_DATA=… php bin/fejlesztoi-dontesek.php lista
//   KG_DATA=… php bin/fejlesztoi-dontesek.php beallit <tétel> <nyitott|valasz|atvezetve> "<válasz>"
//   KG_DATA=… php bin/fejlesztoi-dontesek.php export > dontesek.json     (a fájl személyes/üzleti adatot tartalmazhat: ne commitold)
// A tételek listája és kérdései: public/latvanytervek/karikagyuru/js/decisions.js
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/src/App.php';
$cmd = $argv[1] ?? '';
try {
    $app = new App(getenv('KG_DATA') ?: dirname(__DIR__) . '/data');
    if ($cmd === 'lista') {
        $d = $app->decisions();
        if (!$d) { echo "Nincs rögzített válasz – minden tétel nyitott.\n"; exit(0); }
        foreach ($d as $k => $x) printf("%-14s %-10s %s\n", $k, $x['status'] ?? '?', str_replace("\n", ' ', (string) ($x['answer'] ?? '')));
        exit(0);
    }
    if ($cmd === 'export') { echo json_encode((object) $app->decisions(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), "\n"; exit(0); }
    if ($cmd === 'beallit') {
        $v = $app->setDecision((string) ($argv[2] ?? ''), (string) ($argv[3] ?? ''), (string) ($argv[4] ?? ''));
        echo "Mentve ({$v}. változat). A megnyitott kezelőfelületen a következő mentés előtt újratöltés kell.\n"; exit(0);
    }
    fwrite(STDERR, "Használat: php bin/fejlesztoi-dontesek.php lista | export | beallit <tétel> <nyitott|valasz|atvezetve> \"<válasz>\"\n"); exit(1);
} catch (Throwable $e) { fwrite(STDERR, 'HIBA: ' . $e->getMessage() . "\n"); exit(2); }
