import { browser } from '$app/environment';
import { derived } from 'svelte/store';
import { init, register, locale } from 'svelte-i18n';
import { getLanguageFileNames, loadLanguage } from '$lib/languageLoader';

const fileNames = getLanguageFileNames();

fileNames.forEach((lang) => {
  register(lang, () => loadLanguage(lang));
});

init({
  initialLocale: browser ? window.navigator.language : 'en',
  fallbackLocale: 'en'
});

export const isLocaleLoaded = derived(locale, ($locale) => typeof $locale === 'string');

export const escapeHtml = (unsafe: string): string => {
  const replacements: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return unsafe.replace(/[&<>"']/g, match => replacements[match]);
}