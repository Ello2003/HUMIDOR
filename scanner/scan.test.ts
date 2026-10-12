import { describe, expect, it } from 'vitest';
import { assembleResults, buildWatchlist, itemKey, runScan, scanRetailer, type ScanDeps } from './scan';
import type { RetailerConfig } from './retailers.config';
import type { ScanResultsFile, WatchlistEntry } from './types';

const FIXED_NOW = new Date('2026-10-11T06:00:00.000Z');

/** Fake network: URL substring -> response. Anything unmatched is a 404. */
function fakeDeps(routes: Array<{ match: RegExp; status?: number; body?: string; throws?: string }>, log: string[] = []): ScanDeps {
  return {
    now: () => FIXED_NOW,
    sleep: async () => {},
    fetchFn: (async (url: string) => {
      log.push(String(url));
      const r = routes.find((x) => x.match.test(String(url)));
      if (r?.throws) throw Object.assign(new Error(r.throws), { cause: { code: 'ENOTFOUND' } });
      return { status: r?.status ?? 404, text: async () => r?.body ?? 'not found' } as Response;
    }) as unknown as typeof fetch,
  };
}

const cfg = (over: Partial<RetailerConfig> = {}): RetailerConfig => ({
  id: 'shop',
  name: 'Shop One',
  baseUrl: 'https://one.example.co.uk',
  enabled: true,
  strategy: 'auto',
  searchPath: '/search?q={q}',
  ...over,
});

const padron: WatchlistEntry = { brand: 'Padrón', line: '1964 Anniversary Series', vitola: 'Exclusivo (Box-Pressed Robusto)' };
const shark: WatchlistEntry = { brand: 'Arturo Fuente', line: 'Anejo No. 77 The Shark' };

const shopifyBody = JSON.stringify({
  resources: {
    results: {
      products: [
        { title: 'Padron 1964 Anniversary Exclusivo', url: '/products/p', price: '16.50', available: true },
        { title: 'Padron 1964 Anniversary Exclusivo Box of 25', url: '/products/pb', price: '395.00', available: true },
      ],
    },
  },
});

describe('scanRetailer', () => {
  it('Shopify path: keeps the matching single, drops the box, reports counts', async () => {
    const out = await scanRetailer(cfg(), [padron, shark], fakeDeps([{ match: /suggest\.json/, status: 200, body: shopifyBody }]));
    expect(out.report).toMatchObject({ status: 'ok', strategyUsed: 'shopify', queries: 2, queriesOk: 2, quotesKept: 1, skippedMultiPack: 1 });
    const q = out.quotes.get(itemKey(padron))!;
    expect(q).toMatchObject({ vendor: 'Shop One', price: 16.5, currency: 'GBP', inStock: true, scannedAt: FIXED_NOW.toISOString() });
    expect(out.quotes.has(itemKey(shark))).toBe(false);
  });

  it('auto falls back to HTML when the store is not Shopify, and remembers the strategy', async () => {
    const html = `<script type="application/ld+json">{"@type":"Product","name":"Padron 1964 Anniversary Exclusivo","offers":{"price":"15.20","priceCurrency":"GBP"}}</script>`;
    const log: string[] = [];
    const out = await scanRetailer(cfg(), [padron, shark], fakeDeps([{ match: /\/search\?q=/, status: 200, body: html }], log));
    expect(out.report.strategyUsed).toBe('html');
    expect(out.report.quotesKept).toBe(1);
    // Shopify probe only on the first query; the second goes straight to HTML.
    expect(log.filter((u) => u.includes('suggest.json'))).toHaveLength(1);
  });

  it('reports "no_matches" (not "ok") when the site responds but nothing matched', async () => {
    const empty = JSON.stringify({ resources: { results: { products: [] } } });
    const out = await scanRetailer(cfg(), [padron], fakeDeps([{ match: /suggest\.json/, status: 200, body: empty }]));
    expect(out.report.status).toBe('no_matches');
  });

  it('skips non-GBP prices instead of mislabelling them', async () => {
    const eur = `<script type="application/ld+json">{"@type":"Product","name":"Padron 1964 Anniversary Exclusivo","offers":{"price":"18.00","priceCurrency":"EUR"}}</script>`;
    const out = await scanRetailer(cfg({ strategy: 'html' }), [padron], fakeDeps([{ match: /search/, status: 200, body: eur }]));
    expect(out.report).toMatchObject({ quotesKept: 0, skippedCurrency: 1 });
  });

  it('a bot wall marks the retailer failed and stops after the first request', async () => {
    const log: string[] = [];
    const out = await scanRetailer(cfg(), [padron, shark, padron], fakeDeps([{ match: /./, status: 403, body: '<title>Just a moment...</title>' }], log));
    expect(out.report.status).toBe('failed');
    expect(out.report.errors[0]).toMatchObject({ kind: 'blocked', httpStatus: 403 });
    expect(log).toHaveLength(1);
    expect(out.report.queriesFailed).toBe(3);
  });

  it('DNS/network failure is recorded with its cause, after one retry', async () => {
    const log: string[] = [];
    const out = await scanRetailer(cfg(), [padron], fakeDeps([{ match: /./, throws: 'fetch failed' }], log));
    expect(out.report.status).toBe('failed');
    expect(out.report.errors[0]).toMatchObject({ kind: 'network' });
    expect(out.report.errors[0].message).toContain('ENOTFOUND');
    expect(log).toHaveLength(2);
  });

  it('a page with no product markup at all is a parse failure, not a silent "no results"', async () => {
    const out = await scanRetailer(cfg({ strategy: 'html' }), [padron], fakeDeps([{ match: /./, status: 200, body: '<html><body>Welcome</body></html>' }]));
    expect(out.report.status).toBe('failed');
    expect(out.report.errors[0].kind).toBe('parse');
  });

  it('disabled retailers make no requests and say why', async () => {
    const log: string[] = [];
    const out = await scanRetailer(cfg({ enabled: false, disabledReason: 'USD only' }), [padron], fakeDeps([], log));
    expect(out.report).toMatchObject({ status: 'disabled', note: 'USD only' });
    expect(log).toHaveLength(0);
  });
});

