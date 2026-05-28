#!/bin/bash

# 🚀 Quick Deploy Script
# For subsequent deployments after initial setup

set -e

echo "⚡ Quick Deploy to Railway"
echo "========================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Check if authenticated and linked
if ! railway status &>/dev/null; then
    echo "❌ Not connected to Railway project"
    echo "💡 Run: ./scripts/deploy-noninteractive.sh for full setup"
    exit 1
fi

# Show current status
log_info "Current project status:"
railway status

# Get current commit
current_commit=$(git rev-parse --short HEAD)
log_info "Deploying commit: $current_commit"

# Ensure everything is committed
if ! git diff-index --quiet HEAD --; then
    log_warning "You have uncommitted changes"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        exit 1
    fi
fi

# Deploy
log_info "Deploying to Railway..."
railway up --detach

# Show logs briefly
sleep 5
log_info "Recent deployment logs:"
railway logs --tail 20 || true

log_success "🎉 Deployment complete!"

# Get URL
url=$(railway domain 2>/dev/null | head -1 | awk '{print $1}')
if [[ -n "$url" ]]; then
    log_success "🌐 Live at: https://$url"
else
    log_info "💡 Get URL with: railway domain"
fi

echo ""
echo "📊 Next steps:"
echo "   railway logs     - View live logs"
echo "   railway open     - Open dashboard"
echo "   railway domain   - Get deployment URL"