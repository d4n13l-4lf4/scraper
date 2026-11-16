/**
 * Architecture dependency rules for the Hacker News Crawler (v4).
 *
 * Enforces the hexagonal architecture dependency boundaries documented
 * in docs/architecture/architecture.md v4:
 *   domain → nothing external
 *   application → domain only
 *   infra → domain, application (types only)
 *   presentation → application, domain
 *   shared → nothing external
 *   app shell → shared + module ports only
 *
 * Used by dependency-cruiser via `npm run test:architecture`.
 */

import type { RuleSet } from 'dependency-cruiser';

const ruleset: RuleSet = {
  name: 'hacker-news-crawler-v4-architecture',
  rules: [
    {
      name: 'no-domain-imports-from-outer-layers',
      severity: 'error',
      comment:
        'Domain code must not import application, infra, presentation, or third-party libraries',
      and: [
        {
          path: ['^src/modules/.*/domain/.*$'],
          cannotDependUpon: {
            path: [
              '^src/modules/.*/application/.*$',
              '^src/modules/.*/infrastructure/.*$',
              '^src/modules/.*/presentation/.*$',
              '^src/shared/.*$',
              '^src/app/.*$',
              '^fastify$',
              '^cheerio$',
              '^better-sqlite3$',
            ],
          },
        },
      ],
    },
    {
      name: 'no-application-imports-from-infra-or-presentation',
      severity: 'error',
      comment:
        'Application code must not import infrastructure, presentation, Fastify, Cheerio, or better-sqlite3',
      and: [
        {
          path: ['^src/modules/.*/application/.*$'],
          cannotDependUpon: {
            path: [
              '^src/modules/.*/infrastructure/.*$',
              '^src/modules/.*/presentation/.*$',
              '^src/shared/infrastructure/.*$',
              '^fastify$',
              '^cheerio$',
              '^better-sqlite3$',
            ],
          },
        },
      ],
    },
    {
      name: 'no-presentation-imports-from-infrastructure',
      severity: 'error',
      comment: 'Presentation must not import infrastructure directly; composition root wires infra',
      and: [
        {
          path: ['^src/modules/.*/presentation/.*$'],
          cannotDependUpon: {
            path: ['^src/modules/.*/infrastructure/.*$', '^src/shared/infrastructure/.*$'],
          },
        },
      ],
    },
    {
      name: 'no-shared-imports-from-modules',
      severity: 'error',
      comment: 'Shared code must not import module code',
      and: [
        {
          path: ['^src/shared/.*$'],
          cannotDependUpon: { path: ['^src/modules/.*$'] },
        },
      ],
    },
    {
      name: 'no-app-imports-from-module-internals',
      severity: 'error',
      comment: 'App shell must not import module internals directly',
      and: [
        {
          path: ['^src/app/.*$'],
          cannotDependUpon: {
            path: [
              '^src/modules/.*/domain/.*$',
              '^src/modules/.*/application/.*$',
              '^src/modules/.*/infrastructure/.*$',
            ],
          },
        },
      ],
    },
    {
      name: 'no-circular-dependencies-between-modules',
      severity: 'error',
      comment: 'No circular dependencies between modules',
      and: [
        {
          path: ['^src/modules/[^/]+/.*$'],
          cannotDependUpon: { path: ['^src/modules/[^/]+/.*$'] },
        },
      ],
    },
  ],
};

export default ruleset;
