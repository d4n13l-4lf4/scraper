import { describe, it, expect } from 'vitest';
import { wordCounter } from '@/modules/entries/domain/services/word-counter.js';

describe('wordCounter', () => {
  it('should count words in a normal title', () => {
    expect(wordCounter('Hello world')).toBe(2);
  });

  it('should return 0 for empty string', () => {
    expect(wordCounter('')).toBe(0);
  });

  it('should return 0 for punctuation-only title', () => {
    expect(wordCounter('!!! --- ???')).toBe(0);
  });

  it('should count hyphenated as one word', () => {
    expect(wordCounter('self-explained example')).toBe(2);
  });

  it('should handle leading/trailing whitespace', () => {
    expect(wordCounter('  Hello   world  ')).toBe(2);
  });

  it('should count tokens with letters or numbers', () => {
    expect(wordCounter('C++ is 100% fun')).toBe(4);
  });

  it('should handle Unicode characters', () => {
    expect(wordCounter("AI: What's new?")).toBe(3);
  });
});
