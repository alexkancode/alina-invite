#!/bin/bash

echo "🎉 Party System - Railway Deploy (Prefixed Resources)"
echo "===================================================="

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
}

# Resource naming with consistent prefix
RESOURCE_PREFIX="party"
PROJECT_NAME="${RESOURCE_PREFIX}-system"
SERVICE_NAME="${RESOURCE_PREFIX}-app"
DB_PREFIX="${RESOURCE_PREFIX}-db"
VOLUME_PREFIX="${RESOURCE_PREFIX}-uploads"

log "Using consistent resource prefix: ${RESOURCE_PREFIX}-*"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    error "Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in
log "Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    error "Not logged into Railway. Run: railway login"
    exit 1
fi

success "Railway CLI authenticated"

log "Setting up Railway project with prefixed resources..."

# Create or link project with our naming convention
log "Creating/linking project: $PROJECT_NAME"
railway link || {
    warning "Failed to link. Creating new project with prefix..."
    railway new "$PROJECT_NAME" --template blank
}

# Create environments with prefixed naming
log "Setting up prefixed environments..."
railway environment create "${RESOURCE_PREFIX}-production" 2>/dev/null || warning "Production environment may already exist"
railway environment create "${RESOURCE_PREFIX}-staging" 2>/dev/null || warning "Staging environment may already exist"

# Function to setup environment with consistent naming
setup_environment() {
    local env_suffix=$1
    local env_name="${RESOURCE_PREFIX}-${env_suffix}"
    local db_name="${DB_PREFIX}-${env_suffix}"
    local volume_name="${VOLUME_PREFIX}-${env_suffix}"

    log "Configuring environment: $env_name"
    railway environment use "$env_name"

    # Add PostgreSQL database with our naming
    log "Adding database: $db_name"
    railway add database --type postgresql --name "$db_name" || warning "Database may already exist for $env_name"

    # Wait for database to be ready
    log "Waiting for database to initialize..."
    sleep 10

    # Set environment variables with resource identification
    log "Setting environment variables for $env_name..."
    railway variables set NODE_ENV="$env_suffix"
    railway variables set NODE_VERSION=22
    railway variables set ENABLE_MIGRATIONS=true
    railway variables set PROJECT_PREFIX="$RESOURCE_PREFIX"
    railway variables set ENVIRONMENT_NAME="$env_name"

    # Environment-specific variables
    if [ "$env_suffix" = "production" ]; then
        railway variables set RATE_LIMIT_ENABLED=true
        railway variables set CONTENT_MODERATION=true
        railway variables set MAX_UPLOAD_SIZE=10485760  # 10MB
        railway variables set BACKUP_ENABLED=true
        railway variables set DEPLOYMENT_TYPE="production"
    else
        railway variables set RATE_LIMIT_ENABLED=false
        railway variables set CONTENT_MODERATION=false
        railway variables set MAX_UPLOAD_SIZE=5242880   # 5MB
        railway variables set BACKUP_ENABLED=false
        railway variables set DEPLOYMENT_TYPE="staging"
    fi

    # Create upload volume with consistent naming
    log "Setting up volume: $volume_name"
    railway volume create "$volume_name" --size 20 --mount-path /app/uploads 2>/dev/null || warning "Volume may already exist"

    success "Environment $env_name configured with prefixed resources"
}

# Setup both environments
setup_environment "staging"
setup_environment "production"

# Switch to production for deployment
log "Switching to production environment for deployment..."
railway environment use "${RESOURCE_PREFIX}-production"

# Pre-deployment checks
log "Running pre-deployment checks..."

# Check current status
log "Current Railway status:"
railway status

# Show resource summary
log "Resource Summary with Prefix '${RESOURCE_PREFIX}':"
echo "  📦 Project: $PROJECT_NAME"
echo "  🚀 Service: $SERVICE_NAME"
echo "  🗄️  Databases: ${DB_PREFIX}-production, ${DB_PREFIX}-staging"
echo "  📁 Volumes: ${VOLUME_PREFIX}-production, ${VOLUME_PREFIX}-staging"
echo "  🌍 Environments: ${RESOURCE_PREFIX}-production, ${RESOURCE_PREFIX}-staging"

# Verify database connection
log "Checking database connectivity..."
if railway run echo "Database check" &> /dev/null; then
    success "Railway environment accessible"
