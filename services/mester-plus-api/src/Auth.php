<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/**
 * Fiók és munkamenet.
 *  - Jelszó: Argon2id (password_hash), soha nem tárolódik nyíltan.
 *  - Access token: 15 perc; refresh token: 60 nap, minden frissítéskor ÚJ (rotáció). Egy már felhasznált
 *    refresh token ismételt bemutatása lopásra utal → az egész munkamenet visszavonva.
 *  - Mindkét token csak HMAC-kivonatként van a DB-ben (borssal), eszközhöz kötve.
 */
final class Auth
{
    public const ACCESS_TTL = 900;
    public const REFRESH_TTL = 5184000; // 60 nap
    public const LOCK_AFTER = 10;
    public const LOCK_SECONDS = 900;

    public function __construct(private App $app)
    {
    }

    // ── Bevitel-ellenőrzés ──────────────────────────────────────────────────

    public static function email(mixed $v): string
    {
        $e = is_string($v) ? strtolower(trim($v)) : '';
        if ($e === '' || strlen($e) > 254 || !filter_var($e, FILTER_VALIDATE_EMAIL) || preg_match('/[\s<>"]/', $e)) {
            throw new ApiError(422, 'INVALID_EMAIL', 'Érvénytelen e-mail cím.');
        }
        return $e;
    }

    public static function password(mixed $v): string
    {
        if (!is_string($v) || mb_strlen($v) < 10) {
            throw new ApiError(422, 'WEAK_PASSWORD', 'A jelszó legalább 10 karakter legyen.');
        }
        if (strlen($v) > 200) {
            throw new ApiError(422, 'WEAK_PASSWORD', 'A jelszó legfeljebb 200 karakter lehet.');
        }
        $low = mb_strtolower($v);
        foreach (['1234567890', 'jelszo1234', 'password12', 'qwertzuiop', 'mesterplus', '0000000000', 'abcdefghij'] as $bad) {
            if (str_contains($low, $bad)) {
                throw new ApiError(422, 'WEAK_PASSWORD', 'Ez a jelszó túl könnyen kitalálható.');
            }
        }
        if (count(array_unique(mb_str_split($v))) < 5) {
            throw new ApiError(422, 'WEAK_PASSWORD', 'Ez a jelszó túl könnyen kitalálható.');
        }
        return $v;
    }

