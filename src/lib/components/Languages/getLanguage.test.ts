// getLanguage.test.ts
import { describe, it, expect } from 'vitest';
import { getLanguageList, getLanguage } from './getLanguage';

describe('getLanguage.ts', () => {

  describe('getLanguageList', () => {
    it('should return an array of language groups', () => {
      const result = getLanguageList();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      console.log('response from call', result); // For debugging purposes

      // Check structure of the first group
      const firstGroup = result[0];
      expect(firstGroup).toHaveProperty('group');
      expect(firstGroup).toHaveProperty('languages');
      expect(Array.isArray(firstGroup.languages)).toBe(true);

      // Check for the English language in any group
      const englishLanguage = result.find(group =>
        group.languages.some(lang => lang.value === 'en' && lang.text === 'English')
      );
      expect(englishLanguage).toBeDefined();

      if (englishLanguage) {
        console.log(`English found in group: ${englishLanguage.group}`);
        const english = englishLanguage.languages.find(lang => lang.value === 'en');
        expect(english).toEqual({ value: 'en', text: 'English' });
      } else {
        console.log('English not found in any group');
      }
    });

    it('should not include empty groups', () => {
      const result = getLanguageList();
      result.forEach(group => {
        expect(group.languages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getLanguage', () => {
    it('should return correct language info for existing language', () => {
      const result = getLanguage('en');
      expect(result).toEqual({
        abbreviation: 'en',
        englishValue: 'English',
        translatedValue: 'English'
      });
    });

    it('should return fallback object for non-existing language', () => {
      const nonExistingLang = 'xx';
      const result = getLanguage(nonExistingLang);
      expect(result).toEqual({
        abbreviation: nonExistingLang,
        englishValue: nonExistingLang,
        translatedValue: nonExistingLang
      });
    });
  });
});