/**
 * HTTP entry point — starts the Fastify server.
 *
 * The composition root (bootstrap.ts) wires all concrete dependencies;
 * main.ts simply starts listening on the configured port.
 */

import { composeApp } from './bootstrap';

const { server, config } = composeApp();

const port = config.port;

server
  .listen({ port, host: '0.0.0.0' })
  .then((address) => {
    console.log(`Hacker News Crawler listening at ${address}`);
  })
  .catch((err: Error) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
