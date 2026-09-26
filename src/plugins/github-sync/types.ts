export interface GitHubSyncConfig {
  token: string | (() => string | Promise<string>);
  repository: string;
  path: string;
  branch?: string;
  apiBaseUrl?: string;
}

export interface EncryptedSyncDocument {
  format: string;
  version: number;
  encryptedAt: string;
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

export interface GitHubSyncResult {
  commitUrl?: string;
  fileUrl?: string;
  path: string;
  branch: string;
  syncedAt: string;
}

export interface GitHubPullResult<T> {
  payload: T;
  syncedAt?: string;
  fileUrl?: string;
}
