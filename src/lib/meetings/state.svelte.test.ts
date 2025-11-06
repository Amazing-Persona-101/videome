import { describe, it, expect } from 'vitest';
import { meetings, ui, initMeetings, applyMeetingMessage, setWsReady, destroyMeetings } from './state.svelte';
import type { Session, IncomingMessage } from './types';

const S = (over: Partial<Session> = {}): Session => ({
  id: over.id ?? 'sess-1',
  associated_id: over.associated_id ?? 'assoc-1',
  type: 'meeting',
  status: (over.status as any) ?? 'SCHEDULED',
  created_at: over.created_at ?? '2025-08-10T00:00:00.000Z',
  updated_at: over.updated_at ?? '2025-08-10T00:00:00.000Z',
  ...over
} as any);

describe('state.svelte store + API', () => {
  it('initMeetings populates the meetings array', () => {
    initMeetings([S({ associated_id: 'A' }), S({ associated_id: 'B' })]);
    expect(meetings.length).toBe(2);
  });

  it('setWsReady toggles UI flag', () => {
    setWsReady(true);
    expect(ui.wsReady).toBe(true);
    setWsReady(false);
    expect(ui.wsReady).toBe(false);
  });

  it('applyMeetingMessage merges messages into meetings', () => {
    // reset to empty
    destroyMeetings();
    initMeetings([]);

    const started: IncomingMessage = {
      event: 'meeting.started',
      meeting: {
        id: 'm-1',
        sessionId: 'm-1-s',
        title: 'Room 1',
        roomName: 'm-1',
        status: 'LIVE',
        createdAt: '2025-08-10T00:00:00.000Z',
        startedAt: '2025-08-10T00:00:00.000Z'
      }
    };

    applyMeetingMessage(started);
    expect(meetings.length).toBe(1);
    expect(meetings[0].id).toBe('m-1');
    expect(meetings[0].status).toBe('LIVE');

    applyMeetingMessage({
      ...started,
      event: 'meeting.participantJoined',
      participant: {
        "clientSpecificId": "bweia054f",
        "customParticipantId": "bweia054f",
        "joinedAt": "2025-08-15T23:31:44.690Z",
        "peerId": "f9a403d6-7d3e-46b2-99b9-5c421184fee2",
        "userDisplayName": "sadswan815 science",
      }
    });
    expect(meetings[0].liveParticipants).toBeGreaterThanOrEqual(1);
  });

  it('destroyMeetings clears wsReady and stops ticking', () => {
    setWsReady(true);
    destroyMeetings();
    expect(ui.wsReady).toBe(false);
  });
});
