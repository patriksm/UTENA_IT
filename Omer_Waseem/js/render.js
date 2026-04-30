/* ============================================
   NEON SERPENT — Canvas & Rendering
   ============================================ */

import { COLORS, DIFFICULTIES, DIR, BASE_COLS, BASE_ROWS, GRID_SIZE } from './config.js';
import { state, getCellSize }                               from './state.js';
import { drawParticles }                                    from './particles.js';

export const canvas = document.getElementById('game');
export const ctx    = canvas.getContext('2d');

// Set initial canvas size
canvas.width  = state.CANVAS_W;
canvas.height = state.CANVAS_H;

// --- Canvas Sizing ---

export function resizeCanvas() {
    const wrapper      = document.querySelector('.game-wrapper');
    const wrapperStyle = getComputedStyle(wrapper);
    const paddingX     = parseFloat(wrapperStyle.paddingLeft) + parseFloat(wrapperStyle.paddingRight);
    const framePadding = 12; // 6px each side of .canvas-frame
    const frameBorder  = 2;
    const available    = wrapper.clientWidth - paddingX - framePadding - frameBorder;

    const maxSize  = Math.min(available, BASE_COLS * GRID_SIZE);
    const cellSize = Math.floor(maxSize / BASE_COLS);
    const actual   = cellSize * BASE_COLS;

    state.COLS     = BASE_COLS;
    state.ROWS     = BASE_ROWS;
    state.CANVAS_W = actual;
    state.CANVAS_H = actual;

    canvas.width  = actual;
    canvas.height = actual;

    if (state.snake) draw();
}

// --- Draw Helpers ---

export function drawGrid() {
    const cell = getCellSize();
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth   = 0.5;

    for (let x = 0; x <= state.COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cell, 0);
        ctx.lineTo(x * cell, state.CANVAS_H);
        ctx.stroke();
    }
    for (let y = 0; y <= state.ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cell);
        ctx.lineTo(state.CANVAS_W, y * cell);
        ctx.stroke();
    }
}

export function drawBorderGlow() {
    const grd = ctx.createLinearGradient(0, 0, state.CANVAS_W, 0);
    grd.addColorStop(0,   'rgba(0, 240, 255, 0.12)');
    grd.addColorStop(0.5, 'rgba(0, 240, 255, 0.02)');
    grd.addColorStop(1,   'rgba(255, 0, 170, 0.12)');

    ctx.save();
    ctx.strokeStyle = grd;
    ctx.lineWidth   = 2;
    ctx.shadowColor = COLORS.snakeHead;
    ctx.shadowBlur  = 10;
    ctx.strokeRect(1, 1, state.CANVAS_W - 2, state.CANVAS_H - 2);
    ctx.restore();
}

export function drawObstacles() {
    if (!state.obstacles.length) return;
    const cell = getCellSize();
    const diff = DIFFICULTIES[state.selectedDifficulty];
    const p    = Math.max(2, Math.floor(cell * 0.12));

    state.obstacles.forEach(obs => {
        const ox = obs.x * cell + p;
        const oy = obs.y * cell + p;
        const s  = cell - p * 2;

        ctx.save();

        ctx.globalAlpha = 0.14;
        ctx.fillStyle   = diff.color;
        ctx.fillRect(ox, oy, s, s);

        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = diff.color;
        ctx.lineWidth   = 1.5;
        ctx.shadowColor = diff.color;
        ctx.shadowBlur  = 10;
        ctx.strokeRect(ox + 0.5, oy + 0.5, s - 1, s - 1);

        ctx.globalAlpha = 0.55;
        ctx.lineWidth   = 1;
        ctx.shadowBlur  = 4;
        ctx.beginPath();
        ctx.moveTo(ox + 4,     oy + 4);
        ctx.lineTo(ox + s - 4, oy + s - 4);
        ctx.moveTo(ox + s - 4, oy + 4);
        ctx.lineTo(ox + 4,     oy + s - 4);
        ctx.stroke();

        ctx.restore();
    });
}

