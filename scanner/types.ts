/**
 * Shape of public/data/retailer-prices.json -- written by scanner/scan.ts
 * (run by the "Scan retailer prices" GitHub Action) and read by the
 * Wishlist and Research Hub scan buttons. Bump schemaVersion if this
 * changes in a way old readers can't cope with.
 */
export type RetailerStatus = 'ok' | 'no_matches' | 'partial' | 'failed' | 'disabled';

export type ScanErrorKind = 'blocked' | 'http' | 'timeout' | 'network' | 'parse';

export interface ScanError {
  query: string;
  kind: ScanErrorKind;
  message: string;
  httpStatus?: number;
}

export interface RetailerReport {
  id: string;
  /** Canonical vendor name, same spelling the rest of the app uses. */
  name: string;
  baseUrl: string;
  status: RetailerStatus;
  /** Why it was skipped, when status === 'disabled'. */
  note?: string;
  strategyUsed?: 'shopify' | 'html';
  queries: number;
  queriesOk: number;
  queriesFailed: number;
  productsSeen: number;
  quotesKept: number;
  /** Matched products dropped because they were boxes/multi-packs. */
  skippedMultiPack: number;
  /** Matched products dropped because the price wasn't in GBP. */
  skippedCurrency: number;
  /** Quotes carried over from the previous run because this run failed. */
  carriedOver: number;
  /** First few errors only -- enough to diagnose, not a log dump. */
  errors: ScanError[];
}

export interface ScanQuote {
  vendor: string;
  price: number;
  currency: 'GBP';
  packageType: 'Single';
  inStock: boolean;
  url?: string;
  /** Product title as the retailer wrote it, so a wrong match is visible. */
  title: string;
  /** When this price was actually read (older than the file if carried over). */
  scannedAt: string;
}

export interface ScanItem {
  brand: string;
  line: string;
  vitola?: string;
  quotes: ScanQuote[];
}

export interface ScanResultsFile {
  schemaVersion: 1;
  /** null = the scanner has never run. */
  scannedAt: string | null;
  durationMs: number;
  runUrl?: string;
  retailers: RetailerReport[];
  items: ScanItem[];
}

export interface WatchlistEntry {
  brand: string;
  line: string;
  vitola?: string;
}

export const EMPTY_SCAN_RESULTS: ScanResultsFile = {
  schemaVersion: 1,
  scannedAt: null,
  durationMs: 0,
  retailers: [],
  items: [],
};
