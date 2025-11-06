import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// required for svelte5 + jsdom as jsdom does not support matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  enumerable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// ✅ Mock DyteClient globally so tests don’t fail
vi.mock('@dytesdk/web-core', () => ({
  DyteClient: vi.fn().mockImplementation(() => ({
    init: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

vi.mock('@sveltejs/kit', async () => {
  const actual = await vi.importActual('@sveltejs/kit') as object;

  return {
    ...actual,
    redirect: vi.fn((status, location) => {
      // Throwing an error here is common practice to stop execution
      // and allow the test to catch the redirect attempt.
      throw new Error(`Redirected to ${location} with status ${status}`);
    }),
  };
});