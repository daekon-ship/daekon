<?php
// Közös számláló-függvény (meres.php és ajanlat.php). Csak napi darabszám, személyes adat nélkül.
declare(strict_types=1);
function meres_add(string $dir, string $e, string $hely): void {
    $f = fopen($dir . '/szamlalo.json', 'c+'); if (!$f) return;
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
