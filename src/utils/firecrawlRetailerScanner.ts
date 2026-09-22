export type RetailerScanCigar = {
  id: string;
  brand: string;
  name: string;
  line?: string;
  variant?: string;
  vitola?: string;
  packageType?: string;
  boxCount?: number;
};

export type RetailerScanResult = {
  id: string;
  brand: string;
  name: string;
  quotes: Array<Record<string, any>>;
  bestPrice: number | null;
  bestVendor: string | null;
  grounded: boolean;
  provider: 'firecrawl' | 'direct-web';
  groundedSources?: Array<{ title: string; uri: string }>;
  scanStatus?: string;
};

export const UK_RETAILER_CATALOG: Record<string, { domain: string }> = {
  'C.Gars Ltd': { domain: 'cgarsltd.co.uk' },
  'Cuban Cigar Club': { domain: 'cubancigarclub.co.uk' },
  'Havana House': { domain: 'havanahouse.co.uk' },
  'Smoke King': { domain: 'smoke-king.co.uk' },
  'Davidoff of London': { domain: 'davidofflondon.com' },
  'James J. Fox (London)': { domain: 'jjfox.co.uk' },
  'Sautter Cigars (London)': { domain: 'sauttercigars.com' },
  'Turmeaus Tobacconist': { domain: 'turmeaus.co.uk' },
  'Robert Graham 1874': { domain: 'robertgraham1874.com' },
  'GQ Tobaccos': { domain: 'gqtobaccos.com' },
  "Aston's of Manchester": { domain: 'astonsofmanchester.co.uk' },
  'Arthur Fletcher': { domain: 'arthurfletcher.co.uk' },
  'James Barber Tobacconist': { domain: 'jamesbarber.co.uk' },
  'Gauntleys': { domain: 'gauntleyscigars.com' },
  'Simply Cigars': { domain: 'simplycigars.co.uk' },
  'Fine Cigars Club': { domain: 'finecigarsclub.com' },
  'Cigar Nights': { domain: 'cigarnights.co.uk' },
  'No.6 Cavendish': { domain: 'no6cavendish.com' },
  'Hava Havana': { domain: 'havahavana.com' },
  'The House of Cigars': { domain: 'thehouseofcigars.co.uk' },
  'The Smoking Jacket': { domain: 'thesmokingjacket.co.uk' },
  'Toro Puro': { domain: 'toropuro.com' },
  'Rebellion Cigars': { domain: 'rebellioncigars.com' },
  'Surrey Cigars': { domain: 'surreycigars.com' },
  'UK Cigar Store': { domain: 'ukcigarstore.co.uk' },
};

const RETAILER_DOMAINS = Object.values(UK_RETAILER_CATALOG).map(({ domain }) => domain);
const MAX_SEARCH_RESULTS = 30;
const MAX_PAGE_SCRAPES = 6;

