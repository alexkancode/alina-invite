# Test Suite Stabilization — Diagrams

## Why ten integration tests fail at once: the singleton mock gap

```mermaid
flowchart LR
    subgraph importTime [Import time, before any test]
        A[spotifyMusicService.ts loads] --> B[new SpotifyClient]
        B --> C[singleton holds client A]
    end
    subgraph testTime [Each test's beforeEach]
        D[re-mock SpotifyClient constructor] --> E[spy client B created]
    end
    C --> F[route uses client A]
    E -.never reached.-> F
    F --> G[songs: empty, spies: 0 calls<br/>10 assertions fail]

    style A fill:#1a3a5c,color:#fff
    style B fill:#1a3a5c,color:#fff
    style C fill:#5c4a1a,color:#fff
    style D fill:#5c4a1a,color:#fff
    style E fill:#7a1f1f,color:#fff
    style F fill:#5c4a1a,color:#fff
    style G fill:#7a1f1f,color:#fff
```

Fix: test the route against a mocked `spotifyMusicService` module (its real dependency), and
test service behavior on fresh `SpotifyMusicService` instances created after the client mock
is wired.

## Why a passing test fails in the full run: the fake-timer cascade

```mermaid
sequenceDiagram
    participant T1 as concurrent test
    participant V as vitest globals
    participant T2 as recovery test

    T1->>V: useFakeTimers()
    T1->>T1: expects 5 fetch calls, real is 3
    Note over T1: assertion throws —<br/>useRealTimers() never runs
    T1--xV: fake timers + queued debounce leak
    T2->>V: useFakeTimers() again
    T2->>V: runAllTimersAsync()
    V->>T2: stale debounce callbacks fire
    Note over T2: 14 fetch calls instead of 3 — fails

    rect rgb(30, 92, 46)
        Note over T1,T2: fix: afterEach restores real timers and fetch,<br/>and the 5-call expectation becomes 3 (no retry layer exists)
    end
```

## The honest failure: full rebuild per arrow key

```mermaid
flowchart TD
    subgraph before [Today: 413ms for 20 keypresses]
        K1[ArrowDown] --> S1[setState highlightedIndex]
        S1 --> R1[innerHTML wiped]
        R1 --> R2[20 rows recreated]
        R2 --> R3[dropdown position recalculated]
    end
    subgraph after [Target: highlight moves in place]
        K2[ArrowDown] --> S2[setState highlightedIndex]
        S2 --> Q{results and isOpen<br/>unchanged?}
        Q -->|yes| H[toggle highlight class on 2 rows]
        Q -->|no| RB[full rebuild as before]
    end

    style R1 fill:#7a1f1f,color:#fff
    style R2 fill:#7a1f1f,color:#fff
    style R3 fill:#7a1f1f,color:#fff
    style H fill:#1e5c2e,color:#fff
    style Q fill:#5c4a1a,color:#fff
    style RB fill:#1a3a5c,color:#fff
    style K1 fill:#1a3a5c,color:#fff
    style K2 fill:#1a3a5c,color:#fff
    style S1 fill:#1a3a5c,color:#fff
    style S2 fill:#1a3a5c,color:#fff
```
