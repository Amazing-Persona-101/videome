
import { describe, it, expect } from 'vitest';
import { packMeetingTitle, unpackMeetingTitle, truncateSummary } from './packTitle';

describe('packTitle', () => {
  describe('packMeetingTitle', () => {
    it('should return the original title if no options are provided', () => {
      const title = 'Test Meeting';
      expect(packMeetingTitle(title)).toBe(title);
    });

    it('should pack title with groupId', () => {
      const title = 'Test Meeting';
      const packed = packMeetingTitle(title, { groupId: 'group1' });
      expect(packed).toBe('eyJnIjoiZ3JvdXAxIn0');
    });

    it('should pack title with summary', () => {
      const title = 'Test Meeting';
      const summary = 'This is a test summary';
      const packed = packMeetingTitle(title, { summary });
      expect(packed).toBe('eyJzIjoiVGhpcyBpcyBhIHRlc3Qgc3VtbWFyeSJ9');
    });

    it('should pack title with both groupId and summary', () => {
      const title = 'Test Meeting';
      const packed = packMeetingTitle(title, { groupId: 'group1', summary: 'Test summary' });
      expect(packed).toBe('eyJnIjoiZ3JvdXAxIiwicyI6IlRlc3Qgc3VtbWFyeSJ9');
    });

    it('should truncate summary if it exceeds the maximum length', () => {
      const title = 'Test Meeting';
      const longSummary = 'A'.repeat(150);
      const packed = packMeetingTitle(title, { summary: longSummary, summaryMax: 100 });
      const unpacked = unpackMeetingTitle(packed);
      expect(unpacked.s?.length).toBe(100);
    });
  });

  describe('unpackMeetingTitle', () => {
    it('should unpack a packed title correctly', () => {
      const packed = 'eyJnIjoiZ3JvdXAxIiwicyI6IlRlc3Qgc3VtbWFyeSJ9';
      const unpacked = unpackMeetingTitle(packed);
      expect(unpacked).toEqual({ g: 'group1', s: 'Test summary' });
    });

    it('should return the original string if unpacking fails', () => {
      const invalidPacked = 'invalid-packed-string';
      expect(unpackMeetingTitle(invalidPacked)).toBe(invalidPacked);
    });
  });

  describe('truncateSummary', () => {
    it('should not truncate if the summary is shorter than the max length', () => {
      const summary = 'Short summary';
      expect(truncateSummary(summary, 20)).toBe(summary);
    });

    it('should truncate to the specified length', () => {
      const summary = 'This is a long summary that needs truncation';
      expect(truncateSummary(summary, 20).length).toBe(20);
    });

    it('should add ellipsis when specified', () => {
      const summary = 'This is a long summary that needs truncation';
      const truncated = truncateSummary(summary, 20, { ellipsis: true });
      expect(truncated.endsWith('…')).toBe(true);
      expect(truncated.length).toBe(20);
    });

    it('should handle unicode characters correctly', () => {
      const summary = '🌈 This is a test with emoji 🚀';
      const truncated = truncateSummary(summary, 15, { ellipsis: true });
      expect(truncated).toBe('🌈 This is a te…');
    });
  });
});