# Stack de Librerías - VecinoSimple

## 1. UI Kit Accesible

### Decisión: Radix UI + Tailwind CSS + CVA

**¿Por qué no Chakra UI?**
- Chakra tiene bundle size grande (~70kb gzipped)
- Menos control sobre estilos para temas de alto contraste
- Radix + Tailwind = máxima flexibilidad con 0kb JS por defecto

**¿Por qué no shadcn/ui directamente?**
- Lo usaremos como *inspiración*, pero customizaremos para accesibilidad argentina

### Stack de UI:

```json
{
  "dependencies": {
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  }
}
```

### Configuración Tailwind para Accesibilidad:

```typescript
// packages/config/tailwind/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      // Tamaños de fuente accesibles (base 16px)
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.5' }],    // 14px
        'sm': ['1rem', { lineHeight: '1.5' }],        // 16px (base)
        'base': ['1.125rem', { lineHeight: '1.6' }],  // 18px
        'lg': ['1.25rem', { lineHeight: '1.6' }],     // 20px
        'xl': ['1.5rem', { lineHeight: '1.4' }],      // 24px
        '2xl': ['1.875rem', { lineHeight: '1.3' }],   // 30px
        '3xl': ['2.25rem', { lineHeight: '1.2' }],    // 36px
      },
      // Colores con contraste WCAG AA mínimo
      colors: {
        // Modo claro
        primary: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          500: '#4CAF50',  // Verde principal
          600: '#43A047',
          700: '#388E3C',  // Contraste 4.5:1 sobre blanco
          900: '#1B5E20',
        },
        // Semáforo de morosos
        moroso: {
          verde: '#2E7D32',   // Al día
          amarillo: '#F9A825', // 1-30 días
          naranja: '#EF6C00',  // 31-60 días
          rojo: '#C62828',     // 60+ días
        },
        // Alto contraste (para modo accesible)
        highContrast: {
          bg: '#000000',
          fg: '#FFFFFF',
          accent: '#FFFF00',
          link: '#00FFFF',
        }
      },
      // Espaciado táctil mínimo (44x44px según WCAG)
      spacing: {
        'touch': '2.75rem',  // 44px
        'touch-lg': '3rem',  // 48px
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

export default config
```

---

## 2. Manejo de Estado

### Decisión: Zustand (cliente) + TanStack Query (servidor)

**¿Por qué no Redux?**
- Boilerplate excesivo para nuestro caso
- Zustand tiene API más simple y bundle más pequeño (1kb)

**¿Por qué no solo Context API?**
- Re-renders innecesarios en árboles grandes
- Sin middleware nativo para persistencia/devtools

### Stack de Estado:

```json
{
  "dependencies": {
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.17.0",
    "@tanstack/react-query-devtools": "^5.17.0"
  }
}
```

### Arquitectura de Estado:

```typescript
// Estado Global (Zustand) - Solo UI/preferencias
// packages/ui/src/stores/ui.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Preferencias de accesibilidad
  modo: 'completo' | 'simplificado'
  tema: 'claro' | 'oscuro' | 'auto'
  tamañoTexto: 'normal' | 'grande' | 'extra-grande'
  
  // Sidebar
  sidebarAbierto: boolean
  
  // Actions
  setModo: (modo: UIState['modo']) => void
  setTema: (tema: UIState['tema']) => void
  setTamañoTexto: (tamaño: UIState['tamañoTexto']) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      modo: 'completo',
      tema: 'auto',
      tamañoTexto: 'normal',
      sidebarAbierto: true,
      
      setModo: (modo) => set({ modo }),
      setTema: (tema) => set({ tema }),
      setTamañoTexto: (tamañoTexto) => set({ tamañoTexto }),
      toggleSidebar: () => set((state) => ({ 
        sidebarAbierto: !state.sidebarAbierto 
      })),
    }),
    {
      name: 'vecinosimple-ui',
    }
  )
)

// Estado del Servidor (TanStack Query) - Datos de negocio
// apps/resident-app/src/features/expensas/hooks/useExpensas.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@vecinosimple/api-client'

export const expensasKeys = {
  all: ['expensas'] as const,
  lists: () => [...expensasKeys.all, 'list'] as const,
  list: (consorcioId: string) => [...expensasKeys.lists(), consorcioId] as const,
  details: () => [...expensasKeys.all, 'detail'] as const,
  detail: (id: string) => [...expensasKeys.details(), id] as const,
}

export function useExpensas(consorcioId: string) {
  return useQuery({
    queryKey: expensasKeys.list(consorcioId),
    queryFn: () => apiClient.expensas.list(consorcioId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export function usePagarExpensa() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: apiClient.pagos.crear,
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: expensasKeys.all })
      queryClient.invalidateQueries({ queryKey: ['cuenta-corriente'] })
    },
  })
}
```

