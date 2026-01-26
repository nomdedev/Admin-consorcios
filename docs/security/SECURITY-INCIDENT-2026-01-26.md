# 🚨 INCIDENTE DE SEGURIDAD - ACCIONES REQUERIDAS

## ⚠️ ALERTA CRÍTICA

**Fecha:** 26 Enero 2026
**Estado:** Secrets comprometidos detectados por GitGuardian

## 📋 Secrets Comprometidos

Los siguientes secrets fueron expuestos en el repositorio y deben ser rotados **INMEDIATAMENTE**:

### 1. Supabase Service Role JWT
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2aXZ1aWx2enBqYmlqaHpodnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxMzc4OSwiZXhwIjoyMDg0NDg5Nzg5fQ.0-OEOqTNMSjCS5i3IDVbvh5u6tQcJygVlFTzZ1F3EvA
```

### 2. PostgreSQL Database URL
```
postgres://postgres.zvivuilvzpjbijhzhvxj:r1xvHMH07LbtG9ty@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### 3. JWT Secrets
```
dHJ3kiJi2nBhaUDBwd8dc9DWJ1XJG/nLhkoLog+3iOhgaJOZJSAJKStB+DIvQSWW
```

### 4. Supabase Anon Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2aXZ1aWx2enBqYmlqaHpodnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTM3ODksImV4cCI6MjA4NDQ4OTc4OX0.D1GSmPiZFokt2tv30TGldHmRTWpBvAKM8d87txZTlBo
```

## 🔧 ACCIONES INMEDIATAS

### 1. Rotar Supabase Keys
```bash
# En Supabase Dashboard:
# Settings → API → Regenerate keys
# - Regenerate Anon Key
# - Regenerate Service Role Key
```

### 2. Cambiar Database Password
```bash
# En Supabase Dashboard:
# Settings → Database → Reset password
```

### 3. Generar Nuevos JWT Secrets
```bash
# Generar secrets seguros:
openssl rand -base64 32
```

### 4. Actualizar Variables de Entorno
- **Railway (Backend):** Actualizar todas las variables
- **Vercel (Frontend):** Actualizar SUPABASE_ANON_KEY y SUPABASE_URL
- **Variables locales:** Regenerar .env files

## 📝 LECCIONES APRENDIDAS

1. **NUNCA** hardcode secrets en scripts
2. **SIEMPRE** usar variables de entorno
3. **NUNCA** commitear archivos con secrets reales
4. **SIEMPRE** verificar con GitGuardian antes de push
5. **Scripts de setup** deben usar placeholders, no valores reales

## ✅ VERIFICACIÓN

- [ ] Supabase keys rotadas
- [ ] Database password cambiada
- [ ] JWT secrets regenerados
- [ ] Variables de entorno actualizadas en todos los entornos
- [ ] Deploy de emergencia realizado
- [ ] Usuarios notificados sobre posible breach

## 📞 CONTACTOS

- **GitGuardian:** Revisar dashboard para confirmar resolución
- **Supabase Support:** Reportar breach si es necesario
- **Equipo:** Notificar sobre cambios de credenciales</content>
<parameter name="filePath">d:\martin\Proyectos\Admin-consorcios\SECURITY-INCIDENT-2026-01-26.md