export type RetailerSource = {
  retailer: string;
  baseUrl: string;
  country: 'GB';
  enabled: boolean;
  productUrlPatterns: RegExp[];
  sitemapUrl?: string;
  apiUrl?: string;
  feedUrl?: string;
  discoveryPaths: string[];
  requestDelayMs: number;
  maxPagesPerScan: number;
  parserType: 'generic-product';
  termsUrl?: string;
  complianceStatus: 'review_required' | 'blocked_by_terms';
  lastScanTime?: string;
  lastScanStatus?: string;
  errorMessage?: string;
};

/**
 * Approved retailer allow-list for HUMIDOR.
 *
 * The scanner never discovers arbitrary domains. A source must be present here,
 * enabled, and pass robots.txt before a product page is fetched.
 *
 * Several retailers explicitly restrict creating a database from their site
 * content in their published website terms. Those sources are disabled until
 * written permission or a suitable feed/API is available.
 */
export const UK_RETAILER_SOURCES: RetailerSource[] = [
  { retailer: 'C.Gars Ltd', baseUrl: 'https://www.cgarsltd.co.uk', country: 'GB', enabled: false, productUrlPatterns: [/\/(?:product|cigar|padron|cigars?)\b/i], sitemapUrl: 'https://www.cgarsltd.co.uk/sitemap.xml', discoveryPaths: ['/cigars/', '/cigars'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', termsUrl: 'https://www.cgarsltd.co.uk/customer-service/terms.htm%26title%3DTerms%2Band%2BConditions', complianceStatus: 'blocked_by_terms', errorMessage: 'Disabled: published website terms prohibit creating a database from downloaded site material without permission.' },
  { retailer: 'Cuban Cigar Club', baseUrl: 'https://www.cubancigarclub.co.uk', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.cubancigarclub.co.uk/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: 'Havana House', baseUrl: 'https://www.havanahouse.co.uk', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.havanahouse.co.uk/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: 'Smoke King', baseUrl: 'https://www.smoke-king.co.uk', country: 'GB', enabled: true, productUrlPatterns: [/\/products\//i], sitemapUrl: 'https://www.smoke-king.co.uk/sitemap.xml', discoveryPaths: ['/collections/cigars', '/collections/all'], requestDelayMs: 1500, maxPagesPerScan: 30, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: 'Davidoff of London', baseUrl: 'https://www.davidofflondon.com', country: 'GB', enabled: true, productUrlPatterns: [/\/products?\//i], sitemapUrl: 'https://www.davidofflondon.com/sitemap.xml', discoveryPaths: ['/collections/cigars'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', termsUrl: 'https://www.davidofflondon.com/pages/terms-conditions', complianceStatus: 'review_required' },
  { retailer: 'James J. Fox (London)', baseUrl: 'https://www.jjfox.co.uk', country: 'GB', enabled: false, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.jjfox.co.uk/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', termsUrl: 'https://www.jjfox.co.uk/terms-conditions', complianceStatus: 'review_required', errorMessage: 'Disabled pending retailer permission/legal review of website-use restrictions.' },
  { retailer: 'Sautter Cigars (London)', baseUrl: 'https://www.sauttercigars.com', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.sauttercigars.com/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: 'Turmeaus Tobacconist', baseUrl: 'https://www.turmeaus.co.uk', country: 'GB', enabled: false, productUrlPatterns: [/\/.*-p-\d+\.html$/i], sitemapUrl: 'https://www.turmeaus.co.uk/sitemap.xml', discoveryPaths: ['/cigars'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', termsUrl: 'https://www.turmeaus.co.uk/customer-service/terms.htm', complianceStatus: 'blocked_by_terms', errorMessage: 'Disabled: published website terms prohibit creating a database from downloaded site material without permission.' },
  { retailer: 'Robert Graham 1874', baseUrl: 'https://robertgraham1874.com', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://robertgraham1874.com/sitemap.xml', discoveryPaths: ['/cigars', '/shop'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: 'GQ Tobaccos', baseUrl: 'https://www.gqtobaccos.com', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.gqtobaccos.com/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: "Aston's of Manchester", baseUrl: 'https://www.astonsofmanchester.co.uk', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.astonsofmanchester.co.uk/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: 'Arthur Fletcher', baseUrl: 'https://www.arthurfletcher.co.uk', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.arthurfletcher.co.uk/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: 'James Barber Tobacconist', baseUrl: 'https://www.jamesbarber.co.uk', country: 'GB', enabled: false, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.jamesbarber.co.uk/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 2000, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required', errorMessage: 'Disabled until robots.txt can be independently verified and retailer permission is confirmed.' },
  { retailer: 'Gauntleys', baseUrl: 'https://www.gauntleyscigars.com', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.gauntleyscigars.com/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: 'Simply Cigars', baseUrl: 'https://www.simplycigars.co.uk', country: 'GB', enabled: true, productUrlPatterns: [/\/.*\.html$/i, /\/product/i], sitemapUrl: 'https://www.simplycigars.co.uk/sitemap.xml', discoveryPaths: ['/simply-cigars-m-27.html', '/featured.php'], requestDelayMs: 1500, maxPagesPerScan: 30, parserType: 'generic-product', termsUrl: 'https://www.simplycigars.co.uk/our-terms-ip-11.html', complianceStatus: 'review_required' },
  { retailer: 'Fine Cigars Club', baseUrl: 'https://www.finecigarsclub.com', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.finecigarsclub.com/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: 'Cigar Nights', baseUrl: 'https://www.cigarnights.co.uk', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.cigarnights.co.uk/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', termsUrl: 'https://www.cigarnights.co.uk/terms/', complianceStatus: 'review_required' },
  { retailer: 'No.6 Cavendish', baseUrl: 'https://www.no6cavendish.com', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.no6cavendish.com/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: 'Hava Havana', baseUrl: 'https://www.havahavana.com', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.havahavana.com/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: 'The House of Cigars', baseUrl: 'https://www.thehouseofcigars.co.uk', country: 'GB', enabled: false, productUrlPatterns: [/\/product\//i], sitemapUrl: 'https://www.thehouseofcigars.co.uk/sitemap_index.xml', discoveryPaths: ['/shop/'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', termsUrl: 'https://www.thehouseofcigars.co.uk/terms-conditions/', complianceStatus: 'blocked_by_terms', errorMessage: 'Disabled: published website terms prohibit creating a database from downloaded site material without permission.' },
  { retailer: 'The Smoking Jacket', baseUrl: 'https://www.thesmokingjacket.co.uk', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.thesmokingjacket.co.uk/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: 'Toro Puro', baseUrl: 'https://www.toropuro.com', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.toropuro.com/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: 'Rebellion Cigars', baseUrl: 'https://www.rebellioncigars.com', country: 'GB', enabled: true, productUrlPatterns: [/\/product/i], sitemapUrl: 'https://www.rebellioncigars.com/sitemap.xml', discoveryPaths: ['/cigars', '/products'], requestDelayMs: 1500, maxPagesPerScan: 20, parserType: 'generic-product', complianceStatus: 'review_required' },
  { retailer: 'Surrey Cigars', baseUrl: 'https://www.surreycigars.com', country: 'GB', enabled: true, productUrlPatterns: [/\/products?\//i], sitemapUrl: 'https://www.surreycigars.com/sitemap.xml', discoveryPaths: ['/collections'], requestDelayMs: 1500, maxPagesPerScan: 30, parserType: 'generic-product', termsUrl: 'https://www.surreycigars.com/pages/terms-and-conditions', complianceStatus: 'review_required' },
  { retailer: 'UK Cigar Store', baseUrl: 'https://ukcigarstore.co.uk', country: 'GB', enabled: true, productUrlPatterns: [/\/products?\//i], sitemapUrl: 'https://ukcigarstore.co.uk/sitemap.xml', discoveryPaths: ['/collections/cigars', '/collections/all'], requestDelayMs: 1500, maxPagesPerScan: 30, parserType: 'generic-product', complianceStatus: 'review_required' },
];

export const ENABLED_UK_RETAILER_SOURCES = UK_RETAILER_SOURCES.filter((source) => source.enabled);

export const UK_RETAILER_CATALOG: Record<string, { domain: string }> = Object.fromEntries(
  UK_RETAILER_SOURCES.map((source) => [source.retailer, { domain: new URL(source.baseUrl).hostname }]),
);
