import { PrismaClient } from '@prisma/client';

import { encryptField } from '../common/utils/encryption.util';

const prisma = new PrismaClient();

const isEncrypted = (value: string | null | undefined) =>
	typeof value === 'string' && value.startsWith('enc:v1:');

async function backfillUsuarios() {
	const usuarios = await prisma.usuario.findMany({
		select: { id: true, dni: true, telefono: true },
	});

	let updated = 0;

	for (const usuario of usuarios) {
		const nextDni = isEncrypted(usuario.dni) ? usuario.dni : encryptField(usuario.dni);
		const nextTelefono = isEncrypted(usuario.telefono)
			? usuario.telefono
			: encryptField(usuario.telefono);

		if (nextDni !== usuario.dni || nextTelefono !== usuario.telefono) {
			const data: { dni?: string | null; telefono?: string | null } = {};

			if (nextDni !== usuario.dni) {
				data.dni = nextDni ?? null;
			}

			if (nextTelefono !== usuario.telefono) {
				data.telefono = nextTelefono ?? null;
			}

			await prisma.usuario.update({
				where: { id: usuario.id },
				data,
			});
			updated += 1;
		}
	}

	return updated;
}

async function backfillConsorcios() {
	const consorcios = await prisma.consorcio.findMany({
		select: { id: true, cbu: true },
	});

	let updated = 0;

	for (const consorcio of consorcios) {
		const nextCbu = isEncrypted(consorcio.cbu) ? consorcio.cbu : encryptField(consorcio.cbu);

		if (nextCbu !== consorcio.cbu) {
			await prisma.consorcio.update({
				where: { id: consorcio.id },
				data: {
					cbu: nextCbu ?? null,
				},
			});
			updated += 1;
		}
	}

	return updated;
}

async function backfillEmpleados() {
	const empleados = await prisma.empleadoConsorcio.findMany({
		select: { id: true, cuil: true },
	});

	let updated = 0;

	for (const empleado of empleados) {
		const nextCuil = isEncrypted(empleado.cuil) ? empleado.cuil : encryptField(empleado.cuil);

		if (nextCuil !== empleado.cuil) {
			await prisma.empleadoConsorcio.update({
				where: { id: empleado.id },
				data: {
					cuil: nextCuil ?? empleado.cuil,
				},
			});
			updated += 1;
		}
	}

	return updated;
}

async function main() {
	try {
		const usuariosActualizados = await backfillUsuarios();
		const consorciosActualizados = await backfillConsorcios();
		const empleadosActualizados = await backfillEmpleados();

		// eslint-disable-next-line no-console
		console.log('Backfill completado:', {
			usuariosActualizados,
			consorciosActualizados,
			empleadosActualizados,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error en backfill:', error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

// eslint-disable-next-line
void main();
