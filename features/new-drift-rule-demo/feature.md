# New Drift Rule Demo: Database Connection Configuration Consistency

## Understanding

Create a **database connection configuration drift detection rule** using the new automation framework to demonstrate the simplified rule creation process. This rule will detect mismatches between database connection settings in different environment files that could cause runtime failures.

## Problem Statement

Development teams often have multiple database configuration sources:
- **Environment variables** (.env, .env.local, .env.production)
- **Application configuration** (database config objects)
- **Docker compose** database service definitions
- **Connection string formats** that vary between environments

Common drift patterns that cause production issues:
- **Port mismatches** - Dev uses 5432, production expects 3306
- **SSL requirement differences** - Dev allows unencrypted, production requires SSL
- **Database name inconsistencies** - Different naming conventions across environments
- **Authentication method mismatches** - Password vs certificate authentication

## Solution Approach

Create a drift detection rule using the automation framework that:
- **Parses multiple config sources** - .env files, app config, docker-compose.yml
- **Validates consistency** across development and production settings
- **Provides actionable errors** with specific configuration corrections needed

## New Rule Implementation Pattern

```javascript
// Using automation framework - complete rule in ~10 lines
class DatabaseConfigConsistencyRule {
  validateConfigs(configs) {
    const { environment, docker, application } = configs;
    
    // Pure business logic - framework handles all infrastructure
    if (environment.DB_PORT !== docker.services.database.ports[0].split(':')[0]) {
      return {
        type: 'port-mismatch',
        message: `Database port mismatch: .env specifies ${environment.DB_PORT} but docker-compose uses ${docker.services.database.ports[0]}`
      };
    }
    
    return null;
  }
}

// Automation framework handles all boilerplate
DriftRule({
  name: 'database-config-consistency',
  description: 'Ensure database configuration consistency across environments',
  parsers: ['environment', 'docker', 'application'],
  severity: 'error'
})(DatabaseConfigConsistencyRule);

export default DriftRuleFactory.registerFromClass(DatabaseConfigConsistencyRule);
```

## Framework Automation Benefits Demo

```mermaid
graph TB
    subgraph "Manual Approach (Previous)"
        A1[Create Parser Classes<br/>~15 lines each] 
        A2[Register Parsers<br/>~10 lines setup]
        A3[Extend BaseDriftRule<br/>~25 lines boilerplate]
        A4[ESLint Rule Export<br/>~5 lines binding]
        A5[Total: ~55 lines]
    end
    
    subgraph "Automated Approach (New)"
        B1[Business Logic Only<br/>~5 lines]
        B2[DriftRule Annotation<br/>~3 lines config]
        B3[Factory Registration<br/>~1 line export]
        B4[Total: ~9 lines]
    end
    
    subgraph "Framework Automation"
        C1[Parser Auto-Creation<br/>From annotation]
        C2[Registry Setup<br/>Singleton management]
        C3[ESLint Integration<br/>Standard compliance]
        C4[Error Handling<br/>Built-in patterns]
    end
    
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> A5
    
    B1 --> B2
    B2 --> B3
    B3 --> B4
    
    B2 --> C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    
    A5 --> D[❌ High Maintenance<br/>Infrastructure Focus]
    B4 --> E[✅ Business Logic Focus<br/>Rapid Development]
    
    style A1 fill:#ffebee
    style A2 fill:#ffebee
    style A3 fill:#ffebee
    style A4 fill:#ffebee
    style A5 fill:#ffebee
    style B1 fill:#e8f5e8
    style B2 fill:#e8f5e8
    style B3 fill:#e8f5e8
    style B4 fill:#e8f5e8
    style C1 fill:#f3e5f5
    style C2 fill:#f3e5f5
    style C3 fill:#f3e5f5
    style C4 fill:#f3e5f5
    style D fill:#ffebee
    style E fill:#e8f5e8
```

## Target Configuration Sources

### Environment Variables Parser
- **File types**: .env, .env.local, .env.production, .env.development
- **Extract patterns**: DB_HOST, DB_PORT, DB_NAME, DB_USER, DATABASE_URL
- **Validation**: Connection string format consistency

### Docker Configuration Parser  
- **File types**: docker-compose.yml, docker-compose.prod.yml
- **Extract patterns**: Database service definitions, port mappings, environment variables
- **Validation**: Service configuration alignment

### Application Configuration Parser
- **File types**: Database config objects in TypeScript/JavaScript
- **Extract patterns**: Connection pools, SSL settings, timeout configurations  
- **Validation**: Runtime setting compatibility

## Success Metrics

### Development Experience
- **Rule creation time** reduced from 2 hours to 15 minutes
- **Zero boilerplate** - Only business logic required
- **Immediate testing** - Framework provides test helpers
- **Clear errors** - Actionable configuration fix instructions

### Detection Capabilities
- **Multi-source validation** - Checks consistency across 3+ config sources
- **Environment-specific** - Detects dev vs prod configuration drift
- **Runtime prevention** - Catches issues before deployment
- **Clear reporting** - Specific file and line number references

The demonstration will prove that the automation framework successfully eliminates infrastructure complexity while maintaining full detection capabilities and ESLint integration standards.