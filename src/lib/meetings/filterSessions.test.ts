import { describe, it, expect } from 'vitest';
import { latestByAssociatedId } from './filterSessions';
import type { Session } from './types';

const iso = (s: string) => s; // helper for readability

describe('filterSessions.latestByAssociatedId', () => {
  it('keeps only the most recent row per associated_id using updated_at/ended_at/started_at/created_at', () => {
    const rows: Session[] = [
      {
        id: 's1a',
        associated_id: 'A',
        type: 'meeting',
        status: 'ENDED',
        // deliberately include spaces like your dataset: T20: 25: 09.021Z
        updated_at: iso('2025-08-09T20: 25: 09.021Z'),
        created_at: iso('2025-08-09T19:00:00.000Z')
      } as any,
      {
        id: 's1b',
        associated_id: 'A',
        type: 'meeting',
        status: 'LIVE',
        // newer updated_at -> should win
        updated_at: iso('2025-08-10T03:04:51.397Z'),
        created_at: iso('2025-08-09T18:00:00.000Z')
      } as any,
      {
        id: 's2a',
        associated_id: 'B',
        type: 'meeting',
        status: 'SCHEDULED',
        // no updated_at; fallback to started_at
        started_at: iso('2025-08-09T10:00:00.000Z'),
        created_at: iso('2025-08-08T10:00:00.000Z')
      } as any,
      {
        id: 's2b',
        associated_id: 'B',
        type: 'meeting',
        status: 'SCHEDULED',
        // later ended_at than started_at of s2a -> should win
        ended_at: iso('2025-08-09T12:00:00.000Z'),
        created_at: iso('2025-08-08T09:00:00.000Z')
      } as any
    ];

    const out = latestByAssociatedId(rows);
    // unique by associated_id
    expect(out).toHaveLength(2);

    const a = out.find(r => r.associated_id === 'A')!;
    const b = out.find(r => r.associated_id === 'B')!;

    expect(a.id).toBe('s1b'); // chosen by latest updated_at (normalizes spaced timestamps)
    expect(b.id).toBe('s2b'); // chosen by ended_at fallback
  });

  it('ignores rows with no associated_id', () => {
    const out = latestByAssociatedId<Session>([
      { id: 'x', associated_id: '' } as any,
      { id: 'y', associated_id: 'K', created_at: iso('2025-08-01T00:00:00.000Z') } as any
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('y');
  });
});
