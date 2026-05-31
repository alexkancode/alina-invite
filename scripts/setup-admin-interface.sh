#!/bin/bash
set -e

# Setup Admin Interface - Configuration and Deployment Script
# This script helps configure and deploy the new photo admin interface

echo "🚀 Setting up Photo Admin Interface..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: This script must be run from the project root directory${NC}"
    exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Warning: Railway CLI not found. Install it to deploy to production.${NC}"
    echo "Install with: npm install -g @railway/cli"
fi

echo -e "${BLUE}Step 1: Building the project...${NC}"
npm run build

echo -e "${BLUE}Step 2: Checking admin interface files...${NC}"

# Check if admin files exist
ADMIN_FILES=(
    "src/pages/admin/index.astro"
    "src/pages/api/admin/approve.ts"
    "src/pages/api/admin/photos.ts"
)

for file in "${ADMIN_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}✗ $file is missing${NC}"
        exit 1
    fi
done

echo -e "${BLUE}Step 3: Testing local development setup...${NC}"

# Check if development database is running
if docker compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Development database is running${NC}"
else
    echo -e "${YELLOW}⚠ Starting development database...${NC}"
    docker compose -f docker-compose.dev.yml up -d
    sleep 5
fi

echo -e "${BLUE}Step 4: Admin interface configuration...${NC}"

# Check current admin password (basic security reminder)
if grep -q "admin123" src/pages/admin/index.astro; then
    echo -e "${YELLOW}⚠ Warning: Default admin password detected!${NC}"
    echo "For production, change the password in src/pages/admin/index.astro"
    echo "Find this line: const adminPassword = 'admin123';"
fi

# Show admin access information
echo -e "${GREEN}Admin Interface Setup Complete!${NC}"
echo ""
echo -e "${BLUE}Local Access:${NC}"
echo "URL: http://localhost:4321/admin?password=admin123"
echo ""
echo -e "${BLUE}API Endpoints:${NC}"
echo "Stats: http://localhost:4321/api/admin/photos?type=stats"
echo "Pending: http://localhost:4321/api/admin/photos?type=pending"
echo "Approve: POST http://localhost:4321/api/admin/approve"
echo ""

# Railway deployment section
if command -v railway &> /dev/null; then
    echo -e "${BLUE}Step 5: Railway deployment options...${NC}"

    read -p "Deploy to Railway production? (y/N): " deploy_answer

    if [[ $deploy_answer =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deploying to Railway...${NC}"

        # Link to the party service
        railway service link party-app

        # Deploy
        railway up --detach

        # Get the production URL
        RAILWAY_URL=$(railway domain | head -1)

        echo -e "${GREEN}Deployment complete!${NC}"
        echo -e "${BLUE}Production Admin URL:${NC}"
        echo "https://${RAILWAY_URL}/admin?password=admin123"
        echo ""
        echo -e "${YELLOW}Security Reminder:${NC}"
        echo "1. Change the default admin password before sharing"
        echo "2. Consider IP-based restrictions for production"
        echo "3. Monitor the admin logs regularly"

    else
        echo -e "${YELLOW}Skipping Railway deployment.${NC}"
        echo "To deploy manually later:"
        echo "  railway service link party-app"
        echo "  railway up --detach"
    fi
else
    echo -e "${YELLOW}Railway CLI not available - skipping deployment step${NC}"
fi

echo ""
echo -e "${GREEN}✅ Admin Interface Setup Complete!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Visit the admin interface and test photo approval"
echo "2. Upload test photos using the main interface"
echo "3. Review and approve/reject photos in admin panel"
echo "4. For production: update admin authentication settings"
echo "5. Set up custom domain (see CUSTOM_DOMAIN_SETUP.md)"

# Offer to open admin interface
if command -v xdg-open &> /dev/null || command -v open &> /dev/null; then
    read -p "Open admin interface in browser? (y/N): " open_browser
    if [[ $open_browser =~ ^[Yy]$ ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open "http://localhost:4321/admin?password=admin123"
        else
            open "http://localhost:4321/admin?password=admin123"
        fi
    fi
fi