function normalize(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function compact(value: unknown): string {
  return normalize(value).replace(/[^a-z0-9]+/g, '');
}

function meaningfulTokens(value: string): string[] {
  const generic = new Set([
    'cigar', 'cigars', 'single', 'stick', 'sticks', 'box', 'pack', 'of', 'the',
    'new', 'world', 'cuban', 'cuba', 'habano', 'habanos',
  ]);
  return normalize(value)
    .replace(/[–—/|,()[\]{}:+]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !generic.has(token));
}

function identityName(cigar: RetailerScanCigar): string {
  const candidates = [cigar.name, cigar.line, cigar.variant]
    .filter(Boolean)
    .map(String)
    .sort((a, b) => meaningfulTokens(b).length - meaningfulTokens(a).length);
  return candidates[0] || cigar.name;
}

function packageKind(packageType?: string, boxCount?: number): 'single' | 'box' {
  const text = normalize(packageType);
  if (Number.isInteger(boxCount) && Number(boxCount) >= 2) return 'box';
  if (/box|carton|case|bundle|pack of|\bpack\b/.test(text)) return 'box';
  return 'single';
}

function packageMatches(title: string, url: string, packageType?: string, boxCount?: number): boolean {
  const titleText = normalize(title);
  const urlText = normalize(url);
  const target = packageKind(packageType, boxCount);
  const explicitBox = /box(?:-|\s+of)?|carton|case|bundle|pack(?:-|\s+of)?|\b[0-9]{1,3}\s+cigars?\b/.test(titleText) ||
    /box(?:-|\s+of)?|carton|case|bundle|pack(?:-|\s+of)?/.test(urlText);
  const explicitSingle = /single|loose|1[-\s]*(?:single|cigar|stick)|single[-\s]*cigar/.test(titleText);

  if (target === 'single') {
    if (explicitSingle) return true;
    return !explicitBox;
  }

  if (!explicitBox) return false;
  if (boxCount && !new RegExp(`(?:box|pack|carton|case|bundle)[^0-9]{0,12}${boxCount}\\s*(?:cigars?|sticks?)?\\b`).test(`${titleText} ${urlText}`)) {
    return false;
  }
  return true;
}

const VITOLA_NAMES = [
  'double corona', 'petit corona', 'corona gorda', 'short robusto', 'double toro',
  'robusto', 'rothschild', 'corona', 'lonsdale', 'churchill', 'toro', 'gordo',
  'gigante', 'lancero', 'panetela', 'belicoso', 'torpedo', 'pyramid', 'perfecto',
  'salomon', 'diadema',
];

function lengthMm(value: string): number | undefined {
  const normalized = value.trim();
  const parts = normalized.split(/\s+/);
  let inches: number;

  if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+\/\d+$/.test(parts[1])) {
    const [n, d] = parts[1].split('/').map(Number);
    if (!d) return undefined;
    inches = Number(parts[0]) + n / d;
  } else if (/^\d+\/\d+$/.test(normalized)) {
    const [n, d] = normalized.split('/').map(Number);
    if (!d) return undefined;
    inches = n / d;
  } else {
    const numeric = Number(normalized);
    if (!Number.isFinite(numeric)) return undefined;
    return numeric > 20 ? numeric : numeric * 25.4;
  }

  return Number.isFinite(inches) ? inches * 25.4 : undefined;
}