---

## 3. Formularios y Validación

### Decisión: React Hook Form + Zod

**¿Por qué React Hook Form?**
- Performance: no re-renderiza en cada keystroke
- Integración nativa con componentes Radix
- Tamaño pequeño (~9kb)

**¿Por qué Zod?**
- Type inference automático (schema → TypeScript types)
- Validación en cliente Y servidor (schema compartido)
- Mensajes de error en español fácilmente

### Stack de Formularios:

```json
{
  "dependencies": {
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4"
  }
}
```

### Ejemplo de Validación:

```typescript
// packages/business-logic/src/validators/pago.validator.ts
import { z } from 'zod'

export const pagoSchema = z.object({
  monto: z
    .number({
      required_error: 'El monto es obligatorio',
      invalid_type_error: 'El monto debe ser un número',
    })
    .positive('El monto debe ser mayor a 0')
    .max(10_000_000, 'El monto no puede superar $10.000.000'),
  
  metodoPago: z.enum(['MERCADO_PAGO', 'TRANSFERENCIA', 'EFECTIVO'], {
    required_error: 'Seleccioná un método de pago',
  }),
  
  periodosAbonados: z
    .array(z.string().regex(/^\d{4}-\d{2}$/, 'Formato inválido'))
    .min(1, 'Seleccioná al menos un período'),
  
  comentario: z
    .string()
    .max(500, 'El comentario no puede superar 500 caracteres')
    .optional(),
})

// Tipo inferido automáticamente
export type PagoInput = z.infer<typeof pagoSchema>

// Uso en componente React
// apps/resident-app/src/features/pagos/components/PagoForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { pagoSchema, type PagoInput } from '@vecinosimple/business-logic'

export function PagoForm() {
  const form = useForm<PagoInput>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      metodoPago: 'MERCADO_PAGO',
      periodosAbonados: [],
    },
  })
  
  const onSubmit = (data: PagoInput) => {
    // data está tipado y validado
    console.log(data)
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... */}
    </form>
  )
}
```

---

## 4. Offline-First (Staff App)

### Decisión: TanStack Query + Dexie.js (IndexedDB)

**¿Por qué no RxDB?**
- Overkill para nuestro caso (solo sincronización unidireccional)
- Dexie.js es más ligero y tiene mejor API

**¿Por qué no PouchDB + CouchDB?**
- Requiere infraestructura adicional (CouchDB server)
- Nuestro caso es más simple: offline CREATE, sync cuando hay conexión

### Stack Offline:

```json
{
  "dependencies": {
    "dexie": "^3.2.4",
    "dexie-react-hooks": "^1.1.7",
    "@tanstack/react-query-persist-client": "^5.17.0",
    "idb-keyval": "^6.2.1"
  }
}
```

### Implementación:

