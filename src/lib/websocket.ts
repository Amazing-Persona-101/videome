import { CF_WEBSOCKET_URL, USE_CANNED_RTK_RESPONSES } from '$lib/constants';
import { cannedRTKResponses } from '$lib/cannedRTKResponses';

export function setupWebSocket() {
  if (USE_CANNED_RTK_RESPONSES) {
    return setupCannedResponses();
  } else {
    return connectToRealWebSocket();
  }
}

function setupCannedResponses() {
  console.log('Using canned RTK responses for WebSocket simulation.');
  const eventTarget = new EventTarget();

  // Simulate WebSocket events
  const simulateEvent = (eventName: string, delay: number) => {
    setTimeout(() => {
      const event = new MessageEvent('message', {
        data: JSON.stringify({
          data: cannedRTKResponses[eventName]
        })
      });
      eventTarget.dispatchEvent(event);
    }, delay);
  };

  // Simulate a series of events
  simulateEvent('meeting.started', 1000);
  simulateEvent('meeting.participantJoined', 3000);
  simulateEvent('meeting.participantLeft', 10000);
  simulateEvent('meeting.ended', 15000);

  // Add more simulated events as needed

  return {
    addEventListener: (type: string, listener: EventListener) => {
      eventTarget.addEventListener(type, listener);
    },
    removeEventListener: (type: string, listener: EventListener) => {
      eventTarget.removeEventListener(type, listener);
    },
    close: () => {
      // Simulate WebSocket closing
      const closeEvent = new CloseEvent('close');
      eventTarget.dispatchEvent(closeEvent);
    }
  };
}

function connectToRealWebSocket() {
  const socket = new WebSocket(CF_WEBSOCKET_URL);
  // Implement real WebSocket connection logic here
  return socket;
}