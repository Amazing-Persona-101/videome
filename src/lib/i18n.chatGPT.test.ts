// i18n.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/** Ensure no browser-only paths are taken during module eval */
vi.mock('$app/environment', () => ({ browser: false }));

/** Minimal writable-like store for locale */
type Subscriber<T> = (v: T) => void;
function createWritable<T>(initial?: T) {
  let value = initial as T;
  const subs = new Set<Subscriber<T>>();
  return {
    subscribe(fn: Subscriber<T>) {
      subs.add(fn);
      fn(value);
      return () => subs.delete(fn);
    },
    _set(v: T) {
      value = v;
      subs.forEach((fn) => fn(value));
    }
  };
}

const i18nMock = vi.hoisted(() => {
  const localeStore = createWritable<any>(undefined);
  return {
    init: vi.fn(),
    register: vi.fn(),
    localeStore
  };
});

vi.mock('svelte-i18n', () => ({
  init: i18nMock.init,
  register: i18nMock.register,
  locale: i18nMock.localeStore
}));

describe('i18n.ts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    i18nMock.init.mockReset();
    i18nMock.register.mockReset();
    i18nMock.localeStore._set(undefined);
  });

  it('initializes i18n and registers discovered languages', async () => {
    const mod = await import('./i18n');

    // init called with fallback
    expect(i18nMock.init).toHaveBeenCalledTimes(1);
    expect(i18nMock.init.mock.calls[0][0]).toMatchObject({ fallbackLocale: 'en' });

    // register called at least once (your actual /lang files)
    expect(i18nMock.register.mock.calls.length).toBeGreaterThan(0);

    // First arg of each register call should be the language code
    const langsRegistered = i18nMock.register.mock.calls.map((c) => c[0]);

    // We almost certainly have 'en' in the repo; assert subset instead of exact match
    expect(langsRegistered).toEqual(expect.arrayContaining(['en']));

    // If your repo definitely includes these, keep this; otherwise remove it:
    // expect(langsRegistered).toEqual(expect.arrayContaining(['es', 'zh']));

    // Second arg is a loader/function in your setup (safe check)
    i18nMock.register.mock.calls.forEach((c) => {
      expect(typeof c[1]).toBe('function');
    });

    // Exports exist
    expect(typeof mod.escapeHtml).toBe('function');
    expect(mod.isLocaleLoaded && typeof mod.isLocaleLoaded.subscribe).toBe('function');
  });

  it('isLocaleLoaded reflects whether locale is a string', async () => {
    const { isLocaleLoaded } = await import('./i18n');

    const seen: boolean[] = [];
    const unsub = isLocaleLoaded.subscribe((v) => seen.push(v));

    // starts false (undefined)
    expect(seen.at(-1)).toBe(false);

    i18nMock.localeStore._set('en');
    expect(seen.at(-1)).toBe(true);

    // null/number/etc -> false
    // @ts-expect-error testing non-string
    i18nMock.localeStore._set(null);
    expect(seen.at(-1)).toBe(false);

    i18nMock.localeStore._set('fr');
    expect(seen.at(-1)).toBe(true);

    unsub();
  });

  it('escapeHtml escapes critical characters', async () => {
    const { escapeHtml } = await import('./i18n');
    const input = `A & B < C > D "E" 'F'`;
    expect(escapeHtml(input)).toBe('A &amp; B &lt; C &gt; D &quot;E&quot; &#039;F&#039;');
  });
});
