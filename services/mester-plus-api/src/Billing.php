<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/**
 * Előfizetés-alap. A SZERVER a jogosultság forrása; a kliens csak vásárlási tokent ad át ellenőrzésre.
 *
 * Szolgáltatók:
 *  - google_play: éles Play Billing. Hitelesítő adat (szolgáltatásfiók) és Play Console termék nélkül
 *                 KIKAPCSOLVA marad (503 BILLING_NOT_CONFIGURED) – kitalált credential nincs. Ld. SUBSCRIPTIONS.md.
 *  - sandbox:     csak nem-production környezetben (MP_BILLING_SANDBOX=1): a teljes életciklus tesztelhető.
 *  - manual:      tulajdonosi / béta jogosultság a CLI-ből (bin/cli.php grant).
 *
 * Előfizetés-állapot (külön a fiók-állapottól): TRIAL · ACTIVE · GRACE · PAST_DUE · CANCELLED · EXPIRED.
 * Hozzáférést ad: TRIAL, ACTIVE, GRACE (a PAST_DUE = Play „account hold”: nincs hozzáférés).
 */
final class Billing
{
    public function __construct(private App $app)
    {
    }

    public function sandboxEnabled(): bool
    {
        return $this->app->config()->bool('MP_BILLING_SANDBOX') && !$this->app->config()->isProduction();
    }

    public function googlePlayConfigured(): bool
    {
        $c = $this->app->config();
        return $c->has('MP_GOOGLE_PLAY_PACKAGE') && $c->has('MP_GOOGLE_PLAY_SERVICE_ACCOUNT_FILE') && is_readable($c->str('MP_GOOGLE_PLAY_SERVICE_ACCOUNT_FILE'));
    }

    /** @param array<string,mixed> $in @return array<string,mixed> */
    public function verifyGooglePlay(Request $req, array $in): array
    {
        $this->app->guard()->limit('billing_verify', 'acc:' . $req->auth['account_id']);
        if (!$this->googlePlayConfigured()) {
            throw new ApiError(503, 'BILLING_NOT_CONFIGURED', 'Az előfizetés hamarosan elérhető. Addig minden helyi funkció ingyenes.');
        }
        // Éles ellenőrzés: Google Play Developer API purchases.subscriptionsv2.get (szolgáltatásfiók-JWT → OAuth token).
        // A tulajdonosi beállítás (OWNER ACTION) után kerül élesítésre; addig ez az ág nem érhető el.
        throw new ApiError(503, 'BILLING_NOT_CONFIGURED', 'Az előfizetés hamarosan elérhető.');
    }

    /** Sandbox-vásárlás: token = "sandbox:<product_id>:<ok|pending|invalid>:<véletlen>". @param array<string,mixed> $in @return array<string,mixed> */
    public function verifySandbox(Request $req, array $in): array
    {
        if (!$this->sandboxEnabled()) {
            throw new ApiError(404, 'NOT_FOUND', 'Nincs ilyen végpont.');
        }
        $this->app->guard()->limit('billing_verify', 'acc:' . $req->auth['account_id']);
        $tok = is_string($in['purchase_token'] ?? null) ? $in['purchase_token'] : '';
        if (!preg_match('/^sandbox:([a-z0-9_.]{3,100}):(ok|pending|invalid):[A-Za-z0-9_-]{8,64}$/', $tok, $m)) {
            throw new ApiError(422, 'INVALID_PURCHASE', 'Érvénytelen vásárlás.');
        }
        [$product, $scenario] = [$m[1], $m[2]];
        if ($scenario === 'invalid') {
            throw new ApiError(422, 'INVALID_PURCHASE', 'Érvénytelen vásárlás.');
        }
        if ($scenario === 'pending') {
            throw new ApiError(402, 'PURCHASE_PENDING', 'A fizetés még függőben van.');
        }
        $plan = $this->planForProduct($product);
        $days = str_contains($product, 'year') ? 365 : 30;
        $sub = $this->upsertFromProvider($req->auth['workspace_id'], 'sandbox', $tok, $product, $plan, 'PURCHASED', Clock::now() + $days * 86400, null);
        $this->app->guard()->audit('SUBSCRIPTION_CHANGED', $req, null, null, null, ['provider' => 'sandbox', 'status' => $sub['status']]);
        $this->app->entitlements()->flush();
        return $this->app->entitlements()->view($req->auth['workspace_id']);
    }

