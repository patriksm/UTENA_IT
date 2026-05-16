import { CONFIG } from "./config.js";
import { buildTransform } from "./room.js";

export function createRemoteRenderer(worldEl) {
  const nodes = new Map();

  function playerToItem(player) {
    const { w, h } = CONFIG.playerBody;
    return {
      w,
      h,
      x: player.x,
      y: player.y,
      z: player.z + h / 2,
      rx: 0,
      ry: 0,
      rz: player.rz,
    };
  }

  function createNode(player) {
    const root = document.createElement("div");
    root.className = "remote-player";
    root.dataset.playerId = player.id;

    const label = document.createElement("span");
    label.className = "remote-player-name";

    const body = document.createElement("div");
    body.className = "remote-player-body";
    body.style.width = `${CONFIG.playerBody.w}px`;
    body.style.height = `${CONFIG.playerBody.h}px`;

    root.append(label, body);
    worldEl.appendChild(root);
    nodes.set(player.id, root);
    return root;
  }

  function paintNode(root, player) {
    root.style.transform = buildTransform(worldEl, playerToItem(player));
    root.querySelector(".remote-player-name").textContent = player.name;
    root.querySelector(".remote-player-body").style.backgroundColor = player.color;
  }

  return {
    sync(players) {
      const active = new Set(players.map((p) => p.id));

      for (const [id, el] of nodes) {
        if (!active.has(id)) {
          el.remove();
          nodes.delete(id);
        }
      }

      for (const player of players) {
        let root = nodes.get(player.id);
        if (!root) root = createNode(player);
        paintNode(root, player);
      }
    },
  };
}
