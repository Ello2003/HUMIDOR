import * as cheerio from 'cheerio';
import type { ScanErrorKind, WatchlistEntry } from './types';

/** A product as read from a retailer page, before matching/filtering. */
export interface RawProduct {
  title: string;
  /** Price in the page's own currency, as a number. */
  price: number;
  /** ISO code if the page said (e.g. 'GBP'); undefined if it didn't. */
  currency?: string;
  inStock: boolean;
  url?: string;
}

// ---------------------------------------------------------------- text utils

export function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const FILLER = new Set(['cigar', 'cigars', 'the', 'co', 'company', 'ltd', 'and', 'of', 'no', 'number', 'series']);

function significantTokens(text: string): string[] {
  return normalise(text)
    .split(' ')
    .filter((t) => t.length > 0 && !FILLER.has(t));
}

/** "£1,250.00" / "12.5" / "12,50" -> number, or null if there's no sane price. */
export function parsePrice(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? raw : null;
  const m = raw.replace(/\s/g, '').match(/(\d[\d,]*(?:\.\d+)?|\d+,\d{1,2})/);
  if (!m) return null;
  let s = m[1];
  // "12,50" (European decimal comma) vs "1,250" / "1,250.00" (thousands)
  if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');
  else s = s.replace(/,/g, '');
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function detectPackageType(title: string): 'Single' | 'Multi' {
  const t = title.toLowerCase();
  if (/\b(box|tin|case|carton|bundle|sampler|selection|collection|gift set)\b/.test(t)) return 'Multi';
  if (/\b(pack|pk)\s*(of)?\s*\d+\b/.test(t) || /\b\d+\s*(pack|pk|cigars|x)\b/.test(t)) return 'Multi';
  if (/\bof\s*(3|5|6|8|10|12|13|15|20|24|25|30|50)\b/.test(t)) return 'Multi';
  return 'Single';
}

// ------------------------------------------------------------------ matching

/**
 * Does this retailer product title plausibly be the cigar we asked for?
 * Deliberately strict: a missed match shows as "no price found", a wrong match
 * shows a wrong price, and the second is worse.
 */
export function titleMatches(title: string, wanted: WatchlistEntry): boolean {
  const t = new Set(normalise(title).split(' '));
  const titleText = ` ${normalise(title)} `;

  const brandTokens = significantTokens(wanted.brand);
  if (brandTokens.length > 0 && !brandTokens.every((b) => t.has(b))) return false;

  const lineTokens = significantTokens(wanted.line).filter((tok) => !brandTokens.includes(tok));
  if (lineTokens.length > 0) {
    const hits = lineTokens.filter((tok) => t.has(tok)).length;
    if (hits / lineTokens.length < 0.75) return false;
  }

  if (wanted.vitola) {
    // "Exclusivo (Box-Pressed Robusto)" -> the part before the bracket is the vitola name.
    const primary = wanted.vitola.split('(')[0];
    const vitolaTokens = significantTokens(primary).filter((tok) => !brandTokens.includes(tok) && !lineTokens.includes(tok));
    if (vitolaTokens.length > 0 && !vitolaTokens.every((v) => titleText.includes(` ${v} `))) return false;
  }
  return true;
}

// ---------------------------------------------------------------- strategies

/** Shopify predictive search: GET /search/suggest.json?q=...&resources[type]=product */
export function parseShopifySuggest(json: unknown, baseUrl: string): RawProduct[] | null {
  const products = (json as any)?.resources?.results?.products;
  if (!Array.isArray(products)) return null;
  const out: RawProduct[] = [];
  for (const p of products) {
    const price = parsePrice(p?.price);
    if (!p?.title || price === null) continue;
    out.push({
      title: String(p.title),
      price,
      // Shopify's suggest endpoint reports the shop's own currency without naming it;
      // the retailer config is UK-only, so the caller treats undefined as GBP.
      currency: undefined,
      inStock: p.available !== false,
      url: p.url ? new URL(String(p.url), baseUrl).toString() : undefined,
    });
  }
  return out;
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
  return v === undefined || v === null ? [] : Array.isArray(v) ? v : [v];
}

function collectJsonLdProducts(node: any, into: any[]): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((n) => collectJsonLdProducts(n, into));
    return;
  }
  const types = asArray(node['@type']).map(String);
  if (types.includes('Product')) into.push(node);
  for (const key of ['@graph', 'itemListElement', 'item', 'mainEntity']) {
    if (node[key]) collectJsonLdProducts(node[key], into);
  }
}

