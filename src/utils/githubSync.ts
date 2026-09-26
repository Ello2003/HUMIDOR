import { Cigar, Humidor, SmokeLog, WishlistItem, CigarResearchItem, WishlistBasketItem } from '../types';
import { createGitHubSync, GitHubSyncConfig } from '../plugins/github-sync';
import { decryptJson, encryptJson } from '../plugins/github-sync/crypto';

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
  return encryptJson(payload, password, FORMAT, 1, true);
}

export async function decryptSyncPayload(document: any, password: string): Promise<HumidorSyncPayload> {
  const payload = await decryptJson<HumidorSyncPayload>(document, password, FORMAT, true);
  if (!isHumidorSyncPayload(payload)) {
    throw new Error('This GitHub sync payload is not valid Humidor data.');
  }
  return payload;
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
