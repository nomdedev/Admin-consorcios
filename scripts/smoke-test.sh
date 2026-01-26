#!/bin/bash
# =============================================================================
# VecinoSimple - Script de Smoke Tests Post-Deploy
# =============================================================================
# Verifica que los endpoints críticos están funcionando después del deploy
# Uso: ./smoke-test.sh <api-url>
# Ejemplo: ./smoke-test.sh https://api.vecinosimple.com
# =============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# URL base de la API
API_URL=${1:-"http://localhost:3001"}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  VecinoSimple - Smoke Tests${NC}"
echo -e "${YELLOW}  API URL: ${API_URL}${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

PASSED=0
FAILED=0

# Función para test de endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local path=$3
    local expected_status=$4
    local data=$5
    
    echo -n "Testing: $name... "
    
    if [ "$method" = "GET" ]; then
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}${path}" 2>/dev/null || echo "000")
    else
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${API_URL}${path}" 2>/dev/null || echo "000")
    fi
    
    if [ "$RESPONSE" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $RESPONSE)"
        PASSED=$((PASSED+1))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $RESPONSE)"
        FAILED=$((FAILED+1))
    fi
}

# =============================================================================
# Tests
# =============================================================================

echo -e "${YELLOW}--- Health Checks ---${NC}"
test_endpoint "Health Check" "GET" "/health" "200"

echo ""
echo -e "${YELLOW}--- Auth Endpoints ---${NC}"
test_endpoint "Login endpoint exists" "POST" "/auth/login" "400"  # 400 porque falta body
test_endpoint "Verify endpoint exists" "POST" "/auth/verify" "400"

echo ""
echo -e "${YELLOW}--- Public Endpoints ---${NC}"
test_endpoint "Swagger docs" "GET" "/api" "200"

echo ""
echo -e "${YELLOW}--- Protected Endpoints (should 401) ---${NC}"
test_endpoint "Consorcios requires auth" "GET" "/consorcios" "401"
test_endpoint "Usuarios requires auth" "GET" "/usuarios" "401"
test_endpoint "Expensas requires auth" "GET" "/expensas" "401"

echo ""
echo -e "${YELLOW}--- Webhook Endpoints ---${NC}"
test_endpoint "MP Webhook exists" "POST" "/webhooks/mercadopago" "400"  # 400 sin firma

# =============================================================================
# Database connectivity (via health check)
# =============================================================================
echo ""
echo -e "${YELLOW}--- Database Check ---${NC}"
HEALTH_RESPONSE=$(curl -s "${API_URL}/health" 2>/dev/null || echo "{}")
if echo "$HEALTH_RESPONSE" | grep -q '"database":"ok"'; then
    echo -e "Database connectivity: ${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED+1))
elif echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "Database connectivity: ${GREEN}✓ PASS${NC} (health OK)"
    PASSED=$((PASSED+1))
else
    echo -e "Database connectivity: ${RED}✗ FAIL${NC}"
    echo "Response: $HEALTH_RESPONSE"
    FAILED=$((FAILED+1))
fi

# =============================================================================
# Resumen
# =============================================================================
echo ""
echo -e "${YELLOW}========================================${NC}"
TOTAL=$((PASSED+FAILED))
echo -e "  Total: ${TOTAL} tests"
echo -e "  ${GREEN}Passed: ${PASSED}${NC}"
echo -e "  ${RED}Failed: ${FAILED}${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}  ✓ Smoke tests exitosos${NC}"
    echo -e "${YELLOW}========================================${NC}"
    exit 0
else
    echo -e "${RED}  ⚠ Algunos tests fallaron${NC}"
    echo -e "${YELLOW}========================================${NC}"
    exit 1
fi
