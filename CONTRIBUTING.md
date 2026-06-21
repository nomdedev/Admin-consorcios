# Guía de Contribución - VecinoSimple

¡Gracias por tu interés en contribuir a VecinoSimple! Esta guía te ayudará a entender el proceso de contribución y los estándares que seguimos.

## 📋 Tabla de Contenidos

- [Código de Conducta](#-código-de-conducta)
- [Primeros Pasos](#-primeros-pasos)
- [Flujo de Trabajo](#-flujo-de-trabajo)
- [Estilo de Código](#-estilo-de-código)
- [Convenciones de Commits](#-convenciones-de-commits)
- [Pull Requests](#-pull-requests)
- [Reportar Bugs](#-reportar-bugs)
- [Solicitar Features](#-solicitar-features)

---

## 📜 Código de Conducta

Este proyecto sigue un código de conducta inclusivo. Al participar, te comprometes a mantener un ambiente respetuoso y profesional para todos.

**Comportamientos esperados:**
- Usar lenguaje inclusivo y respetuoso
- Aceptar críticas constructivas con gracia
- Enfocarse en lo mejor para la comunidad
- Mostrar empatía hacia otros miembros

---

## 🚀 Primeros Pasos

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub, luego:
git clone https://github.com/TU-USUARIO/vecinosimple.git
cd vecinosimple
git remote add upstream https://github.com/nomdedev/vecinosimple.git
```

### 2. Configurar Entorno

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Configurar base de datos
npm run db:migrate
npm run db:seed  # Datos de prueba

# Verificar que todo funciona
npm run dev
npm run test
```

### 3. Crear Branch

```bash
# Actualizar main
git checkout main
git pull upstream main

# Crear branch para tu feature/fix
git checkout -b feat/nombre-descriptivo
# o
git checkout -b fix/descripcion-del-bug
```

---

## 🔄 Flujo de Trabajo

### Proceso de Desarrollo

```
1. Issue → 2. Branch → 3. Código → 4. Tests → 5. PR → 6. Review → 7. Merge
```

1. **Issue**: Verifica que exista un issue o créalo
2. **Branch**: Crea branch desde `main`
3. **Código**: Implementa siguiendo los estándares
4. **Tests**: Agrega/actualiza tests relevantes
5. **PR**: Abre Pull Request con template
6. **Review**: Responde a comentarios del review
7. **Merge**: Un maintainer hace merge

### Mantener Sincronizado

```bash
# Actualizar tu fork regularmente
git fetch upstream
git checkout main
git merge upstream/main
git push origin main

# Rebase tu branch si es necesario
git checkout tu-branch
git rebase main
```

---

## 🎨 Estilo de Código

### TypeScript

- **Tipado estricto**: No usar `any` sin justificación
- **Interfaces sobre Types**: Para objetos con forma definida
- **Naming conventions**:
  - `PascalCase`: Componentes, Types, Interfaces, Clases
  - `camelCase`: Variables, funciones, métodos
  - `UPPER_SNAKE_CASE`: Constantes globales

```typescript
// ✅ Correcto
interface UserProfile {
  id: string;
  displayName: string;
  isActive: boolean;
}

function getUserById(id: string): Promise<UserProfile> {
  // ...
}

// ❌ Incorrecto
const get_user = (id: any) => { /* ... */ }
```

### React/Next.js

- **Functional components**: No usar class components
- **Hooks**: Seguir reglas de hooks de React
- **Props**: Siempre tipar con interfaces

```typescript
// ✅ Correcto
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={cn('btn', `btn-${variant}`)}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {children}
    </button>
  );
}
```

### NestJS (Backend)

- **Módulos por dominio**: Un módulo por entidad/feature
- **DTOs con class-validator**: Validación en todas las entradas
- **Services para lógica**: Controllers delgados

```typescript
// ✅ Correcto
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }
}
```

### Accesibilidad (WCAG 2.1 AA)

**OBLIGATORIO para todos los componentes UI:**

- Targets tocables mínimo 44x44px
- Contraste de color mínimo 4.5:1
- Labels en todos los inputs
- Aria attributes donde corresponda

```typescript
// ✅ Correcto - Accesible
<Button 
  onClick={handleSubmit}
  aria-label="Enviar formulario de contacto"
  className="min-h-[44px] min-w-[44px]"
>
  Enviar
</Button>

// ❌ Incorrecto - No accesible
<div onClick={handleSubmit}>Enviar</div>
```

### Herramientas de Formateo

El proyecto usa Prettier y ESLint configurados. Ejecuta antes de commit:

```bash
npm run lint        # Verificar errores
npm run lint:fix    # Corregir automáticamente
npm run format      # Formatear con Prettier
```

---

## 📝 Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/). El formato es:

```
<tipo>(<scope>): <descripción corta>

[cuerpo opcional]

[footer opcional]
```

### Tipos Permitidos

| Tipo | Descripción |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `style` | Formateo, sin cambio de lógica |
| `refactor` | Refactorización sin cambio de comportamiento |
| `test` | Agregar o corregir tests |
| `chore` | Mantenimiento, configuración |
| `perf` | Mejora de performance |

### Scopes Comunes

- `api`: Backend NestJS
- `admin`: Admin Web
- `resident`: Resident App
- `staff`: Staff App
- `ui`: Package UI
- `db`: Database/Prisma
- `deps`: Dependencias

### Ejemplos

```bash
# Feature nueva
feat(resident): agregar vista de detalle de expensa

# Bug fix
fix(api): corregir validación de fecha en pagos

# Documentación
docs: actualizar guía de contribución

# Refactor
refactor(admin): extraer lógica de tabla a hook reutilizable

# Tests
test(api): agregar tests para módulo de notificaciones

# Chore
chore(deps): actualizar Next.js a 14.2.0
```

### Configuración de Husky

El proyecto tiene hooks de pre-commit que:
1. Ejecutan `lint-staged` (ESLint + Prettier)
2. Validan formato de commit message

---

## 🔀 Pull Requests

### Antes de Abrir un PR

- [ ] Tests pasan localmente (`npm run test`)
- [ ] Lint pasa (`npm run lint`)
- [ ] Build funciona (`npm run build`)
- [ ] Has actualizado documentación si corresponde
- [ ] Commits siguen convenciones

### Template de PR

Al abrir un PR, completa el template:

```markdown
## Descripción
[Describe qué cambios incluye este PR]

## Tipo de Cambio
- [ ] Bug fix (cambio que corrige un issue)
- [ ] Feature (cambio que agrega funcionalidad)
- [ ] Breaking change (fix o feature que rompe compatibilidad)
- [ ] Documentación

## Issue Relacionado
Closes #[número]

## Checklist
- [ ] Mi código sigue los estándares del proyecto
- [ ] He agregado tests que prueban mi fix/feature
- [ ] Tests existentes pasan
- [ ] He actualizado la documentación
```

### Proceso de Review

1. **Asignación automática**: Los maintainers serán asignados
2. **CI checks**: Deben pasar todos los checks automáticos
3. **Code review**: Al menos 1 aprobación requerida
4. **Merge**: Squash and merge por defecto

### Responder a Reviews

- Responde a todos los comentarios
- Marca como "resolved" cuando hayas atendido el feedback
- Haz push de cambios solicitados
- Pide re-review cuando estés listo

---

## 🐛 Reportar Bugs

### Antes de Reportar

1. Busca en issues existentes
2. Verifica que no sea un error de configuración local
3. Reproduce el bug consistentemente

### Template de Bug Report

```markdown
## Descripción del Bug
[Descripción clara y concisa]

## Pasos para Reproducir
1. Ir a '...'
2. Click en '...'
3. Ver error

## Comportamiento Esperado
[Qué debería pasar]

## Comportamiento Actual
[Qué está pasando]

## Screenshots
[Si aplica]

## Entorno
- OS: [ej. Windows 11]
- Browser: [ej. Chrome 120]
- Node: [ej. 20.10.0]
- App: [admin-web / resident-app / staff-app / api]
```

---

## 💡 Solicitar Features

### Template de Feature Request

```markdown
## Problema
[Describe el problema que esta feature resolvería]

## Solución Propuesta
[Describe tu idea de solución]

## Alternativas Consideradas
[Otras opciones que consideraste]

## Contexto Adicional
[Screenshots, mockups, ejemplos, etc.]
```

### Criterios de Evaluación

Las features se evalúan según:
1. **Alineación**: ¿Encaja con la visión del producto?
2. **Impacto**: ¿Cuántos usuarios se benefician?
3. **Complejidad**: ¿Qué esfuerzo requiere?
4. **Prioridad**: ¿Es MVP o puede esperar?

---

## 📚 Recursos Adicionales

- [Guía de Getting Started](docs/guides/GUIDE-001-getting-started.md)
- [Estándares de Código](docs/guides/GUIDE-002-coding-standards.md)
- [Arquitectura del Sistema](docs/architecture/ARCH-001-system-overview.md)
- [Contexto del Proyecto](context.md)

---

## ❓ Preguntas

Si tienes dudas:
1. Revisa la documentación existente
2. Busca en issues cerrados
3. Abre un issue con la etiqueta `question`

---

¡Gracias por contribuir a VecinoSimple! 🏢
