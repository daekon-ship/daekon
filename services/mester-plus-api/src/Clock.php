<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/** Idő egy helyen – a tesztek így tudnak lejáratot, türelmi időt szimulálni. */
final class Clock
{
    private static int $offset = 0;

    public static function now(): int
    {
        return time() + self::$offset;
    }

    public static function sql(?int $ts = null): string
    {
        return gmdate('Y-m-d H:i:s', $ts ?? self::now());
    }

    public static function iso(?string $sqlUtc): ?string
    {
        if ($sqlUtc === null || $sqlUtc === '') {
            return null;
        }
        $t = strtotime($sqlUtc . ' UTC');
        return $t === false ? null : gmdate('Y-m-d\TH:i:s\Z', $t);
    }

    public static function ts(?string $sqlUtc): ?int
    {
        if ($sqlUtc === null || $sqlUtc === '') {
            return null;
        }
        $t = strtotime($sqlUtc . ' UTC');
        return $t === false ? null : $t;
    }

    /** Csak teszt. */
    public static function travel(int $seconds): void
    {
        self::$offset += $seconds;
    }

    public static function reset(): void
    {
        self::$offset = 0;
    }
}
