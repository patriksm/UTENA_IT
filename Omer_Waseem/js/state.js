/* ============================================
   NEON SERPENT — Shared Game State
   ============================================ */

import { BASE_COLS, BASE_ROWS, GRID_SIZE, DIR, DIFFICULTIES } from './config.js';

/**
 * Single shared state object. All modules import and mutate this
 * object's properties — ES module imports are singletons, so every
 * module always reads the latest values.
 */
export const state = {
    // Canvas dimensions (updated on resize)
    COLS:     BASE_COLS,
    ROWS:     BASE_ROWS,
    CANVAS_W: BASE_COLS * GRID_SIZE,
    CANVAS_H: BASE_ROWS * GRID_SIZE,

    // Snake
    snake:         null,
    direction:     DIR.RIGHT,
    nextDirection: DIR.RIGHT,

    // World
    food:      null,
    obstacles: [],

    // Scores & progression
    score:     0,
    highScore: 0,
    level:     1,
    speed:     DIFFICULTIES.medium.baseSpeed,

    // Loop handle
    gameLoop: null,

    // 'idle' | 'playing' | 'paused' | 'over'
    gameState: 'idle',

    // Visuals
    particles:    [],
    foodPulse:    0,
    pauseBanner:  null,

    // Food countdown (extreme mode)
    foodTimeoutId: null,
    foodSpawnTime: 0,

    // Difficulty
    selectedDifficulty: 'medium',
};

/** Returns the pixel size of one grid cell based on current canvas width. */
export function getCellSize() {
    return state.CANVAS_W / state.COLS;
}

// --- localStorage helpers ---

export function getHighScore(diff) {
    return parseInt(localStorage.getItem(`neonSerpentHigh_${diff}`) || '0', 10);
}

export function setHighScore(diff, val) {
    localStorage.setItem(`neonSerpentHigh_${diff}`, val.toString());
}

// One-time migration: move the old unified key into the medium slot
const legacyHigh = localStorage.getItem('neonSerpentHigh');
if (legacyHigh && !localStorage.getItem('neonSerpentHigh_medium')) {
    localStorage.setItem('neonSerpentHigh_medium', legacyHigh);
}
