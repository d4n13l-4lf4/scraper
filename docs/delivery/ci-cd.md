---
document: CI/CD Model
canonical_path: docs/delivery/ci-cd.md
version: 1
status: current
---

# CI/CD Model

## Purpose and scope

This document defines the conceptual delivery flow for the Hacker News
Crawler. It is the reference for a future CI/CD implementation; it does not
define a GitHub Actions workflow, a Git hook configuration, or a deployment
script.

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
- A failing unit-test run blocks the commit. Developers can run the same
  command manually while working.
- The hook is a fast local safeguard, not a replacement for the full CI gate
  set. Other hook checks may be added only when justified by the project.

### 2. Pull-request and continuous-integration checks

- Pull requests run the complete set of mandatory checks defined in the QA
  Approach.
- CI verifies the OpenAPI source and generates its human-readable reference
  using the documented commands from the QA Approach.
- A pull request cannot be considered ready to merge while a required check
  fails.
- Pull-request builds are verification artifacts only; this stage does not
  publish a GitHub Release.

The CI implementation should report individual check results clearly and
should not silently skip a required gate.

### 3. Release publication

- A version tag is the trigger for release publication. The exact tag format
  and versioning policy are implementation decisions to make before the
  workflow is built.
- The tagged commit must pass the same mandatory quality gates before
  publication, including the build gate. A failed or incomplete check blocks
  the release.
- Publish the versioned artifact produced by that successful workflow run as
  an asset of the corresponding GitHub Release; do not rebuild between
  verification and publication.
- The release must identify the source tag/commit and include concise release
  notes.
- A release workflow must not publish from an untagged pull request or from a
  commit whose required checks have failed.

## Security and traceability principles

- Pull-request verification needs read-only repository permissions wherever
  possible.
- Grant release publication permission only to the release-publishing job,
  with the minimum GitHub token permissions required to create a release and
  upload its asset.
- Do not store credentials in the repository or embed them in the build
  artifact.
- Preserve a traceable relationship between the release, source tag/commit,
  and published artifact.

## Decisions deferred to implementation

This conceptual model intentionally leaves the following choices open:

- GitHub Actions workflow names, triggers, and job structure.
- The pre-commit hook manager and its installation mechanism.
- The OpenAPI validator and documentation generator.
- The version-tag convention, build artifact format, and release-note source.

These choices must implement this model and remain consistent with the gate
definitions in the QA Approach.
