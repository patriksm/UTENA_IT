/* ============================================
   NEON SERPENT — Game Engine
   ============================================ */

(() => {
    // --- Configuration ---
    const GRID_SIZE = 20;
    const BASE_COLS = 27;
    const BASE_ROWS = 27;
    const BASE_SPEED = 130;
    const SPEED_DECREMENT = 4;
    const MIN_SPEED = 55;
    const FOOD_SCORE = 10;
    const LEVEL_THRESHOLD = 50;

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

    // --- Responsive canvas sizing ---
    function resizeCanvas() {
        const wrapper = document.querySelector('.game-wrapper');
        const wrapperStyle = getComputedStyle(wrapper);
        const paddingX = parseFloat(wrapperStyle.paddingLeft) + parseFloat(wrapperStyle.paddingRight);
        const framePadding = 12; // 6px padding on each side of canvas-frame
        const frameBorder = 2;
        const availableWidth = wrapper.clientWidth - paddingX - framePadding - frameBorder;

        // Calculate grid size that fits the available width
        // Keep grid count the same, scale the grid cell size
        const maxCanvasSize = Math.min(availableWidth, BASE_COLS * GRID_SIZE);
        const cellSize = Math.floor(maxCanvasSize / BASE_COLS);
        const actualSize = cellSize * BASE_COLS;

        COLS = BASE_COLS;
        ROWS = BASE_ROWS;
        CANVAS_W = actualSize;
        CANVAS_H = actualSize;

        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;

        // Redraw if game is initialized
        if (snake) {
            draw();
        }
    }

    // Helper to get current cell size
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

    // Load high score
    highScore = parseInt(localStorage.getItem('neonSerpentHigh') || '0', 10);
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
        speed = BASE_SPEED;
        particles = [];
        foodPulse = 0;
        updateUI();
        spawnFood();
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

    // --- Food ---
    function spawnFood() {
        const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * COLS),
                y: Math.floor(Math.random() * ROWS),
            };
        } while (occupied.has(`${pos.x},${pos.y}`));
        food = pos;
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
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
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
    }

    function drawSnake() {
        const cell = getCellSize();
        const len = snake.length;
        snake.forEach((seg, i) => {
            const t = i / Math.max(len - 1, 1); // 0=head, 1=tail
            const cx = seg.x * cell + cell / 2;
            const cy = seg.y * cell + cell / 2;

            // Interpolate color from head (cyan) to tail (dark cyan)
            const r = Math.round(0 + t * 0);
            const g = Math.round(240 - t * 120);
            const b = Math.round(255 - t * 135);
            const color = `rgb(${r}, ${g}, ${b})`;

            const radius = cell / 2 - (i === 0 ? 1 : 2 + t * 1);

            // Glow for head and near-head segments
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

            // Body segment
            ctx.save();
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = i === 0 ? 10 : 4;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Head details
            if (i === 0) {
                // Eyes
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

                // Pupils
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

        // Draw connection lines between segments for smoother look
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
        // Clear
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        drawGrid();
        drawBorderGlow();
        drawFood();
        drawSnake();
        drawParticles();
    }

    // --- Game Logic ---
    function step() {
        // Apply direction
        direction = nextDirection;

        // Move head
        const head = { ...snake[0] };
        head.x += direction.x;
        head.y += direction.y;

        // Wall collision
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
            gameOver();
            return;
        }

        // Self collision
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                gameOver();
                return;
            }
        }

        snake.unshift(head);

        // Eat food?
        if (head.x === food.x && head.y === food.y) {
            score += FOOD_SCORE;
            emitParticles(food.x, food.y, 18);

            // Level up
            const newLevel = Math.floor(score / LEVEL_THRESHOLD) + 1;
            if (newLevel > level) {
                level = newLevel;
                speed = Math.max(MIN_SPEED, BASE_SPEED - (level - 1) * SPEED_DECREMENT);
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
    }

    function gameOver() {
        gameState = 'over';
        clearInterval(gameLoop);

        // Flash effect
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 170, 0.15)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.restore();

        // Emit death particles from head
        if (snake.length > 0) {
            emitParticles(snake[0].x, snake[0].y, 35);
        }

        // Animate remaining particles
        const deathAnim = setInterval(() => {
            updateParticles();
            draw();
            if (particles.length === 0) clearInterval(deathAnim);
        }, 30);

        // Check high score
        let isNewHigh = false;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('neonSerpentHigh', highScore.toString());
            highScoreEl.textContent = highScore;
            isNewHigh = true;
        }

        // Show overlay after brief delay
        setTimeout(() => {
            finalScoreEl.textContent = score;
            if (isNewHigh && score > 0) {
                newHighScoreEl.classList.remove('hidden');
            } else {
                newHighScoreEl.classList.add('hidden');
            }
            gameOverOverlay.classList.remove('hidden');
        }, 600);
    }

    function togglePause() {
        if (gameState === 'playing') {
            gameState = 'paused';
            clearInterval(gameLoop);
            showPauseBanner();
        } else if (gameState === 'paused') {
            gameState = 'playing';
            removePauseBanner();
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

    // --- Input ---
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();

        // Space to start/restart
        if (key === ' ' || key === 'enter') {
            e.preventDefault();
            if (gameState === 'idle' || gameState === 'over') {
                startGame();
                return;
            }
        }

        // Pause
        if (key === 'p') {
            if (gameState === 'playing' || gameState === 'paused') {
                togglePause();
                return;
            }
        }

        // Movement
        if (gameState !== 'playing') return;

        let newDir = null;
        switch (key) {
            case 'arrowup': case 'w': newDir = DIR.UP; break;
            case 'arrowdown': case 's': newDir = DIR.DOWN; break;
            case 'arrowleft': case 'a': newDir = DIR.LEFT; break;
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

        if (Math.max(absDx, absDy) < 20) return; // too small

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

                // If game hasn't started, start it
                if (gameState === 'idle' || gameState === 'over') {
                    startGame();
                    return;
                }

                if (gameState !== 'playing') return;

                let newDir = null;
                switch (dir) {
                    case 'up': newDir = DIR.UP; break;
                    case 'down': newDir = DIR.DOWN; break;
                    case 'left': newDir = DIR.LEFT; break;
                    case 'right': newDir = DIR.RIGHT; break;
                }

                if (newDir && !opposites(newDir, direction)) {
                    nextDirection = newDir;
                }
            }, { passive: false });
        });

        // Mobile pause button
        if (mobilePause) {
            mobilePause.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (gameState === 'playing' || gameState === 'paused') {
                    togglePause();
                }
            }, { passive: false });
        }
    }

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
