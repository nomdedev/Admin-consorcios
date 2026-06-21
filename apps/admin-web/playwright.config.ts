import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para tests E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directorio donde se encuentran los tests
  testDir: './e2e',
  
  
  // Timeout global para cada test (30 segundos)
  timeout: 30 * 1000,
  
  // Timeout para expect
  expect: {
    timeout: 5000,
  },
  
  // Número máximo de reintentos en caso de fallo
  retries: process.env.CI ? 2 : 0,
  
  // Número de workers para ejecutar tests en paralelo
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter para mostrar resultados
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  // Configuración compartida para todos los tests
  use: {
    // URL base de la aplicación
    baseURL: 'http://localhost:3000',
    
    // Capturar trace solo en caso de fallo (para debugging)
    trace: 'on-first-retry',
    
    // Capturar screenshots solo en caso de fallo
    screenshot: 'only-on-failure',
    
    // Capturar video solo en caso de fallo
    video: 'on-first-retry',
    
    // Headers por defecto (útil para bypass de auth en tests)
    extraHTTPHeaders: {
      'x-test-mode': 'true',
    },
  },

  // Configuración de proyectos (navegadores)
  projects: [
    // Setup de autenticación (se ejecuta primero)
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    // Descomentar para probar en más navegadores:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    //   dependencies: ['setup'],
    // },
    // // Mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    //   dependencies: ['setup'],
    // },
  ],

  // Servidor de desarrollo para ejecutar los tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutos para que arranque Next.js
    env: {
      TEST_MODE: 'true',
    },
  },
});
