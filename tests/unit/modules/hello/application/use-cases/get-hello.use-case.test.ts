import { describe, it, expect } from 'vitest';
import { GetHelloUseCase } from '@/modules/hello/application/use-cases/get-hello.use-case.js';

describe('GetHelloUseCase', () => {
  it('should return "Hello, world!" message', async () => {
    const service = new GetHelloUseCase();
    const message = await service.execute();
    expect(message).toBe('Hello, world!');
  });
});
