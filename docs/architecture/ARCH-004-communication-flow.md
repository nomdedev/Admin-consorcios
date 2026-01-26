# 🏗️ Arquitectura de Comunicación - VecinoSimple

## 🌐 URLs de Producción

| Servicio | URL | Puerto Local | Tecnología |
|----------|-----|--------------|------------|
| **Admin Web** | `https://admin.vecinosimple.com` | `3000` | Next.js |
| **Resident App** | `https://app.vecinosimple.com` | `3001` | Next.js PWA |
| **Staff App** | `https://staff.vecinosimple.com` | `3002` | Next.js PWA |
| **API Backend** | `https://api.vecinosimple.com` | `3001` | NestJS |

## 🔗 Comunicación HTTP

### Frontend → Backend
```typescript
// En cualquier frontend app
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
// = "https://api.vecinosimple.com"

// Ejemplo de llamada
fetch(`${API_BASE_URL}/auth/magic-link`, {
  method: 'POST',
  body: JSON.stringify({ email })
})
```

### Backend → Base de Datos
```typescript
// En NestJS (apps/api/)
const databaseUrl = process.env.DATABASE_URL;
// = "postgresql://user:pass@host:5432/db"
```

### Frontend → Supabase (Archivos/Storage)
```typescript
// Directamente desde el browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// = "https://xxxxx.supabase.co"
```

## 📋 Variables de Entorno por Servicio

### Admin Web (Vercel)
```
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXTAUTH_URL=https://admin.vecinosimple.com
NEXTAUTH_SECRET=...
```

### Resident App (Vercel)
```
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXTAUTH_URL=https://app.vecinosimple.com
NEXTAUTH_SECRET=...
```

### API Backend (Railway)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
MERCADOPAGO_ACCESS_TOKEN=...
WHATSAPP_TOKEN=...
```

## 🔄 Flujo de Datos Típico

```
Usuario en app.vecinosimple.com
    ↓
Hace login → POST /auth/magic-link
    ↓
API valida y envía email
    ↓
Usuario clickea link → GET /auth/verify?token=...
    ↓
API valida token y devuelve JWT
    ↓
Frontend guarda JWT en localStorage
    ↓
Todas las llamadas incluyen: Authorization: Bearer <jwt>
```

## 🛡️ Seguridad

- **CORS:** Configurado para permitir solo los dominios de Vercel
- **JWT:** Tokens firmados con secreto compartido
- **HTTPS:** Obligatorio en producción
- **Rate Limiting:** En el backend API

## 🚀 Deploy Independiente

Cada servicio se deploya por separado:
- **Frontend:** Vercel detecta cambios en Git y redeploy automáticamente
- **Backend:** Railway redeploy cuando se hace push a la rama main
- **Base de Datos:** Supabase (managed, no deploy)

**Beneficio:** Un fallo en un servicio no afecta los otros.</content>
<parameter name="filePath">d:\martin\Proyectos\Admin-consorcios\docs\architecture\ARCH-004-communication-flow.md