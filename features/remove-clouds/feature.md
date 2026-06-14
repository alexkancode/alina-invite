# remove-clouds

## Verbatim request (2026-06-14)

> hmm, can we delete the existing clouds entirely?
> [chosen: Yes, remove all clouds]

## Confirmed understanding

Remove the entire sunset-cloud system from the yait hero scene. The sky band
becomes clear: the sun discs, sea, gulls, headline, and envelope all stay. This
deletes the cloud geometry generator, the cloud layout data, the cloud markup,
the cloud gradient that nothing else uses, the cloud CSS (drift / bob / breathe /
rim-glow pulse and their reduced-motion entries), and every cloud test.

## Scope boundary

The `index.astro` corner clouds (`.cloud-bubble` / `#clouds-container`) belong to
the separate live birthday RSVP page (guarded by the `favoriteSong` regression
test). They are NOT part of the yait hero scene and are out of scope - untouched.

## Mechanism

```mermaid
flowchart LR
    subgraph BEFORE["hero scene - before"]
        S1["sky + sun"]:::keep
        C["6 clouds<br/>buildCloud + CLOUDS + cloud-grad<br/>drift/bob/breathe + rim-glow"]:::drop
        G["gulls / sea / headline / envelope"]:::keep
    end
    subgraph AFTER["hero scene - after"]
        S2["sky + sun"]:::keep
        G2["gulls / sea / headline / envelope"]:::keep
    end
    BEFORE -->|"delete cloud system"| AFTER
    classDef keep fill:#2A9D8F,stroke:#264653,color:#F4E8D1
    classDef drop fill:#E76F51,stroke:#264653,color:#F4E8D1
```

```mermaid
flowchart TD
    R["remove-clouds"]:::root
    R --> H["heroScene.ts<br/>drop CloudShape/Spec/Layout,<br/>CLOUD_* consts, buildCloud, CLOUDS<br/>(keep createSeededRandom - buildFryCrowd needs it)"]:::src
    R --> B["HeroBay.astro<br/>drop import of buildCloud/CLOUDS,<br/>yait-cloud-grad def, CLOUDS.map block"]:::src
    R --> C["yait.css<br/>drop cloud-drift/bob/breathe/glow-breathe,<br/>.cloud/.cloud-inner/.cloud--N/.cloud-glow,<br/>cloud entries in reduced-motion group"]:::src
    R --> T["tests<br/>delete clouds.test.ts; strip cloud asserts from<br/>home-page integration, e2e, sail canary;<br/>add absence guards"]:::test
    classDef root fill:#264653,stroke:#264653,color:#F4E8D1
    classDef src fill:#F4A259,stroke:#264653,color:#264653
    classDef test fill:#F4E8D1,stroke:#264653,color:#264653
```

## Validation

To validate remove-clouds I can screenshot the sky band and confirm there are no
cloud silhouettes (clear gradient sky with the sun, gulls, sea, headline, and
envelope intact), CURL the served `/home` and grep that there is no `class="cloud`,
no `cloud-glow`, and no `yait-cloud-grad`, and confirm the birthday `/` page still
serves its RSVP form (corner clouds untouched). The test suite asserts the cloud
markup and keyframes are gone while the sun, headline, and envelope remain.

## Out of scope

The sun, sea, gulls, headline reveal, envelope, whip clip, and the separate
`index.astro` corner clouds. Only the hero-scene cloud system is removed.
