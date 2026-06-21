#!/bin/bash
# VecinoSimple - Script de Deploy de Base de Datos
# Ejecuta migraciones de Prisma en producción
# Uso: ./scripts/deploy-db.sh

set -e

echo "🚀 VecinoSimple - Deploy de Base de Datos"
echo "=========================================="

# Verificar que DATABASE_URL esté configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurada"
    echo "Configura la variable de entorno DATABASE_URL con la conexión a producción"
    exit 1
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Ejecutar desde la raíz del proyecto"
    exit 1
fi

echo "📦 Instalando dependencias..."
npm install --frozen-lockfile

echo "🗄️  Generando cliente Prisma..."
npm run db:generate

echo "🔄 Ejecutando migraciones..."
npm run db:migrate

echo "✅ Verificando conexión a base de datos..."
npx prisma db pull --force

echo "=========================================="
echo "✅ Deploy de base de datos completado exitosamente"
echo "=========================================="