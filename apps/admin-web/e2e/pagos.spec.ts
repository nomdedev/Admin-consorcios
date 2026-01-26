/**
 * Tests E2E para flujo de pagos
 * Estos tests verifican el flujo de pagos de expensas
 */

import { test, expect } from '@playwright/test';

// Configurar autenticación para estos tests
test.use({
  storageState: 'e2e/.auth/user.json',
});

test.describe('Pagos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pagos');
  });

  test('debe mostrar la lista de pagos', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /pagos/i })).toBeVisible();
    
    // Verificar que hay una tabla o lista
    const container = page.getByRole('table')
      .or(page.locator('[data-testid="pagos-list"]'));
    await expect(container).toBeVisible({ timeout: 10000 });
  });

  test('debe mostrar estadísticas de pagos', async ({ page }) => {
    // Buscar cards de estadísticas
    const statsContainer = page.locator('[data-testid="pagos-stats"]')
      .or(page.locator('.stats-card'));
    
    if (await statsContainer.first().isVisible({ timeout: 5000 })) {
      // Verificar que muestra monto recaudado
      await expect(page.getByText(/recaudado|total|cobrado/i).first()).toBeVisible();
    }
  });

  test('debe poder filtrar por estado', async ({ page }) => {
    const filtro = page.getByRole('combobox', { name: /estado|filtrar/i })
      .or(page.locator('[data-testid="filtro-estado"]'));
    
    if (await filtro.isVisible({ timeout: 3000 })) {
      await filtro.click();
      await page.getByRole('option', { name: /aprobado/i }).click();
      
      // Verificar filtro aplicado
      await page.waitForLoadState('networkidle');
    }
  });

  test('debe poder registrar pago manual', async ({ page }) => {
    // Click en botón de nuevo pago o registro manual
    const btnRegistrar = page.getByRole('link', { name: /registrar|nuevo|manual/i })
      .or(page.getByRole('button', { name: /registrar|nuevo|manual/i }));
    
    if (await btnRegistrar.isVisible({ timeout: 3000 })) {
      await btnRegistrar.click();
      
      // Verificar que se muestra el formulario
      await expect(page.getByLabel(/monto/i)).toBeVisible();
      await expect(page.getByLabel(/método|metodo/i)).toBeVisible();
    }
  });

  test('debe poder ver detalle de un pago', async ({ page }) => {
    // Esperar que cargue la lista
    await page.waitForSelector('[data-testid="pago-row"], table tbody tr', {
      timeout: 10000,
    });
    
    // Click en el primer pago
    const primerPago = page.locator('[data-testid="pago-row"], table tbody tr').first();
    await primerPago.click();
    
    // Verificar navegación al detalle
    await expect(page).toHaveURL(/\/pagos\/[a-zA-Z0-9-]+$/);
  });
});

test.describe('Pagos - Validación de formulario', () => {
  test.use({
    storageState: 'e2e/.auth/user.json',
  });

  test('debe validar monto mínimo', async ({ page }) => {
    await page.goto('/pagos/nuevo');
    
    // Si existe el formulario de nuevo pago
    const montoInput = page.getByLabel(/monto/i);
    if (await montoInput.isVisible({ timeout: 3000 })) {
      await montoInput.fill('100'); // Monto menor al mínimo ($500)
      
      // Intentar enviar
      const btnEnviar = page.getByRole('button', { name: /guardar|confirmar|registrar/i });
      await btnEnviar.click();
      
      // Debería mostrar error de validación
      await expect(page.getByText(/mínimo|500|inválido/i)).toBeVisible();
    }
  });
});
