<?php
declare(strict_types=1);

use MesterPlus\Migrator;

return [
    'üres adatbázison minden migráció lefut, a séma teljes' => function () {
        $m = new Migrator($GLOBALS['T_DB'], dirname(__DIR__, 2) . '/migrations');
        $ran = $m->migrate();
        ok(count($ran) >= 2, 'legalább 2 migráció lefutott');
        $tables = array_column($GLOBALS['T_DB']->all('SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE()'), 't');
        foreach (['accounts', 'workspaces', 'workspace_members', 'devices', 'sessions', 'refresh_tokens', 'plans', 'subscriptions', 'subscription_events',
                  'entitlements', 'cloud_backups', 'backup_keys', 'quote_shares', 'quote_events', 'webhook_events', 'idempotency_keys', 'audit_logs',
                  'rate_limit_state', 'schema_migrations'] as $t) {
            ok(in_array($t, $tables, true), "tábla létezik: $t");
        }
        $engines = $GLOBALS['T_DB']->all("SELECT table_name, engine, table_collation FROM information_schema.tables WHERE table_schema = DATABASE()");
        ok(array_filter($engines, fn ($e) => $e['engine'] !== 'InnoDB' || !str_starts_with((string) $e['table_collation'], 'utf8mb4')) === [], 'minden tábla InnoDB + utf8mb4');
        eq((int) $GLOBALS['T_DB']->val("SELECT COUNT(*) FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE()") >= 15, true, 'idegen kulcsok megvannak');
    },
    'ismételt futtatás nem csinál semmit (idempotens)' => function () {
        $m = new Migrator($GLOBALS['T_DB'], dirname(__DIR__, 2) . '/migrations');
        eq($m->migrate(), [], 'nincs újabb migráció');
        ok(array_filter($m->status(), fn ($s) => $s['state'] !== 'applied') === [], 'minden „applied”');
    },
    'módosított, már lefutott migráció és romboló utasítás → megáll' => function () {
        $dir = sys_get_temp_dir() . '/mpmig' . bin2hex(random_bytes(3));
        mkdir($dir);
        foreach (glob(dirname(__DIR__, 2) . '/migrations/*.php') as $f) {
            copy($f, $dir . '/' . basename($f));
        }
        file_put_contents($dir . '/0001_init.php', file_get_contents($dir . '/0001_init.php') . "\n// módosítva\n");
        $m = new Migrator($GLOBALS['T_DB'], $dir);
        $threw = false;
        try {
            $m->migrate();
        } catch (RuntimeException) {
            $threw = true;
        }
        ok($threw, 'a megváltozott lefutott migráció hibát ad');
        copy(dirname(__DIR__, 2) . '/migrations/0001_init.php', $dir . '/0001_init.php');
        file_put_contents($dir . '/9999_drop.php', "<?php\nreturn ['DROP TABLE plans'];\n");
        $threw = false;
        try {
            (new Migrator($GLOBALS['T_DB'], $dir))->migrate();
        } catch (RuntimeException $e) {
            $threw = str_contains($e->getMessage(), 'Romboló');
        }
        ok($threw, 'DROP TABLE kapcsoló nélkül nem fut');
        ok((int) $GLOBALS['T_DB']->val('SELECT COUNT(*) FROM plans') === 3, 'a plans tábla érintetlen');
        array_map('unlink', glob("$dir/*"));
        rmdir($dir);
    },
    'csomagok: árak TERVEZET állapotban, a FREE nem ad felhős funkciót' => function () {
        $p = $GLOBALS['T_DB']->one("SELECT * FROM plans WHERE code = 'pro'");
        eq($p['pricing_status'], 'DRAFT', 'PRO ár: DRAFT');
        eq((int) $p['price_huf_month'], 4990, 'PRO havi tervezet');
        eq((int) $p['price_huf_year'], 49900, 'PRO éves tervezet');
        eq($GLOBALS['T_DB']->val("SELECT features FROM plans WHERE code = 'free'"), '', 'FREE: nincs felhős jogosultság');
    },
];
