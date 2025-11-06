import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // if (event.platform) {
  //   console.log(`Platform: ${JSON.stringify(event.platform)}`);
  // } else {
  //   console.warn('No platform environment found');
  // }

  const response = await resolve(event);
  return response;
};