import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import { setupI18nMock } from '$lib/tests/mocks/i18n';
import Page from './+page.svelte';

// Set up the i18n mock before all tests
setupI18nMock();

// Mock the state module to control the meetings and ui state
vi.mock('$lib/meetings/state.svelte', () => {
  // A mock meeting object to use in our tests
  const mockMeeting = {
    id: '123',
    name: 'Test Meeting',
    createdAt: new Date().toISOString(),
    ownerId: 'user123',
    participants: 1
  };

  return {
    // The meetings state, mocked to contain one meeting
    meetings: [mockMeeting],
    // The ui state, mocked to show that it is not empty
    ui: {
      wsReady: true,
      lastNonEmptyAt: Date.now()
    }
  };
});

import { locale } from 'svelte-i18n';

describe('+page.svelte', () => {
  beforeEach(() => {
    // Set the locale before each test
    locale.set('en');
  });

  it('should render the page with meeting cards when meetings are present', () => {
    // Render the component with the mocked state
    render(Page);

    // Assert that the 'Live Meetings' heading is visible
    expect(screen.getByText('Live Meetings')).toBeInTheDocument();

    // Assert that the correct total count is displayed
    expect(screen.getByText('1 total')).toBeInTheDocument();

    // Assert that the empty state heading is NOT visible
    expect(screen.queryByText('Start a Meeting!')).not.toBeInTheDocument();

    // You could also add a check for the MeetingCard component itself,
    // if it were given a test ID.
  });
});