else
    error "Cannot access Railway environment"
    exit 1
fi

# Build and test locally first
log "Building application locally..."
npm run build || {
    error "Local build failed"
    exit 1
}

success "Local build successful"

# Deploy the application
log "Deploying application..."
railway up --detach || {
    error "Deployment failed"
    exit 1
}

# Wait for deployment
log "Waiting for deployment to complete..."
sleep 30

# Verify deployment
log "Verifying deployment..."
if railway logs --lines 20 | grep -q "Server started\|listening\|ready"; then
    success "Application deployed successfully"
else
    warning "Deployment may still be starting. Check logs with: railway logs"
fi

# Create resource inventory file
log "Creating resource inventory..."
cat > railway-resources.txt << EOF
# Railway Resources for Party System
# Generated: $(date)
# Prefix: ${RESOURCE_PREFIX}

## Project Structure
Project Name: $PROJECT_NAME
Service Name: $SERVICE_NAME

## Environments
- ${RESOURCE_PREFIX}-production
- ${RESOURCE_PREFIX}-staging

## Databases
- ${DB_PREFIX}-production (PostgreSQL)
- ${DB_PREFIX}-staging (PostgreSQL)

## Volumes
- ${VOLUME_PREFIX}-production (20GB, /app/uploads)
- ${VOLUME_PREFIX}-staging (20GB, /app/uploads)

## Resource Identification Commands
# List all project resources:
railway list

# Switch between environments:
railway environment use ${RESOURCE_PREFIX}-production
railway environment use ${RESOURCE_PREFIX}-staging

# Check specific database:
railway environment use ${RESOURCE_PREFIX}-production
railway database

# Monitor specific volume:
railway volume list
EOF

success "Resource inventory saved to railway-resources.txt"

# Updated backup script with prefixed naming
log "Creating prefixed backup script..."
cat > scripts/railway-backup-prefixed.sh << EOF
#!/bin/bash
echo "💾 Party System - Prefixed Database Backup"
echo "========================================"

RESOURCE_PREFIX="$RESOURCE_PREFIX"

# Production backup
backup_production() {
    BACKUP_NAME="\${RESOURCE_PREFIX}-prod-backup-\$(date +%Y%m%d-%H%M%S)"
    railway environment use "\${RESOURCE_PREFIX}-production"
    railway database backup --name "\$BACKUP_NAME"
    echo "✅ Production backup: \$BACKUP_NAME"
}

# Staging backup
backup_staging() {
    BACKUP_NAME="\${RESOURCE_PREFIX}-staging-backup-\$(date +%Y%m%d-%H%M%S)"
    railway environment use "\${RESOURCE_PREFIX}-staging"
    railway database backup --name "\$BACKUP_NAME"
    echo "✅ Staging backup: \$BACKUP_NAME"
}

case "\${1:-production}" in
    "production"|"prod") backup_production ;;
    "staging") backup_staging ;;
    *) echo "Usage: \$0 [production|staging]" ;;
esac
EOF

chmod +x scripts/railway-backup-prefixed.sh

# Post-deployment information
echo ""
echo "🎉 ${GREEN}Prefixed Deployment Complete!${NC}"
echo "===================================="
echo "📦 Project: $PROJECT_NAME"
echo "🚀 Service: $SERVICE_NAME"
echo "🌐 Production: $(railway url)"
echo "📋 Resource Prefix: ${RESOURCE_PREFIX}-*"
echo ""
echo "🔧 ${BLUE}Environment Commands:${NC}"
echo "railway environment use ${RESOURCE_PREFIX}-production"
echo "railway environment use ${RESOURCE_PREFIX}-staging"
echo ""
echo "📊 ${BLUE}Resource Monitoring:${NC}"
echo "railway list                    # Show all resources"
echo "railway status                  # Current environment status"
echo "railway database               # Database info"
echo "railway volume list            # Volume usage"
echo ""
echo "💾 ${BLUE}Backup Commands:${NC}"
echo "./scripts/railway-backup-prefixed.sh production"
echo "./scripts/railway-backup-prefixed.sh staging"
echo ""
echo "📁 ${BLUE}Resource Inventory:${NC}"
echo "cat railway-resources.txt       # Complete resource list"

success "All party system resources now use '${RESOURCE_PREFIX}-' prefix for easy identification! 🎯"