<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/**
 * Mester+ Cloud API – alkalmazás-konténer és útválasztó.
 * API: /api/v1/… (JSON, UTF-8, egységes hibaséma: {"error":{"code","message","request_id"}}).
 * Publikus oldalak: /a/{token} (online ajánlat), /v/{token} (e-mail megerősítés), /r/{token} (új jelszó).
 */
final class App
{
    private ?Db $db = null;
    private array $svc = [];

    public function __construct(private Config $config, ?Db $db = null)
    {
        $this->db = $db;
    }

    public function config(): Config
    {
        return $this->config;
    }

    public function db(): Db
    {
        return $this->db ??= Db::connect($this->config);
    }

    public function pepper(): string
    {
        return $this->svc['pepper'] ??= $this->config->secret('MP_TOKEN_PEPPER');
    }

    public function kekVersion(): int
    {
        return $this->config->int('MP_KEK_CURRENT', 1);
    }

    public function kek(int $version): string
    {
        $k = $this->config->secret('MP_KEK_' . $version);
        if (strlen($k) !== SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_KEYBYTES) {
            throw new \RuntimeException('A mesterkulcs mérete hibás.');
        }
        return $k;
    }

    public function storageDir(): string
    {
        return rtrim($this->config->str('MP_STORAGE_DIR', '/nonexistent'), '/');
    }

    /** Publikus alapcím: 'api' (e-mail linkek) vagy 'quote' (online ajánlat). */
    public function publicBase(string $kind): string
    {
        $v = $kind === 'quote' ? $this->config->str('MP_PUBLIC_QUOTE_BASE') : $this->config->str('MP_PUBLIC_API_BASE');
        return rtrim($v !== '' ? $v : 'https://api.mesterplus.daekon.hu', '/');
    }

    /** Időzítés-kiegyenlítéshez: nem létező fióknál is lefut egy Argon2id-ellenőrzés. */
    public function dummyHash(): string
    {
        return $this->svc['dummy'] ??= password_hash(random_bytes(16), PASSWORD_ARGON2ID, ['memory_cost' => 65536, 'time_cost' => 3, 'threads' => 1]);
    }

    public function guard(): Guard { return $this->svc['guard'] ??= new Guard($this); }
    public function auth(): Auth { return $this->svc['auth'] ??= new Auth($this); }
    public function accounts(): Accounts { return $this->svc['accounts'] ??= new Accounts($this); }
    public function entitlements(): Entitlements { return $this->svc['ent'] ??= new Entitlements($this); }
    public function backups(): Backups { return $this->svc['backups'] ??= new Backups($this); }
    public function quotes(): Quotes { return $this->svc['quotes'] ??= new Quotes($this); }
    public function billing(): Billing { return $this->svc['billing'] ??= new Billing($this); }
    public function mailer(): Mailer { return $this->svc['mailer'] ??= new Mailer($this); }
    public function pages(): Pages { return $this->svc['pages'] ??= new Pages($this); }

