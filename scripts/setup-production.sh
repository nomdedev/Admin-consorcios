#!/bin/bash
# VecinoSimple - Setup Inicial de Producción
# Configura secrets y valida configuración para primer deploy
# Uso: ./scripts/setup-production.sh

set -e

echo "🚀 VecinoSimple - Setup Inicial de Producción"
echo "=============================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Ejecutar desde la raíz del proyecto"
    exit 1
fi

# Verificar Node.js
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js $NODE_VERSION"

# Verificar npm
echo "📦 Verificando npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✅ npm $NPM_VERSION"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci

# Generar secrets si no existen
echo "🔐 Verificando secrets..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local no encontrado"
    echo "🔧 Creando .env.local con valores de ejemplo..."

    cp .env.example .env.local
    echo "✅ .env.local creado"
    echo ""
    echo "📝 EDITA .env.local con tus valores reales antes de continuar:"
    echo "   - DATABASE_URL"
    echo "   - JWT_SECRET"
    echo "   - NEXTAUTH_SECRET"
    echo "   - SUPABASE_*"
    echo "   - RESEND_API_KEY"
    echo "   - Etc."
    echo ""
    read -p "¿Ya editaste .env.local? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "⏹️  Setup pausado. Edita .env.local y ejecuta nuevamente."
        exit 0
    fi
fi

# Validar secrets
echo "🔍 Validando configuración de secrets..."
if ! node scripts/verify-secrets.js; then
    echo "❌ Configuración de secrets inválida"
    echo "🔧 Revisa y corrige .env.local"
    exit 1
fi

# Verificar builds
echo "🔨 Verificando builds..."
if ! npm run build; then
    echo "❌ Build falló"
    exit 1
fi
echo "✅ Builds exitosos"

# Verificar base de datos (si DATABASE_URL está configurada)
if [ -n "$DATABASE_URL" ]; then
    echo "🗄️  Verificando conexión a base de datos..."
    if npm run db:generate && npm run db:migrate; then
        echo "✅ Base de datos configurada correctamente"
    else
        echo "❌ Error en configuración de base de datos"
        exit 1
    fi
else
    echo "⚠️  DATABASE_URL no configurada - saltando verificación de BD"
fi

echo ""
echo "=============================================="
echo "✅ Setup inicial completado exitosamente!"
echo "=============================================="
echo ""
echo "📋 Próximos pasos:"
echo "1. Configurar servicios externos (Railway, Vercel, Neon, etc.)"
echo "2. Ejecutar: ./scripts/deploy-db.sh (para migrar BD)"
echo "3. Hacer push a main para trigger deploy automático"
echo "4. Ejecutar: ./scripts/smoke-test.sh [API_URL] (para validar)"
echo ""
echo "📚 Documentación:"
echo "   - docs/project/PROD-003-deploy-final.md"
echo "   - docs/infrastructure/INFRA-001-production-setup.md"