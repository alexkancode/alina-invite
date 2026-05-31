# Party System - Working Railway Deployment

**Status**: ✅ VERIFIED WORKING  
**URL**: https://party-app-production-d100.up.railway.app  
**Last Verified**: 2026-05-29 21:08 UTC

## Current Working Configuration

### Services (Verified)
```
Project: invites-photo-system
├── party-app (SERVICE: SUCCESS)
│   ├── Status: Deployed and running
│   ├── URL: https://party-app-production-d100.up.railway.app
│   └── Database: Connected to postgres service
├── postgres (SERVICE: RUNNING)
│   ├── Database: party
│   ├── User: postgres
│   └── Internal URL: postgres.railway.internal:5432
└── Legacy Services (preserved)
    ├── alina-birthday-app (old naming)
    └── postgres-db (broken, unused)
```

### Database Connection (Verified Working)
```bash
DATABASE_URL=postgresql://postgres:party123@postgres.railway.internal:5432/party
```

**Migrations**: All 5 migration files applied successfully
- ✅ 0001_create_leaderboard.sql
- ✅ 0002_create_rsvps.sql  
- ✅ 0002_create_user_photos.sql
- ✅ 0003_create_photo_rate_limits.sql
- ✅ 0004_create_photo_usage_stats.sql

### Environment Variables (Current)
```bash
# party-app service
DATABASE_URL=postgresql://postgres:party123@postgres.railway.internal:5432/party
NODE_ENV=production
NODE_VERSION=22
RAILWAY_SERVICE_NAME=party-app

# postgres service  
POSTGRES_DB=party
POSTGRES_USER=postgres
POSTGRES_PASSWORD=party123
```

## Management Commands

### Check System Status
```bash
# Switch to party-app
railway service link party-app

# Verify deployment status
railway service status
# Expected: Status: SUCCESS

# Check recent logs
railway logs --lines 10
# Expected: "Server listening on", "Migrations complete"

# Test database connection
railway run echo "Testing connection"
```

### Deploy Updates
```bash
# From project root
railway service link party-app
npm run build  # Verify local build works
railway up --detach
```

### Database Management
```bash
# Switch to postgres service
railway service link postgres

# Connect to database
railway connect postgres

# Switch back to app
railway service link party-app

# Run migrations manually (if needed)
railway run npm run migrate
```

### Monitor and Debug
```bash
# View logs in real-time
railway logs --follow

# Check environment variables
railway variables list

# Test URL accessibility
curl -I https://party-app-production-d100.up.railway.app
```

## Backup and Recovery

### Create Backup
```bash
railway service link postgres
railway database backup --name "manual-$(date +%Y%m%d-%H%M%S)"
```

### List Backups
```bash
railway database backups
```

### Restore from Backup
```bash
railway database restore [backup-name]
```

## Troubleshooting Guide

### If App Shows 502 Error
1. Check service status: `railway service status`
2. Check logs: `railway logs --lines 20`
3. Verify DATABASE_URL: `railway variables list | grep DATABASE_URL`

### If Database Connection Fails
1. Verify postgres service: `railway service link postgres && railway status`
2. Test connection: `railway connect postgres`
3. Check credentials match in party-app variables

### If Migrations Fail
1. Check migration files exist: `ls migrations/`
2. Run manually: `railway run npm run migrate`
3. Check logs: `railway logs --lines 30`

## System Architecture

### Data Persistence
- **RSVPs**: PostgreSQL table with IP-based uniqueness
- **Photos**: File metadata in PostgreSQL + file storage via Railway volumes
- **Rate Limiting**: IP-based tracking in PostgreSQL
- **Analytics**: Game usage statistics in PostgreSQL

### Security Features
- IP-based RSVP limiting (one per IP)
- Rate limiting for photo uploads
- Content moderation queue for photos
- Production environment isolation

## Verified URLs and Endpoints

**Main App**: https://party-app-production-d100.up.railway.app

**Expected Functionality** (verified working):
- RSVP submission and viewing
- Photo upload with moderation
- Rate limiting and spam protection
- Leaderboard and game statistics

## File Structure
```
repo/
├── migrations/           # Database migrations (all applied)
├── scripts/             # Railway management scripts
├── src/                # Astro app source
├── package.json        # Updated with railway:* commands
└── PARTY_SYSTEM_DOCS.md # This documentation
```

## Emergency Contacts and Resources

**Railway Dashboard**: https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714
**Project ID**: e036295e-4dd3-4b68-8f61-eefca2c61714
**Service ID (party-app)**: 67696074-f389-4fcb-8581-8263f347e66d

## Change Log

### 2026-05-29
- ✅ Created party-app service with proper naming
- ✅ Created postgres service with working database
- ✅ Fixed DATABASE_URL connection between services
- ✅ Verified all migrations working
- ✅ Confirmed public URL accessibility
- ✅ Preserved legacy services for backup

---

**Last Updated**: 2026-05-29 21:08 UTC  
**Verified Status**: All systems operational  
**Next Review**: Before next event deployment