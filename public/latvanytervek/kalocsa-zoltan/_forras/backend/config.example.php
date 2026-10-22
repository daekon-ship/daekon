<?php
// Másold ide: <webgyökér>/../private/ajanlat-config.php  (NE a nyilvános mappába, NE a GitHubra!)
return [
  'autoload'        => __DIR__ . '/../vendor/autoload.php',
  'allowed_origins' => ['https://<vegleges-domain>'],
  'to'              => 'kalocsageoworks@gmail.com',
  'from'            => 'weboldal@<vegleges-domain>',   // a domainhez tartozó, SPF/DKIM-mel hitelesített cím
  'smtp_host'       => 'smtp.<szolgaltato>.hu',
  'smtp_port'       => 465,
  'smtp_user'       => '<smtp-felhasznalo>',
  'smtp_pass'       => '<smtp-jelszo>',
  'salt'            => '<veletlen-hosszu-szoveg>',
  'ratelimit_dir'   => __DIR__ . '/ratelimit',          // írható, nem nyilvános mappa
  'stats_dir'       => __DIR__ . '/stats',              // mérés: napi darabszámok (írható, nem nyilvános)
  'stats_password_hash' => '<password_hash(...) eredménye>', // statisztika.php belépés
];
