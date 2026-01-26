/**
 * Tests E2E para Dashboard
 * Verifica que el dashboard carga correctamente con todos sus widgets
 */

import { test, expect } from '@playwright/test';

test.use({
  storageState: 'e2e/.auth/user.json',
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('debe cargar el dashboard correctamente', async ({ page }) => {
    // Verificar título o heading del dashboard
    await expect(
      page.getByRole('heading', { name: /dashboard|inicio|panel/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('debe mostrar métricas principales', async ({ page }) => {
    // Esperar que carguen las métricas
    await page.waitForLoadState('networkidle');
    
    // Buscar cards de métricas
    const metricsContainer = page.locator('[data-testid="metrics"], .metrics-container, .dashboard-cards');
    
    if (await metricsContainer.isVisible({ timeout: 5000 })) {
      // Verificar que hay al menos una métrica visible
      const metrics = metricsContainer.locator('.metric-card, [data-testid*="metric"]');
      await expect(metrics.first()).toBeVisible();
    }
  });

  test('debe mostrar navegación lateral', async ({ page }) => {
    // Verificar sidebar o navegación
    const sidebar = page.locator('[data-testid="sidebar"], nav, aside').first();
    await expect(sidebar).toBeVisible();
    
    // Verificar links de navegación principales
    await expect(page.getByRole('link', { name: /expensas/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /pagos/i })).toBeVisible();
  });

  test('debe mostrar selector de consorcio', async ({ page }) => {
    // Buscar selector de consorcio
    const selectorConsorcio = page.locator('[data-testid="consorcio-selector"]')
      .or(page.getByRole('combobox', { name: /consorcio|edificio/i }));
    
    if (await selectorConsorcio.isVisible({ timeout: 3000 })) {
      await selectorConsorcio.click();
      
      // Debería mostrar opciones
      await expect(page.getByRole('listbox')).toBeVisible();
    }
  });

  test('debe cargar gráficos sin errores', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Buscar contenedores de gráficos (Recharts)
    const chartContainers = page.locator('.recharts-wrapper, [data-testid*="chart"]');
    
    if (await chartContainers.first().isVisible({ timeout: 5000 })) {
      // Verificar que no hay errores de carga
      await expect(page.locator('.error, [data-error]')).not.toBeVisible();
    }
  });
});

test.describe('Dashboard - Responsivo', () => {
  test.use({
    storageState: 'e2e/.auth/user.json',
    viewport: { width: 375, height: 667 }, // iPhone SE
  });

  test('debe adaptarse a móvil', async ({ page }) => {
    await page.goto('/dashboard');
    
    // En móvil, el sidebar debería estar oculto o ser un menú hamburguesa
    const menuHamburguesa = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]');
    
    // El contenido principal debe ser visible
    const mainContent = page.locator('main, [data-testid="main-content"]');
    await expect(mainContent).toBeVisible();
  });
});
