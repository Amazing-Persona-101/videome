/// <reference types="svelte" />
import { fromCurrSessions, applyMessage as mergeApply, tick } from './merge';
import type { IncomingMessage, MeetingView, Session } from './types';

// Exported reactive state. Do not reassign the variable (Svelte 5 rule).
export const meetings = $state<MeetingView[]>([]);

// Connection/UX guards for empty-state
// Wrap primitives so we can mutate props (not reassign the binding)
export const ui = $state({
  wsReady: false,
  lastNonEmptyAt: 0
});

let tickTimer: ReturnType<typeof setInterval> | null = null;

export function initMeetings(curr: Session[]) {
  const next = fromCurrSessions(curr);
  // mutate in-place; do NOT do: meetings = next
  meetings.splice(0, meetings.length, ...next);
  if (meetings.length > 0) ui.lastNonEmptyAt = Date.now();

  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    const t = tick(meetings);
    if (t !== meetings) {
      meetings.splice(0, meetings.length, ...t);
      if (meetings.length > 0) ui.lastNonEmptyAt = Date.now();
    }
  }, 10_000);
}

export function applyMeetingMessage(msg: IncomingMessage) {
  const next = mergeApply(meetings, msg);
  //console.log(`Next meeting state:`, next);
  meetings.splice(0, meetings.length, ...next);
  if (meetings.length > 0) {
    ui.lastNonEmptyAt = Date.now();
  }
  //console.log(`Updated meeting state:`, meetings);
}

export function setWsReady(ready: boolean) {
  ui.wsReady = ready;
}

export function destroyMeetings() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = null;
  ui.wsReady = false;
}
