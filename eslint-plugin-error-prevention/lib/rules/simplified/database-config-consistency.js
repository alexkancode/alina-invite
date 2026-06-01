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

    // Check database name consistency (simplified for demo)
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
        // Extract host port for comparison with environment port
        const [hostPort] = portMapping.split(':');
        ports.push(parseInt(hostPort));
      });
    });

    return ports;
  }

  hasDockerDbName(dockerDb, expectedName) {
    // For demo purposes, assume no mismatch
    // In real implementation, would parse environment variables in docker config
    return false;
  }
}

// Apply automation framework annotation - this replaces all the boilerplate
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