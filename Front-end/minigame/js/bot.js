const Bot = {
  init() {
    this.targetX = Game.opponent.x;
  },

  update() {
    if (!Game.isPlaying) return;

    const oppW = Game.opponent.effects.shield && Game.opponent.effects.shield > Date.now() ? Game.opponent.width * 1.6 : Game.opponent.width;
    const oppCenter = Game.opponent.x + oppW / 2;

    if (Game.isServing && !Game.isMyTurnToServe) {
      setTimeout(() => {
        if (Game.isServing && !Game.isMyTurnToServe) {
          Game.isServing = false;
          Game.ball.vy = 7;
          Game.ball.vx = (Math.random() - 0.5) * 6;
          GameAudio.playHit(7, 'normal');
        }
      }, 1500);
    } else if (!Game.isServing) {
      if (Game.ball.vy < 0) {
        this.targetX = Game.ball.x - oppW / 2;
        
        const distY = Math.abs(Game.ball.y - Game.opponent.y);
        
        // Bot decides to use a skill before hitting
        if (distY < 150 && !Game.opponent.pendingSkill) {
          if (Game.opponentEnergy >= 50 && Math.random() < 0.3) {
            Game.opponentEnergy -= 50;
            Game.opponent.pendingSkill = 'SMASH';
          } else if (Game.opponentEnergy >= 40 && Math.random() < 0.2) {
            Game.opponentEnergy -= 40;
            Game.opponent.pendingSkill = 'DROPSHOT';
          }
        }
      } else {
        this.targetX = Game.width / 2 - oppW / 2;
      }

      if (oppCenter < this.targetX + oppW / 2 - 5) {
        Game.opponent.x += Game.opponent.speed;
      } else if (oppCenter > this.targetX + oppW / 2 + 5) {
        Game.opponent.x -= Game.opponent.speed;
      }

      if (Game.opponent.x < 0) Game.opponent.x = 0;
      if (Game.opponent.x > Game.width - oppW) Game.opponent.x = Game.width - oppW;
    }
  }
};
