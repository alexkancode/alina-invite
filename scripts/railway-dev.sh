#!/bin/bash

echo "🛠️  Railway Development Helper"
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

# Function to sync staging with production data (for testing)
sync_staging() {
    log "Syncing staging database with production data..."
    warning "This will overwrite staging database!"
    read -p "Continue? (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        # Create backup of production first
        railway environment use production
        BACKUP_NAME="sync-backup-$(date +%Y%m%d-%H%M%S)"
        railway database backup --name "$BACKUP_NAME"

        # Restore to staging
        railway environment use staging
        railway database restore "$BACKUP_NAME"

        success "Staging synced with production data"
    else
        log "Sync cancelled"
    fi
}

# Function to run migrations on specific environment
run_migrations() {
    local env=${1:-staging}

    log "Running migrations on $env environment..."
    railway environment use "$env"
    railway run npm run migrate

    success "Migrations completed on $env"
}

# Function to check logs across environments
check_logs() {
    log "Recent logs from production:"
    railway environment use production
    railway logs --lines 10

    log "Recent logs from staging:"
    railway environment use staging
    railway logs --lines 10
}

# Function to open app in browser
open_app() {
    local env=${1:-production}

    log "Opening $env app in browser..."
    railway environment use "$env"
    railway open
}

# Function to check database connection
test_db() {
    local env=${1:-staging}

    log "Testing database connection for $env..."
    railway environment use "$env"

    if railway run echo "SELECT 'Database connected!' as status;" | railway run psql > /dev/null 2>&1; then
        success "Database connection successful for $env"
    else
        warning "Database connection test failed for $env"
    fi
}

# Function to show development commands
show_help() {
    echo ""
    echo "🔧 Usage: $0 [command] [environment]"
    echo ""
    echo "Commands:"
    echo "  migrate [env]             Run database migrations (default: staging)"
    echo "  logs                      Show recent logs from both environments"
    echo "  open [env]                Open app in browser (default: production)"
    echo "  test-db [env]             Test database connection (default: staging)"
    echo "  sync-staging              Sync staging DB with production data"
    echo "  status                    Show status of both environments"
    echo "  help                      Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 migrate staging"
    echo "  $0 open production"
    echo "  $0 logs"
    echo "  $0 test-db production"
    echo ""
}

# Main command handling
case "${1:-help}" in
    "migrate")
        ENV=${2:-staging}
        run_migrations "$ENV"
        ;;
    "logs")
        check_logs
        ;;
    "open")
        ENV=${2:-production}
        open_app "$ENV"
        ;;
    "test-db")
        ENV=${2:-staging}
        test_db "$ENV"
        ;;
    "sync-staging")
        sync_staging
        ;;
    "status")
        ./scripts/railway-status.sh
        ;;
    "help"|*)
        show_help
        ;;
esac

echo ""
success "Development task complete!"