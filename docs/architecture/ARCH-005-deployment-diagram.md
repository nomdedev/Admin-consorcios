```
🌐 PRODUCCIÓN - URLs Públicas

┌─────────────────────────────────────────────────────────────┐
│                    INTERNET                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ admin.          │ │ app.            │ │ staff.          │
│ vecinosimple.com│ │ vecinosimple.com│ │ vecinosimple.com│
│                 │ │                 │ │                 │
│ 🖥️  Next.js     │ │ 📱 Next.js PWA  │ │ 👷 Next.js PWA  │
│ Admin Portal    │ │ Resident App    │ │ Staff App       │
│                 │ │                 │ │                 │
│ Vercel          │ │ Vercel          │ │ Vercel          │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │           │           │
          └───────────┼───────────┘
                      │
                      ▼

            ┌─────────────────┐
            │ api.            │
            │ vecinosimple.com│
            │                 │
            │ 🚀 NestJS       │
            │ Backend API     │
            │                 │
            │ Railway         │
            └─────────────────┘
                      │
                      ▼

            ┌─────────────────┐
            │ 🗄️  PostgreSQL   │
            │ Supabase        │
            │                 │
            │ Managed DB      │
            └─────────────────┘

DESARROLLO LOCAL:

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ localhost:3000  │ │ localhost:3001  │ │ localhost:3002  │ │ localhost:3001  │
│ Admin Web       │ │ Resident App    │ │ Staff App       │ │ API Backend     │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 🔗 Comunicación HTTP

1. **Frontend → Backend:**
   ```javascript
   fetch('https://api.vecinosimple.com/auth/login', {
     method: 'POST',
     headers: { 'Authorization': 'Bearer <jwt>' }
   })
   ```

2. **Backend → Database:**
   ```javascript
   // Prisma conecta automáticamente
   const users = await prisma.user.findMany()
   ```

3. **Frontend → Supabase Storage:**
   ```javascript
   // Directo desde el browser
   const { data } = await supabase.storage.from('files').upload(file)
   ```

### 🎯 Analogía Perfecta

Es como tener **4 tiendas diferentes**:
- Cada tienda tiene su propia dirección web
- Todas las tiendas comparten el mismo **almacén central** (API)
- El almacén tiene su propio **sistema de inventario** (Base de datos)
- Los clientes van a la tienda que necesitan, pero el inventario es compartido</content>
<parameter name="filePath">d:\martin\Proyectos\Admin-consorcios\docs\architecture\ARCH-005-deployment-diagram.md