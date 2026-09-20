import { describe, expect, it } from 'vitest';
import { bestComparableQuote, comparableQuotes, normalizeCurrency, packageQuantity, unitPrice } from './priceUtils';

describe('price normalization', () => {
  it('normalizes common currency names', () => {
    expect(normalizeCurrency('GBP')).toBe('£');
    expect(normalizeCurrency('USD')).toBe('$');
    expect(normalizeCurrency('EUR')).toBe('€');
  });

  it('extracts package quantities and computes per-stick prices', () => {
    expect(packageQuantity('Box of 10')).toBe(10);
    expect(packageQuantity('Pack of 5')).toBe(5);
    expect(unitPrice({ price: 50, packageType: 'Box of 10' })).toBe(5);
  });

  it('does not compare different currencies or package sizes as one lowest price', () => {
    const quotes = [
      { vendor: 'UK Shop', price: 25, currency: '£', packageType: 'Single' },
      { vendor: 'US Shop', price: 5, currency: '$', packageType: 'Single' },
      { vendor: 'Box Shop', price: 100, currency: '£', packageType: 'Box of 10' },
    ];
    const comparable = comparableQuotes(quotes, '£');
    expect(comparable.every((quote) => quote.currency === '£')).toBe(true);
    expect(bestComparableQuote(comparable, '£')?.vendor).toBe('UK Shop');
  });
});
