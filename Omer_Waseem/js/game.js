/* ============================================
   NEON SERPENT — Core Game Logic
   ============================================ */

import { DIFFICULTIES, FOOD_SCORE, DIR }   from './config.js';
import { state, getCellSize,
         getHighScore, setHighScore }       from './state.js';
import { ctx, resizeCanvas, draw }         from './render.js';
import { emitParticles, updateParticles }  from './particles.js';
import {
    updateUI, popScore, updateDifficultyBadge, syncDiffUI,
    showPauseBanner, removePauseBanner,
    startOverlay, gameOverOverlay,
    newHighScoreEl, finalScoreEl, highScoreEl,
} from './ui.js';

// --- Food Timer ---

export function clearFoodTimer() {
    if (state.foodTimeoutId) {
        clearTimeout(state.foodTimeoutId);
        state.foodTimeoutId = null;
    }
    state.foodSpawnTime = 0;
}

// --- World Generation ---

export function spawnObstacles(count) {
    const midX     = Math.floor(state.COLS / 2);
    const midY     = Math.floor(state.ROWS / 2);
    const safeZone = new Set();

    // Protect the area around the snake's starting position
    for (let dx = -5; dx <= 5; dx++) {
        for (let dy = -3; dy <= 3; dy++) {
            safeZone.add(`${midX + dx},${midY + dy}`);
        }
    }

    let placed = 0, attempts = 0;
    while (placed < count && attempts < 500) {
        const x   = Math.floor(Math.random() * state.COLS);
        const y   = Math.floor(Math.random() * state.ROWS);
        const key = `${x},${y}`;
        if (!safeZone.has(key) && !state.obstacles.find(o => o.x === x && o.y === y)) {
            state.obstacles.push({ x, y });
            placed++;
        }
        attempts++;
    }
}

export function spawnFood() {
    clearFoodTimer();

    const occupied = new Set(state.snake.map(s => `${s.x},${s.y}`));
    state.obstacles.forEach(o => occupied.add(`${o.x},${o.y}`));

    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * state.COLS),
            y: Math.floor(Math.random() * state.ROWS),
        };
    } while (occupied.has(`${pos.x},${pos.y}`));

    state.food          = pos;
    state.foodPulse     = 0;
    state.foodSpawnTime = Date.now();

    const diff = DIFFICULTIES[state.selectedDifficulty];
    if (diff.foodTimeout > 0 && state.gameState === 'playing') {
        state.foodTimeoutId = setTimeout(() => {
            if (state.gameState === 'playing') spawnFood();
        }, diff.foodTimeout);
    }
}

// --- Initialise / Reset ---

export function initGame() {
    const diff = DIFFICULTIES[state.selectedDifficulty];
    const midX = Math.floor(state.COLS / 2);
    const midY = Math.floor(state.ROWS / 2);

    state.snake = [
        { x: midX,     y: midY },
        { x: midX - 1, y: midY },
        { x: midX - 2, y: midY },
    ];
    state.direction     = DIR.RIGHT;
    state.nextDirection = DIR.RIGHT;
    state.score         = 0;
    state.level         = 1;
    state.speed         = diff.baseSpeed;
    state.particles     = [];
    state.foodPulse     = 0;
    state.obstacles     = [];
    clearFoodTimer();

    if (diff.obstacleCount > 0) spawnObstacles(diff.obstacleCount);

    state.highScore = getHighScore(state.selectedDifficulty);
    updateUI();
    spawnFood();
    updateDifficultyBadge();
}

// --- Game Loop ---

