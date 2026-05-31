#!/bin/bash
# Deploy after clean database setup

echo "🚀 Deploying with Clean Architecture"
echo "===================================="

# Switch to web app
railway service alina-birthday-app

# Deploy application
echo "Deploying web application..."
railway up --detach

# Wait for deployment
echo "Waiting for deployment to complete..."
sleep 30

# Run migrations
echo "Running database migrations..."
railway run npm run migrate

# Get URL
echo ""
echo "🎉 Deployment complete!"
railway domain
echo ""

# Show final status
railway status
