// The reef itself: the player, the shadows, the bolts, the motes and
// the particles. Pure state and updates; render.js draws all of it.
import { CONFIG } from './config.js';

export function createPlayer() {
  const p = CONFIG.player;
  return {
    x: 640, y: 400, vx: 0, vy: 0, radius: p.radius,
    angle: 0, hull: p.hull, maxHull: p.maxHull,
    speed: p.speed, fireInterval: p.fireInterval, fireTimer: 0,
    boltSpeed: p.boltSpeed, boltDamage: p.boltDamage,
    lightRadius: p.lightRadius, bolts: 1, pierce: 0,
    magnetRadius: CONFIG.mote.magnetRadius,
    invulnerable: 0, alive: true,
  };
}

export function createWorld(random) {
  return {
    random,
    player: createPlayer(),
    enemies: [],
    bolts: [],
    motes: [],
    particles: [],
    floaters: [],
    score: 0,
    wave: 0,
    kills: 0,
    motesCollected: 0,
    time: 0,
    shake: 0,
  };
}

export function spawnEnemy(world, kind, x, y) {
  const def = CONFIG.enemies[kind];
  const enemy = {
    kind, x, y, radius: def.radius, hull: def.hull, maxHull: def.hull,
    speed: def.speed, score: def.score, touch: def.touch,
    color: def.color, t: world.random() * Math.PI * 2,
    phase: world.random() * Math.PI * 2,
    chargeTimer: 1 + world.random() * 1.5, charging: false,
    flash: 0,
  };
  world.enemies.push(enemy);
  return enemy;
}

export function spawnMote(world, x, y) {
  world.motes.push({
    x, y, radius: CONFIG.mote.radius,
    t: world.random() * Math.PI * 2, vx: (world.random() - 0.5) * 40,
    vy: -20 - world.random() * 30,
  });
}

export function burst(world, x, y, color, count, speed = 160) {
  for (let i = 0; i < count; i += 1) {
    const angle = world.random() * Math.PI * 2;
    const v = speed * (0.4 + world.random() * 0.8);
    world.particles.push({
      x, y, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v,
      life: 0.5 + world.random() * 0.4, maxLife: 0.9, color,
      radius: 2 + world.random() * 3,
    });
  }
}

export function addFloater(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color, life: 1 });
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Fire bolts toward the mouse. Returns true when a volley left the lantern.
export function fireBolts(world) {
  const p = world.player;
  if (p.fireTimer > 0 || !p.alive) return false;
  p.fireTimer = p.fireInterval;
  const base = Math.atan2(world.aimY - p.y, world.aimX - p.x);
  const spread = 0.14;
  for (let i = 0; i < p.bolts; i += 1) {
    const offset = (i - (p.bolts - 1) / 2) * spread;
    const angle = base + offset;
    world.bolts.push({
      x: p.x + Math.cos(angle) * (p.radius + 6),
      y: p.y + Math.sin(angle) * (p.radius + 6),
      vx: Math.cos(angle) * p.boltSpeed,
      vy: Math.sin(angle) * p.boltSpeed,
      radius: 5, damage: p.boltDamage, pierce: p.pierce, angle,
      life: 1.2,
    });
  }
  return true;
}

function updatePlayer(world, dt, input) {
  const p = world.player;
  if (!p.alive) return;
  const mx = input.moveX;
  const my = input.moveY;
  const len = Math.hypot(mx, my) || 1;
  p.vx = (mx / len) * p.speed * (mx || my ? 1 : 0);
  p.vy = (my / len) * p.speed * (mx || my ? 1 : 0);
  p.x = Math.max(p.radius + 8, Math.min(1280 - p.radius - 8, p.x + p.vx * dt));
  p.y = Math.max(72 + p.radius, Math.min(660 - p.radius, p.y + p.vy * dt));
  p.angle = Math.atan2(world.aimY - p.y, world.aimX - p.x);
  p.fireTimer = Math.max(0, p.fireTimer - dt);
  p.invulnerable = Math.max(0, p.invulnerable - dt);
  if (input.firing && fireBolts(world)) world.onShoot?.();
}

