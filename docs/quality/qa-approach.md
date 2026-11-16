---
document: QA Approach
canonical_path: docs/quality/qa-approach.md
version: 2
status: current
---

# QA Approach

This document records the quality-assurance decisions and working
practices for the Hacker News Crawler. It complements
`docs/architecture/architecture.md` and
`docs/requirements/product_backlog.md`: the architecture describes the
system boundaries, the backlog describes the required behavior, and this
document explains how that behavior is specified, implemented, verified,
and protected against regression. Architecture rules are defined in the
architecture document; this document owns the verification strategy and
quality gates, not a second definition of those rules. Pipeline orchestration
and release publication are described in
`docs/delivery/ci-cd.md`; this document remains authoritative for what each
quality gate requires.

## 1. Quality objectives

The QA approach is designed to provide confidence that:

-   The two canonical filters implement the assignment's rules exactly.
-   HTML extraction, parsing, persistence, and HTTP delivery behave
    correctly at their boundaries.
-   Application and domain behavior remain independent of network,
    database, and HTTP frameworks.
-   Changes are developed incrementally using test-first practices.
-   The codebase remains type-safe, consistently formatted, lint-clean,
    and compliant with its dependency rules.
-   The automated checks are repeatable and suitable for local
    development and continuous integration.

Tests must verify observable behavior and meaningful outcomes. Achieving
a coverage target is necessary, but coverage alone is not proof of
correctness.

## 2. Testing methodology: TDD and BDD

### 2.1 Test-Driven Development is mandatory

Implementation follows the **Red -- Green -- Refactor** cycle:

1.  **Red --- specify first:** identify a small behavior from a user
    story or acceptance criterion and write the test before the
    production implementation.
2.  Run the test and confirm that it fails for the expected reason. A
    test that fails because of a broken test setup does not complete
    this step.
3.  **Green --- implement minimally:** write the smallest production
    change that makes the test pass.
4.  **Refactor --- improve safely:** improve the implementation and,
    where appropriate, the tests without changing the externally
    observable behavior.
5.  Re-run the relevant tests. Before completing the change, run the
    required quality gates.

Work in small vertical slices. Do not write an entire story's
implementation first and add tests afterwards. Tests are part of the
implementation, not a final testing phase.

### 2.2 Behavior-Driven Development for acceptance behavior

BDD complements TDD:

-   **BDD** describes what the system should do from an external,
    behavior-focused perspective.
-   **TDD** guides the implementation of that behavior through small,
    failing tests.

Acceptance criteria are expressed as Gherkin scenarios where they
benefit from a readable Given--When--Then specification. These scenarios
describe externally observable behavior and must not prescribe internal
classes, functions, or folder structure.

The recommended workflow is:

1.  Derive or refine acceptance scenarios from the user story and its
    acceptance criteria.
2.  Use those scenarios to identify the domain, application,
    infrastructure, and delivery behaviors required.
3.  Implement each behavior incrementally with unit and integration TDD.
4.  Run the acceptance scenarios against the assembled application.
5.  Run the complete quality gates before considering the work done.

A Gherkin scenario may remain failing while its vertical slice is being
implemented, but it must pass before the related story is accepted.

## 3. Test types, tools, and responsibilities

  ------------------------------------------------------------------------
  Test level              Tool / approach          Primary responsibility
  ----------------------- ------------------------ -----------------------
  Unit                    Vitest                   Verify isolated domain
                                                   and application
                                                   behavior quickly and
                                                   deterministically

  Infrastructure          Vitest                   Verify real
  integration                                      infrastructure
                                                   components together,
                                                   using controlled
                                                   external boundaries

  HTTP adapter            Vitest + Fastify         Verify routes,
  integration             `inject`                 validation, response
                                                   mapping, and error
                                                   handling without
                                                   opening a network port

  Acceptance / E2E        Gherkin + Cucumber.js    Verify complete
                          (`@cucumber/cucumber`)   user-visible REST
                                                   behavior through the
                                                   assembled application

  Architecture            dependency-cruiser       Enforce allowed
                                                   dependency directions
                                                   and prevent forbidden
                                                   imports

  Coverage                Vitest +                 Measure and enforce
                          `@vitest/coverage-v8`    unit-test coverage

  Static quality          TypeScript, ESLint,      Enforce type safety,
                          Prettier                 code-quality rules, and
                                                   consistent formatting
  ------------------------------------------------------------------------

