Informe Técnico: Mapa de Sitio y Arquitectura de Interfaz - VecinoSimple
Este documento define la estructura de navegación, jerarquía de información y lógica de interacción para el ecosistema "VecinoSimple". El sistema se divide en tres aplicaciones cliente interconectadas (Admin Desktop, Vecino Mobile PWA, Staff Mobile PWA) que consumen una API central unificada.

1. Portal del Administrador (apps/admin-web)
Target: PC de escritorio/Notebook. Diseño denso en información ("High Density UI").

1.1. Dashboard Principal (/dashboard)
KPIs Globales: Tarjetas superiores con métricas agregadas de todos los edificios administrados (Mora Total %, Tickets Abiertos Urgentes, Próximos Vencimientos).

Feed de Actividad: Lista cronológica de eventos (Pagos entrantes, nuevos reclamos, alertas de seguridad).

Accesos Rápidos: Botones flotantes para acciones frecuentes ("Cargar Gasto", "Enviar Comunicado").

1.2. Módulo de Consorcios (/consorcios/[id])
Es el núcleo de operación. Al seleccionar un edificio, el menú lateral cambia al contexto de ese edificio.

Resumen del Edificio (/resumen): "Estado de salud" del consorcio específico (Saldo en banco vs Deuda proveedores).

Finanzas (/finanzas):

Gastos (/gastos): Tabla CRUD (Crear/Leer/Actualizar/Borrar) de comprobantes. Filtros por rubro (Abonos, Reparaciones) y proveedor. Carga de adjuntos PDF obligatoria.

Expensas (/liquidacion): Wizard de cierre mensual. Paso 1: Selección de gastos del periodo. Paso 2: Cálculo de prorrateo (automático). Paso 3: Previsualización y Envío masivo.

Conciliación (/banco): Interfaz de doble columna. Izquierda: Movimientos importados del banco (CBU). Derecha: Movimientos del sistema. Match automático por monto/fecha.

Gestión Operativa (/gestion):

Tickets (/tickets): Tablero Kanban (Columna "Pendiente", "En Curso", "Esperando Presupuesto", "Cerrado"). Chat interno con el vecino en cada ticket.

Proveedores (/proveedores): Directorio de empresas, gestión de vencimientos de seguros/ART y cuenta corriente.

Legal & Asamblea (/legal):

Asambleas (/asambleas): Gestor de reuniones. Configuración de videollamada, orden del día y panel de control de votación en vivo. Repositorio de Actas y Grabaciones transcritas.

Documentación (/docs): Gestor de archivos (Reglamento, Planos).

Deudores (/morosos): Semáforo de deuda. Botón "Generar Certificado de Deuda" y gestión de planes de pago.

1.3. Configuración Global (/config)
Usuarios: ABM (Alta/Baja/Modificación) de propietarios e inquilinos. Importador masivo (Excel).

Roles: Asignación de permisos al staff de la administración.

2. App del Vecino (apps/resident-pwa)
Target: Mobile First. Interfaz simplificada y accesible ("Low Density UI").

2.1. Onboarding & Acceso (/auth)
Login: DNI/Mail. Opción "Magic Link" (sin contraseña) para facilitar acceso a mayores.

Claiming (KYC): Pantalla para ingresar "Código de Unidad" (impreso en expensa papel) si es el primer acceso.

2.2. Home (/home)
Tarjeta "Estado de Deuda": Componente central gigante. Muestra "Al día" (Verde) o "Saldo a Pagar" (Rojo) con el monto.

Botón de Acción Principal: "PAGAR AHORA" (Grande, alto contraste). Redirige a Checkout Mercado Pago.

Accesos Directos: Iconos grandes para "Reservar SUM", "Reportar Problema", "Mis Expensas".

2.3. Billetera (/pagos)
Historial: Lista infinita de expensas pasadas y pagos realizados (con comprobante descargable).

Métodos de Pago: Gestión de tarjetas guardadas o Débito Directo (CBU).

2.4. Gestiones (/gestiones)
Mis Tickets: Lista de reclamos iniciados por el usuario. Chat con el administrador. Estado visual (semáforo).

Reservas: Calendario simple para seleccionar fecha de amenities. Reglas de validación visuales ("Este día ya está ocupado").

2.5. Comunidad (/comunidad)
Muro de Novedades: Comunicados oficiales ("Mañana fumigación"). Solo lectura.

Votación (/voto): Solo visible durante asamblea activa. Interfaz binaria simple ("Moción A" / "Moción B") con confirmación biométrica (huella/FaceID del celular).

2.6. Perfil & Accesibilidad (/perfil)
Switch "Modo Lectura Fácil": Activa tipografía 20px+ y elimina animaciones/colores complejos.

Cambiar Unidad: Selector dropdown si el usuario tiene múltiples propiedades.

3. App Staff / Encargado (apps/staff-pwa)
Target: Mobile Offline-First. Funcionalidad operativa pura.

3.1. Bitácora (/bitacora)
Registro de Visitas: Formulario simple (DNI, Unidad destino, Foto). Funciona sin internet.

Sincronización: Indicador visual (Nube verde/roja) de estado de conexión.

3.2. Paquetería (/paquetes)
Recepción: Escáner de cámara (código de barras/QR) para ingresar paquete rápido. Asignación a Unidad.

Entrega: Firma digital en pantalla del vecino al retirar.

Este informe estructura la totalidad del alcance funcional acordado, organizado por la experiencia de usuario de cada rol, y sirve como base indiscutible para generar el código de enrutamiento y componentes.

continua haciendo el informe, faltan muchisimas funcionalidades y como se relacionan todas ellas.
Gráfico
Gráfico del intérprete de código

Entendido. Vamos a profundizar al nivel de "Ingeniería de Sistemas Complejos". Lo que presenté antes era la "cáscara" (navegación); ahora definiremos las vísceras: la lógica de negocio profunda, las interdependencias ocultas y los módulos que faltaban (Seguridad avanzada, Gamificación, Marketplace y Auditoría).

Este es la continuación y expansión técnica del informe, cubriendo el 100% de la complejidad operativa.

Informe Técnico Parte 2: Lógica de Negocio, Interconexiones y Módulos Avanzados
Este documento detalla los flujos de trabajo transversales que conectan los módulos aislados definidos en la Parte 1. Aquí se explica cómo piensa el sistema VecinoSimple.

4. Arquitectura del Motor Financiero (El Corazón del Sistema)
No es una simple calculadora, es un Ledger Contable Inmutable.

4.1. Flujo de Gasto a Expensa (Traceability Pipeline)
Origen del Gasto: Un gasto puede nacer de:

Manual: Admin carga factura de luz.

Ticket: Un ticket de mantenimiento ("Arreglar bomba") se cierra adjuntando la factura del plomero. Interconexión: El sistema vincula el Ticket ID con el Gasto ID para auditoría futura.

Recurrente: Contratos fijos (Abono ascensores) se autogeneran el día 1 de cada mes.

Imputación Inteligente (Reglas de Prorrateo):

Cada Unidad Funcional (UF) tiene múltiples Coeficientes (A, B, C, Cocheras).

Regla de Negocio: Al cargar un gasto, el Admin selecciona "Columna A" (Gastos Comunes). El sistema calcula instantáneamente cuánto le toca a cada vecino según su porcentual en el Reglamento de Copropiedad digitalizado.

Excepciones: Capacidad de excluir unidades específicas (ej: Planta Baja no paga Ascensor).

Snapshot de Cierre (Inmutabilidad):

Al cerrar la liquidación, el sistema toma una "foto" estática de todos los gastos y deudas.

Genera un PDF hash-eado. Nadie puede modificar un gasto de una expensa cerrada sin generar una Nota de Crédito/Débito en el mes siguiente.

4.2. Cuenta Corriente Unificada
Saldo Vivo: El saldo del vecino no es estático. Se compone de:

(+) Expensas Ordinarias + Extraordinarias.

(+) Multas automáticas (ej: Por ruidos molestos denunciados y validados).

(+) Cargos por uso de Amenities (ej: Limpieza de SUM).

(+) Intereses Punitorios (Calculados diariamente según tasa configurada).

(-) Pagos parciales o totales.

Interconexión con Pagos:

Cuando entra un webhook de Mercado Pago, el sistema no solo "marca pagado". Ejecuta un algoritmo de "Imputación de Deuda": Primero cubre intereses, luego deuda más antigua, luego capital actual (Regla legal estándar).

