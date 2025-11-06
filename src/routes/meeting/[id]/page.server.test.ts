// +page.server.test.ts
import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

// IMPORTANT: mock redirect BEFORE importing the module under test
vi.mock('@sveltejs/kit', () => {
  return {
    redirect: (status: number, location: string) => {
      const err: any = new Error('Redirect');
      err.status = status;
      err.location = location;
      throw err;
    }
  };
});

import { load } from './+page.server';

// Helper: build a fetch Response-like object with ok + json()
const makeResp = (data: any, ok = true): Response => {
  return {
    ok,
    json: vi.fn().mockResolvedValue(data)
  } as unknown as Response;
};

const meetingJson = (title?: string) => ({ data: { title } });
const participantsJson = (list: any[]) => ({ data: list });


/** build the { fetch } argument for load() that returns different responses per URL */
const buildFetch = (opts: {
  meetingOk?: boolean;
  meetingData?: any;
  participantsOk?: boolean;
  participantsData?: any;
  // throwers to simulate json parse failures
  meetingJsonThrows?: boolean;
  participantsJsonThrows?: boolean;
}) => {
  const {
    meetingOk = true,
    meetingData = meetingJson('My Meeting'),
    participantsOk = true,
    participantsData = participantsJson([
      { name: 'Admin', picture: 'x.png', preset_name: 'group_call_host' }
    ]),
    meetingJsonThrows = false,
    participantsJsonThrows = false
  } = opts;

  const meetingResp = makeResp(meetingData, meetingOk);
  const participantsResp = makeResp(participantsData, participantsOk);

  if (meetingJsonThrows) {
    // @ts-ignore
    meetingResp.json = vi.fn().mockRejectedValue(new Error('bad meeting json'));
  }
  if (participantsJsonThrows) {
    // @ts-ignore
    participantsResp.json = vi.fn().mockRejectedValue(new Error('bad participants json'));
  }

  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes('/participants')) return participantsResp;
    return meetingResp;
  });

  return { fetch, meetingResp, participantsResp };

}

const callLoad = (id: string | undefined, fetch: any = vi.fn()) =>
  load({ params: { id }, fetch } as any);


describe('+page.server load()', () => {
  beforeEach(() => vi.restoreAllMocks());

  // ----------------------------
  // Param / UUID validation
  // ----------------------------
  it('redirects 307 / when id is missing', async () => {
    await expect(callLoad(undefined as any)).rejects.toMatchObject({
      status: 307,
      location: '/'
    });
  });

  it('redirects 307 / when id is not a UUID v4', async () => {
    await expect(callLoad('not-a-uuid')).rejects.toMatchObject({
      status: 307,
      location: '/'
    });
  });

  it('redirects 307 / when version nibble is not "4"', async () => {
    const v3 = '123e4567-e89b-32d3-a456-426614174000'; // v3
    await expect(callLoad(v3)).rejects.toMatchObject({ status: 307, location: '/' });
  });

  it('redirects 307 / when variant is invalid (not 8|9|a|b)', async () => {
    const badVariant = '123e4567-e89b-42d3-7456-426614174000';
    await expect(callLoad(badVariant)).rejects.toMatchObject({ status: 307, location: '/' });
  });

  // ----------------------------
  // Happy path (both fetches ok)
  // ----------------------------
  it('fetches meeting + participants in Promise.all and returns meetingDetails', async () => {
    const id = '123e4567-e89b-42d3-a456-426614174000';
    const { fetch } = buildFetch({
      meetingData: meetingJson('Cool Title'),
      participantsData: participantsJson([
        { name: 'Alice', picture: 'alice.png', preset_name: 'group_call_host' }
      ])
    });

    const result = await callLoad(id, fetch);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith(`/api/meeting?path=meetings/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(fetch).toHaveBeenCalledWith(`/api/meeting?path=meetings/${id}/participants`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(result).toEqual({
      meetingId: id,
      title: 'Cool Title',
      host: { name: 'Alice', image: 'alice.png', preset_name: 'group_call_host' }
    });
  });

  it('falls back to title "Meeting" when meetingData.data.title is missing', async () => {
    const id = '123e4567-e89b-42d3-a456-426614174000';
    const { fetch } = buildFetch({
      meetingData: { data: {} },
      participantsData: participantsJson([
        { name: 'Admin', picture: 'admin.png', preset_name: 'group_call_host' }
      ])
    });

    const result = await callLoad(id, fetch);
    expect(result.title).toBe('Meeting');
  });

  it('accepts webinar_presenter as admin', async () => {
    const id = '123e4567-e89b-42d3-a456-426614174000';
    const { fetch } = buildFetch({
      meetingData: meetingJson('Webinar'),
      participantsData: participantsJson([
        { name: 'Presenter', picture: 'p.png', preset_name: 'webinar_presenter' }
      ])
    });

    const result = await callLoad(id, fetch);
    expect(result.host).toEqual({
      name: 'Presenter',
      image: 'p.png',
      preset_name: 'webinar_presenter'
    });
  });

  // ----------------------------
  // Error paths (non-ok responses)
  // ----------------------------
  it('redirects when meetingResponse.ok is false', async () => {
    const id = '123e4567-e89b-42d3-a456-426614174000';
    const { fetch } = buildFetch({
      meetingOk: false
    });

    await expect(callLoad(id, fetch)).rejects.toMatchObject({
      status: 307,
      location: '/'
    });
  });

  it('redirects when participantsResponse.ok is false', async () => {
    const id = '123e4567-e89b-42d3-a456-426614174000';
    const { fetch } = buildFetch({
      participantsOk: false
    });

    await expect(callLoad(id, fetch)).rejects.toMatchObject({
      status: 307,
      location: '/'
    });
  });

  // ----------------------------
  // Error paths (JSON parse fails)
  // ----------------------------
  it('redirects when meetingResponse.json rejects', async () => {
    const id = '123e4567-e89b-42d3-a456-426614174000';
    const { fetch } = buildFetch({
      meetingJsonThrows: true
    });

    await expect(callLoad(id, fetch)).rejects.toMatchObject({
      status: 307,
      location: '/'
    });
  });

  it('redirects when participantsResponse.json rejects', async () => {
    const id = '123e4567-e89b-42d3-a456-426614174000';
    const { fetch } = buildFetch({
      participantsJsonThrows: true
    });

    await expect(callLoad(id, fetch)).rejects.toMatchObject({
      status: 307,
      location: '/'
    });
  });

  // ----------------------------
  // No admin found → redirect
  // ----------------------------
  it('redirects when no admin (group_call_host|webinar_presenter) is found', async () => {
    const id = '123e4567-e89b-42d3-a456-426614174000';
    const { fetch } = buildFetch({
      participantsData: participantsJson([
        { name: 'User', picture: 'u.png', preset_name: 'viewer' },
        { name: 'Guest', picture: 'g.png', preset_name: 'cohost' }
      ])
    });

    await expect(callLoad(id, fetch)).rejects.toMatchObject({
      status: 307,
      location: '/'
    });
  });
});