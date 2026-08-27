// ==========================================
// ENGINE: 2.5D PRO GRAPHICS & PHYSICS ENGINE
// ==========================================

const Engine = {
  fireParticles: [],
  spatialRipples: [],
  impactSparks: [],
  dashTrails: [],
  lastPlayerX: 150,
  ballRotation: 0,
  dpr: 1,

  init() {
    this.setupHighDPI();
    window.addEventListener('resize', () => this.setupHighDPI());
  },

  setupHighDPI() {
    const canvas = Game.canvas;
    if (!canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Game.width * this.dpr;
    canvas.height = Game.height * this.dpr;
    Game.ctx = canvas.getContext('2d');
    Game.ctx.imageSmoothingEnabled = true;
  },

  loop(timestamp) {
    if (Game.isPlaying && !Game.isPaused) {
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

  spawnImpactSparks(x, y, color = '#d4ff00', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      this.impactSparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color,
        alpha: 1.0
      });
    }
  },

  handleBounce(paddle, pWidth, isPlayer) {
    const hitPower = Math.abs(Game.ball.vy);
    GameAudio.playHit(hitPower, Game.ball.effects.smash ? 'smash' : (Game.ball.effects.dropshot ? 'drop' : 'normal'));
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(Game.ball.effects.smash ? [30, 20, 30] : 15);
    }

    Game.incrementRally();

    // Spawn sparks at hit point
    this.spawnImpactSparks(Game.ball.x, isPlayer ? paddle.y : paddle.y + paddle.height, isPlayer ? '#38bdf8' : '#f87171');

    Game.ball.vy = isPlayer ? -Math.abs(Game.ball.vy * 1.04) : Math.abs(Game.ball.vy * 1.04);
    const paddleCenter = paddle.x + pWidth / 2;
    Game.ball.vx = (Game.ball.x - paddleCenter) * 0.16;

    Game.ball.effects = {};
    const activeSkill = paddle.pendingSkill;
    paddle.pendingSkill = null;

    if (activeSkill === 'SMASH') {
      Game.ball.effects.smash = true;
      Game.ball.vy *= 1.45;
      Game.ball.vx *= 1.45;
      Game.showCombo('⚡ SMASH!');
      GameAudio.playSkill();
    } else if (activeSkill === 'DROPSHOT') {
      Game.ball.effects.dropshot = true;
      Game.ball.vy = isPlayer ? -3.8 : 3.8;
      Game.showCombo('🌀 BỎ NHỎ!');
      GameAudio.playSkill();
    }

    // Clamp velocities
    if (Game.ball.vy < -15) Game.ball.vy = -15;
    if (Game.ball.vy > 15) Game.ball.vy = 15;
    if (Game.ball.vx < -9) Game.ball.vx = -9;
    if (Game.ball.vx > 9) Game.ball.vx = 9;
  },

  updatePhysics() {
    // Keyboard player movement
    if (Game.keys['ArrowLeft'] || Game.keys['a']) Game.player.x -= Game.player.speed;
    if (Game.keys['ArrowRight'] || Game.keys['d']) Game.player.x += Game.player.speed;
    
    const pW = Game.player.effects.shield && Game.player.effects.shield > Date.now() ? Game.player.width * 1.6 : Game.player.width;
    if (Game.player.x < 0) Game.player.x = 0;
    if (Game.player.x > Game.width - pW) Game.player.x = Game.width - pW;

    // Dash trail logic
    if (Math.abs(Game.player.x - this.lastPlayerX) > 8) {
      this.dashTrails.push({ x: Game.player.x, y: Game.player.y, width: pW, height: Game.player.height, alpha: 0.45 });
    }
    this.lastPlayerX = Game.player.x;

    // Bot Update
    Bot.update();

    // Ball Physics
    if (!Game.isServing) {
      Game.ball.x += Game.ball.vx;
      Game.ball.y += Game.ball.vy;

      // Ball visual rotation
      this.ballRotation += (Game.ball.vx * 0.05) + (Game.ball.vy * 0.03);

      // Wall bounce
      if (Game.ball.x < Game.ball.radius || Game.ball.x > Game.width - Game.ball.radius) {
        Game.ball.vx *= -1;
        Game.ball.x = Game.ball.x < Game.ball.radius ? Game.ball.radius : Game.width - Game.ball.radius;
        GameAudio.playWall();
        this.spawnImpactSparks(Game.ball.x, Game.ball.y, '#ffffff', 4);
      }

      // Player Collision
      if (Game.ball.vy > 0) {
        const pCol = this.checkCollision(Game.ball, Game.player);
        if (pCol.hit) {
          Game.ball.y = Game.player.y - Game.ball.radius;
          this.handleBounce(Game.player, pCol.pWidth, true);
        }
      }
      
      // Bot Collision
      if (Game.ball.vy < 0) {
        const oCol = this.checkCollision(Game.ball, Game.opponent);
        if (oCol.hit) {
          Game.ball.y = Game.opponent.y + Game.opponent.height + Game.ball.radius;
          this.handleBounce(Game.opponent, oCol.pWidth, false);
        }
      }

      // Out of bounds (Score)
      if (Game.ball.y > Game.height + 25) {
        Game.scoreGoal(false);
      } else if (Game.ball.y < -25) {
        Game.scoreGoal(true);
      }

      // Mana Regen
      if (Game.playerEnergy < 100) Game.playerEnergy += 0.06;
      if (Game.opponentEnergy < 100) Game.opponentEnergy += 0.06;
      Game.updateHUD();
      
      // Particle spawns
      if (Game.ball.effects.smash) {
        for (let i = 0; i < 3; i++) {
          this.fireParticles.push({
            x: Game.ball.x + (Math.random() - 0.5) * 8,
            y: Game.ball.y + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 2 - (Game.ball.vx * 0.15),
            vy: (Math.random() - 0.5) * 2 - (Game.ball.vy * 0.15),
            size: Math.random() * 5 + 4,
            alpha: 1.0,
            color: ['#fef08a', '#f97316', '#ef4444'][Math.floor(Math.random() * 3)]
          });
        }
      }
      
      if (Game.ball.effects.dropshot && Math.random() < 0.25) {
        this.spatialRipples.push({
          x: Game.ball.x,
          y: Game.ball.y,
          radius: Game.ball.radius,
          maxRadius: Game.ball.radius + 24,
          alpha: 0.85,
          color: '#a855f7'
        });
      }
    }
  },

  drawPaddle(ctx, paddle, isPlayer) {
    const isShielded = paddle.effects && paddle.effects.shield > Date.now();
    const pW = isShielded ? paddle.width * 1.6 : paddle.width;
    const pH = paddle.height;
    const radius = 6;

    ctx.save();

    // 1. Paddle Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(paddle.x + 2, paddle.y + 4, pW, pH, radius);
    ctx.fill();

    // 2. Shield Forcefield Aura
    if (isShielded) {
      ctx.save();
      const shieldGlow = ctx.createRadialGradient(
        paddle.x + pW / 2, paddle.y + pH / 2, 5,
        paddle.x + pW / 2, paddle.y + pH / 2, pW * 0.6
      );
      shieldGlow.addColorStop(0, isPlayer ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.4)');
      shieldGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shieldGlow;
      ctx.beginPath();
      ctx.ellipse(paddle.x + pW / 2, paddle.y + pH / 2, pW * 0.65, pH * 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isPlayer ? '#38bdf8' : '#f87171';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Paddle Main Body (Carbon/Color Gradient)
    const paddleGrad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + pH);
    if (isPlayer) {
      paddleGrad.addColorStop(0, '#38bdf8');
      paddleGrad.addColorStop(1, '#0284c7');
    } else {
      paddleGrad.addColorStop(0, '#f87171');
      paddleGrad.addColorStop(1, '#dc2626');
    }
    ctx.fillStyle = paddleGrad;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, pW, pH, radius);
    ctx.fill();

    // 4. Paddle Rubber Bumper Edge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(paddle.x + 1, paddle.y + 1, pW - 2, pH - 2, radius - 1);
    ctx.stroke();

    // 5. Carbon Fiber / Honeycomb Center Line
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddle.x + 8, paddle.y + pH / 2);
    ctx.lineTo(paddle.x + pW - 8, paddle.y + pH / 2);
    ctx.stroke();

    ctx.restore();
  },

  drawBall(ctx, x, y, radius) {
    ctx.save();

    // 1. Dynamic Drop Shadow on Court
    const shadowDist = 6;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + shadowDist, radius * 1.1, radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Ball Body with 3D Radial Lighting
    const ballGrad = ctx.createRadialGradient(
      x - radius * 0.35, y - radius * 0.35, radius * 0.1,
      x, y, radius
    );
    
    if (Game.ball.effects.smash) {
      ballGrad.addColorStop(0, '#fff');
      ballGrad.addColorStop(0.3, '#fef08a');
      ballGrad.addColorStop(0.7, '#f97316');
      ballGrad.addColorStop(1, '#dc2626');
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 16;
    } else if (Game.ball.effects.dropshot) {
      ballGrad.addColorStop(0, '#fff');
      ballGrad.addColorStop(0.4, '#a5f3fc');
      ballGrad.addColorStop(0.8, '#06b6d4');
      ballGrad.addColorStop(1, '#7c3aed');
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 14;
    } else {
      ballGrad.addColorStop(0, '#ffffe0');
      ballGrad.addColorStop(0.35, '#d4ff00');
      ballGrad.addColorStop(0.8, '#a3e635');
      ballGrad.addColorStop(1, '#65a30d');
      ctx.shadowColor = 'rgba(212, 255, 0, 0.4)';
      ctx.shadowBlur = 8;
    }

    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. Perforated Pickleball Holes (Rotating)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.ballRotation);
    ctx.fillStyle = Game.ball.effects.smash ? 'rgba(185, 28, 28, 0.7)' : 'rgba(77, 124, 15, 0.65)';
    
    const holeAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5, Math.PI * 0.25];
    const holeDist = radius * 0.52;
    holeAngles.forEach(ang => {
      const hx = Math.cos(ang) * holeDist;
      const hy = Math.sin(ang) * holeDist;
      ctx.beginPath();
      ctx.arc(hx, hy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    ctx.restore();
  },

  draw() {
    const ctx = Game.ctx;
    if (!ctx) return;

    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // 1. Court Background
    const courtGrad = ctx.createLinearGradient(0, 0, 0, Game.height);
    courtGrad.addColorStop(0, '#0a1226');
    courtGrad.addColorStop(0.5, '#0f1d3d');
    courtGrad.addColorStop(1, '#0a1226');
    ctx.fillStyle = courtGrad;
    ctx.fillRect(0, 0, Game.width, Game.height);

    // 2. Kitchen / Non-Volley Zone (Sân Bếp đặc trưng Pickleball)
    ctx.fillStyle = 'rgba(14, 165, 233, 0.07)';
    ctx.fillRect(20, Game.height / 2 - 60, Game.width - 40, 120);

    // 3. Court Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, Game.width - 40, Game.height - 40);
    
    // Kitchen Lines
    ctx.beginPath();
    ctx.moveTo(20, Game.height / 2 - 60);
    ctx.lineTo(Game.width - 20, Game.height / 2 - 60);
    ctx.moveTo(20, Game.height / 2 + 60);
    ctx.lineTo(Game.width - 20, Game.height / 2 + 60);
    ctx.stroke();

    // Center Service Lines
    ctx.beginPath();
    ctx.moveTo(Game.width / 2, 20);
    ctx.lineTo(Game.width / 2, Game.height / 2 - 60);
    ctx.moveTo(Game.width / 2, Game.height / 2 + 60);
    ctx.lineTo(Game.width / 2, Game.height - 20);
    ctx.stroke();

    // 4. Center Net (3D Net with white top tape)
    ctx.save();
    // Net Mesh Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(16, Game.height / 2 - 1, Game.width - 32, 6);
    
    // Net Band (Top White Tape)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 6;
    ctx.fillRect(16, Game.height / 2 - 2, Game.width - 32, 4);
    ctx.shadowBlur = 0;

    // Net Posts (Cột lưới 2 bên)
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(14, Game.height / 2 - 6, 6, 12);
    ctx.fillRect(Game.width - 20, Game.height / 2 - 6, 6, 12);
    ctx.restore();

    // 5. Dash Trails
    for (let i = this.dashTrails.length - 1; i >= 0; i--) {
      const dt = this.dashTrails[i];
      ctx.fillStyle = `rgba(56, 189, 248, ${dt.alpha})`;
      ctx.beginPath();
      ctx.roundRect(dt.x, dt.y, dt.width, dt.height, 6);
      ctx.fill();
      dt.alpha -= 0.08;
      if (dt.alpha <= 0) this.dashTrails.splice(i, 1);
    }

    // 6. Paddles (2.5D)
    this.drawPaddle(ctx, Game.opponent, false);
    this.drawPaddle(ctx, Game.player, true);
    
    // 7. Spatial Ripples (Dropshot effect)
    for (let i = this.spatialRipples.length - 1; i >= 0; i--) {
      const r = this.spatialRipples[i];
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = r.alpha;
      ctx.lineWidth = 2;
      ctx.stroke();
      r.radius += 1.2;
      r.alpha -= 0.05;
      if (r.alpha <= 0) this.spatialRipples.splice(i, 1);
    }
    ctx.globalAlpha = 1.0;

    // 8. Fire Particles (Smash effect)
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
      fp.size *= 0.93;
      fp.alpha -= 0.07;
      if (fp.alpha <= 0 || fp.size <= 0.4) this.fireParticles.splice(i, 1);
    }
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    // 9. Impact Sparks
    for (let i = this.impactSparks.length - 1; i >= 0; i--) {
      const sp = this.impactSparks[i];
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = sp.alpha;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fill();
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.size *= 0.9;
      sp.alpha -= 0.09;
      if (sp.alpha <= 0) this.impactSparks.splice(i, 1);
    }
    ctx.globalAlpha = 1.0;

    // 10. Pickleball (2.5D with holes & shadow)
    this.drawBall(ctx, Game.ball.x, Game.ball.y, Game.ball.radius);

    ctx.restore();
  }
};
