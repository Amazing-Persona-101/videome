// i18n.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { init, register, locale } from 'svelte-i18n';
import { get } from 'svelte/store';

// Mock svelte-i18n
vi.mock('svelte-i18n', () => ({
  init: vi.fn(),
  register: vi.fn(),
  locale: { subscribe: vi.fn() }
}));

// Mock $app/environment
vi.mock('$app/environment', () => ({
  browser: true
}));

describe('i18n module', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.resetAllMocks();

    // Mock the navigator object
    Object.defineProperty(global, 'navigator', {
      value: {
        language: 'en-US'
      },
      writable: true
    });
  });


  afterEach(() => {
    vi.restoreAllMocks();
  });

  // it('should register language files', async () => {
  //   // Mock import.meta.glob
  //   const mockLanguageFiles = {
  //     '../lang/en.json': { default: { hello: 'Hello' } },
  //     '../lang/fr.json': { default: { hello: 'Bonjour' } },
  //     // Add more mock language files here if needed
  //   };

  //   vi.mock('../lang/*.json', () => mockLanguageFiles, { virtual: true });

  //   await import('./i18n');

  //   expect(register).toHaveBeenCalledTimes(2);
  //   expect(register).toHaveBeenCalledWith('en', expect.any(Function));
  //   expect(register).toHaveBeenCalledWith('fr', expect.any(Function));
  // });

  it('should initialize with correct options', async () => {
    await import('./i18n');

    expect(init).toHaveBeenCalledWith({
      initialLocale: expect.any(String),
      fallbackLocale: 'en'
    });
  });

  it('should use browser language when available', async () => {
    vi.mock('$app/environment', () => ({
      browser: true
    }));

    await import('./i18n');

    expect(init).toHaveBeenCalledWith(expect.objectContaining({
      initialLocale: 'en'
    }));
  });

  it('should use fallback language when not in browser environment', async () => {
    vi.mock('$app/environment', () => ({
      browser: false
    }));

    await import('./i18n');

    expect(init).toHaveBeenCalledWith(expect.objectContaining({
      initialLocale: 'en'
    }));
  });

  it('should export isLocaleLoaded derived store', async () => {
    const module = await import('./i18n');

    expect(module.isLocaleLoaded).toBeDefined();
    expect(typeof module.isLocaleLoaded.subscribe).toBe('function');
  });

  it('should correctly escape HTML', async () => {
    const module = await import('./i18n');

    const unescaped = '<script>alert("XSS");</script>';
    const escaped = module.escapeHtml(unescaped);

    expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;);&lt;/script&gt;');
  });
});