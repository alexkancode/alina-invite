import path from 'path';
import fs from 'fs';

class BaseDriftRule {
  constructor(name, meta) {
    this.name = name;
    this.meta = {
      ...meta,
      messages: {
        configDrift: '{{message}}',
        parseError: 'Configuration parse error: {{error}}',
        ...meta.messages
      }
    };
  }

  parseConfigurations(projectRoot) {
    throw new Error('Must implement parseConfigurations method');
  }

  validateCompatibility(configs) {
    throw new Error('Must implement validateCompatibility method');
  }

  generateErrorMessage(incompatibility) {
    throw new Error('Must implement generateErrorMessage method');
  }

  getProjectRoot(filename) {
    let currentPath = path.dirname(filename);

    while (currentPath !== path.dirname(currentPath)) {
      if (fs.existsSync(path.join(currentPath, 'package.json'))) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }

    return path.dirname(filename);
  }

  executeDriftCheck(context, node) {
    try {
      const filename = context.getFilename ? context.getFilename() : context.filename;
      const projectRoot = this.getProjectRoot(filename);

      const configs = this.parseConfigurations(projectRoot);
      const incompatibilities = this.validateCompatibility(configs);

      if (incompatibilities.length > 0) {
        incompatibilities.forEach(incompatibility => {
          const message = this.generateErrorMessage(incompatibility);

          context.report({
            node,
            messageId: 'configDrift',
            data: { message }
          });
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

  create(context) {
    return {
      Program: (node) => this.executeDriftCheck(context, node)
    };
  }
}

export default BaseDriftRule;