
import { describe, it, expect, vi } from 'vitest';
import { sanitizeInput, onlyContainsGrawlix, stripHtmlTagsAndContents, condenseMultipleSpaces } from './validation';

// const badWords = ['bad', 'shit'];
// const badWord = 'shit';
// const grawlix = 'xxx';
// const grawlix2 = '***';
const { badWords, badWord, grawlix, grawlix2 } = vi.hoisted(() => ({
  badWords: ['bad', 'shit'],
  badWord: 'shit',
  grawlix: 'xxx',
  grawlix2: '***',
}));

// Mock the Profanity class
vi.mock('@2toad/profanity', () => {
  return {
    Profanity: vi.fn().mockImplementation(() => {
      return {
        censor: vi.fn((input) => input.replace(new RegExp(badWords.join('|'), 'g'), grawlix)),

        addWords: vi.fn(),
        removeWords: vi.fn(),

      };
    }),
  };
});

// Mock the getBadWords and getBadWordSoloChars functions
vi.mock('./getBadWords', () => ({
  getBadWords: vi.fn(() => badWords),
}));

vi.mock('./getBadWordSoloChars', () => ({
  getBadWordSoloChars: vi.fn(() => []),
}));

describe('condenseMultipleSpaces', () => {
  it('should condense multiple spaces to a single space', () => {
    expect(condenseMultipleSpaces('Hello   World')).toBe('Hello World');
    expect(condenseMultipleSpaces('  Too    many    spaces  ')).toBe('Too many spaces');
  });

  it('should handle tabs and newlines', () => {
    expect(condenseMultipleSpaces('Hello\t\tWorld\n\nTest')).toBe('Hello World Test');
  });

  it('should return empty string for null or undefined input', () => {
    expect(condenseMultipleSpaces(null as any)).toBe('');
    expect(condenseMultipleSpaces(undefined as any)).toBe('');
  });

  it('should return the same string if no multiple spaces are present', () => {
    expect(condenseMultipleSpaces('Hello World')).toBe('Hello World');
  });

  it('should handle strings with only spaces', () => {
    expect(condenseMultipleSpaces('     ')).toBe('');
  });

  it('should handle mixed content with multiple types of whitespace', () => {
    expect(condenseMultipleSpaces('Start \t  Middle\n\n   End')).toBe('Start Middle End');
  });
});

describe('sanitizeInput', () => {
  it('should remove HTML tags and trim whitespace', () => {
    expect(sanitizeInput('<p>Hello</p> World ')).toBe('World');
  });

  it("keeps text that is outside tags", () => {
    const html = "Intro <div>inside</div> outro";
    expect(sanitizeInput(html)).toBe("Intro outro");
  });



  it('should condense multiple spaces after removing HTML and censoring', () => {
    expect(sanitizeInput(`<p>Hello</p>   ${badWord}   <script>alert("XSS")</script>   world`)).toBe(`${grawlix} world`);
  });

  it('should censor profanity', () => {
    expect(sanitizeInput(`Hello ${badWord} world`)).toBe(`Hello ${grawlix} world`);
  });

  it('should return empty string for null or undefined input', () => {
    expect(sanitizeInput(null as any)).toBe('');
    expect(sanitizeInput(undefined as any)).toBe('');
  });

  it('should return empty string if input only contains profanity', () => {
    expect(sanitizeInput('bad bad')).toBe('');
  });

  it('should handle mixed content correctly', () => {
    expect(sanitizeInput(`<p>Hello</p> ${badWord} <script>alert("XSS")</script> world`)).toBe(`${grawlix} world`);
  });

  it("handles nested tags correctly", () => {
    const html = "<section><div><span>deep</span></div></section> tail";
    expect(sanitizeInput(html)).toBe("tail");
  });

  it('should preserve non-profane content', () => {
    expect(sanitizeInput('Hello good world')).toBe('Hello good world');
  });
});

describe('onlyContainsGrawlix', () => {

  it('should return an empty string if input only contains grawlix', () => {
    expect(onlyContainsGrawlix(`${grawlix}`)).toBe('');
    expect(onlyContainsGrawlix(`${grawlix} ${grawlix}`)).toBe('');
    expect(onlyContainsGrawlix(`${grawlix} ${grawlix} ${grawlix}`)).toBe('');
  });

  it('should return the input string if it contains other characters', () => {
    expect(onlyContainsGrawlix(`hello ${grawlix}`)).toBe(`hello ${grawlix}`);
    expect(onlyContainsGrawlix(`${grawlix} world`)).toBe(`${grawlix} world`);
    expect(onlyContainsGrawlix('hello world')).toBe('hello world');
  });

  it('should handle empty input', () => {
    expect(onlyContainsGrawlix('')).toBe('');
  });

  it('should handle null or undefined input', () => {
    expect(onlyContainsGrawlix(null as any)).toBe('');
    expect(onlyContainsGrawlix(undefined as any)).toBe('');
  });

  it('should work with custom grawlix', () => {
    expect(onlyContainsGrawlix(`${grawlix2}`, grawlix2)).toBe('');
    expect(onlyContainsGrawlix(`${grawlix2} ${grawlix2}`, grawlix2)).toBe('');
    expect(onlyContainsGrawlix(`hello ${grawlix2}`, grawlix2)).toBe(`hello ${grawlix2}`);
  });

  it('should handle grawlix with spaces', () => {
    expect(onlyContainsGrawlix(`${grawlix} ${grawlix}`)).toBe('');
    expect(onlyContainsGrawlix(`${grawlix}  ${grawlix}`)).toBe('');
    expect(onlyContainsGrawlix(`${grawlix} \n ${grawlix}`)).toBe('');
  });
});

describe('stripHtmlTagsAndContents', () => {
  it('should remove HTML tags and their contents', () => {
    expect(stripHtmlTagsAndContents('<p>Hello</p> World')).toBe('World');
    expect(stripHtmlTagsAndContents('<div><p>Hello</p><span>World</span></div>')).toBe('');
    expect(stripHtmlTagsAndContents('Text <script>alert("XSS")</script> here')).toBe('Text here');
    expect(stripHtmlTagsAndContents('<img src="image.jpg" alt="Image"> Text')).toBe('Text');
  });

  it("returns empty string for empty input", () => {
    expect(stripHtmlTagsAndContents("")).toBe("");
  });

  it("removes a simple tag and its contents", () => {
    const html = "<div>Hello</div>";
    expect(stripHtmlTagsAndContents(html)).toBe("");
  });

  it("keeps text that is outside tags", () => {
    const html = "Intro <div>inside</div> outro";
    expect(stripHtmlTagsAndContents(html)).toBe("Intro outro");
  });

  it('should handle nested tags', () => {
    expect(stripHtmlTagsAndContents('<div><p>Nested <span>tags</span> here</p></div>')).toBe('');
  });

  it('should handle self-closing tags', () => {
    expect(stripHtmlTagsAndContents('<input type="text" /> Some text')).toBe('Some text');
  });

  it('should return empty string for null or undefined input', () => {
    expect(stripHtmlTagsAndContents(null as any)).toBe('');
    expect(stripHtmlTagsAndContents(undefined as any)).toBe('');
  });

  it('should return the same string if no HTML tags are present', () => {
    expect(stripHtmlTagsAndContents('Hello World')).toBe('Hello World');
  });

  it('should handle strings with multiple HTML elements and text', () => {
    expect(stripHtmlTagsAndContents('Start <div>Remove</div> Middle <p>Gone</p> End')).toBe('Start Middle End');
  });
});
