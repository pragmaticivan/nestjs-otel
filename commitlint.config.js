module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-case': [2, 'always', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-case': [2, 'never', ['start-case', 'pascal-case']],
  },
};
