# Implementation Plan: Project Scaffold with Hello World Endpoint

**Branch**: `001-hello-world-scaffold` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-hello-world-scaffold/spec.md`

## Summary

Establish the TypeScript REST-service foundation required by US-01 using the v4 feature-module architecture: declare the initial domain/application contracts in a `modules/hello/` module, expose a temporary `GET /hello` through the documented module presentation boundary, and configure deterministic tests, quality scripts, the pre-commit safeguard, and GitHub CI/release workflows. Add and validate the OpenAPI operation before implementing the route. Do not implement Hacker News retrieval, parsing behavior, filtering, or usage storage. The `/hello` operation documents only its successful response; generic unmatched-path behavior is outside this operation contract. Run quality gates on pull requests only; main pushes and release tags do not run the QA suite. A tagged release performs a build only to create its artifact and must point to a commit on `main`.

## Technical Context

**Language/Version**: TypeScript, Node.js 26 LTS, ESNext source modules bundled as ESM with Webpack and TypeScript bundler resolution.

**Primary Dependencies**: Fastify for HTTP; Webpack and ts-loader for the production ESM bundle; Vitest and Cucumber.js for tests; TypeScript, ESLint, Prettier, dependency-cruiser, and Redocly CLI for the adopted quality gates. Use npm with a committed lockfile.

**Storage**: N/A for US-01. `UsageLog` is a type declaration only; no database or persistence behavior is introduced.

**Testing**: Vitest for unit and HTTP integration tests per module; Fastify `inject` for HTTP boundary checks; Cucumber.js for deterministic acceptance per module; dependency-cruiser for architecture rules; the required static, contract, coverage, and build gates from the QA Approach v4.

**Target Platform**: Node.js service for local development and GitHub Actions on `ubuntu-24.04`.

**Project Type**: REST web service (feature-module architecture).

**Performance Goals**: No feature-specific latency or throughput target is defined for this temporary scaffold endpoint.

**Constraints**: Follow the feature-module hexagonal dependency rules and manual composition root in `docs/architecture/architecture.md` v4; write tests before production behavior; use `docs/api/openapi.yaml` as the contract source and update it before route implementation; document only the successful 200 response for `/hello`; pass the QA-required gates on pull requests per module; use the documented delivery flow v4; keep all crawler and persistence behavior out of scope. Release automation builds for packaging but does not rerun quality gates.

**Scale/Scope**: One temporary Hello World operation, the initial type contracts, automated verification, and local/CI/release safeguards. No Hacker News network calls or storage are needed.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Pre-research gate: PASS**

- **Product behavior is backlog-led**: Work is limited to US-01 and its acceptance criteria; later crawler stories remain excluded.
- **Hexagonal architecture is preserved (per module)**: The `hello` module's HTTP adapter calls an application-facing port, and the module container wires the service.
- **Public contracts are explicit and document-first**: Add and validate the OpenAPI operation before route behavior; generate the reference from OpenAPI.
- **Test-first verification is planned (per module)**: Use Red–Green–Refactor, deterministic HTTP/acceptance tests, and required coverage and static checks per module.
- **Merge/release controls are planned**: The pre-commit check, required CI gates on pull requests per module, manual main-branch protection, and the build-only tagged release follow the delivery reference v4. Main pushes and release tags do not run the QA suite.

**Post-design gate: PASS**. The proposed structure and artifacts retain the same boundaries, contract-first order, test strategy, and scope limits. No constitution violations or exceptions are required.

## Project Structure

### Documentation (this feature)

```text
specs/001-hello-world-scaffold/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── hello-api.md
```

### Source Code (repository root) — v4 Feature-Module Architecture

```text
src/
├── main.ts                                    HTTP entry point
├── bootstrap.ts                               root composition
├── config.ts                                  env parsing and defaults, one place
│
├── app/
│   └── http/
│       ├── build-server.ts                    Fastify instance, registers module plugins, testable via inject
│       └── fallback-error-handler.ts          not-found and unexpected-error responses
│
├── modules/
│   ├── hello/                                 temporary scaffold, removed in US-10
│   │   ├── application/
│   │   │   ├── ports/
│   │   │   │   └── get-hello.port.ts          inbound port
│   │   │   └── use-cases/
│   │   │       └── get-hello.use-case.ts
│   │   ├── presentation/
│   │   │   └── http/
│   │   │       ├── hello.route.ts
│   │   │       └── hello-response.dto.ts
│   │   └── di/
│   │       └── hello.container.ts
│   │
│   └── entries/                               Hacker News filtering capability (contracts only in US-01)
│       ├── domain/
│       │   ├── entities/                      hacker-news-entry.ts, scrape-stats.ts, usage-log.ts
│       │   ├── errors/                        typed errors with stable codes
│       │   ├── filters/
│       │   │   ├── filter-type.ts
│       │   │   ├── definitions.ts             the two pipelines
│       │   │   └── registry.ts                resolveFilter(id)
│       │   ├── pipeline/
│       │   │   ├── pipe.ts
│       │   │   └── stages.ts                  byWordCount, sortByDesc
│       │   └── services/
│       │       └── word-counter.ts
│       ├── application/
│       │   ├── models/
│       │   │   └── run-filter.result.ts       application result contract
│       │   ├── ports/
│       │   │   ├── run-filter.port.ts         inbound port
│       │   │   ├── html-fetcher.port.ts       outbound ports
│       │   │   ├── entry-parser.port.ts
│       │   │   └── usage-repository.port.ts
│       │   └── use-cases/
│       │       └── run-filter.use-case.ts     implements RunFilter
│       ├── infrastructure/
│       │   ├── hacker-news/
│       │   │   ├── hn-fetcher.ts
│       │   │   ├── extract-rows.ts
│       │   │   ├── parse-row.ts
│       │   │   ├── parse-result.ts            row parse outcome (ok or error)
│       │   │   └── parse-entries.ts           composes the extraction pipeline
│       │   └── sqlite/
│       │       ├── schema.ts
│       │       └── sqlite-usage-repository.ts
│       ├── presentation/
│       │   └── http/
│       │       ├── entries.route.ts           invokes inbound port
│       │       ├── entries-query.dto.ts       HTTP request DTO / validation schema
│       │       ├── entries-response.dto.ts    HTTP response DTO
│       │       ├── entries.mapper.ts          application result ↔ HTTP response
│       │       └── entries-error-handler.ts   module domain errors → status and code
│       └── di/
│           └── entries.container.ts
│
└── shared/
    ├── application/
    │   └── ports/
    │       ├── clock.port.ts
    │       └── logger.port.ts
    └── infrastructure/
        ├── system-clock.ts
        ├── pino-logger.adapter.ts
        └── sqlite-connection.ts

