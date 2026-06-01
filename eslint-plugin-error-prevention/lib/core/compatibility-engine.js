class CompatibilityEngine {
  static rules = new Map();

  static addRule(name, validator) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('Rule name must be a non-empty string');
    }

    if (typeof validator !== 'function') {
      throw new Error('Validator must be a function');
    }

    if (this.rules.has(name)) {
      throw new Error(`Compatibility rule "${name}" already registered`);
    }

    this.rules.set(name, validator);
  }

  static getRule(name) {
    return this.rules.get(name);
  }

  static getRegisteredRules() {
    return Array.from(this.rules.keys());
  }

  static validate(ruleNames, configs) {
    const results = [];

    for (const ruleName of ruleNames) {
      const validator = this.rules.get(ruleName);

      if (!validator) {
        continue; // Skip unregistered rules
      }

      try {
        const result = validator(configs);
        if (result !== null && result !== undefined) {
          results.push({
            rule: ruleName,
            ...result
          });
        }
      } catch (error) {
        results.push({
          rule: ruleName,
          type: 'validation-error',
          message: `Validator error: ${error.message}`
        });
      }
    }

    return results;
  }

  static clear() {
    this.rules.clear();
  }

  static registerBuiltinRules() {
    // TypeScript target vs Node.js version compatibility
    this.addRule('typescript-target-node-version', (configs) => {
      const tsConfig = configs.typescript;
      const packageConfig = configs.package;

      if (!tsConfig?.compilerOptions?.target || !packageConfig?.engines?.node) {
        return null;
      }

      const target = tsConfig.compilerOptions.target;
      const nodeSpec = packageConfig.engines.node;

      // Extract Node.js version from engines specification
      const versionMatch = nodeSpec.match(/(\d+)/);
      if (!versionMatch) {
        return null;
      }

      const nodeVersion = parseInt(versionMatch[1], 10);

      // TypeScript target compatibility matrix
      const targetCompatibility = {
        'ES5': 0,
        'ES6': 4,
        'ES2015': 4,
        'ES2016': 6,
        'ES2017': 8,
        'ES2018': 10,
        'ES2019': 12,
        'ES2020': 14,
        'ES2021': 16,
        'ES2022': 16.11,
        'ES2023': 18,
        'ESNext': 18
      };

      const requiredNodeVersion = targetCompatibility[target];

      if (requiredNodeVersion && nodeVersion < requiredNodeVersion) {
        return {
          type: 'version-mismatch',
          message: `TypeScript target "${target}" incompatible with Node.js ${nodeVersion}.x. ${target} features require Node.js ${requiredNodeVersion}+`,
          data: { target, nodeVersion, requiredVersion: requiredNodeVersion }
        };
      }

      return null;
    });

    // Module resolution vs build tool compatibility
    this.addRule('module-resolution-build-tool', (configs) => {
      const tsConfig = configs.typescript;
      const buildTool = configs.buildTool;

      if (!tsConfig?.compilerOptions?.moduleResolution) {
        return null;
      }

      const moduleResolution = tsConfig.compilerOptions.moduleResolution;

      if (moduleResolution === 'bundler') {
        if (!buildTool?.exists) {
          return {
            type: 'module-resolution-mismatch',
            message: 'TypeScript moduleResolution "bundler" requires a compatible build tool (Vite, Webpack 5+, etc.) but none detected',
            data: { resolution: 'bundler' }
          };
        }
      }

      return null;
    });

    // Path mapping configuration consistency
    this.addRule('path-mapping-base-url', (configs) => {
      const tsConfig = configs.typescript;

      if (!tsConfig?.compilerOptions) {
        return null;
      }

      const { paths, baseUrl } = tsConfig.compilerOptions;

      if (paths && Object.keys(paths).length > 0 && !baseUrl) {
        const pattern = Object.keys(paths)[0];
        return {
          type: 'path-mapping-mismatch',
          message: `Path mapping "${pattern}" defined but baseUrl not configured. Imports may fail in production builds`,
          data: { pattern }
        };
      }

      return null;
    });
  }
}

export default CompatibilityEngine;