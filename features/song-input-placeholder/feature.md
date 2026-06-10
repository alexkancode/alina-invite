# Song Input Placeholder

## Understanding

Three changes to the song field in the RSVP modal:

1. Placeholder text becomes "Search Spotify for a fun song for the party playlist".
2. The placeholder gets readable contrast — today it renders at 50% opacity silver on the
   dark input, which is hard to read.
3. The visible label above the input ("Disco song for the party playlist (optional)") is
   removed; the input gains an `aria-label` with the same wording so screen readers keep an
   accessible name. The flag-disabled fallback select keeps its label (a select has no
   placeholder to carry the meaning).

```mermaid
flowchart LR
    subgraph before [Before]
        L[visible label line] --> I1[input with faint generic placeholder]
    end
    subgraph after [After]
        I2[input with readable inviting placeholder<br/>aria-label for screen readers]
    end
    before ==> after

    style L fill:#7a1f1f,color:#fff
    style I1 fill:#5c4a1a,color:#fff
    style I2 fill:#1e5c2e,color:#fff
```

## Outcome

- The modal song field is one visual line: a clearly readable invitation to search.
- Placeholder color moves from a half-opacity utility class to a dedicated style rule on
  the search input at warm-cream with comfortable contrast.
- Accessibility preserved via `aria-label`; the accessibility suite's label-association
  test is updated to assert the aria-label accessible name.
- Deployed to production once verified locally.
