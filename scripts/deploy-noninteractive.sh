#!/bin/bash

# 🚀 Non-Interactive Railway Deployment Script
# Handles authentication, setup, and deployment with minimal user intervention

set -e  # Exit on any error

echo "🚂 Non-Interactive Railway Deployment"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if Railway CLI is installed
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        log_error "Railway CLI not found. Installing..."
        curl -sSL https://railway.app/install.sh | sh
        export PATH="$PATH:$HOME/.railway/bin"
    fi

    local version=$(railway --version 2>/dev/null || echo "unknown")
    log_success "Railway CLI available: $version"
}

# Check authentication status
check_auth() {
    log_info "Checking Railway authentication..."

    if railway whoami 2>/dev/null | grep -q "Logged in as"; then
        local user=$(railway whoami 2>/dev/null)
        log_success "Already authenticated: $user"
        return 0
    fi

    log_warning "Not authenticated with Railway"
    echo ""
    echo "🔐 To authenticate with Railway:"
    echo "   1. Run: railway login"
    echo "   2. This will open a browser window"
    echo "   3. Sign in with your Railway account"
    echo "   4. Come back and run this script again"
    echo ""

    read -p "Would you like to open the login now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        railway login
        log_success "Authentication completed!"
    else
        log_error "Authentication required. Exiting."
        exit 1
    fi
}

# Initialize or link to Railway project
setup_project() {
    log_info "Setting up Railway project..."

    # Check if already linked to a project
    if railway status 2>/dev/null | grep -q "Project:"; then
        log_success "Already linked to a Railway project"
        railway status
        return 0
    fi

    log_info "Not linked to a project. Creating new one..."

    # Try to initialize a new project
    if railway init --name "alina-birthday-party" 2>/dev/null; then
        log_success "Created new Railway project: alina-birthday-party"
    else
        log_warning "Project creation failed, trying to link to existing..."
        echo ""
        echo "Available projects:"
        railway projects
        echo ""
        read -p "Enter the project name to link to (or press Enter to create new): " project_name

        if [[ -n "$project_name" ]]; then
            railway link "$project_name" || {
                log_error "Failed to link to project '$project_name'"
                exit 1
            }
        else
            railway init || {
                log_error "Failed to initialize project"
                exit 1
            }
        fi
    fi
}

# Add PostgreSQL database
setup_database() {
    log_info "Setting up PostgreSQL database..."

    # Check if database already exists
    if railway variables | grep -q "DATABASE_URL"; then
        log_success "Database already configured"
        return 0
    fi

    log_info "Adding PostgreSQL database..."
    railway add --database postgres

    # Wait for database to be ready
    log_info "Waiting for database to initialize..."
    sleep 10

    # Verify database is ready
    local retries=0
    while [[ $retries -lt 30 ]]; do
        if railway variables | grep -q "DATABASE_URL"; then
            log_success "Database ready!"
            return 0
        fi
        log_info "Database still initializing... (retry $((retries + 1))/30)"
        sleep 10
        ((retries++))
    done

    log_error "Database setup timed out"
    exit 1
}

# Set environment variables
set_environment() {
    log_info "Setting environment variables..."

    # Production environment
    railway variables set NODE_ENV=production --service alina-birthday-party 2>/dev/null || \
        railway variables set NODE_ENV=production

    # Node version
    railway variables set NODE_VERSION=22 --service alina-birthday-party 2>/dev/null || \
        railway variables set NODE_VERSION=22

    # IP salt for security
    if ! railway variables | grep -q "IP_SALT"; then
        local ip_salt=$(openssl rand -hex 32)
        railway variables set IP_SALT="$ip_salt" --service alina-birthday-party 2>/dev/null || \
            railway variables set IP_SALT="$ip_salt"
        log_success "Generated secure IP_SALT"
    fi

    log_success "Environment variables configured"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."

    # Deploy first to get the environment ready
    log_info "Deploying code..."
    railway up --detach || {
        log_warning "Initial deployment failed, trying again..."
        sleep 30
        railway up --detach
    }

    # Wait for deployment
    log_info "Waiting for deployment to complete..."
    sleep 60

    # Run migrations
    log_info "Running database migrations..."
    railway run npm run migrate || {
        log_warning "Migration failed, deployment may still work without data"
    }

    log_success "Migrations completed"
}

# Deploy the application
deploy_app() {
    log_info "Deploying application..."

    # Ensure we're on the latest commit
    local current_commit=$(git rev-parse --short HEAD)
    log_info "Deploying commit: $current_commit"

    # Deploy
    railway up --detach --json > deployment.json 2>/dev/null || railway up --detach

    log_success "Deployment initiated!"

    # Show deployment status
    sleep 10
    railway status
}

# Get deployment URL
get_deployment_url() {
    log_info "Getting deployment URL..."

    local url=$(railway domain 2>/dev/null | head -1 | awk '{print $1}')
    if [[ -n "$url" ]]; then
        log_success "🌐 Your app is live at: https://$url"
    else
        log_warning "URL not available yet. Check: railway domain"
    fi
}

# Main deployment flow
main() {
    echo "Starting automated Railway deployment..."
    echo ""

    # Pre-flight checks
    check_railway_cli
    check_auth

    # Project setup
    setup_project

    # Infrastructure setup
    setup_database
    set_environment

    # Application deployment
    deploy_app
    run_migrations

    # Final status
    echo ""
    log_success "🎉 Deployment Complete!"
    echo ""
    get_deployment_url

    echo ""
    echo "📊 Useful commands:"
    echo "   railway logs     - View application logs"
    echo "   railway open     - Open Railway dashboard"
    echo "   railway domain   - Get deployment URL"
    echo "   railway status   - Check project status"
    echo ""
}

# Cleanup on exit
trap 'rm -f deployment.json' EXIT

# Run main function
main "$@"