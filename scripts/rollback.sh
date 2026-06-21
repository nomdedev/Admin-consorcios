#!/bin/bash
# VecinoSimple - Rollback de Producción
# Revierte el último deploy en caso de problemas críticos
# Uso: ./scripts/rollback.sh [VERSION_ANTERIOR]

set -e

VERSION="${1:-HEAD~1}"

echo "⚠️  VecinoSimple - Rollback de Producción"
echo "========================================"
echo "Versión objetivo: $VERSION"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Ejecutar desde la raíz del proyecto"
    exit 1
fi

echo "🔄 Revirtiendo código a $VERSION..."

# Revertir al commit anterior
git reset --hard "$VERSION"
git push --force-with-lease origin main

echo "✅ Código revertido"
echo ""

# Nota: Los servicios como Vercel y Railway deberían redeploy automáticamente
# con el código anterior

echo "📋 Servicios que se redeploy automáticamente:"
echo "   - Vercel (admin-web, resident-app, staff-app)"
echo "   - Railway (api)"
echo ""

echo "⏳ Esperando redeploys... (aprox. 2-3 minutos)"
sleep 120

echo ""
echo "🔍 Verificando servicios..."

# Verificar API
if [ -n "$API_URL" ]; then
    if curl -f -s "$API_URL/health" > /dev/null 2>&1; then
        echo "✅ API: OK"
    else
        echo "❌ API: FALLÓ"
    fi
fi

# Verificar frontends
if [ -n "$ADMIN_WEB_URL" ]; then
    if curl -f -s "$ADMIN_WEB_URL" > /dev/null 2>&1; then
        echo "✅ Admin Web: OK"
    else
        echo "❌ Admin Web: FALLÓ"
    fi
fi

if [ -n "$RESIDENT_APP_URL" ]; then
    if curl -f -s "$RESIDENT_APP_URL" > /dev/null 2>&1; then
        echo "✅ Resident App: OK"
    else
        echo "❌ Resident App: FALLÓ"
    fi
fi

if [ -n "$STAFF_APP_URL" ]; then
    if curl -f -s "$STAFF_APP_URL" > /dev/null 2>&1; then
        echo "✅ Staff App: OK"
    else
        echo "❌ Staff App: FALLÓ"
    fi
fi

echo ""
echo "========================================"
echo "✅ Rollback completado"
echo "========================================"
echo ""
echo "📞 Notificar al equipo sobre el rollback"
echo "🐛 Investigar la causa del problema antes del próximo deploy"
echo "📊 Revisar logs de error para debugging"