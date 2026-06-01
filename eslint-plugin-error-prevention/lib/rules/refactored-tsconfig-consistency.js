import BaseDriftRule from '../core/base-rule.js';
import ConfigurationParserRegistry from '../core/parser-registry.js';
import CompatibilityEngine from '../core/compatibility-engine.js';
import { TypeScriptConfigParser, PackageJsonParser, BuildToolParser } from '../core/config-parsers.js';

class RefactoredTypeScriptConsistencyRule extends BaseDriftRule {
  constructor() {
    super('refactored-tsconfig-consistency', {
      type: 'problem',
      docs: {
        description: 'Validate TypeScript configuration consistency with runtime environment using extensible architecture',
        category: 'Configuration Issues',
        recommended: true
      },
      schema: [{
        type: 'object',
        properties: {
          checkNodeVersion: { type: 'boolean', default: true },
          checkModuleResolution: { type: 'boolean', default: true },
          checkPathMapping: { type: 'boolean', default: true }
        },
        additionalProperties: false
      }]
    });

    this.ensureFrameworkSetup();
  }

  ensureFrameworkSetup() {
    // Create proper parser instances
    const tsParser = {
      name: 'typescript',
      parse: TypeScriptConfigParser.parse.bind(TypeScriptConfigParser),
      validate: TypeScriptConfigParser.validate.bind(TypeScriptConfigParser)
    };

    const packageParser = {
      name: 'package',
      parse: PackageJsonParser.parse.bind(PackageJsonParser),
      validate: PackageJsonParser.validate.bind(PackageJsonParser)
    };

    const buildParser = {
      name: 'buildTool',
      parse: BuildToolParser.parse.bind(BuildToolParser),
      validate: BuildToolParser.validate.bind(BuildToolParser)
    };

    try {
      ConfigurationParserRegistry.register('typescript', tsParser);
    } catch (error) {
      // Parser already registered
    }

    try {
      ConfigurationParserRegistry.register('package', packageParser);
    } catch (error) {
      // Parser already registered
    }

    try {
      ConfigurationParserRegistry.register('buildTool', buildParser);
    } catch (error) {
      // Parser already registered
    }

    // Register built-in compatibility rules
    try {
      CompatibilityEngine.registerBuiltinRules();
    } catch (error) {
      // Rules already registered
    }
  }

  parseConfigurations(projectRoot) {
    return ConfigurationParserRegistry.parseAll(projectRoot, [
      'typescript',
      'package',
      'buildTool'
    ]);
  }

  validateCompatibility(configs) {
    const rulesToCheck = [
      'typescript-target-node-version',
      'module-resolution-build-tool',
      'path-mapping-base-url'
    ];

    return CompatibilityEngine.validate(rulesToCheck, configs);
  }

  generateErrorMessage(incompatibility) {
    return incompatibility.message;
  }
}

const ruleInstance = new RefactoredTypeScriptConsistencyRule();
export default {
  meta: ruleInstance.meta,
  create: ruleInstance.create.bind(ruleInstance)
};