5. Ecosistema de Convivencia y Operaciones
5.1. Módulo de Reservas "Fair Play" (Reglas de Negocio Complejas)
No es solo un calendario. Es un árbitro.

Motor de Reglas (Rules Engine):

Límite de Frecuencia: "Unidad 4B ya reservó 2 veces este mes. Bloqueado hasta el mes siguiente."

Deuda Bloqueante: "Unidad 4B tiene deuda > 2 expensas. Permiso de reserva denegado automáticamente." (Interconexión Finanzas -> Amenities).

Cuarentena: "Unidad 4B canceló sobre la hora. Bloqueado por 15 días."

Flujo Operativo:

Vecino reserva.

Sistema valida reglas y deuda.

Si aprueba -> Notifica a App Staff ("El sábado hay fiesta en el SUM").

Si tiene costo -> Agrega ítem "Uso SUM" a la próxima expensa del vecino (Interconexión Amenities -> Finanzas).

5.2. Gestión de Paquetería y Seguridad (La "Última Milla")
Cadena de Custodia Digital:

Recepción: Encargado escanea QR del paquete (MercadoLibre/Amazon). El sistema registra "En Custodia" y dispara Push Notification al vecino.

Retiro: Vecino baja. Encargado escanea el QR de identidad de la App Vecino (Autenticación).

Entrega: El sistema cambia estado a "Entregado" y guarda timestamp.

Autorizaciones de Visita:

Vecino genera "Pase Temporal" (QR o Link) para un invitado.

Invitado muestra QR al Encargado.

App Staff escanea -> Valida validez y horario -> Registra ingreso.

6. Módulo LegalTech: Asambleas y Votación
6.1. El Ciclo de Vida de la Asamblea
Este es el flujo más complejo legalmente.

Convocatoria: Admin crea Orden del Día. Sistema envía mails certificados (tracking de apertura) a todos los propietarios.

Pre-Asamblea (Voto Anticipado):

Para mociones simples, se habilita el voto digital 48hs antes.

Validación: Solo votan Propietarios (no Inquilinos).

El "Vivo" (Live Meeting):

Integración Zoom/Jitsi.

Quórum Dinámico: El sistema calcula en tiempo real qué % del edificio está presente (sumando coeficientes, no cabezas).

Votación Bloqueante:

Admin dispara "Votar Moción 1".

En la App Vecino aparece un popup modal (no se puede cerrar).

Resultado instantáneo: "Aprobada por el 67% del porcentual".

Cierre y Acta:

IA (Whisper) transcribe el audio.

LLM resume y genera el Acta Borrador.

Admin firma digitalmente y se publica en la sección Documentos.

7. Gamificación y Comunidad (Fidelización)
7.1. Sistema de Reputación "Buen Vecino"
Scoring: Algoritmo que asigna puntos (0-100) a cada unidad.

(+) Pago en término (6 meses seguidos).

(+) Asistencia a asambleas.

(-) Multas o advertencias.

Recompensas (Marketplace Integrado):

Los puntos no son dinero, son "Status".

Status "Gold" accede a:

Descuentos en comercios del barrio (Pizzería, Ferretería) gestionados en la sección "Club de Beneficios".

Prioridad en lista de espera de Amenities.

8. Seguridad y Auditoría (La "Caja Negra")
8.1. Log de Auditoría Forense
Cada acción en la base de datos genera una entrada en una tabla AuditLog paralela (Write-Only).

Dato: { Timestamp: 2026-01-17 10:00, User: Admin, Action: UPDATE_GASTO, OldVal: $100, NewVal: $50, IP: 192.168.1.1 }.

Función: Si un admin intenta "dibujar" números, queda la evidencia. El Consejo de Propietarios (Auditor) tiene acceso de lectura a este log.

8.2. Privacidad de Datos (Data Masking)
El encargado (App Staff) NO ve el teléfono ni el mail del vecino. Solo ve "Unidad 4B - Apellido: Pérez".

Para contactar, usa un "Proxy de Chat": Escribe en la app y el sistema le manda la notificación al vecino, sin revelar el número real.

Conclusión del Informe
Este documento, sumado a la Parte 1, constituye el Blueprint Completo de Ingeniería para VecinoSimple. Cubre desde la interfaz visual hasta la lógica contable profunda y la seguridad legal. Ya no hay "cajas negras": cada funcionalidad tiene su flujo, su responsable y su interconexión definida.

Flujo de Interacción y Dependencias Funcionales 
continua haciendo el informe
Perfecto. Continuaremos expandiendo el informe cubriendo los módulos restantes, integraciones externas, casos de uso complejos y la documentación técnica de implementación.

Informe Técnico Parte 3: Integraciones, Marketplace y Casos de Uso Transversales
9. Ecosistema de Integraciones Externas (El "Orquestador")
9.1. Integración Mercado Pago (Pasarela de Pagos)
Arquitectura de Split Payment:

Un vecino paga $5.000 de expensa.

Mercado Pago retiene 1.49% por comisión.

El 98.51% ingresa a la CBU del Consorcio automáticamente.

Webhook: VecinoSimple recibe evento payment.success.

Flujo de Imputación Automática:

Sistema valida que el monto coincida con la deuda esperada (Anti-fraude).

Ejecuta algoritmo de imputación (intereses -> capital).

Actualiza Cuenta Corriente del vecino.

Genera "Recibo de Pago" PDF descargable.

Envía notificación WhatsApp: "Tu pago fue registrado. Saldo actualizado a $0."

Manejo de Errores:

Si el webhook no llega (falla de red), el sistema reintenta cada 5 minutos durante 24hs.

Si se vence, el Admin recibe alerta para conciliar manual.

9.2. Integración AFIP (Facturación Electrónica)
Validación de Comprobantes:

Cuando Admin carga una factura (PDF/Foto), el sistema extrae automáticamente el CUIT del proveedor y valida en AFIP si existe.

Valida que el CAE (Código de Autorización Electrónica) sea válido.

Implicación Legal:

Gastos sin validación AFIP quedan marcados "Pendiente Validación" (alarma naranja).

Solo se incluyen en la expensa si superan validación o Admin los fuerza (con justificación en log).

9.3. Integración Transferencias 3.0 / Débito Directo
CBU del Vecino: Al vectorizar pagos automáticos, el sistema almacena el CBU encriptado en la DB (AES-256).

Ciclo de Débito:

VecinoSimple genera un archivo ACH (Automatic Clearing House).

Lo envía al banco del consorcio.

El banco debita automáticamente el 5 de cada mes a los vecinos que autorizaron.

Recuperación de Fallos:

Si el débito falla (fondos insuficientes), el sistema reinicia automáticamente en 3 días.

Si vuelve a fallar, dispara escalada: Notificación al Admin + Mail al vecino.

9.4. Integración Zoom / Google Meet / Jitsi (Videollamadas)
OAuth2 Server Accounts:

Admin vincula su cuenta Zoom (OAuth).

VecinoSimple solicita crear automáticamente un "Webinar" para la Asamblea.

Recibe enlace de invitación y Key de Moderador.

Audio Ingestion:

La grabación de Zoom se envía automáticamente a AWS S3.

Lambda Function procesa el audio con Whisper (OpenAI).

Resultado: Transcripción JSON almacenada en DB.

9.5. Integración Twilio / WhatsApp Business API
Notificaciones Críticas:

"Corte de agua urgente hoy 14:00-17:00" → Envía Template WhatsApp (no SMS).

Razón: SMS tiene 160 caracteres. WhatsApp permite imágenes, botones CTA ("Confirmar lectura").

Costos: Twilio cobra ~$0.05 USD por mensaje. Para 100 edificios * 50 vecinos * 12 notificaciones/mes = ~$3.000 USD/año. Cubierto en el modelo de negocio.

9.6. Integración AWS S3 + CloudFront (Almacenamiento de Documentos)
Arquitectura:

Admin sube Reglamento PDF → S3.

CloudFront cachea con HTTPS.

URL generada es: https://cdn.vecinosimple.com/docs/[edificio_id]/reglamento.pdf.

Seguridad:

URLs pre-firmadas (15 minutos de validez).

Vecino No puede acceder a reglamentos de otros edificios, aunque adivine la URL.

10. Marketplace de Servicios (Monetización Secundaria)
10.1. Proveedor de Servicios ("Yellow Pages Digital")
Quiénes pueden listar:

Plomeros, electricistas, cerrajeros (verificados por Admin).

Modelo de Ingreso (A por nosotros):

