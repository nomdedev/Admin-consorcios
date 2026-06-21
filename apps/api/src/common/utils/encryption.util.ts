import crypto from 'node:crypto';

const ENCRYPTION_PREFIX = 'enc:v1:';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const rawKey = process.env.DB_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error('DB_ENCRYPTION_KEY no está configurado');
  }

  let key: Buffer;

  try {
    key = Buffer.from(rawKey, 'base64');
  } catch {
    key = Buffer.from(rawKey, 'utf8');
  }

  if (key.length !== KEY_LENGTH) {
    throw new Error('DB_ENCRYPTION_KEY debe tener 32 bytes en base64');
  }

  return key;
}

export function encryptField(value: string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  if (value.startsWith(ENCRYPTION_PREFIX)) {
    return value;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptField(value: string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  if (!value.startsWith(ENCRYPTION_PREFIX)) {
    return value;
  }

  const key = getEncryptionKey();
  const payload = value.slice(ENCRYPTION_PREFIX.length);
  const [ivB64, tagB64, encryptedB64] = payload.split(':');

  if (!ivB64 || !tagB64 || !encryptedB64) {
    throw new Error('Formato de cifrado inválido');
  }

  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Formato de cifrado inválido');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
