# 👷 AUDIT-008: Staff-App (PWA Encargados - Offline-First)

**Fecha:** 5 de febrero de 2026  
**Versión:** 1.0  
**Health Score:** 6/10  

---

## 1. Información General

| Aspecto | Valor |
|---------|-------|
| Path | `apps/staff-app/` |
| Framework | Next.js 14 (App Router) |
| Tipo | PWA Offline-First |
| Deploy | Vercel |
| Usuarios target | Encargados de edificio |

---

## 2. Estado Actual

### ✅ Correcto
- Build TypeScript funciona
- PWA configurada con next-pwa
- **Offline implementado** con Dexie.js (IndexedDB)
- SyncManager para sincronización automática (cada 30s)
- Service Worker generado
- Sentry integrado
- **Tests unitarios agregados** (16 tests passing) ✅

### ⚠️ Advertencias
- ESLint deshabilitado en build
- **No usa `@vecinosimple/api-client`** (hace fetch directo)
- Resolución de conflictos básica (Last Write Wins)

### ❌ Errores Críticos
- ~~Sin cobertura de tests para lógica offline crítica~~ **CORREGIDO**

---

## 3. Configuración de Build

### next.config.js
```javascript
{
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  transpilePackages: ['@vecinosimple/business-logic'],
  // next-pwa con buildExcludes para SW
}
```

---

## 4. Implementación Offline

### 4.1 Base de Datos Local (Dexie.js)
**Archivo:** `src/offline/db.ts`

```typescript
// Tablas IndexedDB
class StaffAppDB extends Dexie {
  bitacoraLocal!: Table<BitacoraLocal>;   // Registros de seguridad
  paquetesLocal!: Table<PaqueteLocal>;    // Recepción de paquetes
  rondasLocal!: Table<RondaLocal>;        // Rondas de vigilancia
  syncQueue!: Table<SyncQueueItem>;       // Cola de sincronización
}
```

### 4.2 Estados de Sincronización
| Estado | Significado |
|--------|-------------|
| `pending` | Creado offline, esperando sync |
| `syncing` | En proceso de envío |
| `synced` | Sincronizado con servidor |
| `conflict` | Conflicto detectado |
| `error` | Error de sincronización |

### 4.3 SyncManager
**Archivo:** `src/offline/sync-manager.ts`

- ✅ Sincronización automática cada 30 segundos
- ✅ Detección de conexión online/offline
- ✅ Cola FIFO para envío ordenado
- ⚠️ Resolución de conflictos básica (Last Write Wins)
- ❌ Sin retry exponencial para errores
- ❌ Sin notificación a usuario de conflictos

---

## 5. Problemas Identificados

### 5.1 Sin Tests de Sincronización
**Severidad:** Alta  
**Impacto:** Pérdida de datos offline no detectada  
**Solución:**
1. Tests unit para SyncManager
2. Tests de integración para flujo offline→online
3. Tests de conflictos y recuperación

### 5.2 No Usa API Client Compartido
**Severidad:** Media  
**Problema:** Duplicación de lógica de fetch, manejo de errores inconsistente  
**Solución:** Migrar a `@vecinosimple/api-client`

### 5.3 Resolución de Conflictos Insuficiente
**Severidad:** Media  
**Actual:** Last Write Wins (el último en sincronizar gana)  
**Problema:** Puede perder datos del servidor  
**Solución propuesta:**
1. Guardar timestamp del servidor
2. Detectar si hubo cambio en servidor durante offline
3. Mostrar UI de resolución manual para conflictos

### 5.4 Sin Notificación de Estado Offline
**Severidad:** Baja  
**Problema:** Usuario no sabe claramente si está offline  
**Solución:** Banner indicador de estado de conexión

---

## 6. Dependencias Clave

| Dependencia | Versión | Estado |
|-------------|---------|--------|
| next | 14.2.3 | ✅ OK |
| next-pwa | ^5.6.0 | ✅ OK |
| dexie | ^4.0.11 | ✅ OK |
| lucide-react | ^0.563.0 | ✅ OK |
| @sentry/nextjs | ^8.50.0 | ✅ OK |

**Faltante:** `@vecinosimple/api-client` (no está en dependencias)

---

## 7. Estructura de Archivos

