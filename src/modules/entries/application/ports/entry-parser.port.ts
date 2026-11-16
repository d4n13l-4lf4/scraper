/**
 * Outbound port for parsing Hacker News entries from HTML.
 */
import type { HackerNewsEntry } from '@/modules/entries/domain/entities/hacker-news-entry.js';
import type { ScrapeStats } from '@/modules/entries/domain/entities/scrape-stats.js';

export interface EntryParser {
  parse(html: string): { entries: HackerNewsEntry[]; stats: ScrapeStats };
}
