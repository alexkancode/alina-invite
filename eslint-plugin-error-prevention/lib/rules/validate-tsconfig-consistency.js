import ConfigurationParser from '../utils/config-parser.js';
import path from 'path';

const meta = {
  type: 'problem',
  docs: {
    description: 'Validate TypeScript configuration consistency with runtime environment',
    category: 'Possible Errors',
    recommended: true
  },
  messages: {
    targetNodeIncompatible: 'TypeScript target "{{target}}" incompatible with Node.js {{nodeVersion}}.x (package.json engines). {{target}} features require Node.js {{requiredVersion}}+',
    moduleResolutionIncompatible: 'TypeScript moduleResolution "{{resolution}}" requires a compatible build tool ({{expectedTools}}) but none detected',
    pathMappingMisconfigured: 'Path mapping "{{pattern}}" defined but baseUrl not configured. Imports may fail in production builds',
    tsConfigNotFound: 'tsconfig.json not found. TypeScript configuration validation requires tsconfig.json',
    configParseError: 'Configuration parse error: {{error}}'
  },
  schema: [{
    type: 'object',
    properties: {
      checkNodeVersion: {
        type: 'boolean',
        default: true
      },
      checkModuleResolution: {
        type: 'boolean',
        default: true
      },
      checkPathMapping: {
        type: 'boolean',
        default: true
      }
    },
    additionalProperties: false
  }],
  fixable: null
};

function create(context) {
  const options = context.options[0] || {};
  const {
    checkNodeVersion = true,
    checkModuleResolution = true,
    checkPathMapping = true
  } = options;

  // Cache configurations per ESLint run
  let projectRoot = null;
  let tsConfig = null;
  let packageJson = null;
  let buildConfig = null;
  let configsLoaded = false;

  function loadConfigurations() {
    if (configsLoaded) return;

    const filename = context.getFilename ? context.getFilename() : context.filename;
    projectRoot = ConfigurationParser.findProjectRoot(path.dirname(filename));

    tsConfig = ConfigurationParser.parseTsConfig(projectRoot);
    packageJson = ConfigurationParser.parsePackageJson(projectRoot);
    buildConfig = ConfigurationParser.parseBuildConfig(projectRoot);

    configsLoaded = true;
  }

  function checkNodeVersionCompatibility(node) {
    if (!checkNodeVersion || !tsConfig || !packageJson) return;

    if (tsConfig.error) {
      context.report({
        node,
        messageId: 'configParseError',
        data: { error: tsConfig.error }
      });
      return;
    }

    const target = tsConfig.compilerOptions.target;
    const nodeVersion = ConfigurationParser.getNodeVersionFromEngines(packageJson.engines);

    if (!target || !nodeVersion) return;

    const compatibility = ConfigurationParser.validateESTargetCompatibility(target, nodeVersion);

    if (!compatibility.compatible) {
      context.report({
        node,
        messageId: 'targetNodeIncompatible',
        data: {
          target: compatibility.target,
          nodeVersion: compatibility.actualNodeVersion,
          requiredVersion: compatibility.requiredNodeVersion
        }
      });
    }
  }

  function checkModuleResolutionCompatibility(node) {
    if (!checkModuleResolution || !tsConfig) return;

    if (tsConfig.error) return; // Already reported in checkNodeVersionCompatibility

    const moduleResolution = tsConfig.compilerOptions.moduleResolution;

    if (moduleResolution === 'bundler') {
      if (!buildConfig.exists) {
        context.report({
          node,
          messageId: 'moduleResolutionIncompatible',
          data: {
            resolution: 'bundler',
            expectedTools: 'Vite, Webpack 5+, etc.'
          }
        });
      }
    }
  }

  function checkPathMappingConfiguration(node) {
    if (!checkPathMapping || !tsConfig) return;

    if (tsConfig.error) return; // Already reported earlier

    const compilerOptions = tsConfig.compilerOptions;
    const paths = compilerOptions.paths;
    const baseUrl = compilerOptions.baseUrl;

    if (paths && Object.keys(paths).length > 0 && !baseUrl) {
      // Find a path mapping pattern to report
      const pattern = Object.keys(paths)[0];

      context.report({
        node,
        messageId: 'pathMappingMisconfigured',
        data: { pattern }
      });
    }
  }

  return {
    Program(node) {
      loadConfigurations();

      if (!tsConfig) {
        context.report({
          node,
          messageId: 'tsConfigNotFound'
        });
        return;
      }

      checkNodeVersionCompatibility(node);
      checkModuleResolutionCompatibility(node);
      checkPathMappingConfiguration(node);
    }
  };
}

export default { meta, create };