function dimensions(text: string): { lengthMm?: number; ringGauge?: number } {
  const normalized = normalize(text)
    .replace(/[×✕]/g, 'x')
    .replace(/\b(inches?|inch|in)\b/g, '"');

  const patterns = [
    /(\d+(?:\s+\d+\/\d+)?(?:\.\d+)?)\s*(?:"|')?\s*x\s*(\d{2})\b/i,
    /(\d+(?:\.\d+)?)\s*mm\s*x\s*(\d{2})\b/i,
    /(\d{2,3})\s*mm\s*(?:x|by)\s*(\d{2})\b/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    const length = lengthMm(match[1]);
    const ringGauge = Number(match[2]);
    if (!length || !Number.isFinite(ringGauge) || ringGauge < 20 || ringGauge > 80) continue;
    return { lengthMm: length, ringGauge };
  }
  return {};
}

function vitolaName(text: string): string | undefined {
  const normalized = normalize(text).replace(/[–—/|,()[\]{}:+]/g, ' ');
  return VITOLA_NAMES
    .filter((name) => new RegExp(`\\b${name.replace(/ /g, '\\s+')}\\b`, 'i').test(normalized))
    .sort((a, b) => b.length - a.length)[0];
}

function vitolaMatches(requestedVitola: string | undefined, identityText: string): boolean {
  if (!requestedVitola) return true;

  const requested = dimensions(requestedVitola);
  const found = dimensions(identityText);
  if (requested.lengthMm && requested.ringGauge && found.lengthMm && found.ringGauge) {
    return Math.abs(requested.lengthMm - found.lengthMm) <= 5 &&
      Math.abs(requested.ringGauge - found.ringGauge) <= 1;
  }

  const requestedName = vitolaName(requestedVitola);
  const foundName = vitolaName(identityText);
  if (requestedName && foundName) return requestedName === foundName;

  return true;
}

function significantVariantTokens(vitola?: string): string[] {
  const generic = new Set([
    'box', 'pressed', 'press', 'double', 'petit', 'short', 'long', 'extra',
    'corona', 'gorda', 'robusto', 'rothschild', 'churchill', 'toro', 'gordo',
    'gigante', 'lancero', 'panetela', 'belicoso', 'torpedo', 'pyramid',
    'perfecto', 'salomon', 'diadema', 'box-pressed', 'boxpress', 'vitola', 'size', 'format',
  ]);
  return meaningfulTokens(vitola || '')
    .filter((token) => token.length >= 4 && !generic.has(token) && !/^\d+$/.test(token))
    .filter((token) => token !== 'no');
}

function tokenCompatible(requested: string, foundText: string): boolean {
  if (foundText.includes(requested)) return true;
  if (requested.length >= 6 && foundText.split(/\s+/).some((token) => token.startsWith(requested.slice(0, 6)))) return true;
  return false;
}

export function retailerListingMatches(
  title: string,
  url: string,
  brand: string,
  name: string,
  vitola?: string,
  line?: string,
  variant?: string,
  packageType?: string,
  boxCount?: number,
  extraText = '',
): boolean {
  const identity = normalize(`${title} ${url} ${extraText}`);
  const brandTokens = meaningfulTokens(brand);
  const requestedName = identityName({ id: '', brand, name, line, variant });
  const nameAliases = new Set<string>([
    requestedName, name, line || '', variant || '',
  ].filter(Boolean).map(normalize));
  if (!brandTokens.length) return false;

  const identityCompact = compact(identity);
  const brandCompact = compact(brand);
  const brandCoreTokens = brandTokens.filter((token) => token.length >= 3);
  const brandMatched =
    (brandCompact.length >= 4 && identityCompact.includes(brandCompact)) ||
    (brandCoreTokens.length > 0 && brandCoreTokens.every((token) => identity.includes(token))) ||
    (normalize(brand).includes('e.p. carrillo') && /\bcarrillo\b/i.test(identity));
  if (!brandMatched) return false;

  const nameMatched = [...nameAliases].some((alias) => {
    const aliasCompact = compact(alias);
    const aliasTokens = meaningfulTokens(alias);
    return (aliasCompact.length >= 3 && identityCompact.includes(aliasCompact)) ||
      (aliasTokens.length > 0 && aliasTokens.every((token) => identity.includes(token)));
  });
  if (!nameMatched) return false;

  if (!vitolaMatches(vitola, identity)) return false;

  const variantTokens = significantVariantTokens(vitola);
  if (variantTokens.length && !variantTokens.every((token) => tokenCompatible(token, identity))) return false;

  return packageMatches(title, url, packageType, boxCount);
}

function exactProductMatch(
  title: string,
  url: string,
  brand: string,
  name: string,
  vitola?: string,
  line?: string,
  variant?: string,
  packageType?: string,
  boxCount?: number,
  extraText = '',
): boolean {
  return retailerListingMatches(
    title, url, brand, name, vitola, line, variant, packageType, boxCount, extraText,
  );
}

function extractPounds(text: string, label: string): number | undefined {
  const normalized = normalize(text);
  const matches = [...normalized.matchAll(/(?:£|gbp\s*)([0-9]{1,4}(?:\.[0-9]{1,2})?)/gi)]
    .map((match) => ({ price: Number(match[1]), index: match.index ?? 0 }))
    .filter(({ price }) => Number.isFinite(price) && price >= 3 && price < 2000);
  if (!matches.length) return undefined;

  const labelIndex = normalized.indexOf(normalize(label));
  if (labelIndex < 0) return matches[0].price;
  return matches
    .map((match) => ({ ...match, distance: Math.abs(match.index - labelIndex) }))
    .filter((match) => match.distance <= 300)
    .sort((a, b) => a.distance - b.distance)[0]?.price;
}

function structuredPrice(product: any, requested: RetailerScanCigar): {
  price?: number;
  inStock?: boolean;
  title?: string;
} {
  if (!product || typeof product !== 'object') return {};
  const title = String(product.title || '');
  const variants = Array.isArray(product.variants) ? product.variants.filter((v: any) => v && typeof v === 'object') : [];
  const matchingVariants = variants.filter((variant: any) =>
    exactProductMatch(
      `${title} ${String(variant?.title || JSON.stringify(variant?.values || {}))}`,
      '',
      requested.brand,
      requested.name,
      requested.vitola,
      requested.line,
      requested.variant,
      requested.packageType,
      requested.boxCount,
    )
  );

  const variant = matchingVariants[0];
  if (variants.length && !variant) return {};
  if (!variant && !exactProductMatch(
    title, '', requested.brand, requested.name, requested.vitola,
    requested.line, requested.variant, requested.packageType, requested.boxCount
  )) return {};

  const rawPrice = typeof variant?.price === 'object'
    ? variant.price?.amount
    : Number.isFinite(Number(variant?.price))
      ? Number(variant.price)
      : typeof product.price === 'object'
        ? product.price?.amount
        : Number.isFinite(Number(product.price)) ? Number(product.price) : undefined;

  const price = Number(rawPrice);
  const currency = String(
    (typeof variant?.price === 'object' ? variant.price?.currency : undefined) ||
    (typeof product.price === 'object' ? product.price?.currency : undefined) ||
    product.currency || ''
  ).toUpperCase();

  if (!Number.isFinite(price) || price < 3 || price >= 2000) return {};
  if (currency && currency !== 'GBP' && currency !== '£') return {};

  return {
    price,
    inStock: variant?.availability?.inStock !== undefined
      ? Boolean(variant.availability.inStock)
      : undefined,
    title: String(variant?.title || product.title || ''),
  };
}

function retailerForHost(hostname: string): string | undefined {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return Object.entries(UK_RETAILER_CATALOG)
    .find(([, meta]) => host === meta.domain || host.endsWith(`.${meta.domain}`))?.[0];
}

async function firecrawlSearch(
  apiKey: string,
  query: string,
  includeDomains?: string[],
): Promise<any[]> {
  const response = await fetch('https://api.firecrawl.dev/v2/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      ...(includeDomains?.length ? { includeDomains } : {}),
      limit: MAX_SEARCH_RESULTS,
      sources: ['web'],
      scrapeOptions: { formats: ['markdown', 'product'], onlyMainContent: true },
    }),
  });
  if (!response.ok) throw new Error(`Firecrawl search failed (${response.status})`);
  const payload: any = await response.json();
  return Array.isArray(payload?.data?.web)
    ? payload.data.web
    : Array.isArray(payload?.data) ? payload.data : [];
}

