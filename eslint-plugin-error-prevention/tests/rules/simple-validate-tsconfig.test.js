import { RuleTester } from 'eslint';
import rule from '../../lib/rules/validate-tsconfig-consistency.js';

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

// Simple test without complex file system operations
ruleTester.run('validate-tsconfig-consistency-basic', rule, {
  valid: [
    {
      code: 'const config = { target: "ES2020" };',
      options: [{ checkNodeVersion: false, checkModuleResolution: false }],
      filename: 'test.ts'
    }
  ],

  invalid: []
});