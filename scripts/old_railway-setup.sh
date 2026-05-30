#!/bin/bash

echo "🚂 Railway Setup Script"
echo "======================"

echo "📊 Checking current status..."
railway status

echo ""
echo "🗄️ Adding PostgreSQL database..."
railway add -d postgres

echo ""
echo "🔗 Adding GitHub service..."
railway add --service "invites-app" --repo "alexkancode/invites"

echo ""
echo "📊 Final status check..."
railway status

echo ""
echo "✅ Setup complete!"