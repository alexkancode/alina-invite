module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        node: true
      }
    },
    plugins: {
      'error-prevention': require('./eslint-plugin-error-prevention/lib/index.js').default
    },
    rules: {
      'error-prevention/no-hardcoded-localhost': ['error', {
        criticalFiles: [
          'scripts/**/*.{ts,js,mjs}',
          'src/lib/**/*.{ts,js}',
          'src/pages/api/**/*.{ts,js}',
          'src/components/**/*.{ts,js}'
        ],
        allowedFiles: [
          '**/*.test.{ts,js}',
          '**/*.spec.{ts,js}',
          '**/*.local.{ts,js}',
          'dev-tools/**/*.{ts,js}',
          'examples/**/*.{ts,js}'
        ]
      }]
    }
  }
];