    /** Próbaidőszak (a hossza a plans táblában; tulajdonosi kapcsoló: MP_TRIAL_ENABLED). @return array<string,mixed> */
    public function startTrial(Request $req): array
    {
        $ws = $req->auth['workspace_id'];
        $plan = $this->app->db()->one("SELECT * FROM plans WHERE code = 'pro'");
        if (!$this->app->config()->bool('MP_TRIAL_ENABLED') || (int) $plan['trial_days'] <= 0) {
            throw new ApiError(403, 'TRIAL_UNAVAILABLE', 'A próbaidőszak most nem érhető el.');
        }
        if ($this->app->db()->val('SELECT 1 FROM subscription_events WHERE workspace_id = ? AND type = ? LIMIT 1', [$ws, 'TRIAL_STARTED']) !== null) {
            throw new ApiError(409, 'TRIAL_USED', 'A próbaidőszakot ez a fiók már felhasználta.');
        }
        $now = Clock::now();
        $id = $this->app->db()->insert('subscriptions', [
            'workspace_id' => $ws, 'plan_code' => 'pro', 'status' => 'TRIAL', 'provider' => 'manual', 'started_at' => Clock::sql($now),
            'current_period_end' => Clock::sql($now + (int) $plan['trial_days'] * 86400), 'created_at' => Clock::sql($now), 'updated_at' => Clock::sql($now),
        ]);
        $this->event($id, $ws, 'TRIAL_STARTED', null, 'TRIAL', 'manual', null);
        $this->app->guard()->audit('ENTITLEMENT_CHANGED', $req, null, null, null, ['trial' => true]);
        $this->app->entitlements()->flush();
        return $this->app->entitlements()->view($ws);
    }

    /** Tulajdonosi / béta jogosultság (CLI). */
    public function grantManual(int $ws, string $planCode, int $days): int
    {
        $now = Clock::now();
        $db = $this->app->db();
        $db->run("UPDATE subscriptions SET status = 'CANCELLED', cancelled_at = ?, updated_at = ? WHERE workspace_id = ? AND provider = 'manual' AND status IN ('TRIAL','ACTIVE')", [Clock::sql($now), Clock::sql($now), $ws]);
        $id = $db->insert('subscriptions', [
            'workspace_id' => $ws, 'plan_code' => $planCode, 'status' => 'ACTIVE', 'provider' => 'manual', 'started_at' => Clock::sql($now),
            'current_period_end' => Clock::sql($now + $days * 86400), 'created_at' => Clock::sql($now), 'updated_at' => Clock::sql($now),
        ]);
        $this->event($id, $ws, 'MANUAL_GRANT', null, 'ACTIVE', 'manual', null);
        $this->app->guard()->audit('ENTITLEMENT_CHANGED', null, null, $ws, null, ['plan' => $planCode, 'days' => $days, 'source' => 'manual']);
        return $id;
    }

    private function planForProduct(string $product): string
    {
        foreach ($this->app->db()->all('SELECT code, play_product_ids FROM plans') as $p) {
            if (in_array($product, array_filter(explode(',', (string) $p['play_product_ids'])), true)) {
                return $p['code'];
            }
        }
        throw new ApiError(422, 'UNKNOWN_PRODUCT', 'Ismeretlen előfizetési termék.');
    }

    /**
     * Szolgáltatói esemény alkalmazása az állapotgépen.
     * @return array<string,mixed> a frissített előfizetés
     */
    public function upsertFromProvider(int $ws, string $provider, string $purchaseToken, string $product, string $plan, string $type, ?int $periodEnd, ?int $graceUntil): array
    {
        $db = $this->app->db();
        $ref = Util::tokenHash($purchaseToken, $this->app->pepper());
        return $db->tx(function () use ($db, $ws, $provider, $ref, $product, $plan, $type, $periodEnd, $graceUntil) {
            $sub = $db->one('SELECT * FROM subscriptions WHERE provider = ? AND provider_ref_hash = ? FOR UPDATE', [$provider, $ref]);
            $now = Clock::now();
            if ($sub === null) {
                $id = $db->insert('subscriptions', [
                    'workspace_id' => $ws, 'plan_code' => $plan, 'status' => 'ACTIVE', 'provider' => $provider, 'provider_ref_hash' => $ref,
                    'product_id' => $product, 'started_at' => Clock::sql($now), 'current_period_end' => Clock::sql($periodEnd ?? $now),
                    'auto_renewing' => 1, 'created_at' => Clock::sql($now), 'updated_at' => Clock::sql($now),
                ]);
                $this->event($id, $ws, $type, null, 'ACTIVE', $provider, null);
                return $db->one('SELECT * FROM subscriptions WHERE id = ?', [$id]);
            }
            if ((int) $sub['workspace_id'] !== $ws) {
                throw new ApiError(409, 'PURCHASE_IN_USE', 'Ez a vásárlás egy másik Mester+ fiókhoz tartozik.');
            }
            return $this->apply($sub, $type, $periodEnd, $graceUntil, null);
        });
    }