const sitemapCache = new Map<string, string[]>();

function decodeXml(value: string): string {
  return value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
}

function sitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)]
    .map((match) => decodeXml(String(match[1] || '').trim()))
    .filter((url) => /^https?:\/\//i.test(url));
}

function sitemapUrlLooksRelevant(url: string, query: string): boolean {
  let decodedUrl = url;
  try { decodedUrl = decodeURIComponent(url); } catch { /* keep the raw sitemap URL */ }
  const urlText = normalize(decodedUrl);
  const tokens = meaningfulTokens(query)
    .filter((token) => token.length >= 4)
    .filter((token) => !/^(cigar|price|prices|pounds|gbp|uk)$/.test(token));
  if (!tokens.length) return true;
  const hits = tokens.filter((token) => urlText.includes(token));
  return hits.length >= Math.min(2, tokens.length);
}

async function fetchText(url: string): Promise<string | undefined> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; HUMIDOR price scanner)',
      Accept: 'text/xml,application/xml,text/plain,text/html;q=0.8',
    },
  }).catch(() => undefined);
  if (!response?.ok) return undefined;
  return response.text().catch(() => undefined);
}

async function retailerSitemapUrls(domain: string): Promise<string[]> {
  const cached = sitemapCache.get(domain);
  if (cached) return cached;

  const sitemapCandidates = new Set<string>([
    `https://${domain}/sitemap.xml`,
    `https://${domain}/sitemap_index.xml`,
    `https://${domain}/wp-sitemap.xml`,
  ]);
  const robots = await fetchText(`https://${domain}/robots.txt`);
  if (robots) {
    for (const match of robots.matchAll(/^\s*sitemap:\s*(https?:\/\/\S+)/gim)) sitemapCandidates.add(String(match[1]).trim());
  }

  const productUrls = new Set<string>();
  const childSitemaps = new Set<string>();
  for (const sitemap of sitemapCandidates) {
    const xml = await fetchText(sitemap);
    if (!xml) continue;
    const locs = sitemapLocs(xml);
    if (/<sitemap(?:index)?[\s>]/i.test(xml.slice(0, 1000))) locs.forEach((loc) => childSitemaps.add(loc));
    else locs.forEach((loc) => productUrls.add(loc));
  }

  await Promise.all(Array.from(childSitemaps).slice(0, 12).map(async (sitemap) => {
    const xml = await fetchText(sitemap);
    if (!xml) return;
    sitemapLocs(xml).forEach((loc) => productUrls.add(loc));
  }));

  const urls = Array.from(productUrls).filter((url) => {
    try {
      const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
      return host === domain || host.endsWith(`.${domain}`);
    } catch { return false; }
  });
  sitemapCache.set(domain, urls);
  return urls;
}

