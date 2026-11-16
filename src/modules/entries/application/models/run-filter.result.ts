/**
 * Application result contract for the filter operation.
 */
import type { HackerNewsEntry } from '@/modules/entries/domain/entities/hacker-news-entry.js';
import type { ScrapeStats } from '@/modules/entries/domain/entities/scrape-stats.js';

export interface RunFilterResult {
  readonly filter: string;
  readonly entries: readonly HackerNewsEntry[];
  readonly stats: ScrapeStats;
  readonly usageRecorded: boolean;
}
