export default {
  default: {
    import: [
      'tests/modules/**/acceptance/steps/**/*.ts',
      'tests/modules/**/acceptance/support/**/*.ts',
      'tests/e2e/steps/**/*.ts',
      'tests/e2e/support/**/*.ts',
    ],
    features: [
      'tests/modules/**/acceptance/features/**/*.feature',
      'tests/e2e/features/**/*.feature',
    ],
    format: ['progress'],
    publishQuiet: true,
  },
};
