#!/bin/bash
# =============================================================================
# VecinoSimple - Script de Pre-Deploy Checks
# =============================================================================
# Ejecuta todas las verificaciones necesarias antes de un deploy
# Uso: ./pre-deploy-check.sh
# =============================================================================

set -e  # Exit on error

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  VecinoSimple - Pre-Deploy Checks${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

ERRORS=0

# 1. Verificar que estamos en la rama correcta
echo -e "${YELLOW}1. Verificando rama Git...${NC}"
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
    echo -e "${RED}   ⚠ Estás en rama '$BRANCH', no en main/master${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}   ✓ Rama: $BRANCH${NC}"
fi

# 2. Verificar que no hay cambios sin commit
echo ""
echo -e "${YELLOW}2. Verificando cambios pendientes...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}   ⚠ Hay cambios sin commit${NC}"
    git status --short
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}   ✓ Working directory limpio${NC}"
fi

# 3. Instalar dependencias
echo ""
echo -e "${YELLOW}3. Instalando dependencias...${NC}"
npm install --prefer-offline
echo -e "${GREEN}   ✓ Dependencias instaladas${NC}"

# 4. Type check
echo ""
echo -e "${YELLOW}4. Verificando tipos TypeScript...${NC}"
pnpm turbo run type-check 2>&1 || {
    echo -e "${RED}   ⚠ Errores de TypeScript${NC}"
    ERRORS=$((ERRORS+1))
}
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✓ TypeScript OK${NC}"
fi

# 5. Lint
echo ""
echo -e "${YELLOW}5. Ejecutando linter...${NC}"
pnpm turbo run lint 2>&1 || {
    echo -e "${RED}   ⚠ Errores de lint${NC}"
    ERRORS=$((ERRORS+1))
}
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✓ Lint OK${NC}"
fi

# 6. Tests unitarios
echo ""
echo -e "${YELLOW}6. Ejecutando tests unitarios...${NC}"
cd apps/api
npx jest --testRegex "\.spec\.ts$" --passWithNoTests 2>&1 || {
    echo -e "${RED}   ⚠ Tests fallando${NC}"
    ERRORS=$((ERRORS+1))
}
cd ../..
echo -e "${GREEN}   ✓ Tests OK${NC}"

# 7. Build
echo ""
echo -e "${YELLOW}7. Verificando build de producción...${NC}"
pnpm turbo run build 2>&1 || {
    echo -e "${RED}   ⚠ Error en build${NC}"
    ERRORS=$((ERRORS+1))
}
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✓ Build OK${NC}"
fi

# 8. Verificar archivos sensibles
echo ""
echo -e "${YELLOW}8. Verificando archivos sensibles...${NC}"
SENSITIVE_FILES=(".env" ".env.local" ".env.production" "*.pem" "*.key")
FOUND_SENSITIVE=0
for pattern in "${SENSITIVE_FILES[@]}"; do
    if git ls-files --error-unmatch "$pattern" 2>/dev/null; then
        echo -e "${RED}   ⚠ Archivo sensible en git: $pattern${NC}"
        FOUND_SENSITIVE=1
    fi
done
if [ $FOUND_SENSITIVE -eq 0 ]; then
    echo -e "${GREEN}   ✓ No hay archivos sensibles en git${NC}"
else
    ERRORS=$((ERRORS+1))
fi

# Resumen
echo ""
echo -e "${YELLOW}========================================${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}  ✓ Todas las verificaciones pasaron${NC}"
    echo -e "${GREEN}  Listo para deploy${NC}"
    echo -e "${YELLOW}========================================${NC}"
    exit 0
else
    echo -e "${RED}  ⚠ ${ERRORS} verificación(es) fallaron${NC}"
    echo -e "${RED}  Corrige los errores antes de deploy${NC}"
    echo -e "${YELLOW}========================================${NC}"
    exit 1
fi
