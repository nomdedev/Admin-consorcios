import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient, Prisma } from "@prisma/client";
import { encryptField, decryptField } from "../common/utils/encryption.util";

type SensitiveModelConfig = Record<string, string[]>;

const sensitiveFieldsByModel: SensitiveModelConfig = {
  Usuario: ["dni", "telefono"],
  Consorcio: ["cbu"],
  EmpleadoConsorcio: ["cuil"],
};

const encryptableActions = new Set<Prisma.PrismaAction>([
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
]);

const decryptableActions = new Set<Prisma.PrismaAction>([
  "findUnique",
  "findFirst",
  "findMany",
  "create",
  "update",
  "upsert",
]);

function transformSensitiveData(
  data: unknown,
  fields: string[],
  transformer: (value: string | null | undefined) => string | null | undefined
): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => transformSensitiveData(item, fields, transformer));
  }

  if (data && typeof data === "object") {
    return transformSensitiveRecord(data as Record<string, unknown>, fields, transformer);
  }

  return data;
}

function transformSensitiveRecord(
  record: Record<string, unknown>,
  fields: string[],
  transformer: (value: string | null | undefined) => string | null | undefined
): Record<string, unknown> {
  for (const field of fields) {
    applySensitiveTransform(record, field, transformer);
  }

  return record;
}

function applySensitiveTransform(
  record: Record<string, unknown>,
  field: string,
  transformer: (value: string | null | undefined) => string | null | undefined
): void {
  const value = record[field];

  if (typeof value === "string" || value === null || value === undefined) {
    record[field] = transformer(value);
    return;
  }

  if (!isSetObject(value)) {
    return;
  }

  const setValue = value.set;

  if (typeof setValue === "string" || setValue === null || setValue === undefined) {
    value.set = transformer(setValue);
  }
}

function isSetObject(value: unknown): value is { set?: unknown } {
  return typeof value === "object" && value !== null && "set" in value;
}

function decryptResult(result: unknown, fields: string[]): unknown {
  return transformSensitiveData(result, fields, decryptField);
}

function encryptParams(params: Prisma.MiddlewareParams): void {
  if (!params.model) {
    return;
  }

  const fields = sensitiveFieldsByModel[params.model];
  if (!fields) {
    return;
  }

  params.args.data = transformSensitiveData(params.args.data, fields, encryptField);
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "info", "warn", "error"]
          : ["error"],
    });

    // eslint-disable-next-line deprecation/deprecation
    this.$use(async (params, next) => {
      if (params.model && encryptableActions.has(params.action)) {
        encryptParams(params);
      }

      const result = await next(params);

      if (params.model && decryptableActions.has(params.action)) {
        const fields = sensitiveFieldsByModel[params.model];
        if (fields) {
          return decryptResult(result, fields);
        }
      }

      return result;
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Helper para transacciones
   */
  async executeInTransaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.$transaction(async (prisma) => {
      return fn(prisma as PrismaClient);
    });
  }
}