tests/
├── modules/
│   ├── hello/
│   │   ├── unit/
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   │       └── get-hello.use-case.test.ts
│   │   ├── integration/
│   │   │   └── presentation/
│   │   │       └── hello.route.test.ts
│   └── entries/                               (contracts only in US-01)
│       └── unit/
│           └── domain/
│               └── errors.test.ts
├── acceptance/
│   ├── features/
│   │   └── hello.feature
│   ├── steps/
│   │   └── hello.steps.ts
│   └── support/
│       └── world.ts
├── e2e/
│   └── live/                                   opt-in live-site smoke tests (assembled)
├── architecture/
│   └── dependency-rules/
├── fixtures/
│   └── hacker-news/
└── helpers/
    ├── fake-html-fetcher.ts
    ├── fake-entry-parser.ts
    ├── fake-usage-repository.ts
    └── test-database.ts

.github/
└── workflows/
    ├── ci.yml
    └── release.yml
.husky/
└── pre-commit
docs/
└── api/
    ├── openapi.yaml              # Existing canonical contract, add /hello first
    └── generated/
        └── openapi.html           # Generated from OpenAPI

.nvmrc
package.json
package-lock.json
tsconfig.json
eslint.config.js
vitest.config.ts
cucumber.mjs
.dependency-cruiser.cjs
webpack.config.js
```

**Structure Decision**: Use the repository's v4 feature-module architecture from the architecture reference. The scaffold creates the `modules/hello/` module with its `application`, `presentation`, and `di` layers, the `shared/` cross-cutting folder with `Clock` and `Logger` ports, the `app/http/` Fastify shell, and the root `bootstrap.ts` composition. The `entries` module is declared with its domain contracts only (no implementation). Use Webpack to produce an ESM bundle at `dist/bundle.js`, TypeScript bundler resolution, and the configured `@/` source alias. The `hello` module follows the feature-module hexagonal structure with `application/ports`, `application/use-cases`, `presentation/http`, and `di/` layers. The `entries` module domain contracts are declared in `modules/entries/domain/` only; no implementation is added in US-01. The `hello` endpoint uses a small inbound port/use case to demonstrate the required boundary without adding product crawler behavior. `src/config.ts` centralizes `PORT`, `HN_URL`, `REQUEST_TIMEOUT_MS`, `DB_PATH`, and the retained `NODE_ENV` setting.

The `/hello` operation has no custom 404 contract or not-found handler. Generic unmatched-path behavior remains outside this scaffold operation.

The release workflow uses the existing `v*.*.*` tag trigger and `main` ancestry check, runs `npm ci` and `npm run build` solely to create `dist/`, then packages `dist/`, `package.json`, and `package-lock.json` as `hacker-news-crawler-${TAG}.tar.gz`. It publishes through the existing `softprops/action-gh-release@v2` action with generated release notes and does not rerun the QA suite. CI runs on pull requests only, not main pushes. Main branch protection is configured manually by the repository owner. Keep verification permissions read-only where possible and grant `contents: write` only to the release job.

## Complexity Tracking

No constitution violations or unjustified complexity. The small Hello use case exists to demonstrate the architecture's required inbound-port boundary within a feature module.
