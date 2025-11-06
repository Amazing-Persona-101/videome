import { unpackMeetingTitle } from "./packTitle";
import groups from '$lib/data/group_info.json';
import defaultAppIcon from '$lib/assets/defaultAppIcon.svg';
import { DEFAULT_GROUP_NAME, DEFAULT_GROUP_SUMMARY } from "$lib/constants";

const groupMap = new Map(groups.map((group) => [group.id, group]));

export async function getMeetingDetails(meetingId: string) {
  const meetingResponse = await fetch(`/api/meeting?path=meetings/${meetingId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!meetingResponse.ok) {
    console.error(`Failed to get meeting data for meetingId: ${meetingId}`);
  } else {
    const meetingDataResponse = await meetingResponse.json();
    const meetingData = meetingDataResponse.data;
    const fileNamePrefix = meetingData?.recording_config?.file_name_prefix || '';

    // Unpack the title to get the groupId and summary
    const unpackedTitle = unpackMeetingTitle(fileNamePrefix);
    //console.log(`Found unpackedTitle for meetingId: ${meetingId}`, unpackedTitle);

    // Try to get the group details, if not found, use defaults
    const groupDetails = groupMap.get(unpackedTitle?.g as string);
    //console.log(`Found group details for meetingId: ${unpackedTitle?.g as string}`, groupDetails);

    if (groupDetails) {
      // get the group from groupMap
      const group = groupMap.get(unpackedTitle?.g as string);
      //console.log(`Found group details for meetingId: ${unpackedTitle?.g as string}`, group);
      groupDetails.iconURL = group?.iconURL || '';
    }
    // else {
    //   console.warn(`No group details found for meetingId: ${unpackedTitle?.g as string}. Using default icon.`);
    // }

    return {
      details: {
        group: {
          id: groupDetails?.id || null,
          iconURL: groupDetails?.iconURL || defaultAppIcon,
          name: groupDetails?.name || DEFAULT_GROUP_NAME,
        },
        summary: unpackedTitle?.s || `Wow - ${DEFAULT_GROUP_SUMMARY}`
      }
    };
  }
}

