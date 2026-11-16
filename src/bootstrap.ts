/**
 * Composition root — manual dependency injection container.
 *
 * Constructs and wires concrete dependencies without a DI framework.
 * Reads config, builds shared adapters (clock, logger), builds module
 * containers, registers module presentation plugins on the Fastify
 * server, and returns the assembled application.
 */

import { loadConfig } from './config';
import { buildServer } from './app/http/build-server';
import { registerFallbackErrorHandlers } from './app/http/fallback-error-handler';
import { SystemClock } from './shared/infrastructure/system-clock';
import { PinoLoggerAdapter } from './shared/infrastructure/pino-logger.adapter';
import { createHelloContainer } from './modules/hello/di/hello.container';

export interface Container {
  config: ReturnType<typeof loadConfig>;
  clock: SystemClock;
  logger: PinoLoggerAdapter;
  server: ReturnType<typeof buildServer>;
  modules: { hello: ReturnType<typeof createHelloContainer> };
}

export function composeApp(): Container {
  const config = loadConfig();
  const clock = new SystemClock();
  const logger = new PinoLoggerAdapter(
    (
      globalThis as unknown as {
        log?: { warn: (m: string, c?: object) => void; error: (m: string, c?: object) => void };
      }
    ).log ?? console
  );

  const server = buildServer();
  registerFallbackErrorHandlers(server);

  const helloContainer = createHelloContainer();
  helloContainer.register(server);

  return { config, clock, logger, server, modules: { hello: helloContainer } };
}

export { loadConfig };
