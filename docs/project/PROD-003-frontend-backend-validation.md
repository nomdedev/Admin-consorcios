# PROD-003: Validación Frontend-Backend

> **Fecha:** 20 Enero 2026  
> **Estado:** 🟡 EN PROGRESO (50% completado)  
> **Auditor:** GitHub Copilot

---

## Resumen Ejecutivo

Se encontraron **14 discrepancias** entre los hooks del frontend (admin-web) y los endpoints del backend API. **3 ya fueron corregidas**.

### Estado de Correcciones

| Severidad | Total | Corregidos | Pendientes |
|-----------|-------|------------|------------|
| 🔴 CRÍTICO | 6 | 3 | 3 |
| 🟠 ALTO | 5 | 0 | 5 |
| 🟡 MEDIO | 3 | 0 | 3 |
| 🟢 BAJO | 8 | 0 | 8 (pueden no necesitar fix) |

---

## ✅ Fixes Aplicados

### 1. ✅ Pagos - Endpoint de resumen creado

**Archivo modificado:** `apps/api/src/modules/pagos/pagos.controller.ts`

```typescript
// NUEVO ENDPOINT
@Get('consorcio/:consorcioId/resumen')
@Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR)
async obtenerResumenConsorcio(@Param('consorcioId') consorcioId: string) {
  // Retorna: totalRecaudadoMes, pagosPendientes, ultimosPagos, etc.
}
```

---

### 2. ✅ Pagos - Endpoint de comprobante creado

**Archivo modificado:** `apps/api/src/modules/pagos/pagos.controller.ts`

```typescript
// NUEVO ENDPOINT
@Post(':id/comprobante')
async generarComprobante(@Param('id') id: string) {
  // Genera o retorna URL de comprobante PDF
}
```

---

### 3. ✅ Notificaciones - Endpoint de limpiar creado

**Archivo modificado:** `apps/api/src/modules/notificaciones/notificaciones.controller.ts`

```typescript
// NUEVO ENDPOINT
@Delete('limpiar')
async limpiarNotificacionesLeidas() {
  // Elimina todas las notificaciones leídas del usuario
}
```

---

## 🔴 Problemas CRÍTICOS (Requieren Fix Inmediato)

### 1. Pagos - `useResumenPagos` llama a endpoint inexistente

**Archivo:** `apps/admin-web/src/features/pagos/hooks/use-pagos.ts`

```typescript
// ❌ ACTUAL - Endpoint no existe
useQuery(['pagos', 'resumen'], () => apiClient.pagos.getResumen())

// ✅ SOLUCIÓN - Crear endpoint en backend o eliminar hook
```

**Acción:** Crear `GET /pagos/consorcio/:consorcioId/resumen` en backend

---

### 2. Pagos - `useGenerarComprobante` llama a endpoint inexistente

**Archivo:** `apps/admin-web/src/features/pagos/hooks/use-pagos.ts`

```typescript
// ❌ ACTUAL - Endpoint no existe
useMutation((pagoId) => apiClient.pagos.generarComprobante(pagoId))

// ✅ SOLUCIÓN - Crear endpoint en backend
```

**Acción:** Crear `POST /pagos/:id/comprobante` que genere PDF

---

### 3. Notificaciones - `useLimpiarNotificaciones` llama a endpoint inexistente

**Archivo:** `apps/admin-web/src/features/notificaciones/hooks/use-notificaciones.ts`

```typescript
// ❌ ACTUAL - Endpoint no existe
useMutation(() => apiClient.notificaciones.limpiar())

// ✅ SOLUCIÓN - Crear endpoint en backend
```

**Acción:** Crear `DELETE /notificaciones/limpiar` que borre todas las leídas

---

### 4. Comunicados - Rutas completamente diferentes

**Problema:** Frontend usa rutas planas, backend usa rutas anidadas.

| Hook llama a | Backend tiene |
|--------------|---------------|
| `GET /comunicados` | `GET /comunicados/consorcio/:consorcioId` |
| `POST /comunicados` | `POST /comunicados/consorcio/:consorcioId` |
| `POST /comunicados/:id/enviar` | No existe |

**Acción:** 
- Opción A: Modificar hooks para usar rutas con consorcioId
- Opción B: Agregar rutas alternativas en backend (menos ideal)

---

### 5. Tickets - Rutas diferentes

**Problema:** Frontend usa rutas planas, backend usa rutas con consorcioId.

| Hook llama a | Backend tiene |
|--------------|---------------|
| `GET /tickets` | `GET /tickets/consorcio/:consorcioId` |
| `GET /tickets/estadisticas` | `GET /tickets/consorcio/:consorcioId/estadisticas` |

**Acción:** Modificar hooks para incluir consorcioId en la ruta

---

