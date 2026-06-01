# 📊 Database Entity Diagrams & Code Interactions

## 🗄️ Database Entity Relationship Diagram

```mermaid
erDiagram
    %% Core Photo System (Existing)
    user_photos {
        string id PK
        timestamp upload_date
        boolean is_approved
        string original_filename
        integer file_size
        string upload_ip
        boolean is_hidden
        text moderation_notes
    }

    leaderboard {
        integer id PK
        string player
        integer score
        integer moves
        integer time_ms
        string difficulty
        timestamp created_at
    }

    rsvps {
        string name PK
        string message
        string attending
        timestamp created_at
        string music_preference
    }

    photo_rate_limits {
        string ip PK
        integer upload_count
        timestamp last_upload
        timestamp window_start
    }

    photo_usage_stats {
        integer id PK
        string photo_id
        string usage_type
        timestamp used_date
        string session_id
    }

    %% New Overlay System
    overlay_images {
        string id PK
        string filename UK
        string display_name
        integer file_size
        timestamp upload_date
        boolean is_active
        real opacity
        string blend_mode
        string created_by
        text description
    }

    overlay_usage_stats {
        integer id PK
        string overlay_id FK
        timestamp used_date
        string photo_id FK
        integer tile_position
        string session_id
    }

    overlay_settings {
        integer id PK
        string setting_key UK
        text setting_value
        text description
        timestamp updated_date
    }

    _migrations {
        string name PK
        timestamp applied_at
    }

    %% Relationships
    overlay_images ||--o{ overlay_usage_stats : "used in"
    user_photos ||--o{ overlay_usage_stats : "overlaid on"
    user_photos ||--o{ photo_usage_stats : "tracked"
```

## 🔄 Data Flow Diagram

```mermaid
flowchart TB
    %% Admin Upload Flow
    A[Admin Upload Interface] --> B[File Validation]
    B --> C[Sharp.js Processing]
    C --> D[overlay_images Table]
    D --> E[File Storage: /public/admin/overlays/]

    %% Settings Management
    F[Admin Settings Panel] --> G[overlay_settings Table]

    %% Disco Ball Generation Flow
    H[Disco Ball Request] --> I[Photo Selection Manager]
    I --> J[user_photos Query]
    J --> K[Overlay Selection Engine]
    K --> L[overlay_images Query]
    L --> M[overlay_settings Query]
    M --> N[Tile Processing Pipeline]
    N --> O[Sharp.js Composite]
    O --> P[Rendered Disco Ball]

    %% Analytics Flow
    N --> Q[overlay_usage_stats Insert]
    P --> R[photo_usage_stats Insert]

    %% Cache & Performance
    O --> S[Processed Tile Cache]
    S --> T[/public/{gameType}/disco-tiles/]

    %% Styling
    classDef database fill:#e1f5fe
    classDef processing fill:#f3e5f5
    classDef storage fill:#e8f5e8
    classDef interface fill:#fff3e0

    class D,G,J,L,M,Q,R database
    class B,C,I,K,N,O processing
    class E,S,T storage
    class A,F,H,P interface
```

## 🏗️ System Architecture & Code Interactions

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[OverlayAdminPanel.astro]
        B[Disco Ball JavaScript]
        C[Photo Upload Interface]
    end

    subgraph "API Layer"
        D[/api/admin/overlays.ts]
        E[/api/photo-upload.ts]
        F[/api/photos/gameType.ts]
    end

    subgraph "Service Layer"
        G[overlayDatabase.ts]
        H[overlayProcessor.ts]
        I[photoDatabase.ts]
        J[discoBallOverlayIntegration.ts]
        K[gameIntegration.ts]
        L[photoSelectionManager.ts]
    end

    subgraph "Database Layer"
        M[(overlay_images)]
        N[(overlay_settings)]
        O[(overlay_usage_stats)]
        P[(user_photos)]
        Q[(photo_usage_stats)]
        R[(leaderboard)]
    end

    subgraph "File System"
        S[/public/admin/overlays/]
        T[/public/{gameType}/photos/]
        U[/public/{gameType}/disco-tiles/]
    end

    %% Frontend to API connections
    A --> D
    B --> F
    C --> E

    %% API to Service connections
    D --> G
    D --> H
    E --> I
    F --> K
    F --> L

    %% Service to Service connections
    J --> G
    J --> H
    J --> K
    J --> L
    H --> G
    K --> I

    %% Service to Database connections
    G --> M
    G --> N
    G --> O
    H --> O
    I --> P
    K --> Q
    L --> P

    %% Service to File System connections
    H --> S
    H --> U
    I --> T
    K --> T

    %% Styling
    classDef frontend fill:#e3f2fd
    classDef api fill:#f1f8e9
    classDef service fill:#fff3e0
    classDef database fill:#fce4ec
    classDef storage fill:#e8f5e8

    class A,B,C frontend
    class D,E,F api
    class G,H,I,J,K,L service
    class M,N,O,P,Q,R database
    class S,T,U storage
