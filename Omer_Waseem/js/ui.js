/* ============================================
   NEON SERPENT — DOM References & UI Updates
   ============================================ */

import { DIFFICULTIES }          from './config.js';
import { state, getHighScore }   from './state.js';

// --- DOM References ---
export const scoreEl         = document.getElementById('score');
export const highScoreEl     = document.getElementById('highScore');
export const levelEl         = document.getElementById('level');
export const finalScoreEl    = document.getElementById('finalScore');
export const startOverlay    = document.getElementById('startOverlay');
export const gameOverOverlay = document.getElementById('gameOverOverlay');
export const newHighScoreEl  = document.getElementById('newHighScore');
export const startBtn        = document.getElementById('startBtn');
export const restartBtn      = document.getElementById('restartBtn');
export const canvasFrame     = document.querySelector('.canvas-frame');
export const mobileControls  = document.getElementById('mobileControls');
export const mobilePause     = document.getElementById('mobilePause');
export const diffBadgeEl     = document.getElementById('diffBadge');

// --- UI Update Functions ---

export function updateUI() {
    scoreEl.textContent     = state.score;
    levelEl.textContent     = state.level;
    highScoreEl.textContent = state.highScore;
}

export function popScore() {
    scoreEl.classList.remove('score-pop');
    void scoreEl.offsetWidth; // force reflow to restart animation
    scoreEl.classList.add('score-pop');
}

export function updateDifficultyBadge() {
    const diff = DIFFICULTIES[state.selectedDifficulty];
    diffBadgeEl.textContent  = diff.badge;
    diffBadgeEl.style.color  = diff.color;
    diffBadgeEl.style.textShadow = `0 0 10px ${diff.color}88, 0 0 30px ${diff.color}33`;
}

/** Keeps the active class in sync across the start-screen buttons and game-over pills. */
export function syncDiffUI() {
    document.querySelectorAll('.diff-btn[data-diff]').forEach(btn => {
        btn.classList.toggle('diff-active', btn.dataset.diff === state.selectedDifficulty);
    });
    document.querySelectorAll('.diff-pill[data-diff]').forEach(pill => {
        pill.classList.toggle('diff-active', pill.dataset.diff === state.selectedDifficulty);
    });
}

export function showPauseBanner() {
    if (state.pauseBanner) return;
    state.pauseBanner           = document.createElement('div');
    state.pauseBanner.className = 'pause-banner';
    state.pauseBanner.textContent = 'PAUSED';
    canvasFrame.appendChild(state.pauseBanner);
}

export function removePauseBanner() {
    if (state.pauseBanner) {
        state.pauseBanner.remove();
        state.pauseBanner = null;
    }
}
