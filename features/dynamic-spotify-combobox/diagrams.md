# Dynamic Spotify Combobox - Visual Architecture

## Component Architecture Overview

### Current vs Target Implementation

```mermaid
flowchart TD
    subgraph "Current State"
        A1[Static Dropdown] --> B1[4 Hardcoded Songs]
        B1 --> C1[Limited User Choice]
        C1 --> D1[Poor UX]
    end
    
    subgraph "Target State"
        A2[Dynamic Search Input] --> B2[Real-time Spotify API]
        B2 --> C2[Rich Results Display]
        C2 --> D2[Enhanced Interactions]
        D2 --> E2[Play + Spotify Integration]
    end
    
    style A1 fill:#ff9999,stroke:#ff0000,color:#fff
    style D1 fill:#ff9999,stroke:#ff0000,color:#fff
    style A2 fill:#1DB954,stroke:#1ed760,color:#fff
    style E2 fill:#1DB954,stroke:#1ed760,color:#fff
    style B2 fill:#4ecdc4,stroke:#45b7d1,color:#fff
    style C2 fill:#4ecdc4,stroke:#45b7d1,color:#fff
```

### Component Structure and Data Flow

```mermaid
flowchart LR
    subgraph "User Interface Layer"
        A[Search Input] --> B[Results Dropdown]
        B --> C[Song Result Item]
        C --> D[Play Button]
        C --> E[Spotify Button]
    end
    
    subgraph "Logic Layer"
        F[Debounce Handler] --> G[API Client]
        G --> H[Cache Manager]
        H --> I[Result Formatter]
    end
    
    subgraph "External Services"
        J[Spotify Web API] --> K[Audio Previews]
        J --> L[Deep Link URLs]
    end
    
    A --> F
    G --> J
    I --> B
    D --> K
    E --> L
    
    style A fill:#ffd700,stroke:#ff8c00,color:#333
    style B fill:#4ecdc4,stroke:#45b7d1,color:#fff
    style J fill:#1DB954,stroke:#1ed760,color:#fff
    style K fill:#1DB954,stroke:#1ed760,color:#fff
```

## User Interaction Flow

### Search and Selection Process

```mermaid
sequenceDiagram
    participant U as User
    participant I as Search Input
    participant D as Debouncer
    participant A as API Client
    participant S as Spotify API
    participant R as Results Display
    
    U->>I: Focus input field
    I->>R: Show empty state
    U->>I: Type "dancing"
    I->>D: Queue search request
    
    Note over D: 200ms debounce
    
    D->>A: Execute search
    A->>S: GET /v1/search?q=dancing+year:1970-1979
    S-->>A: Return results with metadata
    A->>R: Display formatted results
    
    U->>R: Hover/navigate to result
    R->>R: Highlight selection
    U->>R: Click Play button
    R->>S: Play 30-second preview
    
    U->>R: Click "Open with Spotify"
    R->>S: Navigate to Spotify app/web
    
    style U fill:#ffd700,stroke:#ff8c00,color:#333
    style S fill:#1DB954,stroke:#1ed760,color:#fff
    style R fill:#4ecdc4,stroke:#45b7d1,color:#fff
```

## Result Item Layout Design

### Visual Component Structure

```mermaid
graph TD
    subgraph "Song Result Item - 300px width"
        A["🎵 Album Art<br/>48x48px"] --> B[Song Info Section]
        B --> C[Song Title - Artist Name]
        B --> D[Release Year]
        B --> E[Action Buttons]
        E --> F[▶ Play]
        E --> G[🎧 Spotify]
    end
    
    style A fill:#e8f5e8,stroke:#1DB954,color:#333
    style C fill:#f0f9ff,stroke:#45b7d1,color:#333
    style D fill:#f9fafb,stroke:#6b7280,color:#333
    style F fill:#1DB954,stroke:#1ed760,color:#fff
    style G fill:#1DB954,stroke:#1ed760,color:#fff
```

### Responsive Layout Breakpoints

```mermaid
flowchart TD
    subgraph "Desktop (≥768px)"
        A1[Full Layout: Art + Info + Buttons]
    end
    
    subgraph "Tablet (≥640px)"
        A2[Compact: Smaller Art + Info + Buttons]
    end
    
    subgraph "Mobile (<640px)"
        A3[Stack: Art Above Info, Buttons Below]
    end
    
    style A1 fill:#4ecdc4,stroke:#45b7d1,color:#fff
    style A2 fill:#ffd700,stroke:#ff8c00,color:#333
    style A3 fill:#ff6b6b,stroke:#ff5252,color:#fff
```

## Performance Optimization Strategy

### Caching and Request Management

