import { describe, it, expect } from 'vitest';
import { buildServer } from '@/app/http/build-server.js';
import helloPlugin from '@/modules/hello/presentation/http/hello.plugin.js';
import type { GetHello } from '@/modules/hello/application/ports/get-hello.port.js';

describe('hello plugin', () => {
  it('should register the hello route via Fastify plugin', async () => {
    const app = buildServer();

    const getHello: GetHello = {
      execute: async () => 'Hello, world!',
    };

    await app.register(helloPlugin, { getHello });

    const res = await app.inject({ method: 'GET', url: '/hello' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ message: 'Hello, world!' });

    await app.close();
  });

  it('should use the provided getHello implementation', async () => {
    const app = buildServer();

    const customGetHello: GetHello = {
      execute: async () => 'Custom hello!',
    };

    await app.register(helloPlugin, { getHello: customGetHello });

    const res = await app.inject({ method: 'GET', url: '/hello' });
    expect(res.json()).toEqual({ message: 'Custom hello!' });

    await app.close();
  });
});
