// createMeeting.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMeeting } from './createMeeting';
import { saveIdentity, saveToken } from './identity/storage';
import { toast } from 'svelte-sonner';

type CreateMeetingOverrides = {
  roomName: string;
  hostSummary: string;
}

const overRides: CreateMeetingOverrides = {
  roomName: 'Room 1',
  hostSummary: 'Host Summary'
}

// Mock dependencies
vi.mock('./identity/storage', () => ({
  saveIdentity: vi.fn(),
  saveToken: vi.fn()
}));

vi.mock('svelte-sonner', () => ({
  toast: {
    error: vi.fn()
  }
}));

describe('createMeeting', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a meeting successfully', async () => {
    const mockResponse = {
      meeting: { id: '123' },
      user: { token: 'abc123' }
    };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const formData = new FormData();
    formData.append('image', 'avatar.png');
    formData.append('userName', 'John Doe');
    formData.append('userId', 'user123');

    const result = await createMeeting(formData, overRides);

    expect(result).toEqual({
      success: true,
      meeting: mockResponse.meeting,
      user: mockResponse.user
    });
    expect(saveIdentity).toHaveBeenCalledWith({
      avatar: 'avatar.png',
      name: 'John Doe',
      userId: 'user123'
    });
    expect(saveToken).toHaveBeenCalledWith('abc123');
    expect(fetchMock).toHaveBeenCalledWith('/api/meeting', expect.any(Object));
  });

  it('should handle API errors', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false
    });

    const formData = new FormData();
    const result = await createMeeting(formData, overRides);

    expect(result).toEqual({
      success: false,
      error: 'Failed to create meeting'
    });
    expect(toast.error).toHaveBeenCalledWith('Failed to create meeting');
    expect(saveIdentity).not.toHaveBeenCalled();
    expect(saveToken).not.toHaveBeenCalled();
  });

  it('should handle network errors', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const formData = new FormData();
    const result = await createMeeting(formData, overRides);

    expect(result).toEqual({
      success: false,
      error: 'Network error'
    });
    expect(toast.error).toHaveBeenCalledWith('Network error');
    expect(saveIdentity).not.toHaveBeenCalled();
    expect(saveToken).not.toHaveBeenCalled();
  });
});