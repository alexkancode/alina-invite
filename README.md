# 🎮 Invites Photo Upload System

A comprehensive photo upload and game integration system built with Astro, featuring intelligent photo selection for disco ball and tile matching games.

## ✨ **Week 2 Features**
- **📸 Photo Upload API** - Mobile-optimized upload with Sharp processing
- **🎯 Intelligent Photo Selection** - Mixes user uploads with original photos
- **🎲 Game Integration** - Photos appear in disco ball and tile matching games
- **⚡ Performance Optimized** - Handles concurrent requests with <100ms selection times

## 🚀 **Quick Deploy**
```bash
./scripts/railway-simple-deploy.sh
```
**→ See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide**

## Outstanding TODO (as of 2026-06-15)

Known open items after the CI-pipeline cleanup. The CI test gate (`test-api` +
`test-e2e`) is green and consolidated into one workflow
(`.github/workflows/deploy.yml`); the only thing blocking automated production deploys
is item 1.

1. **Add the `RAILWAY_TOKEN` secret to finish CI auto-deploy (primary).**
   - Why: the `deploy-production` job runs
     `railway up --service ... --environment production --detach` but fails with
     `Invalid RAILWAY_TOKEN` because the GitHub Actions secret is empty. The
     `RAILWAY_SERVICE_ID` repo variable is already set. `RAILWAY_TOKEN` is NOT stored as
     an env var anywhere today - the local `~/.railway/config.json` is a rotating CLI
     login session (account OAuth), not a CI-suitable project token.
   - What: create a Railway **Project Token** (dashboard -> project
     `invites-photo-system` -> Settings -> Tokens, scoped to the `production`
     environment), then `gh secret set RAILWAY_TOKEN --body "<token>"`. Re-run the latest
     workflow (or push to `main`) to validate `deploy-production` goes green.
   - Meanwhile: `npm run party:deploy` is the working manual deploy path.

2. **Triage the quarantined test backlog (see [QUARANTINE.md](./QUARANTINE.md)).**
   - Why: ~33 test files / ~115 tests fail for pre-existing reasons (deleted source,
     missing Spotify/storage credentials, malformed test harnesses, stale assertions),
     unrelated to the deployable app. They are excluded from the gate so it can be green
     and meaningful, and tracked there rather than deleted.
   - What: work through QUARANTINE.md suite by suite, fix the root cause, and remove the
     entry from the `QUARANTINED` array in `vitest.config.ts` or the `testMatch` in
     `playwright.config.ts`.

3. **Add an "un-quarantine" guard.**
   - Why: a quarantined suite can silently start passing again and stay excluded, so the
     backlog never shrinks on its own.
   - What: a CI step that runs the quarantined suites and fails if any now pass,
     prompting removal from quarantine.

4. **Mobile headline reveal-edge tracking is approximate.**
   - Why: the reveal sweep is a SMIL clip translate using the desktop `REVEAL_EDGE`
     values; SMIL cannot be media-queried, so on mobile the wave edge tracks the boat
     ~15% less precisely. It still fully reveals; this is cosmetic only.
   - What (optional): drive the sweep responsively (JS-set values per viewport) for
     pixel-accurate mobile tracking.

## 📁 **Project Structure**

```text
/
├── src/
│   ├── lib/                    # Core photo system libraries
│   │   ├── photoSelectionManager.ts    # Intelligent photo selection
│   │   ├── gameIntegration.ts          # Game photo integration  
│   │   ├── photoProcessor.ts           # Sharp image processing
│   │   ├── photoDatabase.ts            # Database operations
│   │   └── rateLimiter.ts             # Upload rate limiting
│   ├── pages/api/              # API endpoints
│   │   ├── photo-upload.ts            # Photo upload endpoint
│   │   ├── rsvp.ts                    # RSVP functionality
│   │   └── leaderboard.ts             # Game scoring
│   └── pages/
│       └── index.astro         # Main invitation page
├── tests/                      # Comprehensive test suite (49+ tests)
├── migrations/                 # Database schema
├── scripts/                    # Railway deployment automation
└── public/
    └── alina/                  # Original and user photos
        ├── thumbs/             # Disco ball sized images  
        └── minigame/           # Tile game sized images
```

## 📡 **API Endpoints**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/photo-upload` | POST | Upload photos for approval |
| `/api/rsvp` | POST/GET | Event RSVP management |
| `/api/leaderboard` | GET | Game scoring system |

## 🧞 **Commands**

All commands are run from the root of the project:

| Command | Action |
| :------ | :----- |
| `npm install` | Install dependencies |
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build production site |
| `npm run test:api` | Run comprehensive API test suite (49+ tests) |
| `npm run migrate` | Run database migrations |
| `./scripts/railway-simple-deploy.sh` | Deploy to Railway |

## 📚 **Documentation**

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide with Railway scripts
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Week 2 development summary and achievements  
- **[RSVP_BUG_REPORT.md](./RSVP_BUG_REPORT.md)** - Known legacy issues documentation
- **[/scripts/README.md](./scripts/README.md)** - Detailed deployment automation guide

## 🎯 **Features by Week**

### ✅ **Week 1 - COMPLETED**
- Mobile upload interface with Sharp processing
- Rate limiting with exponential backoff  
- Database schema with approval workflow

### ✅ **Week 2 - COMPLETED** 
- Intelligent photo selection algorithms
- Game integration (disco ball + tile matching)
- Performance optimization and comprehensive testing

### 📋 **Week 3 - PLANNED**
- Admin approval interface
- Batch photo operations
- Content moderation automation

---

**Built with Astro, Sharp, PostgreSQL, and comprehensive testing** 🚀
