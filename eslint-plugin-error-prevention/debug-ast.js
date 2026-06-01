const { RuleTester } = require('eslint');

// Simple debug rule to see what the AST looks like
const debugRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Debug rule' },
    schema: []
  },
  create(context) {
    return {
      CallExpression(node) {
        console.log('CallExpression found:');
        console.log('  callee.type:', node.callee.type);
        console.log('  callee.name:', node.callee.name);
        console.log('  arguments length:', node.arguments.length);
        if (node.arguments.length > 0) {
          console.log('  first argument type:', node.arguments[0].type);
          console.log('  first argument value:', node.arguments[0].value);
        }
        console.log('---');
      }
    };
  }
};

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

try {
  ruleTester.run('debug', debugRule, {
    valid: [],
    invalid: [
      {
        code: `async function loadModule() { const module = await import('./dynamic.ts'); }`,
        errors: [{ message: 'debug' }]
      }
    ]
  });
} catch (error) {
  console.log('Test execution completed');
}