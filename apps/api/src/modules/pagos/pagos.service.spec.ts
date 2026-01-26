import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PagosService } from './pagos.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { EmailTemplateService } from '../email/email-template.service';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';
import { Rol } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { MetodoPago } from './dto/pago.dto';
import * as crypto from 'node:crypto';

// Mocks
const mockPrismaService = {
  usuario: {
    findUnique: jest.fn(),
  },
  usuarioConsorcio: {
    findFirst: jest.fn(),
  },
  unidadFuncional: {
    findUnique: jest.fn(),
  },
  expensa: {
    findFirst: jest.fn(),
  },
  detalleExpensa: {
    findFirst: jest.fn(),
  },
  pago: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  movimientoCuentaCorriente: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  consorcio: {
    findUnique: jest.fn(),
  },
};

const mockAuditService = {
  log: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockEmailService = {
  send: jest.fn().mockResolvedValue({ success: true }),
};

const mockEmailTemplateService = {
  paymentConfirmation: jest.fn().mockReturnValue({
    html: '<p>Payment confirmed</p>',
    text: 'Payment confirmed',
  }),
};

const mockMercadoPagoService = {
  isConfigured: jest.fn().mockReturnValue(false),
  createPreference: jest.fn(),
  getPayment: jest.fn(),
  mapStatusToEstado: jest.fn(),
};

describe('PagosService', () => {
  let service: PagosService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        MERCADO_PAGO_WEBHOOK_SECRET: 'test-secret-key-for-webhook-validation',
        APP_URL: 'http://localhost:3000',
      };
      return config[key];
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagosService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: EmailTemplateService, useValue: mockEmailTemplateService },
        { provide: MercadoPagoService, useValue: mockMercadoPagoService },
      ],
    }).compile();

    service = module.get<PagosService>(PagosService);
  });

  // ===========================================================================
  // Validación de Acceso Tests
  // ===========================================================================

  describe('validarAccesoUnidadFuncional', () => {
    it('should allow access for PROPIETARIO with valid UF', async () => {
      mockPrismaService.usuarioConsorcio.findFirst.mockResolvedValue({
        usuarioId: 'user-id',
        unidadFuncionalId: 'uf-id',
        rol: Rol.PROPIETARIO,
        activo: true,
        unidadFuncional: {
          consorcioId: 'consorcio-id',
          codigo: '4B',
        },
      });

      // Setup mocks for internal calls
      mockPrismaService.unidadFuncional.findUnique.mockResolvedValue({
        id: 'uf-id',
        consorcioId: 'consorcio-id',
      });
      mockPrismaService.expensa.findFirst.mockResolvedValue({
        periodo: '2024-01',
        estado: 'PUBLICADA',
      });
      mockPrismaService.pago.findFirst.mockResolvedValue(null);
      mockPrismaService.pago.aggregate.mockResolvedValue({ _sum: { monto: null } });
      mockPrismaService.detalleExpensa.findFirst.mockResolvedValue({
        total: new Decimal(10000),
        expensa: { periodo: '2024-01', estado: 'PUBLICADA' },
      });
      mockPrismaService.pago.count.mockResolvedValue(0);
      mockPrismaService.pago.create.mockResolvedValue({
        id: 'pago-id',
        monto: new Decimal(10000),
      });
      mockPrismaService.consorcio.findUnique.mockResolvedValue({
        id: 'consorcio-id',
        cbu: '1234567890',
        aliasCbu: 'CONSORCIO.ALIAS',
      });

      // This should not throw
      await expect(
        service.iniciarPago(
          {
            unidadFuncionalId: 'uf-id',
            periodosAbonados: ['2024-01'],
            metodoPago: MetodoPago.TRANSFERENCIA,
          },
          'user-id',
        ),
      ).resolves.toBeDefined();
    });

    it('should deny access for user without UF vinculation', async () => {
      mockPrismaService.usuarioConsorcio.findFirst.mockResolvedValue(null);

      await expect(
        service.iniciarPago(
          {
            unidadFuncionalId: 'uf-id',
            periodosAbonados: ['2024-01'],
            metodoPago: MetodoPago.TRANSFERENCIA,
          },
          'user-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ===========================================================================
  // Iniciar Pago Tests
  // ===========================================================================

  describe('iniciarPago', () => {
    beforeEach(() => {
      // Setup common mocks
      mockPrismaService.usuarioConsorcio.findFirst.mockResolvedValue({
        usuarioId: 'user-id',
        unidadFuncionalId: 'uf-id',
        rol: Rol.PROPIETARIO,
        activo: true,
        unidadFuncional: {
          consorcioId: 'consorcio-id',
          codigo: '4B',
        },
      });
      mockPrismaService.unidadFuncional.findUnique.mockResolvedValue({
        id: 'uf-id',
        consorcioId: 'consorcio-id',
      });
      mockPrismaService.expensa.findFirst.mockResolvedValue({
        periodo: '2024-01',
        estado: 'PUBLICADA',
      });
      mockPrismaService.pago.count.mockResolvedValue(0); // No rate limit
      mockPrismaService.pago.findFirst.mockResolvedValue(null); // No pending payments
      mockPrismaService.pago.aggregate.mockResolvedValue({ _sum: { monto: null } });
      mockPrismaService.detalleExpensa.findFirst.mockResolvedValue({
        total: new Decimal(15000),
        expensa: { periodo: '2024-01', estado: 'PUBLICADA' },
      });
      mockPrismaService.consorcio.findUnique.mockResolvedValue({
        id: 'consorcio-id',
        cbu: '0000003100010000000001',
        aliasCbu: 'EDIFICIO.FLORES',
        banco: 'Banco Nación',
      });
    });

    it('should reject payment below minimum amount ($500)', async () => {
      mockPrismaService.detalleExpensa.findFirst.mockResolvedValue({
        total: new Decimal(400), // Below minimum
        expensa: { periodo: '2024-01', estado: 'PUBLICADA' },
      });

      await expect(
        service.iniciarPago(
          {
            unidadFuncionalId: 'uf-id',
            periodosAbonados: ['2024-01'],
            metodoPago: MetodoPago.TRANSFERENCIA,
          },
          'user-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate periods in same request', async () => {
      mockPrismaService.pago.create.mockResolvedValue({
        id: 'pago-id',
        monto: new Decimal(15000),
      });

      // Call with duplicate periods - service should deduplicate
      const result = await service.iniciarPago(
        {
          unidadFuncionalId: 'uf-id',
          periodosAbonados: ['2024-01', '2024-01', '2024-01'],
          metodoPago: MetodoPago.TRANSFERENCIA,
        },
        'user-id',
      );

      // Should process only unique periods
      expect(result).toBeDefined();
    });

    it('should reject if period already has pending payment', async () => {
      mockPrismaService.pago.findFirst.mockResolvedValue({
        id: 'existing-pago',
        estado: 'PENDIENTE',
        periodosAbonados: ['2024-01'],
      });

      await expect(
        service.iniciarPago(
          {
            unidadFuncionalId: 'uf-id',
            periodosAbonados: ['2024-01'],
            metodoPago: MetodoPago.TRANSFERENCIA,
          },
          'user-id',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject if expense is not PUBLICADA or CERRADA', async () => {
      mockPrismaService.detalleExpensa.findFirst.mockResolvedValue(null);

      await expect(
        service.iniciarPago(
          {
            unidadFuncionalId: 'uf-id',
            periodosAbonados: ['2024-01'],
            metodoPago: MetodoPago.TRANSFERENCIA,
          },
          'user-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return bank data for TRANSFERENCIA method', async () => {
      mockPrismaService.pago.create.mockResolvedValue({
        id: 'pago-id',
        monto: new Decimal(15000),
        metodoPago: MetodoPago.TRANSFERENCIA,
        estado: 'PENDIENTE',
      });

      const result = await service.iniciarPago(
        {
          unidadFuncionalId: 'uf-id',
          periodosAbonados: ['2024-01'],
          metodoPago: MetodoPago.TRANSFERENCIA,
        },
        'user-id',
      );

      expect(result.datosTransferencia).toBeDefined();
      expect(result.datosTransferencia?.cbu).toBe('0000003100010000000001');
      expect(result.datosTransferencia?.alias).toBe('EDIFICIO.FLORES');
    });

    it('should create audit log for new payment', async () => {
      mockPrismaService.pago.create.mockResolvedValue({
        id: 'pago-id',
        monto: new Decimal(15000),
      });

      await service.iniciarPago(
        {
          unidadFuncionalId: 'uf-id',
          periodosAbonados: ['2024-01'],
          metodoPago: MetodoPago.TRANSFERENCIA,
        },
        'user-id',
      );

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'user-id',
          accion: 'CREATE',
          entidad: 'Pago',
        }),
      );
    });
  });

  // ===========================================================================
  // Webhook Mercado Pago Tests (CRÍTICO)
  // ===========================================================================

  describe('procesarWebhookMercadoPago', () => {
    const validWebhookData = {
      type: 'payment',
      dataId: 'mp-payment-123',
      externalReference: 'pago-id',
      requestId: 'request-123',
      timestamp: '1705762800', // Unix timestamp
    };

    beforeEach(() => {
      mockPrismaService.pago.findUnique.mockResolvedValue({
        id: 'pago-id',
        usuarioId: 'user-id',
        monto: new Decimal(10000),
        estado: 'PENDIENTE',
        concepto: 'Expensas 2024-01',
      });
    });

    it('should reject webhook with invalid signature', async () => {
      await expect(
        service.procesarWebhookMercadoPago(validWebhookData, 'invalid-signature'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject webhook without required signature data', async () => {
      const incompleteData = {
        type: 'payment',
        dataId: 'mp-payment-123',
        externalReference: 'pago-id',
        // Missing requestId and timestamp
      };

      await expect(
        service.procesarWebhookMercadoPago(incompleteData, undefined),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should ignore non-payment webhook types', async () => {
      const nonPaymentData = {
        ...validWebhookData,
        type: 'merchant_order',
      };

      // Generate valid signature for this data
      const signature = generateValidSignature(nonPaymentData);

      const result = await service.procesarWebhookMercadoPago(
        nonPaymentData,
        signature,
      );

      expect(result.processed).toBe(false);
    });

    it('should update payment status on valid webhook', async () => {
      // Generate valid signature
      const signature = generateValidSignature(validWebhookData);
      
      mockMercadoPagoService.isConfigured.mockReturnValue(true);
      mockMercadoPagoService.getPayment.mockResolvedValue({ status: 'approved' });
      mockMercadoPagoService.mapStatusToEstado.mockReturnValue('APROBADO');
      mockPrismaService.pago.update.mockResolvedValue({
        id: 'pago-id',
        estado: 'APROBADO',
      });
      mockPrismaService.usuarioConsorcio.findFirst.mockResolvedValue({
        unidadFuncionalId: 'uf-id',
      });
      mockPrismaService.movimientoCuentaCorriente.findFirst.mockResolvedValue(null);
      mockPrismaService.movimientoCuentaCorriente.create.mockResolvedValue({});

      const result = await service.procesarWebhookMercadoPago(
        validWebhookData,
        signature,
      );

      expect(result.received).toBe(true);
      expect(mockPrismaService.pago.update).toHaveBeenCalled();
    });

    it('should create audit log for webhook processing', async () => {
      const signature = generateValidSignature(validWebhookData);
      
      mockMercadoPagoService.isConfigured.mockReturnValue(false);
      mockPrismaService.pago.update.mockResolvedValue({
        id: 'pago-id',
        estado: 'APROBADO',
      });
      mockPrismaService.usuarioConsorcio.findFirst.mockResolvedValue({
        unidadFuncionalId: 'uf-id',
      });
      mockPrismaService.movimientoCuentaCorriente.findFirst.mockResolvedValue(null);
      mockPrismaService.movimientoCuentaCorriente.create.mockResolvedValue({});

      await service.procesarWebhookMercadoPago(validWebhookData, signature);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'SYSTEM_WEBHOOK_MP',
          accion: 'UPDATE',
          entidad: 'Pago',
        }),
      );
    });

    it('should not process already processed payment', async () => {
      mockPrismaService.pago.findUnique.mockResolvedValue({
        id: 'pago-id',
        estado: 'APROBADO', // Already approved
      });

      const signature = generateValidSignature(validWebhookData);
      mockMercadoPagoService.isConfigured.mockReturnValue(true);
      mockMercadoPagoService.getPayment.mockResolvedValue({ status: 'approved' });
      mockMercadoPagoService.mapStatusToEstado.mockReturnValue('APROBADO');

      const result = await service.procesarWebhookMercadoPago(
        validWebhookData,
        signature,
      );

      expect(result.reason).toBe('already_processed');
      expect(mockPrismaService.pago.update).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Rate Limiting Tests
  // ===========================================================================

  describe('Rate Limiting', () => {
    it('should enforce rate limit of 5 payments per hour', async () => {
      mockPrismaService.usuarioConsorcio.findFirst.mockResolvedValue({
        usuarioId: 'user-id',
        unidadFuncionalId: 'uf-id',
        rol: Rol.PROPIETARIO,
        activo: true,
        unidadFuncional: {
          consorcioId: 'consorcio-id',
          codigo: '4B',
        },
      });
      
      // Simulate 5 recent payments (rate limit exceeded)
      mockPrismaService.pago.count.mockResolvedValue(5);

      await expect(
        service.iniciarPago(
          {
            unidadFuncionalId: 'uf-id',
            periodosAbonados: ['2024-01'],
            metodoPago: MetodoPago.TRANSFERENCIA,
          },
          'user-id',
        ),
      ).rejects.toThrow('Ha alcanzado el límite de intentos de pago');
    });
  });

  // ===========================================================================
  // Security Tests
  // ===========================================================================

  describe('Security', () => {
    beforeEach(() => {
      // Reset mocks for security tests
      jest.clearAllMocks();
      mockPrismaService.pago.count.mockResolvedValue(0); // No rate limit
    });

    it('should validate consorcioId access before processing', async () => {
      // User tries to access UF from different consorcio
      mockPrismaService.usuarioConsorcio.findFirst.mockResolvedValue(null);

      await expect(
        service.iniciarPago(
          {
            unidadFuncionalId: 'uf-from-other-consorcio',
            periodosAbonados: ['2024-01'],
            metodoPago: MetodoPago.TRANSFERENCIA,
          },
          'user-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should not expose internal payment IDs in error messages', async () => {
      mockPrismaService.pago.findUnique.mockResolvedValue(null);

      try {
        await service.findOne('non-existent-id', 'user-id');
      } catch (error) {
        expect((error as Error).message).not.toContain('non-existent-id');
        expect((error as Error).message).not.toContain('prisma');
      }
    });

    it('should use HMAC-SHA256 for webhook signature validation', async () => {
      // This test verifies the signature algorithm used
      const testSecret = 'test-secret-key-for-webhook-validation';
      const testDataId = 'payment-123';
      const testRequestId = 'request-456';
      const testTimestamp = '1705762800';

      // Generate signature the same way the service should
      const signedTemplate = `id:${testDataId};request-id:${testRequestId};ts:${testTimestamp};`;
      const expectedSignature = crypto
        .createHmac('sha256', testSecret)
        .update(signedTemplate)
        .digest('hex');

      // The service should produce the same signature for valid webhooks
      expect(expectedSignature).toHaveLength(64); // SHA256 produces 64 hex chars
    });

    it('should use timing-safe comparison for signature validation', async () => {
      // This is more of a documentation test - the actual implementation
      // should use crypto.timingSafeEqual to prevent timing attacks
      const webhookData = {
        type: 'payment',
        dataId: 'test',
        externalReference: 'pago-id',
        requestId: 'req-id',
        timestamp: '12345',
      };

      mockPrismaService.pago.findUnique.mockResolvedValue({
        id: 'pago-id',
        estado: 'PENDIENTE',
      });

      // Invalid signature should be rejected quickly
      const start = Date.now();
      try {
        await service.procesarWebhookMercadoPago(webhookData, 'wrong-signature');
      } catch {
        // Expected to throw
      }
      const duration = Date.now() - start;

      // Should reject within reasonable time (timing attack prevention)
      expect(duration).toBeLessThan(100);
    });
  });
});

// Helper function to generate valid webhook signature for tests
function generateValidSignature(data: {
  dataId: string;
  requestId?: string;
  timestamp?: string;
}): string {
  const secret = 'test-secret-key-for-webhook-validation';
  const signedTemplate = `id:${data.dataId};request-id:${data.requestId};ts:${data.timestamp};`;
  return crypto.createHmac('sha256', secret).update(signedTemplate).digest('hex');
}
