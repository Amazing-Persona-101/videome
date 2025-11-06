import { Profanity } from '@2toad/profanity';
import { getBadWords } from './getBadWords';
import { getBadWordSoloChars } from './getBadWordSoloChars';

const grawlix = 'xxx';

const profanity = new Profanity({
  languages: [
    'en',
    'ar',
    'de',
    'es',
    'fr',
    'it',
    'hi',
    'ja',
    'ko',
    'ru',
    'zh',
  ],
  wholeWord: true,
  grawlix,
  grawlixChar: '$',
});

profanity.addWords(getBadWords());
profanity.removeWords(getBadWordSoloChars());

export function validateRoomName(roomName: string): { isValid: boolean; type?: string } {
  if (!roomName || roomName.trim().length === 0) {
    return { isValid: false, type: 'empty' };
  }
  if (roomName.length < 3 || roomName.length > 50) {
    return { isValid: false, type: 'length' };
  }
  // Add more specific rules if needed, e.g., allowed characters
  if (!/^[a-zA-Z0-9 \-*]+$/.test(roomName)) {
    return { isValid: false, type: 'valid' };
  }
  return { isValid: true };
}

export function onlyContainsGrawlix(input: string, grawlix: string = 'xxx'): string {
  if (!input) return '';

  // Escape special regex characters in the grawlix
  const escapedGrawlix = grawlix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const grawlixRegex = new RegExp(`^(${escapedGrawlix}\\s*)+$`);
  return grawlixRegex.test(input) ? '' : input;
}

export function condenseMultipleSpaces(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/\s+/g, ' ').trim();
}

// export function stripHtmlTagsAndContents(input: string): string {
//   if (!input || typeof input !== 'string') return '';

//   // This regex matches HTML tags and their contents
//   return input.replace(/<[^>]*>[^<]*<\/[^>]*>|<[^/>][^>]*\/>/g, '').trim();
// }

export function stripHtmlTagsAndContents(input: string): string {
  if (!input || typeof input !== 'string') return "";

  let output = String(input);

  // Remove comments, doctypes, and processing instructions first.
  output = output
    .replace(/<!--[\s\S]*?-->/g, "")         // comments
    .replace(/<!DOCTYPE[^>]*>/gi, "")        // doctype
    .replace(/<\?[\s\S]*?\?>/g, "");         // <?xml ...?> etc.

  // Iteratively remove matched open/close tag pairs (including nested).
  // Captures the tag name to ensure the closing tag matches the opener.
  // `[\\s\\S]*?` is used (instead of `.`) to cross newlines.
  const pairRe = /<([A-Za-z][A-Za-z0-9:-]*)(\s[^>]*)?>[\s\S]*?<\/\1\s*>/g;

  for (let i = 0; i < 50; i++) {
    const before = output;
    output = output.replace(pairRe, "");
    if (output === before) break; // no more matched pairs removed
  }

  // Remove any leftover orphan/self-closing tags (e.g., <br/>, <img>, unclosed).
  output = output.replace(/<[^>]+>/g, "");

  // Normalize whitespace
  return output.replace(/\s+/g, " ").trim();
}


export function validateDescription(description: string): { isValid: boolean; error?: string } {
  if (description && description.length > 100) {
    return { isValid: false, error: 'Description must not exceed 100 characters' };
  }

  if (description && !/^[a-zA-Z0-9 \-*]+$/.test(description)) {
    return { isValid: false, error: 'Description contains invalid characters' };
  }

  // Add more specific rules if needed
  return { isValid: true };
}

export function sanitizeInput(input: string, grawlix: string = 'xxx'): string {
  // Remove any HTML tags and trim whitespace
  if (!input || typeof input !== 'string') return '';
  const strippedInput = stripHtmlTagsAndContents(input);
  const condensedInput = condenseMultipleSpaces(strippedInput);
  const censoredInput = profanity.censor(condensedInput);
  const response = onlyContainsGrawlix(censoredInput, grawlix);
  return response;
}
