'use strict';

const TAU = Math.PI * 2;
const ROOM_W = 15;
const ROOM_H = 9;
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
const DPR_CAP = 2;

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d', { alpha: false });

const el = {
  start: $('startScreen'),
  pause: $('pauseScreen'),
  over: $('gameoverScreen'),
  startBtn: $('startBtn'),
  resumeBtn: $('resumeBtn'),
  restartBtn: $('restartBtn'),
  menuBtn: $('menuBtn'),
  againBtn: $('againBtn'),
  overMenuBtn: $('overMenuBtn'),
  pauseBtn: $('pauseBtn'),
  muteBtn: $('muteBtn'),
  tiltToggle: $('tiltToggle'),
  pauseTiltToggle: $('pauseTiltToggle'),
  tiltHint: $('tiltHint'),
  calibrateBtn: $('calibrateBtn'),
  soundToggle: $('soundToggle'),
  bestLine: $('bestLine'),
  toast: $('toast'),
  pauseFloor: $('pauseFloor'),
  pauseKills: $('pauseKills'),
  pauseCoins: $('pauseCoins'),
  pauseScore: $('pauseScore'),
  overFloor: $('overFloor'),
  overKills: $('overKills'),
  overCoins: $('overCoins'),
  overScore: $('overScore'),
  overTime: $('overTime'),
  overBest: $('overBest'),
  tiltCard: $('tiltCard')
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b = 0) => b + Math.random() * (a - b);
const randi = (a, b) => Math.floor(rand(b + 1, a));
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const norm = (x, y) => {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};
const angleLerp = (a, b, t) => {
  const d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI;
  return a + d * t;
};
const hash2 = (x, y) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
};
const fmt = (n) => Math.round(n).toLocaleString('ru-RU');

const FLOOR_NAMES = ['Подвал', 'Погреб', 'Канализация', 'Склеп', 'Гробница', 'Бездна', 'Чрево', 'Костяной сад', 'Мясные глубины'];
const floorName = (n) => FLOOR_NAMES[Math.min(FLOOR_NAMES.length - 1, n - 1)];

let W = 0;
let H = 0;
let DPR = 1;
let safe = { t: 0, r: 0, b: 0, l: 0 };
let roomRect = { x: 0, y: 0, w: 0, h: 0, tile: 40 };
let joyLayout = {
  left: { x: 80, y: 700, r: 56 },
  right: { x: 300, y: 700, r: 56 }
};

let state = 'title';
let time = 0;
let last = 0;
let floorNum = 1;
let dungeon = null;
let room = null;
let player = null;
let score = 0;
let kills = 0;
let runTime = 0;
let shake = 0;
let flash = 0;
let transition = null;
let uid = 1;
let toastTimer = 0;

let best = loadBest();

const input = {
  keys: new Set(),
  mouse: { x: 0, y: 0, down: false },
  sticks: { move: null, aim: null },
  pointerSide: new Map(),
  touchSeen: IS_TOUCH,
  tilt: {
    enabled: false,
    has: false,
    raw: { beta: 0, gamma: 0 },
    base: null,
    vec: { x: 0, y: 0 }
  }
};

function loadBest() {
  try {
    const v = JSON.parse(localStorage.getItem('tearfall-best') || 'null');
    return v && typeof v.score === 'number' ? v : { score: 0, floor: 0 };
  } catch (e) {
    return { score: 0, floor: 0 };
  }
}

function saveBest() {
  if (score > (best.score || 0)) {
    best = { score: Math.round(score), floor: floorNum };
    try {
      localStorage.setItem('tearfall-best', JSON.stringify(best));
    } catch (e) { /* ignore */ }
  }
  updateBestLine();
}

function updateBestLine() {
  el.bestLine.textContent = best.score > 0
    ? 'Рекорд: ' + fmt(best.score) + ' · этаж ' + best.floor
    : 'Рекорд: —';
}

function readSafe() {
  const cs = getComputedStyle(document.documentElement);
  const num = (name) => {
    const v = parseFloat(cs.getPropertyValue(name));
    return Number.isFinite(v) ? v : 0;
  };
  return { t: num('--sat'), r: num('--sar'), b: num('--sab'), l: num('--sal') };
}

