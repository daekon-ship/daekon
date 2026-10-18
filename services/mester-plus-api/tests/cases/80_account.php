<?php
declare(strict_types=1);

return [
    '/me: fiók, munkaterület, csomag, jogosultságok, gyorstár-határ' => function () {
        $u = user(true);
        [$s, $j] = call('GET', '/api/v1/me', null, $u['auth']);
        eq($s, 200, '200');
        eq($j['account']['email'], $u['email'], 'e-mail');
        eq($j['workspace']['role'], 'owner', 'tulajdonos');
        eq($j['plan']['code'], 'pro', 'PRO');
        ok(strtotime($j['cache_until']) > time() + 6 * 86400, 'cache_until ~7 nap');
    },
    'ADATAIM EXPORTÁLÁSA: fiók, eszközök, mentés- és ajánlat-metaadat – tartalom és titok nélkül' => function () {
        $u = user(true);
        uploadBackup($u);
        createQuote($u);
        [$s, $j] = call('GET', '/api/v1/account/export', null, $u['auth']);
        eq($s, 200, 'export');
        ok(isset($j['account'], $j['devices'], $j['cloud_backups'], $j['online_quotes'], $j['subscription']), 'minden blokk');
        eq(count($j['cloud_backups']), 1, 'mentés-metaadat');
        eq(count($j['online_quotes']), 1, 'ajánlat-metaadat');
        $txt = json_encode($j, JSON_UNESCAPED_UNICODE);
        ok(!str_contains($txt, 'password') && !str_contains($txt, 'Kovács Péter') && !str_contains($txt, 'token'), 'nincs jelszó, ügyfélnév, token');
    },
    'FIÓK TÖRLÉSE: rossz jelszóval nem; utána: munkamenet, eszköz, mentés (fájl is), ajánlat-link, e-mail törölve; audit marad' => function () {
        $u = user(true);
        [, $bk] = uploadBackup($u);
        $q = createQuote($u);
        $path = $GLOBALS['T_STORAGE'] . '/' . $GLOBALS['T_DB']->val('SELECT storage_key FROM cloud_backups WHERE public_id = ?', [$bk['_id']]);
        $accId = (int) $GLOBALS['T_DB']->val('SELECT id FROM accounts WHERE email = ?', [$u['email']]);
        [$s] = call('POST', '/api/v1/account/delete', ['password' => 'rossz-jelszo-123'], $u['auth']);
        eq($s, 403, 'rossz jelszó');
        [$s] = call('POST', '/api/v1/account/delete', ['password' => $u['password']], $u['auth']);
        eq($s, 200, 'törölve');
        $a = $GLOBALS['T_DB']->one('SELECT * FROM accounts WHERE id = ?', [$accId]);
        eq([$a['status'], $a['email'], $a['password_hash']], ['DELETED', null, null], 'fiók: DELETED, e-mail és jelszó törölve');
        eq((int) $GLOBALS['T_DB']->val('SELECT COUNT(*) FROM sessions WHERE account_id = ?', [$accId]), 0, 'munkamenetek');
        eq((int) $GLOBALS['T_DB']->val('SELECT COUNT(*) FROM devices WHERE account_id = ?', [$accId]), 0, 'eszközök');
        ok(!is_file($path), 'mentés-fájl törölve');
        eq($GLOBALS['T_DB']->val('SELECT status FROM cloud_backups WHERE public_id = ?', [$bk['_id']]), 'DELETED', 'mentés-sor DELETED');
        [$s] = call('GET', '/a/' . $q['token'], null, ['User-Agent' => 'Mozilla/5.0']);
        eq($s, 410, 'az online ajánlat linkje halott');
        eq($GLOBALS['T_DB']->val('SELECT snapshot FROM quote_shares WHERE public_id = ?', [$q['id']]), '{}', 'ajánlat-tartalom törölve');
        [$s] = call('GET', '/api/v1/me', null, $u['auth']);
        eq($s, 401, 'a token halott');
        [$s] = call('POST', '/api/v1/auth/login', ['email' => $u['email'], 'password' => $u['password'], 'device' => $u['device']]);
        eq($s, 401, 'belépés nem lehetséges');
        ok((int) $GLOBALS['T_DB']->val("SELECT COUNT(*) FROM audit_logs WHERE account_id = ? AND event = 'ACCOUNT_DELETE_REQUEST'", [$accId]) === 1, 'audit megmarad (belső azonosítóval)');
        [$s] = call('POST', '/api/v1/auth/register', ['email' => $u['email'], 'password' => 'Jo-Jelszo-123x', 'device' => device()]);
        eq($s, 201, 'az e-mail cím újra regisztrálható');
    },
];
