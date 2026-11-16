---
document: Product Backlog
canonical_path: docs/requirements/product_backlog.md
version: 2
status: current
---

# Hacker News Crawler — Product Backlog (REST API)

## Purpose and authority

This backlog plans delivery and records product behavior, operational needs,
user stories, dependencies, and milestones. It is not the source of truth for
architecture or quality practices:

- System structure, boundaries, and implementation design are defined in
  [`docs/architecture/architecture.md`](../architecture/architecture.md).
- Test practices, test levels, tools, coverage, and quality gates are defined
  in [`docs/quality/qa-approach.md`](../quality/qa-approach.md).
- The public HTTP contract is defined in
  [`docs/api/openapi.yaml`](../api/openapi.yaml).
- Pipeline orchestration and release publication are described in
  [`docs/delivery/ci-cd.md`](../delivery/ci-cd.md).

Stories may reference those documents where implementation or verification
must follow an established decision. They do not restate those decisions.
Acceptance criteria below specify the behavior or deliverable to verify at the
level of each story.

## 1. Product intent and scope

**Product outcome:** Users can request one of two filters over the first 30
Hacker News stories. The service returns the requested story data and records
usage so an operator can understand requests and crawler behavior.

### In scope

- Retrieve and report on the first 30 story rows from the Hacker News homepage.
- Provide a REST endpoint for the two filtering options.
- Return the story number, title, points, and comment count, plus processing
  statistics.
- Persist usage records for successful and failed valid-filter requests.
- Report clear errors when a request cannot be completed.

### Out of scope for this backlog

- A browser-based frontend, user authentication, caching, or browser
  automation.
- A CLI in the initial delivery. It may be considered as a future product
  increment; its implementation approach is covered by the architecture
  document.

### Product and operational references

The following are product contracts. Their implementation and verification
follow the architecture and QA references above.

#### Canonical filters

The same identifiers are used in requests and returned results.

| Identifier | Included titles | Ordering |
| --- | --- | --- |
| `more-than-five-words` | More than five words | Comments, descending |
| `five-or-fewer-words` | Five or fewer words | Points, descending |

Equal sort values preserve the original Hacker News order.

#### Word-counting behavior

A word is a whitespace-separated token containing at least one Unicode
letter or number. Punctuation-only tokens do not count; punctuation attached
to a word does not add a word; a hyphenated expression is one token.

| Title | Count |
| --- | ---: |
| `Hello World` | 2 |
| `This is - a self-explained example` | 5 |
| `!!! - ???` | 0 |
| `Hello, world!` | 2 |
| `One-two three` | 2 |
| `AI: What's new?` | 3 |
| `C++ is 100% fun` | 4 |

#### Story data and page behavior

- A story is identified by a Hacker News story row and its associated
  subtext; navigation links are not stories.
- The reported number is the rank displayed by Hacker News, not an array
  position.
- The title excludes any adjacent site-domain text.
- Missing points count as zero.
- Comments are taken from the comment or `discuss` link, not the age link.
  `discuss` or no comment link means zero. Singular and plural comment labels,
  including non-breaking spaces, are supported.
- Malformed story rows among the first 30 are skipped and counted. They are
  not replaced by later rows.
- Fewer than 30 valid stories is a valid result. A page with no story rows is
  an upstream page-structure failure, not an empty successful result.

#### HTTP behavior

The endpoint path, request parameters, response schemas, HTTP status codes,
public error codes, and error response shape are defined in
`docs/api/openapi.yaml`; do not duplicate those wire-level definitions here.
At the product level, an unsupported filter is rejected before scraping, a
failure after a valid filter is selected triggers an attempt to record a
failure usage event, and failure to record a successful request must not turn
that successful result into an error response.

#### Usage information

Each recorded usage event includes the request timestamp (UTC, captured when
the request starts), filter identifier, number of parsed entries processed,
number of results, skipped-row count, upstream status when known, fetch
duration when known, total execution duration, success/failure status, an
error message when applicable, and the caller's user-agent when available.
Counts that could not be computed for a failure are recorded as zero.

#### Runtime configuration

The service can be configured with a listening port, Hacker News URL,
upstream timeout, and usage-storage location. Initial defaults are port 3000,
`https://news.ycombinator.com/`, 10,000 ms, and `data/hacker-news.db`,
respectively. The configuration interface and wiring follow the architecture
reference.

---

## 2. User stories

## Phase 1 — Project foundation

### US-01: Establish a runnable project foundation