```mermaid
stateDiagram-v2
    [*] --> UserTyping
    UserTyping --> Debouncing : Input change
    Debouncing --> CheckCache : 200ms elapsed
    
    CheckCache --> ReturnCached : Cache hit
    CheckCache --> ApiRequest : Cache miss
    
    ApiRequest --> Processing : HTTP request
    Processing --> StoreCache : Response received
    StoreCache --> DisplayResults : Cache updated
    
    ReturnCached --> DisplayResults
    DisplayResults --> UserTyping : New search
    
    Processing --> HandleError : Request failed
    HandleError --> DisplayError
    DisplayError --> UserTyping
    
    style CheckCache fill:#ffd700,stroke:#ff8c00,color:#333
    style ReturnCached fill:#4ecdc4,stroke:#45b7d1,color:#fff
    style StoreCache fill:#4ecdc4,stroke:#45b7d1,color:#fff
    style HandleError fill:#ff9999,stroke:#ff0000,color:#fff
```

### Race Condition Prevention

```mermaid
flowchart TD
    A[User Types: "queen"] --> B[Request ID: 001]
    C[User Types: "quee"] --> D[Request ID: 002]
    E[User Types: "que"] --> F[Request ID: 003]
    
    B --> G[API Response 001 arrives]
    D --> H[API Response 002 arrives]
    F --> I[API Response 003 arrives]
    
    G --> J{Current Query: "que"?}
    H --> K{Current Query: "que"?}
    I --> L{Current Query: "que"?}
    
    J -->|No| M[Discard Result]
    K -->|No| N[Discard Result]
    L -->|Yes| O[Display Results]
    
    style B fill:#4ecdc4,stroke:#45b7d1,color:#fff
    style D fill:#4ecdc4,stroke:#45b7d1,color:#fff
    style F fill:#4ecdc4,stroke:#45b7d1,color:#fff
    style M fill:#ff9999,stroke:#ff0000,color:#fff
    style N fill:#ff9999,stroke:#ff0000,color:#fff
    style O fill:#1DB954,stroke:#1ed760,color:#fff
```

## Accessibility Implementation

### ARIA Pattern and Focus Management

```mermaid
graph TD
    subgraph "ARIA Combobox Pattern"
        A[Input: role="combobox"] --> B[aria-controls="results-list"]
        A --> C[aria-expanded="false/true"]
        A --> D[aria-activedescendant="option-id"]
    end
    
    subgraph "Dropdown Results"
        E[Container: role="listbox"] --> F[Option: role="option"]
        F --> G[aria-selected="true/false"]
        F --> H[id="option-1"]
    end
    
    subgraph "Keyboard Navigation"
        I[Arrow Down] --> J[Highlight Next]
        K[Arrow Up] --> L[Highlight Previous]
        M[Enter] --> N[Select Option]
        O[Escape] --> P[Close Dropdown]
    end
    
    A --> E
    D --> H
    
    style A fill:#ffd700,stroke:#ff8c00,color:#333
    style E fill:#4ecdc4,stroke:#45b7d1,color:#fff
    style F fill:#e8f5e8,stroke:#1DB954,color:#333
    style N fill:#1DB954,stroke:#1ed760,color:#fff
```

### Screen Reader Experience

```mermaid
sequenceDiagram
    participant SR as Screen Reader
    participant I as Input Field
    participant D as Dropdown
    participant O as Option
    
    SR->>I: Focus combobox
    I->>SR: "Search for music, combobox collapsed"
    
    Note over I: User types "dancing"
    
    I->>SR: "5 results available"
    SR->>D: Arrow down
    D->>SR: "Dancing Queen by ABBA, 1976"
    
    SR->>O: Arrow down
    O->>SR: "Don't Stop Me Now by Queen, 1978"
    
    SR->>O: Enter key
    O->>SR: "Dancing Queen selected"
    D->>SR: "Combobox collapsed"
    
    style SR fill:#9333ea,stroke:#7c3aed,color:#fff
    style I fill:#ffd700,stroke:#ff8c00,color:#333
    style D fill:#4ecdc4,stroke:#45b7d1,color:#fff
```

## Integration Architecture

### Form Integration and State Management

```mermaid
flowchart TD
    subgraph "Page Level"
        A[Main Page Component] --> B[Music Selection Section]
        C[RSVP Modal] --> D[Form Submission]
    end
    
    subgraph "Component Level"
        B --> E[Dynamic Spotify Combobox]
        E --> F[Search Input]
        E --> G[Results Dropdown]
        E --> H[Hidden Form Field]
    end
    
    subgraph "State Management"
        I[Selected Song State] --> J[Form Value]
        I --> K[Display Value]
        I --> L[Spotify Metadata]
    end
    
    H --> I
    J --> D
    
    style A fill:#f0f9ff,stroke:#45b7d1,color:#333
    style E fill:#ffd700,stroke:#ff8c00,color:#333
    style I fill:#4ecdc4,stroke:#45b7d1,color:#fff
    style D fill:#1DB954,stroke:#1ed760,color:#fff
```

These diagrams illustrate the complete architecture, user flow, performance considerations, and accessibility implementation for the dynamic Spotify combobox, providing a comprehensive visual guide for implementation.