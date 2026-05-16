import { CONFIG } from "./config.js";

const DEG = Math.PI / 180;

export function createLocalPlayer() {
  return { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
}

export function createInputState() {
  return {
    move: { x: 0, y: 0 },
    look: { x: 0, y: 0 },
    pointerLocked: false,
  };
}

export function wireControls(container, input, canControl) {
  document.addEventListener("pointerlockchange", () => {
    input.pointerLocked = document.pointerLockElement === container;
  });

  container.addEventListener("click", () => {
    if (!canControl() || input.pointerLocked) return;
    container.requestPointerLock();
  });

  const speed = CONFIG.moveSpeed;

  document.addEventListener("keydown", (e) => {
    if (!canControl()) return;
    if (e.code === "KeyW") input.move.x = -speed;
    if (e.code === "KeyS") input.move.x = speed;
    if (e.code === "KeyD") input.move.y = -speed;
    if (e.code === "KeyA") input.move.y = speed;
  });

  document.addEventListener("keyup", (e) => {
    if (!canControl()) return;
    if (e.code === "KeyW" || e.code === "KeyS") input.move.x = 0;
    if (e.code === "KeyD" || e.code === "KeyA") input.move.y = 0;
  });

  document.addEventListener("mousemove", (e) => {
    if (!input.pointerLocked) return;
    input.look.x = e.movementX;
    input.look.y = e.movementY;
  });
}

export function updateLocalPlayer(pawn, input) {
  if (!input.pointerLocked) return;

  const { x: mx, y: my } = input.move;
  const angle = pawn.rz * DEG;

  pawn.x += mx * Math.cos(angle) - my * Math.sin(angle);
  pawn.y += mx * Math.sin(angle) + my * Math.cos(angle);
  pawn.rz += input.look.x;

  input.look.x = 0;
  input.look.y = 0;
}

export function setSpawnPosition(pawn, playerId) {
  // First joiner spawns left, second spawns right (matches server)
  pawn.x = playerId === "1" ? -80 : 80;
  pawn.y = 0;
  pawn.z = 0;
}
