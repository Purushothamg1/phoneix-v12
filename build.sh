#!/bin/bash
set -e

echo "==> Installing backend dependencies..."
cd /home/runner/workspace/backend
npm install --production=false

echo "==> Building backend..."
npm run build

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Applying database migrations..."
# Baseline the initial migration if schema already exists (shared dev/prod database)
npx prisma migrate resolve --applied "0001_init" 2>/dev/null || true
npx prisma migrate deploy

echo "==> Installing frontend dependencies..."
cd /home/runner/workspace/frontend
npm install --production=false

echo "==> Building frontend..."
NODE_ENV=production npm run build

echo "==> Seeding default admin user and settings..."
cd /home/runner/workspace/backend
npx ts-node src/config/seed.ts

echo "Build complete!"
