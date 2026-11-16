// Lanterndeep — game loop and state machine.
// States: title → playing → draft (between waves) → playing … → over.
// P pauses, R restarts, M mutes, 1/2/3 pick a draft upgrade.
import { CONFIG } from './config.js';
import { makeRandom, seedFromUrl } from './random.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { createWorld, updateWorld, spawnEnemy } from './world.js';
import { createWaveState, startWave, updateWaves, rollDraft, applyUpgrade } from './waves.js';
import { Renderer } from './render.js';
import { shotFromUrl, stageShot, stageDraftShot } from './shots.js';

const canvas = document.getElementById('game');
const sounds = new SoundBank();
const input = new Input(canvas);
const renderer = new Renderer(canvas);
const random = makeRandom(seedFromUrl());

const BEST_KEY = 'lanterndeep-best';
let best = 0;
try { best = Number(window.localStorage.getItem(BEST_KEY)) || 0; } catch { best = 0; }

let world = createWorld(random);
let waves = createWaveState(random);
let state = 'title';
let shotState = null;
let isBest = false;
let lastTime = performance.now();

function saveBest() {
  if (world.score > best) {
    best = world.score;
    isBest = true;
    try { window.localStorage.setItem(BEST_KEY, String(best)); } catch { /* private mode */ }
  }
}

function wireWorldSounds() {
  world.onShoot = () => sounds.shoot();
  world.onHit = () => sounds.hit();
  world.onMote = () => sounds.mote();
  world.onHurt = () => sounds.hurt();
  world.onKill = () => {};
  world.onDeath = () => {
    sounds.gameOver();
    saveBest();
    state = 'over';
  };
}

function startGame() {
  world = createWorld(random);
  waves = createWaveState(random);
  wireWorldSounds();
  isBest = false;
  startWave(world, waves, 1);
  state = 'playing';
}

function startDraft() {
  waves.draft = rollDraft(world);
  state = 'draft';
}

function chooseUpgrade(index) {
  const upgrade = waves.draft?.[index];
  if (!upgrade) return;
  applyUpgrade(world, upgrade);
  sounds.waveClear();
  startWave(world, waves, world.wave + 1);
  state = 'playing';
}

function step(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  // Global keys.
  if (input.wasPressed('m')) sounds.toggleMute();
  if (input.wasPressed('p') && state === 'playing') state = 'paused';
  else if (input.wasPressed('p') && state === 'paused') state = 'playing';
  if (input.wasPressed('r') && (state === 'over' || state === 'paused' || state === 'playing')) startGame();

  if (state === 'title') {
    if (input.wasPressed('enter') || input.mouseDown) {
      sounds.unlock();
      startGame();
    }
    renderer.drawPlay(world, state, dt);
    renderer.drawTitle(world, best);
  } else if (state === 'playing') {
    updateWorld(world, dt, input);
    const waveResult = updateWaves(world, waves, dt);
    if (waveResult === 'cleared') {
      sounds.waveClear();
      startDraft();
    }
    if (world.player.alive) {
      renderer.drawPlay(world, state, dt);
    } else {
      renderer.drawPlay(world, state, dt);
      renderer.drawGameOver(world, best, isBest);
    }
  } else if (state === 'draft') {
    updateWorld(world, dt, { ...input, firing: false, moveX: 0, moveY: 0 });
    renderer.drawPlay(world, state, dt);
    renderer.drawDraft(waves.draft);
    for (let i = 0; i < 3; i += 1) {
      if (input.wasPressed(String(i + 1))) chooseUpgrade(i);
    }
    if (input.mouseDown) {
      const x = input.mouseX;
      const y = input.mouseY;
      if (y >= 250 && y <= 450) {
        const i = Math.floor((x - 230) / 290);
        if (i >= 0 && i < 3) chooseUpgrade(i);
      }
    }
  } else if (state === 'paused') {
    renderer.drawPlay(world, state, dt);
    renderer.drawPaused();
  } else if (state === 'over') {
    if (input.wasPressed('enter') || input.wasPressed(' ') || input.mouseDown) startGame();
    renderer.drawPlay(world, state, dt);
    renderer.drawGameOver(world, best, isBest);
  }

  input.endFrame();
  requestAnimationFrame(step);
}

// Screenshot mode: stage a fixed scene and render one frame, no loop.
const shot = shotFromUrl();
if (shot) {
  wireWorldSounds();
  shotState = shot === 'draft' ? stageDraftShot(world) : stageShot(world, shot);
  state = shotState;
  if (shot === 'start') {
    renderer.drawPlay(world, state, 0.016);
    renderer.drawTitle(world, 1240);
  } else if (shot === 'play') {
    renderer.drawPlay(world, state, 0.016);
  } else if (shot === 'draft') {
    renderer.drawPlay(world, state, 0.016);
    renderer.drawDraft(world.stagedDraft);
  } else {
    renderer.drawPlay(world, state, 0.016);
    renderer.drawGameOver(world, best, true);
  }
  document.title = `Lanterndeep — shot ${shot}`;
} else {
  wireWorldSounds();
  // A quiet reef behind the title screen: ambient shadows drift, and the
  // title state never runs collisions, so they cannot hurt anyone yet.
  spawnEnemy(world, 'eel', 300, 300);
  spawnEnemy(world, 'urchin', 980, 260);
  spawnEnemy(world, 'darter', 880, 520);
  requestAnimationFrame(step);
}
