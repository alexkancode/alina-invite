import fs from 'fs';
import path from 'path';

class ConfigurationParser {
  static findProjectRoot(startPath) {
    let currentPath = startPath;

    while (currentPath !== path.dirname(currentPath)) {
      if (fs.existsSync(path.join(currentPath, 'package.json'))) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }

    return startPath;
  }

  static parseTsConfig(projectRoot) {
    const tsConfigPath = path.join(projectRoot, 'tsconfig.json');

    if (!fs.existsSync(tsConfigPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(tsConfigPath, 'utf8');
      // Remove JSON comments for parsing
      const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      const config = JSON.parse(cleanContent);

      return {
        compilerOptions: config.compilerOptions || {},
        path: tsConfigPath,
        raw: config
      };
    } catch (error) {
      return {
        error: `Failed to parse tsconfig.json: ${error.message}`,
        path: tsConfigPath
      };
    }
  }

  static parsePackageJson(projectRoot) {
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

  static parseBuildConfig(projectRoot) {
    const buildConfigs = [
      { file: 'vite.config.js', type: 'vite' },
      { file: 'vite.config.ts', type: 'vite' },
      { file: 'webpack.config.js', type: 'webpack' },
      { file: 'webpack.config.ts', type: 'webpack' },
      { file: 'rollup.config.js', type: 'rollup' },
      { file: 'astro.config.mjs', type: 'astro' }
    ];

    for (const config of buildConfigs) {
      const configPath = path.join(projectRoot, config.file);
      if (fs.existsSync(configPath)) {
        return {
          type: config.type,
          path: configPath,
          exists: true
        };
      }
    }

    return {
      type: null,
      path: null,
      exists: false
    };
  }

  static getNodeVersionFromEngines(engines) {
    if (!engines || !engines.node) {
      return null;
    }

    // Parse Node.js version requirement (e.g., ">=14.0.0", "^16.0.0", "18")
    const nodeSpec = engines.node;
    const versionMatch = nodeSpec.match(/(\d+)/);

    if (versionMatch) {
      return parseInt(versionMatch[1], 10);
    }

    return null;
  }

  static validateESTargetCompatibility(target, nodeVersion) {
    if (!target || !nodeVersion) {
      return { compatible: true };
    }

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

    if (requiredNodeVersion === undefined) {
      return { compatible: true };
    }

    if (nodeVersion < requiredNodeVersion) {
      return {
        compatible: false,
        requiredNodeVersion,
        actualNodeVersion: nodeVersion,
        target
      };
    }

    return { compatible: true };
  }
}

export default ConfigurationParser;