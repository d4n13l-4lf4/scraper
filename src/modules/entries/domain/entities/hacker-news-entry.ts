/**
 * Represents one Hacker News story entry.
 */
export interface HackerNewsEntry {
  readonly number: number;
  readonly title: string;
  readonly points: number;
  readonly comments: number;
}
