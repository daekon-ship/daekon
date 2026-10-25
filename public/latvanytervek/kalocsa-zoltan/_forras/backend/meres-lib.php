<?php
// Közös számláló-függvény (meres.php és ajanlat.php). Csak napi darabszám, személyes adat nélkül.
declare(strict_types=1);

// Látogató IP-je a túlterhelés-védelemhez. Az nginx előtét mögött a REMOTE_ADDR lehet az előtét címe:
// ilyenkor a config 'trusted_proxies' listájába kell írni, és csak onnan fogadjuk el az X-Forwarded-For utolsó elemét.
function kliens_ip(array $cfg): string {
    $ra = $_SERVER['REMOTE_ADDR'] ?? '';
    if (in_array($ra, $cfg['trusted_proxies'] ?? [], true)) {
        $xff = array_map('trim', explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '')));
        $last = end($xff);
        if ($last !== false && filter_var($last, FILTER_VALIDATE_IP)) return $last;
    }
    return $ra;
}
function meres_add(string $dir, string $e, string $hely): void {
    // a mérés hibája soha nem törheti el a hívó végpont válaszát (pl. az ajánlatkérő JSON-válaszát) → csendes kilépés
    if (!is_dir($dir) && !@mkdir($dir, 0700, true)) return;
    $f = @fopen($dir . '/szamlalo.json', 'c+'); if (!$f) return;
    flock($f, LOCK_EX);
    $d = json_decode(stream_get_contents($f) ?: '{}', true) ?: [];
    $min = date('YmdHi');
    if (($d['_perc'] ?? '') !== $min) { $d['_perc'] = $min; $d['_db'] = 0; }
    if (++$d['_db'] <= 30) {
        $nap = (new DateTime('now', new DateTimeZone('Europe/Budapest')))->format('Y-m-d');
        $d[$nap][$e][$hely] = ($d[$nap][$e][$hely] ?? 0) + 1;
    }
    ftruncate($f, 0); rewind($f); fwrite($f, json_encode($d)); fflush($f); flock($f, LOCK_UN); fclose($f);
}
