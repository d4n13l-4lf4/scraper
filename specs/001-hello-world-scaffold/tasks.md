# Tasks: Project Scaffold with Hello World Endpoint (US-01) — v4 Architecture Re-implementation

**Input**: Design documents from `/specs/001-hello-world-scaffold/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are explicitly requested — the feature specification marks "User Scenarios & Testing" as mandatory, and the QA Approach v4 requires TDD (Red–Green–Refactor) per module. Test tasks are included and MUST be written before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., [US1])
- Include exact file paths in descriptions

## Path Conventions

- **v4 Feature-module project**: `src/` at repository root with `modules/`, `shared/`, `app/`, `config.ts`, `bootstrap.ts`, `main.ts` (per plan.md)
- Tests under `tests/modules/<module>/` for unit/integration, `tests/acceptance/` for acceptance, `tests/e2e/` for E2E (per plan.md)

---

## Phase 1: Setup (Shared Infrastructure & v4 Project Structure)

**Purpose**: Project initialization and v4 module structure — no dependencies, can start immediately.

- [x] T001 Create v4 project folder structure per implementation plan:
      `src/modules/hello/`, `src/modules/entries/`, `src/shared/`, `src/app/http/`,
      `src/config.ts`, `src/bootstrap.ts`, `src/main.ts`,
      `tests/modules/hello/`, `tests/modules/entries/`, `tests/acceptance/`, `tests/e2e/`,
      `.github/workflows/`, `.husky/`, `docs/api/generated/`
- [x] T002 Initialize Node.js 26 project with `package.json`, `package-lock.json` (committed lockfile), and `.nvmrc` pinning Node 26 LTS
- [x] T003 [P] Configure strict TypeScript ESM source with `module: ESNext`, `moduleResolution: bundler`, and `@/*` path mapping in root `tsconfig.json` (strict, noImplicitReturns, noFallthroughCasesInSwitch, noUnusedLocals, noUnusedParameters, forceConsistentCasingInFileNames)
- [x] T004 [P] Configure ESLint with typescript-eslint in `eslint.config.js` (zero errors and warnings; catch unused vars/imports, unsafe any, floating promises, unreachable code)
- [x] T005 [P] Configure Prettier formatting so `prettier --check` passes for tracked source and documentation
- [x] T006 [P] Configure Vitest test runner in `vitest.config.ts` (excludes opt-in live-site tests, supports coverage via `@vitest/coverage-v8`, per-module coverage)
- [x] T007 [P] Configure Cucumber.js for Gherkin acceptance tests in `cucumber.mjs` (TypeScript/ESM compatible, per-module)
- [x] T008 [P] Configure dependency-cruiser architecture rules in `.dependency-cruiser.cjs` enforcing v4 module boundaries from `docs/architecture/architecture.md` v4
- [x] T009 Create root `tsconfig.json` with `baseUrl: "."`, `paths: { "@/*": ["./src/*"] }` (single tsconfig at root only; no per-module tsconfig files)

---

## Phase 2: Shared Kernel & App Shell (Blocking Prerequisites)

**Purpose**: Cross-cutting ports/adapters and the Fastify shell — these are shared by all modules and MUST be complete before module work begins.

**⚠️ CRITICAL**: No module work can begin until this phase is complete.

- [x] T010 Create shared cross-cutting ports in `src/shared/application/ports/`:
  - `clock.port.ts` (interface `Clock` with `now()`, `monotonicMs()`)
  - `logger.port.ts` (interface `Logger` with `warn()`, `error()`)
- [x] T011 [P] Create shared infrastructure adapters in `src/shared/infrastructure/`:
  - `system-clock.ts` (implements `Clock`)
  - `pino-logger.adapter.ts` (implements `Logger` using Fastify's pino)
  - `sqlite-connection.ts` (creates and exports `better-sqlite3` connection)
- [x] T012 Create configuration module in `src/config.ts` — env parsing and defaults for `PORT` (3000), `HN_URL` (https://news.ycombinator.com/), `REQUEST_TIMEOUT_MS` (10000), `DB_PATH` (data/hacker-news.db), `NODE_ENV` (development); `process.env` read only here
- [x] T013 Create Fastify shell in `src/app/http/build-server.ts` — builds Fastify instance, registers module presentation plugins, exposes `inject()` for testing, no route registration here
- [x] T014 Create fallback error handlers in `src/app/http/fallback-error-handler.ts` — not-found (404) and unexpected-error (500) responses, no internal details exposed
- [x] T015 Create root composition in `src/bootstrap.ts` — reads config, builds shared adapters (clock, logger, db), builds module containers, registers module presentation plugins on Fastify server, returns `{ server, config, modules }`
- [x] T016 Create HTTP entry point in `src/main.ts` — calls `bootstrap.ts`, starts listening on configured port, logs address

**Checkpoint**: Shared kernel and app shell ready — module implementation can now begin.

---

## Phase 3: Entries Module Domain Contracts (Declarations Only)

**Purpose**: Declare the `entries` module domain types used by later stories. No implementation in US-01.

- [x] T017 Create `entries` domain entities in `src/modules/entries/domain/entities/`:
  - `hacker-news-entry.ts` (`HackerNewsEntry` with `number`, `title`, `points`, `comments`)
  - `scrape-stats.ts` (`ScrapeStats` with `rowsFound`, `parsed`, `parseErrors`)
  - `usage-log.ts` (`UsageLog` with all fields per backlog)
- [x] T018 [P] Create `entries` domain errors in `src/modules/entries/domain/errors/`:
      `InvalidFilterError`, `UpstreamTimeoutError`, `UpstreamUnavailableError`, `PageStructureError`, `PersistenceError` — each with stable `code`
- [x] T019 [P] Create `entries` domain filter types in `src/modules/entries/domain/filters/`:
      `filter-type.ts` (`FilterType` union), `definitions.ts` (two pipelines), `registry.ts` (`resolveFilter`)
- [x] T020 [P] Create `entries` domain pipeline in `src/modules/entries/domain/pipeline/`:
      `pipe.ts` (`pipe` function), `stages.ts` (`byWordCount`, `sortByDesc`)
- [x] T021 [P] Create `entries` domain services in `src/modules/entries/domain/services/`:
      `word-counter.ts` (implements word-counting rules)
- [x] T022 Create `entries` domain parse result in `src/modules/entries/infrastructure/hacker-news/parse-result.ts` — `ParseResult<T>` type (ok/error)

**Checkpoint**: Entries module domain contracts declared — later stories will implement behavior.

---

## Phase 4: Entries Module Application Contracts (Declarations Only)

**Purpose**: Declare the `entries` module application layer contracts. No implementation in US-01.

- [x] T023 Create `entries` application models in `src/modules/entries/application/models/`:
      `run-filter.result.ts` (`RunFilterResult` with `filter`, `entries`, `stats`, `usageRecorded`)
- [x] T024 [P] Create `entries` application inbound port in `src/modules/entries/application/ports/run-filter.port.ts`:
      `RunFilter` interface with `execute(filterId, context?)`
- [x] T025 [P] Create `entries` application outbound ports in `src/modules/entries/application/ports/`:
      `html-fetcher.port.ts`, `entry-parser.port.ts`, `usage-repository.port.ts`
- [x] T026 Create `entries` application use case stub in `src/modules/entries/application/use-cases/run-filter.use-case.ts` — implements `RunFilter`, throws "not implemented" (implementation in US-09)

**Checkpoint**: Entries module application contracts declared.

---

## Phase 5: Hello Module (US-01 Scaffold)

**Purpose**: Implement the temporary `hello` module per v4 architecture — demonstrates the module structure and delivers the Hello World endpoint.

### 5.1 Hello Module Domain (Minimal — No Business Logic)

- [x] T027 Create `hello` module domain — no domain logic needed for scaffold; skip domain folder or create empty marker

### 5.2 Hello Module Application Layer

- [x] T028 Create `hello` inbound port in `src/modules/hello/application/ports/get-hello.port.ts`:
      `GetHello` interface with `execute(): Promise<string>`
- [x] T029 [P] Create `hello` use case in `src/modules/hello/application/use-cases/get-hello.use-case.ts`:
      implements `GetHello`, returns `"Hello, world!"`

### 5.2 Hello Module Presentation Layer (HTTP Adapter)

- [x] T030 Create `hello` response DTO in `src/modules/hello/presentation/http/hello-response.dto.ts`:
      `{ message: string }`
- [x] T031 Create `hello` route in `src/modules/hello/presentation/http/hello.route.ts`:
      registers `GET /hello`, invokes `GetHello` port, maps to DTO, returns 200 JSON
- [x] T032 Create `hello` module DI container in `src/modules/hello/di/hello.container.ts`:
      factory function receiving `{ config, getHello }`, returns `{ runHello: GetHello }` (only the port)

### 5.3 Hello Module Tests (TDD: Write First, Red–Green–Refactor)

- [x] T033 [P] Write unit test for `GetHelloUseCase` in `tests/modules/hello/unit/application/use-cases/get-hello.use-case.test.ts` (Vitest, "should return 'Hello, world!'")
- [x] T034 [P] Write presentation integration test in `tests/modules/hello/integration/presentation/hello.route.test.ts` (Fastify `inject`, verify 200, application/json, body)
- [x] T035 [P] Write Gherkin acceptance feature in `tests/acceptance/features/hello.feature` (deterministic, no live HN)
- [x] T036 [P] Write Cucumber steps in `tests/acceptance/steps/hello.steps.ts` (binds to `hello` module's presentation plugin)
- [x] T037 [P] Write Cucumber world in `tests/acceptance/support/world.ts` (builds `hello` module presentation plugin with real `GetHelloUseCase`)

### 5.4 Hello Module Presentation Registration

- [x] T038 Create `hello` module presentation plugin registration in `src/modules/hello/presentation/http/hello.plugin.ts` — Fastify plugin exporting routes, receives `GetHello` port

**Checkpoint**: Hello module fully implemented and tested — `GET /hello` returns documented response.

---

## Phase 6: OpenAPI Contract & API Reference

- [x] T039 Add `GET /hello` operation to `docs/api/openapi.yaml` (200, application/json, `{ "message": "Hello, world!" }`, no 404)
- [x] T040 [P] Validate OpenAPI contract with Redocly CLI (`npm run api:validate`)
- [x] T041 [P] Generate human-readable API reference at `docs/api/generated/openapi.html` (`npm run api:docs`)

---

## Phase 7: Quality Gates & Delivery Safeguards (v4 Per-Module)

- [x] T042 Create dependency-cruiser architecture test rules in `tests/architecture/dependency-rules/` enforcing v4 module boundaries from `docs/architecture/architecture.md` v4
- [x] T043 Implement Husky pre-commit hook in `.husky/pre-commit` running `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test:unit` — blocks commit on any failure, permits on success
- [x] T044 [P] Create GitHub Actions CI workflow in `.github/workflows/ci.yml` — triggered on `pull_request` only, runs all mandatory QA gates v4 per affected module (format:check, lint, typecheck, test:architecture, api:validate, test:unit:coverage, test:integration, test:acceptance, build) without silently skipping any
- [x] T045 Create GitHub Actions release workflow in `.github/workflows/release.yml` — triggered by `v*.*.*` tag pattern and current main-ancestry check, performs no QA suite, runs `npm run build` only to create `dist/`, packages `dist/` + `package.json` + `package-lock.json`, publishes via `softprops/action-gh-release@v2`

---

## Phase 8: Root Test Runner & E2E Acceptance

- [x] T046 Configure Vitest root config to run per-module tests via `tests/modules/`
- [x] T047 Configure Cucumber.js to run per-module acceptance + assembled E2E
- [x] T048 Write assembled E2E acceptance feature in `tests/e2e/features/hello.feature` (runs against assembled app with `hello` module registered)
- [x] T049 Write Cucumber steps for assembled E2E in `tests/e2e/steps/hello.steps.ts`

---

## Phase 9: Verification & Polish

- [x] T050 [P] Run full quality gates from clean checkout: `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test:architecture`, `npm run api:validate`, `npm run api:docs`, `npm run test:unit:coverage` (100% per module domain/application), `npm run test:integration`, `npm run test:acceptance`, `npm run build`
- [x] T051 [P] Verify quickstart.md validation commands pass end-to-end (install, format, lint, typecheck, architecture, API validate/docs, unit/integration/acceptance tests, build, endpoint curl)
- [x] T052 [P] Documentation updates and final review against constitution v4 principles — confirm no crawler, filtering, or persistence behavior is implemented; confirm contracts match v4 architecture; confirm `GET /hello` is documented as temporary; confirm v4 module structure
- [x] T053 Verify v4 module structure exists: `src/modules/hello/`, `src/shared/`, `src/app/http/`, `src/modules/entries/` (contracts only)
- [x] T054 Verify v4 test organization: `tests/modules/hello/`, `tests/modules/entries/`, `tests/acceptance/`, `tests/e2e/`

---

## Phase 10: Convergence (v4 Architecture Alignment)

- [x] T054 [P] Reconcile all documents to v4: constitution v4, architecture v4, qa-approach v4, ci-cd v4, product_backlog v4, spec, plan, research, quickstart, contracts
- [x] T055 [P] Remove any remaining v3 flat-structure references from all documents
- [x] T056 [P] Verify all tasks reference v4 paths (modules/hello, shared/, app/, etc.)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Shared Kernel & App Shell (Phase 2)**: Depends on Setup completion — BLOCKS all modules
- **Entries Module Contracts (Phases 3-4)**: Depends on Shared Kernel completion
- **Hello Module (Phase 5)**: Depends on Shared Kernel completion — no dependencies on Entries implementation
- **OpenAPI & Quality Gates (Phases 6-7)**: Depends on Hello Module completion
- **Root Test Runner (Phase 8)**: Depends on Quality Gates completion
- **Verification (Phase 9)**: Depends on all implementation phases
- **Convergence (Phase 10)**: Depends on Verification completion

### Within Hello Module (US-01)

- Tests (T033–T037) MUST be written and FAIL before implementation (Red–Green–Refactor)
- Port before use case (T028 before T029)
- Use case before route (T029 before T031)
- Route before container (T031 before T032)
- OpenAPI contract before route behavior (T039 before T031)
- Core implementation before integration and acceptance tests pass
- Story complete before moving to Quality Gates phase

### Parallel Opportunities

- All Setup tasks marked [P] (T003–T009) can run in parallel
- Shared kernel tasks T010–T011 can run in parallel (different files)
- Entries module contract tasks T018–T022 can run in parallel
- Hello module test tasks T033–T037 can run in parallel
- Hello module implementation tasks T028–T032 have sequential deps but T028/T029/T030 can parallel
- Quality gate tasks T042–T045 can run in parallel
- Polish tasks T050–T053 can run in parallel
- Convergence tasks T054–T056 can run in parallel

---

## Implementation Strategy

### MVP First (US-01 Only)

1. Complete Phase 1: Setup (project initialization and v4 toolchain)
2. Complete Phase 2: Shared Kernel & App Shell (cross-cutting + shell)
3. Complete Phase 3–4: Entries Module Contracts (declarations only)
4. Complete Phase 5: Hello Module (endpoint, tests, module structure)
5. **STOP and VALIDATE**: Test Hello module independently — run `GET /hello`, verify all quality gates per module, confirm no crawler behavior exists
6. Deploy/demo if ready — this is the MVP increment

### Incremental Delivery

1. Complete Setup + Shared Kernel → Foundation ready
2. Add Hello Module → Test independently → Deploy/Demo (MVP!)
3. Later stories (US-02 through US-12) build on this foundation — retrieval, parsing, filtering, usage storage, REST delivery, failure responses, handoff
4. Each story adds value without breaking previous stories; `GET /hello` is temporary and retired when the product filtering endpoint (US-10) is delivered

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Shared Kernel together
2. Once Shared Kernel is done, developers can work on independent aspects:
   - One on Entries module contracts
   - One on Hello module (tests + implementation)
   - One on CI/CD workflows
3. Stories complete and integrate independently through module boundaries

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [US1] label maps task to User Story 1 for traceability
- User Story 1 is independently completable and testable
- Verify tests fail before implementing (Red–Green–Refactor per QA Approach v4)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
- No Hacker News retrieval, parsing, filtering, or usage persistence behavior is in scope for this feature (those belong to later backlog stories)
- **v4 Architecture**: All new code follows the feature-module structure (`modules/<module>/`, `shared/`, `app/`). The old v3 flat structure (`src/domain/`, `src/application/`, `src/infra/`, `src/adapters/`) is removed.
