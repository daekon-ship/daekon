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
    // V5.9: 'hivando' = visszahívásra vár (a „Felhívom” gomb nem jelenti, hogy sikerült beszélni)
    private const INQ_STATUS = ['uj', 'hivando', 'visszahivva', 'elfogadva', 'lezarva'];
    private const INQ_MAX_IMAGES = 3;
    private const INQ_MAX_IMAGE_BYTES = 8_000_000;

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
        // V5.4: e-mail-értesítés állapota érdeklődésenként (off | fajlba | elkuldve | hiba)
        $cols = array_column($this->db->query('PRAGMA table_info(inquiry)')->fetchAll(PDO::FETCH_ASSOC), 'name');
        if (!in_array('notify', $cols, true)) $this->db->exec("ALTER TABLE inquiry ADD COLUMN notify TEXT NOT NULL DEFAULT ''");
    }

    /* ---------- telepítés ---------- */

    public function setPassword(string $plain): void
    {
        if (strlen($plain) < 12) throw new InvalidArgumentException('A jelszó legalább 12 karakter legyen.');
        $st = $this->db->prepare('INSERT INTO admin (id, hash, changed_at) VALUES (1, :h, :t) ON CONFLICT(id) DO UPDATE SET hash = :h, changed_at = :t');
        $st->execute([':h' => password_hash($plain, PASSWORD_DEFAULT), ':t' => gmdate('c')]);
    }

    /** Bemutató mintaadat – csak üres adatbázisba, csak „demo” jelöléssel (bin/demo-seed.php). */
    public function seedDemo(array $state): void
    {
        if (($state['demo'] ?? false) !== true) throw new InvalidArgumentException('Nem bemutató állapot.');
        if ((int) $this->db->query('SELECT COUNT(*) FROM state_version')->fetchColumn() > 0) throw new RuntimeException('Az adatbázisban már van mentett adat – bemutató csak üres, külön adatmappába tölthető.');
        $err = self::validateState($state);
        if ($err) throw new InvalidArgumentException($err);
        unset($state['inquiries']);
        $this->db->prepare('INSERT INTO state_version (body, note, saved_at) VALUES (?, ?, ?)')
            ->execute([json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), 'Bemutató mintaadat', gmdate('c')]);
    }

    /** Bemutató módban fut-e (a demo/kapu.php állítja be). */
    public static function demoMode(): bool { return getenv('KG_DEMO') === '1'; }

    /** Az adatbázis legutóbbi állapota bemutató-jelölésű-e (üres adatbázisnál: false). */
    public function isDemoData(): bool
    {
        $r = $this->latest();
        if (!$r) return false;
        $s = json_decode($r['body'], true);
        return is_array($s) && ($s['demo'] ?? false) === true;
    }

    /**
     * Bemutató visszaállítása a kiinduló mintaadatra (bin/demo-reset.php). Csak bemutató-adatbázison fut:
     * éles (nem „demo” jelölésű) adatbázist soha nem töröl. Törli a változatokat, érdeklődéseket, csatolt és feltöltött képeket.
     * Az admin jelszó és a bemutató belépési jelszava megmarad.
     */
    public function resetDemo(array $state): void
    {
        $this->guardWrite(false);
        if (($state['demo'] ?? false) !== true) throw new InvalidArgumentException('Nem bemutató állapot.');
        $empty = (int) $this->db->query('SELECT COUNT(*) FROM state_version')->fetchColumn() === 0;
        if (!$empty && !$this->isDemoData()) throw new RuntimeException('Ez nem bemutató-adatbázis – a visszaállítás nem fut le.');
        $this->db->exec('DELETE FROM state_version'); $this->db->exec('DELETE FROM inquiry'); $this->db->exec('DELETE FROM attempt');
        $this->db->exec("DELETE FROM sqlite_sequence WHERE name IN ('state_version', 'inquiry')");
        foreach (glob($this->data . '/photos/*') ?: [] as $f) if (is_file($f)) unlink($f);
        $this->removeDir($this->data . '/inquiry-files');
        $this->removeDir($this->data . '/outbox');
        $this->seedDemo($state);
    }

    /** Bemutató-kapu: hibás jelszavak száma (IP-lenyomatonként, 15 perc). */
    public function gateLocked(): bool { return $this->countAttempts('demo-kapu', $this->ipHash(), 900) >= self::LOGIN_TRIES; }
    public function gateFailed(): void { $this->addAttempt('demo-kapu', $this->ipHash()); }

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
                case 'GET /mail-status': $this->json(['mail' => (new Mailer($this->data))->status()]); return;
                case 'POST /mail-test': $this->mailTest(); return;
                case 'POST /inquiry-delete': $this->deleteInquiry(); return;
            }
            if ($method === 'GET' && preg_match('#^/inquiry-file/s?(\d+)/([a-f0-9]{32}\.jpg)$#', $path, $m)) { $this->serveInquiryFile((int) $m[1], $m[2]); return; }
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
        // A látogató csak a nyilvános weboldalhoz szükséges, jóváhagyott adatokat kapja; az admin a teljes állapotot.
        if (!$this->isAdmin()) $state = self::publicState($state);
        // V5.9: a fejlesztői nyilvántartás (ügyféldöntések) a tulajdonosi kezelőfelületnek sem megy ki – csak a szerveren, CLI-ből érhető el.
        unset($state['clientDecisions']);
        $this->json(['version' => (int) $r['version'], 'state' => $state, 'savedAt' => $this->isAdmin() ? $r['saved_at'] : null]);
    }

    private function putState(): void
    {
        $this->guardWrite();
        $raw = (string) file_get_contents('php://input');
        if (strlen($raw) > self::MAX_STATE) $this->fail(413, 'Túl nagy adat. A fényképeket külön kell feltölteni.');
        $in = json_decode($raw, true);
        if (!is_array($in) || !is_array($in['state'] ?? null)) $this->fail(400, 'Hibás adat.');
        if (!empty($in['state']['public'])) $this->fail(422, 'A nyilvános nézet nem menthető vissza – töltse újra a kezelőfelületet.');
        // V5.6: bemutató és éles adat nem keveredhet. Bemutató módban (KG_DEMO=1) minden mentés bemutató-jelölést kap;
        // éles módban bemutató-jelölésű adat nem menthető (így a mintaadat észrevétlenül sem kerülhet élesbe).
        if (self::demoMode()) $in['state']['demo'] = true;
        elseif (($in['state']['demo'] ?? false) === true) $this->fail(422, 'Bemutató (minta)adat éles rendszerbe nem menthető.');
        $err = self::validateState($in['state']);
        if ($err) $this->fail(422, $err);
        unset($in['state']['inquiries']);
        $base = (int) ($in['baseVersion'] ?? -1);

        $this->db->beginTransaction();
        $cur = $this->latest();
        $curV = $cur ? (int) $cur['version'] : 0;
        if ($base !== $curV) { $this->db->rollBack(); $this->fail(409, 'Közben máshol is mentettek. Töltse újra az oldalt, mielőtt újra ment.'); }
        if ($cur) {
            $prev = json_decode((string) $cur['body'], true) ?: [];
            // V5.9: teljes adatállapot felülírása (gyűrűk eltűnése, a korábbi árak törlése) a kezelőfelületről vagy közvetlen API-hívással sem lehetséges
            $bad = self::destructiveChange($prev, $in['state']);
            if ($bad) { $this->db->rollBack(); $this->fail(422, $bad); }
            // a fejlesztői nyilvántartást a tulajdonosi mentés nem látja és nem írhatja felül: a meglévő marad
            $in['state']['clientDecisions'] = (isset($prev['clientDecisions']) && is_array($prev['clientDecisions']) && $prev['clientDecisions']) ? $prev['clientDecisions'] : new \stdClass();
        } else {
            $in['state']['clientDecisions'] = new \stdClass();
        }
        $st = $this->db->prepare('INSERT INTO state_version (body, note, saved_at) VALUES (?, ?, ?)');
        $st->execute([json_encode($in['state'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), mb_substr((string) ($in['note'] ?? ''), 0, 200), gmdate('c')]);
        $v = (int) $this->db->lastInsertId();
        // legfeljebb az utolsó 200 változat marad meg
        $this->db->exec('DELETE FROM state_version WHERE version <= ' . ($v - 200));
        $this->db->commit();
        $this->json(['version' => $v, 'savedAt' => gmdate('c')]);
    }

    /**
     * V5.9 – romboló mentés felismerése (a kezelőfelület „alapállapot” gombja vagy közvetlen API-hívás ellen).
     * Szabályok: meglévő gyűrű nem tűnhet el; egyszerre legfeljebb egy műhelymunka törölhető;
     * a korábbi árak (előzmények) nem tűnhetnek el – a legutóbbi bejegyzésnek az új mentésben is benne kell lennie.
     * Visszaad: hibaüzenet vagy null.
     */
    public static function destructiveChange(array $prev, array $next): ?string
    {
        $ids = fn($a) => array_values(array_filter(array_map(fn($x) => is_array($x) ? ($x['id'] ?? null) : null, is_array($a) ? $a : []), 'is_string'));
        $lostP = array_diff($ids($prev['products'] ?? []), $ids($next['products'] ?? []));
        if ($lostP) return 'Ez a mentés ' . count($lostP) . ' gyűrűt törölne. Gyűrű a kezelőfelületről nem törölhető, a teljes adatállapot visszaállítása pedig csak fejlesztői művelet. Semmi nem változott.';
        $lostW = array_diff($ids($prev['works'] ?? []), $ids($next['works'] ?? []));
        if (count($lostW) > 1) return 'Ez a mentés egyszerre ' . count($lostW) . ' műhelymunkát törölne. Egyszerre csak egy törölhető. Semmi nem változott.';
        $ph = $prev['history'] ?? [];
        if (is_array($ph) && $ph && is_array($ph[0] ?? null) && isset($ph[0]['id'])) {
            if (!in_array($ph[0]['id'], $ids($next['history'] ?? []), true)) return 'Ez a mentés törölné a korábbi árakat és változásokat. Ez nem lehetséges – töltse újra az oldalt. Semmi nem változott.';
        }
        return null;
    }

    /**
     * V5.9 – fejlesztői nyilvántartás (ügyféldöntések) módosítása: CSAK parancssorból (bin/fejlesztoi-dontesek.php).
     * Új változatot ment a legutóbbi állapotból, csak a clientDecisions mezőt módosítva.
     */
    public function setDecision(string $id, string $status, string $answer): int
    {
        if (!preg_match('/^[a-z0-9-]{1,40}$/', $id)) throw new RuntimeException('Hibás tétel-azonosító.');
        if (!in_array($status, ['nyitott', 'valasz', 'atvezetve'], true)) throw new RuntimeException('Az állapot: nyitott, valasz vagy atvezetve.');
        $answer = trim($answer);
        if (mb_strlen($answer) > 2000) throw new RuntimeException('Túl hosszú válasz.');
        if ($status !== 'nyitott' && $answer === '') throw new RuntimeException('Válasz nélkül csak „nyitott” állapot adható.');
        $this->guardWrite(false);
        $this->db->beginTransaction();
        $cur = $this->latest();
        if (!$cur) { $this->db->rollBack(); throw new RuntimeException('Még nincs mentett állapot.'); }
        $s = json_decode((string) $cur['body'], true) ?: [];
        $d = is_array($s['clientDecisions'] ?? null) ? $s['clientDecisions'] : [];
        $d[$id] = ['status' => $status, 'answer' => $answer, 'at' => gmdate('c')];
        $s['clientDecisions'] = $d;
        $st = $this->db->prepare('INSERT INTO state_version (body, note, saved_at) VALUES (?, ?, ?)');
        $st->execute([json_encode($s, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), "Fejlesztői nyilvántartás: $id", gmdate('c')]);
        $v = (int) $this->db->lastInsertId();
        $this->db->commit();
        return $v;
    }

    /** A fejlesztői nyilvántartás a legutóbbi állapotból (csak CLI). */
    public function decisions(): array
    {
        $cur = $this->latest();
        $s = $cur ? (json_decode((string) $cur['body'], true) ?: []) : [];
        return is_array($s['clientDecisions'] ?? null) ? $s['clientDecisions'] : [];
    }

    private const PUB_PRODUCT = ['id', 'code', 'name', 'real', 'img', 'priceOnRequest', 'imgFill', 'unknownColor', 'kind', 'baseColor',
        'colors', 'metals', 'metalNotes', 'style', 'visible', 'sites', 'widths', 'stoneOptional', 'fixedWeight', 'approved', 'opts', 'consult', 'added'];
    private const PUB_RING = ['label', 'refSize', 'refWidth', 'share', 'weight', 'weights', 'other', 'stoneRule', 'thickness', 'sizeMin', 'sizeMax'];
    /** A nyilvános oldal által használt beállítások. Felár, anyagveszteség, munkadíj-szorzó, árrés-küszöb NEM megy ki. */
    private const PUB_SETTINGS = ['pricingMode', 'sizeMethod', 'density', 'stonesGross', 'settingPerStone', 'engravingPrice', 'boxCost', 'certCost',
        'roundTo', 'vatPct', 'stoneEdgeMm', 'stoneGapMm', 'showDemoMarks'];

    /**
     * Nyilvános nézet a látogatóknak. Kimarad: beszerzési referenciaárak, felárak, anyagveszteség, munkadíj, árnapló,
     * érdeklődések, megjegyzések, rejtett gyűrűk, 3D-forrásadatok, a nem jóváhagyott árelemek értéke és minden
     * jóváhagyási címke (a jóváhagyott elemek „jovahagyott” jelet kapnak, mert a böngésző ebből tudja, mit számolhat).
     * Költségalapú módban nincs nyilvános grammár: minden ár egyedi ajánlat.
     */
    public static function publicState(array $s): array
    {
        $ok = fn($v) => $v === 'jovahagyott';
        $m = $s['materials'] ?? []; $set = $s['settings'] ?? [];
        $gramm = ($set['pricingMode'] ?? 'gramm') === 'gramm';
        $msrc = $m['src'] ?? [];
        $sell = []; $pmsrc = [];
        foreach (($m['sellPerGram'] ?? []) as $metal => $v) {
            $approved = $gramm && $metal !== 'ti' && $ok($msrc["sellPerGram.$metal"] ?? null) && is_numeric($v);
            $sell[$metal] = $approved ? $v : null;
            if ($approved) $pmsrc["sellPerGram.$metal"] = 'jovahagyott';
        }
        $dia = [];
        foreach (($m['diamonds'] ?? []) as $d) {
            if (!is_array($d)) continue;
            $a = $ok($d['src'] ?? null) && is_numeric($d['price'] ?? null);
            $x = ['id' => $d['id'] ?? null, 'ct' => $d['ct'] ?? null, 'mm' => $d['mm'] ?? null, 'name' => $d['name'] ?? null, 'quality' => $d['quality'] ?? null, 'price' => $a ? $d['price'] : null];
            if ($a) $x['src'] = 'jovahagyott';
            $dia[] = $x;
        }
        $ssrc = $set['src'] ?? []; $pset = []; $pssrc = [];
        foreach (self::PUB_SETTINGS as $k) {
            if (!array_key_exists($k, $set)) continue;
            $pset[$k] = $set[$k];
            if ($ok($ssrc[$k] ?? null)) $pssrc[$k] = 'jovahagyott';
        }
        $pset['src'] = (object) $pssrc;
        $prods = []; $approvedIds = [];
        foreach (($s['products'] ?? []) as $p) {
            if (!is_array($p) || ($p['visible'] ?? true) === false) continue;
            $q = array_intersect_key($p, array_flip(self::PUB_PRODUCT));
            $q['approved'] = ($p['approved'] ?? false) === true;
            // Egyedi ár, minimumár csak jóváhagyott gyűrűnél
            if ($q['approved']) { if (isset($p['override'])) $q['override'] = $p['override']; if (isset($p['minPrice'])) $q['minPrice'] = $p['minPrice']; }
            $q['rings'] = array_map(fn($r) => is_array($r) ? array_intersect_key($r, array_flip(self::PUB_RING)) : $r, $p['rings'] ?? []);
            if ($q['approved']) $approvedIds[$p['id']] = true;
            $prods[] = $q;
        }
        // „Frissült ár” jelzés: csak a jóváhagyott gyűrűk régi ára
        $lc = null;
        if (is_array($s['lastChange'] ?? null) && is_array($s['lastChange']['old'] ?? null)) {
            $old = array_intersect_key($s['lastChange']['old'], $approvedIds);
            if ($old) $lc = ['at' => $s['lastChange']['at'] ?? null, 'old' => $old];
        }
        $out = [
            'v' => $s['v'] ?? null,
            'materials' => ['sellPerGram' => (object) $sell, 'diamonds' => $dia, 'src' => (object) $pmsrc],
            'settings' => $pset,
            'products' => $prods,
            'works' => array_values(array_map(static fn ($w) => [
                'id' => (string) $w['id'], 'title' => (string) ($w['title'] ?? ''), 'text' => (string) ($w['text'] ?? ''),
                'photos' => array_values(array_filter((array) ($w['photos'] ?? []), 'is_string')), 'video' => (string) ($w['video'] ?? ''),
            ], array_filter((array) ($s['works'] ?? []), static fn ($w) => is_array($w) && ($w['visible'] ?? true) !== false))),
            'lastChange' => $lc,
            'public' => true,
        ];
        if (($s['demo'] ?? false) === true) $out['demo'] = true; // csak a bemutató példányon
        return $out;
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
        // V5.6: egyedi műhelymunkák – cikkszám és ár nélkül; több fotó (feltöltve), opcionális videólink (https)
        if (isset($s['works'])) {
            if (!is_array($s['works']) || count($s['works']) > 300) return 'Hibás műhelymunka-lista.';
            foreach ($s['works'] as $w) {
                if (!is_array($w) || !is_string($w['id'] ?? null) || !preg_match('/^[a-z0-9-]{1,80}$/', $w['id'])) return 'Hibás műhelymunka-azonosító.';
                if (!is_string($w['title'] ?? null) || trim($w['title']) === '' || mb_strlen($w['title']) > 160) return 'A műhelymunkának cím kell (legfeljebb 160 karakter).';
                if (isset($w['text']) && (!is_string($w['text']) || mb_strlen($w['text']) > 4000)) return 'Túl hosszú leírás.';
                foreach (($w['photos'] ?? []) as $ph) if (!is_string($ph) || str_starts_with($ph, 'data:') || count($w['photos']) > 12) return 'A műhelymunka képeit külön kell feltölteni (legfeljebb 12).';
                $v = $w['video'] ?? '';
                if ($v !== '' && $v !== null && (!is_string($v) || !preg_match('#^https://[^\s"<>]{4,500}$#', $v))) return 'A videó linkje https:// kezdetű webcím legyen.';
            }
        }
        // V5.8: ügyféljóváhagyási központ – csak rögzített válaszok; a nyilvános nézet (publicState) nem adja ki
        if (isset($s['clientDecisions'])) {
            if (!is_array($s['clientDecisions']) || count($s['clientDecisions']) > 200) return 'Hibás ügyféldöntés-lista.';
            foreach ($s['clientDecisions'] as $k => $d) {
                if (!is_string($k) || !preg_match('/^[a-z0-9-]{1,40}$/', $k) || !is_array($d)) return 'Hibás ügyféldöntés.';
                if (!in_array($d['status'] ?? null, ['nyitott', 'valasz', 'atvezetve'], true)) return 'Hibás ügyféldöntés-állapot.';
                if (!is_string($d['answer'] ?? '') || mb_strlen((string) ($d['answer'] ?? '')) > 2000) return 'Túl hosszú ügyféldöntés-válasz.';
                if (($d['status'] ?? '') !== 'nyitott' && trim((string) ($d['answer'] ?? '')) === '') return 'Válasz nélkül nem rögzíthető döntés.';
            }
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

    /** Teljes állapot-változat visszaállítása. V5.9: csak fejlesztői művelet – a szerveren KG_FEJLESZTOI_VISSZAALLITAS=1 kell hozzá.
        A tulajdonos a kezelőfelületen az egyes árváltozásokat állíthatja vissza (az új mentésként naplózódik). */
    private function revert(): void
    {
        if (getenv('KG_FEJLESZTOI_VISSZAALLITAS') !== '1') $this->fail(403, 'Teljes állapot visszaállítása csak fejlesztői művelet. Az egyes árváltozások az „Árak → Korábbi árak” oldalon állíthatók vissza.');
        $this->guardWrite();
        $in = $this->body();
        $st = $this->db->prepare('SELECT body FROM state_version WHERE version = ?');
        $st->execute([(int) ($in['version'] ?? 0)]);
        $body = $st->fetchColumn();
        if ($body === false) $this->fail(404, 'Nincs ilyen változat.');
        // a fejlesztői nyilvántartás a legutóbbi állapotból marad meg (a régi változat nem írja felül)
        $old = json_decode((string) $body, true) ?: [];
        $curB = $this->latest();
        $cd = $curB ? ((json_decode((string) $curB['body'], true) ?: [])['clientDecisions'] ?? null) : null;
        if (is_array($cd) && $cd) $old['clientDecisions'] = $cd;
        $body = json_encode($old, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $ins = $this->db->prepare('INSERT INTO state_version (body, note, saved_at) VALUES (?, ?, ?)');
        $ins->execute([$body, 'Visszaállítva: ' . (int) $in['version'] . '. változat', gmdate('c')]);
        $this->json(['version' => (int) $this->db->lastInsertId()]);
    }

    /* ---------- érdeklődések ---------- */

    private function postInquiry(): void
    {
        $this->guardWrite();
        $ip = $this->ipHash();
        $admin = $this->isAdmin();   // az ötvös telefonos érdeklődést is felírhat: rá nem vonatkozik a korlát
        if (!$admin && $this->countAttempts('inquiry', $ip, 3600) >= self::INQ_PER_HOUR) $this->fail(429, 'Túl sok üzenet rövid idő alatt. Kérjük, telefonáljon.');
        // Referenciaképekkel együtt multipart kérés jön (payload = JSON, images[] = fájlok), egyébként JSON.
        $multipart = str_contains(strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? '')), 'multipart/form-data');
        if ($multipart) {
            if (!isset($_POST['payload'])) $this->fail(413, 'A képek együtt túl nagyok, vagy a feltöltés megszakadt. Legfeljebb 3 kép, egyenként 8 MB.');
            if (strlen((string) $_POST['payload']) > 100_000) $this->fail(413, 'Túl hosszú üzenet.');
            $in = json_decode((string) $_POST['payload'], true);
            if (!is_array($in)) $this->fail(400, 'Hibás adat.');
        } else $in = $this->body();
        if (trim((string) ($in['website'] ?? '')) !== '') { $this->json(['ok' => true]); return; }   // csapdamező robotoknak
        // A képeket MÉG a mentés előtt ellenőrizzük és újrakódoljuk: hibás kép esetén semmi nem mentődik, és a látogató megtudja, miért.
        $images = $multipart ? $this->readInquiryImages() : [];
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
        $clean['images'] = count($images);
        $status = 'uj';
        if ($admin) {
            if (in_array($in['status'] ?? '', self::INQ_STATUS, true)) $status = $in['status'];
            if (is_numeric($in['lockedPrice'] ?? null)) { $clean['lockedPrice'] = (int) $in['lockedPrice']; $clean['lockedAt'] = gmdate('c'); }
        }
        $this->db->beginTransaction();
        $st = $this->db->prepare('INSERT INTO inquiry (body, status, ip_hash, created_at) VALUES (?, ?, ?, ?)');
        $st->execute([json_encode($clean, JSON_UNESCAPED_UNICODE), $status, $ip, gmdate('c')]);
        $id = (int) $this->db->lastInsertId();
        if ($images) {
            // Privát tárolás: az adatmappában (webgyökéren kívül), érdeklődésenként külön mappában, véletlen néven
            $dir = $this->data . '/inquiry-files/' . $id;
            $files = [];
            try {
                if (!is_dir($dir) && !mkdir($dir, 0700, true)) throw new RuntimeException('mkdir');
                foreach ($images as $img) {
                    $nm = bin2hex(random_bytes(16)) . '.jpg';
                    if (file_put_contents($dir . '/' . $nm, $img['jpeg']) === false) throw new RuntimeException('write');
                    $files[] = ['file' => $nm, 'w' => $img['w'], 'h' => $img['h'], 'bytes' => strlen($img['jpeg']), 'orig' => $img['orig']];
                }
                $clean['files'] = $files;
                $this->db->prepare('UPDATE inquiry SET body = ? WHERE id = ?')->execute([json_encode($clean, JSON_UNESCAPED_UNICODE), $id]);
                $this->db->commit();
            } catch (Throwable $e) {
                $this->db->rollBack();
                $this->removeDir($dir);
                error_log('kg-api: referenciakép mentése sikertelen: ' . $e->getMessage());
                $this->fail(500, 'A képek mentése nem sikerült, ezért az üzenet sem ment el. Próbáld újra kép nélkül, vagy hívj minket.');
            }
        } else $this->db->commit();
        $this->addAttempt('inquiry', $ip);
        // Az érdeklődés már el van mentve. Az értesítés ezután megy; ha nem sikerül, az érdeklődés megmarad,
        // csak az állapota mutatja a hibát (a látogató sikeres visszajelzést kap, mert az üzenete megérkezett).
        $notify = 'off';
        if (!$admin) {
            [$subj, $text] = Mailer::inquiryText($id, $clean, (string) (getenv('KG_SITE_URL') ?: ''));
            if (!getenv('KG_SITE_URL')) $text = str_replace('A részletek (beállítások, becsült ár) a kezelőfelületen: ', 'A részletek (beállítások, becsült ár) a kezelőfelület Érdeklődések menüjében.', $text);
            $r = (new Mailer($this->data))->send($subj, $text);
            $notify = $r['status'];
            if ($r['status'] === 'hiba') error_log('kg-api: értesítő levél nem ment el (#' . $id . '): ' . $r['error']);
        }
        $this->db->prepare('UPDATE inquiry SET notify = ? WHERE id = ?')->execute([$notify, $id]);
        $this->json(['ok' => true, 'id' => $id], 201);
    }

    private function inquiries(): void
    {
        $rows = $this->db->query('SELECT id, body, status, notify, created_at FROM inquiry ORDER BY id DESC LIMIT 500')->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $b = json_decode($r['body'], true);
            $r = ['id' => 's' . $r['id'], 'status' => $r['status'], 'notify' => $r['notify'], 'at' => $r['created_at']] + $b;
        }
        $this->json(['inquiries' => $rows]);
    }

    private function inquiryStatus(): void
    {
        $this->guardWrite();
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

    /** Referenciaképek ellenőrzése és újrakódolása (JPEG, max. 2000 px, EXIF nélkül). Hibánál 4xx, semmi nem mentődik. */
    private function readInquiryImages(): array
    {
        $f = $_FILES['images'] ?? null;
        if (!$f) return [];
        $n = is_array($f['name']) ? count($f['name']) : 1;
        $get = fn($k, $i) => is_array($f[$k]) ? $f[$k][$i] : $f[$k];
        if ($n > self::INQ_MAX_IMAGES) $this->fail(422, 'Legfeljebb ' . self::INQ_MAX_IMAGES . ' kép csatolható.');
        $out = [];
        for ($i = 0; $i < $n; $i++) {
            $orig = mb_substr((string) preg_replace('/[^\p{L}\p{N} ._-]+/u', '', (string) $get('name', $i)), 0, 60) ?: 'kep';
            $err = (int) $get('error', $i);
            if ($err === UPLOAD_ERR_NO_FILE) continue;
            if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE || (int) $get('size', $i) > self::INQ_MAX_IMAGE_BYTES) $this->fail(413, "A(z) „{$orig}” kép túl nagy (legfeljebb 8 MB).");
            if ($err !== UPLOAD_ERR_OK) $this->fail(400, "A(z) „{$orig}” kép feltöltése megszakadt. Próbáld újra.");
            $tmp = (string) $get('tmp_name', $i);
            $info = @getimagesize($tmp);
            if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) $this->fail(415, "A(z) „{$orig}” nem JPG, PNG vagy WebP kép.");
            if ($info[0] * $info[1] > 40_000_000) $this->fail(413, "A(z) „{$orig}” felbontása túl nagy.");
            $src = match ($info[2]) { IMAGETYPE_JPEG => @imagecreatefromjpeg($tmp), IMAGETYPE_PNG => @imagecreatefrompng($tmp), IMAGETYPE_WEBP => @imagecreatefromwebp($tmp) };
            if (!$src) $this->fail(415, "A(z) „{$orig}” kép nem olvasható.");
            [$w, $h] = [$info[0], $info[1]];
            $k = min(1, 2000 / max($w, $h));
            $nw = max(1, (int) round($w * $k)); $nh = max(1, (int) round($h * $k));
            $dst = imagecreatetruecolor($nw, $nh);
            imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255));
            imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
            ob_start(); imagejpeg($dst, null, 85); $jpeg = (string) ob_get_clean();
            $out[] = ['jpeg' => $jpeg, 'w' => $nw, 'h' => $nh, 'orig' => $orig];
        }
        return $out;
    }

    /** Referenciakép megtekintése – csak bejelentkezett adminnak, gyorsítótárazás nélkül. */
    private function serveInquiryFile(int $id, string $name): void
    {
        $file = $this->data . '/inquiry-files/' . $id . '/' . $name;
        if (!is_file($file)) $this->fail(404, 'Nincs ilyen kép.');
        header('Content-Type: image/jpeg');
        header('Cache-Control: private, no-store');
        header('Content-Disposition: inline');
        header('Content-Length: ' . filesize($file));
        readfile($file);
    }

    /** Érdeklődés végleges törlése a csatolt képekkel együtt (adatkezelési kérésre, megőrzési idő lejártakor). */
    private function deleteInquiry(): void
    {
        $this->guardWrite();
        $in = $this->body();
        $id = (int) preg_replace('/^s/', '', (string) ($in['id'] ?? '0'));
        $st = $this->db->prepare('DELETE FROM inquiry WHERE id = ?');
        $st->execute([$id]);
        if ($st->rowCount() === 0) $this->fail(404, 'Nincs ilyen érdeklődés.');
        $this->removeDir($this->data . '/inquiry-files/' . $id);
        $this->json(['ok' => true]);
    }

    /** Megőrzési idő: a megadott napnál régebbi érdeklődések törlése (bin/purge.php hívja). Visszatér: törölt darab. */
    public function purgeInquiries(int $days, bool $onlyClosed = true): int
    {
        $this->guardWrite(false);
        $cut = gmdate('c', time() - $days * 86400);
        $sql = 'SELECT id FROM inquiry WHERE created_at < ?' . ($onlyClosed ? " AND status = 'lezarva'" : '');
        $st = $this->db->prepare($sql); $st->execute([$cut]);
        $ids = $st->fetchAll(PDO::FETCH_COLUMN);
        foreach ($ids as $id) {
            $this->db->prepare('DELETE FROM inquiry WHERE id = ?')->execute([$id]);
            $this->removeDir($this->data . '/inquiry-files/' . (int) $id);
        }
        return count($ids);
    }

    private function removeDir(string $dir): void
    {
        if (!is_dir($dir) || is_link($dir)) return;
        foreach (glob($dir . '/*') ?: [] as $f) { if (is_dir($f) && !is_link($f)) $this->removeDir($f); else @unlink($f); }
        @rmdir($dir);
    }

    /** Próbalevél a beállított címre – csak az admin kifejezett kérésére (gombnyomás). */
    private function mailTest(): void
    {
        $m = new Mailer($this->data);
        $st = $m->status();
        if ($st['mode'] === 'off') $this->fail(409, 'Az e-mail-értesítés ki van kapcsolva.');
        $r = $m->send('Próbalevél – karikagyuru.com', "Ez próbalevél a weboldal kezelőfelületéről.\nHa megérkezett, az új érdeklődésekről is jön értesítés.");
        if ($r['status'] === 'hiba') $this->fail(502, (string) $r['error']);
        $this->json(['ok' => true, 'status' => $r['status']]);
    }

    /* ---------- fényképek ---------- */

    private function postPhoto(): void
    {
        $this->guardWrite();
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

    /* V5.8.1 – írászár: a biztonsági mentés (bin/mentes.php) kizárólagos zárat tart; minden író művelet megosztott zárat kér.
       Így mentés közben sem az adatbázis, sem a képfájlok nem változnak. A zár a kérés végén (az objektummal) felszabadul. */
    /** @var resource|null */
    private $writeLock = null;
    private function guardWrite(bool $http = true): void
    {
        if ($this->writeLock) return;
        require_once __DIR__ . '/Backup.php';
        $l = Backup::lock($this->data, LOCK_SH, (float) (getenv('KG_MENTES_VARAKOZAS') ?: 20));
        if ($l === false) {
            if ($http) $this->fail(503, 'Biztonsági mentés folyamatban. Kérjük, próbálja újra egy perc múlva.');
            throw new RuntimeException('Biztonsági mentés folyamatban – próbálja újra később.');
        }
        $this->writeLock = $l;
    }
}

final class HttpError extends RuntimeException
{
    public function __construct(string $m, public int $status) { parent::__construct($m); }
}