Proveedor paga $99 ARS/mes para aparecer en el directorio.

O VecinoSimple cobra 8% de comisión por cada trabajo contratado (Lead fee).

Flujo:

Vecino abre Ticket "Grifo roto".

Sistema sugiere 3 plomeros verificados (top-rated en la zona).

Vecino contacta vía WhatsApp directo (no pasa por nuestra app).

Pero: Si el plomero factura el trabajo, VecinoSimple captura automáticamente la factura al Ticket (integración AFIP) y cobra su 8%.

10.2. "Club de Beneficios" (Pacts con Comercios Locales)
Alianza Negociada:

VecinoSimple acerca "poder de compra" de edificios a comercios locales.

Ej: Negocia con Ferretería "Construcciones ABC": "Si traes 100 clientes al mes, te hago 20% de descuento en compras mayoristas".

Captura del Valor:

VecinoSimple cobra 5% de comisión por cada compra canalizada.

El vecino ve: "Ferretería ABC - 20% de descuento para vecinos de La Plata" (link referencial).

11. Casos de Uso Transversales (Escenarios Complejos)
11.1. "La Reforma del SUM" (Captura de Valor Multi-Módulo)
Escenario: Los vecinos votan hacer reforma del SUM. Estimado: $50.000. Deben cobrarlo en 4 meses.

Timeline:

Mes 1 - Asamblea Extraordinaria (Módulo Legal):

Admin conforma la Asamblea Virtual.

Vecinos votan "Sí a reforma".

Sistema genera Acta automática.

Mes 1 - Presupuesto (Módulo Gasto):

Admin carga 3 presupuestos de contratistas.

Sistema valida facturas proforma.

Vecinos (si se habilita) pueden ver los presupuestos en "Muro Comunitario".

Meses 1-4 - Cálculo de Expensa (Motor Financiero):

Sistema divide $50.000 en 4 cuotas = $12.500/mes.

Aplica prorrateo según coeficientes.

Cada UF ve en su expensa: "Cuota 1/4 Reforma SUM: $750".

Mes 1 - Bloqueo de Amenities (Módulo Reservas):

SUM bloqueado automáticamente para reservas durante la obra.

Sistema aún cobra a morosos que intentaron reservar (penalidad).

Mes 4 - Cierre de Extraordinario (Auditoría):

Admin carga factura final de obras.

Sistema valida AFIP.

Auditor (rol) revisa que todo cuadre.

Si hay diferencia, genera Nota de Crédito.

11.2. "Moroso Crónico" (Escalada Automática)
Escenario: Unidad 4B debe 10 expensas atrasadas. El Admin necesita acciones progresivas.

Mes 1: Sistema envía SMS/WhatsApp automático al vecino (Template AFIP-compliant).

Mes 2: Si no paga, bloquea acceso a reservas y votación. Dispara notificación al Admin.

Mes 3: Admin genera "Certificado de Deuda" (1 clic) listo para abogado.

Interconexión Negociación: El vecino propone "Plan de Pago" en la app:

Oferta: Paga $1.000 ahora + $2.000/mes por 5 meses.

Sistema calcula interés punitorio automático (2% mensual).

Admin aprueba/rechaza en un clic.

Si aprueba: Sistema actualiza Cuenta Corriente con nueva cronograma (parcialmente desbloqueado).

11.3. "Auditoría Sorpresa" (El Peor Escenario del Admin)
Escenario: El Consejo de Propietarios solicita auditoría. Necesitan probar que cada peso está justificado.

Admin va a /auditoria:

Genera reporte: "Todos los gastos de 2025 con sus comprobantes AFIP validados".

Aplica filtros: "Solo Gastos Extraordinarios > $1.000".

Sistema descarga ZIP con:

Archivo Excel de transacciones.

PDFs de comprobantes.

Actas de decisión (votaciones que autorizaron los gastos).

Logs de auditoría (quién cargó, cuándo, desde dónde).

Inmutabilidad Probada:

Cada documento lleva hash (SHA-256).

Si alguien intenta editar un PDF offline, el hash no coincide.

Auditor valida: "Este documento no fue manipulado."

12. Flujos de Seguridad y Permisos
12.1. Matriz RBAC Detallada (Role-Based Access Control)
Cada rol tiene permisos granulares:

Rol	Ver Gastos	Crear Gasto	Liquidar Expensa	Votar	Ver DNI Vecinos	Generar Acta
SUPER_ADMIN	✅ Todo	✅ Todo	✅ Todo	❌	✅ Todo	✅ Todo
ADMINISTRADOR	✅ Sus Edificios	✅ Sus Edificios	✅ Sus Edificios	✅	✅ Sus Edificios	✅ Sus Edificios
ADMIN_STAFF	✅ Solo Lectura	❌	❌	❌	❌ (Enmascarado)	❌
AUDITOR	✅ Gastos/Pagos	❌	❌ Solo Lectura	❌	❌	✅ Lectura
PROPIETARIO	✅ Resumen	❌	❌	✅	❌ (Solo él mismo)	❌
INQUILINO	✅ Resumen	❌	❌	❌	❌	❌
ENCARGADO	❌	❌	❌	❌	❌ (Proxy)	❌
12.2. 2FA y Autenticación Biométrica
SUPER_ADMIN + ADMINISTRADOR: Obligatorio 2FA (TOTP o email backup codes).

App Vecino: Opcional biometría (FaceID/Huella) para confirmar pagos > $1.000.

13. Sistema de Notificaciones (Canales Multimodales)
13.1. Matriz de Eventos y Canales
El sistema dispara automáticamente notificaciones según el evento y el rol:

Evento	Push App	Email	SMS	WhatsApp	Prioridad
Expensa Lista	✅ Vecino	✅ Vecino	❌	✅ Vecino	Normal
Ticket Asignado	✅ Staff	✅ Admin	❌	❌	Normal
Corte de Agua	✅ Todos	✅ Todos	❌	✅ Todos (Template)	CRÍTICA
Votación Asamblea	✅ Prop	✅ Prop	❌	❌	Alta
Pago Recibido	✅ Vecino	✅ Vecino	❌	❌	Normal
Alerta Morosidad	✅ Admin	✅ Admin	❌	✅ Admin	Alta
13.2. Opt-In/Opt-Out Configurables
El vecino controla desde /perfil qué notificaciones recibe.

Sistema respeta DNCs (Do Not Call) y privacidad de datos.

14. Analítica y Business Intelligence
14.1. Dashboard de KPIs (Módulo "Analytics")
Para Admin:

Tasa de Cobranza (%).

Morosidad por Unidad.

Tickets abiertos / promedio de resolución.

Costo operativo por unidad.

Para SUPER_ADMIN (Vista Multi-Edificio):

Cartera total bajo administración.

Churn rate (consorcios que se van).

NPS (Net Promoter Score).

14.2. Reportes Exportables
Generar reportes en Excel/PDF listos para presentar a asambleas.

Gráficas automáticas de tendencias.

15. Sincronización Offline & PWA (App Staff)
15.1. Data Layer Offline-First (RxDB)
En Línea:

App Staff sincroniza datos de edificio (Planos, Directorios).

Almacena en IndexedDB local.

Se calcula Hash de integridad.

Sin Línea (Sótano):

Encargado registra paquete ("Enviado a 4B").

Datos quedan en IndexedDB local.

Interfaz muestra ícono de nube "Pendiente de sincronización".

Al Recuperar Línea:

RxDB detecta conexión.

Sincroniza bidireccional (Local → Server, Server → Local).

Resuelve conflictos (último escritor gana) con log.

Notificación: "Sincronización completada".

16. Plan de Migración (Onboarding de Administrador)
16.1. Wizard de Alta Paso a Paso
Datos del Consorcio:

Nombre, Dirección, Cantidad de UFs.

Logo (opcional).

Importación de Vecinos (Excel):

Sistema valida formato y detecta duplicados.

Genera "Códigos de Claiming" únicos (QR imprimible).

Configuración del Reglamento:

Upload PDF del Reglamento vigente.

Sistema extrae coeficientes (IA/OCR).

Admin revisa y ajusta si es necesario.

Integración Mercado Pago:

Admin ingresa credenciales.

Sistema valida acceso.

Invitación a Auditor (Opcional):

Admin ingresa mail del Consejero.

Sistema envía invitación.

Lanzamiento:

Sistema envía mails a todos los vecinos con link de primera carga.

