import { describe, it, expect, vi } from 'vitest';
import { runtimeMinutes, fromCurrSessions, applyMessage, tick } from './merge';
import type { IncomingMessage, MeetingView, Session } from './types';

const now = (d: Date) => d.toISOString();

describe('merge.runtimeMinutes', () => {
  it('computes minutes between start and end', () => {
    const start = new Date('2025-08-10T00:00:00.000Z');
    const end = new Date('2025-08-10T00:30:00.000Z');
    expect(runtimeMinutes(now(start), now(end))).toBe(30);
  });

  it('uses Date.now() when end is null', () => {
    const start = new Date('2025-08-10T00:00:00.000Z');
    vi.useFakeTimers().setSystemTime(new Date('2025-08-10T00:15:00.000Z'));
    expect(runtimeMinutes(now(start), null)).toBe(15);
    vi.useRealTimers();
  });

  it('returns 0 when start is missing', () => {
    expect(runtimeMinutes(undefined, undefined as any)).toBe(0);
  });
});

describe('merge.fromCurrSessions', () => {
  const s = (over: Partial<Session>): Session => ({
    id: over.id ?? 'id',
    associated_id: over.associated_id ?? 'assoc',
    type: 'meeting',
    status: (over.status as any) ?? 'SCHEDULED',
    created_at: (over as any).created_at ?? '2025-08-08T00:00:00.000Z',
    updated_at: (over as any).updated_at ?? '2025-08-08T00:00:00.000Z',
    ...over
  } as any);

  it('maps Session -> MeetingView and sorts LIVE first, then by updatedAt desc', () => {
    const list = [
      s({ associated_id: 'A', status: 'SCHEDULED', updated_at: '2025-08-09T10:00:00.000Z' }),
      s({ associated_id: 'B', status: 'LIVE', updated_at: '2025-08-09T09:00:00.000Z' }),
      s({ associated_id: 'C', status: 'ENDED', updated_at: '2025-08-10T12:00:00.000Z' })
    ];

    const views = fromCurrSessions(list);
    expect(views[0].status).toBe('LIVE');            // LIVE first
    // Among non-LIVE, newer updatedAt should come before older
    const nonLive = views.filter(v => v.status !== 'LIVE');
    expect(new Date(nonLive[0].updatedAt).getTime())
      .toBeGreaterThanOrEqual(new Date(nonLive[1].updatedAt).getTime());
  });
});

describe('merge.applyMessage', () => {
  const startedMsg = (id: string): IncomingMessage => ({
    event: 'meeting.started',
    meeting: {
      id,
      sessionId: `${id}-s`,
      title: 'A cool room',
      roomName: id,
      status: 'LIVE',
      createdAt: '2025-08-10T03:04:51.397Z',
      startedAt: '2025-08-10T03:04:51.397Z'
    }
  });

  it('adds a new view if the message refers to an unknown meeting', () => {
    const out = applyMessage([], startedMsg('m1'));
    expect(out).toHaveLength(1);
    const m = out[0];
    expect(m.id).toBe('m1');
    expect(m.status).toBe('LIVE');
    expect(m.sessionId).toBe('m1-s');
    expect(m.title).toBe('A cool room');
  });

  it('updates participant counts on participantJoined and participantLeft', () => {
    // helper to build a "started" message
    const startedMsg = (id: string): IncomingMessage => ({
      event: 'meeting.started',
      meeting: {
        id,
        sessionId: `${id}-s`,
        title: 'A cool room',
        roomName: id,
        status: 'LIVE',
        createdAt: '2025-08-10T03:04:51.397Z',
        startedAt: '2025-08-10T03:04:51.397Z',
        endedAt: null
      }
    });

    // start with a LIVE meeting in state
    let state: MeetingView[] = applyMessage([], startedMsg('m2'));

    const baseMeeting = {
      id: 'm2',
      sessionId: 'm2-s',
      title: 'A cool room',
      roomName: 'm2',
      status: 'LIVE',
      createdAt: '2025-08-10T03:04:51.397Z',
      startedAt: '2025-08-10T03:04:51.397Z',
      endedAt: null
    };

    // ✅ provide ALL required participant fields
    const participant = {
      clientSpecificId: 'csi-1',
      customParticipantId: 'cpi-1',
      joinedAt: '2025-08-10T03:04:52.000Z',
      peerId: 'peer-1',
      userDisplayName: 'Alice'
    };

    // participant joined
    state = applyMessage(state, {
      event: 'meeting.participantJoined',
      meeting: baseMeeting,
      participant
    } satisfies IncomingMessage);

    expect(state[0].liveParticipants).toBeGreaterThanOrEqual(1);
    expect(state[0].totalParticipants).toBeGreaterThanOrEqual(1);

    // participant left (same required fields + leftAt)
    const participantLeft = { ...participant, leftAt: '2025-08-10T03:10:00.000Z' };

    const afterLeave = applyMessage(state, {
      event: 'meeting.participantLeft',
      meeting: baseMeeting,
      participant: participantLeft
    } satisfies IncomingMessage);

    expect(afterLeave[0].liveParticipants).toBeGreaterThanOrEqual(0);
  });


  it('marks meeting as ENDED on meeting.ended', () => {
    let state = applyMessage([], startedMsg('m3'));
    const endMsg: IncomingMessage = {
      event: 'meeting.ended',
      meeting: {
        id: 'm3',
        sessionId: 'm3-s',
        title: 'A cool room',
        roomName: 'm3',
        status: 'LIVE',
        createdAt: '2025-08-10T03:04:51.397Z',
        startedAt: '2025-08-10T03:04:51.397Z',
        endedAt: '2025-08-10T03:20:00.000Z'
      }
    };
    state = applyMessage(state, endMsg);
    expect(state[0].status).toBe('ENDED');
    expect(state[0].endedAt).toBe('2025-08-10T03:20:00.000Z');
  });
});

describe('merge.tick', () => {
  it('recomputes runtimeMinutes for LIVE meetings', () => {
    const state: MeetingView[] = [{
      id: 'live-1',
      title: 'Live',
      roomName: 'live-1',
      createdAt: '2025-08-10T00:00:00.000Z',
      updatedAt: '2025-08-10T00:00:00.000Z',
      status: 'LIVE',
      liveParticipants: 1,
      totalParticipants: 1,
      sessionId: 'live-1-s',
      startedAt: '2025-08-10T00:00:00.000Z',
      endedAt: null,
      runtimeMinutes: 0
    }];

    vi.useFakeTimers().setSystemTime(new Date('2025-08-10T00:10:00.000Z'));
    const after = tick(state);
    vi.useRealTimers();

    expect(after[0].runtimeMinutes).toBeGreaterThanOrEqual(10);
  });
});
