#!/usr/bin/env bash
# Script para configurar integración completa de Supabase
# Uso: ./scripts/setup-supabase.sh

set -euo pipefail

echo "🚀 Configuración de Supabase para VecinoSimple"
echo "=============================================="

# Verificar si supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no está instalado."
    echo "📦 Instálalo desde: https://supabase.com/docs/guides/cli"
    echo "   npm install -g supabase"
    exit 1
fi

# Verificar si estamos logueados
if ! supabase projects list &> /dev/null; then
    echo "❌ No estás logueado en Supabase CLI."
    echo "🔐 Ejecuta: supabase login"
    exit 1
fi

echo "✅ Supabase CLI está configurado"

# Obtener lista de proyectos
echo "📋 Tus proyectos de Supabase:"
supabase projects list

echo ""
echo "🔧 Configuración requerida:"
echo "1. Ve a https://supabase.com/dashboard/projects"
echo "2. Selecciona tu proyecto (o crea uno nuevo)"
echo "3. Ve a Settings → API"
echo "4. Copia los siguientes valores:"
echo "   - Project URL"
echo "   - anon/public key"
echo "   - service_role key"
echo ""

read -p "Ingresa el Project Ref (ej: supabase-purple-dog): " PROJECT_REF
read -p "Ingresa el Project URL: " SUPABASE_URL
read -p "Ingresa el anon key: " ANON_KEY
read -p "Ingresa el service_role key: " SERVICE_ROLE_KEY

# Crear bucket si no existe
echo "📦 Creando bucket de storage..."
supabase --project "$PROJECT_REF" storage create-bucket vecinosimple-uploads --public=false

# Configurar políticas de storage (permitir uploads desde backend)
echo "🔒 Configurando políticas de storage..."
# Nota: Las políticas se configuran desde el dashboard o con SQL

# Actualizar variables de entorno
echo "📝 Actualizando variables de entorno..."

# .env local
cat >> .env << EOF

# Supabase (actualizado automáticamente)
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
SUPABASE_BUCKET=vecinosimple-uploads
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
EOF

echo "✅ Variables agregadas a .env"

# Crear templates para Railway y Vercel
echo "📄 Creando templates de variables de entorno..."

# Railway (backend)
cat > scripts/envs/railway.env.template << EOF
# Railway - Variables de entorno para backend
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
SUPABASE_BUCKET=vecinosimple-uploads
EOF

# Vercel Admin
cat > scripts/envs/vercel.admin.env.template << EOF
# Vercel Admin-Web - Variables de entorno
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
EOF

# Vercel Resident
cat > scripts/envs/vercel.resident.env.template << EOF
# Vercel Resident-App - Variables de entorno
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
EOF

# Vercel Staff
cat > scripts/envs/vercel.staff.env.template << EOF
# Vercel Staff-App - Variables de entorno
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
EOF

echo "✅ Templates creados"

echo ""
echo "🎯 Próximos pasos:"
echo "1. Configura las variables en Railway (backend):"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - SUPABASE_BUCKET"
echo ""
echo "2. Configura las variables en Vercel (cada app):"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - NEXT_PUBLIC_API_URL"
echo ""
echo "3. Verifica que el bucket existe en Supabase Dashboard → Storage"
echo ""
echo "4. Prueba la integración ejecutando:"
echo "   pnpm run type-check"
echo "   pnpm run build"
echo ""
echo "5. Si usas v0.dev, asegúrate de que las variables estén configuradas ahí también"
echo ""
echo "✅ Configuración completada!"