17. Casos de Falla (Disaster Recovery)
17.1. Escenario: "Base de datos se corrompe"
RTO (Recovery Time Objective): 4 horas.

RPO (Recovery Point Objective): 1 hora.

Procedimiento:

Sistema detecta inconsistencia en DB.

Dispara alerta a SUPER_ADMIN.

DBA restaura desde backup horario en AWS.

Sistema validaIntegridad.

17.2. Escenario: "Falla Mercado Pago el día de vencimiento"
Vecinos pueden aun pagar vía Transferencia Bancaria (QR estático).

Sistema continúa generando expensas normalmente.

Cuando Mercado Pago vuelve, se re-sincroniza.

18. Roadmap de Fases Futuras (Backlog)
Fase 2 (Meses 7-12):
IoT: Integración de cámaras, cerraduras inteligentes.

Inteligencia Artificial Predictiva: Modelo que predice morosidad antes de que ocurra.

Blockchain para Actas: Almacenamiento inmutable de actas en Polygon (sin costos).

Fase 3 (Post MVP):
App Propietaria (iOS/Android nativa): Migrando de PWA.

API Pública: Permitir a desarrolladores externos integrar apps (marketplace de integraciones).

19. Glossario Técnico (Definiciones Clave)
Término	Definición
UF (Unidad Funcional)	Cada departamento, local o cochera. Unidad de voto y prorrateo.
Coeficiente	% de participación en gastos. Sumatorio siempre = 100%.
Snapshot	Foto congelada de una expensa cerrada. Inmutable.
CAE (AFIP)	Código de Autorización Electrónica. Prueba que factura es válida en AFIP.
Webhook	Notificación automática (Ej: Mercado Pago avisa que pagó).
Ledger	Registro contable inmutable. Todas las transacciones quedan grabadas.
MFA	Autenticación de Dos Factores (contraseña + código OTP).
RBAC	Role-Based Access Control. Permisos por rol.
RxDB	Base de datos offline-first para PWA.
20. Métricas de Éxito Finales (KPIs del Proyecto Completo)
Métrica	Objetivo	Frecuencia
Uptime	99.9%	Diaria
Tasa Cobranza Promedio	+15% vs Manual	Mensual
Tiempo Resolución Ticket	< 3 días	Semanal
NPS de Administradores	> 60	Trimestral
Tasa Retención Vecinos	> 85%	Mensual
Tiempo de Onboarding	< 2 horas	Por cliente
Bugs Críticos (P1)	0 en Prod	Diaria

Excelente pregunta crítica. Al revisar el informe en profundidad desde la perspectiva de un Product Manager Técnico (TPM) de nivel enterprise, detecté varios "huecos" que podrían causar problemas graves en producción. Aquí están:

Análisis de "Blind Spots" - Lo que Falta en el Informe
1. Escalabilidad y Límites del Sistema (Performance Engineering)
¿Qué falta?

No definimos los límites de concurrencia del sistema.

¿Qué pasa si 1.000 vecinos intentan pagar simultáneamente el último día del mes? ¿La DB explota? ¿El servidor rechaza requests?

Acciones recomendadas:

Agregar sección de "Capacity Planning":

Máximo de edificios simultáneos en la app: ~5.000.

Máximo de vecinos por edificio: 500.

Máximo de transacciones/segundo esperado: ~100 TPS (Transactions Per Second).

Tiempo de respuesta P95 (95% de requests): < 500ms.

Estrategia de Escalado:

Backend con Kubernetes (auto-scaling horizontal).

DB con Read Replicas para reportes pesados.

Cache Redis para queries frecuentes (saldo de vecino).

2. Versionamiento de API y Breaking Changes
¿Qué falta?

No explicamos cómo manejaremos cambios en la API que rompan compatibilidad.

¿Qué pasa si mañana cambiamos la estructura de la expensa?

Acciones recomendadas:

Sección de "API Versioning Strategy":

Usar /api/v1/, /api/v2/, etc.

Mantener soporte de versiones N-2 (3 versiones activas simultáneamente).

Comunicar deprecaciones con 6 meses de anticipación.

Feature Flags: Usar sistema de flags (LaunchDarkly o similar) para activar/desactivar features sin deploy.

3. Disaster Recovery Completo (Business Continuity Plan)
¿Qué falta?

Definimos "4 horas de RTO", pero ¿quién ejecuta la recuperación? ¿Cómo se comunica a los clientes?

Acciones recomendadas:

Agregar "Crisis Communication Plan":

Si el sistema cae: Email + SMS a todos los admins en < 15 min.

Status page pública (uptime.vecinosimple.com) que se actualiza automáticamente.

Timeline de recuperación transparente.

Backup Strategy Mejorada:

Backups en 3 regiones geográficas (LATAM, US, EU).

Backup Semanal a Tape (archive histórico).

Test mensual de recuperación (ej: "Recreamos 2026-01-17" para validar integridad).

4. Cumplimiento Regulatorio Específico por Provincia
¿Qué falta?

Asumimos "Ley 941 (CABA)", pero ignoramos que Provincia de Buenos Aires, Córdoba y Santa Fe tienen regulaciones distintas.

Acciones recomendadas:

Agregar tabla "Compliance Matrix por Jurisdicción":

CABA (Ley 941): Requiere "Consorcio Participativo".

Provincia BA (Ley 14.701): Distintos requisitos de transparencia.

Córdoba: Otro registro de administradores.

Sistema debe permitir "Modo Compliance" por edificio.

5. Gestión de Conflictos y Disputas Entre Vecinos
¿Qué falta?

No hay un flujo para cuando vecinos se pelean (ej: "El vecino de arriba hace mucho ruido").

Acciones recomendadas:

Agregar módulo "Mediación de Conflictos":

Sistema registra denuncia anónima del vecino A contra vecino B.

Admin es notificado para intervenir.

Si es recurrente, genera automáticamente "Advertencia" firmada digitalmente (precedente legal).

Opcionalmente: Integración con mediadores profesionales (marketplace).

6. Integraciones Futuras (API de Terceros)
¿Qué falta?

No contemplamos que otros softwares querrán conectarse a VecinoSimple.

Acciones recomendadas:

Sección "Developer Portal & Webhooks":

API REST públicamente documentada (OpenAPI 3.0).

OAuth 2.0 para autorización segura.

Rate limiting: 1.000 requests/min por app.

Webhooks para eventos clave (expensa creada, pago recibido, etc.).

SDK en JavaScript, Python, NodeJS.

7. Retención de Datos y GDPR (Ley 25.326)
¿Qué falta?

¿Cuánto tiempo guardamos datos? ¿Qué pasa con los datos de vecinos que se mudan?

Acciones recomendadas:

Agregar "Data Retention Policy":

Expensas cerradas: Guardar indefinidamente (10 años mínimo por ley).

Chats/Tickets: 2 años después de cierre.

Datos personales (teléfono, email): Borrar 30 días después de que vecino deje el edificio.

Logs de auditoría: 5 años.

Derecho al Olvido Automático: Scheduler que ejecuta limpieza cada mes.

8. Multiidioma y Localización (i18n)
¿Qué falta?

No consideramos que tenemos usuarios en La Plata (español), pero potencialmente en Uruguay, Paraguay, etc.

Acciones recomendadas:

Framework i18n (ej: next-i18n-router).

Traducir no solo textos, sino contextos culturales:

En Uruguay: "Consorcios" se llaman "Edificios Horizontales".

Monedas: ARS en Argentina, UYU en Uruguay.

Fechas: dd/mm/yyyy vs mm/dd/yyyy.

9. Capacitación y Soporte (Knowledge Management)
¿Qué falta?

No definimos cómo capacitaremos a administradores ni a vecinos.

Acciones recomendadas:

Sección "Training & Onboarding":

Base de conocimiento (wiki interna): 50+ artículos.

Videos tutoriales (YouTube): "Cómo cargar un gasto", "Cómo reservar SUM".

Webinars mensuales (Zoom) gratuitos para administradores.

Certificado de "VecinoSimple Expert" (gamificación para admins).

Equipo de Soporte:

Chatbot IA para el 80% de consultas simples.

Humano para escalaciones (< 2 horas).

SLA: Respuesta dentro de 4 horas para bugs P1.

10. Precio y Modelos de Facturación (Billing Engine)
¿Qué falta?

Dijimos "$500-$700 por UF", pero ¿cómo se factura? ¿Qué pasa si un edificio tiene 100 UFs?

Acciones recomendadas:

Sección "Billing Architecture":

