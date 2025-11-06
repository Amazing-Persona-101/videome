import { describe, it, expect } from 'vitest';
import type { IncomingMessage, MeetingEventName, Session, MeetingView } from './types';

describe('types runtime shape sanity', () => {
  it('IncomingMessage minimal shape matches what merge expects', () => {
    const msg: IncomingMessage = {
      event: 'meeting.started',
      meeting: {
        id: 'm',
        sessionId: 's',
        title: 't',
        roomName: 'r',
        status: 'LIVE',
        createdAt: '2025-08-10T00:00:00.000Z',
        startedAt: '2025-08-10T00:00:00.000Z',
        endedAt: null
      }
    };
    expect(msg.meeting.id).toBe('m');
  });

  it('MeetingEventName union includes expected events', () => {
    const names: MeetingEventName[] = [
      'meeting.started',
      'meeting.ended',
      'meeting.participantJoined',
      'meeting.participantLeft'
    ];
    expect(names).toHaveLength(4);
  });

  it('Session and MeetingView key fields exist at runtime', () => {
    const s: Session = {
      id: 'sid',
      associated_id: 'aid',
      type: 'meeting',
      status: 'LIVE',
      created_at: '2025-08-10T00:00:00.000Z',
      updated_at: '2025-08-10T00:00:00.000Z'
    } as any;

    const v: MeetingView = {
      id: 'mid',
      title: 'Title',
      roomName: 'mid',
      createdAt: '2025-08-10T00:00:00.000Z',
      updatedAt: '2025-08-10T00:00:00.000Z',
      status: 'LIVE',
      liveParticipants: 0,
      totalParticipants: 0,
      runtimeMinutes: 0
    };
    expect(s.associated_id).toBe('aid');
    expect(v.id).toBe('mid');
  });
});
