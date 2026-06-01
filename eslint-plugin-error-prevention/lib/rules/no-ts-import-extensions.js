import { getSourceValue, removeExtension, hasTypeScriptExtension } from '../utils/ast-helpers.js';

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow TypeScript file extensions in import statements',
      category: 'Import Issues',
      recommended: true,
      url: 'https://github.com/error-prevention/eslint-plugin/docs/rules/no-ts-import-extensions.md'
    },
    fixable: 'code',
    messages: {
      noTsExtension: 'Import statement should not include .ts extension. Remove "{{extension}}" from "{{source}}".',
      noTsxExtension: 'Import statement should not include .tsx extension. Remove "{{extension}}" from "{{source}}".'
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedExtensions: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of allowed file extensions that should not be flagged'
          }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedExtensions = options.allowedExtensions || ['json', 'css', 'scss', 'less', 'png', 'jpg', 'svg'];

    function checkImportSource(node) {
      const source = getSourceValue(node);
      if (!source) return;

      const tsExtension = hasTypeScriptExtension(source);
      if (!tsExtension) return;

      // Skip if this extension is in the allowed list
      const extensionWithoutDot = tsExtension.substring(1);
      if (allowedExtensions.includes(extensionWithoutDot)) return;

      const messageId = tsExtension === '.tsx' ? 'noTsxExtension' : 'noTsExtension';

      context.report({
        node: node.source || node,
        messageId,
        data: {
          extension: tsExtension,
          source
        },
        fix(fixer) {
          const sourceNode = node.source;
          if (!sourceNode) return null;

          const newSource = removeExtension(source, tsExtension);
          const quote = sourceNode.raw.charAt(0);
          const newValue = `${quote}${newSource}${quote}`;

          return fixer.replaceText(sourceNode, newValue);
        }
      });
    }

    return {
      ImportDeclaration: checkImportSource,
      ExportNamedDeclaration: checkImportSource,
      ExportAllDeclaration: checkImportSource,
      CallExpression(node) {
        // Handle dynamic imports: import('./module.ts')
        if (node.callee.type === 'Import') {
          if (node.arguments.length > 0 && node.arguments[0].type === 'Literal') {
            const mockImportNode = {
              source: node.arguments[0]
            };
            checkImportSource(mockImportNode);
          }
        }
      }
    };
  }
};