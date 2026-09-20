import { describe, expect, it } from 'vitest';
import { validateGroundedQuotes } from './groundedQuoteUtils';

const domains = {
  'C.Gars Ltd': 'cgarsltd.co.uk',
  'James J. Fox (London)': 'jjfox.co.uk',
};

const sources = [
  { title: 'C.Gars product page', uri: 'https://www.cgarsltd.co.uk/cigar/product' },
  { title: 'Search result', uri: 'https://www.google.com/search?q=cigar' },
];

describe('grounded quote validation', () => {
  it('keeps only quotes tied to an allowed retailer product domain', () => {
    const quotes = validateGroundedQuotes([
      { vendor: 'C.Gars Ltd', price: 24.5, inStock: true },
      { vendor: 'Unknown Shop', price: 8, inStock: true },
    ], sources, domains, '2026-09-20');

    expect(quotes).toHaveLength(1);
    expect(quotes[0].vendor).toBe('C.Gars Ltd');
    expect(quotes[0].url).toContain('cgarsltd.co.uk');
  });

  it('rejects malformed prices and unsafe source URLs', () => {
    const quotes = validateGroundedQuotes([
      { vendor: 'C.Gars Ltd', price: 0, inStock: true },
      { vendor: 'C.Gars Ltd', price: 20, inStock: true },
    ], [{ title: 'C.Gars', uri: 'http://cgarsltd.co.uk/product' }], domains);

    expect(quotes).toHaveLength(0);
  });

  it('bounds optional box metadata', () => {
    const quotes = validateGroundedQuotes([
      { vendor: 'C.Gars Ltd', price: 24.5, boxPrice: 245, boxCount: 10, inStock: true },
    ], sources, domains);

    expect(quotes[0].boxPrice).toBe(245);
    expect(quotes[0].boxCount).toBe(10);
  });
});