**As a** developer, **I want** a buildable service foundation **so that** the
planned product capabilities can be delivered incrementally.

**Planned work:**

- Initialize the repository and package metadata for the selected project
  platform.
- Add the application entry point, configuration inputs, and documented
  startup commands.
- Follow the project structure and implementation constraints in the
  architecture reference.

**Acceptance criteria:**

1. **Given** a clean checkout and the runtime declared by the project,
   **when** a developer follows the installation instructions, **then**
   dependencies install without errors.
2. **Given** the installed project, **when** the production build command is
   run, **then** it succeeds and produces the configured build output.
3. **Given** the service is started with default settings, **when** startup
   completes, **then** it uses the documented defaults and reports a startup
   failure clearly if it cannot bind or initialize a required resource.
4. **Given** an operator supplies supported configuration values, **when** the
   service starts, **then** those values are used instead of their defaults.

---

### US-02: Prepare the automated verification workflow

**As a** developer, **I want** the required quality checks available from the
project **so that** changes can be verified consistently before delivery.

**Planned work:**

- Configure the project checks and command interface specified by the QA
  approach.
- Ensure local and continuous-integration workflows can run the required
  checks.
- Add a small representative test to verify that the workflow is connected.

**Acceptance criteria:**

1. **Given** the project dependencies are installed, **when** the documented
   test command is run, **then** the configured automated test suite executes
   and reports its result with the appropriate process exit status.
2. **Given** a deliberately failing test, **when** the relevant test command
   is run, **then** the failure is reported and the command exits
   unsuccessfully.
3. **Given** the test workflow requirements in the QA approach, **when** the
   project checks are configured, **then** required checks and opt-in checks
   are separated as specified there.
4. **Given** the configured project checks, **when** a developer follows the
   QA approach, **then** each required check can be run using its documented
   command.

---

### US-03: Define the story and request data contracts

**As a** developer, **I want** the product's story, filter, statistics, usage,
and error information represented consistently **so that** features can
exchange the correct data.

**Planned work:**

- Represent the story fields and two canonical filter identifiers defined in
  the product contract.
- Represent parsing statistics and usage information needed by later stories.
- Provide stable error identifiers and useful messages for product failures.
- Follow the domain boundaries defined in the architecture reference.

**Acceptance criteria:**

1. **Given** a story value, **when** it is represented by the application,
   **then** it contains a number, title, points, and comment count.
2. **Given** a filter identifier, **when** it is accepted as a supported
   product value, **then** it is one of the two canonical identifiers in this
   backlog.
3. **Given** parsing completes, **when** its statistics are returned,
   **then** they distinguish rows found, entries parsed, and parse errors.
4. **Given** a product-level failure, **when** it is reported, **then** it
   provides a stable error code and a useful message.

---

## Phase 2 — Retrieve and filter stories

### US-04: Retrieve the Hacker News homepage

**As a** user, **I want** the service to retrieve the Hacker News page
reliably **so that** my filter request can use current story data.

**Planned work:**

- Retrieve the configured Hacker News URL with a configurable timeout.
- Identify the crawler in the request.
- Report response status and fetch duration to the calling workflow.
- Apply the failure behavior in the product contract.

**Acceptance criteria:**

1. **Given** the upstream returns a successful response, **when** the page is
   retrieved, **then** its HTML, HTTP status, and non-negative fetch duration
   are made available to the next step.
2. **Given** the upstream does not respond before the configured timeout,
   **when** retrieval completes, **then** the timeout failure is reported and
   is distinguishable from other upstream failures.
3. **Given** the upstream returns a non-success status, **when** retrieval
   completes, **then** an upstream failure is reported with the status when
   known, not as an empty successful page.
4. **Given** a network failure occurs, **when** retrieval completes,
   **then** an upstream failure is reported.
5. **Given** an outbound request is made, **when** its headers are inspected,
   **then** it contains the configured identifying user-agent.

---

### US-05: Extract the first 30 story entries

**As a** user, **I want** the first 30 Hacker News stories returned as
structured data **so that** filtering does not depend on raw HTML.

**Planned work:**

- Extract story rows from the retrieved page and map them to the product's
  story fields.
- Apply the parsing behavior specified in the product contract.
- Provide representative page examples for the required cases, following the
  QA approach.

**Acceptance criteria:**

1. **Given** at least 30 valid story rows among the first 30 story rows,
   **when** the page is parsed, **then** the result contains those 30 entries
   in their original page order.
2. **Given** more than 30 story rows, **when** the page is parsed, **then**
   rows after the first 30 are not considered.
