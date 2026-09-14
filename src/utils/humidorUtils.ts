import { Cigar, Humidor, VendorPriceEntry, WishlistItem, CigarResearchItem } from '../types';
import {
  areCigarsMatching,
  mergeVendorPriceIntoCigar,
  recalculatePricesFromVendors,
  normalizeString,
  canonicalizeVendorName,
} from './researchUtils';

export interface HumidorDeduplicationResult {
  cleanedCigars: Cigar[];
  mergedCount: number;
  mergedDetails: Array<{
    keptName: string;
    humidorName: string;
    totalQuantity: number;
    combinedNotes?: string;
  }>;
}

/**
 * Deduplicate and merge cigars in the user's Humidor Vaults.
 * Groups by Humidor ID + Smart matching (brand aliases, line canonicalization, number formatting).
 * Combines quantities, preserves favorite status, personal ratings, box dates, vendor info, and notes.
 */
export function deduplicateHumidorCigars(
  cigars: Cigar[],
  humidors: Humidor[]
): HumidorDeduplicationResult {
  const humidorMap = new Map(humidors.map((h) => [h.id, h.name]));
  const cleaned: Cigar[] = [];
  let mergedCount = 0;
  const mergedDetails: HumidorDeduplicationResult['mergedDetails'] = [];

  for (const cigar of cigars) {
    // Look for matching existing entry in the same humidor
    const existingIndex = cleaned.findIndex((existing) => {
      // Must be in the same humidor
      if (existing.humidorId !== cigar.humidorId) return false;

      return areCigarsMatching(
        { brand: existing.brand, line: existing.line || existing.name, vitola: existing.vitola },
        { brand: cigar.brand, line: cigar.line || cigar.name, vitola: cigar.vitola }
      );
    });

    if (existingIndex >= 0) {
      // Merge into existing entry
      mergedCount++;
      const existing = cleaned[existingIndex];
      const combinedQuantity = (existing.quantity || 1) + (cigar.quantity || 1);

      // Combine notes without redundant duplication
      const existingNotes = (existing.notes || '').trim();
      const incomingNotes = (cigar.notes || '').trim();
      let combinedNotes = existingNotes;
      if (incomingNotes && incomingNotes !== existingNotes) {
        if (!existingNotes) {
          combinedNotes = incomingNotes;
        } else if (!existingNotes.includes(incomingNotes)) {
          combinedNotes = `${existingNotes} | ${incomingNotes}`;
        }
      }

      // Combine flavor tags
      const combinedFlavorTags = Array.from(
        new Set([...(existing.flavorTags || []), ...(cigar.flavorTags || [])])
      );

      // Combine and merge vendor prices
      const combinedVendorPrices: VendorPriceEntry[] = existing.vendorPrices ? [...existing.vendorPrices] : [];
      
      // Also include existing cigar's main vendor if not already in list
      if (existing.vendor && existing.purchasePrice && !combinedVendorPrices.some((v) => normalizeString(v.vendor) === normalizeString(existing.vendor!))) {
        combinedVendorPrices.push({
          id: `vp-${Date.now()}-ext`,
          vendor: canonicalizeVendorName(existing.vendor),
          price: existing.purchasePrice,
          currency: existing.currency || '£',
          inStock: true,
          recordedAt: existing.purchaseDate || new Date().toISOString(),
        });
      }

      // Add incoming cigar's vendor prices
      if (cigar.vendorPrices && cigar.vendorPrices.length > 0) {
        for (const vp of cigar.vendorPrices) {
          const cVendor = canonicalizeVendorName(vp.vendor);
          const idx = combinedVendorPrices.findIndex((cv) => normalizeString(cv.vendor) === normalizeString(cVendor));
          if (idx >= 0) {
            combinedVendorPrices[idx] = { ...vp, vendor: cVendor };
          } else {
            combinedVendorPrices.push({ ...vp, vendor: cVendor });
          }
        }
      } else if (cigar.vendor && cigar.purchasePrice) {
        const cVendor = canonicalizeVendorName(cigar.vendor);
        const idx = combinedVendorPrices.findIndex((cv) => normalizeString(cv.vendor) === normalizeString(cVendor));
        if (idx >= 0) {
          combinedVendorPrices[idx] = {
            id: combinedVendorPrices[idx].id,
            vendor: cVendor,
            price: cigar.purchasePrice,
            currency: cigar.currency || '£',
            inStock: true,
            recordedAt: cigar.purchaseDate || new Date().toISOString(),
          };
        } else {
          combinedVendorPrices.push({
            id: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            vendor: cVendor,
            price: cigar.purchasePrice,
            currency: cigar.currency || '£',
            inStock: true,
            recordedAt: cigar.purchaseDate || new Date().toISOString(),
          });
        }
      }

      // Sort vendor prices lowest first
      combinedVendorPrices.sort((a, b) => a.price - b.price);

      // Best purchase price from lowest vendor quote or incoming
      const bestPrice = combinedVendorPrices.length > 0
        ? combinedVendorPrices[0].price
        : (cigar.purchasePrice || existing.purchasePrice);

      const mergedCigar: Cigar = {
        ...existing,
        quantity: combinedQuantity,
        purchasePrice: bestPrice,
        vendorPrices: combinedVendorPrices.length > 0 ? combinedVendorPrices : existing.vendorPrices,
        isFavorite: existing.isFavorite || cigar.isFavorite,
        personalRating: Math.max(existing.personalRating || 0, cigar.personalRating || 0) || existing.personalRating || cigar.personalRating,
        notes: combinedNotes,
        flavorTags: combinedFlavorTags,
        boxDate: existing.boxDate || cigar.boxDate,
        boxCode: existing.boxCode || cigar.boxCode,
        vendor: combinedVendorPrices.length > 0 ? combinedVendorPrices[0].vendor : (existing.vendor || cigar.vendor),
        updatedAt: new Date().toISOString(),
      };

      cleaned[existingIndex] = mergedCigar;
      mergedDetails.push({
        keptName: `${mergedCigar.brand} ${mergedCigar.name}`,
        humidorName: humidorMap.get(mergedCigar.humidorId) || 'Humidor Vault',
        totalQuantity: combinedQuantity,
        combinedNotes,
      });
    } else {
      // Ensure initial vendorPrices has the cigar's vendor if present
      const initialPrices = cigar.vendorPrices ? [...cigar.vendorPrices] : [];
      if (initialPrices.length === 0 && cigar.vendor && cigar.purchasePrice) {
        initialPrices.push({
          id: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          vendor: canonicalizeVendorName(cigar.vendor),
          price: cigar.purchasePrice,
          currency: cigar.currency || '£',
          inStock: true,
          recordedAt: cigar.purchaseDate || new Date().toISOString(),
        });
      }
      cleaned.push({
        ...cigar,
        vendor: cigar.vendor ? canonicalizeVendorName(cigar.vendor) : cigar.vendor,
        vendorPrices: initialPrices.length > 0 ? initialPrices : undefined,
      });
    }
  }

  return {
    cleanedCigars: cleaned,
    mergedCount,
    mergedDetails,
  };
}

