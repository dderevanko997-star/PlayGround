'use strict';

/* ------------------------------------------------------------------ dungeon */

function keyOf(x, y) {
  return x + ',' + y;
}

function makeRoom(x, y, type, d) {
  return {
    x, y, type, dist: d,
    doors: { up: false, down: false, left: false, right: false },
    visited: false,
    cleared: false,
    spawned: false,
    enemies: [],
    tears: [],
    projectiles: [],
    pickups: [],
    items: [],
    rocks: [],
    decals: [],
    particles: [],
    floats: [],
    trapdoor: null,
    t: 0
  };
}

function makePlayer() {
  return {
    x: 7.5,
    y: 4.5,
    r: 0.31,
    speed: 4.5,
    hp: 6,
    maxHp: 6,
    soul: 0,
    coins: 0,
    damage: 2.2,
    fireRate: 3.4,
    tearSpeed: 10.5,
    tearLife: 0.8,
    tearSize: 0.14,
    shots: 1,
    spread: 0.15,
    pierce: 0,
    homing: 0,
    invuln: 1,
    shootCd: 0,
    shootAnim: 0,
    face: { x: 0, y: 1 },
    moving: false,
    walkT: 0,
    dead: false,
    deadT: 0
  };
}

function generateFloor(n) {
  const cells = [];
  const seen = new Set();
  const target = 8 + Math.min(5, n);
  seen.add(keyOf(0, 0));
  cells.push([0, 0]);
  let guard = 0;
  while (cells.length < target && guard++ < 600) {
    const [px, py] = cells[(Math.random() * cells.length) | 0];
    const dirs = shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    for (const [dx, dy] of dirs) {
      const nx = px + dx;
      const ny = py + dy;
      if (Math.abs(nx) > 4 || Math.abs(ny) > 4) continue;
      if (seen.has(keyOf(nx, ny))) continue;
      seen.add(keyOf(nx, ny));
      cells.push([nx, ny]);
      break;
    }
  }

  const distMap = new Map([[keyOf(0, 0), 0]]);
  const queue = [[0, 0]];
  const dirs4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length) {
    const [x, y] = queue.shift();
    const d = distMap.get(keyOf(x, y));
    for (const [dx, dy] of dirs4) {
      const nx = x + dx;
      const ny = y + dy;
      if (seen.has(keyOf(nx, ny)) && !distMap.has(keyOf(nx, ny))) {
        distMap.set(keyOf(nx, ny), d + 1);
        queue.push([nx, ny]);
      }
    }
  }

  const sorted = cells.slice().sort((a, b) => {
    return (distMap.get(keyOf(b[0], b[1])) || 0) - (distMap.get(keyOf(a[0], a[1])) || 0);
  });
  const bossCell = sorted[0];
  const treasure = sorted.find((c) => c !== bossCell && !(c[0] === 0 && c[1] === 0)) || sorted[1];
  const shop = sorted.find((c) => c !== bossCell && c !== treasure && !(c[0] === 0 && c[1] === 0));

  const rooms = new Map();
  for (const [x, y] of cells) {
    let type = 'normal';
    if (x === 0 && y === 0) type = 'start';
    else if (x === bossCell[0] && y === bossCell[1]) type = 'boss';
    else if (treasure && x === treasure[0] && y === treasure[1]) type = 'treasure';
    else if (shop && x === shop[0] && y === shop[1]) type = 'shop';
    rooms.set(keyOf(x, y), makeRoom(x, y, type, distMap.get(keyOf(x, y)) || 0));
  }

  for (const r of rooms.values()) {
    r.doors = {
      up: rooms.has(keyOf(r.x, r.y - 1)),
      down: rooms.has(keyOf(r.x, r.y + 1)),
      left: rooms.has(keyOf(r.x - 1, r.y)),
      right: rooms.has(keyOf(r.x + 1, r.y))
    };
  }

  const start = rooms.get(keyOf(0, 0));
  start.visited = true;
  start.spawned = true;
  start.cleared = true;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of cells) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return {
    rooms,
    floor: n,
    start,
    boss: rooms.get(keyOf(bossCell[0], bossCell[1])),
    bounds: { minX, minY, maxX, maxY }
  };
}