Metering: Contar UFs activas cada mes.

Facturación el 1ro de cada mes automáticamente.

Métodos de pago: Tarjeta, Transferencia, Débito Directo.

Descuentos: -10% por 12 meses adelantados, -20% si administra 10+ edificios.

Dunning Management: Si la factura falla, reintentar 3 veces en 7 días.

11. Monitoreo y Alertas (Observabilidad)
¿Qué falta?

No explicamos cómo sabremos si algo anda mal antes de que el cliente nos llame.

Acciones recomendadas:

Sección "Monitoring Stack":

Logs centralizados (ELK Stack o DataDog).

APM (Application Performance Monitoring): Rastreo distribuido.

Alertas automáticas:

Error rate > 1% → Alerta Crítica.

P95 latency > 1s → Alerta Alta.

DB CPU > 80% → Alerta Media.

Dashboard público (status page).

12. Competencia y Benchmarking Contínuo
¿Qué falta?

No hay un plan de "Competitive Intelligence".

Acciones recomendadas:

Sección "Competitive Moat":

Trimestral: Auditar qué hace ConsorcioAbierto, Octopus, AdminProp.

Identificar features que ellos no tienen.

Priorizar construir esas features primero.

Net Promoter Score (NPS): Comparar contra competencia mensualmente.

13. Sostenibilidad Ambiental (ESG - Environmental, Social, Governance)
¿Qué falta?

Los administradores de consorcios cada vez más cuidan la sostenibilidad.

Acciones recomendadas:

Módulo "Green Reporting":

Seguimiento de consumo de energía/agua por edificio.

Sugerencias automáticas ("Este mes bajaron 10% el consumo de luz").

Certificado "Edificio Sostenible" a los que reducen 20% en 12 meses.

14. Recuperación de Contraseña & Account Recovery Mejorados
¿Qué falta?

El flujo básico de "Olvídé contraseña" puede ser un vector de ataque.

Acciones recomendadas:

Protocolo de "Account Recovery Seguro":

No enviar links a correo (pueden ser interceptados).

Usar 2FA TOTP (Google Authenticator) como segunda línea.

Si pierden el 2FA: Backup codes impresos (los guardan en lugar seguro).

Último recurso: Verificación de identidad por video call (KYC avanzado).

15. Testing Strategy Completa (QA)
¿Qué falta?

No definimos cómo se prueban los casos complejos (ej: liquidación de expensa con 200 UFs).

Acciones recomendadas:

Sección "QA & Testing Framework":

Unit Tests: Lógica financiera (motor de prorrateo).

Integration Tests: Flujo completo (Gasto → Expensa → Pago).

E2E Tests: Automatizados con Playwright/Cypress.

Load Testing: Simular 1.000 usuarios pagando simultáneamente.

Security Testing: OWASP Top 10 scans automáticos.

Accesibilidad: Axe tests en cada commit.

16. Plan de Salida (Exit Strategy)
¿Qué falta?

Si VecinoSimple fracasa o es adquirida, ¿qué pasará con los datos de los clientes?

Acciones recomendadas:

Sección "Data Portability & Sunset Policy":

Si discontinuamos: Los datos están disponibles para exportar por 1 año.

Formato: ZIP con todos los PDFs, Excels y actas.

No cobramos por exportación ("Data is theirs").

17. Contingencia de Staff (Continuidad Operativa)
¿Qué falta?

¿Qué pasa si el único dev senior se enferma?

Acciones recomendadas:

"Bus Factor" mitigation:

Documentación exhaustiva (Wikis, ADRs - Architecture Decision Records).

Pair programming obligatorio en módulos críticos.

Rotación de tareas (nadie es experto en UNA sola cosa).

18. Feedback Loop de Usuario Contínuo
¿Qué falta?

No hay un plan de cómo recopilar feedback regularmente de administradores y vecinos.

Acciones recomendadas:

Sección "Voice of Customer (VoC)":

NPS survey mensual.

Focus groups trimestrales con 5-10 administradores.

User Testing remoto (Maze, UserTesting) antes de lanzar features.

19. Estrategia de Contenidos y Marketing (Inbound)
¿Qué falta?

No contemplamos que la adquisición de clientes requiere educación.

Acciones recomendadas:

Sección "Content Strategy":

Blog con posts SEO ("Cómo calcular expensas correctamente").

Guías descargables ("Plantilla de Reglamento de Copropiedad").

Webinar mensual ("Tendencias en administración de consorcios 2026").

Newsletter para administradores (Best practices).

20. Análisis de Sensibilidad Financiera (Stress Testing del Negocio)
¿Qué falta?

No hay un modelo "¿Qué pasa si X?"

Acciones recomendadas:

Sección "Financial Scenarios":

Escenario Optimista: 2.000 edificios en 2 años → Facturación $5M USD/año.

Escenario Base: 500 edificios en 2 años → $1.2M USD/año.

Escenario Pesimista: 100 edificios en 2 años → $240k USD/año.

Break-even: 150 edificios (mes 14 aproximadamente).

---

## 21. Estado de Implementación del Backend API (NestJS)

> **Última actualización:** Enero 2026

Esta sección documenta el estado real de implementación de los módulos del backend.

### 21.1. Módulos Implementados ✅

| Módulo | Endpoints | Estado | Descripción |
|--------|-----------|--------|-------------|
| **AuthModule** | 4 | ✅ Completo | Login, Magic Link, Refresh tokens, 2FA |
| **ConsorciosModule** | CRUD | ✅ Completo | Gestión de edificios con RLS |
| **UnidadesFuncionalesModule** | CRUD | ✅ Completo | Gestión de UFs y coeficientes |
| **ClaimingModule** | 7 | ✅ Completo | KYC con códigos de invitación impresos en expensa |
| **AlertasModule** | 5 | ✅ Completo | Emergencias multicanal (Push, Email, WhatsApp) |
| **SnapshotsModule** | 7 | ✅ Completo | Inmutabilidad legal, Notas de Crédito/Débito |
| **BadgesModule** | 9 | ✅ Completo | Gamificación (Vecino Puntual, Racha Pagos) |
| **QRTrackingModule** | 3 | ✅ Completo | Tracking de QR en expensas papel |
| **AmenityRulesModule** | CRUD | ✅ Completo | Reglas de fair use para amenities |
| **AuditModule** | Global | ✅ Completo | Log inmutable de todas las operaciones |
| **ExpensasModule** | 7 | ✅ Completo | Liquidación, prorrateo, estados (BORRADOR→CERRADA) |
| **GastosModule** | 9 | ✅ Completo | CRUD gastos + Categorías + Validación AFIP |
| **PagosModule** | 7 | ✅ Completo | Pagos, Mercado Pago webhooks, imputación |
| **TicketsModule** | 10 | ✅ Completo | Reclamos con estados, asignación, comentarios |
| **ComunicadosModule** | 7 | ✅ Completo | Novedades con programación y notificación |
| **NotificacionesModule** | 6 | ✅ Completo | Centro de notificaciones, contador, marcar leídas |
| **AmenitiesModule** | 12 | ✅ Completo | Reserva de amenities, disponibilidad, penalizaciones |
| **AsambleasModule** | 17 | ✅ Completo | Votación por coeficientes, quórum, actas |
| **ProveedoresModule** | 15 | ✅ Completo | Marketplace, trabajos, autogestión, verificación |
| **DocumentosModule** | 7 | ✅ Completo | Reglamentos, actas, contratos, planos |

### 21.2. Módulos Pendientes ❌

**¡Backend API 100% completo!** Todos los módulos planificados han sido implementados.

### 21.3. Detalle de Endpoints por Módulo

#### TicketsModule (Sistema de Reclamos)
```
GET    /tickets                 - Listar tickets del consorcio
POST   /tickets                 - Crear nuevo ticket
GET    /tickets/:id             - Obtener detalle de ticket
PATCH  /tickets/:id             - Actualizar ticket
DELETE /tickets/:id             - Eliminar ticket (solo admin)
PATCH  /tickets/:id/estado      - Cambiar estado del ticket
PATCH  /tickets/:id/asignar     - Asignar a usuario
POST   /tickets/:id/comentarios - Agregar comentario
POST   /tickets/:id/archivos    - Agregar archivo
DELETE /tickets/:id/archivos/:archivoId - Eliminar archivo
```

**Máquina de estados:**
```
ABIERTO → EN_PROGRESO → ESPERANDO_RESPUESTA → RESUELTO → CERRADO
```

