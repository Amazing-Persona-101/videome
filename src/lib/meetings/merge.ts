import type { IncomingMessage, MeetingView, Session } from './types';

const nowIso = () => new Date().toISOString();

export function runtimeMinutes(start?: string | null, end?: string | null) {
  if (!start) return 0;
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  return Math.max(0, (e - s) / 60000);
}

function currToView(cm: Session): MeetingView {
  // Choose a stable id, but fall back gracefully
  const id = cm.associated_id ?? 'unknown';
  return {
    createdAt: cm.created_at,
    endedAt: cm.ended_at,
    details: cm.details,
    id,
    liveParticipants: cm.live_participants ?? 0,
    roomName: cm.id,
    runtimeMinutes: runtimeMinutes(cm.started_at, cm.ended_at),
    sessionId: cm.id,
    startedAt: cm.started_at,
    status: cm.status,
    title: cm.meeting_display_name || 'unknown',
    totalParticipants: cm.max_concurrent_participants ?? 0,
    updatedAt: cm.updated_at ?? cm.created_at ?? nowIso(),
  };
}


function sortViews(list: MeetingView[]) {
  // LIVE first, then most recently updated
  return [...list].sort((a, b) => {
    if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
    if (b.status === 'LIVE' && a.status !== 'LIVE') return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function fromCurrSessions(list: Session[]): MeetingView[] {
  return sortViews(list.map(currToView));
}

/** Core reducer to merge a single incoming message into the list */
export function applyMessage(state: MeetingView[], msg: IncomingMessage): MeetingView[] {

  //console.log(`Applying message: ${JSON.stringify(msg)}`);
  const incomingId = msg.meeting?.id ?? null;          // preferred stable id
  const incomingSession = msg.meeting?.sessionId ?? null;
  const incomingRoom = msg.meeting?.title ?? null;
  //console.log(`Incoming id: ${incomingId}, incoming session: ${incomingSession}, incoming room: ${incomingRoom}`);

  if (!incomingId && !incomingSession && !incomingRoom) return state;

  // 1) Try by stable meetingId
  let idx = incomingId ? state.findIndex(m => m.id === incomingId) : -1;
  //console.log(`Found idx: ${idx}`);

  // 2) Fallback: by sessionId
  if (idx < 0 && incomingSession) {
    idx = state.findIndex(m => (m.sessionId ?? null) === incomingSession);
    //console.log(`Fallback to sessionId: ${idx}`);
  }

  // 3) Fallback: by roomName (some feeds use roomName as the id)
  if (idx < 0 && incomingRoom) {
    idx = state.findIndex(m => m.id === incomingRoom);
    //console.log(`Fallback to roomName: ${idx}`);
  }

  const existing = idx >= 0 ? state[idx] : undefined;
  //console.log(`Existing: ${JSON.stringify(existing)}`);

  const { details } = msg || {};
  //console.log(`Details in merge: ${JSON.stringify(details)}`);


  const base: MeetingView = existing ?? {
    createdAt: msg.meeting.createdAt,
    details: details || {},
    endedAt: msg.meeting.endedAt ?? null,
    id: incomingId ?? incomingRoom ?? incomingSession ?? 'unknown',
    liveParticipants: 0,
    roomName: msg.meeting.roomName,
    runtimeMinutes: 0,
    sessionId: incomingSession,
    startedAt: msg.meeting.startedAt ?? null,
    status: 'SCHEDULED',
    title: msg.meeting.title ?? incomingId ?? 'Meeting',
    totalParticipants: 0,
    updatedAt: nowIso(),
  };

  const next: MeetingView = { ...existing, ...base, updatedAt: nowIso() };
  //console.log(`Next: ${JSON.stringify(next)}`);

  if (msg.meeting.title) {
    next.title = msg.meeting.title;
    //console.log(`Updated next.title: ${next.title}`);
  }

  //console.log(`msg.event: ${msg.event}`)

  switch (msg.event) {
    case 'meeting.started': {
      //console.log('meeting.started');
      next.status = 'LIVE';
      next.sessionId = msg.meeting.sessionId ?? next.sessionId ?? null;
      next.startedAt = msg.meeting.startedAt ?? next.startedAt ?? next.updatedAt;
      next.endedAt = null;
      break;
    }
    case 'meeting.participantJoined': {
      //console.log('meeting.participantJoined');
      next.status = 'LIVE';
      next.liveParticipants = Math.max(0, (next.liveParticipants ?? 0) + 1);
      next.totalParticipants = Math.max(next.totalParticipants ?? 0, next.liveParticipants);
      if (!next.startedAt) next.startedAt = msg.meeting.startedAt ?? next.updatedAt;
      break;
    }
    case 'meeting.participantLeft': {
      next.liveParticipants = Math.max(0, (next.liveParticipants ?? 0) - 1);
      break;
    }
    case 'meeting.ended': {
      //console.log('meeting.ended');
      next.status = 'ENDED';
      next.liveParticipants = 0;
      next.endedAt = msg.meeting.endedAt ?? next.updatedAt;
      break;
    }

    default: {
      console.warn(`Unhandled event: ${msg.event}`);
      break;
    }
  }

  // If we matched via a fallback, migrate to the stable id
  if (incomingId && next.id !== incomingId) {
    //console.log(`Migrating to stable id: ${incomingId}`);
    next.id = incomingId;
  }

  next.runtimeMinutes = runtimeMinutes(next.startedAt, next.endedAt);

  // Upsert
  const out = [...state];
  if (idx >= 0) {
    //console.log(`Updating meetingId: ${idx} to ${incomingId}`);
    out[idx] = next;
  } else {
    // Insert new meeting at the beginning of the list
    //console.log(`Inserting new meeting at the beginning of the list`);
    out.unshift(next);
  }

  // De-dupe on meetingId (keep latest by updatedAt)
  const seen = new Map<string, MeetingView>();
  for (const m of out) {
    const prev = seen.get(m.id);
    if (!prev || new Date(m.updatedAt).getTime() < new Date(m.updatedAt).getTime()) {
      //console.log(`De-duplicating meetingId: ${m.id}`);
      seen.set(m.id, m);
    }
  }

  const response = sortViews([...seen.values()])
  //console.log(`Final state: ${JSON.stringify(response)}`);
  return response;
}

/** Optional helper to advance time-based fields (e.g., periodic tick for LIVE meetings) */
export function tick(state: MeetingView[]): MeetingView[] {
  let changed = false;
  const out = state.map((m) => {
    if (m.status === 'LIVE' && m.startedAt && !m.endedAt) {
      const updated = { ...m, runtimeMinutes: runtimeMinutes(m.startedAt, null) };
      if (updated.runtimeMinutes !== m.runtimeMinutes) changed = true;
      return updated;
    }
    return m;
  });
  return changed ? sortViews(out) : state;
}
