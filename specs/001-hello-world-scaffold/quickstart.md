# Quickstart: Validate the Project Scaffold (v4 Architecture)

This guide validates US-01 after its re-implementation using the v4 feature-module architecture. The commands are the project scripts established by `docs/quality/qa-approach.md` v4; the `start` script runs the built service on the configured port (default `3000`).

## Prerequisites

- Node.js 26.x and npm.
- A clean checkout with the committed `package-lock.json`.

## Install and verify quality gates

From the repository root:

```sh
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test:architecture
npm run api:validate
npm run api:docs
npm run test:unit:coverage
npm run test:integration
npm run test:acceptance
npm run build
```

The unit coverage command enforces the QA Approach v4's four 100% thresholds for unit-testable domain and application code **per module**. Acceptance checks are deterministic and do not call the public Hacker News site. The generated API reference must remain reproducible from `docs/api/openapi.yaml`; `/hello` documents its successful `200` response only and has no operation-specific `404`.

## Verify the endpoint

In a terminal, build and start the service:

```sh
npm run build
npm start
```

In a second terminal, request the endpoint:

```sh
curl --fail --include http://localhost:3000/hello
```

Expected response: HTTP 200, `Content-Type: application/json`, and body `{"message":"Hello, world!"}`. Stop the service with Ctrl-C.

## Verify delivery safeguards

- The Husky pre-commit hook runs `npm run test:unit`; a failure blocks the commit.
- Pull requests run every mandatory QA gate **per affected module and at root**. `main` is protected against direct pushes that bypass those checks; protection is managed manually in GitHub settings. Pushes to `main` do not trigger another quality-gate run.
- The existing `v*.*.*` tag trigger and ancestry check are retained. The release workflow does not rerun quality gates; it runs `npm run build` only to create `dist/`, then packages and publishes the release artifact. No actual GitHub Release is required to accept US-01.

## Verify v4 module structure

```sh
# Verify module structure exists
ls -la src/modules/hello/
ls -la src/shared/
ls -la src/app/http/

# Verify hello module structure
ls -la src/modules/hello/application/ports/
ls -la src/modules/hello/application/use-cases/
ls -la src/modules/hello/presentation/http/
ls -la src/modules/hello/di/

# Verify shared kernel
ls -la src/shared/application/ports/
ls -la src/shared/infrastructure/

# Verify app shell
ls -la src/app/http/
```

## Verify v4 test organization

```sh
# Verify per-module test structure
ls -la tests/modules/hello/
ls -la tests/modules/entries/
```
