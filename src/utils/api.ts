const configuredApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

// HUMIDOR is hosted for free on GitHub Pages. There is intentionally no
// production API host: when no public API origin is configured, browser API
// features target the local Express server on the collector's Mac instead.
// The static GitHub Pages site remains fully usable without that server.
const API_BASE_URL = configuredApiBaseUrl || (import.meta.env.PROD ? 'http://localhost:3000' : '');

export function apiUrl(path: string): string {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
