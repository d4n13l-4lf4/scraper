/**
 * Outbound port for persisting usage records.
 */
import type { UsageLog } from '@/modules/entries/domain/entities/usage-log.js';

export interface UsageRepository {
  insert(log: UsageLog): void;
  listRecent(limit: number): UsageLog[];
}
