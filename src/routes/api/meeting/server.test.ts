// src/routes/+server.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Hoisted mocks (env/constants/packTitle) ---
vi.mock('$env/static/private', () => ({
  CF_RTK_API_KEY: 'test_key',
  CF_RTK_ORG_ID: 'test_org',
}));

vi.mock('$lib/constants', () => ({
  CLOUDFLARE_REALTIME_URL: 'https://cf.example/api',
}));

vi.mock('$lib/meetings/packTitle', () => ({
  packMeetingTitle: vi.fn((roomName: any) => `${roomName}--packed`),
}));

// Helper to build JSON Responses
function jsonResponse(obj: any, init: ResponseInit = { status: 200 }) {
  return new Response(JSON.stringify(obj), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) }
  });
}

describe('routes/+server.ts API', () => {
  let handlers: any;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fetchMock = vi.fn();
    // @ts-ignore
    globalThis.fetch = fetchMock;

    vi.resetModules(); // ensure mocks apply before importing the route
    handlers = await import('./+server.ts');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET forwards query to Cloudflare and returns JSON', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: [{ id: 'a' }] }));

    const url = new URL('http://localhost/api/meeting?path=meetings&page_no=2&per_page=50&status=active');
    const res = await handlers.GET({ url } as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: [{ id: 'a' }] });

    // Outgoing call (strips /api/ from path)
    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe('https://cf.example/api/meetings?page_no=2&per_page=50&status=active');
    expect(init.method).toBe('GET');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.headers['Accept']).toBe('application/json');

    const expectedAuth = 'Basic ' + Buffer.from('test_org:test_key').toString('base64');
    expect(init.headers['Authorization']).toBe(expectedAuth);
  });

  it('GET handles fetch failures with 500', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    const url = new URL('http://localhost/api/meeting?path=/api/meetings');
    const res = await handlers.GET({ url } as any)
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({
      success: false, error: 'Internal server error'
    });
  });

  it('POST creates meeting then adds user; returns success payload', async () => {
    // 1) create meeting
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { id: 'm1', title: 'Room' } }));
    // 2) add user
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { id: 'u1', name: 'Alice' } }));

    const payload = {
      image: 'https://img/u.png',
      live_stream: 1,
      meeting_mode: 'group',
      roomName: 'My Room',
      rtmp_url: 'rtmp://example/live',
      userName: 'Alice',
      groupId: 'g123',
      summary: 'summary text',
      userId: 'user-42',
      watermark_enabled: true,
      watermark_position: 'left top',
      watermark_url: 'https://cdn/wm.png'
    };

    const req = new Request('http://localhost/api/meeting', { method: 'POST', body: JSON.stringify(payload) });
    const res = await handlers.POST({ request: req } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.meeting.id).toBe('m1');
    expect(body.user.id).toBe('u1');

    // First fetch: /meetings
    const [url1, init1] = fetchMock.mock.calls[0];
    expect(url1).toBe('https://cf.example/api/meetings');
    expect(init1.method).toBe('POST');
    const sent1 = JSON.parse(init1.body as string);
    expect(sent1.title).toBe('My Room');
    expect(sent1.live_stream_on_start).toBe(true);
    // recording_config.file_name_prefix uses packMeetingTitle(roomName,…)
    expect(sent1.recording_config?.file_name_prefix).toBe('My Room--packed');
    expect(sent1.recording_config?.video_config?.watermark?.url).toBe('https://cdn/wm.png');

    // Second fetch: /participants
    const [url2, init2] = fetchMock.mock.calls[1];
    expect(url2).toBe('https://cf.example/api/meetings/m1/participants');
    expect(init2.method).toBe('POST');
    const sent2 = JSON.parse(init2.body as string);
    expect(sent2).toMatchObject({
      name: 'Alice',
      picture: 'https://img/u.png',
      custom_participant_id: 'user-42'
    });
  });

  it('POST validates profanity fields - roomName', async () => {
    const req = new Request('http://localhost/api/meeting', {
      method: 'POST', body: JSON.stringify({
        roomName: 'chulo',
        summary: 'summary',
      })
    });
    await expect(handlers.POST({ request: req } as any)).rejects.toMatchObject({ status: 400 });
  });

  it('POST validates profanity fields - roomName', async () => {
    const req = new Request('http://localhost/api/meeting', {
      method: 'POST', body: JSON.stringify({
        roomName: 'test name',
        summary: 'chulo',
      })
    });
    await expect(handlers.POST({ request: req } as any)).rejects.toMatchObject({ status: 400 });
  });

  it('POST validates required fields (userName, roomName, userId)', async () => {
    const req = new Request('http://localhost/api/meeting', { method: 'POST', body: JSON.stringify({}) });
    await expect(handlers.POST({ request: req } as any)).rejects.toMatchObject({ status: 400 });
  });

  it('PUT adds a user to an existing meeting', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { id: 'u2', name: 'Bob' } }));

    const req = new Request('http://localhost/api/meeting', {
      method: 'PUT',
      body: JSON.stringify({
        username: 'Bob',
        userId: 'user-77',
        meetingId: 'm9',
        preset_name: 'group_call_participant',
        image: 'https://img/bob.png'
      })
    });

    const res = await handlers.PUT({ request: req } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.id).toBe('u2');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://cf.example/api/meetings/m9/participants');
    const sent = JSON.parse(init.body as string);
    expect(sent).toMatchObject({
      name: 'Bob',
      picture: 'https://img/bob.png',
      preset_name: 'group_call_participant',
      custom_participant_id: 'user-77'
    });
  });

  it('PUT validates required fields (username, userId, meetingId)', async () => {
    const req = new Request('http://localhost/api/meeting', { method: 'PUT', body: JSON.stringify({}) });
    const res = await handlers.PUT({ request: req } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ success: false, error: 'Error in PUT handler' });
  });
});
