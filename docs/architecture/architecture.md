---
document: Architecture
canonical_path: docs/architecture/architecture.md
version: 4
status: current
---

# Architecture

This document describes the architecture of the Hacker News Crawler: the style we chose, the dependency rules, the data-processing pipelines, the project structure and the cross-cutting decisions. It complements the product backlog (`docs/requirements/product_backlog.md`). Quality practices and verification procedures are defined in `docs/quality/qa-approach.md`.

## 1. Architectural style

**Feature modules with hexagonal architecture (ports and adapters) inside each module.** The source tree is organized by capability first (`modules/<module>/`) and by layer second (`domain`, `application`, `infrastructure`, `presentation`, `di`). A thin `app/` folder holds the delivery shell, and a small `shared/` folder holds the few contracts and implementations that are genuinely cross-cutting.

Inside a module, the boundaries are explicit: presentation adapters call an inbound application port; an application service implements that port and depends on outbound ports; infrastructure adapters implement those outbound ports. The ceremony is intentionally lightweight and uses manual dependency injection rather than a DI framework.

| Style element                                                           | Decision                      | Reason                                                                                                          |
| ----------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Feature modules, layers inside each module                              | Adopted                       | The top level says what the application does; each module can be understood and removed independently           |
| Hexagonal dependency rule (dependencies point inward, I/O behind ports) | Adopted                       | Keeps business behavior independent of delivery and infrastructure                                              |
| Inbound port                                                            | Adopted                       | Gives each application capability an explicit contract for driving adapters                                     |
| Use-case class                                                          | Adopted                       | Encapsulates orchestration behind the inbound port; one class per application use case                          |
| Outbound ports                                                          | Adopted                       | Makes external capabilities explicit and replaceable                                                            |
| Dependency injection                                                    | Adopted, manual               | Per-module containers and a root composition wire dependencies without introducing a container framework        |
| DTO mapping                                                             | Adopted at adapter boundaries | Keeps transport contracts separate from domain/application models without creating unnecessary entity mappers   |
| Shared kernel                                                           | Adopted, minimal              | `shared/` holds only cross-cutting ports and adapters (clock, logger, database connection), never business code |

### Dependency rule

```text
 ┌─────────────────────────── module (for example: entries) ───────────────────────────┐
 │                                                                                     │
 │ presentation/http ───▶ Inbound port                                                 │
 │ (route, DTOs, mapper)  Application use-case service ───▶ Domain                     │
 │                        Outbound ports ◀─── infrastructure adapters                  │
 │                                                                                     │
 │ di/ container ── constructs the module's concrete dependencies                      │
 └─────────────────────────────────────────────────────────────────────────────────────┘

 shared/        cross-cutting ports (Clock, Logger) and adapters, used by any module
 app/http       Fastify shell; knows nothing about individual modules
 bootstrap.ts   root composition: builds module containers, hands inbound ports to presentation
```

The rules below apply to each module. `<m>` stands for any module under `src/modules/`.

| Layer                   | Contains                                                                                                          | May import                                                                                  | Must not import                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `<m>/domain`            | Entities, typed errors, word counter, pipeline stages, filter registry                                            | Own `domain` only; nothing external                                                         | `application`, `infrastructure`, `presentation`, `di`, `shared`, any third-party library |
| `<m>/application`       | Inbound port, use-case service, outbound port interfaces and application result models                            | Own `domain`, `shared/application`                                                          | `infrastructure`, `presentation`, `di`, Fastify, Cheerio, better-sqlite3                 |
| `<m>/infrastructure`    | Implementations of the ports (native `fetch`, Cheerio, better-sqlite3)                                            | Own `domain`, own `application` (types only), `shared/application`, `shared/infrastructure` | `presentation`, `di`                                                                     |
| `<m>/presentation`      | Inbound HTTP adapter: routes, request/response DTOs and mappers; parse input, invoke the inbound port, map errors | Own `application`, own `domain`, `shared/application`                                       | `infrastructure`, `di`                                                                   |
| `<m>/di`                | The module's manual DI container                                                                                  | Everything in its own module, `shared`                                                      | Other modules, `app`                                                                     |
| `shared/application`    | Cross-cutting outbound ports (`Clock`, `Logger`)                                                                  | Nothing from `modules`                                                                      | `modules`, `app`, `shared/infrastructure`, third-party libraries                         |
| `shared/infrastructure` | Cross-cutting adapters (system clock, pino bridge, SQLite connection)                                             | `shared/application`                                                                        | `modules`, `app`                                                                         |
| `app/http`              | Fastify instance, plugin registration, fallback not-found and unexpected-error handling                           | `shared/application`, Fastify                                                               | `modules` (any layer), `shared/infrastructure`                                           |
| `bootstrap` / `main`    | Root composition and entry point                                                                                  | Everything                                                                                  | n/a                                                                                      |

