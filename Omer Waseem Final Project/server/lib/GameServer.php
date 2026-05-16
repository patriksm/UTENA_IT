<?php

declare(strict_types=1);

final class GameServer
{
    private int $clientIdSeq = 0;

    /** @var array<int, array> */
    private array $clients = [];

    private GameRoom $room;
    private StaticFileServer $files;

    public function __construct(private readonly array $config)
    {
        if ($config['www'] === false) {
            throw new RuntimeException('WWW folder not found.');
        }

        $this->room  = new GameRoom(
            $config['max_players'],
            $config['player_colors'],
            $config['spawn_x'],
        );
        $this->files = new StaticFileServer($config['www'], $config['mime']);
    }

    public function run(): void
    {
        $port   = $this->config['port'];
        $master = stream_socket_server("tcp://0.0.0.0:{$port}", $errno, $errstr);

        if ($master === false) {
            throw new RuntimeException("Cannot bind port {$port}: {$errstr} ({$errno})");
        }

        stream_set_blocking($master, false);

        echo "3D Multiplayer (PHP) — http://localhost:{$port}" . PHP_EOL;
        echo "Open two browser tabs, enter a name on each, then play." . PHP_EOL;

        while (true) {
            $this->tick($master);
        }
    }

    private function tick($master): void
    {
        $read = [$master];
        foreach ($this->clients as $client) {
            $read[] = $client['socket'];
        }

        $write = $except = null;
        if (@stream_select($read, $write, $except, 1) === false) {
            return;
        }

        if (in_array($master, $read, true)) {
            $this->acceptClient($master);
        }

        foreach ($this->clients as $id => $client) {
            if (in_array($client['socket'], $read, true)) {
                $this->readClient($id);
            }
        }
    }

    private function acceptClient($master): void
    {
        $socket = @stream_socket_accept($master, 0);
        if ($socket === false) {
            return;
        }

        stream_set_blocking($socket, false);
        $id = ++$this->clientIdSeq;

        $this->clients[$id] = [
            'socket'   => $socket,
            'ws'       => false,
            'joined'   => false,
            'playerId' => null,
            'buffer'   => '',
            'request'  => '',
        ];
    }

    private function readClient(int $id): void
    {
        $client = $this->clients[$id];
        $data   = fread($client['socket'], 8192);

        // Non-blocking sockets often return "" when there is nothing to read yet.
        if ($data === false || ($data === '' && feof($client['socket']))) {
            $this->dropClient($id);
            return;
        }
        if ($data === '') {
            return;
        }

        if (!$client['ws']) {
            $this->handleHttp($id, $data);
            return;
        }

        $this->clients[$id]['buffer'] .= $data;
        $this->processWebSocketBuffer($id);
    }

    private function processWebSocketBuffer(int $id): void
    {
        $parsed = WebSocket::decodeFrames($this->clients[$id]['buffer']);

        if ($parsed['close']) {
            $this->dropClient($id);
            return;
        }

        foreach ($parsed['messages'] as $raw) {
            $this->onMessage($id, $raw);
        }
    }

    private function handleHttp(int $id, string $chunk): void
    {
        $this->clients[$id]['request'] .= $chunk;

        if (!str_contains($this->clients[$id]['request'], "\r\n\r\n")) {
            return;
        }

        $request = $this->clients[$id]['request'];
        $socket  = $this->clients[$id]['socket'];
        $isWs    = stripos($request, 'Upgrade: websocket') !== false;

        if ($isWs && WebSocket::handshake($socket, $request)) {
            $this->clients[$id]['ws']     = true;
            $this->clients[$id]['buffer'] = '';

            $extra = substr($request, strpos($request, "\r\n\r\n") + 4);
            if ($extra !== '') {
                $this->clients[$id]['buffer'] = $extra;
                $this->processWebSocketBuffer($id);
            }
            return;
        }

        $path = '/';
        if (preg_match('#GET\s+([^\s?]+)#', $request, $match)) {
            $path = $match[1];
        }

        $this->files->serve($socket, $path);
        $this->dropClient($id);
    }

    private function onMessage(int $clientId, string $raw): void
    {
        $msg = json_decode($raw, true);
        if (!is_array($msg) || !isset($msg['type'])) {
            return;
        }

        if ($msg['type'] === 'join') {
            $this->handleJoin($clientId, $msg);
            return;
        }

        if (!$this->clients[$clientId]['joined']) {
            return;
        }

        if ($msg['type'] === 'move') {
            $this->handleMove($clientId, $msg);
        }
    }

    private function handleJoin(int $clientId, array $msg): void
    {
        if ($this->clients[$clientId]['joined']) {
            return;
        }

        $socket = $this->clients[$clientId]['socket'];

        if ($this->room->isFull()) {
            WebSocket::sendJson($socket, [
                'type'    => 'error',
                'message' => 'Room is full (2 players max). Try again later.',
            ]);
            $this->dropClient($clientId);
            return;
        }

        $name = trim((string) ($msg['name'] ?? 'Player'));
        if ($name === '') {
            $name = 'Player';
        }
        $name = substr($name, 0, 24);

        $player = $this->room->add($name);
        $this->clients[$clientId]['joined']   = true;
        $this->clients[$clientId]['playerId'] = $player['id'];

        WebSocket::sendJson($socket, [
            'type'    => 'joined',
            'you'     => $this->room->toPublic($player),
            'players' => $this->room->allPublic(),
        ]);

        $this->broadcast(
            ['type' => 'player_joined', 'player' => $this->room->toPublic($player)],
            $player['id'],
        );
    }

    private function handleMove(int $clientId, array $msg): void
    {
        $playerId = $this->clients[$clientId]['playerId'];
        if ($playerId === null) {
            return;
        }

        $player = $this->room->updatePosition($playerId, $msg);
        if ($player === null) {
            return;
        }

        $this->broadcast([
            'type' => 'player_move',
            'id'   => $playerId,
            'x'    => $player['x'],
            'y'    => $player['y'],
            'z'    => $player['z'],
            'rz'   => $player['rz'],
        ], $playerId);
    }

    private function broadcast(array $payload, ?string $exceptPlayerId = null): void
    {
        $frame = WebSocket::encode(json_encode($payload, JSON_UNESCAPED_UNICODE));
        if ($frame === '') {
            return;
        }

        foreach ($this->clients as $client) {
            if (!$client['ws']) {
                continue;
            }
            if ($exceptPlayerId !== null && $client['playerId'] === $exceptPlayerId) {
                continue;
            }
            @fwrite($client['socket'], $frame);
        }
    }

    private function dropClient(int $id): void
    {
        if (!isset($this->clients[$id])) {
            return;
        }

        $playerId = $this->clients[$id]['playerId'];
        if ($playerId !== null && $this->room->has($playerId)) {
            $this->room->remove($playerId);
            $this->broadcast(['type' => 'player_left', 'id' => $playerId]);
        }

        @fclose($this->clients[$id]['socket']);
        unset($this->clients[$id]);
    }
}
