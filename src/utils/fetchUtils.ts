/**
 * fetch() has no built-in timeout -- if the server hangs (or a proxy in
 * between drops the connection without an error), an `await fetch(...)`
 * can sit forever with no way for the UI to recover, leaving a loading
 * spinner stuck indefinitely. This wraps fetch with an AbortController so
 * a stuck request fails with a clear, catchable error instead.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s -- please try again.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
