/*!
 * Color Dice 1v1 — duel de dés néon (style BloxyPet)
 * HTML + Tailwind + JavaScript vanilla. Aucune dépendance.
 *
 * Règles implémentées :
 *  - 6 couleurs, le joueur en choisit 2, le bot 2 autres, 2 restent neutres.
 *  - 4 dés sont tirés ; on compare les dés "joueur" aux dés "bot".
 *  - Égalité  → relance automatique du tirage.
 *  - Le vainqueur rafle le pot (mise joueur + mise bot, à ±5 %).
 */
(() => {
  "use strict";

  /* ============================================================
     1. Utilitaires
     ============================================================ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const rand = (min, max) => min + Math.random() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fmt = (n) => Math.round(n).toLocaleString("fr-FR").replace(/\u202f/g, " ");
  const fmtShort = (n) => {
    if (n >= 1e9) return (n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1).replace(".", ",") + " Md";
    if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1).replace(".", ",") + " M";
    if (n >= 1e4) return (n / 1e3).toFixed(n % 1e3 === 0 ? 0 : 1).replace(".", ",") + " k";
    return fmt(n);
  };
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const escapeHTML = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STORAGE_KEY = "colordice1v1.save.v1";
  const MIN_BET = 100;
  const MAX_BET = 1000000;

  /* ============================================================
     2. Données du jeu
     ============================================================ */
  const COLORS = [
    { id: "red", name: "Rouge", short: "R", hex: "#ff3b6b", dark: "#b30f38" },
    { id: "blue", name: "Bleu", short: "B", hex: "#3f8cff", dark: "#1b62e0" },
    { id: "green", name: "Vert", short: "V", hex: "#2fd27a", dark: "#0f7a44" },
    { id: "yellow", name: "Jaune", short: "J", hex: "#ffd35c", dark: "#c98606" },
    { id: "purple", name: "Violet", short: "P", hex: "#a855f7", dark: "#5b21b6" },
    { id: "orange", name: "Orange", short: "O", hex: "#ff8a2b", dark: "#b45309" },
  ];
  const COLOR_BY_ID = Object.fromEntries(COLORS.map((c) => [c.id, c]));
  const REVEAL_VALUES = [1, 5, 3, 2];

  const BANNERS = [
    { id: "nebula", name: "Nébuleuse Épique", rarity: "epic", cls: "banner-nebula", price: 0, desc: "Poussière d'étoiles rose & bleue" },
    { id: "aurora", name: "Aurore Boréale", rarity: "rare", cls: "banner-aurora", price: 2400, desc: "Voiles verts et cyan" },
    { id: "lava", name: "Cœur de Lave", rarity: "epic", cls: "banner-lava", price: 4800, desc: "Braises dorées sur magma" },
    { id: "ice", name: "Glacier Cristal", rarity: "rare", cls: "banner-ice", price: 3200, desc: "Éclats polaires" },
    { id: "galaxy", name: "Galaxie Profonde", rarity: "legendary", cls: "banner-galaxy", price: 12000, desc: "Constellations animées" },
    { id: "gold", name: "Richesse Dorée", rarity: "legendary", cls: "banner-gold", price: 15000, desc: "Rayons d'or en rotation" },
    { id: "toxic", name: "Néon Toxique", rarity: "rare", cls: "banner-toxic", price: 2800, desc: "Bulles acides fluo" },
    { id: "sakura", name: "Cerisier Céleste", rarity: "epic", cls: "banner-sakura", price: 5600, desc: "Pétales roses" },
    { id: "void", name: "Néant Violet", rarity: "mythic", cls: "banner-void", price: 24000, desc: "Ondes du vide" },
    { id: "rainbow", name: "Prisme Arc-en-Ciel", rarity: "mythic", cls: "banner-rainbow", price: 32000, desc: "Le flex ultime" },
  ];

  const FRAMES = [
    { id: "epic", name: "Cadre Néon Épique", rarity: "epic", cls: "frame--epic", price: 0, desc: "Violet / rose / cyan" },
    { id: "rare", name: "Cadre Cristal", rarity: "rare", cls: "frame--rare", price: 2200, desc: "Bleu électrique" },
    { id: "toxic", name: "Cadre Toxique", rarity: "rare", cls: "frame--toxic", price: 2600, desc: "Vert acide" },
    { id: "hostile", name: "Cadre Rival", rarity: "epic", cls: "frame--hostile", price: 4200, desc: "Rouge incandescent" },
    { id: "holo", name: "Cadre Holographique", rarity: "epic", cls: "frame--holo", price: 6400, desc: "Iridescent animé" },
    { id: "legendary", name: "Cadre Légendaire", rarity: "legendary", cls: "frame--legendary", price: 14000, desc: "Or 24 carats" },
    { id: "mythic", name: "Cadre Mythique", rarity: "mythic", cls: "frame--mythic", price: 28000, desc: "Arc-en-ciel stellaire" },
  ];

  const TITLES = [
    { id: "dice-master", name: "Dice Master", rarity: "mythic", price: 0, icon: "🎲" },
    { id: "rookie", name: "Petit Chanceux", rarity: "common", price: 0, icon: "🍀" },
    { id: "neon", name: "Enfant du Néon", rarity: "rare", price: 1800, icon: "💠" },
    { id: "golden", name: "Chasseur d'Or", rarity: "epic", price: 4200, icon: "✨" },
    { id: "streak", name: "Série Imparable", rarity: "epic", price: 5200, icon: "🔥" },
    { id: "legend", name: "Légende Vivante", rarity: "legendary", price: 11000, icon: "☀️" },
    { id: "apex", name: "Apex Prédator", rarity: "legendary", price: 16000, icon: "👑" },
    { id: "void", name: "Souverain du Vide", rarity: "mythic", price: 30000, icon: "🌌" },
  ];

  const SKINS = [
    { id: "neon", name: "Néon Pulse", swatch: "skin-neon", rarity: "epic", price: 0, desc: "Le skin signature" },
    { id: "ice", name: "Givre Polaire", swatch: "skin-ice", rarity: "rare", price: 2000, desc: "Pips glacés" },
    { id: "gold", name: "Or Massif", swatch: "skin-gold", rarity: "legendary", price: 9000, desc: "Éclat royal" },
    { id: "toxic", name: "Slime Acide", swatch: "skin-toxic", rarity: "rare", price: 2400, desc: "Bave radioactive" },
    { id: "sakura", name: "Pétale Rose", swatch: "skin-sakura", rarity: "epic", price: 5400, desc: "Douceur florale" },
    { id: "galaxy", name: "Poussière d'Étoiles", swatch: "skin-galaxy", rarity: "legendary", price: 13000, desc: "Constellations" },
    { id: "void", name: "Néant Absolu", swatch: "skin-void", rarity: "mythic", price: 26000, desc: "Noir violet intense" },
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
  ];

  const CHAT_LINES = [
    "Qui veut un 1v1 ? Je mets 5k 🎲",
    "Ce cadre néon est trop propre 😮‍💨",
    "3 duels gagnés d'affilée, la série continue 🔥",
    "GG @{name}, tu m'as vraiment battu",
    "J'ai misé gros, le pot était énorme 💎",
    "Mon setup de bannière arc-en-ciel > tout",
    "Quelqu'un a le cadre mythique ? 👀",
    "La grille est serrée ce soir, 2 dés c'est chaud",
    "Égalité deux fois d'affilée, le jeu me déteste 😤",
    "Violet + jaune, la combi sous-cotée",
    "Je farme pour le skin Néant, plus que 3k",
    "Vestiaire mis à jour, avis ? ✨",
  ];

  /* ============================================================
     3. État & persistance
     ============================================================ */
  const DEFAULT_STATE = () => ({
    gems: 50000,
    player: {
      name: "NovaBlaze",
      id: "#BD-2049",
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
    bet: 500,
    pick: ["red", "blue"],
    history: [],
    lastDuel: null,
    stats: { played: 0, wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0, bestPot: 0, wagered: 0 },
    round: 0,
    sound: true,
  });

  let state;
  let currentBot = null;
  let botPick = null; // [colorId, colorId] du bot pour le duel en cours
  let botBet = 500;
  let busy = false;
  let phase = "idle"; // idle | rolling | revealing | result

  const PERSISTED = ["gems", "player", "owned", "bet", "pick", "history", "lastDuel", "stats", "round", "sound"];

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

    // garde-fous cosmétiques
    ["banners", "frames", "titles", "skins"].forEach((k) => {
      if (!Array.isArray(merged.owned[k]) || !merged.owned[k].length) merged.owned[k] = base.owned[k];
      merged.owned[k] = merged.owned[k].filter((id) => CATALOG[k].some((item) => item.id === id));
      if (!merged.owned[k].length) merged.owned[k] = base.owned[k];
    });
    const equipped = {
      banners: merged.player.banner,
      frames: merged.player.frame,
      titles: merged.player.title,
      skins: merged.player.skin,
    };
    Object.entries(equipped).forEach(([k, id]) => {
      const valid = CATALOG[k].some((i) => i.id === id);
      if (!valid) {
        merged.player[k === "banners" ? "banner" : k === "frames" ? "frame" : k === "titles" ? "title" : "skin"] = base.player[
          k === "banners" ? "banner" : k === "frames" ? "frame" : k === "titles" ? "title" : "skin"
        ];
      } else if (!merged.owned[k].includes(id)) {
        merged.owned[k].push(id);
      }
    });

    if (!Number.isFinite(merged.gems) || merged.gems < 0) merged.gems = base.gems;
    if (!Array.isArray(merged.pick)) merged.pick = base.pick;
    merged.pick = [...new Set(merged.pick.filter((id) => COLOR_BY_ID[id]))].slice(0, 2);
    if (!merged.pick.length) merged.pick = base.pick;
    if (!Array.isArray(merged.history)) merged.history = [];
    merged.history = merged.history.filter((h) => h && h.outcome).slice(0, 14);
    merged.bet = clamp(Number(merged.bet) || base.bet, MIN_BET, MAX_BET);
    if (!merged.sound) merged.sound = false;
    return merged;
  }

  /* ============================================================
     4. Avatars procéduraux
     ============================================================ */
  const AVATAR_PALETTES = [
    ["#ff7ac6", "#7c3aed", "#22e5ee"],
    ["#ffd35c", "#ff6b3d", "#7c2d12"],
    ["#7ce7ff", "#2563eb", "#0f172a"],
    ["#c8ff5c", "#3f8cff", "#1b3d05"],
    ["#ff9db1", "#7a1050", "#ffd6a5"],
    ["#d6b4ff", "#5b21b6", "#0a0620"],
    ["#8ef2d1", "#0f766e", "#052e2b"],
    ["#ffb45c", "#b91c1c", "#2a0a06"],
    ["#b0c4ff", "#4f46e5", "#0b1030"],
    ["#f6a8ff", "#db2777", "#2c0a24"],
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
    if (AVATAR_CACHE.has(seed)) return AVATAR_CACHE.get(seed);
    const h = hashStr(String(seed));
    const [c1, c2, c3] = AVATAR_PALETTES[h % AVATAR_PALETTES.length];
    const face = (h >> 5) % 4;
    const hat = (h >> 9) % 5;
    const sparkle = (h >> 13) % 2 === 0;

    const eyes = [
      `<rect x="22" y="35" width="7" height="9" rx="2.6" fill="#0b0718"/><rect x="39" y="35" width="7" height="9" rx="2.6" fill="#0b0718"/><circle cx="24.5" cy="37.6" r="1.8" fill="#fff"/><circle cx="41.5" cy="37.6" r="1.8" fill="#fff"/>`,
      `<ellipse cx="25.5" cy="39" rx="4.4" ry="5.2" fill="#0b0718"/><ellipse cx="42.5" cy="39" rx="4.4" ry="5.2" fill="#0b0718"/><circle cx="26.5" cy="37.2" r="1.6" fill="#fff"/><circle cx="43.5" cy="37.2" r="1.6" fill="#fff"/>`,
      `<path d="M21 37h8M39 37h8" stroke="#0b0718" stroke-width="4" stroke-linecap="round"/><circle cx="25" cy="42" r="2" fill="#fff" opacity=".9"/><circle cx="43" cy="42" r="2" fill="#fff" opacity=".9"/>`,
      `<rect x="22" y="35" width="7" height="9" rx="2.6" fill="#0b0718"/><rect x="39" y="35" width="7" height="9" rx="2.6" fill="#0b0718"/><rect x="23.5" y="35.5" width="4" height="3" rx="1.2" fill="#fff" opacity=".8"/><rect x="40.5" y="35.5" width="4" height="3" rx="1.2" fill="#fff" opacity=".8"/>`,
    ][face];

    const hats = [
      `<rect x="16" y="12" width="36" height="8" rx="4" fill="${c2}"/><rect x="22" y="4" width="24" height="12" rx="5" fill="${c1}"/><rect x="22" y="4" width="24" height="5" rx="2.5" fill="#fff" opacity=".28"/>`,
      `<path d="M14 20c2-10 8-14 20-14s18 4 20 14z" fill="${c2}"/><rect x="30" y="0" width="8" height="12" rx="4" fill="${c1}"/>`,
      `<rect x="18" y="12" width="32" height="7" rx="3.5" fill="${c2}"/><path d="M36 2l4.5 7h-9z" fill="${c1}"/><circle cx="36" cy="3" r="2.4" fill="#fff" opacity=".9"/>`,
      `<rect x="20" y="14" width="32" height="6" rx="3" fill="${c2}" opacity=".9"/><rect x="24" y="6" width="24" height="10" rx="5" fill="${c1}" opacity=".9"/>`,
      ``,
    ][hat];

    const svg = `
      <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Avatar">
        <defs>
          <linearGradient id="bg${h}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${c2}" stop-opacity=".55"/>
            <stop offset="1" stop-color="${c3}" stop-opacity=".95"/>
          </linearGradient>
          <linearGradient id="hd${h}" x1="0.2" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${c1}"/>
            <stop offset="1" stop-color="${c2}"/>
          </linearGradient>
        </defs>
        <rect width="72" height="72" fill="url(#bg${h})"/>
        <g opacity=".28">
          <circle cx="12" cy="14" r="1.6" fill="#fff"/><circle cx="58" cy="22" r="1.2" fill="#fff"/>
          <circle cx="48" cy="58" r="1.4" fill="#fff"/><circle cx="20" cy="52" r="1" fill="#fff"/>
        </g>
        <rect x="24" y="52" width="24" height="20" rx="7" fill="${c2}"/>
        <rect x="27" y="48" width="4" height="8" rx="2" fill="${c1}" opacity=".65"/>
        <rect x="41" y="48" width="4" height="8" rx="2" fill="${c1}" opacity=".65"/>
        <rect x="16" y="22" width="40" height="34" rx="12" fill="url(#hd${h})"/>
        <rect x="16" y="22" width="40" height="11" rx="6" fill="#fff" opacity=".18"/>
        <rect x="16" y="22" width="40" height="34" rx="12" fill="none" stroke="#fff" stroke-opacity=".35"/>
        ${eyes}
        <rect x="30" y="48" width="12" height="3.4" rx="1.7" fill="#0b0718" opacity=".45"/>
        <ellipse cx="20" cy="45" rx="3" ry="2" fill="#ff7ac6" opacity=".55"/>
        <ellipse cx="52" cy="45" rx="3" ry="2" fill="#ff7ac6" opacity=".55"/>
        ${hats}
        ${sparkle ? `<path d="M60 8l1.4 4 4 1.4-4 1.4L60 19l-1.4-4-4-1.4 4-1.4z" fill="#fff" opacity=".85"/>` : ""}
      </svg>`;
    AVATAR_CACHE.set(seed, svg);
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

  /* ============================================================
     5. Son (WebAudio)
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
    tone(freq, dur = 0.15, type = "sine", gain = 0.12, delay = 0, slideTo = null) {
      const ctx = this.ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    },
    noise(dur = 0.2, gain = 0.08, delay = 0) {
      const ctx = this.ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime + delay;
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1700;
      const g = ctx.createGain();
      g.gain.value = gain;
      src.connect(filter).connect(g).connect(ctx.destination);
      src.start(t0);
    },
    click() { this.tone(440, 0.06, "square", 0.04); },
    toggle() { this.tone(720, 0.07, "triangle", 0.06); },
    roll() { for (let i = 0; i < 8; i++) this.noise(0.08, 0.045, i * 0.11); },
    land(i) { this.tone(520 + i * 90, 0.09, "triangle", 0.07); },
    win() {
      [0, 4, 7, 12].forEach((s, i) => this.tone(587.33 * Math.pow(2, s / 12), 0.26, "triangle", 0.11, i * 0.075));
      [0, 7, 12, 16].forEach((s, i) => this.tone(1174.66 * Math.pow(2, s / 12), 0.4, "sine", 0.08, 0.3 + i * 0.06));
    },
    lose() {
      this.tone(300, 0.2, "sawtooth", 0.06, 0, 170);
      this.tone(190, 0.28, "sine", 0.05, 0.09, 120);
    },
    draw() {
      this.tone(440, 0.12, "triangle", 0.07);
      this.tone(440, 0.12, "triangle", 0.06, 0.16);
    },
    coin() {
      this.tone(1180, 0.08, "square", 0.05);
      this.tone(1560, 0.12, "square", 0.045, 0.07);
    },
  };

  /* ============================================================
     6. Confettis
     ============================================================ */
  const Confetti = {
    canvas: null,
    ctx: null,
    parts: [],
    raf: null,
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
    burst(x, y, count = 80, palette = null, power = 1) {
      if (reducedMotion || !this.ctx) return;
      const colors = palette || ["#ff2fb9", "#a855f7", "#22e5ee", "#ffd35c", "#a3ff12", "#fff"];
      for (let i = 0; i < count; i++) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(3, 13) * power;
        this.parts.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - rand(1, 5),
          size: rand(3, 9),
          color: pick(colors),
          rot: rand(0, Math.PI * 2),
          vr: rand(-0.26, 0.26),
          life: 1,
          decay: rand(0.008, 0.019),
          shape: Math.random() > 0.35 ? "rect" : "circle",
        });
      }
      if (this.parts.length > 650) this.parts.splice(0, this.parts.length - 650);
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
          p.vy += 0.19;
          p.vx *= 0.992;
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vr;
          p.life -= p.decay;
          if (p.life <= 0 || p.y > window.innerHeight + 60) {
            this.parts.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.globalAlpha = clamp(p.life, 0, 1);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
            ctx.fill();
          }
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
     7. Toasts & annonces
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
      setTimeout(() => el.remove(), 320);
    }, opts.duration || 3200);
    while (stack.children.length > 4) stack.firstElementChild.remove();
  }

  function announce(text) {
    const el = $("#liveRegion");
    if (el) el.textContent = text;
  }

  function escapeLine(text) {
    return escapeHTML(text).replace(/@([\wÀ-ÿ-]+)/g, '<span class="mention">@$1</span>');
  }

  /* ============================================================
     8. Gemmes
     ============================================================ */
  let shownGems = null;
  let gemsRaf = null;

  function paintGems() {
    const value = shownGems == null ? state.gems : shownGems;
    ["#gemBalance", "#gemBalanceHeader", "#lockerGemBalance"].forEach((sel) => {
      const el = $(sel);
      if (el) el.textContent = fmt(value);
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
    const dur = 800;
    const step = (now) => {
      const t = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      shownGems = Math.round(from + (to - from) * eased);
      paintGems();
      if (t < 1) gemsRaf = requestAnimationFrame(step);
      else { shownGems = to; paintGems(); gemsRaf = null; }
    };
    gemsRaf = requestAnimationFrame(step);
  }

  function addGems(delta, { silent = false } = {}) {
    const from = state.gems;
    state.gems = clamp(Math.round(state.gems + delta), 0, 999999999);
    if (silent) {
      shownGems = state.gems;
      paintGems();
    } else {
      tweenGems(from, state.gems);
      if (delta !== 0) {
        const pill = $("#gemPill");
        if (pill) {
          pill.classList.remove("is-bumping");
          void pill.offsetWidth;
          pill.classList.add("is-bumping");
        }
      }
    }
    save();
  }

  /* ============================================================
     9. Rendu du profil
     ============================================================ */
  function renderProfile() {
    const p = state.player;
    const banner = byId(BANNERS, p.banner);
    const frame = byId(FRAMES, p.frame);
    const title = titleOf(p.title);

    const bannerEl = $("#profileBanner");
    if (bannerEl) {
      bannerEl.className = `banner ${banner.cls} h-[124px] sm:h-[142px]`;
      if (!bannerEl.querySelector(".banner-fx")) bannerEl.insertAdjacentHTML("afterbegin", '<div class="banner-fx"></div>');
    }

    ["#profileFrame", "#navFrame", "#duelFrameMe"].forEach((sel) => {
      const el = $(sel);
      if (!el) return;
      const sizes = { "#profileFrame": "h-[84px] w-[84px] sm:h-[96px] sm:w-[96px]", "#navFrame": "h-9 w-9", "#duelFrameMe": "h-[52px] w-[52px]" };
      const extra = sel === "#navFrame" || sel === "#duelFrameMe" ? "" : "";
      el.className = `frame ${frameCls(p.frame)} ${sizes[sel]} ${extra}`.trim();
      el.style.padding = sel === "#profileFrame" ? "3px" : "2px";
    });

    ["#profileAvatar", "#navAvatar", "#duelAvatarMe", "#lockerHeroAvatar"].forEach((sel) => {
      const el = $(sel);
      if (el) {
        el.setAttribute("data-avatar", p.name);
        paintAvatar(el, p.name);
      }
    });

    const show = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
    show("#profileName", p.name);
    show("#navName", p.name);
    show("#duelNameMe", p.name);
    show("#lockerHeroName", p.name);
    show("#profileID", p.id);
    show("#levelValue", p.level);
    show("#levelXpLabel", p.level);

    const titleHTML = `${title.icon} ${title.name}`;
    show("#profileTitleText", title.name);
    const profileTitle = $("#profileTitle");
    if (profileTitle) profileTitle.className = `title-chip ${TITLE_CLASS[title.rarity] || ""}`;
    const navTitle = $("#navTitle");
    if (navTitle) {
      navTitle.textContent = title.name;
      navTitle.className = `text-[0.58rem] font-bold ${title.rarity === "legendary" ? "text-amber-300/90" : title.rarity === "mythic" ? "text-fuchsia-300/90" : "text-violet-300/85"}`;
    }
    const duelTitle = $("#duelTitleMe");
    if (duelTitle) {
      duelTitle.textContent = titleHTML;
      duelTitle.className = `title-chip ${TITLE_CLASS[title.rarity] || ""} !px-1.5 !py-0 !text-[0.52rem] mt-0.5`;
    }
    const lockerTitle = $("#lockerHeroTitle");
    if (lockerTitle) {
      lockerTitle.textContent = titleHTML;
      lockerTitle.className = `title-chip ${TITLE_CLASS[title.rarity] || ""} mt-0.5 !py-0 !text-[0.54rem]`;
    }

    const xpPct = clamp((p.xp / 50000) * 100, 0, 100);
    const xpFill = $("#xpFill");
    if (xpFill) xpFill.style.width = `${xpPct}%`;
    show("#xpNow", fmt(p.xp));

    const s = state.stats;
    show("#statPlayed", fmt(s.played));
    show("#statStreak", "");
    const statStreak = $("#statStreak");
    if (statStreak) statStreak.innerHTML = `${s.streak} <span class="text-[0.62rem] font-bold text-emerald-300">🔥</span>`;
    const statWins = $("#statWins");
    if (statWins) statWins.innerHTML = `${fmt(s.wins)} <span class="text-[0.58rem] font-bold text-emerald-300">${s.played ? Math.round((s.wins / s.played) * 100) + "%" : ""}</span>`;
    const statBest = $("#statBest");
    if (statBest) statBest.innerHTML = `<svg class="gem-sm"><use href="#i-gem" /></svg>${fmtShort(s.bestPot)}`;
    show("#headerStreak", String(s.streak));
    show("#roundNumber", String(state.round || 1));

    const arena = $("#arena");
    if (arena) arena.dataset.skin = p.skin;

    paintGems();
    save();
  }

  /* ============================================================
     10. Bot adverse
     ============================================================ */
  function makeBot(excludeName) {
    let name = pick(BOT_NAMES);
    let guard = 0;
    while (name === excludeName && guard++ < 12) name = pick(BOT_NAMES);
    return {
      name,
      frame: pick(FRAMES.filter((f) => f.id !== "epic")).id,
      banner: pick(BANNERS.filter((b) => b.id !== "nebula")).id,
      title: pick(TITLES.filter((t) => t.id !== "rookie")).id,
      online: Math.random() > 0.25,
    };
  }

  function renderBot() {
    if (!currentBot) currentBot = makeBot();
    const b = currentBot;

    const bannerEl = $("#duelBannerBot");
    if (bannerEl) {
      bannerEl.className = `duel-banner banner ${bannerCls(b.banner)}`;
      if (!bannerEl.querySelector(".banner-fx")) bannerEl.insertAdjacentHTML("afterbegin", '<div class="banner-fx"></div>');
    }
    const frameEl = $("#duelFrameBot");
    if (frameEl) {
      frameEl.className = `frame ${frameCls(b.frame)} h-[52px] w-[52px]`;
      frameEl.style.padding = "2px";
    }
    const av = $("#duelAvatarBot");
    if (av) {
      av.setAttribute("data-avatar", b.name);
      paintAvatar(av, b.name);
    }
    const nameEl = $("#duelNameBot");
    if (nameEl) nameEl.textContent = b.name;
    const t = titleOf(b.title);
    const titleEl = $("#duelTitleBot");
    if (titleEl) {
      titleEl.textContent = `${t.icon} ${t.name}`;
      titleEl.className = `title-chip ${TITLE_CLASS[t.rarity] || ""} !px-1.5 !py-0 !text-[0.52rem] mt-0.5`;
    }
    const online = $("#botOnline");
    if (online) online.textContent = b.online ? "en ligne" : "absent";
  }

  /* ============================================================
     11. Mise & pot
     ============================================================ */
  function maxBet() {
    return Math.max(MIN_BET, Math.min(MAX_BET, state.gems));
  }

  function computeBotBet(bet) {
    const jitter = rand(0.95, 1.05);
    return Math.max(MIN_BET, Math.round((bet * jitter) / 100) * 100);
  }

  function setBet(value, { silent = false } = {}) {
    if (busy) return;
    let v = value === "max" ? maxBet() : Number(value);
    if (!Number.isFinite(v)) v = state.bet;
    v = clamp(Math.round(v / 100) * 100, MIN_BET, Math.max(MIN_BET, maxBet()));
    state.bet = v;
    botBet = computeBotBet(v);
    renderBet();
    if (!silent) Sound.click();
    save();
  }

  function renderBet() {
    const bet = state.bet;
    $$("#betChips [data-bet]").forEach((btn) => {
      const v = btn.dataset.bet;
      const active = v === "max" ? bet >= maxBet() : Number(v) === bet;
      btn.classList.toggle("is-active", active);
      if (v === "max") btn.innerHTML = `MAX <span class="text-[0.55rem] opacity-70">${fmtShort(maxBet())}</span>`;
      btn.disabled = busy;
    });
    const input = $("#customBet");
    if (input && document.activeElement !== input) input.value = bet;
    if (input) input.disabled = busy;

    const pot = bet + botBet;
    const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
    set("#myBetDisplay", fmt(bet));
    set("#botBetDisplay", fmt(botBet));
    set("#potValue", fmt(pot));
  }

  /* ============================================================
     12. Grille des 6 couleurs
     ============================================================ */
  function renderColorGrid() {
    const grid = $("#colorGrid");
    if (!grid) return;
    const revealed = Array.isArray(botPick);
    const mine = state.pick;

    grid.innerHTML = COLORS.map((c, i) => {
      const isMine = mine.includes(c.id);
      const isBot = revealed && botPick.includes(c.id);
      const isNeutral = revealed && !isMine && !isBot;
      const cls = [
        "color-card",
        isMine ? "is-mine" : "",
        isBot ? "is-bot" : "",
        isNeutral ? "is-neutral" : "",
      ].filter(Boolean).join(" ");

      let stateText = isMine ? "Ton dé" : isBot ? "Dé du bot" : isNeutral ? "Neutre" : "Disponible";
      if (!revealed && !isMine) stateText = "Libre";

      return `
        <button type="button" class="${cls}" data-color="${c.id}" data-index="${i}"
          aria-pressed="${isMine}" ${busy ? "disabled" : ""} title="${c.name} — appuie pour sélectionner">
          <span class="color-mark">${c.short}</span>
          <span class="c-name">${c.name}</span>
          <span class="c-state">${stateText}</span>
        </button>`;
    }).join("");

    const count = $("#pickCount");
    if (count) count.textContent = `(${state.pick.length}/2)`;
  }

  function toggleColor(id) {
    if (busy || !COLOR_BY_ID[id]) return;
    const idx = state.pick.indexOf(id);
    if (idx !== -1) {
      state.pick.splice(idx, 1);
    } else if (state.pick.length < 2) {
      state.pick.push(id);
    } else {
      state.pick.shift();
      state.pick.push(id);
    }
    // nouvelle sélection → nouveau duel : le bot reprend ses couleurs au lancement
    botPick = null;
    resetDiceToIdle();
    renderColorGrid();
    renderBet();
    Sound.toggle();
    save();
  }

  /* ============================================================
     13. Dés 3D
     ============================================================ */
  const PIP_LAYOUT = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
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
  const FACE_ROTATION = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: -90 },
    3: { x: -90, y: 0 },
    4: { x: 90, y: 0 },
    5: { x: 0, y: 90 },
    6: { x: 0, y: 180 },
  };

  function buildCube(cubeEl) {
    const faces = [];
    for (let f = 0; f < 6; f++) {
      const pips = PIP_LAYOUT[FACE_VALUES[f]];
      let cells = "";
      for (let c = 0; c < 9; c++) cells += `<span class="pip ${pips.includes(c) ? "on" : ""}"></span>`;
      faces.push(`<div class="die-face" style="transform: ${FACE_TRANSFORMS[f]}">${cells}</div>`);
    }
    cubeEl.innerHTML = faces.join("");
  }

  function buildDice() {
    $$(".die-cube").forEach((cube) => {
      buildCube(cube);
      cube.style.transform = "rotateX(-16deg) rotateY(-24deg)";
    });
    $$(".die").forEach((die) => { die.className = "die die-color-unknown"; });
  }

  function setCubeFace(cube, value, animate = true) {
    const rot = FACE_ROTATION[value] || FACE_ROTATION[1];
    const extra = 1440;
    cube.style.transition = animate ? "transform .72s cubic-bezier(.16,.9,.28,1.06)" : "none";
    cube.style.transform = `rotateX(${rot.x + extra - 8}deg) rotateY(${rot.y + extra + 6}deg)`;
    cube.dataset.value = String(value);
  }

  const dieSlots = () => $$("#tray .die-slot");

  function resetDiceToIdle() {
    dieSlots().forEach((slot, i) => {
      slot.className = "die-slot is-idle";
      slot.style.animation = "";
      slot.removeAttribute("data-owner");
      const die = slot.querySelector(".die");
      if (die) die.className = "die die-color-unknown";
      const tag = slot.querySelector(".die-tag");
      if (tag) {
        tag.textContent = "?";
        tag.className = "die-tag";
      }
    });
    const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
    set("#myScore", "0");
    set("#botScore", "0");
    set("#scoreMine", "Toi 0");
    set("#scoreBot", "Bot 0");
    const halo = $("#arenaHalo");
    if (halo) halo.className = "arena-halo";
  }

  let strobe = [];

  function startTumble() {
    strobe.forEach((t) => clearInterval(t));
    strobe = [];
    dieSlots().forEach((slot, i) => {
      slot.className = "die-slot is-tumbling";
      const die = slot.querySelector(".die");
      const cube = slot.querySelector(".die-cube");
      if (die) die.className = "die die-color-unknown";
      if (cube) cube.style.transition = "none";
      const tag = slot.querySelector(".die-tag");
      if (tag) {
        tag.textContent = "…";
        tag.className = "die-tag";
      }
      strobe[i] = setInterval(() => {
        if (die) die.className = `die die-color-${pick(COLORS).id}`;
      }, 105);
    });
    const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
    set("#myScore", "0");
    set("#botScore", "0");
    set("#scoreMine", "Toi 0");
    set("#scoreBot", "Bot 0");
    const halo = $("#arenaHalo");
    if (halo) halo.className = "arena-halo";
  }

  function stopTumble() {
    strobe.forEach((t) => clearInterval(t));
    strobe = [];
    dieSlots().forEach((slot) => {
      slot.classList.remove("is-tumbling");
      slot.style.animation = "";
    });
  }

  function ownerOf(color) {
    if (state.pick.includes(color)) return "me";
    if (botPick && botPick.includes(color)) return "bot";
    return "neutral";
  }

  async function revealDice(dice) {
    const slots = dieSlots();
    let my = 0;
    let bot = 0;
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const color = dice[i];
      const owner = ownerOf(color);
      if (owner === "me") my++;
      if (owner === "bot") bot++;

      slot.classList.remove("is-tumbling", "is-idle");
      slot.style.animation = "none";
      slot.classList.add(owner === "me" ? "is-mine" : owner === "bot" ? "is-bot" : "is-neutral");

      const die = slot.querySelector(".die");
      if (die) die.className = `die die-color-${color}`;
      const cube = slot.querySelector(".die-cube");
      if (cube) setCubeFace(cube, REVEAL_VALUES[i % REVEAL_VALUES.length], true);

      const tag = slot.querySelector(".die-tag");
      if (tag) {
        const label = owner === "me" ? "Toi" : owner === "bot" ? "Bot" : "Neutre";
        tag.textContent = `${COLOR_BY_ID[color].name} · ${label}`;
        tag.className = "die-tag";
      }
      slot.classList.add("is-reveal");

      const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
      set("#myScore", String(my));
      set("#botScore", String(bot));
      set("#scoreMine", `Toi ${my}`);
      set("#scoreBot", `Bot ${bot}`);

      Sound.land(i);
      await sleep(reducedMotion ? 40 : 190);
    }
    return { my, bot };
  }

  function markWinners(dice, winner) {
    const slots = dieSlots();
    slots.forEach((slot, i) => {
      const owner = ownerOf(dice[i]);
      const isWinnerDie = (winner === "me" && owner === "me") || (winner === "bot" && owner === "bot");
      slot.classList.toggle("is-winner", isWinnerDie);
      slot.classList.toggle("is-loser", owner !== "neutral" && !isWinnerDie);
    });
    const halo = $("#arenaHalo");
    if (halo) halo.className = `arena-halo ${winner === "me" ? "is-mine" : winner === "bot" ? "is-bot" : "is-draw"}`;
    if (winner === "me") $("#myDuelCard") && $("#myDuelCard").classList.add("is-winner");
    if (winner === "bot") $("#botDuelCard") && $("#botDuelCard").classList.add("is-winner");
  }

  /* ============================================================
     14. Verdict & effets
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
    const cls = kind === "win" ? "is-win" : kind === "lose" ? "is-lose" : "is-draw";
    host.innerHTML = `
      <div class="verdict ${cls}">
        <p class="text-[0.56rem] font-extrabold uppercase tracking-[0.2em] text-white/50">${kind === "win" ? "Duel remporté" : kind === "lose" ? "Duel perdu" : "Égalité"}</p>
        <p class="verdict-title">${title}</p>
        <div class="verdict-score">
          <span class="text-cyan-300">${my}</span>
          <span class="text-[0.7rem] text-white/35">—</span>
          <span class="text-rose-300">${bot}</span>
        </div>
        <p class="mt-1 text-[0.7rem] font-semibold text-white/70">${detail}</p>
      </div>`;
  }

  function spawnSparks(x, y, colors, count = 24) {
    const host = $("#sparkHost");
    if (!host || reducedMotion) return;
    const rect = host.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      const angle = rand(0, Math.PI * 2);
      const dist = rand(40, 180);
      s.style.setProperty("--x", `${x - rect.left}px`);
      s.style.setProperty("--y", `${y - rect.top}px`);
      s.style.setProperty("--s", `${rand(3, 8).toFixed(1)}px`);
      s.style.setProperty("--c", pick(colors));
      s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      s.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      s.style.setProperty("--d", `${rand(0.5, 1).toFixed(2)}s`);
      host.appendChild(s);
      setTimeout(() => s.remove(), 1150);
    }
  }

  function spawnRing(color) {
    const host = $("#sparkHost");
    if (!host || reducedMotion) return;
    const ring = document.createElement("div");
    ring.className = "flash-ring";
    ring.style.setProperty("--ring", color);
    host.appendChild(ring);
    setTimeout(() => ring.remove(), 900);
  }

  function floatGain(text, color, top = "36%") {
    const host = $("#arena");
    if (!host) return;
    const el = document.createElement("div");
    el.className = "float-gain";
    el.textContent = text;
    el.style.color = color;
    el.style.left = "50%";
    el.style.top = top;
    host.appendChild(el);
    setTimeout(() => el.remove(), 1550);
  }

  function goldFlash() {
    if (reducedMotion) return;
    const el = document.createElement("div");
    el.className = "gold-flash";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  /* ============================================================
     15. Le duel
     ============================================================ */
  let diceSource = null;

  function rollFour() {
    const dice = diceSource ? diceSource() : Array.from({ length: 4 }, () => pick(COLORS).id);
    // garde-fou : uniquement des couleurs valides, exactement 4 dés
    return Array.from({ length: 4 }, (_, i) => (COLOR_BY_ID[dice[i]] ? dice[i] : pick(COLORS).id));
  }

  function scoreFor(dice, colors) {
    return dice.filter((d) => colors.includes(d)).length;
  }

  function setStatus(text) {
    const el = $("#arenaStatus");
    if (el) el.textContent = text;
  }

  function setBusy(value) {
    busy = value;
    const btn = $("#duelBtn");
    if (btn) {
      btn.disabled = value;
      btn.classList.toggle("is-rolling", value);
    }
    const label = $("#duelLabel");
    if (label) {
      label.textContent = value ? (phase === "rolling" ? "Les dés tournent…" : "Tirage…") : "Lancer le duel";
      label.classList.toggle("animate-flashLabel", value);
    }
    renderBet();
    renderColorGrid();
  }

  async function startDuel() {
    if (busy) return;
    if (state.pick.length !== 2) {
      toast("Choisis <b>2 couleurs</b> avant de lancer le duel.", { icon: "🎨", kind: "gold" });
      $("#colorGrid").classList.add("arena-shake");
      setTimeout(() => $("#colorGrid").classList.remove("arena-shake"), 450);
      Sound.lose();
      return;
    }
    if (state.gems < MIN_BET) {
      toast("Plus assez de gemmes pour miser : recharge 💎", { icon: "💸", kind: "gold" });
      Sound.lose();
      return;
    }
    if (state.bet > state.gems) setBet(state.gems, { silent: true });
    const bet = state.bet;

    // bot : nouveau profil + 2 couleurs parmi les 4 restantes (jamais les mêmes que le joueur)
    currentBot = makeBot(currentBot ? currentBot.name : null);
    const remaining = shuffle(COLORS.filter((c) => !state.pick.includes(c.id)).map((c) => c.id));
    botPick = remaining.slice(0, 2);
    botBet = computeBotBet(bet);
    renderBot();

    const pot = bet + botBet;
    busy = true;
    phase = "rolling";
    setBusy(true);
    clearVerdict();
    state.round += 1;
    renderProfile();
    renderBot();
    renderBet();
    renderColorGrid();

    $("#myDuelCard").classList.remove("is-winner", "is-loser");
    $("#botDuelCard").classList.remove("is-winner", "is-loser");

    // la mise part dans le pot
    addGems(-bet);
    Sound.roll();
    setStatus("Les dés tournent…");

    let attempt = 0;
    let finalResult = null;
    let lastDice = null;

    while (attempt < 12) {
      attempt += 1;
      startTumble();
      $("#arena").classList.add("arena-shake");
      await sleep(reducedMotion ? 220 : 1400);
      $("#arena").classList.remove("arena-shake");
      if (attempt > 1) Sound.roll();

      stopTumble();
      const dice = rollFour();
      lastDice = dice;
      const myScore = scoreFor(dice, state.pick);
      const botScore = scoreFor(dice, botPick);
      await revealDice(dice);

      if (myScore === botScore) {
        phase = "revealing";
        setStatus("Égalité ! Nouveau tirage automatique…");
        showVerdict({
          kind: "draw",
          title: "ÉGALITÉ",
          my: myScore,
          bot: botScore,
          detail: "Personne ne marque — le tirage se relance automatiquement.",
        });
        Sound.draw();
        await sleep(reducedMotion ? 400 : 1350);
        clearVerdict();
        await sleep(120);
        continue;
      }

      finalResult = { dice, myScore, botScore, win: myScore > botScore, attempt, pot, bet, botBet };
      break;
    }

    if (!finalResult) {
      // sécurité : trop d'égalités d'affilée → remboursement
      clearVerdict();
      stopTumble();
      resetDiceToIdle();
      addGems(bet);
      busy = false;
      phase = "idle";
      setBusy(false);
      toast("Égalités en série : mise remboursée.", { icon: "🎯" });
      setStatus("Choisis 2 couleurs, puis lance le duel 🎲");
      return;
    }

    // --------- règlement ---------
    const { myScore, botScore, win, dice } = finalResult;
    markWinners(dice, win ? "me" : "bot");
    phase = "result";

    const arena = $("#arena").getBoundingClientRect();
    const cx = arena.left + arena.width / 2;
    const cy = arena.top + arena.height * 0.45;

    const show = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
    show("#myScore", String(myScore));
    show("#botScore", String(botScore));
    show("#scoreMine", `Toi ${myScore}`);
    show("#scoreBot", `Bot ${botScore}`);

    if (win) {
      state.stats.wins += 1;
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
      state.stats.bestPot = Math.max(state.stats.bestPot, pot);
      addGems(pot);
      Sound.win();
      Confetti.burst(cx, cy, 110, ["#ffd35c", "#fff3c4", "#ff2fb9", "#22e5ee", "#fff"], 1.15);
      goldFlash();
      spawnSparks(cx, cy, ["#ffd35c", "#fff", "#ff2fb9"], 34);
      spawnRing("#ffd35c");
      floatGain(`+${fmt(pot)}`, "#a3ff12", "34%");
      showVerdict({
        kind: "win",
        title: "VICTOIRE !",
        my: myScore,
        bot: botScore,
        detail: `Tu rafles le pot de <b>${fmt(pot)}</b> gemmes (+${fmt(pot - bet)} net).`,
      });
      setStatus("Tu remportes le pot ! 🏆");
      announce(`Victoire ${myScore} à ${botScore}. Tu gagnes ${fmt(pot)} gemmes.`);
    } else {
      state.stats.losses += 1;
      state.stats.streak = 0;
      Sound.lose();
      spawnRing("#ff3b6b");
      showVerdict({
        kind: "lose",
        title: "DÉFAITE",
        my: myScore,
        bot: botScore,
        detail: `${currentBot.name} rafle le pot de <b>${fmt(pot)}</b> gemmes.`,
      });
      setStatus(`${currentBot.name} remporte le pot… retente ta chance !`);
      announce(`Défaite ${myScore} à ${botScore}. Le bot gagne le pot.`);
    }

    state.stats.played += 1;
    state.stats.wagered += bet;

    // XP
    const gainedXp = (win ? 180 : 60) + Math.round(bet / 30);
    state.player.xp += gainedXp;
    if (state.player.xp >= 50000) {
      state.player.xp -= 50000;
      state.player.level += 1;
      toast(`Niveau <b>${state.player.level}</b> atteint ! 🎉`, { kind: "gold", icon: "⬆️" });
    }

    // historique & dernier duel
    const entry = {
      outcome: win ? "win" : "lose",
      pot,
      bet,
      botBet,
      myScore,
      botScore,
      myColors: [...state.pick],
      botColors: [...botPick],
      dice: dice.slice(),
      retries: finalResult.attempt - 1,
      opponent: currentBot.name,
      ts: Date.now(),
    };
    state.history.unshift(entry);
    state.history = state.history.slice(0, 14);
    state.lastDuel = entry;

    renderProfile();
    renderHistory();
    renderLastDuel();
    renderColorGrid();
    save();

    clearVerdict(2400);
    setStatus(win ? "Tu remportes le pot ! 🏆" : "Perds pas le rythme, retente 🎲");

    // petit verrou pour laisser le verdict s'afficher, puis on peut rejouer
    setTimeout(() => {
      if (busy) {
        busy = false;
        phase = "idle";
        setBusy(false);
        const idle = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
        idle("#myScore", "0");
        idle("#botScore", "0");
        idle("#scoreMine", "Toi 0");
        idle("#scoreBot", "Bot 0");
        setStatus("Choisis 2 couleurs, puis lance le duel 🎲");
      }
    }, 1400);
  }

  /* ============================================================
     16. Historique & dernier duel
     ============================================================ */
  function colorChip(id, extra = "") {
    const c = COLOR_BY_ID[id] || COLORS[0];
    return `<span class="hist-mini" style="background:linear-gradient(150deg, ${c.hex}, ${c.dark});${extra}" title="${c.name}">${c.short}</span>`;
  }

  function renderHistory() {
    const host = $("#historyList");
    if (!host) return;
    if (!state.history.length) {
      host.innerHTML = `<p class="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-2.5 py-3 text-center text-[0.64rem] font-semibold text-violet-200/40">Tes duels apparaîtront ici.</p>`;
      return;
    }
    host.innerHTML = state.history.map((h) => {
      const win = h.outcome === "win";
      const sign = win ? "+" : "−";
      return `
        <div class="hist-item">
          <span class="flex -space-x-1">
            ${h.myColors.map((c) => colorChip(c)).join("")}
          </span>
          <span class="min-w-0 flex-1 truncate ${win ? "hist-win" : "hist-lose"}">${win ? "Victoire" : "Défaite"} · ${h.myScore}–${h.botScore}</span>
          <span class="flex items-center gap-0.5 ${win ? "hist-win" : "hist-lose"}">
            ${sign}${fmtShort(win ? h.pot : h.bet)} <svg class="gem-sm !h-3 !w-3"><use href="#i-gem" /></svg>
          </span>
        </div>`;
    }).join("");
  }

  function renderLastDuel() {
    const host = $("#lastDuel");
    const label = $("#lastRoundLabel");
    if (label) label.textContent = `Manche ${state.round || "—"}`;
    if (!host) return;
    const d = state.lastDuel;
    if (!d) {
      host.innerHTML = `<p class="text-[0.68rem] font-semibold text-violet-200/50">Aucun duel joué pour l'instant. Choisis 2 couleurs et lance-toi !</p>`;
      return;
    }
    const win = d.outcome === "win";
    host.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <span class="text-[0.56rem] font-extrabold uppercase tracking-[0.14em] ${win ? "text-emerald-300" : "text-rose-300"}">${win ? "Victoire" : "Défaite"}</span>
        <span class="flex items-center gap-0.5 text-[0.72rem] font-extrabold ${win ? "text-amber-300" : "text-rose-300"}">
          ${win ? "+" : "−"}${fmt(win ? d.pot : d.bet)} <svg class="gem-sm !h-3 !w-3"><use href="#i-gem" /></svg>
        </span>
      </div>
      <div class="mt-2 flex items-center gap-2">
        <div class="flex-1 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-2 py-1">
          <p class="text-[0.5rem] font-extrabold uppercase tracking-wider text-cyan-200/70">Toi · ${d.myScore}</p>
          <div class="mt-1 flex gap-1">${d.myColors.map((c) => colorChip(c)).join("")}</div>
        </div>
        <span class="font-display text-[0.6rem] text-white/30">VS</span>
        <div class="flex-1 rounded-lg border border-rose-300/25 bg-rose-400/10 px-2 py-1">
          <p class="text-[0.5rem] font-extrabold uppercase tracking-wider text-rose-200/70">${escapeHTML(d.opponent)} · ${d.botScore}</p>
          <div class="mt-1 flex gap-1">${d.botColors.map((c) => colorChip(c)).join("")}</div>
        </div>
      </div>
      <div class="mt-2 flex items-center justify-between gap-2">
        <span class="flex items-center gap-1 text-[0.58rem] font-bold text-violet-200/55">
          Pot <svg class="gem-sm !h-3 !w-3"><use href="#i-gem" /></svg>${fmt(d.pot)}
        </span>
        <span class="text-[0.54rem] font-semibold text-violet-200/40">${d.retries ? `${d.retries} relance${d.retries > 1 ? "s" : ""}` : "duel direct"}</span>
      </div>`;
  }

  /* ============================================================
     17. Chat
     ============================================================ */
  const chat = {
    el: null,
    seed() {
      this.el = $("#chatList");
      if (!this.el) return;
      this.el.innerHTML = "";
      this.addSystem("Salon Néon — flex autorisé 💎");
      const intros = shuffle(BOT_NAMES).slice(0, 3);
      intros.forEach((name, i) => {
        setTimeout(() => {
          this.addBot({
            name,
            frame: pick(FRAMES).id,
            title: pick(TITLES).id,
            text: pick([
              "Salut le salon 👋 qui veut un 1v1 ?",
              "Je viens de rafler un pot de 12k 😳",
              "Nouveau cadre équipé, avis ?",
            ]),
            win: i === 0 ? { color: pick(COLORS).id, amount: randInt(500, 6000) } : null,
          });
        }, 400 + i * 850);
      });
      this.later();
    },
    addSystem(text) {
      if (!this.el) return;
      const div = document.createElement("div");
      div.className = "chat-day";
      div.textContent = text;
      this.el.appendChild(div);
      this.scroll();
    },
    addBot({ name, frame = "rare", title = "rookie", text, win = null, me = false }) {
      if (!this.el) return;
      const div = document.createElement("div");
      div.className = `chat-msg ${me ? "is-me" : ""}`;
      const t = titleOf(title);
      div.innerHTML = `
        <div class="flex-none">
          <span class="frame ${frameCls(frame)}" style="width:30px;height:30px;padding:2px">
            <span class="frame-ring"></span>
            <span class="frame-avatar" data-avatar="${escapeHTML(name)}"></span>
          </span>
        </div>
        <div class="msg-body">
          <div class="chat-name">
            <span>${escapeHTML(name)}</span>
            <span class="title-chip ${TITLE_CLASS[t.rarity] || ""} !px-1 !py-0 !text-[0.48rem]">${t.icon} ${t.name}</span>
          </div>
          <div class="chat-bubble">${text}</div>
          ${win ? `<div class="chat-win" style="--w:${COLOR_BY_ID[win.color].hex}"><span class="dot"></span> Pot remporté · +${fmt(win.amount)} <svg class="h-2.5 w-2.5"><use href="#i-gem" /></svg></div>` : ""}
        </div>`;
      this.el.appendChild(div);
      hydrateAvatars(div);
      if (this.el.children.length > 60) this.el.firstElementChild.remove();
      this.scroll();
    },
    scroll() {
      if (!this.el) return;
      this.el.scrollTop = this.el.scrollHeight;
    },
    later() {
      setTimeout(() => {
        if (!document.hidden) {
          const line = pick(CHAT_LINES);
          const target = pick(BOT_NAMES);
          this.addBot({
            name: pick(BOT_NAMES),
            frame: pick(FRAMES).id,
            title: pick(TITLES).id,
            text: escapeLine(line.includes("{name}") ? line.replace("{name}", target) : line),
            win: Math.random() > 0.5 ? { color: pick(COLORS).id, amount: randInt(300, 9000) } : null,
          });
        }
        this.later();
      }, randInt(7000, 14000));
    },
  };

  /* ============================================================
     18. Vestiaire
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
    if (kind === "banners") {
      preview = `<div class="absolute inset-0 banner ${item.cls}"><div class="banner-fx"></div></div>`;
    } else if (kind === "frames") {
      preview = `<span class="frame ${frameCls(item.id)}" style="width:50px;height:50px;padding:3px">
        <span class="frame-ring"></span>
        <span class="frame-avatar" data-avatar="${escapeHTML(state.player.name)}"></span>
      </span>`;
    } else if (kind === "titles") {
      preview = `<span class="title-chip ${TITLE_CLASS[item.rarity] || ""} !text-[0.6rem] max-w-[92%] truncate">${item.icon} ${item.name}</span>`;
    } else {
      preview = `<span class="skin-swatch ${item.swatch}"></span>`;
    }

    let action = "";
    if (equipped) {
      action = `<button type="button" class="btn btn-ghost !w-full !py-1 !text-[0.6rem] cursor-default" disabled><svg class="icon h-3 w-3 text-emerald-300"><use href="#i-check" /></svg> Équipé</button>`;
    } else if (owned) {
      action = `<button type="button" class="btn btn-primary !w-full !py-1 !text-[0.6rem]" data-equip="${kind}|${item.id}">Équiper</button>`;
    } else {
      action = `<button type="button" class="btn btn-gold !w-full !py-1 !text-[0.6rem]" data-buy="${kind}|${item.id}" ${state.gems < item.price ? "disabled" : ""}>
        <svg class="icon h-3 w-3"><use href="#i-lock" /></svg> ${state.gems < item.price ? "Trop cher" : "Acheter"}
      </button>`;
    }

    return `
      <article class="cosmetic-card ${equipped ? "is-equipped" : ""}">
        <div class="cosmetic-preview" style="${kind === "banners" ? "" : "background:linear-gradient(160deg,rgba(255,255,255,.05),rgba(255,255,255,.01))"}">
          ${preview}
          ${equipped ? `<span class="absolute right-1.5 top-1.5 z-10 rounded-full bg-emerald-400/90 px-1.5 py-0.5 text-[0.48rem] font-black text-emerald-950">ÉQUIPÉ</span>` : ""}
          ${!owned ? `<span class="absolute right-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white/80"><svg class="h-3 w-3"><use href="#i-lock" /></svg></span>` : ""}
        </div>
        <div class="cosmetic-info">
          <div class="flex items-start justify-between gap-1">
            <span class="cosmetic-name">${item.name}</span>
            ${!owned ? `<span class="flex items-center gap-0.5 text-[0.6rem] font-extrabold text-amber-300"><svg class="gem-sm !h-3 !w-3"><use href="#i-gem" /></svg>${fmt(item.price)}</span>` : ""}
          </div>
          <span class="rarity rarity-${item.rarity}">${RARITY_LABEL[item.rarity]}</span>
          <p class="text-[0.56rem] leading-tight text-violet-200/45">${item.desc || ""}</p>
          ${action}
        </div>
      </article>`;
  }

  function renderLocker() {
    const grid = $("#lockerGrid");
    if (!grid) return;
    const list = CATALOG[lockerTab];
    grid.innerHTML = list.map((item) => cosmeticCard(lockerTab, item)).join("");
    hydrateAvatars(grid);

    const total = Object.values(CATALOG).reduce((n, l) => n + l.length, 0);
    const ownedCount = Object.keys(CATALOG).reduce((n, k) => n + state.owned[k].length, 0);
    const oc = $("#lockerOwnedCount");
    if (oc) oc.textContent = String(ownedCount);
    const tc = $("#lockerTotalCount");
    if (tc) tc.textContent = String(total);

    const p = state.player;
    const heroBanner = $("#lockerHeroBanner");
    if (heroBanner) {
      heroBanner.className = `hero-banner banner ${bannerCls(p.banner)}`;
      heroBanner.innerHTML = '<div class="banner-fx"></div>';
    }
    const heroFrame = $("#lockerHeroFrame");
    if (heroFrame) {
      heroFrame.className = `frame ${frameCls(p.frame)} h-[60px] w-[60px] flex-none`;
      const ring = heroFrame.querySelector(".frame-ring");
      if (ring) ring.outerHTML = '<span class="frame-ring"></span>';
    }
    const heroAvatar = $("#lockerHeroAvatar");
    if (heroAvatar) {
      heroAvatar.setAttribute("data-avatar", p.name);
      paintAvatar(heroAvatar, p.name);
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
    const first = modal.querySelector("[data-locker-tab].is-active");
    if (first) first.focus({ preventScroll: true });
  }

  function closeLocker() {
    const modal = $("#lockerModal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    lockerOpen = false;
    document.body.style.overflow = "";
    Sound.click();
    renderProfile();
    renderBot();
  }

  function equipCosmetic(kind, id) {
    const list = CATALOG[kind];
    if (!list || !list.some((i) => i.id === id) || !state.owned[kind].includes(id)) return;
    if (kind === "banners") state.player.banner = id;
    if (kind === "frames") state.player.frame = id;
    if (kind === "titles") state.player.title = id;
    if (kind === "skins") state.player.skin = id;
    toast(`<b>${byId(list, id).name}</b> équipé !`, { kind: "success", icon: "✨" });
    Sound.win();
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
      toast(`Il te manque <b>${fmt(item.price - state.gems)}</b> gemmes.`, { icon: "🔒", kind: "gold" });
      Sound.lose();
      return;
    }
    addGems(-item.price);
    state.owned[kind].push(id);
    toast(`<b>${item.name}</b> débloqué !`, { kind: "gold", icon: "🎁" });
    Sound.coin();
    const modal = $("#lockerModal").getBoundingClientRect();
    Confetti.burst(window.innerWidth / 2, modal.top + 110, 45, ["#ffd35c", "#fff3c4", "#ff9d2f", "#ff2fb9"], 0.8);
    renderLocker();
    renderProfile();
    save();
  }

  /* ============================================================
     19. Fairness & ticker
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

  function tickerItemHTML(e) {
    return `<span class="ticker-item">
      <span class="inline-block h-2 w-2 rounded-sm" style="background:${COLOR_BY_ID[e.color].hex};box-shadow:0 0 8px ${COLOR_BY_ID[e.color].hex}"></span>
      <b>${escapeHTML(e.name)}</b> a raflé un pot de <span class="amt">+${fmt(e.amt)}</span> <svg class="h-3 w-3"><use href="#i-gem" /></svg>
    </span>`;
  }

  function renderTicker() {
    const track = $("#tickerTrack");
    if (!track) return;
    if (!tickerEvents.length) {
      for (let i = 0; i < 14; i++) {
        tickerEvents.push({ name: pick(BOT_NAMES), color: pick(COLORS).id, amt: randInt(400, 48000) });
      }
    }
    const items = tickerEvents.map(tickerItemHTML).join("");
    track.innerHTML = items + items;
  }

  function pushTicker(name, color, amount) {
    tickerEvents.unshift({ name, color, amt: amount });
    if (tickerEvents.length > 18) tickerEvents.length = 18;
    const track = $("#tickerTrack");
    if (!track) return;
    const items = tickerEvents.map(tickerItemHTML).join("");
    track.innerHTML = items + items;
  }

  /* ============================================================
     20. Événements
     ============================================================ */
  function bindEvents() {
    $("#duelBtn").addEventListener("click", startDuel);

    $("#colorGrid").addEventListener("click", (e) => {
      const card = e.target.closest("[data-color]");
      if (!card) return;
      toggleColor(card.dataset.color);
    });

    $$("#betChips [data-bet]").forEach((btn) => {
      btn.addEventListener("click", () => setBet(btn.dataset.bet));
    });

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

    $("#fairBtn").addEventListener("click", () => {
      const hash = hashSeed(`${Date.now()}-${Math.random()}`).slice(0, 16);
      toast(`Provably fair · tirage <b class="font-mono text-[0.66rem] text-cyan-300">#${hash}</b><br><span class="text-white/55">4 dés · 6 couleurs équiprobables · égalité relancée</span>`, { icon: "🛡️", duration: 5200 });
      Sound.toggle();
    });

    $("#btnTopUp").addEventListener("click", () => {
      const bonus = 25000;
      addGems(bonus);
      toast(`<b>+${fmt(bonus)} gemmes</b> offertes 🎁`, { kind: "gold", icon: "💎" });
      Sound.coin();
      const rect = $("#gemPill").getBoundingClientRect();
      Confetti.burst(rect.left + rect.width / 2, rect.bottom + 8, 40, ["#ff2fb9", "#ffd35c", "#22e5ee"], 0.7);
      renderProfile();
      renderBet();
    });

    const soundBtn = $("#btnSound");
    const paintSound = () => {
      Sound.enabled = state.sound !== false;
      const icon = $("#soundIcon");
      if (icon) icon.setAttribute("href", Sound.enabled ? "#i-sound" : "#i-muted");
      if (soundBtn) {
        soundBtn.setAttribute("aria-pressed", String(Sound.enabled));
        soundBtn.classList.toggle("text-fuchsia-300", Sound.enabled);
      }
    };
    soundBtn.addEventListener("click", () => {
      state.sound = state.sound === false ? true : false;
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

    $$("[data-open-locker]").forEach((btn) => {
      btn.addEventListener("click", () => openLocker(btn.dataset.openLocker));
    });
    $$("[data-close-locker]").forEach((el) => el.addEventListener("click", closeLocker));

    $("#lockerModal").addEventListener("click", (e) => {
      const tab = e.target.closest("[data-locker-tab]");
      if (tab) {
        lockerTab = tab.dataset.lockerTab;
        $$("[data-locker-tab]").forEach((b) => {
          const on = b === tab;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", String(on));
        });
        renderLocker();
        Sound.click();
        return;
      }
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
      if (now - cooldown < 1000) return;
      const text = chatInput.value.trim();
      if (!text) return;
      cooldown = now;
      chat.addBot({
        name: state.player.name,
        frame: state.player.frame,
        title: state.player.title,
        text: escapeLine(text),
        me: true,
      });
      chatInput.value = "";
      Sound.click();
      setTimeout(() => {
        chat.addBot({
          name: pick(BOT_NAMES),
          frame: pick(FRAMES).id,
          title: pick(TITLES).id,
          text: pick([
            `@${state.player.name} tu tentes un 1v1 ? 🎲`,
            `GG @${state.player.name}, joli pot 👑`,
            "Ce cadre est une dinguerie 🔥",
            "Le salon est chaud ce soir 💎",
          ]),
        });
      }, randInt(1100, 2400));
    });

    $$("[data-quick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const map = {
          duel: "🎲 Qui veut un 1v1 ? Je mise 5k",
          flex: "💠 Regardez mon nouveau cadre, il brille de ouf !",
          pot: state.stats.bestPot ? `💎 Mon plus gros pot : ${fmt(state.stats.bestPot)} gemmes !` : "💎 Je chauffe, le gros pot arrive",
        };
        chatInput.value = map[btn.dataset.quick] || "";
        chatInput.focus();
        try { chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length); } catch { /* ignore */ }
      });
    });

    // clavier
    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || e.target.isContentEditable;
      if (e.key === "Escape" && lockerOpen) { closeLocker(); return; }
      if (typing) return;
      if (e.code === "Space") {
        e.preventDefault();
        startDuel();
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= 6) {
        e.preventDefault();
        toggleColor(COLORS[n - 1].id);
      } else if (e.key.toLowerCase() === "b") {
        openLocker(lockerTab);
      }
    });

    // mise à jour des avatars si la page revient du cache
    window.addEventListener("pageshow", () => hydrateAvatars());
  }

  /* ============================================================
     21. Ambiance
     ============================================================ */
  function startAmbient() {
    setInterval(() => {
      const el = $("#playersOnline");
      if (el) el.textContent = fmt(1240 + randInt(-40, 80));
      const c = $("#chatOnline");
      if (c) c.textContent = fmt(820 + randInt(-20, 60));
    }, 5200);

    setInterval(() => {
      if (document.hidden) return;
      pushTicker(pick(BOT_NAMES), pick(COLORS).id, randInt(300, 24000));
    }, 7000);
  }

  /* ============================================================
     22. Init
     ============================================================ */
  function init() {
    state = load();
    shownGems = state.gems;
    botBet = computeBotBet(state.bet);
    currentBot = makeBot();

    // aléa sur le profil du bot
    if (Math.random() > 0.5) {
      // garde un adversaire varié à chaque visite
      currentBot.online = true;
    }

    Confetti.init();
    buildDice();
    renderProfile();
    renderBot();
    renderColorGrid();
    renderBet();
    renderHistory();
    renderLastDuel();
    renderTicker();
    hydrateAvatars();
    bindEvents();
    chat.seed();
    startAmbient();
    renderLocker();
    setStatus("Choisis 2 couleurs, puis lance le duel 🎲");

    if (state.bet > state.gems) setBet(state.gems, { silent: true });
    save();
  }

  // Hook de test, uniquement avec ?debug dans l'URL
  if (new URLSearchParams(window.location.search).has("debug")) {
    window.__cd = {
      get state() { return state; },
      get busy() { return busy; },
      get phase() { return phase; },
      setDiceSource(fn) { diceSource = fn; },
      startDuel,
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
