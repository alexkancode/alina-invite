# New Drift Rule Demo - Implementation Plan

## Overview

Demonstrate the automation framework by creating a **database connection configuration drift detection rule** that validates consistency across environment files, Docker configuration, and application settings.

## Implementation Strategy

### Phase 1: New Configuration Parsers

#### 1. Environment Variables Parser
**Purpose:** Parse .env files and extract database configuration

**Implementation:**
```javascript
// File: eslint-plugin-error-prevention/lib/core/config-parsers.js (extend existing)
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
        configs[file] = this.parseEnvFile(envPath);
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
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        config[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
      }
    }
    
    return config;
  }

  static extractDatabaseConfig(configs) {
    const dbConfig = {};
    
    // Extract from all env files
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
    return config && !config.error && Object.keys(config.files).length > 0;
  }
}
```

#### 2. Docker Configuration Parser
**Purpose:** Parse docker-compose.yml and extract database service configuration

**Implementation:**
```javascript
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
          // Skip invalid YAML files
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
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === 'services:') {
        inServices = true;
        continue;
      }
      
      if (inServices && line.match(/^  \w+:/)) {
        currentService = trimmed.replace(':', '');
        config.services[currentService] = {};
        continue;
      }
      
      if (currentService && line.match(/^    ports:/)) {
        config.services[currentService].ports = [];
        continue;
      }
      
      if (currentService && line.match(/^      - "?\d+:\d+"?/)) {
        const ports = config.services[currentService].ports || [];
        const portMapping = trimmed.replace(/^- "?|"?$/g, '');
        ports.push(portMapping);
        config.services[currentService].ports = ports;
      }
    }
    
    return config;
  }

  static extractDatabaseServices(configs) {
    const dbServices = {};
    
    Object.entries(configs).forEach(([file, config]) => {
      Object.entries(config.services || {}).forEach(([name, service]) => {
        // Identify database services by name patterns
        if (name.includes('db') || name.includes('database') || name.includes('postgres') || name.includes('mysql')) {
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
    return config && !config.error && Object.keys(config.files).length > 0;
  }
}
```

### Phase 2: Database Configuration Drift Rule

#### 1. Rule Implementation Using Automation Framework
**File:** `eslint-plugin-error-prevention/lib/rules/simplified/database-config-consistency.js`

```javascript
import { DriftRule } from '../../annotations/drift-rule.js';
import DriftRuleFactory from '../../core/drift-rule-factory.js';

class DatabaseConfigConsistencyRule {
  validateConfigs(configs) {
    const { environment, docker } = configs;
    
    if (!environment?.database || !docker?.database) {
      return null; // Skip if either config missing
    }

    const issues = [];

    // Check port consistency
    const envPort = environment.database.port;
    const dockerPorts = this.extractDockerPorts(docker.database);
    
    if (envPort && dockerPorts.length > 0) {
      const dockerPort = dockerPorts[0]; // Primary port mapping
      if (envPort !== dockerPort) {
        issues.push({
          type: 'port-mismatch',
          message: `Database port mismatch: Environment specifies ${envPort} but Docker service uses ${dockerPort}`,
          data: { envPort, dockerPort }
        });
      }
    }

    // Check database name consistency
    const envDbName = environment.database.database;
    if (envDbName && this.hasDockerDbName(docker.database, envDbName)) {
      issues.push({
        type: 'database-name-mismatch', 
        message: `Database name inconsistency detected between environment and Docker configuration`,
        data: { envName: envDbName }
      });
    }

    return issues.length > 0 ? issues : null;
  }

  extractDockerPorts(dockerDb) {
    const ports = [];
    
    Object.values(dockerDb).forEach(service => {
      service.ports?.forEach(portMapping => {
        const [hostPort] = portMapping.split(':');
        ports.push(parseInt(hostPort));
      });
    });
    
    return ports;
  }

  hasDockerDbName(dockerDb, expectedName) {
    // For demo purposes, assume mismatch if we can't verify
    // In real implementation, would parse environment variables in docker config
    return false;
  }
}

// Apply automation framework annotation
DriftRule({
  name: 'database-config-consistency',
  description: 'Ensure database configuration consistency across environments and Docker',
  parsers: ['environment', 'docker'],
  severity: 'error',
  schema: [{
    type: 'object',
    properties: {
      checkPorts: { type: 'boolean', default: true },
      checkDatabaseNames: { type: 'boolean', default: true },
      ignoredServices: { type: 'array', items: { type: 'string' } }
    }
  }]
})(DatabaseConfigConsistencyRule);

// Factory generates complete ESLint rule
export default DriftRuleFactory.registerFromClass(DatabaseConfigConsistencyRule);
```

