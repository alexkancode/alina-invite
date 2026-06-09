# Guest Status Inline

## Understanding

In the main-page guest list, each entry currently stacks three lines: name, a "Going ✓" or
"Not going" status line, and (when chosen) the song row. The separate status line goes away;
instead a compact mark — a check for going, an x for not going — sits inline beside the name.
Entries become one line shorter; song rows are unaffected.

```mermaid
flowchart LR
    subgraph before [Before - three stacked lines]
        B1[Name] --> B2[Going / Not going line] --> B3[Song row]
    end
    subgraph after [After - two lines]
        A1[Name + check or x] --> A3[Song row]
    end
    before ==> after

    style B2 fill:#7a1f1f,color:#fff
    style A1 fill:#1e5c2e,color:#fff
    style B1 fill:#1a3a5c,color:#fff
    style B3 fill:#1a3a5c,color:#fff
    style A3 fill:#1a3a5c,color:#fff
```

## Outcome

- Name row becomes a flex pair: truncating name plus a non-shrinking status mark, so long
  names ellipsize without ever hiding the mark.
- The mark reuses the existing status color rules: magenta check for going, muted x for
  not going.
- Renderer unit tests and the canary updated to the new structure; e2e selectors unaffected
  (they key on `.guest-entry`, `.guest-name`, and the song classes).
