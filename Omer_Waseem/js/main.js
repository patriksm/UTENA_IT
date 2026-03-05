/* ============================================
   NEON SERPENT — Entry Point
   ============================================ */

import { state, getHighScore }           from './state.js';
import { resizeCanvas, draw }            from './render.js';
import { initGame }                      from './game.js';
import { syncDiffUI, updateDifficultyBadge,
         highScoreEl }                   from './ui.js';
import { setupInput }                    from './input.js';

// Initialise high-score display for the default difficulty
state.highScore         = getHighScore(state.selectedDifficulty);
highScoreEl.textContent = state.highScore;

// Sync difficulty UI and badge before first render
state.gameState = 'idle';
syncDiffUI();
updateDifficultyBadge();

// Size the canvas, build the initial game state, and render
resizeCanvas();
initGame();
draw();

// Wire up all event listeners
setupInput();

// Ambient pulse animation while on the start screen
function idleLoop() {
    if (state.gameState === 'idle') {
        state.foodPulse += 0.04;
        draw();
    }
    requestAnimationFrame(idleLoop);
}
idleLoop();
