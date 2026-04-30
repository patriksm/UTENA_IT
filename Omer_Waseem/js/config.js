/* ============================================
   NEON SERPENT — Constants & Configuration
   ============================================ */

export const GRID_SIZE   = 20;
export const BASE_COLS   = 27;
export const BASE_ROWS   = 27;
export const FOOD_SCORE  = 10;

export const DIFFICULTIES = {
    easy: {
        label:           'EASY',
        badge:           'EZY',
        baseSpeed:       165,
        speedDecrement:  3,
        minSpeed:        80,
        scoreMultiplier: 1,
        levelThreshold:  50,
        wallWrap:        true,   // snake wraps through walls instead of dying
        obstacleCount:   0,
        foodTimeout:     0,      // food never disappears
        color:           '#00ff88',
        glowColor:       'rgba(0, 255, 136, 0.45)',
    },
    medium: {
        label:           'MEDIUM',
        badge:           'MED',
        baseSpeed:       130,
        speedDecrement:  4,
        minSpeed:        60,
        scoreMultiplier: 2,
        levelThreshold:  50,
        wallWrap:        false,
        obstacleCount:   0,
        foodTimeout:     0,
        color:           '#ffe600',
        glowColor:       'rgba(255, 230, 0, 0.45)',
    },
    hard: {
        label:           'HARD',
        badge:           'HRD',
        baseSpeed:       100,
        speedDecrement:  5,
        minSpeed:        45,
        scoreMultiplier: 3,
        levelThreshold:  40,
        wallWrap:        false,
        obstacleCount:   6,
        foodTimeout:     0,
        color:           '#ff8800',
        glowColor:       'rgba(255, 136, 0, 0.45)',
    },
    extreme: {
        label:           'XTREME',
        badge:           'XTR',
        baseSpeed:       70,
        speedDecrement:  5,
        minSpeed:        28,
        scoreMultiplier: 5,
        levelThreshold:  30,
        wallWrap:        false,
        obstacleCount:   10,
        foodTimeout:     8000,   // food disappears after 8 seconds
        color:           '#ff0055',
        glowColor:       'rgba(255, 0, 85, 0.45)',
    },
};

export const COLORS = {
    bg:         '#06060f',
    grid:       'rgba(0, 240, 255, 0.025)',
    snakeHead:  '#00f0ff',
    snakeBody:  '#00c8dd',
    snakeTail:  '#007888',
    snakeGlow:  'rgba(0, 240, 255, 0.35)',
    food:       '#ff00aa',
    foodGlow:   'rgba(255, 0, 170, 0.5)',
    foodInner:  '#ff55cc',
    particle:   '#ff00aa',
    particleAlt:'#00f0ff',
    wallGlow:   'rgba(0, 240, 255, 0.08)',
};

export const DIR = {
    UP:    { x: 0,  y: -1 },
    DOWN:  { x: 0,  y:  1 },
    LEFT:  { x: -1, y:  0 },
    RIGHT: { x:  1, y:  0 },
};

export function opposites(a, b) {
    return a.x + b.x === 0 && a.y + b.y === 0;
}
