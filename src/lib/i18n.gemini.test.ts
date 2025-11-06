import { vi, describe, it, expect, beforeEach } from 'vitest';
import { derived } from 'svelte/store';
import { init, register, locale } from 'svelte-i18n';

// Mock svelte-i18n and environment variables
vi.mock('svelte-i18n', () => {
  const localeStore = {
    subscribe: vi.fn(),
    set: vi.fn(),
  };
  return {
    init: vi.fn(),
    register: vi.fn(),
    locale: localeStore,
    // Mock derived to work as expected with our mocks
    derived: (store, callback) => {
      return {
        subscribe: (fn) => store.subscribe((val) => fn(callback(val))),
      };
    },
  };
});

vi.mock('$app/environment', () => ({
  browser: true,
}));

describe('i18n.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should return true when locale is a string', async () => {
    // Mock the locale to be a string
    locale.subscribe.mockImplementationOnce((callback) => {
      callback('en');
      return () => { };
    });

    const { isLocaleLoaded } = await import('./i18n');
    let receivedValue;

    isLocaleLoaded.subscribe(val => {
      receivedValue = val;
    });

    expect(receivedValue).toBe(true);
  });

  it('should return false when locale is not a string', async () => {
    // Mock the locale to be null
    locale.subscribe.mockImplementationOnce((callback) => {
      callback(null);
      return () => { };
    });

    const { isLocaleLoaded } = await import('./i18n');
    let receivedValue;

    isLocaleLoaded.subscribe(val => {
      receivedValue = val;
    });

    expect(receivedValue).toBe(false);
  });

  it('should correctly escape HTML special characters', async () => {
    const { escapeHtml } = await import('./i18n');
    const unsafeString = `&<>"'`;
    const escapedString = escapeHtml(unsafeString);
    expect(escapedString).toBe('&amp;&lt;&gt;&quot;&#039;');
  });
});
