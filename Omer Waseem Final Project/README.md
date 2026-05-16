# Omer Waseem Final Project — 3D Multiplayer Room

Two-player 3D room (Patric's CSS demo + WebSocket multiplayer).

- **Client:** HTML, CSS, JavaScript modules — no game libraries
- **Server:** pure PHP, split into small files under `server/lib/`

## Run

From this folder (`UTENA_IT/Omer Waseem Final Project/`):

```bash
cd "UTENA_IT/Omer Waseem Final Project"
php server/server.php
```

Open two tabs at **http://localhost:8080**, enter a name in each, join, click the room, move with **WASD**.

## Layout

```
server/
  server.php              entry point
  config.php              port, colors, paths
  lib/
    WebSocket.php         frames + handshake
    StaticFileServer.php  serves WWW/
    GameRoom.php          player state
    GameServer.php        connection loop

WWW/JS/
  main.js                 wires everything
  config.js               timings, sizes
  room.js                 walls + 3D math
  localPlayer.js          WASD + mouse
  remotePlayers.js        other player's avatars
  network.js              WebSocket client
  ui.js                   join overlay
```

## Credits

- Room: Patric (`UTENA_IT/Patric/3D/`)
- Multiplayer: Omer Waseem
