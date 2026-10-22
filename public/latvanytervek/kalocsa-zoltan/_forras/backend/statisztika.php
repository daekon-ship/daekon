<?php
/**
 * Kalocsa GeoWorks – mérési eredmények (csak Zoltánnak, jelszóval).
 * Telepítés: /admin/statisztika.php  (a .htaccess-ben noindex + opcionálisan IP-szűrés)
 * Jelszó: a config 'stats_password_hash' kulcsa → php -r "echo password_hash('JELSZO', PASSWORD_DEFAULT);"
 */
declare(strict_types=1);
header('X-Robots-Tag: noindex, nofollow');
header('Content-Type: text/html; charset=utf-8');
$cfg = require __DIR__ . '/../../private/ajanlat-config.php';
session_start(['cookie_httponly' => true, 'cookie_secure' => true, 'cookie_samesite' => 'Strict']);
if (isset($_POST['jelszo']) && password_verify((string) $_POST['jelszo'], $cfg['stats_password_hash'])) { session_regenerate_id(true); $_SESSION['ok'] = 1; }
if (empty($_SESSION['ok'])) {
    echo '<!doctype html><meta name="viewport" content="width=device-width"><title>Statisztika</title><form method="post" style="font:16px system-ui;max-width:320px;margin:20vh auto"><label>Jelszó<br><input type="password" name="jelszo" autofocus style="width:100%;padding:10px;margin:8px 0"></label><button style="padding:10px 18px">Belépés</button></form>';
    exit;
}
$d = json_decode(@file_get_contents($cfg['stats_dir'] . '/szamlalo.json') ?: '{}', true) ?: [];
$tz = new DateTimeZone('Europe/Budapest'); $ma = new DateTime('now', $tz);
$EV = ['phone_click' => 'Telefonszámra kattintás', 'quote_submit_success' => 'Elküldött ajánlatkérés', 'email_click' => 'E-mail-címre kattintás'];
function osszeg(array $d, string $e, int $napok, DateTime $ma): int {
    $s = 0; for ($i = 0; $i < $napok; $i++) { $k = (clone $ma)->modify("-$i day")->format('Y-m-d'); $s += array_sum($d[$k][$e] ?? []); } return $s;
}
$h = fn($x) => htmlspecialchars((string) $x, ENT_QUOTES);
echo '<!doctype html><html lang="hu"><meta name="viewport" content="width=device-width"><title>Mérési eredmények</title><style>body{font:15px/1.5 system-ui;background:#2B3137;color:#fff;margin:0;padding:24px}table{border-collapse:collapse;width:100%;max-width:760px;margin:18px 0}td,th{padding:10px;border-bottom:1px solid #4A535C;text-align:right}td:first-child,th:first-child{text-align:left}b{color:#F27A21}</style><h1>Mérési eredmények</h1><p>Napi darabszámok, süti és személyes adat nélkül. A telefonkattintás a gomb megnyomása, nem bizonyított hívás.</p>';
echo '<table><tr><th>Esemény</th><th>Ma</th><th>7 nap</th><th>30 nap</th><th>365 nap</th></tr>';
foreach ($EV as $k => $n) echo '<tr><td>' . $h($n) . '</td><td>' . osszeg($d, $k, 1, $ma) . '</td><td>' . osszeg($d, $k, 7, $ma) . '</td><td><b>' . osszeg($d, $k, 30, $ma) . '</b></td><td>' . osszeg($d, $k, 365, $ma) . '</td></tr>';
echo '</table><h2>Hol kattintanak a telefonszámra? (30 nap)</h2><table><tr><th>Oldalrész</th><th>Kattintás</th></tr>';
$hely = [];
for ($i = 0; $i < 30; $i++) { $k = (clone $ma)->modify("-$i day")->format('Y-m-d'); foreach ($d[$k]['phone_click'] ?? [] as $p => $c) $hely[$p] = ($hely[$p] ?? 0) + $c; }
arsort($hely); foreach ($hely as $p => $c) echo '<tr><td>' . $h($p) . '</td><td>' . (int) $c . '</td></tr>';
echo '</table></html>';
