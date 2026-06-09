# Localhost Detection Automation - Diagrams

## Problem Flow (Current Issue)

```mermaid
flowchart TD
    A[Developer writes code] --> B[Hardcoded localhost connection]
    B --> C[Code committed]
    C --> D[Deployed to production]
    D --> E[Production deployment crashes]
    E --> F[502 errors for users]
    
    style B fill:#ffcccc,stroke:#ff0000
    style E fill:#ff9999,stroke:#ff0000
    style F fill:#ffaaaa,stroke:#ff0000
    
    Note1[scripts/migrate.ts:<br/>host: 'localhost'<br/>port: 5432]
    Note2[Railway tries localhost<br/>ECONNREFUSED ::1:5432]
    Note3[Users see NetworkError<br/>in Spotify search]
    
    B --> Note1
    E --> Note2
    F --> Note3
```

## Solution Flow (With Automation)

```mermaid
flowchart TD
    A[Developer writes code] --> B{Contains localhost?}
    B -->|Yes| C[ESLint Rule Triggers]
    B -->|No| D[Code passes checks]
    
    C --> E[Pre-commit Hook Blocks]
    E --> F[Clear error message]
    F --> G[Suggested environment fix]
    G --> H[Developer fixes code]
    H --> A
    
    D --> I[Code committed safely]
    I --> J[Deployment succeeds]
    J --> K[Production works correctly]
    
    style C fill:#fff2cc,stroke:#d6b656
    style E fill:#ffcccc,stroke:#ff0000
    style F fill:#ffe6cc,stroke:#ff9900
    style G fill:#e6f3ff,stroke:#0066cc
    style I fill:#ccffcc,stroke:#00aa00
    style J fill:#ccffcc,stroke:#00aa00
    style K fill:#90EE90,stroke:#006400
```

## Detection Mechanisms

```mermaid
classDiagram
    class ESLintRule {
        +name: "no-hardcoded-localhost"
        +detect(node): boolean
        +checkDatabaseConnections()
        +checkFetchURLs()
        +suggestEnvironmentFix()
    }
    
    class PreCommitHook {
        +scanChangedFiles()
        +runESLintCheck()
        +blockCommitIfViolations()
        +showSuggestedFixes()
    }
    
    class StaticAnalyzer {
        +scanFilePatterns()
        +detectConnectionStrings()
        +analyzeImportUsage()
        +generateReport()
    }
    
    class CICheck {
        +runInPipeline()
        +preventDeployment()
        +notifyDevelopers()
        +generateSecurityReport()
    }
    
    ESLintRule --> PreCommitHook : triggers
    PreCommitHook --> StaticAnalyzer : uses
    StaticAnalyzer --> CICheck : feeds
    
    style ESLintRule fill:#e6f3ff
    style PreCommitHook fill:#fff2e6
    style StaticAnalyzer fill:#e6ffe6
    style CICheck fill:#ffe6f3
```

## Pattern Detection Examples

```mermaid
graph LR
    subgraph "Dangerous Patterns"
        A1["host: 'localhost'"]
        A2["'localhost:5432'"]
        A3["http://localhost:4321"]
        A4["127.0.0.1:5432"]
        
        style A1 fill:#ffcccc
        style A2 fill:#ffcccc
        style A3 fill:#ffcccc
        style A4 fill:#ffcccc
    end
    
    subgraph "Safe Patterns"
        B1["process.env.DATABASE_URL"]
        B2["config.dbHost || 'localhost'"]
        B3["baseURL + '/api'"]
        B4["isProduction ? prodDB : localDB"]
        
        style B1 fill:#ccffcc
        style B2 fill:#ccffcc
        style B3 fill:#ccffcc
        style B4 fill:#ccffcc
    end
    
    subgraph "Context Awareness"
        C1[scripts/migrate.ts - CRITICAL]
        C2[src/lib/database.ts - CRITICAL]
        C3[tests/*.test.ts - ALLOWED]
        C4[*.local.ts - ALLOWED]
        
        style C1 fill:#ff9999
        style C2 fill:#ff9999
        style C3 fill:#99ff99
        style C4 fill:#99ff99
    end
```

## File Classification System

```mermaid
flowchart TD
    A[File Changed] --> B{File Path Analysis}
    
    B --> C[Production Critical]
    B --> D[Development Only]
    B --> E[Test Files]
    B --> F[Configuration]
    
    C --> G[Strict Localhost Check]
    D --> H[Allow Localhost]
    E --> H
    F --> I[Environment-aware Check]
    
    G --> J{Localhost Found?}
    I --> J
    
    J -->|Yes| K[BLOCK COMMIT]
    J -->|No| L[Allow Commit]
    H --> L
    
    style C fill:#ffcccc
    style G fill:#ff9999
    style K fill:#ff6666,color:#fff
    style L fill:#66ff66
    
    Note1[scripts/<br/>src/lib/<br/>src/pages/api/]
    Note2[*.local.ts<br/>dev-tools/<br/>examples/]
    Note3[tests/<br/>*.test.ts<br/>*.spec.ts]
    Note4[config/<br/>astro.config.mjs<br/>.env.example]
    
    C --> Note1
    D --> Note2
    E --> Note3
    F --> Note4
```

## Integration Workflow

```mermaid
sequenceDiagram
    participant D as Developer
    participant E as ESLint
    participant H as Git Hook
    participant C as CI/CD
    participant P as Production
    
    D->>E: Code with localhost
    E->>E: Rule detects violation
    E->>D: Error with suggestion
    D->>D: Fix environment usage
    D->>H: Attempt commit
    H->>H: Scan changed files
    H->>H: Run ESLint checks
    H->>C: Commit passes
    C->>C: Final deployment check
    C->>P: Deploy safely
    
    Note over E,H: Multiple layers of<br/>prevention
    Note over C,P: Production protected<br/>from localhost issues
    
    style E fill:#e6f3ff
    style H fill:#fff2e6
    style C fill:#e6ffe6
    style P fill:#ccffcc
```