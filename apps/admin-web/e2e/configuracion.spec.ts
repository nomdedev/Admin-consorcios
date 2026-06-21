/**
 * Tests E2E para configuracion
 */

import { test, expect, type Page } from '@playwright/test';

test.use({
  storageState: 'e2e/.auth/user.json',
});

test.describe('Configuracion', () => {
  const gotoConfiguracion = async (page: Page) => {
    await page.goto('/');

    await page.getByRole('button', { name: /configuraci[oó]n/i }).click();
    await expect(page).toHaveURL(/configuracion/);
    await expect(page.getByRole('heading', { name: /Configuraci[oó]n/i })).toBeVisible();
  };

  test('debe cargar la pantalla de configuracion', async ({ page }) => {
    await gotoConfiguracion(page);

    await expect(page.getByRole('heading', { name: /Configuraci[oó]n/i })).toBeVisible();
    await expect(page.getByText(/Administr[áa] las preferencias del consorcio/i)).toBeVisible();

    await expect(page.getByRole('button', { name: /guardar cambios/i })).toBeVisible();
  });

  test('debe permitir cambiar tabs', async ({ page }) => {
    await gotoConfiguracion(page);

    const tabNav = page.getByRole('main').locator('nav').filter({ hasText: 'General' });
    await expect(tabNav).toContainText('General');

    const pagosButton = tabNav.getByRole('button', { name: /pagos/i }).first();
    await pagosButton.click();
    await expect(pagosButton).toHaveClass(/border-primary-600/);
    await expect(page.getByRole('heading', { name: /Vencimientos y Mora/i })).toBeVisible();

    const seguridadButton = tabNav.getByRole('button', { name: /seguridad/i }).first();
    await seguridadButton.click();
    await expect(seguridadButton).toHaveClass(/border-primary-600/);
    await expect(page.getByRole('heading', { name: /Autenticaci[oó]n/i })).toBeVisible();
  });
});
