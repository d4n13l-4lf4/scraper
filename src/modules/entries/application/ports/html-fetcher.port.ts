/**
 * Outbound port for fetching Hacker News HTML.
 */
export interface HtmlFetcher {
  fetch(url: string): Promise<{ html: string; status: number; durationMs: number }>;
}
