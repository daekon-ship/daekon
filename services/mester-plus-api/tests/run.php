<?php
// Mester+ Cloud – backend tesztek (függőség nélkül).
//   MP_TEST_DB_NAME=mp_test_xyz MP_TEST_DB_USER=… MP_TEST_DB_PASS=… [MP_TEST_DB_SOCKET=…|MP_TEST_DB_HOST=…] php tests/run.php [szűrő]
// A teszt-adatbázist ÜRESRE TÖRLI és a migrációkból újraépíti – ezért csak "mp_test_" kezdetű névvel fut.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
const MP_API = true;
require dirname(__DIR__) . '/src/bootstrap.php';

use MesterPlus\App;
use MesterPlus\Clock;
use MesterPlus\Config;
use MesterPlus\Db;
use MesterPlus\Log;
use MesterPlus\Migrator;
use MesterPlus\Request;

$dbName = getenv('MP_TEST_DB_NAME') ?: '';
if (!preg_match('/^mp_test_[a-z0-9_]{1,40}$/', $dbName)) {
    fwrite(STDERR, "MP_TEST_DB_NAME kell (mp_test_ kezdettel) – a tesztek ezt az adatbázist ürítik.\n");
    exit(2);
}
$storage = sys_get_temp_dir() . '/mp-test-storage-' . bin2hex(random_bytes(4));
mkdir($storage, 0750, true);

$base = [
    'MP_ENV' => 'test', 'DB_NAME' => $dbName, 'DB_USER' => getenv('MP_TEST_DB_USER') ?: 'root', 'DB_PASS' => getenv('MP_TEST_DB_PASS') ?: '',
    'DB_HOST' => getenv('MP_TEST_DB_HOST') ?: 'localhost',
    'MP_TOKEN_PEPPER' => base64_encode(random_bytes(32)), 'MP_KEK_1' => base64_encode(random_bytes(32)), 'MP_KEK_CURRENT' => '1',
    'MP_STORAGE_DIR' => $storage, 'MP_BILLING_SANDBOX' => '1', 'MP_WEBHOOK_SANDBOX_SECRET' => base64_encode(random_bytes(32)),
    'MP_PUBLIC_API_BASE' => 'https://api.example.test', 'MP_PUBLIC_QUOTE_BASE' => 'https://ajanlat.example.test',
    'MP_STORAGE_RESERVE_BYTES' => '0',
];
if (getenv('MP_TEST_DB_SOCKET')) {
    $base['DB_SOCKET'] = getenv('MP_TEST_DB_SOCKET');
}
$GLOBALS['T_CONFIG'] = new Config($base);
$db = Db::connect($GLOBALS['T_CONFIG']);
$db->pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
foreach ($db->all('SELECT table_name AS t FROM information_schema.tables WHERE table_schema = ?', [$dbName]) as $t) {
    $db->pdo->exec('DROP TABLE `' . str_replace('`', '', $t['t']) . '`');
}
$db->pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
Log::$toMemory = true;

