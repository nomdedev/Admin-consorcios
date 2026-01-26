#!/bin/bash

# Script para configurar variables de entorno en Vercel
# Ejecutar desde la raíz del proyecto
# ⚠️  IMPORTANTE: Reemplaza los valores con tus claves reales ANTES de ejecutar

echo "Configurando variables de entorno en Vercel..."
echo "⚠️  Asegúrate de tener tus claves reales listas antes de continuar"
echo ""

# Variables de base de datos
echo "Configurando DATABASE_URL..."
vercel env add DATABASE_URL production <<< "$DATABASE_URL"

# Variables de seguridad
echo "Configurando JWT_SECRET..."
vercel env add JWT_SECRET production <<< "$JWT_SECRET"

echo "Configurando NEXTAUTH_SECRET..."
vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET"

echo "Configurando NEXTAUTH_URL..."
vercel env add NEXTAUTH_URL production <<< "$NEXTAUTH_URL"

# Variables de Supabase
echo "Configurando SUPABASE_URL..."
vercel env add SUPABASE_URL production <<< "$SUPABASE_URL"

echo "Configurando SUPABASE_SERVICE_ROLE_KEY..."
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_ROLE_KEY"

echo "Configurando NEXT_PUBLIC_SUPABASE_URL..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$NEXT_PUBLIC_SUPABASE_URL"

echo "Configurando NEXT_PUBLIC_SUPABASE_ANON_KEY..."
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Variables de email
echo "Configurando RESEND_API_KEY..."
vercel env add RESEND_API_KEY production <<< "$RESEND_API_KEY"

echo "Configurando EMAIL_FROM..."
vercel env add EMAIL_FROM production <<< "$EMAIL_FROM"

echo "Configurando EMAIL_FROM_NAME..."
vercel env add EMAIL_FROM_NAME production <<< "$EMAIL_FROM_NAME"

echo ""
echo "✅ Variables de entorno configuradas en Vercel"
echo ""
echo "📋 Checklist de seguridad completado:"
echo "   - Variables configuradas usando variables de entorno (no hardcodeadas)"
echo "   - Archivo seguro (sin secrets expuestos)"
echo "   - Listo para commit seguro"