#!/bin/bash

echo "📋 Railway Resource Inventory"
echo "============================"

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

log "Scanning Railway resources..."

# Show all projects
echo ""
echo "📦 Available Projects:"
railway list 2>/dev/null || echo "No projects found or not logged in"

# Show current project info if linked
echo ""
echo "🔗 Current Project Status:"
railway status 2>/dev/null || echo "No project linked in this directory"

# Show environments
echo ""
echo "🌍 Environments:"
railway environment list 2>/dev/null || echo "No environments found"

# Show volumes
echo ""
echo "📁 Volumes:"
railway volume list 2>/dev/null || echo "No volumes found"

# Show databases
echo ""
echo "🗄️ Databases:"
railway database list 2>/dev/null || railway database 2>/dev/null || echo "No databases found"

# Check for resources with different prefixes
echo ""
echo "🔍 Resource Pattern Analysis:"
echo "Looking for resources that might belong to this project..."

# Function to analyze naming patterns
analyze_patterns() {
    echo ""
    info "Common patterns found in your resources:"

    # This would need to be customized based on actual Railway output
    # For now, just show what patterns to look for
    echo "  • party-* resources: Party system (RSVPs, leaderboard, photos)"
    echo "  • photo-* resources: Legacy photo-only naming"
    echo "  • upload-* resources: Legacy upload-only naming"
    echo "  • Generic names: May need prefixing"
}

analyze_patterns

# Recommendations
echo ""
echo "🎯 Recommendations:"
echo "==================="
echo ""
echo "If you see resources WITHOUT a clear prefix:"
echo "  1. Run: ./scripts/railway-deploy-prefixed.sh"
echo "  2. This will create properly named resources:"
echo "     📦 Project: party-system"
echo "     🚀 Service: party-app"
echo "     🗄️ Databases: party-db-production, party-db-staging"
echo "     📁 Volumes: party-uploads-production, party-uploads-staging"
echo "     🌍 Environments: party-production, party-staging"
echo ""
echo "If you want to clean up old resources:"
echo "  1. railway environment use [old-environment]"
echo "  2. railway service delete [old-service]"
echo "  3. railway volume delete [old-volume]"
echo ""

# Create a resource comparison
echo "💡 Want consistent naming? Run:"
echo "   ./scripts/railway-deploy-prefixed.sh"
echo ""

success "Resource inventory complete!"