    /** @param array<string,mixed> $sub @return array<string,mixed> */
    public function apply(array $sub, string $type, ?int $periodEnd, ?int $graceUntil, ?string $eventId): array
    {
        $db = $this->app->db();
        $now = Clock::now();
        $from = $sub['status'];
        $set = ['updated_at' => Clock::sql($now)];
        switch ($type) {
            case 'PURCHASED':
            case 'RENEWED':
            case 'RECOVERED':
                $set += ['status' => 'ACTIVE', 'grace_until' => null, 'auto_renewing' => 1, 'cancelled_at' => null];
                if ($periodEnd !== null) {
                    $set['current_period_end'] = Clock::sql($periodEnd);
                }
                break;
            case 'IN_GRACE_PERIOD':
                $set += ['status' => 'GRACE', 'grace_until' => Clock::sql($graceUntil ?? $now + 7 * 86400)];
                break;
            case 'ON_HOLD':
                $set += ['status' => 'PAST_DUE'];
                break;
            case 'CANCELED': // a felhasználó lemondta: a kifizetett időszak végéig marad a hozzáférés
                $set += ['auto_renewing' => 0, 'cancelled_at' => Clock::sql($now)];
                break;
            case 'REVOKED': // visszatérítés / visszavonás: azonnal megszűnik
                $set += ['status' => 'EXPIRED', 'auto_renewing' => 0, 'current_period_end' => Clock::sql($now)];
                break;
            case 'EXPIRED':
                $set += ['status' => $sub['cancelled_at'] !== null ? 'CANCELLED' : 'EXPIRED', 'auto_renewing' => 0];
                break;
            default:
                throw new ApiError(422, 'UNKNOWN_EVENT', 'Ismeretlen esemény.');
        }
        $cols = [];
        $vals = [];
        foreach ($set as $k => $v) {
            $cols[] = "`$k` = ?";
            $vals[] = $v;
        }
        $vals[] = $sub['id'];
        $db->run('UPDATE subscriptions SET ' . implode(', ', $cols) . ' WHERE id = ?', $vals);
        $to = $set['status'] ?? $from;
        $this->event((int) $sub['id'], (int) $sub['workspace_id'], $type, $from, $to, $sub['provider'], $eventId);
        if ($from !== $to) {
            $this->app->guard()->audit('SUBSCRIPTION_CHANGED', null, null, (int) $sub['workspace_id'], null, ['from' => $from, 'to' => $to, 'event' => $type]);
        }
        $this->app->entitlements()->flush();
        return $db->one('SELECT * FROM subscriptions WHERE id = ?', [$sub['id']]);
    }

    private function event(int $subId, int $ws, string $type, ?string $from, ?string $to, string $provider, ?string $eventId): void
    {
        $this->app->db()->insert('subscription_events', [
            'subscription_id' => $subId, 'workspace_id' => $ws, 'type' => $type, 'from_status' => $from, 'to_status' => $to,
            'provider' => $provider, 'provider_event_id' => $eventId, 'created_at' => Clock::sql(),
        ]);
    }

