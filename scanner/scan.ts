import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { INITIAL_WISHLIST } from '../src/data/initialData';
import { INITIAL_RESEARCH_DATABASE } from '../src/data/cigarDatabase';
import { RETAILERS, type RetailerConfig } from './retailers.config';
import {
  classifyHttpFailure,
  detectPackageType,
  normalise,
  parseHtmlSearch,
  parseShopifySuggest,
  pickBest,
  titleMatches,
  type RawProduct,
} from './parsers';
import type { RetailerReport, ScanError, ScanErrorKind, ScanItem, ScanQuote, ScanResultsFile, WatchlistEntry } from './types';

const OUTPUT_PATH = path.resolve('public/data/retailer-prices.json');
const WATCHLIST_PATH = path.resolve('scanner/watchlist.json');
const USER_AGENT = 'HumidorPriceScanner/1.0 (+https://github.com/Ello2003/HUMIDOR; personal price check)';
const REQUEST_TIMEOUT_MS = 15_000;
const DELAY_BETWEEN_REQUESTS_MS = 1_500;
const MAX_ERRORS_KEPT = 5;

export interface ScanDeps {
  fetchFn: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  now: () => Date;
}

const realDeps: ScanDeps = {
  fetchFn: (input, init) => fetch(input, init),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  now: () => new Date(),
};

export class ScanFailure extends Error {
  constructor(public kind: ScanErrorKind, message: string, public httpStatus?: number) {
    super(message);
  }
}

export function itemKey(e: WatchlistEntry): string {
  return normalise(`${e.brand} ${e.line} ${e.vitola ?? ''}`);
}

// ---------------------------------------------------------------- watchlist

export function buildWatchlist(extra: WatchlistEntry[] = []): WatchlistEntry[] {
  const all: WatchlistEntry[] = [
    ...INITIAL_WISHLIST.map((w) => ({ brand: w.brand, line: w.name, vitola: w.vitola })),
    ...INITIAL_RESEARCH_DATABASE.map((r) => ({ brand: r.brand, line: r.line, vitola: r.vitola })),
    ...extra,
  ];
  const seen = new Set<string>();
  return all.filter((e) => {
    if (!e.brand || !e.line) return false;
    const k = itemKey(e);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function readJsonIfExists<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ fetching

async function getText(url: string, deps: ScanDeps, accept: string): Promise<{ status: number; body: string }> {
  const attempt = async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await deps.fetchFn(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: accept, 'Accept-Language': 'en-GB,en;q=0.9' },
        signal: ctrl.signal,
        redirect: 'follow',
      });
      return { status: res.status, body: await res.text() };
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new ScanFailure('timeout', `No response within ${REQUEST_TIMEOUT_MS / 1000}s`);
      throw new ScanFailure('network', err?.cause?.code ? `${err.message} (${err.cause.code})` : String(err?.message ?? err));
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    return await attempt();
  } catch (err) {
    if (err instanceof ScanFailure && (err.kind === 'timeout' || err.kind === 'network')) {
      await deps.sleep(2_000);
      return attempt(); // one retry for flaky network, then give up
    }
    throw err;
  }
}

async function searchShopify(cfg: RetailerConfig, query: string, deps: ScanDeps): Promise<RawProduct[] | 'not-shopify'> {
  const url = `${cfg.baseUrl}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=10`;
  const { status, body } = await getText(url, deps, 'application/json');
  if (status !== 200) {
    const kind = classifyHttpFailure(status, body);
    if (kind === 'blocked') throw new ScanFailure('blocked', `HTTP ${status} -- looks like a bot wall`, status);
    return 'not-shopify'; // 404 etc. just means this isn't a Shopify store
  }
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return 'not-shopify';
  }
  return parseShopifySuggest(json, cfg.baseUrl) ?? 'not-shopify';
}

async function searchHtml(cfg: RetailerConfig, query: string, deps: ScanDeps): Promise<RawProduct[]> {
  const url = cfg.baseUrl + cfg.searchPath.replace('{q}', encodeURIComponent(query));
  const { status, body } = await getText(url, deps, 'text/html,application/xhtml+xml');
  if (status !== 200) {
    const kind = classifyHttpFailure(status, body);
    throw new ScanFailure(kind, kind === 'blocked' ? `HTTP ${status} -- looks like a bot wall` : `HTTP ${status}`, status);
  }
  const products = parseHtmlSearch(body, cfg.baseUrl, cfg.selectors);
  if (products.length === 0 && !/product|price|£/i.test(body)) {
    throw new ScanFailure('parse', 'Page loaded but contained no recognisable product or price markup');
  }
  return products;
}

