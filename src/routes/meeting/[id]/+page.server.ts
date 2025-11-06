import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// UUID regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = (async ({ params, fetch }) => {

  if (!params.id || !UUID_REGEX.test(params.id)) {
    console.warn(`Invalid meeting id`)
    redirect(307, '/')
  }

  const meetingId = params.id

  try {
    const [meetingResponse, participantsResponse] = await Promise.all([
      fetch(`/api/meeting?path=meetings/${meetingId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`/api/meeting?path=meetings/${meetingId}/participants`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    ]);

    if (!meetingResponse.ok) {
      throw new Error('Failed to get meeting data');
    }
    if (!participantsResponse.ok) {
      throw new Error('Failed to get participants data');
    }

    const [meetingData, participantsData] = await Promise.all([
      meetingResponse.json(),
      participantsResponse.json()
    ]);

    // Select the admin from the participantsData.data array
    const admin = participantsData.data.find((participant: any) => {
      //console.log('participant:', participant);
      return participant.preset_name === 'group_call_host' || participant.preset_name === 'webinar_presenter'
    }
    );

    // If no admin is found, redirect to the main page
    if (!admin) {
      console.warn('No admin found!')
      redirect(307, '/');
    }

    const meetingDetails = {
      meetingId,
      title: meetingData?.data?.title || 'Meeting',
      host: {
        name: admin?.name,
        image: admin?.picture,
        preset_name: admin?.preset_name
      }
    };

    //console.log('Meeting details:', meetingDetails);

    return meetingDetails;
  } catch (error) {
    console.error('Error fetching meeting data:', error);
    redirect(307, '/');
  }
});