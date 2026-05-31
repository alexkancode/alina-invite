#!/bin/bash

# 🚀 Set Railway Environment Variables
# Sets essential environment variables for the application

set -e

echo "🔧 Setting Railway Environment Variables"
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

# Check if authenticated
if ! railway whoami &>/dev/null; then
    log_error "Not authenticated with Railway"
    exit 1
fi

log_info "Setting production environment variables..."

# Set Node environment
log_info "Setting NODE_ENV=production..."
if railway variables set NODE_ENV=production; then
    log_success "NODE_ENV set to production"
else
    log_warning "Failed to set NODE_ENV"
fi

# Set Node version
log_info "Setting NODE_VERSION=22..."
if railway variables set NODE_VERSION=22; then
    log_success "NODE_VERSION set to 22"
else
    log_warning "Failed to set NODE_VERSION"
fi

# Generate and set IP salt for security
log_info "Setting IP_SALT for security..."
IP_SALT=$(openssl rand -hex 32)
if railway variables set IP_SALT="$IP_SALT"; then
    log_success "IP_SALT set (secure random hash)"
else
    log_warning "Failed to set IP_SALT"
fi

# Set port (optional, Railway usually handles this)
log_info "Setting PORT=4321..."
if railway variables set PORT=4321; then
    log_success "PORT set to 4321"
else
    log_warning "Failed to set PORT (Railway will use default)"
fi

echo ""
log_info "Checking current variables..."
railway variables

echo ""
log_success "🎉 Environment variables configured!"
echo ""
echo "Next steps:"
echo "  railway up --detach    # Deploy the application"
echo "  railway logs          # View deployment logs"
echo "  railway domain        # Get deployment URL"