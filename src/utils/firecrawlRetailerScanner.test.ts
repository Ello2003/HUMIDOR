import { describe, expect, it } from 'vitest';
import { buildQuote, extractPounds, retailerListingMatches } from './firecrawlRetailerScanner';

describe('retailerListingMatches', () => {
  it('matches retailer naming with Casa Carrillo prefix and Sojourn naming', () => {
    expect(retailerListingMatches(
      'Casa Carrillo by E.P. Carrillo Pledge Sojourn Cigar - 1 Single',
      'https://www.turmeaus.co.uk/casa-carrillo-carrillo-pledge-sojourn-cigar-single-p-47850.html',
      'E.P. Carrillo',
      'Pledge',
      'Sojourner (Box-Pressed Toro)',
    )).toBe(true);
  });

  it('does not assign Pledge Prequel to the Sojourner cigar', () => {
    expect(retailerListingMatches(
      'Casa Carrillo by E.P. Carrillo Pledge Prequel Cigar - 1 Single',
      'https://www.turmeaus.co.uk/casa-carrillo-carrillo-pledge-prequel-cigar-single-p-47849.html',
      'E.P. Carrillo',
      'Pledge',
      'Sojourner (Box-Pressed Toro)',
    )).toBe(false);
  });

  it('matches Padron family listings while respecting the requested size', () => {
    expect(retailerListingMatches(
      'Padron 1964 Anniversary Series Torpedo Maduro Cigar - 1 Single',
      'https://www.turmeaus.co.uk/padron-1964-anniversary-series-torpedo-maduro-cigar-single-p-12345.html',
      'Padrón',
      '1964 Anniversary Series',
      'Torpedo',
    )).toBe(true);
  });

  it('keeps a single listing when the title explicitly says single even if the URL contains box wording', () => {
    expect(retailerListingMatches(
      'Arturo Fuente Don Carlos No. 2 Cigar - 1 Single',
      'https://example.co.uk/box/arturo-fuente-don-carlos-no-2-cigar-single',
      'Arturo Fuente',
      'Don Carlos',
      'No. 2',
    )).toBe(true);
  });

  it('does not merge Davidoff Toro into the Churchill canonical record', () => {
    expect(retailerListingMatches(
      'Davidoff Winston Churchill The Late Hour Toro Cigar - Single',
      'https://www.smoke-king.co.uk/products/davidoff-winston-churchill-the-late-hour-toro-cigar-single',
      'Davidoff',
      'Winston Churchill Late Hour',
      'Churchill',
    )).toBe(false);
  });

  it('does not merge Cohiba Behike 54 into the BHK 52 canonical record', () => {
    expect(retailerListingMatches(
      'Cohiba Behike 54 Cuban Cigar Single',
      'https://www.smoke-king.co.uk/products/cohiba-behike-54-cuban-cigar-single',
      'Cohiba',
      'Behike',
      'BHK 52 (Petit Robusto)',
    )).toBe(false);
  });

  it('matches the Behike 52 listing to the BHK 52 canonical record', () => {
    expect(retailerListingMatches(
      'Cohiba Behike 52 Cuban Cigar Single',
      'https://www.smoke-king.co.uk/products/cohiba-behike-52-cuban-cigar-single',
      'Cohiba',
      'Behike',
      'BHK 52 (Petit Robusto)',
    )).toBe(true);
  });
  it('does not merge Padron 1964 Anniversary Torpedo Natural into Maduro', () => {
    expect(retailerListingMatches(
      'Padron 1964 Anniversary Series Torpedo Natural Cigar - 1 Single',
      'https://www.example.co.uk/padron-1964-anniversary-series-torpedo-natural-single',
      'Padrón',
      '1964 Anniversary Series',
      'Torpedo Maduro',
    )).toBe(false);
  });

  it('extracts the exact product price instead of a nearby related cigar price', () => {
    expect(extractPounds(
      'Padrón 1964 Anniversary Series Torpedo Maduro Cigar - 1 Single £47.50 Padron 2000 Robusto Cigar - 1 Single £10.00',
      'Padrón 1964 Anniversary Series Torpedo Maduro Cigar - 1 Single',
    )).toBe(47.5);
  });

  it('does not accept a page price when the exact product label is absent', () => {
    expect(extractPounds(
      'Padrón 1964 Anniversary Series Torpedo Natural Cigar - 1 Single £47.50 Related cigar £10.00',
      'Padrón 1964 Anniversary Series Torpedo Maduro Cigar - 1 Single',
    )).toBeUndefined();
  });

});


describe('buildQuote', () => {
  const requested = {
    id: 'res-padron-1964-torpedo-maduro',
    brand: 'Padrón',
    name: '1964 Anniversary Series',
    vitola: 'Torpedo Maduro',
    packageType: 'Single',
  };

  it('accepts the exact matching JSON-LD product when another Product object is present first', () => {
    const quote = buildQuote(
      { url: 'https://ukcigarstore.co.uk/products/padron-1964-anniversary-series-torpedo-maduro' },
      requested,
      {
        metadata: { title: 'Padrón 1964 Anniversary Series Torpedo Maduro' },
        markdown: 'Padrón 1964 Anniversary Series Torpedo Maduro 6 x 52 £21.15',
        products: [
          { name: 'Padrón 1964 Anniversary Series Torpedo Natural', offers: { price: '21.15', priceCurrency: 'GBP' } },
          {
            name: 'Padrón 1964 Anniversary Series Torpedo Maduro',
            sku: 'P64-TM-1',
            offers: { price: '21.15', priceCurrency: 'GBP', availability: 'https://schema.org/InStock' },
          },
        ],
      },
      'Padrón 1964 Anniversary Series Torpedo Maduro',
      'Padrón 1964 Anniversary Series Torpedo Maduro 6 x 52 £21.15',
    );
    expect(quote?.price).toBe(21.15);
    expect(quote?.sourceProductId).toBe('P64-TM-1');
    expect(quote?.matchingStatus).toBe('matched');
    expect(quote?.rawData?.evidenceType).toBe('json-ld-product');
  });

  it('rejects a related product price when the exact JSON-LD product is absent', () => {
    const quote = buildQuote(
      { url: 'https://www.cgarsltd.co.uk/padron-a-726.html' },
      requested,
      {
        metadata: { title: 'Padrón 1964 Anniversary Series' },
        markdown: 'Padrón 1964 Anniversary Series Natural £10.00',
        products: [
          { name: 'Padrón 1964 Anniversary Series Natural', offers: { price: '10.00', priceCurrency: 'GBP' } },
        ],
      },
      'Padrón 1964 Anniversary Series',
      'Padrón 1964 Anniversary Series Natural £10.00',
    );
    expect(quote).toBeUndefined();
  });

  it('accepts exact visible product context when structured data is unavailable', () => {
    const quote = buildQuote(
      { url: 'https://ukcigarstore.co.uk/products/padron-1964-anniversary-series-torpedo-maduro' },
      requested,
      {
        metadata: {
          title: 'Padrón 1964 Anniversary Series Torpedo Maduro',
          h1: 'Padrón 1964 Anniversary Series Torpedo Maduro',
          meta: {},
        },
        markdown: 'Padrón 1964 Anniversary Series Torpedo Maduro 6 x 52 £21.15 In stock',
        products: [],
      },
      'Padrón 1964 Anniversary Series Torpedo Maduro',
      'Padrón 1964 Anniversary Series Torpedo Maduro 6 x 52 £21.15 In stock',
    );
    expect(quote?.price).toBe(21.15);
    expect(quote?.confidenceScore).toBe(0.94);
  });
});