export function drawFood() {
    const cell  = getCellSize();
    state.foodPulse += 0.08;
    const pulse = Math.sin(state.foodPulse) * 0.25 + 0.75;
    const cx    = state.food.x * cell + cell / 2;
    const cy    = state.food.y * cell + cell / 2;
    const baseR = cell / 2 - 2;

    // Outer glow halo
    ctx.save();
    ctx.shadowColor = COLORS.foodGlow;
    ctx.shadowBlur  = 18 * pulse;
    ctx.fillStyle   = COLORS.foodGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR + 4 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Main circle with radial gradient
    ctx.save();
    ctx.shadowColor = COLORS.food;
    ctx.shadowBlur  = 12;
    const gradient  = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, baseR);
    gradient.addColorStop(0, COLORS.foodInner);
    gradient.addColorStop(1, COLORS.food);
    ctx.fillStyle   = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Shine dot
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(cx - baseR * 0.3, cy - baseR * 0.3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Countdown arc (extreme mode only)
    const diff = DIFFICULTIES[state.selectedDifficulty];
    if (diff.foodTimeout > 0 && state.foodSpawnTime > 0) {
        const elapsed  = Date.now() - state.foodSpawnTime;
        const progress = Math.max(0, 1 - elapsed / diff.foodTimeout);
        const arcR     = baseR + 7;
        const isUrgent = progress < 0.3;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.18)';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, arcR, 0, Math.PI * 2);
        ctx.stroke();

        if (progress > 0) {
            ctx.strokeStyle = diff.color;
            ctx.shadowColor = diff.color;
            ctx.shadowBlur  = isUrgent ? 14 : 6;
            ctx.lineWidth   = 2;
            ctx.globalAlpha = isUrgent
                ? 0.5 + Math.abs(Math.sin(Date.now() * 0.008)) * 0.5
                : 1;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(cx, cy, arcR, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}

export function drawSnake() {
    const cell = getCellSize();
    const len  = state.snake.length;
    const dir  = state.direction;

    state.snake.forEach((seg, i) => {
        const t      = i / Math.max(len - 1, 1);
        const cx     = seg.x * cell + cell / 2;
        const cy     = seg.y * cell + cell / 2;
        const g      = Math.round(240 - t * 120);
        const b      = Math.round(255 - t * 135);
        const color  = `rgb(0, ${g}, ${b})`;
        const radius = cell / 2 - (i === 0 ? 1 : 2 + t * 1);

        // Glow aura on head and near-head segments
        if (i < 4) {
            ctx.save();
            ctx.shadowColor = COLORS.snakeGlow;
            ctx.shadowBlur  = 14 - i * 3;
            ctx.fillStyle   = 'transparent';
            ctx.beginPath();
            ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Body segment
        ctx.save();
        ctx.fillStyle   = color;
        ctx.shadowColor = color;
        ctx.shadowBlur  = i === 0 ? 10 : 4;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Head details — eyes
        if (i === 0) {
            const eyeOffset = cell * 0.2;
            const eyeR      = cell * 0.125;
            let e1x, e1y, e2x, e2y;

            if      (dir === DIR.RIGHT) { e1x = cx + cell*0.15; e1y = cy - eyeOffset; e2x = cx + cell*0.15; e2y = cy + eyeOffset; }
            else if (dir === DIR.LEFT)  { e1x = cx - cell*0.15; e1y = cy - eyeOffset; e2x = cx - cell*0.15; e2y = cy + eyeOffset; }
            else if (dir === DIR.UP)    { e1x = cx - eyeOffset; e1y = cy - cell*0.15; e2x = cx + eyeOffset; e2y = cy - cell*0.15; }
            else                        { e1x = cx - eyeOffset; e1y = cy + cell*0.15; e2x = cx + eyeOffset; e2y = cy + cell*0.15; }

            ctx.save();
            ctx.fillStyle   = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur  = 6;
            ctx.beginPath(); ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.fillStyle = COLORS.bg;
            const pupilR  = cell * 0.06;
            ctx.beginPath(); ctx.arc(e1x + dir.x * 0.8, e1y + dir.y * 0.8, pupilR, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(e2x + dir.x * 0.8, e2y + dir.y * 0.8, pupilR, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    });

    // Connector lines between segments for a smoother look
    if (len > 1) {
        ctx.save();
        ctx.lineWidth = cell - 6;
        ctx.lineCap   = 'round';
        ctx.lineJoin  = 'round';

        for (let i = 0; i < len - 1; i++) {
            const t = i / Math.max(len - 1, 1);
            const g = Math.round(240 - t * 120);
            const b = Math.round(255 - t * 135);
            ctx.strokeStyle = `rgba(0, ${g}, ${b}, 0.4)`;
            ctx.beginPath();
            ctx.moveTo(state.snake[i].x     * cell + cell / 2, state.snake[i].y     * cell + cell / 2);
            ctx.lineTo(state.snake[i + 1].x * cell + cell / 2, state.snake[i + 1].y * cell + cell / 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}

// --- Main Draw Call ---

export function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, state.CANVAS_W, state.CANVAS_H);

    drawGrid();
    drawBorderGlow();
    drawObstacles();
    drawFood();
    drawSnake();
    drawParticles(ctx);
}
