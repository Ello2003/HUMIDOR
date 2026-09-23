import { ENABLED_UK_RETAILER_SOURCES, UK_RETAILER_CATALOG } from './retailerSources';

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

const RETAILER_DOMAINS = ENABLED_UK_RETAILER_SOURCES.map((source) => new URL(source.baseUrl).hostname.replace(/^www\./, ''));

const MAX_SEARCH_RESULTS = 200;
const MAX_PAGE_SCRAPES = 36;

function extractSmokeTimeMinutes(text: string): number | undefined {
  const normalized = normalize(text);
  const range = normalized.match(/(?:enjoyment|smoke|smoking|burn)[^\d]{0,40}(\d{1,3})\s*(?:-|to|–|—)\s*(\d{1,3})\s*(?:min|mins|minutes)\b/i);
  if (range) return Math.round((Number(range[1]) + Number(range[2])) / 2);
  const single = normalized.match(/(?:enjoyment|smoke|smoking|burn)[^\d]{0,40}(\d{1,3})\s*(?:min|mins|minutes)\b/i);
  return single ? Number(single[1]) : undefined;
}

function extractStrength(text: string): string | undefined {
  const match = text.match(/\bstrength\s*[:|-]?\s*(\d\s*\/\s*5|(?:mild|medium|full|strong|mild to medium|medium to full|full bodied))\b/i);
  return match ? match[1].replace(/\s+/g, ' ').trim() : undefined;
}

function extractRetailerRating(text: string): { rating?: number; scale?: number } {
  for (const pattern of [
    /(?:rating|rated|score|review score)\s*[:|-]?\s*(\d{1,3})(?:\s*\/\s*(\d{1,3}))?/i,
    /\b(\d{1,3})\s*\/\s*(\d{1,3})\s*(?:rating|score)\b/i,
  ]) {
    const match = text.match(pattern);
    if (!match) continue;
    const rating = Number(match[1]);
    const scale = match[2] ? Number(match[2]) : undefined;
    if (!Number.isFinite(rating) || rating <= 0 || rating > 100) continue;
    return { rating, scale };
  }
  return {};
}


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

function vitolaNames(text: string): string[] {
  const normalized = normalize(text).replace(/[–—/|,()[\]{}:+]/g, ' ');
  return VITOLA_NAMES.filter((name) => normalized.includes(name))
    .sort((a, b) => b.length - a.length);
}

function vitolaRingGauge(text: string): number | undefined {
  const normalized = normalize(text);
  const match = normalized.match(/\b(?:bhk|behike)\s*(?:no\.?\s*)?(\d{2})\b/i);
  return match ? Number(match[1]) : undefined;
}

