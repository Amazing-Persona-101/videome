import { CF_RTK_API_KEY, CF_RTK_ORG_ID } from '$env/static/private';
import { CLOUDFLARE_REALTIME_URL, DOMAIN_URL } from '$lib/constants';
import { packMeetingTitle } from '$lib/meetings/packTitle';
import { sanitizeInput, validateDescription, validateRoomName } from '$lib/utils/validation';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

let authToken: string | null = null;
try {
  // Use Buffer to create the base64 encoded auth token.
  // This is a one-time setup on server start.
  authToken = Buffer.from(`${CF_RTK_ORG_ID}:${CF_RTK_API_KEY}`).toString('base64');
} catch (error) {
  console.error('SERVER_ERROR: Error encoding Cloudflare Realtime API credentials:', error);
  throw new Error('Failed to encode Cloudflare Realtime API credentials.');
}
if (!authToken) {
  console.error('SERVER_ERROR: Cloudflare Realtime API credentials are not set or are invalid.');
  throw new Error('Cloudflare Realtime API credentials are not set.');
}

// Ensure the authToken is valid
if (!authToken || typeof authToken !== 'string' || authToken.length === 0) {
  console.error('Invalid Cloudflare Realtime API authToken:', authToken);
  throw new Error('Invalid Cloudflare Realtime API authToken.');
}

async function createMeeting(fetch: any, meetingParams:
  {
    title: string;
    live_stream_on_start: boolean;
    recording_config?: {
      max_seconds: number;
      file_name_prefix: string;
      video_config: {
        codec: string;
        width: number;
        height: number;
        watermark: {
          url: string;
          size: {
            width: number;
            height: number;
          };
          position: string;
        };
        export_file: boolean;
      };
    } | null;
    live_streaming_config?: { rtmp_url: string; } | null;
  }) {
  try {
    // console.log('Creating meeting with params:', JSON.stringify(meetingParams));
    const response = await fetch(`${CLOUDFLARE_REALTIME_URL}/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authToken}`
      },
      body: JSON.stringify(
        meetingParams
      )
    });

    if (!response || !response.ok) {
      console.error('Failed to create meeting error:', response);
      return { success: false, error: `Failed to create meeting returned: ${response?.statusText || 'Internal Server Error'}` };
    }

    const { success, data } = await response.json();
    if (!success || !data) {
      throw new Error('Invalid response from Cloudflare Realtime API to create meeting');
    }

    if (!data.id) {
      return { success: false, error: 'Invalid response from Cloudflare Realtime API' };
    }
    return { success, data };

  } catch (error) {
    console.error('Error creating meeting:', error);
    return { success: false, error: error.message };
  }
}

async function addUserToMeeting(fetch: any, { meetingId, username, userId, image, preset_name = "group_call_host" }: { meetingId: string; username: string; userId: string; image?: string; preset_name?: string }) {
  try {
    const params = { "name": username, "picture": image, preset_name, "custom_participant_id": userId }
    //console.log(`API_CALL: Adding user '${username}' (ID: '${userId})' to meeting '${meetingId}'`);
    const response = await fetch(`${CLOUDFLARE_REALTIME_URL}/meetings/${meetingId}/participants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authToken}`
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      // Return a structured error object with the status and message
      const errorData = await response.json();
      console.error(`API_ERROR: Failed to add user to meeting '${meetingId}'. Status: ${response.status}, Error: ${JSON.stringify(errorData)}`);
      return {
        success: false,
        error: `API call failed with status ${response.status}. Reason: ${errorData.message}`
      };
    }

    const { success, data } = await response.json();
    if (!success || !data) {
      console.error(`API_ERROR: Invalid response from Cloudflare Realtime API for adding user to meeting '${meetingId}'. Response: ${JSON.stringify(response)}`);
      return {
        success: false,
        error: 'Invalid response from Cloudflare Realtime API to add user to meeting'
      };
    }
    // console.log(`API_SUCCESS: User '${username}' added to meeting '${meetingId}'.`);

    return { success, data };
  } catch (error) {
    console.error(`SERVER_ERROR: Unhandled error adding user to meeting '${meetingId}':`, error);

    return {
      success: false, error: error.message || `SERVER_ERROR: Unhandled error adding user to meeting '${meetingId}'`
    };
  }
}