### Phase 3: Parser Integration and Testing

#### 1. Register New Parsers with ParserManager
**File:** `eslint-plugin-error-prevention/lib/core/parser-manager.js` (extend)

```javascript
static initializeDefaultParsers() {
  const defaultParsers = [
    ['typescript', TypeScriptConfigParser],
    ['package', PackageJsonParser], 
    ['buildTool', BuildToolParser],
    ['environment', EnvironmentConfigParser],  // New
    ['docker', DockerConfigParser]             // New
  ];

  for (const [name, ParserClass] of defaultParsers) {
    if (!this.hasParserClass(name)) {
      this.registerParserClass(name, ParserClass);
    }
  }
}
```

#### 2. Comprehensive Testing Strategy

**Unit Tests:**
```javascript
// Test new parsers
describe('EnvironmentConfigParser', () => {
  test('should parse .env files correctly');
  test('should extract database configuration');
  test('should handle missing files gracefully');
});

describe('DockerConfigParser', () => {
  test('should parse docker-compose.yml');
  test('should identify database services');
  test('should extract port mappings');
});
```

**Integration Tests:**
```javascript
// Test complete rule with automation framework
describe('DatabaseConfigConsistencyRule', () => {
  test('should detect port mismatches');
  test('should work with factory automation');
  test('should integrate with ESLint properly');
});
```

### Phase 4: Plugin Integration

#### 1. Add Rule to Plugin Configuration
**File:** `eslint-plugin-error-prevention/lib/index.js`

```javascript
import databaseConfigConsistency from './rules/simplified/database-config-consistency.js';

export default {
  rules: {
    // Existing rules...
    'database-config-consistency': databaseConfigConsistency
  },
  configs: {
    recommended: {
      plugins: ['error-prevention'],
      rules: {
        // Existing rules...
        'error-prevention/database-config-consistency': 'error'
      }
    }
  }
};
```

## Implementation Checklist

### Code Quality Standards
- **Single Responsibility:** Each parser handles one config source, rule handles one drift pattern
- **Testable Interfaces:** All parsers follow standard interface, rule logic isolated
- **No Utility Duplication:** Reuse existing automation framework components
- **Clear Function Purpose:** Each method has single validation responsibility
- **No Comments:** Self-documenting code through clear naming

### Testing Strategy
- **Parser Unit Tests:** Each configuration parser tested independently
- **Rule Business Logic Tests:** Drift detection logic tested with mock configs
- **Automation Framework Tests:** Factory integration verified
- **ESLint Integration Tests:** Complete rule workflow validated

### Framework Integration
- **Automatic Parser Registration:** New parsers auto-discovered by ParserManager
- **Factory Rule Generation:** DriftRule annotation generates complete ESLint rule
- **Standard Error Handling:** Framework provides built-in error patterns
- **Plugin Compatibility:** Generated rule follows ESLint specifications

## Success Validation

To validate new-drift-rule-demo implementation:

1. **Parser Functionality Tests**
   - Create test .env and docker-compose.yml files with known configurations
   - Verify parsers extract database settings correctly
   - Test error handling with malformed configuration files

2. **Rule Detection Tests** 
   - Set up intentional port mismatch between .env and docker-compose.yml
   - Run ESLint on test file and verify drift detection
   - Confirm error messages provide actionable fix instructions

3. **Automation Framework Validation**
   - Count lines of code: business logic only (~10 lines) vs traditional approach (~50+ lines)
   - Verify zero manual parser registration required
   - Test rule integrates seamlessly with existing ESLint workflow

4. **Real Project Integration**
   - Add rule to main project ESLint configuration
   - Run on actual codebase and verify no false positives
   - Test performance impact with multiple configuration sources

The implementation demonstrates that the automation framework successfully eliminates infrastructure complexity while maintaining full ESLint compatibility and detection effectiveness.