<?php
// Másold config.php néven a kapu.php mellé, és írd át az útvonalakat. A config.php NEM kerül a repositoryba.
return [
    'data' => '/home/FELHASZNALO/kg-bemutato-adat',              // csak a bemutatóé, a webgyökéren KÍVÜL; soha nem az éles adatmappa
    'site' => __DIR__ . '/site',                                 // a weboldal fájljai (index.html, js/, css/, img/, fonts/)
    'src'  => '/home/FELHASZNALO/karikagyuru-api/src',           // az API forrása, a webgyökéren kívül
];
