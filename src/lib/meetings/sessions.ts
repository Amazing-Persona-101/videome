
import { redirect } from '@sveltejs/kit';
import type { Session } from '$lib/meetings/types';
import { latestByAssociatedId } from '$lib/meetings/filterSessions';
import { unpackMeetingTitle } from '$lib/meetings/packTitle';
import groups from '$lib/data/group_info.json';
import defaultAppIcon from '$lib/assets/defaultAppIcon.svg';
import { DEFAULT_GROUP_NAME, DEFAULT_GROUP_SUMMARY } from '$lib/constants';

const groupMap = new Map(groups.map(group => [group.id, group]));
const idsToRemove = ['f12ceaf1-6833-4cd3-aefa-f10fa572b1e9'];

function removeEntriesByIds<T extends { id: string }>(array: T[], idsToRemove: string[]): T[] {
  // Create a Set from the idsToRemove for faster lookup
  const idSet = new Set(idsToRemove);

  // Filter the array, keeping only items whose ids are not in the Set
  return array.filter(item => !idSet.has(item.id));
}

export async function getLiveSessions(fetch: typeof globalThis.fetch): Promise<Session[]> {
  const response = await fetch('/api/meeting?path=sessions&per_page=1000&status=LIVE', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    console.error('Failed to get session data');
    redirect(307, '/');
  }

  const data = await response.json();

  // There may be multiple sessions with the same associated_id
  // We only want the latest one for each associated_id
  const sessions = latestByAssociatedId(data?.data?.sessions || []);
  const filteredSessions = removeEntriesByIds(sessions, idsToRemove);

  // for each session, call the api to get the meeting details, pass the returned recording_config/file_name_prefix to unpackMeetingTitle.  then use the g attribute of the returned value to retrive the iconURL from group_info.json and add it to the session object.  Append the returned s attribute as the suumary attribute of the session object.
  for (const session of filteredSessions) {
    const meetingResponse = await fetch(`/api/meeting?path=meetings/${session.associated_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!meetingResponse.ok) {
      console.error(`Failed to get meeting data for session ${session.id}`);
      continue;
    }

    const meetingDataResponse = await meetingResponse.json();
    const meetingData = meetingDataResponse.data;
    const fileNamePrefix = meetingData?.recording_config?.file_name_prefix || '';

    // Unpack the title to get the groupId and summary
    const unpackedTitle = unpackMeetingTitle(fileNamePrefix);

    // Try to get the group details, if not found, get a random group
    const groupDetails = groupMap.get(unpackedTitle?.g as string);

    // Set additional session properties
    session.details = {
      group: {
        name: groupDetails?.name || DEFAULT_GROUP_NAME,
        iconURL: groupDetails?.iconURL || defaultAppIcon,
        id: groupDetails?.id || null
      },
      summary: unpackedTitle?.s || DEFAULT_GROUP_SUMMARY
    };
  }
  return filteredSessions;
}
