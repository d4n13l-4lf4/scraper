<!--
Sync Impact Report
- Version change: 3.0.0 → 4.0.0 (MAJOR: architecture restructured to feature modules)
- Modified principles: II. Preserve Hexagonal Architecture — now applies per module; III. Keep Public Contracts Explicit — per module contributes to OpenAPI; V. Merge and Release Only Verified Changes — release builds from assembled module plugins
- Added sections: Feature-module structure, shared/ cross-cutting concerns, module isolation rules
- Removed sections: none
- Follow-up TODO: confirm the original ratification date.
-->

# Hacker News Crawler Constitution

## Core Principles

### I. Product Behavior Is Backlog-Led

All product behavior MUST trace to an accepted user story or its acceptance
criteria in `docs/requirements/product_backlog.md` v4. Changes MUST preserve the
defined observable behavior and remain within the stated product scope. When a
requirement is missing or conflicts with another authoritative contract, the
conflict MUST be raised and resolved before implementation; teams MUST NOT
silently invent or broaden product behavior.

### II. Preserve Hexagonal Architecture (per module)

Production dependencies MUST follow the inward dependency rule in
`docs/architecture/architecture.md` v4 **within each module**: domain code
remains independent of frameworks and I/O; application code depends on domain
and ports, not concrete infrastructure or presentation adapters; adapters
translate at system boundaries; and module containers wire concrete
implementations. External I/O MUST be behind the documented ports.
Architecture exceptions require review and an update to the architecture
reference before the boundary is changed.

**Module isolation.** A module never imports another module's `domain`,
`application`, `infrastructure`, or `presentation` internals. If one module
needs another's capability, it declares an outbound port in its own
`application` layer, and the root composition supplies an adapter for it.

**Shared kernel.** `shared/` holds only cross-cutting ports and adapters
(`Clock`, `Logger`, database connection), never business code. Code is
promoted to `shared/` only when a second module needs it.

### III. Keep Public Contracts Explicit and Document-First (per module)

The public HTTP contract MUST be maintained in `docs/api/openapi.yaml`. Any new
or changed HTTP operation **in a module** MUST update and validate that contract
before its behavior is implemented. Module presentation adapters MUST conform to
the contract, map internal results and errors at the boundary, and MUST NOT
expose internal diagnostics. The human-readable API reference MUST be generated
from OpenAPI and MUST NOT be maintained independently.

**Module ownership.** A module's domain errors are mapped in that module's
`presentation/http/` folder, registered inside the module's own Fastify plugin
scope. `app/http` provides only the fallback handlers for not-found routes and
unexpected errors; these expose no stack traces or internal details.

### IV. Develop Test-First and Verify Observable Behavior (per module)

Production behavior MUST be developed in small Red–Green–Refactor increments
**per module**: write a focused test first, confirm it fails for the expected
reason, implement the smallest passing change, and refactor without changing
behavior. Tests MUST verify meaningful outcomes rather than implementation
details. Tests MUST be deterministic by controlling external services, time,
and storage where appropriate. Module domain and application unit coverage MUST
meet all four 100% thresholds defined in `docs/quality/qa-approach.md` v4;
live-site checks remain opt-in and MUST NOT be required for normal development
or CI.

**Tests are organized per module.** Unit tests mirror the module's source tree.
Integration and acceptance tests exercise the module's presentation plugin.
The assembled application runs deterministic acceptance scenarios for E2E
verification. Live-site checks remain opt-in and MUST NOT be required for
normal development or CI.

### V. Merge and Release Only Verified Changes

Changes MUST pass the applicable required quality gates **per affected module**
before merge. A release MUST use a version tag whose commit is reachable from
`main`, where changes enter only through passing pull requests. The release
workflow MUST build the artifact for packaging but MUST NOT rerun the
quality-gate suite. The artifact published MUST be the artifact produced by
that release workflow, with traceability to its source tag and commit. Release
credentials MUST be limited to the publishing job and the permissions it
requires. The project delivery target is a GitHub Release artifact; this
constitution does not define deployment to a running production host.

## Authoritative Project References

These references are authoritative within their stated areas and are
intentionally not duplicated here:

- `docs/requirements/product_backlog.md` v4 defines product scope, user stories,
  acceptance criteria, and expected product behavior.
- `docs/architecture/architecture.md` v4 defines system structure, dependency
  boundaries, and implementation architecture.
- `docs/quality/qa-approach.md` v4 defines development and test practices, quality
  tooling, coverage targets, required gates, and the Definition of Done.
- `docs/delivery/ci-cd.md` v4 defines when quality gates run and how verified
  release artifacts are published.
- `docs/api/openapi.yaml` defines the public HTTP contract.

The constitution establishes non-negotiable governance principles; the
references above own the detailed rules in their respective areas. If those
references conflict, contributors MUST report the conflict and maintainers
MUST resolve it in the appropriate canonical document before relying on the
conflicting guidance.

## Development and Delivery Workflow

- Work MUST proceed from product stories and acceptance criteria in small,
  reviewable increments. Acceptance scenarios MUST describe externally
  observable behavior and MUST pass before the related story is accepted.
- A story or change is complete only when its relevant tests pass **for the
  affected module**, the architecture and quality requirements are satisfied,
  and documentation is updated when behavior, architecture, configuration, or
  workflow changes.
- The local pre-commit unit-test safeguard, pull-request CI gates, and tagged
  release process MUST follow `docs/delivery/ci-cd.md` v4. Required pull-request
  gates MUST pass before merge. Pushes to `main` MUST NOT trigger quality gates.
  The `main` branch MUST be protected from changes that bypass the required
  pull-request checks. A release workflow MUST build for packaging but MUST NOT
  rerun quality gates. Delivery orchestration MUST NOT redefine the gates
  owned by `docs/quality/qa-approach.md` v4 or silently skip a required
  pull-request gate.
- For HTTP changes, contributors MUST follow the contract-first workflow in
  Principle III and the detailed validation and reference-generation procedure
  in the QA Approach v4.

## Governance

This constitution governs project principles. The authoritative references
listed above govern detailed product, architecture, quality, delivery, and HTTP
contract decisions within their defined scope. A conflict with this
constitution MUST be resolved in favor of the constitution, with the affected
reference updated where necessary.

Amendments MUST be proposed and reviewed in a change to this document. The
proposal MUST describe its rationale, affected principles or sections, impact
on the authoritative references, and any required transition. Maintainers
MUST approve the amendment through the project's normal review process before
it takes effect. Compliance MUST be reviewed during change review and before
release; a deviation requires either correction or an approved constitution
amendment, not an undocumented exception.

Constitution versions use Semantic Versioning: MAJOR for backward-incompatible
governance or principle changes, MINOR for new principles or materially
expanded governance, and PATCH for clarifications and non-semantic edits. The
version and amendment date MUST be updated with every approved amendment.

**Version**: 4.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown | **Last Amended**: 2026-11-16