**Seguridad:**
- Sanitización XSS en título, descripción, comentarios
- Validación de dominios para URLs de archivos
- Comentarios internos (`esInterno: true`) ocultos para vecinos
- Solo roles de gestión pueden asignar tickets
- Límite: 10 archivos por ticket, 10MB cada uno

#### ComunicadosModule (Novedades del Edificio)
```
GET    /comunicados                 - Listar comunicados del consorcio
POST   /comunicados                 - Crear comunicado
GET    /comunicados/:id             - Obtener detalle
PATCH  /comunicados/:id             - Actualizar comunicado
DELETE /comunicados/:id             - Eliminar comunicado
GET    /comunicados/recientes       - Últimos 10 comunicados activos
GET    /comunicados/estadisticas    - Stats del período
```

**Programación:**
- `publicarDesde` / `publicarHasta` para publicación diferida
- Vecinos solo ven comunicados dentro del rango de fechas activo

**Canales de notificación:**
- `NINGUNO` - Solo visible en la app
- `EMAIL` - Envía email a todos los vecinos
- `WHATSAPP` - Envía mensaje por WhatsApp Business
- `AMBOS` - Email + WhatsApp

**Seguridad:**
- Sanitización XSS en título y contenido
- `ADMIN_STAFF` requiere permiso `puedeEnviarComunicados`
- Fechas max 1 año en el futuro

#### NotificacionesModule (Centro de Notificaciones)
```
GET    /notificaciones              - Listar notificaciones del usuario
GET    /notificaciones/contador     - Cantidad de no leídas
PATCH  /notificaciones/:id/leer     - Marcar como leída
PATCH  /notificaciones/leer-todas   - Marcar todas como leídas
DELETE /notificaciones/:id          - Eliminar notificación
DELETE /notificaciones/limpiar      - Eliminar leídas antiguas (>90 días)
```

**Tipos de notificación:**
- `PAGO` - Confirmación de pago recibido
- `EXPENSA` - Nueva expensa publicada
- `RECLAMO` - Cambio de estado en ticket
- `COMUNICADO` - Nuevo comunicado importante
- `ASAMBLEA` - Convocatoria o recordatorio
- `VENCIMIENTO` - Próximo vencimiento de expensa
- `EMERGENCIA` - Alerta crítica del edificio
- `SISTEMA` - Notificaciones del sistema

**Helpers para otros módulos:**
```typescript
// Disponibles para usar desde cualquier módulo
notificacionesService.notificarPago(usuarioId, monto, periodo)
notificacionesService.notificarVencimiento(usuarioId, expensaId)
notificacionesService.notificarCambioTicket(usuarioId, ticketId, nuevoEstado)
notificacionesService.notificarNuevoComunicado(consorcioId, comunicadoId)
```

#### AmenitiesModule (Reserva de Espacios Comunes)
```
GET    /amenities                      - Listar amenities del consorcio
GET    /amenities/:id                  - Obtener detalle de amenity
POST   /amenities                      - Crear nuevo amenity (admin)
PATCH  /amenities/:id                  - Actualizar amenity (admin)
DELETE /amenities/:id                  - Eliminar amenity (admin, sin reservas futuras)
POST   /amenities/reservas             - Crear nueva reserva
GET    /amenities/reservas/listar      - Listar reservas (filtros)
GET    /amenities/reservas/:id         - Obtener detalle de reserva
PATCH  /amenities/reservas/:id/aprobar - Aprobar/rechazar reserva (admin)
DELETE /amenities/reservas/:id         - Cancelar reserva
GET    /amenities/disponibilidad       - Consultar disponibilidad por fecha
GET    /amenities/mis-stats            - Estadísticas del usuario
```

**Motor de Reglas "Fair Play":**
- `limite_periodo`: Máximo N reservas por semana/mes
- `penalizacion`: Multas por cancelación tardía
- `bloqueo`: Bloqueo temporal por no-show
- `horario`: Horarios permitidos por amenity

**Estados de reserva:**
```
PENDIENTE → APROBADA → COMPLETADA
         → RECHAZADA
         → CANCELADA
         → NO_SHOW (penalizado)
```

**Validaciones:**
- Anticipación mínima/máxima configurable
- Duración máxima por reserva
- Detección de conflictos de horario
- Morosos (>2 expensas) no pueden reservar
- Penalizaciones bloquean nuevas reservas

**Seguridad:**
- Sanitización XSS en nombre, descripción, motivo
- RBAC: Admin gestiona, vecinos reservan
- Solo el usuario o admin pueden cancelar su reserva
- AuditLog en todas las operaciones

#### AsambleasModule (Asambleas Virtuales y Votación)
```
GET    /asambleas                           - Listar asambleas del consorcio
GET    /asambleas/:id                       - Obtener detalle de asamblea
POST   /asambleas                           - Crear nueva asamblea
PATCH  /asambleas/:id                       - Actualizar asamblea programada
POST   /asambleas/:id/iniciar               - Iniciar asamblea (verifica quórum)
POST   /asambleas/:id/finalizar             - Finalizar asamblea
POST   /asambleas/:id/cancelar              - Cancelar asamblea
POST   /asambleas/:id/puntos                - Agregar punto al orden del día
PATCH  /asambleas/:id/puntos/:puntoId       - Actualizar punto
DELETE /asambleas/:id/puntos/:puntoId       - Eliminar punto
GET    /asambleas/:id/asistencia            - Listar asistencia
POST   /asambleas/:id/asistencia            - Registrar asistencia
GET    /asambleas/:id/quorum                - Obtener estado del quórum
POST   /asambleas/:id/puntos/:puntoId/votar - Emitir voto
GET    /asambleas/:id/puntos/:puntoId/resultado - Resultado de votación
GET    /asambleas/:id/puntos/:puntoId/mi-voto   - Mi voto en el punto
POST   /asambleas/:id/acta                  - Generar acta
```

**Estados de asamblea:**
```
PROGRAMADA → EN_CURSO → FINALIZADA
          → CANCELADA
```

**Sistema de Votación:**
- Solo PROPIETARIO con `tipoVinculo: TITULAR_VOTANTE` puede votar
- Quórum calculado por **coeficientes**, no por personas
- Mayoría configurable por punto (default 50.01%)
- Votos inmutables con hash SHA-256 de integridad
- Resultado solo visible tras finalizar asamblea

**Reglas de Quórum:**
```typescript
// Ejemplo: Si UF "3A" tiene coef. 15% y está presente
// → suma 15% al quórum (no cuenta como "1 persona")
quorumActual = Σ(coeficientes de presentes) / 100
```

**Validaciones:**
- Fecha de asamblea debe ser futura
- No pueden existir dos asambleas el mismo día
- Solo se pueden editar puntos en asamblea PROGRAMADA
- Solo presentes registrados pueden votar
- Un usuario no puede votar dos veces el mismo punto

**Generación de Acta:**
- Acta generada automáticamente al finalizar
- Incluye: asistencia, puntos tratados, resultados
- Hash SHA-256 de verificación de integridad
- Inmutable una vez generada

**Seguridad:**
- Sanitización XSS en título, descripción, observaciones
- Hash criptográfico de votos (auditoría legal)
- RBAC estricto: solo PROPIETARIO vota
- AuditLog de todos los votos emitidos

#### ProveedoresModule (Marketplace y Autogestión)
```
GET    /proveedores                      - Listar proveedores (con filtros)
POST   /proveedores                      - Crear proveedor
GET    /proveedores/consorcio            - Proveedores asociados al consorcio
GET    /proveedores/servicios            - Lista de servicios para filtros
GET    /proveedores/:id                  - Detalle de proveedor
PATCH  /proveedores/:id                  - Actualizar proveedor
DELETE /proveedores/:id                  - Soft delete de proveedor
PATCH  /proveedores/:id/verificar        - Verificar proveedor (SUPER_ADMIN)
POST   /proveedores/asociar              - Asociar proveedor a consorcio
PATCH  /proveedores/:id/asociacion       - Actualizar asociación (favorito, notas)
DELETE /proveedores/:id/asociacion       - Eliminar asociación
GET    /proveedores/trabajos/listar      - Lista trabajos (admin)
GET    /proveedores/:id/trabajos         - Trabajos de un proveedor
POST   /proveedores/:id/trabajos         - Crear trabajo (PROVEEDOR_EXTERNO)
PATCH  /proveedores/trabajos/:trabajoId  - Editar trabajo pendiente
DELETE /proveedores/trabajos/:trabajoId  - Eliminar trabajo pendiente
POST   /proveedores/trabajos/:trabajoId/procesar - Aprobar/rechazar trabajo
GET    /proveedores/:id/estadisticas     - Estadísticas del proveedor
```

