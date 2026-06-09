module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent hardcoded localhost in production-critical code',
      category: 'Possible Errors',
    },
    fixable: 'code',
    schema: [{
      type: 'object',
      properties: {
        allowedFiles: {
          type: 'array',
          items: { type: 'string' }
        },
        criticalFiles: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      additionalProperties: false
    }],
    messages: {
      hardcodedLocalhostHost: 'Hardcoded localhost in database configuration. Use process.env.DATABASE_HOST || \'localhost\'',
      hardcodedLocalhostConnection: 'Hardcoded localhost connection string. Use process.env.DATABASE_URL',
      hardcodedLocalhostURL: 'Hardcoded localhost URL. Use environment-aware base URL',
      hardcodedIPAddress: 'Hardcoded 127.0.0.1 address. Use environment variable'
    }
  },

  create(context) {
    const options = context.options[0] || {};
    const filename = context.getFilename();

    function getFileContext(filename) {
      const criticalPatterns = [
        /scripts\/.*\.(ts|js|mjs)$/,
        /src\/lib\/.*\.(ts|js)$/,
        /src\/pages\/api\/.*\.(ts|js)$/,
        /src\/components\/.*\.(ts|js)$/
      ];

      const allowedPatterns = [
        /.*\.test\.(ts|js)$/,
        /.*\.spec\.(ts|js)$/,
        /.*\.local\.(ts|js)$/,
        /dev-tools\/.*\.(ts|js)$/,
        /examples\/.*\.(ts|js)$/
      ];

      if (criticalPatterns.some(p => p.test(filename))) return 'critical';
      if (allowedPatterns.some(p => p.test(filename))) return 'allowed';
      return 'default';
    }

    const fileContext = getFileContext(filename);

    if (fileContext === 'allowed') {
      return {};
    }

    function generateEnvironmentFix(property) {
      const fixes = {
        host: "process.env.DATABASE_HOST || 'localhost'",
        connectionString: "process.env.DATABASE_URL",
        url: "process.env.API_BASE_URL || 'http://localhost:4321'"
      };

      return fixes[property.key.name] || "process.env.DATABASE_HOST || 'localhost'";
    }

    return {
      Property(node) {
        if (node.key && node.key.name === 'host' &&
            node.value && node.value.type === 'Literal' &&
            node.value.value === 'localhost') {

          context.report({
            node,
            messageId: 'hardcodedLocalhostHost',
            suggest: [{
              desc: 'Use environment variable for database host',
              fix: (fixer) => fixer.replaceText(
                node.value,
                "process.env.DATABASE_HOST || 'localhost'"
              )
            }]
          });
        }
      },

      Literal(node) {
        if (typeof node.value !== 'string') return;

        const patterns = [
          {
            regex: /^postgresql:\/\/[^@]*@?localhost[:/].*$/,
            messageId: 'hardcodedLocalhostConnection'
          },
          {
            regex: /^http:\/\/localhost:\d+.*$/,
            messageId: 'hardcodedLocalhostURL'
          },
          {
            regex: /^localhost:\d+$/,
            messageId: 'hardcodedLocalhostConnection'
          },
          {
            regex: /^127\.0\.0\.1:\d+$/,
            messageId: 'hardcodedIPAddress'
          }
        ];

        patterns.forEach(({ regex, messageId }) => {
          if (regex.test(node.value)) {
            context.report({
              node,
              messageId,
              suggest: [{
                desc: 'Use environment variable',
                fix: (fixer) => {
                  if (messageId === 'hardcodedLocalhostConnection') {
                    return fixer.replaceText(node, 'process.env.DATABASE_URL');
                  } else if (messageId === 'hardcodedLocalhostURL') {
                    return fixer.replaceText(
                      node,
                      '`${process.env.API_BASE_URL || \'http://localhost:4321\'}${path}`'
                    );
                  }
                  return fixer.replaceText(
                    node,
                    "process.env.DATABASE_HOST || 'localhost'"
                  );
                }
              }]
            });
          }
        });
      },

      CallExpression(node) {
        if (node.callee.name === 'fetch' && node.arguments.length > 0) {
          const firstArg = node.arguments[0];
          if (firstArg.type === 'Literal' &&
              typeof firstArg.value === 'string' &&
              /^https?:\/\/localhost:\d+/.test(firstArg.value)) {

            context.report({
              node: firstArg,
              messageId: 'hardcodedLocalhostURL',
              suggest: [{
                desc: 'Use environment-aware base URL',
                fix: (fixer) => {
                  const url = firstArg.value;
                  const path = url.replace(/^https?:\/\/localhost:\d+/, '');
                  return fixer.replaceText(
                    firstArg,
                    `\`\${process.env.API_BASE_URL || 'http://localhost:4321'}\${${JSON.stringify(path)}}\``
                  );
                }
              }]
            });
          }
        }
      }
    };
  }
};