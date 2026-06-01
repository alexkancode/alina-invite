class ConfigurationParserRegistry {
  static parsers = new Map();

  static validateParserInterface(parser) {
    if (!parser || typeof parser !== 'object') {
      throw new Error('Parser must be an object');
    }

    if (typeof parser.parse !== 'function') {
      throw new Error('Parser must implement parse method');
    }

    if (typeof parser.validate !== 'function') {
      throw new Error('Parser must implement validate method');
    }

    if (!parser.name || typeof parser.name !== 'string') {
      throw new Error('Parser must have a name property');
    }
  }

  static register(name, parser) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('Parser name must be a non-empty string');
    }

    this.validateParserInterface(parser);

    if (this.parsers.has(name)) {
      throw new Error(`Parser "${name}" already registered`);
    }

    this.parsers.set(name, parser);
  }

  static get(name) {
    return this.parsers.get(name);
  }

  static getRegisteredNames() {
    return Array.from(this.parsers.keys());
  }

  static parseAll(projectRoot, requiredParsers = null) {
    const parsersToRun = requiredParsers
      ? requiredParsers.filter(name => this.parsers.has(name))
      : Array.from(this.parsers.keys());

    const results = {};

    for (const parserName of parsersToRun) {
      const parser = this.parsers.get(parserName);

      try {
        results[parserName] = parser.parse(projectRoot);
      } catch (error) {
        results[parserName] = {
          error: error.message,
          type: 'parse-error'
        };
      }
    }

    return results;
  }

  static clear() {
    this.parsers.clear();
  }
}

export default ConfigurationParserRegistry;