<?php
declare(strict_types=1);

/**
 * E-mail-értesítés új érdeklődésről – külső csomag nélkül.
 *
 * Beállítás: $KG_DATA/mail.json (a webgyökéren KÍVÜL), vagy környezeti változók (KG_MAIL_*), amelyek felülírják.
 *   mode:   "off" (alapértelmezett) | "file" (csak fájlba ír: $KG_DATA/outbox/*.eml – fejlesztéshez, nem küld) | "smtp"
 *   to, from:            címzett és feladó (kötelező SMTP-hez)
 *   host, port, secure:  SMTP-szerver; secure: "tls" (STARTTLS, 587) | "ssl" (465) | "none" (csak localhost-on engedett)
 *   user, pass:          SMTP-azonosítás (csak titkosított kapcsolaton vagy localhost-on küldjük el)
 *   timeout:             másodperc (alap: 10)
 * Semmilyen címet vagy szervert nem találunk ki: hiányos beállításnál nem küld, és ezt jelzi.
 */
final class Mailer
{
    private array $c;

    public function __construct(private string $dataDir)
    {
        $c = [];
        $f = $dataDir . '/mail.json';
        if (is_file($f)) { $j = json_decode((string) file_get_contents($f), true); if (is_array($j)) $c = $j; }
        foreach (['mode', 'to', 'from', 'host', 'port', 'secure', 'user', 'pass', 'timeout'] as $k) {
            $e = getenv('KG_MAIL_' . strtoupper($k));
            if ($e !== false && $e !== '') $c[$k] = $e;
        }
        $c['mode'] = in_array($c['mode'] ?? 'off', ['off', 'file', 'smtp'], true) ? ($c['mode'] ?? 'off') : 'off';
        $this->c = $c;
    }

    /** Állapot a kezelőfelületnek – jelszó és felhasználónév nélkül. */
    public function status(): array
    {
        $miss = $this->missing();
        return ['mode' => $this->c['mode'], 'to' => $this->mask((string) ($this->c['to'] ?? '')), 'ready' => $this->c['mode'] !== 'off' && !$miss, 'missing' => $miss];
    }

    private function missing(): array
    {
        $m = [];
        if ($this->c['mode'] === 'off') return $m;
        foreach (['to', 'from'] as $k) if (!filter_var((string) ($this->c[$k] ?? ''), FILTER_VALIDATE_EMAIL)) $m[] = $k;
        if ($this->c['mode'] === 'smtp') {
            if (trim((string) ($this->c['host'] ?? '')) === '') $m[] = 'host';
            if ((int) ($this->c['port'] ?? 0) <= 0) $m[] = 'port';
            $sec = $this->c['secure'] ?? 'tls';
            if (!in_array($sec, ['tls', 'ssl', 'none'], true)) $m[] = 'secure';
            if ($sec === 'none' && !$this->isLocal()) $m[] = 'secure (titkosítatlan csak helyi géppel)';
        }
        return $m;
    }

    private function isLocal(): bool { return in_array(strtolower((string) ($this->c['host'] ?? '')), ['127.0.0.1', 'localhost', '::1'], true); }
    private function mask(string $e): string { return $e === '' ? '' : preg_replace('/^(.).*(@.*)$/', '$1…$2', $e) ?? ''; }

