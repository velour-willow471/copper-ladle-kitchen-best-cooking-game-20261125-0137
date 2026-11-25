// A tiny seeded generator (mulberry32) so a screenshot seed always stages the same kitchen.

/** Make a random function from a 32-bit seed; the same seed gives the same stream. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one entry of `list` with the seeded stream. */
export function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}
