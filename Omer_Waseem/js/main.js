/* ============================================
   NEON SERPENT — Game Engine
   ============================================ */

(() => {
    // --- Configuration ---
    const GRID_SIZE = 20;
    const BASE_COLS = 27;
    const BASE_ROWS = 27;
    const FOOD_SCORE = 10;

    // --- Difficulty Definitions ---
    const DIFFICULTIES = {
        easy: {
            label: 'EASY',
            badge: 'EZY',
            baseSpeed: 165,
            speedDecrement: 3,
            minSpeed: 80,
            scoreMultiplier: 1,
            levelThreshold: 50,
            wallWrap: true,      // snake wraps through walls instead of dying
            obstacleCount: 0,
            foodTimeout: 0,      // food never disappears
            color: '#00ff88',
            glowColor: 'rgba(0, 255, 136, 0.45)',
        },
        medium: {
            label: 'MEDIUM',
            badge: 'MED',
            baseSpeed: 130,
            speedDecrement: 4,
            minSpeed: 60,
            scoreMultiplier: 2,
            levelThreshold: 50,
            wallWrap: false,
            obstacleCount: 0,
            foodTimeout: 0,
            color: '#ffe600',
            glowColor: 'rgba(255, 230, 0, 0.45)',
        },
        hard: {
            label: 'HARD',
            badge: 'HRD',
            baseSpeed: 100,
            speedDecrement: 5,
            minSpeed: 45,
            scoreMultiplier: 3,
            levelThreshold: 40,
            wallWrap: false,
            obstacleCount: 6,    // static neon barriers on the grid
            foodTimeout: 0,
            color: '#ff8800',
            glowColor: 'rgba(255, 136, 0, 0.45)',
        },
        extreme: {
            label: 'XTREME',
            badge: 'XTR',
            baseSpeed: 70,
            speedDecrement: 5,
            minSpeed: 28,
            scoreMultiplier: 5,
            levelThreshold: 30,
            wallWrap: false,
            obstacleCount: 10,   // more barriers
            foodTimeout: 8000,   // food disappears after 8 seconds
            color: '#ff0055',
            glowColor: 'rgba(255, 0, 85, 0.45)',
        },
    };

    // Dynamic grid sizing
    let COLS = BASE_COLS;
    let ROWS = BASE_ROWS;
    let CANVAS_W = COLS * GRID_SIZE;
    let CANVAS_H = ROWS * GRID_SIZE;

    // --- Colors ---
    const COLORS = {
        bg: '#06060f',
        grid: 'rgba(0, 240, 255, 0.025)',
        snakeHead: '#00f0ff',
        snakeBody: '#00c8dd',
        snakeTail: '#007888',
        snakeGlow: 'rgba(0, 240, 255, 0.35)',
        food: '#ff00aa',
        foodGlow: 'rgba(255, 0, 170, 0.5)',
        foodInner: '#ff55cc',
        particle: '#ff00aa',
        particleAlt: '#00f0ff',
        wallGlow: 'rgba(0, 240, 255, 0.08)',
    };

    // --- DOM ---
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const highScoreEl = document.getElementById('highScore');
    const levelEl = document.getElementById('level');
    const finalScoreEl = document.getElementById('finalScore');
    const startOverlay = document.getElementById('startOverlay');
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const newHighScoreEl = document.getElementById('newHighScore');
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    const canvasFrame = document.querySelector('.canvas-frame');
    const mobileControls = document.getElementById('mobileControls');
    const mobilePause = document.getElementById('mobilePause');
    const diffBadgeEl = document.getElementById('diffBadge');
    const diffPillsEl = document.getElementById('diffPills');

    // --- Responsive canvas sizing ---
    function resizeCanvas() {
        const wrapper = document.querySelector('.game-wrapper');
        const wrapperStyle = getComputedStyle(wrapper);
        const paddingX = parseFloat(wrapperStyle.paddingLeft) + parseFloat(wrapperStyle.paddingRight);
        const framePadding = 12;
        const frameBorder = 2;
        const availableWidth = wrapper.clientWidth - paddingX - framePadding - frameBorder;

        const maxCanvasSize = Math.min(availableWidth, BASE_COLS * GRID_SIZE);
        const cellSize = Math.floor(maxCanvasSize / BASE_COLS);
        const actualSize = cellSize * BASE_COLS;

        COLS = BASE_COLS;
        ROWS = BASE_ROWS;
        CANVAS_W = actualSize;
        CANVAS_H = actualSize;

        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;

        if (snake) draw();
    }

    function getCellSize() {
        return CANVAS_W / COLS;
    }

    // --- Canvas setup ---
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    // --- Game State ---
    let snake, direction, nextDirection, food, score, highScore, level, speed;
    let gameLoop, gameState; // 'idle' | 'playing' | 'paused' | 'over'
    let particles = [];
    let foodPulse = 0;
    let pauseBanner = null;
    let obstacles = [];
    let foodTimeoutId = null;
    let foodSpawnTime = 0;

    // --- Difficulty State ---
    let selectedDifficulty = 'medium';

    // Migrate old unified high score to medium slot (backward compat)
    const legacyHigh = localStorage.getItem('neonSerpentHigh');
    if (legacyHigh && !localStorage.getItem('neonSerpentHigh_medium')) {
        localStorage.setItem('neonSerpentHigh_medium', legacyHigh);
    }

    function getHighScore(diff) {
        return parseInt(localStorage.getItem(`neonSerpentHigh_${diff}`) || '0', 10);
    }

    function setHighScore(diff, val) {
        localStorage.setItem(`neonSerpentHigh_${diff}`, val.toString());
    }

    highScore = getHighScore(selectedDifficulty);
    highScoreEl.textContent = highScore;

    // --- Directions ---
    const DIR = {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 },
    };

    function opposites(a, b) {
        return a.x + b.x === 0 && a.y + b.y === 0;
    }

    // --- Init / Reset ---
    function initGame() {
        const diff = DIFFICULTIES[selectedDifficulty];
        const midX = Math.floor(COLS / 2);
        const midY = Math.floor(ROWS / 2);
        snake = [
            { x: midX, y: midY },
            { x: midX - 1, y: midY },
            { x: midX - 2, y: midY },
        ];
        direction = DIR.RIGHT;
        nextDirection = DIR.RIGHT;
        score = 0;
        level = 1;
        speed = diff.baseSpeed;
        particles = [];
        foodPulse = 0;
        obstacles = [];
        clearFoodTimer();

        if (diff.obstacleCount > 0) {
            spawnObstacles(diff.obstacleCount);
        }

        highScore = getHighScore(selectedDifficulty);
        updateUI();
        spawnFood();
        updateDifficultyBadge();
    }

    function updateUI() {
        scoreEl.textContent = score;
        levelEl.textContent = level;
        highScoreEl.textContent = highScore;
    }

    function popScore() {
        scoreEl.classList.remove('score-pop');
        void scoreEl.offsetWidth;
        scoreEl.classList.add('score-pop');
    }

    function updateDifficultyBadge() {
        const diff = DIFFICULTIES[selectedDifficulty];
        diffBadgeEl.textContent = diff.badge;
        diffBadgeEl.style.color = diff.color;
        diffBadgeEl.style.textShadow = `0 0 10px ${diff.color}88, 0 0 30px ${diff.color}33`;
    }

    // --- Obstacle spawning ---
    function spawnObstacles(count) {
        const midX = Math.floor(COLS / 2);
        const midY = Math.floor(ROWS / 2);

        // Protect a clear zone around the snake's starting position
        const safeZone = new Set();
        for (let dx = -5; dx <= 5; dx++) {
            for (let dy = -3; dy <= 3; dy++) {
                safeZone.add(`${midX + dx},${midY + dy}`);
            }
        }

        let placed = 0;
        let attempts = 0;
        while (placed < count && attempts < 500) {
            const x = Math.floor(Math.random() * COLS);
            const y = Math.floor(Math.random() * ROWS);
            const key = `${x},${y}`;
            if (!safeZone.has(key) && !obstacles.find(o => o.x === x && o.y === y)) {
                obstacles.push({ x, y });
                placed++;
            }
            attempts++;
        }
    }

    // --- Food ---
    function clearFoodTimer() {
        if (foodTimeoutId) {
            clearTimeout(foodTimeoutId);
            foodTimeoutId = null;
        }
        foodSpawnTime = 0;
    }

    function spawnFood() {
        clearFoodTimer();

        const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
        obstacles.forEach(o => occupied.add(`${o.x},${o.y}`));

        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * COLS),
                y: Math.floor(Math.random() * ROWS),
            };
        } while (occupied.has(`${pos.x},${pos.y}`));
        food = pos;
        foodPulse = 0;
        foodSpawnTime = Date.now();

        const diff = DIFFICULTIES[selectedDifficulty];
        if (diff.foodTimeout > 0 && gameState === 'playing') {
            foodTimeoutId = setTimeout(() => {
                if (gameState === 'playing') {
                    spawnFood();
                }
            }, diff.foodTimeout);
        }
    }

    // --- Particles ---
    function emitParticles(x, y, count) {
        const cell = getCellSize();
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 1 + Math.random() * 3;
            const life = 25 + Math.random() * 20;
            particles.push({
                x: x * cell + cell / 2,
                y: y * cell + cell / 2,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life,
                maxLife: life,
                color: Math.random() > 0.5 ? COLORS.particle : COLORS.particleAlt,
                size: 2 + Math.random() * 3,
            });
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.life--;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function drawParticles() {
        particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    // --- Drawing ---
    function drawGrid() {
        const cell = getCellSize();
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cell, 0);
            ctx.lineTo(x * cell, CANVAS_H);
            ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cell);
            ctx.lineTo(CANVAS_W, y * cell);
            ctx.stroke();
        }
    }

    function drawBorderGlow() {
        const grd = ctx.createLinearGradient(0, 0, CANVAS_W, 0);
        grd.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
        grd.addColorStop(0.5, 'rgba(0, 240, 255, 0.02)');
        grd.addColorStop(1, 'rgba(255, 0, 170, 0.12)');

        ctx.save();
        ctx.strokeStyle = grd;
        ctx.lineWidth = 2;
        ctx.shadowColor = COLORS.snakeHead;
        ctx.shadowBlur = 10;
        ctx.strokeRect(1, 1, CANVAS_W - 2, CANVAS_H - 2);
        ctx.restore();
    }

    function drawObstacles() {
        if (obstacles.length === 0) return;
        const cell = getCellSize();
        const diff = DIFFICULTIES[selectedDifficulty];
        const p = Math.max(2, Math.floor(cell * 0.12));

        obstacles.forEach(obs => {
            const ox = obs.x * cell + p;
            const oy = obs.y * cell + p;
            const s = cell - p * 2;

            ctx.save();

            // Filled background
            ctx.globalAlpha = 0.14;
            ctx.fillStyle = diff.color;
            ctx.fillRect(ox, oy, s, s);

            // Glowing border
            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = diff.color;
            ctx.lineWidth = 1.5;
            ctx.shadowColor = diff.color;
            ctx.shadowBlur = 10;
            ctx.strokeRect(ox + 0.5, oy + 0.5, s - 1, s - 1);

            // Inner X cross
            ctx.globalAlpha = 0.55;
            ctx.lineWidth = 1;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.moveTo(ox + 4, oy + 4);
            ctx.lineTo(ox + s - 4, oy + s - 4);
            ctx.moveTo(ox + s - 4, oy + 4);
            ctx.lineTo(ox + 4, oy + s - 4);
            ctx.stroke();

            ctx.restore();
        });
    }

    function drawFood() {
        const cell = getCellSize();
        foodPulse += 0.08;
        const pulse = Math.sin(foodPulse) * 0.25 + 0.75;
        const cx = food.x * cell + cell / 2;
        const cy = food.y * cell + cell / 2;
        const baseR = cell / 2 - 2;

        // Outer glow
        ctx.save();
        ctx.shadowColor = COLORS.foodGlow;
        ctx.shadowBlur = 18 * pulse;
        ctx.fillStyle = COLORS.foodGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR + 4 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Main circle
        ctx.save();
        ctx.shadowColor = COLORS.food;
        ctx.shadowBlur = 12;
        const gradient = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, baseR);
        gradient.addColorStop(0, COLORS.foodInner);
        gradient.addColorStop(1, COLORS.food);
        ctx.fillStyle = gradient;
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

        // Countdown arc for extreme mode
        const diff = DIFFICULTIES[selectedDifficulty];
        if (diff.foodTimeout > 0 && foodSpawnTime > 0) {
            const elapsed = Date.now() - foodSpawnTime;
            const progress = Math.max(0, 1 - elapsed / diff.foodTimeout);
            const arcR = baseR + 7;
            const isUrgent = progress < 0.3;

            // Track ring
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 0, 85, 0.18)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, arcR, 0, Math.PI * 2);
            ctx.stroke();

            // Progress arc
            if (progress > 0) {
                ctx.strokeStyle = diff.color;
                ctx.shadowColor = diff.color;
                ctx.shadowBlur = isUrgent ? 14 : 6;
                ctx.lineWidth = 2;
                ctx.globalAlpha = isUrgent ? 0.5 + Math.abs(Math.sin(Date.now() * 0.008)) * 0.5 : 1;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(cx, cy, arcR, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    function drawSnake() {
        const cell = getCellSize();
        const len = snake.length;
        snake.forEach((seg, i) => {
            const t = i / Math.max(len - 1, 1);
            const cx = seg.x * cell + cell / 2;
            const cy = seg.y * cell + cell / 2;

            const g = Math.round(240 - t * 120);
            const b = Math.round(255 - t * 135);
            const color = `rgb(0, ${g}, ${b})`;
            const radius = cell / 2 - (i === 0 ? 1 : 2 + t * 1);

            if (i < 4) {
                ctx.save();
                ctx.shadowColor = COLORS.snakeGlow;
                ctx.shadowBlur = 14 - i * 3;
                ctx.fillStyle = 'transparent';
                ctx.beginPath();
                ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            ctx.save();
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = i === 0 ? 10 : 4;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (i === 0) {
                const eyeOffset = cell * 0.2;
                const eyeR = cell * 0.125;
                let e1x, e1y, e2x, e2y;

                if (direction === DIR.RIGHT) {
                    e1x = cx + cell * 0.15; e1y = cy - eyeOffset;
                    e2x = cx + cell * 0.15; e2y = cy + eyeOffset;
                } else if (direction === DIR.LEFT) {
                    e1x = cx - cell * 0.15; e1y = cy - eyeOffset;
                    e2x = cx - cell * 0.15; e2y = cy + eyeOffset;
                } else if (direction === DIR.UP) {
                    e1x = cx - eyeOffset; e1y = cy - cell * 0.15;
                    e2x = cx + eyeOffset; e2y = cy - cell * 0.15;
                } else {
                    e1x = cx - eyeOffset; e1y = cy + cell * 0.15;
                    e2x = cx + eyeOffset; e2y = cy + cell * 0.15;
                }

                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                ctx.save();
                ctx.fillStyle = COLORS.bg;
                const pupilR = cell * 0.06;
                ctx.beginPath();
                ctx.arc(e1x + direction.x * 0.8, e1y + direction.y * 0.8, pupilR, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(e2x + direction.x * 0.8, e2y + direction.y * 0.8, pupilR, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });

        if (len > 1) {
            ctx.save();
            ctx.lineWidth = cell - 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let i = 0; i < len - 1; i++) {
                const t = i / Math.max(len - 1, 1);
                const g = Math.round(240 - t * 120);
                const b = Math.round(255 - t * 135);
                ctx.strokeStyle = `rgba(0, ${g}, ${b}, 0.4)`;
                ctx.beginPath();
                ctx.moveTo(
                    snake[i].x * cell + cell / 2,
                    snake[i].y * cell + cell / 2
                );
                ctx.lineTo(
                    snake[i + 1].x * cell + cell / 2,
                    snake[i + 1].y * cell + cell / 2
                );
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    function draw() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        drawGrid();
        drawBorderGlow();
        drawObstacles();
        drawFood();
        drawSnake();
        drawParticles();
    }

    // --- Game Logic ---
    function step() {
        const diff = DIFFICULTIES[selectedDifficulty];
        direction = nextDirection;

        const head = { ...snake[0] };
        head.x += direction.x;
        head.y += direction.y;

        // Wall handling — wrap or collide depending on difficulty
        if (diff.wallWrap) {
            head.x = ((head.x % COLS) + COLS) % COLS;
            head.y = ((head.y % ROWS) + ROWS) % ROWS;
        } else {
            if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
                gameOver();
                return;
            }
        }

        // Self collision
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                gameOver();
                return;
            }
        }

        // Obstacle collision
        for (const obs of obstacles) {
            if (obs.x === head.x && obs.y === head.y) {
                gameOver();
                return;
            }
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += FOOD_SCORE * diff.scoreMultiplier;
            emitParticles(food.x, food.y, 18);

            const newLevel = Math.floor(score / (diff.levelThreshold * diff.scoreMultiplier)) + 1;
            if (newLevel > level) {
                level = newLevel;
                speed = Math.max(diff.minSpeed, diff.baseSpeed - (level - 1) * diff.speedDecrement);
                clearInterval(gameLoop);
                gameLoop = setInterval(tick, speed);
            }

            popScore();
            updateUI();
            spawnFood();
        } else {
            snake.pop();
        }
    }

    function tick() {
        step();
        updateParticles();
        draw();
    }

    // --- Game State Transitions ---
    function startGame() {
        resizeCanvas();
        initGame();
        gameState = 'playing';
        startOverlay.classList.add('hidden');
        gameOverOverlay.classList.add('hidden');
        removePauseBanner();
        draw();
        gameLoop = setInterval(tick, speed);

        // Restart food timeout if extreme
        const diff = DIFFICULTIES[selectedDifficulty];
        if (diff.foodTimeout > 0) {
            foodTimeoutId = setTimeout(() => {
                if (gameState === 'playing') spawnFood();
            }, diff.foodTimeout);
            foodSpawnTime = Date.now();
        }
    }

    function gameOver() {
        gameState = 'over';
        clearInterval(gameLoop);
        clearFoodTimer();

        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 170, 0.15)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.restore();

        if (snake.length > 0) {
            emitParticles(snake[0].x, snake[0].y, 35);
        }

        const deathAnim = setInterval(() => {
            updateParticles();
            draw();
            if (particles.length === 0) clearInterval(deathAnim);
        }, 30);

        let isNewHigh = false;
        if (score > highScore) {
            highScore = score;
            setHighScore(selectedDifficulty, highScore);
            highScoreEl.textContent = highScore;
            isNewHigh = true;
        }

        setTimeout(() => {
            finalScoreEl.textContent = score;
            if (isNewHigh && score > 0) {
                newHighScoreEl.classList.remove('hidden');
            } else {
                newHighScoreEl.classList.add('hidden');
            }
            syncDiffUI();
            gameOverOverlay.classList.remove('hidden');
        }, 600);
    }

    function togglePause() {
        if (gameState === 'playing') {
            gameState = 'paused';
            clearInterval(gameLoop);
            clearFoodTimer();
            showPauseBanner();
        } else if (gameState === 'paused') {
            gameState = 'playing';
            removePauseBanner();
            // Restart food timeout fresh on resume
            const diff = DIFFICULTIES[selectedDifficulty];
            if (diff.foodTimeout > 0) {
                foodSpawnTime = Date.now();
                foodTimeoutId = setTimeout(() => {
                    if (gameState === 'playing') spawnFood();
                }, diff.foodTimeout);
            }
            gameLoop = setInterval(tick, speed);
        }
    }

    function showPauseBanner() {
        if (pauseBanner) return;
        pauseBanner = document.createElement('div');
        pauseBanner.className = 'pause-banner';
        pauseBanner.textContent = 'PAUSED';
        canvasFrame.appendChild(pauseBanner);
    }

    function removePauseBanner() {
        if (pauseBanner) {
            pauseBanner.remove();
            pauseBanner = null;
        }
    }

    // --- Difficulty UI Sync ---
    function setDifficulty(key) {
        selectedDifficulty = key;
        syncDiffUI();
        // Update high score display to the selected difficulty
        highScore = getHighScore(selectedDifficulty);
        highScoreEl.textContent = highScore;
        updateDifficultyBadge();
    }

    function syncDiffUI() {
        // Sync start overlay difficulty buttons
        document.querySelectorAll('.diff-btn[data-diff]').forEach(btn => {
            btn.classList.toggle('diff-active', btn.dataset.diff === selectedDifficulty);
        });
        // Sync game over pills
        document.querySelectorAll('.diff-pill[data-diff]').forEach(pill => {
            pill.classList.toggle('diff-active', pill.dataset.diff === selectedDifficulty);
        });
    }

    // --- Input ---
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();

        if (key === ' ' || key === 'enter') {
            e.preventDefault();
            if (gameState === 'idle' || gameState === 'over') {
                startGame();
                return;
            }
        }

        if (key === 'p') {
            if (gameState === 'playing' || gameState === 'paused') {
                togglePause();
                return;
            }
        }

        if (gameState !== 'playing') return;

        let newDir = null;
        switch (key) {
            case 'arrowup':  case 'w': newDir = DIR.UP;    break;
            case 'arrowdown': case 's': newDir = DIR.DOWN;  break;
            case 'arrowleft': case 'a': newDir = DIR.LEFT;  break;
            case 'arrowright': case 'd': newDir = DIR.RIGHT; break;
        }

        if (newDir && !opposites(newDir, direction)) {
            e.preventDefault();
            nextDirection = newDir;
        }
    });

    // --- Touch controls (swipe) ---
    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        if (gameState !== 'playing') return;
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) < 20) return;

        let newDir;
        if (absDx > absDy) {
            newDir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
        } else {
            newDir = dy > 0 ? DIR.DOWN : DIR.UP;
        }

        if (!opposites(newDir, direction)) {
            nextDirection = newDir;
        }
    }, { passive: true });

    // --- Mobile D-Pad Controls ---
    if (mobileControls) {
        const dpadBtns = mobileControls.querySelectorAll('[data-dir]');
        dpadBtns.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const dir = btn.getAttribute('data-dir');

                if (gameState === 'idle' || gameState === 'over') {
                    startGame();
                    return;
                }

                if (gameState !== 'playing') return;

                let newDir = null;
                switch (dir) {
                    case 'up':    newDir = DIR.UP;    break;
                    case 'down':  newDir = DIR.DOWN;  break;
                    case 'left':  newDir = DIR.LEFT;  break;
                    case 'right': newDir = DIR.RIGHT; break;
                }

                if (newDir && !opposites(newDir, direction)) {
                    nextDirection = newDir;
                }
            }, { passive: false });
        });

        if (mobilePause) {
            mobilePause.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (gameState === 'playing' || gameState === 'paused') {
                    togglePause();
                }
            }, { passive: false });
        }
    }

    // --- Difficulty button click handlers ---
    document.querySelectorAll('.diff-btn[data-diff]').forEach(btn => {
        btn.addEventListener('click', () => setDifficulty(btn.dataset.diff));
    });

    document.querySelectorAll('.diff-pill[data-diff]').forEach(pill => {
        pill.addEventListener('click', () => setDifficulty(pill.dataset.diff));
    });

    // --- Buttons ---
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    // --- Resize handler ---
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (gameState === 'idle') {
                resizeCanvas();
                draw();
            }
        }, 150);
    });

    // --- Initial State ---
    gameState = 'idle';
    syncDiffUI();
    updateDifficultyBadge();
    resizeCanvas();
    initGame();
    draw();

    // Ambient idle animation
    function idleLoop() {
        if (gameState === 'idle') {
            foodPulse += 0.04;
            draw();
        }
        requestAnimationFrame(idleLoop);
    }
    idleLoop();
})();
