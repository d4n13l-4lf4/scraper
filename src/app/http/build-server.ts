/**
 * Builds the Fastify application instance.
 *
 * Registers module presentation plugins and exposes `inject()` for
 * testing without opening a TCP port. Route registration is delegated
 * to module presentation plugins.
 */

import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

export function buildServer(): FastifyInstance {
  const app: FastifyInstance = Fastify({
    logger: false,
  });

  return app;
}
