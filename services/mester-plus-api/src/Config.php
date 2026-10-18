<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/**
 * Beállítások. Forrás: a webhely config/ mappája (a Gitben SOHA nincs titok):
 *   config/db.env   – a Hosting Factory hozza létre (DB_HOST, DB_NAME, DB_USER, DB_PASS)
 *   config/app.env  – Mester+ Cloud (MP_ENV, MP_KEK_<n>, MP_TOKEN_PEPPER, …), root:<oldal> 0640
 * CLI-ben és tesztben az MP_CONFIG_DIR környezeti változó felülírja a helyet.
 */
final class Config
{
    /** @var array<string,string> */
    private array $v;

    /** @param array<string,string> $values */
    public function __construct(array $values)
    {
        $this->v = $values;
    }

    public static function load(?string $dir = null): self
    {
        $dir ??= getenv('MP_CONFIG_DIR') ?: self::defaultDir();
        $vals = [];
        foreach (['db.env', 'app.env'] as $f) {
            $p = rtrim($dir, '/') . '/' . $f;
            if (is_file($p) && is_readable($p)) {
                $vals = array_merge($vals, self::parse((string) file_get_contents($p)));
            }
        }
        return new self($vals);
    }

    /** /srv/sites/<d>/releases/<id>/src → /srv/sites/<d>/config */
    private static function defaultDir(): string
    {
        $release = dirname(__DIR__);
        $site = dirname($release, 2);
        return $site . '/config';
    }

    /** @return array<string,string> */
    public static function parse(string $text): array
    {
        $out = [];
        foreach (preg_split('/\r?\n/', $text) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') {
                continue;
            }
            if (preg_match('/^([A-Z][A-Z0-9_]{0,63})=(.*)$/', $line, $m)) {
                $val = $m[2];
                if (strlen($val) >= 2 && ($val[0] === '"' || $val[0] === "'") && $val[-1] === $val[0]) {
                    $val = substr($val, 1, -1);
                }
                $out[$m[1]] = $val;
            }
        }
        return $out;
    }

    public function str(string $k, string $default = ''): string
    {
        return $this->v[$k] ?? $default;
    }

    public function int(string $k, int $default): int
    {
        $s = $this->v[$k] ?? '';
        return preg_match('/^-?\d{1,18}$/', $s) ? (int) $s : $default;
    }

    public function bool(string $k, bool $default = false): bool
    {
        if (!isset($this->v[$k])) {
            return $default;
        }
        return in_array(strtolower($this->v[$k]), ['1', 'true', 'yes', 'igen', 'on'], true);
    }

    public function has(string $k): bool
    {
        return isset($this->v[$k]) && $this->v[$k] !== '';
    }

    public function env(): string
    {
        $e = $this->str('MP_ENV', 'production');
        return in_array($e, ['production', 'staging', 'development', 'test'], true) ? $e : 'production';
    }

    public function isProduction(): bool
    {
        return $this->env() === 'production';
    }

    /** Titok bájtként (base64-ből). Hiányzó / rövid titoknál kivétel: a szolgáltatás nem indul titok nélkül. */
    public function secret(string $k, int $minBytes = 32): string
    {
        $raw = base64_decode($this->v[$k] ?? '', true);
        if ($raw === false || strlen($raw) < $minBytes) {
            throw new \RuntimeException("Hiányzó vagy rövid titok a beállításokban: $k");
        }
        return $raw;
    }

    /** @param array<string,string> $over */
    public function with(array $over): self
    {
        return new self(array_merge($this->v, $over));
    }
}