function vitolaMatches(requestedVitola: string | undefined, identityText: string): boolean {
  if (!requestedVitola) return true;

  const requested = dimensions(requestedVitola);
  const found = dimensions(identityText);
  const requestedGauge = requested.ringGauge || vitolaRingGauge(requestedVitola);
  const foundGauge = found.ringGauge || vitolaRingGauge(identityText);

  if (requestedGauge && foundGauge && Math.abs(requestedGauge - foundGauge) > 1) return false;

  const requestedNames = vitolaNames(requestedVitola);
  const foundNames = vitolaNames(identityText);

  // Product titles can contain the line name as well as the actual vitola.
  // If another explicit vitola is present, do not merge it into this record.
  if (requestedNames.length && foundNames.length) {
    const requestedName = requestedNames[0];
    if (!foundNames.includes(requestedName)) return false;
    if (foundNames.some((name) => name !== requestedName)) return false;
  }

  if (requested.lengthMm && requested.ringGauge && found.lengthMm && found.ringGauge) {
    const dimensionsMatch = Math.abs(requested.lengthMm - found.lengthMm) <= 5 &&
      Math.abs(requested.ringGauge - found.ringGauge) <= 1;
    if (dimensionsMatch) return true;
    if (requestedNames.length && foundNames.length) return requestedNames[0] === foundNames[0];
    return false;
  }

  if (requestedNames.length && foundNames.length) return requestedNames[0] === foundNames[0];
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

export function extractPounds(text: string, label: string): number | undefined {
  const normalized = normalize(text);
  const normalizedLabel = normalize(label);
  if (!normalizedLabel) return undefined;

  const labelIndex = normalized.indexOf(normalizedLabel);
  if (labelIndex < 0) return undefined;

  // A price is only valid when it is tightly associated with the exact
  // matched product label. Never fall back to the first £ amount on a page:
  // retailer pages commonly contain prices for related cigars, bundles and
  // recommendations.
  const contextStart = Math.max(0, labelIndex - 90);
  const contextEnd = Math.min(normalized.length, labelIndex + normalizedLabel.length + 150);
  const context = normalized.slice(contextStart, contextEnd);
  const matches = [...context.matchAll(/(?:£|gbp\s*)([0-9]{1,4}(?:\.[0-9]{1,2})?)/gi)]
    .map((match) => ({ price: Number(match[1]), index: match.index ?? 0 }))
    .filter(({ price }) => Number.isFinite(price) && price >= 3 && price < 2000);

  if (!matches.length) return undefined;

  const labelOffset = labelIndex - contextStart;
  return matches
    .map((match) => ({ ...match, distance: Math.abs(match.index - labelOffset) }))
    .sort((a, b) => a.distance - b.distance)[0]?.price;
}

function structuredPrice(product: any, requested: RetailerScanCigar): {
  price?: number;
  inStock?: boolean;
  title?: string;
  sourceProductId?: string;
  sourceUpdatedAt?: string;
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
    sourceProductId: String(variant?.sku || variant?.id || product.sku || product.id || product.mpn || '') || undefined,
    sourceUpdatedAt: typeof product.updatedAt === 'string' ? product.updatedAt : undefined,
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
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function sitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc\\b[^>]*>([\\s\\S]*?)<\\/loc>/gi)]
    .map((match) => decodeXml(String(match[1] || '').trim()))
    .filter((url) => /^https?:\\/\\//i.test(url));
}

function sitemapIsIndex(xml: string): boolean {
  return /<sitemapindex\\b/i.test(xml) || /<sitemap\\b/i.test(xml.slice(0, 5000));
}

function sitemapUrlLooksRelevant(url: string, query: string): boolean {
  let decodedUrl = url;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch {
    // Keep the raw URL if it is not valid URI encoding.
  }

  const urlText = normalize(decodedUrl);
  const tokens = meaningfulTokens(query)
    .filter((token) => token.length >= 4)
    .filter((token) => !/^(cigar|price|prices|pounds|gbp|uk)$/i.test(token));

  if (!tokens.length) return true;

  const hits = tokens.filter((token) => urlText.includes(token));
  return hits.length >= Math.min(2, tokens.length);
}

function relevantUrlScore(url: string, query: string): number {
  if (!query) return 0;

  let decodedUrl = url;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch {
    // Keep the raw URL.
  }

  const text = normalize(decodedUrl);
  return meaningfulTokens(query)
    .filter((token) => token.length >= 4)
    .filter((token) => !/^(cigar|price|prices|pounds|gbp|uk)$/i.test(token))
    .reduce((score, token) => score + (text.includes(token) ? 1 : 0), 0);
}

