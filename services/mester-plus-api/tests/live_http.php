<?php
// Élő HTTP-teszt a telepített API ellen (valódi nginx + PHP-FPM + MariaDB). Csak eldobható teszt-fiókot használ.
//   php tests/live_http.php <fázis> <base-url> [resolve-ip:port]
// Fázisok: flow (auth, idempotencia, sérült feltöltés, ajánlat, dupla elfogadás, webhook) · expired <url> · db-down · storage-down · load <n> <párhuzamos>
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
const MP_API = true;
require dirname(__DIR__) . '/src/bootstrap.php';

use MesterPlus\QuoteCalculator;

[$phase, $base] = [$argv[1] ?? 'flow', rtrim($argv[2] ?? '', '/')];
$resolve = $argv[3] ?? '';
$host = (string) parse_url($base, PHP_URL_HOST);
$port = (int) (parse_url($base, PHP_URL_PORT) ?: (str_starts_with($base, 'https') ? 443 : 80));
$pass = 0;
$fail = [];
function ok(bool $c, string $w): void
{
    global $pass, $fail;
    $c ? $pass++ : $fail[] = $w;
    echo ($c ? 'PASS  ' : 'FAIL  ') . $w . "\n";
}
/** @return array{0:int,1:array|null,2:string,3:array<string,string>} */
function req(string $m, string $path, mixed $body = null, array $h = []): array
{
    global $base, $host, $port, $resolve;
    $c = curl_init($base . $path);
    $hdr = [];
    foreach ($h as $k => $v) {
        $hdr[] = "$k: $v";
    }
    if (is_array($body)) {
        $body = json_encode($body);
        $hdr[] = 'Content-Type: application/json';
    }
    $rh = [];
    curl_setopt_array($c, [CURLOPT_CUSTOMREQUEST => $m, CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $hdr, CURLOPT_TIMEOUT => 30,
        CURLOPT_HEADERFUNCTION => function ($ch, $line) use (&$rh) {
            $p = explode(':', $line, 2);
            if (count($p) === 2) {
                $rh[strtolower(trim($p[0]))] = trim($p[1]);
            }
            return strlen($line);
        }]);
    if ($resolve !== '') {
        curl_setopt($c, CURLOPT_RESOLVE, ["$host:$port:$resolve"]);
    }
    if ($body !== null) {
        curl_setopt($c, CURLOPT_POSTFIELDS, $body);
    }
    $out = (string) curl_exec($c);
    $code = (int) curl_getinfo($c, CURLINFO_RESPONSE_CODE);
    curl_close($c);
    return [$code, json_decode($out, true), $out, $rh];
}
function dev(): array
{
    return ['uuid' => sprintf('%08x-%04x-4%03x-a%03x-%012x', random_int(0, 0xffffffff), random_int(0, 0xffff), random_int(0, 0xfff), random_int(0, 0xfff), random_int(0, 0xffffffffffff)),
        'platform' => 'test', 'app_version' => '0.8.0', 'name' => 'Élő teszt'];
}
function account(): array
{
    $email = 'live-' . bin2hex(random_bytes(5)) . '@example.test';
    [$s, $j] = req('POST', '/api/v1/auth/register', ['email' => $email, 'password' => 'Elo-Teszt-Jelszo-2026', 'device' => dev()]);
    if ($s !== 201) {
        throw new RuntimeException("register $s");
    }
    $a = ['Authorization' => 'Bearer ' . $j['access_token']];
    req('POST', '/api/v1/billing/sandbox/verify', ['purchase_token' => 'sandbox:mester_plus_pro_monthly:ok:' . bin2hex(random_bytes(8))], $a + ['Idempotency-Key' => 'k' . bin2hex(random_bytes(10))]);
    return ['email' => $email, 'auth' => $a, 'refresh' => $j['refresh_token']];
}
function idk(): array
{
    return ['Idempotency-Key' => 'k' . bin2hex(random_bytes(12))];
}
function quotePayload(string $valid = '+30 days'): array
{
    $lines = [['name' => 'Élő teszt tétel', 'unit' => 'm²', 'quantity_milli' => 10500, 'labor_unit_price_huf' => 6000, 'material_unit_price_huf' => 2500]];
    $t = QuoteCalculator::calculate($lines, 'none', 0, 2700);
    $d = new DateTimeImmutable('now', new DateTimeZone('Europe/Budapest'));
    return ['snapshot' => ['schema' => 1, 'quote_number' => 'LIVE-' . random_int(1000, 9999), 'quote_version' => 1, 'quoted_at' => $d->format('Y-m-d'),
        'valid_until' => $d->modify($valid)->format('Y-m-d'), 'seller' => ['company_name' => 'Élő Teszt Kft.'], 'customer' => ['name' => 'Teszt Ügyfél'],
        'project' => ['title' => 'Élő teszt projekt'], 'lines' => $lines, 'adjustment' => ['type' => 'none', 'percent_bp' => 0], 'vat_rate_bp' => 2700], 'totals' => $t];
}
function cleanup(array $u): void
{
    req('POST', '/api/v1/account/delete', ['password' => 'Elo-Teszt-Jelszo-2026'], $u['auth']);
}

