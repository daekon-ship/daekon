<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/** Fiók-adatok, eszközök, adatexport, fióktörlés. Minden lekérdezés a hitelesített fiókhoz / munkaterülethez kötött. */
final class Accounts
{
    public function __construct(private App $app)
    {
    }

    /** @return array<string,mixed> */
    public function summary(int $accId): array
    {
        $a = $this->app->db()->one('SELECT public_id, email, email_verified_at, status, created_at, last_login_at FROM accounts WHERE id = ?', [$accId]);
        return [
            'id' => $a['public_id'], 'email' => $a['email'], 'email_verified' => $a['email_verified_at'] !== null,
            'status' => $a['status'], 'created_at' => Clock::iso($a['created_at']), 'last_login_at' => Clock::iso($a['last_login_at']),
        ];
    }

    /** @return array<string,mixed> */
    public function me(Request $req): array
    {
        $db = $this->app->db();
        $ws = $db->one('SELECT public_id, name FROM workspaces WHERE id = ?', [$req->auth['workspace_id']]);
        $role = $db->val('SELECT role FROM workspace_members WHERE workspace_id = ? AND account_id = ?', [$req->auth['workspace_id'], $req->auth['account_id']]);
        return [
            'account' => $this->summary($req->auth['account_id']),
            'workspace' => ['id' => $ws['public_id'], 'name' => $ws['name'], 'role' => $role],
            'device_id' => $req->auth['device_public'],
        ] + $this->app->entitlements()->view($req->auth['workspace_id']);
    }

    /** @return list<array<string,mixed>> */
    public function devices(Request $req): array
    {
        $rows = $this->app->db()->all(
            'SELECT d.id, d.public_id, d.platform, d.app_version, d.device_name, d.created_at, d.last_seen_at, d.revoked_at,
                    (SELECT COUNT(*) FROM sessions s WHERE s.device_id = d.id AND s.revoked_at IS NULL AND s.refresh_expires_at > UTC_TIMESTAMP()) AS live
             FROM devices d WHERE d.account_id = ? ORDER BY d.revoked_at IS NULL DESC, d.last_seen_at DESC LIMIT 50',
            [$req->auth['account_id']],
        );
        return array_map(fn ($r) => [
            'id' => $r['public_id'], 'name' => $r['device_name'], 'platform' => $r['platform'], 'app_version' => $r['app_version'],
            'created_at' => Clock::iso($r['created_at']), 'last_seen_at' => Clock::iso($r['last_seen_at']),
            'revoked' => $r['revoked_at'] !== null, 'signed_in' => (int) $r['live'] > 0, 'current' => (int) $r['id'] === $req->auth['device_id'],
        ], $rows);
    }

    /** Eszköz visszavonása: minden munkamenete azonnal érvénytelen. Csak a SAJÁT fiók eszköze. */
    public function revokeDevice(Request $req, string $publicId): void
    {
        $db = $this->app->db();
        $d = Util::isPublicId($publicId) ? $db->one('SELECT id FROM devices WHERE public_id = ? AND account_id = ?', [$publicId, $req->auth['account_id']]) : null;
        if ($d === null) {
            throw new ApiError(404, 'NOT_FOUND', 'Nincs ilyen eszköz.');
        }
        $db->tx(function () use ($db, $d) {
            $db->run('UPDATE devices SET revoked_at = COALESCE(revoked_at, ?) WHERE id = ?', [Clock::sql(), $d['id']]);
            $db->run("UPDATE sessions SET revoked_at = ?, revoke_reason = 'device_revoked' WHERE device_id = ? AND revoked_at IS NULL", [Clock::sql(), $d['id']]);
        });
        $this->app->guard()->audit('DEVICE_REVOKED', $req, null, null, $publicId);
    }

