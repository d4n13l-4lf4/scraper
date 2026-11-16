# Agent Instructions

This repository contains a Hacker News crawler service. It retrieves the first
30 stories, lets clients request either of two title-word-count filters over a
REST API, and records request usage.

Keep changes within the requested scope and the product behavior planned in
the backlog.

## Project references

- Product scope and user stories: `docs/requirements/product_backlog.md`
- Architecture and dependency boundaries: `docs/architecture/architecture.md`
- HTTP contract: `docs/api/openapi.yaml`
- Testing practices and quality gates: `docs/quality/qa-approach.md`
- CI/CD and release model: `docs/delivery/ci-cd.md`

## Working rules

- For HTTP changes, update the OpenAPI contract before implementation and
  generate its reference as described in the QA approach.
- Follow the architecture boundaries; use the QA approach for testing and
  required checks.
- For delivery changes, follow the CI/CD model. If references conflict, flag
  the conflict rather than creating a competing rule.
