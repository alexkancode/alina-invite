const { RuleTester } = require('eslint');
const rule = require('../../lib/rules/no-sql-concatenation');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

describe('no-sql-concatenation', () => {
  ruleTester.run('no-sql-concatenation', rule, {
    valid: [
      // Parameterized queries are allowed
      {
        code: `const query = 'SELECT * FROM users WHERE id = $1';`
      },
      {
        code: `const query = 'INSERT INTO users (name, email) VALUES ($1, $2)';`
      },

      // Template literals without variables are allowed
      {
        code: `const query = \`
          SELECT * FROM products
          WHERE category = 'electronics'
        \`;`
      },

      // String concatenation without SQL keywords
      {
        code: `const message = 'Hello ' + name + '!';`
      },

      // SQL keywords in safe contexts
      {
        code: `const comment = 'This SELECT statement is an example';`
      },

      // Prepared statements with explicit parameters
      {
        code: `db.query('SELECT * FROM users WHERE id = ?', [userId]);`
      }
    ],

    invalid: [
      // Basic string concatenation with SQL
      {
        code: `const query = 'SELECT * FROM users WHERE id = ' + userId;`,
        errors: [{
          messageId: 'sqlConcatenation',
          data: {
            pattern: 'string concatenation',
            sqlKeywords: ['SELECT', 'FROM', 'WHERE']
          }
        }]
      },

      // Template literal with variable interpolation
      {
        code: `const query = \`SELECT * FROM users WHERE name = '\${userName}'\`;`,
        errors: [{
          messageId: 'sqlConcatenation',
          data: {
            pattern: 'template literal interpolation',
            sqlKeywords: 'SELECT, FROM, WHERE'
          }
        }]
      },

      // INSERT with concatenation
      {
        code: `const query = 'INSERT INTO users (name) VALUES (' + name + ')';`,
        errors: [{
          messageId: 'sqlConcatenation',
          data: {
            pattern: 'string concatenation',
            sqlKeywords: ['INSERT', 'VALUES']
          }
        }]
      },

      // Multiple SQL operations concatenated
      {
        code: `const query = 'UPDATE users SET name = ' + newName + ' WHERE id = ' + userId;`,
        errors: [{
          messageId: 'sqlConcatenation',
          data: {
            pattern: 'string concatenation',
            sqlKeywords: ['UPDATE', 'SET', 'WHERE']
          }
        }]
      },

      // Template literal with multiple interpolations
      {
        code: `const deleteQuery = \`DELETE FROM posts WHERE author = '\${author}' AND status = '\${status}'\`;`,
        errors: [{
          messageId: 'sqlConcatenation',
          data: {
            pattern: 'template literal interpolation',
            sqlKeywords: 'DELETE, FROM, WHERE'
          }
        }]
      },

      // Complex query building
      {
        code: `
        let query = 'SELECT * FROM products';
        if (category) {
          query += ' WHERE category = ' + category;
        }`,
        errors: [{
          messageId: 'sqlConcatenation',
          data: {
            pattern: 'string concatenation',
            sqlKeywords: ['WHERE']
          }
        }]
      }
    ]
  });
});

describe('no-sql-concatenation configuration', () => {
  const configuredRuleTester = new RuleTester({
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  });

  configuredRuleTester.run('no-sql-concatenation with custom keywords', rule, {
    valid: [
      {
        code: `const query = 'EXPLAIN QUERY PLAN ' + tableName;`,
        options: [{
          sqlKeywords: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] // EXPLAIN not included
        }]
      }
    ],

    invalid: [
      {
        code: `const query = 'SELECT * FROM ' + tableName;`,
        options: [{
          sqlKeywords: ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
        }],
        errors: [{
          messageId: 'sqlConcatenation'
        }]
      }
    ]
  });
});