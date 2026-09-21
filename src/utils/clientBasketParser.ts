import { ExtractedBasketItem, ShoppingBasketExtractResult, StrengthRating } from '../types';

const KNOWN_BRANDS = [
  'Montecristo', 'Cohiba', 'Partagás', 'Partagas', 'Ramón Allones', 'Ramon Allones',
  'Romeo y Julieta', 'Hoyo de Monterrey', 'H. Upmann', 'Bolivar', 'Trinidad',
  'Padrón', 'Padron', 'Arturo Fuente', 'Davidoff', 'Plasencia', 'Oliva', 'Punch',
  'San Cristóbal', 'Quai d\'Orsay', 'Drew Estate', 'My Father', 'Tatuaje',
  'Ashton', 'Alec Bradley', 'Rocky Patel', 'Camacho', 'Joya de Nicaragua',
];
const VITOLAS = 'cigarillo|petit corona|corona gorda|double corona|short robusto|robusto|churchill|toro|gordo|torpedo|belicoso|lancero|panetela|perla|minutos|lonsdale|corona|no\.\s*[1-5]';

function text(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function numberFrom(value: unknown): number | undefined {
  const number = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(number) ? number : undefined;
}

function firstNumber(input: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const match = input.match(pattern);
    const value = match?.[1] ? numberFrom(match[1]) : undefined;
    if (value !== undefined) return value;
  }
  return undefined;
}

function retailerName(sourceUrl?: string, fallback?: string): string {
  if (fallback?.trim()) return fallback.trim();
  try {
    const host = new URL(sourceUrl || '').hostname.toLowerCase();
    if (host.includes('simplycigars')) return 'Simply Cigars (UK)';
    if (host.includes('cgars')) return 'C.Gars Ltd (UK)';
    if (host.includes('havanahouse')) return 'Havana House (UK)';
    if (host.includes('jjfox')) return 'James J. Fox (London)';
    if (host.includes('sautter')) return 'Sautter Cigars (London)';
    return host.replace(/^www\./, '') || 'Retailer';
  } catch {
    return 'Retailer';
  }
}

function brandAndName(productName: string, description: string): { brand: string; name: string } {
  const combined = `${productName} ${description}`;
  const brand = KNOWN_BRANDS.find((candidate) => new RegExp(`\\b${candidate.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&')}\\b`, 'i').test(combined)) || productName.split(/\s+/)[0] || 'Unknown Brand';
  const name = productName.replace(new RegExp(`^${brand}\\s*[-–|]?\\s*`, 'i'), '').trim() || productName;
  return { brand, name };
}

