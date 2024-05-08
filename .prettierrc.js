module.exports = {
  $schema: 'http://json.schemastore.org/prettierrc',

  // defaults
  arrowParens: 'avoid',
  bracketSpacing: true,
  embeddedLanguageFormatting: 'auto',
  htmlWhitespaceSensitivity: 'css',
  requirePragma: false,
  insertPragma: false,
  proseWrap: 'preserve',
  semi: true,
  useTabs: false,

  // customized
  endOfLine: 'lf',
  printWidth: 100,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  quoteProps: 'consistent',

  overrides: [
    // explicitly keep output consistent with npm
    {
      files: ['lerna.json', 'package.json', 'package-lock.json', 'npm-shrinkwrap.json'],
      options: {
        parser: 'json-stringify',
        tabWidth: 2,
        trailingComma: 'none',
      },
    },
    {
      files: ['*.yaml', '*.yml'],
      options: {
        tabWidth: 2,
      },
    },
  ],
};
