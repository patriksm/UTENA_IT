import { CONFIG, GAME_PORT } from "./config.js";
import { mountRoom, buildCameraTransform } from "./room.js";
import {
  createLocalPlayer,
  createInputState,
  wireControls,
  updateLocalPlayer,
  setSpawnPosition,
} from "./localPlayer.js";
import { createRemoteRenderer } from "./remotePlayers.js";
import { createNetwork } from "./network.js";
import { bindJoinForm, isGameVisible } from "./ui.js";

const world = document.getElementById("world");
const container = document.getElementById("container");
const statusEl = document.getElementById("status");

const pawn = createLocalPlayer();
const input = createInputState();
const network = createNetwork();
const remotes = createRemoteRenderer(world);

let lastSync = 0;

// Warn early if the page was opened on the wrong port (e.g. Live Server or MAMP)
const pagePort = location.port || (location.protocol === "https:" ? "443" : "80");
if (pagePort !== String(GAME_PORT)) {
  statusEl.textContent = `Wrong URL — open http://localhost:${GAME_PORT} (you are on port ${pagePort}).`;
}

mountRoom(world);
wireControls(container, input, isGameVisible);

bindJoinForm((name, { onSuccess, onFailure }) => {
  network.connect(name, {
    onReady(player) {
      setSpawnPosition(pawn, player.id);
      remotes.sync(network.getOthers());
      onSuccess(player);
    },
    onError: onFailure,
    onRosterChange(players) {
      if (isGameVisible()) remotes.sync(players);
    },
  });
});

function gameLoop() {
  if (!isGameVisible()) return;

  updateLocalPlayer(pawn, input);
  world.style.transform = buildCameraTransform(pawn);
  remotes.sync(network.getOthers());

  const now = Date.now();
  if (now - lastSync >= CONFIG.syncIntervalMs) {
    lastSync = now;
    network.sendPosition(pawn.x, pawn.y, pawn.z, pawn.rz);
  }
}

setInterval(gameLoop, CONFIG.tickMs);