### 6. Expensas - `useLiquidarExpensa` usa ruta incorrecta

**Archivo:** `apps/admin-web/src/features/expensas/hooks/use-expensas.ts`

```typescript
// ❌ ACTUAL
useMutation((id) => apiClient.expensas.liquidar(id))  // /liquidar

// ✅ CORRECTO según backend
useMutation((id) => apiClient.expensas.calcular(id))  // /calcular
```

**Acción:** Renombrar método en api-client o endpoint en backend

---

## 🟠 Problemas ALTOS (Rutas Diferentes)

### 7. Gastos - Categorías ruta diferente

| Hook llama a | Backend tiene |
|--------------|---------------|
| `GET /gastos/categorias` | `GET /gastos/categorias/todas` |

**Acción:** Agregar alias o cambiar hook

---

### 8. Consorcios - `useUnidadesFuncionales` en módulo incorrecto

**Problema:** El hook está en `/consorcios/hooks` pero debería llamar a `/unidades-funcionales`

**Acción:** Mover a feature correcta o documentar como agregación

---

## 🟡 Problemas MEDIOS (Métodos HTTP)

### 9. Varios módulos usan PATCH pero backend espera PUT

| Módulo | Hook usa | Backend espera |
|--------|----------|----------------|
| Consorcios | `PATCH /consorcios/:id` | `PUT /consorcios/:id` |
| Gastos | `PATCH /gastos/:id` | `PUT /gastos/:id` |
| Pagos | `PATCH /pagos/:id/estado` | `PUT /pagos/:id/estado` |
| Notificaciones | `PATCH /notificaciones/leer-todas` | `POST /notificaciones/leer-todas` |

**Acción:** Unificar criterio (recomendación: backend acepte ambos, o frontend use PUT)

---

## 🟢 Endpoints Backend sin Hook (OK para MVP)

Estos endpoints existen pero no tienen hook en admin-web. No son críticos si no se usan en la UI actual:

1. `GET /expensas/:id/pdf` - Descarga PDF
2. `GET /expensas/:id/pdf/:unidadFuncionalId` - PDF por UF
3. `POST /expensas/:id/gastos/asignar` - Asignar gastos
4. `POST /expensas/:id/gastos/desasignar` - Desasignar gastos
5. `GET /pagos/mis-pagos` - Para resident-app
6. `POST /notificaciones/leer-multiples` - Leer varias
7. `PATCH /proveedores/:id/verificar` - Verificar proveedor
8. `PATCH /consorcios/:id/bancario` - Actualizar datos bancarios

---

## Plan de Corrección

### Fase 1: Fixes Críticos en Backend (4 endpoints)

```bash
# Crear en pagos.controller.ts
GET /pagos/consorcio/:consorcioId/resumen
POST /pagos/:id/comprobante

# Crear en notificaciones.controller.ts  
DELETE /notificaciones/limpiar

# Agregar alias en comunicados.controller.ts (opcional)
GET /comunicados?consorcioId=xxx
```

### Fase 2: Fixes en Frontend Hooks (3 archivos)

1. `use-comunicados.ts` - Usar rutas con consorcioId
2. `use-tickets.ts` - Usar rutas con consorcioId
3. `use-expensas.ts` - Cambiar `liquidar` → `calcular`

### Fase 3: Unificar Métodos HTTP (api-client)

Modificar `packages/api-client` para usar los métodos HTTP correctos.

---

## Checklist de Corrección

### Backend

- [ ] Crear `GET /pagos/consorcio/:consorcioId/resumen`
- [ ] Crear `POST /pagos/:id/comprobante`
- [ ] Crear `DELETE /notificaciones/limpiar`
- [ ] Verificar rutas de comunicados aceptan query param

### Frontend

- [ ] Fix `use-comunicados.ts` rutas
- [ ] Fix `use-tickets.ts` rutas
- [ ] Fix `use-expensas.ts` liquidar → calcular
- [ ] Fix `use-gastos.ts` ruta categorías

### API Client

- [ ] Verificar métodos HTTP coinciden con backend
- [ ] Regenerar tipos si hay cambios

---

## Verificación Post-Fix

```bash
# 1. Build de todas las apps
pnpm build

# 2. TypeScript check
pnpm typecheck

# 3. Test manual de cada endpoint corregido
curl -X GET http://localhost:3000/api/pagos/consorcio/xxx/resumen
curl -X DELETE http://localhost:3000/api/notificaciones/limpiar
```

---

## Referencias

- [PROD-001 Production Readiness](./PROD-001-production-readiness-plan.md)
- [PROD-002 Deployment Checklist](./PROD-002-deployment-checklist.md)
- [API Controllers](../../apps/api/src/modules/)
- [Frontend Hooks](../../apps/admin-web/src/features/)