function parseItem(productName: string, description: string, offer: any, vendor: string, sourceUrl?: string, quantity = 1): ExtractedBasketItem {
  const cleanName = text(productName) || 'Cigar';
  const details = text(`${description} ${cleanName}`);
  const { brand, name } = brandAndName(cleanName, details);
  const lengthInches = firstNumber(details, [/length\s*:?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:inch|in|\")?/i, /([0-9]+(?:\.[0-9]+)?)\s*\"/i]);
  const ringGauge = firstNumber(details, [/ring\s*gauge\s*:?\s*([0-9]{2})/i, /\b([2-7][0-9])\s*rg\b/i]);
  const smokingMinutes = firstNumber(details, [/smoking\s*time\s*:?\s*([0-9]+)\s*minutes?/i, /smoke\s*time\s*:?\s*([0-9]+)\s*minutes?/i]);
  const price = numberFrom(offer?.price ?? offer?.lowPrice) ?? firstNumber(details, [/£\s*([0-9]+(?:\.[0-9]{1,2})?)/i, /GBP\s*([0-9]+(?:\.[0-9]{1,2})?)/i]);
  const vitola = details.match(new RegExp(`\\b(${VITOLAS})\\b`, 'i'))?.[1] || 'Unknown';
  const isCuban = /\b(cuba|cuban|havana|habano)\b/i.test(details);
  const strength = (details.match(/\b(mild-medium|medium-full|full-bodied|mild|medium|full)\b/i)?.[1] || 'Medium') as StrengthRating;
  const countryOrigin = /nicaragua/i.test(details) ? 'Nicaragua' : /dominican/i.test(details) ? 'Dominican Republic' : /honduras/i.test(details) ? 'Honduras' : isCuban ? 'Cuba' : 'Unknown';
  const wrapper = details.match(/wrapper\s*:?\s*([^|,;]+)/i)?.[1]?.trim() || (isCuban ? 'Cuban Habano' : 'Unknown');
  const binder = details.match(/binder\s*:?\s*([^|,;]+)/i)?.[1]?.trim();
  const filler = details.match(/filler\s*:?\s*([^|,;]+)/i)?.[1]?.trim();
  const currency = String(offer?.priceCurrency || '').toUpperCase() === 'GBP' || /£|GBP/i.test(details) ? '£' : String(offer?.priceCurrency || '£');
  const totalPrice = price !== undefined ? Math.round(price * quantity * 100) / 100 : undefined;
  return {
    brand,
    name,
    line: name,
    vitola,
    lengthInches,
    ringGauge,
    smokeTimeMinutes: smokingMinutes,
    countryOrigin,
    wrapper,
    binder,
    filler,
    strength,
    quantity,
    purchasePrice: price,
    totalPrice,
    currency,
    vendor,
    notes: details.slice(0, 1200),
    flavorTags: [],
    idealRestMonths: isCuban ? 12 : 6,
    isCuban,
    selected: true,
  };
}

function productsFromJsonLd(document: Document): any[] {
  const entries: any[] = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
    try {
      const value = JSON.parse(script.textContent || '');
      const values = Array.isArray(value) ? value : [value];
      for (const entry of values) {
        if (String(entry?.['@type'] || '').toLowerCase() === 'product') entries.push(entry);
        if (Array.isArray(entry?.['@graph'])) entries.push(...entry['@graph'].filter((node: any) => String(node?.['@type'] || '').toLowerCase() === 'product'));
      }
    } catch {
      // Ignore malformed third-party JSON-LD and continue with table/text parsing.
    }
  });
  return entries;
}

export function extractClientBasketFromHtml(html: string, sourceUrl?: string, fallbackVendor?: string): ShoppingBasketExtractResult {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const vendor = retailerName(sourceUrl, fallbackVendor);
  const products = productsFromJsonLd(document);
  if (products.length > 0) {
    const items = products.slice(0, 25).map((product) => parseItem(
      text(product.name),
      text(product.description || document.body?.textContent),
      Array.isArray(product.offers) ? product.offers[0] : product.offers,
      vendor,
      sourceUrl,
    ));
    const total = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    return { vendorName: vendor, basketTotal: total || undefined, currency: '£', itemCount: items.length, items, notes: 'Imported locally from Product JSON-LD in the pasted HTML.' };
  }

  const rows = Array.from(document.querySelectorAll('tr')).map((row) => text(row.textContent)).filter((row) => row.length > 3);
  const candidates = rows.length > 0 ? rows : [text(document.body?.textContent)];
  const items: ExtractedBasketItem[] = [];
  for (const candidate of candidates) {
    const brand = KNOWN_BRANDS.find((name) => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&')}\\b`, 'i').test(candidate));
    if (!brand) continue;
    const quantity = Math.max(1, Math.round(firstNumber(candidate, [/\b(?:qty|quantity)\s*:?\s*([0-9]+)/i, /\bx\s*([0-9]+)/i]) || 1));
    const name = candidate.replace(/\s+/g, ' ').trim();
    items.push(parseItem(name, candidate, undefined, vendor, sourceUrl, quantity));
    if (items.length >= 25) break;
  }
  if (items.length === 0) {
    const bodyText = text(document.body?.textContent);
    if (!bodyText) throw new Error('No readable HTML content was found.');
    items.push(parseItem(bodyText.slice(0, 240), bodyText, undefined, vendor, sourceUrl));
  }
  const total = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  return { vendorName: vendor, basketTotal: total || undefined, currency: '£', itemCount: items.reduce((sum, item) => sum + item.quantity, 0), items, notes: 'Imported locally from pasted HTML.' };
}