3. **Given** a valid story row, **when** it is parsed, **then** its displayed
   rank, title, points, and comment count are returned correctly.
4. **Given** fewer than 30 story rows, **when** the page is parsed,
   **then** all valid entries are returned without artificial entries.
5. **Given** a story row has no points value, **when** it is parsed,
   **then** its points value is zero.
6. **Given** a story has a `discuss` link or no comment link, **when** it is
   parsed, **then** its comment count is zero.
7. **Given** a subtext row contains both an age link and a comment link,
   **when** it is parsed, **then** the count comes from the comment link.
8. **Given** a title has adjacent site-domain text, **when** it is parsed,
   **then** the returned title excludes that domain text.
9. **Given** a malformed row occurs among the first 30 story rows,
   **when** the page is parsed, **then** that row is skipped, the parse-error
   count increases by one, and a later row is not used to replace it.
10. **Given** a page contains zero story rows, **when** parsing completes,
   **then** a page-structure failure is reported rather than an empty success.
11. **Given** navigation links are present on the page, **when** it is parsed,
    **then** they are not returned or counted as stories.

---

### US-06: Count words in story titles

**As a** user, **I want** title word counts to follow one consistent rule
**so that** stories are assigned to the intended filter.

**Planned work:**

- Implement the word-count behavior described in the product contract.
- Include boundary and representative Unicode cases in the verification
  scenarios, following the QA approach.

**Acceptance criteria:**

1. **Given** `This is - a self-explained example`, **when** its words are
   counted, **then** the result is 5.
2. **Given** `One-two three`, **when** its words are counted, **then** the
   result is 2.
3. **Given** a title with leading, trailing, repeated, or non-breaking
   whitespace, **when** its words are counted, **then** whitespace does not
   create extra words.
4. **Given** an empty or punctuation-only title, **when** its words are
   counted, **then** the result is 0.
5. **Given** tokens such as `C++` or `100%`, **when** their words are counted,
   **then** each token containing a letter or number counts once.
6. **Given** a title containing letters or numbers from non-Latin scripts,
   **when** its words are counted, **then** tokens containing those
   characters are counted according to the product rule.

---

### US-07: Make supported filter options available

**As a** user, **I want** requests to be matched to one of the supported
filter options **so that** each request applies a known product rule.

**Planned work:**

- Make the canonical filter identifiers and their product behavior available
  to the request-processing workflow.
- Follow the filter organization in the architecture reference without
  restating its implementation design here.

**Acceptance criteria:**

1. **Given** `more-than-five-words`, **when** a filter option is selected,
   **then** the selected option identifies the more-than-five-words rule and
   comments-descending order.
2. **Given** `five-or-fewer-words`, **when** a filter option is selected,
   **then** the selected option identifies the five-or-fewer-words rule and
   points-descending order.
3. **Given** an unsupported identifier, **when** an option is selected,
   **then** it is rejected as an invalid filter.
4. **Given** the supported product options are inspected, **when** their
   identifiers are listed, **then** they contain exactly the two canonical
   identifiers in this backlog.

---

### US-08: Apply the two story filters

**As a** user, **I want** stories filtered and ordered according to my
selected option **so that** I can find long titles with discussion or short
titles with high points.

**Planned work:**

- Apply each filter's inclusion and ordering behavior from the product
  contract.
- Verify exact threshold behavior and stable ordering.

**Acceptance criteria:**

1. **Given** stories with mixed title word counts, **when**
   `more-than-five-words` is applied, **then** only stories with more than
   five words are returned.
2. **Given** a story with exactly five title words, **when**
   `more-than-five-words` is applied, **then** that story is excluded.
3. **Given** qualifying stories with different comment counts, **when**
   `more-than-five-words` is applied, **then** they are ordered by comments
   descending.
4. **Given** qualifying stories with equal comment counts, **when**
   `more-than-five-words` is applied, **then** their original relative order
   is preserved.
5. **Given** a story with exactly five title words, **when**
   `five-or-fewer-words` is applied, **then** that story is included.
6. **Given** a story with six title words, **when**
   `five-or-fewer-words` is applied, **then** that story is excluded.
7. **Given** qualifying stories with different point counts, **when**
   `five-or-fewer-words` is applied, **then** they are ordered by points
   descending.
8. **Given** qualifying stories with equal point counts, **when**
   `five-or-fewer-words` is applied, **then** their original relative order
   is preserved.
9. **Given** either filter returns no matches, **when** the result is
   produced, **then** it is an empty result and not an error.

