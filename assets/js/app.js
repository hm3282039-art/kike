/*!
 * Color Dice 1v1 — Dice Duels (interface style BloxyPet)
 * HTML + Tailwind + JavaScript vanilla.
 *
 * Règles :
 *  - 6 couleurs. Le joueur en choisit 2, l'adversaire 2 autres, 2 restent neutres.
 *  - 4 dés sont tirés : on compare les dés du joueur à ceux de l'adversaire.
 *  - Égalité → le tirage se relance automatiquement.
 *  - Le vainqueur rafle le pot (mises des deux joueurs, l'adversaire mise ±5 %).
 */
(() => {
  "use strict";

  /* ============================================================
     Utilitaires
     ============================================================ */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fmt = (n) => Math.round(n).toLocaleString("fr-FR").replace(/\u202f/g, " ");
  const fmtShort = (n) => {
    if (n >= 1e9) return (n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 2).replace(".", ",") + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1).replace(".", ",") + "M";
    if (n >= 1e4) return (n / 1e3).toFixed(n % 1e3 === 0 ? 0 : 1).replace(".", ",") + "k";
    return fmt(n);
  };
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hex = (n) => Math.round(n).toString(16).padStart(2, "0");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STORAGE_KEY = "bloxypet.colordice.save.v1";
  const MIN_BET = 100;
  const MAX_BET = 1000000;

  /* ============================================================
     Données
     ============================================================ */
  const COLORS = [
    { id: "red", name: "Rouge", short: "R", hex: "#ef4444", dark: "#b91c1c" },
    { id: "blue", name: "Bleu", short: "B", hex: "#38bdf8", dark: "#0c74b8" },
    { id: "green", name: "Vert", short: "V", hex: "#4ade80", dark: "#15803d" },
    { id: "yellow", name: "Jaune", short: "J", hex: "#fbbf24", dark: "#b45309" },
    { id: "purple", name: "Violet", short: "P", hex: "#a855f7", dark: "#6b21a8" },
    { id: "orange", name: "Orange", short: "O", hex: "#fb923c", dark: "#c2410c" },
  ];
  const COLOR_BY_ID = Object.fromEntries(COLORS.map((c) => [c.id, c]));
  const REVEAL_VALUES = [1, 5, 3, 2];

  const BANNERS = [
    { id: "nebula", name: "Nébuleuse", rarity: "epic", cls: "banner-nebula", price: 0 },
    { id: "aurora", name: "Aurore", rarity: "rare", cls: "banner-aurora", price: 2400 },
    { id: "lava", name: "Lave", rarity: "epic", cls: "banner-lava", price: 4800 },
    { id: "ice", name: "Glacier", rarity: "rare", cls: "banner-ice", price: 3200 },
    { id: "galaxy", name: "Galaxie", rarity: "legendary", cls: "banner-galaxy", price: 12000 },
    { id: "gold", name: "Doré", rarity: "legendary", cls: "banner-gold", price: 15000 },
    { id: "toxic", name: "Toxique", rarity: "rare", cls: "banner-toxic", price: 2800 },
    { id: "sakura", name: "Sakura", rarity: "epic", cls: "banner-sakura", price: 5600 },
    { id: "void", name: "Néant", rarity: "mythic", cls: "banner-void", price: 24000 },
    { id: "rainbow", name: "Arc-en-ciel", rarity: "mythic", cls: "banner-rainbow", price: 32000 },
  ];

  const FRAMES = [
    { id: "epic", name: "Cadre Épique", rarity: "epic", cls: "frame--epic", price: 0 },
    { id: "rare", name: "Cadre Cristal", rarity: "rare", cls: "frame--rare", price: 2200 },
    { id: "toxic", name: "Cadre Toxique", rarity: "rare", cls: "frame--toxic", price: 2600 },
    { id: "hostile", name: "Cadre Rival", rarity: "epic", cls: "frame--hostile", price: 4200 },
    { id: "holo", name: "Cadre Holographique", rarity: "epic", cls: "frame--holo", price: 6400 },
    { id: "legendary", name: "Cadre Légendaire", rarity: "legendary", cls: "frame--legendary", price: 14000 },
    { id: "mythic", name: "Cadre Mythique", rarity: "mythic", cls: "frame--mythic", price: 28000 },
  ];

  const TITLES = [
    { id: "dice-master", name: "Dice Master", rarity: "mythic", price: 0 },
    { id: "rookie", name: "Petit Chanceux", rarity: "common", price: 0 },
    { id: "neon", name: "Enfant du Néon", rarity: "rare", price: 1800 },
    { id: "golden", name: "Chasseur d'Or", rarity: "epic", price: 4200 },
    { id: "streak", name: "Série Imparable", rarity: "epic", price: 5200 },
    { id: "legend", name: "Légende Vivante", rarity: "legendary", price: 11000 },
    { id: "apex", name: "Apex Predator", rarity: "legendary", price: 16000 },
    { id: "void", name: "Souverain du Vide", rarity: "mythic", price: 30000 },
  ];

  const SKINS = [
    { id: "neon", name: "Néon Pulse", swatch: "skin-neon", rarity: "epic", price: 0 },
    { id: "ice", name: "Givre Polaire", swatch: "skin-ice", rarity: "rare", price: 2000 },
    { id: "gold", name: "Or Massif", swatch: "skin-gold", rarity: "legendary", price: 9000 },
    { id: "toxic", name: "Slime Acide", swatch: "skin-toxic", rarity: "rare", price: 2400 },
    { id: "sakura", name: "Pétale Rose", swatch: "skin-sakura", rarity: "epic", price: 5400 },
    { id: "galaxy", name: "Poussière d'Étoiles", swatch: "skin-galaxy", rarity: "legendary", price: 13000 },
    { id: "void", name: "Néant Absolu", swatch: "skin-void", rarity: "mythic", price: 26000 },
  ];

  const CATALOG = { banners: BANNERS, frames: FRAMES, titles: TITLES, skins: SKINS };
  const RARITY_LABEL = { common: "Commun", rare: "Rare", epic: "Épique", legendary: "Légendaire", mythic: "Mythique" };
  const TITLE_CLASS = { common: "", rare: "title-chip--rare", epic: "", legendary: "title-chip--legendary", mythic: "title-chip--mythic" };
  const byId = (list, id) => list.find((x) => x.id === id) || list[0];

  const BOT_NAMES = [
    "AuroraBytes", "PixelPhantom", "GloomRider", "KiwiCyclone", "SherbetSaint",
    "VoltVixen", "MoonMuffin", "ToxicTaco", "NimbusNine", "CrimsonComet",
    "StaticSage", "JellyJester", "FrostFang", "BlazeBishop", "CyberSorbet",
    "MangoMeteor", "QuasarQuinn", "VelvetVenom", "EchoEmber", "LunarLumen",
    "PrismPirate", "TurboTofu", "WaffleWarden", "ZephyrZulu", "NeonNoodle",
    "PS99player213", "sussielover81", "jamiltikr", "Rigger27228",
  ];

  const CHAT_LINES = [
    "i'd scouted my wrist and had a good 1v1",
    "Are we fr fr grow a garden pls",
    "bro sorry i only have that image on my pc :(",
    "i had to get 3 surgery i air had 2 i get one more",
    "Whats the record from lo... 40m to 150b what i did",
    "wen i turned 1b into 200b",
    "GG @{name}, that pot was insane",
    "x10 gold is calling, who's in?",
    "my frame is cleaner than yours, admit it",
    "2 draws in a row, this game hates me",
    "violet + yellow is the underrated combo",
    "just won a 1v1 with 4 dice on my colors 🎲",
  ];

  /* ============================================================
     État
     ============================================================ */
  const DEFAULT_STATE = () => ({
    gems: 146000000,
    player: {
      name: "KIR_ASTRAL",
      banner: "nebula",
      frame: "epic",
      title: "dice-master",
      skin: "neon",
      level: 42,
      xp: 34120,
    },
    owned: {
      banners: ["nebula", "aurora"],
      frames: ["epic", "rare"],
      titles: ["dice-master", "rookie"],
      skins: ["neon"],
    },
    bet: 1000,
    pick: ["red", "blue"],
    history: [],
    lastDuel: null,
    stats: { played: 0, wins: 0, losses: 0, streak: 0, bestPot: 0, wagered: 0 },
    round: 0,
    view: "create",
    sound: true,
  });

  let state;
  let opponent = null;
  let oppPick = null;
  let oppBet = 1000;
  let busy = false;
  let phase = "idle"; // idle | rolling | resolving
  let lobby = [];

  const PERSISTED = ["gems", "player", "owned", "bet", "pick", "history", "lastDuel", "stats", "round", "view", "sound"];

  function save() {
    try {
      const data = {};
      PERSISTED.forEach((k) => { data[k] = state[k]; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* stockage indisponible */ }
  }

  function load() {
    const base = DEFAULT_STATE();
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { raw = null; }
    if (!raw || typeof raw !== "object") return base;
    const merged = {
      ...base,
      ...raw,
      player: { ...base.player, ...(raw.player || {}) },
      owned: { ...base.owned, ...(raw.owned || {}) },
      stats: { ...base.stats, ...(raw.stats || {}) },
    };
    ["banners", "frames", "titles", "skins"].forEach((k) => {
      if (!Array.isArray(merged.owned[k]) || !merged.owned[k].length) merged.owned[k] = base.owned[k];
      merged.owned[k] = merged.owned[k].filter((id) => CATALOG[k].some((i) => i.id === id));
      if (!merged.owned[k].length) merged.owned[k] = base.owned[k];
    });
    [["banner", "banners"], ["frame", "frames"], ["title", "titles"], ["skin", "skins"]].forEach(([key, cat]) => {
      const id = merged.player[key];
      if (!CATALOG[cat].some((i) => i.id === id)) merged.player[key] = base.player[key];
      else if (!merged.owned[cat].includes(id)) merged.owned[cat].push(id);
    });
    if (!Number.isFinite(merged.gems) || merged.gems < 0) merged.gems = base.gems;
    if (!Array.isArray(merged.pick)) merged.pick = base.pick;
    merged.pick = [...new Set(merged.pick.filter((id) => COLOR_BY_ID[id]))].slice(0, 2);
    if (!merged.pick.length) merged.pick = base.pick;
    if (!Array.isArray(merged.history)) merged.history = [];
    merged.history = merged.history.filter((h) => h && h.outcome).slice(0, 30);
    merged.bet = clamp(Number(merged.bet) || base.bet, MIN_BET, MAX_BET);
    if (merged.view !== "history") merged.view = "create";
    if (merged.sound === undefined) merged.sound = true;
    return merged;
  }

  /* ============================================================
     Avatars procéduraux
     ============================================================ */
  const AVATAR_PALETTES = [
    ["#7c3aed", "#1e1b4b", "#a78bfa"],
    ["#b45309", "#451a03", "#fbbf24"],
    ["#0369a1", "#082f49", "#7dd3fc"],
    ["#15803d", "#052e16", "#86efac"],
    ["#9d174d", "#500724", "#f9a8d4"],
    ["#4c1d95", "#0b0614", "#c4b5fd"],
    ["#0f766e", "#042f2e", "#5eead4"],
    ["#b91c1c", "#450a0a", "#fca5a5"],
    ["#4338ca", "#1e1b4b", "#a5b4fc"],
    ["#a21caf", "#4a044e", "#f0abfc"],
  ];
  const AVATAR_CACHE = new Map();

  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function avatarSVG(seed) {
    const key = String(seed);
    if (AVATAR_CACHE.has(key)) return AVATAR_CACHE.get(key);
    const h = hashStr(key);
    const [bg, dark, light] = AVATAR_PALETTES[h % AVATAR_PALETTES.length];
    const hat = (h >> 7) % 4;
    const eyes = (h >> 11) % 3;

    const eyeMarkup = [
      `<rect x="25" y="32" width="6" height="8" rx="2" fill="#101012"/><rect x="41" y="32" width="6" height="8" rx="2" fill="#101012"/>`,
      `<rect x="24" y="31" width="7" height="9" rx="2.4" fill="#101012"/><rect x="41" y="31" width="7" height="9" rx="2.4" fill="#101012"/><rect x="25.8" y="32.4" width="3" height="3" rx="1" fill="#fff" opacity=".85"/><rect x="42.8" y="32.4" width="3" height="3" rx="1" fill="#fff" opacity=".85"/>`,
      `<path d="M24 34h8M40 34h8" stroke="#101012" stroke-width="3.4" stroke-linecap="round"/>`,
    ][eyes];

    const hats = [
      `<rect x="18" y="12" width="36" height="6" rx="3" fill="${dark}"/><rect x="24" y="4" width="24" height="10" rx="4" fill="${bg}"/>`,
      `<path d="M16 20c1-9 8-13 20-13s19 4 20 13z" fill="${bg}"/><rect x="32" y="1" width="8" height="11" rx="4" fill="${light}"/>`,
      `<path d="M24 2l12 9 12-9-2 14H26z" fill="${bg}"/>`,
      ``,
    ][hat];

    const svg = `
      <svg class="avatar-svg" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="ab${h}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${light}" stop-opacity=".45"/>
            <stop offset="1" stop-color="${dark}"/>
          </linearGradient>
          <linearGradient id="af${h}" x1=".2" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${light}"/>
            <stop offset="1" stop-color="${bg}"/>
          </linearGradient>
        </defs>
        <rect width="72" height="72" fill="${dark}"/>
        <rect width="72" height="72" fill="url(#ab${h})"/>
        <rect x="22" y="52" width="28" height="22" rx="8" fill="${bg}"/>
        <rect x="16" y="24" width="40" height="32" rx="11" fill="url(#af${h})" stroke="rgba(255,255,255,.28)"/>
        <rect x="16" y="24" width="40" height="9" rx="4.5" fill="#fff" opacity=".14"/>
        ${eyeMarkup}
        <rect x="31" y="45" width="10" height="3" rx="1.5" fill="#101012" opacity=".4"/>
        ${hats}
      </svg>`;
    AVATAR_CACHE.set(key, svg);
    return svg;
  }

  function paintAvatar(el, seed) {
    if (!el) return;
    const key = String(seed);
    if (el.dataset.painted === key) return;
    el.innerHTML = avatarSVG(key);
    el.dataset.painted = key;
  }

  function hydrateAvatars(root = document) {
    $$("[data-avatar]", root).forEach((el) => paintAvatar(el, el.getAttribute("data-avatar")));
  }

  const bannerCls = (id) => byId(BANNERS, id).cls;
  const frameCls = (id) => byId(FRAMES, id).cls;
  const titleOf = (id) => byId(TITLES, id);

  function miniBannerHTML(banner, frame, seed, size = 38) {
    return `<span class="banner ${bannerCls(banner)} flex items-center justify-center overflow-hidden rounded-md border border-[#2e2e35]" style="width:${size + 8}px;height:${size}px">
      <span class="frame ${frameCls(frame)}" style="width:${size - 10}px;height:${size - 10}px">
        <span class="frame-ring"></span>
        <span class="frame-avatar" data-avatar="${escapeHTML(seed)}"></span>
      </span>
    </span>`;
  }

  /* ============================================================
     Son
     ============================================================ */
  const Sound = {
    ctx: null,
    enabled: true,
    ensure() {
      if (!this.enabled) return null;
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { this.ctx = new AC(); } catch { return null; }
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    tone(freq, dur = 0.12, type = "sine", gain = 0.1, delay = 0) {
      const ctx = this.ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    },
    noise(dur = 0.16, gain = 0.05, delay = 0) {
      const ctx = this.ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime + delay;
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1500;
      const g = ctx.createGain();
      g.gain.value = gain;
      src.connect(filter).connect(g).connect(ctx.destination);
      src.start(t0);
    },
    click() { this.tone(420, 0.05, "square", 0.03); },
    toggle() { this.tone(640, 0.06, "triangle", 0.05); },
    roll() { for (let i = 0; i < 7; i++) this.noise(0.07, 0.04, i * 0.1); },
    land(i) { this.tone(480 + i * 80, 0.07, "triangle", 0.05); },
    win() {
      [0, 4, 7, 12].forEach((s, i) => this.tone(587.33 * Math.pow(2, s / 12), 0.2, "triangle", 0.08, i * 0.07));
    },
    lose() { this.tone(300, 0.16, "sawtooth", 0.04); this.tone(190, 0.22, "sine", 0.04, 0.08); },
    draw() { this.tone(440, 0.1, "triangle", 0.05); this.tone(440, 0.1, "triangle", 0.05, 0.14); },
    coin() { this.tone(1120, 0.06, "square", 0.04); this.tone(1500, 0.1, "square", 0.035, 0.06); },
  };

  /* ============================================================
     Confettis
     ============================================================ */
  const Confetti = {
    canvas: null, ctx: null, parts: [], raf: null,
    init() {
      this.canvas = $("#confetti");
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext("2d");
      this.resize();
      window.addEventListener("resize", () => this.resize());
    },
    resize() {
      if (!this.canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    burst(x, y, count = 70, palette = null, power = 1) {
      if (reducedMotion || !this.ctx) return;
      const colors = palette || ["#8b5cf6", "#38bdf8", "#4ade80", "#fbbf24", "#f472b6", "#fff"];
      for (let i = 0; i < count; i++) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(2.5, 11) * power;
        this.parts.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - rand(1, 4),
          size: rand(3, 8),
          color: pick(colors),
          rot: rand(0, Math.PI * 2),
          vr: rand(-0.24, 0.24),
          life: 1,
          decay: rand(0.01, 0.02),
        });
      }
      if (this.parts.length > 550) this.parts.splice(0, this.parts.length - 550);
      this.start();
    },
    start() {
      if (this.raf) return;
      const loop = () => {
        const ctx = this.ctx;
        if (!ctx) return;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (let i = this.parts.length - 1; i >= 0; i--) {
          const p = this.parts[i];
          p.vy += 0.18;
          p.vx *= 0.992;
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vr;
          p.life -= p.decay;
          if (p.life <= 0 || p.y > window.innerHeight + 50) { this.parts.splice(i, 1); continue; }
          ctx.save();
          ctx.globalAlpha = clamp(p.life, 0, 1);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        }
        if (this.parts.length) this.raf = requestAnimationFrame(loop);
        else {
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          this.raf = null;
        }
      };
      this.raf = requestAnimationFrame(loop);
    },
  };

  /* ============================================================
     Toasts
     ============================================================ */
  function toast(message, opts = {}) {
    const stack = $("#toastStack");
    if (!stack) return;
    const el = document.createElement("div");
    el.className = `toast ${opts.kind === "gold" ? "is-gold" : opts.kind === "success" ? "is-success" : ""}`;
    el.innerHTML = `<span class="toast-icon">${opts.icon || "💎"}</span><span class="flex-1 leading-snug">${message}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add("is-out");
      setTimeout(() => el.remove(), 260);
    }, opts.duration || 3000);
    while (stack.children.length > 4) stack.firstElementChild.remove();
  }

  function announce(text) {
    const el = $("#liveRegion");
    if (el) el.textContent = text;
  }

  /* ============================================================
     Gemmes
     ============================================================ */
  let shownGems = null;
  let gemsRaf = null;

  function paintGems() {
    const v = shownGems == null ? state.gems : shownGems;
    ["#gemBalance", "#lockerGemBalance"].forEach((sel) => {
      const el = $(sel);
      if (el) el.textContent = fmt(v);
    });
  }

  function tweenGems(from, to) {
    if (gemsRaf) cancelAnimationFrame(gemsRaf);
    if (reducedMotion || Math.abs(to - from) < 2) {
      shownGems = to;
      paintGems();
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = clamp((now - start) / 750, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      shownGems = Math.round(from + (to - from) * eased);
      paintGems();
      if (t < 1) gemsRaf = requestAnimationFrame(step);
      else { shownGems = to; paintGems(); gemsRaf = null; }
    };
    gemsRaf = requestAnimationFrame(step);
  }

  function addGems(delta) {
    const from = state.gems;
    state.gems = clamp(Math.round(state.gems + delta), 0, 9999999999);
    tweenGems(from, state.gems);
    save();
  }

  /* ============================================================
     Rendu profil
     ============================================================ */
  function renderProfile() {
    const p = state.player;
    const title = titleOf(p.title);

    ["#navFrame", "#profileFrame", "#duelFrameMe"].forEach((sel) => {
      const el = $(sel);
      if (!el) return;
      const sizes = { "#navFrame": "h-8 w-8", "#profileFrame": "h-14 w-14", "#duelFrameMe": "h-8 w-8" };
      el.className = `frame ${frameCls(p.frame)} ${sizes[sel]}`;
    });

    ["#navFrame .frame-avatar", "#profileAvatar", "#duelAvatarMe", "#lockerHeroAvatar"].forEach((sel) => {
      const el = $(sel);
      if (el) {
        el.setAttribute("data-avatar", p.name);
        paintAvatar(el, p.name);
      }
    });

    const show = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
    show("#navName", p.name);
    show("#profileName", p.name);
    show("#duelNameMe", p.name);
    show("#lockerHeroName", p.name);
    show("#levelValue", p.level);
    show("#profileTitleText", title.name);
    show("#navTitle", title.name);
    show("#duelTitleMe", title.name);
    show("#lockerHeroTitle", title.name);

    const chip = $("#profileTitle");
    if (chip) chip.className = `title-chip ${TITLE_CLASS[title.rarity] || ""}`;
    const heroChip = $("#lockerHeroTitle");
    if (heroChip) heroChip.className = `title-chip ${TITLE_CLASS[title.rarity] || ""}`;

    const myBanner = $("#myMiniBanner");
    if (myBanner) myBanner.className = `mini-banner banner ${bannerCls(p.banner)}`;

    const s = state.stats;
    show("#statPlayed", fmt(s.played));
    show("#statWinrate", s.played ? `${Math.round((s.wins / s.played) * 100)}%` : "—");
    const streak = $("#statStreak");
    if (streak) streak.innerHTML = `${s.streak} <svg class="h-3 w-3 text-[#fb923c]"><use href="#i-fire" /></svg>`;
    const best = $("#statBest");
    if (best) best.innerHTML = `<svg class="gem-sm"><use href="#i-gem" /></svg>${fmtShort(s.bestPot)}`;
    show("#roundNumber", String(state.round || 1));

    const arena = $("#arena");
    if (arena) arena.dataset.skin = p.skin;

    paintGems();
    save();
  }

  /* ============================================================
     Adversaire
     ============================================================ */
  function makeOpponent(exclude) {
    let name = pick(BOT_NAMES);
    let guard = 0;
    while (name === exclude && guard++ < 15) name = pick(BOT_NAMES);
    return {
      name,
      frame: pick(FRAMES.filter((f) => !["epic", "rare"].includes(f.id))).id,
      banner: pick(BANNERS.filter((b) => b.id !== "nebula")).id,
      title: pick(TITLES.filter((t) => !["rookie", "dice-master"].includes(t.id))).id,
      online: Math.random() > 0.2,
    };
  }

  function renderOpponent() {
    if (!opponent) opponent = makeOpponent(state.player.name);
    const o = opponent;
    const banner = $("#botMiniBanner");
    if (banner) banner.className = `mini-banner banner ${bannerCls(o.banner)}`;
    const frame = $("#duelFrameBot");
    if (frame) frame.className = `frame ${frameCls(o.frame)} h-8 w-8`;
    const av = $("#duelAvatarBot");
    if (av) {
      av.setAttribute("data-avatar", o.name);
      paintAvatar(av, o.name);
    }
    const name = $("#duelNameBot");
    if (name) name.textContent = o.name;
    const sub = $("#duelTitleBot");
    if (sub) sub.textContent = titleOf(o.title).name;
    const online = $("#botOnline");
    if (online) online.textContent = o.online ? "en ligne" : "absent";
    const card = $("#botDuelCard");
    if (card) card.classList.toggle("is-winner", false);
  }

  /* ============================================================
     Mise
     ============================================================ */
  const maxBet = () => Math.max(MIN_BET, Math.min(MAX_BET, state.gems));
  const computeOppBet = (bet) => Math.max(MIN_BET, Math.round((bet * rand(0.95, 1.05)) / 100) * 100);

  function setBet(value, { silent = false } = {}) {
    if (busy) return;
    let v = value === "max" ? maxBet() : Number(value);
    if (!Number.isFinite(v)) v = state.bet;
    v = clamp(Math.round(v / 100) * 100, MIN_BET, Math.max(MIN_BET, maxBet()));
    state.bet = v;
    oppBet = computeOppBet(v);
    renderBet();
    if (!silent) Sound.click();
    save();
  }

  function renderBet() {
    $$("#betChips [data-bet]").forEach((btn) => {
      const v = btn.dataset.bet;
      btn.classList.toggle("is-active", v === "max" ? state.bet >= maxBet() : Number(v) === state.bet);
      if (v === "max") btn.textContent = "MAX";
      btn.disabled = busy;
    });
    const input = $("#customBet");
    if (input && document.activeElement !== input) input.value = state.bet;
    if (input) input.disabled = busy;

    const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
    set("#myBetDisplay", fmt(state.bet));
    set("#botBetDisplay", fmt(oppBet));
    set("#potValue", fmt(state.bet + oppBet));
  }

  /* ============================================================
     Couleurs
     ============================================================ */
  function renderColors() {
    const grid = $("#colorGrid");
    if (!grid) return;
    const revealed = Array.isArray(oppPick);
    grid.innerHTML = COLORS.map((c) => {
      const mine = state.pick.includes(c.id);
      const bot = revealed && oppPick.includes(c.id);
      const neutral = revealed && !mine && !bot;
      const label = mine ? "Ton dé" : bot ? "Adv." : neutral ? "Neutre" : "Libre";
      return `<button type="button" class="color-card ${mine ? "is-mine" : ""} ${bot ? "is-bot" : ""} ${neutral ? "is-neutral" : ""}"
        data-color="${c.id}" aria-pressed="${mine}" ${busy ? "disabled" : ""}>
        <span class="color-swatch">${c.short}</span>
        <span class="c-name">${c.name}</span>
        <span class="c-state">${label}</span>
      </button>`;
    }).join("");
    const count = $("#pickCount");
    if (count) count.textContent = `(${state.pick.length}/2)`;
  }

  function toggleColor(id) {
    if (busy || !COLOR_BY_ID[id]) return;
    const idx = state.pick.indexOf(id);
    if (idx !== -1) state.pick.splice(idx, 1);
    else if (state.pick.length < 2) state.pick.push(id);
    else { state.pick.shift(); state.pick.push(id); }
    oppPick = null;
    resetDice();
    renderColors();
    Sound.toggle();
    save();
  }

  /* ============================================================
     Dés 3D
     ============================================================ */
  const PIP_LAYOUT = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const FACE_VALUES = [1, 6, 2, 5, 3, 4];
  const HALF = "calc(var(--die) / 2)";
  const FACE_TRANSFORMS = [
    `translateZ(${HALF})`,
    `rotateY(180deg) translateZ(${HALF})`,
    `rotateY(90deg) translateZ(${HALF})`,
    `rotateY(-90deg) translateZ(${HALF})`,
    `rotateX(90deg) translateZ(${HALF})`,
    `rotateX(-90deg) translateZ(${HALF})`,
  ];
  const FACE_ROTATION = { 1: { x: 0, y: 0 }, 2: { x: 0, y: -90 }, 3: { x: -90, y: 0 }, 4: { x: 90, y: 0 }, 5: { x: 0, y: 90 }, 6: { x: 0, y: 180 } };

  function buildCube(cubeEl) {
    let faces = "";
    for (let f = 0; f < 6; f++) {
      const pips = PIP_LAYOUT[FACE_VALUES[f]];
      let cells = "";
      for (let c = 0; c < 9; c++) cells += `<span class="pip ${pips.includes(c) ? "on" : ""}"></span>`;
      faces += `<div class="die-face" style="transform:${FACE_TRANSFORMS[f]}">${cells}</div>`;
    }
    cubeEl.innerHTML = faces;
  }

  function buildDice() {
    $$(".die-cube").forEach((cube) => {
      buildCube(cube);
      cube.style.transform = "rotateX(-14deg) rotateY(-24deg)";
    });
    $$(".die").forEach((die) => { die.className = "die die-color-unknown"; });
  }

  function setCubeFace(cube, value) {
    const rot = FACE_ROTATION[value] || FACE_ROTATION[1];
    cube.style.transition = "transform .7s cubic-bezier(.16,.9,.28,1.06)";
    cube.style.transform = `rotateX(${rot.x + 1440 - 8}deg) rotateY(${rot.y + 1440 + 6}deg)`;
  }

  const slots = () => $$("#tray .die-slot");

  function resetDice() {
    slots().forEach((slot) => {
      slot.className = "die-slot is-idle";
      const die = slot.querySelector(".die");
      if (die) die.className = "die die-color-unknown";
      const tag = slot.querySelector(".die-tag");
      if (tag) tag.textContent = "?";
    });
    ["#myScore", "#botScore", "#scoreMine", "#scoreBot"].forEach((sel) => {
      const el = $(sel);
      if (el) el.textContent = "0";
    });
  }

  let strobe = [];

  function startTumble() {
    strobe.forEach(clearInterval);
    strobe = [];
    slots().forEach((slot, i) => {
      slot.className = "die-slot is-tumbling";
      const die = slot.querySelector(".die");
      const cube = slot.querySelector(".die-cube");
      if (die) die.className = "die die-color-unknown";
      if (cube) cube.style.transition = "none";
      const tag = slot.querySelector(".die-tag");
      if (tag) tag.textContent = "…";
      strobe[i] = setInterval(() => {
        if (die) die.className = `die die-color-${pick(COLORS).id}`;
      }, 100);
    });
  }

  function stopTumble() {
    strobe.forEach(clearInterval);
    strobe = [];
    slots().forEach((slot) => slot.classList.remove("is-tumbling"));
  }

  const ownerOf = (color) => (state.pick.includes(color) ? "me" : oppPick && oppPick.includes(color) ? "bot" : "neutral");

  function setScoreUI(my, bot) {
    const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
    set("#myScore", String(my));
    set("#botScore", String(bot));
    set("#scoreMine", String(my));
    set("#scoreBot", String(bot));
  }

  async function revealDice(dice) {
    const list = slots();
    let my = 0;
    let bot = 0;
    for (let i = 0; i < list.length; i++) {
      const slot = list[i];
      const color = dice[i];
      const owner = ownerOf(color);
      if (owner === "me") my++;
      if (owner === "bot") bot++;
      slot.classList.remove("is-tumbling", "is-idle");
      slot.classList.add(owner === "me" ? "is-mine" : owner === "bot" ? "is-bot" : "is-neutral");
      const die = slot.querySelector(".die");
      if (die) die.className = `die die-color-${color}`;
      const cube = slot.querySelector(".die-cube");
      if (cube) setCubeFace(cube, REVEAL_VALUES[i % REVEAL_VALUES.length]);
      const tag = slot.querySelector(".die-tag");
      if (tag) tag.textContent = `${COLOR_BY_ID[color].name} · ${owner === "me" ? "toi" : owner === "bot" ? "adv." : "neutre"}`;
      setScoreUI(my, bot);
      Sound.land(i);
      await sleep(reducedMotion ? 30 : 170);
    }
    return { my, bot };
  }

  /* ============================================================
     Verdict & effets
     ============================================================ */
  let verdictTimers = [];

  function clearVerdict(delay = 0) {
    const host = $("#verdictHost");
    if (!host) return;
    verdictTimers.forEach(clearTimeout);
    verdictTimers = [];
    if (!delay) { host.innerHTML = ""; return; }
    verdictTimers.push(setTimeout(() => { host.innerHTML = ""; }, delay));
  }

  function showVerdict({ kind, title, my, bot, detail }) {
    const host = $("#verdictHost");
    if (!host) return;
    host.innerHTML = `
      <div class="verdict is-${kind}">
        <p class="verdict-title">${title}</p>
        <p class="mt-1 text-[0.66rem] font-bold text-[#9a9aa4]">Toi ${my} — ${bot} ${escapeHTML(opponent.name)}</p>
        <p class="mt-0.5 text-[0.62rem] font-semibold text-[#6f6f79]">${detail}</p>
      </div>`;
  }

  function spawnSparks(x, y, colors, count = 20) {
    const host = $("#sparkHost");
    if (!host || reducedMotion) return;
    const rect = host.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      const angle = rand(0, Math.PI * 2);
      const dist = rand(30, 140);
      s.style.setProperty("--x", `${x - rect.left}px`);
      s.style.setProperty("--y", `${y - rect.top}px`);
      s.style.setProperty("--s", `${rand(2.5, 6).toFixed(1)}px`);
      s.style.setProperty("--c", pick(colors));
      s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      s.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      s.style.setProperty("--d", `${rand(0.45, 0.9).toFixed(2)}s`);
      host.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }

  function floatGain(text, color) {
    const host = $("#arena");
    if (!host) return;
    const el = document.createElement("div");
    el.className = "float-gain";
    el.textContent = text;
    el.style.color = color;
    el.style.left = "50%";
    el.style.top = "34%";
    host.appendChild(el);
    setTimeout(() => el.remove(), 1450);
  }

  /* ============================================================
     Duel
     ============================================================ */
  let diceSource = null;

  function rollFour() {
    const dice = diceSource ? diceSource() : Array.from({ length: 4 }, () => pick(COLORS).id);
    return Array.from({ length: 4 }, (_, i) => (COLOR_BY_ID[dice[i]] ? dice[i] : pick(COLORS).id));
  }

  const scoreFor = (dice, colors) => dice.filter((d) => colors.includes(d)).length;
  const setStatus = (text) => { const el = $("#arenaStatus"); if (el) el.textContent = text; };

  function setBusy(v) {
    busy = v;
    const btn = $("#duelBtn");
    if (btn) btn.disabled = v;
    const label = $("#duelLabel");
    if (label) label.textContent = v ? "Tirage en cours…" : "Lancer le duel";
    renderBet();
    renderColors();
  }

  async function startDuel() {
    if (busy) return;
    if (state.pick.length !== 2) {
      toast("Choisis <b>2 couleurs</b> avant de lancer.", { icon: "🎨", kind: "gold" });
      Sound.lose();
      return;
    }
    if (state.gems < MIN_BET) {
      toast("Pas assez de gemmes : recharge 💎", { icon: "💸", kind: "gold" });
      Sound.lose();
      return;
    }
    if (state.bet > state.gems) setBet(state.gems, { silent: true });

    const bet = state.bet;
    opponent = makeOpponent(opponent ? opponent.name : state.player.name);
    const remaining = shuffle(COLORS.filter((c) => !state.pick.includes(c.id)).map((c) => c.id));
    oppPick = remaining.slice(0, 2);
    oppBet = computeOppBet(bet);
    const pot = bet + oppBet;

    setBusy(true);
    phase = "rolling";
    clearVerdict();
    state.round += 1;
    $("#myDuelCard").classList.remove("is-winner", "is-loser");
    $("#botDuelCard").classList.remove("is-winner", "is-loser");
    renderProfile();
    renderOpponent();
    renderColors();
    renderBet();

    addGems(-bet);
    Sound.roll();
    setStatus("Les dés tournent…");

    let attempt = 0;
    let final = null;

    while (attempt < 12) {
      attempt += 1;
      startTumble();
      $("#arena").classList.add("arena-shake");
      await sleep(reducedMotion ? 200 : 1250);
      $("#arena").classList.remove("arena-shake");
      stopTumble();
      const dice = rollFour();
      const my = scoreFor(dice, state.pick);
      const bot = scoreFor(dice, oppPick);
      await revealDice(dice);

      if (my === bot) {
        phase = "resolving";
        setStatus("Égalité — nouveau tirage…");
        showVerdict({ kind: "draw", title: "ÉGALITÉ", my, bot, detail: "Personne ne marque, relance automatique." });
        Sound.draw();
        await sleep(reducedMotion ? 350 : 1200);
        clearVerdict();
        await sleep(100);
        continue;
      }
      final = { dice, my, bot, win: my > bot, attempt, pot, bet, oppBet };
      break;
    }

    if (!final) {
      clearVerdict();
      stopTumble();
      resetDice();
      addGems(bet);
      setBusy(false);
      phase = "idle";
      toast("Égalités en série : mise remboursée.", { icon: "🎯" });
      setStatus("Choisis 2 couleurs et lance le duel");
      return;
    }

    const { dice, my, bot } = final;
    phase = "resolving";

    slots().forEach((slot, i) => {
      const owner = ownerOf(dice[i]);
      const win = (final.win && owner === "me") || (!final.win && owner === "bot");
      slot.classList.toggle("is-winner", win);
      slot.classList.toggle("is-loser", owner !== "neutral" && !win);
    });
    setScoreUI(my, bot);

    const arenaRect = $("#arena").getBoundingClientRect();
    const cx = arenaRect.left + arenaRect.width / 2;
    const cy = arenaRect.top + arenaRect.height * 0.45;

    if (final.win) {
      state.stats.wins += 1;
      state.stats.streak += 1;
      state.stats.bestPot = Math.max(state.stats.bestPot, pot);
      addGems(pot);
      $("#myDuelCard").classList.add("is-winner");
      $("#botDuelCard").classList.add("is-loser");
      Confetti.burst(cx, cy, 90, ["#4ade80", "#fbbf24", "#8b5cf6", "#fff"], 1.05);
      spawnSparks(cx, cy, ["#4ade80", "#fbbf24", "#fff"], 26);
      floatGain(`+${fmt(pot)}`, "#4ade80");
      Sound.win();
      showVerdict({ kind: "win", title: "VICTOIRE", my, bot, detail: `Pot remporté : ${fmt(pot)} gemmes.` });
      setStatus("Tu rafles le pot 🏆");
      announce(`Victoire ${my} à ${bot}. Pot de ${fmt(pot)} gemmes remporté.`);
    } else {
      state.stats.losses += 1;
      state.stats.streak = 0;
      $("#botDuelCard").classList.add("is-winner");
      $("#myDuelCard").classList.add("is-loser");
      spawnSparks(cx, cy, ["#ef4444", "#f472b6"], 14);
      Sound.lose();
      showVerdict({ kind: "lose", title: "DÉFAITE", my, bot, detail: `${opponent.name} rafle le pot de ${fmt(pot)}.` });
      setStatus(`${opponent.name} remporte le pot`);
      announce(`Défaite ${my} à ${bot}.`);
    }

    state.stats.played += 1;
    state.stats.wagered += bet;

    const xp = (final.win ? 180 : 60) + Math.round(bet / 40);
    state.player.xp += xp;
    if (state.player.xp >= 50000) {
      state.player.xp -= 50000;
      state.player.level += 1;
      toast(`Niveau <b>${state.player.level}</b> !`, { kind: "gold", icon: "⬆️" });
    }

    const entry = {
      outcome: final.win ? "win" : "lose",
      pot, bet, oppBet, myScore: my, botScore: bot,
      myColors: [...state.pick], oppColors: [...oppPick],
      dice: dice.slice(), retries: final.attempt - 1,
      opponent: opponent.name, ts: Date.now(),
    };
    state.history.unshift(entry);
    state.history = state.history.slice(0, 30);
    state.lastDuel = entry;

    renderProfile();
    renderHistory();
    renderLastDuel();
    save();

    clearVerdict(2800);
    setStatus(final.win ? "Pot remporté 🏆" : "Retente ta chance 🎲");

    setTimeout(() => {
      if (busy) {
        setBusy(false);
        phase = "idle";
        setScoreUI(0, 0);
        setStatus("Choisis 2 couleurs et lance le duel");
      }
    }, 1300);
  }

  /* ============================================================
     Historique / dernier duel
     ============================================================ */
  function colorDot(id, extra = "") {
    const c = COLOR_BY_ID[id] || COLORS[0];
    return `<span class="hist-mini" style="background:linear-gradient(150deg,${c.hex},${c.dark});${extra}" title="${c.name}">${c.short}</span>`;
  }

  function renderHistory() {
    const host = $("#historyList");
    if (!host) return;
    const count = $("#historyCount");
    if (count) count.textContent = String(state.history.length);

    const s = state.stats;
    const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
    set("#hsPlayed", fmt(s.played));
    set("#hsWins", fmt(s.wins));
    set("#hsLosses", fmt(s.losses));
    set("#hsWagered", fmtShort(s.wagered));

    if (!state.history.length) {
      host.innerHTML = `<p class="rounded-lg border border-dashed border-[#2c2c33] bg-[#1d1d21] px-3 py-6 text-center text-[0.7rem] font-semibold text-[#6f6f79]">Aucun duel joué pour l'instant.</p>`;
      return;
    }

    host.innerHTML = state.history.map((h) => {
      const win = h.outcome === "win";
      return `
        <div class="hist-item !py-2">
          <span class="flex gap-1">${h.myColors.map((c) => colorDot(c)).join("")}</span>
          <span class="text-[#4d4d56]">vs</span>
          <span class="flex gap-1">${h.oppColors.map((c) => colorDot(c)).join("")}</span>
          <span class="ml-1 min-w-0 flex-1 truncate font-bold ${win ? "text-[#4ade80]" : "text-[#f87171]"}">
            ${win ? "Victoire" : "Défaite"} ${h.myScore}–${h.botScore}
          </span>
          <span class="hidden text-[#6f6f79] md:block">${escapeHTML(h.opponent)}</span>
          <span class="flex items-center gap-1 font-bold ${win ? "text-[#4ade80]" : "text-[#f87171]"}">
            ${win ? "+" : "−"}${fmtShort(win ? h.pot : h.bet)} <svg class="gem-sm"><use href="#i-gem" /></svg>
          </span>
        </div>`;
    }).join("");
  }

  function renderLastDuel() {
    const host = $("#lastDuel");
    const label = $("#lastRoundLabel");
    if (label) label.textContent = state.round ? `Manche ${state.round}` : "—";
    if (!host) return;
    const d = state.lastDuel;
    if (!d) {
      host.innerHTML = `<p class="rounded-lg border border-dashed border-[#2c2c33] bg-[#1d1d21] px-3 py-4 text-center text-[0.68rem] font-semibold text-[#6f6f79]">Aucun duel joué. Choisis 2 couleurs puis lance le duel 🎲</p>`;
      return;
    }
    const win = d.outcome === "win";
    host.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-[0.62rem] font-extrabold uppercase tracking-wider ${win ? "text-[#4ade80]" : "text-[#f87171]"}">${win ? "Victoire" : "Défaite"}</span>
        <span class="flex items-center gap-1 text-[0.72rem] font-extrabold ${win ? "text-[#4ade80]" : "text-[#f87171]"}">
          ${win ? "+" : "−"}${fmtShort(win ? d.pot : d.bet)} <svg class="gem-sm"><use href="#i-gem" /></svg>
        </span>
      </div>
      <div class="mt-2 flex items-center gap-1.5 rounded-lg bg-[#1d1d21] p-1.5">
        <span class="text-[0.56rem] font-bold text-[#7dd3fc]">${d.myScore}</span>
        <span class="flex gap-1">${d.myColors.map((c) => colorDot(c)).join("")}</span>
        <span class="mx-auto text-[0.5rem] font-extrabold text-[#4d4d56]">VS</span>
        <span class="flex gap-1">${d.oppColors.map((c) => colorDot(c)).join("")}</span>
        <span class="text-[0.56rem] font-bold text-[#f9a8d4]">${d.botScore}</span>
      </div>
      <div class="duel-detail-row mt-1.5">
        <span class="text-[#6f6f79]">Adversaire</span>
        <span class="truncate text-white">${escapeHTML(d.opponent)}</span>
      </div>
      <div class="duel-detail-row mt-1">
        <span class="text-[#6f6f79]">Pot</span>
        <span class="flex items-center gap-1 text-[#fbbf24]">${fmt(d.pot)} <svg class="gem-sm"><use href="#i-gem" /></svg></span>
      </div>
      <div class="duel-detail-row mt-1">
        <span class="text-[#6f6f79]">Relances (égalité)</span>
        <span class="text-white">${d.retries}</span>
      </div>`;
  }

  /* ============================================================
     Lobby (parties en cours)
     ============================================================ */
  function makeLobby() {
    const sizes = [4, 5, 6, 7];
    return Array.from({ length: 6 }, (_, i) => {
      const o = makeOpponent();
      const bet = pick([5000, 25000, 100000, 500000, 1000000, 2500000]);
      const scoreA = randInt(0, 3);
      let scoreB = randInt(0, 3);
      if (scoreB === scoreA) scoreB = (scoreB + 1) % 4;
      return {
        id: `lobby-${Date.now()}-${i}`,
        player: { name: pick(BOT_NAMES), frame: pick(FRAMES).id, banner: pick(BANNERS).id },
        opponent: o,
        bet,
        scoreA,
        scoreB,
        live: Math.random() > 0.5,
        slots: pick(sizes),
        full: Math.random() > 0.65,
        strip: Array.from({ length: 6 }, () => pick(COLORS).id),
        more: pick([2, 8, 14, 54]),
      };
    });
  }

  function miniDieTile(color) {
    const c = COLOR_BY_ID[color] || COLORS[0];
    const pips = [[1, 1, 0, 0], [1, 0, 0, 1], [1, 0, 1, 1], [0, 1, 1, 0], [1, 1, 1, 1]][hashStr(color + c.short) % 5];
    return `<span class="mini-tile" style="--c:${c.hex};--c-d:${c.dark}">
      ${pips.map((on) => `<span class="h-[3px] w-[3px] rounded-full bg-white/90" style="opacity:${on ? 1 : 0.18}"></span>`).join("")}
    </span>`;
  }

  function renderLobby() {
    const host = $("#lobbyList");
    if (!host) return;
    const count = $("#lobbyCount");
    if (count) count.textContent = String(lobby.length);

    host.innerHTML = lobby.map((g) => {
      const colorHex = g.live ? "#4ade80" : "#6b7280";
      return `
        <div class="duel-row">
          <span class="relative">
            ${miniBannerHTML(g.player.banner, g.player.frame, g.player.name)}
            <span class="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full" style="background:${colorHex};box-shadow:0 0 6px ${colorHex}"></span>
          </span>
          <span class="mini-sep">vs</span>
          ${miniBannerHTML(g.opponent.banner, g.opponent.frame, g.opponent.name)}

          <div class="ml-1 hidden min-w-0 flex-1 items-stretch gap-1 sm:flex">
            ${g.strip.map((c) => miniDieTile(c)).join("")}
            <span class="mini-tile is-more">+${g.more}</span>
          </div>

          <div class="hidden w-[72px] flex-col items-end md:flex">
            <span class="flex items-center gap-1 text-[0.72rem] font-extrabold text-white">
              <svg class="gem-sm"><use href="#i-gem" /></svg>${fmtShort(g.bet)}
            </span>
            <span class="text-[0.5rem] font-bold uppercase tracking-wide text-[#5f5f69]">Pot</span>
          </div>

          <div class="flex w-[74px] flex-col items-center gap-1">
            <span class="font-display text-[0.78rem] text-white">${g.scoreA}–${g.scoreB}</span>
            <span class="round-pips">
              ${Array.from({ length: 4 }, (_, k) => `<span class="round-pip" style="background:${k < g.scoreA ? "#38bdf8" : k < g.scoreA + g.scoreB ? "#f472b6" : "#33333a"}"></span>`).join("")}
            </span>
          </div>

          <button type="button" class="h-8 w-[62px] rounded-md text-[0.66rem] font-extrabold transition ${g.full ? "bg-[#2b2b32] text-[#8b8b95] hover:bg-[#33333a]" : "bg-[#8b5cf6] text-white hover:bg-[#7c4ded]"}" data-join="${g.id}">
            ${g.full ? "View" : "Join"}
          </button>
        </div>`;
    }).join("");

    hydrateAvatars(host);
  }

  function joinLobby(id) {
    const g = lobby.find((x) => x.id === id);
    if (!g) return;
    if (g.full) {
      toast(`Partie de <b>${escapeHTML(g.opponent.name)}</b> en cours — ${g.scoreA}–${g.scoreB}`, { icon: "👀", duration: 2600 });
      Sound.click();
      return;
    }
    state.bet = clamp(g.bet, MIN_BET, maxBet());
    oppBet = g.bet;
    oppPick = null;
    setBet(state.bet, { silent: true });
    renderBet();
    toast(`Duel rejoint contre <b>${escapeHTML(g.opponent.name)}</b> · mise ${fmt(g.bet)}`, { kind: "success", icon: "🎲" });
    Sound.toggle();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ============================================================
     Chat
     ============================================================ */
  const chat = {
    el: null,
    seed() {
      this.el = $("#chatList");
      if (!this.el) return;
      this.el.innerHTML = "";
      const intros = shuffle(BOT_NAMES).slice(0, 4);
      intros.forEach((name, i) => {
        setTimeout(() => this.add({ name, text: pick(CHAT_LINES).replace("{name}", pick(BOT_NAMES)) }), 250 + i * 700);
      });
      this.later();
    },
    time() {
      const d = new Date();
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    },
    add({ name, text, me = false, frame = null }) {
      if (!this.el) return;
      const div = document.createElement("div");
      div.className = "chat-row";
      div.innerHTML = `
        <span class="chat-avatar banner ${bannerCls(pick(BANNERS).id)}" data-avatar="${escapeHTML(name)}"></span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1">
            <span class="truncate text-[0.7rem] font-extrabold ${me ? "text-[#a78bfa]" : "text-[#d6d6de]"}">${escapeHTML(name)}</span>
            ${me ? `<span class="rounded bg-[#8b5cf6]/20 px-1 text-[0.46rem] font-black uppercase text-[#c4b5fd]">toi</span>` : ""}
            <span class="chat-time">${this.time()}</span>
          </div>
          <p class="chat-text">${text}</p>
        </div>`;
      const av = div.querySelector(".chat-avatar");
      if (av) paintAvatar(av, me ? state.player.name : name);
      this.el.appendChild(div);
      if (this.el.children.length > 60) this.el.firstElementChild.remove();
      this.el.scrollTop = this.el.scrollHeight;
    },
    later() {
      setTimeout(() => {
        if (!document.hidden) {
          const line = pick(CHAT_LINES);
          this.add({
            name: pick(BOT_NAMES),
            text: escapeHTML(line).replace("{name}", pick(BOT_NAMES)).replace(/@([\wÀ-ÿ-]+)/g, '<span class="mention">@$1</span>'),
          });
        }
        this.later();
      }, randInt(6500, 13000));
    },
  };

  /* ============================================================
     Vestiaire
     ============================================================ */
  let lockerTab = "banners";
  let lockerOpen = false;

  function cosmeticCard(kind, item) {
    const owned = state.owned[kind].includes(item.id);
    const equipped =
      (kind === "banners" && state.player.banner === item.id) ||
      (kind === "frames" && state.player.frame === item.id) ||
      (kind === "titles" && state.player.title === item.id) ||
      (kind === "skins" && state.player.skin === item.id);

    let preview = "";
    if (kind === "banners") preview = `<div class="absolute inset-0 banner ${item.cls}"></div>`;
    else if (kind === "frames") {
      preview = `<span class="frame ${frameCls(item.id)}" style="width:44px;height:44px">
        <span class="frame-ring"></span>
        <span class="frame-avatar" data-avatar="${escapeHTML(state.player.name)}"></span>
      </span>`;
    } else if (kind === "titles") preview = `<span class="title-chip ${TITLE_CLASS[item.rarity] || ""} !text-[0.6rem]">${item.name}</span>`;
    else preview = `<span class="skin-swatch ${item.swatch}"></span>`;

    let action;
    if (equipped) action = `<button type="button" class="btn btn-dark !w-full !py-1 !text-[0.58rem]" disabled><svg class="h-3 w-3 text-[#4ade80]"><use href="#i-check" /></svg> Équipé</button>`;
    else if (owned) action = `<button type="button" class="btn btn-primary !w-full !py-1 !text-[0.58rem]" data-equip="${kind}|${item.id}">Équiper</button>`;
    else action = `<button type="button" class="btn btn-dark !w-full !py-1 !text-[0.58rem]" data-buy="${kind}|${item.id}" ${state.gems < item.price ? "disabled" : ""}><svg class="h-3 w-3"><use href="#i-lock" /></svg> ${state.gems < item.price ? "Trop cher" : "Acheter"}</button>`;

    return `
      <article class="cosmetic-card ${equipped ? "is-equipped" : ""}">
        <div class="cosmetic-preview" style="${kind === "banners" ? "" : "background:#1d1d21"}">
          ${preview}
          ${equipped ? `<span class="absolute right-1 top-1 rounded bg-[#8b5cf6] px-1 py-0.5 text-[0.44rem] font-black text-white">OK</span>` : ""}
        </div>
        <div class="cosmetic-info">
          <div class="flex items-start justify-between gap-1">
            <span class="cosmetic-name">${item.name}</span>
            ${!owned ? `<span class="flex shrink-0 items-center gap-0.5 text-[0.56rem] font-bold text-[#fbbf24]"><svg class="gem-sm"><use href="#i-gem" /></svg>${fmtShort(item.price)}</span>` : ""}
          </div>
          <span class="rarity rarity-${item.rarity}">${RARITY_LABEL[item.rarity]}</span>
          ${action}
        </div>
      </article>`;
  }

  function renderLocker() {
    const grid = $("#lockerGrid");
    if (!grid) return;
    grid.innerHTML = CATALOG[lockerTab].map((item) => cosmeticCard(lockerTab, item)).join("");
    hydrateAvatars(grid);

    const total = Object.values(CATALOG).reduce((n, l) => n + l.length, 0);
    const owned = Object.keys(CATALOG).reduce((n, k) => n + state.owned[k].length, 0);
    const oc = $("#lockerOwnedCount");
    if (oc) oc.textContent = String(owned);
    const tc = $("#lockerTotalCount");
    if (tc) tc.textContent = String(total);

    const heroBanner = $("#lockerHeroBanner");
    if (heroBanner) heroBanner.className = `absolute inset-0 banner ${bannerCls(state.player.banner)} opacity-90`;
    const heroFrame = $("#lockerHeroFrame");
    if (heroFrame) {
      heroFrame.className = `frame ${frameCls(state.player.frame)} relative h-12 w-12`;
      const ring = heroFrame.querySelector(".frame-ring");
      if (ring) ring.outerHTML = '<span class="frame-ring"></span>';
    }
    const heroAvatar = $("#lockerHeroAvatar");
    if (heroAvatar) {
      heroAvatar.setAttribute("data-avatar", state.player.name);
      paintAvatar(heroAvatar, state.player.name);
    }
    paintGems();
  }

  function openLocker(tab) {
    const modal = $("#lockerModal");
    if (!modal) return;
    if (tab && CATALOG[tab]) lockerTab = tab;
    $$("[data-locker-tab]").forEach((b) => {
      const on = b.dataset.lockerTab === lockerTab;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderLocker();
    modal.hidden = false;
    lockerOpen = true;
    document.body.style.overflow = "hidden";
    Sound.click();
  }

  function closeLocker() {
    const modal = $("#lockerModal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    lockerOpen = false;
    document.body.style.overflow = "";
    Sound.click();
    renderProfile();
    renderOpponent();
  }

  function equipCosmetic(kind, id) {
    if (!CATALOG[kind] || !CATALOG[kind].some((i) => i.id === id) || !state.owned[kind].includes(id)) return;
    const map = { banners: "banner", frames: "frame", titles: "title", skins: "skin" };
    state.player[map[kind]] = id;
    toast(`<b>${byId(CATALOG[kind], id).name}</b> équipé`, { kind: "success", icon: "✨" });
    Sound.toggle();
    renderProfile();
    renderLocker();
    save();
  }

  function buyCosmetic(kind, id) {
    const list = CATALOG[kind];
    if (!list) return;
    const item = byId(list, id);
    if (!item || state.owned[kind].includes(id)) return;
    if (state.gems < item.price) {
      toast(`Il te manque <b>${fmt(item.price - state.gems)}</b> gemmes`, { icon: "🔒", kind: "gold" });
      Sound.lose();
      return;
    }
    addGems(-item.price);
    state.owned[kind].push(id);
    toast(`<b>${item.name}</b> débloqué !`, { kind: "gold", icon: "🎁" });
    Sound.coin();
    Confetti.burst(window.innerWidth / 2, 160, 40, ["#fbbf24", "#8b5cf6", "#fff"], 0.8);
    renderLocker();
    renderProfile();
    save();
  }

  /* ============================================================
     Ticker & fair
     ============================================================ */
  function hashSeed(input) {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  const tickerEvents = [];

  function tickerHTML(e) {
    return `<span class="ticker-item">
      <span class="h-2 w-2 rounded-sm" style="background:${COLOR_BY_ID[e.color].hex}"></span>
      <b>${escapeHTML(e.name)}</b> won <span class="amt">${fmtShort(e.amt)}</span>
      <svg class="gem-sm"><use href="#i-gem" /></svg>
    </span>`;
  }

  function renderTicker() {
    const track = $("#tickerTrack");
    if (!track) return;
    if (!tickerEvents.length) {
      for (let i = 0; i < 14; i++) tickerEvents.push({ name: pick(BOT_NAMES), color: pick(COLORS).id, amt: randInt(5000, 62000000) });
    }
    const html = tickerEvents.map(tickerHTML).join("");
    track.innerHTML = html + html;
  }

  function pushTicker(name, color, amount) {
    tickerEvents.unshift({ name, color, amt: amount });
    if (tickerEvents.length > 18) tickerEvents.length = 18;
    renderTicker();
  }

  function showFair() {
    const hash = hashSeed(`${Date.now()}-${Math.random()}`).slice(0, 16);
    toast(`Provably fair · tirage <b class="font-mono text-[0.66rem] text-[#7dd3fc]">#${hash}</b><br><span class="text-[#8b8b95]">4 dés · 6 couleurs équiprobables · égalité relancée</span>`, { icon: "🛡️", duration: 5000 });
    Sound.toggle();
  }

  /* ============================================================
     Vue Create / History
     ============================================================ */
  function setView(view) {
    state.view = view === "history" ? "history" : "create";
    $$("[data-view]").forEach((t) => t.classList.toggle("is-active", t.dataset.view === state.view));
    const create = $("#viewCreate");
    const history = $("#viewHistory");
    if (create) create.classList.toggle("hidden", state.view !== "create");
    if (history) history.classList.toggle("hidden", state.view !== "history");
    save();
  }

  /* ============================================================
     Événements
     ============================================================ */
  function bindEvents() {
    $("#duelBtn").addEventListener("click", startDuel);

    $("#colorGrid").addEventListener("click", (e) => {
      const card = e.target.closest("[data-color]");
      if (card) toggleColor(card.dataset.color);
    });

    $$("#betChips [data-bet]").forEach((btn) => btn.addEventListener("click", () => setBet(btn.dataset.bet)));

    const input = $("#customBet");
    if (input) {
      input.addEventListener("change", () => setBet(input.value, { silent: true }));
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          setBet(input.value, { silent: true });
          input.blur();
        }
      });
      input.addEventListener("focus", () => input.select());
    }

    $$("[data-view]").forEach((tab) => tab.addEventListener("click", () => { setView(tab.dataset.view); Sound.click(); }));
    $$("[data-locker-tab]").forEach((tab) => tab.addEventListener("click", () => {
      lockerTab = tab.dataset.lockerTab;
      $$("[data-locker-tab]").forEach((b) => b.classList.toggle("is-active", b === tab));
      renderLocker();
      Sound.click();
    }));

    $("#lobbyList").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-join]");
      if (!btn) return;
      const row = btn.closest(".duel-row");
      if (row) {
        row.style.background = "rgba(139,92,246,.1)";
        setTimeout(() => { row.style.background = ""; }, 500);
      }
      joinLobby(btn.dataset.join);
    });

    $("#joinFeatured").addEventListener("click", () => {
      toast("Duel sponsorisé rejoint — bonne chance 🎲", { kind: "success", icon: "🏆" });
      Sound.toggle();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    $("#refreshBtn").addEventListener("click", () => {
      lobby = makeLobby();
      renderLobby();
      toast("Liste des parties actualisée", { icon: "🔄", duration: 1800 });
      Sound.click();
    });

    $("#fairBtn").addEventListener("click", showFair);
    $("#railFair").addEventListener("click", showFair);
    $("#railStats").addEventListener("click", () => { setView("history"); window.scrollTo({ top: 0, behavior: "smooth" }); });
    $("#railGames").addEventListener("click", () => { setView("create"); window.scrollTo({ top: 0, behavior: "smooth" }); });
    $("#railTrophy").addEventListener("click", () => {
      setView("history");
      toast("Classement bientôt disponible 🏆", { icon: "📊", duration: 2000 });
    });
    $("#railQuests").addEventListener("click", () => toast("Quêtes du jour : gagne 3 duels pour 5 000 💎", { icon: "🎯", duration: 3200 }));
    $("#railSettings").addEventListener("click", () => toast("Paramètres : sons et animations (bientôt)", { icon: "⚙️", duration: 2200 }));
    $("#railHelp").addEventListener("click", () => toast("Choisis 2 couleurs, mise, puis lance : le plus de dés gagne le pot.", { icon: "❓", duration: 4000 }));
    $("#walletBtn").addEventListener("click", () => {
      addGems(100000);
      toast("<b>+100 000</b> gemmes ajoutées 💎", { kind: "gold", icon: "💰" });
      Sound.coin();
      renderProfile();
    });
    $("#btnTopUp").addEventListener("click", () => {
      addGems(25000);
      toast("<b>+25 000</b> gemmes offertes 🎁", { kind: "gold", icon: "💎" });
      Sound.coin();
      renderProfile();
    });

    const soundBtn = $("#btnSound");
    const paintSound = () => {
      Sound.enabled = state.sound !== false;
      const icon = $("#soundIcon");
      if (icon) icon.setAttribute("href", Sound.enabled ? "#i-sound" : "#i-muted");
      if (soundBtn) {
        soundBtn.setAttribute("aria-pressed", String(Sound.enabled));
        soundBtn.style.color = Sound.enabled ? "#c4b5fd" : "";
      }
    };
    soundBtn.addEventListener("click", () => {
      state.sound = state.sound === false;
      paintSound();
      if (Sound.enabled) Sound.toggle();
      save();
    });
    paintSound();

    $("#clearHistory").addEventListener("click", () => {
      state.history = [];
      state.lastDuel = null;
      renderHistory();
      renderLastDuel();
      save();
      Sound.click();
    });

    $$("[data-open-locker]").forEach((btn) => btn.addEventListener("click", () => openLocker(btn.dataset.openLocker)));
    $$("[data-close-locker]").forEach((el) => el.addEventListener("click", closeLocker));

    $("#lockerModal").addEventListener("click", (e) => {
      const buy = e.target.closest("[data-buy]");
      if (buy) {
        const [kind, id] = buy.dataset.buy.split("|");
        buyCosmetic(kind, id);
        return;
      }
      const equip = e.target.closest("[data-equip]");
      if (equip) {
        const [kind, id] = equip.dataset.equip.split("|");
        equipCosmetic(kind, id);
      }
    });

    // chat
    const form = $("#chatForm");
    const chatInput = $("#chatInput");
    let cooldown = 0;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - cooldown < 900) return;
      const text = chatInput.value.trim();
      if (!text) return;
      cooldown = now;
      const html = escapeHTML(text).replace(/@([\wÀ-ÿ-]+)/g, '<span class="mention">@$1</span>');
      chat.add({ name: state.player.name, text: html, me: true });
      chatInput.value = "";
      Sound.click();
      setTimeout(() => {
        chat.add({
          name: pick(BOT_NAMES),
          text: pick([
            `@${escapeHTML(state.player.name)} gg, rematch ? 🎲`,
            `the frame is clean fr fr`,
            `bro that pot was crazy 💎`,
            `join my duel, 25k min`,
          ]),
        });
      }, randInt(1000, 2200));
    });

    $("#chatPing").addEventListener("click", () => {
      toast("Ping envoyé au salon 🔔", { icon: "🔔", duration: 1600 });
      Sound.toggle();
    });

    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || e.target.isContentEditable;
      if (e.key === "Escape" && lockerOpen) { closeLocker(); return; }
      if (typing) return;
      if (e.code === "Space") { e.preventDefault(); startDuel(); return; }
      const n = Number(e.key);
      if (n >= 1 && n <= 6) { e.preventDefault(); toggleColor(COLORS[n - 1].id); }
      else if (e.key.toLowerCase() === "b") openLocker(lockerTab);
    });

    window.addEventListener("pageshow", () => hydrateAvatars());
  }

  /* ============================================================
     Ambiance
     ============================================================ */
  function startAmbient() {
    setInterval(() => {
      const el = $("#playersOnline");
      if (el) el.textContent = fmt(1380 + randInt(-40, 90));
      const c = $("#chatOnline");
      if (c) c.textContent = fmt(690 + randInt(-20, 60));
    }, 5200);

    setInterval(() => {
      if (!document.hidden) pushTicker(pick(BOT_NAMES), pick(COLORS).id, randInt(5000, 52000000));
    }, 7000);

    setInterval(() => {
      if (document.hidden) return;
      lobby = makeLobby();
      renderLobby();
    }, 45000);
  }

  /* ============================================================
     Init
     ============================================================ */
  function init() {
    state = load();
    shownGems = state.gems;
    oppBet = computeOppBet(state.bet);
    opponent = makeOpponent();

    Confetti.init();
    buildDice();
    renderProfile();
    renderOpponent();
    renderColors();
    renderBet();
    renderHistory();
    renderLastDuel();
    renderTicker();
    lobby = makeLobby();
    renderLobby();
    hydrateAvatars();
    bindEvents();
    chat.seed();
    startAmbient();
    renderLocker();
    setView(state.view);
    setStatus("Choisis 2 couleurs et lance le duel");
    if (state.bet > state.gems) setBet(state.gems, { silent: true });
    save();
  }

  // Hook de test (uniquement avec ?debug)
  if (new URLSearchParams(window.location.search).has("debug")) {
    window.__cd = {
      get state() { return state; },
      get busy() { return busy; },
      get phase() { return phase; },
      get lobby() { return lobby; },
      setDiceSource(fn) { diceSource = fn; },
      startDuel,
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
