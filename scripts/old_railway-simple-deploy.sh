#!/bin/bash

echo "🚂 Railway Simple Deploy Script"
echo "==============================="

echo "📊 Current status..."
railway status

echo ""
echo "🔗 Ensuring service is linked..."
railway service link calm-mercy

echo ""
echo "🌍 Setting basic environment variables..."
railway variables set NODE_ENV=production

echo ""
echo "📝 Setting build environment..."
railway variables set NODE_VERSION=22

echo ""
echo "🚀 Deploying current code..."
railway up --detach --message "Deploy Week 2 photo upload system"

echo ""
echo "📊 Deployment status..."
railway status

echo ""
echo "📋 Available services and deployments..."
railway service status

echo ""
echo "✅ Simple deploy script complete!"
echo "🌐 Check dashboard: railway open"
echo "📱 The app should be deploying now!"