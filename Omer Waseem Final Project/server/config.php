<?php

declare(strict_types=1);

return [
    'port'         => 8080,
    'max_players'  => 2,
    'www'          => realpath(__DIR__ . '/../WWW'),
    'player_colors'=> ['#00d4ff', '#ff6b35'],
    'spawn_x'      => [-80, 80],
    'mime'         => [
        '.html' => 'text/html; charset=utf-8',
        '.css'  => 'text/css; charset=utf-8',
        '.js'   => 'application/javascript; charset=utf-8',
        '.json' => 'application/json; charset=utf-8',
        '.png'  => 'image/png',
        '.ico'  => 'image/x-icon',
    ],
];
