# 🖥️ AUDIT-006: Admin-Web (Portal Administradores)

**Fecha:** 5 de febrero de 2026  
**Versión:** 1.0  
**Health Score:** 7/10  

---

## 1. Información General

| Aspecto | Valor |
|---------|-------|
| Path | `apps/admin-web/` |
| Framework | Next.js 14 (App Router) |
| Deploy | Vercel |
| URL Producción | Configurado en vercel.json |

---

## 2. Estado Actual

### ✅ Correcto
- Build TypeScript funciona (`ignoreBuildErrors: false`)
- Sentry integrado para error tracking
- Middleware JWT implementado y funcional
- Tests unit (5 archivos): amenities, notificaciones, pagos, gastos, expensas
- Tests E2E (5 specs): auth, dashboard, expensas, pagos, tickets
- PWA no requerida (portal de escritorio)
- Usa `@vecinosimple/api-client` compartido

### ⚠️ Advertencias
- ESLint deshabilitado en build (`ignoreDuringBuilds: true`)
- 9 TODOs de autenticación/contexto pendientes
- Dependencia lucide-react desactualizada (^0.309.0 vs ^0.563.0)

### ❌ Errores Críticos
- Ninguno bloqueante

---

## 3. Configuración de Build

### next.config.js
```javascript
{
  eslint: { ignoreDuringBuilds: true },  // ⚠️ Oculta errores
  typescript: { ignoreBuildErrors: false },  // ✅ Correcto
  images: { domains: ['...'] },
  transpilePackages: ['@vecinosimple/ui', '@vecinosimple/business-logic']
}
```

### vercel.json
```json
{
  "buildCommand": "cd ../.. && npm run build --filter=admin-web",
  "outputDirectory": ".next"
}
```

---

## 4. Problemas Identificados

### 4.1 ESLint Ignorado en Build
**Severidad:** Media  
**Archivo:** `next.config.js:13`  
**Problema:** Los errores de lint no bloquean el deploy, ocultando potenciales bugs.  
**Solución:** Cambiar a `ignoreDuringBuilds: false` después de corregir errores.

### 4.2 TODOs Pendientes de Autenticación
**Severidad:** Alta  
**Ubicación:** Varios archivos en `src/`  
**Problemas:**
- Contexto de consorcio hardcodeado en algunos lugares
- Falta validación de permisos en algunas rutas
- Lógica de refresh token incompleta

### 4.3 Versión Inconsistente de lucide-react
**Severidad:** Baja  
**Actual:** ^0.309.0  
**Recomendada:** ^0.563.0 (alinear con otras apps)  
**Riesgo:** Breaking changes, iconos faltantes en UI.

---

## 5. Dependencias Clave

| Dependencia | Versión | Estado |
|-------------|---------|--------|
| next | 14.2.3 | ✅ OK |
| next-auth | 5.0.0-beta.30 | ⚠️ Beta |
| @tanstack/react-query | ^5.76.1 | ✅ OK |
| @vecinosimple/ui | workspace | ✅ OK |
| @vecinosimple/api-client | workspace | ✅ OK |
| lucide-react | ^0.309.0 | ⚠️ Desactualizada |
| @sentry/nextjs | ^8.50.0 | ✅ OK |

---

## 6. Estructura de Archivos

```
apps/admin-web/src/
├── app/                    # App Router
│   ├── (auth)/            # Rutas autenticadas
│   ├── (public)/          # Login, register
│   └── api/               # API Routes
├── features/              # Módulos por funcionalidad
│   ├── expensas/
│   ├── gastos/
│   ├── pagos/
│   ├── usuarios/
│   └── ...
├── lib/                   # Utilidades
│   ├── api-client.ts     # Cliente API (usa @vecinosimple/api-client)
│   └── auth.ts           # Configuración NextAuth
├── middleware.ts          # JWT validation
└── ui/                    # Componentes locales
```

---

## 7. Tests

### Unit Tests (Vitest)
| Archivo | Coverage | Estado |
|---------|----------|--------|
| amenities.test.tsx | ~60% | ✅ |
| notificaciones.test.tsx | ~50% | ✅ |
| pagos.test.tsx | ~70% | ✅ |
| gastos.test.tsx | ~65% | ✅ |
| expensas.test.tsx | ~55% | ✅ |

### E2E Tests (Playwright)
| Spec | Escenarios | Estado |
|------|------------|--------|
| auth.spec.ts | Login/Logout | ✅ |
| dashboard.spec.ts | Widgets, navegación | ✅ |
| expensas.spec.ts | CRUD expensas | ✅ |
| pagos.spec.ts | Registrar pago | ✅ |
| tickets.spec.ts | Crear/resolver ticket | ✅ |

---

## 8. Plan de Acción

### P0 - Crítico (1-3 días)
- [ ] Resolver TODOs de autenticación críticos
- [ ] Validar que middleware JWT cubre todas las rutas protegidas

### P1 - Alto (1-2 semanas)
- [ ] Habilitar ESLint en build (`ignoreDuringBuilds: false`)
- [ ] Actualizar lucide-react a ^0.563.0
- [ ] Aumentar cobertura de tests a 60%

### P2 - Medio (3-4 semanas)
- [ ] Implementar más tests E2E para flows críticos
- [ ] Optimizar bundle size (code splitting)
- [ ] Auditar accesibilidad WCAG 2.1 AA

---

## 9. Comandos de Desarrollo

```bash
# Desarrollo
pnpm dev --filter=admin-web

# Build
pnpm build --filter=admin-web

# Tests unit
pnpm test --filter=admin-web

# Tests E2E
pnpm test:e2e --filter=admin-web

# Lint
pnpm lint --filter=admin-web
```

---

## 10. Verificación de Build Vercel

### Checklist Pre-Deploy
- [ ] `pnpm build --filter=admin-web` exitoso localmente
- [ ] No errores de TypeScript
- [ ] Variables de entorno configuradas en Vercel
- [ ] Prisma client generado

### Variables de Entorno Requeridas
```env
NEXTAUTH_SECRET=
NEXTAUTH_URL=
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_API_URL=
SENTRY_DSN=
```

---

**Última actualización:** 5 de febrero de 2026
