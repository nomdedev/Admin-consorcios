# 📚 Documentación - VecinoSimple

> **Última actualización:** 27 Enero 2026  
> **Versión:** 2.0.0

---

## ⭐ Documento Principal para Deploy

**[PROD-003-deploy-final.md](./project/PROD-003-deploy-final.md)** - Checklist ejecutable con solo tareas pendientes

---

## 📁 Estructura de Documentación

```
docs/
├── README.md                    # Este índice
├── architecture/                # 🏗️ Arquitectura y diseño técnico
│   ├── ARCH-001-system-overview.md
│   ├── ARCH-002-tech-stack.md
│   ├── ARCH-003-critical-features.md
│   └── ARCH-004-sitemap-ui.md
├── infrastructure/              # 🖥️ Infraestructura y deploy
│   └── INFRA-001-production-setup.md  # Guía detallada de servicios
├── security/                    # 🔒 Seguridad y auditorías
│   ├── SEC-001-initial-audit.md
│   ├── SEC-002-remediation-plan.md
│   ├── SEC-003-expert-audit.md
│   └── RED-001-pentest-report.md
├── guides/                      # 📖 Guías de desarrollo
│   ├── GUIDE-001-getting-started.md
│   ├── GUIDE-002-coding-standards.md
│   └── GUIDE-003-deployment.md
├── audits/                      # ✅ Auditorías de código
│   └── AUDIT-001-code-quality.md
├── project/                     # 📋 Gestión del proyecto
│   ├── README.md                # Índice del directorio
│   ├── PROD-003-deploy-final.md # ⭐ USAR ESTE PARA DEPLOY
│   ├── PROJ-001-roadmap.md
│   └── *-ARCHIVED.md            # Documentos históricos
└── _archive/                    # 📦 Documentos históricos
    └── prompt-estructura-original.md
```

---

## 🏷️ Convención de Nombres

### Prefijos por Categoría

| Prefijo | Categoría | Descripción |
|---------|-----------|-------------|
| `ARCH-` | Architecture | Diseño del sistema, stack, patrones |
| `SEC-` | Security | Auditorías, políticas, vulnerabilidades |
| `GUIDE-` | Guides | Guías de desarrollo y procedimientos |
| `PROJ-` | Project | Roadmap, sprints, decisiones |
| `PROD-` | Production | Deploy, checklists de producción |
| `INFRA-` | Infrastructure | Configuración de servicios |
| `AUDIT-` | Audit | Auditorías de código |
| `RED-` | Red Team | Pruebas de penetración |

### Numeración

- Formato: `PREFIX-NNN-nombre-descriptivo.md`
- Los números son secuenciales por categoría
- Usar guiones (`-`) para separar palabras
- Todo en minúsculas excepto el prefijo

### Ejemplos

```
✅ ARCH-001-system-overview.md
✅ SEC-003-expert-audit.md
✅ GUIDE-002-coding-standards.md
✅ PROD-003-deploy-final.md

❌ arquitectura.md           (sin prefijo)
❌ ARCH_001_overview.md      (underscores)
❌ arch-001-Overview.md      (mayúsculas en nombre)
```

---

## 🏗️ Arquitectura (`/architecture`)

Documentos sobre diseño y estructura técnica del sistema.

| Documento | Descripción |
|-----------|-------------|
| [ARCH-001-system-overview](./architecture/ARCH-001-system-overview.md) | Visión general de la arquitectura del sistema |
| [ARCH-002-tech-stack](./architecture/ARCH-002-tech-stack.md) | Stack tecnológico y justificaciones |
| [ARCH-003-critical-features](./architecture/ARCH-003-critical-features.md) | Funcionalidades críticas (KYC, alertas, snapshots, etc.) |
| [ARCH-004-sitemap-ui](./architecture/ARCH-004-sitemap-ui.md) | Mapa de sitio y arquitectura de interfaz |

---

## 🔒 Seguridad (`/security`)

