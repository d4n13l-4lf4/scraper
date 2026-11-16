---
document: CI/CD Model
canonical_path: docs/delivery/ci-cd.md
version: 1
status: current
---

# CI/CD Model

## Purpose and scope

This document defines the delivery flow and implementation choices for the
Hacker News Crawler. It is the reference for implementing the CI/CD workflow
and local hook; it does not contain executable workflow or hook configuration.

The quality gates and their requirements are owned by
[`docs/quality/qa-approach.md`](../quality/qa-approach.md). This document
describes when those gates run and how a verified build is published. It does
not redefine the gates.

The delivery target is a **GitHub Release** containing the build artifact.
Publishing a release distributes the built application; deployment to a
running production host is not defined by this model.

## Delivery flow

```text
Developer commit
    │
    ├── Pre-commit: unit tests must pass
    │
    ├── Pull request / continuous integration
    │       └── Required quality gates from the QA Approach
    │
    └── Version tag
            └── Re-run required gates (including build) → publish GitHub Release
```

### 1. Local pre-commit check

- A pre-commit hook runs the unit-test command defined in the QA Approach
  (currently documented as `npm run test:unit`).
- Use Husky to install and manage the Git hook.
- A failing unit-test run blocks the commit. Developers can run the same
  command manually while working.
- The hook is a fast local safeguard, not a replacement for the full CI gate
  set. Other hook checks may be added only when justified by the project.

### 2. Pull-request and continuous-integration checks

- Implement this stage in `.github/workflows/ci.yml`, triggered by
  `pull_request` and pushes to `main`.
- Pull requests and pushes to `main` run the complete set of mandatory checks
  defined in the QA Approach.
- CI verifies the OpenAPI source and generates its human-readable reference
  using `npm run api:validate` and `npm run api:docs`.
- A pull request cannot be considered ready to merge while a required check
  fails.
- Pull-request builds are verification artifacts only; this stage does not
  publish a GitHub Release.

The CI implementation should report individual check results clearly and
should not silently skip a required gate.

### 3. Release publication

- Implement this stage in `.github/workflows/release.yml`, triggered by tags
  matching `vMAJOR.MINOR.PATCH` (for example, `v1.2.3`).
- The tagged commit must pass the same mandatory quality gates before
  publication, including the build gate. A failed or incomplete check blocks
  the release.
- Package `dist/`, `package.json`, and `package-lock.json` as a versioned
  `hacker-news-crawler-${TAG}.tar.gz` artifact.
- Publish the artifact produced by that successful workflow run as an asset of
  the corresponding GitHub Release; do not rebuild between verification and
  publication.
- Use GitHub CLI (`gh release create`) with automatically generated release
  notes (`--generate-notes`). The release must identify the source tag/commit.
- A release workflow must not publish from an untagged pull request or from a
  commit whose required checks have failed.

## Security and traceability principles

- Pull-request verification needs read-only repository permissions wherever
  possible.
- Grant release publication permission only to the release-publishing job,
  with the minimum GitHub token permissions required to create a release and
  upload its asset (`contents: write`).
- Do not store credentials in the repository or embed them in the build
  artifact.
- Preserve a traceable relationship between the release, source tag/commit,
  and published artifact.

## Decisions deferred to implementation

The following low-level implementation details remain open:

- Exact GitHub Actions versions, runner images, and job graph.
- Exact Husky version and installation configuration.

These choices must implement this model and remain consistent with the gate
definitions in the QA Approach.
