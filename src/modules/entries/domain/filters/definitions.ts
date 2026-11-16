import type { FilterType } from './filter-type.js';
import type { HackerNewsEntry } from '../entities/hacker-news-entry.js';

/**
 * The two business filter pipelines.
 */
export const filterDefinitions: Record<
  FilterType,
  (entries: readonly HackerNewsEntry[]) => readonly HackerNewsEntry[]
> = {
  'more-than-five-words': (entries) =>
    entries
      .filter((e) => e.title.split(/\s+/).filter((t) => /[A-Za-z0-9]/.test(t)).length > 5)
      .sort((a, b) => b.comments - a.comments),
  'five-or-fewer-words': (entries) =>
    entries
      .filter((e) => e.title.split(/\s+/).filter((t) => /[A-Za-z0-9]/.test(t)).length <= 5)
      .sort((a, b) => b.points - a.points),
};