/* ------------------------------------------------------------------ spawning */

function addDecal(x, y, r, color) {
  if (!room) return;
  room.decals.push({ x, y, r, color, rot: rand(TAU), a: rand(0.18, 0.42) });
  if (room.decals.length > 90) room.decals.shift();
}

function spawnParticles(x, y, count, color, spread = 1.6, size = 0.06) {
  if (!room) return;
  for (let i = 0; i < count; i++) {
    const a = rand(TAU);
    const s = rand(spread, 0.2);
    const life = rand(0.65, 0.25);
    room.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life,
      maxLife: life,
      r: rand(size * 1.8, size * 0.5),
      color
    });
  }
}

function addFloat(x, y, text, color = '#f2d9a4', size = 0.26) {
  if (!room) return;
  room.floats.push({ x, y, text, color, size, life: 1.4, maxLife: 1.4 });
}

function addRock(r) {
  for (let i = 0; i < 60; i++) {
    const x = rand(12.9, 2.1);
    const y = rand(6.9, 2.1);
    if (Math.abs(x - 7.5) < 2.2 && Math.abs(y - 4.5) < 2.2) continue;
    if (Math.abs(x - 7.5) < 1.7) continue;
    if (Math.abs(y - 4.5) < 1.7) continue;
    if (r.items.some((it) => dist(x, y, it.x, it.y) < 1.2)) continue;
    if (r.rocks.some((o) => dist(x, y, o.x, o.y) < 1.15)) continue;
    r.rocks.push({ x, y, r: rand(0.46, 0.35), seed: rand(1000) });
    return;
  }
}

function findEnemySpot(r) {
  for (let i = 0; i < 80; i++) {
    const x = rand(12.8, 2.2);
    const y = rand(6.8, 2.2);
    if (dist(x, y, 7.5, 4.5) < 2.1) continue;
    if (Math.abs(x - 7.5) < 1.2 && (y < 2.4 || y > 6.6)) continue;
    if (Math.abs(y - 4.5) < 1.2 && (x < 2.4 || x > 12.6)) continue;
    if (r.rocks.some((o) => dist(x, y, o.x, o.y) < o.r + 0.6)) continue;
    return { x, y };
  }
  return { x: rand(11, 4), y: rand(6, 3) };
}

function enemyStats(type, floor) {
  const f = Math.max(0, floor - 1);
  if (type === 'fly') return { r: 0.2, hp: 2.6 + f * 0.8, speed: 3.15 };
  if (type === 'gaper') return { r: 0.33, hp: 6 + f * 1.5, speed: 1.75 };
  if (type === 'spitter') return { r: 0.33, hp: 5.5 + f * 1.3, speed: 1.15 };
  if (type === 'charger') return { r: 0.4, hp: 10 + f * 2.2, speed: 1.25 };
  return { r: 0.85, hp: 62 + f * 30, speed: 0.85 };
}

function spawnEnemy(r, type, x, y) {
  const s = enemyStats(type, floorNum);
  const e = {
    uid: uid++,
    type,
    x, y,
    r: s.r,
    hp: s.hp,
    maxHp: s.hp,
    speed: s.speed,
    vx: 0,
    vy: 0,
    hit: 0,
    spawn: 0.7,
    phase: rand(TAU),
    seed: rand(100),
    shootCd: rand(2.2, 1.1),
    state: 'idle',
    windup: 0,
    dashT: 0,
    dashDir: { x: 0, y: 1 },
    attackT: 1.7,
    summonT: 4.5,
    dead: false
  };
  r.enemies.push(e);
  return e;
}

function makePickup(type, x, y) {
  return {
    type,
    x,
    y,
    vx: rand(1.2, -1.2),
    vy: rand(1.2, -1.2),
    bob: rand(TAU)
  };
}

function makePedestal(def, x, y, price) {
  return { def, x, y, price, warned: false, bob: rand(TAU) };
}

