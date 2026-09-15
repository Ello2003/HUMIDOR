import { describe, it, expect } from 'vitest';
import { generateId } from './idUtils';

describe('generateId', () => {
  it('includes the given prefix', () => {
    expect(generateId('cigar')).toMatch(/^cigar-/);
  });

  it('produces unique IDs across many rapid calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId('test')));
    expect(ids.size).toBe(1000);
  });

  it('produces different IDs even when called synchronously (same Date.now())', () => {
    const a = generateId('x');
    const b = generateId('x');
    expect(a).not.toBe(b);
  });
});