```

## 🎯 Database Query Patterns

```mermaid
sequenceDiagram
    participant Admin as Admin Interface
    participant API as Overlay API
    participant DB as Database
    participant Proc as Overlay Processor
    participant FS as File System

    %% Overlay Upload Flow
    Note over Admin,FS: Overlay Upload Process
    Admin->>API: POST /api/admin/overlays
    API->>FS: Save temp file
    API->>Proc: Process overlay image
    Proc->>FS: Save to /public/admin/overlays/
    API->>DB: INSERT overlay_images
    API->>Admin: Success response

    %% Disco Ball Generation Flow
    Note over Admin,FS: Disco Ball Generation
    Admin->>API: Request disco ball
    API->>DB: SELECT FROM overlay_settings
    API->>DB: SELECT FROM user_photos WHERE approved=true
    API->>DB: SELECT FROM overlay_images WHERE active=true
    
    loop For each disco ball tile
        API->>Proc: Process tile with random overlay
        Proc->>FS: Load base image
        Proc->>FS: Load overlay image
        Proc->>FS: Save composite tile
        API->>DB: INSERT overlay_usage_stats
    end
    
    API->>Admin: Rendered disco ball tiles

    %% Analytics Query Flow
    Note over Admin,DB: Analytics Dashboard
    Admin->>API: GET /api/admin/overlays?action=stats
    API->>DB: SELECT usage stats with JOINs
    API->>Admin: Usage analytics
```

## 📈 Database Performance Optimization

```mermaid
graph LR
    subgraph "Indexed Queries"
        A[overlay_images.is_active] --> A1[Fast active overlay lookup]
        B[overlay_usage_stats.session_id] --> B1[Session-based analytics]
        C[overlay_usage_stats.overlay_id] --> C1[Per-overlay statistics]
        D[user_photos.is_approved] --> D1[Approved photo selection]
    end

    subgraph "Query Patterns"
        E[Random Overlay Selection] --> F["ORDER BY RANDOM() LIMIT 1"]
        G[Usage Analytics] --> H["COUNT(*) GROUP BY overlay_id"]
        I[Settings Lookup] --> J["Key-Value pairs with caching"]
    end

    subgraph "Connection Pooling"
        K[Database Pool] --> L[Max 5 connections]
        L --> M[30s idle timeout]
        M --> N[Shared across all services]
    end
```

## 🔄 Data Lifecycle Management

```mermaid
stateDiagram-v2
    [*] --> Uploaded: Admin uploads overlay
    Uploaded --> Processing: Sharp.js optimization
    Processing --> Stored: Saved to filesystem + DB
    Stored --> Active: Admin activates overlay
    Active --> InUse: Selected for disco ball tile
    InUse --> Tracked: Usage recorded in stats
    Active --> Inactive: Admin deactivates
    Inactive --> Active: Admin reactivates
    Stored --> Deleted: Admin removes overlay
    Deleted --> [*]: File + DB records removed

    note right of Processing
        - Resize to 256x256
        - Convert to PNG
        - Optimize compression
    end note

    note right of InUse
        - Random selection based on probability
        - Blend mode application
        - Opacity and rotation applied
    end note

    note right of Tracked
        - Session tracking
        - Tile position recorded
        - Performance metrics collected
    end note
```

## 🎨 Code Component Interaction Map

```mermaid
graph TD
    subgraph "Database Tables"
        OI[overlay_images]
        OS[overlay_settings]
        OUS[overlay_usage_stats]
        UP[user_photos]
    end

    subgraph "Core Services"
        OD[overlayDatabase.ts]
        OP[overlayProcessor.ts]
        DBI[discoBallOverlayIntegration.ts]
        GI[gameIntegration.ts]
    end

    subgraph "API Endpoints"
        AO[/api/admin/overlays]
        AP[/api/photos/gameType]
    end

    subgraph "Frontend Components"
        OAP[OverlayAdminPanel.astro]
        DBJ[Disco Ball JS]
    end

    %% Database to Service connections
    OI --> OD
    OS --> OD
    OUS --> OD
    UP --> GI

    %% Service to Service connections
    OD --> OP
    OP --> DBI
    GI --> DBI

    %% Service to API connections
    OD --> AO
    DBI --> AP

    %% API to Frontend connections
    AO --> OAP
    AP --> DBJ

    %% Data flow annotations
    OI -.->|"Overlay metadata"| OP
    OS -.->|"Configuration"| DBI
    OUS -.->|"Analytics"| OAP
    UP -.->|"Photo data"| DBI

    %% Styling
    classDef dbTable fill:#ffebee
    classDef service fill:#e8f5e8
    classDef api fill:#e3f2fd
    classDef frontend fill:#fff3e0

    class OI,OS,OUS,UP dbTable
    class OD,OP,DBI,GI service
    class AO,AP api
    class OAP,DBJ frontend
```

## 📊 Database Schema Details

### Table Relationships & Constraints

```mermaid
erDiagram
    overlay_images {
        string id PK "32-char hex"
        string filename "UUID-based unique name"
        real opacity "0.1 to 1.0 range"
        string blend_mode "enum: overlay,multiply,screen,etc"
        boolean is_active "default: true"
    }

    overlay_usage_stats {
        integer id PK "auto-increment"
        string overlay_id FK "references overlay_images.id"
        string photo_id FK "references user_photos.id (nullable)"
        integer tile_position "0-based disco ball position"
        string session_id "page load session tracking"
    }

    overlay_settings {
        string setting_key UK "unique configuration key"
        text setting_value "JSON or string value"
        text description "human-readable explanation"
    }

    user_photos {
        string id PK "photo identifier"
        boolean is_approved "moderation status"
        boolean is_hidden "soft delete flag"
    }

    overlay_images ||--o{ overlay_usage_stats : "CASCADE DELETE"
    user_photos ||--o{ overlay_usage_stats : "SET NULL ON DELETE"
```

These diagrams provide a complete visual representation of how the overlay system integrates with your existing database schema and codebase, showing the flow from admin interface through processing pipeline to the final rendered disco ball with overlays.