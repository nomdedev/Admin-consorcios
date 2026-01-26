# Estándares de Código - VecinoSimple

> **Categoría:** GUIDE  
> **Versión:** 1.0  
> **Última actualización:** Enero 2026  
> **Autor:** Equipo VecinoSimple

---

## 📋 Resumen

Este documento define los estándares de código para el proyecto VecinoSimple. Para instrucciones detalladas de Copilot, ver [copilot-instructions.md](../../.github/copilot-instructions.md).

---

## 🏗️ Arquitectura de Código

### Backend (NestJS)

```
apps/api/src/
├── common/                    # Utilidades compartidas
│   ├── decorators/           # Decoradores personalizados
│   ├── guards/               # Guards de seguridad
│   ├── interceptors/         # Interceptores
│   └── utils/                # Funciones utilitarias
├── database/                  # Configuración Prisma
├── modules/                   # Módulos de dominio
│   └── [nombre]/
│       ├── [nombre].module.ts
│       ├── [nombre].controller.ts
│       ├── [nombre].service.ts
│       └── dto/
│           ├── create-[nombre].dto.ts
│           ├── update-[nombre].dto.ts
│           └── index.ts
└── main.ts
```

### Frontend (Next.js)

```
apps/admin-web/src/
├── app/                       # App Router
│   ├── (auth)/               # Rutas de autenticación
│   ├── (dashboard)/          # Rutas protegidas
│   └── layout.tsx
├── components/                # Componentes globales
├── features/                  # Features por dominio
│   └── [nombre]/
│       ├── components/       # Componentes del feature
│       ├── hooks/            # Hooks del feature
│       ├── api/              # Llamadas API
│       └── types/            # Tipos locales
├── lib/                       # Utilidades
└── stores/                    # Zustand stores
```

---

## 📝 Convenciones de Nombres

### Archivos y Carpetas

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Componentes React | PascalCase | `UserCard.tsx` |
| Hooks | camelCase con `use` | `useExpensas.ts` |
| Utilidades | camelCase | `formatCurrency.ts` |
| Tipos/Interfaces | PascalCase | `UserContext.ts` |
| Módulos NestJS | kebab-case | `user-profile/` |
| DTOs | kebab-case | `create-user.dto.ts` |

### Variables y Funciones

```typescript
// ✅ Correcto
const userName = 'Juan';
const isLoading = true;
function getUserById(id: string) {}
async function fetchExpensas() {}

// ❌ Incorrecto
const user_name = 'Juan';    // snake_case
const IsLoading = true;      // PascalCase para variable
function GetUserById() {}    // PascalCase para función
```

### Componentes React

```typescript
// ✅ Correcto
export function UserCard({ user }: UserCardProps) {
  return <div>...</div>;
}

// ❌ Incorrecto
export const UserCard = (props) => {  // Sin tipos
  return <div>...</div>;
};
```

---

## 🔒 Reglas de Seguridad (CRÍTICAS)

### NUNCA hacer esto

```typescript
// ❌ Query sin filtro de consorcio (vulnerabilidad RLS)
const gastos = await prisma.gasto.findMany();

// ❌ Loguear datos sensibles
console.log(`Usuario: ${user.email}, DNI: ${user.dni}`);

// ❌ SQL raw con interpolación
const users = await prisma.$queryRaw`SELECT * FROM users WHERE id = ${id}`;
```

### SIEMPRE hacer esto

```typescript
// ✅ Filtrar por consorcio
const gastos = await prisma.gasto.findMany({
  where: { consorcioId: user.consorcioActivo }
});

// ✅ Usar logger con redacción
this.logger.log(`Usuario autenticado`, { email: this.maskEmail(user.email) });

// ✅ Usar Prisma parameterizado (el template literal ES seguro)
const users = await prisma.$queryRaw`SELECT * FROM users WHERE id = ${id}`;
```

---

## ♿ Accesibilidad (OBLIGATORIA)

### Botones e Interactivos

```typescript
// ❌ Incorrecto
<button onClick={handleClick}>X</button>

// ✅ Correcto
<Button 
  onClick={handleClick}
  aria-label="Cerrar diálogo"
  className="min-h-touch min-w-touch"
>
  <XIcon aria-hidden="true" />
  <span className="sr-only">Cerrar</span>
</Button>
```

### Tamaños Mínimos

- Elementos interactivos: **44x44px mínimo**
- Usar clases `min-h-touch` y `min-w-touch`
- Contraste de texto: **4.5:1 mínimo**

---

## 📊 DTOs y Validación

### Backend (class-validator)

```typescript
import { IsString, IsEmail, Min, Max, Matches } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(2, { message: 'Nombre muy corto' })
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @Matches(/^\d{7,8}$/, { message: 'DNI debe tener 7 u 8 dígitos' })
  dni?: string;
}
```

### Frontend (Zod)

```typescript
import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(2, 'Nombre muy corto').max(100),
  dni: z.string().regex(/^\d{7,8}$/, 'DNI inválido').optional(),
});

export type UserInput = z.infer<typeof userSchema>;
```

---

## 🧪 Testing

### Naming de Tests

```typescript
// Formato: describe -> should -> when
describe('UserService', () => {
  describe('create', () => {
    it('should create user when valid data provided', async () => {});
    it('should throw error when email already exists', async () => {});
  });
});
```

### Estructura de Test

```typescript
it('should do something', async () => {
  // Arrange
  const input = { ... };
  
  // Act
  const result = await service.method(input);
  
  // Assert
  expect(result).toBeDefined();
  expect(result.id).toBe(expectedId);
});
```

---

## 📦 Imports

### Orden de Imports

```typescript
// 1. Módulos de Node/externos
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// 2. Módulos del monorepo (@packages)
import { Button } from '@vecinosimple/ui';

// 3. Imports relativos (lejanos primero)
import { PrismaService } from '../../database/prisma.service';

// 4. Imports locales
import { CreateUserDto } from './dto';
```

---

## 💰 Manejo de Montos

```typescript
// ✅ Correcto: Usar Decimal de Prisma
import { Decimal } from '@prisma/client/runtime/library';

const monto = new Decimal(dto.monto);

// ✅ Correcto: Formatear para UI
import { formatCurrency } from '@/lib/utils';
const display = formatCurrency(Number(monto)); // "$10.000,00"

// ❌ Incorrecto: Operaciones con float
const total = monto1 + monto2; // Puede perder precisión
```

---

## 📚 Referencias

- [copilot-instructions.md](../../.github/copilot-instructions.md) - Instrucciones detalladas
- [Prisma Best Practices](https://www.prisma.io/docs/guides)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
