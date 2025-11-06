import { vi } from 'vitest';

/**
 * Builds a mock Request object with form data for SvelteKit actions.
 */
export const buildRequest = (data: Record<string, any>): Request => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value);
  }

  return new Request('http://localhost', {
    method: 'POST',
    body: formData,
  });
};

/**
 * Mocks a JSON response using the native Response API.
 */
export const mockJsonResponse = (data: any, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as unknown as Response;
};



/**
 * Mocks SvelteKit's platform/env variables.
 */
export const mockEnv = (vars: Record<string, string>) => {
  vi.stubEnv('CF_RTK_ORG_ID', vars.CF_RTK_ORG_ID);
  vi.stubEnv('CF_RTK_API_KEY', vars.CF_RTK_API_KEY);
};

/**
 * Mocks SvelteKit's redirect and fail helpers (if needed in tests).
 */
export const mockSvelteKit = () => {
  const redirectMock = vi.fn((status: number, location: string) => {
    const e = new Error(`Redirect ${status} to ${location}`);
    (e as any).status = status;
    (e as any).location = location;
    throw e;
  });

  return { redirectMock };
};
