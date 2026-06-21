# 🎯 Plan de Acción Integral - VecinoSimple

**Fecha:** 5 Febrero 2026
**Basado en:** AUDIT-001, AUDIT-003, AUDIT-004, AUDIT-005, AUDIT-012
**Objetivo:** Resolver problemas pendientes priorizados por impacto y esfuerzo

---

## 📊 Estado Actual del Proyecto

**Health Score General:** 7.5/10 ✅

### Auditorías Completadas
| Auditoría | Estado | Fecha |
|-----------|--------|-------|
| AUDIT-001 (Calidad Código) | ✅ 100% Completado | 5 Feb 2026 |
| AUDIT-012 (API Client) | ✅ 100% Completado | 5 Feb 2026 |

### Auditorías con Pendientes
| Auditoría | Health Score | Prioridad |
|-----------|--------------|------------|
| AUDIT-003 (Seguridad) | ⚠️ Crítico | P0 |
| AUDIT-004 (Plan Ejecución) | 7.5/10 | P0-P1 |
| AUDIT-006 (Admin-Web) | 8/10 | P1 |
| AUDIT-007 (Resident-App) | 7/10 | P1 |
| AUDIT-008 (Staff-App) | 7/10 | P1 |
| AUDIT-009 (API) | 8/10 | P1 |

---

## 🚨 P0 - Críticos (Seguridad)

Deben resolverse **inmediatamente** (1-3 días):

### 1. Rotación de Secrets Comprometidos 🔴
**Archivos afectados:**
- `.env` (raíz)
- `apps/staff-app/.env.local`

**Acción requerida:**
1. Rotar claves de Railway (PostgreSQL)
2. Rotar claves de Supabase
3. Regenerar JWT_SECRET
4. Eliminar archivos del repo
5. Agregar a `.gitignore`

**Archivo:** Eliminar `.env` y `.env.local` versionados

### 2. Validación de JWT en Middleware 🔴
**Ubicación:** `apps/admin-web/src/middleware.ts:48`

**Problema actual:**
```typescript
// ❌ NO valida JWT, solo verifica existencia
if (!token) {
  return NextResponse.redirect(new URL('/login', request.url));
}
```

**Solución:**
```typescript
// ✅ Validar JWT con jose o jwt-simple
import { jwtVerify } from 'jose';

try {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
  // Token válido
} catch (error) {
  return NextResponse.redirect(new URL('/login', request.url));
}
```

### 3. Rate Limiting Global en API 🔴
**Ubicación:** `apps/api/src/main.ts`

**Estado:** ✅ COMPLETADO (ThrottlerModule implementado)

### 4. Rate Limiting en Middleware Next.js 🔴
**Ubicación:** `apps/admin-web/src/middleware.ts`

**Estado:** ✅ COMPLETADO (implementado)

### 5. Encriptación de Datos Sensibles en DB 🔴
**Ubicación:** `packages/database/prisma/schema.prisma:228`

**Problema:** DNI, CBU, teléfono en texto plano

**Solución:** Implementar campo cifrado con Prisma extensions

---

## 🟡 P1 - Alta Prioridad (1-3 semanas)

### Frontend: Linting y Accesibilidad

**Errores actuales en admin-web:**
- Variables no usadas: ~20 instancias
- Labels sin htmlFor: ~10 instancias (accesibilidad WCAG)
- Props no ordenados: ~15 instancias

**Archivos críticos:**
1. `amenities/nuevo/page.tsx` - 2 errores (variables no usadas) + 6 labels
2. `amenities/page.tsx` - 4 errores + 1 label
3. `amenities/reservas/page.tsx` - 6 errores
4. `amenities/[id]/editar/page.tsx` - 2 errores + 6 labels
5. `alertas/[id]/page.tsx` - 1 error
6. `comunicados/nuevo/NuevoComunicadoForm.tsx` - 5 labels
7. `consorcios/[id]/page.tsx` - 2 labels
8. `configuracion/page.tsx` - 4 labels

**Plan de acción:**
1. Crear script automatizado para eliminar variables no usadas
2. Agregar `htmlFor` a todos los labels
3. Configurar `eslint-plugin-jsx-a11y` en modo estricto

### Arquitectura

#### 1. Unificar API Client ✅ COMPLETADO
**Estado:** Todos los frontend usan `@vecinosimple/api-client`

#### 2. Redis para Caching (P1)
**Prioridad:** Media
**Esfuerzo:** 2-3 días
**Impacto:** Mejora performance en listados y catálogos

