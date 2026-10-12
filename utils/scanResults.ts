/**
 * Browser-side reader for public/data/retailer-prices.json, the file the
 * scheduled "Scan retailer prices" GitHub Action commits. The Wishlist and
 * Research Hub scan buttons read it instead of calling the old /api routes,
 * so they work on GitHub Pages (no server) and never touch a retailer from
 * the browser.
 *
 * Types are imported type-only from scanner/ so nothing scanner-side (cheerio
 * etc.) lands in the browser bundle.
 */
import type { RetailerReport, ScanItem, ScanQuote, ScanResultsFile, WatchlistEntry } from '../../scanner/types';
import type { VendorPriceEntry } from '../types';
import { canonicalizeVendorName } from './researchUtils';

export type { RetailerReport, ScanResultsFile, WatchlistEntry };

/** Must stay identical to normalise() in scanner/parsers.ts (a test enforces it). */
export function normaliseKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function cigarKey(c: { brand: string; line: string; vitola?: string }): string {
  return normaliseKey(`${c.brand} ${c.line} ${c.vitola ?? ''}`);
}

export const SCAN_RESULTS_STALE_AFTER_HOURS = 72;

export async function loadScanResults(fetchFn: typeof fetch = fetch, baseUrl: string = import.meta.env.BASE_URL): Promise<ScanResultsFile> {
  // Cache-bust: GitHub Pages / browsers can otherwise serve yesterday's file.
  const url = `${baseUrl}data/retailer-prices.json?t=${Date.now()}`;
  const res = await fetchFn(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Couldn't load scan results (HTTP ${res.status}). The scanner may not have run yet.`);
  const json = (await res.json()) as ScanResultsFile;
  if (json?.schemaVersion !== 1 || !Array.isArray(json.items) || !Array.isArray(json.retailers)) {
    throw new Error('Scan results file is in an unexpected format.');
  }
  return json;
}

export function toVendorEntry(q: ScanQuote): VendorPriceEntry {
  return {
    id: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    vendor: canonicalizeVendorName(q.vendor),
    price: q.price,
    currency: '£',
    packageType: 'Single',
    inStock: q.inStock,
    url: q.url,
    // The date the retailer's price was actually read, not "now".
    recordedAt: q.scannedAt,
  };
}

/** Quotes for one cigar. Exact brand+line+vitola; vitola-less app items may use a line-level hit. */
export function findQuotes(results: ScanResultsFile, c: { brand: string; line: string; vitola?: string }): VendorPriceEntry[] {
  const wanted = cigarKey(c);
  let item: ScanItem | undefined = results.items.find((i) => cigarKey(i) === wanted);
  if (!item && !c.vitola) {
    const lineKey = cigarKey({ brand: c.brand, line: c.line });
    const candidates = results.items.filter((i) => cigarKey({ brand: i.brand, line: i.line }) === lineKey && i.quotes.length > 0);
    if (candidates.length === 1) item = candidates[0];
  }
  return (item?.quotes ?? []).map(toVendorEntry);
}

export function findBatchQuotes<T extends { id: string; brand: string; line: string; vitola?: string }>(
  results: ScanResultsFile,
  cigars: T[]
): Array<{ id: string; brand: string; name: string; quotes: VendorPriceEntry[] }> {
  return cigars.map((c) => ({ id: c.id, brand: c.brand, name: c.line, quotes: findQuotes(results, c) }));
}

/** App cigars the scanner doesn't know about (so they'd never get a price). */
export function missingFromScan(results: ScanResultsFile, cigars: Array<{ brand: string; line: string; vitola?: string }>): WatchlistEntry[] {
  const known = new Set(results.items.map(cigarKey));
  const seen = new Set<string>();
  const out: WatchlistEntry[] = [];
  for (const c of cigars) {
    const k = cigarKey(c);
    if (!c.brand || !c.line || known.has(k) || seen.has(k)) continue;
    seen.add(k);
    out.push({ brand: c.brand, line: c.line, ...(c.vitola ? { vitola: c.vitola } : {}) });
  }
  return out;
}

export function scanAgeHours(results: ScanResultsFile, now: Date = new Date()): number | null {
  if (!results.scannedAt) return null;
  return (now.getTime() - new Date(results.scannedAt).getTime()) / 3_600_000;
}

export function describeAge(hours: number | null): string {
  if (hours === null) return 'never';
  if (hours < 1) return 'less than an hour ago';
  if (hours < 48) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

/** One line for the toast after pressing a scan button. */
export function scanHealthNote(results: ScanResultsFile, now: Date = new Date()): string {
  if (!results.scannedAt) return 'The scanner has not run yet — run the "Scan retailer prices" workflow in GitHub Actions.';
  const active = results.retailers.filter((r) => r.status !== 'disabled');
  const working = active.filter((r) => r.status === 'ok' || r.status === 'partial').length;
  const age = describeAge(scanAgeHours(results, now));
  return `${working} of ${active.length} retailers returned prices (scanned ${age}).`;
}

export function retailerSummaryLine(r: RetailerReport): string {
  if (r.status === 'disabled') return r.note ?? 'Disabled';
  if (r.status === 'no_matches') return 'Reachable, but nothing matched — the search URL or selectors need fixing';
  const first = r.errors[0];
  if (r.status === 'failed' || r.status === 'partial') {
    return first ? `${first.kind}: ${first.message}` : `${r.queriesFailed} of ${r.queries} lookups failed`;
  }
  return `${r.quotesKept} price${r.quotesKept === 1 ? '' : 's'}${r.carriedOver ? `, ${r.carriedOver} carried over` : ''}`;
}
