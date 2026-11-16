/**
 * GetHello inbound port — application-facing contract.
 *
 * The HTTP adapter depends on this interface, not on the concrete
 * service class. The concrete implementation is GetHelloUseCase in
 * application/use-cases/get-hello.use-case.ts.
 */

export interface GetHello {
  execute(): Promise<string>;
}
