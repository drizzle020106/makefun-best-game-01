// Deterministic screenshot states: ?shot=start|play|end&seed=1 stages a
// fixed scene so every screenshot is a real render of the game's code.
import { CONFIG } from './config.js';
import { spawnEnemy, spawnMote } from './world.js';
import { rollDraft } from './waves.js';

export function shotFromUrl() {
  const shot = new URLSearchParams(window.location.search).get('shot');
  return shot === 'start' || shot === 'play' || shot === 'draft' || shot === 'end' ? shot : null;
}

// Stage the world for a screenshot. Returns the state to render.
export function stageShot(world, shot) {
  const p = world.player;
  if (shot === 'start') {
    p.x = 640; p.y = 420;
    world.score = 0;
    world.wave = 1;
    spawnEnemy(world, 'eel', 300, 300);
    spawnEnemy(world, 'urchin', 980, 260);
    spawnEnemy(world, 'darter', 880, 520);
    spawnMote(world, 520, 330);
    spawnMote(world, 760, 300);
    spawnMote(world, 700, 500);
    return 'title';
  }
  if (shot === 'play') {
    const staged = CONFIG.shots.play;
    p.x = 560; p.y = 380;
    p.angle = -0.4;
    world.score = staged.score;
    world.wave = staged.wave;
    world.kills = 11;
    world.motesCollected = staged.motes;
    const spots = [
      ['eel', 820, 300], ['eel', 900, 430], ['eel', 760, 210], ['eel', 1010, 330],
      ['urchin', 700, 180], ['urchin', 1050, 520],
      ['darter', 950, 180], ['darter', 620, 540],
    ];
    for (const [kind, x, y] of spots) spawnEnemy(world, kind, x, y);
    world.bolts.push(
      { x: 640, y: 360, vx: 620, vy: -120, radius: 5, damage: 1, pierce: 0, angle: -0.2, life: 1 },
      { x: 700, y: 340, vx: 620, vy: -120, radius: 5, damage: 1, pierce: 0, angle: -0.2, life: 1 },
    );
    spawnMote(world, 480, 300);
    spawnMote(world, 430, 470);
    spawnMote(world, 850, 560);
    return 'playing';
  }
  // end
  const staged = CONFIG.shots.end;
  p.alive = false;
  p.hull = 0;
  world.score = staged.score;
  world.wave = staged.wave;
  world.kills = 19;
  world.motesCollected = 14;
  return 'over';
}

// Draft shot: reuse the play scene, then deal the upgrade draft.
export function stageDraftShot(world) {
  stageShot(world, 'play');
  world.stagedDraft = rollDraft(world);
  return 'draft';
}
