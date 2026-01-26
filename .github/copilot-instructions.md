# Copilot Instructions - VecinoSimple

## Descripción del Proyecto
Plataforma SaaS B2B2C para administración de consorcios en Argentina. Prioriza:
- **Inclusión digital** de adultos mayores ("Abuela-Proof")
- **Transparencia financiera** (cada gasto con factura visible)
- **Automatización operativa** para administradores

## Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| Monorepo | Turborepo + pnpm | Builds incrementales, caching remoto |
| Frontend | Next.js 14+ (App Router) | Server Components, streaming |
| Backend | NestJS | TypeScript, modular, Swagger nativo |
| Base de Datos | PostgreSQL + Prisma | RLS para multi-tenancy |
| UI | Radix UI + Tailwind + CVA | Accesibilidad WCAG 2.1 AA |
| Estado | Zustand (UI) + TanStack Query (server) | Minimal boilerplate |
| Formularios | React Hook Form + Zod | Validación compartida cliente/servidor |
| Offline | Dexie.js (IndexedDB) | Staff app sin conexión |
| Deploy | Vercel (frontend) + Railway (backend + DB) | Costo bajo, setup rápido |

## Estructura del Monorepo

```
vecinosimple/
├── apps/
│   ├── admin-web/        # Portal Administradores
│   ├── resident-app/     # PWA Vecinos
│   ├── staff-app/        # PWA Encargados (Offline-First)
│   └── api/              # NestJS Backend
├── packages/
│   ├── ui/               # Design System compartido
│   ├── business-logic/   # Calculadores, validadores
│   ├── api-client/       # Cliente tipado (OpenAPI)
│   ├── database/         # Prisma schema
│   └── config/           # ESLint, TypeScript, Tailwind
└── tooling/
    ├── scripts/          # Importador Excel, backups
    └── docker/
```

## Convenciones de Código

### Roles del Sistema (RBAC)
```typescript
// 8 roles con permisos diferenciados
SUPER_ADMIN        // VecinoSimple staff - acceso total
ADMINISTRADOR      // Dueño de la administración
ADMIN_STAFF        // Empleado del admin (carga facturas, NO borra consorcios)
PROPIETARIO        // Vota, ve extraordinarios
INQUILINO          // Paga ordinarias, NO ve extraordinarios ni vota
ENCARGADO          // App offline (bitácora, paquetes)
AUDITOR            // Consejo - solo lectura financiera
PROVEEDOR_EXTERNO  // Sube facturas/fotos de trabajos
```

### Copropietarios y Unidades Múltiples
```typescript
// Una UF puede tener múltiples usuarios, pero solo 1 vota
enum TipoVinculoUF {
  TITULAR_VOTANTE    // Ejerce el voto (1 por UF)
  COPROPIETARIO      // Ve todo, NO vota (cónyuge, herederos)
  INQUILINO_PRINCIPAL // Paga expensas
}

// Un usuario puede tener múltiples UFs en distintos consorcios
// UI: Dropdown "Viendo como: Depto 4B (Edificio A)" → Cambiar
```

### Arquitectura por Feature (Apps Frontend)
```
apps/resident-app/src/
├── app/                  # App Router routes
├── features/
│   ├── expensas/
│   │   ├── components/   # UI específica del feature
│   │   ├── hooks/        # useExpensas, usePagarExpensa
│   │   ├── api/          # Llamadas al backend
│   │   └── types/        # Tipos locales
│   └── pagos/
└── lib/                  # Utilidades de la app
```

### Módulos NestJS (Backend)
```
apps/api/src/modules/
├── auth/                 # Magic Links, JWT, 2FA
├── consorcios/           # CRUD + RLS
├── expensas/             # Liquidación
├── gastos/               # Con adjunto obligatorio
├── pagos/                # Mercado Pago Split
└── notificaciones/       # WhatsApp + Email
```

## Principios de Diseño UI

### Accesibilidad OBLIGATORIA
```typescript
// ❌ NUNCA hacer esto
<button onClick={handleClick}>X</button>

// ✅ SIEMPRE hacer esto
<Button 
  onClick={handleClick}
  aria-label="Cerrar diálogo"
  className="min-h-touch min-w-touch" // 44x44px mínimo
>
  <XIcon aria-hidden="true" />
  <span className="sr-only">Cerrar</span>
</Button>
```