    /** @return list<array{0:string,1:string,2:string,3:callable}> [metódus, minta, név, kezelő] */
    private function routes(): array
    {
        $j = fn (Request $r) => $r->json();
        $auth = function (Request $r): void { $this->auth()->authenticate($r); };
        return [
            ['GET', '#^/$#', 'home', fn (Request $r) => $this->pages()->serviceHome()],
            ['GET', '#^/api/v1/health$#', 'health', fn (Request $r) => $this->health($r)],
            ['GET', '#^/api/v1/plans$#', 'plans', fn (Request $r) => Response::json(['plans' => $this->entitlements()->plans()])],

            ['POST', '#^/api/v1/auth/register$#', 'auth.register', fn (Request $r) => Response::json($this->auth()->register($r, $j($r)), 201)],
            ['POST', '#^/api/v1/auth/login$#', 'auth.login', fn (Request $r) => Response::json($this->auth()->login($r, $j($r)))],
            ['POST', '#^/api/v1/auth/refresh$#', 'auth.refresh', fn (Request $r) => Response::json($this->auth()->refresh($r, $j($r)))],
            ['POST', '#^/api/v1/auth/logout$#', 'auth.logout', function (Request $r) use ($auth) { $auth($r); $this->auth()->logout($r, false); return Response::json(['ok' => true]); }],
            ['POST', '#^/api/v1/auth/logout-all$#', 'auth.logout_all', function (Request $r) use ($auth) { $auth($r); $this->auth()->logout($r, true); return Response::json(['ok' => true]); }],
            ['POST', '#^/api/v1/auth/password/forgot$#', 'auth.forgot', function (Request $r) use ($j) { $this->auth()->forgot($r, $j($r)); return Response::json(['ok' => true, 'message' => 'Ha van ilyen fiók, elküldtük a jelszó-visszaállító linket.'], 202); }],
            ['POST', '#^/api/v1/auth/email/resend$#', 'auth.resend', function (Request $r) use ($auth) { $auth($r); $this->auth()->resendVerification($r); return Response::json(['ok' => true], 202); }],

            ['GET', '#^/api/v1/me$#', 'me', function (Request $r) use ($auth) { $auth($r); return Response::json($this->accounts()->me($r)); }],
            ['GET', '#^/api/v1/devices$#', 'devices.list', function (Request $r) use ($auth) { $auth($r); return Response::json(['devices' => $this->accounts()->devices($r)]); }],
            ['DELETE', '#^/api/v1/devices/(?<id>[0-9a-z]{26})$#', 'devices.revoke', function (Request $r) use ($auth) { $auth($r); $this->accounts()->revokeDevice($r, $r->params['id']); return Response::json(['ok' => true]); }],
            ['GET', '#^/api/v1/account/export$#', 'account.export', function (Request $r) use ($auth) { $auth($r); return Response::json($this->accounts()->export($r)); }],
            ['POST', '#^/api/v1/account/delete$#', 'account.delete', function (Request $r) use ($auth, $j) { $auth($r); $this->accounts()->delete($r, $j($r)['password'] ?? null); return Response::json(['ok' => true]); }],
            ['GET', '#^/api/v1/subscription$#', 'subscription', function (Request $r) use ($auth) { $auth($r); return Response::json($this->entitlements()->view($r->auth['workspace_id']) + ['billing' => ['google_play' => $this->billing()->googlePlayConfigured(), 'sandbox' => $this->billing()->sandboxEnabled()]]); }],
            ['POST', '#^/api/v1/subscription/trial$#', 'subscription.trial', function (Request $r) use ($auth) { $auth($r); return $this->guard()->idempotent($r, 'acc:' . $r->auth['account_id'], fn () => Response::json($this->billing()->startTrial($r))); }],

            ['GET', '#^/api/v1/backups/key$#', 'backups.key', function (Request $r) use ($auth) {
                $auth($r);
                $v = $r->query['version'] ?? null;
                return Response::json($this->backups()->key($r, $v === null ? null : (preg_match('/^\d{1,6}$/', $v) ? (int) $v : -1)));
            }],
            ['POST', '#^/api/v1/backups$#', 'backups.init', function (Request $r) use ($auth, $j) { $auth($r); return $this->guard()->idempotent($r, 'acc:' . $r->auth['account_id'], fn () => Response::json($this->backups()->init($r, $j($r)), 201)); }],
            ['PUT', '#^/api/v1/backups/(?<id>[0-9a-z]{26})/content$#', 'backups.upload', function (Request $r) use ($auth) { $auth($r); return Response::json($this->backups()->upload($r, $r->params['id'])); }],
            ['GET', '#^/api/v1/backups$#', 'backups.list', function (Request $r) use ($auth) { $auth($r); return Response::json($this->backups()->list($r)); }],
            ['GET', '#^/api/v1/backups/(?<id>[0-9a-z]{26})/content$#', 'backups.download', function (Request $r) use ($auth) { $auth($r); return $this->backups()->download($r, $r->params['id']); }],
            ['DELETE', '#^/api/v1/backups/(?<id>[0-9a-z]{26})$#', 'backups.delete', function (Request $r) use ($auth) { $auth($r); $this->backups()->delete($r, $r->params['id']); return Response::json(['ok' => true]); }],

            ['POST', '#^/api/v1/quotes$#', 'quotes.create', function (Request $r) use ($auth, $j) { $auth($r); return $this->guard()->idempotent($r, 'acc:' . $r->auth['account_id'], fn () => Response::json($this->quotes()->create($r, $j($r)), 201)); }],
            ['GET', '#^/api/v1/quotes$#', 'quotes.list', function (Request $r) use ($auth) {
                $auth($r);
                $qn = $r->query['quote_number'] ?? null;
                return Response::json(['quotes' => $this->quotes()->list($r, is_string($qn) && preg_match('/^[A-Za-z0-9\/_.-]{1,40}$/', $qn) ? $qn : null)]);
            }],
            ['GET', '#^/api/v1/quotes/(?<id>[0-9a-z]{26})$#', 'quotes.get', function (Request $r) use ($auth) { $auth($r); return Response::json($this->quotes()->get($r, $r->params['id'])); }],
            ['POST', '#^/api/v1/quotes/(?<id>[0-9a-z]{26})/revoke$#', 'quotes.revoke', function (Request $r) use ($auth) { $auth($r); return Response::json($this->quotes()->revoke($r, $r->params['id'])); }],

            ['POST', '#^/api/v1/billing/google-play/verify$#', 'billing.gplay', function (Request $r) use ($auth, $j) { $auth($r); return $this->guard()->idempotent($r, 'acc:' . $r->auth['account_id'], fn () => Response::json($this->billing()->verifyGooglePlay($r, $j($r)))); }],
            ['POST', '#^/api/v1/billing/sandbox/verify$#', 'billing.sandbox', function (Request $r) use ($auth, $j) { $auth($r); return $this->guard()->idempotent($r, 'acc:' . $r->auth['account_id'], fn () => Response::json($this->billing()->verifySandbox($r, $j($r)))); }],
            ['POST', '#^/api/v1/billing/webhook/(?<p>sandbox|google-play)$#', 'billing.webhook', fn (Request $r) => $this->billing()->webhook($r, $r->params['p'])],

            // Publikus ajánlat
            ['GET', '#^/a/(?<t>[A-Za-z0-9_-]{1,64})$#', 'quote.page', fn (Request $r) => $this->quotePage($r, 'view')],
            ['GET', '#^/a/(?<t>[A-Za-z0-9_-]{1,64})/elfogadom$#', 'quote.confirm_accept', fn (Request $r) => $this->quotePage($r, 'confirm-accept')],
            ['GET', '#^/a/(?<t>[A-Za-z0-9_-]{1,64})/nem-kerem$#', 'quote.confirm_decline', fn (Request $r) => $this->quotePage($r, 'confirm-decline')],
            ['POST', '#^/a/(?<t>[A-Za-z0-9_-]{1,64})/elfogadom$#', 'quote.accept', fn (Request $r) => $this->quoteDecide($r, 'accept')],
            ['POST', '#^/a/(?<t>[A-Za-z0-9_-]{1,64})/nem-kerem$#', 'quote.decline', fn (Request $r) => $this->quoteDecide($r, 'decline')],
            // E-mail megerősítés / új jelszó (webes)
            ['GET', '#^/v/(?<t>[A-Za-z0-9_-]{1,64})$#', 'email.verify_page', fn (Request $r) => $this->emailPage($r, 'verify', false)],
            ['POST', '#^/v/(?<t>[A-Za-z0-9_-]{1,64})$#', 'email.verify', fn (Request $r) => $this->emailPage($r, 'verify', true)],
            ['GET', '#^/r/(?<t>[A-Za-z0-9_-]{1,64})$#', 'password.reset_page', fn (Request $r) => $this->emailPage($r, 'reset', false)],
            ['POST', '#^/r/(?<t>[A-Za-z0-9_-]{1,64})$#', 'password.reset', fn (Request $r) => $this->emailPage($r, 'reset', true)],
        ];
    }

