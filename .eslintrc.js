module.exports = {
  extends: ['airbnb-typescript/base'],
  parserOptions: {
    project: './tsconfig.json',
    createDefaultProgram: true,
  },
  ignorePatterns: ['**/examples/**/*', 'lib/**/*'],
  rules: {
    'import/prefer-default-export': 'off',
    'import/no-cycle': 'off',
    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'arrow-parens': 'off',
    'import/no-unresolved': 'off',
    'new-cap': 'off',
    'class-methods-use-this': 'off',
    'no-case-declarations': 'off',
  },
};
