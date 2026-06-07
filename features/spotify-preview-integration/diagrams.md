# Spotify Preview Integration - Technical Diagrams

## User Journey Flow

```mermaid
flowchart TD
    A[🔍 User Searches for Song] --> B[🎵 Search Results Display]
    B --> C[👆 User Selects Song]
    C --> D[🎹 Music Widget Shows Selected Song]
    D --> E[🎧 User Clicks 'Open with Spotify']
    
    E --> F{📱 Device Detection}
    
    F -->|Mobile Device| G{📲 Spotify App Installed?}
    F -->|Desktop Device| H[🌐 Open Spotify Web Player]
    
    G -->|Yes| I[🚀 Launch Spotify App]
    G -->|No/Unknown| J[⏰ 500ms Timeout]
    
    J --> K[🌐 Fallback to Spotify Web Player]
    
    I --> L{✅ App Opened Successfully?}
    K --> M[✅ Web Player Loaded]
    H --> M
    
    L -->|Yes| N[🎵 Song Playing in Spotify App]
    L -->|No| O[⚠️ Fallback to YouTube Search]
    
    M --> P[🎵 Song Playing in Web Browser]
    O --> Q[📺 YouTube Search Results]
    
    style A fill:#ff6b9d,stroke:#c44569,color:#fff
    style N fill:#1db954,stroke:#1ed760,color:#fff
    style P fill:#1db954,stroke:#1ed760,color:#fff
    style Q fill:#ff0000,stroke:#cc0000,color:#fff
```

## System Architecture

```mermaid
graph TB
    subgraph "🎮 Frontend Layer"
        A[MusicSearchWidget.astro] --> B[SpotifyPreview Component]
        B --> C[spotifyLinkingService.ts]
    end
    
    subgraph "🔧 Service Layer" 
        C --> D[musicSearchService.ts]
        D --> E[SpotifyClient]
        D --> F[YouTubePlayerService]
    end
    
    subgraph "🌐 API Layer"
        G[/api/music-search] --> D
        E --> H[Spotify Web API]
        F --> I[YouTube Data API]
    end
    
    subgraph "💾 Data Flow"
        J[User Search Query] --> G
        G --> K[Enhanced Song Data]
        K --> L[Spotify Metadata]
        K --> M[YouTube Fallback]
    end
    
    subgraph "📱 Platform Integration"
        N[Deep Link Handler] --> O[spotify:// URIs]
        N --> P[open.spotify.com URLs]
        Q[Web Playback SDK] --> P
    end
    
    C --> N
    B --> Q
    
    style A fill:#ff6b9d,stroke:#c44569,color:#fff
    style B fill:#1db954,stroke:#1ed760,color:#fff
    style E fill:#1db954,stroke:#1ed760,color:#fff
    style H fill:#1db954,stroke:#1ed760,color:#fff
    style O fill:#1db954,stroke:#1ed760,color:#fff
    style P fill:#1db954,stroke:#1ed760,color:#fff
```

## API Data Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant W as 🎮 Widget
    participant API as 🌐 API
    participant MS as 🔧 MusicService  
    participant SC as 🎵 SpotifyClient
    participant SA as 🎤 Spotify API
    
    U->>W: Types search query
    W->>API: GET /api/music-search?q=bohemian&includeSpotify=true
    API->>MS: search70sSongs(query, options)
    
    MS->>SC: searchTracks(query)
    SC->>SA: GET /v1/search?type=track&q=query
    SA-->>SC: Track metadata + spotifyId
    SC-->>MS: Enhanced song data
    
    MS-->>API: SearchResult with Spotify metadata
    API-->>W: JSON response with spotifyUri & spotifyUrl
    
    W->>U: Display "Open with Spotify" button
    U->>W: Clicks Spotify button
    
    alt Mobile Device
        W->>W: Attempt spotify:track:{id} deep-link
        W->>W: Wait 500ms for app response
        alt App Opens
            Note over U: 🎵 Song plays in Spotify app
        else Timeout/Failure
            W->>W: Fallback to open.spotify.com/{id}
            Note over U: 🎵 Song plays in web player
        end
    else Desktop Device  
        W->>W: Open open.spotify.com/{id}
        Note over U: 🎵 Song plays in web player
    end
    
    rect rgb(29, 185, 84, 0.1)
        Note over U,SA: Primary Spotify Integration Flow
    end
    
    rect rgb(255, 0, 0, 0.1)
        Note over W,U: Fallback: If all Spotify options fail,<br/>revert to YouTube search URL
    end
```

## Component Interaction Architecture

```mermaid
graph LR
    subgraph "🎨 UI Components"
        A[MusicSearchWidget]
        B[SpotifyPreviewButton]
        C[LoadingSpinner]
        D[ErrorFallback]
    end
    
    subgraph "🔧 Core Services"
        E[spotifyLinkingService]
        F[deviceDetectionService]  
        G[musicSearchService]
    end
    
    subgraph "📡 External APIs"
        H[Spotify Web API]
        I[Spotify Web Playback SDK]
        J[YouTube Fallback]
    end
    
    A --> B
    B --> C
    B --> D
    B --> E
    
    E --> F
    E --> G
    E --> H
    E --> I
    
    E -.->|Fallback| J
    D -.->|Ultimate Fallback| J
    
    style A fill:#ff6b9d,stroke:#c44569,color:#fff
    style B fill:#1db954,stroke:#1ed760,color:#fff
    style E fill:#1db954,stroke:#1ed760,color:#fff
    style H fill:#1db954,stroke:#1ed760,color:#fff
    style I fill:#1db954,stroke:#1ed760,color:#fff
