import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createMeeting } from './createMeeting';

type CreateMeetingOverrides = {
  roomName: string;
  hostSummary: string;
}

const overRides: CreateMeetingOverrides = {
  roomName: 'Room 1',
  hostSummary: 'Host Summary'
}

// Mock the external modules
vi.mock('./identity/storage', () => ({
  saveIdentity: vi.fn(),
  saveToken: vi.fn(),
}));
vi.mock('svelte-sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock the global fetch function
global.fetch = vi.fn();

describe('createMeeting', () => {
  // A mock form data object to be used in tests
  const mockFormData = new FormData();
  mockFormData.append('image', 'https://example.com/avatar.jpg');
  mockFormData.append('userName', 'John Doe');
  mockFormData.append('userId', 'user123');
  mockFormData.append('vibe', 'fun');

  beforeEach(() => {
    // Reset all mocks before each test to ensure a clean slate
    vi.clearAllMocks();
  });

  it('should successfully create a meeting and save identity/token on a successful API call', async () => {
    // Mock a successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        meeting: { id: 'meeting123', title: 'New Meeting' },
        user: { token: 'mock-token' },
      }),
    });

    const result = await createMeeting(mockFormData, overRides);

    // Assert the fetch function was called with the correct parameters
    expect(fetch).toHaveBeenCalledWith('/api/meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: 'https://example.com/avatar.jpg',
        userName: 'John Doe',
        userId: 'user123',
        vibe: 'fun',
        roomName: 'Room 1',
        summary: 'Host Summary',
      }),
    });

    // Assert the result is a success and contains the correct data
    expect(result.success).toBe(true);
    expect(result.meeting).toEqual({ id: 'meeting123', title: 'New Meeting' });
    expect(result.user).toEqual({ token: 'mock-token' });

    // Assert that the saveIdentity and saveToken functions were called
    const { saveIdentity, saveToken } = await import('./identity/storage');
    expect(saveIdentity).toHaveBeenCalledWith({
      avatar: 'https://example.com/avatar.jpg',
      name: 'John Doe',
      userId: 'user123',
    });
    expect(saveToken).toHaveBeenCalledWith('mock-token');
  });

  it('should return a failure result and display a toast message on a failed API call (non-ok response)', async () => {
    // Mock a failed API response (e.g., status 400)
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Validation failed' }),
    });

    const result = await createMeeting(mockFormData, overRides);

    // Assert the result is a failure and contains an error message
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to create meeting');

    // Assert that a toast error message was displayed and no data was saved
    const { toast } = await import('svelte-sonner');
    const { saveIdentity, saveToken } = await import('./identity/storage');
    expect(toast.error).toHaveBeenCalledWith('Failed to create meeting');
    expect(saveIdentity).not.toHaveBeenCalled();
    expect(saveToken).not.toHaveBeenCalled();
  });

  it('should return a failure result and display a toast message on an exception during the API call', async () => {
    // Mock a network error by rejecting the fetch promise
    const mockError = new Error('Network error');
    fetch.mockRejectedValueOnce(mockError);

    const result = await createMeeting(mockFormData, overRides);

    // Assert the result is a failure and contains the error message
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');

    // Assert that a toast error message was displayed and no data was saved
    const { toast } = await import('svelte-sonner');
    const { saveIdentity, saveToken } = await import('./identity/storage');
    expect(toast.error).toHaveBeenCalledWith('Network error');
    expect(saveIdentity).not.toHaveBeenCalled();
    expect(saveToken).not.toHaveBeenCalled();
  });
});
