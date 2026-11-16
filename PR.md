## User Story

<!-- What user need does this PR address? -->

As a developer, I want the initial project foundation with a minimal Hello World endpoint, documented contracts, tests, and delivery safeguards so that the project structure and working practices can be demonstrated before crawler behavior is added.

## Changes

- Established TypeScript REST-service foundation with Fastify, Node.js 26 LTS, ESM/NodeNext
- Established TypeScript REST-service foundation with webpack bundling, import aliases (`@/*` → `src/*`), and `.js`-suffix-free imports
- Configured CI/CD workflows: PR-triggered quality gates, release-on-tag without quality gates
- Implemented Husky pre-commit hook running format, lint, typecheck, and unit tests
- Migrated to v4 feature-module architecture (`src/modules/`, `src/shared/`, `src/app/`)
- Removed per-module tsconfig files, single root tsconfig.json only
- Added full unit test coverage (100% statements/branches/functions/lines) for domain and application layers
- All quality gates pass: format, lint, typecheck, architecture, API validate, unit/integration/acceptance tests, build

## Acceptance Criteria

- [x] GET /hello returns HTTP 200, `application/json`, body `{"message":"Hello, world!"}`
- [x] All quality gates pass (format, lint, typecheck, architecture, API validate, unit/integration/acceptance, build)
- [x] 100% unit test coverage for domain and application layers
- [x] CI runs all gates on PRs; release runs build-only without quality gates
- [x] Pre-commit hook blocks commits on test failure

## Testing

- [x] Tests added/updated
- [x] Manually verified

## Related Issue

Closes #SC-001
