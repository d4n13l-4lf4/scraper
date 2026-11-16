/**
 * Logger port — application-facing logging contract.
 *
 * Application code never imports Fastify or pino directly; this port
 * is bridged to Fastify's pino logger in the composition root.
 */

export interface Logger {
  warn(message: string, context?: object): void;
  error(message: string, context?: object): void;
}