### Tamaños Táctiles
- Mínimo 44x44px para elementos interactivos
- Usar clases `min-h-touch` y `min-w-touch` de Tailwind config

### Contraste de Colores
- Texto normal: ratio mínimo 4.5:1
- Texto grande (>18px): ratio mínimo 3:1
- Usar colores de `themes/high-contrast.ts` para modo accesible

### Modo Simplificado vs Completo
```typescript
// Usar el store de UI para condicionar features
const { modo } = useUIStore()

return modo === 'simplificado' 
  ? <ExpensaCardSimple />      // Solo: monto + botón pagar
  : <ExpensaCardCompleta />    // Desglose detallado
```

## Base de Datos

### Multi-tenancy con RLS
SIEMPRE incluir `consorcioId` en queries. El schema usa Row Level Security.

```typescript
// ❌ PELIGROSO - Puede filtrar datos entre consorcios
const gastos = await prisma.gasto.findMany()

// ✅ CORRECTO - Filtrar por consorcio del usuario
const gastos = await prisma.gasto.findMany({
  where: { consorcioId: user.consorcioActivo }
})
```

### Auditoría Inmutable
Operaciones financieras (gastos, pagos, votos) DEBEN generar `AuditLog`:

```typescript
// Ver modelo AuditLog en schema.prisma
await prisma.auditLog.create({
  data: {
    usuarioId: user.id,
    accion: 'CREATE',
    entidad: 'Gasto',
    entidadId: gasto.id,
    datosNuevos: gasto,
  }
})
```

## Manejo de Pagos (CRÍTICO)

**La plataforma NO toca el dinero del consorcio.**

```
Vecino paga $10,000
    │
    ├──▶ $9,800 → CBU del Consorcio (Split automático)
    │
    └──▶ $200 → Cuenta VecinoSimple (Fee 2%)
```

Esto evita regulaciones BCRA y simplifica compliance.

## Offline-First (Staff App)

### Flujo de Sincronización
1. Usuario crea registro offline → IndexedDB con `syncStatus: 'pending'`
2. Service Worker detecta conexión
3. Sync en background (FIFO)
4. Conflictos: "Last Write Wins" con timestamp del servidor

### Datos sincronizables offline
- ✅ Bitácora de seguridad
- ✅ Recepción de paquetes
- ✅ Rondas de vigilancia
- ❌ Pagos (requiere conexión)
- ❌ Votaciones (requiere conexión)

## Integraciones Externas

| Servicio | Uso | Documentación |
|----------|-----|---------------|
| AFIP | Validación CAE, F.931 | Ver `integrations/afip/` |
| Mercado Pago | Split payments | Ver `integrations/mercadopago/` |
| WhatsApp Business | Notificaciones + Bot saldo | Ver `integrations/whatsapp/` |

## Roadmap MVP vs Futuro

### ✅ MVP (Fase 1 - Lanzamiento)
- Dashboard financiero (carga gastos, prorrateo automático)
- Gestión de pagos (Mercado Pago integrado)
- Comunicados (muro + envío mail/WhatsApp)
- Tickets de reclamos básico

### ⏳ Fase 2 (Post-Lanzamiento)
- Asambleas virtuales / Votación (killer feature para upselling)
- Marketplace de proveedores
- Reserva de amenities

### ❌ NO incluir en MVP
- Liquidación SUTERH completa (solo importar PDF + monto final)
- Cálculo automático de sueldos (demasiado complejo)

## Comandos de Desarrollo

```bash
# Instalar dependencias
pnpm install

# Desarrollo (todas las apps)
pnpm dev

# Desarrollo (app específica)
pnpm dev --filter=admin-web

# Base de datos
pnpm db:migrate      # Ejecutar migraciones
pnpm db:seed         # Datos de prueba
pnpm db:studio       # Prisma Studio

# Tests
pnpm test            # Unit tests (Vitest)
pnpm test:e2e        # E2E (Playwright)

# Build producción
pnpm build
```

## Referencias
- [Arquitectura detallada](../docs/architecture/ARCH-001-system-overview.md)
- [Stack de librerías](../docs/architecture/ARCH-002-tech-stack.md)
- [Schema de BD](../packages/database/prisma/schema.prisma)
- [Contexto del proyecto](../context.md)
