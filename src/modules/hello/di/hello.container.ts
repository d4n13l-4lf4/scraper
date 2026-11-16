/**
 * Hello module DI container.
 *
 * Factory function that wires the GetHello use case into the module's
 * presentation layer. Called by the composition root during bootstrap.
 */

import { buildServer } from '../../../app/http/build-server';
import { GetHelloUseCase } from '../application/use-cases/get-hello.use-case';
import type { GetHello } from '../application/ports/get-hello.port';
import helloPlugin from '../presentation/http/hello.plugin';

export interface HelloContainer {
  getHello: GetHello;
  register: (server: ReturnType<typeof buildServer>) => void;
}

export function createHelloContainer(): HelloContainer {
  const getHello = new GetHelloUseCase();

  return {
    getHello,
    register: (server) => {
      void server.register(helloPlugin, { getHello });
    },
  };
}
