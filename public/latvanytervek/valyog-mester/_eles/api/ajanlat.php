<?php
/**
 * Vályog-Mester – ajánlatkérő fogadó végpont (PHP 8.1+)
 * ---------------------------------------------------------------------------
 * - Csak POST, multipart/form-data. Válasz: JSON {ok, code, message}.
 * - Kliens- ÉS szerveroldali validáció, mezőnkénti fehérlistákkal.
 * - Spamvédelem: rejtett csapdamező (weboldal), időcsapda (t), IP-alapú korlátozás.
 * - Dupla beküldés ellen: egyszeri token (token) – ugyanaz a kérés nem megy ki kétszer.
 * - Fotók: max. 6 db, egyenként max. 10 MB, valódi tartalom-ellenőrzés (finfo + képfejléc),
 *   SEMMIT nem tárolunk: a PHP ideiglenes fájlja a kérés végén törlődik, a kép
 *   kizárólag e-mail-mellékletként megy a vállalkozásnak.
 * - E-mail: SMTP (TLS/SSL, AUTH LOGIN). Hitelesítő adatok KIZÁRÓLAG környezeti
 *   változóból vagy webgyökéren kívüli ini-fájlból (lásd TELEPITES.md).
 * - Amíg nincs beállítva a fogadó cím és az SMTP, 503-mal válaszol – soha nem
 *   jelez hamis sikert.
 */
declare(strict_types=1);

const MAX_FILES = 6;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 40 * 1024 * 1024;
const RATE_LIMIT = 5;            // beküldés / IP / óra
const RATE_WINDOW = 3600;
const MIN_FILL_SECONDS = 4;      // ennél gyorsabb kitöltés = robot
const TOKEN_TTL = 86400;

date_default_timezone_set('Europe/Budapest');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

function respond(int $status, bool $ok, string $code, string $message = ''): never {
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'code' => $code, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ---------- konfiguráció ---------- */
function config(): array {
    $keys = ['MAIL_TO', 'MAIL_FROM', 'MAIL_FROM_NAME', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS',
             'SMTP_SECURE', 'MAIL_TRANSPORT', 'DATA_DIR', 'HASH_SALT', 'ALLOWED_ORIGIN'];
    $cfg = [];
    $iniPath = getenv('VALYOG_CONFIG') ?: dirname(__DIR__, 2) . '/private/valyog-ajanlat.ini';
    $ini = is_readable($iniPath) ? (parse_ini_file($iniPath, false, INI_SCANNER_RAW) ?: []) : [];
    foreach ($keys as $k) {
        $v = getenv($k);
        $cfg[$k] = ($v !== false && $v !== '') ? $v : ($ini[$k] ?? '');
    }
    $cfg['SMTP_PORT'] = (int)($cfg['SMTP_PORT'] ?: 587);
    $cfg['SMTP_SECURE'] = strtolower($cfg['SMTP_SECURE'] ?: 'tls');          // tls | ssl | none
    $cfg['MAIL_TRANSPORT'] = strtolower($cfg['MAIL_TRANSPORT'] ?: 'smtp');   // smtp | mail
    $cfg['MAIL_FROM_NAME'] = $cfg['MAIL_FROM_NAME'] ?: 'Vályog-Mester weboldal';
    $cfg['DATA_DIR'] = $cfg['DATA_DIR'] ?: (sys_get_temp_dir() . '/valyog-ajanlat');
    return $cfg;
}

/* ---------- alap ellenőrzések ---------- */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'method', 'Csak POST kérés fogadható.');
}
$cfg = config();
if ($cfg['ALLOWED_ORIGIN'] !== '' && isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] !== $cfg['ALLOWED_ORIGIN']) {
    respond(403, false, 'origin', 'A kérés nem erről az oldalról érkezett.');
}
// túl nagy kérés esetén a PHP üres $_POST-ot ad
$len = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($len > MAX_TOTAL_BYTES + 1024 * 1024 || ($len > 0 && empty($_POST) && empty($_FILES))) {
    respond(413, false, 'too_large', 'A csatolt fotók együtt túl nagyok.');
}
if (!filter_var($cfg['MAIL_TO'], FILTER_VALIDATE_EMAIL) || !filter_var($cfg['MAIL_FROM'], FILTER_VALIDATE_EMAIL)
    || ($cfg['MAIL_TRANSPORT'] === 'smtp' && $cfg['SMTP_HOST'] === '')) {
    error_log('[valyog-ajanlat] nincs beállítva: MAIL_TO / MAIL_FROM / SMTP_HOST');
    respond(503, false, 'not_configured', 'Az online beküldés jelenleg nem elérhető.');
}
if (!is_dir($cfg['DATA_DIR']) && !@mkdir($cfg['DATA_DIR'], 0700, true)) {
    error_log('[valyog-ajanlat] DATA_DIR nem hozható létre: ' . $cfg['DATA_DIR']);
    respond(503, false, 'storage', 'Az online beküldés jelenleg nem elérhető.');
}

