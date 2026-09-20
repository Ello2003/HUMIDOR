import { VendorPriceEntry } from '../types';

export type PriceCurrency = '£' | '$' | '€' | 'CHF' | string;

export function normalizeCurrency(currency?: string): PriceCurrency {
  const value = (currency || '£').trim().toUpperCase();
  if (value === 'GBP' || value === 'POUND' || value === 'POUNDS') return '£';
  if (value === 'USD' || value === 'DOLLAR' || value === 'DOLLARS') return '$';
  if (value === 'EUR' || value === 'EURO' || value === 'EUROS') return '€';
  if (value === 'SWISS FRANC' || value === 'SWISS FRANCS') return 'CHF';
  return currency?.trim() || '£';
}

export function packageQuantity(packageType?: string): number {
  const text = (packageType || 'Single').toLowerCase();
  const match = text.match(/(?:box|pack|qty|quantity|of)\s*(?:of\s*)?(\d+)/i) || text.match(/(\d+)\s*(?:pack|box|sticks?)/i);
  const quantity = match ? Number(match[1]) : 1;
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

export function unitPrice(quote: Pick<VendorPriceEntry, 'price' | 'packageType'>): number {
  const price = Number(quote.price);
  return Number.isFinite(price) && price > 0 ? price / packageQuantity(quote.packageType) : NaN;
}

export function comparableQuotes(quotes: VendorPriceEntry[], preferredCurrency?: string): VendorPriceEntry[] {
  const valid = quotes.filter((quote) => Number.isFinite(Number(quote.price)) && Number(quote.price) > 0);
  if (valid.length === 0) return [];
  const currency = normalizeCurrency(preferredCurrency || valid[0].currency);
  const sameCurrency = valid.filter((quote) => normalizeCurrency(quote.currency) === currency);
  const pool = sameCurrency.length > 0 ? sameCurrency : valid.filter((quote) => normalizeCurrency(quote.currency) === normalizeCurrency(valid[0].currency));
  const quantities = new Set(pool.map((quote) => packageQuantity(quote.packageType)));
  if (quantities.size <= 1) return pool;
  const singleOrLowestQuantity = Math.min(...Array.from(quantities));
  return pool.filter((quote) => packageQuantity(quote.packageType) === singleOrLowestQuantity);
}

export function bestComparableQuote(quotes: VendorPriceEntry[], preferredCurrency?: string): VendorPriceEntry | undefined {
  return comparableQuotes(quotes, preferredCurrency).sort((a, b) => unitPrice(a) - unitPrice(b))[0];
}