Documentos de seguridad, auditorías y cumplimiento.

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [SEC-001-initial-audit](./security/SEC-001-initial-audit.md) | Primera auditoría de seguridad | ✅ Completado |
| [SEC-002-remediation-plan](./security/SEC-002-remediation-plan.md) | Plan de remediación de vulnerabilidades | ✅ Completado |
| [SEC-003-expert-audit](./security/SEC-003-expert-audit.md) | Auditoría exhaustiva OWASP | ✅ Completado |

### Resumen de Seguridad

```
Última auditoría: Enero 2026
Vulnerabilidades críticas: 0
Vulnerabilidades altas: 0 (1 corregida)
Estado general: ✅ APROBADO
```

---

## 📖 Guías (`/guides`)

Guías de desarrollo, procedimientos y mejores prácticas.

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [GUIDE-001-getting-started](./guides/GUIDE-001-getting-started.md) | Primeros pasos para desarrolladores | 📝 Pendiente |
| [GUIDE-002-coding-standards](./guides/GUIDE-002-coding-standards.md) | Estándares de código y convenciones | 📝 Pendiente |
| [GUIDE-003-deployment](./guides/GUIDE-003-deployment.md) | Guía de despliegue | 📝 Pendiente |

> **Nota:** Las guías detalladas están pendientes. Por ahora consultar [copilot-instructions.md](../.github/copilot-instructions.md).

---

## 📋 Proyecto (`/project`)

Documentos de gestión y planificación del proyecto.

| Documento | Descripción |
|-----------|-------------|
| [PROJ-001-roadmap](./project/PROJ-001-roadmap.md) | Roadmap y estado del proyecto |

---

## 🔗 Referencias Rápidas

### Documentos Clave

| Necesito... | Documento |
|-------------|-----------|
| Entender la arquitectura | [ARCH-001-system-overview](./architecture/ARCH-001-system-overview.md) |
| Ver el stack tecnológico | [ARCH-002-tech-stack](./architecture/ARCH-002-tech-stack.md) |
| Estado del proyecto | [PROJ-001-roadmap](./project/PROJ-001-roadmap.md) |
| Reglas de desarrollo | [copilot-instructions.md](../.github/copilot-instructions.md) |
| Schema de BD | [schema.prisma](../packages/database/prisma/schema.prisma) |
| Contexto general | [context.md](../context.md) |

### Documentación Externa

| Recurso | URL |
|---------|-----|
| Prisma Docs | https://www.prisma.io/docs |
| NestJS Docs | https://docs.nestjs.com |
| Next.js Docs | https://nextjs.org/docs |
| Tailwind CSS | https://tailwindcss.com/docs |

---

## 📝 Contribuir a la Documentación

### Crear Nuevo Documento

1. Identificar la categoría (`architecture`, `security`, `guides`, `project`)
2. Obtener el siguiente número secuencial de esa categoría
3. Crear archivo con formato: `PREFIX-NNN-nombre-descriptivo.md`
4. Agregar entrada a este README
5. Incluir header estándar:

```markdown
# Título del Documento

> **Categoría:** ARCH/SEC/GUIDE/PROJ  
> **Versión:** 1.0  
> **Última actualización:** Fecha  
> **Autor:** Nombre

---

## Contenido...
```

### Archivar Documento

Mover a `_archive/` con prefijo de fecha:
```
_archive/2026-01-doc-nombre-original.md
```

---

## 📊 Métricas de Documentación

| Categoría | Documentos | Completos | Pendientes |
|-----------|------------|-----------|------------|
| Architecture | 4 | 4 | 0 |
| Security | 3 | 3 | 0 |
| Guides | 3 | 0 | 3 |
| Project | 1 | 1 | 0 |
| **TOTAL** | **11** | **8** | **3** |

---

> 💡 **Tip:** Usa `Ctrl+F` para buscar por código de documento (ej: `SEC-003`)