Vitest remains the runner for unit and integration tests. Cucumber.js is
used for Gherkin-based acceptance/E2E scenarios. Gherkin is the scenario
language; Cucumber.js executes those scenarios and binds their steps to
test code.

There is no browser UI in scope, so Playwright or Cypress is not
required. The E2E target is the REST API.

### 3.1 Unit tests

Unit tests cover:

-   Pure domain behavior: word counting, pipeline stages, filter
    definitions and registry behavior, and typed error behavior where
    applicable.
-   Application use-case behavior: orchestration, port interactions,
    usage-recording behavior, and failure paths.

Unit tests must not make real network calls or depend on a real
database. Application tests use controlled fakes or stubs for outbound
ports. Prefer simple fakes and stubs over extensive interaction mocking.

Infrastructure code whose behavior depends on a real library or external
system is primarily verified through integration tests (see below),
rather than forcing every adapter into isolated unit tests.

#### Unit test naming and structure

Use Vitest's `describe` and `it` functions. Test names follow the
**"should ..."** convention:

``` typescript
describe('wordCounter', () => {
  it('should return zero for an empty title', () => {
    expect(wordCounter('')).toBe(0);
  });

  it('should ignore punctuation-only tokens', () => {
    expect(wordCounter('Hello - world !!!')).toBe(2);
  });

  it('should count a hyphenated expression as one word', () => {
    expect(wordCounter('self-explained example')).toBe(2);
  });
});
```

Conventions:

-   A `describe` block identifies the module or behavior under test.
-   Each `it` describes one expected behavior and starts with "should".
-   Tests are deterministic, independent, and focused.
-   Use table-driven tests (`it.each`) for related examples and boundary
    values.
-   Assert meaningful results and side effects at the relevant boundary;
    avoid tests that merely repeat the implementation.
-   Do not test private implementation details when the behavior can be
    verified through the public contract.

#### Unit test directory mirrors `src`

The unit-test tree must resemble the production source tree so that
tests are easy to locate alongside the code they cover. For example:

``` text
src/
├── domain/
│   ├── models.ts
│   ├── errors.ts
│   ├── word-counter.ts
│   ├── pipeline/
│   │   ├── pipe.ts
│   │   └── stages.ts
│   └── filters/
│       ├── definitions.ts
│       └── registry.ts
└── application/
    └── use-cases/
        └── run-filter-service.ts

tests/
└── unit/
    ├── domain/
    │   ├── models.test.ts
    │   ├── errors.test.ts
    │   ├── word-counter.test.ts
    │   ├── pipeline/
    │   │   ├── pipe.test.ts
    │   │   └── stages.test.ts
    │   └── filters/
    │       ├── definitions.test.ts
    │       └── registry.test.ts
    └── application/
        └── use-cases/
            └── run-filter-service.test.ts
```

This is an illustrative mapping: create a test file when there is
behavior worth testing. Interface-only port declarations do not need
artificial standalone tests; their contracts are exercised through the
application services and adapters that use or implement them.

### 3.2 Unit coverage target

The required target is **100% coverage** for unit-testable production
code in:

-   `src/domain/**`
-   `src/application/**`

The 100% target applies independently to:

-   Statements
-   Branches
-   Functions
-   Lines

Coverage is enforced by the Vitest coverage configuration and must fail
the relevant CI check if any threshold is missed.

The target includes meaningful error and boundary paths, not only happy
paths. Exclusions should be exceptional, narrowly scoped, and documented
with a reason. Do not exclude business logic simply to make the report
pass.

Infrastructure and delivery adapters are verified primarily through
their integration and acceptance tests; the unit coverage target is not
a blanket requirement for every line of adapter or bootstrap code.

Coverage is a measure of execution, not a substitute for good
assertions. Tests must still verify correct values, ordering, error
behavior, and relevant persistence or logging outcomes.

### 3.3 Infrastructure integration tests

