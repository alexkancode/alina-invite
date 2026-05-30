#!/bin/bash

echo "🚂 Railway Party System Status"
echo "============================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

info() {
    echo -e "${YELLOW}ℹ️${NC} $1"
}

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

# Function to show environment status
show_env_status() {
    local env=$1
    echo ""
    echo "📊 ${env^^} Environment Status"
    echo "------------------------"

    railway environment use $env

    # Basic status
    log "Service Status:"
    railway status

    # Database info
    log "Database Information:"
    railway database || echo "No database found"

    # Recent logs
    log "Recent Logs (last 10 lines):"
    railway logs --lines 10

    # Variables (non-sensitive)
    log "Environment Variables:"
    railway variables list | grep -v "DATABASE_URL\|_TOKEN\|_SECRET" || echo "No variables found"

    # URL
    log "Application URL:"
    railway url || echo "No URL available"
}

# Show status for both environments
show_env_status "production"
show_env_status "staging"

# Summary
echo ""
echo "🔧 Management Commands:"
echo "====================="
echo "• Open app: railway open"
echo "• View logs: railway logs --follow"
echo "• Run migration: railway run npm run migrate"
echo "• Create backup: ./scripts/railway-backup.sh"
echo "• Switch environment: railway environment use [staging|production]"
echo ""

success "Status check complete!"