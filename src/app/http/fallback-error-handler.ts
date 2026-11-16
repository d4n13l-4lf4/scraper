/**
 * Fallback error handlers.
 *
 * Handles not-found (404) and unexpected-error (500) responses,
 * exposing no internal diagnostic details.
 */

import type { FastifyInstance } from 'fastify';

export function registerFallbackErrorHandlers(app: FastifyInstance): void {
  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).type('application/json').send({
      code: 'not_found',
      message: 'The requested resource was not found.',
    });
  });

  app.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    reply
      .status(statusCode)
      .type('application/json')
      .send({
        code: statusCode === 500 ? 'internal_error' : 'unexpected_error',
        message:
          statusCode === 500 ? 'The request could not be completed.' : (error as Error).message,
      });
  });
}
