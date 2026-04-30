/* ============================================
   NEON SERPENT — Input Handling
   ============================================ */

import { DIR, opposites }                        from './config.js';
import { state }                                 from './state.js';
import { resizeCanvas, draw }                    from './render.js';
import { startGame, togglePause, setDifficulty } from './game.js';
import { startBtn, restartBtn,
         mobileControls, mobilePause }           from './ui.js';

export function setupInput() {

    // --- Keyboard ---
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();

        if (key === ' ' || key === 'enter') {
            e.preventDefault();
            if (state.gameState === 'idle' || state.gameState === 'over') {
                startGame(); return;
            }
        }

        if (key === 'p') {
            if (state.gameState === 'playing' || state.gameState === 'paused') {
                togglePause(); return;
            }
        }

        if (state.gameState !== 'playing') return;

        let newDir = null;
        switch (key) {
            case 'arrowup':    case 'w': newDir = DIR.UP;    break;
            case 'arrowdown':  case 's': newDir = DIR.DOWN;  break;
            case 'arrowleft':  case 'a': newDir = DIR.LEFT;  break;
            case 'arrowright': case 'd': newDir = DIR.RIGHT; break;
        }

        if (newDir && !opposites(newDir, state.direction)) {
            e.preventDefault();
            state.nextDirection = newDir;
        }
    });

    // --- Touch swipe on canvas ---
    let touchStartX = 0, touchStartY = 0;
    const canvasEl = document.getElementById('game');

    canvasEl.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    canvasEl.addEventListener('touchend', (e) => {
        if (state.gameState !== 'playing') return;
        const dx    = e.changedTouches[0].clientX - touchStartX;
        const dy    = e.changedTouches[0].clientY - touchStartY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) < 20) return; // ignore tiny taps

        const newDir = absDx > absDy
            ? (dx > 0 ? DIR.RIGHT : DIR.LEFT)
            : (dy > 0 ? DIR.DOWN  : DIR.UP);

        if (!opposites(newDir, state.direction)) {
            state.nextDirection = newDir;
        }
    }, { passive: true });

    // --- Mobile D-Pad ---
    if (mobileControls) {
        const dirMap = { up: DIR.UP, down: DIR.DOWN, left: DIR.LEFT, right: DIR.RIGHT };

        mobileControls.querySelectorAll('[data-dir]').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (state.gameState === 'idle' || state.gameState === 'over') {
                    startGame(); return;
                }
                if (state.gameState !== 'playing') return;

                const newDir = dirMap[btn.getAttribute('data-dir')];
                if (newDir && !opposites(newDir, state.direction)) {
                    state.nextDirection = newDir;
                }
            }, { passive: false });
        });

        if (mobilePause) {
            mobilePause.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (state.gameState === 'playing' || state.gameState === 'paused') {
                    togglePause();
                }
            }, { passive: false });
        }
    }

    // --- Buttons ---
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    // --- Difficulty selectors (start screen + game-over pills) ---
    document.querySelectorAll('.diff-btn[data-diff]').forEach(btn => {
        btn.addEventListener('click', () => setDifficulty(btn.dataset.diff));
    });

    document.querySelectorAll('.diff-pill[data-diff]').forEach(pill => {
        pill.addEventListener('click', () => setDifficulty(pill.dataset.diff));
    });

    // --- Window resize ---
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (state.gameState === 'idle') {
                resizeCanvas();
                draw();
            }
        }, 150);
    });
}
