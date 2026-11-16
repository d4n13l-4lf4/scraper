import type { FilterType } from './filter-type.js';
import type { HackerNewsEntry } from '../entities/hacker-news-entry.js';
import { filterDefinitions } from './definitions.js';

/**
 * Resolves a filter id to its pipeline function.
 * Throws InvalidFilterError for unknown ids.
 */
import { InvalidFilterError } from '../errors/index.js';

export function resolveFilter(
  filterId: FilterType
): (entries: readonly HackerNewsEntry[]) => readonly HackerNewsEntry[] {
  const pipeline = filterDefinitions[filterId];
  if (!pipeline) {
    throw new InvalidFilterError(`Unsupported filter: ${filterId}`);
  }
  return pipeline;
}
