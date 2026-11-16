module.exports = {
  forbidden: [
    {
      name: 'no-domain-imports-from-outside-modules',
      comment: 'domain code must not import application, infra, adapters, or other modules',
      severity: 'error',
      from: { path: ['^src/modules/.*/domain/.*$'] },
      to: {
        path: [
          '^src/modules/.*/(application|infrastructure|presentation)/.*$',
          '^src/modules/[^/]+/(?!domain)',
        ],
      },
    },
    {
      name: 'no-application-imports-from-outer-layers',
      comment: 'application code must not import infrastructure or presentation',
      severity: 'error',
      from: { path: ['^src/modules/.*/application/.*$'] },
      to: {
        path: [
          '^src/modules/.*/(infrastructure|presentation)/.*$',
          '^fastify$',
          '^cheerio$',
          '^better-sqlite3$',
        ],
      },
    },
    {
      name: 'no-presentation-imports-from-infrastructure',
      comment: 'presentation must not import infrastructure directly; composition root wires infra',
      severity: 'error',
      from: { path: ['^src/modules/.*/presentation/.*$'] },
      to: { path: ['^src/modules/.*/infrastructure/.*$', '^src/shared/infrastructure/.*$'] },
    },
    {
      name: 'no-shared-imports-from-modules',
      comment: 'shared code must not import module code',
      severity: 'error',
      from: { path: ['^src/shared/.*$'] },
      to: { path: ['^src/modules/.*$'] },
    },
    {
      name: 'no-app-imports-from-modules',
      comment: 'app shell must not import module implementation directly',
      severity: 'error',
      from: { path: ['^src/app/.*$'] },
      to: { path: ['^src/modules/.*/(application|infrastructure|domain)/.*$'] },
    },
  ],
};
