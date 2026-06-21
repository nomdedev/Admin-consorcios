#!/bin/bash
# VecinoSimple - Smoke Tests Post-Deploy
# Valida que la aplicación esté funcionando correctamente
# Uso: ./scripts/smoke-test.sh [API_URL]

set -e

API_URL="${1:-http://localhost:4000}"

echo "🧪 VecinoSimple - Smoke Tests"
echo "============================="
echo "API URL: $API_URL"
echo ""

# Función para hacer requests HTTP
make_request() {
    local url="$1"
    local method="${2:-GET}"
    local expected_status="${3:-200}"
    local description="$4"

    echo "🔍 Testing: $description"
    echo "   URL: $url"
    echo "   Method: $method"

    if command -v curl &> /dev/null; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" 2>/dev/null)
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
    else
        echo "❌ curl no está disponible"
        return 1
    fi

    if [ "$http_code" -eq "$expected_status" ]; then
        echo "✅ PASSED (HTTP $http_code)"
        return 0
    else
        echo "❌ FAILED (HTTP $http_code)"
        echo "   Response: $body"
        return 1
    fi
}

# Array para trackear fallos
failed_tests=()

# Test 1: Health Check
if ! make_request "$API_URL/health" "GET" "200" "API Health Check"; then
    failed_tests+=("health")
fi

echo ""

# Test 2: API Documentation (Swagger)
if ! make_request "$API_URL/api/docs" "GET" "200" "Swagger Documentation"; then
    failed_tests+=("swagger")
fi

echo ""

# Test 3: CORS Headers (si es una API REST)
echo "🔍 Testing: CORS Headers"
echo "   URL: $API_URL/health"
if command -v curl &> /dev/null; then
    cors_headers=$(curl -s -I -X OPTIONS "$API_URL/health" 2>/dev/null | grep -i "access-control" | wc -l)
    if [ "$cors_headers" -gt 0 ]; then
        echo "✅ PASSED (CORS headers presentes)"
    else
        echo "⚠️  WARNING: No se encontraron headers CORS (podría ser normal si no se usan)"
    fi
else
    echo "❌ curl no disponible para test CORS"
fi

echo ""

# Test 4: Database Connection (endpoint específico si existe)
# Nota: Este test asume que hay un endpoint /api/health/db o similar
if make_request "$API_URL/api/health/db" "GET" "200" "Database Connection" 2>/dev/null; then
    echo "✅ PASSED (Database connection)"
else
    echo "⚠️  WARNING: No se pudo verificar conexión a BD (endpoint no disponible)"
fi

# Test 5: Frontend apps accessibility (opcional)
echo "🔍 Testing: Frontend Apps Accessibility"
echo "   Admin Web: $ADMIN_WEB_URL"
echo "   Resident App: $RESIDENT_APP_URL"
echo "   Staff App: $STAFF_APP_URL"

if [ -n "$ADMIN_WEB_URL" ]; then
    if make_request "$ADMIN_WEB_URL" "GET" "200" "Admin Web" 2>/dev/null; then
        echo "✅ PASSED (Admin Web accessible)"
    else
        echo "⚠️  WARNING: Admin Web not accessible (might be deploying)"
    fi
fi

if [ -n "$RESIDENT_APP_URL" ]; then
    if make_request "$RESIDENT_APP_URL" "GET" "200" "Resident App" 2>/dev/null; then
        echo "✅ PASSED (Resident App accessible)"
    else
        echo "⚠️  WARNING: Resident App not accessible (might be deploying)"
    fi
fi

if [ -n "$STAFF_APP_URL" ]; then
    if make_request "$STAFF_APP_URL" "GET" "200" "Staff App" 2>/dev/null; then
        echo "✅ PASSED (Staff App accessible)"
    else
        echo "⚠️  WARNING: Staff App not accessible (might be deploying)"
    fi
fi

echo ""
echo "============================="

# Resultado final
if [ ${#failed_tests[@]} -eq 0 ]; then
    echo "✅ TODOS LOS SMOKE TESTS PASARON"
    echo "🎉 La aplicación está lista para producción"
    exit 0
else
    echo "❌ ALGUNOS TESTS FALLARON: ${failed_tests[*]}"
    echo ""
    echo "📋 Posibles causas:"
    echo "   - API no está ejecutándose"
    echo "   - Base de datos no está accesible"
    echo "   - Variables de entorno mal configuradas"
    echo "   - Puerto incorrecto"
    echo ""
    echo "🔧 Verificar:"
    echo "   - Logs de la aplicación"
    echo "   - Conexión a base de datos"
    echo "   - Variables de entorno"
    exit 1
fi