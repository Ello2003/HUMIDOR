import { describe, expect, it } from 'vitest';
import {
  detectPackageType,
  looksBlocked,
  parseHtmlSearch,
  parseJsonLdProducts,
  parsePrice,
  parseProductCards,
  parseShopifySuggest,
  pickBest,
  titleMatches,
} from './parsers';

const BASE = 'https://shop.example.co.uk';

describe('parsePrice', () => {
  it('handles currency symbols, thousands separators and plain numbers', () => {
    expect(parsePrice('£12.50')).toBe(12.5);
    expect(parsePrice('£1,250.00')).toBe(1250);
    expect(parsePrice('12.5')).toBe(12.5);
    expect(parsePrice(14.8)).toBe(14.8);
  });
  it('handles a European decimal comma', () => {
    expect(parsePrice('12,50')).toBe(12.5);
  });
  it('rejects garbage, zero and negatives', () => {
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('Price on request')).toBeNull();
    expect(parsePrice('0.00')).toBeNull();
    expect(parsePrice(undefined)).toBeNull();
  });
});

describe('detectPackageType', () => {
  it.each([
    ['Padron 1964 Anniversary Exclusivo', 'Single'],
    ['Padron 1964 Exclusivo Box of 25', 'Multi'],
    ['Padron 1964 Exclusivo - Pack of 5', 'Multi'],
    ['Padron 1964 Exclusivo 5 Pack', 'Multi'],
    ['Cohiba Siglo VI Sampler', 'Multi'],
    ['Cohiba Siglo VI Tin of 3', 'Multi'],
  ])('%s -> %s', (title, expected) => {
    expect(detectPackageType(title)).toBe(expected);
  });
});

describe('titleMatches', () => {
  const padron = { brand: 'Padrón', line: '1964 Anniversary Series', vitola: 'Exclusivo (Box-Pressed Robusto)' };

  it('matches despite accents and extra words', () => {
    expect(titleMatches('Padron 1964 Anniversary Series Exclusivo Maduro', padron)).toBe(true);
  });
  it('rejects the wrong brand', () => {
    expect(titleMatches('Davidoff 1964 Anniversary Exclusivo', padron)).toBe(false);
  });
  it('rejects the right line but the wrong vitola (wrong size = wrong price)', () => {
    expect(titleMatches('Padron 1964 Anniversary Series Monarca', padron)).toBe(false);
  });
  it('rejects a different line from the same brand', () => {
    expect(titleMatches('Padron Serie 1926 No. 9 Exclusivo', padron)).toBe(false);
  });
  it('matches when no vitola is specified', () => {
    expect(titleMatches('Padron 1964 Anniversary Monarca', { brand: 'Padrón', line: '1964 Anniversary Series' })).toBe(true);
  });
  it('does not treat a brand-only mention as a match for a specific line', () => {
    expect(titleMatches('Casdagli Club Series Robusto', { brand: 'Casdagli', line: 'Daughters of the Wind Calico', vitola: 'Corona Gorda' })).toBe(false);
  });
});

describe('parseShopifySuggest', () => {
  const fixture = {
    resources: {
      results: {
        products: [
          { title: 'Padron 1964 Anniversary Exclusivo', url: '/products/padron-1964-exclusivo?_pos=1', price: '16.50', available: true },
          { title: 'Padron 1964 Exclusivo Box of 25', url: '/products/padron-1964-exclusivo-box', price: '395.00', available: false },
          { title: 'Broken product with no price', url: '/products/x', price: '' },
        ],
      },
    },
  };

  it('extracts products, resolves relative URLs and availability', () => {
    const out = parseShopifySuggest(fixture, BASE)!;
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ price: 16.5, inStock: true, url: `${BASE}/products/padron-1964-exclusivo?_pos=1` });
    expect(out[1].inStock).toBe(false);
  });
  it('returns null (not []) when the response is not a Shopify suggest payload', () => {
    expect(parseShopifySuggest({ hello: 'world' }, BASE)).toBeNull();
    expect(parseShopifySuggest(null, BASE)).toBeNull();
  });
  it('returns [] for a valid payload with no products', () => {
    expect(parseShopifySuggest({ resources: { results: { products: [] } } }, BASE)).toEqual([]);
  });
});