export const GET: RequestHandler = async ({ url }) => {
  try {

    //console.log(`GET request to searchParams:${JSON.stringify(url.searchParams.get('path'))}.`);
    const path = url.searchParams.get('path');
    const per_page = url.searchParams.get('per_page') || 25;
    const page_no = url.searchParams.get('page_no') || 1;
    const status = url.searchParams.get('status') || null;
    const statusParam = status ? `&status=${status}` : '';
    console.log(`Fetching url from Cloudflare Realtime API path: ${url}`);

    // Remove the leading '/api' from the path
    const apiPath = path?.replace(/^\/api\//, '');
    console.log(`Fetching apiPath from Cloudflare Realtime API path: ${apiPath}`);

    const cfURL = `${CLOUDFLARE_REALTIME_URL}/${apiPath}?page_no=${page_no}&per_page=${per_page}${statusParam}`;
    console.log(`URL to fetch from Cloudflare Realtime API: ${cfURL}`);

    const response = await fetch(cfURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`API_ERROR: Failed to fetch meetings list. Status: ${response.status}, Error: ${JSON.stringify(errorData)}`);
      return json({ success: false, error: `Failed to fetch meetings. Status: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    //console.log(`Fetched ${apiPath} from Cloudflare Realtime API: ${JSON.stringify(data)}`);
    return json(data);
  } catch (e) {
    console.error(`SERVER_ERROR: Unhandled error in GET handler:`, e);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }

};

export const POST: RequestHandler = async ({ request }) => {
  try {

    const postRequest = await request.json();
    console.log('POST request data:', postRequest);

    const {
      image,
      live_stream,
      meeting_mode,
      roomName: tempRoomName,
      userName,
      groupId,
      //rtmp_url,
      summary: tempSummary,
      userId,
      //watermark_enabled,
      watermark_position,
      watermark_url,
    } = postRequest;

    //console.log(`userName: ${userName}, roomName: ${roomName}, meeting_mode: ${meeting_mode}, rtmp_url: ${rtmp_url}, live_stream: ${live_stream}, watermark_url: ${watermark_url}, watermark_position: ${watermark_position}, watermark_enabled: ${watermark_enabled}, userId: ${userId}, image: ${image}, groupId: ${groupId}, summary: ${summary}`);

    const roomName = sanitizeInput(tempRoomName) as string;
    const summary = sanitizeInput(tempSummary);

    const roomNameValidation = validateRoomName(roomName);
    const summaryValidation = validateDescription(summary);

    if (!roomNameValidation.isValid || !summaryValidation.isValid) {
      console.error('Error validating for createMeeting', postRequest);
      throw error(400, 'Error validating for createMeeting');
    }

    if (!userName || !roomName || !userId) {
      throw error(400, 'Missing required fields on POST.');
    }

    // Pack the meeting title with optional groupId and summary
    // to embed metadata in the meeting title for later retrieval.
    // This helps avoid needing a separate database for simple use cases.
    // The summary is truncated to 140 characters to fit within title limits.
    // See src/lib/meetings/packTitle.ts for details.
    // If more metadata is needed, consider using a database instead.
    //console.log('Packing meeting title with metadata:', { roomName, groupId, summary });
    const packedMeetingTitle = packMeetingTitle(roomName, {
      groupId,
      summary,
      summaryMax: 140 // optional; defaults to 140
    });

    const recording_config = {
      "max_seconds": 60,
      "file_name_prefix": packedMeetingTitle,
      "video_config": {
        "codec": "H264",
        "width": 1280,
        "height": 720,
        "watermark": {
          "url": watermark_url ? watermark_url : DOMAIN_URL,
          "size": {
            "width": 100,
            "height": 20
          },
          "position": watermark_position ? watermark_position : "left top"
        },
        "export_file": true
      }
    }

    const meetingParams = {
      "title": roomName,
      //"room_name": packedMeetingTitle,
      "live_stream_on_start": Number(live_stream) ? true : false,
      recording_config
    }

    const meeting = await createMeeting(fetch, meetingParams);
    if (!meeting.success) {
      console.error('Error createMeeting:', meeting.error);
      throw error(500, `Error createMeeting: ${meeting.error}`);
    }

    const userParams = {
      image,
      "meetingId": meeting.data.id,
      "preset_name": meeting_mode === 'conference' ? 'group_call_host' : 'webinar_presenter',
      userId,
      "username": userName,
    }

    const user = await addUserToMeeting(fetch, userParams);
    if (!user.success) {
      console.error('Error addUserToMeeting:', user.error);
      return json({ success: false, error: user.error }, { status: 500 }); // Or a more specific status code if available
    }

    // Redirect to the meeting page
    return json({ success: true, meeting: meeting.data, user: user.data });
  } catch (e) {
    console.error('Error creating meeting or user on POST:', e);
    throw error(e.status || 500, e.message || `Failed to create meeting or user: ${e}`);

  }
};

export const PUT: RequestHandler = async ({ request }) => {
  try {

    try {
      const {
        image,
        meetingId,
        preset_name = "group_call_participant",
        userId,
        username,
      } = await request.json();
      //console.log('PUT request data:', { username, meetingId, userId, image, preset_name });

      if (!username || !userId || !meetingId) {
        throw error(400, 'Missing required fields on PUT.');
      }

      const user = await addUserToMeeting(fetch, { meetingId, username, userId, image, preset_name });
      if (!user.success) {
        console.error('Error addUserToMeeting:', user.error);
        return json({ success: false, error: user.error }, { status: 400 }); // Or a more specific status code if available
      }
      return json({ success: true, user: user.data });
    } catch (e) {
      console.error('SERVER_ERROR: Error in PUT handler:', e);
      return json({ success: false, error: 'Error in PUT handler' }, { status: 400 });
    }
  } catch (e) {
    console.error('SERVER_ERROR: Unhandled error in PUT handler:', e);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });

  }
};

