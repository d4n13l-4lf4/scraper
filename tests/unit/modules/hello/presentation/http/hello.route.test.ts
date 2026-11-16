import { describe, it, expect } from 'vitest';
import { buildServer } from '@/app/http/build-server.js';
import type { GetHello } from '@/modules/hello/application/ports/get-hello.port.js';

describe('hello route (unit)', () => {
  it('should register GET /hello route and return Hello World', async () => {
    const app = buildServer();

    const getHello: GetHello = {
      execute: async () => 'Hello, world!',
    };

    app.get('/hello', async (_, reply) => {
      const message = await getHello.execute();
      return reply.status(200).type('application/json').send({ message });
    });

    const res = await app.inject({ method: 'GET', url: '/hello' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.json()).toEqual({ message: 'Hello, world!' });

    await app.close();
  });
});