describe('parseJsonLdProducts', () => {
  const single = `<html><head><script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Product","name":"Padron 1964 Exclusivo","url":"/p/padron",
     "offers":{"@type":"Offer","price":"15.20","priceCurrency":"GBP","availability":"https://schema.org/InStock"}}
  </script></head></html>`;

  const graphAndList = `<script type="application/ld+json">{"@graph":[
      {"@type":"BreadcrumbList"},
      {"@type":"ItemList","itemListElement":[
        {"@type":"ListItem","item":{"@type":"Product","name":"A Cigar","offers":[{"price":"9.00","priceCurrency":"GBP","availability":"OutOfStock"}]}},
        {"@type":"ListItem","item":{"@type":"Product","name":"B Cigar","offers":{"@type":"AggregateOffer","lowPrice":"7.50","priceCurrency":"EUR"}}}
      ]}]}</script>`;

  it('reads a single Product', () => {
    expect(parseJsonLdProducts(single, BASE)).toEqual([
      { title: 'Padron 1964 Exclusivo', price: 15.2, currency: 'GBP', inStock: true, url: `${BASE}/p/padron` },
    ]);
  });
  it('walks @graph / ItemList nesting, offer arrays and AggregateOffer, and reads stock + currency', () => {
    const out = parseJsonLdProducts(graphAndList, BASE);
    expect(out.map((p) => [p.title, p.price, p.currency, p.inStock])).toEqual([
      ['A Cigar', 9, 'GBP', false],
      ['B Cigar', 7.5, 'EUR', true],
    ]);
  });
  it('survives malformed JSON-LD blocks next to good ones', () => {
    const html = `<script type="application/ld+json">{ not json</script>${single}`;
    expect(parseJsonLdProducts(html, BASE)).toHaveLength(1);
  });
});

describe('parseProductCards (WooCommerce / Magento fallback)', () => {
  const woo = `<ul class="products">
    <li class="product"><a class="woocommerce-LoopProduct-link" href="/product/padron-1964/">
      <h2 class="woocommerce-loop-product__title">Padron 1964 Exclusivo</h2>
      <span class="price"><del><span class="amount">£18.00</span></del><ins><span class="amount">£16.00</span></ins></span></a></li>
    <li class="product outofstock"><a class="woocommerce-LoopProduct-link" href="/product/other/">
      <h2 class="woocommerce-loop-product__title">Other Cigar</h2><span class="price"><span class="amount">£5.00</span></span>
      <span>Out of stock</span></a></li>
  </ul>`;

  it('reads WooCommerce cards, preferring the sale price and flagging out-of-stock', () => {
    const out = parseProductCards(woo, BASE);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ title: 'Padron 1964 Exclusivo', price: 16, currency: 'GBP', inStock: true, url: `${BASE}/product/padron-1964/` });
    expect(out[1].inStock).toBe(false);
  });
  it('returns [] when the page has no recognisable product cards', () => {
    expect(parseProductCards('<html><body><p>No results</p></body></html>', BASE)).toEqual([]);
  });
  it('parseHtmlSearch prefers JSON-LD and falls back to cards', () => {
    expect(parseHtmlSearch(woo, BASE)).toHaveLength(2);
    const both = `<script type="application/ld+json">{"@type":"Product","name":"LD","offers":{"price":"1.00"}}</script>${woo}`;
    expect(parseHtmlSearch(both, BASE).map((p) => p.title)).toEqual(['LD']);
  });
});

describe('looksBlocked', () => {
  it('recognises a Cloudflare challenge', () => {
    expect(looksBlocked(403, '<title>Just a moment...</title>')).toBe(true);
    expect(looksBlocked(503, 'cf-chl-bypass')).toBe(true);
  });
  it('treats 403 and 429 as blocked even without a recognisable body', () => {
    expect(looksBlocked(403, '')).toBe(true);
    expect(looksBlocked(429, '')).toBe(true);
  });
  it('does not call an ordinary 404 or 500 a block', () => {
    expect(looksBlocked(404, 'Not found')).toBe(false);
    expect(looksBlocked(500, 'oops')).toBe(false);
  });
});

describe('pickBest', () => {
  const mk = (price: number, inStock: boolean) => ({ title: 't', price, inStock });
  it('prefers the cheapest in-stock price', () => {
    expect(pickBest([mk(10, false), mk(14, true), mk(12, true)])?.price).toBe(12);
  });
  it('falls back to cheapest overall when nothing is in stock', () => {
    expect(pickBest([mk(10, false), mk(9, false)])?.price).toBe(9);
  });
  it('returns undefined for no products', () => {
    expect(pickBest([])).toBeUndefined();
  });
});
