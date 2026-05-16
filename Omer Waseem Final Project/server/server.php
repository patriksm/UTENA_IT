<?php

declare(strict_types=1);

/**
 * Entry point — run from project root:
 *   php server/server.php
 */

require_once __DIR__ . '/lib/WebSocket.php';
require_once __DIR__ . '/lib/StaticFileServer.php';
require_once __DIR__ . '/lib/GameRoom.php';
require_once __DIR__ . '/lib/GameServer.php';

$config = require __DIR__ . '/config.php';

if ($config['www'] === false) {
    fwrite(STDERR, "WWW folder not found.\n");
    exit(1);
}

try {
    (new GameServer($config))->run();
} catch (RuntimeException $e) {
    fwrite(STDERR, $e->getMessage() . PHP_EOL);
    exit(1);
}
