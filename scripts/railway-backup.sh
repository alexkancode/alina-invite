#!/bin/bash

echo "💾 Railway Database Backup Manager"
echo "=================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    error "Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

# Function to create backup
create_backup() {
    local env=$1
    local backup_type=${2:-manual}

    log "Creating backup for $env environment..."
    railway environment use $env

    BACKUP_NAME="${backup_type}-${env}-$(date +%Y%m%d-%H%M%S)"

    if railway database backup --name "$BACKUP_NAME"; then
        success "Backup created: $BACKUP_NAME"
        return 0
    else
        error "Failed to create backup for $env"
        return 1
    fi
}

# Function to list backups
list_backups() {
    local env=$1

    log "Listing backups for $env environment..."
    railway environment use $env
    railway database backups || warning "No backups found or command failed"
}

# Function to restore from backup
restore_backup() {
    local env=$1
    local backup_name=$2

    warning "This will restore $env database from backup: $backup_name"
    echo "⚠️  This action cannot be undone!"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        log "Restoring $env from backup $backup_name..."
        railway environment use $env
        if railway database restore "$backup_name"; then
            success "Restore completed for $env"
        else
            error "Restore failed for $env"
        fi
    else
        log "Restore cancelled"
    fi
}

# Function to show backup commands
show_help() {
    echo ""
    echo "🔧 Usage: $0 [command] [environment] [backup_name]"
    echo ""
    echo "Commands:"
    echo "  backup [env]              Create backup (env: production|staging)"
    echo "  list [env]                List available backups"
    echo "  restore [env] [name]      Restore from backup"
    echo "  pre-event                 Create pre-event backup (production)"
    echo "  post-event                Create post-event backup (production)"
    echo "  help                      Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 backup production"
    echo "  $0 list staging"
    echo "  $0 restore production manual-production-20240529-143022"
    echo "  $0 pre-event"
    echo ""
}

# Main command handling
case "${1:-help}" in
    "backup")
        ENV=${2:-production}
        create_backup "$ENV" "manual"
        ;;
    "list")
        ENV=${2:-production}
        list_backups "$ENV"
        ;;
    "restore")
        ENV=${2}
        BACKUP_NAME=${3}
        if [ -z "$ENV" ] || [ -z "$BACKUP_NAME" ]; then
            error "Usage: $0 restore [environment] [backup_name]"
            exit 1
        fi
        restore_backup "$ENV" "$BACKUP_NAME"
        ;;
    "pre-event")
        log "Creating pre-event backup..."
        create_backup "production" "pre-event"
        ;;
    "post-event")
        log "Creating post-event backup..."
        create_backup "production" "post-event"
        ;;
    "help"|*)
        show_help
        ;;
esac

echo ""
success "Backup operation complete!"