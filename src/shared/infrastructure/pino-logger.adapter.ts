/**
 * Pino logger adapter.
 *
 * Bridges the application-facing Logger port to Fastify's built-in
 * pino logger. Application code never imports Fastify or pino directly.
 */

import type { Logger } from '../application/ports/logger.port';

export class PinoLoggerAdapter implements Logger {
  constructor(
    private readonly logger: {
      warn: (msg: string, ctx?: object) => void;
      error: (msg: string, ctx?: object) => void;
    }
  ) {}

  warn(message: string, context?: object): void {
    this.logger.warn(message, context);
  }

  error(message: string, context?: object): void {
    this.logger.error(message, context);
  }
}
