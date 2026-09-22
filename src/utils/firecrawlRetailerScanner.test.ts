import { describe, expect, it } from 'vitest';
import { retailerListingMatches } from './firecrawlRetailerScanner';

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
});
