<?php
/**
 * Kalocsa GeoWorks – saját, süti nélküli számláló (ÉLESÍTÉSHEZ ELŐKÉSZÍTVE)
 * Mit számol: hányan kattintanak a telefonszámra (phone_click), az e-mail-címre (email_click),
 * és hány ajánlatkérés ment el sikeresen (quote_submit_success).
 * Mit NEM tárol: IP-címet, sütit, böngésző-azonosítót, személyes adatot. Csak napi darabszámot.
 * Kliens: kalocsa.js → MERES.endpoint = '/api/meres.php'  (navigator.sendBeacon, JSON)
 * Megjelenítés: statisztika.php (jelszóval védett).
 *
 * Fontos: a telefonkattintás a gomb megnyomását jelenti, nem bizonyított hívást (a hívás a telefonon történik).
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
$cfg = require __DIR__ . '/../../private/ajanlat-config.php';
require __DIR__ . '/meres-lib.php';
function out(int $c): never { http_response_code($c); echo '{"ok":' . ($c < 300 ? 'true' : 'false') . '}'; exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405);
// csak a saját oldalról (Origin vagy Referer)
$src = $_SERVER['HTTP_ORIGIN'] ?? (isset($_SERVER['HTTP_REFERER']) ? preg_replace('~^(https?://[^/]+).*$~', '$1', $_SERVER['HTTP_REFERER']) : '');
if (!in_array($src, $cfg['allowed_origins'], true)) out(403);
// robotok kiszűrése (keresőrobotok, előnézet-készítők)
if (preg_match('~bot|crawl|spider|preview|headless|lighthouse~i', $_SERVER['HTTP_USER_AGENT'] ?? '')) out(204);

$in = json_decode((string) file_get_contents('php://input', false, null, 0, 2048), true) ?: [];
$EVENTS = ['phone_click', 'email_click', 'quote_submit_success'];
$PLACES = ['fejlec', 'fooldal', 'szolgaltatasok', 'szuk-hely', 'munkaim', 'rolam', 'munkaterulet', 'ajanlat', 'zaro', 'lablec', 'fab', 'urlap', 'egyeb'];
$e = (string) ($in['e'] ?? ''); $hely = (string) ($in['hely'] ?? 'egyeb');
if (!in_array($e, $EVENTS, true)) out(400);
if (!in_array($hely, $PLACES, true)) $hely = 'egyeb';

// sikeres ajánlatkérést csak a szerver mérhet hitelesen: ezt az ajanlat.php is beírja (lásd lent), a kliens felőli jelzést nem számoljuk
if ($e === 'quote_submit_success') out(204);

// árasztás ellen: percenként legfeljebb 30 esemény összesen (egy rossz szándékú kattintgató ne torzítsa nagyon a számokat)
$dir = $cfg['stats_dir'];
@mkdir($dir, 0700, true);
meres_add($dir, $e, $hely);
out(204);
