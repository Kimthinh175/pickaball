const Controls = {
  init() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      Game.keys[e.key] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        Game.serve();
      } else if (e.code === 'KeyQ') Game.useSkill('SHIELD');
      else if (e.code === 'KeyW') Game.useSkill('DROPSHOT');
      else if (e.code === 'KeyE') Game.useSkill('SMASH');
    });

    window.addEventListener('keyup', (e) => {
      Game.keys[e.key] = false;
    });

    // Mobile Swipe & Tap
    const wrapper = document.getElementById('canvas-wrapper');
    let touchStartX = 0;
    let initialPlayerX = 0;
    let isSwiping = false;

    wrapper.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      initialPlayerX = Game.player.x;
      isSwiping = false;
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
      if (!Game.isPlaying) return;
      isSwiping = true;
      const deltaX = e.touches[0].clientX - touchStartX;
      const sensitivity = 1.6; 
      
      let newX = initialPlayerX + (deltaX * sensitivity);
      
      const pWidth = Game.player.effects.shield && Game.player.effects.shield > Date.now() ? Game.player.width * 1.6 : Game.player.width;
      if (newX < 0) newX = 0;
      if (newX > Game.width - pWidth) newX = Game.width - pWidth;
      
      Game.player.x = newX;
    }, { passive: true });

    wrapper.addEventListener('touchend', (e) => {
      // If user tapped without swiping, try to serve
      if (!isSwiping) {
        if (!Game.isPlaying && !Game.isGameOver) {
          Game.startGame();
        } else {
          Game.serve();
        }
      }
    });

    // Handle desktop mouse click to serve
    wrapper.addEventListener('mousedown', (e) => {
      if (!Game.isPlaying && !Game.isGameOver) {
        Game.startGame();
      } else {
        Game.serve();
      }
    });

    // Buttons
    document.getElementById('btn-shield').addEventListener('click', (e) => { e.preventDefault(); Game.useSkill('SHIELD'); });
    document.getElementById('btn-drop').addEventListener('click', (e) => { e.preventDefault(); Game.useSkill('DROPSHOT'); });
    document.getElementById('btn-smash').addEventListener('click', (e) => { e.preventDefault(); Game.useSkill('SMASH'); });
  }
};
