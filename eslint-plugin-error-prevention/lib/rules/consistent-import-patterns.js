import { getSourceValue } from '../utils/ast-helpers.js';
import { matchImportPattern } from '../utils/pattern-matchers.js';

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce consistent import patterns across the project',
      category: 'Import Issues',
      recommended: false,
      url: 'https://github.com/error-prevention/eslint-plugin/docs/rules/consistent-import-patterns.md'
    },
    fixable: 'code',
    messages: {
      inconsistentPattern: 'Import pattern should be {{expected}} but found {{actual}} for "{{source}}". Use {{expectedExample}} instead.'
    },
    schema: [
      {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            enum: ['relative', 'absolute'],
            description: 'Preferred import pattern: relative (./path) or absolute (@/path)'
          },
          aliasPrefix: {
            type: 'string',
            description: 'Prefix for absolute imports (default: @/)',
            default: '@/'
          },
          baseUrl: {
            type: 'string',
            description: 'Base URL for absolute imports without alias prefix',
            default: ''
          },
          allowMixed: {
            type: 'boolean',
            description: 'Allow mixing patterns when no preference is specified',
            default: true
          }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const preferredPattern = options.pattern;
    const aliasPrefix = options.aliasPrefix || '@/';
    const baseUrl = options.baseUrl || '';
    const allowMixed = options.allowMixed !== false;

    if (!preferredPattern && allowMixed) {
      return {}; // No enforcement when no pattern specified and mixed allowed
    }

    function getExpectedPattern(source, currentPattern) {
      if (!preferredPattern) return currentPattern;

      if (preferredPattern === 'absolute') {
        if (source.startsWith('./')) {
          return `${aliasPrefix}${source.substring(2)}`;
        } else if (source.startsWith('../')) {
          // For ../config, transform to @/config
          const pathAfterParent = source.substring(3);
          return `${aliasPrefix}${pathAfterParent}`;
        }
      } else if (preferredPattern === 'relative') {
        if (source.startsWith(aliasPrefix)) {
          return `./${source.substring(aliasPrefix.length)}`;
        } else if (baseUrl && source.startsWith(baseUrl)) {
          return `./${source.substring(baseUrl.length)}`;
        }
      }

      return source;
    }

    function checkImportPattern(node) {
      const source = getSourceValue(node);
      if (!source) return;

      const pattern = matchImportPattern(source);

      // Skip package imports
      if (pattern.isPackage) return;

      // Determine actual pattern type
      let actualPattern;
      if (pattern.isRelative) {
        actualPattern = 'relative';
      } else if (pattern.isAbsolute) {
        actualPattern = 'absolute';
      } else {
        return; // Unknown pattern
      }

      // Check if pattern matches preference
      if (preferredPattern && actualPattern !== preferredPattern) {
        const expectedSource = getExpectedPattern(source, actualPattern);

        const expectedExample = getExpectedPattern(source, actualPattern);

        context.report({
          node: node.source || node,
          messageId: 'inconsistentPattern',
          data: {
            expected: preferredPattern,
            actual: actualPattern,
            source,
            expectedExample
          },
          fix(fixer) {
            const sourceNode = node.source;
            if (!sourceNode) return null;

            const newSource = getExpectedPattern(source, actualPattern);
            if (newSource === source) return null;

            const quote = sourceNode.raw.charAt(0);
            const newValue = `${quote}${newSource}${quote}`;

            return fixer.replaceText(sourceNode, newValue);
          }
        });
      }
    }

    return {
      ImportDeclaration: checkImportPattern,
      ExportNamedDeclaration: checkImportPattern,
      ExportAllDeclaration: checkImportPattern
    };
  }
};