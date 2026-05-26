// Seedable PRNG used by the per-path sim harness. Measurement only — the
// engine (eventEngine.ts) reads Math.random; the harness swaps it for this
// during a run and restores it on exit so behavior outside the harness is
// untouched.

export type Rng = () => number;

// mulberry32 — small, fast, deterministic, good distribution for our scale.
export function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return function rand() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Run fn() with Math.random replaced by rng. Restores the original on exit,
// even if fn throws — so repeated harness calls can't leak a patched RNG.
export function withMathRandom<T>(rng: Rng, fn: () => T): T {
  const original = Math.random;
  Math.random = rng;
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}