function populateRoom(r, n) {
  if (r.spawned) return;
  r.spawned = true;
  if (r.type === 'start') {
    r.cleared = true;
    return;
  }
  if (r.type === 'treasure') {
    r.cleared = true;
    r.items.push(makePedestal(pickItem(), 7.5, 4.5, 0));
    return;
  }
  if (r.type === 'shop') {
    r.cleared = true;
    const a = pickItem();
    let b = pickItem();
    if (b.id === a.id) b = pickItem();
    r.items.push(makePedestal(a, 6.2, 4.5, 4 + randi(0, 4)));
    r.items.push(makePedestal(b, 8.8, 4.5, 4 + randi(0, 4)));
    return;
  }
  if (r.type === 'boss') {
    r.cleared = false;
    addRock(r);
    addRock(r);
    spawnEnemy(r, 'boss', 7.5, 3.1);
    if (n >= 2) {
      spawnEnemy(r, 'fly', 4.2, 3.1);
      spawnEnemy(r, 'fly', 10.8, 3.1);
    }
    return;
  }

  const rockCount = randi(0, Math.min(5, 1 + Math.floor(n / 2)));
  for (let i = 0; i < rockCount; i++) addRock(r);

  let count = 2 + Math.floor(n / 2) + (Math.random() < 0.4 ? 1 : 0);
  count = Math.min(7, count);
  const pool = ['fly', 'fly', 'gaper'];
  if (n >= 2) pool.push('spitter');
  if (n >= 3) pool.push('charger', 'gaper');
  for (let i = 0; i < count; i++) {
    const pos = findEnemySpot(r);
    spawnEnemy(r, pick(pool), pos.x, pos.y);
  }
}

function enterRoom(nr, dx, dy) {
  if (!nr) return;
  room = nr;
  if (!nr.visited) {
    nr.visited = true;
    populateRoom(nr, floorNum);
  } else if (!nr.spawned) {
    populateRoom(nr, floorNum);
  }
  nr.tears = [];
  nr.projectiles = [];
  if (dx === 1) {
    player.x = 1.55;
    player.y = clamp(player.y, 3.6, 5.4);
  } else if (dx === -1) {
    player.x = 13.45;
    player.y = clamp(player.y, 3.6, 5.4);
  } else if (dy === -1) {
    player.x = clamp(player.x, 6.6, 8.4);
    player.y = 7.45;
  } else if (dy === 1) {
    player.x = clamp(player.x, 6.6, 8.4);
    player.y = 1.55;
  }
  player.invuln = Math.max(player.invuln, 0.8);
  shake = Math.max(shake, 4);
}

function beginTransition(dx, dy) {
  if (transition) return;
  transition = { t: 0, dur: 0.34, swapped: false, kind: 'room', dx, dy };
  Sound.door();
}

function beginDescend() {
  if (transition) return;
  transition = { t: 0, dur: 0.7, swapped: false, kind: 'descend' };
  Sound.descend();
}

function descendNow() {
  score += 150 * floorNum;
  floorNum += 1;
  dungeon = generateFloor(floorNum);
  room = dungeon.start;
  room.visited = true;
  room.spawned = true;
  room.cleared = true;
  player.x = 7.5;
  player.y = 4.5;
  player.invuln = 1.4;
  player.hp = Math.min(player.maxHp, player.hp + 1);
  shake = 8;
  addFloat(7.5, 3.2, 'ЭТАЖ ' + floorNum, '#f2d9a4', 0.4);
  toast('Этаж ' + floorNum + ' · ' + floorName(floorNum));
}

function updateTransition(dt) {
  if (!transition) return;
  const tr = transition;
  tr.t += dt;
  if (!tr.swapped && tr.t >= tr.dur * 0.5) {
    tr.swapped = true;
    if (tr.kind === 'descend') {
      descendNow();
    } else {
      const target = dungeon.rooms.get(keyOf(room.x + tr.dx, room.y + tr.dy));
      enterRoom(target, tr.dx, tr.dy);
    }
  }
  if (tr.t >= tr.dur) transition = null;
}

/* ------------------------------------------------------------------ movement */

