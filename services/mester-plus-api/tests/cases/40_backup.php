<?php
declare(strict_types=1);

use MesterPlus\Clock;

return [
    'FREE fiók: nincs felhőmentés (PRO_REQUIRED), de a helyi app ettől független' => function () {
        $u = user(false);
        [$s, $j] = call('GET', '/api/v1/backups/key', null, $u['auth']);
        eq([$s, $j['error']['code']], [403, 'PRO_REQUIRED'], 'kulcs');
        [$s, $j] = call('GET', '/api/v1/backups', null, $u['auth']);
        eq([$s, $j['error']['code']], [403, 'PRO_REQUIRED'], 'lista');
        eq($j['error']['message'], 'Ehhez a funkcióhoz Mester+ Pro szükséges.', 'magyar üzenet');
    },
    'mentési kulcs: munkaterületenként egy, ismételt lekérés ugyanazt adja; a DB-ben csak burkolva' => function () {
        $u = user(true);
        [$s, $a] = call('GET', '/api/v1/backups/key', null, $u['auth']);
        [, $b] = call('GET', '/api/v1/backups/key', null, $u['auth']);
        eq([$s, $a['key_version']], [200, 1], 'v1');
        eq($a['key'], $b['key'], 'stabil');
        $raw = base64_decode($a['key']);
        $w = $GLOBALS['T_DB']->one('SELECT k.wrapped_key FROM backup_keys k JOIN workspace_members m ON m.workspace_id = k.workspace_id JOIN accounts a ON a.id = m.account_id WHERE a.email = ?', [$u['email']]);
        ok(!str_contains($w['wrapped_key'], $raw), 'a nyers kulcs nincs a DB-ben');
        $u2 = user(true);
        [, $c] = call('GET', '/api/v1/backups/key', null, $u2['auth']);
        ok($c['key'] !== $a['key'], 'másik munkaterület: másik kulcs');
        $other = app(app()->config()->with(['MP_KEK_1' => base64_encode(random_bytes(32))]));
        [$s] = call('GET', '/api/v1/backups/key', null, $u['auth'], ['app' => $other]);
        eq($s, 500, 'más mesterkulccsal a burkolt kulcs nem bontható ki (tároló-szivárgás önmagában nem elég)');
    },
    'feltöltés → VERIFYING → READY; lista; letöltés + visszafejtés = eredeti' => function () {
        $u = user(true);
        $plain = json_encode(['app' => 'mester_plus', 'tables' => ['customers' => [['id' => 7, 'name' => 'Szabó Éva – Ő ű']]]], JSON_UNESCAPED_UNICODE);
        [$s, $j, $blob, $key] = uploadBackup($u, $plain);
        eq([$s, $j['status']], [200, 'READY'], 'READY');
        [$s, $l] = call('GET', '/api/v1/backups', null, $u['auth']);
        eq([$s, count($l['backups'])], [200, 1], 'egy mentés a listában');
        eq($l['backups'][0]['device']['name'], 'Teszt telefon', 'eszköz neve');
        eq($l['backups'][0]['app_version'], '0.8.0', 'app verzió');
        [$s, , $r] = call('GET', '/api/v1/backups/' . $j['_id'] . '/content', null, $u['auth']);
        eq($s, 200, 'letöltés');
        eq(hash('sha256', $r->body), $r->headers['X-Checksum-SHA256'], 'ellenőrzőösszeg a fejlécben egyezik');
        [, $me] = call('GET', '/api/v1/me', null, $u['auth']);
        eq(decryptBackup($r->body, $key, $me['workspace']['id']), $plain, 'visszafejtve = eredeti (ékezetekkel)');
        $path = $GLOBALS['T_STORAGE'] . '/' . $GLOBALS['T_DB']->val('SELECT storage_key FROM cloud_backups WHERE public_id = ?', [$j['_id']]);
        ok(is_file($path) && !str_contains((string) file_get_contents($path), 'Szabó'), 'a tárolón csak titkosított blob van');
        eq(substr(sprintf('%o', fileperms($path)), -3), '640', 'fájljog 0640');
        ok((int) $GLOBALS['T_DB']->val("SELECT COUNT(*) FROM audit_logs WHERE event IN ('BACKUP_UPLOAD','BACKUP_DOWNLOAD')") >= 2, 'audit');
    },
    'sérült feltöltés: rossz ellenőrzőösszeg / méret / fejléc → FAILED, soha nem READY' => function () {
        $u = user(true);
        [$s, $j] = uploadBackup($u, '', fn ($b) => substr($b, 0, -1) . chr(ord($b[-1]) ^ 1));
        eq([$s, $j['error']['code']], [422, 'CHECKSUM_MISMATCH'], 'egy bit eltérés');
        [$s, $j] = uploadBackup($u, '', fn ($b) => substr($b, 0, -5), null);
        ok($s === 422, 'rövidebb tartalom');
        [$s, $j] = uploadBackup($u, '', fn ($b) => 'XXXX' . substr($b, 4));
        ok($s === 422, 'hibás fejléc / összeg');
        eq((int) $GLOBALS['T_DB']->val("SELECT COUNT(*) FROM cloud_backups b JOIN workspace_members m ON m.workspace_id = b.workspace_id JOIN accounts a ON a.id = m.account_id WHERE a.email = ? AND b.status = 'READY'", [$u['email']]), 0, 'nincs READY');
        [, $l] = call('GET', '/api/v1/backups', null, $u['auth']);
        eq(count($l['backups']), 0, 'a listában sincs');
        $tmp = glob($GLOBALS['T_STORAGE'] . '/.tmp/*.part') ?: [];
        eq(count($tmp), 0, 'nem maradt ideiglenes fájl');
    },
    'nem Mester+ fájl (helyes ellenőrzőösszeggel is) → elutasítva' => function () {
        $u = user(true);
        [, $k] = call('GET', '/api/v1/backups/key', null, $u['auth']);
        $blob = str_repeat('PK', 100);
        [$s, $init] = call('POST', '/api/v1/backups', ['size_bytes' => strlen($blob), 'sha256' => hash('sha256', $blob), 'app_version' => '0.8.0', 'backup_format_version' => 2, 'encryption_version' => 1, 'key_version' => 1], $u['auth'] + idem());
        [$s, $j] = call('PUT', $init['upload_path'], $blob, $u['auth']);
        eq([$s, $j['error']['code']], [422, 'BAD_HEADER'], 'fejléc-ellenőrzés');
    },
    'idempotens bejelentés: ugyanaz a kulcs → ugyanaz a mentés-azonosító, nincs duplikáció' => function () {
        $u = user(true);
        call('GET', '/api/v1/backups/key', null, $u['auth']);
        $body = ['size_bytes' => 1000, 'sha256' => str_repeat('a', 64), 'app_version' => '0.8.0', 'backup_format_version' => 2, 'encryption_version' => 1, 'key_version' => 1];
        $h = $u['auth'] + idem();
        [$s1, $a] = call('POST', '/api/v1/backups', $body, $h);
        [$s2, $b, $r2] = call('POST', '/api/v1/backups', $body, $h);
        eq([$s1, $s2], [201, 201], 'mindkettő 201');
        eq($a['id'], $b['id'], 'ugyanaz az azonosító');
        eq($r2->headers['Idempotent-Replayed'] ?? '', 'true', 'ismételt válasz jelölve');
        [$s3, $c] = call('POST', '/api/v1/backups', ['size_bytes' => 2000] + $body, $h);
        eq([$s3, $c['error']['code']], [409, 'IDEMPOTENCY_CONFLICT'], 'ugyanaz a kulcs más tartalommal: 409');
        [$s4, $d] = call('POST', '/api/v1/backups', $body, $u['auth']);
        eq([$s4, $d['error']['code']], [400, 'IDEMPOTENCY_KEY_REQUIRED'], 'kulcs nélkül nem fogadja');
        eq((int) $GLOBALS['T_DB']->val("SELECT COUNT(*) FROM cloud_backups b JOIN workspace_members m ON m.workspace_id = b.workspace_id JOIN accounts a ON a.id = m.account_id WHERE a.email = ?", [$u['email']]), 1, 'egy sor jött létre');
        [$s] = call('PUT', '/api/v1/backups/' . $a['id'] . '/content', str_repeat('x', 1000), $u['auth']);
        eq($s, 422, 'hibás tartalom → FAILED');
        [$s, $e] = call('PUT', '/api/v1/backups/' . $a['id'] . '/content', str_repeat('x', 1000), $u['auth']);
        eq([$s, $e['error']['code']], [409, 'BACKUP_NOT_UPLOADABLE'], 'FAILED mentés nem tölthető újra – új mentés kell');
    },
    'kvóta (413) és méretkorlát (413), tárhely-figyelmeztetés' => function () {
        $u = user(true);
        call('GET', '/api/v1/backups/key', null, $u['auth']);
        [$s, $j] = call('POST', '/api/v1/backups', ['size_bytes' => 60 * 1024 * 1024, 'sha256' => str_repeat('b', 64), 'app_version' => '0.8.0', 'backup_format_version' => 2, 'encryption_version' => 1, 'key_version' => 1], $u['auth'] + idem());
        eq([$s, $j['error']['code']], [413, 'BACKUP_TOO_LARGE'], 'túl nagy');
        $GLOBALS['T_DB']->run("UPDATE plans SET backup_quota_bytes = 100000 WHERE code = 'pro'");
        [$s, $j] = call('POST', '/api/v1/backups', ['size_bytes' => 90000, 'sha256' => str_repeat('c', 64), 'app_version' => '0.8.0', 'backup_format_version' => 2, 'encryption_version' => 1, 'key_version' => 1], $u['auth'] + idem());
        eq([$s, $j['quota_warning']], [201, true], '80% felett figyelmeztetés');
        [$s, $j] = call('POST', '/api/v1/backups', ['size_bytes' => 20000, 'sha256' => str_repeat('d', 64), 'app_version' => '0.8.0', 'backup_format_version' => 2, 'encryption_version' => 1, 'key_version' => 1], $u['auth'] + idem());
        eq([$s, $j['error']['code']], [413, 'QUOTA_EXCEEDED'], 'kvóta túllépés');
        ok(isset($j['error']['quota_bytes'], $j['error']['used_bytes']), 'used_bytes / quota_bytes a hibában');
        $GLOBALS['T_DB']->run("UPDATE plans SET backup_quota_bytes = 524288000 WHERE code = 'pro'");
    },
    'megőrzés: legfeljebb N verzió, a legfrissebb soha nem törlődik; régi verziók a lemezről is törlődnek' => function () {
        $u = user(true);
        $GLOBALS['T_DB']->run("UPDATE plans SET backup_max_versions = 3 WHERE code = 'pro'");
        $ids = [];
        for ($i = 0; $i < 5; $i++) {
            Clock::travel(60);
            [$s, $j] = uploadBackup($u, json_encode(['n' => $i]));
            $ids[] = $j['_id'];
        }
        [, $l] = call('GET', '/api/v1/backups', null, $u['auth']);
        eq(count($l['backups']), 3, '3 verzió marad');
        eq($l['backups'][0]['id'], $ids[4], 'a legfrissebb az első');
        eq($GLOBALS['T_DB']->val('SELECT status FROM cloud_backups WHERE public_id = ?', [$ids[0]]), 'DELETED', 'a legrégebbi törölve');
        ok(!is_file($GLOBALS['T_STORAGE'] . '/' . $GLOBALS['T_DB']->val('SELECT storage_key FROM cloud_backups WHERE public_id = ?', [$ids[0]])), 'a fájl is törölve');
        Clock::travel(40 * 86400);
        app()->backups()->retention((int) $GLOBALS['T_DB']->val('SELECT workspace_id FROM cloud_backups WHERE public_id = ?', [$ids[4]]));
        eq($GLOBALS['T_DB']->val('SELECT status FROM cloud_backups WHERE public_id = ?', [$ids[4]]), 'READY', '30 napon túl is megmarad a legfrissebb');
        eq($GLOBALS['T_DB']->val('SELECT status FROM cloud_backups WHERE public_id = ?', [$ids[3]]), 'DELETED', 'a 30 napnál régebbi többi törölve');
        $GLOBALS['T_DB']->run("UPDATE plans SET backup_max_versions = 30 WHERE code = 'pro'");
    },
    'tárhely nem elérhető → 503, nem READY; a meglévő mentés letöltése tárhely-hibánál 503 (nem hibás adat)' => function () {
        $u = user(true);
        [$s, $j] = uploadBackup($u);
        $id = $j['_id'];
        $broken = app(app()->config()->with(['MP_STORAGE_DIR' => '/proc/nem-irhato/mp']));
        [, $k] = call('GET', '/api/v1/backups/key', null, $u['auth']);
        [$s, $init] = call('POST', '/api/v1/backups', ['size_bytes' => 100, 'sha256' => str_repeat('e', 64), 'app_version' => '0.8.0', 'backup_format_version' => 2, 'encryption_version' => 1, 'key_version' => 1], $u['auth'] + idem(), ['app' => $broken]);
        eq([$s, $init['error']['code'] ?? null], [503, 'STORAGE_UNAVAILABLE'], 'feltöltés-bejelentés: 503');
        [$s, $e] = call('GET', "/api/v1/backups/$id/content", null, $u['auth'], ['app' => $broken]);
        eq([$s, $e['error']['code']], [503, 'STORAGE_UNAVAILABLE'], 'letöltés: 503');
        [$s] = call('GET', '/api/v1/health', null, [], ['app' => $broken]);
        eq($s, 503, 'health: storage fail → 503');
    },
    'lejárt előfizetés: új mentés nem tölthető fel, a meglévő 30 napig visszaállítható' => function () {
        $u = user(true);
        [$s, $j] = uploadBackup($u);
        Clock::travel(31 * 86400);
        app()->billing()->maintain();
        [$s, $e] = call('GET', '/api/v1/backups/key', null, $u['auth']);
        eq($s, 401, 'a régi access token közben lejárt');
        [, $t] = call('POST', '/api/v1/auth/login', ['email' => $u['email'], 'password' => $u['password'], 'device' => $u['device']]);
        $h = ['Authorization' => 'Bearer ' . $t['access_token']];
        [$s, $l] = call('GET', '/api/v1/backups', null, $h);
        eq([$s, count($l['backups'])], [200, 1], 'lista és visszaállítás még megy (cloud_restore)');
        [$s] = call('GET', '/api/v1/backups/' . $j['_id'] . '/content', null, $h);
        eq($s, 200, 'letöltés megy');
        [$s, $e] = call('POST', '/api/v1/backups', ['size_bytes' => 100, 'sha256' => str_repeat('f', 64), 'app_version' => '0.8.0', 'backup_format_version' => 2, 'encryption_version' => 1, 'key_version' => 1], $h + idem());
        eq([$s, $e['error']['code']], [403, 'PRO_REQUIRED'], 'új mentés nem');
    },
    'mentés törlése: fájl és sor; másodszor is rendben (idempotens)' => function () {
        $u = user(true);
        [, $j] = uploadBackup($u);
        $path = $GLOBALS['T_STORAGE'] . '/' . $GLOBALS['T_DB']->val('SELECT storage_key FROM cloud_backups WHERE public_id = ?', [$j['_id']]);
        [$s] = call('DELETE', '/api/v1/backups/' . $j['_id'], null, $u['auth']);
        eq($s, 200, 'törlés');
        ok(!is_file($path), 'fájl törölve');
        [$s] = call('DELETE', '/api/v1/backups/' . $j['_id'], null, $u['auth']);
        eq($s, 200, 'ismételt törlés rendben');
        [$s] = call('GET', '/api/v1/backups/' . $j['_id'] . '/content', null, $u['auth']);
        eq($s, 404, 'törölt mentés nem tölthető le');
    },
];
