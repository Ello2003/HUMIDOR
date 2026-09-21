export interface GroundedSource {
  title?: string;
  uri?: string;
}

export interface GroundedQuoteInput {
  vendor?: unknown;
  price?: unknown;
  inStock?: unknown;
  boxPrice?: unknown;
  boxCount?: unknown;
  packageType?: unknown;
}

export interface ValidatedGroundedQuote {
  vendor: string;
  price: number;
  currency: '£';
  inStock: boolean;
  packageType?: string;
  boxPrice?: number;
  boxCount?: number;
  url: string;
  lastUpdated: string;
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const RETAILER_ALIASES: Record<string, string[]> = {
  'James J. Fox (London)': ['jj fox', 'james j fox', 'james james fox'],
  'C.Gars Ltd': ['cgars', 'c gars', 'c gars ltd'],
  'Davidoff of London': ['davidoff london', 'davidoff of london'],
  'Sautter Cigars (London)': ['sautter', 'sautter london'],
  'Turmeaus Tobacconist': ['turmeaus'],
};

function hostForUrl(uri: string): string | undefined {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'https:' || url.username || url.password) return undefined;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (!host || host === 'localhost' || host.endsWith('.local')) return undefined;
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return undefined;
    return host;
  } catch {
    return undefined;
  }
}

function hostMatchesDomain(host: string, domain: string): boolean {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
  return host === normalizedDomain || host.endsWith(`.${normalizedDomain}`);
}

export function selectGroundedRetailerSource(
  vendor: string,
  sources: GroundedSource[],
  retailerDomains: Record<string, string | { domain: string }>,
): { vendor: string; url: string } | undefined {
  const vendorToken = normalizeToken(vendor);
  const entries = Object.entries(retailerDomains).map(([name, value]) => [
    name,
    typeof value === 'string' ? value : value.domain,
  ] as [string, string]);
  const vendorEntry = entries.find(([name]) => {
    const nameToken = normalizeToken(name);
    const aliases = RETAILER_ALIASES[name] || [];
    return nameToken === vendorToken || nameToken.includes(vendorToken) || vendorToken.includes(nameToken) ||
      aliases.some((alias) => normalizeToken(alias) === vendorToken);
  });

  const candidates = sources
    .map((source) => ({ source, host: source.uri ? hostForUrl(source.uri) : undefined }))
    .filter((item): item is { source: GroundedSource & { uri: string }; host: string } => Boolean(item.host && item.source.uri));

  const matching = vendorEntry
    ? candidates.filter(({ host }) => hostMatchesDomain(host, vendorEntry[1]))
    : candidates.filter(({ source, host }) => {
        // Previously this branch ALSO required the source's host to match
        // one of the pre-defined catalog domains -- meaning a genuinely
        // found, legitimate retailer that simply isn't one of the ~15
        // shops in UK_RETAILER_CATALOG (e.g. a New World specialist not
        // yet added to the list) had its result silently discarded here,
        // even though the live search correctly found it. The catalog is
        // for enriching *known* retailers with confidence, not for
        // gatekeeping which real retailers are allowed to exist. Any real
        // https source whose title/URL actually mentions this vendor name
        // is accepted.
        const sourceText = normalizeToken(`${source.title || ''} ${source.uri || ''}`);
        return sourceText.includes(vendorToken) || (host && normalizeToken(host).includes(vendorToken));
      });

  const selected = matching[0];
  if (!selected) return undefined;
  return { vendor: vendorEntry?.[0] || vendor.trim(), url: selected.source.uri };
}

export function validateGroundedQuote(
  quote: GroundedQuoteInput,
  sources: GroundedSource[],
  retailerDomains: Record<string, string | { domain: string }>,
  today = new Date().toISOString().split('T')[0],
): ValidatedGroundedQuote | undefined {
  const vendor = typeof quote.vendor === 'string' ? quote.vendor.trim().slice(0, 120) : '';
  const price = Number(quote.price);
  if (!vendor || !Number.isFinite(price) || price <= 0 || price >= 2000) return undefined;

  const source = selectGroundedRetailerSource(vendor, sources, retailerDomains);
  if (!source) return undefined;

  const result: ValidatedGroundedQuote = {
    vendor: source.vendor,
    price: Math.round(price * 100) / 100,
    currency: '£',
    inStock: quote.inStock !== false,
    url: source.url,
    lastUpdated: today,
  };

  const packageType = typeof quote.packageType === 'string' ? quote.packageType.trim().slice(0, 80) : '';
  if (packageType) result.packageType = packageType;

  const boxPrice = Number(quote.boxPrice);
  const boxCount = Number(quote.boxCount);
  if (Number.isFinite(boxPrice) && boxPrice > 0 && boxPrice < 50000) result.boxPrice = Math.round(boxPrice * 100) / 100;
  if (Number.isInteger(boxCount) && boxCount >= 2 && boxCount <= 1000) result.boxCount = boxCount;
  return result;
}

export function validateGroundedQuotes(
  quotes: GroundedQuoteInput[],
  sources: GroundedSource[],
  retailerDomains: Record<string, string | { domain: string }>,
  today?: string,
): ValidatedGroundedQuote[] {
  if (!Array.isArray(quotes)) return [];
  return quotes
    .map((quote) => validateGroundedQuote(quote, sources, retailerDomains, today))
    .filter((quote): quote is ValidatedGroundedQuote => Boolean(quote));
}
