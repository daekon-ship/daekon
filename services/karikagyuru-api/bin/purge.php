<?php
declare(strict_types=1);
// Megőrzési idő: a megadott napnál régebbi érdeklődések (és csatolt képeik) végleges törlése.
// Használat:  KG_DATA=/utvonal php bin/purge.php <napok> [--minden]
//   alapból csak a „lezárva” állapotúakat törli; --minden esetén minden állapotút.
// A megőrzési időt az ügyfél adatkezelési tájékoztatója határozza meg – azt kell itt használni (pl. napi cron).
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/src/App.php';
require dirname(__DIR__) . '/src/Mailer.php';
$days = (int) ($argv[1] ?? 0);
if ($days < 1) { fwrite(STDERR, "Adja meg a napok számát (legalább 1).\n"); exit(1); }
$n = (new App())->purgeInquiries($days, !in_array('--minden', $argv, true));
fwrite(STDOUT, "Törölve: $n érdeklődés.\n");