```typescript
// apps/staff-app/src/offline/db.ts
import Dexie, { type Table } from 'dexie'

interface BitacoraLocal {
  localId: string          // UUID generado offline
  tipo: string
  descripcion: string
  timestamp: Date
  syncStatus: 'pending' | 'synced' | 'error'
  syncError?: string
  serverData?: unknown     // Respuesta del servidor
}

interface PaqueteLocal {
  localId: string
  destinatarioUF: string
  remitente: string
  descripcion?: string
  fotoBlob?: Blob
  syncStatus: 'pending' | 'synced' | 'error'
  syncError?: string
}

class VecinoSimpleDB extends Dexie {
  bitacora!: Table<BitacoraLocal, string>
  paquetes!: Table<PaqueteLocal, string>

  constructor() {
    super('vecinosimple-staff')
    
    this.version(1).stores({
      bitacora: 'localId, syncStatus, timestamp',
      paquetes: 'localId, syncStatus, destinatarioUF',
    })
  }
}

export const db = new VecinoSimpleDB()

// apps/staff-app/src/offline/sync-manager.ts
import { db } from './db'
import { apiClient } from '@vecinosimple/api-client'

export class SyncManager {
  private isOnline = navigator.onLine
  
  constructor() {
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
    
    // Registrar sync en Service Worker
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register('sync-bitacora')
      })
    }
  }
  
  private handleOnline() {
    this.isOnline = true
    this.syncPendingItems()
  }
  
  private handleOffline() {
    this.isOnline = false
  }
  
  async syncPendingItems() {
    if (!this.isOnline) return
    
    // Sincronizar bitácora
    const pendingBitacora = await db.bitacora
      .where('syncStatus')
      .equals('pending')
      .toArray()
    
    for (const item of pendingBitacora) {
      try {
        const response = await apiClient.bitacora.create({
          tipo: item.tipo,
          descripcion: item.descripcion,
          timestamp: item.timestamp,
          localId: item.localId,
        })
        
        await db.bitacora.update(item.localId, {
          syncStatus: 'synced',
          serverData: response,
        })
      } catch (error) {
        await db.bitacora.update(item.localId, {
          syncStatus: 'error',
          syncError: error instanceof Error ? error.message : 'Error desconocido',
        })
      }
    }
  }
}
```

---

## 5. Otras Librerías Clave

### Fechas y Timezone
```json
{
  "dependencies": {
    "date-fns": "^3.2.0",
    "date-fns-tz": "^2.0.0"
  }
}
```
**¿Por qué date-fns?** Tree-shakeable, inmutable, locale español incluido.

### Tablas y DataGrids
```json
{
  "dependencies": {
    "@tanstack/react-table": "^8.11.0"
  }
}
```
**¿Por qué TanStack Table?** Headless, accesible, virtual scrolling nativo.

### PDF Generation (Expensas/Recibos)
```json
{
  "dependencies": {
    "@react-pdf/renderer": "^3.1.14"
  }
}
```

### Gráficos (Dashboard)
```json
{
  "dependencies": {
    "recharts": "^2.10.0"
  }
}
```

### Autenticación
```json
{
  "dependencies": {
    "next-auth": "^5.0.0-beta.4",
    "@auth/prisma-adapter": "^1.0.0"
  }
}
```

### Testing
```json
{
  "devDependencies": {
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.0",
    "playwright": "^1.41.0",
    "msw": "^2.1.0"
  }
}
```

---

## 6. Resumen de Dependencias por App

### `apps/admin-web`
```json
{
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "@tanstack/react-query": "^5.17.0",
    "@tanstack/react-table": "^8.11.0",
    "recharts": "^2.10.0",
    "@react-pdf/renderer": "^3.1.14",
    "next-auth": "^5.0.0-beta.4"
  }
}
```

### `apps/resident-app` (PWA)
```json
{
  "dependencies": {
    "next": "^14.1.0",
    "next-pwa": "^5.6.0",
    "react": "^18.2.0",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.5.0"
  }
}
```

### `apps/staff-app` (PWA Offline-First)
```json
{
  "dependencies": {
    "next": "^14.1.0",
    "next-pwa": "^5.6.0",
    "react": "^18.2.0",
    "@tanstack/react-query": "^5.17.0",
    "dexie": "^3.2.4",
    "dexie-react-hooks": "^1.1.7"
  }
}
```

### `apps/api` (NestJS)
```json
{
  "dependencies": {
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/swagger": "^7.2.0",
    "@prisma/client": "^5.8.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "mercadopago": "^2.0.0",
    "@nestjs/bull": "^10.0.0"
  }
}
```
