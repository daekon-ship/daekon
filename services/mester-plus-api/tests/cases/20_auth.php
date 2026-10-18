<?php
declare(strict_types=1);

use MesterPlus\Auth;
use MesterPlus\Clock;

return [
    'regisztráció: Argon2id hash, nincs nyílt jelszó, fiók + munkaterület + eszköz + munkamenet' => function () {
        $u = user();
        $a = $GLOBALS['T_DB']->one('SELECT * FROM accounts WHERE email = ?', [$u['email']]);
        ok(str_starts_with($a['password_hash'], '$argon2id$'), 'Argon2id');
        ok(!str_contains(json_encode($GLOBALS['T_DB']->all('SELECT * FROM accounts WHERE id = ?', [$a['id']]), JSON_INVALID_UTF8_SUBSTITUTE), $u['password']), 'nyílt jelszó sehol');
        eq($a['status'], 'ACTIVE', 'ACTIVE');
        eq($a['email_verified_at'], null, 'e-mail még nincs megerősítve');
        eq((int) $GLOBALS['T_DB']->val("SELECT COUNT(*) FROM workspace_members WHERE account_id = ? AND role = 'owner'", [$a['id']]), 1, 'saját munkaterület, tulajdonos');
        eq((int) $GLOBALS['T_DB']->val('SELECT COUNT(*) FROM sessions WHERE account_id = ? AND revoked_at IS NULL', [$a['id']]), 1, 'egy élő munkamenet');
        $raw = $GLOBALS['T_DB']->one('SELECT access_hash FROM sessions WHERE account_id = ?', [$a['id']]);
        ok(strlen($raw['access_hash']) === 32 && !str_contains($raw['access_hash'], $u['access']), 'a token csak kivonatként tárolódik');
        eq((int) $GLOBALS['T_DB']->val("SELECT COUNT(*) FROM mail_outbox WHERE account_id = ? AND template = 'verify'", [$a['id']]), 1, 'megerősítő levél a sorban (nem küldve)');
    },
    'regisztráció: gyenge jelszó, hibás e-mail, foglalt e-mail, hibás eszköz' => function () {
        [$s, $j] = call('POST', '/api/v1/auth/register', ['email' => 'x' . bin2hex(random_bytes(3)) . '@example.test', 'password' => 'rovid', 'device' => device()]);
        eq([$s, $j['error']['code']], [422, 'WEAK_PASSWORD'], 'rövid jelszó');
        [$s, $j] = call('POST', '/api/v1/auth/register', ['email' => 'y' . bin2hex(random_bytes(3)) . '@example.test', 'password' => 'aaaaaaaaaaaa', 'device' => device()]);
        eq($s, 422, 'ismétlődő karakteres jelszó');
        [$s, $j] = call('POST', '/api/v1/auth/register', ['email' => 'nem-email', 'password' => 'Jo-Jelszo-123x', 'device' => device()]);
        eq([$s, $j['error']['code']], [422, 'INVALID_EMAIL'], 'hibás e-mail');
        $u = user();
        [$s, $j] = call('POST', '/api/v1/auth/register', ['email' => strtoupper($u['email']), 'password' => 'Jo-Jelszo-123x', 'device' => device()]);
        eq([$s, $j['error']['code']], [409, 'EMAIL_TAKEN'], 'foglalt e-mail (kis/nagybetű független)');
        [$s] = call('POST', '/api/v1/auth/register', ['email' => 'z' . bin2hex(random_bytes(3)) . '@example.test', 'password' => 'Jo-Jelszo-123x', 'device' => ['uuid' => '../../etc']]);
        eq($s, 422, 'hibás eszközazonosító');
    },
    'belépés: jó / rossz jelszó, nem létező fiók – ugyanaz az üzenet' => function () {
        $u = user();
        [$s, $j] = call('POST', '/api/v1/auth/login', ['email' => $u['email'], 'password' => $u['password'], 'device' => $u['device']]);
        eq($s, 200, 'helyes jelszó');
        ok(str_starts_with($j['access_token'], 'mpa_') && str_starts_with($j['refresh_token'], 'mpr_'), 'tokenek');
        [$s1, $j1] = call('POST', '/api/v1/auth/login', ['email' => $u['email'], 'password' => 'rossz-jelszo-123', 'device' => device()]);
        [$s2, $j2] = call('POST', '/api/v1/auth/login', ['email' => 'nincs-ilyen-' . bin2hex(random_bytes(3)) . '@example.test', 'password' => 'rossz-jelszo-123', 'device' => device()]);
        eq([$s1, $s2], [401, 401], '401 mindkettőre');
        eq($j1['error']['message'], $j2['error']['message'], 'nem derül ki, létezik-e a fiók');
        eq($GLOBALS['T_DB']->val("SELECT COUNT(*) FROM audit_logs WHERE event = 'LOGIN_FAILED'") > 0, true, 'audit: LOGIN_FAILED');
    },
    'brute force: 10 hibás jelszó után a fiók 15 percre zárolva' => function () {
        $u = user();
        for ($i = 0; $i < 10; $i++) {
            call('POST', '/api/v1/auth/login', ['email' => $u['email'], 'password' => 'rossz-' . $i . '-jelszo', 'device' => device()]);
        }
        [$s, $j] = call('POST', '/api/v1/auth/login', ['email' => $u['email'], 'password' => $u['password'], 'device' => device()]);
        ok($s === 429 && in_array($j['error']['code'], ['ACCOUNT_LOCKED', 'RATE_LIMITED'], true), 'helyes jelszóval is zárolva (' . $s . ')');
        Clock::travel(16 * 60);
        [$s] = call('POST', '/api/v1/auth/login', ['email' => $u['email'], 'password' => $u['password'], 'device' => $u['device']]);
        eq($s, 200, '15 perc után beléphet');
    },
    'refresh token rotáció: új pár, a régi access érvénytelen; újrahasznált refresh → munkamenet visszavonva' => function () {
        $u = user();
        [$s, $j] = call('POST', '/api/v1/auth/refresh', ['refresh_token' => $u['refresh']]);
        eq($s, 200, 'frissítés');
        ok($j['refresh_token'] !== $u['refresh'] && $j['access_token'] !== $u['access'], 'új tokenpár');
        [$s] = call('GET', '/api/v1/me', null, $u['auth']);
        eq($s, 401, 'a régi access token már nem jó');
        [$s] = call('GET', '/api/v1/me', null, ['Authorization' => 'Bearer ' . $j['access_token']]);
        eq($s, 200, 'az új access token jó');
        [$s, $e] = call('POST', '/api/v1/auth/refresh', ['refresh_token' => $u['refresh']]);
        eq([$s, $e['error']['code']], [401, 'SESSION_EXPIRED'], 'a régi refresh token újrahasználata elutasítva');
        [$s] = call('GET', '/api/v1/me', null, ['Authorization' => 'Bearer ' . $j['access_token']]);
        eq($s, 401, 'lopás-gyanú: a teljes munkamenet visszavonva (az új access sem jó)');
        [$s] = call('POST', '/api/v1/auth/refresh', ['refresh_token' => $j['refresh_token']]);
        eq($s, 401, 'és az új refresh token sem');
        ok((int) $GLOBALS['T_DB']->val("SELECT COUNT(*) FROM audit_logs WHERE event = 'REFRESH_REUSE_DETECTED'") > 0, 'audit: REFRESH_REUSE_DETECTED');
    },
    'lejárt access (15 perc) és lejárt refresh (60 nap)' => function () {
        $u = user();
        Clock::travel(Auth::ACCESS_TTL + 1);
        [$s, $j] = call('GET', '/api/v1/me', null, $u['auth']);
        eq([$s, $j['error']['code']], [401, 'SESSION_EXPIRED'], 'lejárt access');
        [$s] = call('POST', '/api/v1/auth/refresh', ['refresh_token' => $u['refresh']]);
        eq($s, 200, 'refresh-sel megújítható');
        $u2 = user();
        Clock::travel(Auth::REFRESH_TTL + 10);
        [$s] = call('POST', '/api/v1/auth/refresh', ['refresh_token' => $u2['refresh']]);
        eq($s, 401, 'lejárt refresh');
    },
    'kijelentkezés, kijelentkezés mindenhonnan' => function () {
        $u = user(true);
        [, $j2] = call('POST', '/api/v1/auth/login', ['email' => $u['email'], 'password' => $u['password'], 'device' => device()]);
        [$s] = call('POST', '/api/v1/auth/logout', null, $u['auth']);
        eq($s, 200, 'logout');
        [$s] = call('GET', '/api/v1/me', null, $u['auth']);
        eq($s, 401, 'a kijelentkezett token nem jó');
        [$s] = call('GET', '/api/v1/me', null, ['Authorization' => 'Bearer ' . $j2['access_token']]);
        eq($s, 200, 'a másik eszköz még bent van');
        [$s] = call('POST', '/api/v1/auth/logout-all', null, ['Authorization' => 'Bearer ' . $j2['access_token']]);
        eq($s, 200, 'logout-all');
        [$s] = call('GET', '/api/v1/me', null, ['Authorization' => 'Bearer ' . $j2['access_token']]);
        eq($s, 401, 'minden eszköz kijelentkezett');
        [$s] = call('POST', '/api/v1/auth/refresh', ['refresh_token' => $j2['refresh_token']]);
        eq($s, 401, 'a refresh token is halott');
    },
    'eszközök: lista, visszavonás (a munkamenet azonnal érvénytelen), eszközkorlát FREE-nél' => function () {
        $u = user(true);
        [, $j2] = call('POST', '/api/v1/auth/login', ['email' => $u['email'], 'password' => $u['password'], 'device' => device()]);
        [$s, $d] = call('GET', '/api/v1/devices', null, $u['auth']);
        eq([$s, count($d['devices'])], [200, 2], 'két eszköz');
        $other = array_values(array_filter($d['devices'], fn ($x) => !$x['current']))[0];
        [$s] = call('DELETE', '/api/v1/devices/' . $other['id'], null, $u['auth']);
        eq($s, 200, 'visszavonás');
        [$s] = call('GET', '/api/v1/me', null, ['Authorization' => 'Bearer ' . $j2['access_token']]);
        eq($s, 401, 'a visszavont eszköz tokenje halott');
        [$s] = call('POST', '/api/v1/auth/refresh', ['refresh_token' => $j2['refresh_token']]);
        eq($s, 401, 'a visszavont eszköz refresh tokenje is');
        $f = user(false);
        [$s, $j] = call('POST', '/api/v1/auth/login', ['email' => $f['email'], 'password' => $f['password'], 'device' => device()]);
        eq([$s, $j['error']['code'] ?? null], [403, 'DEVICE_LIMIT'], 'FREE: második eszköz nem léphet be');
        [$s] = call('POST', '/api/v1/auth/login', ['email' => $f['email'], 'password' => $f['password'], 'device' => $f['device']]);
        eq($s, 200, 'ugyanaz az eszköz újra beléphet');
    },
    'jelszó-visszaállítás: mindig 202, egyszer használható link, minden munkamenet visszavonva' => function () {
        $u = user();
        [$s] = call('POST', '/api/v1/auth/password/forgot', ['email' => 'nincs-' . bin2hex(random_bytes(3)) . '@example.test']);
        eq($s, 202, 'nem létező cím: 202');
        [$s] = call('POST', '/api/v1/auth/password/forgot', ['email' => $u['email']]);
        eq($s, 202, 'létező cím: 202');
        $mail = $GLOBALS['T_DB']->one("SELECT body_text FROM mail_outbox WHERE to_addr = ? AND template = 'reset'", [$u['email']]);
        ok(preg_match('#/r/([A-Za-z0-9_-]{43})#', $mail['body_text'], $m) === 1, 'link a levélben');
        [$s, , $r] = call('GET', '/r/' . $m[1]);
        eq($s, 200, 'űrlap megjelenik');
        ok(str_contains($r->headers['Content-Security-Policy'] ?? '', "default-src 'none'"), 'CSP');
        $csrf = 'a' . str_repeat('b', 31);
        [$s, , $r] = call('POST', '/r/' . $m[1], 'csrf=' . $csrf . '&password=Uj-Jelszo-2026x&password2=Uj-Jelszo-2026x', ['Content-Type' => 'application/x-www-form-urlencoded'], ['cookies' => ['mp_csrf' => $csrf]]); // gitleaks:allow (teszt-jelszó)
        eq($s, 200, 'új jelszó mentve');
        [$s] = call('GET', '/api/v1/me', null, $u['auth']);
        eq($s, 401, 'a régi munkamenet visszavonva');
        [$s] = call('POST', '/api/v1/auth/login', ['email' => $u['email'], 'password' => 'Uj-Jelszo-2026x', 'device' => $u['device']]); // gitleaks:allow (teszt-jelszó)
        eq($s, 200, 'belépés az új jelszóval');
        [$s] = call('POST', '/r/' . $m[1], 'csrf=' . $csrf . '&password=Masik-Jelszo-77x&password2=Masik-Jelszo-77x', ['Content-Type' => 'application/x-www-form-urlencoded'], ['cookies' => ['mp_csrf' => $csrf]]); // gitleaks:allow (teszt-jelszó)
        eq($s, 410, 'a link másodszor nem használható');
        [$s] = call('POST', '/r/' . str_repeat('A', 43), 'csrf=x', ['Content-Type' => 'application/x-www-form-urlencoded']);
        ok($s === 400 || $s === 410, 'CSRF nélkül / hibás tokennel nem megy');
    },
    'e-mail megerősítés: GET csak megjelenít, POST (CSRF-fel) erősít meg' => function () {
        $u = user();
        $mail = $GLOBALS['T_DB']->one("SELECT body_text FROM mail_outbox WHERE to_addr = ? AND template = 'verify'", [$u['email']]);
        preg_match('#/v/([A-Za-z0-9_-]{43})#', $mail['body_text'], $m);
        [$s] = call('GET', '/v/' . $m[1]);
        eq($s, 200, 'oldal');
        eq($GLOBALS['T_DB']->val('SELECT email_verified_at FROM accounts WHERE email = ?', [$u['email']]), null, 'GET még nem erősít meg (link-előnézet ellen)');
        [$s] = call('POST', '/v/' . $m[1], 'csrf=x', ['Content-Type' => 'application/x-www-form-urlencoded']);
        eq($s, 400, 'CSRF nélkül elutasítva');
        $c = str_repeat('c', 32);
        [$s] = call('POST', '/v/' . $m[1], 'csrf=' . $c, ['Content-Type' => 'application/x-www-form-urlencoded'], ['cookies' => ['mp_csrf' => $c]]);
        eq($s, 200, 'megerősítve');
        ok($GLOBALS['T_DB']->val('SELECT email_verified_at FROM accounts WHERE email = ?', [$u['email']]) !== null, 'email_verified_at kitöltve');
        [, $me] = call('GET', '/api/v1/me', null, $u['auth']);
        eq($me['account']['email_verified'], true, '/me mutatja');
    },
];
