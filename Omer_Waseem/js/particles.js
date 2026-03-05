/* ============================================
   NEON SERPENT — Particle System
   ============================================ */

import { COLORS } from './config.js';
import { state }  from './state.js';

/**
 * Spawns `count` particles bursting outward from grid cell (x, y).
 * cellSize is passed in to avoid a circular dependency with render.js.
 */
export function emitParticles(x, y, count, cellSize) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd   = 1 + Math.random() * 3;
        const life  = 25 + Math.random() * 20;
        state.particles.push({
            x:       x * cellSize + cellSize / 2,
            y:       y * cellSize + cellSize / 2,
            vx:      Math.cos(angle) * spd,
            vy:      Math.sin(angle) * spd,
            life,
            maxLife: life,
            color:   Math.random() > 0.5 ? COLORS.particle : COLORS.particleAlt,
            size:    2 + Math.random() * 3,
        });
    }
}

export function updateParticles() {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x  += p.vx;
        p.y  += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life--;
        if (p.life <= 0) state.particles.splice(i, 1);
    }
}

/** ctx is passed in to avoid a circular dependency with render.js. */
export function drawParticles(ctx) {
    state.particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 10;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}