/* ---------- spamvédelem ---------- */
$post = static fn(string $k): string => is_string($_POST[$k] ?? null) ? trim((string)$_POST[$k]) : '';
if ($post('weboldal') !== '') {            // csapdamező: ember nem látja, robot kitölti
    respond(200, true, 'ok');               // csendes elnyelés – robotnak nem árulunk el semmit
}
$t = (int)$post('t');
if ($t > 0 && (microtime(true) * 1000 - $t) < MIN_FILL_SECONDS * 1000) {
    respond(422, false, 'too_fast', 'Kérjük, ellenőrizze az adatokat, és küldje el újra.');
}

$salt = $cfg['HASH_SALT'] ?: 'valyog';
$ipKey = hash('sha256', $salt . '|' . ($_SERVER['REMOTE_ADDR'] ?? '0'));
$rateFile = $cfg['DATA_DIR'] . '/rate-' . substr($ipKey, 0, 32) . '.json';
$now = time();
$hits = [];
if (is_readable($rateFile)) {
    $hits = array_values(array_filter((array)json_decode((string)file_get_contents($rateFile), true),
        static fn($ts) => is_int($ts) && $ts > $now - RATE_WINDOW));
}
if (count($hits) >= RATE_LIMIT) {
    respond(429, false, 'rate_limited', 'Rövid időn belül túl sok kérés érkezett. Kérjük, próbálja újra később.');
}

/* ---------- dupla beküldés ---------- */
$token = $post('token');
if (!preg_match('/^[A-Za-z0-9-]{8,64}$/', $token)) {
    respond(422, false, 'token', 'Kérjük, töltse újra az oldalt, és küldje el ismét.');
}
$tokenFile = $cfg['DATA_DIR'] . '/token-' . hash('sha256', $salt . $token) . '.done';
if (is_file($tokenFile)) {
    respond(200, true, 'duplicate', 'Ezt az ajánlatkérést már megkaptuk.');
}

/* ---------- mezők validálása ---------- */
const EPULET = ['Vályogház', 'Vert falú ház', 'Vegyes falazatú ház', 'Tégla vagy egyéb', 'Nem tudom'];
const EPITES = ['', '1950 előtt', '1950–1970', '1970 után', 'Nem tudom'];
const MUNKA  = ['Repedések a falon', 'Nedvesedő falszakasz', 'Leváló, sérült vakolat', 'Alapozási probléma gyanúja',
                'Teljes felújítás', 'Lakás-, fürdőszoba-felújítás', 'Kőművesmunka, átalakítás', 'Alapozás, betonozás, bontás', 'Szigetelés', 'Tető, nyílászárók', 'Térkövezés, udvar, kert', 'Kerítés, kocsibeálló, terasz', 'Egyéb'];
const KEZDES = ['', 'Azonnal / 1–2 héten belül', '2–4 héten belül', '1–2 hónapon belül', 'Később / csak tájékozódom'];
const HIVAS  = ['', 'Délelőtt', 'Délután', 'Este 6 előtt'];

