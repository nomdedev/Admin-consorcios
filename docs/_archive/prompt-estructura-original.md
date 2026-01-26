ACTÚA COMO:
Un Lead Frontend Engineer y Especialista en Design Systems (UX/UI), experto en Next.js (App Router), React Server Components y accesibilidad WCAG 2.1.

OBJETIVO:
Diseñar la arquitectura de interfaz y el flujo de navegación completo para "VecinoSimple". Debes estructurar el frontend para ser escalable, separando claramente el "Admin Portal" (Escritorio/Denso) de la "Resident App" (Móvil/Simple), pero compartiendo un Design System unificado.

INPUT DE CONTEXTO:
Ya tenemos definido el backend (NestJS) y los roles. Ahora necesitamos la Implementación Visual.

Filosofía: "Complejidad Oculta". El admin ve tableros de control complejos; el vecino (especialmente adultos mayores) ve tarjetas grandes y textos claros.

Tech Stack: Next.js 14+ (App Router), Tailwind CSS, Shadcn/UI (Radix), Lucide Icons.

TU TAREA (ENTREGABLES):

Genera la especificación detallada para los siguientes 3 puntos:

1. MAPA DEL SITIO Y RUTAS (NEXT.JS APP ROUTER STRUCTURE)
Define la estructura de carpetas /app para el Monorepo, detallando qué páginas son Server Components (RSC) y cuáles Client Components. Sigue esta lógica:

Ruta Pública:

/auth: Login unificado (con detección de rol), Recuperar Contraseña, Claiming de Unidad (KYC).

/landing: Página de venta para administradores.

Portal Administrador (/apps/admin-web):

/dashboard: KPIs globales (Cobranza del mes, Tickets abiertos urgentes).

/consorcios/[id]:

/resumen: Vista rápida del edificio.

/finanzas:

/expensas: Generador de liquidaciones (Wizard de 3 pasos: Gastos -> Prorrateo -> Emisión).

/conciliacion: Tabla densa tipo Excel para conciliar banco vs sistema.

/gestion:

/tickets: Tablero Kanban (Pendiente -> En Proceso -> Resuelto).

/amenities: Calendario de reservas y configuración de reglas.

/legal:

/asambleas: Gestor de videollamadas y editor de actas con IA.

/documentos: Gestor de archivos (Reglamento).

App Vecino (/apps/resident-pwa):

/home: Tarjeta de "Saldo a Pagar" gigante + Accesos rápidos.

/pagos: Historial, descargar cupón, botón "Pagar con Mercado Pago".

/comunidad:

/reservas: Selector de fecha simple.

/votar: Interfaz de votación en tiempo real (solo activa durante asambleas).

/perfil: Datos personales y switch de unidad (si tiene varios deptos).

2. SISTEMA DE COMPONENTES (ATOMIC DESIGN)
Lista los componentes clave que debemos construir en packages/ui-kit para reutilizar, especificando sus variantes:

Átomos:

Button: Variantes primary, destructive, ghost. Propiedad size="xl" para modo accesible.

StatusBadge: Para estados de deuda/tickets (Pagado/Pendiente/Mora).

AmountDisplay: Componente que formatea moneda ($ 1.230,00) y colorea (Rojo/Verde) automáticamente según signo.

Organismos (Módulos Complejos):

ExpenseTable: Tabla de gastos editable (Admin) vs. Lista de lectura fácil (Vecino).

FileUploadZone: Zona de carga de comprobantes con previsualización y compresión automática.

TicketChat: Chat estilo WhatsApp para interactuar en un reclamo de mantenimiento.

Plantillas (Layouts):

AdminShell: Sidebar colapsable + Topbar con buscador global y notificaciones.

MobileShell: Bottom Navigation Bar (Navegación inferior) fija + Header simple.

3. ESTRATEGIA DE ACCESIBILIDAD Y "MODO ABUELA"
Explica cómo implementarás técnicamente el switch de accesibilidad:

Uso de variables CSS / Tailwind Tokens para escalar tipografía globalmente (rem units).

Definición de una AccessibilityProvider (Context API) que inyecte clases high-contrast y large-text en el <body>.

Navegación por teclado estricta en el Portal Admin (para power users/admins).

SALIDA ESPERADA:
Dame el árbol de directorios resultante y el código de ejemplo de 2 componentes clave:

El AppShell (Layout) diferenciado para Admin vs Vecino.

La tarjeta ExpenseCard (Componente que muestra "Total a Pagar" al vecino), mostrando cómo cambia su diseño si el modo isHighContrast está activo.

¿Por qué este prompt funciona para mantenimiento?
Estructura = Rutas: Al mapear la UI directamente a las rutas de Next.js (/app/finanzas/expensas), el código queda auto-documentado. Si un desarrollador nuevo entra y le dicen "arregla el error en la pantalla de expensas", sabe exactamente a qué carpeta ir.

Componentes Atómicos: Al pedir packages/ui-kit, fuerzas a que los botones y tablas sean iguales en toda la app. Si mañana quieres cambiar el color "Azul" a "Verde", lo cambias en un solo archivo y se actualiza todo el sistema.

Accesibilidad Nativa: No es un "parche" al final. Está en el ADN del sistema de diseño.

Este prompt, junto con el, te da el control total sobre qué se va a ver y cómo se va a construir.