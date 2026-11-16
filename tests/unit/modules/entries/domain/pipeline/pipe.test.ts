import { describe, it, expect } from 'vitest';
import { pipe } from '@/modules/entries/domain/pipeline/pipe.js';

describe('pipe', () => {
  it('should compose functions left to right', () => {
    const add1 = (n: number[]) => n.map((x) => x + 1);
    const multiply2 = (n: number[]) => n.map((x) => x * 2);

    const result = pipe(add1, multiply2)([5]);
    expect(result).toEqual([12]); // (5 + 1) * 2 = 12
  });

  it('should not mutate input array', () => {
    const original = [1, 2, 3];
    const identity = (n: number[]) => n;
    pipe(identity)(original);
    expect(original).toEqual([1, 2, 3]);
  });

  it('should handle empty stages', () => {
    const identity = pipe();
    expect(identity([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
