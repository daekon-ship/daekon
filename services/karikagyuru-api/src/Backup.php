<?php
declare(strict_types=1);

/**
 * V5.8.1 – Biztonsági mentés és visszaállítás (külső függőség nélkül: PHP 8.1+, pdo_sqlite).
 *
 * Konzisztencia: a mentés idejére kizárólagos zárat (flock LOCK_EX) tart az adatmappa `.mentes.lock` fájlján.
 * Minden író kérés (mentés, érdeklődés, fotó, törlés, megőrzési törlés, bemutató-visszaállítás) megosztott zárat
 * kér ugyanerre a fájlra (App::lockShared), ezért a mentés alatt sem az adatbázis, sem a képfájlok nem változnak:
 * a futó írás befejeződik, mielőtt a mentés indul, az új írás megvárja a mentés végét (legfeljebb KG_MENTES_VARAKOZAS mp).
 *
 * Eredmény: mindig egyértelmű. Sikerkor a `kg-mentes-<UTC-idő>` mappa a célban (manifest.json-nal), hibánál nincs ilyen mappa,
 * a félkész munkamappa (`.kg-mentes-….reszleges`) törlődik. A napló (mentes-naplo.log) személyes adatot nem tartalmaz.
 */
final class Backup
{
    public const FORMAT = 1;
    /** Kilépési kódok */
    public const OK = 0, E_USAGE = 1, E_VERIFY = 2, E_LOCK = 3, E_MISSING = 4, E_SIGNAL = 5;
    /** Webgyökérre utaló mappanevek: ezek alá mentés nem kerülhet (KG_WEBGYOKER-rel bővíthető). */
    private const WEBROOT_NAMES = ['public_html', 'www', 'htdocs', 'httpdocs', 'wwwroot', 'html', 'web', 'public'];
    /** Az adatmappa gyökeréből mentett beállításfájlok (a mail.json SMTP-jelszót is tartalmazhat → 0600). */
    private const CONFIG_FILES = ['salt', 'mail.json', 'demo-kapu.json'];
    public const NAME_RE = '/^kg-mentes-\d{8}-\d{6}(-HIANYOS)?$/';

    private ?string $partial = null;

    /* ======================= útvonalak ======================= */

    /** Kanonikus út: létező résznél realpath (symlink feloldva), a nem létező végén `..` nem lehet. */
    public static function canonical(string $path): ?string
    {
        if ($path === '') return null;
        if (!str_starts_with($path, '/')) $path = getcwd() . '/' . $path;
        $rest = [];
        $p = rtrim($path, '/') ?: '/';
        while (!file_exists($p) && !is_link($p)) {
            $b = basename($p);
            if ($b === '..' || $b === '.' || $b === '') return null;
            array_unshift($rest, $b);
            $p = dirname($p);
        }
        $real = realpath($p);
        if ($real === false) return null;                     // törött symlink
        return rtrim($real . ($rest ? '/' . implode('/', $rest) : ''), '/') ?: '/';
    }

    private static function inside(string $child, string $parent): bool
    {
        return $child === $parent || str_starts_with($child . '/', rtrim($parent, '/') . '/');
    }

    /** Hiba szövege, ha a cél tiltott helyen van; null, ha rendben. */
    public static function forbiddenTarget(string $target, string $data): ?string
    {
        if (self::inside($target, $data)) return 'A mentés nem kerülhet az adatmappába.';
        foreach (array_filter(explode(':', (string) getenv('KG_WEBGYOKER'))) as $w) {
            $cw = self::canonical($w);
            if ($cw !== null && self::inside($target, $cw)) return 'A mentés nem kerülhet a webgyökérbe (KG_WEBGYOKER).';
        }
        foreach (explode('/', trim($target, '/')) as $seg) {
            if (in_array(strtolower($seg), self::WEBROOT_NAMES, true)) return "A mentés nem kerülhet webről elérhető mappába ($seg).";
        }
        return null;
    }

    /* ======================= zár ======================= */

    /** @return resource|false */
    public static function lock(string $data, int $op, float $wait)
    {
        $f = @fopen($data . '/.mentes.lock', 'c');
        if ($f === false) return false;
        @chmod($data . '/.mentes.lock', 0600);
        $deadline = microtime(true) + $wait;
        while (!flock($f, $op | LOCK_NB)) {
            if (microtime(true) >= $deadline) { fclose($f); return false; }
            usleep(100_000);
        }
        return $f;
    }

    /* ======================= segédek ======================= */

