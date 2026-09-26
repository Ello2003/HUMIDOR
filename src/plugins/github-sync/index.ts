import { assertRepository, getSyncFile, putSyncFile } from './client';
import { decodeJsonDocument, decryptJson, encodeJsonDocument, encryptJson } from './crypto';
import { GitHubPullResult, GitHubSyncConfig, GitHubSyncResult } from './types';

export interface EncryptedGitHubSyncOptions<T> {
  config: GitHubSyncConfig;
  password: string;
  format?: string;
  version?: number;
  commitMessage?: string;
  validate?: (payload: unknown) => payload is T;
}

export function createGitHubSync<T = unknown>(options: EncryptedGitHubSyncOptions<T>) {
  const format = options.format || 'github-sync-encrypted';
  const version = options.version || 1;
  const commitMessage = options.commitMessage || 'chore: sync data';

  const getConfig = () => ({
    ...options.config,
    path: options.config.path.trim(),
    branch: options.config.branch?.trim() || 'main',
  });

  return {
    async push(payload: T): Promise<GitHubSyncResult> {
      const config = getConfig();
      assertRepository(config.repository);
      const encrypted = await encryptJson(payload, options.password, format, version);
      const content = encodeJsonDocument(encrypted);

      let existingSha: string | undefined;
      try {
        existingSha = (await getSyncFile(config)).sha;
      } catch (error: unknown) {
        if (!String((error as Error)?.message || '').toLowerCase().includes('not found')) throw error;
      }

      const result = await putSyncFile(config, content, existingSha, commitMessage);
      return {
        ...result,
        path: config.path,
        branch: config.branch!,
        syncedAt: new Date().toISOString(),
      };
    },

    async pull(): Promise<GitHubPullResult<T>> {
      const config = getConfig();
      assertRepository(config.repository);
      const file = await getSyncFile(config);
      const document = decodeJsonDocument(file.content);
      const payload = await decryptJson<T>(document, options.password, format);

      if (options.validate && !options.validate(payload)) {
        throw new Error('The GitHub sync payload failed validation.');
      }

      return {
        payload,
        syncedAt: document.encryptedAt,
        fileUrl: file.htmlUrl,
      };
    },

    async status(): Promise<{ path: string; branch: string; repository: string }> {
      const config = getConfig();
      assertRepository(config.repository);
      return {
        repository: config.repository,
        path: config.path,
        branch: config.branch!,
      };
    },
  };
}
