/**
 * Hello World Fastify plugin.
 *
 * Registers the Hello World route with the Fastify application, wired
 * with the GetHello port. Testable via Fastify's `inject` API without
 * opening a TCP port.
 */

import type { FastifyPluginAsync } from 'fastify';
import type { GetHello } from '../../application/ports/get-hello.port';
import { registerHelloRoute } from './hello.route';

const helloPlugin: FastifyPluginAsync<{ getHello: GetHello }> = async (app, { getHello }) => {
  registerHelloRoute(app, getHello);
};

export default helloPlugin;
