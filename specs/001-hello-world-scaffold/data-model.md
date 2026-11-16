# Data Model: Project Scaffold with Hello World Endpoint (v4 Architecture)

## Scope

US-01 establishes declarations for later stories. These are contracts only:
they do not retrieve Hacker News data, parse rows, apply filters, or persist
usage. The `GET /hello` response is described in
[contracts/hello-api.md](contracts/hello-api.md).

The v4 architecture organizes domain models by feature module:

- `src/modules/entries/domain/` — Hacker News filtering domain
- `src/modules/hello/` — temporary scaffold module (no domain logic)
- `src/shared/` — cross-cutting ports only

## Entries Module Domain Contracts (Declarations Only)

### `HackerNewsEntry`

Represents one story in the product contract.

| Field      | Meaning                                       | Constraint                                                              |
| ---------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `number`   | Rank displayed by Hacker News                 | Positive integer                                                        |
| `title`    | Story title without adjacent site-domain text | String                                                                  |
| `points`   | Story points                                  | Non-negative integer; missing upstream value is later treated as zero   |
| `comments` | Comment count                                 | Non-negative integer; absent or `discuss` link is later treated as zero |

The canonical type name is `HackerNewsEntry`, as specified by US-01 and the
backlog. Do not introduce a parallel `Entry` type.

**Location**: `src/modules/entries/domain/entities/hacker-news-entry.ts`

### `FilterType`

The canonical filter identifier union:

- `more-than-five-words`
- `five-or-fewer-words`

The scaffold declares these identifiers only; it does not apply either filter.

**Location**: `src/modules/entries/domain/filters/filter-type.ts`

### `ScrapeStats`

Represents the future extraction result counts:

- `rowsFound`: number of story rows inspected.
- `parsed`: number of successfully parsed rows.
- `parseErrors`: number of malformed rows skipped.

Counts are non-negative integers. The HTTP `FilterStats` contract also carries
`resultsCount` and `executionTimeMs`; those describe a completed future filter
request, not scraping behavior in this story.

**Location**: `src/modules/entries/domain/entities/scrape-stats.ts`

### `UsageLog`

Represents a future request-usage event; no storage schema or persistence is
created in US-01.

- `id`: unique event identifier.
- `timestamp`: request start time in UTC.
- `filter`: canonical `FilterType`.
- `processedEntries`, `resultsCount`, and `skippedRows`: non-negative counts;
  values unavailable on failure are recorded as zero by later behavior.
- `upstreamStatus` and `fetchDurationMs`: optional when known.
- `executionDurationMs`: total execution duration when recorded.
- `status`: `success` or `failure`.
- `errorMessage` and `userAgent`: optional contextual values.

**Location**: `src/modules/entries/domain/entities/usage-log.ts`

### Typed Domain Errors

Declare stable identities for `InvalidFilterError`, `UpstreamTimeoutError`,
`UpstreamUnavailableError`, `PageStructureError`, and `PersistenceError`.
Public mappings use the OpenAPI codes `invalid_filter`, `upstream_timeout`,
`upstream_unavailable`, `page_structure`, and `internal_error` as applicable.
`PersistenceError` remains internal; it does not add a public error code or
turn a successful result into a failure. US-01 does not implement the
conditions that raise these errors or their request-processing behavior.

**Location**: `src/modules/entries/domain/errors/`

### Filter Definitions & Registry

The two business filters differ only in predicate and sort key:

| Canonical id           | Pipeline                                           |
| ---------------------- | -------------------------------------------------- |
| `more-than-five-words` | `pipe(byWordCount(gt(5)), sortByDesc('comments'))` |
| `five-or-fewer-words`  | `pipe(byWordCount(lte(5)), sortByDesc('points'))`  |

**Location**: `src/modules/entries/domain/filters/definitions.ts`
**Registry**: `src/modules/entries/domain/filters/registry.ts`

### Pipeline Stages

Pure functions for filter composition:

- `pipe` — composes stages
- `byWordCount(predicate)` — filters by word count
- `sortByDesc(key)` — sorts by key descending, stable

**Location**: `src/modules/entries/domain/pipeline/`

### Word Counter Service

Implements the word-counting rules from the product contract:

- Whitespace-separated tokens containing at least one Unicode letter/number
- Punctuation-only tokens don't count
- Hyphenated expressions count as one token

**Location**: `src/modules/entries/domain/services/word-counter.ts`

---

## Entries Module Application Contracts (Declarations Only)

### `RunFilterResult`

The declared future application result contains the selected `filter`, the
ordered `entries`, processing `stats`, and `usageRecorded` status. It is not
produced by the Hello World use case.

**Location**: `src/modules/entries/application/models/run-filter.result.ts`

### `RunFilter` Inbound Port

The application-facing contract for the filter use case.

**Location**: `src/modules/entries/application/ports/run-filter.port.ts`

### Outbound Ports

- `HtmlFetcher` — fetches HTML from Hacker News
- `EntryParser` — parses HTML into entries + stats
- `UsageRepository` — persists usage logs

**Location**: `src/modules/entries/application/ports/`

### Use Case Stub

`RunFilterUseCase` — implements `RunFilter`, throws "not implemented" (implementation in US-09).

**Location**: `src/modules/entries/application/use-cases/run-filter.use-case.ts`

---

## Hello Module (Temporary Scaffold)

The `hello` module has **no domain logic** — it is a temporary scaffold to
demonstrate the v4 module structure.

### `GetHello` Inbound Port

```typescript
interface GetHello {
  execute(): Promise<string>;
}
```

**Location**: `src/modules/hello/application/ports/get-hello.port.ts`

### `GetHelloUseCase`

Returns `"Hello, world!"`.

**Location**: `src/modules/hello/application/use-cases/get-hello.use-case.ts`

### `HelloResponse` DTO

```typescript
interface HelloResponse {
  message: string;
}
```

**Location**: `src/modules/hello/presentation/http/hello-response.dto.ts`

---

## Shared Kernel (Cross-Cutting)

### `Clock` Port

```typescript
interface Clock {
  now(): Date;
  monotonicMs(): number;
}
```

**Location**: `src/shared/application/ports/clock.port.ts`

### `Logger` Port

```typescript
interface Logger {
  warn(message: string, context?: object): void;
  error(message: string, context?: object): void;
}
```

**Location**: `src/shared/application/ports/logger.port.ts`

### Infrastructure Adapters

- `SystemClock` — implements `Clock`
- `PinoLoggerAdapter` — implements `Logger` using Fastify's pino
- `SqliteConnection` — creates `better-sqlite3` connection

**Location**: `src/shared/infrastructure/`

---

## Infrastructure-Boundary Type (Entries Module)

### `ParseResult<T>`

Represents either a successful row value or a row-level parse error.
This declaration does not include extraction or parsing logic.

**Location**: `src/modules/entries/infrastructure/hacker-news/parse-result.ts`

---

## Configuration

Centralized in `src/config.ts`:

- `PORT` (default 3000)
- `HN_URL` (default `https://news.ycombinator.com/`)
- `REQUEST_TIMEOUT_MS` (default 10000)
- `DB_PATH` (default `data/hacker-news.db`)
- `NODE_ENV` (default `development`)

---

## Relationships

- A future filter result contains zero or more `HackerNewsEntry` values and processing statistics.
- A future usage log identifies one filter request and its outcome.
- `FilterType` identifies the selection in both a future filter result and usage log.
- The Hello response is independent of all crawler and usage entities.
- The `entries` module owns its domain and application contracts; the `hello` module is independent.
- Cross-cutting concerns (`Clock`, `Logger`, `DB`) live in `shared/` and are injected into module containers.
