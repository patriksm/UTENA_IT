<?php

declare(strict_types=1);

/**
 * Holds player state for the shared room (max 2 players).
 */
final class GameRoom
{
    private int $nextId = 1;
    /** @var array<string, array> */
    private array $players = [];

    public function __construct(
        private readonly int $maxPlayers,
        private readonly array $colors,
        private readonly array $spawnX,
    ) {
    }

    public function isFull(): bool
    {
        return count($this->players) >= $this->maxPlayers;
    }

    public function has(string $playerId): bool
    {
        return isset($this->players[$playerId]);
    }

    public function add(string $name): array
    {
        $slot     = count($this->players);
        $playerId = (string) $this->nextId++;

        $player = [
            'id'    => $playerId,
            'name'  => $name,
            'color' => $this->colors[$slot % count($this->colors)],
            'x'     => (float) ($this->spawnX[$slot] ?? 0),
            'y'     => 0.0,
            'z'     => 0.0,
            'rz'    => 0.0,
        ];

        $this->players[$playerId] = $player;
        return $player;
    }

    public function remove(string $playerId): void
    {
        unset($this->players[$playerId]);
    }

    public function updatePosition(string $playerId, array $msg): ?array
    {
        if (!isset($this->players[$playerId])) {
            return null;
        }

        $p = &$this->players[$playerId];
        $p['x']  = (float) ($msg['x'] ?? 0);
        $p['y']  = (float) ($msg['y'] ?? 0);
        $p['z']  = (float) ($msg['z'] ?? 0);
        $p['rz'] = (float) ($msg['rz'] ?? 0);

        return $p;
    }

    public function toPublic(array $player): array
    {
        return [
            'id'    => $player['id'],
            'name'  => $player['name'],
            'color' => $player['color'],
            'x'     => $player['x'],
            'y'     => $player['y'],
            'z'     => $player['z'],
            'rz'    => $player['rz'],
        ];
    }

    /** @return list<array> */
    public function allPublic(): array
    {
        $list = [];
        foreach ($this->players as $player) {
            $list[] = $this->toPublic($player);
        }
        return $list;
    }
}