```

## Deep-Link Decision Tree

```mermaid
flowchart TD
    A[🎧 User Clicks 'Open with Spotify'] --> B{📱 Platform Detection}
    
    B -->|📱 Mobile| C{🔍 User Agent Analysis}
    B -->|🖥️ Desktop| D[🌐 Direct to Spotify Web Player]
    
    C -->|📱 iOS| E[🍎 iOS Deep-Link Strategy]
    C -->|🤖 Android| F[🤖 Android Deep-Link Strategy] 
    C -->|❓ Unknown| G[🌐 Safe Web Fallback]
    
    E --> H[🚀 Try: spotify:track:{id}]
    F --> I[🚀 Try: spotify:track:{id}]
    
    H --> J[⏰ 1000ms Timeout]
    I --> K[⏰ 500ms Timeout]
    
    J --> L{✅ App Responded?}
    K --> M{✅ App Responded?}
    
    L -->|✅ Yes| N[🎵 Success: Song in Spotify App]
    L -->|❌ No| O[🌐 Fallback: open.spotify.com]
    
    M -->|✅ Yes| P[🎵 Success: Song in Spotify App] 
    M -->|❌ No| Q[🌐 Fallback: open.spotify.com]
    
    D --> R[🌐 open.spotify.com/{id}]
    G --> R
    O --> R
    Q --> R
    
    R --> S{🌐 Web Player Loads?}
    S -->|✅ Yes| T[🎵 Success: Song in Web Player]
    S -->|❌ No| U[⚠️ Ultimate Fallback: YouTube Search]
    
    style A fill:#ff6b9d,stroke:#c44569,color:#fff
    style N fill:#1db954,stroke:#1ed760,color:#fff
    style P fill:#1db954,stroke:#1ed760,color:#fff
    style T fill:#1db954,stroke:#1ed760,color:#fff
    style U fill:#ff0000,stroke:#cc0000,color:#fff
```

## Error Handling & Fallback Strategy

```mermaid
flowchart TD
    A[🎧 Spotify Integration Request] --> B[🔧 Primary: Spotify Deep-Link]
    
    B --> C{🎯 Success?}
    C -->|✅ Yes| D[🎵 Song Playing Successfully]
    C -->|❌ No| E[🌐 Secondary: Spotify Web Player]
    
    E --> F{🌐 Web Player Success?}
    F -->|✅ Yes| G[🎵 Song Playing in Browser]
    F -->|❌ No| H[📺 Tertiary: YouTube Search]
    
    H --> I{📺 YouTube Available?}
    I -->|✅ Yes| J[📺 YouTube Search Results]
    I -->|❌ No| K[⚠️ Error: No Preview Available]
    
    subgraph "🚨 Error Scenarios"
        L[🔌 Network Error]
        M[🔑 Auth Error] 
        N[🚫 API Rate Limit]
        O[📱 App Not Installed]
        P[🌐 CORS Issues]
    end
    
    L --> E
    M --> E
    N --> H
    O --> E
    P --> H
    
    style D fill:#1db954,stroke:#1ed760,color:#fff
    style G fill:#1db954,stroke:#1ed760,color:#fff
    style J fill:#ff0000,stroke:#cc0000,color:#fff
    style K fill:#ff6b9d,stroke:#c44569,color:#fff
```

## Performance & Caching Strategy

```mermaid
flowchart LR
    subgraph "💾 Cache Layers"
        A[🔄 Browser Cache<br/>Spotify URLs]
        B[⚡ Memory Cache<br/>Track Metadata]
        C[💿 Local Storage<br/>User Preferences]
    end
    
    subgraph "🎯 Performance Targets"
        D[⚡ Deep-Link: < 500ms]
        E[🌐 Web Player: < 1s]
        F[🔍 Search: < 2s]
        G[📺 Fallback: < 3s]
    end
    
    subgraph "📊 Monitoring Points"
        H[📈 Success Rate Tracking]
        I[⏱️ Response Time Metrics] 
        J[🚨 Error Rate Alerts]
        K[📱 Platform Analytics]
    end
    
    A --> D
    B --> E
    C --> F
    
    D --> H
    E --> I
    F --> J
    G --> K
    
    style A fill:#87ceeb,stroke:#4682b4,color:#000
    style B fill:#87ceeb,stroke:#4682b4,color:#000
    style C fill:#87ceeb,stroke:#4682b4,color:#000
    style H fill:#ffd700,stroke:#ffa500,color:#000
    style I fill:#ffd700,stroke:#ffa500,color:#000
    style J fill:#ffd700,stroke:#ffa500,color:#000
    style K fill:#ffd700,stroke:#ffa500,color:#000
```