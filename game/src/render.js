// Everything the eye sees: the reef, the lantern light, the fish, the
// shadows, the HUD and every menu screen. Canvas 2D only, no images.
import { CONFIG } from './config.js';

const PALETTE = {
  deep: '#07222f',
  water: '#0e3d50',
  reef: '#0d3a2e',
  coral: '#ff7a59',
  sand: '#c9a86a',
  glow: '#ffd76a',
  ink: '#eaf6ff',
  dim: '#9fc3d4',
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reefSeed = [];
    let s = 12345;
    const next = () => {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
    for (let i = 0; i < 26; i += 1) {
      this.reefSeed.push({
        x: next() * 1280, h: 40 + next() * 90, w: 30 + next() * 60,
        coral: next() < 0.45,
      });
    }
    this.bubbles = [];
    for (let i = 0; i < 24; i += 1) {
      this.bubbles.push({ x: next() * 1280, y: next() * 720, r: 1 + next() * 3, v: 12 + next() * 22 });
    }
  }

  clear() {
    const { ctx } = this;
    ctx.save();
    ctx.clearRect(0, 0, 1280, 720);
    const grad = ctx.createLinearGradient(0, 0, 0, 720);
    grad.addColorStop(0, PALETTE.water);
    grad.addColorStop(1, PALETTE.deep);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();
  }

  drawReef(world, dt) {
    const { ctx } = this;
    // Sandy floor and rocky ceiling.
    ctx.fillStyle = '#0d332b';
    ctx.fillRect(0, 668, 1280, 52);
    ctx.fillStyle = '#17493d';
    ctx.fillRect(0, 0, 1280, 18);
    ctx.fillStyle = PALETTE.sand;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, 668, 1280, 3);
    ctx.globalAlpha = 1;
    // Coral silhouettes along the floor.
    for (const c of this.reefSeed) {
      ctx.fillStyle = c.coral ? '#17493d' : '#123d33';
      ctx.beginPath();
      ctx.moveTo(c.x - c.w / 2, 668);
      ctx.lineTo(c.x - c.w / 4, 668 - c.h);
      ctx.lineTo(c.x, 668 - c.h * 0.7);
      ctx.lineTo(c.x + c.w / 4, 668 - c.h);
      ctx.lineTo(c.x + c.w / 2, 668);
      ctx.closePath();
      ctx.fill();
      if (c.coral) {
        ctx.fillStyle = PALETTE.coral;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(c.x, 668 - c.h, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    // Rising bubbles.
    ctx.fillStyle = '#bfe6f2';
    for (const b of this.bubbles) {
      b.y -= b.v * dt;
      if (b.y < 70) { b.y = 660; b.x = Math.random() * 1280; }
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawMotes(world) {
    const { ctx } = this;
    for (const m of world.motes) {
      const pulse = 1 + Math.sin(m.t * 4) * 0.2;
      ctx.save();
      ctx.shadowColor = PALETTE.glow;
      ctx.shadowBlur = 14;
      ctx.fillStyle = PALETTE.glow;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawEnemies(world) {
    const { ctx } = this;
    for (const e of world.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      if (e.flash > 0) ctx.globalAlpha = 0.6;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 24;
      ctx.fillStyle = e.color;
      if (e.kind === 'eel') {
        // A long shadow eel with a waving tail.
        ctx.beginPath();
        ctx.ellipse(0, 0, e.radius + 10, e.radius * 0.55, Math.sin(e.t * 3) * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a1650';
        ctx.beginPath();
        ctx.arc(e.radius * 0.55, -2, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.kind === 'urchin') {
        ctx.beginPath();
        for (let i = 0; i < 10; i += 1) {
          const a = (i / 10) * Math.PI * 2 + e.t * 0.5;
          ctx.moveTo(Math.cos(a) * e.radius * 0.4, Math.sin(a) * e.radius * 0.4);
          ctx.lineTo(Math.cos(a) * (e.radius + 9), Math.sin(a) * (e.radius + 9));
        }
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.kind === 'darter') {
        ctx.rotate(e.charging ? Math.atan2(e.chargeVy, e.chargeVx) : Math.sin(e.t * 2) * 0.3);
        ctx.beginPath();
        ctx.moveTo(e.radius + 8, 0);
        ctx.lineTo(-e.radius, -e.radius * 0.7);
        ctx.lineTo(-e.radius * 0.5, 0);
        ctx.lineTo(-e.radius, e.radius * 0.7);
        ctx.closePath();
        ctx.fill();
      } else {
        // Brute: a big spiked shadow.
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffb3ab';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 0.62, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Hull pips over tough shadows.
      if (e.maxHull > 1) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.85;
        for (let i = 0; i < e.hull; i += 1) {
          ctx.fillRect(-e.maxHull * 5 + i * 10, -e.radius - 16, 7, 4);
        }
      }
      ctx.restore();
    }
  }

  drawBolts(world) {
    const { ctx } = this;
    for (const b of world.bolts) {
      ctx.save();
      ctx.shadowColor = PALETTE.glow;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#fff3c4';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x - Math.cos(b.angle) * 16, b.y - Math.sin(b.angle) * 16);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawPlayer(world) {
    const { ctx } = this;
    const p = world.player;
    if (!p.alive) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.invulnerable > 0 && Math.floor(p.invulnerable * 12) % 2 === 0) ctx.globalAlpha = 0.45;
    ctx.rotate(p.angle);
    ctx.shadowColor = PALETTE.glow;
    ctx.shadowBlur = 24;
    // Lantern-fish: body, tail fin, glowing lure.
    ctx.fillStyle = '#ffcf4d';
    ctx.beginPath();
    ctx.ellipse(0, 0, p.radius + 6, p.radius * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff9d2e';
    ctx.beginPath();
    ctx.moveTo(-p.radius - 2, 0);
    ctx.lineTo(-p.radius - 16, -11);
    ctx.lineTo(-p.radius - 16, 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath();
    ctx.arc(p.radius * 0.45, -4, 3.5, 0, Math.PI * 2);
    ctx.arc(p.radius * 0.45, 4, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a4d00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, -p.radius * 0.55);
    ctx.quadraticCurveTo(14, -p.radius * 1.15, 22, -p.radius * 0.9);
    ctx.stroke();
    ctx.fillStyle = '#fffbe8';
    ctx.beginPath();
    ctx.arc(22, -p.radius * 0.9, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawParticles(world) {
    const { ctx } = this;
    for (const pt of world.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const f of world.floaters) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  // Darkness everywhere except the lantern's circle of light. The dark
  // is deliberately light (0.55): shadows outside the lantern must stay
  // visible, or the screenshots read as an empty black screen.
  drawDarkness(world) {
    const { ctx } = this;
    const p = world.player;
    if (!p.alive) return;
    ctx.save();
    ctx.fillStyle = 'rgba(2, 10, 18, 0.55)';
    ctx.beginPath();
    ctx.rect(0, 0, 1280, 720);
    const hole = ctx.createRadialGradient(p.x, p.y, p.lightRadius * 0.45, p.x, p.y, p.lightRadius);
    hole.addColorStop(0, 'rgba(2, 10, 18, 0)');
    hole.addColorStop(1, 'rgba(2, 10, 18, 0.55)');
    ctx.fillStyle = hole;
    ctx.fill();
    ctx.restore();
  }

  drawHud(world, state) {
    const { ctx } = this;
    const p = world.player;
    ctx.save();
    ctx.fillStyle = 'rgba(3, 18, 28, 0.72)';
    ctx.fillRect(0, 0, 1280, 52);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${world.score}`, 20, 36);
    ctx.fillText(`WAVE ${Math.max(1, world.wave)}`, 300, 36);
    ctx.fillText(`KILLS ${world.kills}`, 470, 36);
    // Hull hearts.
    for (let i = 0; i < p.maxHull; i += 1) {
      ctx.fillStyle = i < p.hull ? '#ff5c7a' : 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      const hx = 700 + i * 34;
      const hy = 26;
      ctx.moveTo(hx, hy + 8);
      ctx.bezierCurveTo(hx - 12, hy - 6, hx - 4, hy - 14, hx, hy - 5);
      ctx.bezierCurveTo(hx + 4, hy - 14, hx + 12, hy - 6, hx, hy + 8);
      ctx.fill();
    }
    // Light meter.
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(960, 20, 180, 12);
    ctx.fillStyle = PALETTE.glow;
    ctx.fillRect(960, 20, 180 * (p.lightRadius / CONFIG.player.maxLightRadius), 12);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('LIGHT', 960, 48);
    ctx.textAlign = 'right';
    ctx.fillText(state === 'playing' ? 'M mute · P pause' : '', 1260, 36);
    ctx.restore();
  }

  panel(x, y, w, h) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(3, 20, 30, 0.88)';
    ctx.strokeStyle = 'rgba(255, 215, 106, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 18);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawTitle(world, best) {
    const { ctx } = this;
    this.panel(290, 120, 700, 470);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.glow;
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.fillText('LANTERNDEEP', 640, 210);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '28px system-ui, sans-serif';
    ctx.fillText('Keep the light alive in the dark reef', 640, 258);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('WASD / arrows — swim      Mouse — aim      Hold click / Space — fire', 640, 320);
    ctx.fillText('Catch light motes to grow your lantern. Shadows fear the light.', 640, 352);
    ctx.fillText('Clear each wave, then pick a lantern upgrade. Survive as long as you can.', 640, 384);
    ctx.fillStyle = PALETTE.glow;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('▶  Click or press Enter to dive in', 640, 452);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '19px system-ui, sans-serif';
    if (best > 0) ctx.fillText(`Best dive: ${best}`, 640, 500);
    ctx.fillText('1–3 pick an upgrade between waves · M mute · P pause · R restart', 640, 540);
    ctx.restore();
  }

  drawDraft(draft) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(2, 10, 18, 0.55)';
    ctx.fillRect(0, 0, 1280, 720);
    this.panel(140, 150, 1000, 380);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.glow;
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText('WAVE CLEARED — CHOOSE A LANTERN UPGRADE', 640, 215);
    draft.forEach((u, i) => {
      const x = 230 + i * 290;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 215, 106, 0.12)';
      ctx.strokeStyle = 'rgba(255, 215, 106, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, 250, 250, 200, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(u.name, x + 125, 310);
      ctx.fillStyle = PALETTE.dim;
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText(u.desc, x + 125, 350);
      ctx.fillStyle = PALETTE.glow;
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText(`Press ${i + 1} or click`, x + 125, 410);
      ctx.restore();
    });
    ctx.restore();
  }

  drawPaused() {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(2, 10, 18, 0.6)';
    ctx.fillRect(0, 0, 1280, 720);
    this.panel(440, 260, 400, 180);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText('PAUSED', 640, 330);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Press P to keep diving', 640, 380);
    ctx.restore();
  }

  drawGameOver(world, best, isBest) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(2, 8, 14, 0.62)';
    ctx.fillRect(0, 0, 1280, 720);
    this.panel(340, 130, 600, 440);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8a7a';
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.fillText('THE LIGHT FADES', 640, 215);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(`Score  ${world.score}`, 640, 285);
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText(`Reached wave ${world.wave}  ·  ${world.kills} shadows banished`, 640, 330);
    ctx.fillText(`Light motes gathered: ${world.motesCollected}`, 640, 368);
    if (isBest) {
      ctx.fillStyle = PALETTE.glow;
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText('★ New best dive! ★', 640, 414);
    } else {
      ctx.fillStyle = PALETTE.dim;
      ctx.font = '20px system-ui, sans-serif';
      ctx.fillText(`Best dive: ${best}`, 640, 414);
    }
    ctx.fillStyle = PALETTE.glow;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('↻  Press R or click to dive again', 640, 490);
    ctx.restore();
  }

  // One full frame for a play state.
  drawPlay(world, state, dt) {
    this.clear();
    this.drawReef(world, dt);
    this.drawMotes(world);
    this.drawEnemies(world);
    this.drawBolts(world);
    this.drawPlayer(world);
    this.drawParticles(world);
    this.drawDarkness(world);
    this.drawHud(world, state);
  }
}
