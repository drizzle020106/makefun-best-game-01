// Lanterndeep — tuning constants. One place for every number the
// designers tune, so balance changes never touch game logic.
export const CONFIG = {
  width: 1280,
  height: 720,
  // The playfield is the whole canvas; the reef floor and ceiling frame it.
  floorY: 668,
  ceilingY: 64,
  player: {
    radius: 16,
    speed: 300,
    hull: 3,
    maxHull: 5,
    fireInterval: 0.22,
    boltSpeed: 620,
    boltDamage: 1,
    lightRadius: 200,
    maxLightRadius: 340,
    invulnerableSeconds: 1.2,
  },
  // Light motes feed the lantern: each one widens the light and adds score.
  mote: { radius: 7, score: 25, lightGain: 6, magnetRadius: 90 },
  enemies: {
    eel:    { radius: 15, speed: 95,  hull: 1, score: 100, touch: 1, color: '#7b5cff' },
    urchin: { radius: 19, speed: 55,  hull: 3, score: 150, touch: 1, color: '#ff5c8a' },
    darter: { radius: 12, speed: 150, hull: 1, score: 200, touch: 1, color: '#ffb347' },
    brute:  { radius: 30, speed: 42,  hull: 8, score: 500, touch: 2, color: '#ff3b30' },
  },
  // Wave n spawns (6 + 3n) shadows; every 4th wave adds a brute.
  wave: { baseCount: 6, perWave: 3, spawnGap: 0.55, bruteEvery: 4 },
  // Between waves the diver picks one of three lantern upgrades.
  upgrades: [
    { id: 'rapid',   name: 'Swift Wick',   desc: '+30% fire rate',        apply: (p) => { p.fireInterval *= 0.7; } },
    { id: 'twin',    name: 'Twin Flame',   desc: 'Fire two bolts at once', apply: (p) => { p.bolts += 1; } },
    { id: 'pierce',  name: 'Piercing Ray', desc: 'Bolts pass through foes', apply: (p) => { p.pierce += 1; } },
    { id: 'bright',  name: 'Grand Lantern', desc: '+55 light radius',      apply: (p) => { p.lightRadius = Math.min(340, p.lightRadius + 55); } },
    { id: 'swift',   name: 'Fin Current',  desc: '+18% swim speed',       apply: (p) => { p.speed *= 1.18; } },
    { id: 'hull',    name: 'Reef Plate',   desc: '+1 hull, repair 1',     apply: (p) => { p.maxHull += 1; p.hull = Math.min(p.maxHull, p.hull + 1); } },
    { id: 'magnet',  name: 'Mote Lure',    desc: 'Motes drift to you',     apply: (p) => { p.magnetRadius += 90; } },
  ],
  // Screenshot states (?shot=start|play|end) stage a fixed, seeded scene.
  shots: {
    play: { wave: 3, score: 1240, motes: 9, eels: 4, urchins: 2, darters: 2 },
    end:  { wave: 4, score: 1875 },
  },
};