    /**
     * Küldés. Visszatér: ['status' => 'off'|'fajlba'|'elkuldve'|'hiba', 'error' => ?string]. Soha nem dob kivételt.
     */
    public function send(string $subject, string $body): array
    {
        if ($this->c['mode'] === 'off') return ['status' => 'off', 'error' => null];
        if ($miss = $this->missing()) return ['status' => 'hiba', 'error' => 'Hiányos e-mail-beállítás: ' . implode(', ', $miss)];
        $to = $this->clean((string) $this->c['to']); $from = $this->clean((string) $this->c['from']);
        $msg = $this->build($from, $to, $this->clean($subject), $body);
        try {
            if ($this->c['mode'] === 'file') {
                $dir = $this->dataDir . '/outbox';
                if (!is_dir($dir)) mkdir($dir, 0700, true);
                if (file_put_contents($dir . '/' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.eml', $msg) === false) throw new RuntimeException('A levél nem írható ki.');
                return ['status' => 'fajlba', 'error' => null];
            }
            $this->smtp($from, $to, $msg);
            return ['status' => 'elkuldve', 'error' => null];
        } catch (Throwable $e) {
            return ['status' => 'hiba', 'error' => $e->getMessage()];
        }
    }

    /** Fejlécinjekció ellen: sortörés és vezérlőkarakter nem kerülhet fejlécbe. */
    private function clean(string $s): string { return trim((string) preg_replace('/[\x00-\x1F\x7F]+/', ' ', $s)); }

    private function build(string $from, string $to, string $subject, string $body): string
    {
        $host = substr(strrchr($from, '@') ?: '@karikagyuru.local', 1);
        $h = [
            'Date: ' . date(DATE_RFC2822),
            'From: ' . $from,
            'To: ' . $to,
            'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $host . '>',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            'Auto-Submitted: auto-generated',
        ];
        $b = chunk_split(base64_encode(str_replace(["\r\n", "\r"], "\n", $body)), 76, "\r\n");
        return implode("\r\n", $h) . "\r\n\r\n" . $b;
    }

    private function smtp(string $from, string $to, string $msg): void
    {
        $host = (string) $this->c['host']; $port = (int) $this->c['port']; $sec = $this->c['secure'] ?? 'tls';
        $timeout = max(2, (int) ($this->c['timeout'] ?? 10));
        $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $host]]);
        $s = @stream_socket_client(($sec === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $ctx);
        if (!$s) throw new RuntimeException("Az SMTP-szerver nem érhető el ($errstr).");
        stream_set_timeout($s, $timeout);
        $read = function () use ($s): array {
            $all = ''; $code = 0;
            while (($line = fgets($s, 2048)) !== false) { $all .= $line; $code = (int) substr($line, 0, 3); if (strlen($line) < 4 || $line[3] !== '-') break; }
            if ($all === '') throw new RuntimeException('Az SMTP-szerver nem válaszolt.');
            return [$code, $all];
        };
        $cmd = function (string $c, array $okCodes) use ($s, $read): string {
            fwrite($s, $c . "\r\n");
            [$code, $all] = $read();
            if (!in_array($code, $okCodes, true)) throw new RuntimeException('SMTP-hiba: ' . trim(explode("\n", $all)[0]));
            return $all;
        };
        try {
            [$code] = $read(); if ($code !== 220) throw new RuntimeException('Az SMTP-szerver elutasította a kapcsolatot.');
            $ehlo = $cmd('EHLO karikagyuru.local', [250]);
            if ($sec === 'tls') {
                if (stripos($ehlo, 'STARTTLS') === false) throw new RuntimeException('A szerver nem támogat titkosítást (STARTTLS).');
                $cmd('STARTTLS', [220]);
                if (!stream_socket_enable_crypto($s, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) throw new RuntimeException('A titkosítás nem jött létre.');
                $cmd('EHLO karikagyuru.local', [250]);
            }
            $user = (string) ($this->c['user'] ?? '');
            if ($user !== '') {
                $cmd('AUTH LOGIN', [334]);
                $cmd(base64_encode($user), [334]);
                $cmd(base64_encode((string) ($this->c['pass'] ?? '')), [235]);
            }
            $cmd('MAIL FROM:<' . $from . '>', [250]);
            $cmd('RCPT TO:<' . $to . '>', [250, 251]);
            $cmd('DATA', [354]);
            // pont-duplázás (RFC 5321): a sor eleji pont ne zárja le az üzenetet
            $cmd(preg_replace('/^\./m', '..', $msg) . "\r\n.", [250]);
            @fwrite($s, "QUIT\r\n");
        } finally {
            fclose($s);
        }
    }

    /** Az értesítő szövege: csak a visszahíváshoz szükséges adatok. */
    public static function inquiryText(int $id, array $q, string $adminUrl): array
    {
        $types = ['erdeklodes' => 'Ajánlatkérés (gyűrű)', 'ajanlat' => 'Ajánlatkérés', 'idopont' => 'Időpontkérés', 'egyedi' => 'Saját ötlet – ajánlatkérés', 'konzultacio' => 'Időpontkérés', 'telefon' => 'Telefonos'];   // V5.7: ugyanazok a fogalmak, mint a weboldalon
        $lines = [
            'Új érdeklődés érkezett a weboldalról.',
            '',
            'Típus: ' . ($types[$q['type'] ?? ''] ?? 'Érdeklődés'),
            'Név: ' . ($q['name'] ?? ''),
            'Telefon: ' . (($q['phone'] ?? '') ?: '–'),
            'E-mail: ' . (($q['email'] ?? '') ?: '–'),
        ];
        if (!empty($q['code'])) $lines[] = 'Gyűrű: ' . $q['code'];
        if (!empty($q['day'])) $lines[] = 'Időpont: ' . $q['day'];
        if (!empty($q['message'])) { $lines[] = ''; $lines[] = 'Üzenet:'; $lines[] = (string) $q['message']; }
        $lines[] = '';
        $lines[] = 'A részletek (beállítások, becsült ár) a kezelőfelületen: ' . $adminUrl;
        $lines[] = '';
        $lines[] = 'Ez automatikus értesítés. Az érdeklődés akkor is megmarad a kezelőfelületen, ha ez a levél nem érkezne meg.';
        return ['Új érdeklődés – karikagyuru.com (#' . $id . ')', implode("\n", $lines)];
    }
}