    /** @return array{uuid:string,platform:string,app_version:string,name:string} */
    public static function device(mixed $d): array
    {
        if (!is_array($d)) {
            throw new ApiError(422, 'INVALID_DEVICE', 'Hiányzó eszközadat.');
        }
        $uuid = is_string($d['uuid'] ?? null) ? strtolower($d['uuid']) : '';
        if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $uuid)) {
            throw new ApiError(422, 'INVALID_DEVICE', 'Hibás eszközazonosító.');
        }
        $platform = in_array($d['platform'] ?? '', ['android', 'ios', 'windows', 'macos', 'linux', 'test'], true) ? $d['platform'] : 'unknown';
        $ver = Util::cleanText($d['app_version'] ?? '', 32) ?? '';
        if (!preg_match('/^\d{1,3}\.\d{1,3}\.\d{1,3}([+-][0-9A-Za-z.]{1,16})?$/', $ver)) {
            $ver = '0.0.0';
        }
        $name = Util::cleanText($d['name'] ?? '', 80) ?? '';
        return ['uuid' => $uuid, 'platform' => $platform, 'app_version' => $ver, 'name' => $name === '' ? 'Telefon' : $name];
    }

    // ── Regisztráció / belépés ──────────────────────────────────────────────

    /** @param array<string,mixed> $in @return array<string,mixed> */
    public function register(Request $req, array $in): array
    {
        $g = $this->app->guard();
        $g->limit('register_ip', $req->ip);
        $email = self::email($in['email'] ?? null);
        $pw = self::password($in['password'] ?? null);
        $dev = self::device($in['device'] ?? null);
        $wsName = Util::cleanText($in['workspace_name'] ?? '', 120) ?? '';
        $db = $this->app->db();
        $hash = password_hash($pw, PASSWORD_ARGON2ID, ['memory_cost' => 65536, 'time_cost' => 3, 'threads' => 1]);
        $now = Clock::sql();
        try {
            $ids = $db->tx(function () use ($db, $email, $hash, $now, $wsName) {
                $acc = $db->insert('accounts', [
                    'public_id' => Util::publicId(), 'email' => $email, 'email_hash' => hash_hmac('sha256', $email, $this->app->pepper(), true),
                    'password_hash' => $hash, 'status' => 'ACTIVE', 'role' => 'user', 'created_at' => $now, 'updated_at' => $now,
                ]);
                $ws = $db->insert('workspaces', [
                    'public_id' => Util::publicId(), 'name' => $wsName === '' ? 'Saját vállalkozás' : $wsName,
                    'owner_account_id' => $acc, 'created_at' => $now,
                ]);
                $db->insert('workspace_members', ['workspace_id' => $ws, 'account_id' => $acc, 'role' => 'owner', 'created_at' => $now]);
                return [$acc, $ws];
            });
        } catch (\PDOException $e) {
            if (($e->errorInfo[1] ?? 0) === 1062) {
                throw new ApiError(409, 'EMAIL_TAKEN', 'Ezzel az e-mail címmel már van Mester+ fiók. Jelentkezz be.');
            }
            throw $e;
        }
        [$accId, $wsId] = $ids;
        $g->audit('ACCOUNT_REGISTERED', $req, $accId, $wsId);
        $this->sendVerification($accId, $email);
        $tokens = $this->openSession($req, $accId, $wsId, $dev);
        return ['account' => $this->app->accounts()->summary($accId)] + $tokens;
    }

    /** @param array<string,mixed> $in @return array<string,mixed> */
    public function login(Request $req, array $in): array
    {
        $g = $this->app->guard();
        $g->limit('login_ip', $req->ip);
        $email = is_string($in['email'] ?? null) ? strtolower(trim($in['email'])) : '';
        $pw = is_string($in['password'] ?? null) ? $in['password'] : '';
        if ($email === '' || $pw === '' || strlen($pw) > 200 || strlen($email) > 254) {
            throw new ApiError(422, 'INVALID_CREDENTIALS', 'Hibás e-mail cím vagy jelszó.');
        }
        $g->limit('login_email', $email);
        $dev = self::device($in['device'] ?? null);
        $db = $this->app->db();
        $acc = $db->one('SELECT * FROM accounts WHERE email = ?', [$email]);
        // Nem létező fióknál is ugyanannyi munka (időzítés alapján ne derüljön ki, létezik-e a cím).
        $ok = password_verify($pw, $acc['password_hash'] ?? $this->app->dummyHash());
        if ($acc !== null && $acc['locked_until'] !== null && (Clock::ts($acc['locked_until']) ?? 0) > Clock::now()) {
            $g->metric('auth_fail');
            $g->audit('LOGIN_LOCKED', $req, (int) $acc['id']);
            throw new ApiError(429, 'ACCOUNT_LOCKED', 'Túl sok hibás próbálkozás. Próbáld újra 15 perc múlva.');
        }
        if ($acc === null || !$ok) {
            $g->metric('auth_fail');
            if ($acc !== null) {
                $fails = (int) $acc['failed_logins'] + 1;
                $lock = $fails >= self::LOCK_AFTER ? Clock::sql(Clock::now() + self::LOCK_SECONDS) : null;
                $db->run('UPDATE accounts SET failed_logins = ?, locked_until = ? WHERE id = ?', [$lock ? 0 : $fails, $lock, $acc['id']]);
                $g->audit('LOGIN_FAILED', $req, (int) $acc['id'], null, null, ['locked' => $lock !== null]);
            }
            throw new ApiError(401, 'INVALID_CREDENTIALS', 'Hibás e-mail cím vagy jelszó.');
        }
        if ($acc['status'] !== 'ACTIVE') {
            throw new ApiError(403, 'ACCOUNT_INACTIVE', 'Ez a fiók nem aktív. Írj a támogatásnak.');
        }
        if (password_needs_rehash($acc['password_hash'], PASSWORD_ARGON2ID, ['memory_cost' => 65536, 'time_cost' => 3, 'threads' => 1])) {
            $db->run('UPDATE accounts SET password_hash = ? WHERE id = ?', [password_hash($pw, PASSWORD_ARGON2ID, ['memory_cost' => 65536, 'time_cost' => 3, 'threads' => 1]), $acc['id']]);
        }
        $wsId = (int) $db->val('SELECT workspace_id FROM workspace_members WHERE account_id = ? ORDER BY created_at LIMIT 1', [$acc['id']]);
        $db->run('UPDATE accounts SET failed_logins = 0, locked_until = NULL, last_login_at = ?, updated_at = ? WHERE id = ?', [Clock::sql(), Clock::sql(), $acc['id']]);
        $tokens = $this->openSession($req, (int) $acc['id'], $wsId, $dev);
        $g->audit('LOGIN', $req, (int) $acc['id'], $wsId);
        return ['account' => $this->app->accounts()->summary((int) $acc['id'])] + $tokens;
    }

    /**
     * Eszköz regisztrálása / frissítése, az eszköz korábbi munkamenetének lezárása, új munkamenet.
     * @param array{uuid:string,platform:string,app_version:string,name:string} $dev
     * @return array<string,mixed>
     */
    private function openSession(Request $req, int $accId, int $wsId, array $dev): array
    {
        $db = $this->app->db();
        $g = $this->app->guard();
        $now = Clock::now();
        return $db->tx(function () use ($db, $g, $req, $accId, $wsId, $dev, $now) {
            $row = $db->one('SELECT id, revoked_at FROM devices WHERE account_id = ? AND device_uuid = ? FOR UPDATE', [$accId, $dev['uuid']]);
            if ($row === null) {
                $limit = $this->app->entitlements()->maxDevices($wsId);
                $active = (int) $db->val('SELECT COUNT(*) FROM devices WHERE account_id = ? AND revoked_at IS NULL', [$accId]);
                if ($active >= $limit) {
                    throw new ApiError(403, 'DEVICE_LIMIT', $limit <= 1
                        ? 'Ez a fiók egy eszközön használható. Jelentkezz ki a másik eszközön (Beállítások → Eszközeim), vagy válts Mester+ Pro-ra.'
                        : "Elérted az eszközkorlátot ($limit). Vonj vissza egy eszközt a Beállítások → Eszközeim alatt.");
                }
                $devId = $db->insert('devices', [
                    'public_id' => Util::publicId(), 'workspace_id' => $wsId, 'account_id' => $accId, 'device_uuid' => $dev['uuid'],
                    'platform' => $dev['platform'], 'app_version' => $dev['app_version'], 'device_name' => $dev['name'],
                    'created_at' => Clock::sql($now), 'last_seen_at' => Clock::sql($now),
                ]);
                $g->audit('DEVICE_REGISTERED', $req, $accId, $wsId, null, ['platform' => $dev['platform']]);
            } else {
                $devId = (int) $row['id'];
                $db->run('UPDATE devices SET revoked_at = NULL, platform = ?, app_version = ?, device_name = ?, last_seen_at = ? WHERE id = ?',
                    [$dev['platform'], $dev['app_version'], $dev['name'], Clock::sql($now), $devId]);
                $db->run("UPDATE sessions SET revoked_at = ?, revoke_reason = 'relogin' WHERE device_id = ? AND revoked_at IS NULL", [Clock::sql($now), $devId]);
            }
            return $this->issue($accId, $wsId, $devId);
        });
    }

    /** @return array<string,mixed> */
    private function issue(int $accId, int $wsId, int $devId): array
    {
        $db = $this->app->db();
        $now = Clock::now();
        $access = Util::token('mpa_');
        $refresh = Util::token('mpr_');
        $sid = $db->insert('sessions', [
            'public_id' => Util::publicId(), 'account_id' => $accId, 'workspace_id' => $wsId, 'device_id' => $devId,
            'access_hash' => $this->hash($access), 'access_expires_at' => Clock::sql($now + self::ACCESS_TTL),
            'refresh_expires_at' => Clock::sql($now + self::REFRESH_TTL), 'created_at' => Clock::sql($now), 'last_used_at' => Clock::sql($now),
        ]);
        $db->insert('refresh_tokens', [
            'session_id' => $sid, 'token_hash' => $this->hash($refresh), 'created_at' => Clock::sql($now), 'expires_at' => Clock::sql($now + self::REFRESH_TTL),
        ]);
        return [
            'access_token' => $access, 'access_expires_in' => self::ACCESS_TTL,
            'refresh_token' => $refresh, 'refresh_expires_in' => self::REFRESH_TTL,
            'device_id' => $db->val('SELECT public_id FROM devices WHERE id = ?', [$devId]),
        ];
    }

    private function hash(string $token): string
    {
        return Util::tokenHash($token, $this->app->pepper());
    }

    /** Refresh token rotáció. @param array<string,mixed> $in @return array<string,mixed> */
    public function refresh(Request $req, array $in): array
    {
        $g = $this->app->guard();
        $g->limit('refresh_ip', $req->ip);
        $tok = is_string($in['refresh_token'] ?? null) ? $in['refresh_token'] : '';
        if (!preg_match('/^mpr_[A-Za-z0-9_-]{43}$/', $tok)) {
            throw new ApiError(401, 'SESSION_EXPIRED', 'A munkamenet lejárt. Jelentkezz be újra.');
        }
        $db = $this->app->db();
        $now = Clock::now();
        $result = $db->tx(function () use ($db, $tok, $now) {
            $rt = $db->one('SELECT rt.*, s.account_id, s.workspace_id, s.device_id, s.revoked_at AS s_revoked, s.refresh_expires_at AS s_exp
                            FROM refresh_tokens rt JOIN sessions s ON s.id = rt.session_id WHERE rt.token_hash = ? FOR UPDATE', [$this->hash($tok)]);
            if ($rt === null) {
                return ['fail' => 'unknown'];
            }
            if ($rt['used_at'] !== null) {
                // ÚJRAHASZNÁLT refresh token: valaki lemásolta → a teljes munkamenet visszavonva.
                // A visszavonás a tranzakcióval VÉGLEGESÜL (a hibát csak utána dobjuk, különben visszagörgetődne).
                $db->run("UPDATE sessions SET revoked_at = ?, revoke_reason = 'refresh_reuse' WHERE id = ? AND revoked_at IS NULL", [Clock::sql($now), $rt['session_id']]);
                return ['fail' => 'reuse', 'rt' => $rt];
            }
            $acc = $db->one('SELECT status FROM accounts WHERE id = ?', [$rt['account_id']]);
            $dev = $db->one('SELECT revoked_at FROM devices WHERE id = ?', [$rt['device_id']]);
            if ($rt['s_revoked'] !== null || (Clock::ts($rt['expires_at']) ?? 0) <= $now || (Clock::ts($rt['s_exp']) ?? 0) <= $now
                || ($acc['status'] ?? '') !== 'ACTIVE' || ($dev['revoked_at'] ?? null) !== null) {
                throw new ApiError(401, 'SESSION_EXPIRED', 'A munkamenet lejárt. Jelentkezz be újra.');
            }
            $db->run('UPDATE refresh_tokens SET used_at = ? WHERE id = ?', [Clock::sql($now), $rt['id']]);
            $access = Util::token('mpa_');
            $refresh = Util::token('mpr_');
            $db->run('UPDATE sessions SET access_hash = ?, access_expires_at = ?, refresh_expires_at = ?, last_used_at = ? WHERE id = ?', [
                $this->hash($access), Clock::sql($now + self::ACCESS_TTL), Clock::sql($now + self::REFRESH_TTL), Clock::sql($now), $rt['session_id'],
            ]);
            $db->insert('refresh_tokens', [
                'session_id' => $rt['session_id'], 'token_hash' => $this->hash($refresh), 'created_at' => Clock::sql($now), 'expires_at' => Clock::sql($now + self::REFRESH_TTL),
            ]);
            return ['access_token' => $access, 'access_expires_in' => self::ACCESS_TTL, 'refresh_token' => $refresh, 'refresh_expires_in' => self::REFRESH_TTL];
        });
        if (isset($result['fail'])) {
            $g->metric('auth_fail');
            if ($result['fail'] === 'reuse') {
                $rt = $result['rt'];
                $g->audit('REFRESH_REUSE_DETECTED', $req, (int) $rt['account_id'], (int) $rt['workspace_id'], null, ['session' => (int) $rt['session_id']]);
            }
            throw new ApiError(401, 'SESSION_EXPIRED', 'A munkamenet lejárt. Jelentkezz be újra.');
        }
        return $result;
    }

    /** Bearer token → hitelesített kontextus a kérésen. */
    public function authenticate(Request $req): void
    {
        $h = $req->header('authorization');
        if (!preg_match('/^Bearer (mpa_[A-Za-z0-9_-]{43})$/', $h, $m)) {
            throw new ApiError(401, 'UNAUTHENTICATED', 'Jelentkezz be a Mester+ fiókodba.');
        }
        $db = $this->app->db();
        $s = $db->one('SELECT s.id, s.public_id, s.account_id, s.workspace_id, s.device_id, s.access_expires_at, s.refresh_expires_at, s.revoked_at, s.last_used_at,
                              a.status, a.role, a.public_id AS account_public, w.public_id AS ws_public, d.revoked_at AS dev_revoked, d.public_id AS device_public
                       FROM sessions s JOIN accounts a ON a.id = s.account_id JOIN workspaces w ON w.id = s.workspace_id JOIN devices d ON d.id = s.device_id
                       WHERE s.access_hash = ?', [$this->hash($m[1])]);
        $now = Clock::now();
        if ($s === null || $s['revoked_at'] !== null || $s['dev_revoked'] !== null || (Clock::ts($s['access_expires_at']) ?? 0) <= $now) {
            $this->app->guard()->metric('auth_fail');
            throw new ApiError(401, 'SESSION_EXPIRED', 'A munkamenet lejárt. Jelentkezz be újra.');
        }
        if ($s['status'] !== 'ACTIVE') {
            throw new ApiError(403, 'ACCOUNT_INACTIVE', 'Ez a fiók nem aktív.');
        }
        if ((Clock::ts($s['last_used_at']) ?? 0) < $now - 60) {
            $db->run('UPDATE sessions SET last_used_at = ? WHERE id = ?', [Clock::sql($now), $s['id']]);
            $db->run('UPDATE devices SET last_seen_at = ? WHERE id = ?', [Clock::sql($now), $s['device_id']]);
        }
        $req->auth = [
            'session_id' => (int) $s['id'], 'account_id' => (int) $s['account_id'], 'workspace_id' => (int) $s['workspace_id'],
            'device_id' => (int) $s['device_id'], 'role' => $s['role'], 'account_public' => $s['account_public'],
            'workspace_public' => $s['ws_public'], 'device_public' => $s['device_public'],
        ];
        $this->app->guard()->limit('api_account', 'acc:' . $s['account_id']);
    }

    public function logout(Request $req, bool $all): void
    {
        $db = $this->app->db();
        if ($all) {
            $db->run("UPDATE sessions SET revoked_at = ?, revoke_reason = 'logout_all' WHERE account_id = ? AND revoked_at IS NULL", [Clock::sql(), $req->auth['account_id']]);
            $this->app->guard()->audit('LOGOUT_ALL', $req);
        } else {
            $db->run("UPDATE sessions SET revoked_at = ?, revoke_reason = 'logout' WHERE id = ? AND revoked_at IS NULL", [Clock::sql(), $req->auth['session_id']]);
            $this->app->guard()->audit('LOGOUT', $req);
        }
    }

    // ── E-mail megerősítés, jelszó-visszaállítás ─────────────────────────────

    public function sendVerification(int $accId, string $email): void
    {
        $tok = $this->emailToken($accId, 'verify', 172800);
        $url = $this->app->publicBase('api') . '/v/' . $tok;
        $this->app->mailer()->queue($accId, 'verify', $email, 'Mester+ – e-mail cím megerősítése',
            "Szia!\n\nA Mester+ fiókod e-mail címét ezen a linken erősítheted meg (48 óráig érvényes):\n$url\n\n"
            . "Ha nem te regisztráltál, hagyd figyelmen kívül ezt a levelet.\n\nMester+");
    }

    public function resendVerification(Request $req): void
    {
        $this->app->guard()->limit('verify_resend', 'acc:' . $req->auth['account_id']);
        $a = $this->app->db()->one('SELECT email, email_verified_at FROM accounts WHERE id = ?', [$req->auth['account_id']]);
        if ($a !== null && $a['email_verified_at'] === null && $a['email'] !== null) {
            $this->sendVerification($req->auth['account_id'], $a['email']);
        }
    }

    private function emailToken(int $accId, string $purpose, int $ttl): string
    {
        $db = $this->app->db();
        $db->run('UPDATE email_tokens SET used_at = ? WHERE account_id = ? AND purpose = ? AND used_at IS NULL', [Clock::sql(), $accId, $purpose]);
        $tok = Util::token();
        $db->insert('email_tokens', [
            'account_id' => $accId, 'purpose' => $purpose, 'token_hash' => $this->hash($tok),
            'created_at' => Clock::sql(), 'expires_at' => Clock::sql(Clock::now() + $ttl),
        ]);
        return $tok;
    }

    /** @return array<string,mixed>|null egyszer használható token felhasználása */
    public function consumeEmailToken(string $tok, string $purpose): ?array
    {
        if (!preg_match('/^[A-Za-z0-9_-]{43}$/', $tok)) {
            return null;
        }
        $db = $this->app->db();
        return $db->tx(function () use ($db, $tok, $purpose) {
            $r = $db->one('SELECT * FROM email_tokens WHERE token_hash = ? AND purpose = ? FOR UPDATE', [$this->hash($tok), $purpose]);
            if ($r === null || $r['used_at'] !== null || (Clock::ts($r['expires_at']) ?? 0) <= Clock::now()) {
                return null;
            }
            $db->run('UPDATE email_tokens SET used_at = ? WHERE id = ?', [Clock::sql(), $r['id']]);
            return $r;
        });
    }

    /** @return array<string,mixed>|null érvényes-e (felhasználás nélkül) – a webes űrlap megjelenítéséhez */
    public function peekEmailToken(string $tok, string $purpose): ?array
    {
        if (!preg_match('/^[A-Za-z0-9_-]{43}$/', $tok)) {
            return null;
        }
        $r = $this->app->db()->one('SELECT * FROM email_tokens WHERE token_hash = ? AND purpose = ?', [$this->hash($tok), $purpose]);
        return ($r === null || $r['used_at'] !== null || (Clock::ts($r['expires_at']) ?? 0) <= Clock::now()) ? null : $r;
    }

    public function verifyEmail(Request $req, string $tok): bool
    {
        $r = $this->consumeEmailToken($tok, 'verify');
        if ($r === null) {
            return false;
        }
        $this->app->db()->run('UPDATE accounts SET email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ?', [Clock::sql(), Clock::sql(), $r['account_id']]);
        $this->app->guard()->audit('EMAIL_VERIFIED', $req, (int) $r['account_id']);
        return true;
    }

    /** Mindig ugyanazt válaszolja – nem derül ki, van-e ilyen fiók. @param array<string,mixed> $in */
    public function forgot(Request $req, array $in): void
    {
        $g = $this->app->guard();
        $g->limit('reset_ip', $req->ip);
        $email = is_string($in['email'] ?? null) ? strtolower(trim($in['email'])) : '';
        if ($email === '' || strlen($email) > 254) {
            return;
        }
        $g->limit('reset_email', $email);
        $a = $this->app->db()->one("SELECT id, email FROM accounts WHERE email = ? AND status = 'ACTIVE'", [$email]);
        if ($a === null) {
            return;
        }
        $tok = $this->emailToken((int) $a['id'], 'reset', 3600);
        $url = $this->app->publicBase('api') . '/r/' . $tok;
        $this->app->mailer()->queue((int) $a['id'], 'reset', $a['email'], 'Mester+ – új jelszó beállítása',
            "Szia!\n\nÚj jelszót ezen a linken állíthatsz be (1 óráig érvényes):\n$url\n\n"
            . "Ha nem te kérted, hagyd figyelmen kívül ezt a levelet – a jelszavad nem változik.\n\nMester+");
        $g->audit('PASSWORD_RESET_REQUESTED', $req, (int) $a['id']);
    }

    /** Új jelszó; minden munkamenet visszavonva. */
    public function resetPassword(Request $req, string $tok, mixed $newPassword): void
    {
        $pw = self::password($newPassword);
        $r = $this->consumeEmailToken($tok, 'reset');
        if ($r === null) {
            throw new ApiError(400, 'TOKEN_INVALID', 'A link lejárt vagy már felhasználták. Kérj újat az appban.');
        }
        $db = $this->app->db();
        $db->run('UPDATE accounts SET password_hash = ?, failed_logins = 0, locked_until = NULL, updated_at = ? WHERE id = ?',
            [password_hash($pw, PASSWORD_ARGON2ID, ['memory_cost' => 65536, 'time_cost' => 3, 'threads' => 1]), Clock::sql(), $r['account_id']]);
        $db->run("UPDATE sessions SET revoked_at = ?, revoke_reason = 'password_reset' WHERE account_id = ? AND revoked_at IS NULL", [Clock::sql(), $r['account_id']]);
        $this->app->guard()->audit('PASSWORD_RESET', $req, (int) $r['account_id']);
    }
}
