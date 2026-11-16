import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { registerFallbackErrorHandlers } from '@/app/http/fallback-error-handler.js';
import { buildServer } from '@/app/http/build-server.js';

describe('fallback error handlers', () => {
  let app: ReturnType<typeof buildServer>;

  beforeEach(() => {
    app = buildServer();
    registerFallbackErrorHandlers(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 404 for unknown routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/unknown' });
    expect(res.statusCode).toBe(404);
    const body = res.json() as { code: string; message: string };
    expect(body.code).toBe('not_found');
    expect(body.message).toContain('not found');
  });

  it('should not expose stack traces in error responses', async () => {
    app.get('/error', async () => {
      throw new Error('something went wrong');
    });

    const res = await app.inject({ method: 'GET', url: '/error' });
    expect(res.statusCode).toBe(500);
    const body = res.json() as { code: string; message: string; stack?: string };
    expect(body.code).toBe('internal_error');
    expect(body.stack).toBeUndefined();
  });

  it('should return non-500 error status and message', async () => {
    const err = new Error('bad request') as Error & { statusCode?: number };
    err.statusCode = 400;
    app.get('/bad-request', async () => {
      throw err;
    });

    const res = await app.inject({ method: 'GET', url: '/bad-request' });
    expect(res.statusCode).toBe(400);
    const body = res.json() as { code: string; message: string };
    expect(body.code).toBe('unexpected_error');
    expect(body.message).toBe('bad request');
  });
});
