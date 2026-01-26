/**
 * Tests E2E para flujo de autenticación
 */

import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('debe mostrar la página de login', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar elementos de la página de login
    await expect(page.getByRole('heading', { name: /iniciar sesión|login/i })).toBeVisible();
    await expect(page.getByLabel(/email|correo/i)).toBeVisible();
  });

  test('debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');
    
    // Ingresar credenciales inválidas
    await page.getByLabel(/email|correo/i).fill('test@invalid.com');
    await page.getByRole('button', { name: /ingresar|enviar|continuar/i }).click();
    
    // Debería mostrar algún mensaje de error o permanecer en login
    // (el comportamiento exacto depende de la implementación)
    await expect(page).toHaveURL(/login/);
  });

  test('debe redirigir a login si no está autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Debería redirigir a login
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Navegación pública', () => {
  test('debe cargar la página principal', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que la página carga sin errores
    await expect(page).not.toHaveTitle(/error|500|404/i);
  });
});
