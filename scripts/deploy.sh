#!/bin/bash

# Deploy VecinoSimple Apps to Vercel
# Usage: ./scripts/deploy.sh [admin-web|resident-app|staff-app|all]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to deploy a specific app
deploy_app() {
    local app_name=$1
    local app_dir="apps/$app_name"

    echo -e "${BLUE}🚀 Deploying $app_name...${NC}"

    # Check if app directory exists
    if [ ! -d "$app_dir" ]; then
        echo -e "${RED}❌ App directory $app_dir not found${NC}"
        return 1
    fi

    # Navigate to app directory
    cd "$app_dir"

    echo -e "${BLUE}📦 Building $app_name...${NC}"
    pnpm build

    echo -e "${BLUE}🚀 Deploying $app_name to Vercel...${NC}"
    vercel --prod

    echo -e "${GREEN}✅ $app_name deployed successfully!${NC}"

    # Go back to root
    cd ../..
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [admin-web|resident-app|staff-app|all]"
    echo ""
    echo "Examples:"
    echo "  $0 admin-web     # Deploy only admin-web"
    echo "  $0 resident-app  # Deploy only resident-app"
    echo "  $0 staff-app     # Deploy only staff-app"
    echo "  $0 all          # Deploy all apps"
    echo ""
    echo "Individual deploy scripts are also available:"
    echo "  ./scripts/deploy-admin-web.sh"
    echo "  ./scripts/deploy-resident-app.sh"
    echo "  ./scripts/deploy-staff-app.sh"
}

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

# Get the target app from arguments
TARGET_APP=$1

case $TARGET_APP in
    "admin-web")
        deploy_app "admin-web"
        ;;
    "resident-app")
        deploy_app "resident-app"
        ;;
    "staff-app")
        deploy_app "staff-app"
        ;;
    "all")
        echo -e "${YELLOW}🚀 Deploying all apps...${NC}"
        deploy_app "admin-web"
        echo ""
        deploy_app "resident-app"
        echo ""
        deploy_app "staff-app"
        ;;
    *)
        echo -e "${RED}❌ Invalid target app: $TARGET_APP${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Check your Vercel dashboard for deployment status"
echo "2. Test all deployed applications"
echo "3. Update DNS records if needed"
echo "4. Notify stakeholders of the new deployments"
echo "5. Monitor error logs and performance metrics"