    private static function rrm(string $dir): bool
    {
        if (is_link($dir) || is_file($dir)) return @unlink($dir);
        if (!is_dir($dir)) return true;
        $ok = true;
        foreach (scandir($dir) ?: [] as $f) if ($f !== '.' && $f !== '..') $ok = self::rrm("$dir/$f") && $ok;
        return @rmdir($dir) && $ok;
    }

    /** Fájl másolása ellenőrzéssel: visszatérési érték, méret és SHA-256 egyezése. Hibánál kivétel. */
    private static function copyVerified(string $src, string $dst): array
    {
        if (is_link($src) || !is_file($src)) throw new RuntimeException('Nem szabályos fájl: ' . basename($src));
        $size = filesize($src);
        $hash = @hash_file('sha256', $src);
        if ($size === false || $hash === false) throw new RuntimeException('Nem olvasható forrásfájl: ' . basename($src));
        if (!@copy($src, $dst)) throw new RuntimeException('A fájl másolása nem sikerült (betelt a tárhely, vagy nem írható a cél): ' . basename($src));
        @chmod($dst, 0600);
        clearstatcache(true, $dst);
        if (filesize($dst) !== $size) throw new RuntimeException('A másolat mérete eltér: ' . basename($src));
        if (hash_file('sha256', $dst) !== $hash) throw new RuntimeException('A másolat ellenőrzőösszege eltér: ' . basename($src));
        return ['bytes' => $size, 'sha256' => $hash];
    }

    private static function mkdirStrict(string $dir): void
    {
        if (!@mkdir($dir, 0700, true) && !is_dir($dir)) throw new RuntimeException('A mappa nem hozható létre: ' . basename($dir));
        @chmod($dir, 0700);
    }

