# 🚂 Railway Deployment Guide for Party Photo System

This guide covers deploying your party photo upload and RSVP management system to Railway with proper data persistence.

## 🎯 What This Setup Provides

✅ **Production & Staging Environments**  
✅ **PostgreSQL Database with Backups**  
✅ **Persistent File Storage (20GB)**  
✅ **Automatic Database Migrations**  
✅ **RSVP Data Protection**  
✅ **Rate Limiting State Persistence**  
✅ **Photo Moderation Queue Management**  
✅ **CI/CD with GitHub Actions**  

## 🚀 Quick Start

### 1. Initial Railway Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway auth

# Deploy everything
npm run railway:deploy
```

### 2. Verify Deployment

```bash
# Check status of both environments
npm run railway:status

# Open your app
railway open
```

## 📋 Available Scripts

### Deployment Scripts

```bash
npm run railway:deploy      # Complete setup & deployment
npm run railway:status      # Check app status
npm run railway:dev         # Development helpers
npm run railway:backup      # Database backup management
```

### Manual Commands

```bash
# Environment switching
railway environment use production
railway environment use staging

# Database operations
railway database             # View database info
railway run npm run migrate  # Run migrations manually
railway logs --follow        # Monitor real-time logs
```

## 🗄️ Database Management

### Automatic Migrations

Your app automatically runs migrations on startup:
- ✅ `0001_create_leaderboard.sql` - Event leaderboard
- ✅ `0002_create_rsvps.sql` - Guest RSVPs
- ✅ `0002_create_user_photos.sql` - Photo uploads
- ✅ `0003_create_photo_rate_limits.sql` - Anti-spam protection
- ✅ `0004_create_photo_usage_stats.sql` - Analytics

### Backup Management

```bash
# Create manual backup
./scripts/railway-backup.sh backup production

# Pre-event backup
./scripts/railway-backup.sh pre-event

# List available backups
./scripts/railway-backup.sh list production

# Restore from backup
./scripts/railway-backup.sh restore production backup-name
```

## 🌍 Environment Configuration

### Production Environment
- **Database**: PostgreSQL with automatic backups
- **File Storage**: 20GB persistent volume
- **Rate Limiting**: Enabled
- **Content Moderation**: Enabled
- **Max Upload Size**: 10MB

### Staging Environment
- **Database**: PostgreSQL (separate instance)
- **File Storage**: 20GB persistent volume  
- **Rate Limiting**: Disabled (for testing)
- **Content Moderation**: Disabled (for testing)
- **Max Upload Size**: 5MB

## 🔧 CI/CD Pipeline

### GitHub Actions Workflow

1. **Pull Requests**: Deploy to staging environment
2. **Main Branch**: Deploy to production with backup

### Environment Variables Required

Set these in your GitHub repository settings:

```bash
# Repository Secrets
RAILWAY_TOKEN=your_railway_token

# Repository Variables  
RAILWAY_SERVICE_ID=your_service_id
```

## 📁 File Storage

Photos are stored in persistent volumes:
- **Mount Path**: `/app/uploads`
- **Size**: 20GB per environment
- **Persistence**: Survives deployments and restarts

## 🚨 Data Persistence Features

### RSVP Protection
- One RSVP per IP address (prevents duplicates)
- Guest names and messages preserved
- Attendance tracking across deployments

### Rate Limiting
- IP-based request limiting
- Exponential backoff for abuse prevention
- Persistent block lists

### Photo Moderation
- Upload queue persists across deployments
- Approval status maintained
- File storage separate from app container

### Analytics
- Game usage statistics
- Photo usage tracking
- Historical data preservation

## 🛠️ Development Workflow

### Local Development
```bash
# Start local environment (unchanged)
docker-compose -f docker-compose.dev.yml up -d
npm run dev
```

### Testing Against Staging
```bash
# Deploy to staging
railway environment use staging
railway up

# Test your changes
railway open

# Check logs
railway logs --follow
```

### Production Deployment
```bash
# Automatic via GitHub Actions on main branch push
git push origin main

# Or manual deployment
railway environment use production
npm run railway:backup backup production  # Safety backup
railway up
```

## 🚑 Troubleshooting

### Database Connection Issues
```bash
# Test database connectivity
./scripts/railway-dev.sh test-db production

# Check database status
railway environment use production
railway database
```

### Migration Problems
```bash
# Run migrations manually
railway environment use production
railway run npm run migrate

# Check migration status
railway run "npx tsx -e 'import pg from \"pg\"; const client = new pg.Client({connectionString: process.env.DATABASE_URL}); await client.connect(); const result = await client.query(\"SELECT * FROM _migrations ORDER BY applied_at DESC LIMIT 5\"); console.log(result.rows); await client.end();'"
```

### File Upload Issues
```bash
# Check volume status
railway environment use production
railway volume list

# Verify mount path
railway run "ls -la /app/uploads"
```

### Deployment Failures
```bash
# Check recent logs
railway logs --lines 50

# Verify environment variables
railway variables list

# Check service status
railway status
```

## 📊 Monitoring

### Key Metrics to Watch
- **Database connections**: Monitor for connection pool exhaustion
- **File storage usage**: 20GB limit per environment
- **Response times**: Photo upload and RSVP submission speed
- **Error rates**: Failed uploads or database errors

### Log Analysis
```bash
# Monitor real-time logs
railway logs --follow

# Search for specific issues
railway logs | grep -i error
railway logs | grep -i "database"
railway logs | grep -i "upload"
```

## 🔒 Security Considerations

### Production Security
- Database connections use SSL
- Environment variables encrypted at rest
- File uploads validated and size-limited
- IP-based rate limiting active

### Backup Security
- Automatic daily backups (Railway managed)
- Manual backups before deployments
- Point-in-time recovery available

## 📞 Support

### Railway Issues
- **Dashboard**: [railway.app](https://railway.app)
- **Documentation**: [docs.railway.app](https://docs.railway.app)
- **Community**: [Railway Discord](https://discord.gg/railway)

### App-Specific Issues
```bash
# Check app status
npm run railway:status

# View detailed logs
railway logs --lines 100

# Test database connectivity
./scripts/railway-dev.sh test-db production
```

---

## 🎉 You're Ready!

Your party photo upload system is now deployed with enterprise-grade data persistence. Your guests can safely RSVP and upload photos knowing their data is protected across deployments.

**Next Steps:**
1. Test RSVP functionality in staging
2. Upload test photos to verify moderation queue  
3. Monitor rate limiting with multiple requests
4. Create a pre-event backup before your party

Happy hosting! 🎊