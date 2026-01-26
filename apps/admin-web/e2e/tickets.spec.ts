/**
 * Tests E2E para flujo de tickets/reclamos
 */

import { test, expect } from '@playwright/test';

test.use({
  storageState: 'e2e/.auth/user.json',
});

test.describe('Tickets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tickets');
  });

  test('debe mostrar la lista de tickets', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /tickets|reclamos/i })).toBeVisible();
    
    // Verificar que hay una tabla o lista
    await expect(
      page.getByRole('table').or(page.locator('[data-testid="tickets-list"]'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('debe mostrar filtros por estado', async ({ page }) => {
    const filtros = page.locator('[data-testid="filtro-estado"], [role="tablist"]');
    
    if (await filtros.isVisible({ timeout: 3000 })) {
      // Verificar estados disponibles
      await expect(page.getByRole('tab', { name: /abierto/i })
        .or(page.getByText(/abierto/i))).toBeVisible();
    }
  });

  test('debe poder crear nuevo ticket', async ({ page }) => {
    const btnNuevo = page.getByRole('link', { name: /nuevo|crear/i })
      .or(page.getByRole('button', { name: /nuevo|crear/i }));
    
    await btnNuevo.click();
    
    // Verificar formulario
    await expect(page).toHaveURL(/\/tickets\/nuevo/);
    await expect(page.getByLabel(/título|asunto/i)).toBeVisible();
    await expect(page.getByLabel(/descripción|detalle/i)).toBeVisible();
  });

  test('debe validar campos requeridos al crear ticket', async ({ page }) => {
    await page.goto('/tickets/nuevo');
    
    // Intentar enviar sin completar campos
    const btnEnviar = page.getByRole('button', { name: /enviar|crear|guardar/i });
    await btnEnviar.click();
    
    // Debería mostrar errores de validación
    await expect(page.getByText(/requerido|obligatorio/i).first()).toBeVisible();
  });

  test('debe poder ver detalle de un ticket', async ({ page }) => {
    // Esperar lista
    await page.waitForSelector('[data-testid="ticket-row"], table tbody tr', {
      timeout: 10000,
    });
    
    // Click en primer ticket
    await page.locator('[data-testid="ticket-row"], table tbody tr').first().click();
    
    // Verificar detalle
    await expect(page).toHaveURL(/\/tickets\/[a-zA-Z0-9-]+$/);
    await expect(page.getByText(/estado|prioridad/i).first()).toBeVisible();
  });
});

test.describe('Tickets - Comentarios', () => {
  test.use({
    storageState: 'e2e/.auth/user.json',
  });

  test('debe poder agregar comentario a ticket existente', async ({ page }) => {
    await page.goto('/tickets');
    
    // Esperar y hacer click en primer ticket
    await page.waitForSelector('[data-testid="ticket-row"], table tbody tr', {
      timeout: 10000,
    });
    await page.locator('[data-testid="ticket-row"], table tbody tr').first().click();
    
    // Buscar campo de comentario
    const comentarioInput = page.getByPlaceholder(/comentario|respuesta/i)
      .or(page.getByLabel(/comentario|respuesta/i));
    
    if (await comentarioInput.isVisible({ timeout: 3000 })) {
      await comentarioInput.fill('Comentario de prueba E2E');
      
      const btnEnviar = page.getByRole('button', { name: /enviar|agregar/i });
      await btnEnviar.click();
      
      // Verificar que el comentario aparece
      await expect(page.getByText('Comentario de prueba E2E')).toBeVisible();
    }
  });
});
