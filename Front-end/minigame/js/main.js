const GameAudio = {
  ctx: null,
  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  },
  play(type) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    
    // Resume context if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    if (type === 'hit') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'score') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'win') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.5);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 1.0);
      osc.start(now);
      osc.stop(now + 1.0);
    }
  }
};

const Game = {
  isPlaying: false,
  isGameOver: false,
  playerScore: 0,
  opponentScore: 0,
  playerEnergy: 40,
  opponentEnergy: 40,
  isServing: true,
  isMyTurnToServe: true,
  
  canvas: null,
  ctx: null,
  width: 400,
  height: 700,

  ball: { x: 200, y: 350, vx: 0, vy: 0, radius: 9.5, speed: 7, effects: {} },
  player: { x: 150, y: 650, width: 80, height: 12, speed: 8.5, effects: {} },
  opponent: { x: 150, y: 38, width: 80, height: 12, speed: 5.0, effects: {} },

  keys: {},

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.ui = {
      startOverlay: document.getElementById('start-overlay'),
      gameOverOverlay: document.getElementById('game-over-overlay'),
      scoreP1: document.getElementById('score-p1'),
      scoreP2: document.getElementById('score-p2'),
      manaFill: document.getElementById('my-mana-fill'),
      manaText: document.getElementById('my-mana-text'),
      winnerName: document.getElementById('winner-name-text'),
      serveNotif: document.getElementById('serve-notification')
    };

    document.getElementById('start-btn').addEventListener('click', () => {
      GameAudio.init(); // Init audio on user gesture
      this.startGame();
    });
    document.getElementById('restart-btn').addEventListener('click', () => this.startGame());

    Controls.init();
    Engine.init();
    Bot.init();
    
    requestAnimationFrame((t) => Engine.loop(t));
  },

  startGame() {
    this.isPlaying = true;
    this.isGameOver = false;
    this.playerScore = 0;
    this.opponentScore = 0;
    this.playerEnergy = 40;
    this.opponentEnergy = 40;
    this.isServing = true;
    this.isMyTurnToServe = true;
    this.resetPositions();
    this.updateHUD();
    this.ui.startOverlay.style.display = 'none';
    this.ui.gameOverOverlay.style.display = 'none';
    this.showServeNotification();
  },

  resetPositions() {
    this.player.x = this.width / 2 - this.player.width / 2;
    this.opponent.x = this.width / 2 - this.opponent.width / 2;
    this.ball.x = this.width / 2;
    this.ball.y = this.isMyTurnToServe ? this.player.y - 30 : this.opponent.y + 30;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.effects = {};
    Engine.fireParticles = [];
    Engine.spatialRipples = [];
  },

  scoreGoal(isPlayer) {
    GameAudio.play('score');
    if (isPlayer) {
      this.playerScore++;
      this.isMyTurnToServe = true;
    } else {
      this.opponentScore++;
      this.isMyTurnToServe = false;
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

  endGame() {
    GameAudio.play('win');
    this.isPlaying = false;
    this.isGameOver = true;
    this.ui.gameOverOverlay.style.display = 'flex';
    this.ui.winnerName.textContent = this.playerScore >= 10 ? 'CHIẾN THẮNG: BẠN' : 'CHIẾN THẮNG: BOT';
  },

  updateHUD() {
    this.ui.scoreP1.textContent = this.playerScore;
    this.ui.scoreP2.textContent = this.opponentScore;
    this.ui.manaFill.style.width = Math.min(100, this.playerEnergy) + '%';
    this.ui.manaText.textContent = `⚡ MANA: ${Math.floor(this.playerEnergy)}%`;
    
    document.getElementById('btn-shield').disabled = this.playerEnergy < 40;
    document.getElementById('btn-drop').disabled = this.playerEnergy < 40;
    document.getElementById('btn-smash').disabled = this.playerEnergy < 50;
  },

  showServeNotification() {
    this.ui.serveNotif.style.display = 'block';
    this.ui.serveNotif.innerHTML = this.isMyTurnToServe 
      ? '<span>🎾 CHẠM MÀN HÌNH ĐỂ PHÁT BÓNG!</span>' 
      : '<span>🛡️ BOT ĐANG PHÁT BÓNG...</span>';
    setTimeout(() => { this.ui.serveNotif.style.display = 'none'; }, 2000);
  },

  useSkill(skillName) {
    if (!this.isPlaying) return;
    if (skillName === 'SHIELD' && this.playerEnergy >= 40) {
      this.playerEnergy -= 40;
      this.player.effects.shield = Date.now() + 4500;
    } else if (skillName === 'DROPSHOT' && this.playerEnergy >= 40) {
      this.playerEnergy -= 40;
      this.player.pendingSkill = 'DROPSHOT';
    } else if (skillName === 'SMASH' && this.playerEnergy >= 50) {
      this.playerEnergy -= 50;
      this.player.pendingSkill = 'SMASH';
    }
    this.updateHUD();
  },

  serve() {
    if (this.isServing && this.isMyTurnToServe) {
      GameAudio.play('hit');
      this.isServing = false;
      this.ball.vy = -7;
      this.ball.vx = (Math.random() - 0.5) * 6;
      this.ui.serveNotif.style.display = 'none';
    }
  }
};

window.onload = () => Game.init();
