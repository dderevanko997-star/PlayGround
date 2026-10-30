'use strict';

/* ------------------------------------------------------------------ primitives */

function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function heartPath(size) {
  ctx.beginPath();
  ctx.moveTo(0, size * 0.36);
  ctx.bezierCurveTo(-size * 0.14, size * 0.12, -size * 0.52, size * 0.08, -size * 0.48, -size * 0.14);
  ctx.bezierCurveTo(-size * 0.45, -size * 0.44, -size * 0.12, -size * 0.48, 0, -size * 0.2);
  ctx.bezierCurveTo(size * 0.12, -size * 0.48, size * 0.45, -size * 0.44, size * 0.48, -size * 0.14);
  ctx.bezierCurveTo(size * 0.52, size * 0.08, size * 0.14, size * 0.12, 0, size * 0.36);
  ctx.closePath();
}

function drawHeartShape(x, y, size, halves, color) {
  ctx.save();
  ctx.translate(x, y);
  heartPath(size);
  ctx.fillStyle = '#2a151c';
  ctx.fill();
  if (halves > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-size, -size, size, size * 2);
    ctx.clip();
    heartPath(size);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }
  if (halves > 1) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -size, size, size * 2);
    ctx.clip();
    heartPath(size);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }
  heartPath(size);
  ctx.strokeStyle = '#0a0609';
  ctx.lineWidth = size * 0.1;
  ctx.stroke();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-size * 0.19, -size * 0.2, size * 0.09, size * 0.055, -0.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawCoinIcon(x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#c58a2e';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f3c75b';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe9a6';
  ctx.beginPath();
  ctx.arc(-r * 0.24, -r * 0.24, r * 0.24, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawItemIcon(def, x, y, scale, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = def.color;
  ctx.globalAlpha = alpha * 0.16;
  ctx.beginPath();
  ctx.arc(0, 0, 0.62, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, -0.34);
  ctx.bezierCurveTo(0.22, -0.08, 0.3, 0.03, 0.21, 0.17);
  ctx.bezierCurveTo(0.12, 0.34, -0.12, 0.34, -0.21, 0.17);
  ctx.bezierCurveTo(-0.3, 0.03, -0.22, -0.08, 0, -0.34);
  ctx.closePath();
  ctx.fillStyle = def.color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 0.045;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(-0.08, -0.04, 0.055, 0.08, -0.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ backdrop */

function drawBackdrop() {
  const g = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.78);
  g.addColorStop(0, '#1b1322');
  g.addColorStop(0.5, '#0e0a14');
  g.addColorStop(1, '#050409');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawDust() {
  ctx.save();
  for (let i = 0; i < 34; i++) {
    const seed = i * 13.37;
    const speed = 3 + (i % 6) * 2.2;
    const x = ((hash2(seed, 1) * W + Math.sin(time * 0.25 + i) * 16) % W + W) % W;
    const y = ((hash2(seed, 2) * H - time * speed) % H + H) % H;
    const a = 0.035 + hash2(seed, 3) * 0.085;
    const r = 0.5 + hash2(seed, 4) * 1.7;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(180,200,255,' + a + ')' : 'rgba(231,189,114,' + a + ')';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawVignette() {
  const g = ctx.createRadialGradient(W * 0.5, H * 0.47, Math.min(W, H) * 0.24, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.72, 'rgba(0,0,0,0.2)');
  g.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/* ------------------------------------------------------------------ room */

function drawFloor(r) {
  ctx.fillStyle = '#08060c';
  ctx.fillRect(0, 0, ROOM_W, ROOM_H);

  for (let ty = 1; ty < 8; ty++) {
    for (let tx = 1; tx < 14; tx++) {
      const h = hash2(r.x * 53 + tx * 7.13, r.y * 71 + ty * 13.7);
      let color;
      if (h < 0.34) color = '#211c27';
      else if (h < 0.68) color = '#26202d';
      else color = '#2b2433';
      ctx.fillStyle = color;
      ctx.fillRect(tx, ty, 1.002, 1.002);

      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(tx, ty, 1, 0.05);
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fillRect(tx, ty + 0.94, 1, 0.06);

      if (h > 0.84) {
        ctx.strokeStyle = 'rgba(0,0,0,0.22)';
        ctx.lineWidth = 0.022;
        ctx.beginPath();
        const cx = tx + 0.2 + hash2(tx, ty) * 0.6;
        ctx.moveTo(cx, ty + 0.15);
        ctx.lineTo(cx + (hash2(ty, tx) - 0.5) * 0.35, ty + 0.5);
        ctx.lineTo(cx + (hash2(tx + 2, ty) - 0.5) * 0.45, ty + 0.86);
        ctx.stroke();
      }
    }
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 0.025;
  ctx.beginPath();
  for (let x = 1; x <= 14; x++) {
    ctx.moveTo(x, 1);
    ctx.lineTo(x, 8);
  }
  for (let y = 1; y <= 8; y++) {
    ctx.moveTo(1, y);
    ctx.lineTo(14, y);
  }
  ctx.stroke();
}

function wallTile(x, y, seed) {
  const h = hash2(seed * 7.3 + x * 3.1, y * 11.7);
  ctx.fillStyle = h < 0.5 ? '#241d2a' : '#2a2230';
  ctx.fillRect(x + 0.02, y + 0.02, 0.96, 0.96);
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  ctx.fillRect(x + 0.06, y + 0.06, 0.88, 0.09);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + 0.06, y + 0.83, 0.88, 0.11);
  if (h > 0.72) {
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 0.02;
    ctx.beginPath();
    ctx.moveTo(x + 0.18, y + 0.16);
    ctx.lineTo(x + 0.4, y + 0.42);
    ctx.lineTo(x + 0.34, y + 0.7);
    ctx.stroke();
  }
}

function drawWalls(r) {
  ctx.fillStyle = '#120e18';
  ctx.fillRect(0, 0, ROOM_W, 1);
  ctx.fillRect(0, 8, ROOM_W, 1);
  ctx.fillRect(0, 0, 1, ROOM_H);
  ctx.fillRect(14, 0, 1, ROOM_H);

  for (let x = 0; x < 15; x++) {
    wallTile(x, 0, r.x * 9 + r.y * 13);
    wallTile(x, 8, r.x * 17 + r.y * 3);
  }
  for (let y = 1; y < 8; y++) {
    wallTile(0, y, r.x * 5 + r.y * 19);
    wallTile(14, y, r.x * 23 + r.y * 7);
  }

  ctx.fillStyle = 'rgba(120,95,135,0.12)';
  ctx.fillRect(1, 0.92, 13, 0.08);
  ctx.fillRect(1, 8, 13, 0.08);
  ctx.fillRect(0.92, 1, 0.08, 7);
  ctx.fillRect(14, 1, 0.08, 7);

  if (r.doors.up) drawDoor('up', r.cleared);
  if (r.doors.down) drawDoor('down', r.cleared);
  if (r.doors.left) drawDoor('left', r.cleared);
  if (r.doors.right) drawDoor('right', r.cleared);

  drawTorch(2.35, 0.48);
  drawTorch(12.65, 0.48);

  ctx.strokeStyle = 'rgba(231,189,114,0.07)';
  ctx.lineWidth = 0.06;
  ctx.strokeRect(0.04, 0.04, ROOM_W - 0.08, ROOM_H - 0.08);
}

function drawTorch(x, y) {
  const flick = 0.85 + Math.sin(time * 13 + x * 4.7) * 0.1 + Math.sin(time * 29 + x) * 0.05;
  const glow = ctx.createRadialGradient(x, y - 0.05, 0.03, x, y - 0.05, 1.15 * flick);
  glow.addColorStop(0, 'rgba(255,180,90,0.24)');
  glow.addColorStop(0.45, 'rgba(255,140,60,0.08)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - 0.05, 1.15 * flick, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#2a1c22';
  ctx.fillRect(x - 0.055, y + 0.12, 0.11, 0.38);
  ctx.fillStyle = '#5d4431';
  ctx.fillRect(x - 0.09, y + 0.09, 0.18, 0.07);

  ctx.fillStyle = '#ff8f3c';
  ctx.beginPath();
  ctx.ellipse(x, y - 0.03, 0.075 * flick, 0.17 * flick, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffdd8a';
  ctx.beginPath();
  ctx.ellipse(x, y - 0.02, 0.035 * flick, 0.09 * flick, 0, 0, TAU);
  ctx.fill();
}

function drawDoor(side, open) {
  const vertical = side === 'up' || side === 'down';
  let x;
  let y;
  let w;
  let h;
  if (side === 'up') {
    x = 6.55; y = 0; w = 1.9; h = 1.05;
  } else if (side === 'down') {
    x = 6.55; y = 7.95; w = 1.9; h = 1.05;
  } else if (side === 'left') {
    x = 0; y = 3.55; w = 1.05; h = 1.9;
  } else {
    x = 13.95; y = 3.55; w = 1.05; h = 1.9;
  }

  ctx.fillStyle = '#060409';
  ctx.fillRect(x, y, w, h);

  if (open) {
    if (vertical) {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, 'rgba(0,0,0,0.8)');
      g.addColorStop(1, 'rgba(231,189,114,0.1)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(231,189,114,0.32)';
      ctx.fillRect(x + 0.08, y + h * 0.62, w - 0.16, 0.05);
    } else {
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.8)');
      g.addColorStop(1, 'rgba(231,189,114,0.1)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(231,189,114,0.32)';
      ctx.fillRect(x + w * 0.62, y + 0.08, 0.05, h - 0.16);
    }
  } else {
    if (vertical) {
      ctx.fillStyle = '#3b2a1f';
      ctx.fillRect(x + 0.13, y + 0.1, w - 0.26, h - 0.2);
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      for (let i = 0; i < 3; i++) ctx.fillRect(x + 0.2 + i * 0.5, y + 0.14, 0.05, h - 0.28);
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(x + 0.15, y + 0.26, w - 0.3, 0.12);
      ctx.fillRect(x + 0.15, y + h - 0.38, w - 0.3, 0.12);
      ctx.fillStyle = '#c79a4d';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 0.11, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#4a3318';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 0.045, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#3b2a1f';
      ctx.fillRect(x + 0.1, y + 0.13, w - 0.2, h - 0.26);
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      for (let i = 0; i < 3; i++) ctx.fillRect(x + 0.14, y + 0.2 + i * 0.5, w - 0.28, 0.05);
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(x + 0.26, y + 0.15, 0.12, h - 0.3);
      ctx.fillRect(x + w - 0.38, y + 0.15, 0.12, h - 0.3);
      ctx.fillStyle = '#c79a4d';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 0.11, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#4a3318';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 0.045, 0, TAU);
      ctx.fill();
    }
  }

  ctx.fillStyle = '#3a3044';
  if (vertical) {
    ctx.fillRect(x - 0.14, y, 0.16, h);
    ctx.fillRect(x + w - 0.02, y, 0.16, h);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x - 0.14, y, 0.16, 0.08);
    ctx.fillRect(x + w - 0.02, y, 0.16, 0.08);
  } else {
    ctx.fillRect(x, y - 0.14, w, 0.16);
    ctx.fillRect(x, y + h - 0.02, w, 0.16);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y - 0.14, 0.08, 0.16);
    ctx.fillRect(x, y + h - 0.02, 0.08, 0.16);
  }
}

function drawDecals(r) {
  for (const d of r.decals) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.globalAlpha = d.a;
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, d.r, d.r * 0.58, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawRocks(r) {
  for (const rock of r.rocks) {
    ctx.save();
    ctx.translate(rock.x, rock.y);
    ctx.fillStyle = 'rgba(0,0,0,0.36)';
    ctx.beginPath();
    ctx.ellipse(0.08, 0.13, rock.r * 1.05, rock.r * 0.62, 0, 0, TAU);
    ctx.fill();

    const n = 8;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const rr = rock.r * (0.78 + hash2(rock.seed + i, i * 2.1) * 0.34);
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr * 0.88;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#463d4c';
    ctx.fill();
    ctx.strokeStyle = '#15101c';
    ctx.lineWidth = 0.05;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-rock.r * 0.42, -rock.r * 0.22);
    ctx.lineTo(-rock.r * 0.12, -rock.r * 0.5);
    ctx.lineTo(rock.r * 0.3, -rock.r * 0.32);
    ctx.strokeStyle = 'rgba(255,255,255,0.13)';
    ctx.lineWidth = 0.06;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(rock.r * 0.16, rock.r * 0.2, rock.r * 0.45, rock.r * 0.2, 0.3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawPedestal(it) {
  const bob = Math.sin(time * 2.1 + it.bob) * 0.05;
  ctx.save();
  ctx.translate(it.x, it.y);
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(0.08, 0.34, 0.5, 0.2, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#3a3042';
  ctx.beginPath();
  ctx.ellipse(0, 0.25, 0.4, 0.18, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#54465f';
  ctx.fillRect(-0.26, 0.1, 0.52, 0.18);
  ctx.fillStyle = '#2a2230';
  ctx.beginPath();
  ctx.ellipse(0, 0.1, 0.26, 0.1, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = 'rgba(231,189,114,0.13)';
  ctx.beginPath();
  ctx.arc(0, -0.16 + bob, 0.52, 0, TAU);
  ctx.fill();

  drawItemIcon(it.def, 0, -0.16 + bob, 0.95);

  if (it.price > 0) {
    ctx.font = '700 0.26px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(8,5,12,0.7)';
    ctx.beginPath();
    ctx.arc(-0.16, 0.66, 0.16, 0, TAU);
    ctx.fill();
    drawCoinIcon(-0.16, 0.66, 0.13);
    ctx.fillStyle = '#f0d49a';
    ctx.fillText(String(it.price), 0.12, 0.67);
  }
  ctx.restore();
}

function drawPickup(p) {
  const bob = Math.sin(p.bob) * 0.05;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 0.22 - bob, 0.18, 0.08, 0, 0, TAU);
  ctx.fill();
  if (p.type === 'coin') {
    drawCoinIcon(0, 0, 0.15);
  } else if (p.type === 'heart') {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#ff5964';
    ctx.beginPath();
    ctx.arc(0, 0, 0.34, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    drawHeartShape(0, 0, 0.4, 2, '#e0484f');
  } else {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#6fc4ff';
    ctx.beginPath();
    ctx.arc(0, 0, 0.34, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    drawHeartShape(0, 0, 0.4, 2, '#59a9e8');
  }
  ctx.restore();
}

function drawTrapdoor(t) {
  ctx.save();
  ctx.translate(t.x, t.y);
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);
  ctx.fillStyle = 'rgba(231,189,114,' + (0.08 + pulse * 0.08) + ')';
  ctx.beginPath();
  ctx.arc(0, 0, 0.62, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#0a060d';
  ctx.beginPath();
  ctx.ellipse(0, 0, 0.46, 0.36, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#5a4630';
  ctx.lineWidth = 0.09;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(231,189,114,0.55)';
  ctx.lineWidth = 0.035;
  ctx.beginPath();
  ctx.moveTo(-0.16, -0.26);
  ctx.lineTo(-0.16, 0.26);
  ctx.moveTo(0.16, -0.26);
  ctx.lineTo(0.16, 0.26);
  ctx.stroke();
  ctx.fillStyle = '#d9a94e';
  ctx.font = '700 0.2px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ВНИЗ', 0, 0.72);
  ctx.restore();
}

function drawTears(r) {
  for (const t of r.tears) {
    const a = clamp(t.life * 3.2, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = 'rgba(150,220,255,0.36)';
    ctx.lineWidth = t.r * 1.15;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(t.x - t.vx * 0.03, t.y - t.vy * 0.03);
    ctx.lineTo(t.x, t.y);
    ctx.stroke();
    ctx.fillStyle = '#bfeaff';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(t.x - t.r * 0.3, t.y - t.r * 0.3, t.r * 0.36, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawProjectiles(r) {
  for (const p of r.projectiles) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life * 2, 0, 1);
    ctx.strokeStyle = 'rgba(190,80,150,0.3)';
    ctx.lineWidth = p.r * 1.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.fillStyle = '#b4518e';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e7a8d1';
    ctx.beginPath();
    ctx.arc(p.x - p.r * 0.28, p.y - p.r * 0.28, p.r * 0.36, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ actors */

function drawPlayer() {
  const p = player;
  if (p.invuln > 0 && state === 'playing' && Math.floor(time * 24) % 2 === 0) return;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 0.34, 0.36, 0.16, 0, 0, TAU);
  ctx.fill();

  const bob = p.moving ? Math.sin(p.walkT * 14) * 0.028 : Math.sin(time * 2.2) * 0.012;
  const step = p.moving ? Math.sin(p.walkT * 14) * 0.07 : 0;
  ctx.save();
  ctx.translate(0, bob);

  ctx.fillStyle = '#211b27';
  ctx.beginPath();
  ctx.ellipse(-0.1, 0.28 + step * 0.4, 0.09, 0.075, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0.1, 0.28 - step * 0.4, 0.09, 0.075, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#4f7a77';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.035;
  ctx.beginPath();
  ctx.ellipse(0, 0.09, 0.245, 0.27, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#efdac2';
  ctx.beginPath();
  ctx.arc(0, -0.15, 0.29, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 0.035;
  ctx.stroke();

  ctx.fillStyle = '#d8bfa8';
  ctx.beginPath();
  ctx.ellipse(-0.25, -0.13, 0.06, 0.085, -0.2, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0.25, -0.13, 0.06, 0.085, 0.2, 0, TAU);
  ctx.fill();

  const fx = p.face.x;
  const fy = p.face.y;
  const ex = fx * 0.055;
  const ey = fy * 0.045;
  ctx.fillStyle = '#181018';
  ctx.beginPath();
  ctx.arc(-0.092 + ex, -0.19 + ey, 0.042, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0.092 + ex, -0.19 + ey, 0.042, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-0.104 + ex, -0.205 + ey, 0.013, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0.08 + ex, -0.205 + ey, 0.013, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = 'rgba(60,30,40,0.55)';
  ctx.lineWidth = 0.025;
  ctx.beginPath();
  ctx.arc(ex * 0.4, -0.04 + ey * 0.4, 0.07, 0.25, Math.PI - 0.25);
  ctx.stroke();

  const tearDrop = p.shootAnim > 0 ? 0.055 : 0.035;
  ctx.fillStyle = '#8fd6ff';
  ctx.beginPath();
  ctx.ellipse(-0.085 + ex, -0.1 + ey, tearDrop * 0.55, tearDrop, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0.085 + ex, -0.1 + ey, tearDrop * 0.55, tearDrop, 0, 0, TAU);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

function drawEnemy(e) {
  const flash = e.hit > 0;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(0, e.r * 0.82, e.r * 1.05, e.r * 0.45, 0, 0, TAU);
  ctx.fill();

  if (e.spawn > 0) {
    const k = 1 - e.spawn / 0.7;
    ctx.globalAlpha = 0.25 + k * 0.45;
    ctx.strokeStyle = e.type === 'boss' ? '#c2435a' : '#b48cff';
    ctx.lineWidth = 0.06;
    ctx.beginPath();
    ctx.arc(0, 0, e.r * (1.7 - k * 0.7), 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = e.type === 'boss' ? '#c2435a' : '#b48cff';
    ctx.beginPath();
    ctx.arc(0, 0, e.r * (1.4 - k * 0.5), 0, TAU);
    ctx.fill();
    ctx.restore();
    return;
  }

  const bob = Math.sin(time * 4 + e.phase) * 0.025;

  if (e.type === 'fly') {
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = 'rgba(190,180,215,0.2)';
    ctx.beginPath();
    ctx.ellipse(-e.r * 0.85, -0.04, e.r * 0.9, e.r * 0.42, -0.55, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(e.r * 0.85, -0.04, e.r * 0.9, e.r * 0.42, 0.55, 0, TAU);
    ctx.fill();
    ctx.fillStyle = flash ? '#fff' : '#17111d';
    ctx.beginPath();
    ctx.arc(0, 0, e.r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.025;
    ctx.stroke();
    ctx.fillStyle = '#e94b52';
    ctx.beginPath();
    ctx.arc(0.02, -0.02, e.r * 0.38, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0.04, -0.04, e.r * 0.13, 0, TAU);
    ctx.fill();
    ctx.restore();
  } else if (e.type === 'gaper') {
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = flash ? '#fff' : '#bfae9f';
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 0.035;
    ctx.beginPath();
    ctx.ellipse(0, 0, e.r, e.r * 1.08, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2a1720';
    ctx.beginPath();
    ctx.ellipse(0, e.r * 0.28, e.r * 0.42, e.r * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f4e6d7';
    ctx.beginPath();
    ctx.arc(-e.r * 0.36, -e.r * 0.28, e.r * 0.17, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e.r * 0.36, -e.r * 0.28, e.r * 0.17, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#181018';
    ctx.beginPath();
    ctx.arc(-e.r * 0.34, -e.r * 0.26, e.r * 0.08, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e.r * 0.38, -e.r * 0.26, e.r * 0.08, 0, TAU);
    ctx.fill();
    ctx.restore();
  } else if (e.type === 'spitter') {
    ctx.save();
    ctx.translate(0, bob);
    const pulse = 1 + Math.sin(time * 5 + e.phase) * 0.04;
    ctx.fillStyle = flash ? '#fff' : '#6b3d75';
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 0.035;
    ctx.beginPath();
    ctx.ellipse(0, 0, e.r * pulse, e.r * 1.04 * pulse, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8a5593';
    ctx.beginPath();
    ctx.ellipse(-e.r * 0.2, -e.r * 0.2, e.r * 0.28, e.r * 0.2, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e8d36a';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc((i - 1) * e.r * 0.38, -e.r * 0.18, e.r * 0.12, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#2a1720';
    ctx.beginPath();
    ctx.ellipse(0, e.r * 0.3, e.r * 0.25, e.r * 0.18, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  } else if (e.type === 'charger') {
    ctx.save();
    ctx.translate(0, bob);
    if (e.state === 'windup') {
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time * 30);
      ctx.fillStyle = '#ff6b78';
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 1.5, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = flash ? '#fff' : '#8f2f35';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.04;
    ctx.beginPath();
    ctx.ellipse(0, 0, e.r, e.r * 0.9, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d8b98a';
    ctx.beginPath();
    ctx.moveTo(-e.r * 0.8, -e.r * 0.5);
    ctx.lineTo(-e.r * 1.15, -e.r * 0.95);
    ctx.lineTo(-e.r * 0.42, -e.r * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.r * 0.8, -e.r * 0.5);
    ctx.lineTo(e.r * 1.15, -e.r * 0.95);
    ctx.lineTo(e.r * 0.42, -e.r * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f0d9c4';
    ctx.beginPath();
    ctx.arc(-e.r * 0.3, -e.r * 0.14, e.r * 0.18, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e.r * 0.3, -e.r * 0.14, e.r * 0.18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1018';
    ctx.beginPath();
    ctx.arc(-e.r * 0.3, -e.r * 0.12, e.r * 0.09, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e.r * 0.3, -e.r * 0.12, e.r * 0.09, 0, TAU);
    ctx.fill();
    ctx.restore();
  } else if (e.type === 'boss') {
    drawBoss(e, bob, flash);
  }

  ctx.restore();
}

function drawBoss(e, bob, flash) {
  const pulse = 1 + Math.sin(time * 2.4) * 0.025;
  ctx.save();
  ctx.translate(0, bob);
  ctx.scale(pulse, pulse);

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, e.r * 0.85, e.r * 1.1, e.r * 0.4, 0, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = flash ? '#fff' : '#5b2438';
  ctx.lineWidth = e.r * 0.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + Math.sin(time * 1.3 + i) * 0.25;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * e.r * 0.55, Math.sin(a) * e.r * 0.55);
    ctx.quadraticCurveTo(
      Math.cos(a + 0.35) * e.r * 0.95,
      Math.sin(a + 0.35) * e.r * 0.95,
      Math.cos(a + 0.1) * e.r * 1.25,
      Math.sin(a + 0.1) * e.r * 1.25
    );
    ctx.stroke();
  }

  ctx.fillStyle = flash ? '#fff' : '#5b2438';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.05;
  ctx.beginPath();
  ctx.arc(0, 0, e.r, 0, TAU);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = flash ? '#fff' : '#7a3049';
  ctx.beginPath();
  ctx.arc(-e.r * 0.22, -e.r * 0.25, e.r * 0.46, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e.r * 0.32, e.r * 0.08, e.r * 0.36, 0, TAU);
  ctx.fill();

  const ang = Math.atan2(player.y - e.y, player.x - e.x);
  ctx.fillStyle = '#f0e3d2';
  ctx.beginPath();
  ctx.ellipse(0, -e.r * 0.22, e.r * 0.36, e.r * 0.3, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#b23045';
  ctx.beginPath();
  ctx.arc(Math.cos(ang) * e.r * 0.12, -e.r * 0.22 + Math.sin(ang) * e.r * 0.1, e.r * 0.14, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1a0e14';
  ctx.beginPath();
  ctx.arc(Math.cos(ang) * e.r * 0.12, -e.r * 0.22 + Math.sin(ang) * e.r * 0.1, e.r * 0.065, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#2a0e18';
  ctx.beginPath();
  ctx.ellipse(0, e.r * 0.38, e.r * 0.42, e.r * 0.24, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e7d4bd';
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * e.r * 0.15;
    ctx.beginPath();
    ctx.moveTo(x - 0.04, e.r * 0.2);
    ctx.lineTo(x + 0.04, e.r * 0.2);
    ctx.lineTo(x, e.r * 0.33);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawParticles(r) {
  for (const p of r.particles) {
    const a = clamp(p.life / p.maxLife, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloats(r) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of r.floats) {
    const a = clamp(f.life / f.maxLife, 0, 1);
    ctx.globalAlpha = a;
    ctx.font = '800 ' + f.size + 'px "Trebuchet MS", sans-serif';
    ctx.lineWidth = 0.045;
    ctx.strokeStyle = 'rgba(5,3,8,0.9)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawRoom(r) {
  ctx.fillStyle = '#0a0710';
  ctx.fillRect(-0.25, -0.25, ROOM_W + 0.5, ROOM_H + 0.5);

  drawFloor(r);
  drawDecals(r);
  drawWalls(r);
  drawRocks(r);

  if (player) {
    const light = ctx.createRadialGradient(player.x, player.y, 0.15, player.x, player.y, 3.3);
    light.addColorStop(0, 'rgba(255,220,170,0.1)');
    light.addColorStop(0.55, 'rgba(255,205,145,0.035)');
    light.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = light;
    ctx.fillRect(1, 1, 13, 7);
  }

  if (r.trapdoor) drawTrapdoor(r.trapdoor);
  for (const it of r.items) drawPedestal(it);
  for (const p of r.pickups) drawPickup(p);
  drawTears(r);
  drawProjectiles(r);

  const actors = r.enemies.filter((e) => !e.dead);
  if (player) actors.push(player);
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) {
    if (a === player) drawPlayer();
    else drawEnemy(a);
  }

  drawParticles(r);
  drawFloats(r);
}

/* ------------------------------------------------------------------ hud */

function drawHUD() {
  if (!player || !room) return;
  const hx = 14 + safe.l;
  const hy = safe.t + 18;
  const heartSize = 19;
  const heartGap = 22;
  let x = hx;
  const redHearts = Math.ceil(player.maxHp / 2);
  for (let i = 0; i < redHearts; i++) {
    const halves = clamp(player.hp - i * 2, 0, 2);
    drawHeartShape(x + heartSize / 2, hy, heartSize, halves, '#e0484f');
    x += heartGap;
  }
  const soulHearts = Math.ceil(player.soul / 2);
  for (let i = 0; i < soulHearts; i++) {
    const halves = clamp(player.soul - i * 2, 0, 2);
    drawHeartShape(x + heartSize / 2, hy, heartSize, halves, '#59a9e8');
    x += heartGap;
  }

  drawCoinIcon(x + 9, hy, 7);
  ctx.font = '700 13px ui-monospace, "SF Mono", Menlo, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f0d49a';
  ctx.fillText(String(player.coins), x + 20, hy + 1);

  ctx.font = '700 9px ui-monospace, "SF Mono", Menlo, monospace';
  ctx.fillStyle = 'rgba(231,189,114,0.8)';
  ctx.fillText('ЭТАЖ ' + floorNum + ' · ' + floorName(floorNum).toUpperCase(), hx, safe.t + 43);
  if (input.tilt.enabled) {
    ctx.fillStyle = 'rgba(126,230,170,0.8)';
    ctx.fillText('НАКЛОН', hx, safe.t + 56);
  }

  drawMinimap();
  drawBossBar();
}

function drawMinimap() {
  if (!dungeon) return;
  const b = dungeon.bounds;
  const cell = 7;
  const gap = 2;
  const cols = b.maxX - b.minX + 1;
  const rows = b.maxY - b.minY + 1;
  const mw = cols * cell + (cols - 1) * gap;
  const mh = rows * cell + (rows - 1) * gap;
  const pad = 6;
  const px = W - safe.r - 12 - (mw + pad * 2);
  const py = safe.t + 58;

  ctx.save();
  ctx.globalAlpha = 0.9;
  roundRect(px, py, mw + pad * 2, mh + pad * 2, 7);
  ctx.fillStyle = 'rgba(10,7,14,0.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(231,189,114,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(231,189,114,0.16)';
  ctx.lineWidth = 1;
  for (const r of dungeon.rooms.values()) {
    if (!r.visited) continue;
    const rx = px + pad + (r.x - b.minX) * (cell + gap);
    const ry = py + pad + (r.y - b.minY) * (cell + gap);
    if (r.doors.right) {
      const nr = dungeon.rooms.get(keyOf(r.x + 1, r.y));
      if (nr && nr.visited) {
        ctx.beginPath();
        ctx.moveTo(rx + cell, ry + cell / 2);
        ctx.lineTo(rx + cell + gap, ry + cell / 2);
        ctx.stroke();
      }
    }
    if (r.doors.down) {
      const nr = dungeon.rooms.get(keyOf(r.x, r.y + 1));
      if (nr && nr.visited) {
        ctx.beginPath();
        ctx.moveTo(rx + cell / 2, ry + cell);
        ctx.lineTo(rx + cell / 2, ry + cell + gap);
        ctx.stroke();
      }
    }
  }

  for (const r of dungeon.rooms.values()) {
    const rx = px + pad + (r.x - b.minX) * (cell + gap);
    const ry = py + pad + (r.y - b.minY) * (cell + gap);
    const current = r === room;
    if (current) {
      ctx.fillStyle = '#e7bd72';
    } else if (r.visited) {
      ctx.fillStyle = '#4a3d55';
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.055)';
    }
    ctx.fillRect(rx, ry, cell, cell);
    if (current) {
      ctx.strokeStyle = '#fff3d1';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx - 0.5, ry - 0.5, cell + 1, cell + 1);
    }
    if (r.visited && r.type !== 'normal' && r.type !== 'start') {
      ctx.fillStyle = r.type === 'boss' ? '#e0484f' : r.type === 'treasure' ? '#f0c06a' : '#7ee6aa';
      ctx.beginPath();
      ctx.arc(rx + cell / 2, ry + cell / 2, 2, 0, TAU);
      ctx.fill();
    }
    if (r.visited && r.type === 'start') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(rx + 3, ry + 3, 1, 1);
    }
  }
  ctx.restore();
}

function drawBossBar() {
  if (!room || room.type !== 'boss') return;
  const boss = room.enemies.find((e) => e.type === 'boss' && !e.dead);
  if (!boss) return;
  const bw = Math.min(300, W * 0.62);
  const bx = (W - bw) / 2;
  const by = H - safe.b - 15;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 9px ui-monospace, "SF Mono", Menlo, monospace';
  ctx.fillStyle = 'rgba(231,189,114,0.85)';
  ctx.fillText('СТРАЖ ПОДВАЛА', W / 2, by - 11);
  roundRect(bx, by, bw, 8, 4);
  ctx.fillStyle = 'rgba(12,8,16,0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(231,189,114,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  const f = clamp(boss.hp / boss.maxHp, 0, 1);
  if (f > 0) {
    roundRect(bx + 1.5, by + 1.5, (bw - 3) * f, 5, 2.5);
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    g.addColorStop(0, '#8f2036');
    g.addColorStop(0.6, '#d84a5c');
    g.addColorStop(1, '#f08a7e');
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.restore();
}

function drawControlDeck() {
  if (!(IS_TOUCH || input.touchSeen) || !player) return;
  if (H <= W * 1.1) return;
  if (state !== 'playing' && state !== 'dying') return;
  const jr = joyLayout.left.r;
  const top = joyLayout.left.y - jr - 32;
  const g = ctx.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, 'rgba(14,10,19,0)');
  g.addColorStop(0.25, 'rgba(16,11,22,0.55)');
  g.addColorStop(1, 'rgba(9,6,13,0.9)');
  ctx.fillStyle = g;
  ctx.fillRect(0, top, W, H - top);
  ctx.strokeStyle = 'rgba(231,189,114,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(18, top + 0.5);
  ctx.lineTo(W - 18, top + 0.5);
  ctx.stroke();
  ctx.font = '700 9px ui-monospace, "SF Mono", Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(231,189,114,0.55)';
  const line = 'УРОН ' + player.damage.toFixed(1) + '  ·  СКОР. ' + player.fireRate.toFixed(1) + '  ·  СЛЁЗЫ ×' + player.shots;
  ctx.fillText(line, W / 2, top + 15);
}

function drawJoysticks() {
  if (!(IS_TOUCH || input.touchSeen)) return;
  if (state !== 'playing' && state !== 'dying') return;

  for (const side of ['move', 'aim']) {
    const stick = input.sticks[side];
    const base = stick ? stick.base : joyLayout[side];
    const r = stick ? stick.r : joyLayout[side].r;
    const active = stick && (stick.vec.x || stick.vec.y);
    const accent = side === 'move' ? 'rgba(196,226,255,' : 'rgba(255,201,226,';

    ctx.save();
    if (!stick) {
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = accent + '0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(base.x, base.y, r, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.beginPath();
      ctx.arc(base.x, base.y, r, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#e9dfd0';
      ctx.beginPath();
      ctx.arc(base.x, base.y, 4, 0, TAU);
      ctx.fill();
      ctx.font = '700 8px ui-monospace, "SF Mono", Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(233,223,208,0.62)';
      ctx.fillText(side === 'move' ? 'ДВИЖЕНИЕ' : 'СЛЁЗЫ', base.x, base.y - r + 15);
    } else {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = accent + '0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(base.x, base.y, r, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = accent + '0.08)';
      ctx.beginPath();
      ctx.arc(base.x, base.y, r, 0, TAU);
      ctx.fill();

      const kx = base.x + stick.vec.x * r;
      const ky = base.y + stick.vec.y * r;
      ctx.globalAlpha = active ? 0.8 : 0.45;
      ctx.fillStyle = accent + '0.32)';
      ctx.beginPath();
      ctx.arc(kx, ky, r * 0.36, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = accent + '0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(kx, ky, r * 0.36, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawFx() {
  if (flash > 0) {
    ctx.fillStyle = 'rgba(160,20,36,' + (flash * 0.38) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  if (player && state !== 'title' && player.hp <= 2 && player.hp > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 5);
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(120,10,20,0)');
    g.addColorStop(1, 'rgba(150,15,30,' + (0.18 + pulse * 0.16) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  if (transition) {
    const half = transition.dur * 0.5;
    let k;
    if (transition.t < half) k = transition.t / half;
    else k = 1 - (transition.t - half) / (transition.dur - half);
    ctx.fillStyle = 'rgba(4,2,7,' + clamp(k, 0, 1) * 0.95 + ')';
    ctx.fillRect(0, 0, W, H);
  }
}

/* ------------------------------------------------------------------ frame */

function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawBackdrop();
  drawDust();

  if (room && player) {
    const cx = roomRect.x + roomRect.w / 2;
    const cy = roomRect.y + roomRect.h / 2;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(roomRect.w, roomRect.h) * 0.8);
    glow.addColorStop(0, 'rgba(96,64,110,0.14)');
    glow.addColorStop(0.6, 'rgba(60,38,74,0.05)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const sx = shake > 0 ? rand(shake, -shake) * 0.5 : 0;
    const sy = shake > 0 ? rand(shake, -shake) * 0.5 : 0;
    ctx.save();
    ctx.translate(roomRect.x + sx, roomRect.y + sy);
    ctx.scale(roomRect.tile, roomRect.tile);
    drawRoom(room);
    ctx.restore();
  }

  drawVignette();

  if (state !== 'title') {
    drawHUD();
    drawControlDeck();
    drawJoysticks();
  }

  drawFx();
}
