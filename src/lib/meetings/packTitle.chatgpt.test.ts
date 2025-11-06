// packTitle.test.ts
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { packMeetingTitle, unpackMeetingTitle, truncateSummary } from './packTitle';

// Some runners (node env) may not have atob/btoa; polyfill if needed.
beforeAll(() => {
  if (typeof globalThis.atob === 'undefined') {
    // @ts-ignore
    globalThis.atob = (b64: string) => Buffer.from(b64, 'base64').toString('binary');
  }
  if (typeof globalThis.btoa === 'undefined') {
    // @ts-ignore
    globalThis.btoa = (bin: string) => Buffer.from(bin, 'binary').toString('base64');
  }
});

describe('truncateSummary', () => {
  it('returns original when length <= max', () => {
    expect(truncateSummary('short', 10)).toBe('short');
  });

  it('cuts to max without ellipsis', () => {
    const s = 'abcdefghijklmnopqrstuvwxyz';
    const cut = truncateSummary(s, 5, { ellipsis: false });
    expect(cut).toBe('abcde');
    expect(cut.length).toBe(5);
  });

  it('cuts to max-1 and appends ellipsis when ellipsis=true', () => {
    const s = 'abcdefghijklmnopqrstuvwxyz';
    const cut = truncateSummary(s, 6, { ellipsis: true });
    expect(cut).toBe('abcde…'); // 5 chars + ellipsis
    expect(cut.length).toBe(6);
  });

  // it('is grapheme-aware (does not split emoji cluster)', () => {
  //   const emoji = '👍🏽👍🏽👍🏽';
  //   const cut = truncateSummary(emoji, 3, { ellipsis: false });

  //   if (typeof Intl !== "undefined" && Intl.Segmenter) {
  //     // If Intl.Segmenter is available, we expect exactly 1 or 2 emoji
  //     expect(cut.length).toBeGreaterThanOrEqual(4);  // 1 emoji is 4 characters long
  //     expect(cut.length).toBeLessThanOrEqual(8);     // 2 emoji are 8 characters long
  //   } else {
  //     // If Intl.Segmenter is not available, we fall back to character-based truncation
  //     expect(cut.length).toBe(3);
  //   }

  //   // Ensure we don't have any partial emoji
  //   const emojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
  //   const emojiCount = (cut.match(emojiRegex) || []).length;
  //   expect(emojiCount).toBe(cut.length / 4);
  // });


  describe('packMeetingTitle / unpackMeetingTitle', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('returns trimmed title when no meta provided', () => {
      expect(packMeetingTitle('  My Meeting  ')).toBe('My Meeting');
      expect(packMeetingTitle('Title', { /* empty */ })).toBe('Title');
      // summary empty string should be treated as "no meta"
      // (opts.summary falsy, opts.groupId falsy)
      // => returns trimmed title
      expect(packMeetingTitle(' Title ', { summary: '' })).toBe('Title');
    });

    it('encodes only groupId when summary is absent', () => {
      const capsule = packMeetingTitle('Room', { groupId: 'g1' });
      expect(capsule).not.toBe('Room');
      // URL-safe base64 (no +, /, =)
      expect(capsule).toMatch(/^[A-Za-z0-9\-_]+$/);

      const meta = unpackMeetingTitle(capsule);
      expect(meta).toEqual({ g: 'g1' });
    });

    it('encodes only summary when groupId is absent (with default max=140, no ellipsis)', () => {
      const summary = 'a'.repeat(200);
      const capsule = packMeetingTitle('Room', { summary });
      const meta = unpackMeetingTitle(capsule);
      // Default max is 140 without ellipsis
      expect((meta as any).s.length).toBe(140);
      expect((meta as any).s.endsWith('…')).toBe(false);
      expect((meta as any).g).toBeUndefined();
    });

    it('respects summaryMax and ellipsis', () => {
      const summary = 'The quick brown fox jumps over the lazy dog.';
      const capsule = packMeetingTitle('Room', {
        summary,
        summaryMax: 10,
        ellipsis: true
      });
      const meta = unpackMeetingTitle(capsule) as any;
      expect(meta.s).toBe('The quick…'); // 10 chars total including ellipsis
    });

    it('round-trips meta via unpackMeetingTitle', () => {
      const capsule = packMeetingTitle('My Title', {
        groupId: 'group-123',
        summary: 'hello world',
        summaryMax: 20
      });
      const meta = unpackMeetingTitle(capsule);
      expect(meta).toEqual({ g: 'group-123', s: 'hello world' });
    });

    it('unpackMeetingTitle returns original string when input is not a capsule', () => {
      expect(unpackMeetingTitle('Just a title')).toBe('Just a title');
      // not base64url
      expect(unpackMeetingTitle('@@@not-encoded@@@')).toBe('@@@not-encoded@@@');
    });

    it('produces base64url (padding stripped)', () => {
      const capsule = packMeetingTitle('T', { groupId: 'g', summary: 's' });
      // No `=` padding at the end
      expect(capsule.endsWith('=')).toBe(false);
      // No '+' or '/'
      expect(capsule).not.toMatch(/[+/]/);
    });
  });
});