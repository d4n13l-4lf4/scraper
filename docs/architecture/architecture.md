---
document: Architecture
canonical_path: docs/architecture/architecture.md
version: 2
status: current
---

# Architecture

This document describes the architecture of the Hacker News Crawler: the style we chose, the dependency rules, the data-processing pipelines, the project structure and the cross-cutting decisions. It complements the product backlog (`docs/requirements/product_backlog.md`). Quality practices and verification procedures are defined in `docs/quality/qa-approach.md`.

## 1. Architectural style

**Hexagonal architecture (ports and adapters), organized into layered folders.** We make the boundaries explicit: inbound adapters call an inbound application port; an application service implements that port and depends on outbound ports; infrastructure adapters implement those outbound ports. The ceremony is intentionally lightweight and uses manual dependency injection rather than a DI framework.

| Style element | Decision | Reason |
|---|---|---|
| Layered folders, one-way flow | Adopted | Easy to navigate and to explain in a review |
| Hexagonal dependency rule (dependencies point inward, I/O behind ports) | Adopted | Keeps business behavior independent of delivery and infrastructure |
| Inbound port | Adopted | Gives each application capability an explicit contract for driving adapters |
| Use-case class | Adopted | Encapsulates orchestration behind the inbound port; one class per application use case |
| Outbound ports | Adopted | Makes external capabilities explicit and replaceable |
| Dependency injection | Adopted, manual | A composition root wires dependencies without introducing a container framework |
| DTO mapping | Adopted at adapter boundaries | Keeps transport contracts separate from domain/application models without creating unnecessary entity mappers |

### Dependency rule

```text
                 ┌──────────────────────────────┐
HTTP adapter ───▶│ Inbound port                 │
                 │ Application use-case service│───▶ Domain
                 │                              │
                 │ Outbound ports               │◀─── Infrastructure adapters
                 └──────────────────────────────┘

bootstrap / composition root ── constructs and wires all concrete dependencies
```

| Layer | Contains | May import | Must not import |
|---|---|---|---|
| `domain` | Models, typed errors, word counter, pipeline stages, filter registry | Nothing external | `application`, `infra`, `adapters`, any third-party library |
| `application` | Inbound port, use-case service, outbound port interfaces and application result types | `domain` | `infra`, `adapters`, Fastify, Cheerio, better-sqlite3 |
| `infra` | Implementations of the ports (native `fetch`, Cheerio, better-sqlite3, system clock) | `domain`, `application` (types only) | `adapters` |
| `adapters` | Inbound HTTP adapter, request/response DTOs and DTO mappers; parse input, invoke the inbound port, map errors | `application`, `domain` | `infra` |
| `bootstrap` / `main` | Manual DI composition root and entry point | Everything | n/a |

The dependency constraints are enforced by the architecture checks specified in `docs/quality/qa-approach.md`. Adapters never instantiate infrastructure implementations; only the composition root does.

## 2. Ports, use cases and dependency injection

The application layer owns the contracts (using `FilterType` from the domain and `RunFilterResult` from the application DTO). Inbound ports describe what the application offers to driving adapters; outbound ports describe what the application needs from infrastructure. Infrastructure implements outbound ports, while HTTP (and a future CLI) invokes inbound ports.

### Inbound port

```typescript
interface RunFilter {
  execute(filterId: FilterType, context?: { userAgent?: string }): Promise<RunFilterResult>;
}
```

`RunFilter` is the application-facing contract. The HTTP adapter depends on this interface, not on the concrete service class. The concrete implementation is `RunFilterService` in `application/use-cases/run-filter-service.ts`.

### Outbound ports

Declared under `application/ports/` and implemented under `infra/`:

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

interface Clock {
  now(): Date;           // request timestamp (UTC)
  monotonicMs(): number; // elapsed-time measurement
}

