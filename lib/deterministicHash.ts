/**
 * Stable pseudo-random in [0, 1) from a string seed (FNV-1a style).
 * Same inputs always yield the same output — no `Math.random()` drift.
 */
export function hash32(input: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return h >>> 0;
}

export function unitFloat(seed: string, salt: string): number {
  const h = hash32(`${salt}\0${seed}`);
  return (h % 1_000_000) / 1_000_000;
}
