import fs from 'fs';
import path from 'path';

export class TypeScriptConfigParser {
  static name = 'typescript';

  static parse(projectRoot) {
    const tsConfigPath = path.join(projectRoot, 'tsconfig.json');

    if (!fs.existsSync(tsConfigPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(tsConfigPath, 'utf8');
      const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      const config = JSON.parse(cleanContent);

      // Resolve extended configurations
      const resolvedConfig = this.resolveExtends(config, projectRoot);

      return {
        compilerOptions: resolvedConfig.compilerOptions || {},
        path: tsConfigPath,
        raw: config,
        resolved: resolvedConfig
      };
    } catch (error) {
      return {
        error: `Failed to parse tsconfig.json: ${error.message}`,
        path: tsConfigPath
      };
    }
  }

  static resolveExtends(config, projectRoot) {
    // For now, provide reasonable defaults for common extends patterns
    // This is a simplified resolution - full resolution would require
    // loading the actual extended configurations
    const defaults = {
      'astro/tsconfigs/strict': {
        compilerOptions: {
          target: 'ES2020',
          moduleResolution: 'bundler',
          allowJs: true,
          checkJs: false,
          allowSyntheticDefaultImports: true,
          forceConsistentCasingInFileNames: true,
          strict: true,
          skipLibCheck: true
        }
      },
      '@tsconfig/node16': {
        compilerOptions: {
          target: 'ES2020',
          moduleResolution: 'node',
          strict: true
        }
      },
      '@tsconfig/recommended': {
        compilerOptions: {
          target: 'ES2020',
          moduleResolution: 'node',
          strict: true
        }
      }
    };

    let resolved = { ...config };

    if (config.extends) {
      const baseConfig = defaults[config.extends];
      if (baseConfig) {
        resolved = {
          ...baseConfig,
          ...config,
          compilerOptions: {
            ...baseConfig.compilerOptions,
            ...config.compilerOptions
          }
        };
      }
    }

    return resolved;
  }

  static validate(config) {
    return config && !config.error;
  }

  static getCompatibilityData() {
    return {
      targetVersions: {
        'ES5': { minNodeVersion: 0 },
        'ES6': { minNodeVersion: 4 },
        'ES2015': { minNodeVersion: 4 },
        'ES2016': { minNodeVersion: 6 },
        'ES2017': { minNodeVersion: 8 },
        'ES2018': { minNodeVersion: 10 },
        'ES2019': { minNodeVersion: 12 },
        'ES2020': { minNodeVersion: 14 },
        'ES2021': { minNodeVersion: 16 },
        'ES2022': { minNodeVersion: 16.11 },
        'ES2023': { minNodeVersion: 18 },
        'ESNext': { minNodeVersion: 18 }
      }
    };
  }
}

export class PackageJsonParser {
  static name = 'package';

  static parse(projectRoot) {
    const packageJsonPath = path.join(projectRoot, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);

      return {
        engines: packageJson.engines || {},
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        scripts: packageJson.scripts || {},
        path: packageJsonPath,
        raw: packageJson
      };
    } catch (error) {
      return {
        error: `Failed to parse package.json: ${error.message}`,
        path: packageJsonPath
      };
    }
  }

  static validate(config) {
    return config && !config.error;
  }

  static getEngineRequirements(config) {
    if (!config?.engines?.node) {
      return null;
    }

    const nodeSpec = config.engines.node;
    const versionMatch = nodeSpec.match(/(\d+)/);

    if (versionMatch) {
      return {
        node: {
          version: parseInt(versionMatch[1], 10),
          spec: nodeSpec
        }
      };
    }

    return null;
  }
}

export class BuildToolParser {
  static name = 'buildTool';

  static parse(projectRoot) {
    const buildConfigs = [
      { file: 'vite.config.js', type: 'vite' },
      { file: 'vite.config.ts', type: 'vite' },
      { file: 'vite.config.mjs', type: 'vite' },
      { file: 'webpack.config.js', type: 'webpack' },
      { file: 'webpack.config.ts', type: 'webpack' },
      { file: 'rollup.config.js', type: 'rollup' },
      { file: 'rollup.config.ts', type: 'rollup' },
      { file: 'astro.config.mjs', type: 'astro' },
      { file: 'astro.config.ts', type: 'astro' }
    ];

    for (const config of buildConfigs) {
      const configPath = path.join(projectRoot, config.file);
      if (fs.existsSync(configPath)) {
        return {
          type: config.type,
          path: configPath,
          exists: true,
          file: config.file
        };
      }
    }

    return {
      type: null,
      path: null,
      exists: false,
      file: null
    };
  }

  static validate(config) {
    return config !== null;
  }

  static getSupportedFeatures(config) {
    if (!config?.exists) {
      return {
        moduleResolution: ['node', 'classic'],
        bundling: false
      };
    }

    const features = {
      vite: {
        moduleResolution: ['node', 'bundler'],
        bundling: true,
        esModules: true
      },
      webpack: {
        moduleResolution: ['node', 'bundler'],
        bundling: true,
        esModules: true
      },
      rollup: {
        moduleResolution: ['node'],
        bundling: true,
        esModules: true
      },
      astro: {
        moduleResolution: ['node', 'bundler'],
        bundling: true,
        esModules: true
      }
    };

    return features[config.type] || {
      moduleResolution: ['node'],
      bundling: false
    };
  }
}