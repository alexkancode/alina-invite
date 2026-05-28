#!/bin/bash

echo "🚂 Railway Deployment Script - Phase 2"
echo "======================================"

echo "📊 Current status..."
railway status

echo ""
echo "🗄️ Adding PostgreSQL database..."
railway add -d postgres

echo ""
echo "📦 Connecting GitHub repo to existing service..."
# First try to link the repo to the calm-mercy service
railway service link calm-mercy

echo ""
echo "🔗 Setting up GitHub connection..."
# Try to connect the GitHub repo
railway service connect --repo "alexkancode/invites" --branch "railway-migration"

echo ""
echo "🌍 Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="\${{Postgres.DATABASE_URL}}"

echo ""
echo "🚀 Triggering deployment..."
railway deploy --branch railway-migration

echo ""
echo "📊 Final status..."
railway status

echo ""
echo "✅ Deployment script complete!"
echo "🌐 Open dashboard: railway open"