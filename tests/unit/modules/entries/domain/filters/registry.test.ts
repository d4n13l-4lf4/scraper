import { describe, it, expect } from 'vitest';
import { resolveFilter } from '@/modules/entries/domain/filters/registry.js';
import type { FilterType } from '@/modules/entries/domain/filters/filter-type.js';
import { InvalidFilterError } from '@/modules/entries/domain/errors/index.js';

describe('filter registry', () => {
  it('should resolve more-than-five-words filter', () => {
    const pipeline = resolveFilter('more-than-five-words');
    expect(typeof pipeline).toBe('function');
  });

  it('should resolve five-or-fewer-words filter', () => {
    const pipeline = resolveFilter('five-or-fewer-words');
    expect(typeof pipeline).toBe('function');
  });

  it('should throw InvalidFilterError for unknown filter', () => {
    expect(() => resolveFilter('bad-filter' as FilterType)).toThrow(InvalidFilterError);
  });
});
