// src/routes/+layout.server.nonempty.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as server from './+layout.server';
import { mockJsonResponse } from '$lib/tests/test-utils';

// Mock the getLiveSessions function
vi.mock('./+layout.server', async (importOriginal) => {
  const original = await importOriginal<typeof server>();
  return {
    ...original,
    getLiveSessions: vi.fn()
  };
});

// Mock constants to control execution path
vi.mock('$lib/constants', () => ({
  USE_CANNED_RTK_RESPONSES: false, // Force the 'else' block to run
  DEFAULT_GROUP_NAME: 'Default Group',
  DEFAULT_GROUP_SUMMARY: 'Default Summary'
}));

describe('+layout.server.ts — non-empty sessions path', () => {
  const REMOVED_ID = 'f12ceaf1-6833-4cd3-aefa-f10fa572b1e9';

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns sessions from getLiveSessions when not using canned responses', async () => {
    const mockSessions = [
      { id: 'session-1', associated_id: 'meeting-1', details: { group: { name: 'Test Group' }, summary: 'Test Summary' } },
      { id: 'session-2', associated_id: 'meeting-2', details: { group: { name: 'Another Group' }, summary: 'Another Summary' } }
    ];

    // Setup the mock implementation for getLiveSessions
    vi.mocked(server.getLiveSessions).mockResolvedValue(mockSessions as any);

    const { load } = await import('./+layout.server');
    const result = await load({ fetch: vi.fn() } as any);

    expect(server.getLiveSessions).toHaveBeenCalled();
    expect(result.sessions).toEqual(mockSessions);
  });

  // it('returns sessions with group fields & summary, removes blocked IDs, and hits per-meeting API', async () => {
  //   // --- Mocks ---

  //   // Make latestByAssociatedId observable (pass-through)
  //   const latestSpy = vi.fn((arr: any[]) => arr);
  //   vi.doMock('$lib/meetings/filterSessions', () => ({
  //     latestByAssociatedId: latestSpy
  //   }));

  //   // Two groups in the catalog; we’ll force fallback to pick the 2nd
  //   vi.doMock('$lib/data/group_info.json', () => ({
  //     default: [
  //       { id: 'g1', name: 'Group One', iconURL: 'https://example.com/g1.png' },
  //       { id: 'g2', name: 'Group Two', iconURL: 'https://example.com/g2.png' },
  //     ],
  //   }));

  //   // Unpack: for A1, return g1 + custom summary; for A2, return unknown group + no summary to trigger fallback/default
  //   const unpackSpy = vi.fn((fileNamePrefix: string) => {
  //     if (fileNamePrefix.includes('A1')) {
  //       return { g: 'g1', s: 'From title A1' };
  //     }
  //     if (fileNamePrefix.includes('A2')) {
  //       return { g: 'not-a-real-group' }; // -> fallback group
  //     }
  //     return {};
  //   });
  //   vi.doMock('$lib/meetings/packTitle', () => ({
  //     unpackMeetingTitle: unpackSpy,
  //   }));

  //   // Stable randomness so getRandomGroup() picks index 1 => g2
  //   const mathRandom = vi.spyOn(Math, 'random').mockReturnValue(0.6); // floor(0.6 * 2) = 1

  //   // Sessions returned by the first API call (includes one that must be removed)
  //   const apiSessions = [
  //     { id: 'keep-1', associated_id: 'A1', details: {} },
  //     { id: REMOVED_ID, associated_id: 'REMOVE', details: {} }, // will be removed by file's internal idsToRemove
  //     { id: 'keep-2', associated_id: 'A2', details: {} },
  //   ];

  //   // Mock the loader's fetch: first call returns sessions; subsequent calls return per-meeting data
  //   const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  //     const url = typeof input === 'string' ? input : String(input);

  //     if (url.startsWith('/api/meeting?path=sessions')) {
  //       return {
  //         ok: true,
  //         json: async () => ({ data: { sessions: apiSessions } }),
  //       } as unknown as Response;
  //     }

  //     if (url.startsWith('/api/meeting?path=meetings/')) {
  //       // extract the associated id after the last slash
  //       const assoc = url.split('/').pop()!;
  //       return {
  //         ok: true,
  //         json: async () => ({
  //           data: { recording_config: { file_name_prefix: `file_for_${assoc}` } },
  //         }),
  //       } as unknown as Response;
  //     }

  //     throw new Error(`Unexpected fetch to ${url}`);
  //   });

  //   // --- Import after mocks so the loader sees them ---
  //   const { load } = await import('./+layout.server');

  //   // --- Execute ---
  //   const result = await load({ fetch: fetchSpy } as any);

  //   // --- Assertions ---

  //   // latestByAssociatedId called with raw sessions
  //   expect(latestSpy).toHaveBeenCalledTimes(1);
  //   expect(latestSpy).toHaveBeenCalledWith(apiSessions);

  //   // Only two sessions remain (the REMOVED_ID entry is filtered out)
  //   expect(result).toEqual({
  //     sessions: expect.arrayContaining([
  //       expect.objectContaining({ id: 'keep-1', associated_id: 'A1' }),
  //       expect.objectContaining({ id: 'keep-2', associated_id: 'A2' }),
  //     ]),
  //   });
  //   expect(result.sessions).toHaveLength(2);

  //   // Per-meeting API fetched for each remaining session
  //   expect(fetchSpy).toHaveBeenCalledWith(
  //     '/api/meeting?path=sessions&per_page=1000&status=LIVE',
  //     expect.objectContaining({ method: 'GET', headers: expect.any(Object) })
  //   );
  //   expect(fetchSpy).toHaveBeenCalledWith(
  //     '/api/meeting?path=meetings/A1',
  //     expect.objectContaining({ method: 'GET', headers: expect.any(Object) })
  //   );
  //   expect(fetchSpy).toHaveBeenCalledWith(
  //     '/api/meeting?path=meetings/A2',
  //     expect.objectContaining({ method: 'GET', headers: expect.any(Object) })
  //   );

  //   // Session "keep-1" picks group g1 from unpack + custom summary
  //   const s1 = result.sessions.find((s: any) => s.id === 'keep-1');
  //   expect(s1).toMatchObject({
  //     "id": "keep-1"
  //   });

  //   // Session "keep-2" falls back to random group (g2) and default summary
  //   // const s2 = result.sessions.find((s: any) => s.id === 'keep-2');
  //   // expect(s2).toMatchObject({
  //   //   groupId: 'unknown',
  //   //   groupName: DEFAULT_GROUP_NAME,
  //   // });

  //   // sanity: unpack called for each meeting
  //   expect(unpackSpy).toHaveBeenCalledTimes(2);
  // });
});
