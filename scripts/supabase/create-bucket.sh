#!/usr/bin/env bash
# Script para crear bucket en Supabase usando supabase CLI
# Requiere: supabase CLI instalado y logueado (supabase login)
# Uso: ./scripts/supabase/create-bucket.sh <project-ref> <bucket-name>

set -euo pipefail
PROJECT_REF=${1:-supabase-purple-dog}
BUCKET_NAME=${2:-vecinosimple-uploads}

if [ -z "$PROJECT_REF" ]; then
  echo "Usage: $0 <project-ref> [bucket-name]"
  exit 1
fi

echo "Creando bucket '$BUCKET_NAME' en proyecto $PROJECT_REF... (project-ref por defecto: supabase-purple-dog)"

# Asegurate de tener SUPABASE_ACCESS_TOKEN o haber hecho supabase login
supabase --project $PROJECT_REF storage create-bucket "$BUCKET_NAME" --public=false

echo "Bucket creado. Obtener Service Role Key desde Dashboard → Project → Settings → API"

echo "Recomendación: copiar SERVICE_ROLE_KEY a Railway (variable SUPABASE_SERVICE_ROLE_KEY) y ANON key a Vercel (NEXT_PUBLIC_SUPABASE_ANON_KEY)"
