<?php
// Másolat neve a szerveren: /_private/ajanlat-config.php  – NE kerüljön GitHubra, naplóba, chatbe!
// A /_private mappát a .htaccess (Require all denied) zárja le; élesítés előtt ellenőrizni kell, hogy
// https://kalocsageoworks.com/_private/ajanlat-config.php és /_private/vendor/ 403-at ad.
return [
  'autoload'        => __DIR__ . '/vendor/autoload.php',        // composer require phpmailer/phpmailer (helyben), a vendor mappa ide
  'allowed_origins' => ['https://kalocsageoworks.com'],
  'to'              => 'kalocsageoworks@gmail.com',
  'from'            => 'weboldal@kalocsageoworks.com',          // MHosting-postafiók, SPF/DKIM a domainhez
  'smtp_host'       => '<MHosting SMTP-szerver>',
  'smtp_port'       => 465,
  'smtp_user'       => 'weboldal@kalocsageoworks.com',
  'smtp_pass'       => '<postafiók-jelszó>',
  'salt'            => '<véletlen, hosszú szöveg – pl. php -r "echo bin2hex(random_bytes(32));">',
  // Az nginx előtét címe(i), ha a REMOTE_ADDR minden kérésnél ugyanaz (aktiváláskor ellenőrizni – lásd TEENDOK.md C/5).
  // Üresen hagyva a REMOTE_ADDR számít; ha az az előtét címe, a túlterhelés-védelem mindenkit egyként kezelne.
  'trusted_proxies' => [],
  'ratelimit_dir'   => __DIR__ . '/ratelimit',
  'stats_dir'       => __DIR__ . '/stats',
  'stats_password_hash' => '<php -r "echo password_hash(\'JELSZO\', PASSWORD_DEFAULT);" eredménye>',
];