    public function handle(Request $req): Response
    {
        $resp = null;
        try {
            // Productionben minden adatforgalom HTTPS. Kivétel csak a titok nélküli kezdőoldal és a health: a DNS / tanúsítvány
            // beállta előtt a Hosting Factory élesítési QA-ja és a Site Health HTTP-n méri ezeket (utána az nginx 301-gyel HTTPS-re terel).
            if ($this->config->isProduction() && !$req->https && !($req->method === 'GET' && in_array($req->path, ['/', '/api/v1/health'], true))) {
                throw new ApiError(403, 'HTTPS_REQUIRED', 'Csak titkosított (HTTPS) kapcsolaton érhető el.');
            }
            $matched = false;
            foreach ($this->routes() as [$method, $pattern, $name, $handler]) {
                if (!preg_match($pattern, $req->path, $m)) {
                    continue;
                }
                $matched = true;
                if ($method !== $req->method && !($method === 'GET' && $req->method === 'HEAD')) {
                    continue;
                }
                $req->routeName = $name;
                foreach ($m as $k => $v) {
                    if (is_string($k)) {
                        $req->params[$k] = $v;
                    }
                }
                $resp = $handler($req);
                break;
            }
            if ($resp === null) {
                throw $matched
                    ? new ApiError(405, 'METHOD_NOT_ALLOWED', 'Nem támogatott művelet.')
                    : new ApiError(404, 'NOT_FOUND', 'Nincs ilyen végpont.');
            }
        } catch (ApiError $e) {
            $resp = $this->isPage($req) && $e->status !== 429 && $e->status < 500
                ? $this->pages()->message('Hiba', $e->getMessage(), $e->status)
                : Response::error($e, $req->requestId);
            if ($e->status === 429 && isset($e->extra['retry_after'])) {
                $resp->headers['Retry-After'] = (string) $e->extra['retry_after'];
            }
        } catch (\Throwable $e) {
            // Belső részlet (stack trace, SQL) SOHA nem megy ki – csak a naplóba, a kérés-azonosítóval.
            $dbDown = $e instanceof \PDOException;
            $this->guard()->metric($dbDown ? 'db_error' : 'error_5xx');
            Log::write('error', 'unhandled', ['request_id' => $req->requestId, 'route' => $req->routeName, 'type' => get_class($e),
                'where' => basename($e->getFile()) . ':' . $e->getLine(), 'detail' => mb_substr($e->getMessage(), 0, 200)]);
            $err = $dbDown
                ? new ApiError(503, 'SERVICE_UNAVAILABLE', 'A szolgáltatás átmenetileg nem érhető el. Próbáld újra később.')
                : new ApiError(500, 'INTERNAL_ERROR', 'Váratlan hiba történt. Próbáld újra később.');
            $resp = $this->isPage($req) ? $this->pages()->message('Átmeneti hiba', $err->getMessage(), $err->status) : Response::error($err, $req->requestId);
        }
        $this->finish($req, $resp);
        if ($req->method === 'HEAD') {
            $resp->body = ''; // HEAD = GET törzs nélkül (monitorozó eszközök)
            if ($resp->stream !== null) {
                fclose($resp->stream);
                $resp->stream = null;
            }
        }
        return $resp;
    }

