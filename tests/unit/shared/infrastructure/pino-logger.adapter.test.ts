import { describe, it, expect, vi } from 'vitest';
import { PinoLoggerAdapter } from '@/shared/infrastructure/pino-logger.adapter.js';

describe('PinoLoggerAdapter', () => {
  it('should warn with message and context', () => {
    const warn = vi.fn();
    const error = vi.fn();
    const logger = new PinoLoggerAdapter({ warn, error });

    logger.warn('test warning', { key: 'value' });
    expect(warn).toHaveBeenCalledWith('test warning', { key: 'value' });
  });

  it('should error with message and context', () => {
    const warn = vi.fn();
    const error = vi.fn();
    const logger = new PinoLoggerAdapter({ warn, error });

    logger.error('test error', { key: 'value' });
    expect(error).toHaveBeenCalledWith('test error', { key: 'value' });
  });

  it('should handle undefined context', () => {
    const warn = vi.fn();
    const error = vi.fn();
    const logger = new PinoLoggerAdapter({ warn, error });

    logger.warn('test warning');
    expect(warn).toHaveBeenCalledWith('test warning', undefined);
  });
});
