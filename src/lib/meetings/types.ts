export type Details = {
  group: {
    id: string | null;
    iconURL: string;
    name: string;
  };
  summary: string;
}

export type Session = {
  id: string;
  associated_id: string;

  type: 'meeting' | string;
  meeting_display_name?: string;

  status: 'LIVE' | 'ENDED' | 'SCHEDULED' | string;
  live_participants?: number;
  max_concurrent_participants?: number;
  total_participants?: number;

  // consumption counters
  minutes_consumed?: number;
  group_call_minutes_consumed?: number;
  webinar_minutes_consumed?: number;
  audio_room_minutes_consumed?: number;
  livestream_minutes_consumed?: number;
  chat_minutes_consumed?: number;
  recording_minutes_consumed?: number;
  transcription_minutes_consumed?: number;

  // recording/livestream state
  recording_status?: 'NOT_RECORDED' | 'RECORDING' | 'RECORDED' | string;
  livestream_status?: 'NOT_LIVESTREAMED' | 'LIVESTREAMING' | 'LIVESTREAMED' | string;

  // org/relations
  organization_id?: string;
  parent_session_id?: string | null;

  // extras
  settings?: { live_stream_on_start?: boolean;[k: string]: unknown };
  meta?: { room_name?: string;[k: string]: unknown };

  // timestamps (note: your file has spaces in the time part)
  started_at?: string | null;
  ended_at?: string | null;
  created_at: string;
  updated_at?: string;

  // allow future expansion safel
  details?: Details;  // enriched details
};


export type CurrMeeting = {
  associated_id?: string | null; // stable meetingId
  created_at: string;
  ended_at: string | null;
  id: string; // sessionId
  live_participants: number;
  roomName: string;
  max_concurrent_participants: number;
  meeting_display_name: string;
  meta?: { room_name?: string };
  minutes_consumed: number;
  started_at: string | null;
  status: 'LIVE' | 'ENDED' | 'SCHEDULED' | string;
  title: string;
  total_participants: number;
  type: 'meeting';
  updated_at: string;
};

export type MeetingEventName =
  | 'meeting.started'
  | 'meeting.ended'
  | 'meeting.participantJoined'
  | 'meeting.participantLeft';

export type IncomingMessage = {
  event: MeetingEventName;
  meeting: {
    createdAt: string;
    endedAt?: string | null;
    id: string;              // meetingId
    roomName: string;
    sessionId?: string;      // sessionId
    startedAt: string | null;
    status: string;
    title?: string;
  };
  details?: Details;  // enriched details
  participant?: {
    clientSpecificId: string;
    customParticipantId: string;
    joinedAt: string;
    leftAt?: string;
    peerId: string;
    userDisplayName: string;
  };
  reason?: string;
};



export type MeetingView = {
  createdAt: string;        // stable
  endedAt?: string | null;
  details?: Details;  // enriched details
  id: string;        // stable
  liveParticipants: number;
  roomName: string;
  runtimeMinutes: number;    // derived
  sessionId?: string | null; // current session
  startedAt?: string | null;
  status: 'LIVE' | 'ENDED' | 'SCHEDULED' | string;
  title: string;
  totalParticipants: number;
  updatedAt: string;         // ISO
};
