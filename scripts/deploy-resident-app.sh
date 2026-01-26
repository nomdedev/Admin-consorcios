#!/bin/bash

# Deploy Resident App to Vercel
# Usage: ./scripts/deploy-resident-app.sh

set -e

echo "🚀 Deploying Resident App to Vercel..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed. Please install it first:${NC}"
    echo "npm install -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Vercel. Please login first:${NC}"
    echo "vercel login"
    exit 1
fi

# Navigate to resident-app directory
cd apps/resident-app

echo -e "${BLUE}📦 Building resident-app...${NC}"
pnpm build

echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
vercel --prod

echo -e "${GREEN}✅ Resident App deployed successfully!${NC}"

# Go back to root
cd ../..

echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Check your Vercel dashboard for deployment status"
echo "2. Test PWA functionality (install, offline mode)"
echo "3. Verify service worker registration"
echo "4. Test push notifications if enabled"
echo "5. Update app stores if applicable"