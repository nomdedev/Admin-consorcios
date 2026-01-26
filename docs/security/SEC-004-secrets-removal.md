# SEC-004: Rotación de Secrets Comprometidos y Remoción de Archivos

## Resumen del Incidente

Fecha: 2026-01-26  
Severidad: **CRÍTICA**  
Estado: **RESUELTO (Parcial)** - Archivos no están en tracking de git, pero secrets deben ser rotados

## Archivos con Secrets Identificados

Se identificaron los siguientes archivos con secrets comprometidos en el sistema de archivos local:

### 1. `.env` (Directorio raíz)
**Secrets comprometidos:**
- `DATABASE_URL` - PostgreSQL Database URL con contraseña expuesta
- `JWT_SECRET` - Secret de JWT
- `NEXTAUTH_SECRET` - Secret de NextAuth
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key
- `vecinosimple_POSTGRES_PASSWORD` - Contraseña de PostgreSQL
- `vecinosimple_SUPABASE_JWT_SECRET` - JWT Secret de Supabase
- `vecinosimple_SUPABASE_SECRET_KEY` - Secret Key de Supabase
- `vecinosimple_SUPABASE_SERVICE_ROLE_KEY` - Service Role Key de Supabase (CRÍTICO)

### 2. `.env.local` (Directorio raíz)
**Secrets comprometidos:**
- `VERCEL_OIDC_TOKEN` - Token OIDC de Vercel

### 3. `apps/staff-app/.env.local`
**Secrets comprometidos:**
- `DATABASE_URL` - Neon Database URL con contraseña expuesta
- `NEXT_PUBLIC_vecinosimple_SUPABASE_ANON_KEY` - Supabase Anon Key
- `PGPASSWORD` - Contraseña de PostgreSQL
- `POSTGRES_PASSWORD` - Contraseña de PostgreSQL
- `VERCEL_OIDC_TOKEN` - Token OIDC de Vercel
- `vecinosimple_POSTGRES_PASSWORD` - Contraseña de PostgreSQL
- `vecinosimple_SUPABASE_JWT_SECRET` - JWT Secret de Supabase
- `vecinosimple_SUPABASE_SECRET_KEY` - Secret Key de Supabase
- `vecinosimple_SUPABASE_SERVICE_ROLE_KEY` - Service Role Key de Supabase (CRÍTICO)

## Acciones Realizadas

### 1. Verificación de Archivos con Secrets
✅ Se verificó el contenido de `.env` - Confirmado que contiene secrets
✅ Se verificó el contenido de `.env.local` - Confirmado que contiene secrets
✅ Se verificó el contenido de `apps/staff-app/.env.local` - Confirmado que contiene secrets
✅ Se buscó otros archivos `.env*` en el repositorio - No se encontraron adicionales

### 2. Verificación de Tracking de Git
✅ Se ejecutó `git ls-files` para buscar archivos sensibles en el tracking
✅ Resultado: **No se encontraron archivos `.env`, `.pem`, `.key`, `.p12`, `.crt` en el tracking de git**
✅ Los archivos `.env`, `.env.local` y `apps/staff-app/.env.local` **NO están siendo trackeados por git**

### 3. Verificación de .gitignore
✅ Se verificó que [`.gitignore`](.gitignore:17) incluye correctamente:
- Línea 17: `.env`
- Línea 18: `.env.local`
- Línea 19: `.env.*.local`
- Línea 66: `.env*.local`
- Líneas 49-53: Excluye certificados (`*.crt`, `*.key`, `*.pem`)

## Estado Actual

**IMPORTANTE:** Los archivos con secrets existen en el sistema de archivos local, pero **NO están siendo trackeados por git**. Esto significa que:

1. ✅ Los archivos no están expuestos en el repositorio remoto
2. ✅ Los archivos están correctamente excluidos por `.gitignore`
3. ⚠️ Los secrets deben ser rotados inmediatamente por seguridad
4. ⚠️ Los archivos locales deben ser actualizados con los nuevos secrets

## Checklist de Rotación de Secrets (2026-01-26)

### ✅ PASO 1: Generar Nuevos Secrets Locales
```bash
# Ejecutar el generador de secrets
node scripts/generate-secrets.js

# Copiar los valores generados a tu .env local
```

