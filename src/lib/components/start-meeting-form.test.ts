import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';

import { loadIdentity, type StoredIdentity } from '$lib/identity/storage';
import { setupI18nMock } from '$lib/tests/mocks/i18n';
import StartMeetingForm from './start-meeting-form.svelte';

// Set up the i18n mock before all tests
setupI18nMock();

import { locale } from 'svelte-i18n';

// Mock the external dependencies
vi.mock('$lib/identity/storage', async (importOriginal) => {
  const mod = await importOriginal<typeof import('$lib/identity/storage')>();
  return {
    ...mod,
    loadIdentity: vi.fn(),
  };
});

vi.mock('$lib/data/group_info.json', () => ({
  default: [
    { id: '1', name: 'Group A', iconURL: null },
    { id: '2', name: 'Group B', iconURL: 'https://example.com/iconB.png' },
  ],
}));

vi.mock('svelte-sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock the child components to prevent them from causing errors, as their internal logic is not under test here.
vi.mock('./AvatarSelector.svelte', () => ({
  default: vi.fn(() => ({
    props: { avatarSelected: vi.fn() },
    on: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock('./GroupSelector.svelte', () => ({
  default: vi.fn(() => ({
    props: { groups: [], groupSelected: vi.fn(), summary: '' },
    on: vi.fn(),
    destroy: vi.fn(),
  })),
}));

describe('StartMeetingForm', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    locale.set('en');
  });

  // Test 1: Component renders correctly in the `needsAvatarSelect` state
  // it('should render AvatarSelector when no identity is found', async () => {

  //   vi.mock("$app/state", async () => {
  //     // This is to avoid mocking of other logic implemented in $app/state,
  //     // it can be omitted if you don't care about it.
  //     const original = await vi.importActual("$app/state");

  //     return {
  //       ...original,
  //       needsAvatarSelect: true,
  //     };
  //   });
  //   loadIdentity.mockReturnValue(null);
  //   render(StartMeetingForm);

  //   await waitFor(() => {
  //     expect(screen.getByTestId('avatar-selector')).toBeInTheDocument();
  //   });
  //   expect(screen.queryByText('Create a New Video')).not.toBeInTheDocument();
  // });

  // Test 2: Component renders correctly when an identity is found
  it('should render the form when identity is found', async () => {
    const mockIdentity: StoredIdentity = {
      avatar: 'mock-avatar-url',
      name: 'Mock User',
      userId: 'mock-uid'
    };
    loadIdentity.mockReturnValue(mockIdentity);

    render(StartMeetingForm);

    await waitFor(() => {
      expect(screen.getByText('Create a New Video')).toBeInTheDocument();
    });

    expect(screen.getByText('Your Name:')).toBeInTheDocument();
    expect(screen.getByText('Mock User')).toBeInTheDocument();
    expect(screen.getByLabelText('Room Name:')).toBeInTheDocument();
  });

  it('should toggle live stream and watermark options', async () => {
    const mockIdentity: StoredIdentity = {
      avatar: 'mock-avatar-url',
      name: 'Mock User',
      userId: 'mock-uid'
    };
    loadIdentity.mockReturnValue(mockIdentity);

    render(StartMeetingForm);

    await waitFor(() => {
      expect(screen.getByText('Create a New Video')).toBeInTheDocument();
    });

    // Find the collapsible triggers
    const advancedTrigger = screen.getByRole('button', { name: /Toggle advanced options/ });

    // Initially hidden
    expect(screen.queryByLabelText('RTMP URL')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Watermark URL')).not.toBeInTheDocument();

    // Open Advanced section
    await fireEvent.click(advancedTrigger);

    // Now we should be able to find the checkboxes
    const liveStreamCheckbox = screen.getByLabelText(/Live stream this meeting/);
    const watermarkCheckbox = screen.getByLabelText(/Add a watermark/);

    // Check live stream option
    await fireEvent.click(liveStreamCheckbox);
    expect(screen.getByLabelText('RTMP URL')).toBeInTheDocument();

    // Check watermark option
    await fireEvent.click(watermarkCheckbox);
    expect(screen.getByLabelText('Watermark URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Position')).toBeInTheDocument();
  });

  // Test 5: Check if the correct initial `meeting_mode` is set
  it('should use the defaultMode prop for meeting mode', async () => {
    const mockIdentity: StoredIdentity = {
      avatar: 'mock-avatar-url',
      name: 'Mock User',
      userId: 'mock-uid'
    };
    loadIdentity.mockReturnValue(mockIdentity);

    render(StartMeetingForm, { defaultMode: 'conference' });

    await waitFor(() => {
      expect(screen.getByText('Create a New Video')).toBeInTheDocument();
    });

    // The Group selector should be shown
    expect(screen.getByTestId('group-selector')).toBeInTheDocument();
  });
});
