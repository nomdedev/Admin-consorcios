/**
 * Setup global para tests E2E
 * Configura el estado de autenticación para reusar en todos los tests
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

/**
 * Este setup se ejecuta una vez antes de todos los tests
 * Simula un login y guarda el estado de autenticación
 */
setup('authenticate', async ({ page }) => {
  // Para desarrollo, podemos usar un bypass de autenticación
  // En producción, esto debería hacer un login real
  
  // Opción 1: Login real (descomentar cuando esté implementado)
  // await page.goto('/login');
  // await page.getByLabel('Email').fill('test@vecinosimple.com');
  // await page.getByRole('button', { name: /continuar|ingresar/i }).click();
  // await expect(page).toHaveURL('/dashboard');
  
  // Opción 2: Para desarrollo, crear un estado mock
  // Esto simula un usuario autenticado
  await page.goto('/');
  
  // Configurar cookies/localStorage de autenticación mock
  // En un entorno real, esto vendría del proceso de login
  await page.evaluate(() => {
    // Simular token de sesión
    localStorage.setItem('auth-token', 'test-token-for-e2e');
    localStorage.setItem('user', JSON.stringify({
      id: 'user-test',
      email: 'test@vecinosimple.com',
      nombre: 'Usuario',
      apellido: 'Test',
      rol: 'ADMINISTRADOR',
    }));
    
    // Simular consorcio seleccionado
    localStorage.setItem('selectedConsorcio', JSON.stringify({
      id: 'consorcio-test',
      nombre: 'Consorcio de Prueba',
    }));
  });
  
  // Guardar el estado de autenticación
  await page.context().storageState({ path: authFile });
});

/**
 * Setup para crear datos de prueba
 * Se ejecuta antes de los tests que lo necesiten
 */
setup('seed test data', async ({ request }) => {
  // Este setup puede crear datos de prueba en el backend
  // Solo si es necesario y el backend tiene un endpoint de seed
  
  // Ejemplo:
  // await request.post('/api/test/seed', {
  //   data: {
  //     clearFirst: true,
  //     entities: ['expensas', 'pagos'],
  //   },
  // });
});