async function directWebSearch(query: string): Promise<any[]> {
  const results: any[] = [];
  const seen = new Set<string>();

  // Retailer-owned catalogues are free and avoid search-engine throttling.
  await Promise.all(RETAILER_DOMAINS.map(async (domain) => {
    const urls = await retailerSitemapUrls(domain);
    for (const url of urls) {
      if (!sitemapUrlLooksRelevant(url, query) || seen.has(url)) continue;
      seen.add(url);
      let pathname = url;
      try { pathname = decodeURIComponent(new URL(url).pathname); } catch { /* keep URL */ }
      const title = pathname.replace(/^\/+|\/+$/g, '').replace(/[-_]+/g, ' ').replace(/\/+/g, ' > ').trim();
      results.push({ url, title, description: '' });
      if (results.length >= MAX_SEARCH_RESULTS) break;
    }
  }));

  // Low-volume fallback only if no retailer sitemap exposed a candidate.
  if (results.length) return results;
  const fallbackDomains = RETAILER_DOMAINS.slice(0, 8);
  await Promise.all(fallbackDomains.map(async (domain) => {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:${domain} ${query}`)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HUMIDOR price scanner)', Accept: 'text/html' },
    }).catch(() => undefined);
    if (!response?.ok) return;
    const html = await response.text();
    const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*\bresult__a\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
    for (const match of html.matchAll(pattern)) {
      let url = String(match[1] || '');
      try {
        const parsed = new URL(url, 'https://html.duckduckgo.com');
        const target = parsed.searchParams.get('uddg');
        url = target ? decodeURIComponent(target) : parsed.toString();
        const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
        if (!(host === domain || host.endsWith(`.${domain}`))) continue;
      } catch { continue; }
      if (seen.has(url)) continue;
      seen.add(url);
      results.push({ url, title: decodeXml(String(match[2] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()), description: '' });
    }
  }));
  return results.slice(0, MAX_SEARCH_RESULTS);
}

async function directScrape(url: string): Promise<{ metadata?: Record<string, any>; markdown?: string; product?: any }> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; HUMIDOR price scanner)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!response.ok) throw new Error(`Direct page fetch failed (${response.status})`);
  const html = await response.text();
  return {
    metadata: { title: html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '' },
    markdown: html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim(),
  };
}

async function firecrawlScrape(apiKey: string, url: string): Promise<any> {
  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'product'],
      onlyMainContent: true,
      location: { country: 'GB', languages: ['en-GB'] },
    }),
  });
  if (!response.ok) throw new Error(`Firecrawl scrape failed (${response.status})`);
  const payload: any = await response.json();
  return payload?.data || {};
}

function buildQuote(
  result: any,
  requested: RetailerScanCigar,
  productData: any,
  title: string,
  markdown: string,
): Record<string, any> | undefined {
  const price = structuredPrice(productData?.product, requested).price ??
    extractPounds(`${title} ${markdown}`, `${requested.brand} ${requested.name}`);
  if (!price) return undefined;

  let url = String(result?.url || '');
  try {
    if (new URL(url).protocol !== 'https:') return undefined;
  } catch {
    return undefined;
  }

  if (!exactProductMatch(title, url, requested.brand, requested.name, requested.vitola, requested.line, requested.variant, requested.packageType, requested.boxCount, markdown)) {
    return undefined;
  }

  const hostname = new URL(url).hostname;
  const vendor = retailerForHost(hostname) ||
    String(result?.metadata?.siteName || result?.metadata?.source || title.split('|')[0] || hostname).trim();

  if (!vendor || /amazon|ebay|facebook|reddit|youtube|wikipedia/i.test(vendor + ' ' + url)) return undefined;

  return {
    vendor,
    price: Math.round(price * 100) / 100,
    currency: '£',
    inStock: productData?.product?.availability
      ? !/out of stock|unavailable|sold out/i.test(String(productData.product.availability))
      : !/out of stock|unavailable|sold out/i.test(markdown),
    url,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

async function scanOnce(apiKey: string, cigar: RetailerScanCigar): Promise<RetailerScanResult> {
  const label = `${cigar.brand} ${identityName(cigar)} ${cigar.vitola || ''}`.trim();
  const query = `${cigar.brand} ${identityName(cigar)} ${cigar.vitola || ''} cigar UK price GBP`.replace(/\s+/g, ' ').trim();

  let rawResults: any[] = [];
  let quotes: Record<string, any>[] = [];
  let provider: 'firecrawl' | 'direct-web' = 'direct-web';

  if (apiKey) {
    try {
      rawResults = await firecrawlSearch(apiKey, query, RETAILER_DOMAINS);
      quotes = await collectQuotes(apiKey, cigar, rawResults);
      provider = 'firecrawl';
    } catch (error: any) {
      console.warn(`Firecrawl unavailable for ${label}: ${String(error?.message || error)}; using direct web search.`);
    }
  }

  if (!quotes.length) {
    try {
      rawResults = await directWebSearch(query);
      quotes = await collectQuotes('', cigar, rawResults, true);
      provider = 'direct-web';
      console.log(`[price-scan] ${label}: direct search results=${rawResults.length}, verified quotes=${quotes.length}`);
      if (!quotes.length && rawResults.length) {
        console.log(`[price-scan] ${label}: candidates=${rawResults.slice(0, 5).map((item: any) => String(item?.title || item?.url || '')).join(' | ')}`);
      }
    } catch (error: any) {
      console.warn(`Direct web fallback unavailable for ${label}: ${String(error?.message || error)}`);
    }
  }

  const deduped = Array.from(new Map(quotes.map((quote) => [quote.url, quote])).values());
  const best = deduped.reduce<Record<string, any> | undefined>(
    (current, quote) => !current || quote.price < current.price ? quote : current,
    undefined,
  );

  return {
    id: cigar.id,
    brand: cigar.brand,
    name: cigar.name,
    quotes: deduped,
    bestPrice: best?.price ?? null,
    bestVendor: best?.vendor ?? null,
    grounded: deduped.length > 0,
    provider,
    groundedSources: deduped.map((quote) => ({ title: `${cigar.brand} ${cigar.name}`, uri: quote.url })),
    scanStatus: deduped.length ? 'verified' : 'no_verified_results',
  };
}

async function collectQuotes(apiKey: string, cigar: RetailerScanCigar, results: any[], allowDirectScrape = false): Promise<Record<string, any>[]> {
  const candidates: Array<{ result: any; title: string; markdown: string; product: any }> = [];
  const seen = new Set<string>();

  for (const result of results) {
    const url = typeof result?.url === 'string' ? result.url : '';
    if (!url.startsWith('https://') || seen.has(url)) continue;
    let parsed: URL;
    try { parsed = new URL(url); } catch { continue; }

    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const title = String(result?.title || result?.metadata?.title || url);
    const markdown = String(result?.markdown || result?.metadata?.description || result?.description || '');
    const knownRetailer = Boolean(retailerForHost(host));
    const looksLikeRetailer = host.endsWith('.co.uk') || host.endsWith('.uk') ||
      /cigar|cigars|tobacco|tobacconist|smoke|humidor/i.test(`${host} ${title}`);

    if (!knownRetailer && !looksLikeRetailer) continue;
    // Search results often omit the vitola or package in their title. Use a
    // broad identity gate here, then verify the full variant/vitola/package after
    // fetching the actual retailer page.
    if (!retailerListingMatches(title, url, cigar.brand, cigar.name, undefined, cigar.line, cigar.variant, undefined, undefined, markdown)) continue;

    candidates.push({ result, title, markdown, product: result?.product || result?.data?.product });
    seen.add(url);
  }

  const priorityTokens = meaningfulTokens(
    `${cigar.brand} ${cigar.name} ${cigar.line || ''} ${cigar.variant || ''} ${cigar.vitola || ''}`,
  ).filter((token) => token.length >= 4);

  const candidateScore = (candidate: { result: any; title: string; markdown: string; product: any }): number => {
    const text = compact(`${candidate.title} ${candidate.result?.url || ''} ${candidate.markdown}`);
    return priorityTokens.reduce((score, token) => {
      const compactToken = compact(token);
      if (!compactToken) return score;
      if (text.includes(compactToken)) return score + 3;
      if (text.split(/[^a-z0-9]+/).some((part: string) => part.startsWith(compactToken.slice(0, Math.min(6, compactToken.length))))) {
        return score + 1;
      }
      return score;
    }, 0);
  };

  candidates.sort((a, b) => candidateScore(b) - candidateScore(a));

  const quotes: Record<string, any>[] = [];
  const selectedCandidates = candidates.slice(0, MAX_PAGE_SCRAPES);
  const scrapeConcurrency = Math.min(6, selectedCandidates.length);
  let nextCandidate = 0;

  async function processCandidate(): Promise<Record<string, any> | undefined> {
    while (true) {
      const candidate = selectedCandidates[nextCandidate++];
      if (!candidate) return undefined;
    let productData: {
      product: any;
      metadata?: Record<string, any>;
      markdown?: string;
      provider?: string;
    } = { product: candidate.product, provider: allowDirectScrape ? 'direct-web' : 'firecrawl' };
    let title = candidate.title;
    let markdown = candidate.markdown;

    if (!structuredPrice(candidate.product, cigar).price) {
      try {
        productData = allowDirectScrape
          ? { ...(await directScrape(String(candidate.result.url))), provider: 'direct-web' }
          : { ...(await firecrawlScrape(apiKey, String(candidate.result.url))), provider: 'firecrawl' };
        title = String(productData?.metadata?.title || productData?.product?.title || title);
        markdown = String(productData?.markdown || markdown);
      } catch {
        // Search result data is still usable if it contained a price.
      }
    }

    if (!exactProductMatch(title, String(candidate.result.url), cigar.brand, cigar.name, cigar.vitola, cigar.line, cigar.variant, cigar.packageType, cigar.boxCount, markdown)) continue;

    const quote = buildQuote(candidate.result, cigar, productData, title, markdown);
    return quote;
    }
  }

  const processed = await Promise.all(Array.from({ length: scrapeConcurrency }, () => processCandidate()));
  quotes.push(...processed.filter((quote): quote is Record<string, any> => Boolean(quote)));

  return quotes;
}

export async function scanRetailerPrice(cigar: RetailerScanCigar, apiKey = process.env.FIRECRAWL_API_KEY || ''): Promise<RetailerScanResult> {
  return scanOnce(apiKey, cigar);
}

export async function scanRetailerPrices(
  cigars: RetailerScanCigar[],
  options: { concurrency?: number; apiKey?: string } = {},
): Promise<RetailerScanResult[]> {
  const apiKey = options.apiKey || process.env.FIRECRAWL_API_KEY || '';

  const unique = Array.from(
    new Map(
      cigars.map((cigar) => [
        `${normalize(cigar.brand)}|${normalize(cigar.name)}|${normalize(cigar.line)}|${normalize(cigar.variant)}|${normalize(cigar.vitola)}|${normalize(cigar.packageType)}|${cigar.boxCount || ''}`,
        cigar,
      ]),
    ).values(),
  );

  const results: RetailerScanResult[] = new Array(unique.length);
  let nextIndex = 0;
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 6, 6));

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= unique.length) return;
      try {
        results[index] = await scanOnce(apiKey, unique[index]);
      } catch (error: any) {
        results[index] = {
          id: unique[index].id,
          brand: unique[index].brand,
          name: unique[index].name,
          quotes: [],
          bestPrice: null,
          bestVendor: null,
          grounded: false,
          provider: 'direct-web',
          scanStatus: `scan_error: ${String(error?.message || error).slice(0, 180)}`,
        };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, worker));
  return results;
}