// ── mini teszt-keretrendszer ────────────────────────────────────────────────
$GLOBALS['T_PASS'] = 0;
$GLOBALS['T_FAIL'] = [];
function ok(bool $cond, string $what): void
{
    if ($cond) {
        $GLOBALS['T_PASS']++;
    } else {
        $GLOBALS['T_FAIL'][] = ($GLOBALS['T_CUR'] ?? '?') . ': ' . $what;
        echo "    FAIL: $what\n";
    }
}
function eq(mixed $a, mixed $b, string $what): void
{
    ok($a === $b, $what . ($a === $b ? '' : ' (kapott: ' . json_encode($a, JSON_UNESCAPED_UNICODE) . ', várt: ' . json_encode($b, JSON_UNESCAPED_UNICODE) . ')'));
}
function app(?Config $c = null): App
{
    return new App($c ?? $GLOBALS['T_CONFIG'], $GLOBALS['T_DB']);
}
/** @return array{0:int,1:array<string,mixed>|null,2:\MesterPlus\Response} */
function call(string $method, string $path, mixed $body = null, array $headers = [], array $o = []): array
{
    $h = array_change_key_case($headers, CASE_LOWER);
    $raw = null;
    if ($body !== null) {
        if (is_string($body)) {
            $raw = $body;
        } else {
            $raw = json_encode($body, JSON_UNESCAPED_UNICODE);
            $h['content-type'] ??= 'application/json';
        }
        $h['content-length'] ??= (string) strlen($raw);
    }
    $q = [];
    $p = parse_url($path);
    parse_str($p['query'] ?? '', $q);
    $req = new Request($method, $p['path'], $h, $q, $raw, $o['ip'] ?? '203.0.113.' . random_int(1, 250), $o['https'] ?? true, $o['host'] ?? 'api.example.test', $o['cookies'] ?? []);
    $resp = ($o['app'] ?? app())->handle($req);
    if ($resp->stream !== null) {
        $resp->body = (string) stream_get_contents($resp->stream);
        fclose($resp->stream);
        $resp->stream = null;
    }
    $json = str_starts_with($resp->headers['Content-Type'] ?? '', 'application/json') ? json_decode($resp->body, true) : null;
    return [$resp->status, $json, $resp];
}
function device(?string $uuid = null): array
{
    $u = $uuid ?? sprintf('%08x-%04x-4%03x-a%03x-%012x', random_int(0, 0xffffffff), random_int(0, 0xffff), random_int(0, 0xfff), random_int(0, 0xfff), random_int(0, 0xffffffffffff));
    return ['uuid' => $u, 'platform' => 'test', 'app_version' => '0.8.0', 'name' => 'Teszt telefon'];
}
/** Új fiók + belépett eszköz. @return array{email:string,password:string,access:string,refresh:string,device:array,auth:array} */
function user(bool $pro = false, string $plan = 'pro'): array
{
    $email = 'teszt+' . bin2hex(random_bytes(5)) . '@example.test';
    $pw = 'Jo-Jelszo-' . bin2hex(random_bytes(4));
    $dev = device();
    [$s, $j] = call('POST', '/api/v1/auth/register', ['email' => $email, 'password' => $pw, 'device' => $dev]);
    if ($s !== 201) {
        throw new RuntimeException('regisztráció: ' . $s . ' ' . json_encode($j));
    }
    if ($pro) {
        $ws = (int) $GLOBALS['T_DB']->val("SELECT m.workspace_id FROM accounts a JOIN workspace_members m ON m.account_id = a.id WHERE a.email = ?", [$email]);
        app()->billing()->grantManual($ws, $plan, 30);
    }
    return ['email' => $email, 'password' => $pw, 'access' => $j['access_token'], 'refresh' => $j['refresh_token'], 'device' => $dev,
            'auth' => ['Authorization' => 'Bearer ' . $j['access_token']]];
}
function idem(): array
{
    return ['Idempotency-Key' => 'k' . bin2hex(random_bytes(12))];
}
/** Kliens-oldali titkosítás utánzata (pontosan, ahogy az app csinálja): gzip(JSON) → AES-256-GCM. */
function encryptBackup(string $plainJson, string $key, int $keyVersion, string $wsPublic): string
{
    $nonce = random_bytes(12);
    $header = 'MPCB' . chr(1) . pack('N', $keyVersion) . $nonce;
    $ct = openssl_encrypt(gzencode($plainJson, 6), 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $nonce, $tag, $header . $wsPublic, 16);
    return $header . $ct . $tag;
}
function decryptBackup(string $blob, string $key, string $wsPublic): ?string
{
    $header = substr($blob, 0, 21);
    $nonce = substr($header, 9, 12);
    $pt = openssl_decrypt(substr($blob, 21, -16), 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $nonce, substr($blob, -16), $header . $wsPublic);
    return $pt === false ? null : gzdecode($pt);
}

require __DIR__ . '/helpers.php';
$GLOBALS['T_DB'] = $db;
$GLOBALS['T_STORAGE'] = $storage;
$filter = $argv[1] ?? '';
$files = glob(__DIR__ . '/cases/*.php') ?: [];
sort($files);
$t0 = microtime(true);
foreach ($files as $f) {
    $cases = require $f;
    foreach ($cases as $name => $fn) {
        $full = basename($f, '.php') . ' › ' . $name;
        if ($filter !== '' && !str_contains($full, $filter)) {
            continue;
        }
        $GLOBALS['T_CUR'] = $full;
        Clock::reset();
        $before = count($GLOBALS['T_FAIL']);
        try {
            $fn();
        } catch (Throwable $e) {
            $GLOBALS['T_FAIL'][] = "$full: KIVÉTEL " . get_class($e) . ': ' . $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine();
        }
        echo (count($GLOBALS['T_FAIL']) === $before ? 'PASS  ' : 'FAIL  ') . $full . "\n";
    }
}
Clock::reset();
// takarítás: a teszt-adatbázis táblái és az ideiglenes tároló
$db->pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
foreach ($db->all('SELECT table_name AS t FROM information_schema.tables WHERE table_schema = ?', [$dbName]) as $t) {
    $db->pdo->exec('DROP TABLE `' . str_replace('`', '', $t['t']) . '`');
}
exec('rm -rf ' . escapeshellarg($storage));
printf("\nMESTER+ CLOUD BACKEND: %d ellenőrzés PASS, %d FAIL (%.1f mp)\n", $GLOBALS['T_PASS'], count($GLOBALS['T_FAIL']), microtime(true) - $t0);
foreach ($GLOBALS['T_FAIL'] as $f) {
    echo "  ✗ $f\n";
}
exit($GLOBALS['T_FAIL'] === [] ? 0 : 1);
