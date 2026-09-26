import { EncryptedSyncDocument } from './types';

const DEFAULT_ITERATIONS = 210000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value.replace(/\n/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array, iterations = DEFAULT_ITERATIONS): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptJson<T>(
  payload: T,
  password: string,
  format = 'github-sync-encrypted',
  version = 1
): Promise<EncryptedSyncDocument> {
  if (!password || password.length < 8) {
    throw new Error('Use a sync password of at least 8 characters.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify({
    schemaVersion: version,
    exportedAt: new Date().toISOString(),
    payload,
  }));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  return {
    format,
    version,
    encryptedAt: new Date().toISOString(),
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: DEFAULT_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptJson<T>(
  document: EncryptedSyncDocument,
  password: string,
  expectedFormat = 'github-sync-encrypted'
): Promise<T> {
  if (!document || document.format !== expectedFormat || document.version !== 1) {
    throw new Error('This GitHub sync file is not a supported encrypted sync document.');
  }
  if (!password) throw new Error('Enter your sync password.');

  try {
    const salt = base64ToBytes(document.salt);
    const iv = base64ToBytes(document.iv);
    const ciphertext = base64ToBytes(document.ciphertext);
    const key = await deriveKey(password, salt, document.iterations || DEFAULT_ITERATIONS);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    const parsed = JSON.parse(new TextDecoder().decode(plaintext));
    return parsed.payload as T;
  } catch {
    throw new Error('Unable to decrypt this backup. Check the sync password and try again.');
  }
}

export function encodeJsonDocument(document: EncryptedSyncDocument): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(document, null, 2))));
}

export function decodeJsonDocument(value: string): EncryptedSyncDocument {
  const binary = atob(value.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as EncryptedSyncDocument;
}
