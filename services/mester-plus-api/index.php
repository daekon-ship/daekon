<?php
// Mester+ Cloud API – webes belépési pont. Minden kérés ide fut (nginx: try_files … /index.php).
declare(strict_types=1);

const MP_API = true;
require __DIR__ . '/src/bootstrap.php';

use MesterPlus\App;
use MesterPlus\Config;
use MesterPlus\Log;
use MesterPlus\Request;

ini_set('display_errors', '0');
$config = Config::load();
$logDir = $config->str('MP_LOG_DIR');
if ($logDir !== '' && is_dir($logDir)) {
    Log::setFile(rtrim($logDir, '/') . '/mester-plus-api.log');
}
(new App($config))->handle(Request::fromGlobals())->send();