Additional rules:

- **Module isolation.** A module never imports another module's `domain`, `application`, `infrastructure` or `presentation` internals. If one module needs another's capability, it declares an outbound port in its own `application` layer, and the root composition supplies an adapter for it.
- **Module public surface.** Only `bootstrap.ts` imports from a module, and only from its `di/` container and its `presentation` entry points.
- **Shared stays small.** `shared/` never contains business rules and never imports from `modules/`. Code is promoted to `shared/` only when a second module needs it.
- **Folders on demand.** A subfolder is created when it has files to hold, and a layer folder is created when the module has something in that layer. Empty placeholder folders are not committed.

The dependency constraints are enforced by the architecture checks specified in `docs/quality/qa-approach.md`. Presentation adapters never instantiate infrastructure implementations; only the module containers and the root composition do.

## 2. Ports, use cases and dependency injection

The application layer of each module owns its contracts (using `FilterType` from the domain and `RunFilterResult` from the application models). Inbound ports describe what the module offers to driving adapters; outbound ports describe what it needs from infrastructure. Infrastructure implements outbound ports, while HTTP (and a future CLI) invokes inbound ports.

The examples below belong to the `entries` module.

### Inbound port

```typescript
interface RunFilter {
  execute(filterId: FilterType, context?: { userAgent?: string }): Promise<RunFilterResult>;
}
```

`RunFilter` is the application-facing contract, declared in `modules/entries/application/ports/run-filter.port.ts`. The HTTP route depends on this interface, not on the concrete service class. The concrete implementation is `RunFilterUseCase` in `modules/entries/application/use-cases/run-filter.use-case.ts`.

### Outbound ports

Module-specific ports are declared under `modules/entries/application/ports/` and implemented under `modules/entries/infrastructure/`:

```typescript
interface HtmlFetcher {
  fetch(url: string): Promise<{ html: string; status: number; durationMs: number }>;
}

interface EntryParser {
  parse(html: string): { entries: HackerNewsEntry[]; stats: ScrapeStats };
}

interface UsageRepository {
  insert(log: UsageLog): void;
  listRecent(limit: number): UsageLog[];
}
```

Cross-cutting ports are declared under `shared/application/ports/` and implemented under `shared/infrastructure/`:

```typescript
interface Clock {
  now(): Date; // request timestamp (UTC)
  monotonicMs(): number; // elapsed-time measurement
}

interface Logger {
  warn(message: string, context?: object): void;
  error(message: string, context?: object): void;
}
```

Fastify's built-in pino logger can be adapted to `Logger` in `shared/infrastructure`. The application layer does not import or know about pino.

`UsageRepository` stays in the `entries` module because the filter use case is its only consumer. It is extracted into its own module only when a second capability needs it.

### Use-case service

`RunFilterUseCase` implements the inbound `RunFilter` port. It receives its outbound ports and configuration through constructor injection. It owns orchestration, not HTTP concerns. The class is a deliberate boundary, not a reason to turn pure domain operations into classes.

### DTO mapping

DTOs belong to delivery adapters, so they live in the module's `presentation/http/` folder. The HTTP route maps validated query input into application input and maps `RunFilterResult` into the documented HTTP response DTO. Domain entities and application result models are not serialized directly as an accidental API contract. A separate mapper is added only where a boundary actually needs a different shape; there is no generic mapper per domain entity by default.

The public HTTP contract is specified in `docs/api/openapi.yaml`; adapter
request and response DTOs must conform to it. The document-first workflow and
generation of its readable reference are defined in
`docs/quality/qa-approach.md`.

### Module containers and composition root

Each module has a manual DI container in `di/<module>.container.ts`. A container is a factory function that receives plain configuration values and shared dependencies, constructs the module's infrastructure adapters and use-case services, and returns only the module's inbound ports.

`bootstrap.ts` is the root composition. It reads configuration, builds the shared adapters (clock, logger, database connection), calls each module container, and passes the returned inbound ports to the modules' presentation plugins, which it registers on the Fastify server built by `app/http/build-server.ts`. Use manual constructor/factory wiring; do not add a third-party DI framework for this application.

