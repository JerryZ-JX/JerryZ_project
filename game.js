(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const stage = document.getElementById("stage");
  const ctx = canvas.getContext("2d", { alpha: false });

  const ui = {
    hud: document.getElementById("hud"),
    score: document.getElementById("scoreValue"),
    best: document.getElementById("hudBest"),
    wave: document.getElementById("waveValue"),
    combo: document.getElementById("combo"),
    comboMult: document.getElementById("comboMult"),
    comboCount: document.getElementById("comboCount"),
    bossBar: document.getElementById("bossBar"),
    bossName: document.getElementById("bossName"),
    bossPercent: document.getElementById("bossPercent"),
    bossFill: document.getElementById("bossFill"),
    toast: document.getElementById("toast"),
    banner: document.getElementById("waveBanner"),
    bannerKicker: document.getElementById("bannerKicker"),
    bannerTitle: document.getElementById("bannerTitle"),
    bannerSub: document.getElementById("bannerSub"),
    lives: document.getElementById("lives"),
    weaponChip: document.getElementById("weaponChip"),
    shieldChip: document.getElementById("shieldChip"),
    hint: document.getElementById("controlHint"),
    bombBtn: document.getElementById("bombBtn"),
    bombCount: document.getElementById("bombCount"),
    soundBtn: document.getElementById("soundBtn"),
    pauseBtn: document.getElementById("pauseBtn"),
    menuSoundBtn: document.getElementById("menuSoundBtn"),
    startScreen: document.getElementById("startScreen"),
    pauseScreen: document.getElementById("pauseScreen"),
    gameoverScreen: document.getElementById("gameoverScreen"),
    startBtn: document.getElementById("startBtn"),
    resumeBtn: document.getElementById("resumeBtn"),
    quitBtn: document.getElementById("quitBtn"),
    restartBtn: document.getElementById("restartBtn"),
    menuBtn: document.getElementById("menuBtn"),
    menuBest: document.getElementById("menuBest"),
    finalScore: document.getElementById("finalScore"),
    newRecord: document.getElementById("newRecord"),
    finalWave: document.getElementById("finalWave"),
    finalKills: document.getElementById("finalKills"),
    finalTime: document.getElementById("finalTime"),
    finalBest: document.getElementById("finalBest")
  };

  const TAU = Math.PI * 2;
  const WORLD_WIDTH = 480;
  const STORAGE_BEST = "thunder-strike-best-v1";
  const STORAGE_MUTED = "thunder-strike-muted-v1";
  const PLAYER_SPEED = 345;
  const ENEMY_BULLET_LIMIT = 360;

  let WORLD_HEIGHT = 800;
  let scaleX = 1;
  let scaleY = 1;
  let backdrop = null;
  let lastFrame = performance.now();
  let bannerTimer = 0;
  let bannerToken = 0;
  let toastTimer = 0;
  let hintTimer = 0;
  let resizeFrame = 0;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const random = (min, max) => min + Math.random() * (max - min);
  const randomInt = (min, max) => Math.floor(random(min, max + 1));
  const pad2 = (value) => String(value).padStart(2, "0");

  const PLAYER_BULLET_SPEED = 760;
  const WEAPONS = [
    {
      interval: 0.16,
      shots: [{ x: 0, angle: 0, damage: 2.6, radius: 3.4 }]
    },
    {
      interval: 0.145,
      shots: [
        { x: -7, angle: 0, damage: 2.1, radius: 3.2 },
        { x: 7, angle: 0, damage: 2.1, radius: 3.2 }
      ]
    },
    {
      interval: 0.13,
      shots: [
        { x: -10, angle: 0, damage: 2.1, radius: 3.2 },
        { x: 0, angle: 0, damage: 3.1, radius: 4.3 },
        { x: 10, angle: 0, damage: 2.1, radius: 3.2 }
      ]
    },
    {
      interval: 0.118,
      shots: [
        { x: -19, angle: -0.09, damage: 2.1, radius: 3.1 },
        { x: 19, angle: 0.09, damage: 2.1, radius: 3.1 },
        { x: -8, angle: 0, damage: 2.2, radius: 3.2 },
        { x: 8, angle: 0, damage: 2.2, radius: 3.2 }
      ]
    },
    {
      interval: 0.106,
      shots: [
        { x: -23, angle: -0.16, damage: 2.1, radius: 3.1 },
        { x: 23, angle: 0.16, damage: 2.1, radius: 3.1 },
        { x: -11, angle: -0.055, damage: 2.2, radius: 3.3 },
        { x: 11, angle: 0.055, damage: 2.2, radius: 3.3 },
        { x: 0, angle: 0, damage: 3.4, radius: 5 }
      ]
    }
  ];

  const ENEMY_ARCHETYPES = {
    scout: {
      radius: 15,
      hp: 4,
      score: 120,
      speed: 105,
      drop: 0.065,
      color: [255, 106, 100]
    },
    striker: {
      radius: 20,
      hp: 11,
      score: 300,
      speed: 82,
      drop: 0.14,
      color: [255, 152, 92]
    },
    tank: {
      radius: 29,
      hp: 33,
      score: 800,
      speed: 47,
      drop: 0.4,
      color: [255, 195, 94]
    },
    boss: {
      radius: 72,
      hp: 440,
      score: 3600,
      speed: 0,
      drop: 1,
      color: [255, 92, 112]
    }
  };

  const POWERUP_STYLES = {
    power: { label: "火力", rgb: [93, 233, 239] },
    shield: { label: "护盾", rgb: [98, 246, 174] },
    bomb: { label: "轰炸", rgb: [255, 196, 94] },
    life: { label: "修复", rgb: [255, 128, 156] }
  };

  const player = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT - 140,
    radius: 8.5,
    alive: true,
    invulnerable: 0,
    shield: 0,
    weapon: 1,
    fireTimer: 0,
    trailTimer: 0,
    tilt: 0,
    previousX: WORLD_WIDTH / 2
  };

  const G = {
    state: "menu",
    runId: 0,
    best: 0,
    bestAtRunStart: 0,
    score: 0,
    lives: 3,
    bombs: 2,
    kills: 0,
    wave: 1,
    waveTime: 0,
    spawnTimer: 0.9,
    elapsed: 0,
    combo: 0,
    comboTimer: 0,
    dropPity: 0,
    dropsThisRun: 0,
    bombCooldown: 0,
    shake: 0,
    flash: 0,
    flashColor: [210, 252, 255],
    deathTimer: 0,
    deathBurstTimer: 0,
    stars: [],
    shootingStars: [],
    playerBullets: [],
    enemyBullets: [],
    enemies: [],
    powerups: [],
    particles: [],
    rings: [],
    floaters: [],
    boss: null,
    pendingBanner: null,
    animTime: 0
  };

  const pointer = {
    active: false,
    id: null,
    startX: 0,
    startY: 0,
    shipX: 0,
    shipY: 0,
    targetX: 0,
    targetY: 0,
    hasTarget: false
  };

  const keys = Object.create(null);

  const hudCache = {
    score: -1,
    best: -1,
    wave: -1,
    lives: -1,
    bombs: -1,
    weapon: -1,
    shield: -1,
    combo: -1,
    bossHp: -1,
    bossActive: false,
    hint: false
  };

  const glowCache = new Map();

  function makeGlowSprite(rgb) {
    const key = rgb.join(",");
    if (glowCache.has(key)) return glowCache.get(key);

    const sprite = document.createElement("canvas");
    sprite.width = 64;
    sprite.height = 64;
    const c = sprite.getContext("2d");
    const gradient = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, `rgba(255,255,255,0.98)`);
    gradient.addColorStop(0.16, `rgba(${key},0.92)`);
    gradient.addColorStop(0.44, `rgba(${key},0.22)`);
    gradient.addColorStop(1, `rgba(${key},0)`);
    c.fillStyle = gradient;
    c.fillRect(0, 0, 64, 64);
    glowCache.set(key, sprite);
    return sprite;
  }

  function drawGlow(rgb, x, y, radius, alpha = 1) {
    const sprite = makeGlowSprite(rgb);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }

  function storedValue(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function storeValue(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // Local storage may be unavailable in private or sandboxed contexts.
    }
  }

  function formatScore(value) {
    return Math.max(0, Math.floor(value)).toLocaleString("en-US");
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
  }

  function comboMultiplier() {
    return Math.min(4, 1 + Math.floor(G.combo / 4) * 0.5);
  }

  /* ---------------------------------------------------------------------- */
  /* Audio                                                                  */
  /* ---------------------------------------------------------------------- */

  const sound = {
    ctx: null,
    master: null,
    compressor: null,
    musicBus: null,
    noiseBuffer: null,
    muted: storedValue(STORAGE_MUTED, "0") === "1",
    shotAlt: false,
    musicTimer: 0,
    musicStep: 0,
    lastExplosionAt: 0,

    init() {
      if (this.ctx) {
        if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
        return;
      }

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const audio = new AudioContext();
      const master = audio.createGain();
      const compressor = audio.createDynamicsCompressor();
      master.gain.value = this.muted ? 0 : 0.52;
      compressor.threshold.value = -20;
      compressor.knee.value = 18;
      compressor.ratio.value = 7;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.25;
      master.connect(compressor);
      compressor.connect(audio.destination);

      const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 1.2), audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }

      const musicBus = audio.createGain();
      musicBus.gain.value = 0.3;
      const delay = audio.createDelay(1);
      delay.delayTime.value = 0.31;
      const feedback = audio.createGain();
      feedback.gain.value = 0.22;
      const delayFilter = audio.createBiquadFilter();
      delayFilter.type = "lowpass";
      delayFilter.frequency.value = 1700;
      musicBus.connect(master);
      musicBus.connect(delay);
      delay.connect(delayFilter);
      delayFilter.connect(feedback);
      feedback.connect(delay);
      delayFilter.connect(master);

      this.ctx = audio;
      this.master = master;
      this.compressor = compressor;
      this.musicBus = musicBus;
      this.noiseBuffer = buffer;
    },

    setMuted(muted) {
      this.muted = muted;
      storeValue(STORAGE_MUTED, muted ? "1" : "0");
      if (this.master && this.ctx) {
        this.master.gain.cancelScheduledValues(this.ctx.currentTime);
        this.master.gain.setTargetAtTime(muted ? 0 : 0.52, this.ctx.currentTime, 0.025);
      }
      syncSoundButtons();
    },

    toggle() {
      this.setMuted(!this.muted);
      if (!this.muted) {
        this.init();
        this.ui();
      }
    },

    tone({ type = "sine", from, to = from, duration, volume, delay = 0, destination = null }) {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, from), now);
      if (to !== from) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(destination || this.master);
      osc.start(now);
      osc.stop(now + duration + 0.03);
    },

    noise({ duration = 0.2, volume = 0.08, frequency = 900, type = "lowpass", delay = 0 }) {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime + delay;
      const source = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      source.buffer = this.noiseBuffer;
      filter.type = type;
      filter.frequency.setValueAtTime(frequency, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.45), now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start(now);
      source.stop(now + duration + 0.02);
    },

    ui() {
      this.tone({ type: "sine", from: 620, to: 820, duration: 0.06, volume: 0.02 });
    },

    denied() {
      this.tone({ type: "square", from: 170, to: 120, duration: 0.11, volume: 0.018 });
    },

    shoot() {
      this.shotAlt = !this.shotAlt;
      this.tone({
        type: "triangle",
        from: this.shotAlt ? 1020 : 880,
        to: 360,
        duration: 0.055,
        volume: 0.009
      });
    },

    enemyShoot() {
      if (Math.random() > 0.42) return;
      this.tone({ type: "sawtooth", from: 360, to: 180, duration: 0.07, volume: 0.006 });
    },

    explosion(big = false) {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      if (!big && now - this.lastExplosionAt < 0.045) return;
      this.lastExplosionAt = now;
      this.noise({
        duration: big ? 0.55 : 0.23,
        volume: big ? 0.2 : 0.075,
        frequency: big ? 1200 : 760
      });
      this.tone({
        type: "sine",
        from: big ? 150 : 110,
        to: big ? 45 : 52,
        duration: big ? 0.5 : 0.18,
        volume: big ? 0.12 : 0.045
      });
      if (big) {
        this.noise({ duration: 0.7, volume: 0.09, frequency: 500, delay: 0.14 });
      }
    },

    hit() {
      this.noise({ duration: 0.25, volume: 0.13, frequency: 1300 });
      this.tone({ type: "sawtooth", from: 230, to: 70, duration: 0.28, volume: 0.08 });
    },

    pickup() {
      this.tone({ type: "sine", from: 640, to: 940, duration: 0.07, volume: 0.032 });
      this.tone({ type: "sine", from: 940, to: 1260, duration: 0.08, volume: 0.024, delay: 0.055 });
    },

    powerup() {
      [520, 660, 880, 1170].forEach((frequency, index) => {
        this.tone({
          type: "triangle",
          from: frequency,
          to: frequency * 1.04,
          duration: 0.13,
          volume: 0.035,
          delay: index * 0.055
        });
      });
    },

    shieldBreak() {
      this.noise({ duration: 0.22, volume: 0.08, frequency: 2400, type: "highpass" });
      this.tone({ type: "sine", from: 780, to: 220, duration: 0.28, volume: 0.05 });
    },

    bomb() {
      this.tone({ type: "sine", from: 92, to: 36, duration: 0.9, volume: 0.2 });
      this.noise({ duration: 0.9, volume: 0.18, frequency: 1800 });
      this.noise({ duration: 1.1, volume: 0.1, frequency: 440, delay: 0.12 });
      [0, 0.12, 0.24, 0.36].forEach((delay, index) => {
        this.tone({
          type: "triangle",
          from: 660 - index * 90,
          to: 220,
          duration: 0.35,
          volume: 0.025,
          delay
        });
      });
    },

    warning() {
      [0, 0.28, 0.56].forEach((delay) => {
        this.tone({ type: "square", from: 280, to: 280, duration: 0.16, volume: 0.035, delay });
        this.tone({ type: "square", from: 210, to: 210, duration: 0.16, volume: 0.026, delay: delay + 0.17 });
      });
    },

    gameOver() {
      [392, 330, 262, 196].forEach((frequency, index) => {
        this.tone({
          type: "triangle",
          from: frequency,
          to: frequency * 0.98,
          duration: 0.42,
          volume: 0.045,
          delay: index * 0.18
        });
      });
    },

    startMusic() {
      this.musicTimer = 0;
      this.musicStep = 0;
    },

    updateMusic(dt) {
      if (!this.ctx || this.muted || !this.musicBus) return;
      this.musicTimer -= dt;
      if (this.musicTimer > 0) return;
      this.musicTimer += G.boss ? 0.29 : 0.255;
      if (this.musicTimer < 0) this.musicTimer = 0.255;

      const step = this.musicStep;
      this.musicStep = (this.musicStep + 1) % 32;
      const lead = [12, 7, 10, 7, 3, 7, 15, 10, 12, 7, 3, 7, 10, 15, 12, 7];
      const bass = [0, 0, 3, 3, 7, 7, 3, 3];

      if (step % 2 === 0) {
        const note = lead[(step / 2) % lead.length];
        const frequency = (G.boss ? 98 : 110) * Math.pow(2, note / 12);
        this.tone({
          type: "triangle",
          from: frequency,
          to: frequency,
          duration: 0.3,
          volume: G.boss ? 0.0085 : 0.0065,
          destination: this.musicBus
        });
      }

      if (step % 4 === 0) {
        const bassNote = bass[(step / 4) % bass.length];
        const frequency = 55 * Math.pow(2, bassNote / 12);
        this.tone({
          type: "sine",
          from: frequency,
          to: frequency,
          duration: 0.6,
          volume: 0.018,
          destination: this.musicBus
        });
      }

      if (step % 8 === 4) {
        this.noise({
          duration: 0.055,
          volume: 0.008,
          frequency: 3400,
          type: "highpass"
        });
      }
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Canvas sizing and backdrop                                             */
  /* ---------------------------------------------------------------------- */

  function resize() {
    const rect = stage.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;

    const previousHeight = WORLD_HEIGHT;
    WORLD_HEIGHT = WORLD_WIDTH * (rect.height / rect.width);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    scaleX = canvas.width / WORLD_WIDTH;
    scaleY = canvas.height / WORLD_HEIGHT;

    player.x = clamp(player.x, 22, WORLD_WIDTH - 22);
    if (G.state === "playing" || G.state === "paused") {
      const relativeY = previousHeight > 0 ? player.y / previousHeight : 0.82;
      player.y = clamp(WORLD_HEIGHT * relativeY, 70, WORLD_HEIGHT - 45);
    } else if (G.state === "menu") {
      player.y = WORLD_HEIGHT - 140;
    }

    buildBackdrop();
    buildStars();
    pointer.targetX = clamp(pointer.targetX, 22, WORLD_WIDTH - 22);
    pointer.targetY = clamp(pointer.targetY, 70, WORLD_HEIGHT - 50);
  }

  function queueResize() {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      resize();
    });
  }

  function buildBackdrop() {
    const width = Math.ceil(WORLD_WIDTH);
    const height = Math.ceil(WORLD_HEIGHT);
    backdrop = document.createElement("canvas");
    backdrop.width = width;
    backdrop.height = height;
    const c = backdrop.getContext("2d");

    const base = c.createLinearGradient(0, 0, 0, height);
    base.addColorStop(0, "#061824");
    base.addColorStop(0.28, "#06131e");
    base.addColorStop(0.63, "#030c16");
    base.addColorStop(1, "#02070f");
    c.fillStyle = base;
    c.fillRect(0, 0, width, height);

    const nebula = (x, y, radius, inner, middle) => {
      const gradient = c.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, inner);
      gradient.addColorStop(0.44, middle);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = gradient;
      c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    };

    nebula(width * 0.18, height * 0.56, width * 0.58, "rgba(22, 100, 116, 0.19)", "rgba(12, 53, 71, 0.08)");
    nebula(width * 0.88, height * 0.44, width * 0.5, "rgba(69, 55, 128, 0.16)", "rgba(31, 27, 72, 0.055)");
    nebula(width * 0.45, height * 0.93, width * 0.7, "rgba(17, 71, 89, 0.13)", "rgba(8, 35, 49, 0.04)");

    const planetX = width * 0.84;
    const planetY = Math.min(height * 0.265, 245);
    const planetRadius = width * 0.33;

    c.save();
    c.beginPath();
    c.arc(planetX, planetY, planetRadius, 0, TAU);
    c.clip();
    const planet = c.createRadialGradient(
      planetX - planetRadius * 0.48,
      planetY - planetRadius * 0.5,
      planetRadius * 0.06,
      planetX,
      planetY,
      planetRadius
    );
    planet.addColorStop(0, "rgba(55, 96, 108, 0.16)");
    planet.addColorStop(0.48, "rgba(21, 54, 68, 0.12)");
    planet.addColorStop(0.82, "rgba(6, 23, 34, 0.14)");
    planet.addColorStop(1, "rgba(1, 7, 13, 0)");
    c.fillStyle = planet;
    c.fillRect(planetX - planetRadius, planetY - planetRadius, planetRadius * 2, planetRadius * 2);

    c.strokeStyle = "rgba(98, 178, 190, 0.035)";
    c.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      c.beginPath();
      c.ellipse(
        planetX - planetRadius * 0.08,
        planetY + planetRadius * (i * 0.18 - 0.28),
        planetRadius * 0.88,
        planetRadius * (0.054 + i * 0.012),
        -0.24,
        0,
        TAU
      );
      c.stroke();
    }
    c.restore();

    c.strokeStyle = "rgba(109, 221, 229, 0.09)";
    c.lineWidth = 1;
    c.beginPath();
    c.arc(planetX, planetY, planetRadius + 0.5, -2.55, 0.5);
    c.stroke();

    // A quiet horizon glow keeps the lower field from feeling empty.
    const horizon = c.createLinearGradient(0, height * 0.76, 0, height);
    horizon.addColorStop(0, "rgba(0,0,0,0)");
    horizon.addColorStop(1, "rgba(5, 35, 45, 0.18)");
    c.fillStyle = horizon;
    c.fillRect(0, height * 0.76, width, height * 0.24);

    for (let i = 0; i < 90; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() < 0.85 ? 0.65 : 1.2;
      c.globalAlpha = random(0.045, 0.17);
      c.fillStyle = Math.random() < 0.15 ? "#f2d9aa" : "#bceef5";
      c.fillRect(x, y, size, size);
    }
    c.globalAlpha = 1;
  }

  function buildStars() {
    const count = clamp(Math.round(WORLD_HEIGHT * 0.16), 110, 190);
    G.stars = Array.from({ length: count }, () => {
      const depth = Math.random();
      return {
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        depth,
        speed: 14 + depth * 90,
        size: 0.45 + depth * 1.45,
        alpha: 0.16 + depth * 0.62,
        twinkle: random(0.0007, 0.0024),
        phase: Math.random() * TAU,
        warm: Math.random() < 0.1
      };
    });
    G.shootingStars.length = 0;
  }

  /* ---------------------------------------------------------------------- */
  /* UI helpers                                                             */
  /* ---------------------------------------------------------------------- */

  function setHudActive(active) {
    ui.hud.classList.toggle("is-active", active);
    ui.hud.setAttribute("aria-hidden", active ? "false" : "true");
    if (active) {
      ui.hud.removeAttribute("inert");
    } else {
      ui.hud.setAttribute("inert", "");
    }
  }

  function setScreen(element, visible) {
    element.classList.toggle("is-hidden", !visible);
    element.setAttribute("aria-hidden", visible ? "false" : "true");
    if (visible) {
      element.removeAttribute("inert");
    } else {
      element.setAttribute("inert", "");
    }
  }

  function syncSoundButtons() {
    const muted = sound.muted;
    [ui.soundBtn, ui.menuSoundBtn].forEach((button) => {
      button.classList.toggle("is-muted", muted);
      button.setAttribute("aria-label", muted ? "开启音效" : "关闭音效");
      button.setAttribute("title", muted ? "开启音效" : "关闭音效");
    });
  }

  function toggleSound() {
    sound.toggle();
  }

  function showToast(message, tone = "") {
    window.clearTimeout(toastTimer);
    ui.toast.textContent = message;
    ui.toast.className = "toast" + (tone ? ` tone-${tone}` : "");
    void ui.toast.offsetWidth;
    ui.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      ui.toast.classList.remove("is-visible");
    }, 1700);
  }

  function showBanner(kicker, title, subtitle, danger = false) {
    bannerToken += 1;
    const token = bannerToken;
    ui.bannerKicker.textContent = kicker;
    ui.bannerTitle.textContent = title;
    ui.bannerSub.textContent = subtitle;
    ui.banner.classList.toggle("is-danger", danger);
    ui.banner.classList.remove("is-showing");
    void ui.banner.offsetWidth;
    ui.banner.classList.add("is-showing");
    window.clearTimeout(bannerTimer);
    bannerTimer = window.setTimeout(() => {
      if (token === bannerToken) ui.banner.classList.remove("is-showing");
    }, 2850);
  }

  function showControlHint() {
    window.clearTimeout(hintTimer);
    ui.hint.classList.add("is-visible");
    hintTimer = window.setTimeout(() => {
      ui.hint.classList.remove("is-visible");
    }, 5000);
  }

  function updateLivesDisplay(force = false) {
    if (!force && hudCache.lives === G.lives) return;
    hudCache.lives = G.lives;
    ui.lives.replaceChildren();
    ui.lives.setAttribute("aria-label", `剩余生命 ${G.lives}`);
    for (let i = 0; i < G.lives; i += 1) {
      const icon = document.createElement("span");
      icon.className = "life-icon";
      icon.setAttribute("aria-hidden", "true");
      ui.lives.appendChild(icon);
    }
  }

  function syncHud() {
    if (hudCache.score !== G.score) {
      hudCache.score = G.score;
      ui.score.textContent = formatScore(G.score);
    }
    if (hudCache.best !== G.best) {
      hudCache.best = G.best;
      ui.best.textContent = formatScore(G.best);
    }
    if (hudCache.wave !== G.wave) {
      hudCache.wave = G.wave;
      ui.wave.textContent = pad2(G.wave);
    }
    updateLivesDisplay();

    if (hudCache.bombs !== G.bombs) {
      hudCache.bombs = G.bombs;
      ui.bombCount.textContent = String(G.bombs);
      ui.bombBtn.classList.toggle("is-empty", G.bombs <= 0);
      ui.bombBtn.setAttribute("aria-label", `释放炸弹，剩余 ${G.bombs} 枚`);
    }

    if (hudCache.weapon !== player.weapon) {
      hudCache.weapon = player.weapon;
      ui.weaponChip.textContent = `火力 LV.${player.weapon}`;
    }

    const shieldSeconds = player.shield > 0 ? Math.ceil(player.shield) : 0;
    if (hudCache.shield !== shieldSeconds) {
      hudCache.shield = shieldSeconds;
      if (shieldSeconds > 0) {
        ui.shieldChip.hidden = false;
        ui.shieldChip.textContent = `护盾 ${shieldSeconds}s`;
      } else {
        ui.shieldChip.hidden = true;
      }
    }

    const showCombo = G.combo >= 2 && G.comboTimer > 0;
    const comboKey = showCombo ? G.combo : 0;
    if (hudCache.combo !== comboKey) {
      const previous = hudCache.combo;
      hudCache.combo = comboKey;
      if (showCombo) {
        const multiplier = comboMultiplier();
        ui.comboMult.textContent = `×${Number.isInteger(multiplier) ? multiplier : multiplier.toFixed(1)}`;
        ui.comboCount.textContent = `连续击破 ${G.combo}`;
        ui.combo.classList.add("is-active");
        if (previous >= 2) {
          ui.combo.classList.remove("is-bumping");
          void ui.combo.offsetWidth;
          ui.combo.classList.add("is-bumping");
        }
      } else {
        ui.combo.classList.remove("is-active", "is-bumping");
      }
    } else if (showCombo) {
      ui.comboCount.textContent = `连续击破 ${G.combo}`;
    }

    const boss = G.boss;
    if (boss) {
      if (!hudCache.bossActive) {
        hudCache.bossActive = true;
        ui.bossBar.classList.add("is-active");
        ui.bossBar.setAttribute("aria-hidden", "false");
      }
      const bossPercent = clamp(Math.ceil((boss.hp / boss.maxHp) * 100), 0, 100);
      if (hudCache.bossHp !== bossPercent) {
        hudCache.bossHp = bossPercent;
        ui.bossPercent.textContent = `${bossPercent}%`;
        ui.bossFill.style.width = `${bossPercent}%`;
      }
    } else if (hudCache.bossActive) {
      hudCache.bossActive = false;
      hudCache.bossHp = -1;
      ui.bossBar.classList.remove("is-active");
      ui.bossBar.setAttribute("aria-hidden", "true");
      ui.bossFill.style.width = "100%";
    }
  }

  function forceHudSync() {
    hudCache.score = -1;
    hudCache.best = -1;
    hudCache.wave = -1;
    hudCache.lives = -1;
    hudCache.bombs = -1;
    hudCache.weapon = -1;
    hudCache.shield = -1;
    hudCache.combo = -1;
    hudCache.bossHp = -1;
    syncHud();
  }

  /* ---------------------------------------------------------------------- */
  /* Game setup                                                             */
  /* ---------------------------------------------------------------------- */

  function resetRun() {
    G.runId += 1;
    G.score = 0;
    G.lives = 3;
    G.bombs = 2;
    G.kills = 0;
    G.wave = 1;
    G.waveTime = 0;
    G.spawnTimer = 0.9;
    G.elapsed = 0;
    G.combo = 0;
    G.comboTimer = 0;
    G.dropPity = 0;
    G.dropsThisRun = 0;
    G.bombCooldown = 0;
    G.shake = 0;
    G.flash = 0;
    G.deathTimer = 0;
    G.deathBurstTimer = 0;
    G.boss = null;
    G.pendingBanner = null;
    G.playerBullets.length = 0;
    G.enemyBullets.length = 0;
    G.enemies.length = 0;
    G.powerups.length = 0;
    G.particles.length = 0;
    G.rings.length = 0;
    G.floaters.length = 0;
    G.bestAtRunStart = G.best;

    player.x = WORLD_WIDTH / 2;
    player.y = WORLD_HEIGHT - 140;
    player.previousX = player.x;
    player.alive = true;
    player.invulnerable = 1.8;
    player.shield = 0;
    player.weapon = 1;
    player.fireTimer = 0.12;
    player.trailTimer = 0;
    player.tilt = 0;

    pointer.active = false;
    pointer.id = null;
    pointer.hasTarget = false;

    ui.bossBar.classList.remove("is-active");
    ui.bossBar.setAttribute("aria-hidden", "true");
    ui.combo.classList.remove("is-active", "is-bumping");
    forceHudSync();
  }

  function startGame() {
    if (G.state === "playing" || G.state === "dying" || G.state === "paused") return;

    sound.init();
    sound.ui();
    sound.startMusic();
    resetRun();
    G.state = "playing";

    setScreen(ui.startScreen, false);
    setScreen(ui.pauseScreen, false);
    setScreen(ui.gameoverScreen, false);
    setHudActive(true);

    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }

    showBanner("SECTOR ENGAGED · 01", "第 01 波", "敌方侦察编队正在接近");
    showControlHint();
    syncHud();
  }

  function pauseGame() {
    if (G.state !== "playing") return;
    G.state = "paused";
    pointer.active = false;
    pointer.id = null;
    clearKeys();
    setScreen(ui.pauseScreen, true);
    ui.resumeBtn.focus({ preventScroll: true });
    sound.ui();
  }

  function resumeGame() {
    if (G.state !== "paused") return;
    G.state = "playing";
    setScreen(ui.pauseScreen, false);
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    sound.ui();
    lastFrame = performance.now();
  }

  function commitBest() {
    if (G.score > G.best) {
      G.best = G.score;
      storeValue(STORAGE_BEST, G.best);
    }
    ui.menuBest.textContent = formatScore(G.best);
    syncHud();
  }

  function quitToMenu() {
    if (G.state === "dying") return;
    commitBest();
    G.state = "menu";
    clearKeys();
    G.playerBullets.length = 0;
    G.enemyBullets.length = 0;
    G.enemies.length = 0;
    G.powerups.length = 0;
    G.particles.length = 0;
    G.rings.length = 0;
    G.floaters.length = 0;
    G.boss = null;
    G.shake = 0;
    G.flash = 0;
    pointer.active = false;
    pointer.hasTarget = false;

    ui.hint.classList.remove("is-visible");
    ui.banner.classList.remove("is-showing");
    ui.bossBar.classList.remove("is-active");
    setScreen(ui.pauseScreen, false);
    setScreen(ui.gameoverScreen, false);
    setScreen(ui.startScreen, true);
    setHudActive(false);
    ui.menuBest.textContent = formatScore(G.best);
    sound.ui();
  }

  function finishRun() {
    G.state = "gameover";
    ui.hint.classList.remove("is-visible");
    setHudActive(false);

    const isRecord = G.score > G.bestAtRunStart;
    if (G.score > G.best) {
      G.best = G.score;
      storeValue(STORAGE_BEST, G.best);
    }

    ui.finalScore.textContent = formatScore(G.score);
    ui.finalWave.textContent = pad2(G.wave);
    ui.finalKills.textContent = formatScore(G.kills);
    ui.finalTime.textContent = formatTime(G.elapsed);
    ui.finalBest.textContent = formatScore(G.best);
    ui.menuBest.textContent = formatScore(G.best);
    ui.newRecord.hidden = !isRecord;
    setScreen(ui.gameoverScreen, true);
    sound.gameOver();
  }

  function beginDeath() {
    if (G.state !== "playing") return;
    G.state = "dying";
    G.lives = 0;
    player.alive = false;
    G.deathTimer = 1.75;
    G.deathBurstTimer = 0;
    G.combo = 0;
    G.comboTimer = 0;
    clearEnemyBullets(false);
    spawnExplosion(player.x, player.y, 2.8, true);
    addRing(player.x, player.y, 20, 250, 0.8, [255, 143, 113], 5);
    addRing(player.x, player.y, 8, 160, 0.55, [255, 234, 205], 2);
    G.shake = 30;
    G.flash = 0.68;
    G.flashColor = [255, 209, 188];
    sound.explosion(true);
    syncHud();
  }

  /* ---------------------------------------------------------------------- */
  /* Player                                                                 */
  /* ---------------------------------------------------------------------- */

  function clearKeys() {
    Object.keys(keys).forEach((key) => {
      delete keys[key];
    });
  }

  function updatePlayer(dt) {
    const left = keys.ArrowLeft || keys.KeyA;
    const right = keys.ArrowRight || keys.KeyD;
    const up = keys.ArrowUp || keys.KeyW;
    const down = keys.ArrowDown || keys.KeyS;
    const directionX = (right ? 1 : 0) - (left ? 1 : 0);
    const directionY = (down ? 1 : 0) - (up ? 1 : 0);

    player.previousX = player.x;
    if (directionX !== 0 || directionY !== 0) {
      const length = Math.hypot(directionX, directionY) || 1;
      player.x += (directionX / length) * PLAYER_SPEED * dt;
      player.y += (directionY / length) * PLAYER_SPEED * dt;
      pointer.hasTarget = false;
    } else if (pointer.hasTarget) {
      const follow = 1 - Math.exp(-23 * dt);
      player.x = lerp(player.x, pointer.targetX, follow);
      player.y = lerp(player.y, pointer.targetY, follow);
    }

    player.x = clamp(player.x, 24, WORLD_WIDTH - 24);
    player.y = clamp(player.y, 64, WORLD_HEIGHT - 46);

    const horizontalVelocity = (player.x - player.previousX) / Math.max(dt, 0.001);
    const targetTilt = clamp(horizontalVelocity * 0.00038, -0.16, 0.16);
    player.tilt = lerp(player.tilt, targetTilt, Math.min(1, dt * 14));

    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.shield = Math.max(0, player.shield - dt);
    G.bombCooldown = Math.max(0, G.bombCooldown - dt);

    player.trailTimer -= dt;
    if (player.trailTimer <= 0) {
      player.trailTimer += 0.032;
      const offset = random(-6, 6);
      addParticle({
        type: "engine",
        x: player.x + offset,
        y: player.y + 24,
        vx: random(-10, 10) - player.tilt * 25,
        vy: random(50, 100),
        life: random(0.16, 0.3),
        maxLife: 0.3,
        size: random(4, 9),
        drag: 2.2,
        rgb: [92, 225, 234]
      });
    }

    player.fireTimer -= dt;
    if (player.fireTimer <= 0) {
      firePlayerWeapon();
      player.fireTimer += WEAPONS[player.weapon - 1].interval;
      if (player.fireTimer < 0) player.fireTimer = 0.02;
    }
  }

  function firePlayerWeapon() {
    const weapon = WEAPONS[player.weapon - 1];
    weapon.shots.forEach((shot) => {
      const angle = shot.angle;
      G.playerBullets.push({
        x: player.x + shot.x,
        y: player.y - 24,
        vx: Math.sin(angle) * PLAYER_BULLET_SPEED,
        vy: -Math.cos(angle) * PLAYER_BULLET_SPEED,
        radius: shot.radius,
        damage: shot.damage,
        dead: false
      });
      if (G.particles.length < 460) {
        addParticle({
          type: "spark",
          x: player.x + shot.x,
          y: player.y - 25,
          vx: random(-24, 24),
          vy: random(-80, -35),
          life: 0.08,
          maxLife: 0.08,
          size: 1.3,
          drag: 0.5,
          rgb: [176, 255, 255]
        });
      }
    });
    sound.shoot();
  }

  function useBomb() {
    if (G.state !== "playing") return;
    if (G.bombCooldown > 0) return;
    if (G.bombs <= 0) {
      showToast("轰炸弹已用尽", "rose");
      sound.denied();
      return;
    }

    G.bombs -= 1;
    G.bombCooldown = 0.75;
    G.flash = 0.7;
    G.flashColor = [217, 254, 255];
    G.shake = Math.max(G.shake, 18);
    addRing(player.x, player.y, 18, Math.max(WORLD_WIDTH, WORLD_HEIGHT) * 1.2, 1.05, [172, 249, 255], 7);
    addRing(player.x, player.y, 10, 320, 0.75, [255, 220, 154], 3);
    for (let i = 0; i < 46; i += 1) {
      const angle = random(0, TAU);
      addParticle({
        type: "spark",
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * random(80, 540),
        vy: Math.sin(angle) * random(80, 540),
        life: random(0.35, 0.85),
        maxLife: 0.85,
        size: random(1.2, 3.1),
        drag: 1.2,
        rgb: Math.random() < 0.35 ? [255, 218, 156] : [170, 250, 255]
      });
    }

    clearEnemyBullets(true);
    [...G.enemies].forEach((enemy) => {
      if (enemy.dead) return;
      damageEnemy(enemy, enemy.isBoss ? 72 : 50, enemy.x, enemy.y, true);
    });

    sound.bomb();
    showToast("轨道轰炸 · 全屏净空", "gold");
    syncHud();
  }

  /* ---------------------------------------------------------------------- */
  /* Enemies and director                                                   */
  /* ---------------------------------------------------------------------- */

  function spawnEnemy(type, x, y, options = {}) {
    if (G.enemies.length > 24) return null;
    const definition = ENEMY_ARCHETYPES[type];
    const difficulty = 1 + (G.wave - 1) * 0.14;
    const enemy = {
      type,
      x,
      y,
      baseX: clamp(x, 42, WORLD_WIDTH - 42),
      radius: definition.radius,
      hp: Math.round(definition.hp * difficulty * (options.hpScale || 1)),
      maxHp: Math.round(definition.hp * difficulty * (options.hpScale || 1)),
      score: definition.score,
      speed: definition.speed * (options.speedScale || 1),
      age: 0,
      phase: random(0, TAU),
      fireTimer: random(0.8, 1.8),
      stopY: options.stopY || 0,
      hitFlash: 0,
      dead: false,
      amplitude: options.amplitude === undefined ? random(24, 42) : options.amplitude
    };
    G.enemies.push(enemy);
    return enemy;
  }

  function chooseEnemyType() {
    const roll = Math.random();
    if (G.wave < 2) {
      return roll < 0.79 ? "scout" : "striker";
    }
    if (G.wave < 4) {
      if (roll < 0.48) return "scout";
      if (roll < 0.84) return "striker";
      return "tank";
    }
    if (roll < 0.42) return "scout";
    if (roll < 0.77) return "striker";
    return "tank";
  }

  function spawnFormation() {
    if (G.enemies.length > 20) return;
    const roll = Math.random();
    if (roll < 0.17 && G.wave >= 2) {
      const center = random(105, WORLD_WIDTH - 105);
      for (let i = 0; i < 3; i += 1) {
        spawnEnemy("scout", center - 62 + i * 62, -32 - Math.abs(1 - i) * 38, {
          amplitude: 20
        });
      }
      return;
    }

    if (roll < 0.36) {
      const center = random(90, WORLD_WIDTH - 90);
      spawnEnemy("scout", center - 42, -34, { amplitude: 26 });
      spawnEnemy("scout", center + 42, -80, { amplitude: 26 });
      return;
    }

    const type = chooseEnemyType();
    let x = random(48, WORLD_WIDTH - 48);
    if (type === "striker") x = random(105, WORLD_WIDTH - 105);
    if (type === "tank") x = random(78, WORLD_WIDTH - 78);
    if (type === "tank") {
      spawnEnemy(type, x, -50, {
        stopY: random(WORLD_HEIGHT * 0.19, Math.min(WORLD_HEIGHT * 0.31, 255)),
        speedScale: 0.9
      });
    } else {
      spawnEnemy(type, x, -42);
    }
  }

  function updateDirector(dt) {
    if (G.boss) return;

    G.waveTime += dt;
    const waveLength = Math.max(19, 23 - G.wave * 0.25);
    if (G.waveTime >= waveLength) {
      G.wave += 1;
      G.waveTime = 0;
      if (G.wave % 3 === 0) {
        spawnBoss();
        return;
      }
      showBanner(
        `WAVE ${pad2(G.wave)} · INCOMING`,
        `第 ${pad2(G.wave)} 波`,
        G.wave % 3 === 2 ? "高能反应增强，注意火力配置" : "新的敌方编队进入星区"
      );
      G.spawnTimer = Math.min(G.spawnTimer, 0.9);
    }

    G.spawnTimer -= dt;
    if (G.spawnTimer <= 0) {
      spawnFormation();
      const cadence = Math.max(0.66, 1.28 - G.wave * 0.055);
      G.spawnTimer = cadence * random(0.76, 1.22);
    }

    if (G.pendingBanner) {
      G.pendingBanner.timer -= dt;
      if (G.pendingBanner.timer <= 0) {
        const pending = G.pendingBanner;
        G.pendingBanner = null;
        showBanner(pending.kicker, pending.title, pending.sub, pending.danger);
      }
    }
  }

  function spawnBoss() {
    const tier = Math.max(1, Math.floor(G.wave / 3));
    const names = [
      "赤焰级 · DREADNOUGHT",
      "虚空级 · LEVIATHAN",
      "终焉级 · SOVEREIGN",
      "深渊级 · OBLIVION"
    ];
    const maxHp = Math.round(415 + (tier - 1) * 280 + Math.max(0, G.wave - 3) * 55);
    const boss = {
      type: "boss",
      isBoss: true,
      tier,
      x: WORLD_WIDTH / 2,
      y: -135,
      targetY: Math.max(224, Math.min(258, WORLD_HEIGHT * 0.245)),
      radius: 72,
      hp: maxHp,
      maxHp,
      age: 0,
      phase: random(0, TAU),
      entering: true,
      enterTime: 0,
      attackTimer: 1.6,
      patternTimer: 4.6,
      pattern: 0,
      minionTimer: 7,
      enraged: false,
      hitFlash: 0,
      dead: false,
      amplitude: Math.min(145, WORLD_WIDTH * 0.3)
    };

    G.enemies.push(boss);
    G.boss = boss;
    G.waveTime = 0;
    G.spawnTimer = 2.2;
    clearEnemyBullets(true);
    ui.bossName.textContent = names[Math.min(tier - 1, names.length - 1)];
    showBanner("WARNING · MASSIVE SIGNAL", "敌方母舰来袭", "锁定核心 · 摧毁敌方旗舰", true);
    sound.warning();
    addRing(WORLD_WIDTH / 2, 0, 10, WORLD_WIDTH, 0.9, [255, 113, 131], 3);
  }

  function updateBoss(boss, dt) {
    boss.age += dt;
    boss.hitFlash = Math.max(0, boss.hitFlash - dt);

    if (boss.entering) {
      boss.enterTime += dt;
      const progress = clamp(boss.enterTime / 2.15, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      boss.y = lerp(-135, boss.targetY, eased);
      if (progress >= 1) {
        boss.entering = false;
        boss.attackTimer = 0.9;
        G.shake = Math.max(G.shake, 10);
      }
      return;
    }

    boss.x = WORLD_WIDTH / 2 + Math.sin(boss.age * 0.58 + boss.phase) * boss.amplitude;
    boss.y = boss.targetY + Math.sin(boss.age * 1.4) * 7;

    if (!boss.enraged && boss.hp < boss.maxHp * 0.5) {
      boss.enraged = true;
      boss.attackTimer = 0.35;
      boss.patternTimer = 2.7;
      G.flash = 0.32;
      G.flashColor = [255, 117, 118];
      G.shake = Math.max(G.shake, 16);
      addRing(boss.x, boss.y, 35, 250, 0.8, [255, 117, 128], 4);
      showToast("警告 · 母舰进入狂暴状态", "rose");
      sound.warning();
    }

    boss.patternTimer -= dt;
    if (boss.patternTimer <= 0) {
      boss.pattern = (boss.pattern + 1) % 3;
      boss.patternTimer = boss.enraged ? 3.9 : 4.8;
      boss.attackTimer = Math.min(boss.attackTimer, 0.42);
    }

    boss.attackTimer -= dt;
    if (boss.attackTimer <= 0) {
      const aimedAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
      if (boss.pattern === 0) {
        const count = boss.enraged ? 9 : 7;
        const spread = 0.92;
        for (let i = 0; i < count; i += 1) {
          const offset = (i / (count - 1) - 0.5) * spread;
          spawnEnemyBullet(
            boss.x,
            boss.y + 28,
            aimedAngle + offset,
            boss.enraged ? 225 : 200,
            6,
            [255, 103, 131]
          );
        }
        boss.attackTimer = boss.enraged ? 1.02 : 1.36;
        sound.enemyShoot();
      } else if (boss.pattern === 1) {
        const count = boss.enraged ? 26 : 20;
        const offset = boss.age * 0.37;
        for (let i = 0; i < count; i += 1) {
          spawnEnemyBullet(
            boss.x,
            boss.y + 8,
            offset + (i / count) * TAU,
            boss.enraged ? 160 : 142,
            5.5,
            i % 3 === 0 ? [255, 185, 106] : [255, 105, 150]
          );
        }
        boss.attackTimer = boss.enraged ? 1.32 : 1.72;
        sound.enemyShoot();
      } else {
        [-1, 1].forEach((side) => {
          const originX = boss.x + side * 59;
          const originY = boss.y + 2;
          const sideAngle = Math.atan2(player.y - originY, player.x - originX);
          spawnEnemyBullet(originX, originY, sideAngle - 0.06, 238, 5.5, [255, 177, 100]);
          spawnEnemyBullet(originX, originY, sideAngle + 0.06, 238, 5.5, [255, 177, 100]);
        });
        boss.attackTimer = boss.enraged ? 0.5 : 0.68;
      }
    }

    if (boss.enraged) {
      boss.minionTimer -= dt;
      if (boss.minionTimer <= 0 && G.enemies.length < 12) {
        boss.minionTimer = 7;
        spawnEnemy("scout", clamp(boss.x - 90, 45, WORLD_WIDTH - 45), boss.y + 20, {
          hpScale: 0.8
        });
        spawnEnemy("scout", clamp(boss.x + 90, 45, WORLD_WIDTH - 45), boss.y + 20, {
          hpScale: 0.8
        });
      }
    }
  }

  function updateEnemies(dt) {
    for (const enemy of G.enemies) {
      if (enemy.dead) continue;
      if (enemy.isBoss) {
        updateBoss(enemy, dt);
        continue;
      }

      enemy.age += dt;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);

      if (enemy.type === "scout") {
        enemy.y += enemy.speed * dt;
        enemy.x = enemy.baseX + Math.sin(enemy.age * 2.25 + enemy.phase) * enemy.amplitude;
      } else if (enemy.type === "striker") {
        enemy.y += enemy.speed * dt;
        enemy.x = enemy.baseX + Math.sin(enemy.age * 1.45 + enemy.phase) * (enemy.amplitude + 28);
      } else {
        const targetStop = enemy.stopY || WORLD_HEIGHT * 0.24;
        if (enemy.y < targetStop) {
          enemy.y += enemy.speed * dt;
        } else {
          enemy.y = targetStop + Math.sin(enemy.age * 1.25 + enemy.phase) * 7;
        }
        enemy.x = enemy.baseX + Math.sin(enemy.age * 0.83 + enemy.phase) * (enemy.amplitude + 16);
      }

      enemy.fireTimer -= dt;
      if (enemy.fireTimer <= 0 && enemy.y > 10 && enemy.y < WORLD_HEIGHT * 0.84) {
        if (enemy.type === "scout") {
          fireAimed(enemy, 1, 168 + G.wave * 3, 0);
          enemy.fireTimer = Math.max(1.25, 2.35 - G.wave * 0.055) + random(0, 0.55);
        } else if (enemy.type === "striker") {
          fireAimed(enemy, 3, 172 + G.wave * 3, 0.12);
          enemy.fireTimer = Math.max(1.3, 2.15 - G.wave * 0.045) + random(0, 0.5);
        } else {
          fireAimed(enemy, 5, 155 + G.wave * 2, 0.19);
          enemy.fireTimer = Math.max(1.9, 2.8 - G.wave * 0.03) + random(0, 0.4);
        }
        sound.enemyShoot();
      }

      if (enemy.y > WORLD_HEIGHT + 76) {
        enemy.dead = true;
      }
    }

    for (let i = G.enemies.length - 1; i >= 0; i -= 1) {
      if (G.enemies[i].dead) G.enemies.splice(i, 1);
    }
  }

  function fireAimed(enemy, count, speed, spread) {
    if (G.enemyBullets.length > ENEMY_BULLET_LIMIT) return;
    const baseAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    for (let i = 0; i < count; i += 1) {
      const offset = count === 1 ? 0 : (i / (count - 1) - 0.5) * spread * 2;
      spawnEnemyBullet(
        enemy.x,
        enemy.y + enemy.radius * 0.55,
        baseAngle + offset,
        speed,
        enemy.type === "tank" ? 6 : 5,
        enemy.type === "tank" ? [255, 181, 96] : [255, 105, 139]
      );
    }
  }

  function spawnEnemyBullet(x, y, angle, speed, radius, rgb) {
    if (G.enemyBullets.length >= ENEMY_BULLET_LIMIT) return;
    G.enemyBullets.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      rgb,
      dead: false
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Collisions and damage                                                  */
  /* ---------------------------------------------------------------------- */

  function updateBullets(dt) {
    for (const bullet of G.playerBullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (bullet.y < -30 || bullet.x < -20 || bullet.x > WORLD_WIDTH + 20) {
        bullet.dead = true;
      }
    }

    for (const bullet of G.enemyBullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (
        bullet.y > WORLD_HEIGHT + 28 ||
        bullet.y < -60 ||
        bullet.x < -50 ||
        bullet.x > WORLD_WIDTH + 50
      ) {
        bullet.dead = true;
      }
    }
  }

  function checkCollisions() {
    for (const bullet of G.playerBullets) {
      if (bullet.dead) continue;
      for (const enemy of G.enemies) {
        if (enemy.dead) continue;
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const radius = bullet.radius + (enemy.isBoss ? enemy.radius * 1.05 : enemy.radius);
        if (dx * dx + dy * dy <= radius * radius) {
          bullet.dead = true;
          damageEnemy(enemy, bullet.damage, bullet.x, bullet.y, false);
          break;
        }
      }
    }

    if (player.invulnerable <= 0 && player.alive) {
      for (const bullet of G.enemyBullets) {
        if (bullet.dead) continue;
        const dx = bullet.x - player.x;
        const dy = bullet.y - player.y;
        const radius = bullet.radius + player.radius;
        if (dx * dx + dy * dy <= radius * radius) {
          bullet.dead = true;
          hitPlayer();
          break;
        }
      }
    }

    if (G.state === "playing" && player.invulnerable <= 0) {
      for (const enemy of G.enemies) {
        if (enemy.dead) continue;
        if (enemy.isBoss && (enemy.entering || enemy.dead)) continue;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const radius = player.radius + enemy.radius * 0.76;
        if (dx * dx + dy * dy <= radius * radius) {
          if (!enemy.isBoss) {
            enemy.dead = true;
            spawnExplosion(enemy.x, enemy.y, 1.1, false);
          }
          hitPlayer();
          break;
        }
      }
    }

    if (G.state === "playing") {
      for (const powerup of G.powerups) {
        if (powerup.dead) continue;
        const dx = powerup.x - player.x;
        const dy = powerup.y - player.y;
        const radius = powerup.radius + player.radius + 6;
        if (dx * dx + dy * dy <= radius * radius) {
          powerup.dead = true;
          collectPowerup(powerup.kind);
        }
      }
    }

    for (let i = G.playerBullets.length - 1; i >= 0; i -= 1) {
      if (G.playerBullets[i].dead) G.playerBullets.splice(i, 1);
    }
    for (let i = G.enemyBullets.length - 1; i >= 0; i -= 1) {
      if (G.enemyBullets[i].dead) G.enemyBullets.splice(i, 1);
    }
    for (let i = G.powerups.length - 1; i >= 0; i -= 1) {
      if (G.powerups[i].dead) G.powerups.splice(i, 1);
    }
  }

  function damageEnemy(enemy, damage, hitX, hitY, quiet = false) {
    if (enemy.dead) return;
    enemy.hp -= damage;
    enemy.hitFlash = enemy.isBoss ? 0.06 : 0.045;

    if (!quiet && G.particles.length < 430) {
      for (let i = 0; i < 2; i += 1) {
        addParticle({
          type: "spark",
          x: hitX,
          y: hitY,
          vx: random(-90, 90),
          vy: random(-90, 40),
          life: random(0.08, 0.2),
          maxLife: 0.2,
          size: random(0.7, 1.8),
          drag: 1,
          rgb: enemy.isBoss ? [255, 208, 151] : [198, 252, 255]
        });
      }
    }

    if (enemy.hp <= 0) {
      if (enemy.isBoss) {
        destroyBoss(enemy);
      } else {
        destroyEnemy(enemy);
      }
    }
  }

  function destroyEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    G.kills += 1;
    G.combo += 1;
    G.comboTimer = 2.45;
    const multiplier = comboMultiplier();
    const points = Math.round(enemy.score * multiplier);
    G.score += points;
    G.shake = Math.max(G.shake, enemy.type === "tank" ? 8 : 2.7);
    spawnExplosion(enemy.x, enemy.y, enemy.type === "tank" ? 1.55 : 0.9, false);
    addFloater(`+${formatScore(points)}`, enemy.x, enemy.y - 8, "#bffbff", enemy.type === "tank" ? 14 : 11);
    sound.explosion(enemy.type === "tank");
    maybeDropPowerup(enemy);
  }

  function destroyBoss(boss) {
    if (boss.dead) return;
    boss.dead = true;
    G.kills += 1;
    G.boss = null;
    G.combo += 4;
    G.comboTimer = 3.5;
    const tier = boss.tier || 1;
    const runId = G.runId;
    const points = Math.round((3200 + tier * 1600) * comboMultiplier());
    G.score += points;

    spawnExplosion(boss.x, boss.y, 3.4, true);
    for (let i = 0; i < 7; i += 1) {
      const angle = random(0, TAU);
      const distance = random(18, 100);
      window.setTimeout(() => {
        if (G.state === "menu" || G.runId !== runId) return;
        spawnExplosion(boss.x + Math.cos(angle) * distance, boss.y + Math.sin(angle) * distance, random(0.8, 1.6), false);
      }, i * 85);
    }
    addRing(boss.x, boss.y, 30, 360, 1.1, [255, 224, 191], 5);
    addRing(boss.x, boss.y, 12, 260, 0.8, [255, 121, 131], 3);
    addFloater(`+${formatScore(points)}`, boss.x, boss.y, "#ffe1a3", 20);
    G.shake = 26;
    G.flash = 0.48;
    G.flashColor = [255, 222, 187];
    sound.explosion(true);
    clearEnemyBullets(true);

    const drops = ["power", "bomb", "shield", "life"];
    drops.forEach((kind, index) => {
      spawnPowerup(kind, clamp(boss.x + (index - 1.5) * 41, 48, WORLD_WIDTH - 48), boss.y + 20);
    });

    G.wave += 1;
    G.waveTime = 0;
    G.spawnTimer = 2.1;
    G.dropsThisRun += 1;
    G.pendingBanner = {
      timer: 1.15,
      kicker: "THREAT ELIMINATED",
      title: "空域肃清",
      sub: `母舰核心已摧毁 · 第 ${pad2(G.wave)} 波即将接敌`,
      danger: false
    };
    syncHud();
  }

  function hitPlayer() {
    if (G.state !== "playing" || !player.alive || player.invulnerable > 0) return;

    if (player.shield > 0) {
      player.shield = 0;
      player.invulnerable = 0.9;
      clearEnemyBullets(true);
      addRing(player.x, player.y, 18, 130, 0.55, [104, 250, 176], 3);
      spawnExplosion(player.x, player.y, 0.7, false, [102, 246, 178]);
      G.shake = Math.max(G.shake, 9);
      showToast("护盾吸收伤害 · 护盾破碎", "green");
      sound.shieldBreak();
      syncHud();
      return;
    }

    G.lives -= 1;
    G.combo = 0;
    G.comboTimer = 0;
    player.shield = 0;
    clearEnemyBullets(true);
    spawnExplosion(player.x, player.y, 1.65, true);
    addRing(player.x, player.y, 16, 190, 0.7, [255, 154, 139], 4);
    G.shake = Math.max(G.shake, 18);
    G.flash = 0.36;
    G.flashColor = [255, 105, 119];

    if (G.lives <= 0) {
      sound.hit();
      beginDeath();
      return;
    }

    player.invulnerable = 2.6;
    player.weapon = Math.max(1, player.weapon - 1);
    sound.hit();
    showToast(
      player.weapon < 5 ? `机体受损 · 火力降至 LV.${player.weapon}` : "机体受损",
      "rose"
    );
    syncHud();
  }

  function clearEnemyBullets(withSparks) {
    if (withSparks) {
      for (const bullet of G.enemyBullets) {
        if (G.particles.length > 430) break;
        if (bullet.x > -20 && bullet.x < WORLD_WIDTH + 20 && bullet.y > -20 && bullet.y < WORLD_HEIGHT + 20) {
          addParticle({
            type: "spark",
            x: bullet.x,
            y: bullet.y,
            vx: random(-55, 55),
            vy: random(-55, 55),
            life: random(0.12, 0.3),
            maxLife: 0.3,
            size: random(0.8, 2),
            drag: 1,
            rgb: bullet.rgb || [255, 210, 160]
          });
        }
      }
    }
    G.enemyBullets.length = 0;
  }

  /* ---------------------------------------------------------------------- */
  /* Pickups                                                                */
  /* ---------------------------------------------------------------------- */

  function maybeDropPowerup(enemy) {
    G.dropPity += 1;
    let shouldDrop = Math.random() < ENEMY_ARCHETYPES[enemy.type].drop;
    if (G.dropPity >= 7) shouldDrop = true;
    if (!shouldDrop) return;

    G.dropPity = 0;
    G.dropsThisRun += 1;
    let kind;
    if (G.dropsThisRun === 1) {
      kind = "power";
    } else {
      const roll = Math.random();
      if (player.weapon < 5 && roll < 0.47) {
        kind = "power";
      } else if (roll < 0.69) {
        kind = "shield";
      } else if (roll < 0.88) {
        kind = "bomb";
      } else {
        kind = "life";
      }
    }
    spawnPowerup(kind, enemy.x, enemy.y);
  }

  function spawnPowerup(kind, x, y) {
    G.powerups.push({
      kind,
      x,
      y,
      baseX: x,
      age: random(0, TAU),
      vy: random(55, 74),
      radius: 14,
      dead: false
    });
  }

  function updatePowerups(dt) {
    for (const powerup of G.powerups) {
      if (powerup.dead) continue;
      powerup.age += dt;
      const dx = player.x - powerup.x;
      const dy = player.y - powerup.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 108 && player.alive) {
        const pull = (1 - distance / 108) * 540;
        powerup.x += (dx / Math.max(distance, 1)) * pull * dt;
        powerup.y += (dy / Math.max(distance, 1)) * pull * dt;
      } else {
        powerup.y += powerup.vy * dt;
        powerup.baseX += Math.sin(powerup.age * 1.8) * 5 * dt;
        powerup.x = lerp(powerup.x, powerup.baseX + Math.sin(powerup.age * 2.1) * 10, 0.05);
      }

      if (powerup.y > WORLD_HEIGHT + 40) powerup.dead = true;
    }
  }

  function collectPowerup(kind) {
    const style = POWERUP_STYLES[kind];
    const color = `rgb(${style.rgb.join(",")})`;
    addFloater(style.label, player.x, player.y - 34, color, 11);

    if (kind === "power") {
      if (player.weapon < 5) {
        player.weapon += 1;
        showToast(`火力强化 · LV.${player.weapon}`, "gold");
        sound.powerup();
      } else {
        G.score += 1000;
        showToast("火力已满 · 额外 +1,000", "gold");
        sound.pickup();
      }
    } else if (kind === "shield") {
      player.shield = Math.max(player.shield, 10);
      showToast("能量护盾启动 · 持续 10 秒", "green");
      addRing(player.x, player.y, 12, 62, 0.45, [104, 250, 178], 2);
      sound.powerup();
    } else if (kind === "bomb") {
      if (G.bombs < 5) {
        G.bombs += 1;
        showToast("轨道轰炸弹 +1", "gold");
      } else {
        G.score += 500;
        showToast("轰炸弹已满 · 额外 +500", "gold");
      }
      sound.pickup();
    } else {
      if (G.lives < 5) {
        G.lives += 1;
        showToast("机体修复完成 · 生命 +1", "rose");
      } else {
        G.score += 750;
        showToast("生命已满 · 额外 +750", "rose");
      }
      sound.powerup();
    }

    for (let i = 0; i < 10; i += 1) {
      const angle = random(0, TAU);
      addParticle({
        type: "spark",
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * random(40, 170),
        vy: Math.sin(angle) * random(40, 170),
        life: random(0.2, 0.5),
        maxLife: 0.5,
        size: random(0.8, 2),
        drag: 1.4,
        rgb: style.rgb
      });
    }
    syncHud();
  }

  /* ---------------------------------------------------------------------- */
  /* Effects                                                                */
  /* ---------------------------------------------------------------------- */

  function addParticle(particle) {
    if (G.particles.length >= 520) return;
    G.particles.push(particle);
  }

  function spawnExplosion(x, y, scale = 1, big = false, colorOverride = null) {
    const count = Math.round(10 + scale * 12);
    for (let i = 0; i < count; i += 1) {
      const angle = random(0, TAU);
      const speed = random(45, 210) * scale;
      const warm = Math.random() < 0.45;
      const rgb = colorOverride || (warm ? [255, 196, 100] : [255, 112, 86]);
      addParticle({
        type: "spark",
        x: x + random(-4, 4) * scale,
        y: y + random(-4, 4) * scale,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: random(0.24, 0.65) * (big ? 1.35 : 1),
        maxLife: 0.65 * (big ? 1.35 : 1),
        size: random(1, 2.5) * Math.min(scale, 2.1),
        drag: 1.15,
        rgb
      });
    }

    if (G.particles.length < 460) {
      for (let i = 0; i < Math.round(3 + scale * 3); i += 1) {
        const angle = random(0, TAU);
        addParticle({
          type: "smoke",
          x: x + random(-8, 8) * scale,
          y: y + random(-8, 8) * scale,
          vx: Math.cos(angle) * random(8, 45) * scale,
          vy: Math.sin(angle) * random(8, 45) * scale,
          life: random(0.35, 0.8),
          maxLife: 0.8,
          size: random(5, 13) * scale,
          drag: 1.8,
          rgb: [91, 102, 119]
        });
      }
    }

    if (scale > 1.05) {
      addRing(x, y, 4, 45 + scale * 38, 0.34 + scale * 0.11, [255, 185, 111], 1.8);
    }
    if (big) {
      addRing(x, y, 8, 150 + scale * 25, 0.55, [255, 217, 169], 2.2);
    }
  }

  function addRing(x, y, innerRadius, outerRadius, life, rgb, width) {
    if (G.rings.length > 36) G.rings.shift();
    G.rings.push({
      x,
      y,
      innerRadius,
      outerRadius,
      life,
      maxLife: life,
      rgb,
      width
    });
  }

  function addFloater(text, x, y, color, size = 11) {
    if (G.floaters.length > 26) G.floaters.shift();
    G.floaters.push({
      text,
      x,
      y,
      color,
      size,
      life: 0.85,
      maxLife: 0.85
    });
  }

  function updateParticles(dt) {
    for (const particle of G.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      const damping = Math.max(0, 1 - (particle.drag || 0) * dt);
      particle.vx *= damping;
      particle.vy *= damping;
    }
    G.particles = G.particles.filter((particle) => particle.life > 0);
  }

  function updateRings(dt) {
    for (const ring of G.rings) {
      ring.life -= dt;
    }
    G.rings = G.rings.filter((ring) => ring.life > 0);
  }

  function updateFloaters(dt) {
    for (const floater of G.floaters) {
      floater.life -= dt;
      floater.y -= 24 * dt;
    }
    G.floaters = G.floaters.filter((floater) => floater.life > 0);
  }

  function updateStars(dt, speedFactor) {
    for (const star of G.stars) {
      star.y += star.speed * speedFactor * dt;
      star.phase += star.twinkle * 1000 * dt;
      if (star.y > WORLD_HEIGHT + 3) {
        star.y = -3;
        star.x = Math.random() * WORLD_WIDTH;
      }
    }

    if (Math.random() < dt * 0.08 * speedFactor && G.shootingStars.length < 2) {
      G.shootingStars.push({
        x: random(WORLD_WIDTH * 0.2, WORLD_WIDTH * 0.95),
        y: random(-10, WORLD_HEIGHT * 0.25),
        vx: random(-150, -80),
        vy: random(110, 180),
        life: 0.85,
        maxLife: 0.85
      });
    }

    for (const star of G.shootingStars) {
      star.x += star.vx * dt;
      star.y += star.vy * dt;
      star.life -= dt;
    }
    G.shootingStars = G.shootingStars.filter((star) => star.life > 0);
  }

  function updateEffects(dt) {
    G.shake = Math.max(0, G.shake - dt * 38);
    G.flash = Math.max(0, G.flash - dt * 2.2);
    updateParticles(dt);
    updateRings(dt);
    updateFloaters(dt);
  }

  /* ---------------------------------------------------------------------- */
  /* Update loop                                                            */
  /* ---------------------------------------------------------------------- */

  function updateCombo(dt) {
    if (G.combo <= 0) return;
    G.comboTimer -= dt;
    if (G.comboTimer <= 0) {
      G.combo = 0;
      G.comboTimer = 0;
    }
  }

  function updatePlaying(dt) {
    G.elapsed += dt;
    G.animTime += dt;
    updateStars(dt, 1.1);
    updatePlayer(dt);
    updateDirector(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePowerups(dt);
    checkCollisions();
    updateCombo(dt);
    updateEffects(dt);
    sound.updateMusic(dt);
    syncHud();
  }

  function updateDying(dt) {
    G.animTime += dt;
    G.deathTimer -= dt;
    G.deathBurstTimer -= dt;
    updateStars(dt, 0.32);
    if (G.deathBurstTimer <= 0 && G.deathTimer > 0.25) {
      G.deathBurstTimer = 0.2;
      spawnExplosion(
        player.x + random(-38, 38),
        player.y + random(-25, 25),
        random(0.45, 0.9),
        false
      );
      G.shake = Math.max(G.shake, 6);
    }
    updateEffects(dt);
    if (G.deathTimer <= 0) finishRun();
  }

  function updateAmbient(dt) {
    G.animTime += dt;
    updateStars(dt, G.state === "menu" ? 0.35 : 0.18);
    updateEffects(dt);
  }

  function tick(now) {
    const delta = clamp((now - lastFrame) / 1000, 0, 0.04);
    lastFrame = now;

    if (G.state === "playing") {
      updatePlaying(delta);
    } else if (G.state === "dying") {
      updateDying(delta);
    } else if (G.state !== "paused") {
      updateAmbient(delta);
    }

    render();
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------------------- */
  /* Rendering                                                              */
  /* ---------------------------------------------------------------------- */

  function drawStars(speedFactor) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const star of G.stars) {
      const twinkle = 0.78 + Math.sin(star.phase) * 0.22;
      ctx.globalAlpha = star.alpha * twinkle;
      ctx.fillStyle = star.warm ? "#ffe7c1" : "#bdebf3";
      const streak = speedFactor > 0.5 ? 1 + star.depth * 2.4 : 1;
      ctx.fillRect(star.x, star.y, star.size, star.size * streak);
    }

    for (const star of G.shootingStars) {
      const alpha = clamp(star.life / star.maxLife, 0, 1);
      ctx.globalAlpha = alpha * 0.55;
      const gradient = ctx.createLinearGradient(
        star.x,
        star.y,
        star.x - star.vx * 0.13,
        star.y - star.vy * 0.13
      );
      gradient.addColorStop(0, "rgba(232,255,255,0.85)");
      gradient.addColorStop(1, "rgba(110,226,236,0)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(star.x - star.vx * 0.13, star.y - star.vy * 0.13);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer() {
    if (!player.alive) return;

    const blinking = player.invulnerable > 0 && Math.floor(player.invulnerable * 11) % 2 === 0;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.tilt);
    ctx.globalAlpha = blinking ? 0.4 : 1;

    drawGlow([82, 224, 237], 0, 8, 38, 0.2);

    const flame = 17 + Math.random() * 11;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const flameGradient = ctx.createLinearGradient(0, 15, 0, 34 + flame);
    flameGradient.addColorStop(0, "rgba(223,255,255,0.95)");
    flameGradient.addColorStop(0.35, "rgba(81,231,245,0.75)");
    flameGradient.addColorStop(1, "rgba(38,126,177,0)");
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.moveTo(-7, 17);
    ctx.quadraticCurveTo(-4, 26 + flame * 0.45, 0, 28 + flame);
    ctx.quadraticCurveTo(4, 26 + flame * 0.45, 7, 17);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const hullGradient = ctx.createLinearGradient(0, -31, 0, 27);
    hullGradient.addColorStop(0, "#f4ffff");
    hullGradient.addColorStop(0.28, "#b9f8f7");
    hullGradient.addColorStop(0.66, "#54cbd5");
    hullGradient.addColorStop(1, "#1d718b");

    ctx.beginPath();
    ctx.moveTo(0, -31);
    ctx.bezierCurveTo(5, -20, 8, -8, 10, 3);
    ctx.lineTo(26, 11);
    ctx.lineTo(29, 20);
    ctx.lineTo(12, 16);
    ctx.lineTo(8, 25);
    ctx.lineTo(3, 19);
    ctx.lineTo(-3, 19);
    ctx.lineTo(-8, 25);
    ctx.lineTo(-12, 16);
    ctx.lineTo(-29, 20);
    ctx.lineTo(-26, 11);
    ctx.lineTo(-10, 3);
    ctx.bezierCurveTo(-8, -8, -5, -20, 0, -31);
    ctx.closePath();
    ctx.fillStyle = hullGradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(224,255,255,0.58)";
    ctx.lineWidth = 0.9;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -19);
    ctx.lineTo(6, -5);
    ctx.lineTo(3, 13);
    ctx.lineTo(-3, 13);
    ctx.lineTo(-6, -5);
    ctx.closePath();
    ctx.fillStyle = "rgba(6, 34, 48, 0.46)";
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, -10, 4.1, 8.7, 0, 0, TAU);
    ctx.fillStyle = "rgba(215,255,255,0.92)";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -11, 2.1, 5.2, 0, 0, TAU);
    ctx.fillStyle = "rgba(43, 170, 195, 0.85)";
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 191, 102, 0.9)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-10, 9);
    ctx.lineTo(-23, 14);
    ctx.moveTo(10, 9);
    ctx.lineTo(23, 14);
    ctx.stroke();

    ctx.fillStyle = "rgba(238,255,255,0.82)";
    ctx.fillRect(-7.5, 17, 2.1, 5);
    ctx.fillRect(5.4, 17, 2.1, 5);

    if (player.shield > 0) {
      const pulse = 1 + Math.sin(G.animTime * 7) * 0.035;
      ctx.globalAlpha = 0.56;
      ctx.strokeStyle = "rgba(115, 250, 185, 0.8)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 32 * pulse, 38 * pulse, 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = "rgba(111, 248, 181, 0.5)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 30 * pulse, 36 * pulse, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.32;
      ctx.strokeStyle = "rgba(195, 255, 227, 0.52)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 30, G.animTime * 0.45, 0.5, 2.5);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawScout(enemy) {
    const tilt = Math.sin(enemy.age * 2.25 + enemy.phase) * 0.13;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(tilt);
    drawGlow([255, 91, 88], 0, 3, 25, 0.2);

    ctx.globalCompositeOperation = "lighter";
    const exhaust = 7 + Math.sin(enemy.age * 16) * 2;
    const exhaustGradient = ctx.createLinearGradient(0, -8, 0, -8 - exhaust);
    exhaustGradient.addColorStop(0, "rgba(255,151,91,0.7)");
    exhaustGradient.addColorStop(1, "rgba(255,90,80,0)");
    ctx.fillStyle = exhaustGradient;
    [-7, 7].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x - 2.3, -10);
      ctx.lineTo(x + 2.3, -10);
      ctx.lineTo(x, -10 - exhaust);
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalCompositeOperation = "source-over";

    const gradient = ctx.createLinearGradient(0, -14, 0, 18);
    gradient.addColorStop(0, "#5d2025");
    gradient.addColorStop(0.52, "#b94342");
    gradient.addColorStop(1, "#ff8d66");
    ctx.fillStyle = gradient;
    ctx.strokeStyle = "rgba(255, 190, 168, 0.6)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(-5, 7);
    ctx.lineTo(-17, 2);
    ctx.lineTo(-22, -8);
    ctx.lineTo(-10, -6);
    ctx.lineTo(-6, -13);
    ctx.lineTo(0, -10);
    ctx.lineTo(6, -13);
    ctx.lineTo(10, -6);
    ctx.lineTo(22, -8);
    ctx.lineTo(17, 2);
    ctx.lineTo(5, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.lineTo(-3.5, 3);
    ctx.lineTo(0, -7);
    ctx.lineTo(3.5, 3);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 210, 150, 0.9)";
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 2.5, 2.1, 4.5, 0, 0, TAU);
    ctx.fillStyle = "rgba(79, 255, 238, 0.8)";
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 152, 119, 0.5)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-17, -3);
    ctx.lineTo(-8, 2);
    ctx.moveTo(17, -3);
    ctx.lineTo(8, 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 190, 120, 0.82)";
    ctx.fillRect(-12, -6, 2.5, 3);
    ctx.fillRect(9.5, -6, 2.5, 3);
    ctx.restore();
  }

  function drawStriker(enemy) {
    const tilt = Math.sin(enemy.age * 1.45 + enemy.phase) * 0.16;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(tilt);
    drawGlow([255, 145, 92], 0, 4, 30, 0.18);

    const gradient = ctx.createLinearGradient(0, -22, 0, 22);
    gradient.addColorStop(0, "#43204a");
    gradient.addColorStop(0.5, "#883b57");
    gradient.addColorStop(1, "#f17759");
    ctx.fillStyle = gradient;
    ctx.strokeStyle = "rgba(255, 188, 137, 0.48)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.lineTo(-8, 6);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-23, -11);
    ctx.lineTo(-8, -8);
    ctx.lineTo(0, -17);
    ctx.lineTo(8, -8);
    ctx.lineTo(23, -11);
    ctx.lineTo(20, 0);
    ctx.lineTo(8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 211, 145, 0.9)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.7, 8, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 160, 103, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-16, -5);
    ctx.lineTo(-9, 4);
    ctx.moveTo(16, -5);
    ctx.lineTo(9, 4);
    ctx.stroke();

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255, 102, 84, 0.75)";
    ctx.fillRect(-13, -12, 4, 5);
    ctx.fillRect(9, -12, 4, 5);
    ctx.restore();
  }

  function drawTank(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(Math.sin(enemy.age * 0.83 + enemy.phase) * 0.08);
    drawGlow([255, 180, 79], 0, 4, 46, 0.18);

    const gradient = ctx.createRadialGradient(-7, -9, 2, 0, 0, 30);
    gradient.addColorStop(0, "#8e6840");
    gradient.addColorStop(0.5, "#4b3629");
    gradient.addColorStop(1, "#211820");
    ctx.fillStyle = gradient;
    ctx.strokeStyle = "rgba(255, 198, 124, 0.42)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(17, -18);
    ctx.lineTo(27, -2);
    ctx.lineTo(20, 18);
    ctx.lineTo(6, 27);
    ctx.lineTo(-10, 24);
    ctx.lineTo(-25, 12);
    ctx.lineTo(-26, -8);
    ctx.lineTo(-14, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 194, 111, 0.19)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 1, 17, 0, TAU);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 173, 78, 0.8)";
    ctx.beginPath();
    ctx.arc(0, 3, 6.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(50, 27, 20, 0.86)";
    ctx.beginPath();
    ctx.arc(0, 3, 3.1, 0, TAU);
    ctx.fill();

    [-18, 18].forEach((x) => {
      ctx.fillStyle = "rgba(255, 205, 130, 0.65)";
      ctx.fillRect(x - 2, -13, 4, 10);
    });

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255, 151, 69, 0.34)";
    ctx.beginPath();
    ctx.arc(0, 3, 16 + Math.sin(enemy.age * 4) * 1.6, 0, TAU);
    ctx.fill();
    ctx.restore();

    const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
    if (ratio < 1) {
      const width = 44;
      ctx.fillStyle = "rgba(10, 15, 20, 0.7)";
      ctx.fillRect(enemy.x - width / 2, enemy.y - 38, width, 2.5);
      ctx.fillStyle = "rgba(255, 194, 102, 0.85)";
      ctx.fillRect(enemy.x - width / 2, enemy.y - 38, width * ratio, 2.5);
    }
  }

  function drawBoss(boss) {
    const corePulse = 0.5 + Math.sin(boss.age * 5.2) * 0.12;
    const enraged = boss.enraged;
    const accent = enraged ? [255, 103, 103] : [235, 108, 142];

    ctx.save();
    ctx.translate(boss.x, boss.y);

    drawGlow(accent, 0, 4, 132, 0.32);
    drawGlow([255, 174, 96], 0, 16, 56, corePulse);

    const traceHull = () => {
      ctx.beginPath();
      ctx.moveTo(0, 78);
      ctx.lineTo(-13, 49);
      ctx.lineTo(-39, 44);
      ctx.lineTo(-54, 25);
      ctx.lineTo(-98, 18);
      ctx.lineTo(-92, 4);
      ctx.lineTo(-74, -6);
      ctx.lineTo(-82, -33);
      ctx.lineTo(-42, -26);
      ctx.lineTo(-29, -49);
      ctx.lineTo(-10, -43);
      ctx.lineTo(0, -56);
      ctx.lineTo(10, -43);
      ctx.lineTo(29, -49);
      ctx.lineTo(42, -26);
      ctx.lineTo(82, -33);
      ctx.lineTo(74, -6);
      ctx.lineTo(92, 4);
      ctx.lineTo(98, 18);
      ctx.lineTo(54, 25);
      ctx.lineTo(39, 44);
      ctx.lineTo(13, 49);
      ctx.closePath();
    };

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    [-18, 18].forEach((offset) => {
      const exhaust = 22 + Math.sin(boss.age * 13 + offset) * 5;
      const flame = ctx.createLinearGradient(0, -45, 0, -45 - exhaust);
      flame.addColorStop(0, enraged ? "rgba(255,143,107,0.66)" : "rgba(128,218,238,0.52)");
      flame.addColorStop(1, "rgba(84,82,156,0)");
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.moveTo(offset - 5, -44);
      ctx.lineTo(offset + 5, -44);
      ctx.lineTo(offset, -44 - exhaust);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    const outer = ctx.createLinearGradient(0, -56, 0, 78);
    outer.addColorStop(0, "#26364c");
    outer.addColorStop(0.34, "#1b2537");
    outer.addColorStop(0.7, enraged ? "#3f202a" : "#2b2338");
    outer.addColorStop(1, "#0c111a");
    ctx.fillStyle = outer;
    ctx.strokeStyle = enraged ? "rgba(255, 151, 133, 0.66)" : "rgba(190, 181, 211, 0.5)";
    ctx.lineWidth = 1.4;
    traceHull();
    ctx.fill();
    ctx.stroke();

    [-1, 1].forEach((side) => {
      ctx.save();
      ctx.scale(side, 1);

      const wing = ctx.createLinearGradient(-94, -10, -20, 30);
      wing.addColorStop(0, enraged ? "rgba(96, 42, 48, 0.95)" : "rgba(52, 48, 74, 0.96)");
      wing.addColorStop(1, "rgba(18, 28, 40, 0.96)");
      ctx.fillStyle = wing;
      ctx.strokeStyle = enraged ? "rgba(255, 147, 125, 0.3)" : "rgba(140, 205, 220, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-23, 32);
      ctx.lineTo(-49, 34);
      ctx.lineTo(-92, 17);
      ctx.lineTo(-84, 3);
      ctx.lineTo(-58, -8);
      ctx.lineTo(-26, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(9, 15, 23, 0.58)";
      ctx.beginPath();
      ctx.moveTo(-44, 4);
      ctx.lineTo(-64, -3);
      ctx.lineTo(-82, 8);
      ctx.lineTo(-56, 21);
      ctx.lineTo(-36, 17);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = enraged ? "rgba(255, 110, 100, 0.4)" : "rgba(117, 200, 218, 0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-31, 27);
      ctx.lineTo(-48, 18);
      ctx.lineTo(-77, 10);
      ctx.moveTo(-70, -2);
      ctx.lineTo(-58, 6);
      ctx.stroke();

      ctx.fillStyle = enraged ? "rgba(255, 112, 94, 0.75)" : "rgba(126, 217, 232, 0.58)";
      ctx.fillRect(-81, 1, 6, 11);
      ctx.fillStyle = "rgba(255, 208, 140, 0.66)";
      ctx.fillRect(-58, -4, 3, 8);
      ctx.restore();
    });

    const hull = ctx.createLinearGradient(0, -48, 0, 77);
    hull.addColorStop(0, "#38506b");
    hull.addColorStop(0.4, enraged ? "#462a36" : "#26384d");
    hull.addColorStop(1, "#121b28");
    ctx.fillStyle = hull;
    ctx.strokeStyle = enraged ? "rgba(255, 165, 137, 0.58)" : "rgba(143, 226, 237, 0.48)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 77);
    ctx.lineTo(-18, 38);
    ctx.lineTo(-26, -2);
    ctx.lineTo(-18, -30);
    ctx.lineTo(-10, -48);
    ctx.lineTo(10, -48);
    ctx.lineTo(18, -30);
    ctx.lineTo(26, -2);
    ctx.lineTo(18, 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(176, 245, 248, 0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 66);
    ctx.lineTo(0, 30);
    ctx.moveTo(-19, 25);
    ctx.lineTo(-11, 5);
    ctx.lineTo(-16, -20);
    ctx.moveTo(19, 25);
    ctx.lineTo(11, 5);
    ctx.lineTo(16, -20);
    ctx.stroke();

    [-1, 1].forEach((side) => {
      ctx.save();
      ctx.translate(side * 18, -41);
      ctx.fillStyle = "rgba(7, 12, 19, 0.9)";
      ctx.strokeStyle = "rgba(158, 218, 229, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(-7, -8, 14, 15);
      ctx.fill();
      ctx.stroke();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = enraged ? "rgba(255, 127, 94, 0.7)" : "rgba(103, 220, 235, 0.7)";
      ctx.fillRect(-4, -6, 8, 3);
      ctx.restore();
    });

    [-66, 66].forEach((side, index) => {
      drawGlow(accent, side, 6, 30, 0.2);
      ctx.save();
      ctx.translate(side, 6);
      ctx.fillStyle = "rgba(9, 15, 22, 0.95)";
      ctx.strokeStyle = enraged ? "rgba(255, 151, 125, 0.54)" : "rgba(155, 215, 227, 0.34)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, TAU);
      ctx.stroke();
      const aim = Math.atan2(player.y - (boss.y + 6), player.x - (boss.x + side));
      ctx.rotate(aim);
      ctx.fillStyle = enraged ? "#ff936d" : "#8ce0e6";
      ctx.fillRect(8, -3.5, 23, 7);
      ctx.fillStyle = "rgba(0,0,0,0.62)";
      ctx.fillRect(20, -1.7, 12, 3.4);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = index === 0 ? "rgba(255, 99, 118, 0.7)" : "rgba(112, 224, 239, 0.65)";
      ctx.beginPath();
      ctx.arc(side, 6, 4.5 + Math.sin(boss.age * 4 + index) * 0.8, 0, TAU);
      ctx.fill();
      ctx.restore();
    });

    const coreGradient = ctx.createRadialGradient(0, 17, 1, 0, 17, 30);
    coreGradient.addColorStop(0, "rgba(255,255,236,0.98)");
    coreGradient.addColorStop(0.17, enraged ? "rgba(255,152,106,0.95)" : "rgba(255,214,153,0.9)");
    coreGradient.addColorStop(0.48, enraged ? "rgba(255,62,81,0.8)" : "rgba(242,97,127,0.58)");
    coreGradient.addColorStop(1, "rgba(213,73,102,0)");
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 17, 31, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = enraged ? "rgba(255, 185, 144, 0.66)" : "rgba(171, 242, 245, 0.4)";
    ctx.lineWidth = 1.1;
    ctx.setLineDash([4, 8]);
    ctx.lineDashOffset = -boss.age * 25;
    ctx.beginPath();
    ctx.arc(0, 17, 23, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 17, 36, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 4; i += 1) {
      const angle = (i / 4) * TAU + boss.age * 0.4;
      const x = Math.cos(angle) * 26;
      const y = Math.sin(angle) * 21 + 17;
      ctx.fillStyle = enraged ? "rgba(255,120,99,0.58)" : "rgba(253,183,125,0.46)";
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, TAU);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    if (boss.hitFlash > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#ffffff";
      traceHull();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawEnemy(enemy) {
    if (enemy.isBoss) {
      drawBoss(enemy);
      return;
    }

    if (enemy.type === "scout") {
      drawScout(enemy);
    } else if (enemy.type === "striker") {
      drawStriker(enemy);
    } else {
      drawTank(enemy);
    }

    if (enemy.hitFlash > 0 && !enemy.isBoss) {
      drawGlow([255, 255, 255], enemy.x, enemy.y, enemy.radius * 1.25, 0.2);
    }
  }

  function drawPlayerBullets() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const bullet of G.playerBullets) {
      const angle = Math.atan2(bullet.vy, bullet.vx) + Math.PI / 2;
      drawGlow([107, 237, 246], bullet.x, bullet.y, bullet.radius * 4.2, 0.34);
      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      ctx.rotate(angle);
      ctx.fillStyle = bullet.radius > 4 ? "rgba(255, 225, 159, 0.8)" : "rgba(169, 255, 255, 0.72)";
      ctx.beginPath();
      ctx.moveTo(0, -bullet.radius * 3.6);
      ctx.quadraticCurveTo(bullet.radius * 1.05, -bullet.radius * 0.4, bullet.radius * 0.55, bullet.radius * 1.9);
      ctx.lineTo(-bullet.radius * 0.55, bullet.radius * 1.9);
      ctx.quadraticCurveTo(-bullet.radius * 1.05, -bullet.radius * 0.4, 0, -bullet.radius * 3.6);
      ctx.fill();
      ctx.fillStyle = "#f5ffff";
      ctx.beginPath();
      ctx.ellipse(0, -bullet.radius * 0.8, bullet.radius * 0.23, bullet.radius * 1.3, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawEnemyBullets() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const bullet of G.enemyBullets) {
      const rgb = bullet.rgb;
      drawGlow(rgb, bullet.x, bullet.y, bullet.radius * 3.6, 0.3);
      ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.42)`;
      ctx.lineWidth = bullet.radius * 0.8;
      ctx.beginPath();
      ctx.moveTo(bullet.x, bullet.y);
      ctx.lineTo(bullet.x - bullet.vx * 0.035, bullet.y - bullet.vy * 0.035);
      ctx.stroke();
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.94)`;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 250, 236, 0.9)";
      ctx.beginPath();
      ctx.arc(bullet.x - bullet.radius * 0.16, bullet.y - bullet.radius * 0.16, bullet.radius * 0.42, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPickup(powerup) {
    const style = POWERUP_STYLES[powerup.kind];
    const bob = Math.sin(powerup.age * 2.8) * 3;
    const scale = 1 + Math.sin(powerup.age * 3.2) * 0.035;
    ctx.save();
    ctx.translate(powerup.x, powerup.y + bob);
    ctx.scale(scale, scale);
    drawGlow(style.rgb, 0, 0, 33, 0.3);

    ctx.save();
    ctx.rotate(powerup.age * 0.75);
    ctx.strokeStyle = `rgba(${style.rgb[0]},${style.rgb[1]},${style.rgb[2]},0.5)`;
    ctx.lineWidth = 0.9;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "rgba(4, 18, 27, 0.86)";
    ctx.strokeStyle = `rgba(${style.rgb[0]},${style.rgb[1]},${style.rgb[2]},0.9)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.rect(-10, -10, 20, 20);
    ctx.fill();
    ctx.stroke();
    ctx.rotate(-Math.PI / 4);

    ctx.strokeStyle = "rgba(240,255,255,0.95)";
    ctx.fillStyle = "rgba(240,255,255,0.95)";
    ctx.lineWidth = 1.5;
    if (powerup.kind === "power") {
      ctx.beginPath();
      ctx.moveTo(-5, 2);
      ctx.lineTo(0, -4);
      ctx.lineTo(5, 2);
      ctx.moveTo(-5, 7);
      ctx.lineTo(0, 1);
      ctx.lineTo(5, 7);
      ctx.stroke();
    } else if (powerup.kind === "shield") {
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(6, -4);
      ctx.lineTo(5, 4);
      ctx.quadraticCurveTo(3, 8, 0, 9);
      ctx.quadraticCurveTo(-3, 8, -5, 4);
      ctx.lineTo(-6, -4);
      ctx.closePath();
      ctx.stroke();
    } else if (powerup.kind === "bomb") {
      ctx.beginPath();
      ctx.arc(0, 1, 4.5, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(0, -3);
      ctx.moveTo(-7, 1);
      ctx.lineTo(-3, 1);
      ctx.moveTo(7, 1);
      ctx.lineTo(3, 1);
      ctx.stroke();
    } else {
      ctx.fillRect(-1.5, -7, 3, 14);
      ctx.fillRect(-7, -1.5, 14, 3);
    }

    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const particle of G.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      const rgb = particle.rgb;
      if (particle.type === "engine") {
        ctx.globalAlpha = alpha * 0.45;
        const sprite = makeGlowSprite(rgb);
        ctx.drawImage(
          sprite,
          particle.x - particle.size,
          particle.y - particle.size,
          particle.size * 2,
          particle.size * 2
        );
      } else if (particle.type === "smoke") {
        ctx.globalAlpha = alpha * 0.2;
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.8)`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (1.8 - alpha * 0.5), 0, TAU);
        ctx.fill();
      } else {
        ctx.globalAlpha = alpha * 0.9;
        ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.9)`;
        ctx.lineWidth = Math.max(0.5, particle.size * alpha);
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(
          particle.x - particle.vx * 0.025,
          particle.y - particle.vy * 0.025
        );
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawRings() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const ring of G.rings) {
      const progress = 1 - ring.life / ring.maxLife;
      const eased = 1 - Math.pow(1 - progress, 3);
      const radius = lerp(ring.innerRadius, ring.outerRadius, eased);
      const alpha = (1 - progress) * 0.72;
      const rgb = ring.rgb;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.9)`;
      ctx.lineWidth = ring.width * (1 - progress * 0.5);
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, radius, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloaters() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const floater of G.floaters) {
      const alpha = clamp(floater.life / floater.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.font = `700 ${floater.size}px Bahnschrift, "Segoe UI", sans-serif`;
      ctx.fillStyle = floater.color;
      ctx.fillText(floater.text, floater.x, floater.y);
    }
    ctx.restore();
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

    if (backdrop) {
      ctx.drawImage(backdrop, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    } else {
      ctx.fillStyle = "#030913";
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }

    const speedFactor =
      G.state === "playing"
        ? 1.15
        : G.state === "dying"
          ? 0.35
          : G.state === "paused"
            ? 0
            : G.state === "menu"
              ? 0.35
              : 0.18;

    ctx.save();
    const shakeX = (Math.random() * 2 - 1) * G.shake;
    const shakeY = (Math.random() * 2 - 1) * G.shake;
    ctx.translate(shakeX, shakeY);
    drawStars(speedFactor);

    if (G.state !== "menu") {
      drawRings();
      for (const powerup of G.powerups) drawPickup(powerup);
      drawEnemyBullets();
      for (const enemy of G.enemies) drawEnemy(enemy);
      drawPlayerBullets();
      if (G.state === "playing" || G.state === "paused") drawPlayer();
      drawParticles();
      drawFloaters();
    }

    ctx.restore();

    if (G.flash > 0) {
      const [r, g, b] = G.flashColor;
      ctx.fillStyle = `rgba(${r},${g},${b},${clamp(G.flash, 0, 0.7)})`;
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }

    if (player.shield > 0 && G.state === "playing" && player.shield < 2) {
      ctx.save();
      ctx.globalAlpha = 0.26 + Math.sin(G.animTime * 15) * 0.15;
      ctx.strokeStyle = "rgba(108, 250, 176, 0.7)";
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, WORLD_WIDTH - 4, WORLD_HEIGHT - 4);
      ctx.restore();
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Input                                                                  */
  /* ---------------------------------------------------------------------- */

  const movementCodes = new Set([
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD"
  ]);

  function onKeyDown(event) {
    if (movementCodes.has(event.code)) {
      event.preventDefault();
      keys[event.code] = true;
      pointer.hasTarget = false;
      return;
    }

    if (event.repeat) return;

    if (event.code === "Escape" || event.code === "KeyP") {
      event.preventDefault();
      if (G.state === "playing") pauseGame();
      else if (G.state === "paused") resumeGame();
      return;
    }

    if (event.code === "Enter" || event.code === "Space") {
      if (G.state === "menu" || G.state === "gameover") {
        event.preventDefault();
        startGame();
      } else if (G.state === "paused") {
        event.preventDefault();
        resumeGame();
      }
      return;
    }

    if (event.code === "KeyX" || event.code === "KeyB") {
      if (G.state === "playing") {
        event.preventDefault();
        useBomb();
      }
      return;
    }

    if (event.code === "KeyR" && G.state === "gameover") {
      event.preventDefault();
      startGame();
      return;
    }

    if (event.code === "KeyM") {
      event.preventDefault();
      toggleSound();
    }
  }

  function onKeyUp(event) {
    if (movementCodes.has(event.code)) {
      event.preventDefault();
      delete keys[event.code];
    }
  }

  function onPointerDown(event) {
    if (G.state !== "playing") return;
    if (pointer.active) return;
    event.preventDefault();
    pointer.active = true;
    pointer.id = event.pointerId;
    pointer.startX = event.clientX;
    pointer.startY = event.clientY;
    pointer.shipX = player.x;
    pointer.shipY = player.y;
    pointer.targetX = player.x;
    pointer.targetY = player.y;
    if (canvas.setPointerCapture) {
      canvas.setPointerCapture(event.pointerId);
    }
  }

  function onPointerMove(event) {
    if (!pointer.active || event.pointerId !== pointer.id || G.state !== "playing") return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const factor = event.pointerType === "touch" ? 1.28 : 1.06;
    const deltaX = ((event.clientX - pointer.startX) / rect.width) * WORLD_WIDTH * factor;
    const deltaY = ((event.clientY - pointer.startY) / rect.height) * WORLD_HEIGHT * factor;
    pointer.targetX = clamp(pointer.shipX + deltaX, 24, WORLD_WIDTH - 24);
    pointer.targetY = clamp(pointer.shipY + deltaY, 64, WORLD_HEIGHT - 46);
    pointer.hasTarget = true;
    pointer.startX = event.clientX;
    pointer.startY = event.clientY;
    pointer.shipX = pointer.targetX;
    pointer.shipY = pointer.targetY;
  }

  function onPointerUp(event) {
    if (event.pointerId !== pointer.id) return;
    pointer.active = false;
    pointer.id = null;
    if (canvas.releasePointerCapture) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // The browser may already have released the pointer.
      }
    }
  }

  function bindEvents() {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", () => {
      clearKeys();
      if (G.state === "playing") pauseGame();
    });
    document.addEventListener("visibilitychange", () => {
      clearKeys();
      if (document.hidden && G.state === "playing") pauseGame();
    });
    window.addEventListener("beforeunload", commitBest);
    window.addEventListener("resize", queueResize);
    window.addEventListener("orientationchange", () => window.setTimeout(queueResize, 120));

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(queueResize);
      observer.observe(stage);
    }

    ui.startBtn.addEventListener("click", startGame);
    ui.restartBtn.addEventListener("click", startGame);
    ui.resumeBtn.addEventListener("click", resumeGame);
    ui.quitBtn.addEventListener("click", quitToMenu);
    ui.menuBtn.addEventListener("click", quitToMenu);
    ui.pauseBtn.addEventListener("click", pauseGame);
    ui.bombBtn.addEventListener("click", useBomb);
    ui.soundBtn.addEventListener("click", toggleSound);
    ui.menuSoundBtn.addEventListener("click", toggleSound);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("lostpointercapture", onPointerUp);
    stage.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  /* ---------------------------------------------------------------------- */
  /* Boot                                                                   */
  /* ---------------------------------------------------------------------- */

  function boot() {
    const storedBest = Number.parseInt(storedValue(STORAGE_BEST, "0"), 10);
    G.best = Number.isFinite(storedBest) && storedBest > 0 ? storedBest : 0;
    player.y = WORLD_HEIGHT - 140;

    setScreen(ui.startScreen, true);
    setScreen(ui.pauseScreen, false);
    setScreen(ui.gameoverScreen, false);
    setHudActive(false);
    syncSoundButtons();
    ui.menuBest.textContent = formatScore(G.best);
    ui.best.textContent = formatScore(G.best);
    ui.finalBest.textContent = formatScore(G.best);

    bindEvents();
    resize();
    forceHudSync();
    requestAnimationFrame(tick);
  }

  boot();

  // Temporary development harness, only available with ?debug=1.
  if (new URLSearchParams(window.location.search).has("debug")) {
    window.__thunderDebug = {
      G,
      player,
      startGame,
      spawnBoss,
      useBomb,
      spawnExplosion,
      collectPowerup,
      spawnPowerup,
      spawnEnemy,
      hitPlayer,
      setInvincible(value = 9999) {
        player.invulnerable = value;
      },
      killAllEnemies() {
        [...G.enemies].forEach((enemy) => {
          if (!enemy.dead) damageEnemy(enemy, 99999, enemy.x, enemy.y, true);
        });
      },
      damageBoss(amount) {
        if (G.boss) damageEnemy(G.boss, amount, G.boss.x, G.boss.y, true);
      }
    };
  }
})();
