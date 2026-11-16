/**
 * Represents the future extraction result counts.
 */
export interface ScrapeStats {
  readonly rowsFound: number;
  readonly parsed: number;
  readonly parseErrors: number;
}