describe('assembleResults / runScan', () => {
  it('carries over the last good price when a retailer fails, keeping its old timestamp', async () => {
    const previous: ScanResultsFile = {
      schemaVersion: 1,
      scannedAt: '2026-10-10T06:00:00.000Z',
      durationMs: 1,
      retailers: [],
      items: [
        {
          brand: padron.brand,
          line: padron.line,
          vitola: padron.vitola,
          quotes: [{ vendor: 'Shop One', price: 15.9, currency: 'GBP', packageType: 'Single', inStock: true, title: 'Padron', scannedAt: '2026-10-10T06:00:00.000Z' }],
        },
      ],
    };
    const res = await runScan([padron], previous, fakeDeps([{ match: /./, status: 500, body: 'oops' }]), [cfg()]);
    expect(res.retailers[0]).toMatchObject({ status: 'failed', carriedOver: 1 });
    expect(res.items[0].quotes[0]).toMatchObject({ price: 15.9, scannedAt: '2026-10-10T06:00:00.000Z' });
  });

  it('does NOT carry over when the retailer answered fine but no longer lists the cigar', async () => {
    const previous: ScanResultsFile = {
      schemaVersion: 1, scannedAt: 'x', durationMs: 1, retailers: [],
      items: [{ brand: padron.brand, line: padron.line, vitola: padron.vitola, quotes: [{ vendor: 'Shop One', price: 15.9, currency: 'GBP', packageType: 'Single', inStock: true, title: 'P', scannedAt: 'old' }] }],
    };
    const empty = JSON.stringify({ resources: { results: { products: [] } } });
    const res = await runScan([padron], previous, fakeDeps([{ match: /suggest/, status: 200, body: empty }]), [cfg()]);
    expect(res.items[0].quotes).toHaveLength(0);
  });

  it('sorts quotes cheapest first across retailers and stamps the run time', async () => {
    const two = (price: string) => JSON.stringify({ resources: { results: { products: [{ title: 'Padron 1964 Anniversary Exclusivo', url: '/p', price, available: true }] } } });
    const deps: ScanDeps = {
      ...fakeDeps([]),
      fetchFn: (async (url: string) => ({ status: 200, text: async () => (String(url).includes('one.') ? two('16.50') : two('14.20')) })) as unknown as typeof fetch,
    };
    const res = await runScan([padron], null, deps, [cfg(), cfg({ id: 'two', name: 'Shop Two', baseUrl: 'https://two.example.co.uk' })]);
    expect(res.items[0].quotes.map((q) => [q.vendor, q.price])).toEqual([['Shop Two', 14.2], ['Shop One', 16.5]]);
    expect(res.scannedAt).toBe(FIXED_NOW.toISOString());
  });
});

describe('buildWatchlist', () => {
  it('includes the built-in wishlist and research database, deduplicated', () => {
    const list = buildWatchlist();
    const keys = list.map(itemKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(list.some((e) => e.brand === 'Arturo Fuente')).toBe(true);
    expect(list.some((e) => e.brand === 'Padrón')).toBe(true);
  });
  it('adds user extras and ignores entries missing brand or line', () => {
    const list = buildWatchlist([{ brand: 'Cohiba', line: 'Siglo VI' }, { brand: '', line: 'x' } as WatchlistEntry]);
    expect(list.some((e) => e.brand === 'Cohiba')).toBe(true);
    expect(list.some((e) => e.line === 'x')).toBe(false);
  });
});

void assembleResults;
