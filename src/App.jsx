import { useEffect, useRef, useState, useCallback } from "react";
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const mulberry32 = (seed) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const PROFILE_LIST_KEY = "spacewaves_profiles";
const ACTIVE_PROFILE_KEY = "spacewaves_active_profile";
const makeProfileKey = (profileId, key) => `spacewaves_${profileId}_${key}`;

let rng = Math.random;
const setSeed = (seed) => {
  rng = mulberry32(seed >>> 0);
};

const rand = (min, max) => min + rng() * (max - min);
const pick = (list) => list[Math.floor(rng() * list.length)];
const scoreFromPercent = (percent) => Math.round(percent * 10);
const adjustColor = (hex, amount) => {
  if (!hex || hex[0] !== "#") return hex;
  const value = hex.length === 4
    ? `${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex.slice(1, 7);
  if (value.length !== 6) return hex;
  const r = clamp(Math.round(parseInt(value.slice(0, 2), 16) + 255 * amount), 0, 255);
  const g = clamp(Math.round(parseInt(value.slice(2, 4), 16) + 255 * amount), 0, 255);
  const b = clamp(Math.round(parseInt(value.slice(4, 6), 16) + 255 * amount), 0, 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
    .toString(16)
    .padStart(2, "0")}`;
};
const hexToRgba = (hex, alpha = 1) => {
  if (!hex || hex[0] !== "#") return `rgba(255,255,255,${alpha})`;
  const value = hex.length === 4
    ? `${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex.slice(1, 7);
  if (value.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const XP_BASE = 120;
const RANKS = [
  { name: "Rookie", min: 1 },
  { name: "Pilot", min: 4 },
  { name: "Ace", min: 8 },
  { name: "Nova", min: 12 },
  { name: "Stellar", min: 16 },
  { name: "Cosmic", min: 22 },
  { name: "Legend", min: 30 },
];
const xpForLevel = (level) => Math.floor(XP_BASE * level * level);
const levelFromXp = (xp) => {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) {
    level += 1;
  }
  return level;
};
const rankFromLevel = (level) => {
  for (let i = RANKS.length - 1; i >= 0; i -= 1) {
    if (level >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
};
const MAX_LEVEL_SPEED_BONUS = 120;
const SPIKE_HEIGHT_RATIO = Math.sqrt(3) / 2;
const SPIKE_SIZE_SCALE = 1.25;
const RECT_SPIKE_SCALE = 0.85;
const CHALLENGE_TARGETS = [22, 46, 70, 100];
const CHALLENGE_BASE_TIME = 11.5;
const TRAIL_STYLES = [
  { id: "trail-1", title: "Soft Streak", color: "#ff5fda", glow: "rgba(255, 90, 220, 0.6)", edge: "#ffffff" },
  { id: "trail-2", title: "Pulse Line", color: "#8bc4ff", glow: "rgba(139, 196, 255, 0.6)", edge: "#dfefff" },
  { id: "trail-3", title: "Star Glow", color: "#ffe26b", glow: "rgba(255, 226, 107, 0.6)", edge: "#fff6d6" },
  { id: "trail-4", title: "Vapor", color: "#7affd8", glow: "rgba(122, 255, 216, 0.55)", edge: "#e6fff7" },
  { id: "trail-5", title: "Nebula", color: "#b56bff", glow: "rgba(181, 107, 255, 0.55)", edge: "#efe3ff" },
  { id: "trail-6", title: "Ion Trace", color: "#ff9448", glow: "rgba(255, 148, 72, 0.55)", edge: "#ffe4cf" },
  { id: "trail-7", title: "Aurora Beam", color: "#5ff7c4", glow: "rgba(95, 247, 196, 0.55)", edge: "#eafff6" },
  { id: "trail-8", title: "Cyber Lime", color: "#b4ff4d", glow: "rgba(180, 255, 77, 0.55)", edge: "#f4ffe1" },
  { id: "trail-9", title: "Photon Red", color: "#ff4d7a", glow: "rgba(255, 77, 122, 0.55)", edge: "#ffe0ea" },
  { id: "trail-10", title: "Solar Flare", color: "#ffb347", glow: "rgba(255, 179, 71, 0.55)", edge: "#fff0cf" },
  { id: "trail-11", title: "Glacier", color: "#7bdcff", glow: "rgba(123, 220, 255, 0.55)", edge: "#e9f9ff" },
  { id: "trail-12", title: "Ultraviolet", color: "#8c5bff", glow: "rgba(140, 91, 255, 0.55)", edge: "#efe6ff" },
  { id: "trail-13", title: "Neon Mint", color: "#3cfffc", glow: "rgba(60, 255, 252, 0.55)", edge: "#e9fffe" },
  { id: "trail-14", title: "Rose Gold", color: "#ff8fb1", glow: "rgba(255, 143, 177, 0.55)", edge: "#ffe6ef" },
  { id: "trail-15", title: "Plasma", color: "#ff6b3d", glow: "rgba(255, 107, 61, 0.55)", edge: "#ffe3d6" },
  { id: "trail-16", title: "Meteor", color: "#ffd86b", glow: "rgba(255, 216, 107, 0.55)", edge: "#fff4d6" },
  { id: "trail-17", title: "Volt", color: "#6b7bff", glow: "rgba(107, 123, 255, 0.55)", edge: "#e5e9ff" },
  { id: "trail-18", title: "Prism", color: "#5fe4ff", glow: "rgba(95, 228, 255, 0.55)", edge: "#e5fbff" },
];
const TRAIL_COSTS = {
  "trail-1": 0,
  "trail-2": 60,
  "trail-3": 70,
  "trail-4": 80,
  "trail-5": 90,
  "trail-6": 85,
  "trail-7": 100,
  "trail-8": 110,
  "trail-9": 120,
  "trail-10": 95,
  "trail-11": 105,
  "trail-12": 120,
  "trail-13": 110,
  "trail-14": 115,
  "trail-15": 125,
  "trail-16": 120,
  "trail-17": 130,
  "trail-18": 135,
};
const TRAIL_STYLE_MAP = TRAIL_STYLES.reduce((acc, style) => {
  acc[style.id] = style;
  return acc;
}, {});

const THEMES = {
  emerald: {
    bg: "#0b3b17",
    grid: "rgba(0,0,0,0.35)",
    fillTop: "#20e21b",
    fillBottom: "#17c913",
    edge: "#ffffff",
    trail: "#ff5fda",
    trailGlow: "rgba(255, 90, 220, 0.6)",
    cogFill: "#ffffff",
    cogCore: "#16f2d1",
  },
  teal: {
    bg: "#0a3a46",
    grid: "rgba(0,0,0,0.35)",
    fillTop: "#10b4ff",
    fillBottom: "#0a98d8",
    edge: "#ffffff",
    trail: "#ff5fda",
    trailGlow: "rgba(255, 90, 220, 0.6)",
    cogFill: "#ffffff",
    cogCore: "#42f0ff",
  },
  cobalt: {
    bg: "#04162f",
    grid: "rgba(0,0,0,0.4)",
    fillTop: "#33d1ff",
    fillBottom: "#1e89e8",
    edge: "#f7fbff",
    trail: "#ff8a3d",
    trailGlow: "rgba(255, 138, 61, 0.6)",
    cogFill: "#ffffff",
    cogCore: "#7ed4ff",
  },
  gold: {
    bg: "#3a3300",
    grid: "rgba(0,0,0,0.4)",
    fillTop: "#f4e12f",
    fillBottom: "#d6c21a",
    edge: "#ffffff",
    trail: "#ff5fda",
    trailGlow: "rgba(255, 90, 220, 0.6)",
    cogFill: "#ffffff",
    cogCore: "#ffe45f",
  },
  crimson: {
    bg: "#3a0b12",
    grid: "rgba(0,0,0,0.4)",
    fillTop: "#ff4d5a",
    fillBottom: "#d61f34",
    edge: "#fff1f2",
    trail: "#ffb347",
    trailGlow: "rgba(255, 179, 71, 0.55)",
    cogFill: "#ffffff",
    cogCore: "#ff8fa3",
  },
  violet: {
    bg: "#1f0e35",
    grid: "rgba(0,0,0,0.4)",
    fillTop: "#b56bff",
    fillBottom: "#7a3fe6",
    edge: "#f4e9ff",
    trail: "#47ffd1",
    trailGlow: "rgba(71, 255, 209, 0.55)",
    cogFill: "#ffffff",
    cogCore: "#d2b3ff",
  },
  sunset: {
    bg: "#3b1608",
    grid: "rgba(0,0,0,0.4)",
    fillTop: "#ff8a3d",
    fillBottom: "#ff5c87",
    edge: "#fff4ea",
    trail: "#ffe26b",
    trailGlow: "rgba(255, 226, 107, 0.55)",
    cogFill: "#ffffff",
    cogCore: "#ffb06b",
  },
  aurora: {
    bg: "#083327",
    grid: "rgba(0,0,0,0.4)",
    fillTop: "#3cffc5",
    fillBottom: "#22c88f",
    edge: "#edfff7",
    trail: "#8bc4ff",
    trailGlow: "rgba(139, 196, 255, 0.55)",
    cogFill: "#ffffff",
    cogCore: "#7affd8",
  },
  frost: {
    bg: "#0a2236",
    grid: "rgba(0,0,0,0.4)",
    fillTop: "#8be0ff",
    fillBottom: "#4cb4ff",
    edge: "#f3fbff",
    trail: "#ffd27a",
    trailGlow: "rgba(255, 210, 122, 0.55)",
    cogFill: "#ffffff",
    cogCore: "#b4edff",
  },
  ember: {
    bg: "#2a1206",
    grid: "rgba(0,0,0,0.4)",
    fillTop: "#ff9448",
    fillBottom: "#d84a1b",
    edge: "#fff1e6",
    trail: "#ffc15a",
    trailGlow: "rgba(255, 193, 90, 0.55)",
    cogFill: "#ffffff",
    cogCore: "#ffb07d",
  },
};

const BOT_SKINS = [
  {
    fillTop: "#ff6b6b",
    fillBottom: "#d93c52",
    trail: "#ffc2c2",
    trailGlow: "rgba(255, 107, 107, 0.55)",
  },
  {
    fillTop: "#54d7ff",
    fillBottom: "#1f86d8",
    trail: "#b5edff",
    trailGlow: "rgba(84, 215, 255, 0.55)",
  },
  {
    fillTop: "#f5d86e",
    fillBottom: "#e3a637",
    trail: "#fff1b8",
    trailGlow: "rgba(245, 216, 110, 0.55)",
  },
];

const POINTER_SHAPES = {
  classic: {
    label: "Vanguard",
    clip:
      "polygon(0 50%, 30% 20%, 78% 20%, 100% 50%, 78% 80%, 30% 80%, 16% 62%, 24% 50%, 16% 38%)",
    main: [
      [-18, -6],
      [6, -10],
      [22, 0],
      [6, 10],
      [-18, 6],
      [-6, 0],
    ],
    tail: [
      [-14, -4],
      [-24, 0],
      [-14, 4],
    ],
  },
  spear: {
    label: "Rapier",
    clip: "polygon(0 50%, 40% 22%, 100% 50%, 40% 78%, 20% 64%, 30% 50%, 20% 36%)",
    main: [
      [-20, -4],
      [2, -8],
      [20, 0],
      [2, 8],
      [-20, 4],
      [-10, 0],
    ],
    tail: [
      [-16, -2],
      [-26, 0],
      [-16, 2],
    ],
  },
  kite: {
    label: "Delta",
    clip: "polygon(8% 50%, 42% 16%, 92% 50%, 42% 84%, 20% 60%, 28% 50%, 20% 40%)",
    main: [
      [-12, -12],
      [10, -4],
      [18, 0],
      [10, 4],
      [-12, 12],
      [-4, 0],
    ],
    tail: [
      [-10, -6],
      [-22, 0],
      [-10, 6],
    ],
  },
  wing: {
    label: "Falcon",
    clip:
      "polygon(0 50%, 20% 14%, 50% 26%, 100% 50%, 50% 74%, 20% 86%, 8% 66%, 26% 50%, 8% 34%)",
    main: [
      [-20, -8],
      [-4, -12],
      [8, -6],
      [22, 0],
      [8, 6],
      [-4, 12],
      [-20, 8],
      [-10, 0],
    ],
    tail: [
      [-14, -4],
      [-24, 0],
      [-14, 4],
    ],
  },
  bolt: {
    label: "Striker",
    clip:
      "polygon(0 50%, 26% 10%, 52% 22%, 76% 8%, 100% 50%, 76% 92%, 52% 78%, 26% 90%)",
    main: [
      [-16, -10],
      [-2, -14],
      [10, -8],
      [22, 0],
      [10, 8],
      [-2, 14],
      [-16, 10],
      [-6, 0],
    ],
    tail: [
      [-12, -5],
      [-24, 0],
      [-12, 5],
    ],
  },
  blade: {
    label: "Edge",
    clip: "polygon(0 50%, 24% 12%, 64% 20%, 100% 50%, 64% 80%, 24% 88%, 10% 64%)",
    main: [
      [-18, -12],
      [-2, -8],
      [12, -2],
      [22, 0],
      [12, 2],
      [-2, 8],
      [-18, 12],
      [-10, 0],
    ],
    tail: [
      [-14, -5],
      [-26, 0],
      [-14, 5],
    ],
  },
  shuriken: {
    label: "Orbit",
    clip:
      "polygon(8% 50%, 30% 14%, 50% 10%, 70% 20%, 100% 50%, 70% 80%, 50% 90%, 30% 86%, 42% 60%, 26% 50%, 42% 40%)",
    main: [
      [-12, -14],
      [0, -10],
      [12, -6],
      [22, 0],
      [12, 6],
      [0, 10],
      [-12, 14],
      [-4, 4],
      [-4, -4],
    ],
    tail: [
      [-12, -6],
      [-24, 0],
      [-12, 6],
    ],
  },
  raven: {
    label: "Phantom",
    clip:
      "polygon(0 50%, 22% 24%, 44% 16%, 70% 30%, 100% 50%, 70% 70%, 44% 84%, 22% 76%, 10% 60%, 18% 50%, 10% 40%)",
    main: [
      [-22, -4],
      [-10, -12],
      [2, -10],
      [16, 0],
      [2, 10],
      [-10, 12],
      [-22, 4],
      [-12, 0],
    ],
    tail: [
      [-16, -3],
      [-28, 0],
      [-16, 3],
    ],
  },
  crescent: {
    label: "Nova",
    clip:
      "polygon(0 50%, 26% 12%, 68% 18%, 100% 50%, 68% 82%, 26% 88%, 40% 64%, 22% 50%, 40% 36%)",
    main: [
      [-16, -12],
      [0, -10],
      [16, -2],
      [10, 0],
      [16, 2],
      [0, 10],
      [-16, 12],
      [-8, 4],
      [-8, -4],
    ],
    tail: [
      [-14, -4],
      [-26, 0],
      [-14, 4],
    ],
  },
  arrowhead: {
    label: "Arrowhead",
    clip: "polygon(0 50%, 32% 16%, 100% 50%, 32% 84%, 16% 64%, 26% 50%, 16% 36%)",
    main: [
      [-18, -10],
      [4, -8],
      [22, 0],
      [4, 8],
      [-18, 10],
      [-6, 0],
    ],
    tail: [
      [-14, -4],
      [-26, 0],
      [-14, 4],
    ],
  },
  comet: {
    label: "Comet",
    clip: "polygon(0 50%, 24% 16%, 56% 12%, 100% 50%, 56% 88%, 24% 84%, 10% 62%, 18% 50%, 10% 38%)",
    main: [
      [-16, -6],
      [6, -12],
      [22, 0],
      [6, 12],
      [-16, 6],
      [-8, 0],
    ],
    tail: [
      [-20, -3],
      [-28, 0],
      [-20, 3],
    ],
  },
  manta: {
    label: "Manta",
    clip:
      "polygon(0 50%, 18% 18%, 46% 12%, 100% 50%, 46% 88%, 18% 82%, 10% 64%, 24% 50%, 10% 36%)",
    main: [
      [-22, -6],
      [-6, -14],
      [8, -10],
      [22, 0],
      [8, 10],
      [-6, 14],
      [-22, 6],
      [-12, 0],
    ],
    tail: [
      [-16, -2],
      [-26, 0],
      [-16, 2],
    ],
  },
  prism: {
    label: "Prism",
    clip: "polygon(0 50%, 24% 10%, 70% 14%, 100% 50%, 70% 86%, 24% 90%, 14% 64%, 22% 50%, 14% 36%)",
    main: [
      [-14, -12],
      [8, -12],
      [22, 0],
      [8, 12],
      [-14, 12],
      [-4, 0],
    ],
    tail: [
      [-12, -6],
      [-24, 0],
      [-12, 6],
    ],
  },
  sting: {
    label: "Sting",
    clip:
      "polygon(0 50%, 22% 14%, 52% 20%, 100% 50%, 52% 80%, 22% 86%, 12% 64%, 26% 50%, 12% 36%)",
    main: [
      [-18, -8],
      [2, -10],
      [16, -4],
      [22, 0],
      [16, 4],
      [2, 10],
      [-18, 8],
      [-6, 0],
    ],
    tail: [
      [-14, -4],
      [-26, 0],
      [-14, 4],
    ],
  },
  harrier: {
    label: "Harrier",
    clip:
      "polygon(0 50%, 18% 12%, 46% 16%, 100% 50%, 46% 84%, 18% 88%, 8% 62%, 22% 50%, 8% 38%)",
    main: [
      [-20, -12],
      [-8, -14],
      [6, -6],
      [22, 0],
      [6, 6],
      [-8, 14],
      [-20, 12],
      [-10, 0],
    ],
    tail: [
      [-16, -6],
      [-28, 0],
      [-16, 6],
    ],
  },
  lancer: {
    label: "Lancer",
    clip: "polygon(0 50%, 30% 18%, 64% 28%, 100% 50%, 64% 72%, 30% 82%, 14% 60%, 22% 50%, 14% 40%)",
    main: [
      [-22, -4],
      [-6, -8],
      [14, -4],
      [22, 0],
      [14, 4],
      [-6, 8],
      [-22, 4],
      [-10, 0],
    ],
    tail: [
      [-16, -2],
      [-28, 0],
      [-16, 2],
    ],
  },
  wraith: {
    label: "Wraith",
    clip:
      "polygon(0 50%, 24% 8%, 56% 16%, 100% 50%, 56% 84%, 24% 92%, 12% 64%, 22% 50%, 12% 36%)",
    main: [
      [-18, -14],
      [-2, -12],
      [10, -6],
      [22, 0],
      [10, 6],
      [-2, 12],
      [-18, 14],
      [-8, 0],
    ],
    tail: [
      [-16, -5],
      [-26, 0],
      [-16, 5],
    ],
  },
};
const SHAPE_COSTS = {
  classic: 0,
  spear: 80,
  kite: 90,
  wing: 100,
  bolt: 110,
  blade: 120,
  shuriken: 130,
  raven: 140,
  crescent: 150,
  arrowhead: 160,
  comet: 170,
  manta: 180,
  prism: 190,
  sting: 200,
  harrier: 210,
  lancer: 220,
  wraith: 230,
};

const getPointerShape = (key) => POINTER_SHAPES[key] || POINTER_SHAPES.classic;
const shapeToSvgPoints = (shape) => {
  const points = [...shape.main, ...shape.tail];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  points.forEach(([x, y]) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });
  const pad = 2;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const denomX = width + pad * 2;
  const denomY = height + pad * 2;
  const mapPoint = ([x, y]) =>
    `${(((x - minX + pad) / denomX) * 100).toFixed(2)},${(((y - minY + pad) / denomY) * 100).toFixed(2)}`;
  return {
    main: shape.main.map(mapPoint).join(" "),
    tail: shape.tail.map(mapPoint).join(" "),
  };
};

const DIFFICULTY_PRESETS = {
  1: {
    speed: 280,
    gapMin: 280,
    gapMax: 360,
    spikeFlat: 0.26,
    spikeSlope: 0.08,
    cogChance: 0,
    orbChance: 0,
    spikeSize: 14,
  },
  2: {
    speed: 300,
    gapMin: 250,
    gapMax: 330,
    spikeFlat: 0.38,
    spikeSlope: 0.16,
    cogChance: 0.12,
    orbChance: 0,
    spikeSize: 15,
  },
  3: {
    speed: 320,
    gapMin: 220,
    gapMax: 300,
    spikeFlat: 0.5,
    spikeSlope: 0.22,
    cogChance: 0.2,
    orbChance: 0.08,
    spikeSize: 16,
  },
  4: {
    speed: 340,
    gapMin: 200,
    gapMax: 280,
    spikeFlat: 0.6,
    spikeSlope: 0.28,
    cogChance: 0.26,
    orbChance: 0.14,
    spikeSize: 17,
  },
  5: {
    speed: 360,
    gapMin: 180,
    gapMax: 260,
    spikeFlat: 0.7,
    spikeSlope: 0.32,
    cogChance: 0.32,
    orbChance: 0.2,
    spikeSize: 18,
  },
};

const THEME_KEYS = ["emerald", "teal", "cobalt", "gold", "crimson", "violet", "sunset", "aurora", "frost", "ember"];
const SKIN_LABELS = {
  emerald: "Emerald Drift",
  teal: "Teal Surge",
  cobalt: "Cobalt Pulse",
  gold: "Gold Forge",
  crimson: "Crimson Jet",
  violet: "Violet Rift",
  sunset: "Sunset Blaze",
  aurora: "Aurora Mint",
  frost: "Frost Byte",
  ember: "Ember Rush",
};

const SKIN_COSTS = {
  emerald: 0,
  teal: 120,
  cobalt: 160,
  gold: 220,
  crimson: 140,
  violet: 180,
  sunset: 200,
  aurora: 240,
  frost: 260,
  ember: 210,
};
const LEVELS = Array.from({ length: 33 }, (_, index) => {
  const id = index + 1;
  let difficulty = 1;
  if (id > 8 && id <= 16) difficulty = 2;
  else if (id > 16 && id <= 24) difficulty = 3;
  else if (id > 24 && id <= 30) difficulty = 4;
  else if (id > 30) difficulty = 5;

  const theme = THEME_KEYS[Math.floor(index / 6) % THEME_KEYS.length];
  return { id, difficulty, theme };
});

// Structured obstacle pattern order (deterministic, no random spawns).
const OBSTACLE_PATTERNS = ["gapWall", "zigzag", "waveTunnel", "blockSequence", "staircase", "midSlalom"];

const getDailyLevel = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const day = Math.floor((now - start) / 86400000);
  const index = day % LEVELS.length;
  return LEVELS[index] || LEVELS[0];
};

const getInitialLevel = () => {
  return LEVELS[0];
};

function createGame(canvas, callbacks, profileId) {
  const ctx = canvas.getContext("2d");
  const initialProfileId = profileId || "player-1";
  const state = {
    running: false,
    paused: false,
    last: 0,
    accumulator: 0,
    step: 1 / 60,
    maxSubSteps: 4,
    offset: 0,
    progress: 0,
    profileId: initialProfileId,
    bestProgress: Number(localStorage.getItem(makeProfileKey(initialProfileId, "best_progress")) || 0),
    bestKey: makeProfileKey(initialProfileId, "best_progress"),
    safeTime: 0,
    width: 0,
    height: 0,
    cameraY: 0,
    lockedCameraY: 0,
    cameraLocked: true,
    dpr: window.devicePixelRatio || 1,
    theme: THEMES.cobalt,
    skin: THEMES.emerald,
    shape: "classic",
    time: 0,
    timeScale: 1,
    impactTime: 0,
    impactDuration: 0.32,
    shakeTime: 0,
    shakeDuration: 0.24,
    shakeAmp: 8,
    waitingForInput: true,
    crashing: false,
    crashTime: 0,
    crashDuration: 0.7,
    levelEndX: 0,
    finishBuffer: 300,
    finishX: 0,
    avgDt: 0,
    lowPerf: false,
    perfScale: 1,
    completing: false,
    completeTime: 0,
    completeDuration: 3.6,
    completeStartX: 0,
    completeStartY: 0,
    completeStartOffset: 0,
    completeTargetX: 0,
    completeTargetY: 0,
    completeTargetOffset: 0,
    completeSpin: 6,
    completeSoundPlayed: false,
    completeZoom: 1,
    completeDrift: 0,
    lastSpeed: 0,
    playerFinishTime: null,
    mode: "classic",
    forceLowPerf: false,
    trailTick: false,
    trailStyle: null,
    levelConfig: null,
    levelFactor: 0,
    challengeActive: false,
    challengeTime: 0,
    challengeTimeMax: 0,
    challengeIndex: 0,
    challengeTargets: CHALLENGE_TARGETS,
    challengeMultiplier: 1,
    challengeHudTick: 0,
  };

  const level = {
    length: 14000,
    spacing: 120,
    gapMin: 220,
    gapMax: 320,
    margin: 70,
  };

  const config = {
    speed: 320,
    trailLength: 120,
    spikeSize: 16,
    spikeChanceFlat: 0.6,
    spikeChanceSlope: 0.25,
    cogChance: 0.2,
    cogMinRadius: 18,
    cogMaxRadius: 34,
    cogSpinMin: -2.6,
    cogSpinMax: 2.6,
    orbChance: 0,
    orbMinRadius: 10,
    orbMaxRadius: 18,
    orbSpacing: 2.1,
    startX: 260,
    pickupSpacing: 220,
    pickupJitter: 160,
    pickupRadius: 12,
    pickupChance: 0.7,
    shieldChance: 0.14,
    shieldDuration: 4.5,
    comboTimeout: 2.4,
    endlessRamp: 120,
    endlessLength: 42000,
    classicRamp: 160,
    raceRamp: 110,
    endlessStartFactor: 0.85,
    raceStartFactor: 0.9,
  };

  const player = {
    x: 150,
    y: 0,
    size: 8,
    vy: 0,
    tilt: 0,
  };

  const input = { active: false };
  let topPoints = [];
  let bottomPoints = [];
  let spikes = [];
  let cogs = [];
  let orbs = [];
  let tunnelWalls = [];
  let pickups = [];
  let trail = [];
  let stars = [];
  let bots = [];
  let crashPieces = [];
  let corridorPath = null;
  let topEdgePath = null;
  let bottomEdgePath = null;
  const runtime = {
    shieldActive: false,
    shieldTime: 0,
    combo: 0,
    comboTimer: 0,
  };

  const profileKey = (key) => makeProfileKey(state.profileId, key);


  // Obstacle animation helpers (subtle pulse + float without touching player physics).
  const getObstaclePulse = (entry, amp = 0.05) =>
    1 + Math.sin(state.time * (entry.pulseSpeed || 1) + (entry.pulse || 0)) * amp;
  const getObstacleFloat = (entry) =>
    Math.sin(state.time * (entry.floatSpeed || 0) + (entry.floatPhase || 0)) * (entry.floatAmp || 0);
  const getShakeOffset = () => {
    if (state.shakeTime <= 0) return { x: 0, y: 0 };
    const t = clamp(state.shakeTime / Math.max(0.001, state.shakeDuration), 0, 1);
    const amp = state.shakeAmp * t * t;
    return {
      x: Math.sin(state.time * 52) * amp,
      y: Math.cos(state.time * 41) * amp,
    };
  };

  const getObstaclePalette = (index = 0) => {
    const theme = state.theme || THEMES.emerald;
    const levelShift = (state.levelFactor || 0) * 0.08;
    const baseTop = adjustColor(theme.fillTop || "#ff44d6", levelShift);
    const baseBottom = adjustColor(theme.fillBottom || baseTop, -levelShift * 0.6);
    const palette = [
      adjustColor(baseTop, 0.12),
      baseTop,
      adjustColor(baseBottom, -0.08),
    ];
    const fill = palette[Math.abs(index) % palette.length];
    return {
      fill,
      glow: fill,
    };
  };

  const applyLevel = (levelConfig) => {
    const preset = DIFFICULTY_PRESETS[levelConfig?.difficulty || 1] || DIFFICULTY_PRESETS[1];
    const levelId = levelConfig?.id || 1;
    const levelFactor = clamp((levelId - 1) / Math.max(1, LEVELS.length - 1), 0, 1);
    state.levelFactor = levelFactor;
    const ease = levelFactor * levelFactor;
    const step = LEVELS.length > 1 ? MAX_LEVEL_SPEED_BONUS / (LEVELS.length - 1) : 0;
    const levelBonus = clamp(Math.round((levelId - 1) * step), 0, MAX_LEVEL_SPEED_BONUS);
    const storedBonus =
      levelConfig?.mode === "classic"
        ? clamp(Number(localStorage.getItem(profileKey("speed_bonus")) || 0), 0, MAX_LEVEL_SPEED_BONUS)
        : 0;
    const speedBonus = Math.max(levelBonus, storedBonus);
    config.speed = preset.speed + speedBonus;
    level.gapMin = Math.round(clamp(lerp(preset.gapMin + 140, preset.gapMin + 40, ease), 180, 620));
    level.gapMax = Math.round(clamp(lerp(preset.gapMax + 160, preset.gapMax + 60, ease), 220, 700));
    config.spikeChanceFlat = clamp(lerp(preset.spikeFlat * 0.35, preset.spikeFlat * 0.6, ease), 0.02, 0.6);
    config.spikeChanceSlope = clamp(lerp(preset.spikeSlope * 0.3, preset.spikeSlope * 0.55, ease), 0.01, 0.5);
    const cogMax = Math.max(preset.cogChance * 0.55, 0.08);
    config.cogChance = clamp(lerp(preset.cogChance * 0.3, cogMax, ease), 0, 0.35);
    const baseOrbChance = preset.orbChance ?? 0;
    const orbMax = Math.max(baseOrbChance * 0.6, 0.05);
    config.orbChance = clamp(lerp(baseOrbChance * 0.2, orbMax, ease), 0, 0.25);
    config.spikeSize = Math.round(
      clamp(lerp((preset.spikeSize ?? config.spikeSize) * 0.7, (preset.spikeSize ?? config.spikeSize) * 0.9, ease), 9, 22)
    );
    state.theme = THEMES[levelConfig?.theme] || THEMES.emerald;
    state.skin = THEMES[levelConfig?.skin] || state.theme;
    state.bestKey = profileKey(`best_progress_${levelConfig?.id || 1}`);
    state.bestProgress = Number(localStorage.getItem(state.bestKey) || 0);
    const seed = (levelConfig?.id || 1) * 10007 + (levelConfig?.difficulty || 1) * 97;
    setSeed(seed);
  };

  const setSkin = (skinKey) => {
    state.skin = THEMES[skinKey] || state.theme;
  };

  const setTrail = (trailId) => {
    state.trailStyle = TRAIL_STYLE_MAP[trailId] || null;
  };

  const setShape = (shapeKey) => {
    state.shape = shapeKey;
  };

  const setProfile = (nextProfileId) => {
    if (!nextProfileId || nextProfileId === state.profileId) return;
    state.profileId = nextProfileId;
    const levelId = state.levelConfig?.id || 1;
    state.bestKey = profileKey(`best_progress_${levelId}`);
    state.bestProgress = Number(localStorage.getItem(state.bestKey) || 0);
    callbacks.onBest?.(state.bestProgress);
  };

  const resize = () => {
    const prevHeight = state.height;
    state.width = canvas.clientWidth;
    state.height = canvas.clientHeight;
    state.dpr = 1;
    canvas.width = state.width * state.dpr;
    canvas.height = state.height * state.dpr;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.forceLowPerf = state.width < 820 || state.height < 520;
    buildStars();

    if (state.levelConfig) {
      applyLevel(state.levelConfig);
      buildLevel();
      buildPickups();
      buildBots();
      if ((state.running || state.paused) && prevHeight > 0) {
        const worldX = state.offset + player.x;
        const bounds = getBounds(worldX);
        player.y = clamp(player.y, bounds.top + player.size, bounds.bottom - player.size);
        state.lockedCameraY = 0;
        state.cameraY = 0;
      }
    }
  };

  const addSpikeTriangle = (ax, ay, bx, by, cx, cy, patternIndex, stepIndex) => {
    const dx = bx - ax;
    const dy = by - ay;
    const baseLen = Math.hypot(dx, dy) || 1;
    const tx = dx / baseLen;
    const ty = dy / baseLen;
    const midX = (ax + bx) / 2;
    const midY = (ay + by) / 2;
    const nvecX = cx - midX;
    const nvecY = cy - midY;
    const nLen = Math.hypot(nvecX, nvecY) || 1;
    const nx = nvecX / nLen;
    const ny = nvecY / nLen;
    const heightLen = Math.hypot(cx - midX, cy - midY);
    const angle = Math.atan2(cy - midY, cx - midX);
    const seed = patternIndex * 7 + stepIndex;
    const pulse = ((seed % 8) / 8) * Math.PI * 2;
    const pulseSpeed = 1.2 + (seed % 3) * 0.2;
    const minX = Math.min(ax, bx, cx);
    const maxX = Math.max(ax, bx, cx);
    const minY = Math.min(ay, by, cy);
    const maxY = Math.max(ay, by, cy);
    spikes.push({
      x: midX,
      y: midY,
      tx,
      ty,
      nx,
      ny,
      ax,
      ay,
      bx,
      by,
      cx,
      cy,
      minX,
      maxX,
      minY,
      maxY,
      midX,
      midY,
      baseLen,
      heightLen,
      angle,
      pulse,
      pulseSpeed,
      hitboxes: [
        {
          type: "triangle",
          ax,
          ay,
          bx,
          by,
          cx,
          cy,
        },
      ],
    });
  };

  const addEdgeSpike = (x, isTop, patternIndex, stepIndex) => {
    const bounds = getBounds(x);
    const baseHalf = config.spikeSize * 1.4 * SPIKE_SIZE_SCALE;
    const height = baseHalf * 2 * SPIKE_HEIGHT_RATIO;
    if (isTop) {
      const y = bounds.top;
      addSpikeTriangle(x - baseHalf, y, x + baseHalf, y, x, y + height, patternIndex, stepIndex);
    } else {
      const y = bounds.bottom;
      addSpikeTriangle(x - baseHalf, y, x + baseHalf, y, x, y - height, patternIndex, stepIndex);
    }
  };

  const addWallSpike = (x, y, direction, patternIndex, stepIndex) => {
    const size = config.spikeSize * 0.9 * SPIKE_SIZE_SCALE;
    const height = size * 2 * SPIKE_HEIGHT_RATIO;
    const ax = x;
    const ay = y - size;
    const bx = x;
    const by = y + size;
    const cx = x + (direction === "left" ? -height : height);
    const cy = y;
    addSpikeTriangle(ax, ay, bx, by, cx, cy, patternIndex, stepIndex);
  };

  const addWallBlock = (x, y, width, height, patternIndex, stepIndex, options = {}) => {
    const pad = Math.max(2, Math.round(Math.min(width, height) * 0.12));
    cogs.push({
      x,
      y,
      r: 0,
      angle: 0,
      spin: 0,
      teeth: 0,
      pulse: options.pulse ?? 0,
      pulseSpeed: options.pulseSpeed ?? 0,
      floatAmp: options.floatAmp ?? 0,
      floatSpeed: options.floatSpeed ?? 0,
      floatPhase: options.floatPhase ?? 0,
      noSpikes: options.noSpikes ?? true,
      hitboxes: [{ type: "rect", x, y, width, height, pad }],
    });
  };

  const addCogAt = (x, y, index, patternIndex, difficulty) => {
    const baseR = clamp(18 + difficulty * 2, 18, 26);
    const radius = baseR + (index % 2) * 2;
    const seed = patternIndex * 5 + index;
    const blockWidth = radius * 2.4;
    const blockHeight = radius * 1.35;
    const pad = Math.max(2, Math.round(blockWidth * 0.12));
    cogs.push({
      x,
      y,
      r: radius,
      angle: 0,
      spin: (index % 2 === 0 ? 2.4 : -2.4) * (1 + difficulty * 0.08),
      teeth: Math.max(8, Math.floor(radius / 2)),
      pulse: ((seed % 10) / 10) * Math.PI * 2,
      pulseSpeed: 1.2 + (seed % 3) * 0.2,
      floatAmp: 1.6 + (seed % 3) * 0.7,
      floatSpeed: 0.8 + (seed % 2) * 0.35,
      floatPhase: ((seed * 3) % 10) * 0.35,
      hitboxes: [{ type: "rect", x, y, width: blockWidth, height: blockHeight, pad }],
    });
  };

  const addBigEdgeSpike = (x, isTop, patternIndex, stepIndex) => {
    const bounds = getBounds(x);
    const baseHalf = config.spikeSize * 1.2 * SPIKE_SIZE_SCALE;
    const height = baseHalf * 2 * SPIKE_HEIGHT_RATIO;
    const spacing = baseHalf * 1.6;
    const baseY = isTop ? bounds.top : bounds.bottom;
    const tipOffset = isTop ? height : -height;
    for (let i = 0; i < 3; i += 1) {
      const offset = (i - 1) * spacing;
      const cx = x + offset;
      addSpikeTriangle(
        cx - baseHalf,
        baseY,
        cx + baseHalf,
        baseY,
        cx,
        baseY + tipOffset,
        patternIndex,
        stepIndex * 3 + i
      );
    }
  };

  const addOrbAt = (x, y, index, patternIndex, difficulty) => {
    const baseR = clamp(12 + difficulty * 1.5, 10, 18);
    const radius = baseR + (index % 2) * 1.5;
    const seed = patternIndex * 4 + index;
    const size = radius * 2.1;
    const pad = Math.max(2, Math.round(size * 0.14));
    orbs.push({
      x,
      y,
      r: radius,
      pulse: ((seed % 9) / 9) * Math.PI * 2,
      pulseSpeed: 1.4 + (seed % 3) * 0.2,
      floatAmp: 2 + (seed % 3) * 0.6,
      floatSpeed: 0.9 + (seed % 2) * 0.35,
      floatPhase: ((seed * 5) % 12) * 0.3,
      hitboxes: [{ type: "rect", x, y, width: size, height: size, pad }],
    });
  };

  const getTunnelGap = (wall, bounds) => {
    const gapSize = wall.gapSize;
    const baseCenter = (bounds.top + bounds.bottom) / 2;
    const wave =
      Math.sin(state.time * wall.speed + wall.phase + wall.x * 0.004) * wall.amp;
    let center = baseCenter + wave;
    const minCenter = bounds.top + gapSize / 2 + 14;
    const maxCenter = bounds.bottom - gapSize / 2 - 14;
    center = clamp(center, minCenter, maxCenter);
    return {
      start: center - gapSize / 2,
      end: center + gapSize / 2,
      center,
    };
  };

  const buildGapWall = (startX, patternIndex, difficulty) => {
    const bounds = getBounds(startX);
    const corridor = bounds.bottom - bounds.top;
    const gapSize = clamp(230 - difficulty * 8 + (1 - (state.levelFactor || 0)) * 40, 150, corridor - 120);
    const offset = (rng() * 2 - 1) * (corridor - gapSize) * 0.35;
    const gapCenter = (bounds.top + bounds.bottom) / 2 + offset;
    const gapTop = gapCenter - gapSize / 2;
    const gapBottom = gapCenter + gapSize / 2;
    const columns = (state.levelConfig?.id || 1) < 12 ? 1 : 2;
    const colSpacing = config.spikeSize * 1.9;
    const blockWidth = config.spikeSize * 1.8;
    const blockHeight = config.spikeSize * 1.3;
    const blockStep = blockHeight * 1.6;
    for (let c = 0; c < columns; c += 1) {
      const wallX = startX + c * colSpacing;
      let step = 0;
      for (let y = bounds.top + blockHeight; y < gapTop - blockHeight; y += blockStep) {
        addWallBlock(wallX, y, blockWidth, blockHeight, patternIndex, step++);
      }
      step = 0;
      for (
        let y = gapBottom + blockHeight;
        y < bounds.bottom - blockHeight;
        y += blockStep
      ) {
        addWallBlock(wallX, y, blockWidth, blockHeight, patternIndex, step++);
      }
    }
    return 220;
  };

  const buildZigZag = (startX, patternIndex, difficulty) => {
    const length = clamp(720 - difficulty * 20, 520, 780);
    const steps = 4 + Math.round(difficulty * 0.6);
    const stepX = length / steps;
    for (let i = 0; i < steps; i += 1) {
      const x = startX + (i + 1) * stepX;
      const isTop = (i + patternIndex) % 2 === 0;
      addEdgeSpike(x, isTop, patternIndex, i);
    }
    return length;
  };

  const buildWaveTunnel = (startX, patternIndex, difficulty) => {
    const length = clamp(980 - difficulty * 30, 680, 1020);
    const segmentWidth = clamp(180 - difficulty * 5, 130, 190);
    const gapSize = clamp(230 - difficulty * 10, 150, 240);
    const amp = clamp(55 + difficulty * 6, 45, 100);
    const speed = 0.0024 + difficulty * 0.0003;
    const phase = patternIndex * 0.6;
    for (let x = startX; x <= startX + length; x += segmentWidth) {
      tunnelWalls.push({
        x,
        width: segmentWidth,
        gapSize,
        amp,
        speed,
        phase,
      });
    }
    return length;
  };

  const buildBossSequence = (startX, patternIndex, difficulty) => {
    const length = clamp(1120 - difficulty * 35, 860, 1220);
    const segmentWidth = clamp(170 - difficulty * 4, 130, 180);
    const gapSize = clamp(210 - difficulty * 12, 140, 230);
    const amp = clamp(70 + difficulty * 8, 55, 120);
    const speed = 0.0032 + difficulty * 0.00035;
    const phase = patternIndex * 0.85;
    for (let x = startX; x <= startX + length; x += segmentWidth) {
      tunnelWalls.push({
        x,
        width: segmentWidth,
        gapSize,
        amp,
        speed,
        phase,
        boss: true,
      });
    }
    const entryX = startX + segmentWidth * 0.6;
    const exitX = startX + length - segmentWidth * 0.6;
    addBigEdgeSpike(entryX, true, patternIndex, 0);
    addBigEdgeSpike(entryX, false, patternIndex, 1);
    addBigEdgeSpike(exitX, true, patternIndex, 2);
    addBigEdgeSpike(exitX, false, patternIndex, 3);
    return length;
  };

  const buildBlockSequence = (startX, patternIndex, difficulty) => {
    const ease = state.levelFactor || 0;
    const length = clamp(760 - difficulty * 15 - ease * 80, 560, 860);
    const count = clamp(2 + Math.round(difficulty * 0.4 + ease * 2), 2, 6);
    const stepX = length / (count + 1);
    const bounds = getBounds(startX);
    const centerY = (bounds.top + bounds.bottom) / 2;
    for (let i = 0; i < count; i += 1) {
      const x = startX + (i + 1) * stepX;
      const isTop = i % 2 === 0;
      addBigEdgeSpike(x, isTop, patternIndex, i);
      // Add center obstacles to avoid large empty spaces.
      if (i % 2 === 0) {
        const jitter = (rng() * 2 - 1) * (bounds.bottom - bounds.top) * 0.12;
        addCogAt(x, centerY + jitter, i, patternIndex, difficulty);
      }
    }
    return length;
  };

  const buildStaircase = (startX, patternIndex, difficulty) => {
    const bounds = getBounds(startX);
    const steps = clamp(4 + Math.round(difficulty * 0.6), 4, 7);
    const stepX = clamp(160 - difficulty * 6, 120, 180);
    const blockW = clamp(120 - difficulty * 6, 90, 130);
    const blockH = clamp(40 + difficulty * 3, 34, 60);
    for (let i = 0; i < steps; i += 1) {
      const x = startX + (i + 1) * stepX;
      const isTop = i % 2 === 0;
      const y = isTop ? bounds.top + blockH * 0.6 : bounds.bottom - blockH * 0.6;
      addWallBlock(x, y, blockW, blockH, patternIndex, i);
    }
    return steps * stepX + blockW;
  };

  const buildMidSlalom = (startX, patternIndex, difficulty) => {
    const bounds = getBounds(startX);
    const centerY = (bounds.top + bounds.bottom) / 2;
    const count = clamp(3 + Math.round(difficulty * 0.7), 3, 6);
    const stepX = clamp(150 - difficulty * 5, 110, 175);
    const blockW = clamp(100 - difficulty * 4, 72, 120);
    const blockH = clamp(60 + difficulty * 4, 50, 90);
    const amp = (bounds.bottom - bounds.top) * 0.22;
    for (let i = 0; i < count; i += 1) {
      const x = startX + (i + 1) * stepX;
      const offset = (i % 2 === 0 ? -1 : 1) * amp;
      addWallBlock(x, centerY + offset, blockW, blockH, patternIndex, i);
    }
    return count * stepX + blockW;
  };

  const buildObstaclePatterns = () => {
    // Pattern-based obstacle layout (deterministic, no random spawns).
    spikes = [];
    cogs = [];
    orbs = [];
    tunnelWalls = [];
    const baseDifficulty = state.levelConfig?.difficulty || 1;
    const difficulty = clamp(baseDifficulty * 0.7 + (state.levelFactor || 0) * 0.6, 1, 4);
    const levelId = state.levelConfig?.id || 1;
    const patternSpacing = clamp(230 - difficulty * 12, 150, 260);
    const startX = config.startX + 420;
    const endX = state.levelEndX - 700;
    let cursor = startX;
    let patternIndex = 0;
    let prevType = null;
    const bossActive = levelId % 5 === 0 && levelId > 0;
    const bossLength = bossActive ? clamp(1120 - difficulty * 35, 860, 1220) : 0;
    const bossStart = bossActive ? Math.max(startX, endX - bossLength - patternSpacing) : endX;
    const availablePatterns = (() => {
      if (levelId <= 3) return ["gapWall", "blockSequence"];
      if (levelId <= 8) return ["gapWall", "blockSequence", "zigzag"];
      if (levelId <= 14) return ["gapWall", "blockSequence", "zigzag", "staircase"];
      if (levelId <= 20) return ["gapWall", "blockSequence", "zigzag", "staircase", "midSlalom"];
      return [...OBSTACLE_PATTERNS];
    })();
    const signaturePlan = (() => {
      if (!availablePatterns.length) return [];
      const rotate = (levelId - 1) % availablePatterns.length;
      const plan = [availablePatterns[rotate]];
      if (availablePatterns.length > 2) {
        plan.push(availablePatterns[(rotate + 2) % availablePatterns.length]);
      } else if (availablePatterns.length > 1) {
        plan.push(availablePatterns[(rotate + 1) % availablePatterns.length]);
      }
      return plan;
    })();
    while (cursor < endX) {
      if (bossActive && cursor >= bossStart) {
        const length = buildBossSequence(cursor, patternIndex, difficulty);
        cursor += length + patternSpacing;
        break;
      }
      let type;
      if (patternIndex < signaturePlan.length) {
        type = signaturePlan[patternIndex];
      } else {
        const isSignature = patternIndex > 0 && patternIndex % 5 === 0;
        if (isSignature) {
          const signature =
            levelId <= 5 ? "gapWall" : levelId <= 11 ? "zigzag" : "waveTunnel";
          type = availablePatterns.includes(signature) ? signature : availablePatterns[0];
        } else {
          type = availablePatterns[Math.floor(rng() * availablePatterns.length)];
        }
      }
      if (availablePatterns.length > 1 && type === prevType) {
        const prevIndex = Math.max(0, availablePatterns.indexOf(type));
        type = availablePatterns[(prevIndex + 1) % availablePatterns.length];
      }
      let length = 520;
      if (type === "gapWall") length = buildGapWall(cursor, patternIndex, difficulty);
      else if (type === "zigzag") length = buildZigZag(cursor, patternIndex, difficulty);
      else if (type === "waveTunnel") length = buildWaveTunnel(cursor, patternIndex, difficulty);
      else if (type === "blockSequence") length = buildBlockSequence(cursor, patternIndex, difficulty);
      else if (type === "staircase") length = buildStaircase(cursor, patternIndex, difficulty);
      else if (type === "midSlalom") length = buildMidSlalom(cursor, patternIndex, difficulty);
      cursor += length + patternSpacing;
      prevType = type;
      patternIndex += 1;
    }
    spikes.sort((a, b) => a.x - b.x);
    cogs.sort((a, b) => a.x - b.x);
    orbs.sort((a, b) => a.x - b.x);
    tunnelWalls.sort((a, b) => a.x - b.x);
  };

  const rebuildPaths = () => {
    if (typeof Path2D === "undefined" || !topPoints.length || !bottomPoints.length) {
      corridorPath = null;
      topEdgePath = null;
      bottomEdgePath = null;
      return;
    }
    corridorPath = new Path2D();
    topEdgePath = new Path2D();
    bottomEdgePath = new Path2D();

    topPoints.forEach((point, idx) => {
      if (idx === 0) {
        corridorPath.moveTo(point.x, point.y);
        topEdgePath.moveTo(point.x, point.y);
      } else {
        corridorPath.lineTo(point.x, point.y);
        topEdgePath.lineTo(point.x, point.y);
      }
    });
    for (let i = bottomPoints.length - 1; i >= 0; i -= 1) {
      const point = bottomPoints[i];
      corridorPath.lineTo(point.x, point.y);
    }
    corridorPath.closePath();

    bottomPoints.forEach((point, idx) => {
      if (idx === 0) bottomEdgePath.moveTo(point.x, point.y);
      else bottomEdgePath.lineTo(point.x, point.y);
    });
  };

  const pointInTriangle = (px, py, tri) => {
    const v0x = tri.cx - tri.ax;
    const v0y = tri.cy - tri.ay;
    const v1x = tri.bx - tri.ax;
    const v1y = tri.by - tri.ay;
    const v2x = px - tri.ax;
    const v2y = py - tri.ay;

    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;
    const invDen = 1 / (dot00 * dot11 - dot01 * dot01 + 1e-9);
    const u = (dot11 * dot02 - dot01 * dot12) * invDen;
    const v = (dot00 * dot12 - dot01 * dot02) * invDen;
    return u >= 0 && v >= 0 && u + v <= 1;
  };

  const distPointToSegmentSquared = (px, py, ax, ay, bx, by) => {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const abLen = abx * abx + aby * aby;
    const t = abLen === 0 ? 0 : clamp((apx * abx + apy * aby) / abLen, 0, 1);
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy;
  };

  const circleIntersectsTriangle = (px, py, radius, tri) => {
    if (pointInTriangle(px, py, tri)) return true;
    const r2 = radius * radius;
    if (distPointToSegmentSquared(px, py, tri.ax, tri.ay, tri.bx, tri.by) <= r2) return true;
    if (distPointToSegmentSquared(px, py, tri.bx, tri.by, tri.cx, tri.cy) <= r2) return true;
    if (distPointToSegmentSquared(px, py, tri.cx, tri.cy, tri.ax, tri.ay) <= r2) return true;
    return false;
  };

  const circleIntersectsRing = (px, py, radius, cx, cy, rOuter, rInner) => {
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.hypot(dx, dy);
    const outer = rOuter + radius;
    const inner = Math.max(0, rInner - radius);
    return dist <= outer && dist >= inner;
  };

  const getScaledTriangle = (box, centerX, centerY, scale) => ({
    ax: centerX + (box.ax - centerX) * scale,
    ay: centerY + (box.ay - centerY) * scale,
    bx: centerX + (box.bx - centerX) * scale,
    by: centerY + (box.by - centerY) * scale,
    cx: centerX + (box.cx - centerX) * scale,
    cy: centerY + (box.cy - centerY) * scale,
  });

  const intersectsHitboxes = (px, py, radius, hitboxes, options = {}) => {
    const scale = options.scale ?? 1;
    const offsetY = options.offsetY ?? 0;
    const centerX = options.centerX ?? 0;
    const centerY = options.centerY ?? 0;
    for (let i = 0; i < hitboxes.length; i += 1) {
      const box = hitboxes[i];
      if (box.type === "triangle") {
        const tri = getScaledTriangle(box, centerX, centerY, scale);
        if (circleIntersectsTriangle(px, py, radius, tri)) return true;
      } else if (box.type === "ring") {
        const cx = box.x;
        const cy = box.y + offsetY;
        if (circleIntersectsRing(px, py, radius, cx, cy, box.rOuter * scale, box.rInner * scale)) return true;
      } else if (box.type === "rect") {
        const pad = box.pad || 0;
        const rw = Math.max(1, box.width * scale - pad * 2);
        const rh = Math.max(1, box.height * scale - pad * 2);
        const rx = box.x - rw / 2;
        const ry = box.y - rh / 2 + offsetY;
        const nearestX = clamp(px, rx, rx + rw);
        const nearestY = clamp(py, ry, ry + rh);
        const dx = px - nearestX;
        const dy = py - nearestY;
        if (dx * dx + dy * dy <= radius * radius) return true;
      }
    }
    return false;
  };

  const hitSpikeAt = (px, py, radius) => {
    for (let i = 0; i < spikes.length; i += 1) {
      const spike = spikes[i];
      const pulse = getObstaclePulse(spike, 0.04);
      const minX = spike.midX + (spike.minX - spike.midX) * pulse;
      const maxX = spike.midX + (spike.maxX - spike.midX) * pulse;
      const minY = spike.midY + (spike.minY - spike.midY) * pulse;
      const maxY = spike.midY + (spike.maxY - spike.midY) * pulse;
      if (maxX < px - radius) continue;
      if (minX > px + radius) break;
      if (py < minY - radius || py > maxY + radius) continue;
      if (
        intersectsHitboxes(px, py, radius, spike.hitboxes, {
          scale: pulse,
          centerX: spike.midX,
          centerY: spike.midY,
        })
      )
        return spike;
    }
    return null;
  };

  const hitCogAt = (px, py, radius) => {
    for (let i = 0; i < cogs.length; i += 1) {
      const cog = cogs[i];
      const pulse = getObstaclePulse(cog, 0.04);
      const floatY = getObstacleFloat(cog);
      const box = cog.hitboxes[0];
      const halfW = (box.width * pulse) / 2;
      const halfH = (box.height * pulse) / 2;
      if (Math.abs(cog.x - px) > halfW + radius + 12) continue;
      if (Math.abs(cog.y + floatY - py) > halfH + radius + 12) continue;
      if (
        intersectsHitboxes(px, py, radius, cog.hitboxes, {
          scale: pulse,
          offsetY: floatY,
        })
      )
        return cog;
    }
    return null;
  };

  const hitOrbAt = (px, py, radius) => {
    for (let i = 0; i < orbs.length; i += 1) {
      const orb = orbs[i];
      const pulse = getObstaclePulse(orb, 0.06);
      const floatY = getObstacleFloat(orb);
      const box = orb.hitboxes[0];
      const halfW = (box.width * pulse) / 2;
      const halfH = (box.height * pulse) / 2;
      if (Math.abs(orb.x - px) > halfW + radius + 12) continue;
      if (Math.abs(orb.y + floatY - py) > halfH + radius + 12) continue;
      if (
        intersectsHitboxes(px, py, radius, orb.hitboxes, {
          scale: pulse,
          offsetY: floatY,
        })
      )
        return orb;
    }
    return null;
  };

  const hitTunnelAt = (px, py, radius) => {
    if (!tunnelWalls.length) return null;
    const range = 120;
    const startIndex = findFirstIndex(tunnelWalls, px - range);
    for (let i = startIndex; i < tunnelWalls.length; i += 1) {
      const wall = tunnelWalls[i];
      if (wall.x > px + range) break;
      const halfW = wall.width / 2;
      if (Math.abs(wall.x - px) > halfW + radius) continue;
      const bounds = getBounds(wall.x);
      const gap = getTunnelGap(wall, bounds);
      const topHeight = Math.max(0, gap.start - bounds.top);
      const bottomHeight = Math.max(0, bounds.bottom - gap.end);
      const spikeInsetTop = topHeight > 1 ? Math.min(20, topHeight * 0.55) : 0;
      const spikeInsetBottom = bottomHeight > 1 ? Math.min(20, bottomHeight * 0.55) : 0;
      const safeStart = gap.start + spikeInsetTop;
      const safeEnd = gap.end - spikeInsetBottom;
      if (py < safeStart - radius || py > safeEnd + radius) {
        return gap;
      }
    }
    return null;
  };

  const isTunnelSection = (px, radius = 0) => {
    if (!tunnelWalls.length) return false;
    const range = 160;
    const startIndex = findFirstIndex(tunnelWalls, px - range);
    for (let i = startIndex; i < tunnelWalls.length; i += 1) {
      const wall = tunnelWalls[i];
      if (wall.x > px + range) break;
      const halfW = wall.width / 2;
      if (Math.abs(wall.x - px) <= halfW + radius + 6) return true;
    }
    return false;
  };

  const hitSpike = (px, py) => hitSpikeAt(px, py, player.size);

  const hitCog = (px, py) => hitCogAt(px, py, player.size);

  const hitOrb = (px, py) => hitOrbAt(px, py, player.size);

  const hitTunnel = (px, py) => hitTunnelAt(px, py, player.size);

  const setShieldActive = (active) => {
    if (runtime.shieldActive === active) return;
    runtime.shieldActive = active;
    callbacks.onShield?.(active);
  };

  const setCombo = (value) => {
    if (runtime.combo === value) return;
    runtime.combo = value;
    callbacks.onCombo?.(value);
  };

  const resetCombo = () => {
    runtime.comboTimer = 0;
    setCombo(0);
  };

  const bumpCombo = () => {
    const nextCombo = Math.min(runtime.combo + 1, 6);
    runtime.comboTimer = config.comboTimeout;
    setCombo(nextCombo);
    return nextCombo;
  };

  const collectPickup = (pickup) => {
    if (pickup.type === "shield") {
      runtime.shieldTime = config.shieldDuration;
      setShieldActive(true);
      return;
    }
    const combo = bumpCombo();
    const bonus = 5 * combo;
    callbacks.onPickup?.({
      type: "gem",
      bonus,
      combo,
      gems: 1,
    });
  };

  const buildLevel = () => {
    topPoints = [];
    bottomPoints = [];
    spikes = [];

    const step = level.spacing;
    const steps = Math.ceil(level.length / step) + 8;
    const weighted = [-step, 0, 0, 0, step];
    const outer = Math.max(0, state.height - level.margin * 2);
    const maxGap = outer;
    const gapMin = Math.min(level.gapMin, maxGap);
    const gapMax = Math.min(level.gapMax, maxGap);
    const initialGap = clamp(Math.max(80, outer - 160), gapMin, gapMax);

    let topY = level.margin + Math.max(0, (outer - initialGap) / 2);
    let bottomY = topY + initialGap;

    let topSlope = 0;
    let bottomSlope = 0;
    let topRun = 6;
    let bottomRun = 6;

    topPoints.push({ x: 0, y: topY });
    bottomPoints.push({ x: 0, y: bottomY });

    for (let i = 1; i < steps; i += 1) {
      if (topRun <= 0) {
        topSlope = pick(weighted);
        topRun = Math.floor(rand(2, 6));
      }
      if (bottomRun <= 0) {
        bottomSlope = pick(weighted);
        bottomRun = Math.floor(rand(2, 6));
      }

      let candidateTop = topY + topSlope;
      let candidateBottom = bottomY + bottomSlope;
      let gap = candidateBottom - candidateTop;

      if (
        candidateTop < level.margin ||
        candidateBottom > state.height - level.margin ||
        gap < gapMin ||
        gap > gapMax
      ) {
        candidateTop = topY;
        candidateBottom = bottomY;
        gap = candidateBottom - candidateTop;
        topSlope = 0;
        bottomSlope = 0;
        topRun = 1;
        bottomRun = 1;
      }

      topY = candidateTop;
      bottomY = candidateBottom;
      topRun -= 1;
      bottomRun -= 1;

      topPoints.push({ x: i * step, y: topY });
      bottomPoints.push({ x: i * step, y: bottomY });
    }

    state.levelEndX = topPoints[topPoints.length - 1]?.x || level.length;
    state.finishX = Math.max(0, state.levelEndX - state.finishBuffer);
    buildObstaclePatterns();
    rebuildPaths();
  };

  const getBounds = (worldX) => {
    let index = 0;
    while (index < topPoints.length - 2 && topPoints[index + 1].x < worldX) {
      index += 1;
    }
    const t0 = topPoints[index];
    const t1 = topPoints[index + 1] || t0;
    const b0 = bottomPoints[index];
    const b1 = bottomPoints[index + 1] || b0;
    const t = t1.x === t0.x ? 0 : (worldX - t0.x) / (t1.x - t0.x);
    const top = lerp(t0.y, t1.y, t);
    const bottom = lerp(b0.y, b1.y, t);
    const topFlat = Math.abs(t1.y - t0.y) < 1;
    const bottomFlat = Math.abs(b1.y - b0.y) < 1;
    return {
      top,
      bottom,
      topFlat,
      bottomFlat,
    };
  };

  const computeCameraY = (playerY, bounds) => {
    const corridorHeight = bounds.bottom - bounds.top;
    const centerCam = (bounds.top + bounds.bottom) / 2 - state.height / 2;
    if (corridorHeight <= state.height) {
      return centerCam;
    }
    const extra = corridorHeight - state.height;
    const range = extra * 0.25;
    const desired = playerY - state.height / 2;
    return clamp(desired, centerCam - range, centerCam + range);
  };

  const getCameraY = (playerY, bounds) => {
    if (state.cameraLocked) return state.lockedCameraY;
    return computeCameraY(playerY, bounds);
  };

  const findFirstIndex = (list, x) => {
    let low = 0;
    let high = list.length - 1;
    let result = list.length;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (list[mid].x >= x) {
        result = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return result;
  };

  const buildPickups = () => {
    pickups = [];
    const startX = config.startX + 220;
    for (let x = startX; x < level.length - 260; x += config.pickupSpacing) {
      if (rng() > config.pickupChance) continue;
      const jitter = rand(-config.pickupJitter, config.pickupJitter);
      const posX = x + jitter;
      const bounds = getBounds(posX);
      const margin = 60;
      if (bounds.bottom - bounds.top < margin * 2) continue;
      const isShield = rng() < config.shieldChance;
      const radius = isShield ? config.pickupRadius * 1.3 : config.pickupRadius;
      if (isTunnelSection(posX, radius)) {
        continue;
      }
      let y = null;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const candidate = rand(bounds.top + margin, bounds.bottom - margin);
        if (
          !hitSpikeAt(posX, candidate, radius) &&
          !hitCogAt(posX, candidate, radius) &&
          !hitOrbAt(posX, candidate, radius) &&
          !hitTunnelAt(posX, candidate, radius)
        ) {
          y = candidate;
          break;
        }
      }
      if (y == null) continue;
      pickups.push({
        x: posX,
        y,
        r: radius,
        type: isShield ? "shield" : "gem",
        pulse: rand(0, Math.PI * 2),
      });
    }
  };

  const buildStars = () => {
    if (!state.width || !state.height) return;
    if (state.forceLowPerf) {
      stars = [];
      return;
    }
    const density = state.forceLowPerf ? 70000 : 52000;
    const count = Math.max(18, Math.round((state.width * state.height) / density));
    stars = Array.from({ length: count }, () => ({
      x: rand(0, state.width),
      y: rand(-state.height * 0.2, state.height * 1.2),
      r: rand(0.5, 1.1),
      tw: rand(0, Math.PI * 2),
      speed: rand(0.5, 1.1),
      depth: rand(0.2, 0.6),
    }));
  };

  const updateStars = (dt, speed) => {
    if (state.lowPerf || !stars.length) return;
    const drift = speed * dt;
    for (let i = 0; i < stars.length; i += 1) {
      const star = stars[i];
      star.x -= drift * (0.12 + star.depth * 0.35);
      star.y += Math.sin(state.time * 0.6 + star.tw) * 0.04;
      star.tw += dt * (0.6 + star.depth);
      if (star.x < -80) {
        star.x = state.width + rand(40, 100);
        star.y = rand(-state.height * 0.2, state.height * 1.2);
        star.tw = rand(0, Math.PI * 2);
      }
      if (star.y < -state.height * 0.3) {
        star.y = state.height * 1.1;
      } else if (star.y > state.height * 1.2) {
        star.y = -state.height * 0.2;
      }
    }
  };

  const buildBots = () => {
    bots = [];
    if (state.mode !== "race") return;
    const count = 3;
    const leaderIndex = Math.floor(rng() * count);
    const maxCrashable = Math.max(0, count - 1);
    const crashableCount = Math.floor(rng() * (maxCrashable + 1));
    const crashableIndices = new Set();
    while (crashableIndices.size < crashableCount) {
      crashableIndices.add(Math.floor(rng() * count));
    }
    const baseX = player.x + 40;
    const spacing = 52;
    const minX = Math.max(40, player.x - 120);
    const maxX = Math.max(minX + 60, state.width - 80);
    for (let i = 0; i < count; i += 1) {
      const skin = BOT_SKINS[i % BOT_SKINS.length];
      const startX = clamp(baseX + i * spacing + rand(-12, 12), minX, maxX);
      const worldX = state.offset + startX;
      const bounds = getBounds(worldX);
      const gap = bounds.bottom - bounds.top;
      const targetOffset = rand(-0.22, 0.22);
      const center = (bounds.top + bounds.bottom) / 2 + targetOffset * gap;
      const botSize = player.size * 0.9;
      let y = clamp(center, bounds.top + botSize, bounds.bottom - botSize);
      const isSafeSpot = (value) =>
        !hitSpikeAt(worldX, value, botSize) &&
        !hitCogAt(worldX, value, botSize) &&
        !hitOrbAt(worldX, value, botSize) &&
        !hitTunnelAt(worldX, value, botSize);
      if (!isSafeSpot(y)) {
        const step = Math.max(8, gap * 0.08);
        let found = false;
        for (let n = 1; n <= 8; n += 1) {
          const up = clamp(y - step * n, bounds.top + botSize, bounds.bottom - botSize);
          const down = clamp(y + step * n, bounds.top + botSize, bounds.bottom - botSize);
          if (isSafeSpot(up)) {
            y = up;
            found = true;
            break;
          }
          if (isSafeSpot(down)) {
            y = down;
            found = true;
            break;
          }
        }
        if (!found) {
          y = clamp((bounds.top + bounds.bottom) / 2, bounds.top + botSize, bounds.bottom - botSize);
        }
      }
      const leaderBoost = i === leaderIndex ? rand(0.08, 0.14) : rand(-0.03, 0.03);
      const safeTime = rand(1.8, 2.8);
      const safeX = worldX + rand(900, 1400);
      bots.push({
        id: `bot-${i}`,
        slot: i,
        x: startX,
        y,
        size: botSize,
        vy: 0,
        tilt: 0,
        input: y > center,
        speedFactor: clamp(rand(0.9, 1.04) + leaderBoost, 0.88, 1.16),
        targetOffset,
        safeTime,
        safeX,
        crashEligible: crashableIndices.has(i),
        crashChance: rand(0.02, 0.045),
        crashTime: 0,
        crashDuration: 0.6,
        crashPieces: [],
        crashed: false,
        completing: false,
        completeTime: 0,
        completeDuration: rand(2.4, 3.1),
        completeStartX: 0,
        completeStartY: 0,
        completeTargetX: 0,
        completeTargetY: 0,
        completeSpin: rand(2.2, 3.1),
        finishBias: rand(-0.5, 0.6),
        finishTime: null,
        finished: false,
        trail: [],
        trailTick: false,
        skin,
      });
    }
  };

  const reset = (levelConfig) => {
    resize();
    applyLevel(levelConfig);
    state.levelConfig = levelConfig;
    state.mode = levelConfig?.mode || "classic";
    state.shape = levelConfig?.shape || state.shape || "classic";
    setTrail(levelConfig?.trail);
    level.length = state.mode === "endless" ? config.endlessLength : 14000;
    state.crashing = false;
    state.crashTime = 0;
    state.completing = false;
    state.completeTime = 0;
    state.completeStartOffset = 0;
    state.completeTargetOffset = 0;
    state.completeSoundPlayed = false;
    state.completeZoom = 1;
    state.completeDrift = 0;
    state.lastSpeed = 0;
    state.playerFinishTime = null;
    state.avgDt = 0;
    state.lowPerf = false;
    state.perfScale = 1;
    state.timeScale = 1;
    state.impactTime = state.impactDuration;
    state.shakeTime = 0;
    crashPieces = [];
    runtime.shieldActive = false;
    runtime.shieldTime = 0;
    runtime.combo = 0;
    runtime.comboTimer = 0;
    callbacks.onShield?.(false);
    callbacks.onCombo?.(0);
    state.offset = 0;
    state.progress = 0;
    state.safeTime = 0.2;
    state.time = 0;
    state.waitingForInput = true;
    state.completeStartX = player.x;
    state.completeStartY = player.y;
    player.x = Math.min(config.startX, state.width * 0.3);
    trail = [];
    state.challengeActive = state.mode === "challenge";
    if (levelConfig?.startShield) {
      runtime.shieldTime = config.shieldDuration;
      setShieldActive(true);
    }
    if (state.challengeActive) {
      const baseTime = clamp(CHALLENGE_BASE_TIME + (levelConfig?.difficulty || 1) * 1.2, 8, 16);
      state.challengeTargets = CHALLENGE_TARGETS;
      state.challengeIndex = 0;
      state.challengeTimeMax = baseTime;
      state.challengeTime = baseTime;
      state.challengeMultiplier = 1;
      state.challengeHudTick = 0;
      callbacks.onChallenge?.({
        type: "start",
        timeLeft: state.challengeTime,
        timeMax: state.challengeTimeMax,
        next: state.challengeTargets[0],
        multiplier: state.challengeMultiplier,
        index: 0,
        total: state.challengeTargets.length,
      });
    } else {
      callbacks.onChallenge?.({ type: "stop" });
    }
    buildLevel();
    const startBounds = getBounds(player.x);
    const centerY = (startBounds.top + startBounds.bottom) / 2;
    if (startBounds.bottomFlat) {
      player.y = startBounds.bottom - player.size;
    } else if (startBounds.topFlat && !startBounds.bottomFlat) {
      player.y = centerY;
    } else if (startBounds.topFlat) {
      player.y = startBounds.top + player.size;
    } else {
      player.y = centerY;
    }
    player.vy = 0;
    player.tilt = 0;
    state.lockedCameraY = 0;
    state.cameraY = 0;
    buildPickups();
    buildBots();
    buildStars();
    callbacks.onProgress(0);
    callbacks.onBest(state.bestProgress);
  };

  const setInput = (value) => {
    input.active = value;
  };

  const drawBackground = () => {
    const theme = state.theme || THEMES.cobalt;
    ctx.fillStyle = theme.bg || "#0a0a0a";
    ctx.fillRect(0, 0, state.width, state.height);
    if (!state.lowPerf) {
      const glow = ctx.createLinearGradient(0, 0, 0, state.height);
      glow.addColorStop(0, hexToRgba(theme.fillTop || "#3fd9ff", 0.12));
      glow.addColorStop(0.5, hexToRgba(theme.fillBottom || "#1a82e6", 0.05));
      glow.addColorStop(1, hexToRgba(theme.bg || "#0a0a0a", 0.22));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, state.width, state.height);
    }
    // Removed scanline overlay for a cleaner, lighter game view.
    if (state.lowPerf || (state.perfScale || 1) < 0.75) return;

    if (stars.length) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      for (let i = 0; i < stars.length; i += 1) {
        const star = stars[i];
        const x = star.x;
        if (x < -60 || x > state.width + 60) continue;
        const y = star.y;
        const twinkle = 0.55 + 0.45 * Math.sin(state.time * 2.4 + star.tw);
        ctx.beginPath();
        ctx.arc(x, y, star.r * (0.7 + twinkle * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.35 + twinkle * 0.4})`;
        ctx.fill();
      }
      ctx.restore();
    }
  };

  const drawCorridorFill = () => {
    const theme = state.theme || THEMES.cobalt;
    const fillTop = theme.fillTop || "#33d1ff";
    const fillBottom = theme.fillBottom || "#1e89e8";
    const fillGradient = ctx.createLinearGradient(0, 0, 0, state.height);
    fillGradient.addColorStop(0, adjustColor(fillTop, 0.06));
    fillGradient.addColorStop(0.55, adjustColor(fillBottom, -0.02));
    fillGradient.addColorStop(1, adjustColor(fillBottom, -0.08));
    ctx.fillStyle = state.lowPerf ? fillBottom : fillGradient;

    if (corridorPath) {
      ctx.save();
      ctx.translate(-state.offset, 0);
      ctx.fill(corridorPath);
      ctx.restore();
      return;
    }

    ctx.beginPath();
    topPoints.forEach((point, idx) => {
      const x = point.x - state.offset;
      const y = point.y;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    for (let i = bottomPoints.length - 1; i >= 0; i -= 1) {
      const point = bottomPoints[i];
      const x = point.x - state.offset;
      const y = point.y;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };

  const drawEdges = () => {
    ctx.lineJoin = "miter";

    const drawLine = (color, width) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;

      if (topEdgePath && bottomEdgePath) {
        ctx.save();
        ctx.translate(-state.offset, 0);
        ctx.stroke(topEdgePath);
        ctx.stroke(bottomEdgePath);
        ctx.restore();
        return;
      }

      ctx.beginPath();
      topPoints.forEach((point, idx) => {
        const x = point.x - state.offset;
        const y = point.y;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.beginPath();
      bottomPoints.forEach((point, idx) => {
        const x = point.x - state.offset;
        const y = point.y;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    if (state.lowPerf || (state.perfScale || 1) < 0.75) {
      drawLine(state.theme?.edge || "#f6f2ff", 4);
      return;
    }
    drawLine("rgba(0,0,0,0.7)", 16);
    drawLine(state.theme?.edge || "#f6f2ff", 6);
    drawLine("rgba(0,0,0,0.2)", 2);
  };

  const drawObstacleRect = (x, y, width, height, alpha = 1, palette = null) => {
    const colors = palette || getObstaclePalette();
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = state.lowPerf ? 0 : 4 * (state.perfScale || 1);
    ctx.shadowColor = colors.glow || colors.fill;
    ctx.fillStyle = colors.fill;
    ctx.fillRect(x, y, width, height);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.strokeRect(x, y, width, height);
    const inset = Math.min(4, Math.max(1, Math.floor(Math.min(width, height) * 0.08)));
    if (width > inset * 2 && height > inset * 2) {
      const highlight = adjustColor(colors.fill, 0.18);
      const shadow = adjustColor(colors.fill, -0.12);
      const innerW = width - inset * 2;
      const topH = Math.max(2, Math.floor(height * 0.1));
      const bottomH = Math.max(2, Math.floor(height * 0.08));
      ctx.fillStyle = highlight;
      ctx.fillRect(x + inset, y + inset, innerW, topH);
      ctx.fillStyle = shadow;
      ctx.fillRect(x + inset, y + height - inset - bottomH, innerW, bottomH);
    }
    ctx.restore();
  };

  const drawRectSpikes = (x, y, width, height, direction, palette, alpha) => {
    const spikeScale = RECT_SPIKE_SCALE;
    const spikeCount = clamp(Math.floor(width / (18 * spikeScale)), 2, 10);
    const spikeWidth = width / spikeCount;
    const spikeHeight = Math.min(spikeWidth * SPIKE_HEIGHT_RATIO * spikeScale, height * 0.6);
    const baseY = direction === "down" ? y + height : y;
    const tipOffset = direction === "down" ? spikeHeight : -spikeHeight;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.fill;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < spikeCount; i += 1) {
      const sx = x + i * spikeWidth;
      const mx = sx + spikeWidth / 2;
      ctx.moveTo(sx, baseY);
      ctx.lineTo(sx + spikeWidth, baseY);
      ctx.lineTo(mx, baseY + tipOffset);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  const drawTunnelWalls = () => {
    if (!tunnelWalls.length) return;
    const viewLeft = state.offset - 200;
    const viewRight = state.offset + state.width + 200;
    const startIndex = findFirstIndex(tunnelWalls, viewLeft - 200);
    for (let i = startIndex; i < tunnelWalls.length; i += 1) {
      const wall = tunnelWalls[i];
      if (wall.x > viewRight + 200) break;
      const palette = getObstaclePalette(wall.boss ? 2 : 0);
      const bounds = getBounds(wall.x);
      const gap = getTunnelGap(wall, bounds);
      const pulse = 1 + Math.sin(state.time * 1.6 + wall.phase) * 0.02;
      const width = wall.width * pulse;
      const x = wall.x - state.offset - width / 2;
      const topHeight = Math.max(0, gap.start - bounds.top);
      const bottomY = gap.end;
      const bottomHeight = Math.max(0, bounds.bottom - gap.end);
      if (topHeight > 1) {
        drawObstacleRect(x, bounds.top, width, topHeight, 1, palette);
        drawRectSpikes(x, bounds.top, width, topHeight, "down", palette, 1);
      }
      if (bottomHeight > 1) {
        drawObstacleRect(x, bottomY, width, bottomHeight, 1, palette);
        drawRectSpikes(x, bottomY, width, bottomHeight, "up", palette, 1);
      }
    }
  };

  const drawSpikes = () => {
    ctx.save();
    const palette = getObstaclePalette(0);
    const viewLeft = state.offset - 160;
    const viewRight = state.offset + state.width + 160;
    const startIndex = findFirstIndex(spikes, viewLeft - 160);
    for (let i = startIndex; i < spikes.length; i += 1) {
      const spike = spikes[i];
      if (spike.minX > viewRight + 200) break;
      if (spike.maxX < viewLeft - 200) continue;
      const pulse = 1 + Math.sin(state.time * spike.pulseSpeed + spike.pulse) * 0.04;
      const halfBase = (spike.baseLen * pulse) / 2;
      const height = spike.heightLen * pulse;
      const midX = spike.midX - state.offset;
      const midY = spike.midY;
      const ax = midX - spike.tx * halfBase;
      const ay = midY - spike.ty * halfBase;
      const bx = midX + spike.tx * halfBase;
      const by = midY + spike.ty * halfBase;
      const cx = midX + spike.nx * height;
      const cy = midY + spike.ny * height;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineTo(cx, cy);
      ctx.closePath();
    ctx.shadowBlur = state.lowPerf ? 0 : 4 * (state.perfScale || 1);
      ctx.shadowColor = palette.glow || palette.fill;
      ctx.fillStyle = palette.fill;
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawCogs = () => {
    ctx.lineWidth = 2;
    // Neon block obstacles (sequence blocks).
    const palette = getObstaclePalette(1);
    const viewLeft = state.offset - 140;
    const viewRight = state.offset + state.width + 140;
    const startIndex = findFirstIndex(cogs, viewLeft - 140);
    for (let i = startIndex; i < cogs.length; i += 1) {
      const cog = cogs[i];
      if (cog.x > viewRight + 140) break;
      const x = cog.x - state.offset;
      const floatY = getObstacleFloat(cog);
      const pulse = getObstaclePulse(cog, 0.05);
      const box = cog.hitboxes[0];
      const width = box.width * pulse;
      const height = box.height * pulse;
      const drawX = x - width / 2;
      const drawY = cog.y + floatY - height / 2;
      drawObstacleRect(drawX, drawY, width, height, 1, palette);
      const bounds = getBounds(cog.x);
      if (!cog.noSpikes && drawY <= bounds.top + 40) {
        drawRectSpikes(drawX, drawY, width, height, "down", palette, 1);
      }
    }
  };

  const drawPickups = () => {
    if (!pickups.length) return;
    ctx.save();
    const viewLeft = state.offset - 120;
    const viewRight = state.offset + state.width + 120;
    const startIndex = findFirstIndex(pickups, viewLeft - 120);
    const simplified = state.lowPerf || (state.perfScale || 1) < 0.75;
    for (let i = startIndex; i < pickups.length; i += 1) {
      const pickup = pickups[i];
      if (pickup.x > viewRight + 120) break;
      const x = pickup.x - state.offset;
      if (x < -100 || x > state.width + 100) continue;
      if (simplified) {
        ctx.save();
        ctx.translate(x, pickup.y);
        ctx.beginPath();
        if (pickup.type === "shield") {
          ctx.fillStyle = state.theme.cogCore;
          ctx.arc(0, 0, pickup.r, 0, Math.PI * 2);
        } else {
          ctx.fillStyle = state.theme.trail;
          ctx.moveTo(0, -pickup.r);
          ctx.lineTo(pickup.r * 0.9, 0);
          ctx.lineTo(0, pickup.r);
          ctx.lineTo(-pickup.r * 0.9, 0);
          ctx.closePath();
        }
        ctx.fill();
        ctx.restore();
        continue;
      }

      const pulse = 1 + Math.sin(pickup.pulse) * 0.12;
      ctx.save();
      ctx.translate(x, pickup.y);
      ctx.scale(pulse, pulse);
      if (pickup.type === "shield") {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.shadowBlur = 12;
        ctx.shadowColor = state.theme.cogCore;
        ctx.beginPath();
        ctx.arc(0, 0, pickup.r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = state.theme.cogCore;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, pickup.r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        ctx.rotate(pickup.pulse * 0.35);
        ctx.fillStyle = state.theme.trail;
        ctx.shadowBlur = 10;
        ctx.shadowColor = state.theme.trailGlow;
        const size = pickup.r * 1.15;
        const baseAlpha = ctx.globalAlpha;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.9, -size * 0.1);
        ctx.lineTo(size * 0.55, size);
        ctx.lineTo(-size * 0.55, size);
        ctx.lineTo(-size * 0.9, -size * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.stroke();
        ctx.globalAlpha = baseAlpha * 0.35;
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.6);
        ctx.lineTo(size * 0.45, -size * 0.1);
        ctx.lineTo(0, size * 0.55);
        ctx.lineTo(-size * 0.45, -size * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = baseAlpha;
      }
      ctx.restore();
    }
    ctx.restore();
  };

  const startCrash = (worldX, worldY, angle) => {
    state.crashing = true;
    state.crashTime = 0;
    state.timeScale = 0.35;
    state.impactTime = 0;
    state.impactDuration = 0.32;
    state.shakeTime = state.shakeDuration;
    state.shakeAmp = state.lowPerf ? 6 : 10;
    trail = [];
    const count = 16;
    const forward = Math.cos(angle);
    const upward = Math.sin(angle);
    crashPieces = Array.from({ length: count }, (_, index) => {
      const spread = rand(-Math.PI, Math.PI);
      const speed = rand(40, 160);
      return {
        x: worldX,
        y: worldY,
        vx: Math.cos(spread) * speed + forward * 120,
        vy: Math.sin(spread) * speed + upward * 60,
        rot: rand(0, Math.PI * 2),
        rotSpeed: rand(-6, 6),
        size: rand(3, 8),
        color: index % 3 === 0 ? state.skin.fillBottom : state.skin.fillTop,
        life: rand(0.4, 0.8),
      };
    });
  };

  const updateCrashPieces = (dt) => {
    const gravity = 240;
    crashPieces = crashPieces.filter((piece) => {
      piece.life -= dt;
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.vy += gravity * dt;
      piece.vx *= 0.98;
      piece.rot += piece.rotSpeed * dt;
      return piece.life > 0;
    });
  };

  const drawCrashPieces = () => {
    if (!crashPieces.length) return;
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    crashPieces.forEach((piece) => {
      const x = piece.x - state.offset;
      if (x < -80 || x > state.width + 80) return;
      const alpha = Math.min(1, Math.max(0, piece.life / state.crashDuration));
      ctx.save();
      ctx.translate(x, piece.y);
      ctx.rotate(piece.rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = piece.color;
      ctx.beginPath();
      ctx.moveTo(-piece.size, -piece.size * 0.6);
      ctx.lineTo(piece.size, 0);
      ctx.lineTo(-piece.size, piece.size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  };

  const startCompletion = () => {
    if (state.completing) return;
    state.completing = true;
    state.completeTime = 0;
    trail = [];
    state.completeSoundPlayed = false;
    if (state.playerFinishTime == null) {
      state.playerFinishTime = state.time;
    }
    state.completeStartX = player.x;
    state.completeStartY = player.y;
    state.completeStartOffset = state.offset;
    const finishX = state.finishX || state.levelEndX;
    const levelEndX = state.levelEndX || finishX;
    const exitBounds = getBounds(levelEndX - 10);
    const targetScreenX = clamp(state.width - 90, player.x + 120, state.width - 60);
    state.completeTargetX = targetScreenX;
    state.completeTargetY = (exitBounds.top + exitBounds.bottom) / 2;
    state.completeTargetOffset = Math.max(0, levelEndX - targetScreenX);
    state.completeDuration = rand(4.2, 5.1);
    state.completeSpin = rand(1.6, 2.2);
    state.completeZoom = rand(1.02, 1.06);
    state.completeDrift = rand(-40, 40);
    if (state.mode === "race" && bots.length) {
      bots.forEach((bot) => {
        if (!bot.crashed && !bot.finished) {
          startBotCompletion(bot, levelEndX);
        }
      });
    }
  };

  const drawOrbs = () => {
    if (!orbs.length) return;
    // Neon zig-zag blocks.
    const palette = getObstaclePalette(2);
    const viewLeft = state.offset - 140;
    const viewRight = state.offset + state.width + 140;
    for (let i = 0; i < orbs.length; i += 1) {
      const orb = orbs[i];
      if (orb.x < viewLeft || orb.x > viewRight) continue;
      const x = orb.x - state.offset;
      if (x < -80 || x > state.width + 80) continue;
      const floatY = getObstacleFloat(orb);
      const pulse = getObstaclePulse(orb, 0.04);
      const box = orb.hitboxes[0];
      const size = box.width * pulse;
      const drawX = x - size / 2;
      const drawY = orb.y + floatY - size / 2;
      drawObstacleRect(drawX, drawY, size, size, 1, palette);
      const bounds = getBounds(orb.x);
      if (drawY <= bounds.top + 40) {
        drawRectSpikes(drawX, drawY, size, size, "down", palette, 1);
      }
    }
  };

  const updateCompletion = (dt) => {
    const endX = state.finishX || state.levelEndX || level.length;
    const botSpeed = state.lastSpeed || config.speed;
    updateBots(dt, botSpeed, endX);
    state.completeTime += dt;
    const t = clamp(state.completeTime / state.completeDuration, 0, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const arc = Math.sin(t * Math.PI) * -14;
    const drift = Math.sin(t * Math.PI * 1.25) * state.completeDrift;
    if (!state.completeSoundPlayed && t >= 0.8) {
      state.completeSoundPlayed = true;
      callbacks.onCompleteSound?.();
    }
    player.x = lerp(state.completeStartX, state.completeTargetX, ease);
    player.y = lerp(state.completeStartY, state.completeTargetY, ease) + arc;
    player.tilt += dt * state.completeSpin;
    state.offset = lerp(state.completeStartOffset, state.completeTargetOffset, ease);
    const completeWorldX = state.offset + player.x;
    const completeBounds = getBounds(completeWorldX);
    const targetCameraY = getCameraY(player.y, completeBounds);
    state.cameraY = lerp(state.cameraY, targetCameraY + drift, 0.08);
    if (t >= 1) {
      stop(false, true);
    }
  };

  const drawTrail = () => {
    if (trail.length < 2) return;

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const lowPerf = state.lowPerf;
    const perfScale = state.perfScale || 1;
    const pulse = lowPerf ? 0 : 0.5 + 0.5 * Math.sin(state.time * 2.2);
    const trailStyle = state.trailStyle || {
      color: state.skin.trail,
      glow: state.skin.trailGlow,
      edge: state.skin.edge,
    };
    ctx.lineWidth = lowPerf ? 3.5 : (4.8 + pulse * 1.4) * perfScale;
    ctx.strokeStyle = trailStyle.color;
    ctx.shadowBlur = lowPerf ? 0 : (6 + pulse * 3) * perfScale;
    ctx.shadowColor = trailStyle.glow;
    ctx.beginPath();
    trail.forEach((point, idx) => {
      const x = point.x - state.offset;
      const y = point.y;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    if (!lowPerf && perfScale > 0.75) {
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2.6 * perfScale;
      ctx.strokeStyle = trailStyle.edge || state.skin.edge;
      ctx.beginPath();
      trail.forEach((point, idx) => {
        const x = point.x - state.offset;
        const y = point.y;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawBotTrails = () => {
    if (!bots.length) return;
    const lowPerf = state.lowPerf;
    const perfScale = state.perfScale || 1;
    if (perfScale < 0.65 && lowPerf) return;
    bots.forEach((bot) => {
      if (bot.crashed || bot.finished) return;
      if (bot.trail.length < 2) return;
      ctx.save();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.globalAlpha = 0.55 + perfScale * 0.25;
      ctx.lineWidth = lowPerf ? 2.6 : 3.2 * perfScale;
      ctx.strokeStyle = bot.skin.trail;
      ctx.shadowBlur = lowPerf ? 0 : 4 * perfScale;
      ctx.shadowColor = bot.skin.trailGlow;
      ctx.beginPath();
      bot.trail.forEach((point, idx) => {
        const x = point.x - state.offset;
        const y = point.y;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    });
  };

  const drawBotCrashPieces = () => {
    if (!bots.length) return;
    bots.forEach((bot) => {
      if (!bot.crashPieces.length) return;
      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      bot.crashPieces.forEach((piece) => {
        const x = piece.x - state.offset;
        if (x < -80 || x > state.width + 80) return;
        const alpha = Math.min(1, Math.max(0, piece.life / bot.crashDuration));
        ctx.save();
        ctx.translate(x, piece.y);
        ctx.rotate(piece.rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = piece.color;
        ctx.beginPath();
        ctx.moveTo(-piece.size, -piece.size * 0.6);
        ctx.lineTo(piece.size, 0);
        ctx.lineTo(-piece.size, piece.size * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();
    });
  };

  const drawBot = (bot) => {
    ctx.save();
    ctx.translate(bot.x, bot.y);
    ctx.rotate(bot.tilt);
    const shape = getPointerShape(state.shape);
    ctx.fillStyle = bot.skin.fillTop;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 2.2;
    ctx.shadowBlur = state.lowPerf ? 0 : 3 * perfScale;
    ctx.shadowColor = bot.skin.trailGlow;
    ctx.beginPath();
    shape.main.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();

    ctx.fillStyle = bot.skin.fillBottom;
    ctx.beginPath();
    shape.tail.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  const drawBots = () => {
    if (state.mode !== "race" || !bots.length) return;
    bots.forEach((bot) => {
      if (bot.crashed || bot.finished) return;
      drawBot(bot);
    });
  };

  const drawPlayer = () => {
    ctx.save();
    ctx.translate(player.x, player.y);
    const angle = player.tilt;
    ctx.rotate(angle);
    const shape = getPointerShape(state.shape);
    ctx.fillStyle = state.skin.fillTop;
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    const perfScale = state.perfScale || 1;
    ctx.lineWidth = 2.4 + perfScale * 0.8;
    const glow = 0.6 + 0.4 * Math.sin(state.time * 5);
    ctx.shadowBlur = state.lowPerf ? 0 : (4 + glow * 3) * perfScale;
    ctx.shadowColor = state.skin.trailGlow;
    ctx.beginPath();
    shape.main.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();

    ctx.fillStyle = state.skin.fillBottom;
    ctx.beginPath();
    shape.tail.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (runtime.shieldActive) {
      ctx.save();
      ctx.translate(player.x, player.y);
      const trailStyle = state.trailStyle || { glow: state.skin.trailGlow };
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      const shieldPulse = 1 + Math.sin(state.time * 6) * 0.08;
      ctx.lineWidth = 3 + shieldPulse;
      ctx.shadowBlur = 10 + shieldPulse * 6;
      ctx.shadowColor = trailStyle.glow || state.skin.trailGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 16 * shieldPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (state.completing) {
      ctx.save();
      ctx.translate(player.x, player.y);
      const pulse = 1 + Math.sin(state.completeTime * 6) * 0.08;
      ctx.globalAlpha = 0.7;
      const trailStyle = state.trailStyle || { glow: state.skin.trailGlow };
      ctx.strokeStyle = trailStyle.glow || state.skin.trailGlow;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = state.lowPerf ? 0 : 8 * perfScale;
      ctx.shadowColor = trailStyle.glow || state.skin.trailGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 20 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  };

  const updatePickups = (worldX, dt) => {
    if (!pickups.length) return;
    const viewLeft = state.offset - 260;
    const viewRight = state.offset + state.width + 260;
    const startIndex = findFirstIndex(pickups, viewLeft - 260);
    for (let i = startIndex; i < pickups.length; i += 1) {
      const pickup = pickups[i];
      if (pickup.x > viewRight + 260) break;
      pickup.pulse += dt * 3;
      const dx = pickup.x - worldX;
      const dy = pickup.y - player.y;
      if (dx * dx + dy * dy <= (pickup.r + player.size) ** 2) {
        collectPickup(pickup);
        pickups.splice(i, 1);
        i -= 1;
      }
    }
  };

  const startBotCompletion = (bot, endX) => {
    if (bot.completing || bot.finished || bot.crashed) return;
    bot.completing = true;
    bot.completeTime = 0;
    bot.completeStartX = bot.x;
    bot.completeStartY = bot.y;
    const exitBounds = getBounds(endX - 10);
    const laneShift = bot.slot * 18;
    bot.completeTargetX = clamp(state.width - 90 - laneShift, bot.x + 40, state.width - 60);
    bot.completeTargetY = (exitBounds.top + exitBounds.bottom) / 2 + rand(-6, 6);
    bot.completeSpin = rand(2.2, 3.1);
    bot.trail = [];
  };

  const spawnBotCrash = (bot) => {
    if (bot.crashed || bot.completing || bot.finished) return;
    bot.crashed = true;
    bot.crashTime = 0;
    const count = 6;
    bot.crashPieces = Array.from({ length: count }, () => ({
      x: state.offset + bot.x,
      y: bot.y,
      vx: rand(-180, 180),
      vy: rand(-160, 160),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-6, 6),
      size: rand(6, 12),
      life: bot.crashDuration,
      color: bot.skin.fillTop,
    }));
  };

  const updateBotCrashPieces = (bot, dt) => {
    if (!bot.crashPieces.length) return;
    bot.crashPieces = bot.crashPieces.filter((piece) => {
      piece.life -= dt;
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.vy += 220 * dt;
      piece.vx *= 0.98;
      piece.rot += piece.rotSpeed * dt;
      return piece.life > 0;
    });
    if (!bot.crashPieces.length) {
      bot.finished = true;
    }
  };

  const isNearObstacle = (worldX, y) => {
    const range = 80;
    if (spikes.length) {
      const startIndex = findFirstIndex(spikes, worldX - range);
      for (let i = startIndex; i < spikes.length; i += 1) {
        const spike = spikes[i];
        if (spike.x > worldX + range) break;
        if (y >= spike.minY - 12 && y <= spike.maxY + 12) return true;
      }
    }
    for (let i = 0; i < cogs.length; i += 1) {
      const cog = cogs[i];
      const box = cog.hitboxes[0];
      const halfW = box.width / 2;
      const halfH = box.height / 2;
      if (Math.abs(cog.x - worldX) > range + halfW) continue;
      const dy = Math.abs(y - (cog.y + getObstacleFloat(cog)));
      const pulse = getObstaclePulse(cog, 0.05);
      if (dy <= halfH * pulse + 18) return true;
    }
    for (let i = 0; i < orbs.length; i += 1) {
      const orb = orbs[i];
      const box = orb.hitboxes[0];
      const halfW = box.width / 2;
      const halfH = box.height / 2;
      if (Math.abs(orb.x - worldX) > range + halfW) continue;
      const dy = Math.abs(y - (orb.y + getObstacleFloat(orb)));
      const pulse = getObstaclePulse(orb, 0.06);
      if (dy <= halfH * pulse + 16) return true;
    }
    if (tunnelWalls.length) {
      const hit = hitTunnel(worldX, y);
      if (hit) return true;
    }
    return false;
  };

  const updateBots = (dt, speed, endX) => {
    if (state.mode !== "race" || !bots.length) return;
    const minX = Math.max(40, player.x - 140);
    const maxX = Math.max(minX + 60, Math.min(state.width - 60, player.x + 220));
    const trailMax = Math.max(20, Math.round((state.lowPerf ? 30 : 60) * (state.perfScale || 1)));
    bots.forEach((bot) => {
      if (bot.finished) {
        return;
      }
      if (bot.crashed) {
        updateBotCrashPieces(bot, dt);
        return;
      }
      if (bot.completing) {
        bot.completeTime += dt;
        const t = clamp(bot.completeTime / bot.completeDuration, 0, 1);
        const ease = t * t;
        const arc = Math.sin(t * Math.PI) * -8;
        bot.x = lerp(bot.completeStartX, bot.completeTargetX, ease);
        bot.y = lerp(bot.completeStartY, bot.completeTargetY, ease) + arc;
        bot.tilt += dt * bot.completeSpin;
        if (t >= 1) {
          if (bot.finishTime == null) {
            bot.finishTime = state.time;
          }
          bot.finished = true;
        }
        return;
      }
      bot.x += (bot.speedFactor - 1) * speed * dt * 0.9;
      bot.x = clamp(bot.x, minX, maxX);
      const worldX = state.offset + bot.x;
      if (worldX >= endX) {
        if (bot.finishTime == null) {
          bot.finishTime = state.time;
        }
        startBotCompletion(bot, endX);
        return;
      }
      const bounds = getBounds(worldX);
      const gap = bounds.bottom - bounds.top;
      const center = (bounds.top + bounds.bottom) / 2 + bot.targetOffset * gap;
      const margin = Math.max(16, gap * 0.18);
      if (bot.y > center + margin) {
        bot.input = true;
      } else if (bot.y < center - margin) {
        bot.input = false;
      } else if (rng() < 0.02) {
        bot.input = !bot.input;
      }
      if (rng() < 0.005) {
        bot.targetOffset = rand(-0.3, 0.3);
      }
      if (rng() < 0.006) {
        bot.speedFactor = clamp(bot.speedFactor + rand(-0.03, 0.04), 0.88, 1.16);
      }
      const prevY = bot.y;
      bot.y += (bot.input ? -speed : speed) * dt;
      const botSize = bot.size ?? player.size;
      bot.y = clamp(bot.y, bounds.top + botSize, bounds.bottom - botSize);
      const safeByTime = state.time < bot.safeTime;
      const safeByX = worldX < bot.safeX;
      const inGrace = safeByTime || safeByX;
      const spikeHit = hitSpikeAt(worldX, bot.y, botSize);
      const cogHit = spikeHit ? null : hitCogAt(worldX, bot.y, botSize);
      const orbHit = spikeHit || cogHit ? null : hitOrbAt(worldX, bot.y, botSize);
      const tunnelHit = spikeHit || cogHit || orbHit ? null : hitTunnelAt(worldX, bot.y, botSize);
      if (spikeHit || cogHit || orbHit || tunnelHit) {
        if (inGrace) {
          const obstacleY = spikeHit
            ? spikeHit.cy
            : cogHit
            ? cogHit.y + getObstacleFloat(cogHit)
            : orbHit
            ? orbHit.y + getObstacleFloat(orbHit)
            : tunnelHit.center;
          const padding = spikeHit
            ? botSize + 12
            : cogHit
            ? cogHit.r * getObstaclePulse(cogHit, 0.05) + botSize + 14
            : orbHit
            ? orbHit.r * getObstaclePulse(orbHit, 0.06) + botSize + 12
            : botSize + 10;
          const upper = bounds.top + botSize;
          const lower = bounds.bottom - botSize;
          if (tunnelHit) {
            const clamped = clamp(bot.y, tunnelHit.start + botSize, tunnelHit.end - botSize);
            bot.y = clamped;
          } else {
            const up = clamp(obstacleY - padding, upper, lower);
            const down = clamp(obstacleY + padding, upper, lower);
            bot.y = Math.abs(bot.y - up) < Math.abs(bot.y - down) ? up : down;
          }
        } else {
          spawnBotCrash(bot);
          return;
        }
      }
      const pastSafeZone = worldX > bot.safeX + 120;
      if (
        !inGrace &&
        pastSafeZone &&
        bot.crashEligible &&
        isNearObstacle(worldX, bot.y) &&
        rng() < dt * bot.crashChance
      ) {
        spawnBotCrash(bot);
        return;
      }
      const dy = bot.y - prevY;
      bot.vy = dt > 0 ? dy / dt : 0;
      let targetAngle = clamp(bot.vy / speed, -1, 1) * (Math.PI / 4);
      const onTopFlat =
        bounds.topFlat && Math.abs(bot.y - (bounds.top + player.size)) < 0.5;
      const onBottomFlat =
        bounds.bottomFlat && Math.abs(bot.y - (bounds.bottom - player.size)) < 0.5;
      if (onTopFlat || onBottomFlat) {
        targetAngle = 0;
      }
      bot.tilt = lerp(bot.tilt, targetAngle, 0.22);

      bot.trailTick = !bot.trailTick;
      if (!state.lowPerf || bot.trailTick) {
        bot.trail.push({ x: worldX, y: bot.y });
        if (bot.trail.length > trailMax) {
          bot.trail.splice(0, bot.trail.length - trailMax);
        }
      }
    });
  };

  const updateChallenge = (dt, worldX, progress) => {
    if (!state.challengeActive || state.crashing || state.completing || state.waitingForInput) {
      return false;
    }
    state.challengeTime = Math.max(0, state.challengeTime - dt);
    if (state.challengeTime <= 0) {
      callbacks.onChallenge?.({ type: "fail" });
      startCrash(worldX, player.y, player.tilt);
      return true;
    }
    const target = state.challengeTargets[state.challengeIndex] ?? 100;
    if (progress >= target && !state.completing) {
      const bonus = Math.round(60 * state.challengeMultiplier);
      const nextIndex = Math.min(state.challengeIndex + 1, state.challengeTargets.length);
      state.challengeIndex = nextIndex;
      state.challengeMultiplier = clamp(state.challengeMultiplier + 0.5, 1, 4);
      state.challengeTimeMax = clamp(state.challengeTimeMax * 0.92, 6, 16);
      state.challengeTime = state.challengeTimeMax;
      const nextTarget = state.challengeTargets[nextIndex] ?? 100;
      callbacks.onChallenge?.({
        type: "checkpoint",
        bonus,
        multiplier: state.challengeMultiplier,
        next: nextTarget,
        index: nextIndex,
        total: state.challengeTargets.length,
        timeMax: state.challengeTimeMax,
      });
    }
    state.challengeHudTick += dt;
    if (state.challengeHudTick >= 0.12) {
      state.challengeHudTick = 0;
      callbacks.onChallenge?.({
        type: "update",
        timeLeft: state.challengeTime,
        timeMax: state.challengeTimeMax,
        next: target,
        multiplier: state.challengeMultiplier,
        index: state.challengeIndex,
        total: state.challengeTargets.length,
      });
    }
    return false;
  };


  const update = (dt) => {
    const rawDt = dt;
    if (state.impactTime < state.impactDuration) {
      state.impactTime = Math.min(state.impactDuration, state.impactTime + rawDt);
      const t = clamp(state.impactTime / Math.max(0.001, state.impactDuration), 0, 1);
      const ease = 1 - Math.pow(1 - t, 2);
      state.timeScale = lerp(0.35, 1, ease);
    } else {
      state.timeScale = 1;
    }
    if (state.shakeTime > 0) {
      state.shakeTime = Math.max(0, state.shakeTime - rawDt);
    }
    dt = rawDt * (state.timeScale || 1);

    const endX = state.finishX || state.levelEndX || level.length;
    const distance = state.offset + player.x;
    const progressRatio = clamp(distance / Math.max(1, endX), 0, 1);
    const endlessRamp = state.mode === "endless" ? Math.min(config.endlessRamp, distance / 140) : 0;
    const raceRamp = state.mode === "race" ? Math.min(config.raceRamp, distance / 150) : 0;
    const challengeRamp =
      state.mode === "challenge" ? config.classicRamp * 0.7 * Math.pow(progressRatio, 1.15) : 0;
    const classicRamp =
      state.mode === "endless" || state.mode === "race" || state.mode === "challenge"
        ? 0
        : config.classicRamp * Math.pow(progressRatio, 1.2);
    const startFactor =
      state.mode === "endless"
        ? config.endlessStartFactor
        : state.mode === "race"
        ? config.raceStartFactor
        : state.mode === "challenge"
        ? 0.96
        : 1;
    const speed = config.speed * startFactor + endlessRamp + raceRamp + challengeRamp + classicRamp;
    state.lastSpeed = speed;
    state.time += dt;
    updateStars(dt, speed);

    if (state.waitingForInput) {
      if (input.active) {
        state.waitingForInput = false;
      } else {
        return;
      }
    }

    if (state.crashing) {
      state.crashTime += dt;
      updateCrashPieces(dt);
      if (state.crashTime >= state.crashDuration) {
        stop(true, false);
      }
      return;
    }

    if (state.completing) {
      updateCompletion(dt);
      return;
    }

    if (runtime.shieldActive) {
      runtime.shieldTime = Math.max(0, runtime.shieldTime - dt);
      if (runtime.shieldTime === 0) {
        setShieldActive(false);
      }
    }

    if (runtime.combo > 0) {
      runtime.comboTimer -= dt;
      if (runtime.comboTimer <= 0) {
        resetCombo();
      }
    }

    const nextOffset = state.offset + speed * dt;
    const prevY = player.y;
    player.y += (input.active ? -speed : speed) * dt;

    const nextWorldX = nextOffset + player.x;
    if (nextWorldX >= endX) {
      state.offset = Math.max(0, endX - player.x);
      state.progress = 100;
      callbacks.onProgress(100);
      startCompletion();
      return;
    }
    state.offset = nextOffset;

    const worldX = state.offset + player.x;
    const bounds = getBounds(worldX);
    const cogViewLeft = state.offset - 160;
    const cogViewRight = state.offset + state.width + 160;
    const cogStart = findFirstIndex(cogs, cogViewLeft - 160);
    for (let i = cogStart; i < cogs.length; i += 1) {
      const cog = cogs[i];
      if (cog.x > cogViewRight + 160) break;
      cog.angle += cog.spin * dt;
    }
    updatePickups(worldX, dt);

    if (player.y < bounds.top + player.size) {
      player.y = bounds.top + player.size;
    }
    if (player.y > bounds.bottom - player.size) {
      player.y = bounds.bottom - player.size;
    }

    if (state.safeTime > 0) {
      state.safeTime = Math.max(0, state.safeTime - dt);
    } else {
      const spikeHit = hitSpike(worldX, player.y);
      const cogHit = spikeHit ? null : hitCog(worldX, player.y);
      const orbHit = spikeHit || cogHit ? null : hitOrb(worldX, player.y);
      const tunnelHit = spikeHit || cogHit || orbHit ? null : hitTunnel(worldX, player.y);
      const collided = spikeHit || cogHit || orbHit || tunnelHit;
      if (collided) {
        if (!runtime.shieldActive) {
          callbacks.onCrashImpact?.();
        }
        if (runtime.shieldActive) {
          runtime.shieldTime = 0;
          setShieldActive(false);
          state.safeTime = 0.6;
          if (tunnelHit) {
            player.y = clamp(player.y, tunnelHit.start + player.size, tunnelHit.end - player.size);
          } else if (spikeHit) {
            player.y = clamp(
              player.y + spikeHit.ny * 18,
              bounds.top + player.size,
              bounds.bottom - player.size
            );
          } else if (cogHit || orbHit) {
            const target = cogHit || orbHit;
            const targetY = target.y + getObstacleFloat(target);
            const dy = player.y - targetY;
            const dist = Math.max(1, Math.hypot(worldX - target.x, dy));
            player.y = clamp(
              player.y + (dy / dist) * 22,
              bounds.top + player.size,
              bounds.bottom - player.size
            );
          }
          player.vy = 0;
        } else {
          player.y = clamp(prevY, bounds.top + player.size, bounds.bottom - player.size);
          startCrash(worldX, player.y, player.tilt);
          return;
        }
      }
    }

    const dy = player.y - prevY;
    player.vy = dt > 0 ? dy / dt : 0;
    let targetAngle = clamp(player.vy / speed, -1, 1) * (Math.PI / 4);
    const onTopFlat =
      bounds.topFlat && Math.abs(player.y - (bounds.top + player.size)) < 0.5;
    const onBottomFlat =
      bounds.bottomFlat && Math.abs(player.y - (bounds.bottom - player.size)) < 0.5;
    if (onTopFlat || onBottomFlat) {
      targetAngle = 0;
    }
    player.tilt = lerp(player.tilt, targetAngle, 0.25);

    updateBots(dt, speed, endX);

    state.trailTick = !state.trailTick;
    if (!state.lowPerf || state.trailTick) {
      trail.push({ x: worldX, y: player.y });
      const perfScale = state.perfScale || 1;
      const baseTrail = state.lowPerf ? Math.min(50, config.trailLength) : config.trailLength;
      const maxTrail = Math.max(32, Math.round(baseTrail * perfScale));
      if (trail.length > maxTrail) {
        trail.splice(0, trail.length - maxTrail);
      }
    }

    const progress = Math.min(100, (worldX / endX) * 100);
    state.progress = progress;
    callbacks.onProgress(progress);
    if (updateChallenge(dt, worldX, progress)) {
      return;
    }

    const targetCameraY = getCameraY(player.y, bounds);
    const cameraLerp = state.lowPerf ? 0.2 : 0.1;
    state.cameraY = lerp(state.cameraY, targetCameraY, cameraLerp);
  };

  const render = () => {
    ctx.save();
    drawBackground();
    if (state.completing) {
      const t = clamp(state.completeTime / Math.max(0.01, state.completeDuration), 0, 1);
      const zoom = 1 + Math.sin(t * Math.PI) * (state.completeZoom - 1);
      ctx.translate(state.width / 2, state.height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-state.width / 2, -state.height / 2);
    }
    const shake = getShakeOffset();
    if (shake.x || shake.y) {
      ctx.translate(shake.x, shake.y);
    }
    ctx.translate(0, -state.cameraY);
    drawCorridorFill();
    drawEdges();
    if (!state.crashing && !state.completing) {
      drawBotTrails();
      drawTrail();
    }
    drawTunnelWalls();
    drawSpikes();
    drawCogs();
    drawOrbs();
    drawPickups();
    if (state.crashing) {
      drawCrashPieces();
      drawBotCrashPieces();
    } else if (state.completing) {
      drawBotCrashPieces();
      drawBots();
      drawPlayer();
    } else {
      drawBotCrashPieces();
      drawBots();
      drawPlayer();
    }
    ctx.restore();
  };

  const loop = (now) => {
    if (!state.running) return;
    const frameDt = Math.min((now - state.last) / 1000, 0.1);
    state.last = now;
    state.avgDt = state.avgDt === 0 ? frameDt : lerp(state.avgDt, frameDt, 0.05);
    state.lowPerf = state.forceLowPerf || state.avgDt > 0.022;
    const perfRatio = clamp((state.avgDt - 0.016) / 0.03, 0, 1);
    state.perfScale = clamp(1 - perfRatio * 0.45, 0.55, 1);
    if (frameDt > 0.05) {
      state.accumulator = 0;
    }
    state.accumulator = Math.min(state.accumulator + frameDt, state.step * state.maxSubSteps);
    let steps = 0;
    while (state.accumulator >= state.step && steps < state.maxSubSteps) {
      update(state.step);
      state.accumulator -= state.step;
      steps += 1;
    }
    render();
    requestAnimationFrame(loop);
  };

  const start = () => {
    if (state.running) return;
    state.running = true;
    state.paused = false;
    state.last = performance.now();
    state.accumulator = 0;
    requestAnimationFrame(loop);
  };

  const pause = () => {
    if (!state.running) return;
    state.running = false;
    state.paused = true;
  };

  const resume = () => {
    if (state.running) return;
    state.running = true;
    state.paused = false;
    state.last = performance.now();
    state.accumulator = 0;
    requestAnimationFrame(loop);
  };

  const getRaceResult = () => {
    if (state.mode !== "race") return null;
    const endX = state.finishX || state.levelEndX || level.length;
    const playerTime = state.playerFinishTime ?? state.time;
    const competitors = [
      {
        id: "player",
        time: playerTime,
      },
    ];

    bots.forEach((bot) => {
      let time = Infinity;
      if (bot.crashed) {
        time = Infinity;
      } else if (bot.finishTime != null) {
        time = bot.finishTime;
      } else if (bot.completing) {
        time = state.time + Math.max(0, bot.completeDuration - bot.completeTime);
      } else {
        const worldX = state.offset + bot.x;
        const remaining = Math.max(0, endX - worldX);
        const botSpeed = Math.max(1, (state.lastSpeed || config.speed) * bot.speedFactor);
        time = state.time + remaining / botSpeed;
      }
      const bias = bot.finishBias || 0;
      competitors.push({
        id: bot.id,
        time: time === Infinity ? Infinity : time + bias,
      });
    });

    const ordered = [...competitors].sort((a, b) => a.time - b.time);
    const place = ordered.findIndex((entry) => entry.id === "player") + 1;
    const winnerId = ordered[0]?.id || "player";
    return {
      place,
      total: ordered.length,
      winnerId,
    };
  };

  const stop = (crashed, completed) => {
    if (!state.running && !state.paused) return;
    state.running = false;
    state.paused = false;

    const progress = Math.round(state.progress);

    if (completed) {
      callbacks.onComplete({ progress, raceResult: getRaceResult() });
      return;
    }

    if (crashed) {
      let newBest = false;
      if (progress > state.bestProgress) {
        state.bestProgress = progress;
        localStorage.setItem(state.bestKey, String(progress));
        newBest = true;
      }
      callbacks.onBest(state.bestProgress);
      callbacks.onCrash(progress, newBest);
    }
  };

  const attachInput = () => {
    const onDown = () => setInput(true);
    const onUp = () => setInput(false);
    const onKeyDown = (event) => {
      if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
        event.preventDefault();
        setInput(true);
      }
    };
    const onKeyUp = (event) => {
      if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
        event.preventDefault();
        setInput(false);
      }
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", resize);
    };
  };

  return {
    reset,
    start,
    pause,
    resume,
    stop,
    setSkin,
    setTrail,
    setShape,
    setProfile,
    attachInput,
    getBest: () => state.bestProgress,
  };
}

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const cleanupRef = useRef(null);
  const noticeTimeout = useRef(null);
  const currentLevelRef = useRef(LEVELS[0]);
  const bonusRef = useRef(0);
  const challengeFailRef = useRef(false);
  const audioRef = useRef(null);
  const playSoundRef = useRef(null);
  const noiseBufferRef = useRef(null);
  const readProfileValue = (profileId, key, fallback) => {
    if (typeof window === "undefined") return fallback;
    const stored = localStorage.getItem(makeProfileKey(profileId, key));
    return stored == null ? fallback : stored;
  };
  const readProfileJSON = (profileId, key, fallback) => {
    if (typeof window === "undefined") return fallback;
    try {
      const stored = JSON.parse(localStorage.getItem(makeProfileKey(profileId, key)) || "null");
      return stored == null ? fallback : stored;
    } catch (error) {
      return fallback;
    }
  };
  const migrateLegacyProfile = (profileId) => {
    if (typeof window === "undefined") return;
    if (profileId !== "player-1") return;
    const migrateKey = (key, legacyKey) => {
      const nextKey = makeProfileKey(profileId, key);
      if (localStorage.getItem(nextKey) != null) return;
      const legacy = localStorage.getItem(legacyKey);
      if (legacy != null) {
        localStorage.setItem(nextKey, legacy);
      }
    };
    migrateKey("gems", "spacewaves_gems");
    migrateKey("last_score", "spacewaves_last_score");
    migrateKey("xp", "spacewaves_xp");
    migrateKey("player_level", "spacewaves_player_level");
    migrateKey("store_purchases", "spacewaves_store_purchases");
    migrateKey("trails_unlocked", "spacewaves_trails_unlocked");
    migrateKey("trail_selected", "spacewaves_trail_selected");
    migrateKey("skins_unlocked", "spacewaves_skins_unlocked");
    migrateKey("skin_selected", "spacewaves_skin_selected");
    migrateKey("pointer_shape", "spacewaves_pointer_shape");
    migrateKey("daily_claim", "spacewaves_daily_claim");
    migrateKey("max_level_completed", "spacewaves_max_level_completed");
    migrateKey("speed_bonus", "spacewaves_speed_bonus");
    migrateKey("last_level", "spacewaves_last_level");
    migrateKey("best_progress", "spacewaves_best_progress");
    LEVELS.forEach((level) => {
      migrateKey(`best_progress_${level.id}`, `spacewaves_best_progress_${level.id}`);
    });
  };
  const initialProfiles = (() => {
    if (typeof window === "undefined") return [{ id: "player-1", name: "Player 1" }];
    try {
      const stored = JSON.parse(localStorage.getItem(PROFILE_LIST_KEY) || "[]");
      if (Array.isArray(stored) && stored.length) return stored;
    } catch (error) {
    }
    const seeded = [{ id: "player-1", name: "Player 1" }];
    localStorage.setItem(PROFILE_LIST_KEY, JSON.stringify(seeded));
    return seeded;
  })();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [activeProfileId, setActiveProfileId] = useState(() => {
    if (typeof window === "undefined") return initialProfiles[0].id;
    const stored = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (stored && initialProfiles.some((profile) => profile.id === stored)) {
      return stored;
    }
    return initialProfiles[0].id;
  });
  const profileKey = useCallback((key) => makeProfileKey(activeProfileId, key), [activeProfileId]);
  const getStoredLevel = (profileId) => {
    const storedId = Number(readProfileValue(profileId, "last_level", 1));
    return LEVELS.find((level) => level.id === storedId) || LEVELS[0];
  };
  const [inGame, setInGame] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(() => getStoredLevel(activeProfileId));
  const [progress, setProgress] = useState(0);
  const [baseScore, setBaseScore] = useState(0);
  const [bonusScore, setBonusScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [runGems, setRunGems] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [best, setBest] = useState(0);
  const [lastScore, setLastScore] = useState(() =>
    Number(readProfileValue(activeProfileId, "last_score", 0))
  );
  const [xp, setXp] = useState(() => Number(readProfileValue(activeProfileId, "xp", 0)));
  const [playerLevel, setPlayerLevel] = useState(() => {
    return Number(readProfileValue(activeProfileId, "player_level", 1));
  });
  const [paused, setPaused] = useState(false);
  const [mode, setMode] = useState("classic");
  const [challengeHud, setChallengeHud] = useState({
    active: false,
    timeLeft: 0,
    timeMax: 0,
    next: 0,
    multiplier: 1,
    index: 0,
    total: CHALLENGE_TARGETS.length,
    flash: 0,
    lastBonus: 0,
  });
  const [storePurchases, setStorePurchases] = useState(() => {
    return readProfileJSON(activeProfileId, "store_purchases", {});
  });
  const [unlockedTrails, setUnlockedTrails] = useState(() => {
    const stored = readProfileJSON(activeProfileId, "trails_unlocked", ["trail-1"]);
    return Array.isArray(stored) ? Array.from(new Set(["trail-1", ...stored])) : ["trail-1"];
  });
  const [selectedTrail, setSelectedTrail] = useState(() => {
    return readProfileValue(activeProfileId, "trail_selected", "trail-1");
  });
  const [showLevels, setShowLevels] = useState(false);
  const [menuNotice, setMenuNotice] = useState("");
  const [panel, setPanel] = useState("");
  const [isPortrait, setIsPortrait] = useState(
    typeof window !== "undefined" ? window.innerHeight > window.innerWidth : false
  );
  const [needsLandscape, setNeedsLandscape] = useState(false);
  const [skinTab, setSkinTab] = useState("arrow");
  const pendingStartRef = useRef(null);
  const [dailyClaim, setDailyClaim] = useState(() => {
    if (typeof window === "undefined") return "";
    return readProfileValue(activeProfileId, "daily_claim", "");
  });
  const [unlockedShapes, setUnlockedShapes] = useState(() => {
    const stored = readProfileJSON(activeProfileId, "shapes_unlocked", ["classic"]);
    return Array.isArray(stored) ? Array.from(new Set(["classic", ...stored])) : ["classic"];
  });
  const [pointerShape, setPointerShape] = useState(() => {
    if (typeof window === "undefined") return "classic";
    return readProfileValue(activeProfileId, "pointer_shape", "classic");
  });
  const [settings, setSettings] = useState(() => {
    if (typeof window === "undefined") {
      return { reducedMotion: false, highContrast: false, mute: false };
    }
    return {
      reducedMotion: localStorage.getItem("spacewaves_motion") === "reduced",
      highContrast: localStorage.getItem("spacewaves_contrast") === "high",
      mute: false,
    };
  });
  const [unlockedSkins, setUnlockedSkins] = useState(() => {
    if (typeof window === "undefined") return ["emerald"];
    const stored = readProfileJSON(activeProfileId, "skins_unlocked", ["emerald"]);
    return Array.isArray(stored) ? Array.from(new Set(["emerald", ...stored])) : ["emerald"];
  });
  const [selectedSkin, setSelectedSkin] = useState(() => {
    if (typeof window === "undefined") return "emerald";
    return readProfileValue(activeProfileId, "skin_selected", "emerald");
  });
  const [overlay, setOverlay] = useState({
    visible: false,
    title: "",
    subtitle: "",
    showRestart: false,
    showMenu: false,
    showResume: false,
    kind: "",
    reward: 0,
    xp: 0,
  });
  const [gems, setGems] = useState(() => {
    if (typeof window === "undefined") return 328;
    return Number(readProfileValue(activeProfileId, "gems", 328));
  });
  const activeTheme = THEMES[currentLevel.theme] || THEMES.emerald;
  const dailyLevel = getDailyLevel();
  const score = baseScore + bonusScore;
  const bestScore = scoreFromPercent(best);
  const showRotateOverlay = needsLandscape && isPortrait;
  const getTodayStamp = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const claimedToday = dailyClaim === getTodayStamp();
  const currentRank = rankFromLevel(playerLevel);
  const currentXpBase = xpForLevel(playerLevel);
  const nextXp = xpForLevel(playerLevel + 1);
  const xpProgress = clamp((xp - currentXpBase) / Math.max(1, nextXp - currentXpBase), 0, 1);
  const xpRemaining = Math.max(0, nextXp - xp);

  const showMenuNotice = useCallback((message) => {
    setMenuNotice(message);
    if (noticeTimeout.current) {
      window.clearTimeout(noticeTimeout.current);
    }
    noticeTimeout.current = window.setTimeout(() => setMenuNotice(""), 2000);
  }, []);

  const handleProfileChange = useCallback(
    (event) => {
      if (inGame) return;
      const nextId = event.target.value;
      if (nextId === activeProfileId) return;
      const nextProfile = profiles.find((profile) => profile.id === nextId);
      setActiveProfileId(nextId);
      if (nextProfile) {
        showMenuNotice(`${nextProfile.name} selected`);
      }
    },
    [activeProfileId, inGame, profiles, showMenuNotice]
  );

  const handleAddProfile = useCallback(() => {
    if (inGame) return;
    const nextIndex = profiles.length + 1;
    const newProfile = {
      id: `player-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      name: `Player ${nextIndex}`,
    };
    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
    showMenuNotice("Profile created");
  }, [inGame, profiles.length, showMenuNotice]);

  useEffect(() => {
    localStorage.setItem(PROFILE_LIST_KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
  }, [activeProfileId]);

  useEffect(() => {
    if (!activeProfileId || inGame) return;
    migrateLegacyProfile(activeProfileId);
    const level = getStoredLevel(activeProfileId);
    setCurrentLevel(level);
    setBest(Number(localStorage.getItem(makeProfileKey(activeProfileId, `best_progress_${level.id}`)) || 0));
    setLastScore(Number(readProfileValue(activeProfileId, "last_score", 0)));
    setXp(Number(readProfileValue(activeProfileId, "xp", 0)));
    setPlayerLevel(Number(readProfileValue(activeProfileId, "player_level", 1)));
    setGems(Number(readProfileValue(activeProfileId, "gems", 328)));
    setStorePurchases(readProfileJSON(activeProfileId, "store_purchases", {}));
    const trails = readProfileJSON(activeProfileId, "trails_unlocked", ["trail-1"]);
    setUnlockedTrails(Array.isArray(trails) ? Array.from(new Set(["trail-1", ...trails])) : ["trail-1"]);
    setSelectedTrail(readProfileValue(activeProfileId, "trail_selected", "trail-1"));
    const skins = readProfileJSON(activeProfileId, "skins_unlocked", ["emerald"]);
    setUnlockedSkins(Array.isArray(skins) ? Array.from(new Set(["emerald", ...skins])) : ["emerald"]);
    setSelectedSkin(readProfileValue(activeProfileId, "skin_selected", "emerald"));
    const shapes = readProfileJSON(activeProfileId, "shapes_unlocked", ["classic"]);
    setUnlockedShapes(Array.isArray(shapes) ? Array.from(new Set(["classic", ...shapes])) : ["classic"]);
    setPointerShape(readProfileValue(activeProfileId, "pointer_shape", "classic"));
    setDailyClaim(readProfileValue(activeProfileId, "daily_claim", ""));
    setPanel("");
    setShowLevels(false);
    setProgress(0);
    setBaseScore(0);
    setBonusScore(0);
    bonusRef.current = 0;
    setCombo(0);
    setRunGems(0);
    setShieldActive(false);
    setChallengeHud((prev) => ({ ...prev, active: false, lastBonus: 0, flash: 0 }));
    challengeFailRef.current = false;
    gameRef.current?.setProfile(activeProfileId);
  }, [activeProfileId, inGame]);

  useEffect(() => {
    const nextLevel = levelFromXp(xp);
    if (nextLevel === playerLevel) return;
    if (nextLevel > playerLevel) {
      const reward = 12 + nextLevel * 2;
      setGems((prev) => prev + reward);
      showMenuNotice(`Level ${nextLevel}! +${reward} gems`);
    }
    setPlayerLevel(nextLevel);
  }, [xp, playerLevel, showMenuNotice]);

  useEffect(() => {
    return () => {
      if (noticeTimeout.current) {
        window.clearTimeout(noticeTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    bonusRef.current = bonusScore;
  }, [bonusScore]);


  useEffect(() => {
    localStorage.setItem(profileKey("gems"), String(gems));
  }, [gems, profileKey]);

  useEffect(() => {
    localStorage.setItem("spacewaves_motion", settings.reducedMotion ? "reduced" : "full");
    localStorage.setItem("spacewaves_contrast", settings.highContrast ? "high" : "normal");
    localStorage.setItem("spacewaves_mute", settings.mute ? "true" : "false");
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(profileKey("xp"), String(xp));
  }, [xp, profileKey]);

  useEffect(() => {
    localStorage.setItem(profileKey("player_level"), String(playerLevel));
  }, [playerLevel, profileKey]);

  useEffect(() => {
    localStorage.setItem(profileKey("store_purchases"), JSON.stringify(storePurchases));
  }, [storePurchases, profileKey]);

  useEffect(() => {
    localStorage.setItem(profileKey("trails_unlocked"), JSON.stringify(unlockedTrails));
  }, [unlockedTrails, profileKey]);

  useEffect(() => {
    localStorage.setItem(profileKey("shapes_unlocked"), JSON.stringify(unlockedShapes));
  }, [unlockedShapes, profileKey]);

  useEffect(() => {
    if (!storePurchases.trail) return;
    if (unlockedTrails.length >= TRAIL_STYLES.length) return;
    setUnlockedTrails(TRAIL_STYLES.map((trail) => trail.id));
  }, [storePurchases.trail, unlockedTrails]);

  useEffect(() => {
    localStorage.setItem(profileKey("trail_selected"), selectedTrail);
    gameRef.current?.setTrail(selectedTrail);
  }, [selectedTrail, profileKey]);

  useEffect(() => {
    if (unlockedTrails.includes(selectedTrail)) return;
    setSelectedTrail(unlockedTrails[0] || "trail-1");
  }, [unlockedTrails, selectedTrail]);

  useEffect(() => {
    localStorage.setItem(profileKey("skins_unlocked"), JSON.stringify(unlockedSkins));
  }, [unlockedSkins, profileKey]);

  useEffect(() => {
    localStorage.setItem(profileKey("skin_selected"), selectedSkin);
  }, [selectedSkin, profileKey]);

  useEffect(() => {
    localStorage.setItem(profileKey("pointer_shape"), pointerShape);
  }, [pointerShape, profileKey]);

  useEffect(() => {
    if (!unlockedShapes.includes(pointerShape)) {
      setPointerShape(unlockedShapes[0] || "classic");
    }
  }, [unlockedShapes, pointerShape]);

  useEffect(() => {
    if (!pointerShape) return;
    if (unlockedShapes.includes(pointerShape)) return;
    setUnlockedShapes((prev) => Array.from(new Set([...prev, pointerShape])));
  }, [pointerShape, unlockedShapes]);

  useEffect(() => {
    localStorage.setItem(profileKey("daily_claim"), dailyClaim);
  }, [dailyClaim, profileKey]);

  useEffect(() => {
    if (!unlockedSkins.includes(selectedSkin)) {
      setSelectedSkin(unlockedSkins[0] || "emerald");
    }
  }, [unlockedSkins, selectedSkin]);

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioRef.current) {
      audioRef.current = new AudioContextClass();
    }
    if (audioRef.current.state === "suspended") {
      audioRef.current.resume();
    }
    return audioRef.current;
  }, []);

  const getNoiseBuffer = useCallback((ctx) => {
    if (!ctx) return null;
    if (!noiseBufferRef.current) {
      const length = Math.floor(ctx.sampleRate * 0.5);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      noiseBufferRef.current = buffer;
    }
    return noiseBufferRef.current;
  }, []);

  const playTone = useCallback(
    (freq, duration, type = "sine", gain = 0.12, delay = 0) => {
      const ctx = ensureAudio();
      if (!ctx) return;
      const startTime = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      amp.gain.setValueAtTime(0.0001, startTime);
      amp.gain.linearRampToValueAtTime(gain, startTime + 0.005);
      amp.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    },
    [ensureAudio]
  );

  const playSweep = useCallback(
    (startFreq, endFreq, duration, type = "sine", gain = 0.12, delay = 0) => {
      const ctx = ensureAudio();
      if (!ctx) return;
      const startTime = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), startTime + duration);
      amp.gain.setValueAtTime(0.0001, startTime);
      amp.gain.linearRampToValueAtTime(gain, startTime + 0.005);
      amp.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    },
    [ensureAudio]
  );

  const playNoise = useCallback(
    (duration, gain = 0.18, filterType = "lowpass", freq = 900, q = 0.8, delay = 0) => {
      const ctx = ensureAudio();
      if (!ctx) return;
      const buffer = getNoiseBuffer(ctx);
      if (!buffer) return;
      const startTime = ctx.currentTime + delay;
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const amp = ctx.createGain();
      source.buffer = buffer;
      filter.type = filterType;
      filter.frequency.setValueAtTime(freq, startTime);
      filter.Q.setValueAtTime(q, startTime);
      amp.gain.setValueAtTime(0.0001, startTime);
      amp.gain.linearRampToValueAtTime(gain, startTime + 0.005);
      amp.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      source.connect(filter);
      filter.connect(amp);
      amp.connect(ctx.destination);
      source.start(startTime);
      source.stop(startTime + duration + 0.05);
    },
    [ensureAudio, getNoiseBuffer]
  );

  const playSound = useCallback(
    (name) => {
      if (settings.mute) return;
      switch (name) {
        case "start":
          playTone(280, 0.07, "square", 0.08);
          playSweep(280, 820, 0.12, "sine", 0.12, 0.01);
          playTone(980, 0.05, "triangle", 0.06, 0.03);
          break;
        case "pickup":
          playTone(740, 0.06, "sine", 0.1);
          playTone(1120, 0.05, "triangle", 0.08, 0.015);
          break;
        case "shield":
          playSweep(180, 460, 0.16, "triangle", 0.12);
          playNoise(0.1, 0.05, "highpass", 1600, 0.9, 0.02);
          break;
        case "complete":
          playTone(392, 0.12, "sine", 0.12);
          playTone(523.25, 0.12, "sine", 0.1, 0.06);
          playTone(659.25, 0.14, "sine", 0.09, 0.12);
          playTone(880, 0.12, "triangle", 0.07, 0.2);
          break;
        case "crash":
          playNoise(0.18, 0.22, "lowpass", 500, 0.7);
          playSweep(160, 50, 0.2, "sawtooth", 0.16, 0.01);
          playTone(70, 0.18, "triangle", 0.12, 0.02);
          break;
        case "menu":
          playTone(520, 0.04, "square", 0.05);
          playTone(780, 0.04, "square", 0.04, 0.012);
          break;
        default:
          break;
      }
    },
    [playNoise, playSweep, playTone, settings.mute]
  );

  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);

  const playCrashSfx = useCallback(() => {
    playSoundRef.current?.("crash");
  }, []);

  const playStartSfx = useCallback(() => {
    playSoundRef.current?.("start");
  }, []);

  const playCompleteSfx = useCallback(() => {
    playSoundRef.current?.("complete");
  }, []);

  useEffect(() => {
    const unlock = () => {
      const ctx = ensureAudio();
      if (!ctx) return;
      getNoiseBuffer(ctx);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [ensureAudio, getNoiseBuffer]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (settings.mute) {
      audioRef.current.suspend();
    } else {
      audioRef.current.resume();
    }
  }, [settings.mute]);

  const showCrash = useCallback((percent, isNew) => {
    const points = scoreFromPercent(percent) + bonusRef.current;
    setLastScore(points);
    localStorage.setItem(profileKey("last_score"), String(points));
    const isChallengeFail = mode === "challenge" && challengeFailRef.current;
    if (isChallengeFail) {
      challengeFailRef.current = false;
    }
    const baseXp = 6 + percent * 0.7 + Math.min(40, bonusRef.current * 0.25);
    const xpGain = Math.max(4, Math.round(isChallengeFail ? baseXp * 0.7 : baseXp));
    setXp((prev) => prev + xpGain);
    setOverlay({
      visible: true,
      title: isChallengeFail ? "TIME UP!" : isNew ? "NEW PROGRESS!" : "CRASHED!",
      subtitle: isChallengeFail ? "Checkpoint missed" : `${points} pts`,
      showRestart: true,
      showMenu: true,
      showResume: false,
      kind: "crash",
      reward: 0,
      xp: xpGain,
    });
  }, [mode, profileKey]);

  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  const showComplete = useCallback((payload) => {
    const raceResult = payload && typeof payload === "object" ? payload.raceResult : null;
    const activeLevel = currentLevelRef.current || LEVELS[0];
    const baseReward = 10 + (activeLevel.difficulty || 1);
    const reward =
      mode === "challenge" ? Math.round(baseReward * Math.max(1, challengeHud.multiplier)) : baseReward;
    const points = scoreFromPercent(100) + bonusRef.current;
    const isRace = mode === "race";
    const place = raceResult?.place || 1;
    const baseXp = 45 + (activeLevel.difficulty || 1) * 12 + bonusRef.current * 0.35;
    const raceMod = isRace ? (place === 1 ? 1.15 : place === 2 ? 1 : 0.85) : 1;
    const challengeMod = mode === "challenge" ? Math.max(1, challengeHud.multiplier) : 1;
    const xpGain = Math.round(baseXp * raceMod * challengeMod);
    setGems((prev) => prev + reward);
    setXp((prev) => prev + xpGain);
    setLastScore(points);
    localStorage.setItem(profileKey("last_score"), String(points));
    if (mode === "classic") {
      const completedId = activeLevel.id || 1;
      const maxCompleted = Number(localStorage.getItem(profileKey("max_level_completed")) || 0);
      if (completedId > maxCompleted) {
        localStorage.setItem(profileKey("max_level_completed"), String(completedId));
        const currentBonus = Number(localStorage.getItem(profileKey("speed_bonus")) || 0);
        const step = LEVELS.length > 1 ? MAX_LEVEL_SPEED_BONUS / (LEVELS.length - 1) : 0;
        const levelBonus = clamp(Math.round((completedId - 1) * step), 0, MAX_LEVEL_SPEED_BONUS);
        const nextBonus = Math.min(MAX_LEVEL_SPEED_BONUS, Math.max(currentBonus, levelBonus));
        localStorage.setItem(profileKey("speed_bonus"), String(nextBonus));
      }
    }
    const placeLabel = (place) => {
      if (place === 1) return "1ST PLACE";
      if (place === 2) return "2ND PLACE";
      if (place === 3) return "3RD PLACE";
      return `${place}TH PLACE`;
    };
    const title = isRace
      ? place === 1
        ? "YOU WON!"
        : `YOU PLACED ${placeLabel(place)}`
      : mode === "challenge"
      ? "CHALLENGE COMPLETE!"
      : "LEVEL COMPLETE!";
    const subtitle = isRace ? `${points} PTS` : `${points} pts`;
    setOverlay({
      visible: true,
      title,
      subtitle,
      showRestart: false,
      showMenu: false,
      showResume: false,
      kind: "complete",
      reward,
      xp: xpGain,
    });
  }, [mode, challengeHud.multiplier, profileKey]);

  const showPaused = useCallback(() => {
    setOverlay({
      visible: true,
      title: "PAUSED",
      subtitle: "Press P or Resume",
      showRestart: false,
      showMenu: true,
      showResume: true,
      kind: "paused",
      reward: 0,
      xp: 0,
    });
  }, []);

  const hideOverlay = useCallback(() => {
    setOverlay((prev) => ({ ...prev, visible: false }));
  }, []);

  const openPanel = useCallback((type) => {
    setPanel(type);
    setShowLevels(false);
  }, []);

  const closePanel = useCallback(() => {
    playSound("menu");
    setPanel("");
  }, [playSound]);

  const toggleSetting = useCallback((key) => {
    playSound("menu");
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, [playSound]);

  const handlePauseToggle = useCallback(() => {
    if (!inGame) return;
    if (overlay.visible && !overlay.showResume && !paused) return;
    setPaused((prev) => !prev);
  }, [inGame, overlay.visible, overlay.showResume, paused]);

  const requestLandscape = useCallback(async () => {
    try {
      if (window.screen?.orientation?.lock) {
        await window.screen.orientation.lock("landscape");
      }
    } catch (error) {
    }
  }, []);

  const queueStart = useCallback(
    (startFn) => {
      pendingStartRef.current = startFn;
      setNeedsLandscape(true);
      requestLandscape();
    },
    [requestLandscape]
  );

  const startIfLandscape = useCallback(
    (startFn) => {
      if (isPortrait) {
        queueStart(startFn);
        return;
      }
      setNeedsLandscape(false);
      pendingStartRef.current = null;
      startFn();
    },
    [isPortrait, queueStart]
  );

  const cancelPendingStart = useCallback(() => {
    pendingStartRef.current = null;
    setNeedsLandscape(false);
  }, []);

  useEffect(() => {
    const updateOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);
    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  useEffect(() => {
    if (!needsLandscape || isPortrait) return;
    const pendingStart = pendingStartRef.current;
    if (pendingStart) {
      pendingStartRef.current = null;
      setNeedsLandscape(false);
      pendingStart();
    }
  }, [needsLandscape, isPortrait]);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!gameRef.current) {
      gameRef.current = createGame(canvasRef.current, {
        onProgress: (value) => {
          setProgress(value);
          setBaseScore(scoreFromPercent(value));
        },
        onBest: setBest,
        onCrashImpact: () => {
          playCrashSfx();
        },
        onCrash: showCrash,
        onCompleteSound: () => {
          playCompleteSfx();
        },
        onComplete: showComplete,
        onChallenge: (payload) => {
          if (!payload) return;
          if (payload.type === "start") {
            challengeFailRef.current = false;
            setChallengeHud({
              active: true,
              timeLeft: payload.timeLeft,
              timeMax: payload.timeMax,
              next: payload.next,
              multiplier: payload.multiplier,
              index: payload.index,
              total: payload.total,
              flash: 0,
              lastBonus: 0,
            });
            return;
          }
          if (payload.type === "stop") {
            setChallengeHud((prev) => ({ ...prev, active: false }));
            return;
          }
          if (payload.type === "fail") {
            challengeFailRef.current = true;
            return;
          }
          if (payload.type === "checkpoint") {
            setBonusScore((prev) => {
              const next = prev + payload.bonus;
              bonusRef.current = next;
              return next;
            });
            setChallengeHud((prev) => ({
              ...prev,
              active: true,
              timeLeft: payload.timeMax,
              timeMax: payload.timeMax,
              next: payload.next,
              multiplier: payload.multiplier,
              index: payload.index,
              total: payload.total,
              lastBonus: payload.bonus,
              flash: prev.flash + 1,
            }));
            return;
          }
          if (payload.type === "update") {
            setChallengeHud((prev) => ({
              ...prev,
              active: true,
              timeLeft: payload.timeLeft,
              timeMax: payload.timeMax,
              next: payload.next,
              multiplier: payload.multiplier,
              index: payload.index,
              total: payload.total,
            }));
          }
        },
        onPickup: (payload) => {
          if (!payload || payload.type !== "gem") return;
          setBonusScore((prev) => {
            const next = prev + payload.bonus;
            bonusRef.current = next;
            return next;
          });
          setGems((prev) => prev + payload.gems);
          setRunGems((prev) => prev + payload.gems);
          playSoundRef.current?.("pickup");
        },
        onShield: (active) => {
          setShieldActive(active);
          if (active) playSoundRef.current?.("shield");
        },
        onCombo: (value) => setCombo(value),
      }, activeProfileId);
      setBest(gameRef.current.getBest());
    }
    cleanupRef.current = gameRef.current.attachInput();
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [showCrash, showComplete, playSound, playCrashSfx, playCompleteSfx]);

  useEffect(() => {
    if (!gameRef.current) return;
    if (inGame) {
      gameRef.current.reset({
        ...currentLevel,
        mode,
        skin: selectedSkin,
        shape: pointerShape,
        trail: selectedTrail,
        startShield: storePurchases.shield,
      });
      gameRef.current.start();
      setPaused(false);
      hideOverlay();
    } else {
      gameRef.current.stop(false, false);
    }
  }, [inGame, currentLevel, mode, selectedSkin, selectedTrail, storePurchases.shield, hideOverlay]);

  useEffect(() => {
    gameRef.current?.setSkin(selectedSkin);
  }, [selectedSkin]);

  useEffect(() => {
    gameRef.current?.setShape(pointerShape);
  }, [pointerShape]);

  useEffect(() => {
    const onPauseKey = (event) => {
      if (event.code !== "KeyP") return;
      event.preventDefault();
      handlePauseToggle();
    };
    window.addEventListener("keydown", onPauseKey);
    return () => window.removeEventListener("keydown", onPauseKey);
  }, [handlePauseToggle]);

  useEffect(() => {
    if (!gameRef.current) return;
    if (!inGame) return;
    if (paused) {
      gameRef.current.pause();
      showPaused();
    } else {
      gameRef.current.resume();
      hideOverlay();
    }
  }, [paused, inGame, showPaused, hideOverlay]);

  useEffect(() => {
    setBest(Number(localStorage.getItem(profileKey(`best_progress_${currentLevel.id}`)) || 0));
  }, [currentLevel, profileKey]);

  const resetRunStats = useCallback(() => {
    setProgress(0);
    setBaseScore(0);
    setBonusScore(0);
    bonusRef.current = 0;
    setCombo(0);
    setRunGems(0);
    setShieldActive(false);
    setPanel("");
    setChallengeHud((prev) => ({ ...prev, active: false, lastBonus: 0, flash: 0 }));
    challengeFailRef.current = false;
  }, []);

  const startGameNow = useCallback(() => {
    resetRunStats();
    setPaused(false);
    setInGame(true);
    playStartSfx();
    hideOverlay();
    setShowLevels(false);
  }, [resetRunStats, hideOverlay, playStartSfx]);

  const handleLevelSelect = (level) => {
    playSound("menu");
    resetRunStats();
    setCurrentLevel(level);
    setBest(Number(localStorage.getItem(profileKey(`best_progress_${level.id}`)) || 0));
    localStorage.setItem(profileKey("last_level"), String(level.id));
    setMode("classic");
    setShowLevels(false);
  };

  const handleStart = () => {
    playSound("menu");
    startIfLandscape(startGameNow);
  };

  const handleRandom = () => {
    playSound("menu");
    const level = LEVELS[Math.floor(Math.random() * LEVELS.length)];
    setCurrentLevel(level);
    setBest(Number(localStorage.getItem(profileKey(`best_progress_${level.id}`)) || 0));
    localStorage.setItem(profileKey("last_level"), String(level.id));
    startIfLandscape(startGameNow);
  };

  const handleDaily = () => {
    playSound("menu");
    setCurrentLevel(dailyLevel);
    setBest(Number(localStorage.getItem(profileKey(`best_progress_${dailyLevel.id}`)) || 0));
    localStorage.setItem(profileKey("last_level"), String(dailyLevel.id));
    startIfLandscape(startGameNow);
  };

  const handleRestart = () => {
    const restartNow = () => {
      resetRunStats();
      setInGame(true);
      setPaused(false);
      playStartSfx();
      gameRef.current?.reset({
        ...currentLevel,
        mode,
        skin: selectedSkin,
        shape: pointerShape,
        trail: selectedTrail,
        startShield: storePurchases.shield,
      });
      gameRef.current?.start();
      hideOverlay();
    };
    startIfLandscape(restartNow);
  };

  const handleMenu = () => {
    playSound("menu");
    setInGame(false);
    setPaused(false);
    hideOverlay();
    setShowLevels(false);
    resetRunStats();
  };

  const handleResume = () => {
    setPaused(false);
  };

  const handleToggleLevels = () => {
    playSound("menu");
    setMode("classic");
    setPanel("");
    setShowLevels((prev) => !prev);
  };

  const handleNext = () => {
    playSound("menu");
    const nextId = currentLevel.id >= LEVELS.length ? 1 : currentLevel.id + 1;
    const nextLevel = LEVELS.find((level) => level.id === nextId) || LEVELS[0];
    setCurrentLevel(nextLevel);
    setBest(Number(localStorage.getItem(profileKey(`best_progress_${nextLevel.id}`)) || 0));
    setMode(mode === "challenge" ? "challenge" : "classic");
    startIfLandscape(startGameNow);
  };

  const handleModeStart = (selectedMode) => {
    playSound("menu");
    setMode(selectedMode);
    if (selectedMode === "classic") {
      handleStart();
      return;
    }
    if (selectedMode === "challenge") {
      handleStart();
      return;
    }
    if (selectedMode === "endless") {
      handleRandom();
      return;
    }
    handleDaily();
  };

  const handleStore = () => {
    playSound("menu");
    openPanel("store");
  };

  const handleAddGems = () => {
    playSound("menu");
    const today = getTodayStamp();
    if (dailyClaim === today) {
      showMenuNotice("Daily gems already claimed");
      return;
    }
    const nextTotal = gems + 50;
    setGems(nextTotal);
    if (inGame) {
      setRunGems((prev) => prev + 50);
    }
    setDailyClaim(today);
    showMenuNotice(`+50 gems added (Total ${nextTotal})`);
  };

  const handleSkin = () => {
    playSound("menu");
    setSkinTab("arrow");
    openPanel("skins");
  };

  const handleSettings = () => {
    playSound("menu");
    openPanel("settings");
  };

  const handleSkinTab = (tab) => {
    playSound("menu");
    setSkinTab(tab);
  };

  const handleSkinSelect = (skinId) => {
    playSound("menu");
    const cost = SKIN_COSTS[skinId] ?? 0;
    const unlocked = unlockedSkins.includes(skinId) || cost === 0;
    if (unlocked) {
      setSelectedSkin(skinId);
      showMenuNotice("Skin equipped");
      return;
    }
    if (gems < cost) {
      showMenuNotice("Not enough gems");
      return;
    }
    setGems((prev) => prev - cost);
    setUnlockedSkins((prev) => Array.from(new Set([...prev, skinId])));
    setSelectedSkin(skinId);
    showMenuNotice("Skin unlocked");
  };

  const handleSkinPreview = () => {
    playSound("menu");
    if (skinTab !== "arrow") {
      showMenuNotice("Coming soon");
    }
  };

  const handleTrailSelect = (trailId) => {
    playSound("menu");
    const cost = TRAIL_COSTS[trailId] ?? 0;
    const unlocked = unlockedTrails.includes(trailId) || cost === 0;
    if (!unlocked) {
      if (gems < cost) {
        showMenuNotice("Not enough gems");
        return;
      }
      setGems((prev) => prev - cost);
      setUnlockedTrails((prev) => Array.from(new Set([...prev, trailId])));
      setSelectedTrail(trailId);
      showMenuNotice("Trail unlocked");
      return;
    }
    setSelectedTrail(trailId);
    showMenuNotice("Trail equipped");
  };

  const handleShapeSelect = (shapeId) => {
    playSound("menu");
    const cost = SHAPE_COSTS[shapeId] ?? 0;
    const unlocked = unlockedShapes.includes(shapeId) || cost === 0;
    if (!unlocked) {
      if (gems < cost) {
        showMenuNotice("Not enough gems");
        return;
      }
      setGems((prev) => prev - cost);
      setUnlockedShapes((prev) => Array.from(new Set([...prev, shapeId])));
      setPointerShape(shapeId);
      showMenuNotice("Shape unlocked");
      return;
    }
    setPointerShape(shapeId);
    showMenuNotice("Shape equipped");
  };

  const handleStorePurchase = (itemId, price) => {
    playSound("menu");
    if (storePurchases[itemId]) {
      showMenuNotice("Already owned");
      return;
    }
    if (gems < price) {
      showMenuNotice("Not enough gems");
      return;
    }
    setGems((prev) => prev - price);
    setStorePurchases((prev) => ({ ...prev, [itemId]: true }));
    if (itemId === "trail") {
      setUnlockedTrails(TRAIL_STYLES.map((trail) => trail.id));
      showMenuNotice("All trails unlocked");
      return;
    }
    if (itemId === "shield") {
      showMenuNotice("Shield charm unlocked");
      return;
    }
    showMenuNotice("Purchase complete");
  };

  const canAffordShield = gems >= 80;
  const canAffordTrail = gems >= 65;
  const storeItems = [
    {
      id: "gems",
      title: "Gem Cache",
      description: "Instant +50 gems (once per day)",
      price: 50,
      cta: claimedToday ? "Claimed" : "Claim",
      action: handleAddGems,
      disabled: claimedToday,
      locked: false,
    },
    {
      id: "shield",
      title: "Shield Charm",
      description: storePurchases.shield ? "Owned: Start each run with shield" : "Start each run with a shield",
      price: 80,
      cta: storePurchases.shield ? "Owned" : "Buy",
      action: () => handleStorePurchase("shield", 80),
      disabled: storePurchases.shield,
      locked: !storePurchases.shield && !canAffordShield,
    },
    {
      id: "trail",
      title: "Trail Vault",
      description: storePurchases.trail ? "Owned: All trails unlocked" : "Unlock every trail color at once",
      price: 65,
      cta: storePurchases.trail ? "Owned" : "Buy",
      action: () => handleStorePurchase("trail", 65),
      disabled: storePurchases.trail,
      locked: !storePurchases.trail && !canAffordTrail,
    },
  ];

  const skinItems = THEME_KEYS.map((key) => {
    const theme = THEMES[key];
    const cost = SKIN_COSTS[key] ?? 0;
    const unlocked = unlockedSkins.includes(key) || cost === 0;
    return {
      id: key,
      title: SKIN_LABELS[key] || key,
      colors: theme,
      cost,
      unlocked,
      selected: selectedSkin === key,
    };
  });

  const trailItems = TRAIL_STYLES.map((trail) => {
    const cost = TRAIL_COSTS[trail.id] ?? 0;
    const unlocked = unlockedTrails.includes(trail.id) || cost === 0;
    return {
      id: trail.id,
      title: trail.title,
      colors: trail,
      locked: !unlocked,
      cost,
      unlocked,
    };
  });

  const skinTabs = [
    { id: "trail", label: "Trail" },
    { id: "arrow", label: "Arrow" },
    { id: "shape", label: "Shape" },
  ];

  const activeSkin = THEMES[selectedSkin] || THEMES.emerald;
  const activeTrail = TRAIL_STYLE_MAP[selectedTrail] || TRAIL_STYLES[0];
  const activeShape = getPointerShape(pointerShape);
  const activeShapeSvg = shapeToSvgPoints(activeShape);
  const shapeItems = Object.entries(POINTER_SHAPES).map(([id, shape]) => {
    const cost = SHAPE_COSTS[id] ?? 0;
    const unlocked = unlockedShapes.includes(id) || cost === 0;
    return {
      id,
      title: shape.label,
      svg: shapeToSvgPoints(shape),
      cost,
      unlocked,
      locked: !unlocked,
    };
  });
  const activeTabItems =
    skinTab === "arrow"
      ? skinItems
      : skinTab === "trail"
      ? trailItems
      : skinTab === "shape"
      ? shapeItems
      : [];

  return (
    <div
      className={`site ${inGame ? "site--ingame" : ""} ${settings.reducedMotion ? "reduced-motion" : ""} ${
        settings.highContrast ? "high-contrast" : ""
      }`}
    >
      <div className="site-body">
        <main className="layout">
          <section className="game-wrap">
            <section className={`menu ${inGame ? "hidden" : ""}`}>
              <div className={`menu-stage ${panel === "skins" ? "menu-stage--skin" : ""}`}>
                <div className="menu-header">
                  <button className="menu-icon" type="button" aria-label="Store" onClick={handleStore}>
                    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                      <path
                        d="M3 5h2l2.2 9.2h9.4l2.4-6.8H7.2"
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="10" cy="18.5" r="1.6" />
                      <circle cx="17.5" cy="18.5" r="1.6" />
                    </svg>
                  </button>
                  <div className="menu-title">Select a Game Mode</div>
                  <div className="menu-gems">
                    <div className="menu-points">
                      <div>
                        <span>Last Run</span>
                        <strong>{lastScore} pts</strong>
                      </div>
                      <div>
                        <span>Best</span>
                        <strong>{bestScore} pts</strong>
                      </div>
                    </div>
                    <div className="menu-wallet">
                      <span className="menu-wallet__icon"></span>
                      <strong>{gems}</strong>
                    </div>
                  </div>
                </div>

                <div className="menu-hero">
                  <div className="menu-hero__brand">
                    <div className="menu-hero__title">Space Waves</div>
                    <div className="menu-hero__subtitle">Thread the corridor. Chase perfect lines.</div>
                  </div>
                  <div className="menu-hero__stats">
                    <div className="hero-card hero-card--rank">
                      <span>Rank</span>
                      <strong>{currentRank.name}</strong>
                      <div className="hero-progress" role="presentation">
                        <div
                          className="hero-progress__fill"
                          style={{ width: `${Math.round(xpProgress * 100)}%` }}
                        ></div>
                      </div>
                      <em>
                        Level {playerLevel} · {xpRemaining} XP to next
                      </em>
                    </div>
                    <div className="hero-card">
                      <span>Current Level</span>
                      <strong>{currentLevel.id}</strong>
                      <em>Difficulty {currentLevel.difficulty}</em>
                    </div>
                    <div className="hero-card">
                      <span>Daily Level</span>
                      <strong>{dailyLevel.id}</strong>
                      <em>{SKIN_LABELS[dailyLevel.theme] || dailyLevel.theme} Theme</em>
                    </div>
                    <div className="hero-card hero-card--skin">
                      <div className="hero-card__label">Active Skin</div>
                      <div
                        className="hero-skin"
                        style={{
                          "--skin-arrow": activeSkin.fillTop,
                          "--skin-arrow-shadow": activeSkin.fillBottom,
                        }}
                      >
                        <svg className="shape-svg hero-shape-svg" viewBox="0 0 100 100" aria-hidden="true">
                          <polygon points={activeShapeSvg.main} className="shape-main" />
                          <polygon points={activeShapeSvg.tail} className="shape-tail" />
                        </svg>
                      </div>
                      <div className="hero-card__name">{SKIN_LABELS[selectedSkin] || selectedSkin}</div>
                    </div>
                  </div>
                </div>

                <div className="mode-grid">
                  <article
                    className={`mode-tile ${mode === "classic" ? "active" : ""}`}
                    onClick={() => setMode("classic")}
                  >
                    <h3>Classic</h3>
                    <div className="mode-icon">
                      <svg viewBox="0 0 48 48" role="img" aria-hidden="true">
                        <polyline points="6,30 16,22 24,28 34,18 42,22" />
                        <line x1="10" y1="12" x2="10" y2="30" />
                        <polygon points="10,12 24,16 10,20" />
                      </svg>
                    </div>
                    <p>Reach the finish to complete levels.</p>
                    <button className="mode-btn secondary" onClick={handleToggleLevels}>
                      Select Level
                    </button>
                    <button className="mode-btn primary" onClick={() => handleModeStart("classic")}>
                      Start
                    </button>
                  </article>

                  <article
                    className={`mode-tile ${mode === "endless" ? "active" : ""}`}
                    onClick={() => setMode("endless")}
                  >
                    <h3>Endless</h3>
                    <div className="mode-icon">
                      <svg viewBox="0 0 48 48" role="img" aria-hidden="true">
                        <circle cx="16" cy="24" r="8" />
                        <circle cx="32" cy="24" r="8" />
                        <line x1="20" y1="24" x2="28" y2="24" />
                      </svg>
                    </div>
                    <p>Go as far as possible and set a high score.</p>
                    <div className="mode-meta-row">Best {bestScore} pts</div>
                    <button className="mode-btn primary" onClick={() => handleModeStart("endless")}>
                      Start
                    </button>
                  </article>

                  <article
                    className={`mode-tile mode-tile--challenge ${mode === "challenge" ? "active" : ""}`}
                    onClick={() => setMode("challenge")}
                  >
                    <h3>Challenge</h3>
                    <div className="mode-icon">
                      <svg viewBox="0 0 48 48" role="img" aria-hidden="true">
                        <polygon points="24,6 30,20 44,20 33,29 37,42 24,34 11,42 15,29 4,20 18,20" />
                      </svg>
                    </div>
                    <p>Beat timed checkpoints for bonus multipliers.</p>
                    <div className="mode-meta-row">Checkpoint Rush</div>
                    <button className="mode-btn primary" onClick={() => handleModeStart("challenge")}>
                      Start
                    </button>
                  </article>

                  <article
                    className={`mode-tile ${mode === "race" ? "active" : ""}`}
                    onClick={() => setMode("race")}
                  >
                    <h3>Race</h3>
                    <div className="mode-icon">
                      <svg viewBox="0 0 48 48" role="img" aria-hidden="true">
                        <line x1="10" y1="10" x2="10" y2="36" />
                        <path d="M10 12h20l-4 6 4 6H10z" />
                      </svg>
                    </div>
                    <p>Reach the finish before others.</p>
                    <div className="mode-meta-row">Daily Level {dailyLevel.id}</div>
                    <button className="mode-btn primary" onClick={() => handleModeStart("race")}>
                      Start
                    </button>
                  </article>
                </div>

                {showLevels ? (
                  <div className="level-modal" role="dialog" aria-modal="true">
                    <div className="level-panel">
                      <div className="level-panel__header">
                        <h4>Select Level</h4>
                        <div className="level-panel__meta">Best {bestScore} pts</div>
                        <button
                          className="level-panel__close"
                          type="button"
                          onClick={() => setShowLevels(false)}
                        >
                          Close
                        </button>
                      </div>
                      <div className="level-grid">
                        {LEVELS.map((level) => (
                          <button
                            key={level.id}
                            className={`level-tile diff-${level.difficulty} ${
                              currentLevel.id === level.id ? "active" : ""
                            }`}
                            onClick={() => handleLevelSelect(level)}
                          >
                            <span className="level-id">{level.id}</span>
                            <span className={`level-face face-${level.difficulty}`}></span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {panel === "store" ? (
                  <div className="panel-modal" role="dialog" aria-modal="true">
                    <div className="menu-panel">
                      <div className="menu-panel__header">
                        <h4>Store</h4>
                        <button className="menu-panel__close" type="button" onClick={closePanel}>
                          Close
                        </button>
                      </div>
                      <div className="panel-grid">
                        {storeItems.map((item) => {
                          const isOwned = item.cta === "Owned";
                          return (
                            <article
                              key={item.id}
                              className={`panel-card ${item.locked ? "panel-card--locked" : ""} ${
                                isOwned ? "panel-card--owned" : ""
                              }`}
                            >
                              <div className="panel-card__title">{item.title}</div>
                              <p className="panel-card__meta">{item.description}</p>
                              <div className="panel-card__actions">
                                <span className="panel-card__price">
                                  <span className="panel-gem"></span>
                                  {item.price}
                                </span>
                                <button
                                  className="panel-card__btn"
                                  type="button"
                                  onClick={item.action}
                                  disabled={item.disabled}
                                >
                                  {item.cta}
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {panel === "skins" ? (
                  <div
                    className="skin-screen"
                    style={{
                      "--skin-bg": activeSkin.fillTop,
                      "--skin-bg-dark": activeSkin.fillBottom,
                    }}
                  >
                    <div className="skin-topbar">
                      <button className="skin-icon-btn" type="button" onClick={closePanel} aria-label="Back">
                        <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                          <path d="M15 5l-7 7 7 7" fill="none" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </button>
                      <button className="skin-icon-btn" type="button" onClick={handleStore} aria-label="Store">
                        <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                          <path
                            d="M3 5h2l2.2 9.2h9.4l2.4-6.8H7.2"
                            fill="none"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="10" cy="18.5" r="1.6" />
                          <circle cx="17.5" cy="18.5" r="1.6" />
                        </svg>
                      </button>
                      <div className="skin-title">SKIN</div>
                      <div className="skin-wallet">
                        <span className="skin-wallet__gem"></span>
                        <strong>{gems}</strong>
                        <button
                          className="skin-plus"
                          type="button"
                          onClick={handleAddGems}
                          disabled={claimedToday}
                          aria-label={claimedToday ? "Daily gems claimed" : "Add gems"}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="skin-tabs">
                      {skinTabs.map((tab) => (
                        <button
                          key={tab.id}
                          className={`skin-tab ${skinTab === tab.id ? "active" : ""}`}
                          type="button"
                          onClick={() => handleSkinTab(tab.id)}
                        >
                          {tab.id === "trail" ? (
                            <span className="skin-tab__icon trail"></span>
                          ) : tab.id === "arrow" ? (
                            <span className="skin-tab__icon arrow"></span>
                          ) : (
                            <span className="skin-tab__icon shape"></span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="skin-body">
                      <div className="skin-preview" onClick={handleSkinPreview}>
                        <div
                          className="skin-preview__ship"
                          style={{
                            "--skin-arrow": activeSkin.fillTop,
                            "--skin-arrow-shadow": activeSkin.fillBottom,
                            "--skin-trail": activeTrail.color,
                          }}
                        >
                          <svg className="shape-svg shape-preview-svg" viewBox="0 0 100 100" aria-hidden="true">
                            <polygon points={activeShapeSvg.main} className="shape-main" />
                            <polygon points={activeShapeSvg.tail} className="shape-tail" />
                          </svg>
                          <span className="skin-preview__trail"></span>
                        </div>
                        <div className="skin-selected">SELECTED</div>
                      </div>

                      <div className="skin-grid">
                        {activeTabItems.map((item, index) => {
                          const isActive =
                            skinTab === "arrow"
                              ? selectedSkin === item.id
                              : skinTab === "shape"
                              ? pointerShape === item.id
                              : skinTab === "trail"
                              ? selectedTrail === item.id
                              : false;
                          const isLocked = skinTab === "arrow" ? !item.unlocked : item.locked;
                          const showPrice =
                            (skinTab === "arrow" || skinTab === "trail" || skinTab === "shape") &&
                            !item.unlocked &&
                            (item.cost || 0) > 0;
                          const label = item.locked ? "Locked" : item.title || "Skin";
                          const glyphClass =
                            skinTab === "arrow"
                              ? "arrow"
                              : skinTab === "trail"
                              ? "trail"
                              : skinTab === "shape"
                              ? "shape"
                              : "palette";
                          const chipStyle =
                            skinTab === "arrow"
                              ? { "--chip-fill": item.colors.fillTop, "--chip-shadow": item.colors.fillBottom }
                              : skinTab === "trail"
                              ? { "--chip-fill": item.colors.color, "--chip-shadow": item.colors.glow }
                              : skinTab === "shape"
                              ? {
                                  "--skin-arrow": activeSkin.fillTop,
                                  "--skin-arrow-shadow": activeSkin.fillBottom,
                                }
                              : { "--chip-fill": activeSkin.fillTop, "--chip-shadow": activeSkin.fillBottom };
                          return (
                            <button
                              key={item.id}
                              className={`skin-tile ${isActive ? "active" : ""} ${
                                isLocked ? "locked" : ""
                              }`}
                              type="button"
                              onClick={() =>
                                skinTab === "arrow"
                                  ? handleSkinSelect(item.id)
                                  : skinTab === "trail"
                                  ? handleTrailSelect(item.id)
                                  : skinTab === "shape"
                                  ? handleShapeSelect(item.id)
                                  : showMenuNotice("Coming soon")
                              }
                            >
                              <span className={`skin-tile__glyph ${glyphClass}`} style={chipStyle}>
                                {skinTab === "shape" ? (
                                  <svg className="shape-svg shape-tile-svg" viewBox="0 0 100 100" aria-hidden="true">
                                    <polygon points={item.svg.main} className="shape-main" />
                                    <polygon points={item.svg.tail} className="shape-tail" />
                                  </svg>
                                ) : null}
                              </span>
                              {index >= activeTabItems.length - 4 ? (
                                <span className="skin-tile__star">?</span>
                              ) : null}
                              {showPrice ? (
                                <span className="skin-tile__price">
                                  <span className="skin-tile__gem"></span>
                                  {item.cost}
                                </span>
                              ) : (
                                <span className="skin-tile__name">{label}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {panel === "settings" ? (
                  <div className="panel-modal" role="dialog" aria-modal="true">
                    <div className="menu-panel">
                      <div className="menu-panel__header">
                        <h4>Settings</h4>
                        <button className="menu-panel__close" type="button" onClick={closePanel}>
                          Close
                        </button>
                      </div>
                      <div className="settings-grid">
                        <button
                          className={`setting-tile ${settings.reducedMotion ? "active" : ""}`}
                          type="button"
                          onClick={() => toggleSetting("reducedMotion")}
                        >
                          <div className="setting-row">
                            <span>Reduced Motion</span>
                            <strong>{settings.reducedMotion ? "On" : "Off"}</strong>
                          </div>
                          <span className="setting-meta">Softens HUD movement</span>
                        </button>
                        <button
                          className={`setting-tile ${settings.highContrast ? "active" : ""}`}
                          type="button"
                          onClick={() => toggleSetting("highContrast")}
                        >
                          <div className="setting-row">
                            <span>High Contrast</span>
                            <strong>{settings.highContrast ? "On" : "Off"}</strong>
                          </div>
                          <span className="setting-meta">Sharper UI edges</span>
                        </button>
                        <button
                          className={`setting-tile ${settings.mute ? "active" : ""}`}
                          type="button"
                          onClick={() => toggleSetting("mute")}
                        >
                          <div className="setting-row">
                            <span>Mute</span>
                            <strong>{settings.mute ? "On" : "Off"}</strong>
                          </div>
                          <span className="setting-meta">Silences game sounds</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="menu-footer">
                  <button className="menu-action" onClick={handleSkin}>
                    Skin
                  </button>
                  <button className="menu-action" onClick={handleSettings}>
                    Settings
                  </button>
                </div>
                {menuNotice ? <div className="menu-notice">{menuNotice}</div> : null}
              </div>
            </section>

            <section
              className={`game ${inGame ? "" : "hidden"}`}
              style={{
                "--ui-accent": activeTheme.fillTop,
                "--ui-accent-2": activeTheme.fillBottom,
                "--ui-edge": activeTheme.edge,
              }}
            >
              <canvas ref={canvasRef} id="gameCanvas" aria-label="Space Waves game canvas"></canvas>

              <div className="game-ui">
                <button
                  className="pause-btn"
                  type="button"
                  onClick={handlePauseToggle}
                  aria-label="Pause"
                >
                  <span></span>
                  <span></span>
                </button>
                <div className="pause-key">P</div>

                <div className="progress">
                  <div className="progress__bar">
                    <div className="progress__fill" style={{ width: `${Math.round(progress)}%` }}></div>
                    <span className="progress__text">{score} pts</span>
                  </div>
                </div>

                {mode === "challenge" && challengeHud.active ? (
                  <div className="hud-challenge">
                    <div className="hud-challenge__row">
                      <span>
                        Checkpoint {Math.min(challengeHud.index + 1, challengeHud.total)}/{challengeHud.total}
                      </span>
                      <strong>x{challengeHud.multiplier.toFixed(1)}</strong>
                    </div>
                    <div className="hud-challenge__bar">
                      <div
                        className="hud-challenge__fill"
                        style={{
                          width: `${Math.round(
                            (challengeHud.timeLeft / Math.max(0.1, challengeHud.timeMax)) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="hud-challenge__meta">
                      <span>Next {Math.round(challengeHud.next)}%</span>
                      {challengeHud.lastBonus > 0 ? (
                        <em key={challengeHud.flash} className="hud-challenge__bonus">
                          +{challengeHud.lastBonus}
                        </em>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="hud-gems">
                  <span className="hud-gem-icon"></span>
                  <span>{gems}</span>
                  {runGems > 0 ? <em className="hud-gem-bonus">+{runGems}</em> : null}
                </div>

                {combo > 1 ? (
                  <div className="hud-combo">
                    <span>Combo</span>
                    <strong>x{combo}</strong>
                  </div>
                ) : null}

                {shieldActive ? (
                  <div className="hud-shield">
                    <span className="shield-icon"></span>
                    <span>Shield</span>
                  </div>
                ) : null}

              </div>

              <div
                className={`overlay ${overlay.visible ? "" : "overlay--hidden"} ${
                  overlay.kind === "complete" ? "overlay--complete" : ""
                }`}
              >
                <div className="overlay__card">
                  <h2>{overlay.title}</h2>
                  {overlay.kind === "complete" ? (
                    <>
                      {overlay.subtitle ? <div className="overlay__score">{overlay.subtitle}</div> : null}
                      <div className="overlay__reward">
                        <span>+{overlay.reward}</span>
                        <span className="overlay-gem"></span>
                      </div>
                      {overlay.xp ? <div className="overlay__xp">+{overlay.xp} XP</div> : null}
                      <button className="next-btn" onClick={handleNext}>
                        <span className="next-icon">»</span> Next
                      </button>
                      <div className="overlay__footer overlay__footer--complete">
                        <button className="icon-btn" onClick={handleMenu} aria-label="Home">
                          <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                            <path
                              d="M4 11.5l8-6 8 6V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"
                              fill="none"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button className="icon-btn" onClick={handleRestart} aria-label="Restart">
                          <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                            <path
                              d="M4 12a8 8 0 1 0 2.3-5.7"
                              fill="none"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path d="M4 4v4h4" fill="none" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>{overlay.subtitle}</p>
                      {overlay.xp ? <div className="overlay__xp">+{overlay.xp} XP</div> : null}
                      <div className="overlay__actions">
                        <button
                          className={`play-btn small ${overlay.showRestart ? "" : "hidden"}`}
                          onClick={handleRestart}
                        >
                          Restart
                        </button>
                        <button
                          className={`play-btn small ${overlay.showResume ? "" : "hidden"}`}
                          onClick={handleResume}
                        >
                          Resume
                        </button>
                        <button
                          className={`ghost-btn ${overlay.showMenu ? "" : "hidden"}`}
                          onClick={handleMenu}
                        >
                          Back to Menu
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            <div className="game-footer">
              <div className="footer-title">Space Waves</div>
              <div className="footer-icons">
                <span className="footer-icon"></span>
                <span className="footer-icon"></span>
                <span className="footer-icon"></span>
                <span className="footer-icon"></span>
                <span className="footer-icon"></span>
                <span className="footer-icon"></span>
              </div>
            </div>
          </section>
        </main>
      </div>
      {showRotateOverlay ? (
        <div className="rotate-overlay" role="dialog" aria-modal="true">
          <div className="rotate-card">
            <div className="rotate-icon" aria-hidden="true"></div>
            <h3>Rotate to Landscape</h3>
            <p>Switch your device to landscape to start the game.</p>
            <button className="rotate-btn" type="button" onClick={cancelPendingStart}>
              Back
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}



