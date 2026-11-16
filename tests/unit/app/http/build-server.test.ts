import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildServer } from '@/app/http/build-server.js';

describe('buildServer', () => {
  let app: ReturnType<typeof buildServer>;

  beforeEach(() => {
    app = buildServer();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create a Fastify instance', () => {
    expect(app).toBeDefined();
    expect(typeof app.inject).toBe('function');
  });

  it('should have no routes registered by default', async () => {
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(404);
  });
});
