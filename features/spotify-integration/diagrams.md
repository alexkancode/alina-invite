# Spotify Integration Architecture Diagrams

## Current vs New Architecture

```mermaid
graph TB
    subgraph "CURRENT STATE"
        A[User Search Query] --> B[70s Music Database]
        B --> C[Static Results]
        C --> D[Limited Metadata]
    end
    
    subgraph "NEW STATE"
        E[User Search Query] --> F[Resilient Spotify Client]
        F --> G{API Available?}
        G -->|Yes| H[Spotify Web API]
        G -->|No| I[Cached Results]
        H --> J[Enhanced Results]
        I --> J
        J --> K[Rich Metadata + Previews]
    end
    
    classDef current fill:#ffcccc,stroke:#ff0000,color:#000
    classDef new fill:#ccffcc,stroke:#00ff00,color:#000
    classDef resilient fill:#ffffcc,stroke:#ffaa00,color:#000
    classDef api fill:#ccccff,stroke:#0000ff,color:#000
    
    class A,B,C,D current
    class E,F,J,K new
    class G,I resilient
    class H api
```

## Resilient Client Flow with Error Handling

```mermaid
flowchart TD
    START[Search Request] --> AUTH{Valid Token?}
    AUTH -->|No| REFRESH[Refresh Token]
    AUTH -->|Yes| SEARCH[Make API Call]
    REFRESH --> REAUTH{Auth Success?}
    REAUTH -->|Yes| SEARCH
    REAUTH -->|No| EMPTY[Return Empty Results]
    
    SEARCH --> RESPONSE{Response OK?}
    RESPONSE -->|200 OK| CACHE[Cache Results]
    RESPONSE -->|429 Rate Limited| WAIT[Wait Retry-After]
    RESPONSE -->|4xx/5xx Error| RETRY{Attempts < 3?}
    
    WAIT --> SEARCH
    RETRY -->|Yes| BACKOFF[Exponential Backoff]
    RETRY -->|No| FALLBACK[Check Cache]
    
    BACKOFF --> SEARCH
    FALLBACK --> CACHED{Cache Hit?}
    CACHED -->|Yes| RETURN[Return Cached]
    CACHED -->|No| EMPTY
    
    CACHE --> SUCCESS[Return Enhanced Results]
    RETURN --> SUCCESS
    
    classDef start fill:#e1f5fe,stroke:#0277bd,color:#000
    classDef auth fill:#fff3e0,stroke:#ef6c00,color:#000
    classDef search fill:#f3e5f5,stroke:#7b1fa2,color:#000
    classDef error fill:#ffebee,stroke:#c62828,color:#000
    classDef success fill:#e8f5e8,stroke:#2e7d32,color:#000
    classDef cache fill:#fff8e1,stroke:#f57c00,color:#000
    
    class START start
    class AUTH,REFRESH,REAUTH auth
    class SEARCH,RESPONSE search
    class WAIT,RETRY,BACKOFF,FALLBACK,CACHED error
    class SUCCESS,CACHE,RETURN success
    class EMPTY cache
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant App as Spotify Client
    participant Auth as Auth Service
    participant Spotify as Spotify API
    participant Cache as Token Cache
    
    App->>Auth: Request Access Token
    Auth->>Cache: Check Token Cache
    Cache-->>Auth: Token Expired/Missing
    Auth->>Spotify: Client Credentials Request
    Note over Auth,Spotify: POST /api/token<br/>grant_type=client_credentials
    Spotify-->>Auth: Access Token + Expires
    Auth->>Cache: Store Token with TTL
    Auth-->>App: Valid Access Token
    
    App->>Spotify: Search Request with Token
    alt Token Valid
        Spotify-->>App: Search Results
    else Token Expired
        Spotify-->>App: 401 Unauthorized
        App->>Auth: Refresh Token (Auto)
        Auth->>Spotify: New Client Credentials Request
        Spotify-->>Auth: New Access Token
        Auth->>Cache: Update Token Cache
        Auth-->>App: New Valid Token
        App->>Spotify: Retry Search Request
        Spotify-->>App: Search Results
    end
    
    classDef app fill:#e3f2fd,stroke:#1976d2,color:#000
    classDef auth fill:#fff3e0,stroke:#ef6c00,color:#000
    classDef spotify fill:#e8f5e8,stroke:#2e7d32,color:#000
    classDef cache fill:#fff8e1,stroke:#f57c00,color:#000
    
    class App app
    class Auth auth
    class Spotify spotify
    class Cache cache
```

## Caching Strategy