```typescript
// Shape only, not prescriptive code
const entries = createEntriesContainer({ config, clock, logger, db });
const server = buildServer({
  plugins: [entriesRoutes({ runFilter: entries.runFilter })],
});
```

## 3. Data processing: a pipeline of pure stages

Pipes and filters is the **micro-architecture inside the core**. The macro architecture remains modules with ports and adapters.

```text
 infrastructure: extraction pipeline
 html ▶ extractRows ▶ take(30) ▶ parseRow (per row) ▶ collectStats
 └──────────────── exposed through the EntryParser port ─────────────┘

 domain: filter pipeline (one per canonical filter id, held in the registry)
 entries ▶ byWordCount(predicate) ▶ sortByDesc(key)

 application: RunFilterUseCase.execute
 resolveFilter ▶ fetch ▶ parse ▶ apply filter ▶ persist usage ▶ result
```

### Design rules

- **Stages are pure functions** with a single shared type, so composition needs no casts and nothing mutates its input:

  ```typescript
  type Stage<T> = (items: readonly T[]) => T[];
  const pipe =
    <T>(...stages: Stage<T>[]): Stage<T> =>
    (items) =>
      stages.reduce<T[]>((acc, stage) => stage(acc), [...items]);
  ```

- **Filters are data, not classes.** The two business filters differ only in predicate and sort key:

  | Canonical id           | Pipeline                                           |
  | ---------------------- | -------------------------------------------------- |
  | `more-than-five-words` | `pipe(byWordCount(gt(5)), sortByDesc('comments'))` |
  | `five-or-fewer-words`  | `pipe(byWordCount(lte(5)), sortByDesc('points'))`  |

  Adding a third filter means adding one registry entry.

- **Stable ordering.** Equal sort keys keep the original Hacker News order.
- **The Hacker News adapter lives in `modules/entries/infrastructure/hacker-news/`.** This folder owns upstream fetching, page extraction, row parsing, and parser-specific support concepts such as representing an individual row's parse outcome. These concerns stay out of `domain`; their concrete types and file layout are chosen during implementation. The use case only sees parsed entries through `EntryParser`.
- **Row-level errors do not abort the pipeline.** `parseRow` returns a `ParseResult` (ok or error); `collectStats` counts `rowsFound`, `parsed` and `parseErrors`. A skipped row is not backfilled. Zero rows found raises `PageStructureError`.
- **Terminology:** a _stage_ is a pipeline step; a _filter_ is one of the two business operations, defined as a composed pipeline of stages.
- **Scope of the pattern:** this is synchronous, in-process function composition over at most 30 items. There are no streams, queues or concurrent workers. The pattern is the inspiration, not a framework.

## 4. The `RunFilter` use case

`RunFilterUseCase.execute` is the delivery-agnostic implementation of the inbound `RunFilter` port, shared by REST now and a CLI later.

1. Resolve the filter id (`InvalidFilterError` for unknown ids, before any network call or usage record).
2. Capture the request timestamp through `Clock`.
3. Fetch the HTML (`HtmlFetcher`).
4. Parse entries and stats (`EntryParser`).
5. Apply the filter pipeline from the registry.
6. Persist a usage record (`UsageRepository`).
7. Return `{ filter, entries, stats, usageRecorded }`.

Failure behavior:

- After a valid filter id, any scraping failure triggers an attempt to persist a `failure` record, then the domain error is rethrown.
- If persisting a _successful_ run fails, the results are still returned with `usageRecorded: false` and the error is reported through `Logger`. The result is never presented as stored when it was not.

## 5. Error handling

The domain raises typed errors with stable identities. Only a delivery
adapter maps them to transport-specific responses. The HTTP status codes,
public error codes, and error response schema are defined in
`docs/api/openapi.yaml`.

Error mapping follows module ownership. A module's domain errors are mapped in that module's `presentation/http/` folder, registered inside the module's own Fastify plugin scope, so `app/http` never imports a module's errors. `app/http` provides only the fallback handlers for not-found routes and unexpected errors; these expose no stack traces or internal details.