function updateEnemies(world, dt) {
  const p = world.player;
  for (const e of world.enemies) {
    e.t += dt;
    e.flash = Math.max(0, e.flash - dt);
    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (e.kind === 'eel') {
      // Shadow eels weave side to side as they close in.
      const wobble = Math.sin(e.t * 3 + e.phase) * 70;
      e.x += (dx / dist) * e.speed * dt + Math.cos(e.t * 3 + e.phase) * wobble * dt * 0.4;
      e.y += (dy / dist) * e.speed * dt;
    } else if (e.kind === 'urchin') {
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt + Math.sin(e.t * 2 + e.phase) * 12 * dt;
    } else if (e.kind === 'darter') {
      // Darters hover, then charge in a straight line.
      e.chargeTimer -= dt;
      if (e.chargeTimer <= 0 && !e.charging) {
        e.charging = true;
        e.chargeVx = (dx / dist) * 420;
        e.chargeVy = (dy / dist) * 420;
        e.chargeTimer = 0.55;
      }
      if (e.charging) {
        e.x += e.chargeVx * dt;
        e.y += e.chargeVy * dt;
        if (e.chargeTimer <= 0) { e.charging = false; e.chargeTimer = 1.2 + world.random(); }
      } else {
        e.x += (dx / dist) * e.speed * 0.4 * dt;
        e.y += (dy / dist) * e.speed * 0.4 * dt;
      }
    } else {
      // Brutes drift slowly and soak up bolts.
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt;
    }
    e.x = Math.max(e.radius, Math.min(1280 - e.radius, e.x));
    e.y = Math.max(72 + e.radius, Math.min(660 - e.radius, e.y));
  }
}

function updateBolts(world, dt) {
  for (const b of world.bolts) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }
  world.bolts = world.bolts.filter(
    (b) => b.life > 0 && b.x > -20 && b.x < 1300 && b.y > 40 && b.y < 700,
  );
}

function updateMotes(world, dt) {
  const p = world.player;
  for (const m of world.motes) {
    m.t += dt;
    const dx = p.x - m.x;
    const dy = p.y - m.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (p.alive && dist < p.magnetRadius) {
      m.x += (dx / dist) * 320 * dt;
      m.y += (dy / dist) * 320 * dt;
    } else {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.vx *= 0.98;
      m.vy = m.vy * 0.98 + 12 * dt;
    }
    m.y = Math.min(656, m.y);
  }
}

function collide(world) {
  const p = world.player;
  // Bolts against shadows.
  for (const b of world.bolts) {
    for (const e of world.enemies) {
      if (e.hull <= 0) continue;
      if (distance(b, e) < b.radius + e.radius) {
        e.hull -= b.damage;
        e.flash = 0.12;
        burst(world, b.x, b.y, '#ffe9a8', 4, 120);
        world.onHit?.();
        if (e.hull <= 0) {
          world.score += e.score;
          world.kills += 1;
          addFloater(world, e.x, e.y, `+${e.score}`, '#ffe9a8');
          burst(world, e.x, e.y, e.color, 16);
          if (world.random() < 0.45) spawnMote(world, e.x, e.y);
          world.onKill?.(e);
        }
        if (b.pierce > 0) { b.pierce -= 1; } else { b.life = 0; }
        break;
      }
    }
  }
  world.enemies = world.enemies.filter((e) => e.hull > 0);
  // Motes against the lantern.
  if (p.alive) {
    for (const m of world.motes) {
      if (distance(m, p) < m.radius + p.radius + 6) {
        m.taken = true;
        world.score += CONFIG.mote.score;
        world.motesCollected += 1;
        p.lightRadius = Math.min(CONFIG.player.maxLightRadius,
          p.lightRadius + CONFIG.mote.lightGain);
        burst(world, m.x, m.y, '#ffd76a', 6, 100);
        world.onMote?.();
      }
    }
    world.motes = world.motes.filter((m) => !m.taken);
    // Shadows against the hull.
    if (p.invulnerable <= 0) {
      for (const e of world.enemies) {
        if (distance(e, p) < e.radius + p.radius - 2) {
          p.hull -= e.touch;
          p.invulnerable = CONFIG.player.invulnerableSeconds;
          world.shake = 0.35;
          burst(world, p.x, p.y, '#ff6b6b', 18);
          e.hull -= 1;
          world.onHurt?.();
          if (p.hull <= 0) {
            p.alive = false;
            burst(world, p.x, p.y, '#ffd76a', 40, 260);
            world.onDeath?.();
          }
          break;
        }
      }
      world.enemies = world.enemies.filter((e) => e.hull > 0);
    }
  }
}

function updateParticles(world, dt) {
  for (const pt of world.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.96;
    pt.vy *= 0.96;
    pt.life -= dt;
  }
  world.particles = world.particles.filter((pt) => pt.life > 0);
  for (const f of world.floaters) {
    f.y -= 34 * dt;
    f.life -= dt;
  }
  world.floaters = world.floaters.filter((f) => f.life > 0);
  world.shake = Math.max(0, world.shake - dt);
}

// Advance the whole reef one frame. `input` supplies movement and fire.
export function updateWorld(world, dt, input) {
  world.time += dt;
  world.aimX = input.mouseX;
  world.aimY = input.mouseY;
  updatePlayer(world, dt, input);
  updateEnemies(world, dt);
  updateBolts(world, dt);
  updateMotes(world, dt);
  collide(world);
  updateParticles(world, dt);
}
