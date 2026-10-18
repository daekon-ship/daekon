<?php
// Mester+ Cloud – parancssor (csak CLI; a webszerverről 404).
//   php bin/cli.php migrate [--status] [--allow-destructive]
//   php bin/cli.php maint            (időzítő: karbantartás + Site Health állapotfájl)
//   php bin/cli.php status-file      (csak az állapotfájl)
//   php bin/cli.php stats            (tulajdonosi összesítő, JSON, személyes adat nélkül)
//   php bin/cli.php grant --email E --plan pro|team --days N   (kézi / béta jogosultság)
//   php bin/cli.php rewrap-keys      (mesterkulcs-csere után a mentési kulcsok újraburkolása)
//   php bin/cli.php health
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
use MesterPlus\Maintenance;
use MesterPlus\Migrator;

$args = array_slice($argv, 1);
$cmd = $args[0] ?? 'help';
$opt = static function (string $name) use ($args): ?string {
    $i = array_search("--$name", $args, true);
    return $i === false ? null : ($args[$i + 1] ?? '');
};
$flag = static fn (string $name): bool => in_array("--$name", $args, true);
$out = static function (mixed $data): void {
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), "\n";
};

$app = new App(Config::load());
try {
    switch ($cmd) {
        case 'migrate':
            $m = new Migrator($app->db(), dirname(__DIR__) . '/migrations');
            $out($flag('status') ? $m->status() : ['applied' => $m->migrate($flag('allow-destructive')), 'status' => $m->status()]);
            break;
        case 'maint':
            $mt = new Maintenance($app);
            $res = $mt->run();
            $writeStatus = true;
            // no break
        case 'status-file':
            $mt ??= new Maintenance($app);
            $st = $mt->status();
            $dir = $app->config()->str('MP_LOG_DIR');
            if ($dir !== '' && is_dir($dir)) {
                $f = rtrim($dir, '/') . '/app-status.json';
                file_put_contents($f . '.tmp', json_encode($st, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
                rename($f . '.tmp', $f);
            }
            $out(['maint' => $res ?? null, 'status' => $st]);
            break;
        case 'stats':
            $out((new Maintenance($app))->stats());
            break;
        case 'grant':
            $email = strtolower((string) $opt('email'));
            $plan = (string) ($opt('plan') ?? 'pro');
            $days = (int) ($opt('days') ?? 0);
            if (!in_array($plan, ['pro', 'team'], true) || $days < 1 || $days > 3650) {
                throw new RuntimeException('Használat: grant --email E --plan pro|team --days N');
            }
            $ws = $app->db()->val("SELECT m.workspace_id FROM accounts a JOIN workspace_members m ON m.account_id = a.id AND m.role = 'owner' WHERE a.email = ? AND a.status = 'ACTIVE'", [$email]);
            if ($ws === null) {
                throw new RuntimeException('Nincs ilyen aktív fiók.');
            }
            $out(['subscription_id' => $app->billing()->grantManual((int) $ws, $plan, $days), 'until' => gmdate('Y-m-d', Clock::now() + $days * 86400)]);
            break;
        case 'rewrap-keys':
            $cur = $app->kekVersion();
            $n = 0;
            foreach ($app->db()->all('SELECT k.*, w.public_id FROM backup_keys k JOIN workspaces w ON w.id = k.workspace_id WHERE k.kek_version <> ?', [$cur]) as $k) {
                $bk = $app->backups()->unwrap((string) $k['wrapped_key'], $k['public_id'], (int) $k['key_version'], (int) $k['kek_version']);
                $app->db()->run('UPDATE backup_keys SET wrapped_key = ?, kek_version = ? WHERE workspace_id = ? AND key_version = ?',
                    [$app->backups()->wrap($bk, $k['public_id'], (int) $k['key_version'], $cur), $cur, $k['workspace_id'], $k['key_version']]);
                $n++;
            }
            $out(['rewrapped' => $n, 'kek_version' => $cur]);
            break;
        case 'health':
            $app->db()->val('SELECT 1');
            $out(['db' => 'ok', 'storage' => is_writable($app->storageDir()) ? 'ok' : 'fail', 'release' => $app->release()]);
            break;
        default:
            fwrite(STDERR, "parancsok: migrate | maint | status-file | stats | grant | rewrap-keys | health\n");
            exit(2);
    }
} catch (Throwable $e) {
    fwrite(STDERR, 'HIBA: ' . $e->getMessage() . "\n");
    exit(1);
}
