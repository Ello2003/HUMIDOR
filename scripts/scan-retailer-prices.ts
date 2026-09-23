import { writeFile } from 'node:fs/promises';
import { INITIAL_RESEARCH_DATABASE } from '../src/data/cigarDatabase';
import { initialWishlist } from '../src/data/initialData';
import { scanRetailerPrices } from '../src/utils/firecrawlRetailerScanner';

const outputPath = 'data/retailer-prices.json';

const args = new Set(process.argv.slice(2));
const retailerArgIndex = process.argv.indexOf('--retailer');
const retailer = retailerArgIndex >= 0 ? process.argv[retailerArgIndex + 1] : undefined;
const dryRun = args.has('--dry-run');

if (retailerArgIndex >= 0 && (!retailer || retailer.startsWith('--'))) {
  throw new Error('--retailer requires an enabled retailer name.');
}

const researchCigars = INITIAL_RESEARCH_DATABASE.map((cigar) => ({
  id: cigar.id,
  brand: cigar.brand,
  name: cigar.line,
  line: cigar.line,
  vitola: cigar.vitola,
  countryOrigin: cigar.countryOrigin,
  isCuban: cigar.isCuban,
}));

const wishlistCigars = initialWishlist.map((item) => ({
  id: item.id,
  brand: item.brand,
  name: item.name,
  line: item.name,
  vitola: item.vitola,
}));

const byId = new Map<string, any>();
for (const cigar of [...researchCigars, ...wishlistCigars]) byId.set(cigar.id, cigar);
const cigars = [...byId.values()];

console.log(`Preparing a UK retailer product scan for ${cigars.length} cigars (retailer sitemaps/catalogues; optional Firecrawl discovery)...`);
if (retailer) console.log(`Retailer filter: ${retailer}`);
if (dryRun) console.log('Dry run: generated data will not be written.');

const results = await scanRetailerPrices(cigars, {
  concurrency: Number(process.env.PRICE_SCAN_CONCURRENCY) || 2,
  ...(retailer ? { retailers: [retailer] } : {}),
});

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'github-actions-retailer-scan',
  scannedCount: cigars.length,
  groundedCount: results.filter((result) => result.grounded && result.quotes.length > 0).length,
  results,
};

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  await writeFile(outputPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${results.length} scan results to ${outputPath}.`);
}