switch ($phase) {
    case 'flow':
        $u = account();
        [$s] = req('GET', '/api/v1/me', null, ['Authorization' => 'Bearer mpa_' . str_repeat('A', 43)]);
        ok($s === 401, 'érvénytelen / kitalált token → 401');
        [$s, $r1] = req('POST', '/api/v1/auth/refresh', ['refresh_token' => $u['refresh']]);
        [$s2] = req('POST', '/api/v1/auth/refresh', ['refresh_token' => $u['refresh']]);
        ok($s === 200 && $s2 === 401, 'refresh rotáció: a régi refresh token másodszor 401');
        [$s3] = req('GET', '/api/v1/me', null, ['Authorization' => 'Bearer ' . $r1['access_token']]);
        ok($s3 === 401, 'újrahasznált refresh → a teljes munkamenet visszavonva (az új access is 401)');
        $u = account();
        [, $k] = req('GET', '/api/v1/backups/key', null, $u['auth']);
        $h = idk();
        $body = ['size_bytes' => 2000, 'sha256' => str_repeat('a', 64), 'app_version' => '0.8.0', 'backup_format_version' => 2, 'encryption_version' => 1, 'key_version' => $k['key_version']];
        [$s1, $a] = req('POST', '/api/v1/backups', $body, $u['auth'] + $h);
        [$s2, $b, , $rh] = req('POST', '/api/v1/backups', $body, $u['auth'] + $h);
        ok($s1 === 201 && $s2 === 201 && $a['id'] === $b['id'] && ($rh['idempotent-replayed'] ?? '') === 'true', 'dupla kérés (mobil újrapróbálás) ugyanazzal az Idempotency-Key-jel → egy mentés');
        [$s] = req('PUT', $a['upload_path'], random_bytes(2000), $u['auth'] + ['Content-Type' => 'application/octet-stream']);
        ok($s === 422, 'rossz ellenőrzőösszeg → 422, nem READY');
        [, $l] = req('GET', '/api/v1/backups', null, $u['auth']);
        ok(count($l['backups']) === 0, 'sérült feltöltés nem jelenik meg a listában');
        [$s] = req('PUT', '/api/v1/backups/' . $a['id'] . '/content', str_repeat('x', 100), $u['auth'] + ['Content-Type' => 'application/octet-stream', 'Content-Length' => '100']);
        ok($s === 409 || $s === 422, 'FAILED mentésbe nem tölthető tovább');
        [$s, $big] = req('POST', '/api/v1/backups', ['size_bytes' => 80 * 1024 * 1024] + $body, $u['auth'] + idk());
        ok($s === 413, 'túl nagy mentés → 413');
        [$s, $q] = req('POST', '/api/v1/quotes', quotePayload(), $u['auth'] + idk());
        ok($s === 201, 'online ajánlat létrehozva');
        $path = (string) parse_url($q['url'], PHP_URL_PATH);
        [$s, , $html, $rh] = req('GET', $path . '/elfogadom', null, ['User-Agent' => 'Mozilla/5.0 live']);
        preg_match('/mp_csrf=([a-f0-9]{32})/', $rh['set-cookie'] ?? '', $cm);
        preg_match('/name="hash" value="([0-9a-f]{64})"/', $html, $hm);
        $form = 'csrf=' . ($cm[1] ?? '') . '&hash=' . ($hm[1] ?? '') . '&ok=1';
        $hdr = ['User-Agent' => 'Mozilla/5.0 live', 'Cookie' => 'mp_csrf=' . ($cm[1] ?? ''), 'Content-Type' => 'application/x-www-form-urlencoded'];
        [$s1, , $h1] = req('POST', $path . '/elfogadom', $form, $hdr);
        [$s2, , $h2] = req('POST', $path . '/elfogadom', $form, $hdr);
        [$s3] = req('POST', $path . '/nem-kerem', 'csrf=' . ($cm[1] ?? '') . '&hash=' . ($hm[1] ?? ''), $hdr);
        [, $st] = req('GET', '/api/v1/quotes/' . $q['id'], null, $u['auth']);
        ok($s1 === 200 && str_contains($h1, 'Ajánlat elfogadva') && $s2 === 200 && $st['status'] === 'ACCEPTED', 'dupla elfogadás + utólagos elutasítás → egyszer rögzül: ELFOGADVA');
        [$s] = req('POST', $path . '/elfogadom', 'csrf=x&hash=' . ($hm[1] ?? '') . '&ok=1', ['Content-Type' => 'application/x-www-form-urlencoded']);
        ok($s === 400, 'CSRF nélküli POST → 400');
        $secret = base64_decode((string) getenv('MP_LIVE_WEBHOOK_SECRET'));
        if ($secret !== '') {
            $tok = 'sandbox:mester_plus_pro_monthly:ok:' . bin2hex(random_bytes(8));
            req('POST', '/api/v1/billing/sandbox/verify', ['purchase_token' => $tok], $u['auth'] + idk());
            $ev = json_encode(['event_id' => 'live-' . bin2hex(random_bytes(6)), 'type' => 'RENEWED', 'purchase_token' => $tok, 'period_end' => time() + 40 * 86400]);
            $ts = (string) time();
            $wh = ['Content-Type' => 'application/json', 'X-MP-Timestamp' => $ts, 'X-MP-Signature' => hash_hmac('sha256', $ts . '.' . $ev, $secret)];
            [$s1, $j1] = req('POST', '/api/v1/billing/webhook/sandbox', $ev, $wh);
            [$s2, $j2] = req('POST', '/api/v1/billing/webhook/sandbox', $ev, $wh);
            [$s3] = req('POST', '/api/v1/billing/webhook/sandbox', $ev, ['X-MP-Signature' => str_repeat('0', 64)] + $wh);
            ok($s1 === 200 && ($j1['status'] ?? '') === 'processed' && ($j2['status'] ?? '') === 'duplicate' && $s3 === 401, 'webhook: feldolgozva → duplikált kézbesítés: nem újra → hamis aláírás: 401');
        }
        cleanup($u);
        break;
    case 'expired-make':
        $u = account();
        [$s, $q] = req('POST', '/api/v1/quotes', quotePayload('+1 day'), $u['auth'] + idk());
        echo json_encode(['id' => $q['id'], 'path' => parse_url($q['url'], PHP_URL_PATH), 'auth' => $u['auth']['Authorization']]), "\n";
        break;
    case 'expired-check':
        [$id, $path, $authz] = [$argv[4], $argv[5], $argv[6]];
        [$s, , $html] = req('GET', $path, null, ['User-Agent' => 'Mozilla/5.0 live']);
        ok(str_contains($html, 'Az ajánlat lejárt') && !str_contains($html, 'ELFOGADOM'), 'lejárt ajánlat: „Az ajánlat lejárt”, nincs elfogadás-gomb');
        [, $st] = req('GET', "/api/v1/quotes/$id", null, ['Authorization' => $authz]);
        ok($st['status'] === 'EXPIRED', 'az app státusza: EXPIRED (Lejárt)');
        req('POST', '/api/v1/account/delete', ['password' => 'Elo-Teszt-Jelszo-2026'], ['Authorization' => $authz]);
        break;
    case 'db-down':
        [$s, $j] = req('GET', '/api/v1/health');
        ok($s === 503 && $j['checks']['database'] === 'fail', 'DB DOWN: health 503, database=fail');
        [$s, $j, $raw] = req('POST', '/api/v1/auth/login', ['email' => 'x@example.test', 'password' => 'Jo-Jelszo-123x', 'device' => dev()]);
        ok($s === 503 && ($j['error']['code'] ?? '') === 'SERVICE_UNAVAILABLE' && !preg_match('/PDO|SQLSTATE|\.php|#0/', $raw), 'DB DOWN: API 503 általános magyar üzenettel, belső részlet nélkül');
        break;
    case 'storage-down':
        [$s, $j] = req('GET', '/api/v1/health');
        ok($s === 503 && $j['checks']['storage'] === 'fail', 'STORAGE DOWN: health 503, storage=fail');
        break;
    case 'load':
        $n = (int) ($argv[4] ?? 50);
        $par = (int) ($argv[5] ?? 50);
        $mh = curl_multi_init();
        $handles = [];
        $t0 = microtime(true);
        for ($i = 0; $i < $n; $i++) {
            $c = curl_init($base . ($i % 2 ? '/api/v1/health' : '/api/v1/plans'));
            // Sok ügyfél szimulálása: különböző loopback-forráscímek (az nginx IP-nkénti korlátja így reális).
            curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 60, CURLOPT_INTERFACE => '127.0.0.' . (2 + $i % 200)]);
            if ($resolve !== '') {
                curl_setopt($c, CURLOPT_RESOLVE, ["$host:$port:$resolve"]);
            }
            $handles[] = $c;
        }
        $codes = [];
        $times = [];
        foreach (array_chunk($handles, $par) as $batch) {
            foreach ($batch as $c) {
                curl_multi_add_handle($mh, $c);
            }
            do {
                curl_multi_exec($mh, $run);
                curl_multi_select($mh, 0.2);
            } while ($run > 0);
            foreach ($batch as $c) {
                $codes[] = curl_getinfo($c, CURLINFO_RESPONSE_CODE);
                $times[] = curl_getinfo($c, CURLINFO_TOTAL_TIME) * 1000;
                curl_multi_remove_handle($mh, $c);
            }
        }
        sort($times);
        $okN = count(array_filter($codes, fn ($c) => $c === 200));
        printf("LOAD %d kérés, %d párhuzamos: %d×200, egyéb: %s; idő p50 %.0f ms, p95 %.0f ms, max %.0f ms; összesen %.1f mp\n", $n, $par, $okN,
            json_encode(array_count_values(array_filter($codes, fn ($c) => $c !== 200))), $times[(int) (count($times) * 0.5)], $times[(int) (count($times) * 0.95)], end($times), microtime(true) - $t0);
        ok($okN === $n, "LOAD $par párhuzamos: minden kérés 200");
        break;
}
printf("ÉLŐ HTTP (%s): %d PASS, %d FAIL\n", $phase, $pass, count($fail));
exit($fail === [] ? 0 : 1);
