---
document: CI/CD Model
canonical_path: docs/delivery/ci-cd.md
version: 4
status: current
---

# CI/CD Model

## Purpose and scope

This document defines the delivery flow and implementation choices for the
Hacker News Crawler. It is the reference for implementing the CI/CD workflow
and local hook; it does not contain executable workflow or hook configuration.

The quality gates and their requirements are owned by
[`docs/quality/qa-approach.md` v4](../quality/qa-approach.md). This document
describes when those gates run and how a verified build is published. It does
not redefine the gates.

The delivery target is a **GitHub Release** containing the release-build
artifact. Pull-request CI runs the required quality gates; the release workflow
does not rerun them and builds only to create the package. Publishing a release
distributes the built application; deployment to a running production host is
not defined by this model.

## Delivery flow

```text
Developer commit
    │
    ├── Pre-commit: unit tests must pass
    │
    ├── Pull request
    │       └── Required quality gates from the QA Approach → merge to main
    │
    └── vMAJOR.MINOR.PATCH tag on main
            └── Build for packaging only → publish GitHub Release
```

### 1. Local pre-commit check

- A pre-commit hook runs the unit-test command defined in the QA Approach
  (currently documented as `npm run test:unit`).
- Use Husky to install and manage the Git hook.
- A failing unit-test run blocks the commit. Developers can run the same
  command manually while working.
- The hook is a fast local safeguard, not a replacement for the full CI gate
  set. Other hook checks may be added only when justified by the project.

### 2. Pull-request checks

- Implement this stage in `.github/workflows/ci.yml`, triggered by
  `pull_request` only. Do not add a push-to-`main` trigger for quality gates.
- Pull requests run the complete set of mandatory checks defined in the QA
  Approach v4 **per affected module and at root**.
- CI verifies the OpenAPI source and generates its human-readable reference
  using `npm run api:validate` and `npm run api:docs`.
- A pull request cannot be considered ready to merge while a required check
  fails.
- Protect `main` so changes merge through pull requests with all required checks
  passing; direct pushes must not bypass those checks. This protection is
  configured manually in GitHub repository settings, not stored in this repo.
- A push to `main` does not run quality gates. The checks required for that
  commit have already run on its pull request.
- Pull-request builds are verification artifacts only; this stage does not
  publish a GitHub Release.

The CI implementation should report individual check results clearly and
should not silently skip a required gate.

### 3. Release publication

- Implement this stage in `.github/workflows/release.yml`, triggered by the
  existing `v*.*.*` tag pattern; the project naming convention is
  `vMAJOR.MINOR.PATCH` (for example, `v1.2.3`). Retain the current tag filter
  and ancestry-check implementation; no additional strict-version validation
  is required.
- Create release tags only for commits on `main`. Before running publication
  steps, use the workflow's current ancestry check to reject a tag pointing to
  a commit outside `main`.
- Install dependencies and run `npm run build` solely to create `dist/` for the
  release package. Do not rerun lint, type checking, architecture checks, API
  validation, unit tests, integration tests, or acceptance tests in the release
  workflow. A failed build prevents packaging.
- Package `dist/`, `package.json`, and `package-lock.json` as a versioned
  `hacker-news-crawler-${TAG}.tar.gz` artifact.
- Publish the artifact produced by that release build as an asset of the
  corresponding GitHub Release; do not rebuild between packaging and
  publication.
- Use `softprops/action-gh-release@v2` with automatically generated release
  notes. The release must identify the source tag/commit.
- A release workflow must not publish from an untagged pull request or from a
  tag that fails the existing `main` ancestry check. The tagged commit has
  already passed the required pull-request gates before it entered `main`.
- No quality gates run during or after release publication.

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

- Exact GitHub Actions versions, runner images, and job graph. The current
  implementation uses the major-version refs `actions/checkout@v7` and
  `actions/setup-node@v7`; full-SHA pinning is not required by this project.
- Exact Husky version and installation configuration.

These choices must implement this model and remain consistent with the gate
definitions in the QA Approach v4.
