import { describe, expect, it } from 'vitest';
import { areCigarsMatching, estimateAccurateSmokeTime, resolveVitolaDetails, suggestVitolaDimensions } from './researchUtils';

describe('vitola and import enrichment', () => {
  it('does not match the same line across different vitolas', () => {
    expect(
      areCigarsMatching(
        { brand: 'Padron', line: '1964 Anniversary', vitola: 'Robusto' },
        { brand: 'Padron', line: '1964 Anniversary', vitola: 'Toro' }
      )
    ).toBe(false);
  });

  it('resolves common spelling variants such as pyramide', () => {
    expect(suggestVitolaDimensions('Pyramide')).toEqual({ lengthInches: 6.1, ringGauge: 52 });
  });

  it('fills missing dimensions from the named vitola instead of generic defaults', () => {
    expect(resolveVitolaDetails({ vitola: 'Petit Corona' })).toEqual({
      vitola: 'Petit Corona',
      lengthInches: 4.5,
      ringGauge: 42,
      source: 'vitola-standard',
    });
  });

  it('keeps valid product dimensions supplied by a retailer or manufacturer', () => {
    expect(resolveVitolaDetails({ vitola: 'Robusto', lengthInches: 4.88, ringGauge: 50 })).toEqual({
      vitola: 'Robusto',
      lengthInches: 4.88,
      ringGauge: 50,
      source: 'provided',
    });
  });

  it('uses resolved size and named cigar identity for smoke-time estimation', () => {
    const dimensions = resolveVitolaDetails({ vitola: 'Double Corona' });
    const result = estimateAccurateSmokeTime({
      brand: 'Hoyo de Monterrey',
      name: 'Double Corona',
      vitola: dimensions.vitola,
      lengthInches: dimensions.lengthInches,
      ringGauge: dimensions.ringGauge,
    });
    expect(result.minutes).toBeGreaterThanOrEqual(90);
    expect(result.range).toContain('min');
  });
});
