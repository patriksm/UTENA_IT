// Must match server/config.php port
export const GAME_PORT = 8080;

export const CONFIG = {
  wsUrl: (() => {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const host = location.hostname || "127.0.0.1";
    return `${proto}//${host}:${GAME_PORT}`;
  })(),
  tickMs: 10,
  syncIntervalMs: 50,
  connectTimeoutMs: 8000,
  cameraZ: 600,
  moveSpeed: 5,
  playerBody: { w: 28, h: 48 },
};
