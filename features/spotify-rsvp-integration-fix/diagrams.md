# Spotify RSVP Integration Fix - Diagrams

## Current Broken Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Combobox
    participant H as Hidden Field
    participant F as RSVP Form
    participant D as Database
    
    U->>C: Types search query
    C->>C: Shows dropdown results
    U->>C: Clicks song option
    C--xH: ❌ Selection not saved
    Note over H: Hidden field remains empty
    U->>F: Submits RSVP form
    F->>D: Saves RSVP without song data
    
    style C fill:#ffcccc,stroke:#ff0000
    style H fill:#ffaaaa,stroke:#ff0000
    Note over U,D: Song selection lost!
```

## Expected Working Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Combobox
    participant H as Hidden Field
    participant F as RSVP Form
    participant D as Database
    
    U->>C: Types search query
    C->>C: Shows dropdown results
    U->>C: Clicks song option
    C->>H: ✅ Updates hidden field with JSON
    C->>C: Shows selected song in input
    U->>F: Submits RSVP form
    F->>F: Validates song data
    F->>D: Saves RSVP with complete song metadata
    
    style C fill:#ccffcc,stroke:#00aa00
    style H fill:#90EE90,stroke:#006400
    style D fill:#90EE90,stroke:#006400
    Note over U,D: Complete song data saved!
```

## Component Integration Flow

```mermaid
flowchart TD
    A[User searches song] --> B[SpotifyCombobox shows results]
    B --> C[User clicks song option]
    C --> D{Selection Handler Working?}
    
    D -->|❌ Current| E[No action taken]
    D -->|✅ Fixed| F[Update hidden field]
    
    E --> G[Form submits empty song data]
    F --> H[Update input display]
    F --> I[Store selection state]
    
    H --> J[Form submits with song data]
    I --> J
    
    G --> K[Database: RSVP without song]
    J --> L[Database: RSVP with song metadata]
    
    style D fill:#fff2cc
    style E fill:#ffcccc
    style F fill:#ccffcc
    style K fill:#ffaaaa
    style L fill:#90EE90
```

## Data Flow Architecture

```mermaid
classDiagram
    class SpotifyCombobox {
        +searchInput: HTMLInputElement
        +resultsList: HTMLElement
        +hiddenInput: HTMLInputElement
        +selectTrack(track): void
        -updateHiddenField(songData): void
        -displaySelection(song): void
    }
    
    class SongData {
        +title: string
        +artist: string
        +year: number
        +spotifyUrl: string
        +spotifyId: string
    }
    
    class RSVPForm {
        +name: string
        +attending: boolean
        +favoriteSong: SongData
        +submit(): Promise~void~
    }
    
    class DatabaseRSVP {
        +id: number
        +name: string
        +attending: boolean
        +song_title: string
        +song_artist: string
        +song_year: number
        +song_spotify_url: string
        +created_at: timestamp
    }
    
    SpotifyCombobox --> SongData : creates
    SongData --> RSVPForm : included in
    RSVPForm --> DatabaseRSVP : persists to
    
    style SpotifyCombobox fill:#e6f3ff
    style SongData fill:#f0fff0
    style RSVPForm fill:#fff5ee
    style DatabaseRSVP fill:#f5f5f5
```

## Current vs Fixed State Comparison

```mermaid
graph LR
    subgraph Current["❌ Current Broken State"]
        A1[Search Works]
        A2[Results Show]
        A3[Click Does Nothing]
        A4[Form Submits Empty]
        
        A1 --> A2 --> A3 --> A4
        
        style A3 fill:#ff9999
        style A4 fill:#ff9999
    end
    
    subgraph Fixed["✅ Fixed Working State"]
        B1[Search Works]
        B2[Results Show] 
        B3[Click Updates Field]
        B4[Selection Displayed]
        B5[Form Submits Song Data]
        B6[Database Stores Metadata]
        
        B1 --> B2 --> B3 --> B4 --> B5 --> B6
        
        style B3 fill:#99ff99
        style B4 fill:#99ff99
        style B5 fill:#99ff99
        style B6 fill:#99ff99
    end
```

## Database Schema Enhancement

```mermaid
erDiagram
    RSVP ||--o| SONG : includes
    
    RSVP {
        int id PK
        string name
        boolean attending
        string song_title
        string song_artist
        int song_year
        string song_spotify_url
        timestamp created_at
    }
    
    SONG {
        string title
        string artist
        int year
        string spotify_url
        string spotify_id
    }
```

## Event Handler Fix Flow

```mermaid
flowchart TD
    A[Song Result Clicked] --> B[Event Handler Triggered]
    B --> C[Extract Song Data]
    C --> D[Create JSON Object]
    D --> E{Validation}
    E -->|Valid| F[Update Hidden Field]
    E -->|Invalid| G[Show Error]
    
    F --> H[Update Input Display]
    F --> I[Store Selection State]
    H --> J[User Sees Selection]
    I --> K[Ready for Form Submit]
    
    G --> L[User Tries Again]
    L --> A
    
    style A fill:#e6f3ff
    style F fill:#ccffcc
    style G fill:#ffcccc
    style J fill:#90EE90
    style K fill:#90EE90
```