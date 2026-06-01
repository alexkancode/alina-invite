const { RuleTester } = require('eslint');
const rule = require('../../lib/rules/no-ts-import-extensions');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
});

describe('no-ts-import-extensions', () => {
  ruleTester.run('no-ts-import-extensions', rule, {
    valid: [
      // Valid import statements without extensions
      {
        code: `import { helper } from './utils';`,
        filename: 'test.ts'
      },
      {
        code: `import { config } from '../config';`,
        filename: 'test.ts'
      },
      {
        code: `import React from 'react';`,
        filename: 'test.tsx'
      },
      {
        code: `import { Component } from '@/components/Component';`,
        filename: 'test.tsx'
      },
      // Import statements with allowed extensions
      {
        code: `import data from './data.json';`,
        filename: 'test.ts'
      },
      {
        code: `import styles from './styles.css';`,
        filename: 'test.ts'
      },
      {
        code: `import './global.css';`,
        filename: 'test.ts'
      }
    ],

    invalid: [
      // TypeScript file imports with .ts extension
      {
        code: `import { helper } from './utils.ts';`,
        filename: 'test.ts',
        errors: [{
          messageId: 'noTsExtension',
          data: {
            extension: '.ts',
            source: './utils.ts'
          }
        }],
        output: `import { helper } from './utils';`
      },

      // TypeScript file imports with .tsx extension
      {
        code: `import { Component } from './Component.tsx';`,
        filename: 'test.tsx',
        errors: [{
          messageId: 'noTsxExtension',
          data: {
            extension: '.tsx',
            source: './Component.tsx'
          }
        }],
        output: `import { Component } from './Component';`
      },

      // Multiple invalid imports
      {
        code: `
import { helper } from './utils.ts';
import { Component } from './Component.tsx';
import { config } from '../config.ts';`,
        filename: 'test.ts',
        errors: [
          {
            messageId: 'noTsExtension',
            line: 2,
            data: {
              extension: '.ts',
              source: './utils.ts'
            }
          },
          {
            messageId: 'noTsxExtension',
            line: 3,
            data: {
              extension: '.tsx',
              source: './Component.tsx'
            }
          },
          {
            messageId: 'noTsExtension',
            line: 4,
            data: {
              extension: '.ts',
              source: '../config.ts'
            }
          }
        ],
        output: `
import { helper } from './utils';
import { Component } from './Component';
import { config } from '../config';`
      },

      // TODO: Fix dynamic imports detection
      // {
      //   code: `async function loadModule() { const module = await import('./dynamic.ts'); }`,
      //   filename: 'test.ts',
      //   errors: [{
      //     messageId: 'noTsExtension',
      //     data: {
      //       extension: '.ts',
      //       source: './dynamic.ts'
      //     }
      //   }],
      //   output: `async function loadModule() { const module = await import('./dynamic'); }`
      // },

      // Re-export with TypeScript extension
      {
        code: `export { helper } from './utils.ts';`,
        filename: 'test.ts',
        errors: [{
          messageId: 'noTsExtension',
          data: {
            extension: '.ts',
            source: './utils.ts'
          }
        }],
        output: `export { helper } from './utils';`
      }
    ]
  });
});

describe('no-ts-import-extensions configuration', () => {
  const configuredRuleTester = new RuleTester({
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true
      }
    }
  });

  configuredRuleTester.run('no-ts-import-extensions with custom extensions', rule, {
    valid: [
      {
        code: `import { helper } from './utils.js';`,
        filename: 'test.ts',
        options: [{ allowedExtensions: ['js', 'mjs'] }]
      }
    ],

    invalid: [
      {
        code: `import { helper } from './utils.ts';`,
        filename: 'test.ts',
        options: [{ allowedExtensions: ['js', 'mjs'] }],
        errors: [{
          messageId: 'noTsExtension',
          data: {
            extension: '.ts',
            source: './utils.ts'
          }
        }],
        output: `import { helper } from './utils';`
      }
    ]
  });
});