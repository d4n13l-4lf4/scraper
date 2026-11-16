/**
 * GetHello use case — implements the GetHello inbound port.
 *
 * Delivery-agnostic: depends only on the GetHello port, not on Fastify
 * or any other framework. Returns the Hello World message string.
 */

import type { GetHello } from '../ports/get-hello.port';

export class GetHelloUseCase implements GetHello {
  execute(): Promise<string> {
    return Promise.resolve('Hello, world!');
  }
}
