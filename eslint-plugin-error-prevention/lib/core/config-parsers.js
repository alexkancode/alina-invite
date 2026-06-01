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

export class EnvironmentConfigParser {
  static name = 'environment';

  static parse(projectRoot) {
    const envFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production'
    ];

    const configs = {};

    for (const file of envFiles) {
      const envPath = path.join(projectRoot, file);
      if (fs.existsSync(envPath)) {
        try {
          configs[file] = this.parseEnvFile(envPath);
        } catch (error) {
          // Skip files that can't be parsed
        }
      }
    }

    return {
      files: configs,
      database: this.extractDatabaseConfig(configs),
      path: projectRoot,
      type: 'environment'
    };
  }

  static parseEnvFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = {};

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (trimmed === '' || trimmed.startsWith('#')) {
        continue;
      }

      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        config[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
      }
    }

    return config;
  }

  static extractDatabaseConfig(configs) {
    const dbConfig = {};

    // Extract from all env files, later values override earlier ones
    Object.values(configs).forEach(config => {
      if (config.DB_HOST) dbConfig.host = config.DB_HOST;
      if (config.DB_PORT) dbConfig.port = parseInt(config.DB_PORT);
      if (config.DB_NAME) dbConfig.database = config.DB_NAME;
      if (config.DB_USER) dbConfig.user = config.DB_USER;
      if (config.DATABASE_URL) dbConfig.url = config.DATABASE_URL;
    });

    return dbConfig;
  }

  static validate(config) {
    if (!config || config.error) {
      return false;
    }
    return Object.keys(config.files).length > 0;
  }
}

export class DockerConfigParser {
  static name = 'docker';

  static parse(projectRoot) {
    const dockerFiles = [
      'docker-compose.yml',
      'docker-compose.yaml',
      'docker-compose.prod.yml',
      'docker-compose.dev.yml'
    ];

    const configs = {};

    for (const file of dockerFiles) {
      const dockerPath = path.join(projectRoot, file);
      if (fs.existsSync(dockerPath)) {
        try {
          configs[file] = this.parseDockerFile(dockerPath);
        } catch (error) {
          // Skip files that can't be parsed
        }
      }
    }

    return {
      files: configs,
      database: this.extractDatabaseServices(configs),
      path: projectRoot,
      type: 'docker'
    };
  }

  static parseDockerFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Simple YAML-like parsing for docker-compose structure
    const config = { services: {} };
    const lines = content.split('\n');

    let currentService = null;
    let inServices = false;
    let inPorts = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect services section
      if (trimmed === 'services:') {
        inServices = true;
        continue;
      }

      // Service name (2-space indent under services)
      if (inServices && line.match(/^  [a-zA-Z0-9_-]+:/)) {
        currentService = trimmed.replace(':', '');
        config.services[currentService] = {};
        inPorts = false;
        continue;
      }

      // Ports section (4-space indent under service)
      if (currentService && line.match(/^    ports:/)) {
        config.services[currentService].ports = [];
        inPorts = true;
        continue;
      }

      // Port entries (6-space indent under ports)
      if (currentService && inPorts && line.match(/^      - /)) {
        const ports = config.services[currentService].ports || [];
        const portMapping = trimmed.replace(/^- "?|"?$/g, '');
        ports.push(portMapping);
        config.services[currentService].ports = ports;
        continue;
      }

      // Reset ports flag when encountering other properties
      if (currentService && line.match(/^    [a-zA-Z_]+:/) && !line.match(/^    ports:/)) {
        inPorts = false;
      }
    }

    return config;
  }

  static extractDatabaseServices(configs) {
    const dbServices = {};

    Object.entries(configs).forEach(([file, config]) => {
      Object.entries(config.services || {}).forEach(([name, service]) => {
        // Identify database services by name patterns
        const dbPatterns = ['db', 'database', 'postgres', 'mysql', 'mongo', 'redis'];
        const isDbService = dbPatterns.some(pattern =>
          name.toLowerCase().includes(pattern)
        );

        if (isDbService) {
          dbServices[name] = {
            file,
            ports: service.ports || [],
            ...service
          };
        }
      });
    });

    return dbServices;
  }

  static validate(config) {
    if (!config || config.error) {
      return false;
    }
    return Object.keys(config.files).length > 0;
  }
}