function resolveRocks(ent) {
  for (const r of room.rocks) {
    let dx = ent.x - r.x;
    let dy = ent.y - r.y;
    let d = Math.hypot(dx, dy);
    const min = ent.r + r.r;
    if (d < min) {
      if (d < 0.0001) {
        dx = 1;
        dy = 0;
        d = 1;
      }
      ent.x += (dx / d) * (min - d);
      ent.y += (dy / d) * (min - d);
    }
  }
}

function clampRoom(ent, allowDoors) {
  const r = ent.r;
  let minX = 1 + r;
  let maxX = 14 - r;
  let minY = 1 + r;
  let maxY = 8 - r;
  if (allowDoors && room.cleared) {
    if (room.doors.left && Math.abs(ent.y - 4.5) < 0.72) minX = 0.5;
    if (room.doors.right && Math.abs(ent.y - 4.5) < 0.72) maxX = 14.5;
    if (room.doors.up && Math.abs(ent.x - 7.5) < 0.72) minY = 0.5;
    if (room.doors.down && Math.abs(ent.x - 7.5) < 0.72) maxY = 8.5;
  }
  ent.x = clamp(ent.x, minX, maxX);
  ent.y = clamp(ent.y, minY, maxY);
}

function moveEntity(ent, dx, dy, allowDoors) {
  ent.x += dx;
  resolveRocks(ent);
  clampRoom(ent, allowDoors);
  ent.y += dy;
  resolveRocks(ent);
  clampRoom(ent, allowDoors);
}

/* ------------------------------------------------------------------ combat */

function shoot(aim) {
  const base = Math.atan2(aim.y, aim.x);
  const n = Math.max(1, Math.round(player.shots));
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * (n > 1 ? player.spread : 0);
    const a = base + off;
    room.tears.push({
      x: player.x + Math.cos(a) * 0.42,
      y: player.y + Math.sin(a) * 0.42,
      vx: Math.cos(a) * player.tearSpeed,
      vy: Math.sin(a) * player.tearSpeed,
      r: player.tearSize,
      damage: player.damage,
      life: player.tearLife,
      maxLife: player.tearLife,
      pierce: player.pierce,
      homing: player.homing,
      hit: new Set()
    });
  }
  player.shootCd = 1 / player.fireRate;
  player.shootAnim = 0.16;
  Sound.shoot();
}

function nearestEnemy(x, y, maxDist) {
  let bestE = null;
  let bestD = maxDist;
  for (const e of room.enemies) {
    if (e.dead || e.spawn > 0) continue;
    const d = dist(x, y, e.x, e.y);
    if (d < bestD) {
      bestD = d;
      bestE = e;
    }
  }
  return bestE;
}

function hurtPlayer(amount = 2) {
  if (!player || player.invuln > 0 || state !== 'playing') return;
  let left = amount;
  if (player.soul > 0) {
    const use = Math.min(player.soul, left);
    player.soul -= use;
    left -= use;
  }
  if (left > 0) player.hp -= left;
  player.invuln = 1.3;
  shake = Math.max(shake, 12);
  flash = Math.max(flash, 0.4);
  Sound.hurt();
  if (navigator.vibrate) navigator.vibrate(35);
  spawnParticles(player.x, player.y, 12, '#c02c40', 2.1, 0.07);
  addDecal(player.x + rand(0.4, -0.4), player.y + rand(0.4, -0.4), rand(0.3, 0.12), '#4a111b');
  if (player.hp <= 0) {
    player.hp = 0;
    die();
  }
}

