// createMeeting.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type CreateMeetingOverrides = {
  roomName: string;
  hostSummary: string;
}

const overRides: CreateMeetingOverrides = {
  roomName: 'Room 1',
  hostSummary: 'Host Summary'
}

vi.mock('svelte-sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() }
}));

vi.mock('./identity/storage', () => ({
  saveIdentity: vi.fn(),
  saveToken: vi.fn()
}));

// Small helper to produce a fetch Response with JSON
function jsonResponse(obj: any, init: ResponseInit = { status: 200 }) {
  return new Response(JSON.stringify(obj), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) }
  });
}

describe('createMeeting(formData)', async () => {
  let createMeeting: (fd: FormData, overRides: CreateMeetingOverrides) => Promise<any>;
  let fetchMock: ReturnType<typeof vi.fn>;
  const { toast } = await import('svelte-sonner');
  const { saveIdentity, saveToken } = await import('./identity/storage');

  beforeEach(async () => {
    vi.resetModules();
    fetchMock = vi.fn();
    // @ts-ignore
    globalThis.fetch = fetchMock;

    // Re-import after mocks are ready
    ({ createMeeting } = await import('./createMeeting'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits, stores identity & token, and returns { success, meeting, user } on success', async () => {
    const meeting = { id: 'm1', title: 'Room' };
    const user = { id: 'u1', name: 'Alice', token: 'tok-123' };

    // If your implementation makes only one call and gets both meeting and user, this is enough:
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, meeting, user }));

    // If you instead make two calls (create meeting then add user), you can also do:
    // fetchMock
    //   .mockResolvedValueOnce(jsonResponse({ success: true, meeting }))
    //   .mockResolvedValueOnce(jsonResponse({ success: true, user }));

    const fd = new FormData();
    fd.set('image', 'https://img/u.png');
    fd.set('userName', 'Alice');
    fd.set('userId', 'user-42');

    const res = await createMeeting(fd, overRides);

    // Return shape
    expect(res).toEqual({ success: true, meeting, user });

    // Identity persisted from FormData (as your file shows)
    expect(saveIdentity).toHaveBeenCalledTimes(1);
    expect(saveIdentity).toHaveBeenCalledWith({
      avatar: 'https://img/u.png',
      name: 'Alice',
      userId: 'user-42'
    });

    // Token persisted from user.token
    expect(saveToken).toHaveBeenCalledTimes(1);
    expect(saveToken).toHaveBeenCalledWith('tok-123');

    // No error toast on success
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('handles thrown/rejected errors: shows toast and returns { success:false, error }', async () => {
    fetchMock.mockRejectedValueOnce(new Error('boom'));

    const fd = new FormData();
    fd.set('image', 'https://img/u.png');
    fd.set('userName', 'Alice');
    fd.set('userId', 'user-42');

    const res = await createMeeting(fd, overRides);

    expect(res).toEqual({ success: false, error: 'boom' });
    expect(toast.error).toHaveBeenCalledWith('boom');

    // Should not store identity/token on failure
    const { saveIdentity, saveToken } = await import('./identity/storage');
    expect(saveIdentity).not.toHaveBeenCalled();
    expect(saveToken).not.toHaveBeenCalled();
  });

  it('falls back to a generic error message when the thrown value lacks .message', async () => {
    // Throw a non-Error value (no .message)
    // @ts-ignore
    fetchMock.mockRejectedValueOnce({});

    const fd = new FormData();
    const res = await createMeeting(fd, overRides);

    expect(res).toEqual({ success: false, error: 'Failed to create meeting' });
    expect(toast.error).toHaveBeenCalledWith('Failed to create meeting');
  });
});