$clean = static fn(string $s, int $max): string =>
    mb_substr(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '', 0, $max);
$errors = [];
$d = [
    'epulet'    => $post('epulet'),
    'epites'    => $post('epites'),
    'telepules' => $clean($post('telepules'), 80),
    'irsz'      => $post('irsz'),
    'kezdes'    => $post('kezdes'),
    'leiras'    => $clean($post('leiras'), 1500),
    'nev'       => $clean($post('nev'), 80),
    'telefon'   => $clean($post('telefon'), 30),
    'email'     => $clean($post('email'), 120),
    'hivas'     => $post('hivas'),
];
$munka = array_values(array_filter((array)($_POST['problema'] ?? []), 'is_string'));

if (!in_array($d['epulet'], EPULET, true)) $errors[] = 'az épület típusát';
if (!in_array($d['epites'], EPITES, true)) $d['epites'] = '';
if (!$munka || array_diff($munka, MUNKA)) $errors[] = 'legalább egy munkát vagy problémát';
if (mb_strlen($d['telepules']) < 2) $errors[] = 'a település nevét';
if ($d['irsz'] !== '' && !preg_match('/^\d{4}$/', $d['irsz'])) $errors[] = 'érvényes irányítószámot (4 számjegy)';
if (!in_array($d['kezdes'], KEZDES, true)) $d['kezdes'] = '';
if (mb_strlen($d['nev']) < 2) $errors[] = 'a nevét';
if (!preg_match('/^\+?[\d\s()\/-]{8,}$/', $d['telefon']) || strlen(preg_replace('/\D/', '', $d['telefon'])) < 9) $errors[] = 'egy hívható telefonszámot';
if ($d['email'] !== '' && !filter_var($d['email'], FILTER_VALIDATE_EMAIL)) $errors[] = 'érvényes e-mail-címet (vagy hagyja üresen)';
if (!in_array($d['hivas'], HIVAS, true)) $d['hivas'] = '';
if ($post('hozzajarulas') !== 'igen') $errors[] = 'hogy elolvasta az adatkezelési tájékoztatót';

/* ---------- fotók ---------- */
const MIME_OK = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/heic' => 'heic', 'image/heif' => 'heif'];
$attachments = [];
$fileErrors = [];
$f = $_FILES['fotok'] ?? null;
if ($f && is_array($f['name'] ?? null)) {
    $n = count($f['name']);
    if ($n > MAX_FILES) $fileErrors[] = 'Legfeljebb 6 fotó csatolható.';
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $total = 0;
    for ($i = 0; $i < min($n, MAX_FILES); $i++) {
        $err = $f['error'][$i];
        if ($err === UPLOAD_ERR_NO_FILE) continue;
        if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE || $f['size'][$i] > MAX_FILE_BYTES) {
            respond(413, false, 'file_too_large', 'Az egyik fotó nagyobb 10 MB-nál.');
        }
        if ($err !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'][$i])) { $fileErrors[] = 'Az egyik fotó feltöltése megszakadt.'; continue; }
        $mime = $finfo->file($f['tmp_name'][$i]) ?: '';
        if (!isset(MIME_OK[$mime])) { $fileErrors[] = 'Csak JPG, PNG, WEBP vagy HEIC fotó tölthető fel.'; continue; }
        if (in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true) && @getimagesize($f['tmp_name'][$i]) === false) {
            $fileErrors[] = 'Az egyik fotó sérült vagy nem olvasható.'; continue;
        }
        $total += (int)$f['size'][$i];
        if ($total > MAX_TOTAL_BYTES) respond(413, false, 'too_large', 'A csatolt fotók együtt túl nagyok.');
        $attachments[] = [
            'name' => sprintf('foto-%d.%s', count($attachments) + 1, MIME_OK[$mime]),   // eredeti fájlnév nem kerül át
            'mime' => $mime,
            'data' => (string)file_get_contents($f['tmp_name'][$i]),
        ];
    }
}

