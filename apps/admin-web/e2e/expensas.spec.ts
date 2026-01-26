/**
 * Tests E2E para flujo de expensas
 * Estos tests requieren un usuario autenticado
 */

import { test, expect } from '@playwright/test';

// Configurar autenticación para estos tests
test.use({
  storageState: 'e2e/.auth/user.json',
});

test.describe('Expensas', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar al módulo de expensas
    await page.goto('/expensas');
  });

  test('debe mostrar la lista de expensas', async ({ page }) => {
    // Esperar que cargue la lista
    await expect(page.getByRole('heading', { name: /expensas/i })).toBeVisible();
    
    // Verificar que hay una tabla o lista
    const table = page.getByRole('table').or(page.locator('[data-testid="expensas-list"]'));
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('debe poder filtrar por estado', async ({ page }) => {
    // Buscar selector de filtro
    const filtroEstado = page.getByRole('combobox', { name: /estado|filtrar/i })
      .or(page.locator('[data-testid="filtro-estado"]'));
    
    if (await filtroEstado.isVisible()) {
      await filtroEstado.click();
      
      // Seleccionar estado "Publicada"
      await page.getByRole('option', { name: /publicada/i }).click();
      
      // Verificar que la URL cambia o que los resultados se filtran
      await expect(page).toHaveURL(/estado=PUBLICADA/i);
    }
  });

  test('debe poder navegar al detalle de una expensa', async ({ page }) => {
    // Esperar que cargue la lista
    await page.waitForSelector('[data-testid="expensa-row"], table tbody tr', { 
      timeout: 10000 
    });
    
    // Click en la primera expensa
    const primeraExpensa = page.locator('[data-testid="expensa-row"], table tbody tr').first();
    await primeraExpensa.click();
    
    // Verificar navegación al detalle
    await expect(page).toHaveURL(/\/expensas\/[a-zA-Z0-9-]+$/);
  });

  test('debe poder crear nueva expensa', async ({ page }) => {
    // Click en botón de nueva expensa
    const btnNueva = page.getByRole('link', { name: /nueva|crear|agregar/i })
      .or(page.getByRole('button', { name: /nueva|crear|agregar/i }));
    
    await btnNueva.click();
    
    // Verificar navegación al formulario
    await expect(page).toHaveURL(/\/expensas\/nueva/);
    
    // Verificar elementos del formulario
    await expect(page.getByLabel(/período|periodo/i)).toBeVisible();
  });
});

test.describe('Expensas - Sin autenticación', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('debe redirigir a login si no está autenticado', async ({ page }) => {
    await page.goto('/expensas');
    
    // Debería redirigir a login
    await expect(page).toHaveURL(/login/);
  });
});