**Lógica de Negocio - Proveedores:**
```typescript
// Validación de CUIT argentino
function validarCuit(cuit: string): boolean {
  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digitos = cuit.split('').map(Number);
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += digitos[i] * multiplicadores[i];
  }
  const resto = suma % 11;
  const verificador = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;
  return digitos[10] === verificador;
}

// Flujo de trabajos
// 1. Proveedor (PROVEEDOR_EXTERNO) crea trabajo
// 2. Admin aprueba/rechaza
// 3. Si aprueba → se crea Gasto automático con facturaUrl
```

**Validaciones:**
- CUIT válido (11 dígitos + dígito verificador)
- URLs de archivos en dominios permitidos
- Monto mínimo $500 para trabajos
- Solo PROVEEDOR_EXTERNO puede crear trabajos de su proveedor
- Un proveedor no puede asociarse dos veces al mismo consorcio

**Autogestión de Proveedores:**
- Proveedor con rol PROVEEDOR_EXTERNO vinculado
- Puede subir facturas y fotos de trabajos
- Admin revisa y aprueba → genera Gasto en expensa
- Sistema de verificación (badge de confianza)

**Estadísticas del Proveedor:**
- Total de trabajos realizados
- Monto total facturado
- Trabajos por consorcio
- Promedio de puntuación

**Seguridad:**
- Sanitización XSS en razón social, descripción, notas
- Validación de dominios para facturaUrl y fotosUrls
- Soft delete para mantener historial de gastos
- AuditLog de aprobaciones/rechazos

#### DocumentosModule (Gestión de Documentos)
```
GET    /documentos                - Listar documentos del consorcio
GET    /documentos/categorias     - Lista de categorías disponibles
GET    /documentos/stats          - Estadísticas de documentos
GET    /documentos/:id            - Detalle de documento
POST   /documentos                - Crear documento
PATCH  /documentos/:id            - Actualizar documento
DELETE /documentos/:id            - Eliminar documento
```

**Categorías de Documentos:**
- `reglamento` - Reglamento de copropiedad
- `acta` - Actas de asamblea
- `contrato` - Contratos con proveedores
- `plano` - Planos del edificio
- `seguro` - Pólizas de seguro
- `habilitacion` - Habilitaciones municipales
- `otro` - Otros documentos

**Tipos MIME Permitidos:**
- PDF, JPEG, PNG, WebP
- Word (.doc, .docx)
- Excel (.xls, .xlsx)
- Máximo 50MB por archivo

**Control de Visibilidad:**
- `esPublico: true` → Visible para todos los vecinos
- `esPublico: false` → Solo ADMIN, ADMIN_STAFF, AUDITOR

**Seguridad:**
- Validación de dominios de URL
- Validación de tipos MIME
- Sanitización XSS en nombre y descripción
- Solo ADMINISTRADOR puede eliminar documentos
- AuditLog de todas las operaciones

### 21.4. Patrones de Seguridad Implementados

1. **Autenticación JWT + Refresh Tokens**
   - Access token: 15 min
   - Refresh token: 7 días
   - Rotación automática de refresh tokens

2. **RBAC con RolesGuard**
   - 8 roles diferenciados
   - Permisos granulares para `ADMIN_STAFF`
   - Validación de pertenencia a consorcio

3. **Sanitización de Inputs**
   - XSS prevention en todos los campos de texto
   - Validación de URLs (whitelist de dominios)
   - MIME type validation para archivos

4. **AuditLog Inmutable**
   - Todas las operaciones financieras logueadas
   - Incluye: usuario, IP, timestamp, datos antes/después
   - Read-only para rol `AUDITOR`

5. **Rate Limiting**
   - Endpoints críticos: 5 intentos/hora
   - Webhooks: validación HMAC-SHA256

### 21.5. Progreso General

```
Backend API: ████████████████████ 100% ✅ COMPLETO

Módulos Core:      ████████████████████ 100% (Auth, Consorcios, UFs)
Motor Financiero:  ████████████████████ 100% (Expensas, Gastos, Pagos)
Comunicación:      ████████████████████ 100% (Tickets, Comunicados, Notificaciones)
Features Esp.:     ████████████████████ 100% (Claiming, Alertas, Snapshots, Badges)
Amenities:         ████████████████████ 100% (Reservas, Disponibilidad, Penalizaciones)
Asambleas:         ████████████████████ 100% (Votación, Quórum, Actas)
Proveedores:       ████████████████████ 100% (Marketplace, Trabajos, Autogestión)
Documentos:        ████████████████████ 100% (Reglamentos, Actas, Contratos)
```

---

## 22. Estado de Implementación del Frontend (Next.js 14)

> **Última actualización:** Enero 2026

Esta sección documenta el estado real de implementación del portal de administradores (`admin-web`).

### 22.1. Estructura de Páginas

El frontend utiliza **App Router** de Next.js 14 con la siguiente estructura:

```
apps/admin-web/src/app/
├── (auth)/                      # Grupo de rutas públicas
│   ├── login/page.tsx           # Login con Magic Link
│   └── layout.tsx
├── (dashboard)/                 # Grupo de rutas protegidas
│   ├── layout.tsx               # Dashboard layout con sidebar
│   ├── page.tsx                 # Home / Dashboard
│   ├── consorcios/
│   │   ├── page.tsx             # Lista de consorcios
│   │   ├── nuevo/page.tsx       # Crear consorcio
│   │   └── [id]/page.tsx        # Detalle/editar consorcio
│   ├── unidades/
│   │   ├── page.tsx             # Lista de unidades funcionales
│   │   ├── nueva/page.tsx       # Crear UF
│   │   └── [id]/page.tsx        # Detalle/editar UF
│   ├── expensas/
│   │   ├── page.tsx             # Lista de expensas
│   │   ├── nueva/page.tsx       # Nueva liquidación
│   │   └── [id]/page.tsx        # Detalle/publicar expensa
│   ├── gastos/
│   │   ├── page.tsx             # Lista de gastos
│   │   ├── nuevo/page.tsx       # Cargar gasto
│   │   └── [id]/page.tsx        # Detalle/editar gasto
│   ├── tickets/
│   │   ├── page.tsx             # Lista de reclamos
│   │   ├── nuevo/page.tsx       # Crear ticket
│   │   └── [id]/page.tsx        # Detalle con comentarios
│   ├── comunicados/
│   │   ├── page.tsx             # Lista de comunicados
│   │   ├── nuevo/page.tsx       # Crear comunicado
│   │   └── [id]/page.tsx        # Detalle/editar
│   ├── usuarios/                # ✅ NUEVO - Sprint 1
│   │   ├── page.tsx             # Lista de usuarios
│   │   ├── nuevo/page.tsx       # Crear/invitar usuario
│   │   └── [id]/page.tsx        # Detalle/editar/roles
│   ├── pagos/                   # ✅ NUEVO - Sprint 1
│   │   ├── page.tsx             # Lista de pagos con stats
│   │   ├── nuevo/page.tsx       # Registrar pago manual
│   │   └── [id]/page.tsx        # Detalle/estado/reembolso
│   └── perfil/
│       └── page.tsx             # Perfil del usuario
└── layout.tsx                   # Root layout
```

### 22.2. Feature Hooks Implementados

Cada feature tiene sus hooks de TanStack Query organizados por dominio:

| Feature | Archivo | Hooks | Estado |
|---------|---------|-------|--------|
| **auth** | `features/auth/hooks.ts` | useLogin, useLogout, useUser, useRefresh | ✅ |
| **consorcios** | `features/consorcios/hooks.ts` | useConsorcios, useConsorcio, useCreateConsorcio, useUpdateConsorcio | ✅ |
| **expensas** | `features/expensas/hooks.ts` | useExpensas, useExpensa, useCreateExpensa, useLiquidar, usePublicar | ✅ |
| **gastos** | `features/gastos/hooks.ts` | useGastos, useGasto, useCreateGasto, useUpdateGasto, useCategorias | ✅ |
| **tickets** | `features/tickets/hooks.ts` | useTickets, useTicket, useCreateTicket, useCambiarEstado, useComentarios | ✅ |
| **comunicados** | `features/comunicados/hooks.ts` | useComunicados, useComunicado, useCreateComunicado, useUpdateComunicado | ✅ |
| **usuarios** | `features/usuarios/hooks.ts` | useUsuarios, useUsuario, useCreateUsuario, useAsignarRol, useUpdateRol, useDeactivate, useReinvitar | ✅ NEW |
| **pagos** | `features/pagos/hooks.ts` | usePagos, usePago, useCuentaCorriente, usePagosStats, useIniciarPago, useRegistrarManual, useActualizarEstado, useReembolsar | ✅ NEW |

