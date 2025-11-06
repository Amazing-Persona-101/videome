import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';

// Polyfill webcrypto.getRandomValues if needed (Node ≥18 has webcrypto)
beforeAll(() => {
  // @ts-ignore
  if (typeof globalThis.crypto === 'undefined' || !('getRandomValues' in globalThis.crypto)) {

    const { webcrypto } = require('node:crypto');
    // @ts-ignore
    globalThis.crypto = webcrypto;
  }
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('guest.ts', () => {
  let mod: typeof import('./guest');

  beforeEach(async () => {
    vi.resetModules();
    // fresh import for each test so monkey-patching local functions works cleanly
    mod = await import('./guest');
  });

  describe('randomSeed()', () => {
    it('returns a 12-character base36-ish string and is not constant', () => {
      const a = mod.randomSeed();
      const b = mod.randomSeed();

      expect(typeof a).toBe('string');
      expect(typeof b).toBe('string');
      expect(a).toHaveLength(12);
      expect(b).toHaveLength(12);
      // base36-ish (letters+digits)
      expect(a).toMatch(/^[a-z0-9]{12}$/);
      expect(b).toMatch(/^[a-z0-9]{12}$/);

      // very unlikely to collide; practically should differ
      expect(a).not.toBe(b);
    });
  });

  describe('buildRoboUrl()', () => {
    it('includes the chosen set, seed and size in the URL', () => {
      const url = mod.buildRoboUrl('monster', 'coolseed', 96);
      // We don’t assert the exact full robohash URL template,
      // just that it contains important parts the component relies on.
      expect(typeof url).toBe('string');
      expect(url).toContain('coolseed');       // seed included
      expect(url).toMatch(/(set2|set=2|set=set2|set%3Dset2)/i); // "monster" maps to set2
      expect(url).toMatch(/96x?96/);           // size included (patterns vary)
    });

    it('different sets produce different URLs', () => {
      const a = mod.buildRoboUrl('robot', 'same-seed', 64);
      const b = mod.buildRoboUrl('cat', 'same-seed', 64);
      expect(a).not.toBe(b);
      expect(a).toContain('same-seed');
      expect(b).toContain('same-seed');
    });
  });

  describe('getRandomName()', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterAll(() => {
      // restore whatever the environment had
      // @ts-ignore
      globalThis.fetch = originalFetch;
    });

    it('returns "<username> <password>" when randomuser responds with a result', async () => {
      const mockData = {
        results: [
          { login: { username: 'bluefox', password: 'p@ssw0rd' } }
        ]
      };

      // @ts-ignore
      globalThis.fetch = vi.fn(async () => ({
        json: async () => mockData
      }));

      const name = await mod.getRandomName('seed123');
      expect(name).toBe('bluefox p@ssw0rd');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://randomuser.me/api/?inc=login&results=1&noinfo'
      );
    });

    it('falls back to local generator when results are empty', async () => {
      // 1) Mock fetch to return empty results (triggers fallback)
      // @ts-ignore
      globalThis.fetch = vi.fn(async () => ({
        json: async () => ({ results: [] }),
      }));

      const seed = 'abc123';
      const name = await mod.getRandomName(seed);

      // 2) Assert fallback “shape” (your module returns e.g. "silver_orca_ABC")
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);

      // Should NOT be the randomuser format "username password"
      expect(name).not.toMatch(/^\S+\s+\S+$/);

      // Your fallback uses underscores and a seed-derived suffix (e.g., _ABC)
      expect(name).toMatch(/_/);

      // 3) Optional: assert the seed-derived suffix (observed "ABC" from "abc123")
      const expectedSuffix = seed.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase();
      expect(name.endsWith(`_${expectedSuffix}`)).toBe(true);
    });

  });
});
