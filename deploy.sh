#!/bin/bash

# Bharat KYC App Deployment Script for Render
# This script handles the build and deployment process

echo "🚀 Starting Bharat KYC App deployment..."

# Set environment
export NODE_ENV=production

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p public
mkdir -p logs

# Copy static files
echo "📋 Copying static files..."
cp -r 05-Documentation/* public/ 2>/dev/null || true
cp -r 04-Source_Code/* public/sdk/ 2>/dev/null || true

# Set permissions
echo "🔐 Setting permissions..."
chmod +x src/backend/server.js

# Health check
echo "🏥 Running health check..."
curl -f http://localhost:$PORT/health || echo "Health check failed"

echo "✅ Deployment completed successfully!"
echo "🌍 Application is running on port $PORT"
echo "📊 Health check: http://localhost:$PORT/health"
echo "📚 Documentation: http://localhost:$PORT/docs"
echo "🎨 Wireframes: http://localhost:$PORT/wireframes"
echo "🔧 SDK: http://localhost:$PORT/sdk"
