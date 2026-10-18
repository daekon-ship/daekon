<?php
declare(strict_types=1);

return [
    'TENANT ISOLATION: A fiók tokenje B munkaterület egyetlen erőforrását sem éri el (403/404, adat nélkül)' => function () {
        $a = user(true);
        $b = user(true);
        [, $bk] = uploadBackup($b);
        $bq = createQuote($b);
        [, $bDevs] = call('GET', '/api/v1/devices', null, $b['auth']);
        $bDev = $bDevs['devices'][0]['id'];
        $probes = [
            ['GET', '/api/v1/backups/' . $bk['_id'] . '/content'],
            ['PUT', '/api/v1/backups/' . $bk['_id'] . '/content'],
            ['DELETE', '/api/v1/backups/' . $bk['_id']],
            ['GET', '/api/v1/quotes/' . $bq['id']],
            ['POST', '/api/v1/quotes/' . $bq['id'] . '/revoke'],
            ['DELETE', '/api/v1/devices/' . $bDev],
        ];
        foreach ($probes as [$m, $p]) {
            [$s, $j, $r] = call($m, $p, $m === 'PUT' ? 'x' : null, $a['auth']);
            ok(in_array($s, [403, 404], true), "$m $p → $s");
            ok(!str_contains($r->body, $b['email']) && !str_contains($r->body, 'Kőműves'), "$m $p: nincs B-adat a válaszban");
        }
        [, $l] = call('GET', '/api/v1/backups', null, $a['auth']);
        eq(count($l['backups']), 0, 'A listájában nincs B mentése');
        [, $ql] = call('GET', '/api/v1/quotes?quote_number=' . urlencode($bq['quote_number']), null, $a['auth']);
        eq(count($ql['quotes']), 0, 'A nem látja B ajánlatát szám alapján sem');
        [, $dl] = call('GET', '/api/v1/devices', null, $a['auth']);
        ok(!in_array($bDev, array_column($dl['devices'], 'id'), true), 'A eszközlistájában nincs B eszköze');
        [, $ka] = call('GET', '/api/v1/backups/key', null, $a['auth']);
        [, $kb] = call('GET', '/api/v1/backups/key', null, $b['auth']);
        ok($ka['key'] !== $kb['key'], 'külön mentési kulcs');
        eq($GLOBALS['T_DB']->val('SELECT status FROM cloud_backups WHERE public_id = ?', [$bk['_id']]), 'READY', 'B mentése érintetlen');
        eq($GLOBALS['T_DB']->val('SELECT status FROM quote_shares WHERE public_id = ?', [$bq['id']]), 'ACTIVE', 'B ajánlata érintetlen');
        eq($GLOBALS['T_DB']->val('SELECT revoked_at FROM devices WHERE public_id = ?', [$bDev]), null, 'B eszköze érintetlen');
        [, $exp] = call('GET', '/api/v1/account/export', null, $a['auth']);
        ok(!str_contains(json_encode($exp, JSON_UNESCAPED_UNICODE), $bk['_id']) && !str_contains(json_encode($exp, JSON_UNESCAPED_UNICODE), $bq['id']), 'A exportjában nincs B adata');
    },
    'mentés-azonosító felsorolás nem működik: nem létező és idegen azonosító ugyanazt adja' => function () {
        $a = user(true);
        $b = user(true);
        [, $bk] = uploadBackup($b);
        [$s1, $j1] = call('GET', '/api/v1/backups/' . $bk['_id'] . '/content', null, $a['auth']);
        [$s2, $j2] = call('GET', '/api/v1/backups/' . str_repeat('0', 26) . '/content', null, $a['auth']);
        eq([$s1, $j1['error']['code']], [$s2, $j2['error']['code']], 'idegen = nem létező (404)');
        ok(preg_match('/^[0-9a-z]{26}$/', $bk['_id']) === 1 && !ctype_digit($bk['_id']), 'nem sorszám-alapú azonosító');
    },
];
