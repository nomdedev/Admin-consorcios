#!/bin/bash
# =============================================================================
# VecinoSimple - Deploy Admin Web
# =============================================================================
# Deploy del portal de administradores a Vercel
# Uso: ./deploy-admin.sh
# =============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  🚀 Deploy Admin Web (Vercel)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd apps/admin-web

echo -e "${YELLOW}🖥️  Deploying Admin Portal...${NC}"
echo -e "${YELLOW}   URL: https://admin.vecinosimple.com${NC}"
echo ""

# Verificar que vercel CLI esté instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI no está instalado${NC}"
    echo -e "${YELLOW}Instala con: npm install -g vercel${NC}"
    exit 1
fi

# Verificar que estamos logueados
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ No estás logueado en Vercel${NC}"
    echo -e "${YELLOW}Login con: vercel login${NC}"
    exit 1
fi

# Build primero
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# Deploy
echo -e "${YELLOW}📦 Deploying to Vercel...${NC}"
vercel --prod

echo ""
echo -e "${GREEN}✅ Admin Web deploy completado!${NC}"
echo -e "${GREEN}📍 URL: https://admin.vecinosimple.com${NC}"
echo -e "${BLUE}========================================${NC}"