#!/bin/bash

# Deploy Admin Web to Vercel
# Usage: ./scripts/deploy-admin-web.sh

set -e

echo "🚀 Deploying Admin Web to Vercel..."

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

# Navigate to admin-web directory
cd apps/admin-web

echo -e "${BLUE}📦 Building admin-web...${NC}"
pnpm build

echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
vercel --prod

echo -e "${GREEN}✅ Admin Web deployed successfully!${NC}"

# Go back to root
cd ../..

echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Check your Vercel dashboard for deployment status"
echo "2. Update DNS records if needed"
echo "3. Test the admin portal functionality"
echo "4. Notify stakeholders of the new deployment"