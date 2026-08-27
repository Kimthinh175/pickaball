// ==========================================
// GAME CONTROLLER & AUDIO SYSTEM
// ==========================================

const GameAudio = {
  ctx: null,
  isMuted: false,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  },

  toggleMute() {
    this.isMuted = !this.isMuted;
    const btn = document.getElementById('btn-sound');
    if (btn) btn.textContent = this.isMuted ? '🔇' : '🔊';
  },

  playHit(power = 7, type = 'normal') {
    if (this.isMuted) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const baseFreq = type === 'smash' ? 620 : (type === 'drop' ? 320 : 450 + Math.min(200, power * 15));
    const duration = type === 'smash' ? 0.12 : 0.07;
    const volume = type === 'smash' ? 0.45 : 0.28;

    osc.type = type === 'smash' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.linearRampToValueAtTime(0.01, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  },

  playWall() {
    if (this.isMuted) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
  },

  playSkill() {
    if (this.isMuted) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(900, now + 0.2);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.25);
  },

  playScore() {
    if (this.isMuted) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.25, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.01, now + i * 0.08 + 0.18);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.18);
    });
  },

  playWin() {
    if (this.isMuted) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.3, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.01, now + i * 0.12 + 0.35);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.35);
    });
  }
};

const Game = {
  isPlaying: false,
  isGameOver: false,
  isPaused: false,
  playerScore: 0,
  opponentScore: 0,
  playerEnergy: 40,
  opponentEnergy: 40,
  isServing: true,
  isMyTurnToServe: true,
  currentRally: 0,
  maxRally: 0,
  
  canvas: null,
  ctx: null,
  width: 400,
  height: 700,

  ball: { x: 200, y: 350, vx: 0, vy: 0, radius: 10, speed: 7, effects: {} },
  player: { x: 150, y: 645, width: 84, height: 14, speed: 8.5, effects: {} },
  opponent: { x: 150, y: 42, width: 84, height: 14, speed: 5.2, effects: {} },

  keys: {},

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.ui = {
      startOverlay: document.getElementById('start-overlay'),
      pauseOverlay: document.getElementById('pause-overlay'),
      gameOverOverlay: document.getElementById('game-over-overlay'),
      scoreP1: document.getElementById('score-p1'),
      scoreP2: document.getElementById('score-p2'),
      manaFill: document.getElementById('my-mana-fill'),
      manaText: document.getElementById('my-mana-text'),
      winnerName: document.getElementById('winner-name-text'),
      serveNotif: document.getElementById('serve-notification'),
      comboBanner: document.getElementById('combo-banner'),
      rallyNum: document.getElementById('hud-rally-num'),
      summaryStats: document.getElementById('match-summary-stats'),
      trophyIcon: document.getElementById('game-over-trophy'),
      gameOverTitle: document.getElementById('game-over-title')
    };

    document.getElementById('start-btn')?.addEventListener('click', () => {
      GameAudio.init();
      this.startGame();
    });
    document.getElementById('restart-btn')?.addEventListener('click', () => this.startGame());
    document.getElementById('resume-btn')?.addEventListener('click', () => this.togglePause());
    document.getElementById('btn-pause')?.addEventListener('click', () => this.togglePause());
    document.getElementById('btn-sound')?.addEventListener('click', () => GameAudio.toggleMute());

    Controls.init();
    Engine.init();
    Bot.init();
    
    requestAnimationFrame((t) => Engine.loop(t));
  },

  startGame() {
    this.isPlaying = true;
    this.isGameOver = false;
    this.isPaused = false;
    this.playerScore = 0;
    this.opponentScore = 0;
    this.playerEnergy = 40;
    this.opponentEnergy = 40;
    this.isServing = true;
    this.isMyTurnToServe = true;
    this.currentRally = 0;
    this.maxRally = 0;

    this.resetPositions();
    this.updateHUD();
    this.ui.startOverlay.style.display = 'none';
    this.ui.pauseOverlay.style.display = 'none';
    this.ui.gameOverOverlay.style.display = 'none';
    this.showServeNotification();
  },

  togglePause() {
    if (!this.isPlaying || this.isGameOver) return;
    this.isPaused = !this.isPaused;
    this.ui.pauseOverlay.style.display = this.isPaused ? 'flex' : 'none';
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) pauseBtn.textContent = this.isPaused ? '▶️' : '⏸️';
  },

  resetPositions() {
    this.player.x = this.width / 2 - this.player.width / 2;
    this.opponent.x = this.width / 2 - this.opponent.width / 2;
    this.ball.x = this.width / 2;
    this.ball.y = this.isMyTurnToServe ? this.player.y - 28 : this.opponent.y + 28;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.effects = {};
    this.currentRally = 0;
    Engine.fireParticles = [];
    Engine.spatialRipples = [];
    Engine.impactSparks = [];
    this.updateRallyHUD();
  },

  incrementRally() {
    this.currentRally++;
    if (this.currentRally > this.maxRally) this.maxRally = this.currentRally;
    this.updateRallyHUD();

    if (this.currentRally === 5) this.showCombo('🔥 5 RALLIES!');
    else if (this.currentRally === 10) this.showCombo('⚡ SUPER RALLY! (10)');
    else if (this.currentRally === 15) this.showCombo('👑 GODLIKE RALLY! (15)');
  },

  updateRallyHUD() {
    if (this.ui.rallyNum) {
      this.ui.rallyNum.textContent = this.currentRally;
    }
  },

  showCombo(text) {
    if (!this.ui.comboBanner) return;
    this.ui.comboBanner.textContent = text;
    this.ui.comboBanner.style.display = 'block';
    clearTimeout(this._comboTimeout);
    this._comboTimeout = setTimeout(() => {
      this.ui.comboBanner.style.display = 'none';
    }, 1200);
  },

  scoreGoal(isPlayer) {
    GameAudio.playScore();
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([40, 30, 60]);
    }

    if (isPlayer) {
      this.playerScore++;
      this.isMyTurnToServe = true;
      this.popScore('p1');
    } else {
      this.opponentScore++;
      this.isMyTurnToServe = false;
      this.popScore('p2');
    }
    
    this.isServing = true;
    this.updateHUD();

    if (this.playerScore >= 10 || this.opponentScore >= 10) {
      this.endGame();
    } else {
      this.resetPositions();
      this.showServeNotification();
    }
  },

  popScore(team) {
    const el = team === 'p1' ? this.ui.scoreP1 : this.ui.scoreP2;
    if (el) {
      el.classList.add('pop');
      setTimeout(() => el.classList.remove('pop'), 250);
    }
  },

  endGame() {
    GameAudio.playWin();
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([100, 50, 150]);
    }

    this.isPlaying = false;
    this.isGameOver = true;
    this.ui.gameOverOverlay.style.display = 'flex';
    
    const isUserWin = this.playerScore >= 10;
    this.ui.trophyIcon.textContent = isUserWin ? '🏆' : '💀';
    this.ui.gameOverTitle.textContent = isUserWin ? 'CHIẾN THẮNG VANG DỘI!' : 'BẠN ĐÃ THUA TRẬN!';
    this.ui.winnerName.textContent = isUserWin ? '🏆 QUÁN QUÂN: BẠN' : '💀 THẮNG TRẬN: HELL BOT';
    this.ui.summaryStats.innerHTML = `
      <div>Tỷ số chung cuộc: <strong>${this.playerScore} - ${this.opponentScore}</strong></div>
      <div style="margin-top:4px;">Chuỗi Rally dài nhất: <strong style="color:#d4ff00;">${this.maxRally} lượt</strong></div>
    `;
  },

  updateHUD() {
    this.ui.scoreP1.textContent = this.playerScore;
    this.ui.scoreP2.textContent = this.opponentScore;
    
    const manaPct = Math.min(100, Math.floor(this.playerEnergy));
    this.ui.manaFill.style.width = manaPct + '%';
    this.ui.manaText.textContent = `⚡ ${manaPct}% MANA`;
    
    document.getElementById('btn-shield').disabled = this.playerEnergy < 40;
    document.getElementById('btn-drop').disabled = this.playerEnergy < 40;
    document.getElementById('btn-smash').disabled = this.playerEnergy < 50;
  },

  showServeNotification() {
    this.ui.serveNotif.style.display = 'block';
    this.ui.serveNotif.innerHTML = this.isMyTurnToServe 
      ? '<span>🎾 CHẠM MÀN HÌNH ĐỂ PHÁT BÓNG!</span>' 
      : '<span>🛡️ BOT ĐANG PHÁT BÓNG...</span>';
    setTimeout(() => { this.ui.serveNotif.style.display = 'none'; }, 1800);
  },

  useSkill(skillName) {
    if (!this.isPlaying || this.isPaused) return;
    if (skillName === 'SHIELD' && this.playerEnergy >= 40) {
      this.playerEnergy -= 40;
      this.player.effects.shield = Date.now() + 4500;
      this.showCombo('🛡️ KHIÊN NĂNG LƯỢNG!');
      GameAudio.playSkill();
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(25);
    } else if (skillName === 'DROPSHOT' && this.playerEnergy >= 40) {
      this.playerEnergy -= 40;
      this.player.pendingSkill = 'DROPSHOT';
      this.showCombo('🌀 SẴN SÀNG BỎ NHỎ!');
      GameAudio.playSkill();
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(25);
    } else if (skillName === 'SMASH' && this.playerEnergy >= 50) {
      this.playerEnergy -= 50;
      this.player.pendingSkill = 'SMASH';
      this.showCombo('⚡ SẴN SÀNG LỐC SMASH!');
      GameAudio.playSkill();
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(25);
    }
    this.updateHUD();
  },

  serve() {
    if (this.isServing && this.isMyTurnToServe && !this.isPaused) {
      GameAudio.playHit(8, 'normal');
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(20);
      this.isServing = false;
      this.ball.vy = -7.5;
      this.ball.vx = (Math.random() - 0.5) * 6;
      this.ui.serveNotif.style.display = 'none';
    }
  }
};

window.onload = () => Game.init();
