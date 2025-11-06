import type { LayoutLoad } from './$types';
import '$lib/i18n';
import { isLocaleLoaded } from '$lib/i18n';
export const ssr = false

export const load: LayoutLoad = async ({ data }) => {
  return {
    ...data,
    isLocaleLoaded,
    sessions: data?.sessions || []
  };
};