async function retailerSitemapUrls(domain: string, query = ''): Promise<string[]> {
  const source = ENABLED_UK_RETAILER_SOURCES.find((candidate) =>
    new URL(candidate.baseUrl).hostname.replace(/^www\\./, '') === domain
  );
  if (!source) return [];

  const cached = sitemapCache.get(domain);
  const selectRelevant = (allUrls: string[]) => {
    const filtered = query
      ? allUrls.filter((url) => sitemapUrlLooksRelevant(url, query))
      : allUrls;

    return filtered
      .sort((a, b) => relevantUrlScore(b, query) - relevantUrlScore(a, query))
      .slice(0, source.maxPagesPerScan);
  };

  if (cached) return selectRelevant([...cached]);

  const sitemapCandidates = new Set<string>([
    source.sitemapUrl || `https://${domain}/sitemap.xml`,
    `https://${domain}/sitemap_index.xml`,
    `https://${domain}/wp-sitemap.xml`,
  ]);

  const robots = await getRobots(domain);
  for (const match of (robots || '').matchAll(/^\\s*sitemap:\\s*(https?:\\/\\/\\S+)/gim)) {
    sitemapCandidates.add(String(match[1]).trim());
  }

  const productUrls = new Set<string>();
  const pendingSitemaps = [...sitemapCandidates];
  const visitedSitemaps = new Set<string>();

  // Follow sitemap indexes recursively. Many retailers expose several
  // child sitemaps (products, categories, images, etc.), and the product
  // sitemap is not necessarily one of the first few entries.
  while (pendingSitemaps.length && visitedSitemaps.size < 60) {
    const sitemap = canonicalizeUrl(pendingSitemaps.shift() || '');
    if (!sitemap || visitedSitemaps.has(sitemap)) continue;
    visitedSitemaps.add(sitemap);

    const xml = await fetchText(sitemap, source.requestDelayMs);
    if (!xml) continue;

    const locs = sitemapLocs(xml);
    if (sitemapIsIndex(xml)) {
      for (const loc of locs) {
        if (visitedSitemaps.has(loc) || pendingSitemaps.includes(loc)) continue;
        pendingSitemaps.push(loc);
      }
      continue;
    }

    for (const loc of locs) {
      try {
        const parsed = new URL(loc);
        const host = parsed.hostname.toLowerCase().replace(/^www\\./, '');
        if (host === domain || host.endsWith(`.${domain}`)) {
          productUrls.add(canonicalizeUrl(loc));
        }
      } catch {
        // Ignore malformed sitemap entries.
      }
    }
  }

  const urls = Array.from(productUrls).filter((url) => {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase().replace(/^www\\./, '');
      if (!(host === domain || host.endsWith(`.${domain}`))) return false;
      return source.productUrlPatterns.length === 0 ||
        source.productUrlPatterns.some((pattern) => pattern.test(parsed.pathname));
    } catch {
      return false;
    }
  });

  // Cache the complete product URL set. Query filtering happens only after
  // the catalogue has been collected, so a sitemap filename or child-sitemap
  // name can never prevent an exact product URL from being considered.
  sitemapCache.set(domain, urls);

  // Category discovery remains a fallback for retailers whose sitemap does
  // not expose usable product URLs. It is limited to configured paths.
  const discovered = [...urls];
  for (const path of source.discoveryPaths) {
    if (discovered.length >= source.maxPagesPerScan * 3) break;

    const discoveryUrl = new URL(path, source.baseUrl).toString();
    const html = await fetchText(discoveryUrl, source.requestDelayMs);
    if (!html) continue;

    for (const match of html.matchAll(/<a\\b[^>]*href=[\\"']([^\"']+)[\\"'][^>]*>([\\s\\S]*?)<\\/a>/gi)) {
      let href = String(match[1] || '');
      try {
        href = canonicalizeUrl(new URL(href, source.baseUrl).toString());
      } catch {
        continue;
      }

      try {
        const parsed = new URL(href);
        const host = parsed.hostname.toLowerCase().replace(/^www\\./, '');
        if (!(host === domain || host.endsWith(`.${domain}`))) continue;
        if (source.productUrlPatterns.length &&
            !source.productUrlPatterns.some((pattern) => pattern.test(parsed.pathname))) continue;
      } catch {
        continue;
      }

      if (!discovered.includes(href)) discovered.push(href);
      if (discovered.length >= source.maxPagesPerScan * 3) break;
    }
  }

  // Include fallback-discovered URLs in the cache as well, then rank/filter
  // by product URL relevance for this particular cigar.
  const uniqueDiscovered = Array.from(new Set(discovered));
  sitemapCache.set(domain, uniqueDiscovered);
  return selectRelevant(uniqueDiscovered);
}

async function directWebSearch(query: string, domains = RETAILER_DOMAINS): Promise<any[]> {
  const results: any[] = [];
  const seen = new Set<string>();

  await Promise.all(domains.map(async (domain) => {
    const urls = await retailerSitemapUrls(domain, query);
    for (const url of urls) {
      const canonical = canonicalizeUrl(url);
      if (seen.has(canonical)) continue;
      seen.add(canonical);
      let pathname = canonical;
      try { pathname = decodeURIComponent(new URL(canonical).pathname); } catch {}
      const title = pathname.replace(/^\/+|^\/+$/g, '').replace(/[-_]+/g, ' ').replace(/\+/g, ' > ').trim();
      results.push({ url: canonical, title, description: '', discoverySource: 'retailer-sitemap-or-catalogue' });
    }
  }));

  const queryTokens = meaningfulTokens(query).filter((token) => token.length >= 4);
  results.sort((a, b) => {
    const score = (value: any) => {
      const text = normalize(String(value?.url || '') + ' ' + String(value?.title || ''));
      return queryTokens.reduce((total, token) => total + (text.includes(token) ? 1 : 0), 0);
    };
    return score(b) - score(a);
  });

  return results.slice(0, MAX_SEARCH_RESULTS);
}

async function directScrape(url: string): Promise<{ metadata?: Record<string, any>; markdown?: string; products?: any[]; rawHtml?: string }> {
  let domain = '';
  try { domain = new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { throw new Error('Invalid retailer URL'); }
  const source = ENABLED_UK_RETAILER_SOURCES.find((candidate) => new URL(candidate.baseUrl).hostname.replace(/^www\./, '') === domain);
  if (!source) throw new Error('Retailer is not in approved source allow-list');

  const robots = await getRobots(domain);
  if (!robotsAllows(robots, url)) throw new Error('Blocked by retailer robots.txt');

  const canonicalUrl = canonicalizeUrl(url);
  const response = await fetchWithRetry(canonicalUrl, {
    headers: {
      'User-Agent': 'HUMIDOR-product-scanner/1.0 (+personal-use)',
      Accept: 'text/html,application/xhtml+xml',
    },
  }, source.requestDelayMs);

  if (!response?.ok) throw new Error(`Direct page fetch failed (${response?.status || 'network'})`);

  const html = await response.text();
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '';
  const meta: Record<string, string> = {};
  const metaPatterns = [
    /<meta\b[^>]*(?:name|property|itemprop)=["']([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi,
    /<meta\b[^>]*content=["']([^"']*)["'][^>]*(?:name|property|itemprop)=["']([^"']+)["'][^>]*>/gi,
  ];
  for (const [index, pattern] of metaPatterns.entries()) {
    for (const match of html.matchAll(pattern)) {
      const key = index === 0 ? match[1] : match[2];
      const value = index === 0 ? match[2] : match[1];
      meta[String(key || '').toLowerCase()] = decodeXml(String(value || '').trim());
    }
  }

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();

  const products: any[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const roots = Array.isArray(parsed) ? parsed : [parsed];
      const values = [...roots];
      for (const value of roots) {
        if (value?.['@graph']) values.push(...(Array.isArray(value['@graph']) ? value['@graph'] : [value['@graph']]));
      }
      for (const value of values) {
        if (value?.['@type'] === 'Product' || (Array.isArray(value?.['@type']) && value['@type'].includes('Product'))) {
          products.push(value);
        }
      }
    } catch {}
  }

  return {
    metadata: {
      title: decodeXml(title.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()),
      h1: decodeXml(h1.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()),
      meta,
    },
    markdown: text,
    products,
    rawHtml: html,
  };
}

function isGenericRetailerPage(url: string): boolean {
  try {
    const path = normalize(new URL(url).pathname);
    return /\/(?:category|categories|collection|collections|brand|brands|search|advanced_search|search_result|catalog|shop)(?:\/|$)/i.test(path);
  } catch {
    return true;
  }
}

function hasSpecificProductEvidence(title: string, cigar: RetailerScanCigar): boolean {
  if (!title) return false;
  if (cigar.vitola) {
    const titleVitola = vitolaNames(title);
    const titleDimensions = dimensions(title);
    const requestedVitola = vitolaNames(cigar.vitola);
    const requestedDimensions = dimensions(cigar.vitola);
    const vitolaProvedByName = requestedVitola.length > 0 && titleVitola.includes(requestedVitola[0]);
    const vitolaProvedByDimensions =
      Boolean(requestedDimensions.lengthMm && requestedDimensions.ringGauge &&
        titleDimensions.lengthMm && titleDimensions.ringGauge &&
        Math.abs(requestedDimensions.lengthMm - titleDimensions.lengthMm) <= 5 &&
        Math.abs(requestedDimensions.ringGauge - titleDimensions.ringGauge) <= 1);
    if (!vitolaProvedByName && !vitolaProvedByDimensions) return false;
  }
  if (cigar.packageType || cigar.boxCount) {
    if (!packageMatches(title, '', cigar.packageType, cigar.boxCount)) return false;
  }
  return true;
}

function exactPageTitleMatches(title: string, cigar: RetailerScanCigar): boolean {
  return Boolean(title) && retailerListingMatches(
    title,
    '',
    cigar.brand,
    cigar.name,
    cigar.vitola,
    cigar.line,
    cigar.variant,
    cigar.packageType,
    cigar.boxCount,
  );
}

function jsonLdProductMatches(product: any, cigar: RetailerScanCigar): boolean {
  if (!product || typeof product !== 'object') return false;
  return retailerListingMatches(
    String(product.name || ''),
    '',
    cigar.brand,
    cigar.name,
    cigar.vitola,
    cigar.line,
    cigar.variant,
    cigar.packageType,
    cigar.boxCount,
    [product.description, product.sku, product.mpn].filter(Boolean).join(' '),
  );
}

function priceFromJsonLd(product: any, cigar: RetailerScanCigar): { price?: number; inStock?: boolean; title?: string; sourceProductId?: string; sourceUpdatedAt?: string } {
  if (!jsonLdProductMatches(product, cigar)) return {};
  const offers = Array.isArray(product.offers) ? product.offers : product.offers ? [product.offers] : [];
  for (const offer of offers) {
    const price = Number(offer?.price ?? offer?.priceSpecification?.price);
    const currency = String(offer?.priceCurrency ?? offer?.priceSpecification?.priceCurrency ?? '').toUpperCase();
    if (!Number.isFinite(price) || price < 3 || price >= 2000) continue;
    if (currency && currency !== 'GBP' && currency !== '£') continue;
    return {
      price,
      inStock: typeof offer?.availability === 'string'
        ? !/outofstock|soldout|unavailable/i.test(offer.availability)
        : undefined,
      title: String(product.name || ''),
      sourceProductId: String(product.sku || product.mpn || product.productID || '') || undefined,
      sourceUpdatedAt: typeof product.dateModified === 'string' ? product.dateModified : undefined,
    };
  }
  return {};
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

function metaPrice(page: any, requested: RetailerScanCigar): { price?: number; inStock?: boolean; title?: string; sourceProductId?: string } {
  const meta = page?.metadata?.meta || {};
  const title = String(meta['og:title'] || meta['twitter:title'] || meta['product:name'] || meta['itemprop:name'] || '');
  if (!title || !exactProductMatch(title, '', requested.brand, requested.name, requested.vitola, requested.line, requested.variant, requested.packageType, requested.boxCount)) return {};
  const rawPrice = meta['product:price:amount'] || meta['product:price'] || meta['price'] || meta['itemprop:price'];
  const price = Number(String(rawPrice || '').replace(/[^0-9.]/g, ''));
  const currency = String(meta['product:price:currency'] || meta['priceCurrency'] || meta['itemprop:pricecurrency'] || '').toUpperCase();
  if (!Number.isFinite(price) || price < 3 || price >= 2000) return {};
  if (currency && currency !== 'GBP' && currency !== '£') return {};
  const availability = String(meta['product:availability'] || meta['availability'] || '').toLowerCase();
  return { price, inStock: availability ? !/outofstock|soldout|unavailable/.test(availability) : undefined, title, sourceProductId: meta['product:id'] || meta['product:sku'] || meta['sku'] || undefined };
}

export function buildQuote(
  result: any,
  requested: RetailerScanCigar,
  productData: any,
  title: string,
  markdown: string,
): Record<string, any> | undefined {
  const url = String(result?.url || '');
  try {
    if (new URL(url).protocol !== 'https:') return undefined;
  } catch { return undefined; }

  if (isGenericRetailerPage(url)) return undefined;

  const products = Array.isArray(productData?.products) ? productData.products : [];
  let structured: { price?: number; inStock?: boolean; title?: string; sourceProductId?: string; sourceUpdatedAt?: string } = {};
  for (const product of products) {
    const candidate = priceFromJsonLd(product, requested);
    if (candidate.price !== undefined) { structured = candidate; break; }
  }

  if (!structured.price && productData?.product) {
    structured = structuredPrice(productData.product, requested);
  }

  if (!structured.price) structured = metaPrice(productData, requested);

  const pageTitle = String(productData?.metadata?.h1 || title || '');
  if (!structured.price && exactProductMatch(
    pageTitle, '', requested.brand, requested.name, requested.vitola,
    requested.line, requested.variant, requested.packageType, requested.boxCount
  ) && hasSpecificProductEvidence(pageTitle, requested)) {
    const visiblePrice = extractPounds(markdown, pageTitle);
    if (visiblePrice !== undefined) structured = { price: visiblePrice, title: pageTitle };
  }

  if (!structured.price) return undefined;

  const hostname = new URL(url).hostname;
  const vendor = retailerForHost(hostname);
  if (!vendor) return undefined;

  const matchedTitle = structured.title || pageTitle || title;
  const combined = matchedTitle;
  const dims = dimensions(combined);
  const productContext = markdown.slice(0, 5000);
  const smokeTimeMinutes = extractSmokeTimeMinutes(productContext);
  const strength = extractStrength(productContext);
  const rating = extractRetailerRating(productContext);
  const retailerVitola = vitolaName(combined);

  return {
    vendor,
    price: Math.round(structured.price * 100) / 100,
    currency: '£',
    inStock: structured.inStock ?? !/out of stock|unavailable|sold out/i.test(markdown),
    url: canonicalizeUrl(url),
    lastUpdated: new Date().toISOString().split('T')[0],
    sourceUpdatedAt: structured.sourceUpdatedAt || null,
    sourceProductId: structured.sourceProductId || null,
    productUrl: canonicalizeUrl(url),
    matchingStatus: 'matched',
    confidenceScore: products.length ? 0.99 : 0.94,
    rawData: {
      evidenceType: products.length ? 'json-ld-product' : productData?.metadata?.meta ? 'product-meta-or-visible' : 'visible-product-context',
      title: matchedTitle,
      sourceProductId: structured.sourceProductId || null,
      price: Math.round(structured.price * 100) / 100,
      currency: 'GBP',
      inStock: structured.inStock ?? null,
    },
    ...(retailerVitola ? { vitola: retailerVitola } : {}),
    ...(dims.lengthMm ? { lengthMm: Math.round(dims.lengthMm) } : {}),
    ...(dims.ringGauge ? { ringGauge: dims.ringGauge } : {}),
    ...(smokeTimeMinutes ? { smokeTimeMinutes } : {}),
    ...(strength ? { strength } : {}),
    ...(rating.rating ? { retailerRating: rating.rating } : {}),
    ...(rating.scale ? { retailerRatingScale: rating.scale } : {}),
  };
}

async function collectQuotes(_apiKey: string, cigar: RetailerScanCigar, results: any[], allowDirectScrape = true): Promise<Record<string, any>[]> {
  const candidates = results
    .filter((result) => typeof result?.url === 'string' && result.url.startsWith('https://'))
    .filter((result) => {
      try { return Boolean(retailerForHost(new URL(result.url).hostname)); } catch { return false; }
    })
    .filter((result) => !isGenericRetailerPage(String(result.url)));

  const quotes: Record<string, any>[] = [];
  const seen = new Set<string>();
  const cappedCandidates = candidates.slice(0, MAX_PAGE_SCRAPES);
  let next = 0;

  async function worker() {
    while (true) {
      const index = next++;
      if (index >= cappedCandidates.length) return;
      const candidate = cappedCandidates[index];
      if (!candidate) continue;
      const canonical = canonicalizeUrl(candidate.url);
      if (seen.has(canonical)) continue;
      seen.add(canonical);

      try {
        const page = allowDirectScrape
          ? await directScrape(canonical)
          : candidate;

        const pageTitle = String(page?.metadata?.title || candidate.title || '');
        const markdown = String(page?.markdown || '');
        const quote = buildQuote(
          { url: candidate.url },
          cigar,
          page,
          pageTitle,
          markdown,
        );
        if (quote) quotes.push(quote);
      } catch {
        // No exact structured product evidence = no quote.
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(8, candidates.length) }, worker));
  return quotes;
}

async function scanOnce(apiKey: string, cigar: RetailerScanCigar, retailerNames?: string[]): Promise<RetailerScanResult> {
  const selectedSources = retailerNames?.length
    ? ENABLED_UK_RETAILER_SOURCES.filter((source) => retailerNames.some((name) => normalize(name) === normalize(source.retailer)))
    : ENABLED_UK_RETAILER_SOURCES;
  const selectedDomains = selectedSources.map((source) => new URL(source.baseUrl).hostname.replace(/^www\./, ''));
  const query = [
    '"' + cigar.brand + '"',
    '"' + cigar.name + '"',
    cigar.line ? '"' + cigar.line + '"' : '',
    cigar.variant ? '"' + cigar.variant + '"' : '',
    cigar.vitola ? '"' + cigar.vitola + '"' : '',
    cigar.packageType ? '"' + cigar.packageType + '"' : '',
    'UK cigar price',
  ].filter(Boolean).join(' ');

  let rawResults: any[] = [];
  let quotes: Record<string, any>[] = [];
  let provider: 'firecrawl' | 'direct-web' = 'direct-web';

  if (apiKey) {
    try {
      rawResults = await firecrawlSearch(apiKey, query, selectedDomains);
      quotes = await collectQuotes(apiKey, cigar, rawResults, true);
      if (quotes.length) provider = 'firecrawl';
    } catch (error: any) {
      console.warn('Firecrawl unavailable for ' + cigar.brand + ' ' + cigar.name + ': ' + String(error?.message || error));
    }
  }

  if (!quotes.length) {
    try {
      rawResults = await directWebSearch(query, selectedDomains);
      quotes = await collectQuotes('', cigar, rawResults, true);
    } catch (error: any) {
      console.warn('Direct retailer sitemap scan unavailable for ' + cigar.brand + ' ' + cigar.name + ': ' + String(error?.message || error));
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
    groundedSources: deduped.map((quote) => ({ title: cigar.brand + ' ' + cigar.name, uri: quote.url })),
    scanStatus: deduped.length ? 'verified' : 'no_verified_results',
  };
}

export async function scanRetailerPrice(
  cigar: RetailerScanCigar,
  apiKey = process.env.FIRECRAWL_API_KEY || '',
  retailers?: string[],
): Promise<RetailerScanResult> {
  return scanOnce(apiKey, cigar, retailers);
}

export async function scanRetailerPrices(
  cigars: RetailerScanCigar[],
  options: { concurrency?: number; apiKey?: string; retailers?: string[] } = {},
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
        results[index] = await scanOnce(apiKey, unique[index], options.retailers);
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
