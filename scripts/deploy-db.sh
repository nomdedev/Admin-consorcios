#!/bin/bash
# =============================================================================
# VecinoSimple - Script de Deploy de Base de Datos
# =============================================================================
# Uso: ./deploy-db.sh <environment>
# Ejemplo: ./deploy-db.sh production
# =============================================================================

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validar argumento
ENVIRONMENT=${1:-staging}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  VecinoSimple - Database Deploy${NC}"
echo -e "${YELLOW}  Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Validar que existe el archivo .env correspondiente
ENV_FILE=".env.${ENVIRONMENT}"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: No se encontró ${ENV_FILE}${NC}"
    echo "Crea el archivo con DATABASE_URL configurado"
    exit 1
fi

# Cargar variables
export $(grep -v '^#' $ENV_FILE | xargs)

# Validar DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL no está configurado en ${ENV_FILE}${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Configuración cargada${NC}"

# Ir al directorio de la API
cd apps/api

# Generar cliente Prisma
echo ""
echo -e "${YELLOW}Generando cliente Prisma...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Cliente generado${NC}"

# Verificar estado de migraciones pendientes
echo ""
echo -e "${YELLOW}Verificando migraciones pendientes...${NC}"
PENDING=$(npx prisma migrate status 2>&1 || true)

if echo "$PENDING" | grep -q "following migrations have not yet been applied"; then
    echo -e "${YELLOW}Hay migraciones pendientes:${NC}"
    echo "$PENDING"
    echo ""
    
    # Confirmación en producción
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${RED}⚠️  ADVERTENCIA: Estás a punto de ejecutar migraciones en PRODUCCIÓN${NC}"
        read -p "¿Continuar? (yes/no): " CONFIRM
        if [ "$CONFIRM" != "yes" ]; then
            echo "Deploy cancelado"
            exit 0
        fi
    fi
    
    # Ejecutar migraciones
    echo ""
    echo -e "${YELLOW}Ejecutando migraciones...${NC}"
    npx prisma migrate deploy
    echo -e "${GREEN}✓ Migraciones aplicadas${NC}"
else
    echo -e "${GREEN}✓ No hay migraciones pendientes${NC}"
fi

# Verificar conexión
echo ""
echo -e "${YELLOW}Verificando conexión a la base de datos...${NC}"
npx prisma db execute --stdin <<< "SELECT 1"
echo -e "${GREEN}✓ Conexión exitosa${NC}"

# Resumen
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deploy de base de datos completado${NC}"
echo -e "${GREEN}========================================${NC}"
