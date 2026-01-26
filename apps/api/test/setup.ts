// Jest E2E Test Setup
// Este archivo se ejecuta antes de cada test E2E

// Aumentar timeout para operaciones de base de datos
jest.setTimeout(30000);

// Mock de variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-hs256-algorithm';
process.env.JWT_ACCESS_EXPIRATION = '15m';
process.env.JWT_REFRESH_EXPIRATION = '7d';

// Silenciar logs durante tests (opcional)
// console.log = jest.fn();
// console.warn = jest.fn();
// console.error = jest.fn();

// Cleanup después de todos los tests
afterAll(async () => {
  // Cerrar conexiones si es necesario
});
