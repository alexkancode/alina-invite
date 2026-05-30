# Architecture & Deployment Guide

## Overview

This is an **Astro-based full-stack photo sharing and game integration system** built for an interactive birthday celebration. It combines a modern web framework with PostgreSQL to enable users to upload photos that automatically integrate into two interactive games: a disco ball visualization and a tile-matching memory game.

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | 22+ |
| **Web Framework** | Astro | 6.3.7 |
| **Server Adapter** | @astrojs/node | 10.1.1 |
| **Styling** | Tailwind CSS | 4.3.0 |
| **Database** | PostgreSQL | 17 |
| **Image Processing** | Sharp | 0.34.5 |
| **Testing (API)** | Vitest | 3.2.4 |
| **Testing (E2E)** | Playwright | 1.60.0 |

## Application Architecture

### Core Components

#### **Frontend Layer**
- **Main Page** (`src/pages/index.astro`): Interactive invitation with disco ball hero, RSVP modal, and game launcher
- **Components**: Reusable Astro components (e.g., PhotoUpload.astro)
- **Styling**: Tailwind CSS v4 with custom animations and design system

#### **API Layer**
REST endpoints built as Astro server routes:

| Endpoint | Method | Purpose | Rate Limited |
|----------|--------|---------|--------------|
| `/api/photo-upload` | POST | Upload photos for approval | Yes (exponential backoff) |
| `/api/rsvp` | POST/GET | RSVP management & guest list | No |
| `/api/leaderboard` | POST/GET | Game scoring | No (cached 30s) |
| `/api/health` | GET | Health check | No |

#### **Business Logic Layer** (`src/lib/`)
- **photoProcessor.ts**: Sharp-based image processing (3 sizes: original, thumb, minigame)
- **photoDatabase.ts**: PostgreSQL operations for photo metadata
- **photoSelectionManager.ts**: Intelligent photo selection with multiple strategies
- **gameIntegration.ts**: Game configuration generators (DiscoBallManager, TileGameManager)
- **rateLimiter.ts**: Exponential backoff rate limiting with IP tracking

## Database Design

### Schema Overview

```sql
-- Game scores with difficulty-based rankings
CREATE TABLE leaderboard (
    id BIGSERIAL PRIMARY KEY,
    player TEXT NOT NULL CHECK (length(player) BETWEEN 1 AND 30),
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10000),
    moves INTEGER NOT NULL CHECK (moves > 0),
    time_ms INTEGER NOT NULL CHECK (time_ms > 0),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_leaderboard_difficulty_score ON leaderboard (difficulty, score DESC);

-- Event RSVPs with IP-based deduplication
CREATE TABLE rsvps (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 50),
    message TEXT DEFAULT '',
    attending TEXT NOT NULL CHECK (attending IN ('yes', 'no')),
    ip_hash TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-uploaded photo metadata with approval workflow
CREATE TABLE user_photos (
    id VARCHAR(32) PRIMARY KEY, -- hex from randomBytes(16)
    upload_date TIMESTAMP DEFAULT NOW(),
    is_approved BOOLEAN DEFAULT FALSE,
    original_filename VARCHAR(255),
    file_size INTEGER,
    upload_ip INET,
    is_hidden BOOLEAN DEFAULT FALSE,
    moderation_notes TEXT
);

-- IP-based rate limiting with exponential backoff
CREATE TABLE photo_rate_limits (
    ip INET PRIMARY KEY,
    attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMP DEFAULT NOW(),
    blocked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics for photo usage in games
CREATE TABLE photo_usage_stats (
    id SERIAL PRIMARY KEY,
    game_type VARCHAR(50) NOT NULL,
    user_photo_count INTEGER DEFAULT 0,
    original_photo_count INTEGER DEFAULT 0,
    usage_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Key Features & Application Flows

### 1. Photo Upload System
- POST `/api/photo-upload` endpoint for user-submitted photos
- Sharp-based processing into 3 sizes: original (1200px), thumbs (128px), minigame (256px)
- Exponential backoff rate limiting per IP address
- Database storage with approval workflow (pending → approved → hidden)

### 2. Game Integration
- **PhotoSelectionManager**: Intelligent mixing of user-uploaded vs. original photos
- **Selection Strategies**: balanced, prefer-user, original-only, random
- **DiscoBallManager**: Generates disco ball config with 70% photo tiles, 30% iridescent
- **TileGameManager**: Generates tile-matching game sets (easy: 6 pairs, medium: 8 pairs, hard: 12 pairs)

### 3. Event RSVP System
- POST/GET `/api/rsvp` endpoint with name uniqueness checking
- IP-hash based duplicate prevention
- Profanity filtering (profanease library)

### 4. Leaderboard/Game Scoring
- Score calculation: moveEfficiency (60%) + timeEfficiency (40%)
- Difficulty-based top 10 rankings
- Cached responses (30 seconds)

## Deployment Pipeline

### Development Environment

```bash
# Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# Install and run
npm install
export DATABASE_URL="postgresql://postgres:dev@localhost:5432/party"
npm run migrate
npm run dev  # http://localhost:4321
```

### Production Deployment (Railway)

**Multi-stage Dockerfile**:
1. **Build Stage**: Node 22-slim → npm ci → npm run build
2. **Runtime Stage**: Copy dist + node_modules → expose 4321
3. **Startup**: Auto-migrations → start server

**CI/CD Pipeline** (GitHub Actions):
- Runs API tests (Vitest) + E2E tests (Playwright)
- Deploys to Railway on main branch merge
- Auto-provisions PostgreSQL database

**Deployment Commands**:
```bash
./scripts/railway-setup.sh          # Create Railway project
./scripts/railway-simple-deploy.sh  # Deploy application  
./scripts/railway-add-db.sh         # Provision PostgreSQL
```

### Environment Variables

| Variable | Required | Development | Production |
|----------|----------|-------------|------------|
| `DATABASE_URL` | Yes | `postgresql://postgres:dev@localhost:5432/party` | Set by Railway |
| `IP_SALT` | No | `default-salt` | Should be set to unique value |
| `HOST` | No | `localhost` | `0.0.0.0` |
| `PORT` | No | `4321` | `4321` |

