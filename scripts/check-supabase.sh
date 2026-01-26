#!/usr/bin/env bash
# Script para verificar configuración de Supabase
# Uso: ./scripts/check-supabase.sh

set -euo pipefail

echo "🔍 Verificando configuración de Supabase"
echo "======================================="

# Verificar variables de entorno
echo "📋 Variables de entorno:"

check_env_var() {
    local var_name=$1
    local var_value=${!var_name:-}

    if [ -n "$var_value" ] && [ "$var_value" != "tu-*" ]; then
        echo "✅ $var_name: configurado"
    else
        echo "❌ $var_name: NO configurado"
        return 1
    fi
}

# Variables requeridas
errors=0

check_env_var SUPABASE_URL || errors=$((errors+1))
check_env_var SUPABASE_SERVICE_ROLE_KEY || errors=$((errors+1))
check_env_var SUPABASE_BUCKET || errors=$((errors+1))
check_env_var NEXT_PUBLIC_SUPABASE_URL || errors=$((errors+1))
check_env_var NEXT_PUBLIC_SUPABASE_ANON_KEY || errors=$((errors+1))

echo ""

# Verificar conectividad
if [ $errors -eq 0 ]; then
    echo "🌐 Probando conectividad con Supabase..."

    # Probar conexión básica (esto requiere curl o similar)
    if command -v curl &> /dev/null; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/" \
            -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY")

        if [ "$response" = "200" ] || [ "$response" = "401" ]; then
            echo "✅ Conectividad: OK (HTTP $response)"
        else
            echo "❌ Conectividad: Error (HTTP $response)"
            errors=$((errors+1))
        fi
    else
        echo "⚠️ No se puede verificar conectividad (curl no disponible)"
    fi
fi

echo ""

# Verificar TypeScript
echo "🔧 Verificando TypeScript..."
if pnpm run type-check 2>/dev/null; then
    echo "✅ TypeScript: OK"
else
    echo "❌ TypeScript: Error"
    errors=$((errors+1))
fi

echo ""

# Resultado final
if [ $errors -eq 0 ]; then
    echo "🎉 ¡Configuración de Supabase correcta!"
    echo ""
    echo "Próximos pasos:"
    echo "1. Asegúrate de que las variables estén en Railway/Vercel"
    echo "2. Verifica que el bucket existe en Supabase Dashboard"
    echo "3. Prueba un build completo: pnpm run build"
    echo "4. Las páginas deberían aparecer en v0.dev"
else
    echo "❌ Hay $errors errores de configuración"
    echo ""
    echo "Soluciones:"
    echo "1. Ejecuta: ./scripts/setup-supabase.sh"
    echo "2. Lee: SUPABASE-SETUP.md"
    echo "3. Verifica las variables de entorno"
fi