if ($errors || $fileErrors) {
    $msg = $errors ? 'Kérjük, adja meg ' . implode(', ', array_unique($errors)) . '.' : '';
    respond(422, false, 'invalid', trim($msg . ' ' . implode(' ', array_unique($fileErrors))));
}

/* ---------- e-mail összeállítása ---------- */
$sor = static fn(string $k, string $v): string => $k . ':' . str_repeat(' ', max(1, 13 - mb_strlen($k))) . ($v !== '' ? $v : '–') . "\n";
$body  = "Új ajánlatkérés érkezett a valyogmester.hu oldalról.\n\n";
$body .= $sor('Név', $d['nev']) . $sor('Telefon', $d['telefon']) . $sor('E-mail', $d['email']) . $sor('Hívható', $d['hivas'] ?: 'mindegy');
$body .= "\n" . $sor('Település', trim($d['irsz'] . ' ' . $d['telepules'])) . $sor('Épület', $d['epulet']) . $sor('Épült', $d['epites']);
$body .= $sor('Munka', implode(', ', $munka)) . $sor('Kezdés', $d['kezdes']);
$body .= "\nLeírás:\n" . ($d['leiras'] !== '' ? $d['leiras'] : '–') . "\n";
$body .= "\nCsatolt fotók: " . count($attachments) . " db\n";
$body .= "Beküldve: " . date('Y-m-d H:i') . " · adatkezelési tájékoztató elfogadva\n";

$subject = 'Ajánlatkérés – ' . $d['telepules'] . ' – ' . $d['nev'];
$replyTo = $d['email'] !== '' ? $d['email'] : '';

// a korlátba minden érvényes próbálkozás beleszámít (siker és sikertelen küldés is)
$hits[] = $now;
@file_put_contents($rateFile, json_encode($hits), LOCK_EX);

try {
    send_mail($cfg, $subject, $body, $attachments, $replyTo);
} catch (Throwable $e) {
    error_log('[valyog-ajanlat] küldési hiba: ' . $e->getMessage());
    respond(502, false, 'send_failed', 'A küldés most nem sikerült.');
}

/* ---------- siker: token és korlát rögzítése (személyes adat nélkül) ---------- */
@file_put_contents($tokenFile, (string)$now, LOCK_EX);
// régi token-/korlátfájlok takarítása (nincs bennük személyes adat)
foreach ((array)glob($cfg['DATA_DIR'] . '/{token-*.done,rate-*.json}', GLOB_BRACE) as $old) {
    if (is_file($old) && filemtime($old) < $now - TOKEN_TTL) @unlink($old);
}
respond(200, true, 'sent', 'Köszönjük, megkaptuk.');


/* =========================================================================
 * Levélküldés – MIME + SMTP, külső függőség nélkül
 * ========================================================================= */
function enc_header(string $s): string { return '=?UTF-8?B?' . base64_encode($s) . '?='; }

function build_message(array $cfg, string $subject, string $body, array $att, string $replyTo, string &$boundary): string {
    $boundary = 'vm-' . bin2hex(random_bytes(12));
    $domain = substr(strrchr($cfg['MAIL_FROM'], '@') ?: '@localhost', 1);
    $h  = 'Date: ' . date(DATE_RFC2822) . "\r\n";
    $h .= 'From: ' . enc_header($cfg['MAIL_FROM_NAME']) . ' <' . $cfg['MAIL_FROM'] . ">\r\n";
    $h .= 'To: <' . $cfg['MAIL_TO'] . ">\r\n";
    if ($replyTo !== '') $h .= 'Reply-To: <' . $replyTo . ">\r\n";
    $h .= 'Subject: ' . enc_header($subject) . "\r\n";
    $h .= 'Message-ID: <' . bin2hex(random_bytes(10)) . '@' . $domain . ">\r\n";
    $h .= "MIME-Version: 1.0\r\n";
    $h .= 'Content-Type: multipart/mixed; boundary="' . $boundary . "\"\r\n";
    $m  = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
    $m .= chunk_split(base64_encode($body)) . "\r\n";
    foreach ($att as $a) {
        $m .= "--$boundary\r\nContent-Type: {$a['mime']}; name=\"{$a['name']}\"\r\nContent-Transfer-Encoding: base64\r\n";
        $m .= "Content-Disposition: attachment; filename=\"{$a['name']}\"\r\n\r\n" . chunk_split(base64_encode($a['data'])) . "\r\n";
    }
    $m .= "--$boundary--\r\n";
    return $h . "\r\n" . $m;
}

