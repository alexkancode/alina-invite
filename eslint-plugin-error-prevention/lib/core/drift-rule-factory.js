import ParserManager from './parser-manager.js';
import ConfigurationParserRegistry from './parser-registry.js';
import CompatibilityEngine from './compatibility-engine.js';
import path from 'path';
import fs from 'fs';

class DriftRuleFactory {
  static registeredRules = new Map();
  static initialized = false;

  static registerFromClass(RuleClass) {
    const config = RuleClass._driftRuleConfig;
    if (!config) {
      throw new Error('Class must have @DriftRule annotation');
    }

    if (this.registeredRules.has(config.name)) {
      throw new Error(`Rule "${config.name}" already registered`);
    }

    this.ensureFrameworkInitialized();
    this.setupParsersForRule(config.parsers);
    this.setupCompatibilityRules(config.compatibilityRules);

    const eslintRule = this.createESLintRule(RuleClass, config);
    this.registeredRules.set(config.name, eslintRule);

    return eslintRule;
  }

  static ensureFrameworkInitialized() {
    if (this.initialized) return;

    // Initialize default parsers
    ParserManager.initializeDefaultParsers();

    // Setup built-in compatibility rules
    try {
      CompatibilityEngine.registerBuiltinRules();
    } catch (error) {
      // Rules may already be registered
    }

    this.initialized = true;
  }

  static setupParsersForRule(parserNames) {
    for (const name of parserNames) {
      if (!ConfigurationParserRegistry.get(name)) {
        const parser = ParserManager.getOrCreateParser(name);
        ConfigurationParserRegistry.register(name, parser);
      }
    }
  }

  static setupCompatibilityRules(ruleNames) {
    // Compatibility rules are handled by CompatibilityEngine.registerBuiltinRules
    // Custom rules would be registered here in the future
  }

  static createESLintRule(RuleClass, config) {
    return {
      meta: {
        type: 'problem',
        docs: {
          description: config.description,
          category: 'Configuration Issues'
        },
        messages: {
          configDrift: '{{message}}',
          parseError: 'Configuration parse error: {{error}}'
        },
        schema: config.schema
      },
      create: this.createRuleHandler(RuleClass, config)
    };
  }

  static createRuleHandler(RuleClass, config) {
    return function(context) {
      return {
        Program(node) {
          try {
            const filename = context.getFilename ? context.getFilename() : context.filename;
            const projectRoot = DriftRuleFactory.getProjectRoot(filename);

            // Parse configurations based on rule requirements
            const configs = ConfigurationParserRegistry.parseAll(projectRoot, config.parsers);

            // Create rule instance and call validation
            const ruleInstance = new RuleClass();
            let incompatibilities = [];

            if (typeof ruleInstance.validateConfigs === 'function') {
              const result = ruleInstance.validateConfigs(configs);
              if (result) {
                incompatibilities = Array.isArray(result) ? result : [result];
              }
            }

            // Report issues
            for (const incompatibility of incompatibilities) {
              context.report({
                node,
                messageId: 'configDrift',
                data: { message: incompatibility.message }
              });
            }
          } catch (error) {
            context.report({
              node,
              messageId: 'parseError',
              data: { error: error.message }
            });
          }
        }
      };
    };
  }

  static getProjectRoot(filename) {
    let currentPath = path.dirname(filename);

    while (currentPath !== path.dirname(currentPath)) {
      if (fs.existsSync(path.join(currentPath, 'package.json'))) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }

    return path.dirname(filename);
  }

  static getRegisteredRule(name) {
    return this.registeredRules.get(name);
  }

  static getRegisteredRuleNames() {
    return Array.from(this.registeredRules.keys());
  }

  static isInitialized() {
    return this.initialized;
  }

  static getStatus() {
    return {
      initialized: this.initialized,
      registeredRules: this.getRegisteredRuleNames(),
      totalRules: this.registeredRules.size
    };
  }

  static clear() {
    this.registeredRules.clear();
    this.initialized = false;
  }
}

export default DriftRuleFactory;