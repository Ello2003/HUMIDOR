import { describe, expect, it } from 'vitest';
import { buildQuote, extractPounds, extractVitolaModelName, retailerListingMatches } from './firecrawlRetailerScanner';

describe('extractVitolaModelName', () => {
  it('extracts the model/size name that precedes a parenthetical generic shape', () => {
    expect(extractVitolaModelName('Serie D No. 4 (Robusto)')).toBe('Serie D No. 4');
    expect(extractVitolaModelName('BHK 52 (Petit Robusto)')).toBe('BHK 52');
    expect(extractVitolaModelName('PerfecXion X (Toro)')).toBe('PerfecXion X');
  });

  it('returns undefined for a plain vitola with no parenthetical', () => {
    expect(extractVitolaModelName('Churchill')).toBeUndefined();
    expect(extractVitolaModelName(undefined)).toBeUndefined();
  });
});

describe('retailerListingMatches', () => {
  it('matches a Cuban classic using the vitola-derived model name, not a generic line label', () => {
    // Regression test for the "Partagás Serie D No. 4" bug: the database's
    // `line` field for this cigar is the generic "Serie Line", which never
    // appears in any real retailer title. The actual scan input must use
    // the model name extracted from the vitola field (see
    // extractVitolaModelName) for matching to succeed.
    expect(retailerListingMatches(
      'Partagas Serie D No.4 Cuban Cigar - Single',
      'https://www.smoke-king.co.uk/products/partagas-serie-d-no-4-cuban-cigar',
      'Partagás',
      extractVitolaModelName('Serie D No. 4 (Robusto)')!,
      'Serie D No. 4 (Robusto)',
    )).toBe(true);

    // The bare `line` label alone is exactly the failure mode being fixed:
    // it should NOT be relied on as the sole name for matching.
    expect(retailerListingMatches(
      'Partagas Serie D No.4 Cuban Cigar - Single',
      'https://www.smoke-king.co.uk/products/partagas-serie-d-no-4-cuban-cigar',
      'Partagás',
      'Serie Line',
      'Serie D No. 4 (Robusto)',
    )).toBe(false);
  });

  it('matches via the variant alias when name/line are both the generic database label', () => {
    // This mirrors the actual scan script's cigar shape after the fix:
    // name/line stay as the generic "Serie Line" (so client-side lookups by
    // name are unaffected), while the real model name rides along in
    // `variant` purely to help retailer-page matching.
    expect(retailerListingMatches(
      'Partagas Serie D No.4 Cuban Cigar - Single',
      'https://www.smoke-king.co.uk/products/partagas-serie-d-no-4-cuban-cigar',
      'Partagás',
      'Serie Line',
      'Serie D No. 4 (Robusto)',
      'Serie Line',
      extractVitolaModelName('Serie D No. 4 (Robusto)'),
    )).toBe(true);
  });

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

  it('finds the price near a later repeat of the title when the first mention (e.g. a breadcrumb) has no nearby price', () => {
    const title = 'Padron 1964 Anniversary Series Torpedo Maduro Cigar - Box of 20';
    const page = [
      title, // meta/breadcrumb mention, no price anywhere nearby
      'x'.repeat(400),
      'Ordering Order Online or by Phone: 0345 604 0044 Free UK Shipping',
      'x'.repeat(400),
      `1 Single Box of 20 Buy and earn 940 points. ${title} £940.00 Quantity:`,
    ].join(' ');
    expect(extractPounds(page, title)).toBe(940);
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

  it('rejects a generic brand or series page even when it contains a matching-series price', () => {
    const quote = buildQuote(
      { url: 'https://www.cgarsltd.co.uk/padron-a-726.html' },
      requested,
      {
        metadata: {
          title: 'Padrón 1964 Anniversary Series',
          h1: 'Padrón 1964 Anniversary Series',
          meta: {},
        },
        markdown: 'Padrón 1964 Anniversary Series £10.00 Padrón Torpedo Maduro £47.50',
        products: [],
      },
      'Padrón 1964 Anniversary Series',
      'Padrón 1964 Anniversary Series £10.00 Padrón Torpedo Maduro £47.50',
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

  it('reads the price from a description meta tag on legacy cart platforms with no JSON-LD or price meta (e.g. C.Gars Ltd)', () => {
    const title = 'Padron 1964 Anniversary Series Torpedo Maduro Cigar - Box of 20';
    const requestedBox = { ...requested, packageType: 'Box', boxCount: 20 };
    const quote = buildQuote(
      { url: 'https://www.cgarsltd.co.uk/padron-1964-anniversary-series-torpedo-maduro-cigar-box-p-56378.html' },
      requestedBox,
      {
        metadata: {
          title,
          h1: title,
          meta: {
            'og:title': title,
            'twitter:title': title,
            'twitter:description': 'Price: £940.00 - Length: 6 Ring Gauge: 52 Packaging: Box of 20 Founded in 1964...',
          },
        },
        // No £ amount anywhere near the repeated title mentions in the body copy.
        markdown: `${title} ${title} Ordering Order Online or by Phone: 0345 604 0044`,
        products: [],
      },
      title,
      `${title} ${title} Ordering Order Online or by Phone: 0345 604 0044`,
    );
    expect(quote?.price).toBe(940);
    expect(quote?.rawData?.evidenceType).toBe('product-meta-or-visible');
  });
});
