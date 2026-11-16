/**
 * Filter entries by title word count threshold.
 */
import type { HackerNewsEntry } from '../entities/hacker-news-entry.js';

export function byWordCount(
  threshold: number,
  includeMoreThan: boolean
): (items: readonly HackerNewsEntry[]) => HackerNewsEntry[] {
  return (items) =>
    items.filter((item) => {
      const count = item.title.split(/\s+/).filter((t) => /[A-Za-z0-9]/.test(t)).length;
      return includeMoreThan ? count > threshold : count <= threshold;
    });
}

/**
 * Sort entries by a given key in descending order.
 */
export function sortByDesc<T extends Record<string, number>>(
  key: keyof T
): (items: readonly T[]) => T[] {
  return (items) => [...items].sort((a, b) => b[key] - a[key]);
}
