<?php
declare(strict_types=1);

/**
 * Karikagyuru.com – szerveroldali kezelőfelület-API (fejlesztői váz).
 * NINCS élesítve. PHP 8.1+ és SQLite kell hozzá, külső csomag nélkül.
 * Az adatmappa (KG_DATA) a webgyökéren KÍVÜL legyen.
 */
final class App
{
    private PDO $db;
    private string $data;
    private const MAX_STATE = 6_000_000;      // bájt
    private const MAX_PHOTO = 8_000_000;      // bájt
    private const LOGIN_TRIES = 5;            // 15 perc alatt
    private const INQ_PER_HOUR = 5;           // IP-nként
    private const INQ_STATUS = ['uj', 'visszahivva', 'elfogadva', 'lezarva'];

    public function __construct(?string $dataDir = null)
    {
        $this->data = rtrim($dataDir ?? (getenv('KG_DATA') ?: dirname(__DIR__) . '/data'), '/');
        if (!is_dir($this->data)) mkdir($this->data, 0700, true);
        if (!is_dir($this->data . '/photos')) mkdir($this->data . '/photos', 0700, true);
        $this->db = new PDO('sqlite:' . $this->data . '/kg.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->exec('PRAGMA journal_mode=WAL');
        $this->db->exec('PRAGMA foreign_keys=ON');
        $this->migrate();
    }

    private function migrate(): void
    {
        $this->db->exec('CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY CHECK (id = 1), hash TEXT NOT NULL, changed_at TEXT NOT NULL)');
        $this->db->exec('CREATE TABLE IF NOT EXISTS state_version (version INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT NOT NULL, note TEXT NOT NULL DEFAULT \'\', saved_at TEXT NOT NULL)');
        $this->db->exec('CREATE TABLE IF NOT EXISTS inquiry (id INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT NOT NULL, status TEXT NOT NULL DEFAULT \'uj\', ip_hash TEXT NOT NULL, created_at TEXT NOT NULL)');
        $this->db->exec('CREATE TABLE IF NOT EXISTS attempt (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, ip_hash TEXT NOT NULL, at INTEGER NOT NULL)');
        $this->db->exec('CREATE INDEX IF NOT EXISTS attempt_idx ON attempt (kind, ip_hash, at)');
    }

    /* ---------- telepítés ---------- */

    public function setPassword(string $plain): void
    {
        if (strlen($plain) < 12) throw new InvalidArgumentException('A jelszó legalább 12 karakter legyen.');
        $st = $this->db->prepare('INSERT INTO admin (id, hash, changed_at) VALUES (1, :h, :t) ON CONFLICT(id) DO UPDATE SET hash = :h, changed_at = :t');
        $st->execute([':h' => password_hash($plain, PASSWORD_DEFAULT), ':t' => gmdate('c')]);
    }

    public function hasPassword(): bool
    {
        return (bool) $this->db->query('SELECT 1 FROM admin WHERE id = 1')->fetchColumn();
    }

    /* ---------- kérés kiszolgálása ---------- */

    public function handle(): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $path = rtrim((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
        $path = preg_replace('#^.*?/api#', '', $path) ?: '/';

        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: same-origin');
        header('Cache-Control: no-store');

        try {
            if ($method === 'GET' && preg_match('#^/photo/([a-f0-9]{32})\.jpg$#', $path, $m)) { $this->servePhoto($m[1]); return; }
            if ($method === 'GET' && preg_match('#^/photo/([a-f0-9]{32})-800\.jpg$#', $path, $m)) { $this->servePhoto($m[1]); return; }

            $route = $method . ' ' . $path;
            // A látogató nem kap sütit: munkamenet csak belépéskor vagy meglévő admin-sütivel indul.
            if (isset($_COOKIE['kg_admin']) || $route === 'POST /login') $this->startSession();
            switch ($route) {
                case 'GET /health':     $this->json(['ok' => true, 'configured' => $this->hasPassword()]); return;
                case 'GET /state':      $this->getState(); return;
                case 'POST /inquiry':   $this->postInquiry(); return;
                case 'POST /login':     $this->login(); return;
                case 'GET /me':         $this->json(['admin' => $this->isAdmin(), 'csrf' => $this->isAdmin() ? $_SESSION['csrf'] : null]); return;
            }
            // innentől csak bejelentkezve, és módosításnál CSRF-jellel
            $this->requireAdmin($method !== 'GET');
            switch ($route) {
                case 'POST /logout':    $this->logout(); return;
                case 'PUT /state':      $this->putState(); return;
                case 'GET /versions':   $this->versions(); return;
                case 'POST /revert':    $this->revert(); return;
                case 'GET /inquiries':  $this->inquiries(); return;
                case 'POST /inquiry-status': $this->inquiryStatus(); return;
                case 'POST /photo':     $this->postPhoto(); return;
            }
            $this->fail(404, 'Nincs ilyen végpont.');
        } catch (HttpError $e) {
            $this->json(['error' => $e->getMessage()], $e->status);
        } catch (Throwable $e) {
            error_log('kg-api: ' . $e->getMessage());
            $this->json(['error' => 'Szerverhiba. A mentés nem történt meg.'], 500);
        }
    }

    /* ---------- munkamenet, jogosultság ---------- */

    private function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) return;
        $secure = (($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off') || getenv('KG_FORCE_SECURE') === '1';
        session_name('kg_admin');
        session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Strict']);
        session_start();
        // 2 óra tétlenség után kiléptet
        if (isset($_SESSION['seen']) && time() - $_SESSION['seen'] > 7200) { $_SESSION = []; session_regenerate_id(true); }
        $_SESSION['seen'] = time();
    }

    private function isAdmin(): bool { return ($_SESSION['admin'] ?? false) === true; }

    private function requireAdmin(bool $csrf): void
    {
        if (!$this->isAdmin()) $this->fail(401, 'Bejelentkezés szükséges.');
        if ($csrf) {
            $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
            if (!is_string($sent) || $sent === '' || !hash_equals((string) $_SESSION['csrf'], $sent)) $this->fail(403, 'Érvénytelen biztonsági jel. Töltse újra az oldalt.');
        }
    }

    private function login(): void
    {
        $ip = $this->ipHash();
        if ($this->countAttempts('login', $ip, 900) >= self::LOGIN_TRIES) $this->fail(429, 'Túl sok próbálkozás. Próbálja újra 15 perc múlva.');
        $in = $this->body();
        $pw = is_string($in['password'] ?? null) ? $in['password'] : '';
        $hash = $this->db->query('SELECT hash FROM admin WHERE id = 1')->fetchColumn();
        if (!$hash) $this->fail(503, 'A kezelőfelület nincs beállítva (nincs jelszó).');
        if (!password_verify($pw, (string) $hash)) {
            $this->addAttempt('login', $ip);
            usleep(300000);
            $this->fail(401, 'Hibás jelszó.');
        }
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        $this->json(['admin' => true, 'csrf' => $_SESSION['csrf']]);
    }

    private function logout(): void
    {
        $_SESSION = [];
        session_regenerate_id(true);
        $this->json(['admin' => false]);
    }

    /* ---------- állapot (árak, gyűrűk, szabályok) ---------- */

    private function latest(): ?array
    {
        $r = $this->db->query('SELECT version, body, saved_at FROM state_version ORDER BY version DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    private function getState(): void
    {
        $r = $this->latest();
        if (!$r) { $this->json(['version' => 0, 'state' => null, 'savedAt' => null]); return; }
        $state = json_decode($r['body'], true);
        // A látogató nem kaphat érdeklődőadatot, akkor sem, ha valaki az állapotba tette volna.
        if (!$this->isAdmin()) unset($state['inquiries']);
        $this->json(['version' => (int) $r['version'], 'state' => $state, 'savedAt' => $r['saved_at']]);
    }

    private function putState(): void
    {
        $raw = (string) file_get_contents('php://input');
        if (strlen($raw) > self::MAX_STATE) $this->fail(413, 'Túl nagy adat. A fényképeket külön kell feltölteni.');
        $in = json_decode($raw, true);
        if (!is_array($in) || !is_array($in['state'] ?? null)) $this->fail(400, 'Hibás adat.');
        $err = self::validateState($in['state']);
        if ($err) $this->fail(422, $err);
        unset($in['state']['inquiries']);
        $base = (int) ($in['baseVersion'] ?? -1);

        $this->db->beginTransaction();
        $cur = $this->latest();
        $curV = $cur ? (int) $cur['version'] : 0;
        if ($base !== $curV) { $this->db->rollBack(); $this->fail(409, 'Közben máshol is mentettek. Töltse újra az oldalt, mielőtt újra ment.'); }
        $st = $this->db->prepare('INSERT INTO state_version (body, note, saved_at) VALUES (?, ?, ?)');
        $st->execute([json_encode($in['state'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), mb_substr((string) ($in['note'] ?? ''), 0, 200), gmdate('c')]);
        $v = (int) $this->db->lastInsertId();
        // legfeljebb az utolsó 200 változat marad meg
        $this->db->exec('DELETE FROM state_version WHERE version <= ' . ($v - 200));
        $this->db->commit();
        $this->json(['version' => $v, 'savedAt' => gmdate('c')]);
    }

    /** Csak szerkezeti és értéktartomány-ellenőrzés. NEM szakmai jóváhagyás. */
    public static function validateState(array $s): ?string
    {
        foreach (['products', 'materials', 'settings'] as $k) if (!is_array($s[$k] ?? null)) return "Hiányzik: $k";
        if (count($s['products']) > 2000) return 'Túl sok termék.';
        $ids = [];
        foreach ($s['products'] as $p) {
            if (!is_array($p) || !is_string($p['id'] ?? null) || !preg_match('/^[a-z0-9-]{1,80}$/', $p['id'])) return 'Hibás termékazonosító.';
            if (isset($ids[$p['id']])) return 'Ismétlődő termékazonosító: ' . $p['id'];
            $ids[$p['id']] = 1;
            if (isset($p['img']) && is_string($p['img']) && str_starts_with($p['img'], 'data:')) return 'A képet külön kell feltölteni (' . $p['id'] . ').';
        }
        $sell = $s['materials']['sellPerGram'] ?? null;
        if (!is_array($sell)) return 'Hiányzik: grammárak';
        foreach ($sell as $m => $v) {
            if ($v === null) continue;
            if (!is_numeric($v) || $v <= 0 || $v > 10_000_000) return "Érvénytelen grammár: $m";
        }
        if (($sell['ti'] ?? null) !== null) return 'A titánnak nincs grammára – egyedi ajánlat.';
        foreach (($s['materials']['diamonds'] ?? []) as $d) {
            $pr = $d['price'] ?? null;
            if ($pr !== null && (!is_numeric($pr) || $pr <= 0 || $pr > 100_000_000)) return 'Érvénytelen gyémántár.';
        }
        return null;
    }

    private function versions(): void
    {
        $rows = $this->db->query('SELECT version, note, saved_at, length(body) AS bytes FROM state_version ORDER BY version DESC LIMIT 50')->fetchAll(PDO::FETCH_ASSOC);
        $this->json(['versions' => $rows]);
    }

    private function revert(): void
    {
        $in = $this->body();
        $st = $this->db->prepare('SELECT body FROM state_version WHERE version = ?');
        $st->execute([(int) ($in['version'] ?? 0)]);
        $body = $st->fetchColumn();
        if ($body === false) $this->fail(404, 'Nincs ilyen változat.');
        $ins = $this->db->prepare('INSERT INTO state_version (body, note, saved_at) VALUES (?, ?, ?)');
        $ins->execute([$body, 'Visszaállítva: ' . (int) $in['version'] . '. változat', gmdate('c')]);
        $this->json(['version' => (int) $this->db->lastInsertId()]);
    }

    /* ---------- érdeklődések ---------- */

    private function postInquiry(): void
    {
        $ip = $this->ipHash();
        $admin = $this->isAdmin();   // az ötvös telefonos érdeklődést is felírhat: rá nem vonatkozik a korlát
        if (!$admin && $this->countAttempts('inquiry', $ip, 3600) >= self::INQ_PER_HOUR) $this->fail(429, 'Túl sok üzenet rövid idő alatt. Kérjük, telefonáljon.');
        $in = $this->body();
        if (trim((string) ($in['website'] ?? '')) !== '') { $this->json(['ok' => true]); return; }   // csapdamező robotoknak
        $name = trim((string) ($in['name'] ?? ''));
        $email = trim((string) ($in['email'] ?? ''));
        $phone = trim((string) ($in['phone'] ?? ''));
        if ($name === '' || mb_strlen($name) > 120) $this->fail(422, 'Kérjük, adja meg a nevét.');
        if (!$admin && $email === '' && $phone === '') $this->fail(422, 'Kérjük, adjon meg e-mail-címet vagy telefonszámot.');
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) $this->fail(422, 'Az e-mail-cím hibásnak tűnik.');
        if ($phone !== '' && !preg_match('/^[0-9 +()\/-]{6,25}$/', $phone)) $this->fail(422, 'A telefonszám hibásnak tűnik.');
        $str = fn($k, $n) => mb_substr(trim((string) ($in[$k] ?? '')), 0, $n);
        $cfg = $in['config'] ?? null;
        $cfgJson = is_array($cfg) ? json_encode($cfg, JSON_UNESCAPED_UNICODE) : null;
        if ($cfgJson !== null && strlen($cfgJson) > 8000) $this->fail(413, 'Túl nagy beállítás.');
        $clean = [
            'name' => $name, 'email' => $email, 'phone' => $phone,
            'message' => $str('message', 4000),
            'type' => in_array($in['type'] ?? '', ['erdeklodes', 'ajanlat', 'idopont', 'egyedi', 'konzultacio', 'telefon'], true) ? $in['type'] : 'erdeklodes',
            'day' => $str('day', 60),
            'productId' => preg_match('/^[a-z0-9-]{1,80}$/', (string) ($in['productId'] ?? '')) ? $in['productId'] : null,
            'code' => $str('code', 60) ?: null,
            'summary' => $str('summary', 3000),
            'config' => $cfgJson !== null ? json_decode($cfgJson, true) : null,
            'estimate' => is_numeric($in['estimate'] ?? null) ? (int) $in['estimate'] : null,
            'images' => is_numeric($in['images'] ?? null) ? max(0, min(20, (int) $in['images'])) : 0,
        ];
        $status = 'uj';
        if ($admin) {
            if (in_array($in['status'] ?? '', self::INQ_STATUS, true)) $status = $in['status'];
            if (is_numeric($in['lockedPrice'] ?? null)) { $clean['lockedPrice'] = (int) $in['lockedPrice']; $clean['lockedAt'] = gmdate('c'); }
        }
        $st = $this->db->prepare('INSERT INTO inquiry (body, status, ip_hash, created_at) VALUES (?, ?, ?, ?)');
        $st->execute([json_encode($clean, JSON_UNESCAPED_UNICODE), $status, $ip, gmdate('c')]);
        $this->addAttempt('inquiry', $ip);
        // E-mail-értesítés szándékosan nincs: levélküldést csak ügyféljóváhagyás és kipróbálás után kapcsolunk be.
        $this->json(['ok' => true, 'id' => (int) $this->db->lastInsertId()], 201);
    }

    private function inquiries(): void
    {
        $rows = $this->db->query('SELECT id, body, status, created_at FROM inquiry ORDER BY id DESC LIMIT 500')->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $b = json_decode($r['body'], true);
            $r = ['id' => 's' . $r['id'], 'status' => $r['status'], 'at' => $r['created_at']] + $b;
        }
        $this->json(['inquiries' => $rows]);
    }

    private function inquiryStatus(): void
    {
        $in = $this->body();
        $status = (string) ($in['status'] ?? '');
        if (!in_array($status, self::INQ_STATUS, true)) $this->fail(422, 'Ismeretlen állapot.');
        $id = (int) preg_replace('/^s/', '', (string) ($in['id'] ?? '0'));
        $st = $this->db->prepare('SELECT body FROM inquiry WHERE id = ?');
        $st->execute([$id]);
        $body = $st->fetchColumn();
        if ($body === false) $this->fail(404, 'Nincs ilyen érdeklődés.');
        $b = json_decode((string) $body, true);
        // Elfogadáskor az ár rögzül: később az árváltozás nem írja felül
        if (is_numeric($in['lockedPrice'] ?? null)) { $b['lockedPrice'] = (int) $in['lockedPrice']; $b['lockedAt'] = gmdate('c'); }
        $up = $this->db->prepare('UPDATE inquiry SET status = ?, body = ? WHERE id = ?');
        $up->execute([$status, json_encode($b, JSON_UNESCAPED_UNICODE), $id]);
        $this->json(['ok' => true]);
    }

    /* ---------- fényképek ---------- */

    private function postPhoto(): void
    {
        $f = $_FILES['photo'] ?? null;
        if (!is_array($f) || ($f['error'] ?? 1) !== UPLOAD_ERR_OK) $this->fail(400, 'A feltöltés nem sikerült.');
        if ($f['size'] > self::MAX_PHOTO) $this->fail(413, 'A kép túl nagy (legfeljebb 8 MB).');
        $info = @getimagesize($f['tmp_name']);
        if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) $this->fail(415, 'Csak JPG, PNG vagy WebP kép tölthető fel.');
        if ($info[0] * $info[1] > 40_000_000) $this->fail(413, 'A kép felbontása túl nagy.');
        $src = match ($info[2]) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($f['tmp_name']),
            IMAGETYPE_PNG => @imagecreatefrompng($f['tmp_name']),
            IMAGETYPE_WEBP => @imagecreatefromwebp($f['tmp_name']),
        };
        if (!$src) $this->fail(415, 'A kép nem olvasható.');
        // Mindig újrakódoljuk: így a fájlba rejtett bármi más elvész, és az EXIF (pl. helyadat) is.
        [$w, $h] = [$info[0], $info[1]];
        $max = 2400; $k = min(1, $max / max($w, $h));
        $nw = max(1, (int) round($w * $k)); $nh = max(1, (int) round($h * $k));
        $dst = imagecreatetruecolor($nw, $nh);
        imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255));
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        $name = bin2hex(random_bytes(16));
        if (!imagejpeg($dst, $this->data . '/photos/' . $name . '.jpg', 88)) $this->fail(500, 'A kép mentése nem sikerült.');
        $this->json(['ok' => true, 'url' => 'api/photo/' . $name . '.jpg', 'width' => $nw, 'height' => $nh], 201);
    }

    private function servePhoto(string $name): void
    {
        $file = $this->data . '/photos/' . $name . '.jpg';
        if (!is_file($file)) { http_response_code(404); return; }
        header('Content-Type: image/jpeg');
        header('Cache-Control: public, max-age=31536000, immutable');
        header('Content-Length: ' . filesize($file));
        readfile($file);
    }

    /* ---------- segédek ---------- */

    private function ipHash(): string
    {
        // Az IP-címet nem tároljuk, csak a napi sóval képzett lenyomatát (korlátozáshoz elég).
        return hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '?') . '|' . gmdate('Y-m-d') . '|' . $this->salt());
    }

    private function salt(): string
    {
        $f = $this->data . '/salt';
        if (!is_file($f)) { file_put_contents($f, bin2hex(random_bytes(32))); chmod($f, 0600); }
        return (string) file_get_contents($f);
    }

    private function countAttempts(string $kind, string $ip, int $window): int
    {
        $this->db->prepare('DELETE FROM attempt WHERE at < ?')->execute([time() - 86400]);
        $st = $this->db->prepare('SELECT COUNT(*) FROM attempt WHERE kind = ? AND ip_hash = ? AND at > ?');
        $st->execute([$kind, $ip, time() - $window]);
        return (int) $st->fetchColumn();
    }

    private function addAttempt(string $kind, string $ip): void
    {
        $this->db->prepare('INSERT INTO attempt (kind, ip_hash, at) VALUES (?, ?, ?)')->execute([$kind, $ip, time()]);
    }

    private function body(): array
    {
        $raw = (string) file_get_contents('php://input');
        if (strlen($raw) > 100_000) $this->fail(413, 'Túl hosszú üzenet.');
        $in = json_decode($raw, true);
        if (!is_array($in)) $this->fail(400, 'Hibás adat.');
        return $in;
    }

    private function json(array $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /** @return never */
    private function fail(int $status, string $msg): void { throw new HttpError($msg, $status); }
}

final class HttpError extends RuntimeException
{
    public function __construct(string $m, public int $status) { parent::__construct($m); }
}
