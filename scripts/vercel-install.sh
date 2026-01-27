#!/bin/bash
# Script para instalar dependencias en monorepo para Vercel
set -e

# Habilitar pnpm
corepack enable pnpm

# Instalar dependencias desde el directorio raíz
pnpm install --no-frozen-lockfile
