<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/**
 * Strukturált (JSON-soros) napló. TILOS benne: jelszó, token, Authorization-fejléc, mentés-tartalom,
 * ajánlat-tartalom, e-mail-cím. Felhasználó csak belső azonosítóval szerepel; útvonal csak mintaként
 * (pl. /a/{token}), így a publikus ajánlat-token sem kerül a naplóba.
 */
final class Log
{
    private static ?string $file = null;
    /** @var list<array<string,mixed>> csak teszt */
    public static array $memory = [];
    public static bool $toMemory = false;

    public static function setFile(?string $file): void
    {
        self::$file = $file;
    }

    /** @param array<string,mixed> $ctx */
    public static function write(string $level, string $msg, array $ctx = []): void
    {
        $rec = ['ts' => gmdate('Y-m-d\TH:i:s\Z', Clock::now()), 'level' => $level, 'msg' => $msg] + self::clean($ctx);
        if (self::$toMemory) {
            self::$memory[] = $rec;
            return;
        }
        $line = json_encode($rec, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE) . "\n";
        if (self::$file !== null) {
            @file_put_contents(self::$file, $line, FILE_APPEND | LOCK_EX);
        } else {
            error_log(rtrim($line));
        }
    }

    /** Ismert érzékeny kulcsok kiszűrése, hosszú szövegek csonkolása. @param array<string,mixed> $ctx @return array<string,mixed> */
    public static function clean(array $ctx): array
    {
        $out = [];
        foreach ($ctx as $k => $v) {
            if (preg_match('/pass|token|secret|authorization|cookie|key|email|body|snapshot/i', (string) $k)) {
                continue;
            }
            if (is_string($v)) {
                $v = mb_substr(preg_replace('/(mp[ar]_|Bearer\s+)[A-Za-z0-9_-]{8,}/', '$1***', $v) ?? '', 0, 300);
            } elseif (is_array($v)) {
                $v = self::clean($v);
            }
            $out[$k] = $v;
        }
        return $out;
    }
}