    /** ADATAIM EXPORTÁLÁSA: fiók-metaadat, eszközök, mentés- és ajánlat-metaadat (tartalom nélkül). @return array<string,mixed> */
    public function export(Request $req): array
    {
        $this->app->guard()->limit('export', 'acc:' . $req->auth['account_id']);
        $db = $this->app->db();
        $ws = $req->auth['workspace_id'];
        $out = [
            'format' => 'mester_plus_cloud_export', 'version' => 1, 'exported_at' => gmdate('Y-m-d\TH:i:s\Z', Clock::now()),
            'account' => $this->summary($req->auth['account_id']),
            'workspace' => $db->one('SELECT public_id AS id, name, created_at FROM workspaces WHERE id = ?', [$ws]),
            'devices' => $this->devices($req),
            'subscription' => $this->app->entitlements()->view($ws),
            'cloud_backups' => array_map(fn ($r) => $r + ['note' => 'A mentés tartalma titkosított; az appból állítható vissza.'], $db->all(
                "SELECT public_id AS id, status, app_version, size_bytes, checksum_sha256, created_at, uploaded_at FROM cloud_backups
                 WHERE workspace_id = ? AND status <> 'DELETED' ORDER BY created_at DESC", [$ws])),
            'online_quotes' => $db->all(
                'SELECT public_id AS id, quote_number, quote_version, status, gross_total_huf, valid_until, created_at, first_opened_at, decided_at, revoked_at
                 FROM quote_shares WHERE workspace_id = ? ORDER BY created_at DESC', [$ws]),
            'note' => 'A projekt- és ügyféladatok a telefonon vannak; azok exportja az app helyi mentése (Beállítások → Adatmentés).',
        ];
        $this->app->guard()->audit('DATA_EXPORT', $req);
        return $out;
    }

    /**
     * FIÓK TÖRLÉSE. Azonnal: munkamenetek, eszközök, felhőmentések (fájl + sor), online ajánlatok (link
     * visszavonva, tartalom törölve), levélsor; a fiók e-mail címe és jelszava törlődik (anonimizálás).
     * Megmarad (jogos érdek / számviteli megőrzés, ld. CLOUD_SECURITY.md): audit_logs (csak belső
     * azonosítóval), subscription_events (munkaterület nélkül).
     */
    public function delete(Request $req, mixed $password): void
    {
        $g = $this->app->guard();
        $g->limit('account_delete', 'acc:' . $req->auth['account_id']);
        $db = $this->app->db();
        $acc = $db->one('SELECT * FROM accounts WHERE id = ?', [$req->auth['account_id']]);
        if (!is_string($password) || !password_verify($password, $acc['password_hash'] ?? $this->app->dummyHash())) {
            throw new ApiError(403, 'INVALID_PASSWORD', 'Hibás jelszó.');
        }
        $g->audit('ACCOUNT_DELETE_REQUEST', $req);
        $db->run("UPDATE accounts SET status = 'DELETION_PENDING', deletion_requested_at = ?, updated_at = ? WHERE id = ?", [Clock::sql(), Clock::sql(), $acc['id']]);
        $this->purge((int) $acc['id']);
    }

    /** A törlés végrehajtása (a karbantartó feladat a félbemaradtat is befejezi). */
    public function purge(int $accId): void
    {
        $db = $this->app->db();
        $wsIds = array_map('intval', array_column($db->all("SELECT workspace_id FROM workspace_members WHERE account_id = ? AND role = 'owner'", [$accId]), 'workspace_id'));
        foreach ($wsIds as $ws) {
            $this->app->backups()->deleteAllForWorkspace($ws);
            $db->run("UPDATE quote_shares SET status = IF(status = 'ACTIVE', 'REVOKED', status), revoked_at = COALESCE(revoked_at, ?), snapshot = '{}' WHERE workspace_id = ?", [Clock::sql(), $ws]);
            $db->run("UPDATE subscriptions SET status = IF(status IN ('TRIAL','ACTIVE','GRACE','PAST_DUE'), 'CANCELLED', status), cancelled_at = COALESCE(cancelled_at, ?), updated_at = ? WHERE workspace_id = ?", [Clock::sql(), Clock::sql(), $ws]);
        }
        $db->tx(function () use ($db, $accId, $wsIds) {
            $db->run("UPDATE sessions SET revoked_at = COALESCE(revoked_at, ?), revoke_reason = COALESCE(revoke_reason, 'account_deleted') WHERE account_id = ?", [Clock::sql(), $accId]);
            $db->run('DELETE FROM refresh_tokens WHERE session_id IN (SELECT id FROM sessions WHERE account_id = ?)', [$accId]);
            $db->run('DELETE FROM sessions WHERE account_id = ?', [$accId]);
            $db->run('DELETE FROM devices WHERE account_id = ?', [$accId]);
            $db->run('DELETE FROM email_tokens WHERE account_id = ?', [$accId]);
            $db->run('DELETE FROM mail_outbox WHERE account_id = ?', [$accId]);
            foreach ($wsIds as $ws) {
                $db->run('DELETE FROM entitlements WHERE workspace_id = ?', [$ws]);
                $db->run('DELETE FROM backup_keys WHERE workspace_id = ?', [$ws]);
                $db->run('UPDATE workspaces SET name = ?, deleted_at = COALESCE(deleted_at, ?) WHERE id = ?', ['(törölve)', Clock::sql(), $ws]);
            }
            $db->run("UPDATE accounts SET status = 'DELETED', email = NULL, email_hash = NULL, password_hash = NULL, deleted_at = ?, updated_at = ? WHERE id = ?", [Clock::sql(), Clock::sql(), $accId]);
        });
        $this->app->guard()->audit('ACCOUNT_DELETED', null, $accId);
    }
}