| Domain error               | Domain/application behavior                                 | Usage behavior                                         |
| -------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| `InvalidFilterError`       | Raised before network activity                              | No usage record                                        |
| `UpstreamTimeoutError`     | Upstream request timed out                                  | Failure record attempted                               |
| `UpstreamUnavailableError` | Network failure or non-success upstream response            | Failure record attempted                               |
| `PageStructureError`       | No story rows found                                         | Failure record attempted                               |
| `PersistenceError`         | Must not hide a successful result                           | Reported; successful result has `usageRecorded: false` |
| any other error            | Propagated to the delivery adapter as an unexpected failure | Failure record attempted after a valid filter          |

A future CLI adapter maps the same errors to its own exit-code contract.

## 6. Project structure

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
│   └── entries/                               Hacker News filtering capability
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

docs/
├── api/
│   └── openapi.yaml                           public HTTP contract
├── architecture/
│   └── architecture.md
├── delivery/
│   └── ci-cd.md                               conceptual delivery model
├── quality/
│   └── qa-approach.md
└── requirements/
    ├── statement.md
    └── product_backlog.md
```

The tree shows the target structure. Files appear as their user stories are implemented; the scaffold story (US-01) creates only the contracts, the `hello` module and the shell.

### Conventions

- Source-code file names are kebab-case.
- File names carry a role suffix where the role is not obvious from the folder: `.port.ts`, `.use-case.ts`, `.route.ts`, `.dto.ts`, `.mapper.ts`, `.container.ts`, `.adapter.ts`, `.result.ts`, `.error.ts`.
- Production output is an ESM bundle produced by Webpack at `dist/bundle.js`.
- TypeScript uses `module: ESNext` and `moduleResolution: bundler`; source imports
  use the `@/` alias for modules rooted at `src/`. Webpack, TypeScript, and test
  tooling must resolve the alias consistently. Relative imports may be used for
  neighboring files within the same folder.
- Imports that cross a layer or module boundary use the `@/` alias, so the dependency checks can match full paths such as `@/modules/entries/domain/...` or `@/shared/application/...`.
- `bootstrap.ts` exists so a CLI is `main-cli.ts` plus a `presentation/cli/` folder in the relevant module and nothing else.

## 7. Cross-cutting decisions

| Concern       | Decision                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Errors        | Typed domain errors with `code`; mapping to transport happens only in presentation adapters, per module, with fallbacks in `app/http`                                          |
| Logging       | Minimal outbound `Logger` port (`warn`, `error`) in `shared/application`; a small adapter in `shared/infrastructure` bridges Fastify/pino; application never imports Fastify   |
| Time          | All timestamps and durations come from the `Clock` port; tests never use the real clock                                                                                        |
| Configuration | Read once in `config.ts` (`PORT`, `HN_URL`, `REQUEST_TIMEOUT_MS`, `DB_PATH`, `NODE_ENV`), passed to module containers as plain values; `process.env` is not read anywhere else |
| Persistence   | SQLite via `better-sqlite3`, parameterized statements only, `:memory:` in tests; the connection is created in `shared/infrastructure` and injected into module repositories    |
| Immutability  | Stages and filters never mutate their input                                                                                                                                    |

## 8. Quality assurance reference

Test levels, test organization, coverage targets, static quality tooling, architecture-check configuration, and CI gates are specified in `docs/quality/qa-approach.md`. This architecture document owns the dependency rules those checks verify; the QA approach owns how and when they are verified.

## 9. Extending the system

- **Add a CLI:** create `presentation/cli/` in the relevant module, add `main-cli.ts`, reuse the module container through `bootstrap`, and map domain errors to exit codes.
- **Add a filter:** add a pipeline in `modules/entries/domain/filters/definitions.ts` and register it under a new canonical id and `FilterType` member.
- **Swap storage:** implement `UsageRepository` and change one line in `entries.container.ts`.
- **Swap the HTML source or parser:** implement `HtmlFetcher` or `EntryParser`; the use case is unaffected.
- **Add a module:** create `modules/<name>/` with only the layers it needs, add its `di/` container, and register its presentation plugin in `bootstrap.ts`. Reach other modules only through ports declared in the new module's `application` layer.
- **Extract a shared concern:** move code to `shared/` only when a second module needs it, and keep it free of business rules.

## 10. Quality tooling reference

Type checking, linting, formatting, architecture-check tooling, script names, and required CI gates are quality-process decisions maintained in `docs/quality/qa-approach.md`. The architecture decision here is the dependency model and boundaries; quality tooling must enforce those boundaries without redefining them. Avoid adding tooling unless a concrete project need appears.