function damageEnemy(e, amount, dir) {
  if (e.dead) return;
  e.hp -= amount;
  e.hit = 0.12;
  const kx = dir ? dir.x : 0;
  const ky = dir ? dir.y : 0;
  if (e.type !== 'boss') {
    e.vx += kx * 1.3;
    e.vy += ky * 1.3;
  }
  spawnParticles(e.x, e.y, 4, '#9a2b3a', 1.3, 0.05);
  Sound.enemyHit();
  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e) {
  if (e.dead) return;
  e.dead = true;
  kills += 1;
  if (e.type === 'boss') {
    score += 500;
    shake = 22;
    flash = Math.max(flash, 0.35);
    spawnParticles(e.x, e.y, 42, '#8f2036', 3.1, 0.12);
    addDecal(e.x, e.y, 1.3, '#3b0d18');
    Sound.bossDie();
    if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
  } else {
    score += 12 + floorNum * 2;
    spawnParticles(e.x, e.y, e.type === 'charger' ? 14 : 9, '#8f2036', 2, 0.07);
    addDecal(e.x + rand(0.3, -0.3), e.y + rand(0.3, -0.3), rand(0.34, 0.14), '#42101a');
    Sound.kill();
  }

  if (e.type !== 'boss') {
    const roll = Math.random();
    if (roll < 0.12) room.pickups.push(makePickup('heart', e.x, e.y));
    else if (roll < 0.3) room.pickups.push(makePickup('soul', e.x, e.y));
    else if (roll < 0.74) room.pickups.push(makePickup('coin', e.x, e.y));
  }
}

/* ------------------------------------------------------------------ updates */

function updatePlayer(dt) {
  player.invuln = Math.max(0, player.invuln - dt);
  player.shootCd = Math.max(0, player.shootCd - dt);
  player.shootAnim = Math.max(0, player.shootAnim - dt);

  const mv = getMoveVec();
  const mag = Math.hypot(mv.x, mv.y);
  player.moving = mag > 0.05;
  if (player.moving) {
    moveEntity(player, mv.x * player.speed * dt, mv.y * player.speed * dt, true);
    player.walkT += dt * (2.2 + mag * 2.2);
  }

  const aim = getAimVec();
  if (aim) {
    player.face = aim;
    if (player.shootCd <= 0) shoot(aim);
  } else if (player.moving) {
    player.face = norm(mv.x, mv.y);
  }

  checkDoors();
  checkPickups(dt);
  checkItems();
  checkTrapdoor();
}

function checkDoors() {
  if (!room.cleared || transition) return;
  if (room.doors.up && player.y < 0.95 && Math.abs(player.x - 7.5) < 0.8) beginTransition(0, -1);
  else if (room.doors.down && player.y > 8.05 && Math.abs(player.x - 7.5) < 0.8) beginTransition(0, 1);
  else if (room.doors.left && player.x < 0.95 && Math.abs(player.y - 4.5) < 0.8) beginTransition(-1, 0);
  else if (room.doors.right && player.x > 14.05 && Math.abs(player.y - 4.5) < 0.8) beginTransition(1, 0);
}

function checkPickups(dt) {
  for (let i = room.pickups.length - 1; i >= 0; i--) {
    const p = room.pickups[i];
    p.bob += dt * 3;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.exp(-7 * dt);
    p.vy *= Math.exp(-7 * dt);
    p.x = clamp(p.x, 1.4, 13.6);
    p.y = clamp(p.y, 1.4, 7.6);
    if (dist(p.x, p.y, player.x, player.y) < player.r + 0.4) {
      if (p.type === 'coin') {
        player.coins += 1;
        score += 5;
        Sound.coin();
        addFloat(p.x, p.y - 0.3, '+1', '#f0c06a', 0.24);
      } else if (p.type === 'heart') {
        if (player.hp < player.maxHp) {
          player.hp = Math.min(player.maxHp, player.hp + 2);
          Sound.heal();
          addFloat(p.x, p.y - 0.3, '+1 ♥', '#ff7b83', 0.24);
        } else {
          score += 20;
          Sound.coin();
          addFloat(p.x, p.y - 0.3, '+20', '#f0c06a', 0.24);
        }
      } else if (p.type === 'soul') {
        player.soul = Math.min(12, player.soul + 2);
        Sound.soul();
        addFloat(p.x, p.y - 0.3, '+1 душа', '#8fd6ff', 0.24);
      }
      room.pickups.splice(i, 1);
    }
  }
}

