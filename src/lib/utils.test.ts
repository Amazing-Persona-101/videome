import { describe, it, expect } from 'vitest';
import { convertToK } from './utils';

describe('convertToK', () => {
  it('should return "0" for non-number inputs', () => {
    expect(convertToK('string' as any)).toBe('0');
    expect(convertToK(null as any)).toBe('0');
    expect(convertToK(undefined as any)).toBe('0');
  });

  it('should return the number as a string if it is less than or equal to 1000', () => {
    expect(convertToK(999)).toBe('999');
    expect(convertToK(1000)).toBe('1000');
  });

  it('should convert numbers greater than 1000 to "k" format', () => {
    expect(convertToK(1500)).toBe('1.5k');
    expect(convertToK(2500)).toBe('2.5k');
    expect(convertToK(1234567)).toBe('1234.6k');
  });
});