interface Logger {
  warn(message: string, context?: object): void;
  error(message: string, context?: object): void;
}
```

Fastify's built-in pino logger can be adapted to `Logger` in the composition root. The application layer does not import or know about pino.

### Use-case service

`RunFilterService` implements the inbound `RunFilter` port. It receives its outbound ports and configuration through constructor injection. It owns orchestration, not HTTP concerns. The class is a deliberate boundary, not a reason to turn pure domain operations into classes.

### DTO mapping

DTOs belong to delivery adapters. The HTTP adapter maps validated query input into application input and maps `RunFilterResult` into the documented HTTP response DTO. Domain entities and application result types are not serialized directly as an accidental API contract. A separate mapper is added only where a boundary actually needs a different shape; there is no generic mapper per domain entity by default.

The public HTTP contract is specified in `docs/api/openapi.yaml`; adapter
request and response DTOs must conform to it. The document-first workflow and
generation of its readable reference are defined in
`docs/quality/qa-approach.md`.

### Composition root / DI container

`bootstrap.ts` is the composition root and the project's lightweight DI container. It constructs the fetcher, parser, SQLite repository, clock, logger adapter and `RunFilterService`, then injects the inbound port into the HTTP server. Use manual constructor/factory wiring; do not add a third-party DI framework for this application.

## 3. Data processing: a pipeline of pure stages

Pipes and filters is the **micro-architecture inside the core**. The macro architecture remains ports and adapters.

```text
 infra: extraction pipeline
 html ▶ extractRows ▶ take(30) ▶ parseRow (per row) ▶ collectStats
 └──────────────── exposed through the EntryParser port ─────────────┘

 domain: filter pipeline (one per canonical filter id, held in the registry)
 entries ▶ byWordCount(predicate) ▶ sortByDesc(key)

 application: RunFilterService.execute
 resolveFilter ▶ fetch ▶ parse ▶ apply filter ▶ persist usage ▶ result
```

### Design rules

- **Stages are pure functions** with a single shared type, so composition needs no casts and nothing mutates its input:

  ```typescript
  type Stage<T> = (items: readonly T[]) => T[];
  const pipe = <T>(...stages: Stage<T>[]): Stage<T> => (items) =>
    stages.reduce<T[]>((acc, stage) => stage(acc), [...items]);
  ```

- **Filters are data, not classes.** The two business filters differ only in predicate and sort key:

  | Canonical id | Pipeline |
  |---|---|
  | `more-than-five-words` | `pipe(byWordCount(gt(5)), sortByDesc('comments'))` |
  | `five-or-fewer-words` | `pipe(byWordCount(lte(5)), sortByDesc('points'))` |

  Adding a third filter means adding one registry entry.
- **Stable ordering.** Equal sort keys keep the original Hacker News order.
- **The Hacker News adapter lives in `infra/hn/`.** This folder owns upstream fetching, page extraction, row parsing, and parser-specific support concepts such as representing an individual row's parse outcome. These concerns stay out of `domain`; their concrete types and file layout are chosen during implementation. The use case only sees parsed entries through `EntryParser`.
- **Row-level errors do not abort the pipeline.** `parseRow` returns a `ParseResult` (ok or error); `collectStats` counts `rowsFound`, `parsed` and `parseErrors`. A skipped row is not backfilled. Zero rows found raises `PageStructureError`.
- **Terminology:** a *stage* is a pipeline step; a *filter* is one of the two business operations, defined as a composed pipeline of stages.
- **Scope of the pattern:** this is synchronous, in-process function composition over at most 30 items. There are no streams, queues or concurrent workers. The pattern is the inspiration, not a framework.

## 4. The `RunFilter` use case

`RunFilterService.execute` is the delivery-agnostic implementation of the inbound `RunFilter` port, shared by REST now and a CLI later.

1. Resolve the filter id (`InvalidFilterError` for unknown ids, before any network call or usage record).
2. Capture the request timestamp through `Clock`.
3. Fetch the HTML (`HtmlFetcher`).
4. Parse entries and stats (`EntryParser`).
5. Apply the filter pipeline from the registry.
6. Persist a usage record (`UsageRepository`).
7. Return `{ filter, entries, stats, usageRecorded }`.

Failure behavior:
- After a valid filter id, any scraping failure triggers an attempt to persist a `failure` record, then the domain error is rethrown.
- If persisting a *successful* run fails, the results are still returned with `usageRecorded: false` and the error is reported through `Logger`. The result is never presented as stored when it was not.

## 5. Error handling

The domain raises typed errors with stable identities. Only a delivery
adapter maps them to transport-specific responses. The HTTP status codes,
public error codes, and error response schema are defined in
`docs/api/openapi.yaml`.

| Domain error | Domain/application behavior | Usage behavior |
|---|---|---|
| `InvalidFilterError` | Raised before network activity | No usage record |
| `UpstreamTimeoutError` | Upstream request timed out | Failure record attempted |
| `UpstreamUnavailableError` | Network failure or non-success upstream response | Failure record attempted |
| `PageStructureError` | No story rows found | Failure record attempted |
| `PersistenceError` | Must not hide a successful result | Reported; successful result has `usageRecorded: false` |
| any other error | Propagated to the delivery adapter as an unexpected failure | Failure record attempted after a valid filter |

A future CLI adapter maps the same errors to its own exit-code contract.

## 6. Project structure

```text
src/
├── domain/
│   ├── models.ts                  Entry, ScrapeStats, UsageLog, FilterType
│   ├── errors.ts                  typed errors with stable codes
│   ├── word-counter.ts
│   ├── pipeline/
│   │   ├── pipe.ts
│   │   └── stages.ts              byWordCount, sortByDesc
│   └── filters/
│       ├── definitions.ts         the two pipelines
│       └── registry.ts            resolveFilter(id)
├── application/
│   ├── ports/
│   │   ├── inbound/
│   │   │   └── run-filter.ts      driving port
│   │   └── outbound/
│   │       ├── html-fetcher.ts
│   │       ├── entry-parser.ts
│   │       ├── usage-repository.ts
│   │       ├── clock.ts
│   │       └── logger.ts
│   ├── dto/
│   │   └── run-filter-result.ts   application result contract
│   └── use-cases/
│       └── run-filter-service.ts  implements RunFilter
├── infra/
│   ├── hn/
│   │   ├── hn-fetcher.ts
│   │   ├── extract-rows.ts
│   │   ├── parse-row.ts
│   │   └── parse-entries.ts       composes the extraction pipeline
│   ├── sqlite/
│   │   ├── connection.ts
│   │   ├── schema.ts
│   │   └── sqlite-usage-repository.ts
│   └── system-clock.ts
├── adapters/
│   └── http/
│       ├── dto/
│       │   ├── entries-query.ts   HTTP request DTO / validation schema
│       │   └── entries-response.ts HTTP response DTO
│       ├── mappers/
│       │   └── entries-mapper.ts  application result ↔ HTTP response
│       ├── build-server.ts        Fastify instance, testable via inject
│       ├── entries-route.ts       invokes inbound port
│       └── error-handler.ts       domain error → status and code
├── config.ts                      env parsing and defaults, one place
├── bootstrap.ts                   manual DI composition root
└── main.ts                        HTTP entry point
docs/
├── api/
│   └── openapi.yaml                public HTTP contract
├── architecture/
│   └── architecture.md
├── delivery/
│   └── ci-cd.md                     conceptual delivery model
├── quality/
│   └── qa-approach.md
└── requirements/
    ├── statement.md
    └── product_backlog.md
