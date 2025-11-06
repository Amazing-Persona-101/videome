import { describe, it, expect, vi } from 'vitest';
import {
  packMeetingTitle,
  unpackMeetingTitle,
  truncateSummary
} from './packTitle';

// Mock Intl.Segmenter for consistent testing
const mockIntlSegmenter = vi.fn(() => ({
  segment: (str) => Array.from(str).map(char => ({ segment: char })),
  [Symbol.iterator]: () => ({
    next: vi.fn(),
  }),
}));

beforeAll(() => {
  vi.stubGlobal('Intl', {
    Segmenter: mockIntlSegmenter,
  });
});

describe('packMeetingTitle', () => {
  it('should return the title when no options are provided', () => {
    const title = 'My Test Meeting';
    const packed = packMeetingTitle(title);
    expect(packed).toBe(title);
  });

  it('should pack the title and groupId', () => {
    const title = 'A quick meeting';
    const opts = { groupId: 'g123' };
    const packed = packMeetingTitle(title, opts);
    const unpacked = unpackMeetingTitle(packed);
    expect(unpacked).toEqual({ g: 'g123' });
  });

  it('should pack the title and summary', () => {
    const title = 'Project status update';
    const summary = 'We need to discuss the new project milestones.';
    const opts = { summary };
    const packed = packMeetingTitle(title, opts);
    const unpacked = unpackMeetingTitle(packed);
    expect(unpacked).toEqual({ s: summary });
  });

  it('should pack the title, groupId, and summary', () => {
    const title = 'Team Sync';
    const groupId = 'team-alpha';
    const summary = 'Discussing Q3 goals.';
    const opts = { groupId, summary };
    const packed = packMeetingTitle(title, opts);
    const unpacked = unpackMeetingTitle(packed);
    expect(unpacked).toEqual({ g: groupId, s: summary });
  });

  it('should truncate the summary if it exceeds the max length', () => {
    const longSummary = 'This is a very, very, very, very, very long summary that should be truncated because it exceeds the default maximum character count.';
    const opts = { summary: longSummary, summaryMax: 50 };
    const packed = packMeetingTitle('Meeting', opts);
    const unpacked = unpackMeetingTitle(packed);
    expect(unpacked.s.length).toBeLessThanOrEqual(50);
    expect(unpacked.s).not.toBe(longSummary);
  });
});

describe('unpackMeetingTitle', () => {
  it('should unpack a valid packed string', () => {
    const packed = 'eyJzIjoiV2UgbmVlZCB0byBkaXNjdXNzIHRoZSBuZXcgcHJvamVjdCBtaWxlc3RvbmVzLiJ9';
    const unpacked = unpackMeetingTitle(packed);
    expect(unpacked).toEqual({ s: 'We need to discuss the new project milestones.' });
  });

  it('should return the original string if unpacking fails', () => {
    const invalidPacked = 'not-a-valid-packed-string';
    const unpacked = unpackMeetingTitle(invalidPacked);
    expect(unpacked).toBe(invalidPacked);
  });
});

describe('truncateSummary', () => {
  it('should not truncate a short string', () => {
    const shortString = 'Hello world';
    expect(truncateSummary(shortString, 20)).toBe(shortString);
  });

  it('should truncate a long string without ellipsis', () => {
    const longString = 'This is a test string to be truncated.';
    expect(truncateSummary(longString, 10)).toBe('This is a ');
  });

  it('should truncate a long string with ellipsis', () => {
    const longString = 'This is a test string to be truncated.';
    expect(truncateSummary(longString, 10, { ellipsis: true })).toBe('This is a…');
  });

  it('should handle multi-byte characters correctly with mock Segmenter', () => {
    const multiByteString = '👋🌍🚀 This is a multi-byte string.';
    expect(truncateSummary(multiByteString, 5, { ellipsis: true })).toBe('👋🌍🚀 …');
  });
});