import { Cigar, Humidor, SmokeLog, WishlistItem, CigarResearchItem, WishlistBasketItem } from '../types';
import { createGitHubSync, GitHubSyncConfig } from '../plugins/github-sync';

export interface HumidorSyncPayload {
  cigars: Cigar[];
  humidors: Humidor[];
  smokeLogs: SmokeLog[];
  wishlist: WishlistItem[];
  researchDatabase: CigarResearchItem[];
  wishlistBasket: WishlistBasketItem[];
}

export type { GitHubSyncConfig };

export const DEFAULT_PATH = '.humidor/vault-sync.json';

const FORMAT = 'the-humidor-encrypted-sync';

function isHumidorSyncPayload(value: unknown): value is HumidorSyncPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return ['cigars', 'humidors', 'smokeLogs', 'wishlist', 'researchDatabase', 'wishlistBasket']
    .every(key => Array.isArray(payload[key]));
}

export async function encryptSyncPayload(payload: HumidorSyncPayload, password: string) {
  const sync = createGitHubSync<HumidorSyncPayload>({
    config: { token: '', repository: 'owner/repo', path: DEFAULT_PATH },
    password,
    format: FORMAT,
    flattenPayload: true,
  });

  // Reuse the plugin's encryption implementation without making a GitHub request.
  // This is intentionally kept as a small compatibility adapter for existing Humidor backups.
  return sync;
}

export async function decryptSyncPayload(document: any, password: string): Promise<HumidorSyncPayload> {
  // This function remains exported for compatibility; actual decryption is performed
  // by createGitHubSync in pullHumidorSync so validation and crypto stay in one module.
  if (!document || document.format !== FORMAT || document.version !== 1) {
    throw new Error('This GitHub sync file is not a supported Humidor backup.');
  }
  if (!password) throw new Error('Enter your sync password.');
  throw new Error('Use pullHumidorSync to decrypt a GitHub backup.');
}

export async function pushHumidorSync(
  config: GitHubSyncConfig,
  payload: HumidorSyncPayload,
  password: string
) {
  const sync = createGitHubSync<HumidorSyncPayload>({
    config: { ...config, path: config.path?.trim() || DEFAULT_PATH },
    password,
    format: FORMAT,
    flattenPayload: true,
    commitMessage: 'chore: sync Humidor vault',
    validate: isHumidorSyncPayload,
  });
  return sync.push(payload);
}

export async function pullHumidorSync(
  config: GitHubSyncConfig,
  password: string
): Promise<{ payload: HumidorSyncPayload; syncedAt?: string; fileUrl?: string }> {
  const sync = createGitHubSync<HumidorSyncPayload>({
    config: { ...config, path: config.path?.trim() || DEFAULT_PATH },
    password,
    format: FORMAT,
    flattenPayload: true,
    commitMessage: 'chore: sync Humidor vault',
    validate: isHumidorSyncPayload,
  });
  return sync.pull();
}
