import { describe, it, expect } from 'vitest';
import { formatDate, formatDateLong, formatDateShort } from './dateUtils';

describe('formatDate', () => {
  it('formats a valid ISO date string', () => {
    expect(formatDate('2026-03-15')).toMatch(/15/);
  });

  it('returns "Unknown Date" for undefined/null/empty input', () => {
    expect(formatDate(undefined)).toBe('Unknown Date');
    expect(formatDate(null)).toBe('Unknown Date');
    expect(formatDate('')).toBe('Unknown Date');
  });

  it('returns "Unknown Date" for an unparseable string', () => {
    expect(formatDate('not-a-date')).toBe('Unknown Date');
  });

  it('respects custom Intl.DateTimeFormatOptions', () => {
    const result = formatDate('2026-01-01', { year: 'numeric' });
    expect(result).toBe('2026');
  });
});

describe('formatDateLong', () => {
  it('includes the full month name', () => {
    const result = formatDateLong('2026-06-15');
    expect(result).toMatch(/June/);
  });
});

describe('formatDateShort', () => {
  it('omits the year', () => {
    const result = formatDateShort('2026-06-15');
    expect(result).not.toMatch(/2026/);
    expect(result).toMatch(/Jun/);
  });
});
