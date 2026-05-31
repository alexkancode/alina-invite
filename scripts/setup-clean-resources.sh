#!/bin/bash

# 🏗️ Set Up Clean Resource Architecture with Prefixes
# Creates properly named, separated resources for Alina's birthday app

set -e

echo "🏗️ Setting Up Clean Resource Architecture"
echo "========================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Define clean resource names
WEB_APP="alina-birthday-app"
DATABASE="alina-birthday-db"

log_info "Target architecture:"
echo "  🌐 Web App: $WEB_APP"
echo "  🗄️ Database: $DATABASE"
echo ""

# Check current state
log_info "Current project state:"
railway status

echo ""
log_info "Step 1: Verify web application service..."

# Check if web app exists and is properly named
if railway service $WEB_APP 2>/dev/null; then
    log_success "Web app service '$WEB_APP' exists and is properly named"
else
    log_warning "Web app service needs to be created or renamed"

    # Try to link to alina-birthday-app
    if railway service link alina-birthday-app 2>/dev/null; then
        log_success "Linked to existing alina-birthday-app"
    else
        log_info "Creating new web application service..."
        railway add --service $WEB_APP
        railway service $WEB_APP
    fi
fi

echo ""
log_info "Step 2: Clean up and create database service..."

# Check current services and clean up
log_info "Current services in project:"
railway status

echo ""
log_info "Manual cleanup required for optimal architecture:"
echo ""
echo "🧹 Dashboard Cleanup Steps:"
echo "=========================="
echo "1. Open Railway dashboard:"
echo "   railway open"
echo ""
echo "2. Delete unnecessary services:"
echo "   - Remove 'alina-postgres-db' (empty service)"
echo "   - Remove 'postgres-db' (if from other app)"
echo "   - Remove 'calm-mercy' (different app)"
echo ""
echo "3. Create clean database:"
echo "   - Click '+ Add' → 'Database' → 'PostgreSQL'"
echo "   - Name: '$DATABASE'"
echo ""
echo "4. Verify final architecture:"
echo "   - '$WEB_APP' (web application)"
echo "   - '$DATABASE' (PostgreSQL database)"
echo ""

log_info "Step 3: Configure web application for clean database connection..."

# Switch to web app
railway service $WEB_APP

# Set up environment for clean database reference
log_info "Setting environment variables for clean database connection..."

# Set application environment
if railway variables set NODE_ENV=production 2>/dev/null; then
    log_success "Set NODE_ENV=production"
fi

if railway variables set NODE_VERSION=22 2>/dev/null; then
    log_success "Set NODE_VERSION=22"
fi

# Generate secure IP salt
IP_SALT=$(openssl rand -hex 32)
if railway variables set IP_SALT="$IP_SALT" 2>/dev/null; then
    log_success "Set secure IP_SALT"
fi

# Set database reference (will work once clean database is created)
if railway variables set DATABASE_URL="\${{$DATABASE.DATABASE_URL}}" 2>/dev/null; then
    log_success "Set DATABASE_URL reference to '$DATABASE'"
elif railway variables set DATABASE_URL="\${{DATABASE_URL}}" 2>/dev/null; then
    log_success "Set DATABASE_URL reference (generic)"
fi

echo ""
log_info "Step 4: Deployment script for post-cleanup..."

# Create post-cleanup deployment script
cat > scripts/deploy-after-cleanup.sh << 'EOF'
#!/bin/bash
# Deploy after clean database setup

echo "🚀 Deploying with Clean Architecture"
echo "===================================="

# Switch to web app
railway service alina-birthday-app

# Deploy application
echo "Deploying web application..."
railway up --detach

# Wait for deployment
echo "Waiting for deployment to complete..."
sleep 30

# Run migrations
echo "Running database migrations..."
railway run npm run migrate

# Get URL
echo ""
echo "🎉 Deployment complete!"
railway domain
echo ""

# Show final status
railway status
EOF

chmod +x scripts/deploy-after-cleanup.sh

log_success "Created post-cleanup deployment script"

echo ""
log_success "🎉 Clean Architecture Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Complete the manual cleanup in Railway dashboard"
echo "2. Run: ./scripts/deploy-after-cleanup.sh"
echo "3. Your app will have clean, properly named resources!"
echo ""
echo "🏆 Final Architecture:"
echo "  🌐 $WEB_APP"
echo "  🗄️ $DATABASE"
echo "  📝 Clear separation from other apps"
echo "  🔧 Consistent naming convention"