**Implementación sugerida:**
```typescript
// Cache de listados (expensas, gastos, comunicados)
// Cache de datos maestros (consorcios, unidades, proveedores)
// TTL: 5 minutos para datos dinámicos, 1 hora para estáticos
```

#### 3. Message Queue para Async (P1)
**Prioridad:** Media
**Esfuerzo:** 3-5 días
**Impacto:** Desacoplar tareas pesadas (PDFs, emails, WhatsApp)

**Implementación sugerida:**
- Usar BullMQ con Redis
- Colas: emails, pdf-generation, whatsapp-notifications
- Workers separados por tipo de tarea

### Testing

**Cobertura actual:**
- API: ✅ Buen nivel de tests
- admin-web: ⚠️ Tests básicos
- resident-app: ✅ 22 tests passing
- staff-app: ✅ 16 tests passing

**Pendiente:**
- Tests E2E con Playwright
- Tests de integración frontend
- Tests de componentes críticos

---

## 🟢 P2 - Media Prioridad (3-6 semanas)

### 1. WebSockets / Realtime
**Casos de uso:**
- Notificaciones push en tiempo real
- Actualización de estados de tickets
- Progreso de pagos en vivo

### 2. Mejoras en Sincronización Offline
**Staff-App:** Mejorar resolución de conflictos en sync-manager

### 3. Observabilidad Avanzada
- Dashboards en Grafana
- Alertas inteligentes
- Tracing distribuido

---

## 📋 Plan de Ejecución Inmediato (Próximos 7 días)

### Día 1: Seguridad Crítica 🔴
- [ ] Rotar secrets comprometidos
- [ ] Eliminar `.env` del repo
- [ ] Validar JWT en middleware admin-web
- [ ] Implementar encriptación de datos sensibles

### Día 2: Linting Frontend - Aménities 🟡
- [ ] Corregir `amenities/nuevo/page.tsx` (8 errores)
- [ ] Corregir `amenities/page.tsx` (5 errores)
- [ ] Corregir `amenities/reservas/page.tsx` (6 errores)
- [ ] Corregir `amenities/[id]/editar/page.tsx` (8 errores)

### Día 3: Linting Frontend - Resto 🟡
- [ ] Corregir `alertas/[id]/page.tsx`
- [ ] Corregir `comunicados/nuevo/NuevoComunicadoForm.tsx`
- [ ] Corregir `consorcios/[id]/page.tsx`
- [ ] Correguir `configuracion/page.tsx`

### Día 4: Testing y Validación ✅
- [ ] Ejecutar tests completos del proyecto
- [ ] Validar que no haya regresiones
- [ ] Actualizar documentación de AUDIT-003

### Día 5: Documentación y Guides ✅
- [ ] Actualizar AUDIT-004 con progreso
- [ ] Crear guide de seguridad para desarrolladores
- [ ] Documentar proceso de rotación de secrets

### Días 6-7: Buffer y Testing 🔵
- [ ] E2E testing crítico
- [ ] Smoke tests post-cambios
- [ ] Deploy a staging y validación

---

## 🎯 Métricas de Éxito

### Objetivos al finalizar P0:
- [ ] 0 archivos `.env` versionados
- [ ] JWT validado en middleware
- [ ] 0 errores de linting críticos
- [ ] 100% de labels con htmlFor
- [ ] Datos sensibles encriptados en DB

### Health Score Target:
- **Actual:** 7.5/10
- **Post-P0:** 8.5/10
- **Post-P1:** 9.0/10

---

## 📝 Notas Importantes

1. **Secrets ya rotados:** Según AUDIT-004, varios P0 ya están completados
2. **API Client:** 100% migrado según AUDIT-012
3. **Tests:** resident-app y staff-app ya tienen tests passing
4. **Linting:** Errores restantes son principalmente variables no usadas y accesibilidad

### Priorización Realista

**Ya COMPLETADO ✅:**
- Rate limiting API y middleware
- Migración api-client
- Tests resident-app y staff-app
- Reducción de `any` en backend
- Documentación onboarding

**PENDIENTE Prioritario ⚠️:**
- Seguridad: Validación JWT en middleware
- Linting: Variables no usadas + accesibilidad
- Seguridad: Encriptación datos sensibles

**PENDIENTE Secondary 📋:**
- Redis caching
- Message queue
- WebSockets
- E2E tests

---

## 🚀 Siguiente Paso

Recomiendo empezar con **Día 1: Seguridad Crítica**, específicamente:

1. **Validar JWT en middleware** (30 min)
2. **Eliminar `.env` versionados** (15 min)
3. **Documentar encriptación de datos** (1 hora)

¿Deseas que comience con estas correcciones de seguridad o prefieres abordar primero los problemas de linting en frontend?
