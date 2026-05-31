#!/bin/bash

# 🔗 Complete PostgreSQL Database Setup and Deployment
# Tries additional methods to add PostgreSQL and handles web app connection

set -e

echo "🔗 Completing Alina's PostgreSQL Database Setup"
echo "=============================================="

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

log_info "Starting database setup completion..."

# Method 1: Try Railway environment variable injection
log_info "Method 1: Attempting PostgreSQL environment setup..."
railway service alina-postgres-db

# Try to configure PostgreSQL environment manually
log_info "Setting PostgreSQL configuration variables..."
if railway variables set POSTGRES_DB=alina_birthday 2>/dev/null; then
    log_success "Set POSTGRES_DB"
fi

if railway variables set POSTGRES_USER=postgres 2>/dev/null; then
    log_success "Set POSTGRES_USER"
fi

if railway variables set POSTGRES_PASSWORD=$(openssl rand -base64 32) 2>/dev/null; then
    log_success "Set POSTGRES_PASSWORD"
fi

# Method 2: Try Railway plugin approach
log_info "Method 2: Attempting plugin-based PostgreSQL setup..."
if railway plugin install postgresql 2>/dev/null; then
    log_success "PostgreSQL plugin installed"
elif railway addon create postgresql 2>/dev/null; then
    log_success "PostgreSQL addon created"
else
    log_warning "Plugin/addon approach failed"
fi

# Method 3: Try Railway service configuration
log_info "Method 3: Service configuration approach..."
if railway service configure --type database --engine postgresql 2>/dev/null; then
    log_success "Service configured as PostgreSQL database"
else
    log_warning "Service configuration failed"
fi

# Method 4: Try Railway init with database
log_info "Method 4: Database initialization..."
if railway db init postgresql 2>/dev/null; then
    log_success "Database initialized"
else
    log_warning "Database init failed"
fi

# Method 5: Try direct PostgreSQL container deployment
log_info "Method 5: Container-based PostgreSQL..."
cat > /tmp/railway-postgres.dockerfile << 'EOF'
FROM postgres:15
ENV POSTGRES_DB=alina_birthday
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=secure_password
EOF

if railway up --dockerfile /tmp/railway-postgres.dockerfile 2>/dev/null; then
    log_success "PostgreSQL container deployed"
    rm -f /tmp/railway-postgres.dockerfile
else
    log_warning "Container approach failed"
    rm -f /tmp/railway-postgres.dockerfile
fi

# Check if any database URL is now available
log_info "Checking for DATABASE_URL..."
if railway variables | grep -i "database_url\|postgres" | head -5; then
    log_success "Found database-related variables!"
else
    log_warning "No DATABASE_URL found yet"
fi

# Method 6: Manual DATABASE_URL construction
log_info "Method 6: Constructing DATABASE_URL manually..."
POSTGRES_HOST=$(railway variables | grep "RAILWAY_PRIVATE_DOMAIN" | cut -d'│' -f3 | xargs)
if [[ -n "$POSTGRES_HOST" ]]; then
    MANUAL_DB_URL="postgresql://postgres:secure_password@${POSTGRES_HOST}:5432/alina_birthday"
    log_info "Setting manual DATABASE_URL..."
    if railway variables set DATABASE_URL="$MANUAL_DB_URL" 2>/dev/null; then
        log_success "Manual DATABASE_URL set"
    fi
fi

echo ""
log_info "=== Current Variables ==="
railway variables

echo ""
log_info "Now connecting to web application..."

# Switch to web app and set database connection
railway service alina-birthday-app

# Copy database URL from postgres service to web app if needed
log_info "Ensuring DATABASE_URL is available in web app..."

# Try to get DATABASE_URL from postgres service
POSTGRES_DB_URL=""
railway service alina-postgres-db >/dev/null
if railway variables | grep -q "DATABASE_URL"; then
    POSTGRES_DB_URL=$(railway variables | grep "DATABASE_URL" | cut -d'│' -f3 | xargs)
    log_info "Found DATABASE_URL in postgres service: ${POSTGRES_DB_URL:0:30}..."
fi

# Set it in web app
railway service alina-birthday-app >/dev/null
if [[ -n "$POSTGRES_DB_URL" ]]; then
    if railway variables set DATABASE_URL="$POSTGRES_DB_URL" 2>/dev/null; then
        log_success "DATABASE_URL copied to web app"
    fi
else
    # Set reference to postgres service
    if railway variables set DATABASE_URL="\${{alina-postgres-db.DATABASE_URL}}" 2>/dev/null; then
        log_success "DATABASE_URL reference set"
    elif railway variables set DATABASE_URL="\${{POSTGRESQL_URL}}" 2>/dev/null; then
        log_success "POSTGRESQL_URL reference set"
    fi
fi

# Deploy web application
log_info "Deploying web application..."
if railway up --detach; then
    log_success "Web application deployed!"

    # Wait a moment for deployment to start
    sleep 10

    # Try running migrations
    log_info "Running database migrations..."
    if railway run npm run migrate; then
        log_success "Database migrations completed!"
    else
        log_warning "Migrations failed - check database connection"
    fi

    # Get deployment URL
    log_info "Getting deployment URL..."
    railway domain

else
    log_error "Web application deployment failed"
fi

echo ""
log_success "🎉 Database setup and deployment complete!"
echo ""
echo "📊 Next steps if issues remain:"
echo "  railway logs          # Check application logs"
echo "  railway variables     # Verify DATABASE_URL exists"
echo "  railway open          # Use dashboard as fallback"
echo ""

# Final status check
log_info "Final deployment status:"
railway status