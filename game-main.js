'use strict';

/* ------------------------------------------------------------------ run flow */

function hideOverlays() {
  el.start.classList.add('hidden');
  el.pause.classList.add('hidden');
  el.over.classList.add('hidden');
}

function startRun() {
  Sound.unlock();
  hideOverlays();
  clearPointers();
  transition = null;
  floorNum = 1;
  score = 0;
  kills = 0;
  runTime = 0;
  shake = 0;
  flash = 0;
  uid = 1;
  player = makePlayer();
  dungeon = generateFloor(1);
  room = dungeon.start;
  room.visited = true;
  room.spawned = true;
  room.cleared = true;
  player.x = 7.5;
  player.y = 4.5;
  state = 'playing';
  document.body.classList.add('in-game');
  document.body.classList.toggle('muted', Sound.muted);
  updateTiltUI();
  toast('Этаж 1 · ' + floorName(1));
}

function pauseGame() {
  if (state !== 'playing') return;
  state = 'paused';
  clearPointers();
  el.pauseFloor.textContent = String(floorNum);
  el.pauseKills.textContent = String(kills);
  el.pauseCoins.textContent = String(player ? player.coins : 0);
  el.pauseScore.textContent = fmt(score);
  el.pause.classList.remove('hidden');
  document.body.classList.remove('in-game');
  Sound.ui();
}

function resumeGame() {
  if (state !== 'paused') return;
  state = 'playing';
  el.pause.classList.add('hidden');
  document.body.classList.add('in-game');
  Sound.unlock();
}

function toMenu() {
  state = 'title';
  transition = null;
  clearPointers();
  hideOverlays();
  el.start.classList.remove('hidden');
  document.body.classList.remove('in-game');
  initTitleScene();
  updateBestLine();
  updateTiltUI();
  Sound.ui();
}

function die() {
  if (state !== 'playing') return;
  state = 'dying';
  player.dead = true;
  player.deadT = 0;
  shake = 20;
  flash = 0.6;
  clearPointers();
  document.body.classList.remove('in-game');
  Sound.die();
  if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
  spawnParticles(player.x, player.y, 34, '#b3273a', 2.6, 0.09);
  addDecal(player.x, player.y, 0.75, '#4a111b');
}

function showGameover() {
  state = 'gameover';
  saveBest();
  el.overFloor.textContent = String(floorNum);
  el.overKills.textContent = String(kills);
  el.overCoins.textContent = String(player.coins);
  el.overScore.textContent = fmt(score);
  const m = Math.floor(runTime / 60);
  const s = Math.floor(runTime % 60);
  el.overTime.textContent = m + ':' + String(s).padStart(2, '0');
  el.overBest.textContent = fmt(best.score);
  el.over.classList.remove('hidden');
}

/* ------------------------------------------------------------------ title */

function initTitleScene() {
  dungeon = null;
  room = makeRoom(0, 0, 'start', 0);
  room.visited = true;
  room.spawned = true;
  room.cleared = true;
  room.doors = { up: true, down: false, left: false, right: true };
  room.rocks = [
    { x: 3.1, y: 2.35, r: 0.44, seed: 31 },
    { x: 11.7, y: 2.5, r: 0.38, seed: 77 },
    { x: 12.2, y: 6.7, r: 0.45, seed: 12 },
    { x: 4.15, y: 6.55, r: 0.36, seed: 55 }
  ];
  room.decals = [
    { x: 9.2, y: 5.8, r: 0.45, color: '#42101a', rot: 0.4, a: 0.3 },
    { x: 6.1, y: 3.4, r: 0.28, color: '#42101a', rot: 1.2, a: 0.25 },
    { x: 10.6, y: 3.9, r: 0.2, color: 'rgba(60,120,150,0.4)', rot: 0.2, a: 0.35 }
  ];
  room.items = [makePedestal(ITEMS[5], 11.4, 5.2, 0)];
  player = makePlayer();
  player.x = 5.4;
  player.y = 5.6;
  player.face = { x: 0.7, y: -0.7 };
  player.moving = true;
}

function updateTitle(dt) {
  if (!room || !player) return;
  room.t += dt;
  player.walkT += dt * 1.4;
  const a = time * 0.55;
  player.x = 7.5 + Math.cos(a) * 2.1;
  player.y = 4.5 + Math.sin(a * 1.3) * 1.25;
  player.face = { x: Math.cos(a + 1.57), y: Math.sin(a + 1.57) };

  updateParticles(dt);

  if (Math.random() < dt * 6) {
    const life = rand(4.5, 2);
    room.particles.push({
      x: rand(14, 1),
      y: rand(8, 1),
      vx: rand(0.08, -0.08),
      vy: rand(-0.03, -0.14),
      life,
      maxLife: life,
      r: rand(0.03, 0.012),
      color: 'rgba(231,189,114,0.55)'
    });
  }
}

/* ------------------------------------------------------------------ loop */

function update(dt) {
  time += dt;
  shake = Math.max(0, shake - dt * 42);
  flash = Math.max(0, flash - dt * 1.7);

  if (state === 'title') {
    updateTitle(dt);
    return;
  }
  if (state === 'paused' || state === 'gameover') return;
  if (state === 'dying') {
    updateDying(dt);
    return;
  }
  if (state === 'playing') {
    if (transition) {
      updateTransition(dt);
      return;
    }
    runTime += dt;
    updatePlayer(dt);
    updateRoom(dt);
  }
}

function loop(ts) {
  requestAnimationFrame(loop);
  const now = ts / 1000;
  let dt = now - last;
  last = now;
  if (!Number.isFinite(dt) || dt <= 0) dt = 1 / 60;
  dt = Math.min(dt, 0.1);
  update(dt);
  render();
}

/* ------------------------------------------------------------------ wiring */

el.startBtn.addEventListener('click', () => {
  Sound.unlock();
  startRun();
});
el.resumeBtn.addEventListener('click', () => {
  Sound.unlock();
  resumeGame();
});
el.restartBtn.addEventListener('click', () => {
  Sound.unlock();
  startRun();
});
el.menuBtn.addEventListener('click', () => {
  Sound.unlock();
  toMenu();
});
el.againBtn.addEventListener('click', () => {
  Sound.unlock();
  startRun();
});
el.overMenuBtn.addEventListener('click', () => {
  Sound.unlock();
  toMenu();
});
el.pauseBtn.addEventListener('click', () => {
  Sound.unlock();
  pauseGame();
});
el.muteBtn.addEventListener('click', () => {
  Sound.unlock();
  Sound.setMuted(!Sound.muted);
  toast(Sound.muted ? 'Звук выключен' : 'Звук включён', 1200);
});
el.tiltToggle.addEventListener('click', () => {
  toggleTilt();
});
el.pauseTiltToggle.addEventListener('click', () => {
  toggleTilt();
});
el.calibrateBtn.addEventListener('click', () => {
  Sound.unlock();
  calibrateTilt();
});
el.soundToggle.addEventListener('click', () => {
  Sound.unlock();
  Sound.setMuted(!Sound.muted);
  toast(Sound.muted ? 'Звук выключен' : 'Звук включён', 1200);
});

function boot() {
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      resize();
      if (input.tilt.enabled) {
        input.tilt.base = null;
        input.tilt.vec = { x: 0, y: 0 };
      }
    }, 260);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resize);
  }

  Sound.setMuted(Sound.muted);
  updateBestLine();
  initTitleScene();
  updateTiltUI();
  last = performance.now() / 1000;
  requestAnimationFrame(loop);
}

boot();
