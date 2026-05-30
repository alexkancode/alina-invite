# 🚀 Deployment Guide

This project includes automated deployment scripts for Railway hosting platform.

## Quick Start

### 1. Prepare for Deployment
```bash
# Ensure Railway CLI is installed and you're logged in
railway login
```

### 2. Deploy in 3 Steps
```bash
# Step 1: Set up Railway project
./scripts/railway-setup.sh

# Step 2: Deploy your application  
./scripts/railway-simple-deploy.sh

# Step 3: Add PostgreSQL database
./scripts/railway-add-db.sh
```

### 3. Verify Deployment
```bash
railway open    # Opens deployment dashboard
railway logs    # Shows application logs
```

## 📁 **Deployment Scripts**

All deployment automation is located in the `/scripts` directory:

- **[`/scripts/README.md`](./scripts/README.md)** - Complete deployment documentation
- **Railway Scripts** - Automated setup, deploy, and database configuration
- **Troubleshooting Guide** - Solutions for common deployment issues

## 🎯 **What Gets Deployed**

This deployment includes the complete **Week 2 Photo Upload System**:

### Core Features
- ✅ **Photo Upload API** - Mobile-optimized upload endpoint
- ✅ **Intelligent Photo Selection** - Mixes user uploads with original photos  
- ✅ **Multiple Selection Strategies** - balanced, prefer-user, original-only
- ✅ **Game Integration** - Photos appear in disco ball and tile matching games
- ✅ **Rate Limiting** - Exponential backoff protection against abuse

### Database Schema  
- ✅ **User Photos** - Upload metadata and approval workflow
- ✅ **Rate Limiting** - IP-based upload frequency control
- ✅ **Usage Statistics** - Photo selection analytics

### Performance Features
- ✅ **Sharp Image Processing** - Automated resizing and optimization
- ✅ **Multiple Photo Sizes** - thumbs (disco), minigame (tiles), original
- ✅ **Concurrent Request Handling** - Tested for high-load scenarios

## 🌐 **Production Environment**

### Auto-Configured Variables
- `NODE_ENV=production`
- `DATABASE_URL` (PostgreSQL connection string)  
- `NODE_VERSION=22`

### API Endpoints
- `POST /api/photo-upload` - Upload photos for approval
- `POST /api/rsvp` - Event RSVP functionality  
- `GET /api/leaderboard` - Game scoring system

## 📊 **Monitoring**

### Check Deployment Status
```bash
railway status          # Project and service status
railway service status  # Deployment details
railway variables list  # Environment configuration
```

### View Logs
```bash
railway logs            # Application logs
railway logs --tail     # Follow log stream
```

## 🔧 **Development**

### Local Development
```bash
npm run dev             # Start development server
npm run test:api        # Run API test suite
npm run migrate         # Run database migrations
```

### Production Build
```bash
npm run build           # Build for production
npm run preview         # Preview production build
```

## 📋 **Project Documentation**

- **[`PROJECT_SUMMARY.md`](./PROJECT_SUMMARY.md)** - Complete Week 2 development summary
- **[`RSVP_BUG_REPORT.md`](./RSVP_BUG_REPORT.md)** - Known legacy issue documentation
- **[`/scripts/README.md`](./scripts/README.md)** - Detailed deployment guide

---

**Ready to deploy your Week 2 photo upload system? Start with `./scripts/railway-simple-deploy.sh`** 🚀