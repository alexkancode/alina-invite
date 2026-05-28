# Local Development Setup

How to run, stop, and restart the app on your machine.

---

## Prerequisites (New Machine)

1. **Node.js 22+**
   ```bash
   # macOS with Homebrew
   brew install node@22

   # Or use nvm
   nvm install 22
   nvm use 22
   ```

2. **Docker Desktop** (for Postgres)
   ```bash
   # macOS
   brew install --cask docker
   # Then open Docker Desktop and let it start
   ```

3. **Playwright browsers** (for E2E tests)
   ```bash
   npx playwright install chromium
   ```

---

## First-Time Setup

```bash
# Clone and enter the repo
cd /path/to/repo

# Install dependencies
npm install

# Start the database
docker compose -f docker-compose.dev.yml up -d

# Set the database URL
export DATABASE_URL="postgresql://postgres:dev@localhost:5432/party"

# Run migrations (creates tables)
npm run migrate

# Start the dev server
npm run dev
```

The app is now running at **http://localhost:4321**

---

## Day-to-Day Commands

### Start Everything

```bash
# 1. Start database (if not already running)
docker compose -f docker-compose.dev.yml up -d

# 2. Set env var (add to your shell profile to skip this step)
export DATABASE_URL="postgresql://postgres:dev@localhost:5432/party"

# 3. Start dev server (hot reload)
npm run dev
```

### Stop Everything

```bash
# Stop the dev server
# Press Ctrl+C in the terminal running `npm run dev`

# Stop the database
docker compose -f docker-compose.dev.yml down

# Stop database AND delete all data
docker compose -f docker-compose.dev.yml down -v
```

### Restart Fresh

```bash
# Kill any running dev server
pkill -f "astro dev" 2>/dev/null

# Restart database with clean data
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d

# Re-run migrations
export DATABASE_URL="postgresql://postgres:dev@localhost:5432/party"
npm run migrate

# Start dev server
npm run dev
```

### Full Rebuild (after pulling changes)

```bash
# Stop everything
pkill -f "astro dev" 2>/dev/null
docker compose -f docker-compose.dev.yml down

# Reinstall deps (in case package.json changed)
npm install

# Restart database
docker compose -f docker-compose.dev.yml up -d
export DATABASE_URL="postgresql://postgres:dev@localhost:5432/party"

# Run any new migrations
npm run migrate

# Build and start
npm run build
npm run dev
```

---

## Running Tests

```bash
# Make sure dev server is running first, then:

# API tests only
npm run test:api

# E2E browser tests only
npm run test:e2e

# All tests
npm run test
```

---

## Production Build (Local Preview)

```bash
# Build the production bundle
npm run build

# Run it (same as production)
export DATABASE_URL="postgresql://postgres:dev@localhost:5432/party"
npm run start
```

The production server runs at **http://localhost:4321**

---

## Docker Build (Full Production Image)

```bash
# Build the Docker image
docker build -t party-app .

# Run it alongside the database
docker compose -f docker-compose.dev.yml up -d
docker run --rm -p 4321:4321 \
  -e DATABASE_URL="postgresql://postgres:dev@host.docker.internal:5432/party" \
  party-app
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | Postgres connection string |
| `IP_SALT` | No | `default-salt` | Salt for hashing IP addresses |
| `HOST` | No | `localhost` | Server bind address |
| `PORT` | No | `4321` | Server port |

---

## Troubleshooting

**Port 4321 already in use**
```bash
lsof -ti:4321 | xargs kill -9
```

**Database connection refused**
```bash
# Check if Postgres is running
docker compose -f docker-compose.dev.yml ps

# If not, start it
docker compose -f docker-compose.dev.yml up -d
```

**Migrations fail**
```bash
# Check database is reachable
docker compose -f docker-compose.dev.yml logs db

# Nuke and recreate
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
npm run migrate
```

**Stale CSS / page not updating**
```bash
# Hard refresh in browser
# macOS: Cmd+Shift+R
# Or rebuild:
pkill -f "astro dev" 2>/dev/null
npm run build
npm run dev
```

---

## Further Reading

For architecture details, deployment pipeline, database design, and production infrastructure, see:
[research/deployment/architecture-and-deployment.md](research/deployment/architecture-and-deployment.md)
