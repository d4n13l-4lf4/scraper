/**
 * Represents a future request-usage event.
 */
export interface UsageLog {
  readonly id: string;
  readonly timestamp: string;
  readonly filter: string;
  readonly processedEntries: number;
  readonly resultsCount: number;
  readonly skippedRows: number;
  readonly upstreamStatus?: number;
  readonly fetchDurationMs?: number;
  readonly executionDurationMs: number;
  readonly status: 'success' | 'failure';
  readonly errorMessage?: string;
  readonly userAgent?: string;
}
