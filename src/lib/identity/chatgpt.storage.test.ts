// storage.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Identity } from './storage';
import { saveIdentity, saveToken, clearStorage } from './storage';

// A tiny, deterministic localStorage mock
function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    // Optional helpers so Object.keys(...) works in debugging
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    }
  } as Storage;
}

const DEFAULT_IDENTITY_KEY = 'guestIdentity';
const DEFAULT_TOKEN_KEY = 'userToken';

describe('storage.ts (localStorage helpers)', () => {
  let originalLocalStorage: Storage | undefined;

  beforeEach(() => {
    // Snapshot any existing jsdom localStorage
    // @ts-expect-error allow undefined in Node envs
    originalLocalStorage = globalThis.localStorage;
    // Install a fresh mock per test
    // @ts-expect-error we’re stubbing for test
    globalThis.localStorage = createMockLocalStorage();
  });

  afterEach(() => {
    // Restore whatever was there
    // @ts-expect-error allow undefined
    globalThis.localStorage = originalLocalStorage;
    vi.restoreAllMocks();
  });

  it('saveIdentity stores the JSON under the default key', () => {
    const identity: Identity = {
      avatar: 'robot:seed:128',
      name: 'Alex Robot',
      userId: 'user-123'
    };

    saveIdentity(identity);

    const raw = globalThis.localStorage!.getItem(DEFAULT_IDENTITY_KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual(identity);
  });

  it('saveIdentity supports a custom key', () => {
    const identity: Identity = {
      avatar: 'cat:meow:128',
      name: 'Casey Cat',
      userId: 'user-999'
    };

    saveIdentity(identity, 'customIdentityKey');

    // default key untouched
    expect(globalThis.localStorage!.getItem(DEFAULT_IDENTITY_KEY)).toBeNull();

    const raw = globalThis.localStorage!.getItem('customIdentityKey');
    expect(JSON.parse(raw!)).toEqual(identity);
  });

  it('saveToken stores the raw token (no JSON) under the default key', () => {
    saveToken('abc.def.ghi');

    const raw = globalThis.localStorage!.getItem(DEFAULT_TOKEN_KEY);
    expect(raw).toBe('abc.def.ghi');
  });

  it('saveToken supports a custom key', () => {
    saveToken('xyz', 'customTokenKey');

    expect(globalThis.localStorage!.getItem(DEFAULT_TOKEN_KEY)).toBeNull();
    expect(globalThis.localStorage!.getItem('customTokenKey')).toBe('xyz');
  });

  it('clearStorage removes the identity at the default key', () => {
    // seed something first
    globalThis.localStorage!.setItem(DEFAULT_IDENTITY_KEY, '{"ok":true}');
    clearStorage();

    expect(globalThis.localStorage!.getItem(DEFAULT_IDENTITY_KEY)).toBeNull();
  });

  it('clearStorage supports a custom key', () => {
    globalThis.localStorage!.setItem('customIdentityKey', '{"ok":true}');
    clearStorage('customIdentityKey');

    expect(globalThis.localStorage!.getItem('customIdentityKey')).toBeNull();
  });

  it('is a no-op (and does not throw) when localStorage is undefined (SSR safety)', () => {
    // Remove localStorage entirely to simulate SSR
    // @ts-expect-error deliberately unset
    globalThis.localStorage = undefined;

    // Calls should not throw
    expect(() =>
      saveIdentity({
        avatar: 'robot:x:128',
        name: 'SSR',
        userId: 'u'
      })
    ).not.toThrow();

    expect(() => saveToken('tkn')).not.toThrow();
    expect(() => clearStorage()).not.toThrow();
  });
});