function checkItems() {
  for (let i = room.items.length - 1; i >= 0; i--) {
    const it = room.items[i];
    const d = dist(it.x, it.y, player.x, player.y);
    if (d > 1.1) it.warned = false;
    if (d < 0.58) {
      if (it.price > 0 && player.coins < it.price) {
        if (!it.warned) {
          it.warned = true;
          toast('Нужно ' + it.price + ' монет');
          Sound.ui();
        }
        continue;
      }
      if (it.price > 0) player.coins -= it.price;
      it.def.apply(player);
      score += 100;
      Sound.pickup();
      spawnParticles(it.x, it.y, 16, it.def.color, 2, 0.07);
      addFloat(it.x, it.y - 0.7, it.def.name, '#f2d9a4', 0.3);
      toast(it.def.name + ' — ' + it.def.desc);
      room.items.splice(i, 1);
    }
  }
}

function checkTrapdoor() {
  if (!room.trapdoor || transition) return;
  if (dist(room.trapdoor.x, room.trapdoor.y, player.x, player.y) < 0.52) {
    beginDescend();
  }
}

function updateTears(dt) {
  for (let i = room.tears.length - 1; i >= 0; i--) {
    const t = room.tears[i];
    t.life -= dt;
    if (t.life <= 0) {
      room.tears.splice(i, 1);
      continue;
    }
    if (t.homing > 0) {
      const target = nearestEnemy(t.x, t.y, 5);
      if (target) {
        const cur = Math.atan2(t.vy, t.vx);
        const want = Math.atan2(target.y - t.y, target.x - t.x);
        const na = angleLerp(cur, want, clamp(dt * 5 * t.homing, 0, 1));
        const sp = Math.hypot(t.vx, t.vy);
        t.vx = Math.cos(na) * sp;
        t.vy = Math.sin(na) * sp;
      }
    }
    t.x += t.vx * dt;
    t.y += t.vy * dt;

    if (Math.random() < dt * 26) {
      room.particles.push({
        x: t.x, y: t.y,
        vx: rand(0.3, -0.3), vy: rand(0.3, -0.3),
        life: 0.25, maxLife: 0.25,
        r: rand(0.045, 0.015),
        color: 'rgba(150,220,255,0.7)'
      });
    }

    if (t.x < 1 || t.x > 14 || t.y < 1 || t.y > 8) {
      splatTear(t);
      room.tears.splice(i, 1);
      continue;
    }

    let hitRock = false;
    for (const r of room.rocks) {
      if (dist(t.x, t.y, r.x, r.y) < t.r + r.r) {
        hitRock = true;
        break;
      }
    }
    if (hitRock) {
      splatTear(t);
      room.tears.splice(i, 1);
      continue;
    }

    let remove = false;
    for (const e of room.enemies) {
      if (e.dead || e.spawn > 0 || t.hit.has(e.uid)) continue;
      if (dist(t.x, t.y, e.x, e.y) < t.r + e.r) {
        damageEnemy(e, t.damage, { x: t.vx, y: t.vy });
        t.hit.add(e.uid);
        if (t.pierce > 0) {
          t.pierce -= 1;
        } else {
          remove = true;
        }
        break;
      }
    }
    if (remove) {
      splatTear(t);
      room.tears.splice(i, 1);
    }
  }
}

function splatTear(t) {
  spawnParticles(t.x, t.y, 4, '#8fd6ff', 1.1, 0.04);
  addDecal(t.x, t.y, rand(0.2, 0.08), 'rgba(60,120,150,0.4)');
}

function fireEnemyBullet(e, angle, speed) {
  room.projectiles.push({
    x: e.x + Math.cos(angle) * (e.r + 0.12),
    y: e.y + Math.sin(angle) * (e.r + 0.12),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: 0.15,
    life: 4,
    damage: 2
  });
  Sound.tone(300, 0.1, 'square', 0.05, 180);
}

