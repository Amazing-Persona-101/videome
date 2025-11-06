import { toast } from 'svelte-sonner';
import { saveIdentity, saveToken } from './identity/storage';
import { USE_CANNED_RTK_RESPONSES } from '$lib/constants';

type CreateMeetingOverrides = {
  roomName: string;
  hostSummary: string;
  simulateTransaction?: boolean;
}

function simulateCreateMeeting(data: any, roomName: string, hostSummary: string) {
  // Simulate a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        meeting: {
          id: 'simulated-meeting-' + Math.random().toString(36).substr(2, 9),
          roomName,
          summary: hostSummary,
          createdAt: new Date().toISOString(),
        },
        user: {
          id: 'simulated-user-' + Math.random().toString(36).substr(2, 9),
          name: data.userName,
          token: 'simulated-token-' + Math.random().toString(36).substr(2, 9),
        }
      });
    }, 500); // Simulate a 500ms delay
  });
}

export async function createMeeting(formData: FormData, { roomName, hostSummary }: CreateMeetingOverrides) {
  const data = Object.fromEntries(formData.entries());
  //console.log('async function createMeeting data:', data);
  const {
    image,
    userName,
    userId,
  } = data

  let meeting;
  let user;

  try {
    let responseData;
    if (USE_CANNED_RTK_RESPONSES) {
      responseData = await simulateCreateMeeting(data, roomName, hostSummary);
    } else {
      const response = await fetch('/api/meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data, roomName, summary: hostSummary
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }

      responseData = await response.json();
    }

    ({ meeting, user } = responseData);

    // Save identity and token to local storage
    saveIdentity({
      avatar: image as string,
      name: userName as string,
      userId: userId as string
    });

    saveToken(user.token);

    return { success: true, meeting, user };
  } catch (error) {
    const errorMessage = error.message || 'Failed to create meeting';

    console.error(errorMessage, error);
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}