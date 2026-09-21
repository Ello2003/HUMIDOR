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

  it('accepts a genuinely found retailer that is NOT in the known catalog at all', () => {
    // Regression test: a real UK cigar shop the search found that simply
    // isn't one of the ~15 pre-defined retailers (e.g. a New World
    // specialist) used to be silently discarded here even when the model
    // found a completely legitimate, correctly-matched source for it --
    // the validator required the source's host to ALSO be one of the
    // known catalog domains, which no genuinely new retailer could ever
    // satisfy. The catalog should enrich known retailers with confidence,
    // never gatekeep which real ones are allowed to exist.
    const quotes = validateGroundedQuotes(
      [{ vendor: 'Simply Cigars', price: 12.99, inStock: true }],
      [{ title: 'Oliva Serie V - Simply Cigars', uri: 'https://www.simplycigars.co.uk/oliva-serie-v-p-123.html' }],
      domains, // note: "Simply Cigars" is deliberately NOT a key in this domains map
      '2026-09-20'
    );

    expect(quotes).toHaveLength(1);
    expect(quotes[0].vendor).toBe('Simply Cigars');
    expect(quotes[0].url).toContain('simplycigars.co.uk');
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