function updateProjectiles(dt) {
  for (let i = room.projectiles.length - 1; i >= 0; i--) {
    const p = room.projectiles[i];
    p.life -= dt;
    if (p.life <= 0) {
      room.projectiles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    let gone = false;
    if (p.x < 1 || p.x > 14 || p.y < 1 || p.y > 8) gone = true;
    if (!gone) {
      for (const r of room.rocks) {
        if (dist(p.x, p.y, r.x, r.y) < p.r + r.r) {
          gone = true;
          break;
        }
      }
    }
    if (!gone && dist(p.x, p.y, player.x, player.y) < p.r + player.r) {
      hurtPlayer(p.damage);
      gone = true;
    }
    if (gone) {
      spawnParticles(p.x, p.y, 3, '#b34a8a', 1.1, 0.04);
      room.projectiles.splice(i, 1);
    }
  }
}

function updateEnemies(dt) {
  for (const e of room.enemies) {
    if (e.dead) continue;
    e.hit = Math.max(0, e.hit - dt);
    e.phase += dt;
    if (e.spawn > 0) {
      e.spawn -= dt;
      continue;
    }
    e.shootCd -= dt;

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx, dy) || 0.001;
    const dir = { x: dx / d, y: dy / d };

    if (e.type === 'fly') {
      const a = Math.atan2(dy, dx) + Math.sin(e.phase * 5 + e.seed) * 0.85;
      const sp = e.speed * (0.72 + 0.28 * Math.sin(e.phase * 3.2 + e.seed));
      e.vx = lerp(e.vx, Math.cos(a) * sp, Math.min(1, dt * 4));
      e.vy = lerp(e.vy, Math.sin(a) * sp, Math.min(1, dt * 4));
    } else if (e.type === 'gaper') {
      const wob = Math.sin(e.phase * 3 + e.seed) * 0.45;
      const a = Math.atan2(dy, dx) + wob;
      e.vx = lerp(e.vx, Math.cos(a) * e.speed, Math.min(1, dt * 3));
      e.vy = lerp(e.vy, Math.sin(a) * e.speed, Math.min(1, dt * 3));
    } else if (e.type === 'spitter') {
      let desired = 0;
      if (d > 4.2) desired = 1;
      else if (d < 2.8) desired = -1;
      if (desired) {
        e.vx = lerp(e.vx, dir.x * e.speed * desired, Math.min(1, dt * 2.2));
        e.vy = lerp(e.vy, dir.y * e.speed * desired, Math.min(1, dt * 2.2));
      } else {
        const side = Math.sin(e.phase * 0.8 + e.seed) > 0 ? 1 : -1;
        e.vx = lerp(e.vx, -dir.y * e.speed * 0.55 * side, Math.min(1, dt * 2));
        e.vy = lerp(e.vy, dir.x * e.speed * 0.55 * side, Math.min(1, dt * 2));
      }
      if (e.shootCd <= 0 && d < 10) {
        e.shootCd = rand(2.6, 1.7);
        const a = Math.atan2(dy, dx) + rand(0.14, -0.14);
        fireEnemyBullet(e, a, 5.4 + Math.min(2, floorNum * 0.1));
      }
    } else if (e.type === 'charger') {
      if (e.state === 'windup') {
        e.windup -= dt;
        e.vx *= Math.exp(-8 * dt);
        e.vy *= Math.exp(-8 * dt);
        if (e.windup <= 0) {
          e.state = 'dash';
          e.dashT = 0.34;
          Sound.tone(180, 0.2, 'sawtooth', 0.09, 70);
        }
      } else if (e.state === 'dash') {
        e.dashT -= dt;
        e.vx = e.dashDir.x * 8.8;
        e.vy = e.dashDir.y * 8.8;
        if (e.dashT <= 0) {
          e.state = 'idle';
          e.shootCd = 1.7;
        }
      } else {
        e.vx = lerp(e.vx, dir.x * e.speed, Math.min(1, dt * 2.4));
        e.vy = lerp(e.vy, dir.y * e.speed, Math.min(1, dt * 2.4));
        if (d < 7.5 && e.shootCd <= 0) {
          e.state = 'windup';
          e.windup = 0.55;
          e.dashDir = { x: dir.x, y: dir.y };
          e.shootCd = 2.6;
          Sound.tone(110, 0.22, 'sawtooth', 0.07, 80);
        }
      }
    } else if (e.type === 'boss') {
      e.attackT -= dt;
      e.summonT -= dt;
      if (d > 3.6) {
        e.vx = lerp(e.vx, dir.x * e.speed, Math.min(1, dt * 1.4));
        e.vy = lerp(e.vy, dir.y * e.speed, Math.min(1, dt * 1.4));
      } else {
        const side = Math.sin(e.phase * 0.7) > 0 ? 1 : -1;
        e.vx = lerp(e.vx, -dir.y * e.speed * 0.6 * side, Math.min(1, dt));
        e.vy = lerp(e.vy, dir.x * e.speed * 0.6 * side, Math.min(1, dt));
      }
      if (e.attackT <= 0) {
        e.attackT = Math.max(1.35, 2.5 - floorNum * 0.06);
        const count = 8 + Math.min(6, floorNum);
        const off = e.phase;
        for (let i = 0; i < count; i++) {
          fireEnemyBullet(e, off + (i * TAU) / count, 4.4 + Math.min(2, floorNum * 0.12));
        }
        Sound.boss();
        shake = Math.max(shake, 5);
      }
      if (e.summonT <= 0 && room.enemies.filter((x) => !x.dead).length < 7) {
        e.summonT = 6.5;
        for (let i = 0; i < 2; i++) {
          const a = rand(TAU);
          spawnEnemy(room, 'fly', clamp(e.x + Math.cos(a) * 1.6, 2, 13), clamp(e.y + Math.sin(a) * 1.6, 2, 7));
        }
        addFloat(e.x, e.y - 1.1, 'ПРИЗЫВ', '#e7bd72', 0.28);
      }
    }

    moveEntity(e, e.vx * dt, e.vy * dt, false);

    if (dist(e.x, e.y, player.x, player.y) < e.r + player.r && player.invuln <= 0) {
      hurtPlayer(2);
    }
  }

  room.enemies = room.enemies.filter((e) => !e.dead);
  separateEnemies();
}

