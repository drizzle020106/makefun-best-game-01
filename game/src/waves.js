// Waves and the between-wave upgrade draft. Each wave deals a bigger
// school of shadows; clearing one opens a choice of three upgrades.
import { CONFIG } from './config.js';
import { pick, shuffle } from './random.js';
import { spawnEnemy, spawnMote } from './world.js';

export function createWaveState(random) {
  return {
    random,
    spawning: false,
    spawnQueue: [],
    spawnTimer: 0,
    waveActive: false,
    draft: null,
  };
}

export function waveSize(wave) {
  return CONFIG.wave.baseCount + CONFIG.wave.perWave * wave;
}

function buildQueue(random, wave) {
  const queue = [];
  const count = waveSize(wave);
  for (let i = 0; i < count; i += 1) {
    const roll = random();
    queue.push(roll < 0.5 ? 'eel' : roll < 0.78 ? 'urchin' : 'darter');
  }
  if (wave % CONFIG.wave.bruteEvery === 0) queue.push('brute');
  return shuffle(random, queue);
}

export function startWave(world, waves, wave) {
  world.wave = wave;
  waves.spawnQueue = buildQueue(waves.random, wave);
  waves.spawnTimer = 0.4;
  waves.spawning = true;
  waves.waveActive = true;
  waves.draft = null;
}

// Deal three different upgrades for the draft screen.
export function rollDraft(world) {
  const pool = shuffle(world.random, CONFIG.upgrades);
  return pool.slice(0, 3);
}

export function applyUpgrade(world, upgrade) {
  upgrade.apply(world.player);
}

function edgeSpawn(random) {
  const side = Math.floor(random() * 4);
  if (side === 0) return { x: -30, y: 120 + random() * 480 };
  if (side === 1) return { x: 1310, y: 120 + random() * 480 };
  if (side === 2) return { x: 80 + random() * 1120, y: 50 };
  return { x: 80 + random() * 1120, y: 690 };
}

// Advance spawning. Returns 'cleared' the frame the last shadow dies.
export function updateWaves(world, waves, dt) {
  if (waves.spawning) {
    waves.spawnTimer -= dt;
    if (waves.spawnTimer <= 0 && waves.spawnQueue.length > 0) {
      const kind = waves.spawnQueue.shift();
      const at = edgeSpawn(waves.random);
      spawnEnemy(world, kind, at.x, at.y);
      waves.spawnTimer = CONFIG.wave.spawnGap;
    }
    if (waves.spawnQueue.length === 0) waves.spawning = false;
  }
  if (waves.waveActive && !waves.spawning && world.enemies.length === 0) {
    waves.waveActive = false;
    if (world.player.alive) {
      for (let i = 0; i < 2; i += 1) {
        spawnMote(world, 300 + waves.random() * 680, 200 + waves.random() * 300);
      }
      return 'cleared';
    }
  }
  return 'playing';
}
