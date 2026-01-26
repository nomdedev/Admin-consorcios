# Configuración de Supabase - VecinoSimple

## 🚀 Problema Actual

Las páginas no aparecen en v0.dev y no se puede instalar la integración de Supabase porque faltan las variables de entorno configuradas.

## ✅ Solución

### 1. Configurar Supabase Project

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **Settings → API**
4. Copia los siguientes valores:
   - **Project URL**
   - **anon/public key**
   - **service_role key**

### 2. Ejecutar Script de Configuración

```bash
# Hacer el script ejecutable (solo en Linux/Mac)
chmod +x scripts/setup-supabase.sh

# Ejecutar el script
./scripts/setup-supabase.sh
```

El script te pedirá:
- Project Ref (ej: `supabase-purple-dog`)
- Project URL
- anon key
- service_role key

### 3. Configurar Variables en Plataformas

#### Railway (Backend)
Ve a tu proyecto en Railway y configura estas variables:
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
SUPABASE_BUCKET=vecinosimple-uploads
```

#### Vercel (Frontend Apps)
Para cada app en Vercel, configura:
```
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Crear Bucket de Storage

El script crea automáticamente el bucket `vecinosimple-uploads`. Verifícalo en:
**Supabase Dashboard → Storage**

### 5. Verificar Configuración

```bash
# Verificar que todo compile
pnpm run type-check

# Verificar que se pueda hacer build
pnpm run build
```

## 🔧 Configuración Manual (si el script falla)

Si el script no funciona, configura manualmente:

### Actualizar .env
```bash
# Agregar al final de .env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
SUPABASE_BUCKET=vecinosimple-uploads
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

### Crear Bucket Manualmente
```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login
supabase login

# Crear bucket
supabase --project TU_PROJECT_REF storage create-bucket vecinosimple-uploads --public=false
```

## 📋 Checklist de Verificación

- [ ] Supabase project creado
- [ ] Variables de entorno configuradas en Railway
- [ ] Variables de entorno configuradas en Vercel (cada app)
- [ ] Bucket `vecinosimple-uploads` existe en Supabase
- [ ] `pnpm run type-check` pasa sin errores
- [ ] `pnpm run build` funciona
- [ ] Páginas aparecen en v0.dev
- [ ] Integración de Supabase se puede instalar

## 🆘 Troubleshooting

### Error: "No se puede instalar integración de Supabase"
- Verifica que las variables `NEXT_PUBLIC_SUPABASE_*` estén configuradas en Vercel
- Asegúrate de que el proyecto de Supabase esté activo

### Error: "Bucket no existe"
```bash
supabase --project TU_PROJECT_REF storage create-bucket vecinosimple-uploads --public=false
```

### Error: "Variables no se aplican"
- Reinicia los deployments en Vercel/Railway
- Verifica que no haya espacios extra en las variables

### Páginas no aparecen en v0.dev
- Las variables de entorno deben estar configuradas en v0.dev también
- Verifica que el build sea exitoso