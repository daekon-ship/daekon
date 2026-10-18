<?php
declare(strict_types=1);

use MesterPlus\App;
use MesterPlus\Db;
use MesterPlus\Log;

return [
    'rate limit végpontonként külön: a belépés kimerítése nem zárja ki a regisztrációt / health-et' => function () {
        $ip = '198.51.100.' . random_int(10, 250);
        $last = 0;
        for ($i = 0; $i < 21; $i++) {
            [$last] = call('POST', '/api/v1/auth/login', ['email' => "x$i@example.test", 'password' => 'rossz-jelszo-123', 'device' => device()], [], ['ip' => $ip]);
        }
        eq($last, 429, 'belépés: 21. kérés 429');
        [$s, $j, $r] = call('POST', '/api/v1/auth/login', ['email' => 'y@example.test', 'password' => 'rossz-jelszo-123', 'device' => device()], [], ['ip' => $ip]);
        ok(isset($r->headers['Retry-After']) && $j['error']['code'] === 'RATE_LIMITED', 'Retry-After + RATE_LIMITED');
        eq($j['error']['message'], 'Túl sok próbálkozás. Próbáld újra később.', 'magyar üzenet');
        [$s] = call('GET', '/api/v1/health', null, [], ['ip' => $ip]);
        eq($s, 200, 'health ugyanarról az IP-ről megy');
        [$s] = call('POST', '/api/v1/auth/register', ['email' => 'r' . bin2hex(random_bytes(4)) . '@example.test', 'password' => 'Jo-Jelszo-123x', 'device' => device()], [], ['ip' => $ip]);
        eq($s, 201, 'regisztráció külön kerettel megy');
        for ($i = 0; $i < 5; $i++) {
            [$last] = call('POST', '/api/v1/auth/register', ['email' => 'r' . bin2hex(random_bytes(4)) . '@example.test', 'password' => 'Jo-Jelszo-123x', 'device' => device()], [], ['ip' => $ip]);
        }
        eq($last, 429, 'regisztráció: óránként 5');
    },
    'SQL injection: paraméterezett lekérdezés – a támadó szöveg sima adat' => function () {
        foreach (["' OR '1'='1", "admin'--", "x@example.test' UNION SELECT password_hash FROM accounts--"] as $p) {
            [$s, $j] = call('POST', '/api/v1/auth/login', ['email' => $p, 'password' => $p, 'device' => device()]);
            ok(in_array($s, [401, 422], true), "login: $s");
            ok(!str_contains(json_encode($j), 'argon2') && !str_contains(json_encode($j), 'SQL'), 'nincs DB-részlet a válaszban');
        }
        $u = user(true);
        [$s, $j] = call('GET', "/api/v1/quotes?quote_number=" . urlencode("' OR 1=1 -- "), null, $u['auth']);
        eq($s, 200, 'hibás szűrő: figyelmen kívül');
        eq((int) $GLOBALS['T_DB']->val('SELECT COUNT(*) FROM plans'), 3, 'a séma ép');
    },
    'útvonal-trükk: mentés-azonosítóban, tokenben nem jut ki a tárolóból' => function () {
        $u = user(true);
        foreach (['/api/v1/backups/..%2f..%2fetc%2fpasswd/content', '/api/v1/backups/../../config/content', '/api/v1/backups/%2e%2e/content', '/api/v1/backups/' . str_repeat('a', 25) . '/content'] as $p) {
            [$s, , $r] = call('GET', $p, null, $u['auth']);
            ok($s === 404 && !str_contains($r->body, 'root:'), "$p → $s");
        }
    },
    'admin / belső végpont normál felhasználóval nem érhető el; nincs admin API' => function () {
        $u = user(true);
        foreach (['/api/v1/admin/stats', '/api/v1/admin/accounts', '/admin', '/bin/cli.php', '/src/App.php', '/migrations/0001_init.php', '/tests/run.php'] as $p) {
            [$s] = call('GET', $p, null, $u['auth']);
            eq($s, 404, "$p → 404");
        }
        $GLOBALS['T_DB']->run("UPDATE accounts SET role = 'admin' WHERE email = ?", [$u['email']]);
        [$s] = call('GET', '/api/v1/admin/stats', null, $u['auth']);
        eq($s, 404, 'admin szerepkörrel sincs webes admin-API (az admin a WebPanelben, Webmin-hitelesítéssel)');
    },
    'HTTPS kötelező productionben; hibaséma egységes, belső részlet nélkül' => function () {
        $prod = app(app()->config()->with(['MP_ENV' => 'production']));
        foreach ([['GET', '/api/v1/me'], ['GET', '/api/v1/plans'], ['POST', '/api/v1/auth/login'], ['GET', '/a/' . str_repeat('A', 43)]] as [$m, $pth]) {
            [$s] = call($m, $pth, $m === 'POST' ? ['email' => 'a@b.hu'] : null, [], ['app' => $prod, 'https' => false]);
            eq($s, 403, "HTTP $m $pth: 403 (HTTPS kötelező)");
        }
        [$s] = call('GET', '/api/v1/health', null, [], ['app' => $prod, 'https' => false]);
        eq($s, 200, 'HTTP health: elérhető (titok nélkül; a QA / Site Health a tanúsítvány előtt is mér)');
        [$s, $j, $r] = call('GET', '/api/v1/nincs-ilyen');
        eq([$s, array_keys($j['error'])], [404, ['code', 'message', 'request_id']], 'egységes hibaséma');
        ok(isset($r->headers['X-Request-ID']), 'X-Request-ID');
        [$s, , $r] = call('GET', '/api/v1/me', null, ['X-Request-ID' => 'app-req-12345678']);
        eq($r->headers['X-Correlation-ID'] ?? '', 'app-req-12345678', 'korrelációs azonosító visszaadva');
        [$s, $j] = call('POST', '/api/v1/auth/login', '{nem json', ['Content-Type' => 'application/json']);
        eq([$s, $j['error']['code']], [400, 'INVALID_JSON'], 'hibás JSON');
        [$s] = call('POST', '/api/v1/auth/login', 'email=x', ['Content-Type' => 'application/x-www-form-urlencoded']);
        eq($s, 415, 'nem JSON tartalomtípus');
    },
    'adatbázis-leállás: 503 általános magyar üzenettel, stack trace / SQL nélkül; health 503' => function () {
        $dead = new App(app()->config()->with(['DB_NAME' => 'mp_test_nincs_ilyen_db', 'DB_SOCKET' => '/nonexistent.sock', 'DB_HOST' => '127.0.0.1']));
        [$s, $j, $r] = call('POST', '/api/v1/auth/login', ['email' => 'a@example.test', 'password' => 'Jo-Jelszo-123x', 'device' => device()], [], ['app' => $dead]);
        eq([$s, $j['error']['code']], [503, 'SERVICE_UNAVAILABLE'], '503');
        ok(!preg_match('/PDO|SQLSTATE|\.php|#0|stack/i', $r->body), 'nincs belső részlet');
        [$s, $j] = call('GET', '/api/v1/health', null, [], ['app' => $dead]);
        eq([$s, $j['checks']['database']], [503, 'fail'], 'health: database fail');
    },
    'naplók: nincs jelszó, token, e-mail; a publikus ajánlat-útvonal csak mintaként' => function () {
        Log::$memory = [];
        $u = user(true);
        call('POST', '/api/v1/auth/refresh', ['refresh_token' => $u['refresh']]);
        call('GET', '/a/' . str_repeat('Q', 43), null, ['User-Agent' => 'Mozilla/5.0']);
        $all = json_encode(Log::$memory, JSON_UNESCAPED_UNICODE);
        ok(!str_contains($all, $u['password']) && !str_contains($all, $u['access']) && !str_contains($all, $u['refresh']) && !str_contains($all, $u['email']), 'nincs titok / e-mail');
        ok(!str_contains($all, str_repeat('Q', 43)), 'a token nincs a naplóban');
        ok(str_contains($all, '"route":"quote.page"'), 'útvonal név szerint');
        $audit = json_encode($GLOBALS['T_DB']->all('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200'), JSON_INVALID_UTF8_SUBSTITUTE);
        ok(!str_contains($audit, $u['password']) && !str_contains($audit, $u['email']), 'audit: nincs jelszó / e-mail');
    },
    'health: nincs titok, verzió és ellenőrzések' => function () {
        [$s, $j, $r] = call('GET', '/api/v1/health');
        eq([$s, $j['status']], [200, 'ok'], 'ok');
        eq(array_keys($j['checks']), ['app', 'database', 'storage'], 'app, database, storage');
        ok(!preg_match('/pass|secret|key|pepper|DB_|\/srv|\/var/i', $r->body), 'titok / útvonal nincs a válaszban');
    },
];
