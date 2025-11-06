import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { setupI18nMock } from '$lib/tests/mocks/i18n';
import Page from './+page.svelte';

// Set up the i18n mock before all tests
setupI18nMock();

import { locale } from 'svelte-i18n';

// 1) Prevent onMount realtime init during tests
vi.mock('$app/environment', () => ({ browser: false, dev: true }));

// 2) Mock navigation so Cancel can be asserted
const gotoMock = vi.fn();
vi.mock('$app/navigation', () => ({ goto: (...args: any[]) => gotoMock(...args) }));

// 3) Utility: build the data prop the page expects
function makeData(overrides: Partial<any> = {}) {
  return {
    meetingId: '123e4567-e89b-42d3-a456-426614174000',
    title: 'Fun Room',
    host: {
      name: 'Hosty McHost',
      // image: 'https://example.com/host.png',
      image: 'mock://example.com/host.png',  // Changed to a mock URL

      preset_name: 'group_call_host'
    },
    ...overrides,
  };
}

// 4) Helpers to control localStorage for the page
function clearStoredGuest() {
  window.localStorage.removeItem('storedRandomUser');
}

describe('Guest Confirmation Page (+page.svelte)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearStoredGuest();
    gotoMock.mockReset();
    locale.set('en');
  });

  it('when no stored guest, shows avatar type picker first', async () => {
    render(Page, { props: { data: makeData() } });

    // Expect a heading/label that hints at choosing an avatar type.
    // Adjust this query to match your actual text if different.
    const pickerHeading =
      screen.queryByText("Choose a graphic avatar style. We'll generate a name and image.") ||
      screen.queryByTestId('avatar-selector');

    expect(pickerHeading).toBeTruthy();

    // Should show 4 options; if your buttons have accessible names (Robot/Monster/Head/Cat), assert those:
    // Fallback: find 4 buttons inside the picker section.
    const allButtons = screen.getAllByTestId('vibe-chooser');;
    // Filter likely option buttons by text; tweak labels to match your UI
    const optionButtons = allButtons.filter(btn =>
      /robot|monster|head|cat/i.test(btn.textContent || '')
    );

    // If your UI uses images/cards instead of button text, switch to querying by alt text or testids.
    expect(optionButtons.length).toBeGreaterThanOrEqual(4);
  });

});