// ------------------------------------------------------------------ scanning

export interface RetailerScanOutput {
  report: RetailerReport;
  /** itemKey -> quote found this run */
  quotes: Map<string, ScanQuote>;
  /** itemKeys whose query failed this run (candidates for carry-over) */
  failedKeys: Set<string>;
}

export async function scanRetailer(cfg: RetailerConfig, watchlist: WatchlistEntry[], deps: ScanDeps): Promise<RetailerScanOutput> {
  const report: RetailerReport = {
    id: cfg.id,
    name: cfg.name,
    baseUrl: cfg.baseUrl,
    status: 'ok',
    queries: 0,
    queriesOk: 0,
    queriesFailed: 0,
    productsSeen: 0,
    quotesKept: 0,
    skippedMultiPack: 0,
    skippedCurrency: 0,
    carriedOver: 0,
    errors: [],
  };
  const quotes = new Map<string, ScanQuote>();
  const failedKeys = new Set<string>();

  if (!cfg.enabled) {
    report.status = 'disabled';
    report.note = cfg.disabledReason;
    return { report, quotes, failedKeys };
  }

  let strategy: 'shopify' | 'html' | null = cfg.strategy === 'auto' ? null : cfg.strategy;

  for (let i = 0; i < watchlist.length; i++) {
    const entry = watchlist[i];
    const query = `${entry.brand} ${entry.line}`.trim();
    report.queries++;
    if (i > 0) await deps.sleep(DELAY_BETWEEN_REQUESTS_MS);

    try {
      let products: RawProduct[];
      if (strategy === 'shopify') {
        const r = await searchShopify(cfg, query, deps);
        if (r === 'not-shopify') throw new ScanFailure('parse', 'Not a Shopify store (suggest endpoint returned nothing usable)');
        products = r;
      } else if (strategy === 'html') {
        products = await searchHtml(cfg, query, deps);
      } else {
        const r = await searchShopify(cfg, query, deps);
        if (r === 'not-shopify') {
          products = await searchHtml(cfg, query, deps);
          strategy = 'html';
        } else {
          products = r;
          strategy = 'shopify';
        }
      }
      report.strategyUsed = strategy ?? undefined;
      report.queriesOk++;
      report.productsSeen += products.length;

      const matched = products.filter((p) => titleMatches(p.title, entry));
      const singles = matched.filter((p) => detectPackageType(p.title) === 'Single');
      report.skippedMultiPack += matched.length - singles.length;
      const gbp = singles.filter((p) => !p.currency || p.currency === 'GBP');
      report.skippedCurrency += singles.length - gbp.length;

      const best = pickBest(gbp);
      if (best) {
        quotes.set(itemKey(entry), {
          vendor: cfg.name,
          price: best.price,
          currency: 'GBP',
          packageType: 'Single',
          inStock: best.inStock,
          url: best.url,
          title: best.title,
          scannedAt: deps.now().toISOString(),
        });
        report.quotesKept++;
      }
    } catch (err) {
      const f = err instanceof ScanFailure ? err : new ScanFailure('parse', String((err as Error)?.message ?? err));
      report.queriesFailed++;
      failedKeys.add(itemKey(entry));
      if (report.errors.length < MAX_ERRORS_KEPT) {
        const e: ScanError = { query, kind: f.kind, message: f.message };
        if (f.httpStatus) e.httpStatus = f.httpStatus;
        report.errors.push(e);
      }
      // A bot wall won't be different for the next 12 cigars -- stop hammering the site.
      if (f.kind === 'blocked') {
        for (const rest of watchlist.slice(i + 1)) {
          report.queries++;
          report.queriesFailed++;
          failedKeys.add(itemKey(rest));
        }
        break;
      }
    }
  }

  report.status =
    report.queriesFailed === report.queries ? 'failed' : report.queriesFailed > 0 ? 'partial' : report.quotesKept === 0 ? 'no_matches' : 'ok';
  return { report, quotes, failedKeys };
}