## Production Infrastructure

### Scalability Considerations

1. **Database Connection Pool**: Max 5 concurrent connections, 30s idle timeout
2. **Image Processing**: Sharp runs in-process (suitable for <50 concurrent uploads)
3. **Static Assets**: Currently stored in ephemeral Railway filesystem ⚠️ **Action Required**: Migrate to S3 for persistence
4. **Rate Limiting**: Per-IP tracking scales with database capacity

### Security Measures

- **Input Validation**: File size (10MB), type checking, filename sanitization
- **Rate Limiting**: Exponential backoff (3 free uploads, then delays: 30s, 1m, 2m, 4m, 8m...)
- **Profanity Filtering**: RSVP content checked via profanease library
- **SQL Injection Prevention**: Parameterized queries throughout

## Monitoring & Operations

### Health Checks
- `GET /api/health` endpoint for monitoring
- Railway dashboard provides CPU, memory, network metrics

### Common Troubleshooting

| Issue | Solution |
|-------|----------|
| Migrations fail | Check DATABASE_URL, ensure PostgreSQL running |
| Photos not in games | Verify photos are approved (`is_approved = true`) |
| Rate limits too strict | Clear `photo_rate_limits` entry for IP |
| Slow leaderboard | Check database indexes on `(difficulty, score DESC)` |

### Monitoring Queries

```sql
-- Photo upload stats
SELECT COUNT(*) total, 
       COUNT(*) FILTER (WHERE is_approved) approved,
       COUNT(*) FILTER (WHERE is_hidden) hidden
FROM user_photos;

-- Current rate limit status
SELECT COUNT(*) total_ips,
       COUNT(*) FILTER (WHERE blocked_until > NOW()) currently_blocked
FROM photo_rate_limits;

-- Top leaderboard
SELECT player, score FROM leaderboard 
WHERE difficulty = 'medium' 
ORDER BY score DESC LIMIT 10;
```

## Future Improvements

1. **Asset Storage**: Migrate from ephemeral filesystem to S3/object storage
2. **Caching Layer**: Add Redis for leaderboard caching and photo selection
3. **Admin Dashboard**: Build UI for photo moderation workflow
4. **Load Testing**: Stress test image processing and database limits

---

For day-to-day development commands and setup, see [LOCAL_SETUP.md](../../LOCAL_SETUP.md).