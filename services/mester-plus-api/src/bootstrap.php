<?php
// Mester+ Cloud API – közös indítás (webes belépési pont és CLI is ezt tölti be).
// A src/ alatti fájlok közvetlenül nem futtathatók: a webszerver 404-et kap.
declare(strict_types=1);

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

const MP_SRC = __DIR__;

spl_autoload_register(static function (string $class): void {
    if (!str_starts_with($class, 'MesterPlus\\')) {
        return;
    }
    $rel = str_replace('\\', '/', substr($class, strlen('MesterPlus\\')));
    if (!preg_match('~^[A-Za-z0-9/]+$~', $rel)) {
        return;
    }
    $file = MP_SRC . '/' . $rel . '.php';
    if (is_file($file)) {
        require $file;
    }
});

mb_internal_encoding('UTF-8');
date_default_timezone_set('Europe/Budapest');

// Több osztályt tartalmazó fájl (ApiError, Request, Response).
require MP_SRC . '/Http.php';