export function assembleResults(
  watchlist: WatchlistEntry[],
  outputs: RetailerScanOutput[],
  previous: ScanResultsFile | null,
  deps: Pick<ScanDeps, 'now'>,
  startedAt: number,
  runUrl?: string
): ScanResultsFile {
  const prevByKey = new Map<string, ScanItem>();
  for (const it of previous?.items ?? []) prevByKey.set(itemKey(it), it);

  const items: ScanItem[] = watchlist.map((entry) => {
    const key = itemKey(entry);
    const quotes: ScanQuote[] = [];
    for (const out of outputs) {
      const fresh = out.quotes.get(key);
      if (fresh) {
        quotes.push(fresh);
      } else if (out.failedKeys.has(key)) {
        // This run couldn't reach the retailer for this cigar: keep the last good
        // price (its own scannedAt shows how old it is) rather than silently dropping it.
        const old = prevByKey.get(key)?.quotes.find((q) => q.vendor === out.report.name);
        if (old) {
          quotes.push(old);
          out.report.carriedOver++;
        }
      }
    }
    quotes.sort((a, b) => a.price - b.price);
    return { brand: entry.brand, line: entry.line, ...(entry.vitola ? { vitola: entry.vitola } : {}), quotes };
  });

  return {
    schemaVersion: 1,
    scannedAt: deps.now().toISOString(),
    durationMs: deps.now().getTime() - startedAt,
    ...(runUrl ? { runUrl } : {}),
    retailers: outputs.map((o) => o.report),
    items,
  };
}

export async function runScan(
  watchlist: WatchlistEntry[],
  previous: ScanResultsFile | null,
  deps: ScanDeps = realDeps,
  retailers: RetailerConfig[] = RETAILERS,
  runUrl?: string
): Promise<ScanResultsFile> {
  const startedAt = deps.now().getTime();
  // Retailers run in parallel with each other; each one is strictly sequential
  // with a delay, so no single site sees more than one request at a time.
  const outputs = await Promise.all(retailers.map((r) => scanRetailer(r, watchlist, deps)));
  return assembleResults(watchlist, outputs, previous, deps, startedAt, runUrl);
}

// ---------------------------------------------------------------------- CLI

function summaryMarkdown(r: ScanResultsFile): string {
  const icon = { ok: '✅', no_matches: '🟡', partial: '🟠', failed: '❌', disabled: '⚪' } as const;
  const rows = r.retailers.map((x) => {
    const detail = x.note ?? x.errors[0]?.message ?? (x.status === 'no_matches' ? 'Reachable but nothing matched -- check URL/selectors' : '');
    return `| ${icon[x.status]} ${x.name} | ${x.status} | ${x.strategyUsed ?? '-'} | ${x.queriesOk}/${x.queries} | ${x.quotesKept} | ${detail.replace(/\|/g, '/')} |`;
  });
  return ['## Retailer scan', '', '| Retailer | Status | Strategy | Queries OK | Prices | Detail |', '|---|---|---|---|---|---|', ...rows, ''].join('\n');
}

async function main() {
  const extra = (await readJsonIfExists<{ extra?: WatchlistEntry[] }>(WATCHLIST_PATH))?.extra ?? [];
  const watchlist = buildWatchlist(extra);
  const previous = await readJsonIfExists<ScanResultsFile>(OUTPUT_PATH);
  const runUrl =
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : undefined;

  console.log(`Scanning ${watchlist.length} cigars across ${RETAILERS.filter((r) => r.enabled).length} retailers...`);
  const results = await runScan(watchlist, previous, realDeps, RETAILERS, runUrl);

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(results, null, 2) + '\n');

  const md = summaryMarkdown(results);
  console.log('\n' + md);
  if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, md);

  for (const r of results.retailers) {
    if (r.status === 'failed' || r.status === 'partial') console.log(`::warning title=${r.name} ${r.status}::${r.errors[0]?.message ?? 'see summary'}`);
  }
  const enabled = results.retailers.filter((r) => r.status !== 'disabled');
  if (enabled.length > 0 && enabled.every((r) => r.status === 'failed')) {
    console.log('::error title=Every retailer failed::GitHub runner IPs are commonly blocked by retailer bot protection. See the run summary.');
  }
  // Exit 0 even when retailers failed: the status file is the point, and it must be committed.
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('Scanner crashed:', err);
    process.exit(1);
  });
}
