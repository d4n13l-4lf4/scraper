import { describe, it, expect } from 'vitest';
import {
  InvalidFilterError,
  UpstreamTimeoutError,
  UpstreamUnavailableError,
  PageStructureError,
  PersistenceError,
} from '@/modules/entries/domain/errors/index.js';

describe('domain errors', () => {
  it('should create InvalidFilterError with code', () => {
    const err = new InvalidFilterError();
    expect(err.name).toBe('InvalidFilterError');
    expect(err.code).toBe('invalid_filter');
    expect(err.message).toBe('The requested filter is not supported.');
  });

  it('should create InvalidFilterError with custom message', () => {
    const err = new InvalidFilterError('custom error');
    expect(err.message).toBe('custom error');
  });

  it('should create UpstreamTimeoutError', () => {
    const err = new UpstreamTimeoutError();
    expect(err.name).toBe('UpstreamTimeoutError');
    expect(err.code).toBe('upstream_timeout');
  });

  it('should create UpstreamUnavailableError', () => {
    const err = new UpstreamUnavailableError();
    expect(err.name).toBe('UpstreamUnavailableError');
    expect(err.code).toBe('upstream_unavailable');
  });

  it('should create PageStructureError', () => {
    const err = new PageStructureError();
    expect(err.name).toBe('PageStructureError');
    expect(err.code).toBe('page_structure');
  });

  it('should create PersistenceError', () => {
    const err = new PersistenceError();
    expect(err.name).toBe('PersistenceError');
    expect(err.code).toBe('internal_error');
  });
});
