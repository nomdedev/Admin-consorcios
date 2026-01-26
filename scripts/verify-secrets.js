#!/usr/bin/env node

/**
 * VecinoSimple - Verificador de Secrets
 *
 * Verifica que todos los secrets requeridos estén configurados correctamente.
 * Uso: node scripts/verify-secrets.js
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_SECRETS = {
  // JWT y Auth
  JWT_SECRET: { minLength: 32, description: 'JWT Secret para firmar tokens' },
  NEXTAUTH_SECRET: { minLength: 32, description: 'NextAuth Secret para sesiones' },

  // Base de datos
  DATABASE_URL: { pattern: /^postgres(ql)?:\/\//, description: 'PostgreSQL connection string' },

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: { pattern: /^https:\/\/.*\.supabase\.co$/, description: 'Supabase project URL' },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: { minLength: 100, description: 'Supabase anonymous key' },

  // Email
  RESEND_API_KEY: { pattern: /^re_/, description: 'Resend API key' },

  // Opcionales pero recomendados
  MERCADO_PAGO_ACCESS_TOKEN: { optional: true, description: 'Mercado Pago access token' },
  WHATSAPP_ACCESS_TOKEN: { optional: true, description: 'WhatsApp Business API token' },
};

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};

  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        env[key.trim()] = value;
      }
    }
  });

  return env;
}

function validateSecret(key, value, config) {
  if (!value && !config.optional) {
    return { valid: false, error: 'Secret no configurado' };
  }

  if (!value && config.optional) {
    return { valid: true, warning: 'Secret opcional no configurado' };
  }

  if (config.minLength && value.length < config.minLength) {
    return { valid: false, error: `Longitud mínima ${config.minLength} caracteres, actual: ${value.length}` };
  }

  if (config.pattern && !config.pattern.test(value)) {
    return { valid: false, error: `Formato inválido, debe coincidir con: ${config.pattern}` };
  }

  return { valid: true };
}

function checkEnvFile(envPath, label) {
  console.log(`\n🔍 Verificando ${label}: ${envPath}`);

  const env = loadEnvFile(envPath);
  let hasErrors = false;
  let hasWarnings = false;

  Object.entries(REQUIRED_SECRETS).forEach(([key, config]) => {
    const value = env[key] || process.env[key];
    const result = validateSecret(key, value, config);

    if (!result.valid) {
      console.log(`❌ ${key}: ${result.error}`);
      hasErrors = true;
    } else if (result.warning) {
      console.log(`⚠️  ${key}: ${result.warning}`);
      hasWarnings = true;
    } else {
      console.log(`✅ ${key}: Configurado correctamente`);
    }
  });

  return { hasErrors, hasWarnings };
}

console.log('='.repeat(60));
console.log('🔐 VecinoSimple - Verificación de Secrets');
console.log('='.repeat(60));

let totalErrors = 0;
let totalWarnings = 0;

// Verificar .env
const envResult = checkEnvFile('.env', 'archivo .env');
totalErrors += envResult.hasErrors ? 1 : 0;
totalWarnings += envResult.hasWarnings ? 1 : 0;

// Verificar variables de entorno del sistema
console.log(`\n🔍 Verificando variables de entorno del sistema:`);
Object.entries(REQUIRED_SECRETS).forEach(([key, config]) => {
  const value = process.env[key];
  if (value) {
    const result = validateSecret(key, value, config);
    if (!result.valid) {
      console.log(`❌ ${key}: ${result.error} (desde env)`);
      totalErrors++;
    } else {
      console.log(`✅ ${key}: Configurado en entorno del sistema`);
    }
  }
});

console.log('\n' + '='.repeat(60));

if (totalErrors > 0) {
  console.log(`❌ VERIFICACIÓN FALLIDA: ${totalErrors} errores encontrados`);
  console.log('='.repeat(60));
  console.log('\n📋 ACCIONES RECOMENDADAS:');
  console.log('1. Ejecutar: node scripts/generate-secrets.js');
  console.log('2. Copiar los valores generados a tu .env');
  console.log('3. Rotar secrets en Supabase, Railway, Vercel según SEC-004');
  console.log('4. Re-ejecutar esta verificación');
  process.exit(1);
} else {
  console.log('✅ VERIFICACIÓN EXITOSA: Todos los secrets requeridos configurados');
  if (totalWarnings > 0) {
    console.log(`⚠️  ${totalWarnings} warnings - revisar secrets opcionales`);
  }
  console.log('='.repeat(60));
}