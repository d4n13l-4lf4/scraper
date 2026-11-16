/**
 * System clock implementation.
 *
 * Provides UTC timestamps and monotonic duration measurements.
 */

import type { Clock } from '../application/ports/clock.port';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  monotonicMs(): number {
    return Number(process.hrtime.bigint() / 1_000_000n);
  }
}
