<?php
/**
 * Kalocsa GeoWorks – mérési eredmények (csak Zoltánnak, jelszóval).
 * Telepítés: /admin/statisztika.php + /admin/.htaccess (csak ez a fájl érhető el, noindex, opcionális IP-szűrés)
 * Jelszó: a config 'stats_password_hash' kulcsa → php -r "echo password_hash('JELSZO', PASSWORD_DEFAULT);"
 * Munkamenet: 30 perc tétlenség vagy 8 óra után lejár; kilépés CSRF-tokennel.
 */
declare(strict_types=1);
header('X-Robots-Tag: noindex, nofollow');
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
$cfg = require __DIR__ . '/../_private/ajanlat-config.php';
// beállítatlan jelszónál zárva marad (a példakonfig helyőrzője nem érvényes hash)
if (!is_string($cfg['stats_password_hash'] ?? null) || !str_starts_with($cfg['stats_password_hash'], '$')) { http_response_code(503); exit('A statisztika nincs beállítva.'); }
session_name('kgw_admin');
session_start(['cookie_httponly' => true, 'cookie_secure' => true, 'cookie_samesite' => 'Strict', 'cookie_path' => '/admin/', 'use_strict_mode' => true]);
$most = time();
if (!empty($_SESSION['ok']) && ($most - ($_SESSION['utolso'] ?? 0) > 1800 || $most - ($_SESSION['kezdet'] ?? 0) > 28800)) { $_SESSION = []; session_regenerate_id(true); }
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
$h = fn($x) => htmlspecialchars((string) $x, ENT_QUOTES);
if (isset($_POST['kilepes']) && hash_equals($_SESSION['csrf'], (string) ($_POST['csrf'] ?? ''))) {
    $_SESSION = []; session_regenerate_id(true); header('Location: statisztika.php', true, 303); exit;
}
require_once __DIR__ . '/../api/meres-lib.php';
// jelszópróbálgatás ellen: IP-nként legfeljebb 5 próbálkozás / 15 perc. A számláló zárolt fájlban van, és a próbálkozás
// az ellenőrzés ELŐTT íródik be, így párhuzamos kérésekkel sem kerülhető meg; sikeres belépés törli.
// Ha az nginx előtét miatt minden látogató egy IP-nek látszik (trusted_proxies üres), egy támadó legfeljebb 15 percre
// zárhatja ki a statisztikából a gazdát – adatot nem ér el. Erősebb védelemhez: IP-szűrés vagy HTTP-hitelesítés az /admin/-ra.
if (isset($_POST['jelszo'])) {
    @mkdir($cfg['ratelimit_dir'], 0700, true);
    $fh = fopen($cfg['ratelimit_dir'] . '/login-' . hash('sha256', kliens_ip($cfg) . $cfg['salt']), 'c+');
    if (!$fh || !flock($fh, LOCK_EX)) { http_response_code(503); exit('Átmeneti hiba, próbáld újra.'); }
    $tries = array_values(array_filter(array_map('intval', explode("\n", stream_get_contents($fh) ?: '')), fn($t) => $t > time() - 900));
    $tilt = count($tries) >= 5;
    if (!$tilt) $tries[] = time();
    $ok = !$tilt && password_verify((string) $_POST['jelszo'], $cfg['stats_password_hash']);
    if ($ok) $tries = [];
    ftruncate($fh, 0); rewind($fh); fwrite($fh, implode("\n", $tries)); fflush($fh); flock($fh, LOCK_UN); fclose($fh);
    if ($tilt) { http_response_code(429); exit('Túl sok sikertelen próbálkozás. Próbáld újra 15 perc múlva.'); }
    if ($ok) { session_regenerate_id(true); $_SESSION['ok'] = 1; $_SESSION['kezdet'] = $most; $_SESSION['csrf'] = bin2hex(random_bytes(32)); }
}
if (empty($_SESSION['ok'])) {
    echo '<!doctype html><meta name="viewport" content="width=device-width"><title>Statisztika</title><form method="post" style="font:16px system-ui;max-width:320px;margin:20vh auto"><label>Jelszó<br><input type="password" name="jelszo" autocomplete="current-password" autofocus style="width:100%;padding:10px;margin:8px 0"></label><button style="padding:10px 18px">Belépés</button></form>';
    exit;
}
$_SESSION['utolso'] = $most;
$d = json_decode(@file_get_contents($cfg['stats_dir'] . '/szamlalo.json') ?: '{}', true) ?: [];
$tz = new DateTimeZone('Europe/Budapest'); $ma = new DateTime('now', $tz);
$EV = ['phone_click' => 'Telefonszámra kattintás', 'quote_submit_success' => 'Elküldött ajánlatkérés', 'email_click' => 'E-mail-címre kattintás'];
function osszeg(array $d, string $e, int $napok, DateTime $ma): int {
    $s = 0; for ($i = 0; $i < $napok; $i++) { $k = (clone $ma)->modify("-$i day")->format('Y-m-d'); $s += array_sum($d[$k][$e] ?? []); } return $s;
}
echo '<!doctype html><html lang="hu"><meta name="viewport" content="width=device-width"><title>Mérési eredmények</title><style>body{font:15px/1.5 system-ui;background:#2B3137;color:#fff;margin:0;padding:24px}table{border-collapse:collapse;width:100%;max-width:760px;margin:18px 0}td,th{padding:10px;border-bottom:1px solid #4A535C;text-align:right}td:first-child,th:first-child{text-align:left}b{color:#F27A21}</style><form method="post" style="float:right"><input type="hidden" name="csrf" value="' . $h($_SESSION['csrf']) . '"><button name="kilepes" value="1" style="padding:8px 14px">Kilépés</button></form><h1>Mérési eredmények</h1><p>Napi darabszámok, süti és személyes adat nélkül. A telefonkattintás a gomb megnyomása, nem bizonyított hívás.</p>';
echo '<table><tr><th>Esemény</th><th>Ma</th><th>7 nap</th><th>30 nap</th><th>365 nap</th></tr>';
foreach ($EV as $k => $n) echo '<tr><td>' . $h($n) . '</td><td>' . osszeg($d, $k, 1, $ma) . '</td><td>' . osszeg($d, $k, 7, $ma) . '</td><td><b>' . osszeg($d, $k, 30, $ma) . '</b></td><td>' . osszeg($d, $k, 365, $ma) . '</td></tr>';
echo '</table><h2>Hol kattintanak a telefonszámra? (30 nap)</h2><table><tr><th>Oldalrész</th><th>Kattintás</th></tr>';
$hely = [];
for ($i = 0; $i < 30; $i++) { $k = (clone $ma)->modify("-$i day")->format('Y-m-d'); foreach ($d[$k]['phone_click'] ?? [] as $p => $c) $hely[$p] = ($hely[$p] ?? 0) + $c; }
arsort($hely); foreach ($hely as $p => $c) echo '<tr><td>' . $h($p) . '</td><td>' . (int) $c . '</td></tr>';
echo '</table></html>';
