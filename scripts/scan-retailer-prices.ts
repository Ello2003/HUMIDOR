import { writeFile } from 'node:fs/promises';
import { INITIAL_RESEARCH_DATABASE } from '../src/data/cigarDatabase';
import { initialWishlist } from '../src/data/initialData';

const endpoint = process.env.PRICE_SCAN_ENDPOINT || 'http://127.0.0.1:3000/api/research/batch-retailer-prices';
const outputPath = 'data/retailer-prices.json';
const chunkSize = 25;

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

async function waitForServer() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await fetch('http://127.0.0.1:3000/api/health');
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('Local scanner server did not become ready.');
}

async function scanChunk(chunk: any[]) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cigars: chunk }),
  });
  const data: any = await response.json();
  if (!response.ok || !data?.success || !Array.isArray(data?.data?.results)) {
    throw new Error(data?.error || `Batch scanner failed with HTTP ${response.status}`);
  }
  return data.data.results;
}

await waitForServer();

const results: any[] = [];
for (let offset = 0; offset < cigars.length; offset += chunkSize) {
  const chunk = cigars.slice(offset, offset + chunkSize);
  console.log(`Scanning ${offset + 1}-${Math.min(offset + chunkSize, cigars.length)} of ${cigars.length}...`);
  results.push(...await scanChunk(chunk));
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'github-actions-firecrawl',
  scannedCount: cigars.length,
  groundedCount: results.filter((result) => result?.grounded && Array.isArray(result?.quotes) && result.quotes.length > 0).length,
  results,
};

await writeFile(outputPath, JSON.stringify(payload, null, 2) + '\\n', 'utf8');
console.log(`Wrote ${results.length} scan results to ${outputPath}.`);
