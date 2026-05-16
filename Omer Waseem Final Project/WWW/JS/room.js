import { CONFIG } from "./config.js";

// Room layout from Patric's original 3D demo
export const ROOM_MAP = [
  { id: "floor", w: 1000, h: 1000, color: "grey", x: 0, y: 0, z: -100, rx: 0, ry: 90, rz: 0 },
  { id: "hinter-wall", w: 1000, h: 200, color: "aquamarine", x: -500, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
  { id: "right-wall", w: 1000, h: 200, color: "#ff0086", x: 0, y: 500, z: 0, rx: 0, ry: 0, rz: 90 },
  { id: "left-wall", w: 1000, h: 200, color: "#17c97d", x: 0, y: -500, z: 0, rx: 0, ry: 0, rz: 90 },
  { id: "central_item", w: 10, h: 10, color: "black", x: -10, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
];

export function buildTransform(worldEl, item) {
  const cx = worldEl.clientWidth / 2 - item.w / 2;
  const cy = worldEl.clientHeight / 2 - item.h / 2;
  return [
    `translate3d(${cx + item.y}px, ${cy - item.z}px, ${item.x}px)`,
    `rotateX(${item.ry}deg) rotateY(${item.rz}deg) rotateZ(${item.rx}deg)`,
  ].join(" ");
}

export function buildCameraTransform(pawn) {
  const z = CONFIG.cameraZ;
  return [
    `translateZ(${z}px)`,
    `rotateX(${-pawn.ry}deg) rotateY(${pawn.rz}deg) rotateZ(${pawn.rx}deg)`,
    `translate3d(${pawn.y}px, ${-pawn.z}px, ${-pawn.x}px)`,
  ].join(" ");
}

export function mountRoom(worldEl) {
  for (const piece of ROOM_MAP) {
    const el = document.createElement("div");
    el.className = "room-surface";
    el.id = piece.id;
    el.style.width = `${piece.w}px`;
    el.style.height = `${piece.h}px`;
    el.style.backgroundColor = piece.color;
    el.style.transform = buildTransform(worldEl, piece);
    worldEl.appendChild(el);
  }
}
