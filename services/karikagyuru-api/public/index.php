<?php
declare(strict_types=1);
// Egyetlen belépési pont. A tárhelyen ez a mappa kerül a webgyökér /api alá;
// az src/ és az adatmappa (KG_DATA) a webgyökéren kívül marad.
require dirname(__DIR__) . '/src/App.php';
require dirname(__DIR__) . '/src/Mailer.php';
(new App())->handle();