/**
 * Global Price Sync Utility:
 * Syncs a new or updated retailer price(s) across the entire website:
 * - Updates/Adds Vendor Prices on matching CigarResearchItem (preserving separate retailer listings)
 * - Updates Humidor Cigars matching the brand & line with the new price/vendor
 * - Updates Wishlist items target/estimated prices and multi-retailer price lists
 */
export function syncGlobalCigarPrice({
  brand,
  nameOrLine,
  vitola,
  vendorPriceEntry,
  researchDatabase,
  cigars,
  wishlist,
  updateHumidorMatches = true,
}: {
  brand: string;
  nameOrLine: string;
  vitola?: string;
  vendorPriceEntry: VendorPriceEntry | VendorPriceEntry[];
  researchDatabase: CigarResearchItem[];
  cigars: Cigar[];
  wishlist: WishlistItem[];
  updateHumidorMatches?: boolean;
}): {
  updatedResearchDb: CigarResearchItem[];
  updatedCigars: Cigar[];
  updatedWishlist: WishlistItem[];
  affectedResearchCount: number;
  affectedHumidorCount: number;
  affectedWishlistCount: number;
} {
  const targetCigar = { brand, line: nameOrLine, name: nameOrLine, vitola };
  const incomingPrices = (Array.isArray(vendorPriceEntry) ? vendorPriceEntry : [vendorPriceEntry])
    .filter((p) => p && p.price > 0)
    .map((p) => ({ ...p, vendor: canonicalizeVendorName(p.vendor || 'Online Retailer') }));

  // Find lowest in-stock or overall price entry
  const inStock = incomingPrices.filter((p) => p.inStock !== false && p.price > 0);
  const bestPriceEntry = inStock.length > 0
    ? inStock.reduce((prev, curr) => (curr.price < prev.price ? curr : prev), inStock[0])
    : incomingPrices[0];

  let affectedResearchCount = 0;
  let affectedHumidorCount = 0;
  let affectedWishlistCount = 0;

  // 1. Sync across Research Database
  const updatedResearchDb = researchDatabase.map((item) => {
    if (areCigarsMatching(targetCigar, { brand: item.brand, line: item.line, vitola: item.vitola })) {
      affectedResearchCount++;
      return mergeVendorPriceIntoCigar(item, incomingPrices);
    }
    return item;
  });

  // If no matching item existed in research DB, optionally create one so it shows in Research Hub
  if (affectedResearchCount === 0 && incomingPrices.length > 0) {
    const isCuban = /cuba|havana|habano/i.test(brand);
    const avgPrice = bestPriceEntry ? bestPriceEntry.price : 20.0;
    const newResearchItem: CigarResearchItem = {
      id: `research-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      brand,
      line: nameOrLine,
      vitola: vitola || 'Robusto',
      lengthInches: 5.0,
      ringGauge: 50,
      countryOrigin: isCuban ? 'Cuba' : 'Nicaragua',
      wrapper: isCuban ? 'Cuban Habano' : 'Habano',
      wrapperType: 'Habano',
      binder: isCuban ? 'Cuba' : 'Selected Binder',
      filler: isCuban ? 'Cuba' : 'Selected Filler',
      strength: isCuban ? 'Medium-Full' : 'Medium',
      body: 'Medium-Full',
      averagePrice: avgPrice,
      priceRange: `${bestPriceEntry?.currency || '£'}${avgPrice.toFixed(2)}`,
      criticRating: 91,
      criticConsensus: `Renowned blend from ${brand}. Hand-rolled with exceptional craftsmanship.`,
      recommendedPairings: isCuban ? ['Single Malt Scotch', 'Espresso'] : ['Bourbon', 'Dark Roast Coffee'],
      agingWindowMonths: isCuban ? 12 : 6,
      isCuban,
      reviewTastingNotes: {
        overview: `Handmade ${brand} ${nameOrLine} featuring balanced notes and steady burn.`,
        firstThird: 'Subtle cedar, sweet earth, and light spice.',
        secondThird: 'Rich cocoa, toasted nuts, and creamy texture.',
        finalThird: 'Deep oak, roasted coffee, and smooth pepper finish.',
        dominantFlavorTags: ['Cedar', 'Leather', 'Cocoa', 'Nutty'],
      },
      vendorPrices: incomingPrices.sort((a, b) => a.price - b.price),
      userUpdatedAt: new Date().toISOString(),
    };
    updatedResearchDb.unshift(newResearchItem);
    affectedResearchCount = 1;
  }

  // 2. Sync across Humidor Cigars
  const updatedCigars = updateHumidorMatches
    ? cigars.map((c) => {
        if (areCigarsMatching(targetCigar, { brand: c.brand, line: c.line || c.name, vitola: c.vitola })) {
          affectedHumidorCount++;
          // Merge vendor prices onto cigar as well
          const currentPrices: VendorPriceEntry[] = c.vendorPrices ? [...c.vendorPrices] : [];
          
          if (c.vendor && c.purchasePrice && !currentPrices.some((cv) => normalizeString(cv.vendor) === normalizeString(c.vendor!))) {
            currentPrices.push({
              id: `vp-${Date.now()}-c`,
              vendor: canonicalizeVendorName(c.vendor),
              price: c.purchasePrice,
              currency: c.currency || '£',
              inStock: true,
              recordedAt: c.purchaseDate || new Date().toISOString(),
            });
          }

          for (const np of incomingPrices) {
            const normV = normalizeString(np.vendor);
            const idx = currentPrices.findIndex((v) => normalizeString(v.vendor) === normV);
            if (idx >= 0) {
              currentPrices[idx] = { ...np, id: currentPrices[idx].id };
            } else {
              currentPrices.push(np);
            }
          }

          currentPrices.sort((a, b) => a.price - b.price);

          return {
            ...c,
            purchasePrice: bestPriceEntry ? bestPriceEntry.price : c.purchasePrice,
            currency: bestPriceEntry?.currency || c.currency || '£',
            vendor: bestPriceEntry?.vendor || c.vendor,
            vendorPrices: currentPrices,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    : cigars;

  // 3. Sync across Wishlist items
  const updatedWishlist = wishlist.map((w) => {
    if (areCigarsMatching(targetCigar, { brand: w.brand, line: w.name, name: w.name, vitola: w.vitola })) {
      affectedWishlistCount++;
      const currentPrices: VendorPriceEntry[] = w.vendorPrices ? [...w.vendorPrices] : [];

      if (w.sourceRetailer && w.estimatedPrice && !currentPrices.some((cv) => normalizeString(cv.vendor) === normalizeString(w.sourceRetailer!))) {
        currentPrices.push({
          id: `vp-${Date.now()}-w`,
          vendor: canonicalizeVendorName(w.sourceRetailer),
          price: w.estimatedPrice,
          currency: '£',
          inStock: true,
          recordedAt: new Date().toISOString(),
        });
      }

      for (const np of incomingPrices) {
        const normV = normalizeString(np.vendor);
        const idx = currentPrices.findIndex((v) => normalizeString(v.vendor) === normV);
        if (idx >= 0) {
          currentPrices[idx] = { ...np, id: currentPrices[idx].id };
        } else {
          currentPrices.push(np);
        }
      }

      currentPrices.sort((a, b) => a.price - b.price);

      return {
        ...w,
        estimatedPrice: bestPriceEntry ? bestPriceEntry.price : w.estimatedPrice,
        sourceRetailer: bestPriceEntry?.vendor || w.sourceRetailer,
        sourceUrl: bestPriceEntry?.url || w.sourceUrl,
        vendorPrices: currentPrices,
      };
    }
    return w;
  });

  return {
    updatedResearchDb,
    updatedCigars,
    updatedWishlist,
    affectedResearchCount,
    affectedHumidorCount,
    affectedWishlistCount,
  };
}

export interface WishlistDeduplicationResult {
  cleanedWishlist: WishlistItem[];
  mergedCount: number;
  mergedDetails: Array<{
    keptName: string;
    brand: string;
    combinedNotes?: string;
    bestPrice?: number;
  }>;
}

/**
 * Deduplicate and merge duplicate items in the Wishlist & Box Hunting archive.
 * Groups by Brand + Cigar Name / Line + Vitola using canonical matching.
 * Combines vendor quotes, merges target prices, notes, flavor tags, smoke times, and priority ratings.
 */
export function deduplicateWishlistItems(wishlist: WishlistItem[]): WishlistDeduplicationResult {
  const cleaned: WishlistItem[] = [];
  let mergedCount = 0;
  const mergedDetails: WishlistDeduplicationResult['mergedDetails'] = [];

  for (const item of wishlist) {
    const existingIndex = cleaned.findIndex((existing) =>
      areCigarsMatching(
        { brand: existing.brand, line: existing.name, name: existing.name, vitola: existing.vitola },
        { brand: item.brand, line: item.name, name: item.name, vitola: item.vitola }
      )
    );

    if (existingIndex >= 0) {
      mergedCount++;
      const existing = cleaned[existingIndex];

      // Merge Notes
      const existingNotes = (existing.notes || '').trim();
      const incomingNotes = (item.notes || '').trim();
      let combinedNotes = existingNotes;
      if (incomingNotes && incomingNotes !== existingNotes) {
        if (!existingNotes) {
          combinedNotes = incomingNotes;
        } else if (!existingNotes.includes(incomingNotes)) {
          combinedNotes = `${existingNotes} | ${incomingNotes}`;
        }
      }

      // Merge Priority: High > Medium > Low
      const priorityOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
      const existingWeight = priorityOrder[existing.priority] || 1;
      const incomingWeight = priorityOrder[item.priority] || 1;
      const combinedPriority = existingWeight >= incomingWeight ? existing.priority : item.priority;

      // Merge Target Price: lowest or defined target price
      const combinedTargetPrice =
        existing.targetPrice && item.targetPrice
          ? Math.min(existing.targetPrice, item.targetPrice)
          : existing.targetPrice || item.targetPrice;

      // Merge Vendor Prices quotes
      const combinedVendorPrices: VendorPriceEntry[] = existing.vendorPrices ? [...existing.vendorPrices] : [];

      if (existing.sourceRetailer && existing.estimatedPrice && !combinedVendorPrices.some((cv) => normalizeString(cv.vendor) === normalizeString(existing.sourceRetailer!))) {
        combinedVendorPrices.push({
          id: `vp-${Date.now()}-w1`,
          vendor: canonicalizeVendorName(existing.sourceRetailer),
          price: existing.estimatedPrice,
          currency: '£',
          inStock: true,
          recordedAt: existing.createdAt || new Date().toISOString(),
        });
      }

      if (item.vendorPrices && item.vendorPrices.length > 0) {
        for (const vp of item.vendorPrices) {
          const normV = normalizeString(vp.vendor);
          const idx = combinedVendorPrices.findIndex((cv) => normalizeString(cv.vendor) === normV);
          if (idx >= 0) {
            combinedVendorPrices[idx] = { ...vp, vendor: canonicalizeVendorName(vp.vendor) };
          } else {
            combinedVendorPrices.push({ ...vp, vendor: canonicalizeVendorName(vp.vendor) });
          }
        }
      } else if (item.sourceRetailer && item.estimatedPrice) {
        const normV = normalizeString(item.sourceRetailer);
        const idx = combinedVendorPrices.findIndex((cv) => normalizeString(cv.vendor) === normV);
        if (idx >= 0) {
          combinedVendorPrices[idx] = {
            id: combinedVendorPrices[idx].id,
            vendor: canonicalizeVendorName(item.sourceRetailer),
            price: item.estimatedPrice,
            currency: '£',
            inStock: true,
            recordedAt: item.createdAt || new Date().toISOString(),
          };
        } else {
          combinedVendorPrices.push({
            id: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            vendor: canonicalizeVendorName(item.sourceRetailer),
            price: item.estimatedPrice,
            currency: '£',
            inStock: true,
            recordedAt: item.createdAt || new Date().toISOString(),
          });
        }
      }

      combinedVendorPrices.sort((a, b) => a.price - b.price);

      const bestPrice = combinedVendorPrices.length > 0
        ? combinedVendorPrices[0].price
        : (item.estimatedPrice && existing.estimatedPrice
            ? Math.min(item.estimatedPrice, existing.estimatedPrice)
            : item.estimatedPrice || existing.estimatedPrice);

      const bestRetailer = combinedVendorPrices.length > 0
        ? combinedVendorPrices[0].vendor
        : (existing.sourceRetailer || item.sourceRetailer);

      const mergedItem: WishlistItem = {
        ...existing,
        targetPrice: combinedTargetPrice,
        estimatedPrice: bestPrice,
        sourceRetailer: bestRetailer,
        sourceUrl: existing.sourceUrl || item.sourceUrl,
        priority: combinedPriority,
        notes: combinedNotes || undefined,
        vitola: existing.vitola || item.vitola,
        smokeTimeRange: existing.smokeTimeRange || item.smokeTimeRange,
        smokeTimeMinutes: existing.smokeTimeMinutes || item.smokeTimeMinutes,
        vendorPrices: combinedVendorPrices.length > 0 ? combinedVendorPrices : undefined,
      };

      cleaned[existingIndex] = mergedItem;
      mergedDetails.push({
        keptName: `${mergedItem.brand} ${mergedItem.name}`,
        brand: mergedItem.brand,
        combinedNotes,
        bestPrice,
      });
    } else {
      cleaned.push(item);
    }
  }

  return {
    cleanedWishlist: cleaned,
    mergedCount,
    mergedDetails,
  };
}

