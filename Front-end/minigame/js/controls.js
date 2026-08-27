// ==========================================
// CONTROLS: TOUCH & KEYBOARD INPUT HANDLER
// ==========================================

const Controls = {
  init() {
    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      Game.keys[e.key] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        Game.serve();
      } else if (e.code === 'KeyQ') Game.useSkill('SHIELD');
      else if (e.code === 'KeyW') Game.useSkill('DROPSHOT');
      else if (e.code === 'KeyE') Game.useSkill('SMASH');
      else if (e.code === 'KeyP' || e.code === 'Escape') Game.togglePause();
      else if (e.code === 'KeyM') GameAudio.toggleMute();
    });

    window.addEventListener('keyup', (e) => {
      Game.keys[e.key] = false;
    });

    // Mobile Touch Controls
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;

    let touchStartX = 0;
    let initialPlayerX = 0;
    let isSwiping = false;

    wrapper.addEventListener('touchstart', (e) => {
      if (Game.isPaused) return;
      touchStartX = e.touches[0].clientX;
      initialPlayerX = Game.player.x;
      isSwiping = false;
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
      if (!Game.isPlaying || Game.isPaused) return;
      isSwiping = true;
      const deltaX = e.touches[0].clientX - touchStartX;
      const sensitivity = 1.55; 
      
      let newX = initialPlayerX + (deltaX * sensitivity);
      
      const pWidth = Game.player.effects.shield && Game.player.effects.shield > Date.now() ? Game.player.width * 1.6 : Game.player.width;
      if (newX < 0) newX = 0;
      if (newX > Game.width - pWidth) newX = Game.width - pWidth;
      
      Game.player.x = newX;
    }, { passive: true });

    wrapper.addEventListener('touchend', (e) => {
      if (Game.isPaused) return;
      if (!isSwiping) {
        if (!Game.isPlaying && !Game.isGameOver) {
          Game.startGame();
        } else {
          Game.serve();
        }
      }
    });

    // Handle desktop mouse click to serve / start
    wrapper.addEventListener('mousedown', (e) => {
      if (Game.isPaused) return;
      if (!Game.isPlaying && !Game.isGameOver) {
        Game.startGame();
      } else {
        Game.serve();
      }
    });

    // Skill Buttons Touch & Click
    document.getElementById('btn-shield')?.addEventListener('click', (e) => {
      e.preventDefault();
      Game.useSkill('SHIELD');
    });
    document.getElementById('btn-drop')?.addEventListener('click', (e) => {
      e.preventDefault();
      Game.useSkill('DROPSHOT');
    });
    document.getElementById('btn-smash')?.addEventListener('click', (e) => {
      e.preventDefault();
      Game.useSkill('SMASH');
    });
  }
};
