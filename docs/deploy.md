# Guía de Despliegue - VecinoSimple

Fecha: 26 de enero de 2026

Resumen rápido
- Deploy recomendado: Frontends (Next.js) por app en Vercel; Backend (NestJS) en Railway (u otro PaaS que soporte procesos persistentes).
- Motivo: despliegues por-app aíslan fallos, permiten previews por PR y aceleran builds en monorepo pnpm/turbo.

1. Estrategia recomendada
- Crear un Project en Vercel por cada app Next.js:
  - `apps/admin-web` → Project admin-web (Root Directory: `apps/admin-web`)
  - `apps/resident-app` → Project resident-app (Root Directory: `apps/resident-app`)
  - `apps/staff-app` → Project staff-app (Root Directory: `apps/staff-app`)
- Mantener `apps/api` desplegada en Railway (o en un host con soporte para procesos y migraciones).
- Razón: build-ea la raíz para instalar paquetes workspace pero build-a solo la carpeta Root Directory; así `packages/*` están disponibles.

2. Configuración Vercel por Project
- Root Directory: la ruta relativa (`apps/...`).
- Install Command: `pnpm install --frozen-lockfile` (Vercel detecta pnpm si está `pnpm-lock.yaml`).
- Build Command: usar el script local de la app (`pnpm build`) o dejar Next.js preset.
- Environment Variables: definir por Project (no usar variables públicas compartidas). Lista mínima más abajo.
- Preview Deployments: habilitar para PRs (por defecto en Vercel).

3. Backend (Railway) y migraciones
- NO ejecutar migraciones desde builds de Vercel.
- Flujo seguro recomendado:
  1. Ejecutar migraciones en CI con `prisma migrate deploy` apuntando a `PROD_DATABASE_URL`.
  2. Desplegar backend en Railway (o reemplazar con deploy automatizado que haga health checks).
  3. Ejecutar smoke-tests contra el backend.
  4. Desplegar frontends (Vercel projects) si todo OK.

Comando ejemplo (local / CI):
```bash
pnpm install --frozen-lockfile
pnpm --filter apps/api run prisma:migrate:deploy
```

4. Variables de entorno recomendadas (por Project)
- Backend (`apps/api` / Railway):
  - `DATABASE_URL` (producción)
  - `JWT_SECRET`
  - `JWT_ISSUER`, `JWT_AUDIENCE`
  - `S3_BUCKET`, `S3_KEY`, `S3_SECRET`
  - `MERCADO_PAGO_KEY`, `MERCADO_PAGO_SECRET`
  - `SENTRY_DSN`
- Frontends (por projecto en Vercel):
  - `NEXT_PUBLIC_API_URL` (URL pública del API)
  - `NEXT_PUBLIC_SENTRY_DSN` (opcional)
  - `NEXTAUTH_URL` o url de auth si aplica

5. Migrations y backward-compatibility
- Evitar cambios destructivos: pasos seguros:
  1. Añadir columna nullable o flag.
  2. Desplegar código que escriba en la nueva columna opcional.
  3. Backfill datos si aplica.
  4. Hacer la columna NOT NULL y desplegar cleanup.

6. Smoke-tests (ejemplo)
- Crear script `scripts/smoke-test.sh` que valide endpoints críticos:
```bash
#!/usr/bin/env bash
set -e
curl -fS --retry 3 "${API_URL}/health" || exit 1
curl -fS --retry 3 "${API_URL}/mi-portal/mis-datos" -H "Authorization: Bearer ${SMOKE_TOKEN}" || exit 1
echo "smoke tests passed"
```

7. Ejemplo de GitHub Actions (migraciones + smoke + deploy backend)
```yaml
name: Deploy Backend
on:
  push:
    branches: [ main, master ]

jobs:
  migrate-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install
        run: pnpm install --frozen-lockfile
      - name: Run Migrations
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
        run: pnpm --filter apps/api run prisma:migrate:deploy
      - name: Deploy to Railway (or other)
        run: |
          echo "Trigger deploy on Railway or run your deploy CLI here"
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      - name: Smoke tests
        env:
          API_URL: ${{ secrets.PROD_API_URL }}
          SMOKE_TOKEN: ${{ secrets.SMOKE_TOKEN }}
        run: ./scripts/smoke-test.sh
```

8. Rolling/zero-downtime and maintenance
- Usar health checks y mantener réplicas hasta que la nueva versión pase checks.
- Si necesitás hacer mantenimiento que afecte escrituras, activar modo `read-only` temporal en la API o usar feature flags para degradar funciones.
- Para pagos: planificar ventana de mantenimiento OFF-PEAK y comunicar a usuarios.

9. Backups y monitoreo (mínimos)
- Configurar backups automáticos de DB (Railway/Postgres snapshots).
- Configurar Sentry y alertas básicas (5xx, error rate > X).
- Registrar y monitorizar `prisma.migrate` fallos.

10. Checklist antes de deploy a producción
- [ ] Rotar secrets comprometidos (si aplica)
- [ ] CI corre y pasa tests unitarios + integración mínima
- [ ] Migraciones aplicadas en CI y verificadas
- [ ] Smoke-tests pasan
- [ ] Secrets y domains configurados en Vercel/Railway
- [ ] Monitoreo/Sentry habilitado

11. Links útiles
- Vercel docs: https://vercel.com/docs
- Railway docs: https://docs.railway.app/
- Prisma migrations: https://www.prisma.io/docs/

---

Si querés, puedo:
- generar el workflow de GitHub Actions en `.github/workflows/deploy-backend.yml` (lo relleno con el snippet anterior),
- añadir `scripts/smoke-test.sh` en `scripts/` y marcar en CI su ejecución.
