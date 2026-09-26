import { GitHubSyncConfig } from './types';

const DEFAULT_API_BASE = 'https://api.github.com';

export function assertRepository(repository: string): void {
  if (!/^[^/]+\/[^/]+$/.test(repository.trim())) {
    throw new Error('Repository must be in owner/name format.');
  }
}

async function resolveToken(config: GitHubSyncConfig): Promise<string> {
  const token = typeof config.token === 'function' ? await config.token() : config.token;
  if (!token?.trim()) throw new Error('Enter a GitHub token with repository Contents access.');
  return token.trim();
}

export async function githubRequest<T>(
  config: GitHubSyncConfig,
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await resolveToken(config);
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
  let parsed: unknown = null;
  try { parsed = body ? JSON.parse(body) : null; } catch {}

  if (!response.ok) {
    const message = (parsed as { message?: string } | null)?.message || `GitHub request failed (${response.status}).`;
    throw new Error(message);
  }

  return parsed as T;
}

export async function getSyncFile(
  config: GitHubSyncConfig
): Promise<{ content: string; sha?: string; htmlUrl?: string }> {
  assertRepository(config.repository);
  const branch = config.branch?.trim() || 'main';
  const [owner, repo] = config.repository.trim().split('/');
  const apiBase = config.apiBaseUrl?.replace(/\/$/, '') || DEFAULT_API_BASE;
  const url = `${apiBase}/repos/${owner}/${repo}/contents/${config.path}?ref=${encodeURIComponent(branch)}`;
  const result = await githubRequest<{ content?: string; sha?: string; html_url?: string }>(
    config,
    url
  );
  return { content: result.content || '', sha: result.sha, htmlUrl: result.html_url };
}

export async function putSyncFile(
  config: GitHubSyncConfig,
  content: string,
  existingSha?: string,
  message = 'chore: sync data'
): Promise<{ commitUrl?: string; fileUrl?: string }> {
  assertRepository(config.repository);
  const branch = config.branch?.trim() || 'main';
  const [owner, repo] = config.repository.trim().split('/');
  const apiBase = config.apiBaseUrl?.replace(/\/$/, '') || DEFAULT_API_BASE;
  const url = `${apiBase}/repos/${owner}/${repo}/contents/${config.path}`;

  const result = await githubRequest<{ commit?: { html_url?: string }; content?: { html_url?: string } }>(
    config,
    url,
    {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content,
        branch,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    }
  );

  return {
    commitUrl: result.commit?.html_url,
    fileUrl: result.content?.html_url,
  };
}
