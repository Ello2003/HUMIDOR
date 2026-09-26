// The production app is a static GitHub Pages build. Live API features are
// intentionally local-only unless the application is being developed against
// a separately managed API host in the future.
const API_BASE_URL = '';

export function apiUrl(path: string): string {
  return path;
}
