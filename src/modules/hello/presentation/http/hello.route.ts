/**
 * Hello World HTTP route.
 *
 * Invokes the GetHello inbound port and maps the result to the
 * hello-response DTO. Returns HTTP 200 with {"message":"Hello, world!"}.
 */

import type { FastifyInstance } from 'fastify';
import type { GetHello } from '../../application/ports/get-hello.port';
import type { HelloResponse } from './hello-response.dto';

export function registerHelloRoute(app: FastifyInstance, getHello: GetHello): void {
  app.get('/hello', async (_, reply) => {
    const message: string = await getHello.execute();
    const response: HelloResponse = { message };
    return reply.status(200).type('application/json').send(response);
  });
}