```mermaid
graph TB
    REQUEST[Search Request] --> MEMORY{Memory Cache?}
    MEMORY -->|Hit| RETURN[Return Cached Results]
    MEMORY -->|Miss| API[Call Spotify API]
    
    API --> RESPONSE{Response?}
    RESPONSE -->|Success| STORE[Store in Memory Cache]
    RESPONSE -->|Error| EMPTY[Return Empty Results]
    
    STORE --> TTL[Set 5-minute TTL]
    TTL --> RETURN
    
    subgraph "Memory Cache Structure"
        MC[Map<string, CacheEntry>]
        CE[CacheEntry: {results, expires}]
        MC --> CE
    end
    
    subgraph "Cache Policies"
        P1[TTL: 5 minutes for search results]
        P2[TTL: 1 hour for access tokens]
        P3[Size: No hard limit - hobby app]
        P4[Eviction: TTL-based only]
    end
    
    classDef request fill:#e1f5fe,stroke:#0277bd,color:#000
    classDef cache fill:#fff8e1,stroke:#f57c00,color:#000
    classDef api fill:#e8f5e8,stroke:#2e7d32,color:#000
    classDef policy fill:#f3e5f5,stroke:#7b1fa2,color:#000
    classDef structure fill:#fff3e0,stroke:#ef6c00,color:#000
    
    class REQUEST request
    class MEMORY,STORE,TTL,RETURN cache
    class API,RESPONSE api
    class P1,P2,P3,P4 policy
    class MC,CE structure
```

## Component Architecture

```mermaid
graph TB
    subgraph "API Layer"
        ENDPOINT[/api/music-search]
    end
    
    subgraph "Service Layer"
        CLIENT[SpotifyClient]
        AUTH[AuthService]
        CACHE[CacheService]
    end
    
    subgraph "Infrastructure"
        MEMORY[Memory Cache]
        ENV[Environment Config]
    end
    
    subgraph "External"
        SPOTIFY[Spotify Web API]
    end
    
    ENDPOINT --> CLIENT
    CLIENT --> AUTH
    CLIENT --> CACHE
    CLIENT --> SPOTIFY
    
    AUTH --> ENV
    AUTH --> MEMORY
    CACHE --> MEMORY
    
    classDef api fill:#e3f2fd,stroke:#1976d2,color:#000
    classDef service fill:#fff3e0,stroke:#ef6c00,color:#000
    classDef infra fill:#f3e5f5,stroke:#7b1fa2,color:#000
    classDef external fill:#e8f5e8,stroke:#2e7d32,color:#000
    
    class ENDPOINT api
    class CLIENT,AUTH,CACHE service
    class MEMORY,ENV infra
    class SPOTIFY external
```

## Error Scenarios and Recovery

```mermaid
stateDiagram-v2
    [*] --> Searching
    Searching --> Success : API responds 200
    Searching --> RateLimited : API responds 429
    Searching --> ServerError : API responds 5xx
    Searching --> ClientError : API responds 4xx
    Searching --> NetworkError : Network timeout
    
    RateLimited --> Waiting : Read retry-after header
    Waiting --> Searching : After delay
    
    ServerError --> Retrying : Attempt < 3
    NetworkError --> Retrying : Attempt < 3
    Retrying --> BackingOff : Exponential delay
    BackingOff --> Searching : After backoff
    
    ServerError --> CheckingCache : Max retries exceeded
    NetworkError --> CheckingCache : Max retries exceeded
    ClientError --> CheckingCache : Permanent error
    
    CheckingCache --> CacheHit : Results found
    CheckingCache --> EmptyResults : No cache
    
    Success --> [*]
    CacheHit --> [*]
    EmptyResults --> [*]
    
    classDef normal fill:#e8f5e8,stroke:#2e7d32,color:#000
    classDef error fill:#ffebee,stroke:#c62828,color:#000
    classDef recovery fill:#fff8e1,stroke:#f57c00,color:#000
    classDef fallback fill:#f3e5f5,stroke:#7b1fa2,color:#000
    
    class Searching,Success normal
    class RateLimited,ServerError,ClientError,NetworkError error
    class Waiting,Retrying,BackingOff recovery
    class CheckingCache,CacheHit,EmptyResults fallback
```

## Data Flow and Enhancement

```mermaid
flowchart LR
    INPUT[User Query: "Beatles"] --> SPOTIFY[Spotify Search API]
    
    subgraph "Raw Spotify Response"
        RAW[Track Object]
        FIELDS["• name\n• artists[]\n• album{}\n• preview_url\n• popularity\n• id"]
    end
    
    subgraph "Enhanced Output"
        ENHANCED[Enhanced Track]
        OUTPUT["• title\n• artist\n• album\n• year\n• preview_url\n• spotify_id\n• popularity\n• image_url"]
    end
    
    SPOTIFY --> RAW
    RAW --> FIELDS
    FIELDS --> TRANSFORM[Transform Function]
    TRANSFORM --> ENHANCED
    ENHANCED --> OUTPUT
    
    classDef input fill:#e1f5fe,stroke:#0277bd,color:#000
    classDef spotify fill:#e8f5e8,stroke:#2e7d32,color:#000
    classDef raw fill:#fff3e0,stroke:#ef6c00,color:#000
    classDef enhanced fill:#f3e5f5,stroke:#7b1fa2,color:#000
    classDef transform fill:#fff8e1,stroke:#f57c00,color:#000
    
    class INPUT input
    class SPOTIFY spotify
    class RAW,FIELDS raw
    class ENHANCED,OUTPUT enhanced
    class TRANSFORM transform
```