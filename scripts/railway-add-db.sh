#!/bin/bash

echo "🗄️ Railway Database Setup"
echo "========================="

echo "📊 Current project status..."
railway status

echo ""
echo "🗄️ Adding PostgreSQL database..."
railway add -d postgres

echo ""
echo "⏱️ Waiting a moment for database provisioning..."
sleep 3

echo ""
echo "🔍 Checking for database connection..."
railway variables list | grep -i database || echo "No database variables found yet"

echo ""
echo "📊 Final status..."
railway status

echo ""
echo "✅ Database setup script complete!"
echo "💡 If database was added, Railway will auto-generate DATABASE_URL"