function layout() {
  safe = readSafe();
  const margin = 10;
  const hudH = 62 + safe.t;
  const jr = clamp(Math.min(W, H) * 0.115, 46, 66);
  const portrait = H > W * 1.1;
  const deck = IS_TOUCH && portrait ? jr * 2 + 54 : 0;
  const availX = margin + safe.l;
  const availY = hudH;
  const availW = Math.max(120, W - margin * 2 - safe.l - safe.r);
  const availH = Math.max(120, H - hudH - margin - safe.b - deck);
  const tile = Math.min(availW / ROOM_W, availH / ROOM_H);
  const rw = tile * ROOM_W;
  const rh = tile * ROOM_H;
  roomRect = {
    x: availX + (availW - rw) / 2,
    y: availY + (availH - rh) / 2,
    w: rw,
    h: rh,
    tile
  };

  const jy = H - safe.b - jr - 16;
  const rightEdge = roomRect.x + roomRect.w;
  const lx = roomRect.x > jr + 20 ? roomRect.x / 2 : jr + 14 + safe.l;
  const rx = W - rightEdge > jr + 20 ? (rightEdge + W) / 2 : W - jr - 14 - safe.r;
  joyLayout = {
    left: { x: lx, y: jy, r: jr },
    right: { x: rx, y: jy, r: jr }
  };
}

function resize() {
  W = Math.max(1, window.innerWidth);
  H = Math.max(1, window.innerHeight);
  DPR = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  layout();
}

/* ------------------------------------------------------------------ audio */

const Sound = {
  ac: null,
  master: null,
  muted: localStorage.getItem('tearfall-muted') === '1',
  init() {
    if (this.ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ac = new AC();
    this.master = this.ac.createGain();
    this.master.gain.value = this.muted ? 0 : 0.42;
    this.master.connect(this.ac.destination);
  },
  unlock() {
    this.init();
    if (this.ac && this.ac.state === 'suspended') this.ac.resume().catch(() => {});
  },
  setMuted(m) {
    this.muted = m;
    try {
      localStorage.setItem('tearfall-muted', m ? '1' : '0');
    } catch (e) { /* ignore */ }
    if (this.master) this.master.gain.value = m ? 0 : 0.42;
    document.body.classList.toggle('muted', m);
    el.soundToggle.setAttribute('aria-checked', String(!m));
    el.muteBtn.setAttribute('aria-label', m ? 'Включить звук' : 'Выключить звук');
  },
  tone(freq, dur, type = 'sine', vol = 0.16, slideTo = 0, delay = 0) {
    if (!this.ac || this.muted) return;
    const t0 = this.ac.currentTime + delay;
    const osc = this.ac.createOscillator();
    const gain = this.ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  },
  noise(dur = 0.12, vol = 0.12, freq = 1200, delay = 0) {
    if (!this.ac || this.muted) return;
    const t0 = this.ac.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ac.sampleRate * dur));
    const buf = this.ac.createBuffer(1, len, this.ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ac.createBufferSource();
    src.buffer = buf;
    const filter = this.ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const gain = this.ac.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  },
  shoot() {
    this.tone(520, 0.09, 'sine', 0.08, 900);
    this.noise(0.05, 0.04, 2400);
  },
  enemyHit() {
    this.noise(0.07, 0.07, 900);
  },
  kill() {
    this.tone(180, 0.16, 'square', 0.08, 70);
    this.noise(0.12, 0.08, 700);
  },
  hurt() {
    this.tone(150, 0.28, 'sawtooth', 0.18, 48);
    this.noise(0.2, 0.12, 500);
  },
  coin() {
    this.tone(880, 0.06, 'square', 0.06, 1320);
    this.tone(1320, 0.08, 'square', 0.045, 1760, 0.05);
  },
  heal() {
    this.tone(440, 0.1, 'sine', 0.1, 660);
    this.tone(660, 0.16, 'sine', 0.09, 880, 0.08);
  },
  soul() {
    this.tone(660, 0.12, 'triangle', 0.09, 990);
    this.tone(990, 0.2, 'triangle', 0.08, 1320, 0.1);
  },
  pickup() {
    this.tone(330, 0.1, 'triangle', 0.1, 440);
    this.tone(440, 0.1, 'triangle', 0.1, 550, 0.08);
    this.tone(550, 0.18, 'triangle', 0.1, 880, 0.16);
  },
  door() {
    this.tone(90, 0.22, 'square', 0.1, 55);
    this.noise(0.18, 0.09, 420);
  },
  clear() {
    this.tone(392, 0.12, 'triangle', 0.1, 523);
    this.tone(523, 0.12, 'triangle', 0.1, 659, 0.1);
    this.tone(784, 0.24, 'triangle', 0.1, 1046, 0.2);
  },
  boss() {
    this.tone(70, 0.4, 'sawtooth', 0.14, 42);
    this.noise(0.3, 0.1, 260);
  },
  bossDie() {
    this.tone(120, 0.8, 'sawtooth', 0.2, 30);
    this.noise(0.7, 0.16, 300);
  },
  descend() {
    this.tone(300, 0.18, 'sine', 0.1, 200);
    this.tone(200, 0.22, 'sine', 0.1, 130, 0.14);
    this.tone(130, 0.4, 'sine', 0.12, 65, 0.3);
  },
  die() {
    this.tone(220, 0.5, 'sawtooth', 0.18, 55);
    this.noise(0.6, 0.14, 400);
  },
  ui() {
    this.tone(480, 0.05, 'sine', 0.05, 600);
  }
};

