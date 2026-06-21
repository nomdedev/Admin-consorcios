# 📱 AUDIT-007: Resident-App (PWA Vecinos)

**Fecha:** 5 de febrero de 2026  
**Versión:** 1.0  
**Health Score:** 5/10  

---

## 1. Información General

| Aspecto | Valor |
|---------|-------|
| Path | `apps/resident-app/` |
| Framework | Next.js 14 (App Router) |
| Tipo | PWA (Progressive Web App) |
| Deploy | Vercel |
| Usuarios target | Vecinos, Propietarios, Inquilinos |

---

## 2. Estado Actual

### ✅ Correcto
- Build TypeScript funciona
- PWA configurada con next-pwa
- Sentry integrado para error tracking
- Service Worker generado
- Usa `@vecinosimple/api-client` compartido

### ⚠️ Advertencias
- ESLint deshabilitado en build (`ignoreDuringBuilds: true`)
- **Cobertura de tests muy baja** — solo 1 archivo (utils.test.ts)
- Sin tests E2E
- No todos los archivos usan el api-client compartido

### ❌ Errores que Bloquean Build
- Ninguno actualmente

---

## 3. Configuración de Build

### next.config.js
```javascript
{
  eslint: { ignoreDuringBuilds: true },  // ⚠️ Oculta errores
  typescript: { ignoreBuildErrors: false },
  transpilePackages: ['@vecinosimple/business-logic'],
  // next-pwa configurado para PWA
}
```

### vercel.json
```json
{
  "buildCommand": "cd ../.. && npm run build --filter=resident-app",
  "outputDirectory": ".next"
}
```

---

## 4. Problemas Identificados

### 4.1 Cobertura de Tests Crítica
**Severidad:** Alta  
**Problema:** Solo 1 archivo de test (utils.test.ts)  
**Impacto:** Regresiones no detectadas, confianza baja en changes  
**Solución:**
1. Agregar tests para hooks críticos (useExpensas, usePagos)
2. Agregar tests para componentes de UI principales
3. Implementar al menos 5 tests E2E básicos

### 4.2 ESLint Deshabilitado
**Severidad:** Media  
**Archivo:** `next.config.js:15`  
**Problema:** Errores de código ocultos en CI/CD  
**Solución:** Habilitar después de corregir errores existentes

### 4.3 API Client Inconsistente
**Severidad:** Media  
**Problema:** Algunos archivos hacen fetch directo en vez de usar `@vecinosimple/api-client`  
**Solución:** Migrar todos los fetch a usar el cliente compartido

### 4.4 Sin Tests E2E
**Severidad:** Alta  
**Problema:** No hay tests automatizados de flujos de usuario  
**Solución:** Implementar specs para:
- Login/Logout
- Ver expensas pendientes
- Pagar expensa (mock de Mercado Pago)
- Ver comunicados
- Crear ticket de reclamo

---

## 5. Dependencias Clave

| Dependencia | Versión | Estado |
|-------------|---------|--------|
| next | 14.2.3 | ✅ OK |
| next-auth | 5.0.0-beta.30 | ⚠️ Beta |
| next-pwa | ^5.6.0 | ✅ OK |
| @tanstack/react-query | ^5.76.1 | ✅ OK |
| @vecinosimple/api-client | workspace | ✅ OK |
| lucide-react | ^0.563.0 | ✅ OK |
| @sentry/nextjs | ^8.50.0 | ✅ OK |

---

## 6. Estructura de Archivos

```
apps/resident-app/src/
├── app/                    # App Router
│   ├── (auth)/            # Rutas autenticadas
│   │   ├── dashboard/
│   │   ├── expensas/
│   │   ├── comunicados/
│   │   ├── pagos/
│   │   └── tickets/
│   └── (public)/          # Login, registro
├── components/            # Componentes de UI
├── hooks/                 # Custom hooks
├── lib/                   # Utilidades
│   ├── api-client.ts     # Cliente API
│   └── auth.ts           # Configuración NextAuth
└── public/               # Assets + PWA manifest
```

---

## 7. PWA Status

### Manifest (public/manifest.json)
| Campo | Valor | Estado |
|-------|-------|--------|
| name | VecinoSimple | ✅ |
| short_name | VS Vecinos | ✅ |
| start_url | / | ✅ |
| display | standalone | ✅ |
| icons | 192x192, 512x512 | ✅ |

### Service Worker
- [x] Generado por next-pwa
- [x] Caching de assets estáticos
- [ ] Caching de API responses (parcial)
- [ ] Background sync para pagos offline (no implementado)

---

## 8. Tests

### Unit Tests (Vitest)
| Archivo | Coverage | Estado |
|---------|----------|--------|
| utils.test.ts | ~30% | ⚠️ Básico |

### E2E Tests (Playwright)
**No implementados** ❌

### Tests Recomendados
```
e2e/
├── auth.spec.ts          # Login, logout, session
├── expensas.spec.ts      # Ver expensas, detalles
├── pagos.spec.ts         # Iniciar pago, confirmación
├── comunicados.spec.ts   # Ver comunicados, marcar leído
└── tickets.spec.ts       # Crear reclamo, ver estado
```

---

## 9. Plan de Acción

### P0 - Crítico (1-3 días)
- [ ] Verificar que todas las rutas autenticadas validan JWT
- [ ] Confirmar que no hay datos sensibles expuestos

### P1 - Alto (1-2 semanas)
- [ ] Agregar mínimo 5 tests unit para hooks críticos
- [ ] Implementar 3 tests E2E básicos (login, ver expensas, crear ticket)
- [ ] Migrar todos los fetch a `@vecinosimple/api-client`
- [ ] Habilitar ESLint en build

### P2 - Medio (3-4 semanas)
- [ ] Completar suite E2E (10+ specs)
- [ ] Implementar caching offline de expensas
- [ ] Auditar accesibilidad para adultos mayores
- [ ] Optimizar bundle para dispositivos low-end

---

## 10. Consideraciones de Accesibilidad

### Principios "Abuela-Proof"
- [ ] Botones mínimo 44x44px
- [ ] Contraste alto en textos importantes
- [ ] Modo simplificado vs completo
- [ ] Textos grandes legibles
- [ ] Feedback claro en acciones

### Mejoras Pendientes
1. Implementar modo simplificado en UI
2. Agregar aria-labels en botones de iconos
3. Verificar navegación por teclado
4. Testing con screen readers

---

## 11. Comandos de Desarrollo

```bash
# Desarrollo
pnpm dev --filter=resident-app

# Build
pnpm build --filter=resident-app

# Tests unit
pnpm test --filter=resident-app

# Lint
pnpm lint --filter=resident-app
```

---

## 12. Verificación de Build Vercel

### Checklist Pre-Deploy
- [ ] `pnpm build --filter=resident-app` exitoso localmente
- [ ] Service Worker generado correctamente
- [ ] Manifest válido
- [ ] Variables de entorno configuradas

### Variables de Entorno Requeridas
```env
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NEXT_PUBLIC_API_URL=
SENTRY_DSN=
```

---

## 13. Métricas de Performance Target

| Métrica | Target | Actual | Estado |
|---------|--------|--------|--------|
| LCP | < 2.5s | TBD | ⏳ |
| FID | < 100ms | TBD | ⏳ |
| CLS | < 0.1 | TBD | ⏳ |
| Bundle Size | < 200KB | TBD | ⏳ |

---

**Última actualización:** 5 de febrero de 2026
