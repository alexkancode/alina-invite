# Party System - Quick Reference

**🚀 Live URL**: https://party-app-production-d100.up.railway.app

## Essential Commands

### Deploy Changes
```bash
npm run build && railway service link party-app && railway up --detach
```

### Check Status
```bash
railway service link party-app && railway service status
```

### View Logs
```bash
railway service link party-app && railway logs --follow
```

### Database Backup
```bash
railway service link postgres && railway database backup --name "backup-$(date +%Y%m%d)"
```

### Emergency Reset
```bash
railway service link party-app
railway variables set DATABASE_URL='postgresql://postgres:party123@postgres.railway.internal:5432/party'
railway up --detach
```

## Working Resource Names
- **App Service**: `party-app` 
- **Database Service**: `postgres`
- **Database Name**: `party`
- **Project**: `invites-photo-system`

## Quick Health Check
1. `railway service link party-app && railway service status` → Should show "SUCCESS"
2. `railway logs --lines 5` → Should show "Server listening" and "Migrations complete"
3. Visit URL → Should load party system

## If Something Breaks
1. Check logs: `railway logs --lines 20`
2. Verify DATABASE_URL: `railway variables list | grep DATABASE`
3. If empty, run: `railway variables set DATABASE_URL='postgresql://postgres:party123@postgres.railway.internal:5432/party'`
4. Redeploy: `railway up --detach`

**Documentation**: See `PARTY_SYSTEM_DOCS.md` for full details