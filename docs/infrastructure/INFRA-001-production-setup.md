# INFRA-001: Guía de Infraestructura de Producción

> **Fecha:** 27 Enero 2025  
> **Estado:** Pendiente configuración  
> **Estimación:** 2-3 horas

---

## 1. Resumen de Servicios Requeridos

| Servicio | Propósito | Costo Estimado/mes |
|----------|-----------|-------------------|
| **Neon DB** | PostgreSQL serverless | Free tier (3GB) / $19 Pro |
| **Railway** | NestJS API hosting | ~$5-20 (pay per use) |
| **Vercel** | Next.js apps (3 PWAs) | Free tier / $20 Pro |
| **Resend** | Transactional email | Free (100/día) / $20 (50k) |
| **Cloudflare R2** | Storage (S3-compatible) | Free (10GB) / pay per use |
| **Firebase** | Push notifications | Free tier |

**Costo Total Estimado:** $0-50 USD/mes para MVP

---

## 2. Configuración de Base de Datos (Neon)

### 2.1 Crear cuenta y proyecto

1. Ir a [neon.tech](https://neon.tech)
2. Sign up con GitHub
3. Crear proyecto: `vecinosimple-prod`
4. Región: `us-east-1` (o `sa-east-1` si disponible para latencia Argentina)

### 2.2 Obtener connection string

```
postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
```

### 2.3 Configurar pooling (recomendado)

- Habilitar connection pooling en dashboard
- Usar el connection string de pooler para la aplicación
- Usar el connection string directo solo para migraciones

### 2.4 Ejecutar migraciones

```bash
# En el repositorio local
cd apps/api
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## 3. Configuración de API (Railway)

### 3.1 Crear proyecto

1. Ir a [railway.app](https://railway.app)
2. Sign up con GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Seleccionar repositorio `vecinosimple`
5. Configurar root directory: `apps/api`

### 3.2 Variables de entorno requeridas

```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=<generar con: openssl rand -hex 32>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# App
NODE_ENV=production
APP_URL=https://api.vecinosimple.com
FRONTEND_URL=https://admin.vecinosimple.com

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@vecinosimple.com

# Storage (R2)
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=vecinosimple-files
S3_REGION=auto

# Mercado Pago (producción)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=<generar HMAC secret>

# Push Notifications (Firebase)
FIREBASE_PROJECT_ID=vecinosimple-prod
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@vecinosimple-prod.iam.gserviceaccount.com

# WhatsApp (opcional MVP)
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_VERIFY_TOKEN=...
```

### 3.3 Configurar build y start commands

```yaml
# railway.toml (si se usa)
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node dist/main"
healthcheckPath = "/health"
healthcheckTimeout = 30
```

### 3.4 Dominio personalizado

1. En Railway → Settings → Domains
2. Agregar: `api.vecinosimple.com`
3. Configurar DNS en registrador (CNAME a railway)

---

## 4. Configuración de Frontend (Vercel)

### 4.1 Crear proyecto para cada app

Necesitamos 3 proyectos en Vercel:

| App | Dominio | Root Directory |
|-----|---------|----------------|
| admin-web | admin.vecinosimple.com | apps/admin-web |
| resident-app | app.vecinosimple.com | apps/resident-app |
| staff-app | staff.vecinosimple.com | apps/staff-app |

### 4.2 Pasos para cada app

1. "Add New" → "Project" → Import from GitHub
2. Configure Project:
   - Framework Preset: Next.js
   - Root Directory: `apps/<app-name>`
   - Build Command: `cd ../.. && pnpm turbo run build --filter=<app-name>`
   - Install Command: `cd ../.. && pnpm install`

### 4.3 Variables de entorno (por app)

**admin-web:**
```env
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com
NEXT_PUBLIC_APP_ENV=production
```

**resident-app:**
```env
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=vecinosimple-prod
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

**staff-app:**
```env
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com
NEXT_PUBLIC_APP_ENV=production
```

---

## 5. Configuración de Email (Resend)

### 5.1 Crear cuenta

1. Ir a [resend.com](https://resend.com)
2. Sign up
3. Verificar dominio (agregar records DNS)

### 5.2 Verificar dominio

Agregar en DNS del dominio:

```
Type: TXT
Name: resend._domainkey
Value: <proporcionado por Resend>

Type: MX (opcional, para replies)
Name: reply
Value: feedback-smtp.resend.com
```

### 5.3 Crear API Key

1. Dashboard → API Keys → Create
2. Permisos: "Sending access"
3. Copiar key: `re_...`

---

## 6. Configuración de Storage (Cloudflare R2)

### 6.1 Crear bucket

1. Ir a [Cloudflare Dashboard](https://dash.cloudflare.com) → R2
2. "Create bucket": `vecinosimple-files`
3. Location: Auto (o específico si disponible)

### 6.2 Crear API Token

1. Manage R2 API Tokens → Create API token
2. Permisos: "Object Read & Write"
3. Guardar:
   - Access Key ID
   - Secret Access Key
   - Endpoint URL

### 6.3 Configurar CORS (si necesario)

```json
[
  {
    "AllowedOrigins": ["https://admin.vecinosimple.com", "https://app.vecinosimple.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## 7. Configuración de Firebase (Push)

### 7.1 Crear proyecto

1. [Firebase Console](https://console.firebase.google.com)
2. "Add project": `vecinosimple-prod`
3. Desactivar Google Analytics (opcional para MVP)

### 7.2 Configurar Cloud Messaging

1. Project Settings → Cloud Messaging
2. Generar "Web Push certificates" (VAPID key)

### 7.3 Crear Service Account

1. Project Settings → Service Accounts
2. "Generate new private key"
3. Guardar JSON con credenciales

### 7.4 Registrar apps web

1. Project Overview → Add app → Web
2. Registrar cada PWA (resident-app, staff-app)
3. Obtener firebaseConfig para cada app

---

## 8. Configuración de Mercado Pago (Producción)

### 8.1 Cuenta de producción

1. Ir a [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
2. Crear aplicación para **producción**
3. Obtener:
   - Access Token (producción)
   - Public Key

### 8.2 Configurar Split Payments

**IMPORTANTE:** Para que los pagos vayan directo al consorcio:

1. Solicitar habilitación de "Split de Pagos" a MP
2. Cada consorcio debe tener su cuenta MP vinculada
3. Configurar collector_id por consorcio

### 8.3 Configurar Webhooks

1. En la aplicación MP → Webhooks → Agregar
2. URL: `https://api.vecinosimple.com/webhooks/mercadopago`
3. Eventos: `payment`
4. Generar Webhook Secret para HMAC

---

## 9. DNS y Dominios

### 9.1 Records necesarios

```
# API (Railway)
api.vecinosimple.com    CNAME   <railway-domain>.railway.app

# Admin Web (Vercel)
admin.vecinosimple.com  CNAME   cname.vercel-dns.com

# Resident App (Vercel)
app.vecinosimple.com    CNAME   cname.vercel-dns.com

# Staff App (Vercel)
staff.vecinosimple.com  CNAME   cname.vercel-dns.com

# Email (Resend)
resend._domainkey       TXT     <value-from-resend>
```

### 9.2 SSL/TLS

- Railway y Vercel proveen SSL automático con Let's Encrypt
- No requiere configuración manual

---

## 10. Monitoreo y Alertas

### 10.1 Railway Observability

- Logs en tiempo real incluidos
- Métricas de CPU/Memory incluidas
- Configurar alertas por email en Settings

### 10.2 Vercel Analytics (opcional)

- Habilitar en cada proyecto
- Web Vitals automáticos
- $10/mes por proyecto

### 10.3 Uptime Monitoring (recomendado)

Opciones gratuitas:
- [UptimeRobot](https://uptimerobot.com) - 50 monitors free
- [Better Uptime](https://betteruptime.com) - 10 monitors free

Configurar checks para:
- `https://api.vecinosimple.com/health`
- `https://admin.vecinosimple.com`
- `https://app.vecinosimple.com`

---

## 11. Backup y Recuperación

### 11.1 Base de Datos (Neon)

- Neon tiene Point-in-Time Recovery incluido
- Retención: 7 días (free) / 30 días (Pro)
- Branching para pruebas de migraciones

### 11.2 Archivos (R2)

- Configurar lifecycle rules para archivos antiguos
- Considerar replicación cross-region para datos críticos

---

## 12. Checklist Pre-Deploy

- [ ] Database creada y migraciones ejecutadas
- [ ] Variables de entorno configuradas en todos los servicios
- [ ] Dominios DNS configurados y propagados
- [ ] SSL funcionando en todos los dominios
- [ ] Webhook de Mercado Pago configurado y probado
- [ ] Email transaccional verificado (enviar test)
- [ ] Push notifications configuradas (enviar test)
- [ ] Storage R2 accesible desde API
- [ ] Health check endpoint responde 200
- [ ] Smoke tests manuales completados

---

## 13. Estimación de Tiempos

| Tarea | Tiempo |
|-------|--------|
| Setup Neon + migraciones | 30 min |
| Setup Railway + deploy API | 45 min |
| Setup Vercel (3 apps) | 30 min |
| Setup Resend + verificar dominio | 30 min |
| Setup R2 | 15 min |
| Setup Firebase | 20 min |
| Configurar DNS | 15 min (+ propagación) |
| Smoke testing | 30 min |
| **Total** | **~3 horas** |

---

## 14. Próximos Pasos

1. Adquirir dominio `vecinosimple.com` (si no existe)
2. Crear cuentas en todos los servicios listados
3. Ejecutar este documento paso a paso
4. Validar con smoke tests
5. Configurar monitoreo
6. Documentar credenciales en password manager seguro
