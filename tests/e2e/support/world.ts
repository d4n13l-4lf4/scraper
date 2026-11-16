/**
 * E2E world for assembled acceptance tests.
 *
 * Uses the full composition root to assemble the application with all
 * registered modules.
 */

import { composeApp } from '@/bootstrap.js';

export interface HelloWorldE2E {
  server: Awaited<ReturnType<typeof composeApp>>['server'];
  response: {
    statusCode?: number;
    headers?: Record<string, string>;
    body?: unknown;
  } | null;
}

export function attachWorld(world: HelloWorldE2E): void {
  const { server } = composeApp();
  world.server = server;
}

export default function world(): HelloWorldE2E {
  const w: HelloWorldE2E = {
    server: null as unknown as HelloWorldE2E['server'],
    response: null,
  };
  attachWorld(w);
  return w;
}
