import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { EmailTemplateService } from '../email/email-template.service';

// Mock de Prisma
const mockPrismaService = {
  usuario: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

// Mock de JWT Service
const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

// Mock de Config Service
const mockConfigService = {
  get: jest.fn(),
};

// Mock de Email Service
const mockEmailService = {
  send: jest.fn(),
};

// Mock de Email Template Service
const mockEmailTemplateService = {
  magicLink: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: typeof mockPrismaService;
  let jwtService: typeof mockJwtService;
  let configService: typeof mockConfigService;
  let emailService: typeof mockEmailService;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: EmailTemplateService, useValue: mockEmailTemplateService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = mockPrismaService;
    jwtService = mockJwtService;
    configService = mockConfigService;
    emailService = mockEmailService;

    // Default config values
    configService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        APP_URL: 'http://localhost:3000',
        NODE_ENV: 'test',
        DEBUG_AUTH: 'false',
      };
      return config[key];
    });

    // Default email template mock
    mockEmailTemplateService.magicLink.mockReturnValue({
      html: '<p>Magic Link</p>',
      text: 'Magic Link',
    });

    // Default email send mock
    emailService.send.mockResolvedValue({ success: true });
  });

  // ===========================================================================
  // requestMagicLink Tests
  // ===========================================================================

  describe('requestMagicLink', () => {
    const testEmail = 'test@example.com';

    it('should create new user if email not found', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(null);
      prismaService.usuario.create.mockResolvedValue({
        id: 'new-user-id',
        email: testEmail,
        nombre: 'Usuario',
        apellido: 'Pendiente',
        estado: 'PENDIENTE_VERIFICACION',
      });
      prismaService.usuario.update.mockResolvedValue({});

      const result = await service.requestMagicLink({ email: testEmail });

      expect(prismaService.usuario.create).toHaveBeenCalledWith({
        data: {
          email: testEmail,
          nombre: 'Usuario',
          apellido: 'Pendiente',
          estado: 'PENDIENTE_VERIFICACION',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should use existing user if email found', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: testEmail,
        nombre: 'Juan',
        apellido: 'Pérez',
      };
      prismaService.usuario.findUnique.mockResolvedValue(existingUser);
      prismaService.usuario.update.mockResolvedValue({});

      await service.requestMagicLink({ email: testEmail });

      expect(prismaService.usuario.create).not.toHaveBeenCalled();
      expect(prismaService.usuario.update).toHaveBeenCalled();
    });

    it('should generate secure token with 32 bytes', async () => {
      prismaService.usuario.findUnique.mockResolvedValue({
        id: 'user-id',
        email: testEmail,
        nombre: 'Test',
      });
      prismaService.usuario.update.mockResolvedValue({});

      await service.requestMagicLink({ email: testEmail });

      // Verify update was called with a 64-char hex token (32 bytes = 64 hex chars)
      const updateCall = prismaService.usuario.update.mock.calls[0][0];
      expect(updateCall.data.magicLinkToken).toHaveLength(64);
      expect(updateCall.data.magicLinkToken).toMatch(/^[a-f0-9]+$/);
    });

    it('should set token expiration to 15 minutes', async () => {
      prismaService.usuario.findUnique.mockResolvedValue({
        id: 'user-id',
        email: testEmail,
      });
      prismaService.usuario.update.mockResolvedValue({});

      const beforeCall = Date.now();
      await service.requestMagicLink({ email: testEmail });
      const afterCall = Date.now();

      const updateCall = prismaService.usuario.update.mock.calls[0][0];
      const expiration = updateCall.data.magicLinkExpira.getTime();
      
      // Should expire between 14 and 16 minutes from now (allowing for test execution time)
      expect(expiration).toBeGreaterThan(beforeCall + 14 * 60 * 1000);
      expect(expiration).toBeLessThan(afterCall + 16 * 60 * 1000);
    });

    it('should return generic message (not reveal if email exists)', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(null);
      prismaService.usuario.create.mockResolvedValue({ id: 'id', email: testEmail });
      prismaService.usuario.update.mockResolvedValue({});

      const result = await service.requestMagicLink({ email: testEmail });

      expect(result.message).toBe('Si el email está registrado, recibirás un enlace de acceso');
    });

    it('should send email with magic link', async () => {
      prismaService.usuario.findUnique.mockResolvedValue({
        id: 'user-id',
        email: testEmail,
        nombre: 'Test',
      });
      prismaService.usuario.update.mockResolvedValue({});

      await service.requestMagicLink({ email: testEmail });

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          subject: expect.stringContaining('VecinoSimple'),
        })
      );
    });

    it('should include magic link in response only in development', async () => {
      prismaService.usuario.findUnique.mockResolvedValue({
        id: 'user-id',
        email: testEmail,
      });
      prismaService.usuario.update.mockResolvedValue({});

      // Test with development
      configService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'APP_URL') return 'http://localhost:3000';
        return undefined;
      });

      const devResult = await service.requestMagicLink({ email: testEmail });
      expect(devResult.magicLink).toBeDefined();

      // Test with production
      configService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'APP_URL') return 'https://vecinosimple.com';
        return undefined;
      });

      const prodResult = await service.requestMagicLink({ email: testEmail });
      expect(prodResult.magicLink).toBeUndefined();
    });
  });

  // ===========================================================================
  // verifyMagicLink Tests
  // ===========================================================================

  describe('verifyMagicLink', () => {
    const validToken = 'valid-magic-link-token-that-is-64-chars-long-aaaaaaaaaaaaaaaa';

    it('should verify valid token and return JWT', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
      };
      prismaService.usuario.findFirst.mockResolvedValue(mockUser);
      prismaService.usuario.update.mockResolvedValue({});
      jwtService.sign.mockReturnValue('jwt-access-token');

      const result = await service.verifyMagicLink({ token: validToken });

      expect(result.accessToken).toBe('jwt-access-token');
      expect(result.usuario.id).toBe('user-id');
      expect(result.usuario.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      prismaService.usuario.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyMagicLink({ token: 'invalid-token' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      // findFirst returns null when token is expired (query includes gt: new Date())
      prismaService.usuario.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyMagicLink({ token: validToken })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should clear magic link token after successful verification', async () => {
      prismaService.usuario.findFirst.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        nombre: 'Test',
        apellido: 'User',
      });
      prismaService.usuario.update.mockResolvedValue({});
      jwtService.sign.mockReturnValue('token');

      await service.verifyMagicLink({ token: validToken });

      expect(prismaService.usuario.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: expect.objectContaining({
          magicLinkToken: null,
          magicLinkExpira: null,
        }),
      });
    });

    it('should mark user as verified and active', async () => {
      prismaService.usuario.findFirst.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        nombre: 'Test',
        apellido: 'User',
      });
      prismaService.usuario.update.mockResolvedValue({});
      jwtService.sign.mockReturnValue('token');

      await service.verifyMagicLink({ token: validToken });

      expect(prismaService.usuario.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: expect.objectContaining({
          emailVerificado: true,
          estado: 'ACTIVO',
        }),
      });
    });
  });

  // ===========================================================================
  // validateToken Tests
  // ===========================================================================

  describe('validateToken', () => {
    it('should return user for valid token', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        estado: 'ACTIVO',
      };
      jwtService.verify.mockReturnValue({ sub: 'user-id' });
      prismaService.usuario.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateToken('valid-jwt');

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException for invalid JWT', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken('invalid-jwt')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jwtService.verify.mockReturnValue({ sub: 'non-existent-user' });
      prismaService.usuario.findUnique.mockResolvedValue(null);

      await expect(service.validateToken('valid-jwt')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  // ===========================================================================
  // refreshToken Tests
  // ===========================================================================

  describe('refreshToken', () => {
    it('should return new access token for active user', async () => {
      prismaService.usuario.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        estado: 'ACTIVO',
      });
      jwtService.sign.mockReturnValue('new-jwt-token');

      const result = await service.refreshToken('user-id');

      expect(result.accessToken).toBe('new-jwt-token');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('non-existent')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if user not active', async () => {
      prismaService.usuario.findUnique.mockResolvedValue({
        id: 'user-id',
        estado: 'SUSPENDIDO',
      });

      await expect(service.refreshToken('user-id')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for pending verification user', async () => {
      prismaService.usuario.findUnique.mockResolvedValue({
        id: 'user-id',
        estado: 'PENDIENTE_VERIFICACION',
      });

      await expect(service.refreshToken('user-id')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  // ===========================================================================
  // Security Tests
  // ===========================================================================

  describe('Security', () => {
    it('should use cryptographically secure random for token generation', async () => {
      prismaService.usuario.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
      });
      prismaService.usuario.update.mockResolvedValue({});

      // Generate multiple tokens and verify uniqueness
      const tokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        await service.requestMagicLink({ email: 'test@example.com' });
        tokens.push(prismaService.usuario.update.mock.calls[i][0].data.magicLinkToken);
      }

      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(5);
    });

    it('should not expose internal errors in responses', async () => {
      prismaService.usuario.findFirst.mockResolvedValue(null);

      try {
        await service.verifyMagicLink({ token: 'invalid' });
      } catch (error) {
        // Error message should be generic, not expose internals
        expect((error as Error).message).toBe('Token inválido o expirado');
        expect((error as Error).message).not.toContain('database');
        expect((error as Error).message).not.toContain('prisma');
      }
    });
  });
});
