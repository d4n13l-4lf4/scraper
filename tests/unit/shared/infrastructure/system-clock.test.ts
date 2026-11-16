import { describe, it, expect, beforeEach } from 'vitest';
import { SystemClock } from '@/shared/infrastructure/system-clock.js';

describe('SystemClock', () => {
  let clock: SystemClock;

  beforeEach(() => {
    clock = new SystemClock();
  });

  it('should return current date', () => {
    const now = clock.now();
    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('should return monotonic milliseconds', () => {
    const start = clock.monotonicMs();
    expect(typeof start).toBe('number');
    expect(start).toBeGreaterThanOrEqual(0);

    const end = clock.monotonicMs();
    expect(end).toBeGreaterThanOrEqual(start);
  });
});
