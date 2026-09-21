import { Cigar, Humidor, SmokeLog, WishlistItem, CigarResearchItem, WishlistBasketItem } from '../types';

export interface HumidorSyncPayload {
  cigars: Cigar[];
  humidors: Humidor[];
  smokeLogs: SmokeLog[];
  wishlist: WishlistItem[];
  researchDatabase: CigarResearchItem[];
  wishlistBasket: WishlistBasketItem[];
}

export interface GitHubSyncConfig {
  token: string;
  repository: string;
  path?: string;
  branch?: string;
}

const API_BASE = 'https://api.github.com';
const DEFAULT_PATH = '.humidor/vault-sync.json';

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

function base64EncodeText(value: string): string {
  return bytesToBase64(new TextEncoder().encode(value));
}

function base64DecodeText(value: string): string {
  return new TextDecoder().decode(base64ToBytes(value));
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSyncPayload(payload: HumidorSyncPayload, password: string) {
  if (!password || password.length < 8) {
    throw new Error('Use a sync password of at least 8 characters.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify({
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    ...payload,
  }));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  return {
    format: 'the-humidor-encrypted-sync',
    version: 1,
    encryptedAt: new Date().toISOString(),
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: 210000,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptSyncPayload(document: any, password: string): Promise<HumidorSyncPayload> {
  if (!document || document.format !== 'the-humidor-encrypted-sync' || document.version !== 1) {
    throw new Error('This GitHub sync file is not a supported Humidor backup.');
  }
  if (!password) throw new Error('Enter your sync password.');

  try {
    const salt = base64ToBytes(document.salt);
    const iv = base64ToBytes(document.iv);
    const ciphertext = base64ToBytes(document.ciphertext);
    const key = await deriveKey(password, salt);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    const parsed = JSON.parse(new TextDecoder().decode(plaintext));

    return {
      cigars: Array.isArray(parsed.cigars) ? parsed.cigars : [],
      humidors: Array.isArray(parsed.humidors) ? parsed.humidors : [],
      smokeLogs: Array.isArray(parsed.smokeLogs) ? parsed.smokeLogs : [],
      wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
      researchDatabase: Array.isArray(parsed.researchDatabase) ? parsed.researchDatabase : [],
      wishlistBasket: Array.isArray(parsed.wishlistBasket) ? parsed.wishlistBasket : [],
    };
  } catch {
    throw new Error('Unable to decrypt this backup. Check the sync password and try again.');
  }
}

function assertRepository(repository: string) {
  if (!/^[^/]+\/[^/]+$/.test(repository.trim())) {
    throw new Error('Repository must be in owner/name format.');
  }
}

async function githubRequest(config: GitHubSyncConfig, url: string, init: RequestInit = {}) {
  const token = config.token.trim();
  if (!token) throw new Error('Enter a GitHub token with repository Contents access.');

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2026-03-10',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const body = await response.text();
  let parsed: any = null;
  try { parsed = body ? JSON.parse(body) : null; } catch {}

  if (!response.ok) {
    const message = parsed?.message || `GitHub request failed (${response.status}).`;
    throw new Error(message);
  }

  return parsed;
}

export async function pushHumidorSync(
  config: GitHubSyncConfig,
  payload: HumidorSyncPayload,
  password: string
) {
  assertRepository(config.repository);
  const path = config.path?.trim() || DEFAULT_PATH;
  const branch = config.branch?.trim() || 'main';
  const encrypted = await encryptSyncPayload(payload, password);
  const content = base64EncodeText(JSON.stringify(encrypted, null, 2));

  const [owner, repo] = config.repository.trim().split('/');
  const contentsUrl = `${API_BASE}/repos/${owner}/${repo}/contents/${path}`;
  let existing: any = null;

  try {
    existing = await githubRequest({ ...config, branch }, contentsUrl);
  } catch (error: any) {
    if (!String(error?.message || '').toLowerCase().includes('not found')) throw error;
  }

  const result = await githubRequest({ ...config, branch }, contentsUrl, {
    method: 'PUT',
    body: JSON.stringify({
      message: 'chore: sync Humidor vault',
      content,
      branch,
      ...(existing?.sha ? { sha: existing.sha } : {}),
    }),
  });

  return {
    commitUrl: result?.commit?.html_url,
    fileUrl: result?.content?.html_url,
    path,
    branch,
    syncedAt: new Date().toISOString(),
  };
}

export async function pullHumidorSync(
  config: GitHubSyncConfig,
  password: string
): Promise<{ payload: HumidorSyncPayload; syncedAt?: string; fileUrl?: string }> {
  assertRepository(config.repository);
  const path = config.path?.trim() || DEFAULT_PATH;
  const branch = config.branch?.trim() || 'main';
  const [owner, repo] = config.repository.trim().split('/');
  const contentsUrl = `${API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const result = await githubRequest({ ...config, branch }, contentsUrl);
  const document = JSON.parse(base64DecodeText(result.content || ''));
  const payload = await decryptSyncPayload(document, password);

  return {
    payload,
    syncedAt: document.encryptedAt,
    fileUrl: result.html_url,
  };
}

export { DEFAULT_PATH };