---

## Phase 3 — Usage records and request processing

### US-09: Initialize durable usage storage

**As a** system operator, **I want** usage storage to be initialized
reliably **so that** requests can be recorded without manual database setup.

**Planned work:**

- Initialize the selected usage store using the storage decisions in the
  architecture reference.
- Support the configured storage location and a test-friendly isolated
  storage mode as specified by the architecture and QA references.

**Acceptance criteria:**

1. **Given** the service is started with no existing usage store, **when**
   initialization completes, **then** the store is ready to accept usage
   records without manual setup.
2. **Given** the usage store already contains records, **when** the service
   initializes it again, **then** existing records remain unchanged.
3. **Given** a usage record has a status other than `success` or `failure`,
   **when** it is stored, **then** the invalid status is rejected.
4. **Given** the service is shutting down, **when** its storage resources are
   released, **then** the shutdown completes without leaving the store
   unusable or corrupting previously recorded events.

---

### US-10: Record and retrieve usage information

**As a** system operator, **I want** completed and failed requests recorded
with useful context **so that** I can inspect usage and crawler behavior.

**Planned work:**

- Persist the usage information listed in the product contract.
- Make stored records retrievable in newest-first order for application use.
- Follow the storage design and persistence verification approach in the
  architecture and QA references.

**Acceptance criteria:**

1. **Given** a successful filter request, **when** its usage event is
   retrieved, **then** it has status `success` and the correct filter id.
2. **Given** a failed valid-filter request, **when** its usage event is
   retrieved, **then** it has status `failure`, the filter id, and an error
   description when one is available.
3. **Given** a completed request, **when** its usage event is retrieved,
   **then** its timestamp is UTC ISO 8601 and reflects when the request
   started.
4. **Given** a request with parsed entries, **when** its usage event is
   retrieved, **then** processed-entry count, result count, and skipped-row
   count match the request outcome.
5. **Given** a request with known upstream status and durations, **when** its
   usage event is retrieved, **then** those values are recorded; values that
   are not known are left unspecified rather than fabricated.
6. **Given** multiple usage events, **when** recent history is retrieved,
   **then** each event has a unique identifier and records are ordered newest
   first.

---

### US-11: Process a filter request

**As a** user, **I want** a filter request to run as one coherent operation
**so that** I receive results and accurate usage information.

**Planned work:**

- Coordinate filter selection, story retrieval, parsing, filtering, and usage
  recording as defined by the product behavior and architecture reference.
- Preserve the specified outcomes when a step fails.

**Acceptance criteria:**

1. **Given** an unsupported filter id, **when** a request is processed,
   **then** it is rejected before story retrieval and no usage event is
   written.
2. **Given** a supported filter and successful retrieval, parsing, filtering,
   and usage recording, **when** the request completes, **then** it returns
   the selected filter, matching entries, parsing statistics, and
   `usageRecorded: true`.
3. **Given** a supported filter and a retrieval or processing failure,
   **when** the request completes, **then** a failure usage event is
   attempted and the original failure remains the request outcome.
4. **Given** a successful filter operation but usage storage fails, **when**
   the request completes, **then** its results are still returned with
   `usageRecorded: false` and the storage failure is reported for
   diagnostics.
5. **Given** parsed rows include malformed stories, **when** the filter is
   processed, **then** valid parsed stories are filtered and the returned
   statistics include the skipped-row count.

---

## Phase 4 — REST delivery and project handoff

### US-12: Expose filter requests through REST

**As a** user, **I want** to request a filter over HTTP **so that** I can
retrieve matching Hacker News entries from a client.

**Planned work:**

- Expose filter requests over HTTP as specified by the OpenAPI contract.
- Deliver the OpenAPI contract for the endpoint and implement the behavior
  described by that contract.
- Use the HTTP adapter boundaries in the architecture reference.

**Acceptance criteria:**

1. **Given** a request with `filter=more-than-five-words`, **when** the
   request succeeds, **then** it returns the matching stories and conforms to
   the success response defined in the OpenAPI contract.
2. **Given** a request with `filter=five-or-fewer-words`, **when** the
   request succeeds, **then** it returns stories ordered by points descending
   and conforms to the success response defined in the OpenAPI contract.
3. **Given** the endpoint is delivered, **when** the OpenAPI contract is
   validated, **then** it describes the endpoint and its public request and
   response contract.
4. **Given** a valid request produces no matches, **when** the response is
   built, **then** it is a successful response with an empty entries list.
