import { TypeScriptConfigParser, PackageJsonParser, BuildToolParser } from './config-parsers.js';

class ParserManager {
  static parserClasses = new Map();
  static parserInstances = new Map();

  static validateParserClass(ParserClass) {
    if (!ParserClass || typeof ParserClass !== 'function') {
      throw new Error('Parser class must be a constructor function');
    }

    if (typeof ParserClass.parse !== 'function') {
      throw new Error('Parser class must have static parse method');
    }

    if (typeof ParserClass.validate !== 'function') {
      throw new Error('Parser class must have static validate method');
    }
  }

  static registerParserClass(name, ParserClass) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('Parser name must be a non-empty string');
    }

    if (this.parserClasses.has(name)) {
      throw new Error(`Parser class "${name}" already registered`);
    }

    this.validateParserClass(ParserClass);
    this.parserClasses.set(name, ParserClass);
  }

  static hasParserClass(name) {
    return this.parserClasses.has(name);
  }

  static createParser(name) {
    const ParserClass = this.parserClasses.get(name);
    if (!ParserClass) {
      throw new Error(`Unknown parser: ${name}`);
    }

    return {
      name,
      parse: ParserClass.parse.bind(ParserClass),
      validate: ParserClass.validate.bind(ParserClass)
    };
  }

  static getOrCreateParser(name) {
    if (!this.parserInstances.has(name)) {
      const parser = this.createParser(name);
      this.parserInstances.set(name, parser);
    }

    return this.parserInstances.get(name);
  }

  static getRegisteredParserNames() {
    return Array.from(this.parserClasses.keys());
  }

  static getCachedInstanceNames() {
    return Array.from(this.parserInstances.keys());
  }

  static initializeDefaultParsers() {
    const defaultParsers = [
      ['typescript', TypeScriptConfigParser],
      ['package', PackageJsonParser],
      ['buildTool', BuildToolParser]
    ];

    for (const [name, ParserClass] of defaultParsers) {
      if (!this.hasParserClass(name)) {
        this.registerParserClass(name, ParserClass);
      }
    }
  }

  static getStatus() {
    return {
      registeredClasses: this.getRegisteredParserNames(),
      cachedInstances: this.getCachedInstanceNames(),
      totalRegistered: this.parserClasses.size,
      totalCached: this.parserInstances.size
    };
  }

  static clear() {
    this.parserClasses.clear();
    this.parserInstances.clear();
  }
}

export default ParserManager;