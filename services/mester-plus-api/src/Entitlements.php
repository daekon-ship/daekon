<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/**
 * A jogosultság EGYETLEN forrása (central entitlement resolver). A kliens soha nem dönti el, mi jár:
 * a szerveres Pro-funkciók minden kérésnél itt ellenőriznek. A csomag-logika (mi tartozik a Pro-hoz)
 * a plans táblában van, nem a kódban szétszórva.
 */
final class Entitlements
{
    public const FEATURES = ['cloud_backup', 'cloud_restore', 'online_quotes', 'multiple_devices', 'invoice_integration', 'team'];

    /** Lejárt előfizetés után ennyi napig még visszaállítható a meglévő mentés (letöltés), új nem tölthető fel. */
    public const RESTORE_AFTER_EXPIRY_DAYS = 30;

    /** @var array<int,array<string,mixed>> kérésen belüli gyorstár */
    private array $cache = [];

    public function __construct(private App $app)
    {
    }

    /** @return array<string,mixed> az aktív előfizetés + csomag (vagy FREE) */
    public function resolve(int $wsId): array
    {
        if (isset($this->cache[$wsId])) {
            return $this->cache[$wsId];
        }
        $db = $this->app->db();
        $sub = $db->one("SELECT * FROM subscriptions WHERE workspace_id = ? AND status IN ('TRIAL','ACTIVE','GRACE')
                         ORDER BY FIELD(status,'ACTIVE','GRACE','TRIAL'), updated_at DESC LIMIT 1", [$wsId]);
        $now = Clock::now();
        if ($sub !== null && $sub['current_period_end'] !== null && (Clock::ts($sub['current_period_end']) ?? 0) < $now
            && ($sub['grace_until'] === null || (Clock::ts($sub['grace_until']) ?? 0) < $now)) {
            $sub = null; // lejárt, csak a karbantartó még nem állította át
        }
        $plan = $db->one('SELECT * FROM plans WHERE code = ?', [$sub['plan_code'] ?? 'free']);
        $features = array_values(array_filter(explode(',', (string) $plan['features'])));
        foreach ($db->all('SELECT feature, valid_until FROM entitlements WHERE workspace_id = ?', [$wsId]) as $g) {
            if ($g['valid_until'] === null || (Clock::ts($g['valid_until']) ?? 0) > $now) {
                $features[] = $g['feature'];
            }
        }
        if (!in_array('cloud_restore', $features, true)) {
            $lastEnd = $db->val("SELECT MAX(COALESCE(grace_until, current_period_end, updated_at)) FROM subscriptions WHERE workspace_id = ? AND status IN ('EXPIRED','CANCELLED','PAST_DUE')", [$wsId]);
            if ($lastEnd !== null && (Clock::ts((string) $lastEnd) ?? 0) > $now - self::RESTORE_AFTER_EXPIRY_DAYS * 86400) {
                $features[] = 'cloud_restore';
            }
        }
        $features = array_values(array_unique(array_intersect($features, self::FEATURES)));
        sort($features);
        return $this->cache[$wsId] = ['sub' => $sub, 'plan' => $plan, 'features' => $features];
    }

    public function can(int $wsId, string $feature): bool
    {
        return in_array($feature, $this->resolve($wsId)['features'], true);
    }

    /** @throws ApiError 403 PRO_REQUIRED */
    public function require(Request $req, string ...$anyOf): void
    {
        foreach ($anyOf as $f) {
            if ($this->can($req->auth['workspace_id'], $f)) {
                return;
            }
        }
        throw new ApiError(403, 'PRO_REQUIRED', 'Ehhez a funkcióhoz Mester+ Pro szükséges.', ['feature' => $anyOf[0]]);
    }

    public function maxDevices(int $wsId): int
    {
        $r = $this->resolve($wsId);
        $n = (int) $r['plan']['max_devices'];
        return in_array('multiple_devices', $r['features'], true) ? max(2, $n) : max(1, $n);
    }

    /** @return array{quota:int,max_versions:int,retention_days:int} */
    public function backupPolicy(int $wsId): array
    {
        $r = $this->resolve($wsId);
        $p = $r['plan'];
        if ((int) $p['backup_quota_bytes'] === 0 && in_array('cloud_backup', $r['features'], true)) {
            $p = $this->app->db()->one("SELECT * FROM plans WHERE code = 'pro'"); // kézi (béta) jogosultság: a Pro mentési szabálya
        }
        return ['quota' => (int) $p['backup_quota_bytes'], 'max_versions' => (int) $p['backup_max_versions'], 'retention_days' => (int) $p['backup_retention_days']];
    }

    /** Az app ezt gyorsítótárazza: offline is látszik, mi jár, de csak cache_until-ig (utána újra kell kérdezni). @return array<string,mixed> */
    public function view(int $wsId): array
    {
        $r = $this->resolve($wsId);
        $s = $r['sub'];
        $graceDays = $this->app->config()->int('MP_ENTITLEMENT_CACHE_DAYS', 7);
        return [
            'plan' => ['code' => $r['plan']['code'], 'name' => $r['plan']['name']],
            'subscription' => $s === null ? null : [
                'status' => $s['status'], 'provider' => $s['provider'], 'current_period_end' => Clock::iso($s['current_period_end']),
                'grace_until' => Clock::iso($s['grace_until']), 'auto_renewing' => (bool) $s['auto_renewing'],
            ],
            'entitlements' => $r['features'],
            'backup_policy' => $this->backupPolicy($wsId),
            'server_time' => gmdate('Y-m-d\TH:i:s\Z', Clock::now()),
            'cache_until' => gmdate('Y-m-d\TH:i:s\Z', Clock::now() + $graceDays * 86400),
        ];
    }

    /** @return list<array<string,mixed>> nyilvános árlista – a tervezet-árak jelölve, nem „éles” ár */
    public function plans(): array
    {
        return array_map(fn ($p) => [
            'code' => $p['code'], 'name' => $p['name'], 'pricing_status' => $p['pricing_status'],
            'price_huf_month' => $p['price_huf_month'] === null ? null : (int) $p['price_huf_month'],
            'price_huf_year' => $p['price_huf_year'] === null ? null : (int) $p['price_huf_year'],
            'trial_days' => (int) $p['trial_days'], 'features' => array_values(array_filter(explode(',', (string) $p['features']))),
            'backup_quota_bytes' => (int) $p['backup_quota_bytes'], 'max_devices' => (int) $p['max_devices'],
        ], $this->app->db()->all("SELECT * FROM plans ORDER BY FIELD(code,'free','pro','team')"));
    }

    public function flush(): void
    {
        $this->cache = [];
    }
}