### 22.3. Detalle de Feature: Usuarios

**Ubicación:** `apps/admin-web/src/features/usuarios/`

**Hooks disponibles:**
```typescript
// Query keys para cache
export const usuariosKeys = {
  all: ['usuarios'],
  lists: () => [...usuariosKeys.all, 'list'],
  list: (filters) => [...usuariosKeys.lists(), filters],
  details: () => [...usuariosKeys.all, 'detail'],
  detail: (id) => [...usuariosKeys.details(), id],
  byConsorcio: (consorcioId) => [...usuariosKeys.all, 'consorcio', consorcioId],
}

// Hooks implementados
useUsuarios(params)         // Lista con paginación y filtros
useUsuariosByConsorcio(id)  // Usuarios de un consorcio específico
useUsuario(id)              // Detalle de usuario
useCreateUsuario()          // Crear usuario con rol inicial
useUpdateUsuario()          // Actualizar datos del usuario
useAsignarRol()             // Asignar rol a usuario
useUpdateRol()              // Modificar rol existente
useDeactivateUsuario()      // Desactivar usuario
useReinvitarUsuario()       // Reenviar invitación
```

**Páginas implementadas:**

1. **Lista de Usuarios** (`/usuarios`)
   - Búsqueda por nombre/email
   - Filtros: consorcio, rol, estado
   - Stats cards: total, activos, pendientes, suspendidos
   - Paginación
   - Links a detalle y crear

2. **Crear Usuario** (`/usuarios/nuevo`)
   - Formulario con React Hook Form + Zod
   - Campos: email, nombre, apellido, DNI, teléfono
   - Selector de consorcio
   - Selector de rol con campos condicionales
   - Para PROPIETARIO/INQUILINO: selector de UF
   - Para ADMIN_STAFF: checkboxes de permisos

3. **Detalle Usuario** (`/usuarios/[id]`)
   - Info personal del usuario
   - Lista de roles en diferentes consorcios
   - Acciones: editar, asignar rol, desactivar, reinvitar
   - Historial de actividad

### 22.4. Detalle de Feature: Pagos

**Ubicación:** `apps/admin-web/src/features/pagos/`

**Hooks disponibles:**
```typescript
// Query keys para cache
export const pagosKeys = {
  all: ['pagos'],
  lists: () => [...pagosKeys.all, 'list'],
  list: (filters) => [...pagosKeys.lists(), filters],
  details: () => [...pagosKeys.all, 'detail'],
  detail: (id) => [...pagosKeys.details(), id],
  cuentaCorriente: (ufId) => [...pagosKeys.all, 'cuenta', ufId],
  stats: (filters) => [...pagosKeys.all, 'stats', filters],
}

// Hooks implementados
usePagos(params)             // Lista con filtros y paginación
usePago(id)                  // Detalle de un pago
useCuentaCorriente(ufId)     // Movimientos de una UF
usePagosStats(params)        // Estadísticas de recaudación
useIniciarPago()             // Iniciar pago Mercado Pago
useRegistrarPagoManual()     // Registrar transferencia/efectivo
useActualizarEstadoPago()    // Cambiar estado manualmente
useReembolsarPago()          // Procesar reembolso
useGenerarComprobante()      // Generar PDF comprobante
```

**Páginas implementadas:**

1. **Lista de Pagos** (`/pagos`)
   - Stats de recaudación (total, pendiente, aprobados, rechazados)
   - Filtros: consorcio, estado, método, periodo, rango de fechas
   - Tabla con: fecha, vecino, monto, método, estado
   - Totales por método de pago
   - Paginación

2. **Registrar Pago Manual** (`/pagos/nuevo`)
   - Selector de consorcio → UF → Usuario
   - Muestra cuenta corriente del vecino
   - Monto con validación (min $500)
   - Selector de períodos a abonar
   - Método: TRANSFERENCIA o EFECTIVO
   - Referencia de transferencia (opcional)
   - Comentario interno

3. **Detalle de Pago** (`/pagos/[id]`)
   - Información completa del pago
   - Estado con badge de color
   - Períodos abonados
   - Referencia de pasarela (si MP)
   - Acciones por estado:
     - PENDIENTE: Aprobar, Rechazar
     - APROBADO: Reembolsar
   - Historial de cambios

### 22.5. Utilidades Compartidas

**Ubicación:** `apps/admin-web/src/lib/utils.ts`

```typescript
// Formateo de moneda argentina
formatCurrency(amount: number): string
// "$1.234,56" / "-$1.234,56"

// Formateo de fechas
formatDate(date: Date | string): string       // "15/01/2026"
formatDateTime(date: Date | string): string   // "15/01/2026 14:30"

// Formateo de períodos
formatPeriodo(periodo: string): string        // "Enero 2026"
formatPeriodoCorto(periodo: string): string   // "Ene 2026"
getCurrentPeriodo(): string                   // "2026-01"

// Validación de CUIT
isValidCUIT(cuit: string): boolean
formatCUIT(cuit: string): string              // "20-12345678-9"

// Utilidades de texto
truncate(str: string, length: number): string
capitalize(str: string): string
getInitials(nombre: string, apellido?: string): string

// Teléfono argentino
formatPhoneAR(phone: string): string          // "+54 9 11 1234-5678"
```

### 22.6. Componentes UI Utilizados

El frontend utiliza componentes del paquete `@vecinosimple/ui`:

| Componente | Uso | Base |
|------------|-----|------|
| `Button` | Acciones principales y secundarias | Radix + CVA |
| `Input` | Campos de texto | Radix + Tailwind |
| `Select` | Dropdowns y selectores | Radix Select |
| `Card` | Contenedores de información | Tailwind |
| `Table` | Tablas de datos | TanStack Table |
| `Dialog` | Modales de confirmación | Radix Dialog |
| `Toast` | Notificaciones de éxito/error | Radix Toast |
| `Badge` | Estados y etiquetas | CVA variants |
| `Tabs` | Navegación dentro de página | Radix Tabs |
| `Form` | Wrapper de formularios | React Hook Form |

### 22.7. Progreso del Frontend

```
Frontend Admin-Web: ██████████████░░░░░░ 70%

Páginas Core:        ████████████████████ 100% (Dashboard, Consorcios, UFs)
Motor Financiero:    ████████████████████ 100% (Expensas, Gastos, Pagos)
Comunicación:        ████████████████░░░░ 80%  (Tickets, Comunicados)
Gestión Usuarios:    ████████████████████ 100% (Lista, Crear, Editar, Roles)
Amenities:           ░░░░░░░░░░░░░░░░░░░░ 0%   (Pendiente)
Asambleas:           ░░░░░░░░░░░░░░░░░░░░ 0%   (Pendiente)
Proveedores:         ░░░░░░░░░░░░░░░░░░░░ 0%   (Pendiente)
Testing:             ░░░░░░░░░░░░░░░░░░░░ 0%   (Crítico - Sprint 2)
```

### 22.8. Páginas Pendientes

| Página | Backend Ready | Prioridad | Sprint |
|--------|---------------|-----------|--------|
| `/notificaciones` | ✅ | Alta | 2 |
| `/amenities` | ✅ | Alta | 2 |
| `/amenities/reservas` | ✅ | Alta | 2 |
| `/asambleas` | ✅ | Media | 3 |
| `/asambleas/[id]/votar` | ✅ | Media | 3 |
| `/proveedores` | ✅ | Media | 3 |
| `/proveedores/trabajos` | ✅ | Media | 3 |
| `/documentos` | ✅ | Baja | 4 |
| `/alertas` | ✅ | Baja | 4 |
| `/configuracion` | - | Baja | 4 |

### 22.9. Testing Strategy

**Estado actual:** 0% de cobertura

**Plan Sprint 2:**
1. Configurar Vitest + React Testing Library
2. Tests unitarios para hooks de features
3. Tests de componentes UI
4. Tests de integración para flujos críticos
5. E2E con Playwright para flujos de pago