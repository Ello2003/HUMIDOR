/**
 * The retailers the scanner checks, and how.
 *
 * IMPORTANT: these base URLs and search paths are best guesses. They have
 * not been verified against the live sites. The first GitHub Action run is
 * the real test -- the "Retailer scan" panel in the app shows, per retailer,
 * whether it was reachable, blocked, or reachable-but-matched-nothing.
 * If a retailer fails, this file is the one place to fix it.
 *
 * `name` must match the vendor names the rest of the app uses
 * (see canonicalizeVendorName in src/utils/researchUtils.ts).
 */
export interface RetailerConfig {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  /** Why it's disabled, shown in the status panel. */
  disabledReason?: string;
  /**
   * 'auto' tries Shopify's predictive-search JSON first, then falls back to
   * parsing the HTML search page. Force 'shopify' or 'html' once you know.
   */
  strategy: 'auto' | 'shopify' | 'html';
  /** HTML search path; {q} is replaced with the URL-encoded query. */
  searchPath: string;
  /** Optional CSS selectors for the HTML fallback (defaults cover WooCommerce/Magento). */
  selectors?: { card: string; title: string; price: string; link: string };
}

export const RETAILERS: RetailerConfig[] = [
  { id: 'cgars', name: 'C.Gars Ltd', baseUrl: 'https://www.cgarsltd.co.uk', enabled: true, strategy: 'auto', searchPath: '/search?q={q}' },
  { id: 'havana-house', name: 'Havana House', baseUrl: 'https://www.havanahouse.co.uk', enabled: true, strategy: 'auto', searchPath: '/search?q={q}' },
  { id: 'smoke-king', name: 'Smoke King', baseUrl: 'https://www.smokeking.co.uk', enabled: true, strategy: 'auto', searchPath: '/search?q={q}' },
  { id: 'sautter', name: 'Sautter London', baseUrl: 'https://www.sautter.co.uk', enabled: true, strategy: 'auto', searchPath: '/search?q={q}' },
  { id: 'neptune', name: 'Neptune Cigars', baseUrl: 'https://www.neptunecigars.co.uk', enabled: true, strategy: 'auto', searchPath: '/?s={q}&post_type=product' },
  { id: 'jj-fox', name: 'JJ Fox', baseUrl: 'https://www.jjfox.co.uk', enabled: true, strategy: 'auto', searchPath: '/search?q={q}' },
  { id: 'davidoff-london', name: 'Davidoff London', baseUrl: 'https://www.davidoff.com', enabled: true, strategy: 'auto', searchPath: '/gb/en/search?q={q}' },
  {
    id: 'holts',
    name: "Holt's",
    baseUrl: 'https://www.holts.com',
    enabled: false,
    disabledReason: 'US retailer that prices in USD; the scanner only keeps GBP quotes.',
    strategy: 'auto',
    searchPath: '/search?q={q}',
  },
];