/* ------------------------------------------------------------------ input */

function toast(msg, ms = 2300) {
  el.toast.textContent = msg;
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('show'), ms);
}

function updateMouse(e) {
  const rect = canvas.getBoundingClientRect();
  input.mouse.x = e.clientX - rect.left;
  input.mouse.y = e.clientY - rect.top;
}

function stickRadius() {
  return joyLayout.left.r;
}

function updateStick(stick, cx, cy) {
  const dx = cx - stick.base.x;
  const dy = cy - stick.base.y;
  const r = stick.r;
  let nx = dx / r;
  let ny = dy / r;
  const len = Math.hypot(nx, ny);
  if (len > 1) {
    nx /= len;
    ny /= len;
  }
  if (len < 0.14) {
    nx = 0;
    ny = 0;
  }
  stick.vec.x = nx;
  stick.vec.y = ny;
  stick.cur.x = cx;
  stick.cur.y = cy;
}

function onPointerDown(e) {
  if (state !== 'playing') return;
  Sound.unlock();
  if (e.pointerType === 'mouse') {
    input.mouse.down = true;
    updateMouse(e);
    return;
  }
  input.touchSeen = true;
  const side = e.clientX < W / 2 ? 'move' : 'aim';
  if (input.sticks[side]) return;
  const r = stickRadius();
  const base = {
    x: clamp(e.clientX, r + 8, W - r - 8),
    y: clamp(e.clientY, r + 8, H - r - 8)
  };
  const stick = {
    id: e.pointerId,
    side,
    base,
    cur: { x: e.clientX, y: e.clientY },
    vec: { x: 0, y: 0 },
    r
  };
  updateStick(stick, e.clientX, e.clientY);
  input.sticks[side] = stick;
  input.pointerSide.set(e.pointerId, side);
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch (err) { /* ignore */ }
}

function onPointerMove(e) {
  if (e.pointerType === 'mouse') {
    updateMouse(e);
    return;
  }
  const side = input.pointerSide.get(e.pointerId);
  if (!side) return;
  const stick = input.sticks[side];
  if (!stick) return;
  updateStick(stick, e.clientX, e.clientY);
}

function endPointer(e) {
  if (e.pointerType === 'mouse') {
    input.mouse.down = false;
    return;
  }
  const side = input.pointerSide.get(e.pointerId);
  if (!side) return;
  input.sticks[side] = null;
  input.pointerSide.delete(e.pointerId);
}

function clearPointers() {
  input.sticks.move = null;
  input.sticks.aim = null;
  input.pointerSide.clear();
  input.mouse.down = false;
  input.keys.clear();
}

canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
window.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse') updateMouse(e);
});
window.addEventListener('pointerup', (e) => {
  if (e.pointerType === 'mouse') input.mouse.down = false;
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
  const code = e.code;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
    if (state === 'playing' || state === 'paused') e.preventDefault();
  }
  Sound.unlock();
  if (code === 'Escape' || code === 'KeyP') {
    if (state === 'playing') pauseGame();
    else if (state === 'paused') resumeGame();
  }
  if (code === 'KeyM') {
    Sound.setMuted(!Sound.muted);
    toast(Sound.muted ? 'Звук выключен' : 'Звук включён', 1200);
  }
  if (state === 'title' && (code === 'Enter' || code === 'Space')) {
    e.preventDefault();
    startRun();
    return;
  }
  if (state === 'gameover' && code === 'Enter') {
    startRun();
    return;
  }
  input.keys.add(code);
});

window.addEventListener('keyup', (e) => input.keys.delete(e.code));
window.addEventListener('blur', clearPointers);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'playing') pauseGame();
});
window.addEventListener('gesturestart', (e) => e.preventDefault());

function getMoveVec() {
  const stick = input.sticks.move;
  if (stick && (stick.vec.x || stick.vec.y)) {
    return { x: stick.vec.x, y: stick.vec.y };
  }
  if (input.tilt.enabled && (input.tilt.vec.x || input.tilt.vec.y)) {
    return { x: input.tilt.vec.x, y: input.tilt.vec.y };
  }
  let x = 0;
  let y = 0;
  if (input.keys.has('KeyA')) x -= 1;
  if (input.keys.has('KeyD')) x += 1;
  if (input.keys.has('KeyW')) y -= 1;
  if (input.keys.has('KeyS')) y += 1;
  const l = Math.hypot(x, y);
  if (l > 1) {
    x /= l;
    y /= l;
  }
  return { x, y };
}

function getAimVec() {
  let x = 0;
  let y = 0;
  if (input.keys.has('ArrowLeft')) x -= 1;
  if (input.keys.has('ArrowRight')) x += 1;
  if (input.keys.has('ArrowUp')) y -= 1;
  if (input.keys.has('ArrowDown')) y += 1;
  if (x || y) return norm(x, y);

  if (input.mouse.down && player) {
    const px = roomRect.x + player.x * roomRect.tile;
    const py = roomRect.y + player.y * roomRect.tile;
    const dx = input.mouse.x - px;
    const dy = input.mouse.y - py;
    if (Math.hypot(dx, dy) > 4) return norm(dx, dy);
  }

  const stick = input.sticks.aim;
  if (stick) {
    const len = Math.hypot(stick.vec.x, stick.vec.y);
    if (len > 0.14) return norm(stick.vec.x, stick.vec.y);
  }
  return null;
}

/* ------------------------------------------------------------------ motion */

function tiltSupported() {
  return typeof window.DeviceOrientationEvent !== 'undefined';
}

function computeTiltVec() {
  const t = input.tilt;
  if (!t.base) {
    t.vec = { x: 0, y: 0 };
    return;
  }
  const dx = t.raw.gamma - t.base.gamma;
  const dy = t.raw.beta - t.base.beta;
  const angle = (screen.orientation && typeof screen.orientation.angle === 'number')
    ? screen.orientation.angle
    : (window.orientation || 0);
  let rx = dx;
  let ry = dy;
  if (angle === 90) {
    rx = dy;
    ry = -dx;
  } else if (angle === -90 || angle === 270) {
    rx = -dy;
    ry = dx;
  } else if (angle === 180) {
    rx = -dx;
    ry = -dy;
  }
  let vx = rx / 24;
  let vy = ry / 24;
  const m = Math.hypot(vx, vy);
  if (m < 0.1) {
    vx = 0;
    vy = 0;
  } else if (m > 1) {
    vx /= m;
    vy /= m;
  }
  t.vec = { x: vx, y: vy };
}

function onOrientation(e) {
  if (e.beta == null && e.gamma == null) return;
  const t = input.tilt;
  t.has = true;
  t.raw.beta = e.beta || 0;
  t.raw.gamma = e.gamma || 0;
  if (!t.base) t.base = { beta: t.raw.beta, gamma: t.raw.gamma };
  computeTiltVec();
}

