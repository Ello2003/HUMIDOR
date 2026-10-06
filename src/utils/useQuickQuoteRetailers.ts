import { useState, useCallback } from 'react';
import { DEFAULT_QUICK_QUOTE_RETAILERS } from '../data/retailers';
import { STORAGE_KEYS } from './storageKeys';

/**
 * The user-customizable list of "quick quote" retailer shortcut tags shown
 * when adding a price to a cigar (Humidor, Wishlist, Research Hub cards).
 *
 * This list and its load/save/add/remove logic used to be hand-copied into
 * three different components against the same localStorage key, with each
 * copy behaving slightly differently (e.g. only one of the three compared
 * new tags case-insensitively before adding). This hook is the one place
 * that reads, persists, and mutates that list now.
 */
export function useQuickQuoteRetailers() {
  const [tags, setTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.cigarQuickQuoteRetailers);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Corrupt or inaccessible storage -- fall through to the default list.
    }
    return DEFAULT_QUICK_QUOTE_RETAILERS;
  });

  const persist = useCallback((next: string[]) => {
    setTags(next);
    try {
      localStorage.setItem(STORAGE_KEYS.cigarQuickQuoteRetailers, JSON.stringify(next));
    } catch {
      // Best-effort persistence; the in-memory list still updates.
    }
  }, []);

  const addTag = useCallback((rawTag: string): string | null => {
    const trimmed = rawTag.trim();
    if (!trimmed) return null;
    setTags((current) => {
      if (current.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return current;
      const next = [...current, trimmed];
      try {
        localStorage.setItem(STORAGE_KEYS.cigarQuickQuoteRetailers, JSON.stringify(next));
      } catch {
        // Best-effort persistence; the in-memory list still updates.
      }
      return next;
    });
    return trimmed;
  }, []);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags((current) => {
      const next = current.filter((t) => t !== tagToRemove);
      try {
        localStorage.setItem(STORAGE_KEYS.cigarQuickQuoteRetailers, JSON.stringify(next));
      } catch {
        // Best-effort persistence; the in-memory list still updates.
      }
      return next;
    });
  }, []);

  return { tags, setTags: persist, addTag, removeTag };
}
