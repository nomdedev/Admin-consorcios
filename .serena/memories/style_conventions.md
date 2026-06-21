Code conventions and guidelines:
- Role-based access control (RBAC) with roles: SUPER_ADMIN, ADMINISTRADOR, ADMIN_STAFF, PROPIETARIO, INQUILINO, ENCARGADO, AUDITOR, PROVEEDOR_EXTERNO.
- Multi-tenancy: always include consorcioId in queries; RLS enforced. Avoid global queries without consorcioId.
- Financial operations must write AuditLog entries (immutable audit trail).
- UI accessibility: interactive elements must be 44x44px min (min-h-touch/min-w-touch), include aria-labels, and meet contrast ratios. Provide simplified vs complete mode toggles based on UI store.
- Feature-based architecture in frontend apps (features/<feature>/components|hooks|api|types).
- Prefer Zustand for UI state, TanStack Query for server state.
Refs: .github/copilot-instructions.md, docs/architecture/ARCH-001-system-overview.md, context.md.