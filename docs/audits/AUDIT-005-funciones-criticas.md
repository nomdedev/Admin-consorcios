# 📌 AUDIT-005: Funciones Críticas (Documentación)

**Fecha:** 5 de febrero de 2026  
**Objetivo:** Documentar funciones críticas del sistema para mantenimiento y auditoría.

---

## 1) Autenticación y Sesión

- **Generación y validación de JWT**
  - Archivo: [apps/api/src/modules/auth/auth.service.ts](apps/api/src/modules/auth/auth.service.ts)
  - Riesgo: acceso no autorizado si falla validación.

- **Middleware de autenticación en frontend**
  - Archivo: [apps/admin-web/src/middleware.ts](apps/admin-web/src/middleware.ts)
  - Riesgo: bypass de autenticación si el token no se valida.

---

## 2) Pagos y Webhooks

- **Procesamiento de pagos y conciliación**
  - Archivo: [apps/api/src/modules/pagos/pagos.service.ts](apps/api/src/modules/pagos/pagos.service.ts)
  - Riesgo: doble imputación, estado inconsistente, fraude.

- **Webhook Mercado Pago (firma HMAC)**
  - Archivo: [apps/api/src/modules/pagos/pagos.controller.ts](apps/api/src/modules/pagos/pagos.controller.ts)
  - Riesgo: spoofing de notificaciones si no se valida firma.

---

## 3) Expensas y Liquidación

- **Cálculo de expensas y prorrateo**
  - Archivo: [apps/api/src/modules/expensas/expensas.service.ts](apps/api/src/modules/expensas/expensas.service.ts)
  - Riesgo: montos incorrectos, conflictos legales.

- **Generación de PDF**
  - Archivo: [apps/api/src/modules/pdf/pdf.service.ts](apps/api/src/modules/pdf/pdf.service.ts)
  - Riesgo: documentos inválidos o incompletos.

---

## 4) Gastos y Transparencia

- **Registro y validación de gastos**
  - Archivo: [apps/api/src/modules/gastos/gastos.service.ts](apps/api/src/modules/gastos/gastos.service.ts)
  - Riesgo: datos inválidos, falta de comprobantes, auditoría defectuosa.

---

## 5) Auditoría Inmutable

- **Registro de auditoría (AuditLog)**
  - Archivo: [apps/api/src/modules/audit/audit.service.ts](apps/api/src/modules/audit/audit.service.ts)
  - Riesgo: pérdida de trazabilidad legal.

---

## 6) Sync Offline (Staff App)

- **Cola offline + sincronización**
  - Archivo: [apps/staff-app/src/offline/sync-manager.ts](apps/staff-app/src/offline/sync-manager.ts)
  - Riesgo: pérdida de datos offline, conflictos de sincronización.

---

## 7) Seguridad de Datos Sensibles

- **Cifrado por campo (DB)**
  - Archivo: [apps/api/src/database/prisma.service.ts](apps/api/src/database/prisma.service.ts)
  - Riesgo: exposición de PII (DNI/CBU/telefono).

---

## 8) Notificaciones Críticas

- **Alertas de emergencia multicanal**
  - Archivo: [apps/api/src/modules/alertas/alertas.service.ts](apps/api/src/modules/alertas/alertas.service.ts)
  - Riesgo: fallos en comunicación de emergencia.
