const Engine = {
  fireParticles: [],
  spatialRipples: [],
  dashTrails: [],
  lastPlayerX: 150,

  init() {
    this.bgGradient = Game.ctx.createLinearGradient(0, 0, 0, Game.height);
    this.bgGradient.addColorStop(0, '#0b1329'); // Angular color
    this.bgGradient.addColorStop(1, '#162a59'); // Angular color
  },

  loop(timestamp) {
    if (Game.isPlaying) {
      this.updatePhysics();
    }
    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  },

  checkCollision(ball, paddle) {
    const pWidth = paddle.effects && paddle.effects.shield > Date.now() ? paddle.width * 1.6 : paddle.width;
    if (ball.x + ball.radius > paddle.x &&
        ball.x - ball.radius < paddle.x + pWidth &&
        ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height) {
      return { hit: true, pWidth: pWidth };
    }
    return { hit: false };
  },

  handleBounce(paddle, pWidth, isPlayer) {
    GameAudio.play('hit');
    Game.ball.vy = isPlayer ? -Math.abs(Game.ball.vy * 1.05) : Math.abs(Game.ball.vy * 1.05);
    const paddleCenter = paddle.x + pWidth / 2;
    Game.ball.vx = (Game.ball.x - paddleCenter) * 0.15;

    Game.ball.effects = {};
    const activeSkill = paddle.pendingSkill;
    paddle.pendingSkill = null;

    if (activeSkill === 'SMASH') {
      Game.ball.effects.smash = true;
      Game.ball.vy *= 1.4;
      Game.ball.vx *= 1.4;
    } else if (activeSkill === 'DROPSHOT') {
      Game.ball.effects.dropshot = true;
      Game.ball.vy = isPlayer ? -4 : 4;
    }

    if (Game.ball.vy < -14) Game.ball.vy = -14;
    if (Game.ball.vy > 14) Game.ball.vy = 14;
    if (Game.ball.vx < -8) Game.ball.vx = -8;
    if (Game.ball.vx > 8) Game.ball.vx = 8;
  },

  updatePhysics() {
    // Player Keyboard movement
    if (Game.keys['ArrowLeft'] || Game.keys['a']) Game.player.x -= Game.player.speed;
    if (Game.keys['ArrowRight'] || Game.keys['d']) Game.player.x += Game.player.speed;
    
    const pW = Game.player.effects.shield && Game.player.effects.shield > Date.now() ? Game.player.width * 1.6 : Game.player.width;
    if (Game.player.x < 0) Game.player.x = 0;
    if (Game.player.x > Game.width - pW) Game.player.x = Game.width - pW;

    // Dash trail logic (if moving fast)
    if (Math.abs(Game.player.x - this.lastPlayerX) > 10) {
      this.dashTrails.push({ x: Game.player.x, y: Game.player.y, width: pW, height: Game.player.height, alpha: 0.5 });
    }
    this.lastPlayerX = Game.player.x;

    // Bot Update
    Bot.update();

    // Ball Physics
    if (!Game.isServing) {
      Game.ball.x += Game.ball.vx;
      Game.ball.y += Game.ball.vy;

      if (Game.ball.x < Game.ball.radius || Game.ball.x > Game.width - Game.ball.radius) {
        Game.ball.vx *= -1;
        Game.ball.x = Game.ball.x < Game.ball.radius ? Game.ball.radius : Game.width - Game.ball.radius;
      }

      if (Game.ball.vy > 0) {
        const pCol = this.checkCollision(Game.ball, Game.player);
        if (pCol.hit) {
          Game.ball.y = Game.player.y - Game.ball.radius;
          this.handleBounce(Game.player, pCol.pWidth, true);
        }
      }
      
      if (Game.ball.vy < 0) {
        const oCol = this.checkCollision(Game.ball, Game.opponent);
        if (oCol.hit) {
          Game.ball.y = Game.opponent.y + Game.opponent.height + Game.ball.radius;
          this.handleBounce(Game.opponent, oCol.pWidth, false);
        }
      }

      if (Game.ball.y > Game.height + 20) {
        Game.scoreGoal(false);
      } else if (Game.ball.y < -20) {
        Game.scoreGoal(true);
      }

      if (Game.playerEnergy < 100) Game.playerEnergy += 0.05;
      if (Game.opponentEnergy < 100) Game.opponentEnergy += 0.05;
      Game.updateHUD();
      
      // Particle spawns
      if (Game.ball.effects.smash) {
        for (let i = 0; i < 3; i++) {
          this.fireParticles.push({
            x: Game.ball.x + (Math.random() - 0.5) * 6,
            y: Game.ball.y + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 5 + 3,
            alpha: 1.0,
            color: ['#fef08a', '#f97316', '#ef4444'][Math.floor(Math.random() * 3)]
          });
        }
      }
      
      if (Game.ball.effects.dropshot && Math.random() < 0.2) {
        this.spatialRipples.push({
          x: Game.ball.x,
          y: Game.ball.y,
          radius: Game.ball.radius,
          maxRadius: Game.ball.radius + 20,
          alpha: 0.8,
          color: '#a855f7'
        });
      }
    }
  },

  draw() {
    const ctx = Game.ctx;
    ctx.fillStyle = this.bgGradient;
    ctx.fillRect(0, 0, Game.width, Game.height);

    // Court Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, Game.width - 40, Game.height - 40);
    
    ctx.beginPath();
    ctx.setLineDash([10, 10]);
    ctx.moveTo(20, Game.height / 2);
    ctx.lineTo(Game.width - 20, Game.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(20, Game.height / 2 - 60);
    ctx.lineTo(Game.width - 20, Game.height / 2 - 60);
    ctx.moveTo(20, Game.height / 2 + 60);
    ctx.lineTo(Game.width - 20, Game.height / 2 + 60);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(Game.width / 2, 20);
    ctx.lineTo(Game.width / 2, Game.height / 2 - 60);
    ctx.moveTo(Game.width / 2, Game.height / 2 + 60);
    ctx.lineTo(Game.width / 2, Game.height - 20);
    ctx.stroke();

    // Dash Trails
    for (let i = this.dashTrails.length - 1; i >= 0; i--) {
      const dt = this.dashTrails[i];
      ctx.fillStyle = `rgba(79, 172, 254, ${dt.alpha})`;
      ctx.fillRect(dt.x, dt.y, dt.width, dt.height);
      dt.alpha -= 0.1;
      if (dt.alpha <= 0) this.dashTrails.splice(i, 1);
    }

    // Opponent
    const oppW = Game.opponent.effects.shield && Game.opponent.effects.shield > Date.now() ? Game.opponent.width * 1.6 : Game.opponent.width;
    ctx.fillStyle = '#ff5e62';
    if (Game.opponent.effects.shield && Game.opponent.effects.shield > Date.now()) ctx.fillStyle = 'rgba(255, 94, 98, 0.6)';
    ctx.fillRect(Game.opponent.x, Game.opponent.y, oppW, Game.opponent.height);
    
    // Player
    const pW = Game.player.effects.shield && Game.player.effects.shield > Date.now() ? Game.player.width * 1.6 : Game.player.width;
    ctx.fillStyle = '#4facfe';
    if (Game.player.effects.shield && Game.player.effects.shield > Date.now()) ctx.fillStyle = 'rgba(79, 172, 254, 0.6)';
    ctx.fillRect(Game.player.x, Game.player.y, pW, Game.player.height);
    
    // Spatial Ripples
    for (let i = this.spatialRipples.length - 1; i >= 0; i--) {
      const r = this.spatialRipples[i];
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = r.alpha;
      ctx.lineWidth = 2;
      ctx.stroke();
      r.radius += 1;
      r.alpha -= 0.05;
      if (r.alpha <= 0) this.spatialRipples.splice(i, 1);
    }
    ctx.globalAlpha = 1.0;

    // Fire Particles
    for (let i = this.fireParticles.length - 1; i >= 0; i--) {
      const fp = this.fireParticles[i];
      ctx.fillStyle = fp.color;
      ctx.globalAlpha = fp.alpha;
      ctx.shadowColor = fp.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(fp.x, fp.y, fp.size, 0, Math.PI * 2);
      ctx.fill();
      fp.x += fp.vx;
      fp.y += fp.vy;
      fp.size *= 0.92;
      fp.alpha -= 0.08;
      if (fp.alpha <= 0 || fp.size <= 0.5) this.fireParticles.splice(i, 1);
    }
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    // Draw Ball
    ctx.beginPath();
    ctx.arc(Game.ball.x, Game.ball.y, Game.ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ccff00';
    
    if (Game.ball.effects.smash) {
      ctx.fillStyle = '#ff0000';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
    } else if (Game.ball.effects.dropshot) {
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
    }
    
    ctx.fill();
    ctx.shadowBlur = 0;
  }
};
