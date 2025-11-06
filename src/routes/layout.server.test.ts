// src/routes/layout.server.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('+layout.server.ts — empty sessions path', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns { sessions: [] } when the sessions API returns no live sessions', async () => {
    // Mock: keep filter as identity so we can assert the loader’s behavior cleanly
    vi.doMock('$lib/meetings/filterSessions', () => ({
      latestByAssociatedId: (arr: any[]) => arr
    }));

    // Mock: title unpacker (not used in the empty path but safe to mock)
    vi.doMock('$lib/meetings/packTitle', () => ({
      unpackMeetingTitle: vi.fn(() => ({ g: 'g1', s: 'Hello summary' }))
    }));

    // Mock: groups JSON (default import)
    vi.doMock('$lib/data/group_info.json', () => ({
      default: [
        { id: 'g1', name: 'Test Group', iconURL: 'https://example.com/icon.png' }
      ]
    }));

    // Mock: the loader's fetch; only the sessions call should occur
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : String(input);

      if (url.startsWith('/api/meeting?path=sessions')) {
        return {
          ok: true,
          async json() {
            return { data: { sessions: [] } }; // <- empty list
          }
        } as unknown as Response;
      }

      // Any other fetch in the empty path would be unexpected
      throw new Error(`Unexpected fetch to ${url}`);
    });

    // Import AFTER mocks so the loader sees the mocked modules
    const { load } = await import('./+layout.server.ts');

    // Call the loader with just the fetch it needs
    const result = await load({ fetch: fetchSpy } as any);

    // Assertions
    expect(result).toEqual({ sessions: [] });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/meeting?path=sessions&per_page=1000&status=LIVE',
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Object)
      })
    );
  });
});