```

### Conventions

- Source-code file names are kebab-case.
- Imports are relative; no path aliases (they tend to cause friction across tsc, tsx and Vitest).
- ESM with NodeNext module resolution, so relative import paths end in `.js`.
- `bootstrap.ts` exists so a CLI is `main-cli.ts` plus `adapters/cli/` and nothing else.

## 7. Cross-cutting decisions

| Concern | Decision |
|---|---|
| Errors | Typed domain errors with `code`; mapping to transport happens only in adapters |
| Logging | Minimal outbound `Logger` port (`warn`, `error`); a small adapter bridges Fastify/pino; application never imports Fastify |
| Time | All timestamps and durations come from the `Clock` port; tests never use the real clock |
| Configuration | Read once in `config.ts` (`PORT`, `HN_URL`, `REQUEST_TIMEOUT_MS`, `DB_PATH`), passed down as plain values; `process.env` is not read anywhere else |
| Persistence | SQLite via `better-sqlite3`, parameterized statements only, `:memory:` in tests |
| Immutability | Stages and filters never mutate their input |

## 8. Quality assurance reference

Test levels, test organization, coverage targets, static quality tooling, architecture-check configuration, and CI gates are specified in `docs/quality/qa-approach.md`. This architecture document owns the dependency rules those checks verify; the QA approach owns how and when they are verified.

## 9. Extending the system

- **Add a CLI:** create `adapters/cli/`, reuse `bootstrap`, map domain errors to exit codes.
- **Add a filter:** add a pipeline in `filters/definitions.ts` and register it under a new canonical id and `FilterType` member.
- **Swap storage:** implement `UsageRepository` and change one line in `bootstrap.ts`.
- **Swap the HTML source or parser:** implement `HtmlFetcher` or `EntryParser`; the use case is unaffected.

## 10. Quality tooling reference

Type checking, linting, formatting, architecture-check tooling, script names, and required CI gates are quality-process decisions maintained in `docs/quality/qa-approach.md`. The architecture decision here is the dependency model and boundaries; quality tooling must enforce those boundaries without redefining them. Avoid adding tooling unless a concrete project need appears.