    /**
     * Webhook: aláírás-ellenőrzött (HMAC-SHA256, időbélyeggel), újrajátszás ellen védett (±5 perc + egyedi
     * esemény-azonosító), idempotens (ismételt kézbesítés nem duplikál), újrapróbálható (hibás feldolgozás
     * FAILED-ként rögzül, a szolgáltató újraküldése újra feldolgozza), auditált.
     */
    public function webhook(Request $req, string $provider): Response
    {
        $g = $this->app->guard();
        $g->limit('billing_webhook', $req->ip);
        if ($provider === 'google-play') {
            // RTDN (Pub/Sub push, OIDC-token): a Play-beállítás után élesíthető – addig nem fogadunk el eseményt.
            throw new ApiError(503, 'BILLING_NOT_CONFIGURED', 'Nincs beállítva.');
        }
        if ($provider !== 'sandbox' || !$this->sandboxEnabled() || !$this->app->config()->has('MP_WEBHOOK_SANDBOX_SECRET')) {
            throw new ApiError(404, 'NOT_FOUND', 'Nincs ilyen végpont.');
        }
        $body = $req->rawBody(65536);
        $ts = $req->header('x-mp-timestamp');
        $sig = $req->header('x-mp-signature');
        $secret = $this->app->config()->secret('MP_WEBHOOK_SANDBOX_SECRET');
        if (!preg_match('/^\d{10}$/', $ts) || !preg_match('/^[0-9a-f]{64}$/', $sig)
            || !hash_equals(hash_hmac('sha256', $ts . '.' . $body, $secret), $sig)) {
            $g->metric('billing_webhook_fail');
            $g->audit('WEBHOOK_REJECTED', $req, null, null, $provider, ['reason' => 'signature']);
            throw new ApiError(401, 'INVALID_SIGNATURE', 'Érvénytelen aláírás.');
        }
        if (abs(Clock::now() - (int) $ts) > 300) {
            $g->metric('billing_webhook_fail');
            $g->audit('WEBHOOK_REJECTED', $req, null, null, $provider, ['reason' => 'stale']);
            throw new ApiError(401, 'STALE_EVENT', 'Lejárt esemény.');
        }
        try {
            $ev = json_decode($body, true, 8, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new ApiError(400, 'INVALID_JSON', 'Hibás esemény.');
        }
        $eid = is_string($ev['event_id'] ?? null) ? $ev['event_id'] : '';
        $type = is_string($ev['type'] ?? null) ? $ev['type'] : '';
        if (!preg_match('/^[A-Za-z0-9_.:-]{8,120}$/', $eid) || !preg_match('/^[A-Z_]{3,40}$/', $type)) {
            throw new ApiError(422, 'INVALID_EVENT', 'Hibás esemény.');
        }
        $db = $this->app->db();
        $hash = hash('sha256', $body);
        $existing = $db->one('SELECT * FROM webhook_events WHERE provider = ? AND event_id = ?', [$provider, $eid]);
        if ($existing !== null) {
            if (!hash_equals($existing['payload_hash'], $hash)) {
                $g->audit('WEBHOOK_REJECTED', $req, null, null, $provider, ['reason' => 'replay_mismatch']);
                throw new ApiError(409, 'EVENT_CONFLICT', 'Ütköző esemény.');
            }
            if (in_array($existing['status'], ['PROCESSED', 'IGNORED'], true)) {
                return Response::json(['status' => 'duplicate']);
            }
            $db->run('UPDATE webhook_events SET attempts = attempts + 1 WHERE id = ?', [$existing['id']]);
            $whId = (int) $existing['id'];
        } else {
            $whId = $db->insert('webhook_events', [
                'provider' => $provider, 'event_id' => $eid, 'event_type' => $type, 'payload_hash' => $hash, 'status' => 'RECEIVED', 'received_at' => Clock::sql(),
            ]);
        }
        try {
            $tok = is_string($ev['purchase_token'] ?? null) ? $ev['purchase_token'] : '';
            $sub = $db->one('SELECT * FROM subscriptions WHERE provider = ? AND provider_ref_hash = ?', [$provider, Util::tokenHash($tok, $this->app->pepper())]);
            if ($sub === null) {
                $db->run("UPDATE webhook_events SET status = 'IGNORED', processed_at = ?, error = ? WHERE id = ?", [Clock::sql(), 'unknown_subscription', $whId]);
                return Response::json(['status' => 'ignored']);
            }
            $pe = is_int($ev['period_end'] ?? null) ? $ev['period_end'] : null;
            $gu = is_int($ev['grace_until'] ?? null) ? $ev['grace_until'] : null;
            $db->tx(fn () => $this->apply($sub, $type, $pe, $gu, $eid));
            $db->run("UPDATE webhook_events SET status = 'PROCESSED', processed_at = ?, error = NULL WHERE id = ?", [Clock::sql(), $whId]);
            $g->audit('WEBHOOK_PROCESSED', $req, null, (int) $sub['workspace_id'], $provider, ['type' => $type]);
            return Response::json(['status' => 'processed']);
        } catch (ApiError $e) {
            $db->run("UPDATE webhook_events SET status = 'FAILED', error = ? WHERE id = ?", [$e->errorCode, $whId]);
            $g->metric('billing_webhook_fail');
            throw $e;
        } catch (\Throwable $e) {
            $db->run("UPDATE webhook_events SET status = 'FAILED', error = ? WHERE id = ?", ['internal', $whId]);
            $g->metric('billing_webhook_fail');
            throw $e;
        }
    }

    /** Karbantartás: lejárt időszakok átállítása (türelmi idő után EXPIRED / CANCELLED). */
    public function maintain(): int
    {
        $db = $this->app->db();
        $n = 0;
        foreach ($db->all("SELECT * FROM subscriptions WHERE status IN ('TRIAL','ACTIVE','GRACE','PAST_DUE') AND current_period_end < ?", [Clock::sql()]) as $s) {
            if ($s['status'] === 'GRACE' && $s['grace_until'] !== null && (Clock::ts($s['grace_until']) ?? 0) > Clock::now()) {
                continue;
            }
            if ($s['provider'] === 'google_play' && $s['status'] === 'ACTIVE' && (int) $s['auto_renewing'] === 1
                && (Clock::ts($s['current_period_end']) ?? 0) > Clock::now() - 3 * 86400) {
                continue; // megújítás-értesítés még úton lehet (3 nap tűrés)
            }
            $this->apply($s, 'EXPIRED', null, null, null);
            $n++;
        }
        return $n;
    }
}
