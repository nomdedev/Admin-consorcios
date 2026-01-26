// =============================================================================
// VecinoSimple - Database Seed
// =============================================================================

import { PrismaClient, Rol, TipoVinculoUF, TipoUnidadFuncional } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de base de datos...\n");

  // ---------------------------------------------------------------------------
  // 1. Categorías de Gasto
  // ---------------------------------------------------------------------------
  console.log("📁 Creando categorías de gasto...");
  
  const categorias = await Promise.all([
    prisma.categoriaGasto.upsert({
      where: { nombre: "Sueldos y Cargas Sociales" },
      update: {},
      create: { nombre: "Sueldos y Cargas Sociales", icono: "👷", orden: 1 },
    }),
    prisma.categoriaGasto.upsert({
      where: { nombre: "Servicios Públicos" },
      update: {},
      create: { nombre: "Servicios Públicos", icono: "💡", orden: 2 },
    }),
    prisma.categoriaGasto.upsert({
      where: { nombre: "Mantenimiento" },
      update: {},
      create: { nombre: "Mantenimiento", icono: "🔧", orden: 3 },
    }),
    prisma.categoriaGasto.upsert({
      where: { nombre: "Limpieza" },
      update: {},
      create: { nombre: "Limpieza", icono: "🧹", orden: 4 },
    }),
    prisma.categoriaGasto.upsert({
      where: { nombre: "Seguros" },
      update: {},
      create: { nombre: "Seguros", icono: "🛡️", orden: 5 },
    }),
    prisma.categoriaGasto.upsert({
      where: { nombre: "Administración" },
      update: {},
      create: { nombre: "Administración", icono: "📋", orden: 6 },
    }),
    prisma.categoriaGasto.upsert({
      where: { nombre: "Reparaciones Extraordinarias" },
      update: {},
      create: { nombre: "Reparaciones Extraordinarias", icono: "🏗️", orden: 7 },
    }),
    prisma.categoriaGasto.upsert({
      where: { nombre: "Fondo de Reserva" },
      update: {},
      create: { nombre: "Fondo de Reserva", icono: "💰", orden: 8 },
    }),
  ]);

  console.log(`   ✅ ${categorias.length} categorías creadas\n`);

  // ---------------------------------------------------------------------------
  // 2. Organización Demo
  // ---------------------------------------------------------------------------
  console.log("🏢 Creando organización demo...");

  const organizacion = await prisma.organizacion.upsert({
    where: { cuit: "30-12345678-9" },
    update: {},
    create: {
      nombre: "Administración Demo S.A.",
      cuit: "30-12345678-9",
      email: "demo@vecinosimple.com",
      telefono: "+54 11 1234-5678",
      direccion: "Av. Corrientes 1234, CABA",
      planActual: "profesional",
      limiteConsorcios: 50,
    },
  });

  console.log(`   ✅ Organización: ${organizacion.nombre}\n`);

  // ---------------------------------------------------------------------------
  // 3. Usuario Administrador
  // ---------------------------------------------------------------------------
  console.log("👤 Creando usuario administrador...");

  const adminUser = await prisma.usuario.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      organizacionId: organizacion.id,
      email: "admin@demo.com",
      emailVerificado: true,
      nombre: "Juan",
      apellido: "Administrador",
      telefono: "+54 11 9999-8888",
      estado: "ACTIVO",
    },
  });

  console.log(`   ✅ Admin: ${adminUser.email}\n`);

  // ---------------------------------------------------------------------------
  // 4. Consorcio Demo
  // ---------------------------------------------------------------------------
  console.log("🏠 Creando consorcio demo...");

  const consorcio = await prisma.consorcio.upsert({
    where: { 
      id: "demo-consorcio-001" 
    },
    update: {},
    create: {
      id: "demo-consorcio-001",
      organizacionId: organizacion.id,
      nombre: "Edificio Las Flores",
      direccion: "Av. Santa Fe 2500",
      localidad: "Palermo",
      provincia: "Buenos Aires",
      codigoPostal: "1425",
      cuit: "30-98765432-1",
      diaVencimiento: 10,
      tasaInteresMora: 3.5,
      periodoGracia: 5,
    },
  });

  console.log(`   ✅ Consorcio: ${consorcio.nombre}\n`);

  // ---------------------------------------------------------------------------
  // 5. Unidades Funcionales
  // ---------------------------------------------------------------------------
  console.log("🚪 Creando unidades funcionales...");

  const unidades = [];
  const pisos = ["PB", "1", "2", "3", "4", "5", "6", "7", "8"];
  const departamentos = ["A", "B"];

  for (const piso of pisos) {
    for (const depto of departamentos) {
      const codigo = piso === "PB" ? `PB-${depto}` : `${piso}${depto}`;
      const coeficiente = piso === "PB" ? 4.5 : 5.5; // PB tiene menos coeficiente

      const unidad = await prisma.unidadFuncional.upsert({
        where: {
          consorcioId_codigo: {
            consorcioId: consorcio.id,
            codigo,
          },
        },
        update: {},
        create: {
          consorcioId: consorcio.id,
          codigo,
          piso,
          numero: depto,
          tipo: TipoUnidadFuncional.DEPARTAMENTO,
          coeficiente,
          superficieM2: piso === "PB" ? 45 : 55,
        },
      });

      unidades.push(unidad);
    }
  }

  // Agregar cocheras
  for (let i = 1; i <= 6; i++) {
    const cochera = await prisma.unidadFuncional.upsert({
      where: {
        consorcioId_codigo: {
          consorcioId: consorcio.id,
          codigo: `COCH-${i}`,
        },
      },
      update: {},
      create: {
        consorcioId: consorcio.id,
        codigo: `COCH-${i}`,
        tipo: TipoUnidadFuncional.COCHERA,
        coeficiente: 1.5,
        superficieM2: 12.5,
      },
    });

    unidades.push(cochera);
  }

  console.log(`   ✅ ${unidades.length} unidades creadas\n`);

  // ---------------------------------------------------------------------------
  // 6. Vecinos Demo
  // ---------------------------------------------------------------------------
  console.log("👥 Creando vecinos demo...");

  // Propietario de 1A
  const propietario1A = await prisma.usuario.upsert({
    where: { email: "maria.gonzalez@email.com" },
    update: {},
    create: {
      email: "maria.gonzalez@email.com",
      emailVerificado: true,
      nombre: "María",
      apellido: "González",
      dni: "25123456",
      estado: "ACTIVO",
      preferenciasModo: "simplificado", // Adulta mayor
      preferenciasTexto: 20,
    },
  });

  // Asignar rol de propietario
  await prisma.usuarioConsorcio.upsert({
    where: {
      usuarioId_consorcioId_rol: {
        usuarioId: propietario1A.id,
        consorcioId: consorcio.id,
        rol: Rol.PROPIETARIO,
      },
    },
    update: {},
    create: {
      usuarioId: propietario1A.id,
      consorcioId: consorcio.id,
      rol: Rol.PROPIETARIO,
      unidadFuncionalId: unidades.find((u) => u.codigo === "1A")?.id,
      tipoVinculo: TipoVinculoUF.TITULAR_VOTANTE,
    },
  });

  // Inquilino de 2B
  const inquilino2B = await prisma.usuario.upsert({
    where: { email: "carlos.perez@email.com" },
    update: {},
    create: {
      email: "carlos.perez@email.com",
      emailVerificado: true,
      nombre: "Carlos",
      apellido: "Pérez",
      dni: "35987654",
      estado: "ACTIVO",
    },
  });

  await prisma.usuarioConsorcio.upsert({
    where: {
      usuarioId_consorcioId_rol: {
        usuarioId: inquilino2B.id,
        consorcioId: consorcio.id,
        rol: Rol.INQUILINO,
      },
    },
    update: {},
    create: {
      usuarioId: inquilino2B.id,
      consorcioId: consorcio.id,
      rol: Rol.INQUILINO,
      unidadFuncionalId: unidades.find((u) => u.codigo === "2B")?.id,
      tipoVinculo: TipoVinculoUF.INQUILINO_PRINCIPAL,
    },
  });

  // Encargado
  const encargado = await prisma.usuario.upsert({
    where: { email: "jose.encargado@email.com" },
    update: {},
    create: {
      email: "jose.encargado@email.com",
      emailVerificado: true,
      nombre: "José",
      apellido: "Rodríguez",
      dni: "28456789",
      estado: "ACTIVO",
    },
  });

  await prisma.usuarioConsorcio.upsert({
    where: {
      usuarioId_consorcioId_rol: {
        usuarioId: encargado.id,
        consorcioId: consorcio.id,
        rol: Rol.ENCARGADO,
      },
    },
    update: {},
    create: {
      usuarioId: encargado.id,
      consorcioId: consorcio.id,
      rol: Rol.ENCARGADO,
    },
  });

  console.log("   ✅ 3 vecinos demo creados\n");

  // ---------------------------------------------------------------------------
  // 7. Amenities
  // ---------------------------------------------------------------------------
  console.log("🏊 Creando amenities...");

  await prisma.amenity.upsert({
    where: { id: "amenity-sum" },
    update: {},
    create: {
      id: "amenity-sum",
      consorcioId: consorcio.id,
      nombre: "SUM",
      descripcion: "Salón de Usos Múltiples - Capacidad 50 personas",
      capacidad: 50,
      requiereAprobacion: false,
      anticipacionMinima: 48,
      anticipacionMaxima: 720,
      duracionMaxima: 6,
      costoReserva: 5000,
    },
  });

  await prisma.amenity.upsert({
    where: { id: "amenity-parrilla" },
    update: {},
    create: {
      id: "amenity-parrilla",
      consorcioId: consorcio.id,
      nombre: "Parrilla",
      descripcion: "Parrilla con quincho en terraza",
      capacidad: 20,
      requiereAprobacion: false,
      anticipacionMinima: 24,
      anticipacionMaxima: 336,
      duracionMaxima: 4,
      costoReserva: 0,
    },
  });

  console.log("   ✅ 2 amenities creados\n");

  // ---------------------------------------------------------------------------
  // Fin
  // ---------------------------------------------------------------------------
  console.log("✨ Seed completado exitosamente!\n");
  console.log("📊 Resumen:");
  console.log(`   - ${categorias.length} categorías de gasto`);
  console.log(`   - 1 organización`);
  console.log(`   - 1 consorcio`);
  console.log(`   - ${unidades.length} unidades funcionales`);
  console.log(`   - 4 usuarios (1 admin + 3 vecinos)`);
  console.log(`   - 2 amenities`);
  console.log("\n🔑 Credenciales de acceso:");
  console.log("   Admin: admin@demo.com");
  console.log("   Propietario: maria.gonzalez@email.com");
  console.log("   Inquilino: carlos.perez@email.com");
  console.log("   Encargado: jose.encargado@email.com");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error en seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
