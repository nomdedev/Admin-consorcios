Project: VecinoSimple (Admin-consorcios)
Purpose: SaaS B2B2C platform for condo (consorcio) administration in Argentina. Priorities: digital inclusion ("Abuela-Proof"), financial transparency (every expense with invoice), and operational automation.
Monorepo: apps/ (admin-web, resident-app, staff-app, api) + packages/ (ui, business-logic, api-client, database, config). Turbo-based workflow, npm workspaces.
Key apps:
- admin-web: Next.js 14 App Router for administrators.
- resident-app: Next.js PWA for residents.
- staff-app: Next.js PWA offline-first for building staff.
- api: NestJS backend with Prisma/Postgres.
Architecture refs: docs/architecture/ARCH-001-system-overview.md, ARCH-002-tech-stack.md.
Note: root README.md appears to be unrelated (Supabase CLI) and not project-specific; rely on PROJECT-README.md and docs/.