
import { vi } from 'vitest';

export function setupI18nMock() {
  vi.mock('svelte-i18n', () => {
    const translations = {
      'avatar.choose': 'Choose your avatar style..',
      'avatar.robot': 'robot',
      'avatar.monster': 'monster',
      'avatar.head': 'head',
      'avatar.cat': 'cat',
      'avatar.weWillCreate': 'We\'ll create a name and image for you!',
      'avatar.chooseThisStyle': 'Choose this style',
      'header.startVideo': 'Start Video',
      'locale-switch.lang.fr': 'French',
      'main.liveMeetings': 'Live Meetings',
      'main.noMeetingsYet': 'No Meetings Yet',
      'main.startAMeeting': 'Start a Meeting!',
      'main.total': 'total',
      'meeting.addWatermark': 'Add a watermark (Coming Soon)',
      'meeting.liveStream': 'Live stream this meeting (Coming Soon)',
      'meeting.createNewVideo': 'Create a New Video',
      'meeting.pickRoomName': 'Pick a room name, choose the format, and go live.',
      'meeting.position': 'Position',
      'meeting.roomName': 'Room Name',
      'meeting.userName': 'Your Name',
      'meeting.sampleSummary': 'e.g., Weekly standup about release planning',
      'meeting.watermarkURL': 'Watermark URL',
      'util.chooseLanguage': 'Choose Language',
      'utils.agreeTOS': 'I agree to the site’s Terms of Service and I am of legal adult age in my jurisdiction.',
      // Add more translations as needed
    };

    const mockTranslate = vi.fn((key, vars) => {
      let translation = translations[key] || key;
      if (vars) {
        Object.keys(vars).forEach(varKey => {
          translation = translation.replace(`{${varKey}}`, vars[varKey]);
        });
      }
      return translation;
    });

    return {
      init: vi.fn(),
      locale: {
        set: vi.fn(),
        subscribe: vi.fn()
      },
      t: mockTranslate,
      _: {
        subscribe: (fn) => {
          fn(mockTranslate);
          return { unsubscribe: vi.fn() };
        }
      }
    };
  });
}