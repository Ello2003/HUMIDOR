import { apiUrl } from './api';

export type RetailerPricePayload = {
  id?: string;
  brand: string;
  name?: string;
  line?: string;
  variant?: string;
  vitola?: string;
  countryOrigin?: string;
  isCuban?: boolean;
};

type StaticPriceResult = {
  id: string;
  brand: string;
  name: string;
  quotes: Array<Record<string, any>>;
  bestPrice: number | null;
  bestVendor: string | null;
  grounded: boolean;
  provider?: string;
  groundedSources?: Array<{ title: string; uri: string }>;
  scanStatus?: string;
};

type StaticPriceData = {
  generatedAt: string;
  source: string;
  results: StaticPriceResult[];
};

function normalize(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matches(payload: RetailerPricePayload, result: StaticPriceResult): boolean {
  if (payload.id && result.id === payload.id) return true;
  const brand = normalize(payload.brand);
  const resultBrand = normalize(result.brand);
  const requestedName = normalize(payload.name || payload.line || payload.variant);
  const resultName = normalize(result.name);
  if (!brand || !requestedName) return false;
  return brand === resultBrand && (requestedName === resultName || resultName.includes(requestedName) || requestedName.includes(resultName));
}

async function loadStaticPrices(): Promise<StaticPriceData> {
  const base = String(import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  const response = await fetch(`${base}/data/retailer-prices.json?ts=${Date.now()}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Static retailer price data unavailable (${response.status})`);
  return response.json();
}

async function apiRequest(path: string, payload: unknown): Promise<any> {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data?.success) {
    throw new Error(data?.error || data?.message || `Retailer scan failed (${response.status})`);
  }
  return data;
}

export async function scanRetailerPrices(payload: RetailerPricePayload): Promise<any> {
  if (import.meta.env.VITE_API_BASE_URL) {
    return apiRequest('/api/research/retailer-prices', payload);
  }

  const data = await loadStaticPrices();
  const result = data.results.find((candidate) => matches(payload, candidate));
  return {
    success: true,
    data: result ? { ...result, retailerQuotes: result.quotes } : {
      quotes: [],
      retailerQuotes: [],
      retailerQuotes: [],
      bestPrice: null,
      bestVendor: null,
      grounded: false,
      scanStatus: 'no_scheduled_result',
      pricingNotes: 'No scheduled GitHub Actions price result was found for this cigar.',
    },
    source: 'github-actions-static',
    generatedAt: data.generatedAt,
  };
}

export async function batchScanRetailerPrices(payload: { cigars: RetailerPricePayload[] }): Promise<any> {
  if (import.meta.env.VITE_API_BASE_URL) {
    return apiRequest('/api/research/batch-retailer-prices', payload);
  }

  const data = await loadStaticPrices();
  const results = payload.cigars.map((cigar) => {
    const result = data.results.find((candidate) => matches(cigar, candidate));
    return result || {
      id: cigar.id,
      brand: cigar.brand,
      name: cigar.name || cigar.line || '',
      quotes: [],
      bestPrice: null,
      bestVendor: null,
      grounded: false,
      scanStatus: 'no_scheduled_result',
    };
  });

  return {
    success: true,
    data: {
      scannedCount: results.length,
      groundedCount: results.filter((result) => result.grounded).length,
      results,
      generatedAt: data.generatedAt,
    },
    source: 'github-actions-static',
  };
}
