#!/bin/bash

echo "🗄️ Deploy PostgreSQL to postgres-db Service"
echo "============================================="

echo "📊 Current status..."
railway status

echo ""
echo "🗄️ Deploy PostgreSQL template to postgres-db service..."
railway deploy -t postgres -v "POSTGRES_USER=app" -v "POSTGRES_PASSWORD=secretpassword123" -v "POSTGRES_DB=party"

echo ""
echo "⏱️ Waiting for deployment..."
sleep 5

echo ""
echo "🔍 Check postgres-db service status..."
railway service status

echo ""
echo "🔗 Now link back to main app service..."
railway service link calm-mercy

echo ""
echo "🔍 Check if DATABASE_URL is now available..."
railway variables list

echo ""
echo "🚀 Trigger redeploy of main app..."
railway service redeploy

echo ""
echo "✅ PostgreSQL deployment script complete!"