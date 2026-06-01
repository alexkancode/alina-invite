const { RuleTester } = require('eslint');
const rule = require('../../lib/rules/consistent-import-patterns');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
});

describe('consistent-import-patterns', () => {
  ruleTester.run('consistent-import-patterns', rule, {
    valid: [
      // All relative imports with consistent pattern
      {
        code: `
import { helper } from './utils';
import { config } from './config';
import { component } from '../components/Component';`,
        filename: 'test.ts',
        options: [{ pattern: 'relative' }]
      },

      // Package imports are always allowed
      {
        code: `
import React from 'react';
import { useState } from 'react';
import lodash from 'lodash';`,
        filename: 'test.ts',
        options: [{ pattern: 'relative' }]
      },

      // Absolute imports with consistent pattern
      {
        code: `
import { helper } from '@/utils/helper';
import { config } from '@/config/config';
import { Component } from '@/components/Component';`,
        filename: 'test.ts',
        options: [{ pattern: 'absolute' }]
      },

      // Mixed pattern when no preference specified
      {
        code: `
import { helper } from './utils';
import { config } from '@/config/config';
import React from 'react';`,
        filename: 'test.ts'
      }
    ],

    invalid: [
      // Mixing relative and absolute when relative pattern enforced
      {
        code: `
import { helper } from './utils';
import { config } from '@/config/config';`,
        filename: 'test.ts',
        options: [{ pattern: 'relative' }],
        errors: [{
          messageId: 'inconsistentPattern',
          data: {
            expected: 'relative',
            actual: 'absolute',
            source: '@/config/config',
            expectedExample: './config/config'
          }
        }],
        output: `
import { helper } from './utils';
import { config } from './config/config';`
      },

      // Mixing absolute and relative when absolute pattern enforced
      {
        code: `
import { helper } from '@/utils/helper';
import { config } from '../config';`,
        filename: 'test.ts',
        options: [{ pattern: 'absolute' }],
        errors: [{
          messageId: 'inconsistentPattern',
          data: {
            expected: 'absolute',
            actual: 'relative',
            source: '../config',
            expectedExample: '@/config'
          }
        }],
        output: `
import { helper } from '@/utils/helper';
import { config } from '@/config';`
      },

      // Multiple inconsistent imports
      {
        code: `
import { helper } from './utils';
import { config } from '@/config/config';
import { api } from '../api/client';
import { types } from '@/types/index';`,
        filename: 'test.ts',
        options: [{ pattern: 'relative' }],
        errors: [
          {
            messageId: 'inconsistentPattern',
            line: 3,
            data: {
              expected: 'relative',
              actual: 'absolute',
              source: '@/config/config',
              expectedExample: './config/config'
            }
          },
          {
            messageId: 'inconsistentPattern',
            line: 5,
            data: {
              expected: 'relative',
              actual: 'absolute',
              source: '@/types/index',
              expectedExample: './types/index'
            }
          }
        ],
        output: `
import { helper } from './utils';
import { config } from './config/config';
import { api } from '../api/client';
import { types } from './types/index';`
      }
    ]
  });
});

describe('consistent-import-patterns configuration', () => {
  const configuredRuleTester = new RuleTester({
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  });

  configuredRuleTester.run('consistent-import-patterns with baseUrl', rule, {
    valid: [
      {
        code: `
import { helper } from 'src/utils/helper';
import { config } from 'src/config/config';`,
        filename: 'test.ts',
        options: [{
          pattern: 'absolute',
          baseUrl: 'src/',
          aliasPrefix: ''
        }]
      }
    ],

    invalid: [
      {
        code: `
import { helper } from 'src/utils/helper';
import { config } from './config';`,
        filename: 'test.ts',
        options: [{
          pattern: 'absolute',
          baseUrl: 'src/',
          aliasPrefix: ''
        }],
        errors: [{
          messageId: 'inconsistentPattern'
        }],
        output: `
import { helper } from 'src/utils/helper';
import { config } from '@/config';`
      }
    ]
  });
});