/**
 * Cucumber world for Hello World acceptance tests (module-level + E2E).
 *
 * Provides both a module-level app (with Hello plugin registered) and
 * the fully composed app (via composeApp) for E2E testing.
 */

import { When, Then, Given, setWorldConstructor } from '@cucumber/cucumber';
import { buildServer } from '@/app/http/build-server.js';
import { composeApp } from '@/bootstrap.js';
import helloPlugin from '@/modules/hello/presentation/http/hello.plugin.js';
import { GetHelloUseCase } from '@/modules/hello/application/use-cases/get-hello.use-case.js';
import { strict as assert } from 'node:assert';

export interface HelloWorld {
  app: Awaited<ReturnType<typeof buildServer>>;
  server: Awaited<ReturnType<typeof composeApp>>['server'];
  response: {
    statusCode?: number;
    headers?: Record<string, string>;
    body?: unknown;
  } | null;
}

setWorldConstructor(function HelloWorldWorld(): HelloWorld {
  const w: HelloWorld = {
    app: null as unknown as HelloWorld['app'],
    server: null as unknown as HelloWorld['server'],
    response: null,
  };

  // Module-level app with Hello plugin
  w.app = buildServer();
  void w.app.register(helloPlugin, { getHello: new GetHelloUseCase() });

  // Fully composed app (E2E)
  const { server } = composeApp();
  w.server = server;

  w.response = null;
  return w;
});

Given('the service is running', function (this: HelloWorld) {
  // App is bootstrapped in the world constructor; nothing additional needed
});

Given('the assembled service is running', function (this: HelloWorld) {
  // App is bootstrapped in the world constructor; nothing additional needed
});

When('the client requests GET \\/hello', async function (this: HelloWorld) {
  this.response = await this.app.inject({
    method: 'GET',
    url: '/hello',
  });
});

When('the assembled client requests GET \\/hello', async function (this: HelloWorld) {
  this.response = await this.server.inject({
    method: 'GET',
    url: '/hello',
  });
});

Then('the response status code is 200', function (this: HelloWorld) {
  assert.strictEqual(this.response?.statusCode, 200);
});

Then('the assembled response status code is 200', function (this: HelloWorld) {
  assert.strictEqual(this.response?.statusCode, 200);
});

Then('the response content type is application\\/json', function (this: HelloWorld) {
  assert.ok(
    typeof this.response?.headers === 'object' &&
      String(this.response.headers['content-type']).includes('application/json'),
    `Expected application/json content type, got: ${this.response?.headers?.['content-type']}`
  );
});

Then('the assembled response content type is application\\/json', function (this: HelloWorld) {
  assert.ok(
    typeof this.response?.headers === 'object' &&
      String(this.response.headers['content-type']).includes('application/json'),
    `Expected application/json content type, got: ${this.response?.headers?.['content-type']}`
  );
});

Then(/^the response body is \{"message":"Hello, world!"\}$/, function (this: HelloWorld) {
  assert.deepStrictEqual(JSON.parse(String(this.response?.body)), {
    message: 'Hello, world!',
  });
});

Then(/^the assembled response body is \{"message":"Hello, world!"\}$/, function (this: HelloWorld) {
  assert.deepStrictEqual(JSON.parse(String(this.response?.body)), {
    message: 'Hello, world!',
  });
});