### 🔄 PASO 2: Rotar Secrets en Supabase (CRÍTICO - HACER PRIMERO)
1. **Acceder:** [Supabase Dashboard](https://supabase.com/dashboard) → Proyecto `zvivuilvzpjbijhzhvxj`
2. **Service Role Key (CRÍTICO):**
   - Settings → API → Service Role Key → **Regenerate**
   - ⚠️ **GUARDAR EL NUEVO KEY INMEDIATAMENTE** (no se puede recuperar)
3. **JWT Secret:**
   - Settings → API → JWT Secret → **Regenerate**
4. **Database Password:**
   - Settings → Database → Reset Database Password
   - ⚠️ **GUARDAR LA NUEVA CONTRASEÑA**
5. **Anon Key:**
   - Settings → API → anon public → **Regenerate**

### 🔄 PASO 3: Rotar API Keys Externas
1. **Resend (Email):**
   - [Resend Dashboard](https://resend.com/api-keys) → Create API Key
2. **Mercado Pago:**
   - [Mercado Pago Panel](https://www.mercadopago.com.ar/developers/panel/credentials) → Regenerar si necesario
3. **WhatsApp Business:**
   - [Meta Developers](https://developers.facebook.com/apps/) → Regenerar access token
4. **Firebase:**
   - [Firebase Console](https://console.firebase.google.com/) → Settings → Service accounts → Generate new key

### 🔄 PASO 4: Actualizar Variables en Plataformas de Deploy

#### Railway (Backend API)
1. [Railway Dashboard](https://railway.app/dashboard) → Proyecto API
2. **Variables** → Actualizar:
   ```
   DATABASE_URL=postgres://postgres:[NUEVA_PASSWORD]@...
   JWT_SECRET=[NUEVO_JWT_SECRET]
   NEXTAUTH_SECRET=[NUEVO_NEXTAUTH_SECRET]
   SUPABASE_SERVICE_ROLE_KEY=[NUEVO_SERVICE_ROLE_KEY]
   SUPABASE_JWT_SECRET=[NUEVO_JWT_SECRET]
   SUPABASE_ANON_KEY=[NUEVO_ANON_KEY]
   RESEND_API_KEY=[NUEVA_API_KEY]
   MERCADO_PAGO_WEBHOOK_SECRET=[NUEVO_WEBHOOK_SECRET]
   WHATSAPP_ACCESS_TOKEN=[NUEVO_ACCESS_TOKEN]
   ```
3. **Redeploy** el servicio

#### Vercel (Admin Web)
1. [Vercel Dashboard](https://vercel.com/dashboard) → Proyecto `admin-web`
2. **Settings** → **Environment Variables** → Actualizar:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[NUEVO_ANON_KEY]
   NEXT_PUBLIC_SUPABASE_URL=https://zvivuilvzpjbijhzhvxj.supabase.co
   NEXTAUTH_SECRET=[NUEVO_NEXTAUTH_SECRET]
   ```
3. **Redeploy**

#### Vercel (Resident App)
1. [Vercel Dashboard](https://vercel.com/dashboard) → Proyecto `resident-app`
2. **Settings** → **Environment Variables** → Actualizar:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[NUEVO_ANON_KEY]
   NEXT_PUBLIC_SUPABASE_URL=https://zvivuilvzpjbijhzhvxj.supabase.co
   NEXTAUTH_SECRET=[NUEVO_NEXTAUTH_SECRET]
   ```
3. **Redeploy**

#### Vercel (Staff App)
1. [Vercel Dashboard](https://vercel.com/dashboard) → Proyecto `staff-app`
2. **Settings** → **Environment Variables** → Actualizar:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[NUEVO_ANON_KEY]
   NEXT_PUBLIC_SUPABASE_URL=https://zvivuilvzpjbijhzhvxj.supabase.co
   NEXTAUTH_SECRET=[NUEVO_NEXTAUTH_SECRET]
   ```
3. **Redeploy**

### ✅ PASO 5: Verificación Post-Rotación
```bash
# Ejecutar smoke tests
./scripts/smoke-test.sh

# Verificar que las apps funcionan:
# - Login funciona
# - Base de datos conecta
# - Emails se envían
# - Pagos procesan
```

### 📋 Checklist de Verificación
- [ ] Supabase Service Role Key regenerado
- [ ] Supabase JWT Secret regenerado
- [ ] Database password cambiada
- [ ] Railway variables actualizadas
- [ ] Vercel variables actualizadas (3 proyectos)
- [ ] Resend API key regenerada
- [ ] Smoke tests pasan
- [ ] Login funciona en todas las apps
- [ ] Base de datos responde correctamente

## Prevención Futura

### Mejoras Implementadas
✅ Archivos `.env` y `.env.local` están en `.gitignore`
✅ Certificados (`*.crt`, `*.key`, `*.pem`) están en `.gitignore`
✅ Scripts de pre-deploy verifican archivos sensibles

### Recomendaciones Adicionales

1. **Usar Secret Management:**
   - Railway: Variables de entorno nativas
   - Vercel: Variables de entorno con encriptación
   - Supabase: Edge Functions con secrets

2. **Implementar Pre-commit Hooks:**
   ```bash
   # .husky/pre-commit
   # Verificar que no se commiteen archivos con secrets
   if git diff --cached --name-only | grep -q "\.env$"; then
     echo "ERROR: No puedes commitear archivos .env"
     exit 1
   fi
   ```

3. **Auditoría Regular:**
   - Ejecutar `git ls-files` regularmente para verificar archivos sensibles
   - Usar herramientas como `git-secrets` o `truffleHog`
   - Revisar logs de commits para detectar commits accidentales

4. **Documentación:**
   - Mantener [`.env.example`](.env.example:1) actualizado con plantillas
   - Documentar el proceso de rotación de secrets
   - Incluir instrucciones en el README

## Referencias

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Railway Environment Variables](https://docs.railway.app/reference/variables)
- [OWASP Secrets Management](https://owasp.org/www-community/Secrets_Management_Cheat_Sheet)

## Historial de Cambios

| Fecha | Acción | Responsable |
|-------|--------|-------------|
| 2026-01-26 | Auditoría inicial de secrets | Security Reviewer |
| 2026-01-26 | Verificación de tracking de git | Security Reviewer |
| 2026-01-26 | Documentación de incidente | Security Reviewer |
