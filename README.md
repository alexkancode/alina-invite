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