    private function isPage(Request $req): bool
    {
        return (bool) preg_match('#^/(a|v|r)/#', $req->path) || $req->path === '/';
    }

    private function finish(Request $req, Response $resp): void
    {
        $resp->headers['X-Request-ID'] = $req->requestId;
        if ($req->correlationId !== null) {
            $resp->headers['X-Correlation-ID'] = $req->correlationId;
        }
        $resp->headers += [
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'no-store',
        ];
        if (str_starts_with($resp->headers['Content-Type'] ?? '', 'application/json')) {
            $resp->headers += ['Content-Security-Policy' => "default-src 'none'; frame-ancestors 'none'", 'Referrer-Policy' => 'no-referrer'];
        }
        if ($req->https) {
            $resp->headers += ['Strict-Transport-Security' => 'max-age=31536000'];
        }
        if ($resp->status >= 500) {
            $this->guard()->metric('http_5xx');
        }
        Log::write($resp->status >= 500 ? 'error' : 'info', 'request', [
            'request_id' => $req->requestId, 'correlation_id' => $req->correlationId, 'method' => $req->method, 'route' => $req->routeName,
            'status' => $resp->status, 'duration_ms' => (int) round((microtime(true) - $req->started) * 1000),
            'account_id' => $req->auth['account_id'] ?? null, 'workspace_id' => $req->auth['workspace_id'] ?? null,
        ]);
    }

    // ── health ───────────────────────────────────────────────────────────────

    /** Titok és belső részlet nélkül: app, adatbázis, tárhely. */
    private function health(Request $req): Response
    {
        $checks = ['app' => 'ok', 'database' => 'ok', 'storage' => 'ok'];
        try {
            $this->db()->val('SELECT 1');
            if ((int) $this->db()->val('SELECT COUNT(*) FROM plans') < 1) {
                $checks['database'] = 'fail';
            }
        } catch (\Throwable) {
            $checks['database'] = 'fail';
        }
        $d = $this->storageDir();
        if (!is_dir($d) || !is_writable($d)) {
            $checks['storage'] = 'fail';
        }
        $ok = !in_array('fail', $checks, true);
        return Response::json(['status' => $ok ? 'ok' : 'fail', 'checks' => $checks, 'version' => $this->release(), 'time' => gmdate('Y-m-d\TH:i:s\Z', Clock::now())], $ok ? 200 : 503);
    }

