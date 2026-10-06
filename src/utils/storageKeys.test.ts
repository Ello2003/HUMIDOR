import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from './storageKeys';

describe('STORAGE_KEYS', () => {
  it('has no two properties pointing at the same underlying storage key', () => {
    // The whole point of this file is to prevent two different parts of the
    // app from silently sharing (or typo-diverging from) the same
    // localStorage slot. A duplicate value here would defeat that.
    const values = Object.values(STORAGE_KEYS);
    expect(new Set(values).size).toBe(values.length);
  });

  it('every key is a non-empty string', () => {
    for (const value of Object.values(STORAGE_KEYS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