5. **Given** the filter parameter is missing or unsupported, **when** the
   endpoint is called, **then** it rejects the request according to the
   OpenAPI contract and does not retrieve the Hacker News page.
6. **Given** a request includes a User-Agent header, **when** its usage event
   is recorded, **then** that value is included when available.

---

### US-13: Communicate request failures safely

**As a** user, **I want** understandable and safe failure responses **so
that** I know when a request could not be completed without receiving
internal diagnostics.

**Planned work:**

- Apply the OpenAPI contract to upstream, page-structure, and unexpected
  failures.
- Ensure valid-filter failures attempt to create a failure usage event.
- Ensure failure responses conform to the OpenAPI contract; follow the QA
  approach for verification.

**Acceptance criteria:**

1. **Given** the upstream request times out, **when** the endpoint is called
   with a valid filter, **then** the response matches the timeout response in
   the OpenAPI contract.
2. **Given** the upstream is unreachable or returns a non-success status,
   **when** the endpoint is called with a valid filter, **then** the response
   matches the upstream failure response in the OpenAPI contract and is not
   presented as a successful empty result.
3. **Given** the retrieved page contains no story rows, **when** the endpoint
   is called with a valid filter, **then** the response matches the page
   structure failure response in the OpenAPI contract.
4. **Given** a valid-filter request fails during retrieval or processing,
   **when** the failure is handled, **then** a failure usage event is
   attempted.
5. **Given** a successful request cannot be recorded, **when** its response
   is built, **then** it remains a success and reports `usageRecorded: false`
   as defined by the OpenAPI contract.
6. **Given** an unexpected error occurs, **when** its response is built,
   **then** it matches the unexpected-error response in the OpenAPI contract
   and exposes no internal diagnostic details.

---

### US-14: Document and prepare the project for handoff

**As a** project reviewer, **I want** clear usage and delivery
documentation **so that** I can install, run, and evaluate the service
independently.

**Planned work:**

- Document the product, installation, configuration, endpoint usage,
  filtering behavior, usage records, and limitations in the README.
- Link to the canonical OpenAPI contract and its generated API reference.
- Link to the CI/CD model without duplicating its pipeline instructions.
- Link to the architecture and QA documents instead of reproducing their
  definitions.
- Verify the documented workflow from a clean checkout.

**Acceptance criteria:**

1. **Given** a fresh checkout, **when** a reviewer follows the README,
   **then** they can install dependencies, configure the service, and build
   it successfully.
2. **Given** a running service, **when** a reviewer follows the documented
   endpoint examples, **then** both filters return the documented response
   shape.
3. **Given** the README describes implementation structure or verification,
   **when** a reviewer follows its links, **then** they reach the current
   architecture and QA reference documents without relying on duplicated
   definitions.
4. **Given** a reviewer needs the HTTP API contract, **when** they follow the
   README's API documentation link, **then** they can access the OpenAPI source
   and the generated human-readable reference.
5. **Given** the documented test workflow is followed, **when** the required
   checks are run, **then** their behavior matches the QA approach.
6. **Given** the service is started with no pre-created usage store,
   **when** a valid request is made, **then** usage storage is initialized
   automatically and the request can be recorded.

---

## 3. Dependencies and delivery milestones

### Planned dependency order

```text
US-01 Foundation → US-02 Verification workflow → US-03 Data contracts
US-03 → US-04 Retrieval, US-05 Parsing, US-06 Word counting
US-05 + US-06 → US-07 Filter options → US-08 Filter behavior
US-03 → US-09 Usage storage → US-10 Usage records
US-04 + US-05 + US-07 + US-08 + US-09 + US-10 → US-11 Request processing
US-11 → US-12 REST delivery → US-13 Failure responses → US-14 Handoff
```

### Milestones

- **Milestone 1 — Foundation and story behavior (US-01 to US-08):** runnable
  project, retrieval and parsing behavior, word counting, and both filters.
- **Milestone 2 — Usage and request processing (US-09 to US-11):** durable
  usage records and a complete filter-request operation.
- **Milestone 3 — Delivery and handoff (US-12 to US-14):** REST behavior,
  safe failure responses, and reviewer-ready documentation.

### Backlog-wide references

- Use `docs/architecture/architecture.md` for architecture and
  implementation-boundary decisions.
- Use `docs/quality/qa-approach.md` for test design and execution,
  development practices, and the Definition of Done.
- Acceptance criteria in each story are the behavior or deliverable to
  demonstrate for that story; the referenced QA approach determines suitable
  verification methods and required project-wide gates.
