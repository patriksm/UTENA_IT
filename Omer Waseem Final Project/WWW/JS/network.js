import { CONFIG, GAME_PORT } from "./config.js";

/**
 * Keeps one WebSocket open and tracks other players in the room.
 */
export function createNetwork() {
  let socket = null;
  let myPlayer = null;
  const others = new Map();
  let lastSent = "";
  let connectTimer = null;

  let handlers = {
    onReady: null,
    onError: null,
    onRosterChange: null,
  };

  function clearConnectTimer() {
    if (connectTimer) {
      clearTimeout(connectTimer);
      connectTimer = null;
    }
  }

  function fail(message) {
    clearConnectTimer();
    handlers.onError?.(message);
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case "error":
        fail(msg.message);
        break;

      case "joined":
        clearConnectTimer();
        myPlayer = msg.you;
        others.clear();
        for (const p of msg.players) {
          if (p.id !== myPlayer.id) others.set(p.id, { ...p });
        }
        handlers.onReady?.(myPlayer);
        handlers.onRosterChange?.(getOthers());
        break;

      case "player_joined":
        if (msg.player.id !== myPlayer?.id) {
          others.set(msg.player.id, { ...msg.player });
          handlers.onRosterChange?.(getOthers());
        }
        break;

      case "player_left":
        others.delete(msg.id);
        handlers.onRosterChange?.(getOthers());
        break;

      case "player_move": {
        const p = others.get(msg.id);
        if (p) Object.assign(p, { x: msg.x, y: msg.y, z: msg.z, rz: msg.rz });
        break;
      }

      default:
        console.warn("Unknown message:", msg.type);
    }
  }

  function getOthers() {
    return [...others.values()];
  }

  return {
    connect(name, callbacks) {
      clearConnectTimer();
      myPlayer = null;
      others.clear();
      lastSent = "";
      handlers = { ...handlers, ...callbacks };

      socket = new WebSocket(CONFIG.wsUrl);

      connectTimer = setTimeout(() => {
        if (!myPlayer) {
          socket?.close();
          fail(
            `Timed out connecting to ${CONFIG.wsUrl}. ` +
              `Open http://localhost:${GAME_PORT} and run: php server/server.php`
          );
        }
      }, CONFIG.connectTimeoutMs);

      socket.addEventListener("open", () => {
        socket.send(JSON.stringify({ type: "join", name }));
      });

      socket.addEventListener("message", (event) => {
        try {
          handleMessage(JSON.parse(event.data));
        } catch (err) {
          console.error("Bad server message:", event.data, err);
          fail("Server sent an invalid response. Restart php server/server.php");
        }
      });

      socket.addEventListener("error", () => {
        fail(
          `Could not connect to ${CONFIG.wsUrl}. ` +
            `Use http://localhost:${GAME_PORT} with php server/server.php running.`
        );
      });

      socket.addEventListener("close", () => {
        if (!myPlayer) {
          fail(
            `Connection closed. Use http://localhost:${GAME_PORT} and restart the PHP server.`
          );
        }
      });
    },

    sendPosition(x, y, z, rz) {
      if (!socket || socket.readyState !== WebSocket.OPEN || !myPlayer) return;

      const key = [x, y, z, rz].map((n) => n.toFixed(1)).join(",");
      if (key === lastSent) return;
      lastSent = key;

      socket.send(JSON.stringify({ type: "move", x, y, z, rz }));
    },

    getOthers,
  };
}
