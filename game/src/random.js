// Seeded random numbers (mulberry32). The same seed always deals the
// same reef, so screenshots and replays are reproducible.
export function makeRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick one item from an array with the seeded random.
export function pick(random, items) {
  return items[Math.floor(random() * items.length)];
}

// Shuffle a copy of an array with the seeded random.
export function shuffle(random, items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Read ?seed= from the page URL; fall back to 1.
export function seedFromUrl() {
  const seed = Number(new URLSearchParams(window.location.search).get('seed'));
  return Number.isFinite(seed) && seed > 0 ? Math.floor(seed) : 1;
}
