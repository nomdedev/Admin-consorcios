#!/usr/bin/env bash
# Genera comandos CLI listos para ejecutar en Railway y Vercel
# No modifica nada; imprime los comandos para que los pegues.

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RAILWAY_TEMPLATE="$ROOT_DIR/envs/railway.env.template"
VERCEL_ADMIN_TEMPLATE="$ROOT_DIR/envs/vercel.admin.env.template"
VERCEL_RESIDENT_TEMPLATE="$ROOT_DIR/envs/vercel.resident.env.template"
VERCEL_STAFF_TEMPLATE="$ROOT_DIR/envs/vercel.staff.env.template"

echo "# Comandos generados a partir de templates en scripts/envs"

echo "\n## Railway (reemplaza <PROJECT_ID> por tu project id si hace falta)"
if [ -f "$RAILWAY_TEMPLATE" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    # skip comments and empty lines
    [[ "$line" =~ ^# ]] && continue
    [[ -z "$line" ]] && continue
    key=$(echo "$line" | sed 's/=.*//')
    value=$(echo "$line" | sed 's/^[^=]*=//')
    printf 'railway variables set %s "<valor_para_%s>" --project <PROJECT_ID>\n' "$key" "$key"
  done < "$RAILWAY_TEMPLATE"
else
  echo "No se encontró $RAILWAY_TEMPLATE"
fi

echo "\n## Vercel - admin-web (reemplaza <VERCEL_PROJECT> por tu proyecto)"
if [ -f "$VERCEL_ADMIN_TEMPLATE" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    [[ "$line" =~ ^# ]] && continue
    [[ -z "$line" ]] && continue
    key=$(echo "$line" | sed 's/=.*//')
    value=$(echo "$line" | sed 's/^[^=]*=//')
    printf 'vercel env add %s production "<valor_para_%s>" --token $VERCEL_TOKEN --scope <VERCEL_PROJECT>\n' "$key" "$key"
  done < "$VERCEL_ADMIN_TEMPLATE"
else
  echo "No se encontró $VERCEL_ADMIN_TEMPLATE"
fi

echo "\n## Vercel - resident-app"
if [ -f "$VERCEL_RESIDENT_TEMPLATE" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    [[ "$line" =~ ^# ]] && continue
    [[ -z "$line" ]] && continue
    key=$(echo "$line" | sed 's/=.*//')
    printf 'vercel env add %s production "<valor_para_%s>" --token $VERCEL_TOKEN --scope <VERCEL_PROJECT>\n' "$key" "$key"
  done < "$VERCEL_RESIDENT_TEMPLATE"
else
  echo "No se encontró $VERCEL_RESIDENT_TEMPLATE"
fi

echo "\n## Vercel - staff-app"
if [ -f "$VERCEL_STAFF_TEMPLATE" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    [[ "$line" =~ ^# ]] && continue
    [[ -z "$line" ]] && continue
    key=$(echo "$line" | sed 's/=.*//')
    printf 'vercel env add %s production "<valor_para_%s>" --token $VERCEL_TOKEN --scope <VERCEL_PROJECT>\n' "$key" "$key"
  done < "$VERCEL_STAFF_TEMPLATE"
else
  echo "No se encontró $VERCEL_STAFF_TEMPLATE"
fi

echo "\n# USO:\n# 1) export VERCEL_TOKEN=...\n# 2) Reemplazar <PROJECT_ID> y <VERCEL_PROJECT> en los comandos impresos\n# 3) Ejecutar los comandos uno por uno o pegarlos en la consola\"
