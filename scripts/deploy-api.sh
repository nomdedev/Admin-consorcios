#!/bin/bash
# =============================================================================
# VecinoSimple - Deploy API Backend
# =============================================================================
# Deploy del backend NestJS a Railway
# Uso: ./deploy-api.sh
# =============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  🚀 Deploy API Backend (Railway)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd apps/api

echo -e "${YELLOW}📦 Deploying to Railway...${NC}"
echo -e "${YELLOW}   URL: https://api.vecinosimple.com${NC}"
echo ""

# Verificar que railway CLI esté instalado
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI no está instalado${NC}"
    echo -e "${YELLOW}Instala con: npm install -g @railway/cli${NC}"
    exit 1
fi

# Verificar que estamos logueados
if ! railway status &> /dev/null; then
    echo -e "${RED}❌ No estás logueado en Railway${NC}"
    echo -e "${YELLOW}Login con: railway login${NC}"
    exit 1
fi

# Deploy
railway deploy

echo ""
echo -e "${GREEN}✅ API Backend deploy completado!${NC}"
echo -e "${GREEN}📍 URL: https://api.vecinosimple.com${NC}"
echo -e "${BLUE}========================================${NC}"