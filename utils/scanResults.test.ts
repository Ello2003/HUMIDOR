import { describe, expect, it, vi } from 'vitest';
import {
  cigarKey,
  describeAge,
  findBatchQuotes,
  findQuotes,
  loadScanResults,
  missingFromScan,
  normaliseKey,
  retailerSummaryLine,
  scanAgeHours,
  scanHealthNote,
} from './scanResults';
import { normalise } from '../../scanner/parsers';
import type { ScanResultsFile } from '../../scanner/types';

const report = (o: Partial<ScanResultsFile['retailers'][number]>) => ({
  id: 'x', name: 'X', baseUrl: 'https://x', status: 'ok' as const, queries: 4, queriesOk: 4, queriesFailed: 0,
  productsSeen: 0, quotesKept: 2, skippedMultiPack: 0, skippedCurrency: 0, carriedOver: 0, errors: [], ...o,
});

const file: ScanResultsFile = {
  schemaVersion: 1,
  scannedAt: '2026-10-10T06:00:00.000Z',
  durationMs: 1000,
  retailers: [
    report({ id: 'a', name: 'C.Gars Ltd', status: 'ok' }),
    report({ id: 'b', name: 'Smoke King', status: 'failed', queriesOk: 0, queriesFailed: 4, quotesKept: 0, errors: [{ query: 'q', kind: 'blocked', message: 'HTTP 403 -- looks like a bot wall' }] }),
    report({ id: 'c', name: "Holt's", status: 'disabled', note: 'US retailer' }),
  ],
  items: [
    { brand: 'Padrón', line: '1964 Anniversary', vitola: 'Exclusivo', quotes: [{ vendor: 'C.Gars Ltd', price: 16, currency: 'GBP', packageType: 'Single', inStock: true, title: 'Padron 1964 Exclusivo', url: 'https://x/p', scannedAt: '2026-10-09T06:00:00.000Z' }] },
    { brand: 'Cohiba', line: 'Behike', vitola: 'BHK 52', quotes: [] },
  ],
};

describe('normaliseKey', () => {
  it('stays identical to the scanner normalise()', () => {
    for (const s of ['Padrón 1964 & Co.', "Holt's  Cigar", 'H. Upmann — No. 2', '']) {
      expect(normaliseKey(s)).toBe(normalise(s));
    }
  });
});

describe('findQuotes', () => {
  it('matches accents/case and converts to app shape (£ symbol, scan date)', () => {
    const q = findQuotes(file, { brand: 'padron', line: '1964 anniversary', vitola: 'EXCLUSIVO' });
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ vendor: 'C.Gars Ltd', price: 16, currency: '£', packageType: 'Single', inStock: true, recordedAt: '2026-10-09T06:00:00.000Z' });
  });
  it('does not match a different vitola', () => {
    expect(findQuotes(file, { brand: 'Padrón', line: '1964 Anniversary', vitola: 'Imperial' })).toEqual([]);
  });
  it('lets a vitola-less item use an unambiguous line-level hit', () => {
    expect(findQuotes(file, { brand: 'Padrón', line: '1964 Anniversary' })).toHaveLength(1);
  });
  it('refuses an ambiguous vitola-less match', () => {
    const two: ScanResultsFile = { ...file, items: [file.items[0], { ...file.items[0], vitola: 'Imperial' }] };
    expect(findQuotes(two, { brand: 'Padrón', line: '1964 Anniversary' })).toEqual([]);
  });
});

describe('findBatchQuotes / missingFromScan', () => {
  it('returns one result per cigar, keeping ids', () => {
    const out = findBatchQuotes(file, [
      { id: '1', brand: 'Padrón', line: '1964 Anniversary', vitola: 'Exclusivo' },
      { id: '2', brand: 'Cohiba', line: 'Behike', vitola: 'BHK 52' },
    ]);
    expect(out.map((o) => [o.id, o.quotes.length])).toEqual([['1', 1], ['2', 0]]);
  });
  it('lists cigars the scanner has never heard of, once each', () => {
    const missing = missingFromScan(file, [
      { brand: 'Padrón', line: '1964 Anniversary', vitola: 'Exclusivo' },
      { brand: 'Montecristo', line: 'No. 2', vitola: 'Torpedo' },
      { brand: 'montecristo', line: 'no 2', vitola: 'torpedo' },
    ]);
    expect(missing).toEqual([{ brand: 'Montecristo', line: 'No. 2', vitola: 'Torpedo' }]);
  });
  it('cigarKey ignores an absent vitola', () => {
    expect(cigarKey({ brand: 'A', line: 'B' })).toBe('a b');
  });
});

describe('status helpers', () => {
  const now = new Date('2026-10-12T06:00:00.000Z');
  it('computes and describes age', () => {
    expect(scanAgeHours(file, now)).toBeCloseTo(48);
    expect(describeAge(48)).toBe('2 days ago');
    expect(describeAge(5)).toBe('5h ago');
    expect(describeAge(0.2)).toBe('less than an hour ago');
    expect(describeAge(null)).toBe('never');
  });
  it('counts only enabled retailers in the health note', () => {
    expect(scanHealthNote(file, now)).toBe('1 of 2 retailers returned prices (scanned 2 days ago).');
  });
  it('says so when the scanner has never run', () => {
    expect(scanHealthNote({ ...file, scannedAt: null }, now)).toMatch(/has not run yet/);
  });
  it('explains each retailer state', () => {
    expect(retailerSummaryLine(file.retailers[0])).toBe('2 prices');
    expect(retailerSummaryLine(file.retailers[1])).toMatch(/blocked: HTTP 403/);
    expect(retailerSummaryLine(file.retailers[2])).toBe('US retailer');
    expect(retailerSummaryLine(report({ status: 'no_matches', quotesKept: 0 }))).toMatch(/nothing matched/);
  });
});

describe('loadScanResults', () => {
  it('cache-busts and parses a valid file', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => file });
    const out = await loadScanResults(fetchFn as any, '/HUMIDOR/');
    expect(out.items).toHaveLength(2);
    expect(fetchFn.mock.calls[0][0]).toMatch(/^\/HUMIDOR\/data\/retailer-prices\.json\?t=\d+$/);
  });
  it('throws a readable error on 404 and on a bad shape', async () => {
    await expect(loadScanResults(vi.fn().mockResolvedValue({ ok: false, status: 404 }) as any, '/')).rejects.toThrow(/HTTP 404/);
    await expect(loadScanResults(vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as any, '/')).rejects.toThrow(/unexpected format/);
  });
});
