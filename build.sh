#!/bin/bash
set -e

echo "🔨 Starting build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Seed database (optional, comment out if not needed)
echo "🌱 Seeding database..."
npm run db:seed || true

# Build Next.js
echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
