export type SupportedCurrency = '£' | '$' | '€';

export const DEFAULT_CURRENCY: SupportedCurrency = '£';

/**
 * Formats a monetary amount into a clean currency string.
 * Defaults to British Pound (£ / GBP).
 */
export function formatCurrency(
  amount: number | string | undefined | null,
  currencySymbol: string = DEFAULT_CURRENCY
): string {
  if (amount === undefined || amount === null || amount === '') {
    return '—';
  }
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) {
    return '—';
  }
  return `${currencySymbol}${numericAmount.toFixed(2)}`;
}

/**
 * Normalizes price range strings into British Pound format if requested.
 */
export function formatPriceRange(
  rangeStr: string | undefined,
  currencySymbol: string = DEFAULT_CURRENCY
): string {
  if (!rangeStr) return '—';
  // If already formatted with the target currency symbol, return it
  if (rangeStr.startsWith(currencySymbol)) return rangeStr;
  // Replace standard $ with target currency symbol
  return rangeStr.replace(/\$/g, currencySymbol);
}
