import { describe, expect, it } from 'vitest';
import { DEFAULT_QUICK_QUOTE_RETAILERS } from './retailers';

describe('DEFAULT_QUICK_QUOTE_RETAILERS', () => {
  it('has no duplicate entries', () => {
    const lower = DEFAULT_QUICK_QUOTE_RETAILERS.map((r) => r.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });

  it('is non-empty', () => {
    expect(DEFAULT_QUICK_QUOTE_RETAILERS.length).toBeGreaterThan(0);
  });
});