function separateEnemies() {
  const list = room.enemies;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a.spawn > 0) continue;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      if (b.spawn > 0) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let d = Math.hypot(dx, dy);
      const min = a.r + b.r;
      if (d < min) {
        if (d < 0.0001) {
          dx = 1;
          dy = 0;
          d = 1;
        }
        const push = (min - d) * 0.5;
        a.x -= (dx / d) * push;
        a.y -= (dy / d) * push;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
      }
    }
    clampRoom(a, false);
    resolveRocks(a);
  }
}

function updateParticles(dt) {
  for (let i = room.particles.length - 1; i >= 0; i--) {
    const p = room.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      room.particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.exp(-3 * dt);
    p.vy *= Math.exp(-3 * dt);
  }
  for (let i = room.floats.length - 1; i >= 0; i--) {
    const f = room.floats[i];
    f.life -= dt;
    f.y -= dt * 0.55;
    if (f.life <= 0) room.floats.splice(i, 1);
  }
}

function checkRoomClear() {
  if (room.cleared || !room.spawned) return;
  if (room.enemies.some((e) => !e.dead)) return;
  room.cleared = true;
  Sound.clear();

  if (room.type === 'boss') {
    room.items.push(makePedestal(pickItem(), 7.5, 4.8, 0));
    room.trapdoor = { x: 7.5, y: 6.7 };
    room.pickups.push(makePickup('heart', 5.9, 6.7));
    addFloat(7.5, 2.0, 'БОСС ПОВЕРЖЕН', '#f2d9a4', 0.4);
    toast('Босс повержен — забери предмет и спустись в люк');
  } else {
    addFloat(7.5, 2.0, 'КОМНАТА ЗАЧИЩЕНА', '#e7bd72', 0.28);
    const roll = Math.random();
    if (roll < 0.4) room.pickups.push(makePickup('heart', 6.4, 4.5));
    const coins = randi(1, 2);
    for (let i = 0; i < coins; i++) {
      room.pickups.push(makePickup('coin', 8.4 + i * 0.35, 4.5));
    }
  }
  shake = Math.max(shake, 4);
}

function updateRoom(dt) {
  room.t += dt;
  updateTears(dt);
  updateProjectiles(dt);
  updateEnemies(dt);
  updateParticles(dt);
  checkRoomClear();
}

function updateDying(dt) {
  player.deadT += dt;
  updateParticles(dt);
  if (player.deadT > 1.25) showGameover();
}
