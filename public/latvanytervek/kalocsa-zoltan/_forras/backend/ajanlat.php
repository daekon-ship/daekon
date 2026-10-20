<?php
/**
 * Kalocsa GeoWorks – ajánlatkérő végpont (ÉLESÍTÉSHEZ ELŐKÉSZÍTVE, NINCS TELEPÍTVE)
 * Telepítés: PHP 8.1+ tárhely, PHPMailer (composer require phpmailer/phpmailer), SMTP fiók.
 * A titkos adatok NEM ide kerülnek: a config.php a webgyökéren KÍVÜL legyen (lásd config.example.php).
 * Kliens: kalocsa.js → AJANLAT.endpoint = 'https://<domain>/api/ajanlat.php'
 * Válasz: JSON { ok: true } vagy { ok: false, error: '...' } – a kliens csak ok:true esetén jelez sikert és mér konverziót.
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$cfg = require __DIR__ . '/../../private/ajanlat-config.php'; // webgyökéren kívül!
require $cfg['autoload'];
use PHPMailer\PHPMailer\PHPMailer;

function out(int $code, array $body): never { http_response_code($code); echo json_encode($body, JSON_UNESCAPED_UNICODE); exit; }

// 1) csak POST, csak a saját domainről
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['ok' => false, 'error' => 'method']);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && !in_array($origin, $cfg['allowed_origins'], true)) out(403, ['ok' => false, 'error' => 'origin']);

// 2) spam: honeypot + minimális kitöltési idő
if (!empty($_POST['weboldal'])) out(200, ['ok' => true]); // botnak csendben "ok", de nem küldünk
if ((int)($_POST['kitoltesi_ido_ms'] ?? 0) < 3000) out(400, ['ok' => false, 'error' => 'too-fast']);

// 3) túlterhelés: IP-nként max. 5 kérés / óra (fájlalapú, csak hash-t tárol, személyes adat nincs naplózva)
$ipHash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . $cfg['salt']);
$rlFile = $cfg['ratelimit_dir'] . '/' . $ipHash;
$hits = array_filter(array_map('intval', @file($rlFile, FILE_IGNORE_NEW_LINES) ?: []), fn($t) => $t > time() - 3600);
if (count($hits) >= 5) out(429, ['ok' => false, 'error' => 'rate-limit']);
$hits[] = time(); @file_put_contents($rlFile, implode("\n", $hits), LOCK_EX);

// 4) mezők szerveroldali ellenőrzése
$s = fn(string $k, int $max) => mb_substr(trim(strip_tags((string)($_POST[$k] ?? ''))), 0, $max);
$nev = $s('nev', 120); $tel = $s('telefon', 40); $hely = $s('helyszin', 160); $leiras = $s('leiras', 3000);
$email = $s('email', 160); $mikor = $s('mikor', 60);
$TIPUSOK = ['Alapásás', 'Közműárok-ásás', 'Nyomvonalásás', 'Tuskóeltávolítás', 'Tereprendezés', 'Egyéb földmunka'];
$munka = array_values(array_intersect((array)($_POST['munka'] ?? []), $TIPUSOK));
$errors = [];
if ($nev === '') $errors[] = 'nev';
if (!preg_match('/^(\+36|06|36)?\d{8,9}$/', preg_replace('/[\s\-()\/]/', '', $tel))) $errors[] = 'telefon';
if ($hely === '') $errors[] = 'helyszin';
if (!$munka) $errors[] = 'munka';
if ($leiras === '') $errors[] = 'leiras';
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'email';
if (($_POST['adatkezeles'] ?? '') === '') $errors[] = 'adatkezeles';
if ($errors) out(422, ['ok' => false, 'error' => 'validation', 'fields' => $errors]);

// 5) fájlok: max 5 db, egyenként max 8 MB, valódi MIME-ellenőrzés (finfo), csak memóriában → e-mail-melléklet, nem tároljuk
$ALLOWED = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/heic' => 'heic', 'image/heif' => 'heif'];
$attach = [];
if (!empty($_FILES['fotok']['tmp_name'])) {
  $fi = new finfo(FILEINFO_MIME_TYPE);
  foreach ((array)$_FILES['fotok']['tmp_name'] as $i => $tmp) {
    if (count($attach) >= 5) break;
    if (($_FILES['fotok']['error'][$i] ?? 1) !== UPLOAD_ERR_OK || !is_uploaded_file($tmp)) continue;
    if (filesize($tmp) > 8 * 1024 * 1024) out(413, ['ok' => false, 'error' => 'file-size']);
    $mime = $fi->file($tmp);
    if (!isset($ALLOWED[$mime])) out(415, ['ok' => false, 'error' => 'file-type']);
    $attach[] = [$tmp, 'foto-' . (count($attach) + 1) . '.' . $ALLOWED[$mime]]; // eredeti fájlnév nem kerül felhasználásra
  }
}

// 6) e-mail SMTP-n (titkok a config-ból)
$m = new PHPMailer(true);
try {
  $m->isSMTP(); $m->Host = $cfg['smtp_host']; $m->SMTPAuth = true; $m->Username = $cfg['smtp_user'];
  $m->Password = $cfg['smtp_pass']; $m->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; $m->Port = (int)$cfg['smtp_port'];
  $m->CharSet = 'UTF-8';
  $m->setFrom($cfg['from'], 'Kalocsa GeoWorks weboldal');
  $m->addAddress($cfg['to']); // zkalocsa8@gmail.com
  if ($email !== '') $m->addReplyTo($email, $nev);
  $m->Subject = 'Ajánlatkérés – ' . implode(', ', $munka) . ' – ' . $hely;
  $m->Body = "Név: $nev\nTelefon: $tel\nHelyszín: $hely\nMunka: " . implode(', ', $munka) .
             "\nMikor: " . ($mikor ?: '-') . "\nE-mail: " . ($email ?: '-') . "\n\n$leiras\n";
  foreach ($attach as [$tmp, $name]) $m->addAttachment($tmp, $name);
  $m->send();
} catch (Throwable $e) {
  error_log('ajanlat: mail failed'); // csak a tény, személyes adat nélkül
  out(502, ['ok' => false, 'error' => 'mail']);
}
out(200, ['ok' => true]);