function send_mail(array $cfg, string $subject, string $body, array $att, string $replyTo): void {
    $boundary = '';
    $raw = build_message($cfg, $subject, $body, $att, $replyTo, $boundary);
    if ($cfg['MAIL_TRANSPORT'] === 'mail') {
        [$headers, $msg] = explode("\r\n\r\n", $raw, 2);
        $headers = preg_replace('/^(To|Subject):.*\r\n/m', '', $headers);
        if (!mail($cfg['MAIL_TO'], enc_header($subject), $msg, $headers, '-f' . $cfg['MAIL_FROM'])) {
            throw new RuntimeException('mail() hiba');
        }
        return;
    }
    smtp_send($cfg, $raw);
}

function smtp_send(array $cfg, string $raw): void {
    $host = $cfg['SMTP_HOST']; $port = $cfg['SMTP_PORT']; $sec = $cfg['SMTP_SECURE'];
    $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'SNI_enabled' => true]]);
    $remote = ($sec === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
    $s = @stream_socket_client($remote, $errno, $errstr, 20, STREAM_CLIENT_CONNECT, $ctx);
    if (!$s) throw new RuntimeException("SMTP kapcsolat: $errstr ($errno)");
    stream_set_timeout($s, 30);
    $read = static function () use ($s): string {
        $out = '';
        while (($line = fgets($s, 1024)) !== false) { $out .= $line; if (strlen($line) < 4 || $line[3] === ' ') break; }
        return $out;
    };
    $cmd = static function (string $c, array $expect) use ($s, $read): string {
        if ($c !== '') fwrite($s, $c . "\r\n");
        $r = $read();
        if (!in_array((int)substr($r, 0, 3), $expect, true)) {
            throw new RuntimeException('SMTP: ' . (str_starts_with($c, 'AUTH') || strlen($c) > 60 ? '[…]' : $c) . ' → ' . trim($r));
        }
        return $r;
    };
    $ehloHost = preg_replace('/[^a-z0-9.-]/i', '', $_SERVER['SERVER_NAME'] ?? 'localhost') ?: 'localhost';
    $cmd('', [220]);
    $ehlo = $cmd('EHLO ' . $ehloHost, [250]);
    if ($sec === 'tls') {
        $cmd('STARTTLS', [220]);
        if (!stream_socket_enable_crypto($s, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) {
            throw new RuntimeException('STARTTLS sikertelen');
        }
        $ehlo = $cmd('EHLO ' . $ehloHost, [250]);
    }
    if ($cfg['SMTP_USER'] !== '') {
        $cmd('AUTH LOGIN', [334]);
        $cmd(base64_encode($cfg['SMTP_USER']), [334]);
        $cmd(base64_encode($cfg['SMTP_PASS']), [235]);
    }
    $cmd('MAIL FROM:<' . $cfg['MAIL_FROM'] . '>', [250]);
    $cmd('RCPT TO:<' . $cfg['MAIL_TO'] . '>', [250, 251]);
    $cmd('DATA', [354]);
    $data = preg_replace('/^\./m', '..', str_replace(["\r\n", "\n"], ["\n", "\r\n"], $raw));
    fwrite($s, $data . "\r\n.\r\n");
    $cmd('', [250]);
    fwrite($s, "QUIT\r\n");
    fclose($s);
}
