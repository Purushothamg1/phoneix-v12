#!/bin/bash
set -e

echo "==> Installing backend dependencies..."
cd /home/runner/workspace/backend
npm install --production=false

echo "==> Building backend..."
npm run build

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Running database migrations..."
npx prisma migrate deploy

echo "==> Installing frontend dependencies..."
cd /home/runner/workspace/frontend
npm install --production=false

echo "==> Building frontend..."
npm run build

echo "Build complete!"