function step() {
    const diff = DIFFICULTIES[state.selectedDifficulty];
    state.direction = state.nextDirection;

    const head = { ...state.snake[0] };
    head.x += state.direction.x;
    head.y += state.direction.y;

    // Wall handling — wrap or die depending on difficulty
    if (diff.wallWrap) {
        head.x = ((head.x % state.COLS) + state.COLS) % state.COLS;
        head.y = ((head.y % state.ROWS) + state.ROWS) % state.ROWS;
    } else {
        if (head.x < 0 || head.x >= state.COLS || head.y < 0 || head.y >= state.ROWS) {
            gameOver(); return;
        }
    }

    // Self collision
    for (const seg of state.snake) {
        if (seg.x === head.x && seg.y === head.y) { gameOver(); return; }
    }

    // Obstacle collision
    for (const obs of state.obstacles) {
        if (obs.x === head.x && obs.y === head.y) { gameOver(); return; }
    }

    state.snake.unshift(head);

    if (head.x === state.food.x && head.y === state.food.y) {
        state.score += FOOD_SCORE * diff.scoreMultiplier;
        emitParticles(state.food.x, state.food.y, 18, getCellSize());

        const newLevel = Math.floor(state.score / (diff.levelThreshold * diff.scoreMultiplier)) + 1;
        if (newLevel > state.level) {
            state.level = newLevel;
            state.speed = Math.max(diff.minSpeed, diff.baseSpeed - (state.level - 1) * diff.speedDecrement);
            clearInterval(state.gameLoop);
            state.gameLoop = setInterval(tick, state.speed);
        }

        popScore();
        updateUI();
        spawnFood();
    } else {
        state.snake.pop();
    }
}

export function tick() {
    step();
    updateParticles();
    draw();
}

// --- State Transitions ---

export function startGame() {
    resizeCanvas();
    initGame();
    state.gameState = 'playing';
    startOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    removePauseBanner();
    draw();
    state.gameLoop = setInterval(tick, state.speed);

    // Kick off food countdown for extreme mode
    const diff = DIFFICULTIES[state.selectedDifficulty];
    if (diff.foodTimeout > 0) {
        state.foodTimeoutId = setTimeout(() => {
            if (state.gameState === 'playing') spawnFood();
        }, diff.foodTimeout);
        state.foodSpawnTime = Date.now();
    }
}

export function gameOver() {
    state.gameState = 'over';
    clearInterval(state.gameLoop);
    clearFoodTimer();

    // Flash the canvas red
    ctx.save();
    ctx.fillStyle = 'rgba(255, 0, 170, 0.15)';
    ctx.fillRect(0, 0, state.CANVAS_W, state.CANVAS_H);
    ctx.restore();

    // Death-burst particles from the head
    if (state.snake.length > 0) {
        emitParticles(state.snake[0].x, state.snake[0].y, 35, getCellSize());
    }

    const deathAnim = setInterval(() => {
        updateParticles();
        draw();
        if (state.particles.length === 0) clearInterval(deathAnim);
    }, 30);

    let isNewHigh = false;
    if (state.score > state.highScore) {
        state.highScore = state.score;
        setHighScore(state.selectedDifficulty, state.highScore);
        highScoreEl.textContent = state.highScore;
        isNewHigh = true;
    }

    setTimeout(() => {
        finalScoreEl.textContent = state.score;
        newHighScoreEl.classList.toggle('hidden', !(isNewHigh && state.score > 0));
        syncDiffUI();
        gameOverOverlay.classList.remove('hidden');
    }, 600);
}

export function togglePause() {
    if (state.gameState === 'playing') {
        state.gameState = 'paused';
        clearInterval(state.gameLoop);
        clearFoodTimer();
        showPauseBanner();
    } else if (state.gameState === 'paused') {
        state.gameState = 'playing';
        removePauseBanner();

        // Restart food countdown fresh on resume
        const diff = DIFFICULTIES[state.selectedDifficulty];
        if (diff.foodTimeout > 0) {
            state.foodSpawnTime = Date.now();
            state.foodTimeoutId = setTimeout(() => {
                if (state.gameState === 'playing') spawnFood();
            }, diff.foodTimeout);
        }

        state.gameLoop = setInterval(tick, state.speed);
    }
}

// --- Difficulty Selection ---

export function setDifficulty(key) {
    state.selectedDifficulty = key;
    syncDiffUI();
    state.highScore         = getHighScore(state.selectedDifficulty);
    highScoreEl.textContent = state.highScore;
    updateDifficultyBadge();
}
