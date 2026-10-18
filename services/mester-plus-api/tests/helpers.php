<?php
// Közös teszt-segédek (mentés-feltöltés, ajánlat, webhook) – a run.php tölti be.
declare(strict_types=1);

use MesterPlus\Clock;
use MesterPlus\QuoteCalculator;

/** Teljes kliens-oldali mentés: kulcs → titkosítás → bejelentés → feltöltés. @return array{0:int,1:array|null,2:string,3:string} */
function uploadBackup(array $u, string $plain = '', ?callable $tamper = null, ?int $declaredSize = null): array
{
    $plain = $plain !== '' ? $plain : json_encode(['app' => 'mester_plus', 'format' => 2, 'schemaVersion' => 3, 'tables' => ['customers' => [['id' => 1, 'name' => 'Kovács Péter']]]]);
    [, $k] = call('GET', '/api/v1/backups/key', null, $u['auth']);
    [, $me] = call('GET', '/api/v1/me', null, $u['auth']);
    $key = base64_decode($k['key']);
    $blob = encryptBackup($plain, $key, $k['key_version'], $me['workspace']['id']);
    $sha = hash('sha256', $blob);
    if ($tamper !== null) {
        $blob = $tamper($blob);
    }
    [$s, $init] = call('POST', '/api/v1/backups', ['size_bytes' => $declaredSize ?? strlen($blob), 'sha256' => $sha, 'app_version' => '0.8.0',
        'backup_format_version' => 2, 'encryption_version' => 1, 'key_version' => $k['key_version']], $u['auth'] + idem());
    if ($s !== 201) {
        return [$s, $init, $blob, $key];
    }
    [$s, $j] = call('PUT', $init['upload_path'], $blob, $u['auth'] + ['Content-Type' => 'application/octet-stream']);
    return [$s, $j + ['_id' => $init['id']], $blob, $key];
}

/** Az app által küldött pillanatkép + összesítő (a kalkulátorral számolva, ahogy a Flutter teszi). */
function snapshot(array $over = []): array
{
    $lines = $over['lines'] ?? [
        ['name' => 'Padlóburkolás (ragasztott)', 'unit' => 'm²', 'quantity_milli' => 12500, 'labor_unit_price_huf' => 6500, 'material_unit_price_huf' => 3200],
        ['name' => 'Fugázás', 'unit' => 'm²', 'quantity_milli' => 12500, 'labor_unit_price_huf' => 1200, 'material_unit_price_huf' => 0],
    ];
    $today = (new DateTimeImmutable('@' . Clock::now()))->setTimezone(new DateTimeZone('Europe/Budapest'));
    $s = array_replace([
        'schema' => 1, 'quote_number' => 'MP-2026-' . random_int(100, 999), 'quote_version' => 1,
        'quoted_at' => $today->format('Y-m-d'), 'valid_until' => $today->modify('+30 days')->format('Y-m-d'),
        'seller' => ['company_name' => 'Kőműves Kft.', 'owner_name' => 'Nagy Ödön', 'address' => 'Budapest', 'tax_number' => '12345678-1-23', 'phone' => '+36 30 123 4567', 'email' => 'mester@example.test'],
        'customer' => ['name' => 'Kovács Péter'], 'project' => ['title' => 'Fürdőszoba felújítás', 'site_address' => 'Szeged, Fő u. 1.'],
        'lines' => $lines, 'adjustment' => ['type' => 'discount', 'percent_bp' => 500], 'vat_rate_bp' => 2700, 'footer' => "Fizetés: 50% előleg.\nGarancia: 2 év.",
    ], $over);
    $t = QuoteCalculator::calculate($s['lines'], $s['adjustment']['type'], $s['adjustment']['percent_bp'], $s['vat_rate_bp']);
    return ['snapshot' => $s, 'totals' => $t];
}
function createQuote(array $u, array $over = []): array
{
    [$s, $j] = call('POST', '/api/v1/quotes', snapshot($over), $u['auth'] + idem());
    if ($s !== 201) {
        throw new RuntimeException("ajánlat: $s " . json_encode($j, JSON_UNESCAPED_UNICODE));
    }
    preg_match('#/a/([A-Za-z0-9_-]{43})$#', $j['url'], $m);
    return $j + ['token' => $m[1]];
}
function form(string $path, array $fields, string $csrf = 'f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0', array $headers = []): array
{
    return call('POST', $path, http_build_query($fields + ['csrf' => $csrf]), ['Content-Type' => 'application/x-www-form-urlencoded', 'User-Agent' => 'Mozilla/5.0 (Linux; Android 14)'] + $headers, ['cookies' => ['mp_csrf' => $csrf]]);
}

function sandboxToken(string $product = 'mester_plus_pro_monthly', string $scenario = 'ok'): string
{
    return "sandbox:$product:$scenario:" . bin2hex(random_bytes(8));
}
function webhook(array $event, ?int $ts = null, ?string $secret = null): array
{
    $body = json_encode($event);
    $ts ??= Clock::now();
    $secret ??= base64_decode($GLOBALS['T_CONFIG']->str('MP_WEBHOOK_SANDBOX_SECRET'));
    return call('POST', '/api/v1/billing/webhook/sandbox', $body, ['Content-Type' => 'application/json', 'X-MP-Timestamp' => (string) $ts,
        'X-MP-Signature' => hash_hmac('sha256', $ts . '.' . $body, $secret)]);
}