Infrastructure integration tests verify concrete implementations against
controlled dependencies.

  -----------------------------------------------------------------------
  Component                           Test approach
  ----------------------------------- -----------------------------------
  Hacker News fetcher                 Stub native `fetch`; verify
                                      successful response, non-2xx
                                      response, network failure, timeout,
                                      and elapsed-time behavior

  Hacker News parser                  Use saved HTML fixtures and the
                                      real Cheerio parser; verify
                                      extraction and parsing rules

  SQLite repository                   Use a real `better-sqlite3`
                                      in-memory database; verify schema
                                      creation, inserts, reads,
                                      constraints, and idempotency

  Clock adapter                       Use focused tests where useful;
                                      application tests should inject a
                                      controlled `Clock` port
  -----------------------------------------------------------------------

Parser fixtures should cover representative page structures, including a
normal page, fewer than 30 entries, job posts or other non-story rows,
`discuss` links, missing values, malformed rows, and an empty or
structurally invalid page. Fixture tests must preserve the agreed
parsing semantics in the backlog and architecture.

Use real components where the purpose of the test is to verify their
integration. Replace only uncontrolled boundaries, such as the upstream
network.

### 3.4 HTTP adapter integration tests

Use Vitest with Fastify's `inject` API. Build the actual Fastify
application and inject a fake or stub implementation of the inbound
`RunFilter` port.

Verify:

-   Valid query parameters invoke the application port with the expected
    input.
-   Invalid or missing filter identifiers are rejected as specified.
-   Application results are mapped to the documented HTTP response DTO.
-   Successful and error responses conform to `docs/api/openapi.yaml`.
-   Typed application/domain errors map to the correct HTTP status and
    error body.
-   Unexpected errors do not expose stack traces or internal details.
-   The adapter does not require a listening TCP port for its
    integration tests.

These tests verify the HTTP adapter boundary; they do not replace tests
of the real use case or the infrastructure adapters.

### 3.5 Acceptance and end-to-end tests

Use **Gherkin feature files with Cucumber.js** for a small, deliberate
set of deterministic acceptance scenarios. These tests exercise the
assembled REST application through HTTP and verify complete behavior
across the relevant layers. They are distinct from the opt-in live-site
smoke test described below: deterministic acceptance scenarios are part
of the normal verification workflow, while live-site checks are not.

Example:

``` gherkin
Feature: Filter Hacker News entries

  Scenario: Filter entries with more than five words
    Given the Hacker News page contains stories with different title lengths
    When the client requests the "more-than-five-words" filter
    Then only stories with more than five words should be returned
    And the results should be sorted by comments in descending order
```

A failure scenario may be expressed as:

``` gherkin
Feature: Handle an unavailable Hacker News service

  Scenario: The upstream service is unavailable
    Given the Hacker News service is unavailable
    When the client requests a valid filter
    Then the API should respond with status code 502
    And a failure usage record should be attempted
```

Acceptance scenarios should focus on the API contract and business
outcomes. Do not turn every unit or integration test into Gherkin: use
Vitest directly for low-level, implementation-focused tests, and reserve
Gherkin for behavior that benefits from a readable end-to-end
specification.

#### Controlled E2E environment

The default deterministic acceptance suite must not depend on the public
Hacker News service. It should use:

-   The real application composition and HTTP adapter.
-   A controlled local upstream HTTP server or equivalent deterministic
    upstream boundary.
-   A temporary SQLite database.
-   Known HTML fixtures and predictable responses.

This verifies the full application flow without making CI dependent on
an external website.

#### Live-site smoke test

A separate, explicitly opt-in smoke test may call the real Hacker News
website to detect major changes in the upstream page structure. It must:

-   Be excluded from the default test and CI suites.
-   Be invoked only through a dedicated command or explicit Cucumber
    tag.
-   Avoid assertions that depend on volatile story titles, points, or
    comment counts.
-   Report upstream/network failures distinctly from application
    regressions.

Live-site tests are supplementary diagnostics, not a substitute for
deterministic tests.

### 3.6 Document-first API contract (OpenAPI)

The canonical public HTTP contract is maintained as OpenAPI in
`docs/api/openapi.yaml`. It is the source of truth for endpoint paths,
parameters, request and response schemas, status codes, and public error
codes.

