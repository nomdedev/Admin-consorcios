#!/bin/bash

# Pre-deployment verification script for VecinoSimple
# Usage: ./scripts/pre-deploy-verification.sh [admin-web|resident-app|staff-app|all]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to verify a specific app
verify_app() {
    local app_name=$1
    local app_dir="apps/$app_name"

    echo -e "${BLUE}🔍 Verifying $app_name...${NC}"

    # Check if app directory exists
    if [ ! -d "$app_dir" ]; then
        echo -e "${RED}❌ App directory $app_dir not found${NC}"
        return 1
    fi

    # Navigate to app directory
    cd "$app_dir"

    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ package.json not found in $app_dir${NC}"
        cd ../..
        return 1
    fi

    # Check if vercel.json exists
    if [ ! -f "vercel.json" ]; then
        echo -e "${RED}❌ vercel.json not found in $app_dir${NC}"
        cd ../..
        return 1
    fi

    # Check if next.config.js exists
    if [ ! -f "next.config.js" ]; then
        echo -e "${YELLOW}⚠️  next.config.js not found in $app_dir${NC}"
    fi

    # Check if src/app directory exists
    if [ ! -d "src/app" ]; then
        echo -e "${RED}❌ src/app directory not found in $app_dir${NC}"
        cd ../..
        return 1
    fi

    # Check for required error pages
    local required_pages=("error.tsx" "not-found.tsx")
    for page in "${required_pages[@]}"; do
        if [ ! -f "src/app/$page" ]; then
            echo -e "${YELLOW}⚠️  $page not found in $app_dir/src/app${NC}"
        fi
    done

    # App-specific checks
    case $app_name in
        "resident-app"|"staff-app")
            # Check for offline page
            if [ ! -f "src/app/offline/page.tsx" ]; then
                echo -e "${YELLOW}⚠️  offline/page.tsx not found in $app_dir/src/app${NC}"
            fi

            # Check for maintenance page
            if [ ! -f "src/app/mantenimiento/page.tsx" ]; then
                echo -e "${YELLOW}⚠️  mantenimiento/page.tsx not found in $app_dir/src/app${NC}"
            fi

            # Check for PWA files
            if [ ! -f "public/manifest.json" ]; then
                echo -e "${YELLOW}⚠️  manifest.json not found in $app_dir/public${NC}"
            fi
            ;;
    esac

    # Try to build the app
    echo -e "${BLUE}🔨 Testing build for $app_name...${NC}"
    if pnpm build > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Build successful for $app_name${NC}"
    else
        echo -e "${RED}❌ Build failed for $app_name${NC}"
        cd ../..
        return 1
    fi

    # Go back to root
    cd ../..

    echo -e "${GREEN}✅ $app_name verification passed${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [admin-web|resident-app|staff-app|all]"
    echo ""
    echo "This script verifies that all required files and configurations"
    echo "are present before deployment."
    echo ""
    echo "Examples:"
    echo "  $0 admin-web     # Verify only admin-web"
    echo "  $0 resident-app  # Verify only resident-app"
    echo "  $0 staff-app     # Verify only staff-app"
    echo "  $0 all          # Verify all apps"
}

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed or not in PATH${NC}"
    exit 1
fi

# Get the target app from arguments
TARGET_APP=$1

if [ -z "$TARGET_APP" ]; then
    echo -e "${RED}❌ No target app specified${NC}"
    echo ""
    show_usage
    exit 1
fi

echo -e "${BLUE}🚀 Starting pre-deployment verification...${NC}"
echo ""

case $TARGET_APP in
    "admin-web")
        verify_app "admin-web"
        ;;
    "resident-app")
        verify_app "resident-app"
        ;;
    "staff-app")
        verify_app "staff-app"
        ;;
    "all")
        echo -e "${YELLOW}🔍 Verifying all apps...${NC}"
        verify_app "admin-web"
        echo ""
        verify_app "resident-app"
        echo ""
        verify_app "staff-app"
        ;;
    *)
        echo -e "${RED}❌ Invalid target app: $TARGET_APP${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Pre-deployment verification completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Ready for deployment. You can now run:${NC}"
echo "  ./scripts/deploy.sh $TARGET_APP"