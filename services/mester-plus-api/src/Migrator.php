<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/**
 * Verziózott, csak előre haladó migrációk (migrations/NNNN_*.php → SQL-utasítások listája).
 * Minden lefutott migráció ellenőrzőösszeggel rögzül; egy már lefutott fájl utólagos módosítása hiba
 * (nem fut le „csendben” eltérő séma). Romboló (DROP/TRUNCATE) utasítás csak kifejezett jelöléssel.
 */
final class Migrator
{
    public function __construct(private Db $db, private string $dir)
    {
    }

    /** @return array<string,string> verzió → fájl */
    public function available(): array
    {
        $out = [];
        foreach (glob($this->dir . '/[0-9][0-9][0-9][0-9]_*.php') ?: [] as $f) {
            $out[substr(basename($f), 0, 4)] = $f;
        }
        ksort($out);
        return $out;
    }

    private function ensureTable(): void
    {
        $this->db->pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (version CHAR(4) PRIMARY KEY, name VARCHAR(100) NOT NULL,
            checksum CHAR(64) NOT NULL, applied_at DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    }

    /** @return list<array{version:string,name:string,state:string}> */
    public function status(): array
    {
        $this->ensureTable();
        $done = [];
        foreach ($this->db->all('SELECT version, checksum FROM schema_migrations') as $r) {
            $done[$r['version']] = $r['checksum'];
        }
        $out = [];
        foreach ($this->available() as $v => $f) {
            $sum = hash_file('sha256', $f);
            $state = !isset($done[$v]) ? 'pending' : (hash_equals($done[$v], $sum) ? 'applied' : 'CHANGED');
            $out[] = ['version' => $v, 'name' => basename($f), 'state' => $state];
        }
        return $out;
    }

    /** @return list<string> lefuttatott verziók */
    public function migrate(bool $allowDestructive = false): array
    {
        $ran = [];
        foreach ($this->status() as $m) {
            if ($m['state'] === 'CHANGED') {
                throw new \RuntimeException("A már lefutott migráció módosult: {$m['name']} – új migrációt kell írni.");
            }
        }
        foreach ($this->status() as $m) {
            if ($m['state'] !== 'pending') {
                continue;
            }
            $file = $this->available()[$m['version']];
            $stmts = (static fn (string $f) => require $f)($file);
            if (!is_array($stmts)) {
                throw new \RuntimeException("Hibás migráció: {$m['name']}");
            }
            foreach ($stmts as $sql) {
                if (!$allowDestructive && preg_match('/\b(DROP\s+(TABLE|DATABASE|COLUMN)|TRUNCATE)\b/i', $sql)) {
                    throw new \RuntimeException("Romboló utasítás a(z) {$m['name']} migrációban – csak --allow-destructive kapcsolóval.");
                }
            }
            // MariaDB-ben a DDL implicit commitol: a migrációk ezért kicsik és idempotens sorrendűek; hiba esetén megáll.
            foreach ($stmts as $sql) {
                $this->db->pdo->exec($sql);
            }
            $this->db->insert('schema_migrations', ['version' => $m['version'], 'name' => $m['name'], 'checksum' => hash_file('sha256', $file), 'applied_at' => Clock::sql()]);
            $ran[] = $m['version'];
        }
        return $ran;
    }
}