async function enableTilt() {
  if (!tiltSupported()) {
    toast('Датчик наклона недоступен на этом устройстве');
    return false;
  }
  try {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res !== 'granted') {
        toast('Разрешение на датчики отклонено');
        return false;
      }
    }
  } catch (err) {
    toast('Не удалось получить доступ к датчикам');
    return false;
  }
  const t = input.tilt;
  t.enabled = true;
  t.has = false;
  t.base = null;
  t.vec = { x: 0, y: 0 };
  window.addEventListener('deviceorientation', onOrientation, true);
  updateTiltUI();
  toast('Наклон включён — держи устройство удобно');
  setTimeout(() => {
    if (input.tilt.enabled && !input.tilt.has) {
      toast('Датчик не отвечает. Проверь разрешения браузера.');
    }
  }, 1800);
  return true;
}

function disableTilt() {
  const t = input.tilt;
  t.enabled = false;
  t.vec = { x: 0, y: 0 };
  window.removeEventListener('deviceorientation', onOrientation, true);
  updateTiltUI();
}

async function toggleTilt() {
  Sound.unlock();
  if (input.tilt.enabled) {
    disableTilt();
    toast('Наклон выключен', 1400);
  } else {
    await enableTilt();
  }
}

function calibrateTilt() {
  if (!input.tilt.enabled) {
    toast('Сначала включи наклон');
    return;
  }
  if (!input.tilt.has) {
    toast('Датчик пока не отвечает');
    return;
  }
  input.tilt.base = { beta: input.tilt.raw.beta, gamma: input.tilt.raw.gamma };
  input.tilt.vec = { x: 0, y: 0 };
  toast('Наклон отцентрован');
}

function updateTiltUI() {
  const on = input.tilt.enabled;
  for (const btn of [el.tiltToggle, el.pauseTiltToggle]) {
    btn.setAttribute('aria-checked', String(on));
  }
  el.tiltHint.textContent = on
    ? 'Включён · наклони устройство для движения'
    : 'Движение наклоном · iOS спросит разрешение';
  el.calibrateBtn.disabled = !on;
  el.calibrateBtn.style.opacity = on ? '1' : '0.45';
}

/* ------------------------------------------------------------------ items */

const ITEMS = [
  { id: 'dmg', name: 'Кровавая слеза', desc: '+1 урон', color: '#e2434b', apply(p) { p.damage += 1; } },
  { id: 'rate', name: 'Скорбь', desc: '+18% скорость стрельбы', color: '#e89b4c', apply(p) { p.fireRate = Math.min(9, p.fireRate * 1.18); } },
  { id: 'speed', name: 'Быстрые ноги', desc: '+10% скорость', color: '#6fd0c8', apply(p) { p.speed = Math.min(7.4, p.speed * 1.1); } },
  { id: 'range', name: 'Дальний плач', desc: '+22% дальность', color: '#7fb6ff', apply(p) { p.tearLife *= 1.22; } },
  { id: 'triple', name: 'Тройные слёзы', desc: '+2 слезы веером', color: '#e58fc4', apply(p) { p.shots += 2; p.spread = Math.max(p.spread, 0.17); } },
  { id: 'pierce', name: 'Пронзающая слеза', desc: 'Слёзы пронзают врагов', color: '#b48cff', apply(p) { p.pierce += 1; } },
  { id: 'homing', name: 'Плачущий дух', desc: 'Слёзы преследуют врагов', color: '#8fe6ff', apply(p) { p.homing = Math.min(1, p.homing + 0.4); } },
  { id: 'big', name: 'Большая слеза', desc: '+урон и размер', color: '#c94b6b', apply(p) { p.damage += 1.2; p.tearSize *= 1.3; p.tearSpeed *= 0.95; } },
  { id: 'soul', name: 'Синяя душа', desc: '+2 душевных сердца', color: '#5aa8e8', apply(p) { p.soul = Math.min(12, p.soul + 2); } },
  { id: 'heart', name: 'Живое сердце', desc: '+1 сердце', color: '#e35b63', apply(p) { p.maxHp = Math.min(14, p.maxHp + 2); p.hp = Math.min(p.maxHp, p.hp + 2); } },
  { id: 'multi', name: 'Двойной плач', desc: '+1 слеза', color: '#f0c06a', apply(p) { p.shots += 1; p.spread = Math.max(p.spread, 0.12); } }
];

function pickItem() {
  return pick(ITEMS);
}
