<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/**
 * Rate limit (végpontonként külön keret, nem egy globális), idempotencia, audit, metrika.
 * Minden állapot a saját adatbázisban – nincs külső függőség.
 */
final class Guard
{
    /** Keretek: [kérés / ablak, ablak mp]. A kulcs a végpont-csoport. */
    public const LIMITS = [
        'login_ip' => [20, 900],
        'login_email' => [10, 900],
        'register_ip' => [5, 3600],
        'reset_ip' => [5, 3600],
        'reset_email' => [3, 3600],
        'verify_resend' => [3, 3600],
        'refresh_ip' => [60, 900],
        'backup_upload' => [20, 3600],
        'backup_download' => [30, 3600],
        'backup_key' => [30, 3600],
        'quote_create' => [60, 3600],
        'public_quote_view' => [120, 600],
        'public_quote_invalid' => [30, 600],
        'quote_decision' => [20, 3600],
        'billing_verify' => [20, 3600],
        'billing_webhook' => [600, 60],
        'account_delete' => [5, 3600],
        'export' => [10, 3600],
        'api_account' => [600, 600],
        'email_page' => [30, 600],
    ];

    public function __construct(private App $app)
    {
    }

    /** @throws ApiError 429 */
    public function limit(string $group, string $subject): void
    {
        [$max, $win] = self::LIMITS[$group];
        $now = Clock::now();
        $w = intdiv($now, $win) * $win;
        $bucket = $group . ':' . substr(hash_hmac('sha256', $subject, $this->app->pepper()), 0, 40);
        $db = $this->app->db();
        $db->run('INSERT INTO rate_limit_state (bucket, window_start, hits) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE hits = hits + 1', [$bucket, $w]);
        $hits = (int) $db->val('SELECT hits FROM rate_limit_state WHERE bucket = ? AND window_start = ?', [$bucket, $w]);
        if ($hits > $max) {
            $this->metric('rate_limited');
            throw new ApiError(429, 'RATE_LIMITED', 'Túl sok próbálkozás. Próbáld újra később.', ['retry_after' => $w + $win - $now]);
        }
    }

    public function metric(string $name, int $n = 1): void
    {
        try {
            $this->app->db()->run(
                'INSERT INTO metrics_hourly (hour, name, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = value + VALUES(value)',
                [intdiv(Clock::now(), 3600), $name, $n],
            );
        } catch (\Throwable) {
            // a metrika soha nem dönthet el kérést (pl. DB-leállásnál)
        }
    }

    /** @param array<string,scalar|null> $meta */
    public function audit(string $event, ?Request $req, ?int $accountId = null, ?int $workspaceId = null, ?string $target = null, array $meta = []): void
    {
        $accountId ??= $req?->auth['account_id'] ?? null;
        $workspaceId ??= $req?->auth['workspace_id'] ?? null;
        $m = $meta === [] ? null : mb_substr((string) json_encode(Log::clean($meta), JSON_UNESCAPED_UNICODE), 0, 500);
        $this->app->db()->insert('audit_logs', [
            'created_at' => Clock::sql(),
            'event' => $event,
            'account_id' => $accountId,
            'workspace_id' => $workspaceId,
            'target' => $target,
            'ip_hash' => $req ? Util::ipHash($req->ip, $this->app->pepper()) : null,
            'request_id' => $req?->requestId,
            'meta' => $m,
        ]);
    }

    /**
     * Idempotens írás: azonos Idempotency-Key + azonos kérés → az első válasz ismétlése (új rekord nélkül);
     * azonos kulcs, más tartalom → 409. Mobilhálózati újrapróbálás így nem duplikál.
     * @param callable():Response $handler
     */
    public function idempotent(Request $req, string $scope, callable $handler): Response
    {
        $key = $req->header('idempotency-key');
        if (!preg_match('/^[A-Za-z0-9_-]{16,100}$/', $key)) {
            throw new ApiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Hiányzó vagy hibás Idempotency-Key fejléc.');
        }
        $db = $this->app->db();
        $hash = hash('sha256', $req->method . ' ' . $req->path . "\n" . $req->rawBody(2097152));
        $now = Clock::now();
        try {
            $db->insert('idempotency_keys', [
                'scope' => $scope, 'idem_key' => $key, 'route' => $req->routeName, 'request_hash' => $hash,
                'status' => 'PENDING', 'created_at' => Clock::sql($now), 'expires_at' => Clock::sql($now + 86400),
            ]);
        } catch (\PDOException $e) {
            if (($e->errorInfo[1] ?? 0) !== 1062) {
                throw $e;
            }
            $row = $db->one('SELECT * FROM idempotency_keys WHERE scope = ? AND route = ? AND idem_key = ?', [$scope, $req->routeName, $key]);
            if ($row === null) {
                throw new ApiError(409, 'IDEMPOTENCY_IN_PROGRESS', 'A kérés feldolgozása folyamatban. Próbáld újra kicsit később.');
            }
            if (!hash_equals($row['request_hash'], $hash)) {
                throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Ez az azonosító már egy másik kéréshez tartozik.');
            }
            if ($row['status'] === 'DONE') {
                $r = new Response((int) $row['response_status'], (string) $row['response_body'], ['Content-Type' => 'application/json; charset=utf-8', 'Idempotent-Replayed' => 'true']);
                return $r;
            }
            if ((Clock::ts($row['created_at']) ?? 0) > $now - 60) {
                throw new ApiError(409, 'IDEMPOTENCY_IN_PROGRESS', 'A kérés feldolgozása folyamatban. Próbáld újra kicsit később.');
            }
            // elakadt (pl. megszakadt) feldolgozás: átvesszük
            $db->run('UPDATE idempotency_keys SET created_at = ? WHERE id = ?', [Clock::sql($now), $row['id']]);
        }
        try {
            $resp = $handler();
        } catch (ApiError $e) {
            $resp = Response::error($e, $req->requestId);
        } catch (\Throwable $e) {
            $db->run('DELETE FROM idempotency_keys WHERE scope = ? AND route = ? AND idem_key = ?', [$scope, $req->routeName, $key]);
            throw $e;
        }
        // 5xx / 429 / 409: nem rögzítjük, a kliens újrapróbálhatja ugyanazzal a kulccsal.
        if ($resp->status >= 500 || $resp->status === 429 || $resp->status === 409 || $resp->stream !== null) {
            $db->run('DELETE FROM idempotency_keys WHERE scope = ? AND route = ? AND idem_key = ?', [$scope, $req->routeName, $key]);
        } else {
            $db->run(
                'UPDATE idempotency_keys SET status = ?, response_status = ?, response_body = ? WHERE scope = ? AND route = ? AND idem_key = ?',
                ['DONE', $resp->status, $resp->body, $scope, $req->routeName, $key],
            );
        }
        return $resp;
    }
}
