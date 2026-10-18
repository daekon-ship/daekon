<?php
declare(strict_types=1);

use MesterPlus\Clock;

return [
    'online ajánlat létrehozása: pillanatkép, erős token, link; FREE fióknak nem' => function () {
        $u = user(true);
        $q = createQuote($u);
        eq($q['status'], 'ACTIVE', 'ACTIVE');
        ok(str_starts_with($q['url'], 'https://ajanlat.example.test/a/') && strlen($q['token']) === 43, '256 bites token a linkben');
        $row = $GLOBALS['T_DB']->one('SELECT * FROM quote_shares WHERE public_id = ?', [$q['id']]);
        ok(!str_contains(json_encode($row, JSON_INVALID_UTF8_SUBSTITUTE), $q['token']), 'a token nincs a DB-ben (csak kivonat)');
        eq((int) $row['gross_total_huf'], $q['gross_total_huf'], 'bruttó tárolva');
        eq(hash('sha256', $row['snapshot']), $row['snapshot_hash'], 'pillanatkép-kivonat');
        [$s, $j] = call('POST', '/api/v1/quotes', snapshot(), user(false)['auth'] + idem());
        eq([$s, $j['error']['code']], [403, 'PRO_REQUIRED'], 'FREE: PRO_REQUIRED');
    },
    'összeg-ellenőrzés: eltérő végösszeg, ár nélküli tétel, hibás adat elutasítva' => function () {
        $u = user(true);
        $p = snapshot();
        $p['totals']['gross_total_huf'] += 1;
        [$s, $j] = call('POST', '/api/v1/quotes', $p, $u['auth'] + idem());
        eq([$s, $j['error']['code']], [422, 'TOTALS_MISMATCH'], '1 Ft eltérés is elutasítva');
        $p = snapshot(['lines' => [['name' => 'Ár nélkül', 'unit' => 'db', 'quantity_milli' => 1000, 'labor_unit_price_huf' => 0, 'material_unit_price_huf' => 0]]]);
        [$s, $j] = call('POST', '/api/v1/quotes', $p, $u['auth'] + idem());
        eq([$s, $j['error']['code']], [422, 'UNPRICED_LINES'], 'ár nélküli tétel');
        $p = snapshot();
        $p['snapshot']['lines'][0]['quantity_milli'] = -5;
        [$s] = call('POST', '/api/v1/quotes', $p, $u['auth'] + idem());
        eq($s, 422, 'negatív mennyiség');
        $p = snapshot();
        $p['snapshot']['valid_until'] = '2020-01-01';
        $p['snapshot']['quoted_at'] = '2019-12-01';
        [$s, $j] = call('POST', '/api/v1/quotes', $p, $u['auth'] + idem());
        eq([$s, $j['error']['code']], [422, 'QUOTE_EXPIRED'], 'már lejárt érvényesség');
        $p = snapshot();
        $p['snapshot']['seller']['website'] = 'http://169.254.169.254/latest/meta-data';
        [$s, $j] = call('POST', '/api/v1/quotes', $p, $u['auth'] + idem());
        eq($s, 201, 'ismeretlen mező (pl. URL) eldobva, a szerver nem kér le semmit');
        ok(!str_contains((string) $GLOBALS['T_DB']->val('SELECT snapshot FROM quote_shares WHERE public_id = ?', [$j['id']]), '169.254'), 'az URL nem került a pillanatképbe');
    },
    'publikus oldal: tartalom, XSS escape, biztonsági fejlécek, megnyitás-esemény, link-előnézet robot nem számít' => function () {
        $u = user(true);
        $q = createQuote($u, ['project' => ['title' => '<script>alert(1)</script> Fürdő', 'site_address' => '"><img src=x onerror=alert(2)>'],
            'customer' => ['name' => "Kovács <b>Péter</b>"]]);
        [$s, , $r] = call('GET', '/a/' . $q['token'], null, ['User-Agent' => 'facebookexternalhit/1.1']);
        eq($s, 200, 'oldal');
        eq($GLOBALS['T_DB']->val('SELECT first_opened_at FROM quote_shares WHERE public_id = ?', [$q['id']]), null, 'link-előnézet robot: nem „megnyitva”');
        [$s, , $r] = call('GET', '/a/' . $q['token'], null, ['User-Agent' => 'Mozilla/5.0 (Linux; Android 14)']);
        ok(!str_contains($r->body, '<script>alert') && str_contains($r->body, '&lt;script&gt;alert(1)&lt;/script&gt;'), 'XSS: escape-elve');
        ok(!str_contains($r->body, '<img src=x') && !str_contains($r->body, '<b>Péter'), 'attribútum- és HTML-befecskendezés escape-elve');
        ok(str_contains($r->body, 'Fürdő') && str_contains($r->body, 'Kőműves Kft.') && str_contains($r->body, $q['quote_number']), 'tartalom');
        ok(str_contains($r->body, 'ELFOGADOM') && str_contains($r->body, 'NEM KÉREM') && str_contains($r->body, 'KÉRDÉSEM VAN'), 'három gomb');
        ok(str_contains($r->body, 'tel:+36301234567') && str_contains($r->body, 'mailto:mester@example.test'), 'kapcsolatfelvétel');
        $csp = $r->headers['Content-Security-Policy'] ?? '';
        ok(str_contains($csp, "default-src 'none'") && str_contains($csp, "frame-ancestors 'none'") && !str_contains($csp, 'script-src'), 'CSP: nincs szkript, nem keretezhető');
        eq($r->headers['Referrer-Policy'] ?? '', 'no-referrer', 'a token nem szivárog Referer-fejlécben');
        ok(str_contains($r->headers['X-Robots-Tag'] ?? '', 'noindex'), 'noindex');
        ok($GLOBALS['T_DB']->val('SELECT first_opened_at FROM quote_shares WHERE public_id = ?', [$q['id']]) !== null, 'megnyitva');
        eq((int) $GLOBALS['T_DB']->val("SELECT COUNT(*) FROM quote_events e JOIN quote_shares s ON s.id = e.quote_share_id WHERE s.public_id = ? AND e.type = 'OPENED'", [$q['id']]), 1, 'OPENED esemény');
        call('GET', '/a/' . $q['token'], null, ['User-Agent' => 'Mozilla/5.0']);
        eq((int) $GLOBALS['T_DB']->val("SELECT COUNT(*) FROM quote_events e JOIN quote_shares s ON s.id = e.quote_share_id WHERE s.public_id = ? AND e.type = 'OPENED'", [$q['id']]), 1, 'ismételt megnyitás egy órán belül: nem új esemény');
        [, $st] = call('GET', '/api/v1/quotes/' . $q['id'], null, $u['auth']);
        eq([$st['status'], $st['opened']], ['ACTIVE', true], 'az app látja: megnyitva');
    },
    'elfogadás: megerősítés kell, CSRF kell, egyszer rögzül (dupla kattintás nem duplikál), pillanatkép-kivonattal' => function () {
        $u = user(true);
        $q = createQuote($u);
        $hash = $GLOBALS['T_DB']->val('SELECT snapshot_hash FROM quote_shares WHERE public_id = ?', [$q['id']]);
        [$s, , $r] = call('GET', '/a/' . $q['token'] . '/elfogadom', null, ['User-Agent' => 'Mozilla/5.0']);
        ok($s === 200 && str_contains($r->body, 'Elfogadás megerősítése') && str_contains($r->body, 'required'), 'megerősítő oldal, kötelező jelölőnégyzet');
        [$s] = form('/a/' . $q['token'] . '/elfogadom', ['hash' => $hash]);
        eq($s, 400, 'jelölőnégyzet nélkül nem fogad el');
        [$s] = call('POST', '/a/' . $q['token'] . '/elfogadom', 'ok=1&hash=' . $hash . '&csrf=x', ['Content-Type' => 'application/x-www-form-urlencoded']);
        eq($s, 400, 'CSRF nélkül nem');
        [$s] = form('/a/' . $q['token'] . '/elfogadom', ['ok' => '1', 'hash' => $hash], 'f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0', ['Origin' => 'https://gonosz.example']);
        eq($s, 400, 'idegen Origin: nem');
        [$s] = form('/a/' . $q['token'] . '/elfogadom', ['ok' => '1', 'hash' => str_repeat('0', 64)]);
        eq($s, 400, 'más tartalom kivonatával nem');
        [$s, , $r] = form('/a/' . $q['token'] . '/elfogadom', ['ok' => '1', 'hash' => $hash]);
        ok($s === 200 && str_contains($r->body, 'Ajánlat elfogadva'), 'Ajánlat elfogadva');
        ok(str_contains($r->body, 'nem minősített elektronikus aláírás') || !str_contains($r->body, 'aláír'), 'nem állít e-aláírást');
        form('/a/' . $q['token'] . '/elfogadom', ['ok' => '1', 'hash' => $hash]);
        form('/a/' . $q['token'] . '/nem-kerem', ['hash' => $hash]);
        eq((int) $GLOBALS['T_DB']->val("SELECT COUNT(*) FROM quote_events e JOIN quote_shares s ON s.id = e.quote_share_id WHERE s.public_id = ? AND e.type IN ('ACCEPTED','DECLINED')", [$q['id']]), 1, 'egy döntés-esemény (dupla kattintás / utólagos elutasítás nem írja felül)');
        $a = $GLOBALS['T_DB']->one("SELECT meta FROM audit_logs WHERE event = 'QUOTE_ACCEPTED' AND target = ?", [$q['id']]);
        ok($a !== null && str_contains((string) $a['meta'], $hash), 'audit: QUOTE_ACCEPTED a pillanatkép-kivonattal');
        [, $st] = call('GET', '/api/v1/quotes?quote_number=' . urlencode($q['quote_number']), null, $u['auth']);
        eq($st['quotes'][0]['status'], 'ACCEPTED', 'az app státuszfrissítése: Elfogadva');
        ok($st['quotes'][0]['decided_at'] !== null, 'szerver-időbélyeg');
    },
    'elutasítás' => function () {
        $u = user(true);
        $q = createQuote($u);
        $hash = $GLOBALS['T_DB']->val('SELECT snapshot_hash FROM quote_shares WHERE public_id = ?', [$q['id']]);
        [$s, , $r] = form('/a/' . $q['token'] . '/nem-kerem', ['hash' => $hash]);
        ok($s === 200 && str_contains($r->body, 'Ajánlat elutasítva'), 'elutasítva');
        [, $st] = call('GET', '/api/v1/quotes/' . $q['id'], null, $u['auth']);
        eq($st['status'], 'DECLINED', 'DECLINED');
    },
    'lejárat: a lejárt ajánlat nem fogadható el; a karbantartó EXPIRED-re állítja (eseménnyel)' => function () {
        $u = user(true);
        $q = createQuote($u);
        $hash = $GLOBALS['T_DB']->val('SELECT snapshot_hash FROM quote_shares WHERE public_id = ?', [$q['id']]);
        Clock::travel(32 * 86400);
        [$s, , $r] = call('GET', '/a/' . $q['token'], null, ['User-Agent' => 'Mozilla/5.0']);
        ok(str_contains($r->body, 'Az ajánlat lejárt') && !str_contains($r->body, 'ELFOGADOM'), 'lejárt: nincs elfogadás-gomb');
        form('/a/' . $q['token'] . '/elfogadom', ['ok' => '1', 'hash' => $hash]);
        eq($GLOBALS['T_DB']->val('SELECT status FROM quote_shares WHERE public_id = ?', [$q['id']]), 'ACTIVE', 'POST-tal sem fogadható el');
        app()->quotes()->maintain();
        eq($GLOBALS['T_DB']->val('SELECT status FROM quote_shares WHERE public_id = ?', [$q['id']]), 'EXPIRED', 'EXPIRED');
        eq((int) $GLOBALS['T_DB']->val("SELECT COUNT(*) FROM quote_events e JOIN quote_shares s ON s.id = e.quote_share_id WHERE s.public_id = ? AND e.type = 'EXPIRED'", [$q['id']]), 1, 'EXPIRED esemény');
    },
    'visszavonás és új változat: a régi link 410, a verziószám nő' => function () {
        $u = user(true);
        $q1 = createQuote($u, ['quote_number' => 'MP-2026-777']);
        $q2 = createQuote($u, ['quote_number' => 'MP-2026-777']);
        eq($q2['quote_version'], 2, '2. változat');
        [$s] = call('GET', '/a/' . $q1['token'], null, ['User-Agent' => 'Mozilla/5.0']);
        eq($s, 410, 'a régi link visszavonva');
        [$s, $j] = call('POST', '/api/v1/quotes/' . $q2['id'] . '/revoke', null, $u['auth']);
        eq([$s, $j['status']], [200, 'REVOKED'], 'visszavonás');
        [$s] = call('GET', '/a/' . $q2['token'], null, ['User-Agent' => 'Mozilla/5.0']);
        eq($s, 410, 'visszavont link: 410');
    },
    'token: hibás / kitalált / útvonal-trükk → 404, sorozatos próbálkozás rate limitelve' => function () {
        $ip = '198.51.100.77';
        [$s] = call('GET', '/a/' . str_repeat('A', 43), null, [], ['ip' => $ip]);
        eq($s, 404, 'kitalált token');
        [$s] = call('GET', '/a/..%2F..%2Fetc%2Fpasswd', null, [], ['ip' => $ip]);
        eq($s, 404, 'útvonal-trükk');
        [$s] = call('GET', '/a/1', null, [], ['ip' => $ip]);
        eq($s, 404, 'sorszám-szerű azonosító');
        $last = 0;
        for ($i = 0; $i < 40; $i++) {
            [$last] = call('GET', '/a/' . bin2hex(random_bytes(21)) . 'x', null, [], ['ip' => $ip]);
        }
        eq($last, 429, 'brute force: 429');
    },
];
