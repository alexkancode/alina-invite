#!/bin/bash

# 🗄️ Create PostgreSQL Database for Alina's Birthday App
# Handles Railway CLI interactive prompts and authorization

set -e

echo "🗄️ Creating PostgreSQL Database: alina-postgres-db"
echo "=================================================="

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

# Ensure we're authenticated
if ! railway whoami &>/dev/null; then
    log_error "Not authenticated with Railway"
    exit 1
fi

# Make sure we're in the right project
log_info "Checking project context..."
railway status

# Method 1: Try direct database addition
log_info "Method 1: Direct PostgreSQL database creation..."
if echo -e "Database\npostgres\n" | railway add -d postgres 2>/dev/null; then
    log_success "PostgreSQL database created successfully!"
    exit 0
fi

log_warning "Method 1 failed, trying alternative approaches..."

# Method 2: Try with explicit service creation + database
log_info "Method 2: Service creation approach..."
if (echo -e "Empty Service\nalina-postgres-db\n\n" | railway add --service) 2>/dev/null; then
    log_info "Service created, now adding database capability..."

    # Switch to the new service
    if railway service alina-postgres-db 2>/dev/null; then
        log_info "Switched to alina-postgres-db service"

        # Try to add database to this service
        if echo -e "Database\npostgres\n" | railway add -d postgres 2>/dev/null; then
            log_success "PostgreSQL database created in alina-postgres-db service!"
            exit 0
        fi
    fi
fi

log_warning "Method 2 failed, trying method 3..."

# Method 3: Use Railway project-level database addition
log_info "Method 3: Project-level database addition..."

# Create a temporary script to handle interactive input
cat > /tmp/railway_input.exp << 'EOF'
#!/usr/bin/expect -f
set timeout 30

spawn railway add -d postgres
expect "What do you need?" { send "Database\r" }
expect "Enter a database name" { send "alina-postgres-db\r" }
expect eof
EOF

chmod +x /tmp/railway_input.exp

if command -v expect >/dev/null 2>&1; then
    log_info "Using expect to handle interactive prompts..."
    if /tmp/railway_input.exp; then
        log_success "PostgreSQL database created with expect!"
        rm -f /tmp/railway_input.exp
        exit 0
    fi
fi

rm -f /tmp/railway_input.exp
log_warning "Method 3 failed (expect not available or failed)"

# Method 4: Try different Railway CLI approach
log_info "Method 4: Alternative CLI syntax..."
if railway database create postgres --name alina-postgres-db 2>/dev/null; then
    log_success "Database created with alternative syntax!"
    exit 0
fi

# Method 5: Manual environment setup
log_info "Method 5: Manual database URL setup..."
log_warning "Automated creation failed. Manual setup required."

echo ""
echo "🛠️  Manual Setup Instructions:"
echo "=============================="
echo ""
echo "1. Open Railway Dashboard:"
echo "   railway open"
echo ""
echo "2. Click '+ Add' → 'Database' → 'PostgreSQL'"
echo ""
echo "3. Name it: alina-postgres-db"
echo ""
echo "4. Connect to your web app:"
echo "   railway service alina-birthday-app"
echo "   railway variables set DATABASE_URL=\${{POSTGRESQL_URL}}"
echo ""
echo "5. Redeploy:"
echo "   railway up --detach"

log_warning "All automated methods failed - use manual setup above"
exit 1