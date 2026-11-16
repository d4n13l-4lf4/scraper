/**
 * Application-facing inbound port for the filter operation.
 */
import type { FilterType } from '@/modules/entries/domain/filters/filter-type.js';
import type { RunFilterResult } from '@/modules/entries/application/models/run-filter.result.js';

export interface RunFilter {
  execute(filterId: FilterType, context?: { userAgent?: string }): Promise<RunFilterResult>;
}
