export const cannedRTKResponses = {
  'meeting.started': {
    event: 'meeting.started',
    meetingId: 'canned-meeting-123',
    createdAt: new Date().toISOString(),
    participants: 1
  },
  'meeting.ended': {
    event: 'meeting.ended',
    meetingId: 'canned-meeting-123',
    endedAt: new Date().toISOString()
  },
  'meeting.participantJoined': {
    event: 'meeting.participantJoined',
    meetingId: 'canned-meeting-123',
    participantId: 'canned-participant-456',
    joinedAt: new Date().toISOString()
  },
  'meeting.participantLeft': {
    event: 'meeting.participantLeft',
    meetingId: 'canned-meeting-123',
    participantId: 'canned-participant-456',
    leftAt: new Date().toISOString()
  }
}