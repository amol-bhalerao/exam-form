<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

/*
 * Hostinger layout:
 *   domains/hscexam.in/public_html   <- this folder (only public files)
 *   domains/hscexam.in/hsc-app       <- the application, .env, vendor (not reachable from the web)
 * If you put the application somewhere else, change this one line.
 */
$app_path = __DIR__ . '/../hsc-app';

if (file_exists($maintenance = $app_path . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $app_path . '/vendor/autoload.php';

/** @var \Illuminate\Foundation\Application $app */
$app = require_once $app_path . '/bootstrap/app.php';

// Built CSS/JS and uploaded files are served from this folder.
$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());
