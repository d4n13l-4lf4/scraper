import { describe, it, expect } from 'vitest';
import { filterDefinitions } from '@/modules/entries/domain/filters/definitions.js';
import type { HackerNewsEntry } from '@/modules/entries/domain/entities/hacker-news-entry.js';

describe('filter definitions', () => {
  const entries: HackerNewsEntry[] = [
    { number: 1, title: 'Hello world', points: 10, comments: 5 },
    { number: 2, title: 'A', points: 20, comments: 3 },
    { number: 3, title: 'This is a longer title', points: 5, comments: 8 },
    { number: 4, title: 'Short', points: 15, comments: 1 },
  ];

  it('should filter more-than-five-words by comments desc', () => {
    const result = filterDefinitions['more-than-five-words'](entries);
    expect(result.map((e) => e.number)).toEqual([]);
  });

  it('should filter five-or-fewer-words by points desc', () => {
    const result = filterDefinitions['five-or-fewer-words'](entries);
    expect(result.map((e) => e.number)).toEqual([2, 4, 1, 3]);
  });

  it('should return empty array when no matches', () => {
    const shortEntries: HackerNewsEntry[] = [{ number: 1, title: 'Hi', points: 1, comments: 0 }];
    const result = filterDefinitions['more-than-five-words'](shortEntries);
    expect(result).toEqual([]);
  });
});
