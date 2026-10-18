<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/**
 * Időzített karbantartás (systemd timer, 15 percenként, a webhely felhasználójaként) és megőrzés.
 * Megőrzés (docs/OPERATIONS.md): lejárt munkamenet 30 nap után törlődik; idempotencia-kulcs 24 ó; rate-limit
 * ablak 2 nap; e-mail token 7 nap; ajánlat-IP-kivonat 30 nap; metrika 90 nap; audit 400 nap; mentés a csomag szerint.
 */
final class Maintenance
{
    public function __construct(private App $app)
    {
    }

    /** @return array<string,int|string> */
    public function run(): array
    {
        $db = $this->app->db();
        $now = Clock::now();
        $r = [];
        $r['sessions_purged'] = $db->run('DELETE FROM sessions WHERE (revoked_at IS NOT NULL AND revoked_at < ?) OR refresh_expires_at < ?', [Clock::sql($now - 30 * 86400), Clock::sql($now - 30 * 86400)])->rowCount();
        $r['refresh_tokens_purged'] = $db->run('DELETE FROM refresh_tokens WHERE expires_at < ? OR (used_at IS NOT NULL AND used_at < ?)', [Clock::sql($now), Clock::sql($now - 30 * 86400)])->rowCount();
        $r['idempotency_purged'] = $db->run('DELETE FROM idempotency_keys WHERE expires_at < ?', [Clock::sql($now)])->rowCount();
        $r['rate_limit_purged'] = $db->run('DELETE FROM rate_limit_state WHERE window_start < ?', [$now - 2 * 86400])->rowCount();
        $r['email_tokens_purged'] = $db->run('DELETE FROM email_tokens WHERE expires_at < ?', [Clock::sql($now - 7 * 86400)])->rowCount();
        $r['metrics_purged'] = $db->run('DELETE FROM metrics_hourly WHERE hour < ?', [intdiv($now, 3600) - 90 * 24])->rowCount();
        $r['audit_purged'] = $db->run('DELETE FROM audit_logs WHERE created_at < ?', [Clock::sql($now - 400 * 86400)])->rowCount();
        $q = $this->app->quotes()->maintain();
        $r['quotes_expired'] = $q['expired'];
        $r['quote_ip_cleared'] = $q['ip_hash_cleared'];
        $r['subscriptions_expired'] = $this->app->billing()->maintain();
        $r['stale_uploads'] = $this->app->backups()->cleanupStale();
        $removed = 0;
        foreach ($db->all("SELECT DISTINCT workspace_id FROM cloud_backups WHERE status = 'READY'") as $w) {
            $removed += $this->app->backups()->retention((int) $w['workspace_id']);
        }
        $r['backups_retention_removed'] = $removed;
        foreach ($db->all("SELECT id FROM accounts WHERE status = 'DELETION_PENDING'") as $a) {
            $this->app->accounts()->purge((int) $a['id']);
        }
        $this->app->mailer()->flush();
        return $r;
    }

    /**
     * Állapotfájl a DAEKON Site Health számára (személyes adat nélkül): az API-specifikus incidensek
     * (BACKUP FAILURE SPIKE, AUTH FAILURE SPIKE, BILLING WEBHOOK FAILURE, STORAGE, DB) innen jönnek.
     * @return array<string,mixed>
     */
    public function status(): array
    {
        $problems = [];
        $m = [];
        try {
            $hour = intdiv(Clock::now(), 3600);
            foreach ($this->app->db()->all('SELECT name, SUM(value) AS v FROM metrics_hourly WHERE hour >= ? GROUP BY name', [$hour - 1]) as $row) {
                $m[$row['name']] = (int) $row['v'];
            }
            $ok = $m['backup_upload_ok'] ?? 0;
            $bad = $m['backup_upload_fail'] ?? 0;
            if ($bad >= 5 && $bad > $ok) {
                $problems[] = ['tipus' => 'MP_BACKUP_FAILURE_SPIKE', 'sulyossag' => 'magas', 'bizonyitek' => "$bad sikertelen / $ok sikeres felhőmentés az elmúlt 2 órában"];
            }
            if (($m['auth_fail'] ?? 0) >= 200) {
                $problems[] = ['tipus' => 'MP_AUTH_FAILURE_SPIKE', 'sulyossag' => 'kozepes', 'bizonyitek' => ($m['auth_fail']) . ' sikertelen hitelesítés az elmúlt 2 órában'];
            }
            if (($m['billing_webhook_fail'] ?? 0) >= 3) {
                $problems[] = ['tipus' => 'MP_BILLING_WEBHOOK_FAILURE', 'sulyossag' => 'magas', 'bizonyitek' => ($m['billing_webhook_fail']) . ' hibás billing-esemény az elmúlt 2 órában'];
            }
            if (($m['storage_error'] ?? 0) >= 3) {
                $problems[] = ['tipus' => 'MP_STORAGE_DOWN', 'sulyossag' => 'kritikus', 'bizonyitek' => ($m['storage_error']) . ' tárhely-hiba az elmúlt 2 órában'];
            }
            if (($m['http_5xx'] ?? 0) >= 20) {
                $problems[] = ['tipus' => 'MP_API_ERRORS', 'sulyossag' => 'magas', 'bizonyitek' => ($m['http_5xx']) . ' szerverhiba (5xx) az elmúlt 2 órában'];
            }
            $failedWh = (int) $this->app->db()->val("SELECT COUNT(*) FROM webhook_events WHERE status = 'FAILED' AND received_at > ?", [Clock::sql(Clock::now() - 86400)]);
            if ($failedWh > 0 && !array_filter($problems, fn ($p) => $p['tipus'] === 'MP_BILLING_WEBHOOK_FAILURE')) {
                $problems[] = ['tipus' => 'MP_BILLING_WEBHOOK_FAILURE', 'sulyossag' => 'kozepes', 'bizonyitek' => "$failedWh feldolgozatlan billing-esemény (24 óra)"];
            }
        } catch (\Throwable) {
            $problems[] = ['tipus' => 'MP_DB_DOWN', 'sulyossag' => 'kritikus', 'bizonyitek' => 'az adatbázis nem érhető el a karbantartó feladatból'];
        }
        $d = $this->app->storageDir();
        if (!is_dir($d) || !is_writable($d)) {
            $problems[] = ['tipus' => 'MP_STORAGE_DOWN', 'sulyossag' => 'kritikus', 'bizonyitek' => 'a mentés-tároló nem írható'];
        }
        return ['szolgaltatas' => 'mester-plus-api', 'ellenorizve' => gmdate('Y-m-d\TH:i:s\Z', Clock::now()), 'metrikak_2ora' => $m, 'problemak' => $problems];
    }

