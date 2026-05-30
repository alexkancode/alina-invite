#!/bin/bash

echo "🔍 Railway Resource Cleanup Analysis (SAFE - No Deletions)"
echo "=========================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

danger() {
    echo -e "${RED}🚨${NC} $1"
}

info() {
    echo -e "${GREEN}ℹ️${NC} $1"
}

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

danger "THIS SCRIPT ONLY ANALYZES - IT NEVER DELETES ANYTHING"
echo ""

# Expected resources for this party system
EXPECTED_PARTY_RESOURCES=(
    "party-system"
    "party-app"
    "party-db"
    "party-uploads"
    "party-production"
    "party-staging"
)

# Legacy naming patterns that DEFINITELY belong to this party project
# (Found in your old railway scripts)
LEGACY_PARTY_PATTERNS=(
    "photo-upload"
    "party-upload"
    "calm-mercy"      # From old_railway-simple-deploy.sh
    "invites-app"     # From old_railway-setup.sh
    "invites"
)

# Get all Railway projects
log "Scanning all Railway resources..."

echo ""
echo "📋 ANALYSIS REPORT"
echo "=================="

# Function to categorize resources
analyze_resource() {
    local resource_name="$1"
    local resource_type="$2"

    # Check if it matches current party system naming
    for pattern in "${EXPECTED_PARTY_RESOURCES[@]}"; do
        if [[ "$resource_name" == *"$pattern"* ]]; then
            info "$resource_type: '$resource_name' → BELONGS TO PARTY SYSTEM ✅"
            return 0
        fi
    done

    # Check if it matches legacy patterns from this project
    for pattern in "${LEGACY_PARTY_PATTERNS[@]}"; do
        if [[ "$resource_name" == *"$pattern"* ]]; then
            warning "$resource_type: '$resource_name' → MIGHT BE OLD PARTY SYSTEM ⚠️"
            return 0
        fi
    done

    # Doesn't match - probably belongs to another app
    danger "$resource_type: '$resource_name' → LIKELY OTHER APP - DO NOT TOUCH 🚨"
}

# Show current project status
echo ""
echo "🔗 Current Directory Project:"
echo "----------------------------"
railway status 2>/dev/null || echo "No project linked in this directory"

echo ""
echo "📦 All Projects Analysis:"
echo "------------------------"
if railway list &> /dev/null; then
    # Get project list and analyze each
    railway list 2>/dev/null | while read -r line; do
        if [[ -n "$line" && "$line" != *"Projects"* && "$line" != *"---"* ]]; then
            analyze_resource "$line" "Project"
        fi
    done
else
    echo "Cannot access project list - not logged in?"
fi

echo ""
echo "🌍 Environment Analysis:"
echo "-----------------------"
# Note: This requires being in a linked project
if railway environment list &> /dev/null; then
    railway environment list 2>/dev/null | while read -r line; do
        if [[ -n "$line" && "$line" != *"Environment"* && "$line" != *"---"* ]]; then
            analyze_resource "$line" "Environment"
        fi
    done
else
    echo "Cannot analyze environments - no project linked or no access"
fi

# Create cleanup recommendations file
echo ""
log "Creating cleanup recommendations..."

cat > railway-cleanup-recommendations.txt << 'EOF'
# Railway Cleanup Recommendations
# Generated: $(date)
#
# ⚠️ MANUAL REVIEW REQUIRED - DO NOT RUN AUTOMATED CLEANUP
#
# This file contains SUGGESTIONS only. Review each resource manually
# before deleting to ensure it doesn't belong to other applications.

## Safe Resources to Keep (Current Party System)
# These should have been created by railway-deploy-prefixed.sh:
# - party-system (project)
# - party-app (service)
# - party-db-production, party-db-staging (databases)
# - party-uploads-production, party-uploads-staging (volumes)
# - party-production, party-staging (environments)

## Resources That DEFINITELY Belong to This Party System
# These specific names appeared in your old deployment scripts:
# - "calm-mercy" (service name from old_railway-simple-deploy.sh)
# - "invites-app" (service name from old_railway-setup.sh)
# - "invites" (repo reference from old scripts)
# - Anything containing "photo-upload" (this project's original name)
# - Generic postgres databases created for this project

## MANUAL CLEANUP COMMANDS (Use With Extreme Care)
#
# To check what a resource contains before deleting:
# railway environment use [environment-name]
# railway status
# railway database  # Check if it has your party data
# railway logs --lines 20  # Check recent activity
#
# To safely delete old resources (ONLY if you're certain):
# railway environment use [old-environment]
# railway service delete [old-service-name]  # Deletes the service
# railway volume delete [old-volume-name]    # Deletes the volume
# railway database delete [old-database]     # Deletes the database
# railway environment delete [old-environment]  # Deletes the environment
#
# ⚠️ DELETION IS PERMANENT - BACKUP FIRST ⚠️

## Recovery Instructions If You Delete Wrong Thing
# 1. Check if backups exist: railway database backups
# 2. Restore from backup: railway database restore [backup-name]
# 3. Re-deploy: npm run railway:deploy:prefixed

## Recommended Approach
# 1. Deploy new prefixed resources: npm run railway:deploy:prefixed
# 2. Test that everything works with new setup
# 3. Export/backup data from old resources if needed
# 4. Manually delete old resources ONE AT A TIME
# 5. Verify each deletion doesn't break anything

EOF

echo ""
echo "📁 RECOMMENDATIONS SAVED"
echo "========================"
echo "Review: cat railway-cleanup-recommendations.txt"

echo ""
echo "🛡️ SAFE CLEANUP APPROACH"
echo "========================"
echo ""
echo "1. 🚀 Deploy new prefixed resources FIRST:"
echo "   npm run railway:deploy:prefixed"
echo ""
echo "2. ✅ Test new setup works completely"
echo ""
echo "3. 📋 Manually review each old resource:"
echo "   railway environment use [old-env]"
echo "   railway status"
echo "   railway logs --lines 20"
echo ""
echo "4. 💾 Backup any important data:"
echo "   railway database backup --name cleanup-safety-backup"
echo ""
echo "5. 🗑️ Delete old resources ONE BY ONE (not scripted):"
echo "   railway service delete [old-service-name]"
echo "   railway volume delete [old-volume-name]"
echo "   # etc."
echo ""

warning "NEVER run automated cleanup on Railway resources!"
info "Always verify what each resource contains before deleting"

echo ""
echo "📞 If something goes wrong:"
echo "- Check: railway database backups"
echo "- Restore: railway database restore [backup-name]"
echo "- Re-deploy: npm run railway:deploy:prefixed"

echo ""
echo "✅ Analysis complete - see railway-cleanup-recommendations.txt for details"