For every new or changed HTTP operation:

1. Update and review the OpenAPI contract before implementing the endpoint
   behavior.
2. Validate the OpenAPI document and its references.
3. Implement the endpoint and tests to conform to that contract; do not
   generate the contract from route handlers or function annotations.
4. Generate the human-readable API reference from the OpenAPI document. The
   generated reference is a derived artifact, not a separately maintained
   source of truth; do not edit it by hand.
5. Run contract validation and documentation generation in the documented
   project workflow. If generated output is checked in, verify it is
   reproducible and up to date.

The project must provide documented commands for contract validation and
reference generation. The specific tooling and command names are implementation
choices and must remain consistent with the OpenAPI source.

### 3.7 Architecture tests

Use **dependency-cruiser** to enforce the dependency rules defined in
`docs/architecture/architecture.md`. That document is the single
source of truth for allowed dependencies and the composition-root
boundary; do not redefine those rules here.

Architecture checks are automated and mandatory, and are not expressed
as a coverage percentage. The configuration must enforce the documented
layer boundaries and reject circular dependencies. Any intentional
exception must be reviewed and documented in the architecture document
before the rule is changed.

## 4. Static quality gates

The following tools and rules are adopted:

  -----------------------------------------------------------------------
  Gate                    Tool                    Required outcome
  ----------------------- ----------------------- -----------------------
  Type checking           TypeScript              Strict type checking
                          (`tsc --noEmit`)        passes

  Linting                 ESLint +                Zero errors and zero
                          `typescript-eslint`     warnings

  Formatting              Prettier                `prettier --check`
                                                  passes for tracked
                                                  source and
                                                  documentation

  Architecture            dependency-cruiser      All dependency rules
                                                  pass

  API contract            OpenAPI validator and   The contract is valid and
                          documentation generator the generated reference is
                                                  reproducible from the source

  Unit coverage           Vitest +                100% statements,
                          `@vitest/coverage-v8`   branches, functions,
                                                  and lines in `domain`
                                                  and `application`

  Build                   TypeScript compiler     Production build
                                                  succeeds
  -----------------------------------------------------------------------

ESLint should catch, at minimum, unused variables and imports, unsafe or
unjustified `any`, floating promises, unreachable code, and problematic
TypeScript patterns. Suppressions must be rare and explained. Prettier
owns formatting; avoid duplicating formatting rules in ESLint.

TypeScript should use strict mode and appropriate safeguards such as
`noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`,
`noUnusedParameters`, and `forceConsistentCasingInFileNames`.

## 5. Test organization

The following is the intended test layout. It can grow as implementation
requires, while retaining the unit-to-source mirroring rule.

``` text
tests/
├── unit/
│   ├── domain/                 mirrors src/domain/
│   └── application/            mirrors src/application/
├── integration/
│   ├── infra/
│   │   ├── hn/
│   │   └── sqlite/
│   └── adapters/
│       └── http/
├── acceptance/
│   ├── features/
│   │   └── *.feature
│   ├── steps/
│   │   └── *.steps.ts
│   └── support/
│       └── world.ts
├── e2e/
│   └── live/                   opt-in live-site smoke tests, if implemented
├── architecture/
│   └── dependency-rules/
├── fixtures/
│   └── hacker-news/
└── helpers/
    ├── fake-html-fetcher.ts
    ├── fake-entry-parser.ts
    ├── fake-usage-repository.ts
    └── test-database.ts
```

Shared helpers should remain small and explicit. Avoid building a
general-purpose test framework for this small application.

## 6. Suggested command interface

The scripts below describe the intended developer workflow. Exact
command names and Cucumber configuration should be implemented
consistently in `package.json` and the test configuration.

``` json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier . --write",
    "format:check": "prettier . --check",
    "typecheck": "tsc --noEmit",
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:unit:coverage": "vitest run tests/unit --coverage",
    "test:integration": "vitest run tests/integration",
    "test:acceptance": "cucumber-js",
    "test:e2e:live": "RUN_LIVE_TESTS=true vitest run tests/e2e/live"
  }
}
```

