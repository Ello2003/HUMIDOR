import { describe, it, expect } from 'vitest';
import { deduplicateHumidorCigars } from './humidorUtils';
import { Cigar, Humidor } from '../types';

const humidor: Humidor = {
  id: 'hum-1',
  name: 'Main Cabinet',
  location: 'Study',
  type: 'Aging Cabinet',
  currentHumidity: 70,
  targetHumidity: 70,
  currentTemp: 68,
  targetTemp: 68,
  tempUnit: 'F',
  maxCapacity: 100,
  bovedaPackType: '69% 60g x 2',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function makeCigar(overrides: Partial<Cigar> = {}): Cigar {
  return {
    id: 'cigar-1',
    name: 'Robusto',
    brand: 'Padron',
    line: '1964 Anniversary',
    vitola: 'Robusto',
    wrapper: 'Maduro',
    countryOrigin: 'Nicaragua',
    strength: 'Full',
    quantity: 5,
    humidorId: 'hum-1',
    purchaseDate: '2026-01-01T00:00:00.000Z',
    currency: '£',
    targetRestMonths: 6,
    isFavorite: false,
    status: 'resting',
    flavorTags: ['Cedar', 'Cocoa'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('deduplicateHumidorCigars', () => {
  it('leaves non-duplicate cigars untouched', () => {
    const cigars = [
      makeCigar({ id: 'a', brand: 'Padron' }),
      makeCigar({ id: 'b', brand: 'Arturo Fuente', line: 'Hemingway' }),
    ];
    const result = deduplicateHumidorCigars(cigars, [humidor]);
    expect(result.mergedCount).toBe(0);
    expect(result.cleanedCigars).toHaveLength(2);
  });

  it('merges two entries of the same cigar in the same humidor and sums quantity', () => {
    const cigars = [
      makeCigar({ id: 'a', quantity: 5 }),
      makeCigar({ id: 'b', quantity: 3 }),
    ];
    const result = deduplicateHumidorCigars(cigars, [humidor]);
    expect(result.mergedCount).toBe(1);
    expect(result.cleanedCigars).toHaveLength(1);
    expect(result.cleanedCigars[0].quantity).toBe(8);
  });

  it('does NOT merge the same cigar sitting in two different humidors', () => {
    const cigars = [
      makeCigar({ id: 'a', humidorId: 'hum-1' }),
      makeCigar({ id: 'b', humidorId: 'hum-2' }),
    ];
    const result = deduplicateHumidorCigars(cigars, [humidor]);
    expect(result.mergedCount).toBe(0);
  });

  it('combines notes from both entries without duplicating identical text', () => {
    const cigars = [
      makeCigar({ id: 'a', notes: 'Aging nicely' }),
      makeCigar({ id: 'b', notes: 'Aging nicely' }),
    ];
    const result = deduplicateHumidorCigars(cigars, [humidor]);
    expect(result.cleanedCigars[0].notes).toBe('Aging nicely');
  });

  it('combines distinct notes from both entries with a separator', () => {
    const cigars = [
      makeCigar({ id: 'a', notes: 'Box code ABC123' }),
      makeCigar({ id: 'b', notes: 'Gift from a friend' }),
    ];
    const result = deduplicateHumidorCigars(cigars, [humidor]);
    expect(result.cleanedCigars[0].notes).toBe('Box code ABC123 | Gift from a friend');
  });

  it('preserves favorite status if either merged entry was a favorite', () => {
    const cigars = [
      makeCigar({ id: 'a', isFavorite: false }),
      makeCigar({ id: 'b', isFavorite: true }),
    ];
    const result = deduplicateHumidorCigars(cigars, [humidor]);
    expect(result.cleanedCigars[0].isFavorite).toBe(true);
  });

  it('keeps the higher personal rating between merged entries', () => {
    const cigars = [
      makeCigar({ id: 'a', personalRating: 70 }),
      makeCigar({ id: 'b', personalRating: 95 }),
    ];
    const result = deduplicateHumidorCigars(cigars, [humidor]);
    expect(result.cleanedCigars[0].personalRating).toBe(95);
  });

  it('unions flavor tags without duplicates', () => {
    const cigars = [
      makeCigar({ id: 'a', flavorTags: ['Cedar', 'Cocoa'] }),
      makeCigar({ id: 'b', flavorTags: ['Cocoa', 'Pepper'] }),
    ];
    const result = deduplicateHumidorCigars(cigars, [humidor]);
    expect(result.cleanedCigars[0].flavorTags.sort()).toEqual(['Cedar', 'Cocoa', 'Pepper'].sort());
  });
});
