<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

final class Util
{
    private const B32 = '0123456789abcdefghjkmnpqrstvwxyz';

    /** Nem kitalálható, sorszámot nem eláruló azonosító (128 bit, 26 karakter, base32). */
    public static function publicId(): string
    {
        $bytes = random_bytes(17);
        $out = '';
        $bits = 0;
        $buf = 0;
        for ($i = 0; $i < 17 && strlen($out) < 26; $i++) {
            $buf = ($buf << 8) | ord($bytes[$i]);
            $bits += 8;
            while ($bits >= 5 && strlen($out) < 26) {
                $bits -= 5;
                $out .= self::B32[($buf >> $bits) & 31];
            }
        }
        return $out;
    }

    public static function isPublicId(string $s): bool
    {
        return (bool) preg_match('/^[0-9a-hjkmnp-tv-z]{26}$/', $s);
    }

    /** Hosszú, véletlen token (256 bit), URL-biztos. */
    public static function token(string $prefix = ''): string
    {
        return $prefix . rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }

    /** Token-kivonat: HMAC-SHA256 a szerver titkos borsával – DB-szivárgásból a token nem használható. */
    public static function tokenHash(string $token, string $pepper): string
    {
        return hash_hmac('sha256', $token, $pepper, true);
    }

    /** IP-cím csak kivonatként (napi sóval nem, mert visszaélés-elemzéshez stabil kell; rövid megőrzés). */
    public static function ipHash(string $ip, string $pepper): string
    {
        return hash_hmac('sha256', 'ip:' . $ip, $pepper, true);
    }

    public static function b64u(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    public static function b64uDecode(string $s): ?string
    {
        if (!preg_match('/^[A-Za-z0-9_-]*$/', $s)) {
            return null;
        }
        $r = base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4), true);
        return $r === false ? null : $r;
    }

    public static function h(?string $s): string
    {
        return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
    }

    /** Ellenőrzött rövid szöveg: vezérlőkarakter nélkül, hosszkorláttal. */
    public static function cleanText(mixed $v, int $max, bool $multiline = false): ?string
    {
        if (!is_string($v)) {
            return null;
        }
        if (!mb_check_encoding($v, 'UTF-8')) {
            return null;
        }
        $v = $multiline ? preg_replace('/[^\P{C}\n\t]/u', '', $v) : preg_replace('/\p{C}/u', '', $v);
        $v = trim((string) $v);
        return mb_strlen($v) > $max ? null : $v;
    }
}
