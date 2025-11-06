import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ShareLink from '$lib/components/shareLink.svelte';
import { showShareModal } from '$lib/stores/modalStore.svelte';

// Mock the navigator.clipboard API
const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockClipboardWriteText,
  },
  writable: true,
});

describe('ShareLink', () => {
  // Reset the mock before each test to ensure a clean state
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('copies the URL to the clipboard when the modal opens', async () => {
    // Render the component with mock props
    render(ShareLink, {
      meetingHost: 'TestHost',
      meetingId: '12345',
      meetingTitle: 'Test Meeting',
    });

    // The component uses a Svelte store. To trigger the logic, we need to set the store's value.
    showShareModal.open = true;

    // Await the effect to run
    await vi.waitFor(() => {
      // Check that the mock clipboard function was called
      expect(mockClipboardWriteText).toHaveBeenCalledWith(
        'http://localhost:3000/meeting/12345'
      );
    });
  });
});
