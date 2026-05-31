#!/bin/bash

echo "🌐 Railway API Approach for Database"
echo "==================================="

echo "📊 Current project info..."
railway status --json > /tmp/railway_status.json
cat /tmp/railway_status.json

echo ""
echo "🔍 Trying to list available templates..."
railway deploy --help | grep -A 10 "template"

echo ""
echo "🎯 Attempt: Deploy PostgreSQL as separate service..."
# Try to create a new service specifically for PostgreSQL
railway add --service postgres-db

echo ""
echo "🎯 Try connecting a PostgreSQL template to existing project..."
# Maybe we can deploy a template and then connect it
railway deploy -t postgres -v "POSTGRES_USER=app" -v "POSTGRES_PASSWORD=secretpassword" -v "POSTGRES_DB=party"

echo ""
echo "🔧 Alternative: Check if we can modify service settings..."
railway service --help

echo ""
echo "📋 Check what services exist in project..."
railway list --json | grep -A 20 -B 5 "invites-photo-system"

echo ""
echo "✅ API approach script complete!"