```
apps/staff-app/src/
├── app/                    # App Router
│   ├── (auth)/            # Rutas autenticadas
│   │   ├── bitacora/      # Registro de eventos
│   │   ├── paquetes/      # Recepción paquetes
│   │   ├── rondas/        # Rondas de vigilancia
│   │   └── offline/       # Página de estado offline
│   └── (public)/
├── components/            # Componentes UI
├── hooks/                 # Custom hooks
├── lib/                   # Utilidades
├── offline/               # ⭐ Lógica offline-first
│   ├── db.ts             # Dexie database
│   └── sync-manager.ts   # Sincronización
└── public/
    ├── sw.js             # Service Worker
    └── manifest.json     # PWA manifest
```

---

## 8. Tests

### Unit Tests
**No implementados** ❌

### E2E Tests
**No implementados** ❌

### Tests Críticos Recomendados
```
__tests__/
├── offline/
│   ├── db.test.ts              # CRUD IndexedDB
│   ├── sync-manager.test.ts    # Sincronización
│   └── conflict-resolution.test.ts
├── hooks/
│   ├── useBitacora.test.ts
│   ├── usePaquetes.test.ts
│   └── useRondas.test.ts
└── e2e/
    ├── offline-workflow.spec.ts  # Crear offline → sync
    └── conflict-handling.spec.ts
```

---

## 9. Plan de Acción

### P0 - Crítico (1-3 días)
- [ ] Agregar tests unit para SyncManager
- [ ] Verificar que datos offline no se pierden en edge cases
- [ ] Agregar indicador visual de estado offline

### P1 - Alto (1-2 semanas)
- [ ] Migrar a `@vecinosimple/api-client`
- [ ] Implementar retry exponencial en errores de sync
- [ ] Agregar tests de hooks offline
- [ ] Implementar 3 tests E2E básicos
- [ ] Habilitar ESLint en build

### P2 - Medio (3-4 semanas)
- [ ] Mejorar resolución de conflictos (UI manual)
- [ ] Agregar sincronización selectiva por prioridad
- [ ] Implementar compresión de datos para sync
- [ ] Notificaciones push cuando vuelve online

---

## 10. Flujos Offline Críticos

### 10.1 Bitácora de Seguridad
```
1. Encargado registra evento (sin conexión)
2. Evento guardado en IndexedDB con status: 'pending'
3. Al detectar conexión: SyncManager envía a API
4. API responde con ID del servidor
5. Actualizar registro local con status: 'synced'
```

### 10.2 Recepción de Paquetes
```
1. Llega paquete, encargado registra
2. Foto guardada como blob en IndexedDB
3. Sync: enviar datos + foto al servidor
4. Notificar al destinatario (servidor)
```

### 10.3 Rondas de Vigilancia
```
1. Encargado inicia ronda
2. Cada checkpoint: timestamp + ubicación (si disponible)
3. Al finalizar: guardar ronda completa
4. Sync: enviar ronda al servidor
```

---

## 11. Consideraciones de Dispositivos

### Hardware Target
- Smartphones Android gama media-baja
- Conexión intermitente (sótanos, zonas sin cobertura)
- Storage limitado (~100MB máximo para app)

### Optimizaciones Necesarias
- [ ] Limitar cache de fotos a últimos 50 paquetes
- [ ] Purgar registros sincronizados > 30 días
- [ ] Compresión de imágenes antes de guardar

---

## 12. Comandos de Desarrollo

```bash
# Desarrollo
pnpm dev --filter=staff-app

# Build
pnpm build --filter=staff-app

# Tests (cuando existan)
pnpm test --filter=staff-app
```

---

## 13. Verificación de Build Vercel

### Checklist Pre-Deploy
- [ ] `pnpm build --filter=staff-app` exitoso
- [ ] Service Worker incluye rutas offline
- [ ] Manifest válido
- [ ] IndexedDB schema correcto

### Variables de Entorno
```env
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NEXT_PUBLIC_API_URL=
SENTRY_DSN=
```

---

## 14. Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Pérdida de datos offline | Media | Alto | Tests + backups locales |
| Conflictos de sync | Alta | Medio | UI de resolución manual |
| Storage lleno | Baja | Alto | Purga automática |
| SW desactualizado | Media | Medio | Versioning + force refresh |

---

**Última actualización:** 5 de febrero de 2026
