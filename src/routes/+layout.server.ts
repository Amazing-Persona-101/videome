
import type { LayoutServerLoad } from './$types';
import { USE_CANNED_RTK_RESPONSES } from '$lib/constants';
import type { Session } from '$lib/meetings/types';
import { cannedRTKResponses } from '$lib/cannedRTKResponses';
import { getLiveSessions } from '$lib/meetings/sessions';



export const load = (async ({ fetch }) => {
  let filteredSessions: Session[] = [];

  if (USE_CANNED_RTK_RESPONSES) {
    interface CannedGetResponse { data?: { sessions?: Session[] } }
    const canned = (cannedRTKResponses as Record<string, CannedGetResponse>)['sessions.get'];
    filteredSessions = canned?.data?.sessions ?? [];
  } else {
    filteredSessions = await getLiveSessions(fetch);
  }

  return {
    sessions: filteredSessions
  };
}) satisfies LayoutServerLoad;