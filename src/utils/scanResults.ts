import { VendorPriceEntry } from '../types';

const toText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const normalizeScanResults = (scan: any): any[] => {
  if (!scan) return [];
  if (Array.isArray(scan)) return scan;

  const candidates = [
    scan.retailerQuotes,
    scan.quotes,
    scan.results,
    scan.data?.retailerQuotes,
    scan.data?.quotes,
    scan.data?.results,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

export async function loadScanResults(): Promise<any> {
  try {
    const response = await fetch('/api/research/retailer-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return { retailerQuotes: [], quotes: [], results: [] };
    }

    const data = await response.json();
    return data?.data ?? data ?? { retailerQuotes: [], quotes: [], results: [] };
  } catch {
    return { retailerQuotes: [], quotes: [], results: [] };
  }
}

export function findQuotes(
  scan: any,
  criteria: { brand?: string; line?: string; vitola?: string }
): VendorPriceEntry[] {
  const candidates = normalizeScanResults(scan) as Array<Record<string, any>>;
  const brand = toText(criteria.brand).toLowerCase();
  const line = toText(criteria.line).toLowerCase();
  const vitola = toText(criteria.vitola).toLowerCase();

  return candidates.filter((entry) => {
    const entryBrand = toText(entry.brand || entry.vendor || entry.itemBrand || '').toLowerCase();
    const entryLine = toText(entry.name || entry.line || entry.itemName || '').toLowerCase();
    const entryVitola = toText(entry.vitola || entry.size || '').toLowerCase();

    const matchesBrand = !brand || entryBrand.includes(brand) || entryBrand === brand;
    const matchesLine = !line || entryLine.includes(line) || entryLine === line;
    const matchesVitola = !vitola || entryVitola.includes(vitola) || entryVitola === vitola;

    return matchesBrand && matchesLine && matchesVitola;
  }) as VendorPriceEntry[];
}

export function findBatchQuotes(
  scan: any,
  items: Array<{ id: string; brand?: string; line?: string; vitola?: string }>
): Array<{ id: string; quotes: VendorPriceEntry[] }> {
  return items.map((item) => ({
    id: item.id,
    quotes: findQuotes(scan, {
      brand: item.brand,
      line: item.line,
      vitola: item.vitola,
    }),
  }));
}

export function scanHealthNote(scan: any): string {
  const allQuotes = normalizeScanResults(scan);
  const count = allQuotes.length;

  if (count === 0) {
    return 'Scanned sources returned no verified prices.';
  }

  return `Scan included ${count} potential quote${count === 1 ? '' : 's'} for review.`;
}
