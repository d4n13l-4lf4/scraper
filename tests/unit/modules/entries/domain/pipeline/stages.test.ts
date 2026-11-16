import { describe, it, expect } from 'vitest';
import { byWordCount, sortByDesc } from '@/modules/entries/domain/pipeline/stages.js';

describe('byWordCount', () => {
  it('should filter entries with more than threshold words', () => {
    const entries = [
      { number: 1, title: 'Hello world test example here', points: 1, comments: 0 },
      { number: 2, title: 'Short title', points: 2, comments: 0 },
      { number: 3, title: 'This has six words in it now', points: 3, comments: 0 },
    ];
    const result = byWordCount(3, true)(entries);
    expect(result.map((e) => e.number)).toEqual([1, 3]);
  });

  it('should filter entries with threshold or fewer words', () => {
    const entries = [
      { number: 1, title: 'Hello world test example here', points: 1, comments: 0 },
      { number: 2, title: 'Short title', points: 2, comments: 0 },
      { number: 3, title: 'This has six words in it now', points: 3, comments: 0 },
    ];
    const result = byWordCount(3, false)(entries);
    expect(result.map((e) => e.number)).toEqual([2]);
  });
});

describe('sortByDesc', () => {
  it('should sort by key descending', () => {
    const entries = [
      { number: 1, title: 'A', points: 10, comments: 0 },
      { number: 2, title: 'B', points: 5, comments: 0 },
      { number: 3, title: 'C', points: 20, comments: 0 },
    ];
    const result = sortByDesc('points')(entries);
    expect(result.map((e) => e.number)).toEqual([3, 1, 2]);
  });

  it('should preserve order for equal keys', () => {
    const entries = [
      { number: 1, title: 'A', points: 10, comments: 0 },
      { number: 2, title: 'B', points: 10, comments: 0 },
    ];
    const result = sortByDesc('points')(entries);
    expect(result.map((e) => e.number)).toEqual([1, 2]);
  });
});
