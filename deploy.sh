#!/bin/bash

# Deployment script for mikr.us production server
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Chess Trainer Deployment Script"
echo "=================================="
echo ""

# Check if running on server
if [ ! -d "/var/www/chess-trainer" ]; then
  echo "❌ Error: This script must be run on the mikr.us server"
  echo "   Expected directory: /var/www/chess-trainer"
  exit 1
fi

cd /var/www/chess-trainer

echo "📥 Step 1: Pulling latest code from GitHub..."
git pull origin main
echo "✅ Code updated"
echo ""

echo "🔨 Step 2: Installing backend dependencies..."
cd backend
npm ci --production
echo "✅ Dependencies installed"
echo ""

echo "🏗️  Step 3: Building backend..."
npm run build
if [ ! -f "dist/main.js" ]; then
  echo "❌ Build failed! dist/main.js not found"
  exit 1
fi
echo "✅ Backend built successfully"
echo ""

echo "🗄️  Step 4: Running database migrations..."
npm run migration:run
echo "✅ Migrations completed"
echo ""

echo "📦 Step 5: Building frontend..."
cd ../frontend
npm ci
npm run build
if [ ! -d "dist" ]; then
  echo "❌ Frontend build failed! dist/ not found"
  exit 1
fi
echo "✅ Frontend built successfully"
echo ""

echo "🔄 Step 6: Restarting PM2 services..."
cd ..
pm2 restart all
echo "✅ Services restarted"
echo ""

echo "⏳ Waiting 3 seconds for services to start..."
sleep 3
echo ""

echo "🔍 Step 7: Checking service status..."
pm2 status
echo ""

echo "🏥 Step 8: Testing health endpoint..."
echo "Testing: http://localhost:30191/api/health"
if curl -f http://localhost:30191/api/health 2>/dev/null; then
  echo ""
  echo "✅ Backend is responding!"
else
  echo ""
  echo "❌ Backend health check failed!"
  echo "Check logs with: pm2 logs chess-trainer-api"
  exit 1
fi
echo ""

echo "✅ Deployment Complete!"
echo "======================"
echo ""
echo "📍 Your application URLs:"
echo "   Backend:  http://srv37.mikr.us:30191/api"
echo "   Frontend: http://srv37.mikr.us:40105"
echo ""
echo "📊 Check status:  pm2 status"
echo "📋 View logs:     pm2 logs"
echo "🔄 Restart:       pm2 restart all"
