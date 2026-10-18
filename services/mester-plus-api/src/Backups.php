<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/**
 * MESTER+ CLOUD BACKUP.
 *
 * Titkosítási modell (részletek: docs/CLOUD_BACKUP.md):
 *  - A mentést a TELEFON titkosítja (AES-256-GCM) egy munkaterületenkénti véletlen mentési kulccsal (BK).
 *  - A BK a szerveren csak a mesterkulccsal (KEK, config/app.env, sosem a Gitben / DB-ben) burkolva van:
 *    XChaCha20-Poly1305 (libsodium), AAD = munkaterület + kulcsverzió.
 *  - Új telefonon belépés után a BK TLS-en, hitelesítve lekérhető → a mentés visszaállítható.
 *  - A tároló (fájlok, DB-dump, B2-másolat) önmagában nem fejthető vissza: hozzá a KEK is kellene.
 *
 * Blob-formátum (v1): "MPCB" | formátum (1 bájt = 1) | kulcsverzió (uint32 BE) | nonce (12) | titkosított adat + GCM-tag (16)
 * A titkosított adat = gzip(a meglévő JSON-mentés). AAD = a 21 bájtos fejléc + a munkaterület azonosítója.
 */
final class Backups
{
    public const MAGIC = 'MPCB';
    public const HEADER_LEN = 21;
    public const ENCRYPTION_VERSION = 1;
    public const MIN_SIZE = 21 + 16 + 20;

    public function __construct(private App $app)
    {
    }

    public function maxBytes(): int
    {
        return $this->app->config()->int('MP_BACKUP_MAX_BYTES', 50 * 1024 * 1024);
    }

