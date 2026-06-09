# Combobox Selected State — Diagrams

## The four defects at a glance

Red marks where each defect breaks the chain today; green is the working part of the path.

```mermaid
flowchart TD
    A[Guest types query] --> B[Dropdown shows results]
    B --> C{Click speed}
    C -->|fast click| D[selectTrack runs]
    C -->|held >100ms| X1[Blur timer destroys list<br/>click lands on nothing]
    D --> E[Hidden field gets JSON]
    D --> X2[Input shows plain text only<br/>no card, no clear button]
    E --> F{Submit button enables?}
    F --> X3[No: RadioNodeList.value is empty<br/>change detection blind]
    E --> G[fetch POST application/json]
    G --> X4[API calls request.formData<br/>HTTP 500]

    style A fill:#1a3a5c,color:#fff
    style B fill:#1a3a5c,color:#fff
    style D fill:#1e5c2e,color:#fff
    style E fill:#1e5c2e,color:#fff
    style X1 fill:#7a1f1f,color:#fff
    style X2 fill:#7a1f1f,color:#fff
    style X3 fill:#7a1f1f,color:#fff
    style X4 fill:#7a1f1f,color:#fff
    style C fill:#5c4a1a,color:#fff
    style F fill:#5c4a1a,color:#fff
    style G fill:#1a3a5c,color:#fff
```

## Target component state machine

```mermaid
stateDiagram-v2
    classDef editable fill:#1a3a5c,color:#fff
    classDef open fill:#5c4a1a,color:#fff
    classDef selected fill:#1e5c2e,color:#fff

    [*] --> Editable
    Editable --> Searching: type query
    Searching --> Open: results arrive
    Open --> Selected: click or Enter on result
    Open --> Editable: Escape or blur
    Selected --> Editable: click x clear button
    Selected --> [*]: submit form

    class Editable, Searching editable
    class Open open
    class Selected selected

    note right of Selected
        input hidden
        rendered item card shown
        x button visible
        hidden field holds track JSON
        change event fired
    end note
```

## Target selection sequence (fixed path)

```mermaid
sequenceDiagram
    autonumber
    participant U as Guest
    participant LI as Result item
    participant CB as SpotifyCombobox
    participant F as RSVP form (index.astro)
    participant API as /api/rsvp

    U->>LI: mousedown (preventDefault: input keeps focus, no blur race)
    U->>LI: click
    LI->>CB: selectTrack(track)
    CB->>CB: render selected card + x button, hide input
    CB->>F: hidden input change event (bubbles)
    F->>F: getCurrentFormData sees single favoriteSong control
    F->>F: submit button enabled
    U->>F: submit
    F->>API: POST application/json { favoriteSong: {…} }
    API->>API: request.json() — matching contract
    API-->>F: 200 { success, entry, calendarUrl }

    rect rgb(30, 92, 46)
        note over CB,F: x clear: selectTrack(null) → card removed,<br/>input restored + focused, hidden field emptied,<br/>change event re-fires detection
    end
```