    public function release(): string
    {
        $f = dirname(__DIR__) . '/RELEASE';
        return is_file($f) ? trim((string) file_get_contents($f, false, null, 0, 200)) : 'dev';
    }

    // ── publikus oldalak ─────────────────────────────────────────────────────

    private function quotePage(Request $req, string $mode): Response
    {
        $this->guard()->limit('public_quote_view', $req->ip);
        $tok = $req->params['t'];
        $row = $this->quotes()->byToken($req, $tok);
        if ($row === null) {
            return $this->pages()->message('Az ajánlat nem található', 'A link hibás vagy már nem érvényes. Kérj új linket a vállalkozótól.', 404);
        }
        if ($row['status'] === 'REVOKED') {
            return $this->pages()->message('Az ajánlat nem érhető el', 'Ezt az ajánlatot a vállalkozó visszavonta vagy újabb változatot küldött.', 410);
        }
        if ($mode === 'view') {
            $this->quotes()->recordOpen($req, $row);
        }
        return $this->pages()->quote($req, $row, $tok, $mode);
    }

    private function quoteDecide(Request $req, string $decision): Response
    {
        $this->guard()->limit('quote_decision', $req->ip);
        $tok = $req->params['t'];
        $row = $this->quotes()->byToken($req, $tok);
        if ($row === null || $row['status'] === 'REVOKED') {
            return $this->pages()->message('Az ajánlat nem található', 'A link hibás vagy már nem érvényes.', 404);
        }
        $form = $req->form();
        if (!$this->pages()->csrfOk($req, $form) || !hash_equals($row['snapshot_hash'], $form['hash'] ?? '') || ($decision === 'accept' && ($form['ok'] ?? '') !== '1')) {
            return $this->pages()->message('A művelet nem sikerült', 'Az oldal lejárt vagy hiányzik a megerősítés. Nyisd meg újra az ajánlatot, és próbáld újra.', 400);
        }
        $this->quotes()->decide($req, $row, $decision);
        $row = $this->db()->one('SELECT * FROM quote_shares WHERE id = ?', [$row['id']]);
        return $this->pages()->quote($req, $row, $tok, 'view');
    }

    private function emailPage(Request $req, string $purpose, bool $post): Response
    {
        $this->guard()->limit('email_page', $req->ip);
        $tok = $req->params['t'];
        $pages = $this->pages();
        if (!$post) {
            if ($this->auth()->peekEmailToken($tok, $purpose) === null) {
                return $pages->message('A link nem érvényes', 'A link lejárt vagy már felhasználták. Kérj újat a Mester+ appban.', 410);
            }
            return $purpose === 'verify' ? $pages->verifyForm($req, $tok) : $pages->resetForm($req, $tok);
        }
        $form = $req->form();
        if (!$pages->csrfOk($req, $form)) {
            return $pages->message('A művelet nem sikerült', 'Az oldal lejárt. Nyisd meg újra a linket.', 400);
        }
        if ($purpose === 'verify') {
            return $this->auth()->verifyEmail($req, $tok)
                ? $pages->message('E-mail cím megerősítve', 'Köszönjük! Visszatérhetsz a Mester+ appba.')
                : $pages->message('A link nem érvényes', 'A link lejárt vagy már felhasználták.', 410);
        }
        if (($form['password'] ?? '') !== ($form['password2'] ?? '')) {
            return $pages->resetForm($req, $tok, 'A két jelszó nem egyezik.');
        }
        try {
            $this->auth()->resetPassword($req, $tok, $form['password'] ?? '');
        } catch (ApiError $e) {
            return $e->errorCode === 'WEAK_PASSWORD' ? $pages->resetForm($req, $tok, $e->getMessage()) : $pages->message('A link nem érvényes', $e->getMessage(), 410);
        }
        return $pages->message('Új jelszó beállítva', 'Most már bejelentkezhetsz az új jelszóval a Mester+ appban.');
    }
}
