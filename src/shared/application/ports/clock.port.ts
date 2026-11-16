/**
 * Clock port — application-facing time contract.
 *
 * All timestamps and durations come from this port; tests never use
 * the real clock.
 */

export interface Clock {
  now(): Date;
  monotonicMs(): number;
}
