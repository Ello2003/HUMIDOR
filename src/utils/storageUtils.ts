export const STORAGE_SCHEMA_VERSION = 1;

type StorageEnvelope<T> = {
  schema: number;
  savedAt: string;
  data: T;
};

export function readStoredArray<T>(
  key: string,
  fallback: T[],
  isValid: (value: T) => boolean = () => true
): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw) as StorageEnvelope<T[]> | T[];
    const data = Array.isArray(parsed) ? parsed : parsed?.schema === STORAGE_SCHEMA_VERSION ? parsed.data : null;
    return Array.isArray(data) && data.every(isValid) ? data : fallback;
  } catch (error) {
    console.warn(`[The Humidor] Failed to read ${key}:`, error);
    return fallback;
  }
}

export function readStoredValue<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw) as StorageEnvelope<T> | T;
    if (parsed && typeof parsed === 'object' && 'schema' in parsed) {
      const envelope = parsed as StorageEnvelope<T>;
      return envelope.schema === STORAGE_SCHEMA_VERSION ? envelope.data : fallback;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function writeStoredValue<T>(key: string, data: T): boolean {
  try {
    const existing = localStorage.getItem(key);
    if (existing !== null && localStorage.getItem(`${key}__backup`) === null) {
      localStorage.setItem(`${key}__backup`, existing);
    }
    const envelope: StorageEnvelope<T> = {
      schema: STORAGE_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      data,
    };
    localStorage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch (error) {
    console.warn(`[The Humidor] Storage quota or access limitation for ${key}:`, error);
    return false;
  }
}

export function readStoredBackup<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${key}__backup`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StorageEnvelope<T> | T;
    return parsed && typeof parsed === 'object' && 'schema' in parsed
      ? (parsed as StorageEnvelope<T>).data
      : (parsed as T);
  } catch {
    return null;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