The script list is a target, not a claim that these commands are already
configured. The default Vitest configuration must exclude opt-in
live-site tests. The Cucumber command must use the project's
TypeScript/ESM-compatible configuration. If environment-variable syntax
needs to work across operating systems, use a cross-platform solution
rather than relying on shell-specific syntax.

Provide documented `api:validate` and `api:docs`-equivalent commands that
validate `docs/api/openapi.yaml` and generate the human-readable API
reference from that file. The actual script names must match the project
configuration.

Architecture validation can be exposed as a dedicated script, for
example:

``` json
{
  "scripts": {
    "test:architecture": "depcruise src --config .dependency-cruiser.cjs"
  }
}
```

The exact dependency-cruiser configuration file name should match the
file committed to the repository.

## 7. Continuous integration and Definition of Done

The following checks are mandatory for a change to be considered ready
to merge:

1.  Install dependencies reproducibly (`npm ci`).
2.  Check formatting (`npm run format:check`).
3.  Run linting (`npm run lint`).
4.  Run strict type checking (`npm run typecheck`).
5.  Run architecture checks (`npm run test:architecture`).
6.  Validate the OpenAPI contract and generate the API reference using the
    documented commands.
7.  Run unit tests with the 100% coverage thresholds
    (`npm run test:unit:coverage`).
8.  Run infrastructure and HTTP integration tests
    (`npm run test:integration`).
9.  Run deterministic acceptance/E2E scenarios
    (`npm run test:acceptance`).
10. Build the production application (`npm run build`).

The live-site smoke test is not a mandatory CI gate because it depends
on an external service.

A story or change is done only when:

-   Its acceptance criteria are represented by appropriate automated
    tests.
-   Tests were written before the corresponding implementation,
    following Red--Green--Refactor.
-   Relevant unit, integration, and acceptance tests pass.
-   The domain/application unit coverage target remains at 100% for all
    four metrics.
-   Static quality and architecture checks pass.
-   HTTP changes follow the OpenAPI document-first workflow in §3.6; the
    contract validates and the generated reference is current.
-   Documentation is updated when behavior, architecture, configuration,
    or developer workflow changes.
-   The change is committed in small, understandable increments using
    the repository's agreed Git conventions.

## 8. Practical testing principles

-   Prefer deterministic tests; control time, network responses, and
    database state.
-   Use the real library when testing an integration with that library;
    stub only boundaries that must be controlled.
-   Keep unit tests fast and isolated.
-   Keep Gherkin scenarios few, readable, and focused on user-visible
    behavior.
-   Test both success and failure paths, including boundary conditions.
-   Preserve the original Hacker News ordering when sort keys tie, as
    required by the product behavior.
-   Do not make the live website a prerequisite for local development or
    CI.
-   Treat test failures as information: fix the behavior or the test
    setup rather than weakening assertions to obtain a green build.

------------------------------------------------------------------------

## 9. Decisions summary

  -----------------------------------------------------------------------
  Decision                            Status
  ----------------------------------- -----------------------------------
  TDD Red--Green--Refactor is the     Adopted
  required development method         

  Unit tests use Vitest and "should   Adopted
  ..." naming                         

  Unit test folders mirror the `src`  Adopted
  structure                           

  Domain and application unit-test    Adopted
  coverage is 100% for statements,    
  branches, functions, and lines      

  Infrastructure and HTTP adapter     Adopted
  integration tests use Vitest        

  Fastify HTTP tests use              Adopted
  `fastify.inject()`                  

  SQLite integration tests use a real Adopted
  in-memory database                  

  Acceptance/E2E behavior is          Adopted
  specified in Gherkin and executed   
  with Cucumber.js                    

  Deterministic acceptance tests use  Adopted
  controlled dependencies; live HN    
  checks are opt-in                    

  dependency-cruiser enforces         Adopted
  architecture boundaries             

  OpenAPI is the HTTP contract-first  Adopted
  source; API reference docs are      
  generated from it                    

  TypeScript,                         Adopted
  ESLint/typescript-eslint, and       
  Prettier are mandatory quality      
  gates                               

  All required checks must pass       Adopted
  before merge                        
  -----------------------------------------------------------------------

This document records the agreed QA approach. Implementation details
such as exact script names, configuration filenames, and fixture
inventories should be kept synchronized with the repository as they are
added.
