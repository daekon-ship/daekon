<?php
declare(strict_types=1);

use MesterPlus\Clock;

return [
    'FREE → sandbox-vásárlás → ACTIVE, a jogosultságot a szerver adja (nem a kliens)' => function () {
        $u = user(false);
        [, $me] = call('GET', '/api/v1/me', null, $u['auth']);
        eq([$me['plan']['code'], $me['entitlements']], ['free', []], 'FREE, nincs jogosultság');
        ok(isset($me['cache_until']), 'offline gyorstár-határ (cache_until) a válaszban');
        [$s, $j] = call('POST', '/api/v1/billing/sandbox/verify', ['purchase_token' => sandboxToken()], $u['auth'] + idem());
        eq($s, 200, 'vásárlás ellenőrizve');
        eq($j['plan']['code'], 'pro', 'PRO');
        ok(in_array('cloud_backup', $j['entitlements'], true) && in_array('online_quotes', $j['entitlements'], true), 'cloud_backup + online_quotes');
        [$s] = call('POST', '/api/v1/billing/sandbox/verify', ['purchase_token' => sandboxToken('ismeretlen_termek')], $u['auth'] + idem());
        eq($s, 422, 'ismeretlen termék');
        [$s] = call('POST', '/api/v1/billing/sandbox/verify', ['purchase_token' => sandboxToken('mester_plus_pro_monthly', 'pending')], $u['auth'] + idem());
        eq($s, 402, 'függő fizetés: nincs jogosultság');
    },
    'ugyanaz a vásárlás nem használható két fiókban' => function () {
        $tok = sandboxToken();
        $a = user(false);
        $b = user(false);
        [$s] = call('POST', '/api/v1/billing/sandbox/verify', ['purchase_token' => $tok], $a['auth'] + idem());
        eq($s, 200, 'A');
        [$s, $j] = call('POST', '/api/v1/billing/sandbox/verify', ['purchase_token' => $tok], $b['auth'] + idem());
        eq([$s, $j['error']['code']], [409, 'PURCHASE_IN_USE'], 'B: elutasítva');
    },
    'éles Google Play hitelesítő adat nélkül KI van kapcsolva; production-ben sandbox sincs' => function () {
        $u = user(false);
        [$s, $j] = call('POST', '/api/v1/billing/google-play/verify', ['product_id' => 'mester_plus_pro_monthly', 'purchase_token' => 'x'], $u['auth'] + idem());
        eq([$s, $j['error']['code']], [503, 'BILLING_NOT_CONFIGURED'], 'Play: nincs beállítva');
        [$s] = webhook(['event_id' => 'gp-1-xxxxxxxx', 'type' => 'RENEWED']);
        $prod = app(app()->config()->with(['MP_ENV' => 'production']));
        [$s, $j] = call('POST', '/api/v1/billing/sandbox/verify', ['purchase_token' => sandboxToken()], $u['auth'] + idem(), ['app' => $prod]);
        eq($s, 404, 'production: sandbox végpont nincs');
        [$s] = call('POST', '/api/v1/billing/webhook/google-play', '{}', ['Content-Type' => 'application/json']);
        eq($s, 503, 'Play webhook: nincs beállítva');
    },
    'webhook: aláírás, lejárt időbélyeg, idempotens ismétlés, replay más tartalommal' => function () {
        $u = user(false);
        $tok = sandboxToken();
        call('POST', '/api/v1/billing/sandbox/verify', ['purchase_token' => $tok], $u['auth'] + idem());
        $ev = ['event_id' => 'evt-' . bin2hex(random_bytes(6)), 'type' => 'RENEWED', 'purchase_token' => $tok, 'period_end' => Clock::now() + 60 * 86400];
        [$s] = webhook($ev, null, random_bytes(32));
        eq($s, 401, 'rossz aláírás');
        [$s] = webhook($ev, Clock::now() - 600);
        eq($s, 401, '10 perces időbélyeg (replay-ablakon kívül)');
        [$s, $j] = webhook($ev);
        eq([$s, $j['status']], [200, 'processed'], 'feldolgozva');
        [$s, $j] = webhook($ev);
        eq([$s, $j['status']], [200, 'duplicate'], 'ismételt kézbesítés: nem dolgozza fel újra');
        eq((int) $GLOBALS['T_DB']->val('SELECT COUNT(*) FROM subscription_events WHERE provider_event_id = ?', [$ev['event_id']]), 1, 'egy előfizetés-esemény');
        [$s] = webhook(['type' => 'REVOKED'] + $ev);
        eq($s, 409, 'ugyanaz az esemény-azonosító más tartalommal: 409');
        [$s, $j] = webhook(['event_id' => 'evt-' . bin2hex(random_bytes(6)), 'type' => 'RENEWED', 'purchase_token' => sandboxToken()]);
        eq($j['status'], 'ignored', 'ismeretlen előfizetés: rögzítve, figyelmen kívül');
    },
    'életciklus: lemondás (időszak végéig marad) → lejárat; türelmi idő; visszavonás azonnal' => function () {
        $u = user(false);
        $tok = sandboxToken();
        call('POST', '/api/v1/billing/sandbox/verify', ['purchase_token' => $tok], $u['auth'] + idem());
        webhook(['event_id' => 'c-' . bin2hex(random_bytes(6)), 'type' => 'CANCELED', 'purchase_token' => $tok]);
        [, $me] = call('GET', '/api/v1/me', null, $u['auth']);
        ok(in_array('cloud_backup', $me['entitlements'], true), 'lemondás után a kifizetett időszak végéig Pro');
        eq($me['subscription']['auto_renewing'], false, 'automatikus megújítás ki');
        Clock::travel(31 * 86400);
        app()->billing()->maintain();
        eq($GLOBALS['T_DB']->val("SELECT s.status FROM subscriptions s JOIN workspace_members m ON m.workspace_id = s.workspace_id JOIN accounts a ON a.id = m.account_id WHERE a.email = ?", [$u['email']]), 'CANCELLED', 'CANCELLED');
        Clock::reset();
        $v = user(false);
        $t2 = sandboxToken();
        call('POST', '/api/v1/billing/sandbox/verify', ['purchase_token' => $t2], $v['auth'] + idem());
        webhook(['event_id' => 'g-' . bin2hex(random_bytes(6)), 'type' => 'IN_GRACE_PERIOD', 'purchase_token' => $t2, 'grace_until' => Clock::now() + 3 * 86400]);
        [, $me] = call('GET', '/api/v1/me', null, $v['auth']);
        eq([$me['subscription']['status'], in_array('cloud_backup', $me['entitlements'], true)], ['GRACE', true], 'türelmi idő: még Pro');
        webhook(['event_id' => 'h-' . bin2hex(random_bytes(6)), 'type' => 'ON_HOLD', 'purchase_token' => $t2]);
        [, $me] = call('GET', '/api/v1/me', null, $v['auth']);
        ok(!in_array('cloud_backup', $me['entitlements'], true), 'fizetési felfüggesztés (PAST_DUE): nincs Pro');
        webhook(['event_id' => 'r-' . bin2hex(random_bytes(6)), 'type' => 'RECOVERED', 'purchase_token' => $t2, 'period_end' => Clock::now() + 30 * 86400]);
        [, $me] = call('GET', '/api/v1/me', null, $v['auth']);
        ok(in_array('cloud_backup', $me['entitlements'], true), 'rendezett fizetés: újra Pro');
        webhook(['event_id' => 'x-' . bin2hex(random_bytes(6)), 'type' => 'REVOKED', 'purchase_token' => $t2]);
        [, $me] = call('GET', '/api/v1/me', null, $v['auth']);
        ok(!in_array('cloud_backup', $me['entitlements'], true) && $me['plan']['code'] === 'free', 'visszatérítés: azonnal FREE');
        ok((int) $GLOBALS['T_DB']->val("SELECT COUNT(*) FROM audit_logs WHERE event = 'SUBSCRIPTION_CHANGED'") > 0, 'audit: SUBSCRIPTION_CHANGED');
    },
    'próbaidőszak: alapból kikapcsolva (tulajdonosi döntés), bekapcsolva egyszer használható' => function () {
        $u = user(false);
        [$s, $j] = call('POST', '/api/v1/subscription/trial', null, $u['auth'] + idem());
        eq([$s, $j['error']['code']], [403, 'TRIAL_UNAVAILABLE'], 'alapból nincs');
        $on = app(app()->config()->with(['MP_TRIAL_ENABLED' => '1']));
        [$s, $j] = call('POST', '/api/v1/subscription/trial', null, $u['auth'] + idem(), ['app' => $on]);
        eq([$s, $j['subscription']['status']], [200, 'TRIAL'], 'TRIAL (14 nap a plans táblából)');
        [$s] = call('POST', '/api/v1/subscription/trial', null, $u['auth'] + idem(), ['app' => $on]);
        eq($s, 409, 'másodszor nem');
    },
    'PILOT jogosultság: lejáró Pro-funkciók előfizetés nélkül, „Mester+ Pilot” néven; lejárat után FREE' => function () {
        $u = user(false);
        $ws = (int) $GLOBALS['T_DB']->val('SELECT m.workspace_id FROM accounts a JOIN workspace_members m ON m.account_id = a.id WHERE a.email = ?', [$u['email']]);
        foreach (['cloud_backup', 'cloud_restore', 'online_quotes', 'multiple_devices'] as $f) {
            $GLOBALS['T_DB']->run("INSERT INTO entitlements (workspace_id, feature, source, valid_until, created_at) VALUES (?, ?, 'pilot', ?, ?)", [$ws, $f, Clock::sql(Clock::now() + 30 * 86400), Clock::sql()]);
        }
        [, $me] = call('GET', '/api/v1/me', null, $u['auth']);
        eq($me['plan'], ['code' => 'pilot', 'name' => 'Mester+ Pilot'], 'Mester+ Pilot');
        ok(in_array('cloud_backup', $me['entitlements'], true) && in_array('online_quotes', $me['entitlements'], true), 'felhőmentés + online ajánlat');
        ok($me['pilot_until'] !== null && $me['subscription'] === null, 'lejárattal, előfizetés nélkül');
        [$s] = uploadBackup($u);
        eq($s, 200, 'pilot: felhőmentés működik (a Pro mentési szabályával)');
        eq((int) $GLOBALS['T_DB']->val('SELECT COUNT(*) FROM subscriptions WHERE workspace_id = ?', [$ws]), 0, 'nem jön létre előfizetés (nem bevétel)');
        Clock::travel(31 * 86400);
        [, $t] = call('POST', '/api/v1/auth/login', ['email' => $u['email'], 'password' => $u['password'], 'device' => $u['device']]);
        [, $me] = call('GET', '/api/v1/me', null, ['Authorization' => 'Bearer ' . $t['access_token']]);
        eq([$me['plan']['code'], in_array('cloud_backup', $me['entitlements'], true)], ['free', false], 'lejárat után FREE (nincs örök Pro)');
        ok(in_array('cloud_restore', $me['entitlements'], true), 'lejárt pilot után a mentések még visszaállíthatók (türelmi idő)');
        Clock::travel(31 * 86400);
        [, $t] = call('POST', '/api/v1/auth/login', ['email' => $u['email'], 'password' => $u['password'], 'device' => $u['device']]);
        [, $me] = call('GET', '/api/v1/me', null, ['Authorization' => 'Bearer ' . $t['access_token']]);
        ok(!in_array('cloud_restore', $me['entitlements'], true), 'a türelmi idő után a visszaállítás sem örök');
    },
    'árlista: tervezet-árak DRAFT jelöléssel' => function () {
        [$s, $j] = call('GET', '/api/v1/plans');
        eq($s, 200, 'plans');
        $pro = array_values(array_filter($j['plans'], fn ($p) => $p['code'] === 'pro'))[0];
        eq([$pro['pricing_status'], $pro['price_huf_month'], $pro['price_huf_year']], ['DRAFT', 4990, 49900], 'DRAFT 4990 / 49900');
    },
];