    /** Tulajdonosi összesítő (MESTER+ CLOUD ADMIN). Személyes adat nélkül (nincs e-mail, név). @return array<string,mixed> */
    public function stats(): array
    {
        $db = $this->app->db();
        $c = fn (string $sql, array $p = []) => (int) $db->val($sql, $p);
        $hasLive = $c("SELECT COUNT(*) FROM subscriptions WHERE provider = 'google_play'") > 0;
        return [
            'generalva' => gmdate('Y-m-d\TH:i:s\Z', Clock::now()),
            'fiokok' => [
                'osszes' => $c("SELECT COUNT(*) FROM accounts WHERE status <> 'DELETED'"),
                'aktiv' => $c("SELECT COUNT(*) FROM accounts WHERE status = 'ACTIVE'"),
                'megerositett_email' => $c("SELECT COUNT(*) FROM accounts WHERE status = 'ACTIVE' AND email_verified_at IS NOT NULL"),
                'felfuggesztett' => $c("SELECT COUNT(*) FROM accounts WHERE status = 'SUSPENDED'"),
                'torolt' => $c("SELECT COUNT(*) FROM accounts WHERE status = 'DELETED'"),
                'uj_30_nap' => $c('SELECT COUNT(*) FROM accounts WHERE created_at > ?', [Clock::sql(Clock::now() - 30 * 86400)]),
            ],
            'elofizetesek' => [
                'aktiv_pro' => $c("SELECT COUNT(DISTINCT workspace_id) FROM subscriptions WHERE plan_code = 'pro' AND status IN ('ACTIVE','GRACE')"),
                'aktiv_team' => $c("SELECT COUNT(DISTINCT workspace_id) FROM subscriptions WHERE plan_code = 'team' AND status IN ('ACTIVE','GRACE')"),
                'trial' => $c("SELECT COUNT(*) FROM subscriptions WHERE status = 'TRIAL'"),
                'lejart' => $c("SELECT COUNT(*) FROM subscriptions WHERE status = 'EXPIRED'"),
                'lemondott' => $c("SELECT COUNT(*) FROM subscriptions WHERE status = 'CANCELLED'"),
                'fizetesi_gond' => $c("SELECT COUNT(*) FROM subscriptions WHERE status = 'PAST_DUE'"),
                'kezi_beta' => $c("SELECT COUNT(*) FROM subscriptions WHERE provider = 'manual' AND status IN ('ACTIVE','TRIAL')"),
                'bevetel' => $hasLive ? 'Számítás a Play-adatokból (Play Console a hiteles forrás).' : 'Nincs még éles számlázási adat.',
            ],
            'eszkozok' => ['aktiv' => $c('SELECT COUNT(*) FROM devices WHERE revoked_at IS NULL'), 'visszavont' => $c('SELECT COUNT(*) FROM devices WHERE revoked_at IS NOT NULL')],
            'felhomentes' => [
                'mentesek' => $c("SELECT COUNT(*) FROM cloud_backups WHERE status = 'READY'"),
                'tarhely_bajt' => $c("SELECT COALESCE(SUM(size_bytes),0) FROM cloud_backups WHERE status = 'READY'"),
                'hibas_24_ora' => $c("SELECT COUNT(*) FROM cloud_backups WHERE status = 'FAILED' AND created_at > ?", [Clock::sql(Clock::now() - 86400)]),
            ],
            'online_ajanlatok' => [
                'osszes' => $c('SELECT COUNT(*) FROM quote_shares'),
                'elerheto' => $c("SELECT COUNT(*) FROM quote_shares WHERE status = 'ACTIVE'"),
                'elfogadott' => $c("SELECT COUNT(*) FROM quote_shares WHERE status = 'ACCEPTED'"),
                'elutasitott' => $c("SELECT COUNT(*) FROM quote_shares WHERE status = 'DECLINED'"),
                'lejart' => $c("SELECT COUNT(*) FROM quote_shares WHERE status = 'EXPIRED'"),
            ],
            'billing_esemenyek' => [
                'hibas' => $c("SELECT COUNT(*) FROM webhook_events WHERE status = 'FAILED'"),
                'feldolgozott' => $c("SELECT COUNT(*) FROM webhook_events WHERE status = 'PROCESSED'"),
            ],
            'levelsor' => ['varakozik' => $c("SELECT COUNT(*) FROM mail_outbox WHERE status = 'QUEUED'"), 'kezbesito' => $this->app->mailer()->driver()],
            'allapot' => $this->status(),
        ];
    }
}
