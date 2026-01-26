#!/usr/bin/env node

/**
 * VecinoSimple - Generador de Secrets Seguros
 *
 * Genera secrets aleatorios seguros para JWT, NextAuth y otras variables sensibles.
 * Uso: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

function generateHexSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('='.repeat(60));
console.log('🔐 VecinoSimple - Generador de Secrets Seguros');
console.log('='.repeat(60));
console.log('');

console.log('📝 COPIAR ESTOS VALORES A TU .env LOCAL:');
console.log('');

console.log('# JWT Secret (32 bytes base64)');
console.log(`JWT_SECRET="${generateSecret(32)}"`);
console.log('');

console.log('# NextAuth Secret (32 bytes base64)');
console.log(`NEXTAUTH_SECRET="${generateSecret(32)}"`);
console.log('');

console.log('# Mercado Pago Webhook Secret (32 bytes hex)');
console.log(`MERCADO_PAGO_WEBHOOK_SECRET="${generateHexSecret(32)}"`);
console.log('');

console.log('# WhatsApp Verify Token (16 bytes base64)');
console.log(`WHATSAPP_VERIFY_TOKEN="${generateSecret(16)}"`);
console.log('');

console.log('# Firebase Private Key (simulado - usar key real de Firebase)');
console.log('# Descargar de: https://console.firebase.google.com/ > Configuración > Cuentas de servicio');
console.log('# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."');
console.log('');

console.log('='.repeat(60));
console.log('⚠️  INSTRUCCIONES PARA PRODUCCIÓN:');
console.log('='.repeat(60));
console.log('');
console.log('1. SUPABASE:');
console.log('   - Dashboard > Settings > API > Regenerate Service Role Key');
console.log('   - Dashboard > Settings > API > Regenerate JWT Secret');
console.log('   - Dashboard > Settings > Database > Cambiar password de postgres');
console.log('');

console.log('2. RAILWAY:');
console.log('   - Dashboard > Variables > Actualizar DATABASE_URL, JWT_SECRET, etc.');
console.log('');

console.log('3. VERCEL:');
console.log('   - Dashboard > Settings > Environment Variables > Actualizar secrets');
console.log('');

console.log('4. MERCADO PAGO:');
console.log('   - Panel > Credenciales > Generar nuevos tokens si es necesario');
console.log('');

console.log('5. RESEND:');
console.log('   - Dashboard > API Keys > Generar nueva API key');
console.log('');

console.log('6. WHATSAPP:');
console.log('   - Meta Developers > Apps > Generar nuevo access token');
console.log('');

console.log('='.repeat(60));
console.log('✅ Secrets generados exitosamente');
console.log('='.repeat(60));