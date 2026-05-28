# 🚀 Deployment Scripts

Automated Railway deployment scripts that handle interactive prompts and setup.

## 📜 Scripts Overview

### `deploy-noninteractive.sh` - Full Setup & Deploy
**Use this for first-time deployment or major changes**

```bash
./scripts/deploy-noninteractive.sh
```

**What it does:**
- ✅ Checks Railway CLI installation
- ✅ Handles authentication (opens browser if needed)
- ✅ Creates or links Railway project
- ✅ Sets up PostgreSQL database
- ✅ Configures environment variables
- ✅ Deploys application
- ✅ Runs database migrations
- ✅ Shows deployment URL

**Time:** ~5-10 minutes

### `quick-deploy.sh` - Fast Redeploy
**Use this for code updates after initial setup**

```bash
./scripts/quick-deploy.sh
```

**What it does:**
- ✅ Validates Railway connection
- ✅ Shows current status
- ✅ Deploys latest code
- ✅ Shows deployment logs
- ✅ Displays live URL

**Time:** ~1-2 minutes

## 🎯 Usage Flow

### First Deployment
1. **Commit your changes:** `git add . && git commit -m "Ready for deploy"`
2. **Run full deployment:** `./scripts/deploy-noninteractive.sh`
3. **Wait for completion** (script handles everything automatically)
4. **Visit your live site!** 🎉

### Subsequent Updates
1. **Make your changes** (like the calendar description update)
2. **Commit changes:** `git commit -am "Update feature"`  
3. **Quick deploy:** `./scripts/quick-deploy.sh`
4. **Site updates live in ~2 minutes**

## 🛠 Troubleshooting

### Authentication Issues
```bash
railway logout
railway login
```

### Project Linking Issues
```bash
railway unlink
./scripts/deploy-noninteractive.sh  # Will recreate project
```

### Database Connection Issues
```bash
railway variables  # Check DATABASE_URL exists
railway logs       # Check for connection errors
```

### Check Deployment Status
```bash
railway status    # Project overview
railway logs      # Live application logs  
railway domain    # Get deployment URL
railway open      # Open Railway dashboard
```

## ⚡ Quick Commands

```bash
# See all available projects
railway projects

# Check current project status
railway status

# View live logs
railway logs --tail 50

# Get deployment URL
railway domain

# Open Railway dashboard
railway open

# Check environment variables
railway variables
```

## 🎮 What Gets Deployed

Your live deployment includes:
- 🎂 **Alina's Birthday Party Site** - Full interactive invitation
- 🎮 **Disco Ball Game** - Photo matching tile game
- 📝 **RSVP System** - Guest management with PostgreSQL
- 📸 **Photo Upload** - User photo uploads for games
- 📅 **Calendar Integration** - Add to calendar with updated description

## 💡 Pro Tips

- **Always test locally first:** Make sure `npm run dev` works
- **Commit before deploying:** Railway deploys from your git commits
- **Check logs if issues:** `railway logs` shows real-time debugging
- **Use quick-deploy for small changes:** It's much faster for updates