<?php

/*
 * Front controller used when this project folder itself is the web root
 * (XAMPP htdocs/HSC-exam or Hostinger public_html). It simply runs public/index.php.
 * If your host lets you point the domain at the public/ folder, do that instead.
 */
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/public/index.php';

require __DIR__ . '/public/index.php';