    /** A pillanatkép adatbázisából: rekordszámok és a hivatkozott fájlok listája (személyes adat nélkül). */
    public static function inspectDb(string $dbFile): array
    {
        $db = new PDO('sqlite:' . $dbFile, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $integrity = (string) $db->query('PRAGMA integrity_check')->fetchColumn();
        $counts = ['state_version' => (int) $db->query('SELECT COUNT(*) FROM state_version')->fetchColumn(),
                   'inquiry' => (int) $db->query('SELECT COUNT(*) FROM inquiry')->fetchColumn()];
        $need = [];
        foreach ($db->query('SELECT id, body FROM inquiry') as $r) {
            $b = json_decode((string) $r['body'], true);
            foreach ((array) ($b['files'] ?? []) as $f) if (is_array($f) && is_string($f['file'] ?? null)) $need[] = 'inquiry-files/' . (int) $r['id'] . '/' . basename($f['file']);
        }
        $latest = $db->query('SELECT version, body FROM state_version ORDER BY version DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC);
        $demo = false;
        if ($latest) {
            $s = json_decode((string) $latest['body'], true) ?: [];
            $demo = ($s['demo'] ?? false) === true;
            $counts['latest_version'] = (int) $latest['version'];
            $counts['products'] = count((array) ($s['products'] ?? []));
            $counts['approved'] = count(array_filter((array) ($s['products'] ?? []), fn ($p) => is_array($p) && ($p['approved'] ?? false) === true));
            $counts['works'] = count((array) ($s['works'] ?? []));
            $counts['decisions'] = count((array) ($s['clientDecisions'] ?? []));
            preg_match_all('#api/photo/([a-f0-9]{32})(?:-800)?\.jpg#', (string) $latest['body'], $m);
            foreach (array_unique($m[1]) as $h) $need[] = "photos/$h.jpg";
        }
        return ['integrity' => $integrity, 'counts' => $counts, 'need' => array_values(array_unique($need)), 'demo' => $demo];
    }

    private static function log(string $dir, string $line): void
    {
        $f = $dir . '/mentes-naplo.log';
        if (@file_put_contents($f, gmdate('c') . ' ' . $line . "\n", FILE_APPEND | LOCK_EX) !== false) @chmod($f, 0600);
    }

    /* ======================= mentés ======================= */

    /**
     * @param array{create?:bool, allowMissing?:bool, lockWait?:float, slowMs?:int} $o
     * @return array{code:int, msg:string, dir?:string}
     */
    public function backup(string $dataIn, string $targetIn, array $o = []): array
    {
        $t0 = microtime(true);
        $data = realpath(rtrim($dataIn, '/'));
        if ($data === false || !is_file("$data/kg.sqlite")) return ['code' => self::E_USAGE, 'msg' => 'Nincs adatbázis a megadott adatmappában (KG_DATA).'];
        if ($targetIn === '') return ['code' => self::E_USAGE, 'msg' => 'Adja meg a célmappát: php bin/mentes.php /mentesek'];
        $target = self::canonical($targetIn);
        if ($target === null) return ['code' => self::E_USAGE, 'msg' => 'A célmappa útvonala érvénytelen (törött hivatkozás vagy „..” a nem létező részben).'];
        if ($err = self::forbiddenTarget($target, $data)) return ['code' => self::E_USAGE, 'msg' => $err];
        if (!is_dir($target)) {
            if (file_exists($target)) return ['code' => self::E_USAGE, 'msg' => 'A cél nem mappa.'];
            if (empty($o['create'])) return ['code' => self::E_USAGE, 'msg' => 'A célmappa nem létezik. Hozza létre, vagy használja a --letrehoz kapcsolót.'];
            if (!@mkdir($target, 0700, true)) return ['code' => self::E_USAGE, 'msg' => 'A célmappa nem hozható létre.'];
        }
        $name = 'kg-mentes-' . gmdate('Ymd-His');
        if (file_exists("$target/$name") || is_link("$target/$name") || file_exists("$target/$name-HIANYOS")) {
            return $this->fail($target, $name, self::E_USAGE, 'Ilyen nevű mentés már létezik – nem írjuk felül. Próbálja újra egy másodperc múlva.', $t0);
        }

        $lock = self::lock($data, LOCK_EX, (float) ($o['lockWait'] ?? 60));
        if ($lock === false) return $this->fail($target, $name, self::E_LOCK, 'Nem sikerült zárolni az adatmappát (egy másik mentés vagy hosszú írás fut).', $t0);

        $cleaned = $this->cleanStalePartials($target);
        $this->partial = "$target/.$name-" . bin2hex(random_bytes(4)) . '.reszleges';
        try {
            self::mkdirStrict($this->partial);
            // 1. forrás épsége, majd tranzakciósan konzisztens pillanatkép
            $src = new PDO('sqlite:' . $data . '/kg.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $qc = (string) $src->query('PRAGMA quick_check')->fetchColumn();
            if ($qc !== 'ok') throw new RuntimeException('A forrás-adatbázis sérült (quick_check).', self::E_VERIFY);
            $src->exec('VACUUM INTO ' . $src->quote($this->partial . '/kg.sqlite'));
            $src = null;
            @chmod($this->partial . '/kg.sqlite', 0600);
            $snap = self::inspectDb($this->partial . '/kg.sqlite');
            if ($snap['integrity'] !== 'ok') throw new RuntimeException('A mentett adatbázis épség-ellenőrzése nem sikerült.', self::E_VERIFY);

            // 2. fájlok: minden fotó és referenciakép + beállítások, ellenőrzött másolással
            $files = [];
            $skipped = 0;
            foreach (['photos', 'inquiry-files'] as $root) {
                if (!is_dir("$data/$root")) continue;
                $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator("$data/$root", FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST);
                foreach ($it as $f) {
                    $rel = substr($f->getPathname(), strlen($data) + 1);
                    if ($f->isLink()) { $skipped++; continue; }           // hivatkozást nem követünk
                    if ($f->isDir()) { self::mkdirStrict($this->partial . '/' . $rel); continue; }
                    if (!$f->isFile()) { $skipped++; continue; }
                    self::mkdirStrict(dirname($this->partial . '/' . $rel));
                    $files[$rel] = self::copyVerified($f->getPathname(), $this->partial . '/' . $rel);
                    if (!empty($o['slowMs'])) usleep((int) $o['slowMs'] * 1000);   // csak teszthez: lassított mentés
                }
            }
            foreach (self::CONFIG_FILES as $c) {
                if (is_file("$data/$c") && !is_link("$data/$c")) { self::mkdirStrict($this->partial . '/config'); $files["config/$c"] = self::copyVerified("$data/$c", $this->partial . "/config/$c"); }
            }

            // 3. a pillanatkép által hivatkozott fájlok mind megvannak-e
            $missing = array_values(array_filter($snap['need'], fn ($r) => !isset($files[$r])));
            if ($missing && empty($o['allowMissing'])) {
                throw new RuntimeException(count($missing) . ' hivatkozott fájl hiányzik az adatmappából (pl. ' . $missing[0] . '). A mentés nem teljes, ezért nem készült el. '
                    . 'Ha mégis szükség van rá: --hianyos-engedve (a mappa neve -HIANYOS végű lesz).', self::E_MISSING);
            }

            // 4. manifest (személyes adat nélkül: rekordszámok, fájlnevek véletlen azonosítók, ellenőrzőösszegek)
            $dbMeta = ['bytes' => filesize($this->partial . '/kg.sqlite'), 'sha256' => hash_file('sha256', $this->partial . '/kg.sqlite')];
            ksort($files);
            $manifest = ['format' => self::FORMAT, 'created' => gmdate('c'), 'name' => $name . ($missing ? '-HIANYOS' : ''), 'consistent' => true,
                         'lock' => 'exclusive', 'demo' => $snap['demo'], 'db' => $dbMeta + ['integrity' => 'ok', 'counts' => $snap['counts']],
                         'files' => $files, 'missing' => $missing, 'skipped_links' => $skipped];
            $mf = $this->partial . '/manifest.json';
            $fh = fopen($mf, 'x');
            if ($fh === false || fwrite($fh, json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) === false) throw new RuntimeException('A manifest írása nem sikerült.', self::E_VERIFY);
            if (function_exists('fsync')) @fsync($fh);
            fclose($fh); @chmod($mf, 0600);

            // 5. a kész másolat újraellenőrzése a lemezről
            $v = self::verify($this->partial);
            if ($v !== null) throw new RuntimeException('Ellenőrzés: ' . $v, self::E_VERIFY);

            $final = "$target/" . $manifest['name'];
            if (file_exists($final) || !@rename($this->partial, $final)) throw new RuntimeException('A kész mentés átnevezése nem sikerült.', self::E_VERIFY);
            $this->partial = null;
            @chmod($final, 0700);
            $bytes = $dbMeta['bytes'] + array_sum(array_column($files, 'bytes'));
            $c = $snap['counts'];
            $summary = sprintf('változatok: %d, érdeklődések: %d, gyűrűk: %d, fájlok: %d, %.1f MB, %.1f mp',
                $c['state_version'], $c['inquiry'], $c['products'] ?? 0, count($files), $bytes / 1048576, microtime(true) - $t0);
            if ($missing) {
                self::log($target, "HIANYOS kod=4 {$manifest['name']} hiányzó fájlok: " . count($missing) . "; $summary");
                return ['code' => self::E_MISSING, 'msg' => 'Mentés elkészült, de HIÁNYOS (' . count($missing) . ' hivatkozott fájl hiányzott a forrásból): ' . $final, 'dir' => $final];
            }
            self::log($target, "OK kod=0 {$manifest['name']} $summary" . ($cleaned ? "; törölt félbemaradt munkamappák: $cleaned" : ''));
            return ['code' => self::OK, 'msg' => "Mentés kész és ellenőrizve: $final\n  $summary", 'dir' => $final];
        } catch (Throwable $e) {
            $code = in_array($e->getCode(), [self::E_VERIFY, self::E_MISSING], true) ? (int) $e->getCode() : self::E_VERIFY;
            if ($e instanceof PDOException) $msg = 'Adatbázishiba a mentés közben (sérült adatbázis vagy betelt tárhely).';
            else $msg = $e->getMessage();
            return $this->fail($target, $name, $code, $msg, $t0);
        } finally {
            $this->cleanupPartial();
            flock($lock, LOCK_UN); fclose($lock);
        }
    }

    private function fail(string $target, string $name, int $code, string $msg, float $t0): array
    {
        $this->cleanupPartial();
        self::log($target, sprintf('HIBA kod=%d %s %s (%.1f mp)', $code, $name, $msg, microtime(true) - $t0));
        return ['code' => $code, 'msg' => "HIBA: $msg Nem készült használható mentés."];
    }

    /** Félbemaradt munkamappa törlése; ha nem törölhető, egyértelmű jelölés. Jelzéskezelőből is hívható. */
    public function cleanupPartial(): void
    {
        if ($this->partial === null) return;
        $p = $this->partial; $this->partial = null;
        if (!self::rrm($p) && is_dir($p)) @file_put_contents("$p/HIBAS-NEM-HASZNALHATO.txt", "Félbemaradt, hibás mentés. Ne állítsa vissza; törölhető.\n");
    }

    /** Korábbi, megszakadt (pl. kill -9) futás munkamappái: 10 percnél régebbiek törlése. */
    private function cleanStalePartials(string $target): int
    {
        $n = 0;
        foreach (glob($target . '/.kg-mentes-*.reszleges', GLOB_ONLYDIR) ?: [] as $d) {
            if (is_link($d)) continue;
            if (time() - (int) filemtime($d) > 600 && self::rrm($d)) $n++;
        }
        return $n;
    }

    /* ======================= ellenőrzés ======================= */

    /** Mentésmappa ellenőrzése a manifest alapján. null = rendben, egyébként a hiba szövege. */
    public static function verify(string $dir): ?string
    {
        $mf = "$dir/manifest.json";
        if (!is_file($mf)) return 'nincs manifest.json (félbemaradt vagy nem mentésmappa)';
        if (is_file("$dir/HIBAS-NEM-HASZNALHATO.txt")) return 'hibásként jelölt mentés';
        $m = json_decode((string) file_get_contents($mf), true);
        if (!is_array($m) || ($m['format'] ?? null) !== self::FORMAT) return 'ismeretlen manifest-formátum';
        $db = "$dir/kg.sqlite";
        if (!is_file($db) || filesize($db) !== ($m['db']['bytes'] ?? -1) || hash_file('sha256', $db) !== ($m['db']['sha256'] ?? '')) return 'az adatbázis mérete vagy ellenőrzőösszege eltér';
        try { $snap = self::inspectDb($db); } catch (Throwable) { return 'az adatbázis nem nyitható meg'; }
        if ($snap['integrity'] !== 'ok') return 'az adatbázis épség-ellenőrzése sikertelen';
        if ($snap['counts'] != ($m['db']['counts'] ?? null)) return 'a rekordszámok eltérnek a manifesttől';
        $listed = 0;
        foreach ((array) ($m['files'] ?? []) as $rel => $meta) {
            if (!is_string($rel) || str_contains($rel, '..') || !preg_match('#^(photos|inquiry-files|config)/#', $rel)) return 'érvénytelen fájlútvonal a manifestben';
            $f = "$dir/$rel";
            if (is_link($f) || !is_file($f)) return "hiányzó fájl: $rel";
            if (filesize($f) !== ($meta['bytes'] ?? -1) || hash_file('sha256', $f) !== ($meta['sha256'] ?? '')) return "eltérő fájl (méret vagy ellenőrzőösszeg): $rel";
            $listed++;
        }
        // a mappában nincs a manifesten kívüli fájl
        $actual = 0;
        foreach (['photos', 'inquiry-files', 'config'] as $r) {
            if (!is_dir("$dir/$r")) continue;
            foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator("$dir/$r", FilesystemIterator::SKIP_DOTS)) as $f) $actual++;
        }
        if ($actual !== $listed) return "a fájlok száma eltér (manifest: $listed, mappában: $actual)";
        $missing = array_values(array_filter($snap['need'], fn ($r) => !isset($m['files'][$r])));
        if ($missing != ($m['missing'] ?? [])) return 'a hivatkozott fájlok listája nem egyezik';
        return null;
    }

    /* ======================= visszaállítás ======================= */

    /** @param array{demo?:bool, allowMissing?:bool} $o */
    public static function restore(string $backupIn, string $dataIn, array $o = []): array
    {
        $b = realpath(rtrim($backupIn, '/'));
        if ($b === false || !is_dir($b)) return ['code' => self::E_USAGE, 'msg' => 'A mentésmappa nem található.'];
        if (!preg_match(self::NAME_RE, basename($b))) return ['code' => self::E_USAGE, 'msg' => 'Ez nem kész mentésmappa (a neve kg-mentes-ÉÉÉÉHHNN-ÓÓPPMM kell legyen; félbemaradt mentés nem állítható vissza).'];
        if (str_ends_with(basename($b), '-HIANYOS') && empty($o['allowMissing'])) return ['code' => self::E_MISSING, 'msg' => 'Hiányos mentés. Csak --hianyos-engedve kapcsolóval állítható vissza.'];
        if ($err = self::verify($b)) return ['code' => self::E_VERIFY, 'msg' => "A mentés ellenőrzése nem sikerült: $err. Semmi nem változott."];
        $m = json_decode((string) file_get_contents("$b/manifest.json"), true);
        if (($m['demo'] ?? false) === true && empty($o['demo'])) return ['code' => self::E_USAGE, 'msg' => 'Ez bemutató (minta)adat mentése. Éles adatmappába nem állítjuk vissza; bemutatóhoz: --bemutato.'];
        if (($m['demo'] ?? false) !== true && !empty($o['demo'])) return ['code' => self::E_USAGE, 'msg' => 'Ez nem bemutató-mentés, a --bemutato kapcsoló itt nem használható.'];

        $data = self::canonical($dataIn);
        if ($data === null || $dataIn === '') return ['code' => self::E_USAGE, 'msg' => 'Adja meg a visszaállítás cél-adatmappáját (KG_DATA).'];
        if (self::inside($data, $b) || self::inside($b, $data)) return ['code' => self::E_USAGE, 'msg' => 'A cél-adatmappa nem lehet a mentésmappán belül vagy fölötte.'];
        if (file_exists($data) || is_link($data)) {
            if (!is_dir($data) || is_link($data) || count(scandir($data) ?: []) > 2) return ['code' => self::E_USAGE, 'msg' => 'A cél-adatmappa nem üres. Meglévő adatot soha nem írunk felül: adjon meg új, üres mappát.'];
            if (!@rmdir($data)) return ['code' => self::E_USAGE, 'msg' => 'A cél-adatmappa nem használható.'];
        }
        $tmp = dirname($data) . '/.' . basename($data) . '.visszaallitas-' . bin2hex(random_bytes(4));
        try {
            self::mkdirStrict($tmp);
            self::copyVerified("$b/kg.sqlite", "$tmp/kg.sqlite");
            foreach ((array) $m['files'] as $rel => $meta) {
                $dst = "$tmp/" . (str_starts_with($rel, 'config/') ? substr($rel, 7) : $rel);
                self::mkdirStrict(dirname($dst));
                $r = self::copyVerified("$b/$rel", $dst);
                if ($r['sha256'] !== $meta['sha256']) throw new RuntimeException("Ellenőrzőösszeg-eltérés: $rel");
            }
            self::mkdirStrict("$tmp/photos");
            $snap = self::inspectDb("$tmp/kg.sqlite");
            if ($snap['integrity'] !== 'ok' || $snap['counts'] != $m['db']['counts']) throw new RuntimeException('A visszaállított adatbázis nem egyezik a mentéssel.');
            if (!@rename($tmp, $data)) throw new RuntimeException('Az adatmappa véglegesítése nem sikerült.');
            @chmod($data, 0700);
        } catch (Throwable $e) {
            self::rrm($tmp);
            return ['code' => self::E_VERIFY, 'msg' => 'HIBA: ' . $e->getMessage() . ' A cél-adatmappa nem jött létre.'];
        }
        $c = $m['db']['counts'];
        return ['code' => self::OK, 'msg' => sprintf("Visszaállítva ide: %s\n  változatok: %d, érdeklődések: %d, gyűrűk: %d, fájlok: %d (mind ellenőrizve)",
            $data, $c['state_version'], $c['inquiry'], $c['products'] ?? 0, count((array) $m['files']))];
    }

    /* ======================= megőrzés ======================= */

    /** Régi mentések listázása / törlése. Csak a mentés-névmintájú, manifesttel rendelkező mappákhoz nyúl. */
    public static function prune(string $targetIn, int $days, int $keep, bool $apply): array
    {
        $target = realpath($targetIn);
        if ($target === false || !is_dir($target)) return ['code' => self::E_USAGE, 'msg' => 'A mentések mappája nem található.'];
        if ($days < 1 || $keep < 1) return ['code' => self::E_USAGE, 'msg' => 'A napok és a megtartandó mentések száma legalább 1 legyen.'];
        $all = [];
        foreach (scandir($target) ?: [] as $n) {
            $d = "$target/$n";
            if (!preg_match(self::NAME_RE, $n) || is_link($d) || !is_dir($d) || !is_file("$d/manifest.json")) continue;
            $ts = DateTimeImmutable::createFromFormat('Ymd-His', substr($n, 10, 15), new DateTimeZone('UTC'));
            if ($ts) $all[$n] = $ts->getTimestamp();
        }
        arsort($all);
        $out = []; $i = 0; $deleted = 0;
        foreach ($all as $n => $ts) {
            $old = time() - $ts > $days * 86400;
            $del = $i++ >= $keep && $old;
            if ($del && $apply) { if (self::rrm("$target/$n")) $deleted++; else $out[] = "NEM SIKERÜLT törölni: $n"; }
            $out[] = ($del ? ($apply ? 'törölve:   ' : 'törölhető: ') : 'megmarad:  ') . $n;
        }
        if ($apply) self::log($target, "MEGORZES torolve=$deleted napok=$days megtart=$keep");
        return ['code' => self::OK, 'msg' => ($out ? implode("\n", $out) : 'Nincs mentés a mappában.') . ($apply ? '' : "\n(Próbafuttatás: semmi nem törlődött. Törléshez: --torles)")];
    }
}
