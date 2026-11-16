# Research: Project Scaffold with Hello World Endpoint

## Decision: Use v4 Feature-Module Architecture with Webpack ESM Output

- **Rationale**: The accepted implementation uses the v4 feature-module architecture: Webpack bundles the Node service as ESM, TypeScript `moduleResolution: bundler`, and the `@/` alias for `src/` imports. The source tree is organized by feature modules (`modules/<module>/`) with hexagonal layers inside each module (`domain`, `application`, `infrastructure`, `presentation`, `di`). A thin `app/http/` holds the Fastify shell, and `shared/` holds cross-cutting ports and adapters. Keep the alias configured consistently in TypeScript, Webpack, and Vitest while preserving the hexagonal layer boundaries and manual composition root.
- **Alternatives considered**: The previous v3 flat architecture (`src/domain`, `src/application`, `src/infra`, `src/adapters`) is superseded by the v4 module-based architecture. NodeNext with relative `.js` imports was the previous architecture decision; it is superseded by the accepted bundler setup. A DI framework or direct route-only application remains out of scope.

## Decision: Use Node.js 26 LTS as the runtime baseline

- **Rationale**: This is the user's preferred LTS baseline, and it is supported by GitHub Actions: the current `actions/setup-node` version matrix includes Node 26, and GitHub-hosted Ubuntu 24.04 runners are available. Pin Node 26 in local runtime metadata and configure CI to read that same version from `.nvmrc`. References: [Node.js release status](https://nodejs.org/en/about/previous-releases), [setup-node version matrix](https://github.com/actions/setup-node/blob/main/.github/workflows/versions.yml), and [GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).
- **Alternatives considered**: Node.js 24 LTS has a more mature ecosystem, but Node 26 is supported by GitHub's setup action and meets the user's requested LTS preference. Recheck native dependency compatibility when later stories add the SQLite adapter. A floating `latest` runtime would make local and CI behavior less reproducible.

## Decision: Use Fastify behind an application-facing port (per module)

- **Rationale**: Fastify is the HTTP adapter technology established by the architecture and QA references v4. The Hello World route will invoke a small inbound application port within the `hello` module, and the module container will wire the concrete service. The `app/http/` Fastify shell registers module plugins. Adapter tests use Fastify's injection boundary; the application remains independent of Fastify.
- **Alternatives considered**: Returning a hard-coded response directly from a route would be smaller, but would fail to demonstrate the mandated boundary.

## Decision: Use the established quality toolchain and test levels (per module)

- **Rationale**: The QA Approach v4 selects TypeScript, ESLint, Prettier, Vitest, Cucumber.js, dependency-cruiser, and Redocly CLI. The scaffold will configure the required scripts and gates per module, use Vitest for unit and HTTP integration checks, and use a deterministic Gherkin acceptance scenario per module. Unit tests for the application behavior follow Red–Green–Refactor. Type-only declarations do not receive artificial standalone tests.
- **Alternatives considered**: Introducing another test runner, browser test tool, or architecture checker would duplicate adopted tooling and is not justified for this REST-only scaffold.

## Decision: Keep OpenAPI as the sole public HTTP contract (per module contributes)

- **Rationale**: `docs/api/openapi.yaml` is the canonical contract. Add the temporary `GET /hello` operation there before implementing the route, validate it, and generate `docs/api/generated/openapi.html` from that source. The feature contract artifact in this directory is explanatory only and is not a competing contract source.
- **Alternatives considered**: Defining the endpoint contract in route code or maintaining a second OpenAPI file would violate the document-first workflow.

## Decision: Do not declare an operation-specific Hello World 404

- **Rationale**: `/hello` is a temporary scaffold endpoint. Its operation contract documents the successful response only; unmatched paths continue to use generic service behavior outside this operation contract. The generated API reference must reflect the same response list.
- **Alternatives considered**: Adding a custom not-found response to this temporary operation would imply a dedicated public error contract that the feature does not require.

## Decision: Configure the documented commit, CI, and release flow (v4)

- **Rationale**: The accepted CI/CD policy v4 runs unit tests in the local pre-commit hook and all QA-required gates on pull requests per module. Main pushes do not run quality gates; main protection is configured manually by the repository owner. Release tags use the current `v*.*.*` trigger and existing ancestry check; stricter pattern validation or checkout changes are not required. The release workflow runs `npm ci` and `npm run build` only to create `dist/`, packages it with `package.json` and `package-lock.json`, and publishes via `softprops/action-gh-release@v2`. It does not rerun the QA suite.
- **Alternatives considered**: Release-time quality gates and main-push gates were considered but are not part of the accepted policy. Publishing on every main push or making a live Hacker News check mandatory conflicts with the delivery model or feature scope.
- **Resolved delivery choices**: Use a fixed `ubuntu-24.04` runner and the current `actions/checkout@v7` and `actions/setup-node@v7` references, with Node configured from `.nvmrc`. Full-SHA action pins are not required by this project. The release artifact is built in the release workflow; its build is package preparation, not a rerun of the quality suite.

## Decision: Retain `NODE_ENV` in centralized configuration

- **Rationale**: `src/config.ts` already centralizes `NODE_ENV` alongside the four runtime settings. Keep it as an intentional configuration field and document it with the architecture/configuration scope.
- **Alternatives considered**: Removing the field would add churn without improving the US-01 boundary; no runtime behavior in this story depends on it.

## Decision: Use the product backlog's `HackerNewsEntry` name

- **Rationale**: US-01 and the product backlog v4 explicitly name `HackerNewsEntry`. The architecture's illustrative `models.ts` tree uses `Entry`, but it is an example rather than a competing domain contract. Use one canonical declaration named `HackerNewsEntry` and avoid a duplicate alias or parallel `Entry` type.
- **Alternatives considered**: Using `Entry` to mirror the illustrative tree would conflict with the explicit name required by US-01; declaring both names would create needless duplication.

## Decision: Keep US-01 free of crawler and persistence behavior

- **Rationale**: The backlog makes the initial declarations contracts only and explicitly prohibits implementing scraping, filtering, or persistence in this story. `ParseResult<T>`, if declared, belongs in the architecture's `modules/entries/infrastructure/hacker-news/` boundary; it is a type declaration, not a parser.
- **Alternatives considered**: Adding early fetch, parser, filter, database, or usage-recording behavior would expand scope into later backlog stories and make the foundation harder to review independently.

## Decision: Adopt v4 Feature-Module Structure for US-01

- **Rationale**: The v4 architecture organizes code by feature modules (`modules/hello/`, `modules/entries/`) with hexagonal layers inside each module, a shared kernel (`shared/`) for cross-cutting ports and adapters, and a thin app shell (`app/http/`) for the Fastify server. The `hello` scaffold module is temporary and will be removed in US-10. The `entries` module domain contracts are declared in US-01 but implementation is deferred to later stories.
- **Alternatives considered**: The previous flat v3 architecture is superseded. Keeping the old flat structure would not align with the v4 architecture that the user manually created.
