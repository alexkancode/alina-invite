const { matchSQLPattern } = require('../utils/pattern-matchers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow string concatenation in SQL query construction',
      category: 'Security',
      recommended: true,
      url: 'https://github.com/error-prevention/eslint-plugin/docs/rules/no-sql-concatenation.md'
    },
    messages: {
      sqlConcatenation: 'Avoid {{pattern}} in SQL queries. Found SQL keywords: {{sqlKeywords}}. Use parameterized queries instead.'
    },
    schema: [
      {
        type: 'object',
        properties: {
          sqlKeywords: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of SQL keywords to detect (default includes common SQL keywords)'
          },
          allowTemplateLiterals: {
            type: 'boolean',
            description: 'Allow template literals without variable interpolation',
            default: true
          }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const sqlKeywords = options.sqlKeywords || [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP',
      'FROM', 'WHERE', 'JOIN', 'UNION', 'VALUES', 'SET', 'ORDER', 'GROUP'
    ];
    const allowTemplateLiterals = options.allowTemplateLiterals !== false;

    function checkForSQLConcatenation(node, content, patternType) {
      if (!content || typeof content !== 'string') return;

      const sqlPattern = matchSQLPattern(content);

      if (sqlPattern.hasSQL && sqlPattern.isDynamic) {
        const foundKeywords = sqlPattern.keywords.filter(kw =>
          sqlKeywords.includes(kw.toUpperCase())
        );

        if (foundKeywords.length > 0) {
          context.report({
            node,
            messageId: 'sqlConcatenation',
            data: {
              pattern: patternType,
              sqlKeywords: foundKeywords.join(', ')
            }
          });
        }
      }
    }

    function getStringValue(node) {
      if (node.type === 'Literal') {
        return node.value;
      } else if (node.type === 'TemplateLiteral') {
        // For template literals, only check if they have expressions
        if (node.expressions.length > 0) {
          return node.quasis.map(q => q.value.cooked).join('${...}');
        } else if (!allowTemplateLiterals) {
          return node.quasis.map(q => q.value.cooked).join('');
        }
      }
      return null;
    }

    function checkConcatenatedString(left, right) {
      const leftValue = getStringValue(left);
      const rightValue = getStringValue(right);

      // Check if either side has SQL keywords
      let hasSqlInLeft = false;
      let hasSqlInRight = false;

      if (leftValue) {
        const leftPattern = matchSQLPattern(leftValue);
        hasSqlInLeft = leftPattern.hasSQL;
      }

      if (rightValue) {
        const rightPattern = matchSQLPattern(rightValue);
        hasSqlInRight = rightPattern.hasSQL;
      }

      // Also check for variables being concatenated (right side is variable/identifier)
      const isVariableConcatenation = right.type === 'Identifier' ||
                                     right.type === 'MemberExpression' ||
                                     right.type === 'CallExpression';

      if ((hasSqlInLeft || hasSqlInRight) &&
          (leftValue || rightValue || isVariableConcatenation)) {
        return (leftValue || '') + (rightValue || '__DYNAMIC__');
      }

      return null;
    }

    return {
      BinaryExpression(node) {
        if (node.operator === '+') {
          const concatenatedString = checkConcatenatedString(node.left, node.right);
          if (concatenatedString) {
            checkForSQLConcatenation(node, concatenatedString, 'string concatenation');
          }
        }
      },

      TemplateLiteral(node) {
        if (node.expressions.length > 0) {
          const content = node.quasis.map(q => q.value.cooked).join('${...}');
          checkForSQLConcatenation(node, content, 'template literal interpolation');
        }
      },

      AssignmentExpression(node) {
        if (node.operator === '+=' &&
            node.right.type === 'Literal' &&
            typeof node.right.value === 'string') {

          const sqlPattern = matchSQLPattern(node.right.value);

          if (sqlPattern.hasSQL && sqlPattern.isDynamic) {
            const foundKeywords = sqlPattern.keywords.filter(kw =>
              sqlKeywords.includes(kw.toUpperCase())
            );

            if (foundKeywords.length > 0) {
              context.report({
                node,
                messageId: 'sqlConcatenation',
                data: {
                  pattern: 'string concatenation',
                  sqlKeywords: foundKeywords.join(', ')
                }
              });
            }
          }
        }
      },

      CallExpression(node) {
        // Check for common SQL execution patterns
        if (node.callee.type === 'MemberExpression' &&
            (
              (node.callee.property.name === 'query') ||
              (node.callee.property.name === 'execute') ||
              (node.callee.property.name === 'exec')
            )
        ) {

          if (node.arguments.length > 0) {
            const firstArg = node.arguments[0];

            if (firstArg.type === 'BinaryExpression' && firstArg.operator === '+') {
              const concatenatedString = checkConcatenatedString(firstArg.left, firstArg.right);
              if (concatenatedString) {
                checkForSQLConcatenation(firstArg, concatenatedString, 'string concatenation');
              }
            } else if (firstArg.type === 'TemplateLiteral' && firstArg.expressions.length > 0) {
              const content = firstArg.quasis.map(q => q.value.cooked).join('${...}');
              checkForSQLConcatenation(firstArg, content, 'template literal interpolation');
            }
          }
        }
      }
    };
  }
};