export function parseJsonLdProducts(html: string, baseUrl: string): RawProduct[] {
  const $ = cheerio.load(html);
  const found: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      collectJsonLdProducts(JSON.parse($(el).contents().text()), found);
    } catch {
      /* malformed JSON-LD block -- ignore it, others may be fine */
    }
  });

  const out: RawProduct[] = [];
  for (const p of found) {
    const offers = asArray(p.offers).flatMap((o: any) => (o?.offers ? asArray(o.offers) : [o]));
    const offer = offers.find((o: any) => parsePrice(o?.price ?? o?.lowPrice) !== null);
    if (!p.name || !offer) continue;
    const price = parsePrice(offer.price ?? offer.lowPrice);
    if (price === null) continue;
    out.push({
      title: String(p.name),
      price,
      currency: offer.priceCurrency ? String(offer.priceCurrency).toUpperCase() : undefined,
      inStock: !/OutOfStock|SoldOut|Discontinued/i.test(String(offer.availability ?? '')),
      url: p.url ? new URL(String(p.url), baseUrl).toString() : offer.url ? new URL(String(offer.url), baseUrl).toString() : undefined,
    });
  }
  return out;
}

export interface CardSelectors {
  card: string;
  title: string;
  price: string;
  link: string;
}

/** Defaults cover the two common non-Shopify UK shop platforms. */
export const DEFAULT_CARD_SELECTORS: CardSelectors[] = [
  // WooCommerce
  { card: 'li.product', title: '.woocommerce-loop-product__title, h2, h3', price: '.price ins .amount, .price .amount, .price', link: 'a.woocommerce-LoopProduct-link, a' },
  // Magento
  { card: 'li.product-item, .product-item', title: '.product-item-link, .product-name a', price: '.price', link: '.product-item-link, a' },
  // Generic microdata
  { card: '[itemtype*="schema.org/Product"]', title: '[itemprop="name"]', price: '[itemprop="price"], .price', link: 'a' },
];

export function parseProductCards(html: string, baseUrl: string, selectors: CardSelectors[] = DEFAULT_CARD_SELECTORS): RawProduct[] {
  const $ = cheerio.load(html);
  for (const sel of selectors) {
    const out: RawProduct[] = [];
    $(sel.card).each((_, el) => {
      const card = $(el);
      const title = card.find(sel.title).first().text().trim();
      // A comma selector matches in document order, so a struck-through old price
      // (<del>) would beat the sale price (<ins>). Try each alternative in the
      // order written instead, so the most specific selector wins.
      let price: number | null = null;
      for (const alt of sel.price.split(',').map((s) => s.trim()).filter(Boolean)) {
        const el2 = card.find(alt).first();
        if (el2.length === 0) continue;
        price = parsePrice(el2.attr('content') ?? el2.text());
        if (price !== null) break;
      }
      if (!title || price === null) return;
      const href = card.find(sel.link).first().attr('href');
      out.push({
        title,
        price,
        currency: /£/.test(card.text()) ? 'GBP' : undefined,
        inStock: !/out of stock|sold out/i.test(card.text()),
        url: href ? new URL(href, baseUrl).toString() : undefined,
      });
    });
    if (out.length > 0) return out;
  }
  return [];
}

/** HTML search page -> products, trying JSON-LD first and then product cards. */
export function parseHtmlSearch(html: string, baseUrl: string, selectors?: CardSelectors): RawProduct[] {
  const fromJsonLd = parseJsonLdProducts(html, baseUrl);
  if (fromJsonLd.length > 0) return fromJsonLd;
  return parseProductCards(html, baseUrl, selectors ? [selectors] : DEFAULT_CARD_SELECTORS);
}

// --------------------------------------------------------------- diagnostics

/** Cloudflare / bot-wall pages come back as 403/429/503 with a recognisable body. */
export function looksBlocked(status: number, body: string): boolean {
  if (![401, 403, 429, 503].includes(status)) return false;
  return /just a moment|cf-chl|attention required|captcha|access denied|are you a robot|checking your browser/i.test(body) || status === 403 || status === 429;
}

export function classifyHttpFailure(status: number, body: string): ScanErrorKind {
  return looksBlocked(status, body) ? 'blocked' : 'http';
}

/** Pick the quote to keep for one retailer x cigar: cheapest in-stock single, else cheapest single. */
export function pickBest(products: RawProduct[]): RawProduct | undefined {
  const sorted = [...products].sort((a, b) => a.price - b.price);
  return sorted.find((p) => p.inStock) ?? sorted[0];
}
