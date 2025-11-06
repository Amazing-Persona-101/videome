import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadIdentity,
  loadToken,
  saveIdentity,
  saveToken,
  clearStorage,
  type Identity,
  type UserToken,
  type GroupInfo
} from './storage';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    }
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });


describe('Identity Storage', () => {
  const mockIdentity: Identity = {
    avatar: 'https://example.com/avatar.png',
    name: 'Test User',
    userId: 'user123'
  };

  const mockToken: UserToken = 'test-token-123';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage?.clear();
    // Restore the original localStorage methods
    vi.restoreAllMocks();
  });

  describe('loadIdentity', () => {
    it('should return null if localStorage is undefined', () => {
      vi.spyOn(global, 'localStorage', 'get').mockReturnValue(undefined);
      expect(loadIdentity()).toBeNull();
    });

    it('should return null if no identity is stored', () => {
      expect(loadIdentity()).toBeNull();
    });

    it('should return the stored identity', () => {
      localStorage.setItem('guestIdentity', JSON.stringify(mockIdentity));
      expect(loadIdentity()).toEqual(mockIdentity);
    });

    it('should return null for invalid stored data', () => {
      localStorage.setItem('guestIdentity', 'invalid-json');
      expect(loadIdentity()).toBeNull();
    });

    it('should use a custom key if provided', () => {
      localStorage.setItem('customKey', JSON.stringify(mockIdentity));
      expect(loadIdentity('customKey')).toEqual(mockIdentity);
    });
  });

  describe('loadToken', () => {
    it('should return null if localStorage is undefined', () => {
      vi.spyOn(global, 'localStorage', 'get').mockReturnValue(undefined);
      expect(loadToken()).toBeNull();
    });

    it('should return null if no token is stored', () => {
      expect(loadToken()).toBeNull();
    });

    it('should return the stored token', () => {
      localStorage.setItem('userToken', mockToken);
      expect(loadToken()).toBe(mockToken);
    });

    it('should use a custom key if provided', () => {
      localStorage.setItem('customTokenKey', mockToken);
      expect(loadToken('customTokenKey')).toBe(mockToken);
    });
  });

  describe('saveIdentity', () => {
    it('should not throw if localStorage is undefined', () => {
      vi.spyOn(global, 'localStorage', 'get').mockReturnValue(undefined);
      expect(() => saveIdentity(mockIdentity)).not.toThrow();
    });

    it('should save the identity to localStorage', () => {
      saveIdentity(mockIdentity);
      expect(JSON.parse(localStorage.getItem('guestIdentity'))).toEqual(mockIdentity);
    });

    it('should use a custom key if provided', () => {
      saveIdentity(mockIdentity, 'customKey');
      expect(JSON.parse(localStorage.getItem('customKey'))).toEqual(mockIdentity);
    });
  });

  describe('saveToken', () => {
    it('should not throw if localStorage is undefined', () => {
      vi.spyOn(global, 'localStorage', 'get').mockReturnValue(undefined);
      expect(() => saveToken(mockToken)).not.toThrow();
    });

    it('should save the token to localStorage', () => {
      saveToken(mockToken);
      expect(localStorage.getItem('userToken')).toBe(mockToken);
    });

    it('should use a custom key if provided', () => {
      saveToken(mockToken, 'customTokenKey');
      expect(localStorage.getItem('customTokenKey')).toBe(mockToken);
    });
  });

  describe('clearStorage', () => {
    it('should not throw if localStorage is undefined', () => {
      vi.spyOn(global, 'localStorage', 'get').mockReturnValue(undefined);
      expect(() => clearStorage()).not.toThrow();
    });

    it('should remove the identity from localStorage', () => {
      localStorage.setItem('guestIdentity', JSON.stringify(mockIdentity));
      clearStorage();
      expect(localStorage.getItem('guestIdentity')).toBeNull();
    });

    it('should use a custom key if provided', () => {
      localStorage.setItem('customKey', JSON.stringify(mockIdentity));
      clearStorage('customKey');
      expect(localStorage.getItem('customKey')).toBeNull();
    });
  });
});