    private function dir(): string
    {
        $d = $this->app->storageDir();
        if (!is_dir($d) && !@mkdir($d, 0750, true) && !is_dir($d)) {
            $this->app->guard()->metric('storage_error');
            throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'A felhőtárhely most nem érhető el. Próbáld újra később.');
        }
        return $d;
    }

    // ── Mentési kulcs ────────────────────────────────────────────────────────

    /** @return array{key_version:int,key:string} */
    public function key(Request $req, ?int $version): array
    {
        $this->app->entitlements()->require($req, 'cloud_backup', 'cloud_restore');
        $this->app->guard()->limit('backup_key', 'acc:' . $req->auth['account_id']);
        $ws = $req->auth['workspace_id'];
        $db = $this->app->db();
        $row = $version === null
            ? $db->one('SELECT * FROM backup_keys WHERE workspace_id = ? ORDER BY key_version DESC LIMIT 1', [$ws])
            : $db->one('SELECT * FROM backup_keys WHERE workspace_id = ? AND key_version = ?', [$ws, $version]);
        if ($row === null) {
            if ($version !== null && $version !== 1) {
                throw new ApiError(404, 'NOT_FOUND', 'Ehhez a mentéshez nem található kulcs.');
            }
            $this->app->entitlements()->require($req, 'cloud_backup');
            $bk = random_bytes(32);
            try {
                $db->insert('backup_keys', [
                    'workspace_id' => $ws, 'key_version' => 1, 'kek_version' => $this->app->kekVersion(),
                    'wrapped_key' => $this->wrap($bk, $req->auth['workspace_public'], 1, $this->app->kekVersion()), 'created_at' => Clock::sql(),
                ]);
            } catch (\PDOException $e) {
                if (($e->errorInfo[1] ?? 0) !== 1062) {
                    throw $e;
                }
            }
            $row = $db->one('SELECT * FROM backup_keys WHERE workspace_id = ? AND key_version = 1', [$ws]);
        }
        $bk = $this->unwrap((string) $row['wrapped_key'], $req->auth['workspace_public'], (int) $row['key_version'], (int) $row['kek_version']);
        return ['key_version' => (int) $row['key_version'], 'key' => base64_encode($bk)];
    }

    public function wrap(string $bk, string $wsPublic, int $keyVersion, int $kekVersion): string
    {
        $nonce = random_bytes(SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_NPUBBYTES);
        $aad = "mpbk:$wsPublic:$keyVersion";
        return $nonce . sodium_crypto_aead_xchacha20poly1305_ietf_encrypt($bk, $aad, $nonce, $this->app->kek($kekVersion));
    }

    public function unwrap(string $wrapped, string $wsPublic, int $keyVersion, int $kekVersion): string
    {
        $n = SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_NPUBBYTES;
        $bk = sodium_crypto_aead_xchacha20poly1305_ietf_decrypt(substr($wrapped, $n), "mpbk:$wsPublic:$keyVersion", substr($wrapped, 0, $n), $this->app->kek($kekVersion));
        if ($bk === false || strlen($bk) !== 32) {
            throw new \RuntimeException('A mentési kulcs nem bontható ki (KEK-eltérés).');
        }
        return $bk;
    }

    // ── Feltöltés ────────────────────────────────────────────────────────────

    /** 1. lépés: a mentés bejelentése (méret, ellenőrzőösszeg). Idempotens. @param array<string,mixed> $in @return array<string,mixed> */
    public function init(Request $req, array $in): array
    {
        $this->app->entitlements()->require($req, 'cloud_backup');
        $this->app->guard()->limit('backup_upload', 'acc:' . $req->auth['account_id']);
        $ws = $req->auth['workspace_id'];
        $size = $in['size_bytes'] ?? null;
        $sha = is_string($in['sha256'] ?? null) ? strtolower($in['sha256']) : '';
        $fmt = $in['backup_format_version'] ?? null;
        $enc = $in['encryption_version'] ?? null;
        $kv = $in['key_version'] ?? null;
        $appVer = Util::cleanText($in['app_version'] ?? '', 32) ?? '';
        if (!is_int($size) || $size < self::MIN_SIZE) {
            throw new ApiError(422, 'INVALID_BACKUP', 'Hibás mentés-méret.');
        }
        if ($size > $this->maxBytes()) {
            throw new ApiError(413, 'BACKUP_TOO_LARGE', 'A mentés túl nagy (legfeljebb ' . intdiv($this->maxBytes(), 1048576) . ' MB).');
        }
        if (!preg_match('/^[0-9a-f]{64}$/', $sha) || !is_int($fmt) || $fmt < 1 || $fmt > 100 || $enc !== self::ENCRYPTION_VERSION || !is_int($kv) || $kv < 1
            || !preg_match('/^\d{1,3}\.\d{1,3}\.\d{1,3}/', $appVer)) {
            throw new ApiError(422, 'INVALID_BACKUP', 'Hibás mentés-adatok.');
        }
        $db = $this->app->db();
        if ($db->val('SELECT 1 FROM backup_keys WHERE workspace_id = ? AND key_version = ?', [$ws, $kv]) === null) {
            throw new ApiError(422, 'INVALID_BACKUP', 'Ismeretlen titkosítási kulcs.');
        }
        $pol = $this->app->entitlements()->backupPolicy($ws);
        $used = $this->usedBytes($ws);
        if ($used + $size > $pol['quota']) {
            throw new ApiError(413, 'QUOTA_EXCEEDED', 'Elfogyott a felhőtárhelyed. Törölj régebbi mentést a Felhőmentések között.', ['used_bytes' => $used, 'quota_bytes' => $pol['quota']]);
        }
        $free = @disk_free_space($this->dir());
        if ($free !== false && $free < $size + $this->app->config()->int('MP_STORAGE_RESERVE_BYTES', 2 * 1024 * 1024 * 1024)) {
            $this->app->guard()->metric('storage_error');
            throw new ApiError(507, 'STORAGE_FULL', 'A felhőtárhely most nem fogad mentést. Próbáld újra később.');
        }
        $pub = Util::publicId();
        $db->insert('cloud_backups', [
            'public_id' => $pub, 'workspace_id' => $ws, 'device_id' => $req->auth['device_id'], 'app_version' => $appVer,
            'backup_format_version' => $fmt, 'encryption_version' => $enc, 'key_version' => $kv, 'size_bytes' => $size,
            'checksum_sha256' => $sha, 'status' => 'UPLOADING', 'storage_key' => $req->auth['workspace_public'] . '/' . $pub . '.mpcb', 'created_at' => Clock::sql(),
        ]);
        return [
            'id' => $pub, 'status' => 'UPLOADING', 'upload_path' => "/api/v1/backups/$pub/content",
            'used_bytes' => $used, 'quota_bytes' => $pol['quota'], 'quota_warning' => ($used + $size) > 0.8 * $pol['quota'],
        ];
    }

    /** 2. lépés: a titkosított tartalom. Méret + SHA-256 + fejléc ellenőrzés; csak hibátlan mentés lesz READY. @return array<string,mixed> */
    public function upload(Request $req, string $id): array
    {
        $this->app->entitlements()->require($req, 'cloud_backup');
        $row = $this->find($req, $id);
        if ($row['status'] === 'READY') {
            return $this->view($row); // ismételt (újrapróbált) feltöltés: már kész
        }
        if ($row['status'] !== 'UPLOADING') {
            throw new ApiError(409, 'BACKUP_NOT_UPLOADABLE', 'Ez a mentés már nem tölthető fel. Indíts új mentést.');
        }
        $size = (int) $row['size_bytes'];
        $cl = $req->header('content-length');
        if ($cl !== '' && (int) $cl !== $size) {
            $this->fail($row, 'size_mismatch');
            throw new ApiError(422, 'SIZE_MISMATCH', 'A feltöltött mentés mérete eltér. Próbáld újra.');
        }
        $dir = $this->dir();
        $tmpDir = $dir . '/.tmp';
        if (!is_dir($tmpDir)) {
            @mkdir($tmpDir, 0750, true);
        }
        $tmp = $tmpDir . '/' . $row['public_id'] . '.' . bin2hex(random_bytes(4)) . '.part';
        $out = @fopen($tmp, 'xb');
        if ($out === false) {
            $this->app->guard()->metric('storage_error');
            throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'A felhőtárhely most nem érhető el. Próbáld újra később.');
        }
        $in = $req->bodyStream();
        $ctx = hash_init('sha256');
        $n = 0;
        $head = '';
        try {
            while (!feof($in)) {
                $chunk = fread($in, 65536);
                if ($chunk === false || $chunk === '') {
                    break;
                }
                $n += strlen($chunk);
                if ($n > $size) {
                    break;
                }
                if (strlen($head) < self::HEADER_LEN) {
                    $head .= substr($chunk, 0, self::HEADER_LEN - strlen($head));
                }
                hash_update($ctx, $chunk);
                if (fwrite($out, $chunk) !== strlen($chunk)) {
                    throw new \RuntimeException('write');
                }
            }
            fflush($out);
        } catch (\Throwable) {
            fclose($out);
            @unlink($tmp);
            $this->app->guard()->metric('storage_error');
            $this->fail($row, 'storage_write');
            throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'A felhőtárhely most nem érhető el. Próbáld újra később.');
        }
        fclose($out);
        fclose($in);
        $db = $this->app->db();
        $db->run("UPDATE cloud_backups SET status = 'VERIFYING' WHERE id = ? AND status = 'UPLOADING'", [$row['id']]);
        $reason = null;
        if ($n !== $size) {
            $reason = 'size_mismatch';
        } elseif (!hash_equals($row['checksum_sha256'], hash_final($ctx))) {
            $reason = 'checksum_mismatch';
        } elseif (!$this->headerOk($head, (int) $row['key_version'])) {
            $reason = 'bad_header';
        }
        if ($reason !== null) {
            @unlink($tmp);
            $this->fail($row, $reason);
            $this->app->guard()->metric('backup_upload_fail');
            $this->app->guard()->audit('BACKUP_UPLOAD_REJECTED', $req, null, null, $row['public_id'], ['reason' => $reason]);
            throw new ApiError(422, strtoupper($reason), match ($reason) {
                'checksum_mismatch' => 'A feltöltött mentés sérült (ellenőrzőösszeg-eltérés). Próbáld újra.',
                'bad_header' => 'A feltöltött fájl nem Mester+ felhőmentés.',
                default => 'A feltöltött mentés mérete eltér. Próbáld újra.',
            });
        }
        $final = $dir . '/' . $row['storage_key'];
        $wsDir = dirname($final);
        if (!is_dir($wsDir)) {
            @mkdir($wsDir, 0750, true);
        }
        @chmod($tmp, 0640);
        if (!@rename($tmp, $final)) {
            @unlink($tmp);
            $this->fail($row, 'storage_rename');
            $this->app->guard()->metric('storage_error');
            throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'A felhőtárhely most nem érhető el. Próbáld újra később.');
        }
        $db->run("UPDATE cloud_backups SET status = 'READY', uploaded_at = ? WHERE id = ? AND status = 'VERIFYING'", [Clock::sql(), $row['id']]);
        $this->app->guard()->audit('BACKUP_UPLOAD', $req, null, null, $row['public_id'], ['size' => $size]);
        $this->app->guard()->metric('backup_upload_ok');
        $this->retention($req->auth['workspace_id']);
        return $this->view($this->find($req, $id));
    }

    private function headerOk(string $head, int $keyVersion): bool
    {
        if (strlen($head) < self::HEADER_LEN || substr($head, 0, 4) !== self::MAGIC || ord($head[4]) !== self::ENCRYPTION_VERSION) {
            return false;
        }
        return unpack('N', substr($head, 5, 4))[1] === $keyVersion;
    }

    /** @param array<string,mixed> $row */
    private function fail(array $row, string $reason): void
    {
        $this->app->db()->run("UPDATE cloud_backups SET status = 'FAILED', failed_reason = ? WHERE id = ? AND status IN ('UPLOADING','VERIFYING')", [$reason, $row['id']]);
    }

    // ── Lista, letöltés, törlés ──────────────────────────────────────────────

    /** @return array<string,mixed> */
    public function list(Request $req): array
    {
        $this->app->entitlements()->require($req, 'cloud_backup', 'cloud_restore');
        $ws = $req->auth['workspace_id'];
        $rows = $this->app->db()->all(
            "SELECT b.*, d.device_name, d.public_id AS device_public FROM cloud_backups b LEFT JOIN devices d ON d.id = b.device_id
             WHERE b.workspace_id = ? AND b.status = 'READY' ORDER BY b.created_at DESC, b.id DESC LIMIT 100", [$ws]);
        $pol = $this->app->entitlements()->backupPolicy($ws);
        return ['backups' => array_map(fn ($r) => $this->view($r), $rows), 'used_bytes' => $this->usedBytes($ws), 'quota_bytes' => $pol['quota'],
                'max_versions' => $pol['max_versions'], 'retention_days' => $pol['retention_days']];
    }

    public function download(Request $req, string $id): Response
    {
        $this->app->entitlements()->require($req, 'cloud_restore', 'cloud_backup');
        $this->app->guard()->limit('backup_download', 'acc:' . $req->auth['account_id']);
        $row = $this->find($req, $id);
        if ($row['status'] !== 'READY') {
            throw new ApiError(404, 'NOT_FOUND', 'Nincs ilyen mentés.');
        }
        $path = $this->app->storageDir() . '/' . $row['storage_key'];
        $fh = @fopen($path, 'rb');
        if ($fh === false || filesize($path) !== (int) $row['size_bytes']) {
            $this->app->guard()->metric('storage_error');
            throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'A mentés most nem tölthető le. Próbáld újra később.');
        }
        $this->app->guard()->audit('BACKUP_DOWNLOAD', $req, null, null, $row['public_id']);
        $r = new Response(200, '', [
            'Content-Type' => 'application/octet-stream', 'Content-Length' => (string) $row['size_bytes'],
            'X-Checksum-SHA256' => $row['checksum_sha256'], 'X-Key-Version' => (string) $row['key_version'],
            'X-Encryption-Version' => (string) $row['encryption_version'], 'Cache-Control' => 'no-store',
        ]);
        $r->stream = $fh;
        return $r;
    }

    public function delete(Request $req, string $id): void
    {
        $row = $this->find($req, $id);
        if ($row['status'] === 'DELETED') {
            return;
        }
        $this->remove($row);
        $this->app->guard()->audit('BACKUP_DELETED', $req, null, null, $row['public_id']);
    }

    /** @return array<string,mixed> csak a SAJÁT munkaterület mentése (különben 404 – létezés sem derül ki) */
    private function find(Request $req, string $id): array
    {
        $row = Util::isPublicId($id) ? $this->app->db()->one(
            'SELECT b.*, d.device_name, d.public_id AS device_public FROM cloud_backups b LEFT JOIN devices d ON d.id = b.device_id
             WHERE b.public_id = ? AND b.workspace_id = ?', [$id, $req->auth['workspace_id']]) : null;
        if ($row === null) {
            throw new ApiError(404, 'NOT_FOUND', 'Nincs ilyen mentés.');
        }
        return $row;
    }

    /** @param array<string,mixed> $r @return array<string,mixed> */
    private function view(array $r): array
    {
        return [
            'id' => $r['public_id'], 'status' => $r['status'], 'size_bytes' => (int) $r['size_bytes'], 'sha256' => $r['checksum_sha256'],
            'app_version' => $r['app_version'], 'backup_format_version' => (int) $r['backup_format_version'],
            'encryption_version' => (int) $r['encryption_version'], 'key_version' => (int) $r['key_version'],
            'device' => ['id' => $r['device_public'] ?? null, 'name' => $r['device_name'] ?? null],
            'created_at' => Clock::iso($r['created_at']), 'uploaded_at' => Clock::iso($r['uploaded_at']),
        ];
    }

    public function usedBytes(int $ws): int
    {
        return (int) $this->app->db()->val("SELECT COALESCE(SUM(size_bytes), 0) FROM cloud_backups WHERE workspace_id = ? AND status IN ('UPLOADING','VERIFYING','READY')", [$ws]);
    }

    /** @param array<string,mixed> $row */
    private function remove(array $row): void
    {
        $p = $this->app->storageDir() . '/' . $row['storage_key'];
        if (is_file($p)) {
            @unlink($p);
        }
        $this->app->db()->run("UPDATE cloud_backups SET status = 'DELETED', deleted_at = ? WHERE id = ?", [Clock::sql(), $row['id']]);
    }

    /**
     * Megőrzés a csomag szerint: legfeljebb N verzió, és a megőrzési időnél régebbiek törlődnek –
     * de a LEGFRISSEBB sikeres mentés soha nem törlődik automatikusan.
     */
    public function retention(int $ws): int
    {
        $pol = $this->app->entitlements()->backupPolicy($ws);
        $rows = $this->app->db()->all("SELECT * FROM cloud_backups WHERE workspace_id = ? AND status = 'READY' ORDER BY created_at DESC, id DESC", [$ws]);
        $removed = 0;
        $cut = Clock::now() - max(1, $pol['retention_days']) * 86400;
        foreach ($rows as $i => $r) {
            if ($i === 0) {
                continue;
            }
            if (($pol['max_versions'] > 0 && $i >= $pol['max_versions']) || (Clock::ts($r['created_at']) ?? 0) < $cut) {
                $this->remove($r);
                $removed++;
            }
        }
        return $removed;
    }

    /** Félbemaradt feltöltések (2 óra) és árva ideiglenes fájlok takarítása. */
    public function cleanupStale(): int
    {
        $db = $this->app->db();
        $n = $db->run("UPDATE cloud_backups SET status = 'FAILED', failed_reason = 'stale' WHERE status IN ('UPLOADING','VERIFYING') AND created_at < ?", [Clock::sql(Clock::now() - 7200)])->rowCount();
        foreach (glob($this->app->storageDir() . '/.tmp/*.part') ?: [] as $f) {
            if (filemtime($f) < Clock::now() - 7200) {
                @unlink($f);
            }
        }
        return $n;
    }

    public function deleteAllForWorkspace(int $ws): void
    {
        foreach ($this->app->db()->all("SELECT * FROM cloud_backups WHERE workspace_id = ? AND status <> 'DELETED'", [$ws]) as $r) {
            $this->remove($r);
        }
        $wsPub = $this->app->db()->val('SELECT public_id FROM workspaces WHERE id = ?', [$ws]);
        if (is_string($wsPub) && Util::isPublicId($wsPub)) {
            @rmdir($this->app->storageDir() . '/' . $wsPub);
        }
    }
}
