import React, { useState, useMemo, useEffect } from 'react';
import {
  Bookmark,
  Plus,
  Minus,
  Check,
  Trash2,
  Sparkles,
  ExternalLink,
  Tag,
  Star,
  Award,
  Edit3,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Store,
  Clock,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Eye,
  EyeOff,
  X,
  Search,
  Loader2,
  Globe,
  RefreshCw,
  CheckCircle2,
  ShoppingCart,
  ShoppingBag,
  ShoppingBasket,
  CheckCheck,
  TrendingDown,
  Share2,
  Printer,
} from 'lucide-react';
import { WishlistItem, Cigar, AppSettings, VendorPriceEntry, CigarResearchItem, ReviewScoreEntry, WishlistBasketItem } from '../types';
import { formatCurrency, DEFAULT_CURRENCY } from '../utils/currencyUtils';
import {
  estimateAccurateSmokeTime,
  canonicalizeVendorName,
  findMatchingResearchCigar,
  areCigarsMatching,
} from '../utils/researchUtils';
import { bestComparableQuote, comparableQuotes, normalizeCurrency, unitPrice } from '../utils/priceUtils';

const DEFAULT_QUICK_RETAILERS = [
  'C.Gars Ltd',
  'Havana House',
  'Smoke King',
  'Sautter London',
  'JJ Fox',
  'Davidoff London',
  'Neptune Cigars',
  'Famous Smoke',
  'Atlantic Cigar',
  'Fox Cigar',
];

interface WishlistHuntingProps {
  wishlist: WishlistItem[];
  onAddWishlistItem: (item: Omit<WishlistItem, 'id' | 'createdAt'>) => void;
  onUpdateWishlistItem?: (id: string, updates: Partial<WishlistItem>) => void;
  onDeleteWishlistItem: (id: string) => void;
  onAcquireItem: (item: WishlistItem) => void;
  onResearchCigar: (query: string) => void;
  onOpenPriceEditor?: (item: { brand: string; name: string; vitola?: string; price?: number; vendor?: string; currency?: string }) => void;
  researchDatabase?: CigarResearchItem[];
  onUpdateResearchCigar?: (cigarId: string, updates: Partial<CigarResearchItem>) => void;
  onAddCustomResearchCigar?: (cigar: CigarResearchItem) => void;
  onInlineRenameWishlistItem?: (item: WishlistItem, newBrand: string, newName: string) => void;
  settings?: AppSettings;
  wishlistBasket?: WishlistBasketItem[];
  onBasketChange?: (basket: WishlistBasketItem[]) => void;
}

export const WishlistHunting: React.FC<WishlistHuntingProps> = ({
  wishlist,
  onAddWishlistItem,
  onUpdateWishlistItem,
  onDeleteWishlistItem,
  onAcquireItem,
  onResearchCigar,
  onOpenPriceEditor,
  researchDatabase = [],
  onUpdateResearchCigar,
  onAddCustomResearchCigar,
  onInlineRenameWishlistItem,
  settings,
  wishlistBasket: externalBasket,
  onBasketChange,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);

  // Inline rename state for real-time site-wide sync
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [inlineBrand, setInlineBrand] = useState<string>('');
  const [inlineName, setInlineName] = useState<string>('');

  const handleStartInlineEdit = (item: WishlistItem) => {
    setEditingNameId(item.id);
    setInlineBrand(item.brand);
    setInlineName(item.name);
  };

  const handleSaveInlineEdit = (item: WishlistItem) => {
    if (!inlineBrand.trim() || !inlineName.trim()) {
      setEditingNameId(null);
      return;
    }
    if (onInlineRenameWishlistItem) {
      onInlineRenameWishlistItem(item, inlineBrand.trim(), inlineName.trim());
    } else if (onUpdateWishlistItem) {
      onUpdateWishlistItem(item.id, {
        brand: inlineBrand.trim(),
        name: inlineName.trim(),
      });
    }
    setEditingNameId(null);
    setFeedbackNotice(`Updated to "${inlineBrand.trim()} ${inlineName.trim()}" across all tabs!`);
  };

  // Scanner states
  const [scanningItemId, setScanningItemId] = useState<string | null>(null);
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Search & Filter state with persistence
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_wishlist_search') || '';
    } catch {
      return '';
    }
  });

  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'High' | 'Medium' | 'Low'>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_wishlist_priority_filter');
      if (saved === 'ALL' || saved === 'High' || saved === 'Medium' || saved === 'Low') return saved;
    } catch {}
    return 'ALL';
  });

  const [smokeTimeFilter, setSmokeTimeFilter] = useState<'ALL' | 'quick' | 'medium' | 'long'>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_wishlist_smoke_time_filter');
      if (saved === 'ALL' || saved === 'quick' || saved === 'medium' || saved === 'long') return saved;
    } catch {}
    return 'ALL';
  });

  const [brandFilter, setBrandFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_wishlist_brand_filter') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  // Shop / Retailer Filter & Best-Price-Only Filter with persistence
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_wishlist_shop_filter') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  const [shopBestPriceOnly, setShopBestPriceOnly] = useState<boolean>(() => {
    try {
      return localStorage.getItem('the_humidor_wishlist_shop_best_only') === 'true';
    } catch {
      return false;
    }
  });

  // Shopping Basket State with persistence
  const [basket, setBasket] = useState<WishlistBasketItem[]>(() => {
    if (externalBasket) return externalBasket;
    try {
      const saved = localStorage.getItem('the_humidor_wishlist_basket');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isBasketOpen, setIsBasketOpen] = useState(false);

  // View Mode: Grid (Cards) or Table (Database view) with persistence
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_wishlist_view_mode');
      if (saved === 'grid' || saved === 'table') return saved;
    } catch {}
    return 'grid';
  });

  // Display Settings state with persistence
  const [showDisplayOptions, setShowDisplayOptions] = useState<boolean>(() => {
    try {
      return localStorage.getItem('the_humidor_wishlist_show_display_options') === 'true';
    } catch {
      return false;
    }
  });

  const [sortBy, setSortBy] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_wishlist_sort') || 'priority-desc';
    } catch {
      return 'priority-desc';
    }
  });

  const [displayFields, setDisplayFields] = useState(() => {
    const defaultFields = {
      targetPrice: settings?.wishlistFieldVisibility?.targetPrice ?? true,
      retailerQuotes: settings?.wishlistFieldVisibility?.retailerQuotes ?? true,
      smokeTime: settings?.wishlistFieldVisibility?.smokeTime ?? true,
      vitolaSpecs: settings?.wishlistFieldVisibility?.vitolaSpecs ?? true,
      notes: settings?.wishlistFieldVisibility?.notes ?? true,
      priority: settings?.wishlistFieldVisibility?.priority ?? true,
      rating: settings?.wishlistFieldVisibility?.rating ?? true,
    };
    try {
      const saved = localStorage.getItem('the_humidor_wishlist_display_fields');
      if (saved) {
        return { ...defaultFields, ...JSON.parse(saved) };
      }
    } catch {}
    return defaultFields;
  });

  // Helper to extract critic rating & review scores from item or matching research database
  const getItemRatings = (item: WishlistItem) => {
    let rating = item.criticRating;
    let scores: ReviewScoreEntry[] = item.reviewScores || [];
    if (!rating || scores.length === 0) {
      const match = findMatchingResearchCigar(
        { brand: item.brand, line: item.name, name: item.name, vitola: item.vitola },
        researchDatabase
      );
      if (match) {
        if (!rating && match.criticRating) rating = match.criticRating;
        if (scores.length === 0 && match.reviewScores && match.reviewScores.length > 0) {
          scores = match.reviewScores;
        }
      }
    }
    return { rating, scores };
  };

  // Helper: Get Best Retailer Quote for a Wishlist item
  const getBestVendorQuote = (item: WishlistItem) => {
    const quotes = item.vendorPrices || [];
    if (quotes.length > 0) {
      const sorted = comparableQuotes(quotes, settings?.globalCurrency).sort((a, b) => unitPrice(a) - unitPrice(b));
      const best = bestComparableQuote(sorted, settings?.globalCurrency) || sorted[0];
      return {
        price: best.price,
        unitPrice: unitPrice(best),
        vendor: canonicalizeVendorName(best.vendor),
        currency: normalizeCurrency(best.currency),
        packageType: best.packageType || 'Single',
        url: best.url || item.sourceUrl,
        hasQuotes: true,
        allQuotes: sorted,
      };
    }
    return {
      price: item.estimatedPrice || item.targetPrice || 0,
      vendor: item.sourceRetailer ? canonicalizeVendorName(item.sourceRetailer) : 'Best UK Price',
      currency: '£',
      url: item.sourceUrl,
      hasQuotes: false,
      allQuotes: [],
    };
  };

  // Helper: Check if specific shop holds the lowest/best price for an item
  const isShopBestPriceForCigar = (item: WishlistItem, shopName: string) => {
    if (!shopName || shopName === 'ALL') return true;
    const targetCanonical = canonicalizeVendorName(shopName).toLowerCase();
    const quotes = item.vendorPrices || [];
    if (quotes.length === 0) {
      if (item.sourceRetailer && canonicalizeVendorName(item.sourceRetailer).toLowerCase() === targetCanonical) {
        return true;
      }
      return false;
    }
    const comparable = comparableQuotes(quotes, settings?.globalCurrency);
    const best = bestComparableQuote(comparable, settings?.globalCurrency);
    const shopQuotes = comparable.filter((q) => canonicalizeVendorName(q.vendor).toLowerCase() === targetCanonical);
    if (shopQuotes.length === 0) return false;
    return Boolean(best && shopQuotes.some((sq) => unitPrice(sq) <= unitPrice(best) + 0.001));
  };

  // Helper: Check if item has any quote from specific shop
  const hasShopQuote = (item: WishlistItem, shopName: string) => {
    if (!shopName || shopName === 'ALL') return true;
    const targetCanonical = canonicalizeVendorName(shopName).toLowerCase();
    if (item.sourceRetailer && canonicalizeVendorName(item.sourceRetailer).toLowerCase() === targetCanonical) {
      return true;
    }
    return (item.vendorPrices || []).some((q) => canonicalizeVendorName(q.vendor).toLowerCase() === targetCanonical);
  };

  // Helper: Get specific shop price for item
  const getShopQuoteForItem = (item: WishlistItem, shopName: string) => {
    if (!shopName || shopName === 'ALL') return null;
    const targetCanonical = canonicalizeVendorName(shopName).toLowerCase();
    const quotes = item.vendorPrices || [];
    const match = quotes.find((q) => canonicalizeVendorName(q.vendor).toLowerCase() === targetCanonical);
    if (match) return match;
    if (item.sourceRetailer && canonicalizeVendorName(item.sourceRetailer).toLowerCase() === targetCanonical && item.targetPrice) {
      return {
        id: `quote-manual-${item.id}`,
        vendor: item.sourceRetailer,
        price: item.targetPrice,
        currency: '£',
        packageType: 'Single',
        recordedAt: item.createdAt,
        inStock: true,
        url: item.sourceUrl,
      };
    }
    return null;
  };

  // Available Retailers for shop filter & price comparison
  const availableShops = useMemo(() => {
    const shopMap = new Map<string, { totalQuotes: number; bestPriceCount: number }>();

    wishlist.forEach((w) => {
      const quotes = w.vendorPrices || [];
      if (quotes.length > 0) {
        const comparable = comparableQuotes(quotes, settings?.globalCurrency);
        const best = bestComparableQuote(comparable, settings?.globalCurrency);
        quotes.forEach((q) => {
          const c = canonicalizeVendorName(q.vendor);
          const current = shopMap.get(c) || { totalQuotes: 0, bestPriceCount: 0 };
          current.totalQuotes += 1;
          if (best && comparable.includes(q) && unitPrice(q) <= unitPrice(best) + 0.001) {
            current.bestPriceCount += 1;
          }
          shopMap.set(c, current);
        });
      } else if (w.sourceRetailer) {
        const c = canonicalizeVendorName(w.sourceRetailer);
        const current = shopMap.get(c) || { totalQuotes: 0, bestPriceCount: 0 };
        current.totalQuotes += 1;
        current.bestPriceCount += 1;
        shopMap.set(c, current);
      }
    });

    // Also include retailers from research database
    researchDatabase.forEach((r) => {
      (r.vendorPrices || []).forEach((q) => {
        const c = canonicalizeVendorName(q.vendor);
        if (!shopMap.has(c)) {
          shopMap.set(c, { totalQuotes: 0, bestPriceCount: 0 });
        }
      });
    });

    // Merge default quick retailers
    DEFAULT_QUICK_RETAILERS.forEach((r) => {
      const c = canonicalizeVendorName(r);
      if (!shopMap.has(c)) {
        shopMap.set(c, { totalQuotes: 0, bestPriceCount: 0 });
      }
    });

    return Array.from(shopMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.bestPriceCount - a.bestPriceCount || b.totalQuotes - a.totalQuotes || a.name.localeCompare(b.name));
  }, [wishlist, researchDatabase]);

  // Sync settings when parent changes
  useEffect(() => {
    if (settings?.wishlistFieldVisibility) {
      setDisplayFields((prev) => ({
        ...prev,
        ...settings.wishlistFieldVisibility,
      }));
    }
  }, [settings?.wishlistFieldVisibility]);

  // Automatically reflect research database retailer quotes into wishlist items
  useEffect(() => {
    if (!researchDatabase || researchDatabase.length === 0 || !onUpdateWishlistItem || wishlist.length === 0) return;

    wishlist.forEach((w) => {
      const match = findMatchingResearchCigar(
        { brand: w.brand, line: w.name, name: w.name, vitola: w.vitola },
        researchDatabase
      );
      if (match && match.vendorPrices && match.vendorPrices.length > 0) {
        const currentQuotes = w.vendorPrices || [];
        const hasMissingVendors = match.vendorPrices.some(
          (rp) => !currentQuotes.some((cq) => canonicalizeVendorName(cq.vendor) === canonicalizeVendorName(rp.vendor))
        );
        if (hasMissingVendors || currentQuotes.length === 0) {
          const merged = [...currentQuotes];
          match.vendorPrices.forEach((rp) => {
            const existingIdx = merged.findIndex(
              (cq) => canonicalizeVendorName(cq.vendor) === canonicalizeVendorName(rp.vendor)
            );
            if (existingIdx >= 0) {
              merged[existingIdx] = { ...rp, id: merged[existingIdx].id };
            } else {
              merged.push(rp);
            }
          });
          const bestQuote = bestComparableQuote(merged, settings?.globalCurrency);
          const minPrice = bestQuote?.price;
          const bestVendor = bestQuote?.vendor;
          onUpdateWishlistItem(w.id, {
            vendorPrices: merged,
            estimatedPrice: minPrice,
            sourceRetailer: bestVendor || w.sourceRetailer,
          });
        }
      }
    });
  }, [researchDatabase]);

  // Sync states to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_wishlist_search', searchTerm);
    } catch {}
  }, [searchTerm]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_wishlist_priority_filter', priorityFilter);
    } catch {}
  }, [priorityFilter]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_wishlist_smoke_time_filter', smokeTimeFilter);
    } catch {}
  }, [smokeTimeFilter]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_wishlist_brand_filter', brandFilter);
    } catch {}
  }, [brandFilter]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_wishlist_shop_filter', selectedShopFilter);
    } catch {}
  }, [selectedShopFilter]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_wishlist_shop_best_only', String(shopBestPriceOnly));
    } catch {}
  }, [shopBestPriceOnly]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_wishlist_basket', JSON.stringify(basket));
    } catch {}
  }, [basket]);

  React.useEffect(() => {
    if (externalBasket) setBasket(externalBasket);
  }, [externalBasket]);

  React.useEffect(() => {
    onBasketChange?.(basket);
  }, [basket, onBasketChange]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_wishlist_view_mode', viewMode);
    } catch {}
  }, [viewMode]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_wishlist_sort', sortBy);
    } catch {}
  }, [sortBy]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_wishlist_show_display_options', String(showDisplayOptions));
    } catch {}
  }, [showDisplayOptions]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_wishlist_display_fields', JSON.stringify(displayFields));
    } catch {}
  }, [displayFields]);

  const resetAllFilters = () => {
    setSearchTerm('');
    setPriorityFilter('ALL');
    setSmokeTimeFilter('ALL');
    setBrandFilter('ALL');
    setSelectedShopFilter('ALL');
    setShopBestPriceOnly(false);
    setSortBy('priority-desc');
  };

  // Basket Management Handlers
  const handleAddToBasket = (
    item: WishlistItem,
    vendorOverride?: string,
    priceOverride?: number,
    urlOverride?: string
  ) => {
    const bestQuote = getBestVendorQuote(item);
    const vendor = vendorOverride || bestQuote.vendor || 'Best UK Price';
    const price = priceOverride !== undefined ? priceOverride : (bestQuote.price || item.targetPrice || 0);
    const url = urlOverride || bestQuote.url || item.sourceUrl;

    setBasket((prev) => {
      const existingIndex = prev.findIndex(
        (b) =>
          (b.wishlistItemId === item.id || (b.brand === item.brand && b.name === item.name)) &&
          b.vendor.toLowerCase() === vendor.toLowerCase()
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
          unitPrice: price > 0 ? price : updated[existingIndex].unitPrice,
        };
        return updated;
      }

      const newItem: WishlistBasketItem = {
        id: `basket-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        wishlistItemId: item.id,
        brand: item.brand,
        name: item.name,
        vitola: item.vitola,
        quantity: 1,
        unitPrice: price,
        currency: '£',
        vendor: vendor,
        sourceUrl: url,
        notes: item.notes,
        smokeTimeRange: item.smokeTimeRange,
        criticRating: item.criticRating,
        addedAt: new Date().toISOString(),
      };
      return [...prev, newItem];
    });

    setFeedbackNotice(
      `🛒 Added "${item.brand} ${item.name}" (${formatCurrency(price, '£')} at ${vendor}) to Shopping Basket!`
    );
  };

  const handleAddAllBestDealsToBasket = () => {
    if (filteredWishlist.length === 0) return;
    let addedCount = 0;

    setBasket((prev) => {
      const updated = [...prev];
      filteredWishlist.forEach((item) => {
        const best = getBestVendorQuote(item);
        const vendor = best.vendor || 'Best UK Price';
        const price = best.price || item.targetPrice || 0;
        const url = best.url || item.sourceUrl;

        const existingIndex = updated.findIndex(
          (b) =>
            (b.wishlistItemId === item.id || (b.brand === item.brand && b.name === item.name)) &&
            b.vendor.toLowerCase() === vendor.toLowerCase()
        );

        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
          };
        } else {
          updated.push({
            id: `basket-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${addedCount}`,
            wishlistItemId: item.id,
            brand: item.brand,
            name: item.name,
            vitola: item.vitola,
            quantity: 1,
            unitPrice: price,
            currency: '£',
            vendor: vendor,
            sourceUrl: url,
            notes: item.notes,
            smokeTimeRange: item.smokeTimeRange,
            criticRating: item.criticRating,
            addedAt: new Date().toISOString(),
          });
        }
        addedCount++;
      });
      return updated;
    });

    setFeedbackNotice(`🛒 Added ${addedCount} best-deal cigars to your Shopping Basket!`);
    setIsBasketOpen(true);
  };

  const handleUpdateBasketQuantity = (id: string, delta: number) => {
    setBasket((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is WishlistBasketItem => item !== null)
    );
  };

  const handleRemoveFromBasket = (id: string) => {
    setBasket((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearBasket = () => {
    if (basket.length === 0) return;
    setBasket([]);
    setFeedbackNotice('Shopping basket cleared.');
  };

  const handleAcquireEntireBasket = () => {
    if (basket.length === 0) return;
    const first = basket[0];
    const match = wishlist.find(
      (w) => w.id === first.wishlistItemId || (w.brand === first.brand && w.name === first.name)
    );
    if (match) {
      onAcquireItem(match);
      setFeedbackNotice('The first basket item is ready to save. The basket remains intact until each acquisition succeeds.');
    } else {
      setFeedbackNotice('Please acquire basket items individually so each quantity and save can be confirmed safely.');
    }
  };

  // Preset Handlers
  const applyPreset = (preset: 'all' | 'keySpecs' | 'priceHunter') => {
    if (preset === 'all') {
      setDisplayFields({
        targetPrice: true,
        retailerQuotes: true,
        smokeTime: true,
        vitolaSpecs: true,
        notes: true,
        priority: true,
        rating: true,
      });
    } else if (preset === 'keySpecs') {
      setDisplayFields({
        targetPrice: true,
        retailerQuotes: false,
        smokeTime: true,
        vitolaSpecs: true,
        notes: false,
        priority: true,
        rating: true,
      });
    } else if (preset === 'priceHunter') {
      setDisplayFields({
        targetPrice: true,
        retailerQuotes: true,
        smokeTime: false,
        vitolaSpecs: true,
        notes: false,
        priority: true,
        rating: false,
      });
    }
  };

  // Quick Inline Retailer Quote state
  const [quickQuoteItemId, setQuickQuoteItemId] = useState<string | null>(null);
  const [quickQuoteVendor, setQuickQuoteVendor] = useState('C.Gars Ltd');
  const [quickQuotePrice, setQuickQuotePrice] = useState('');
  const [quickQuoteCurrency, setQuickQuoteCurrency] = useState('£');
  const [quickQuoteCustomTags, setQuickQuoteCustomTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cigar_quick_quote_retailers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_QUICK_RETAILERS;
  });
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Add form fields
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [vitola, setVitola] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [notes, setNotes] = useState('');
  const [sourceRetailer, setSourceRetailer] = useState('');

  // Edit form fields
  const [editBrand, setEditBrand] = useState('');
  const [editName, setEditName] = useState('');
  const [editVitola, setEditVitola] = useState('');
  const [editTargetPrice, setEditTargetPrice] = useState('');
  const [editPriority, setEditPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [editNotes, setEditNotes] = useState('');
  const [editSourceRetailer, setEditSourceRetailer] = useState('');
  const [editSourceUrl, setEditSourceUrl] = useState('');

  const handleStartEdit = (item: WishlistItem) => {
    setEditingItem(item);
    setEditBrand(item.brand);
    setEditName(item.name);
    setEditVitola(item.vitola || '');
    setEditTargetPrice(item.targetPrice !== undefined ? String(item.targetPrice) : '');
    setEditPriority(item.priority || 'High');
    setEditNotes(item.notes || '');
    setEditSourceRetailer(item.sourceRetailer || '');
    setEditSourceUrl(item.sourceUrl || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !onUpdateWishlistItem) return;

    onUpdateWishlistItem(editingItem.id, {
      brand: editBrand.trim(),
      name: editName.trim(),
      vitola: editVitola.trim() || undefined,
      targetPrice: editTargetPrice ? parseFloat(editTargetPrice) : undefined,
      priority: editPriority,
      notes: editNotes.trim() || undefined,
      sourceRetailer: editSourceRetailer.trim() || undefined,
      sourceUrl: editSourceUrl.trim() || undefined,
    });

    setEditingItem(null);
  };

  const handleQuickChangePriority = (item: WishlistItem, newPriority: 'High' | 'Medium' | 'Low') => {
    if (onUpdateWishlistItem) {
      onUpdateWishlistItem(item.id, { priority: newPriority });
    }
  };

  // Delete Individual Retailer Quote
  const handleDeleteRetailerQuote = (item: WishlistItem, vendorPriceId: string) => {
    if (!onUpdateWishlistItem) return;
    const remainingQuotes = (item.vendorPrices || []).filter((vp) => vp.id !== vendorPriceId);
    onUpdateWishlistItem(item.id, {
      vendorPrices: remainingQuotes,
      estimatedPrice: bestComparableQuote(remainingQuotes, settings?.globalCurrency)?.price,
    });
  };

  // Scan Live UK Retailer Prices for Single Wishlist Cigar
  const handleScanRetailerPricesForWishlistItem = async (item: WishlistItem) => {
    if (!onUpdateWishlistItem) return;
    setScanningItemId(item.id);
    setFeedbackNotice(null);

    try {
      const response = await fetch('/api/research/retailer-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: item.brand,
          name: item.name,
          vitola: item.vitola,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || data?.message || `Scanner request failed (${response.status})`);
      }
      const scannedPrices: VendorPriceEntry[] = (data?.data?.retailerQuotes || data?.data?.quotes || [])
        .filter((quote: VendorPriceEntry) => quote && Number.isFinite(Number(quote.price)) && Number(quote.price) > 0);

      if (scannedPrices.length > 0) {
        const currentQuotes = item.vendorPrices || [];
        const merged = [...currentQuotes];

        scannedPrices.forEach((sp) => {
          const cVendor = canonicalizeVendorName(sp.vendor);
          const idx = merged.findIndex(
            (q) => canonicalizeVendorName(q.vendor) === cVendor
          );
          const formatted: VendorPriceEntry = {
            id: sp.id || `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            vendor: cVendor,
            price: sp.price,
            currency: sp.currency || '£',
            packageType: sp.packageType || 'Single',
            recordedAt: sp.recordedAt || new Date().toISOString(),
            inStock: sp.inStock !== false,
            url: sp.url,
          };
          if (idx >= 0) {
            merged[idx] = { ...formatted, id: merged[idx].id };
          } else {
            merged.push(formatted);
          }
        });

        const bestQuote = bestComparableQuote(merged, settings?.globalCurrency);
        const minPrice = bestQuote?.price;
        const bestVendor = bestQuote?.vendor;

        onUpdateWishlistItem(item.id, {
          vendorPrices: merged,
          estimatedPrice: minPrice,
          sourceRetailer: bestVendor || item.sourceRetailer,
        });

        // Also reflect to matching research dossier if present
        const matchingResearch = findMatchingResearchCigar(
          { brand: item.brand, line: item.name, name: item.name, vitola: item.vitola },
          researchDatabase
        );
        if (matchingResearch && onUpdateResearchCigar) {
          onUpdateResearchCigar(matchingResearch.id, {
            vendorPrices: merged,
            userUpdatedAt: new Date().toISOString(),
          });
        }

        setFeedbackNotice(bestQuote
          ? `Updated shop quotes for ${item.brand} ${item.name}. Best quote: ${normalizeCurrency(bestQuote.currency)}${minPrice!.toFixed(2)} at ${bestVendor}.`
          : `Updated shop quotes for ${item.brand} ${item.name}, but no comparable quote was available.`);
      } else {
        setFeedbackNotice(`Scanned UK retailers — no direct matches found for ${item.brand} ${item.name}.`);
      }
    } catch (err) {
      console.error('Error scanning retailer prices:', err);
      setFeedbackNotice(`Price scan failed for ${item.brand} ${item.name}: ${err instanceof Error ? err.message : 'the retailer service was unavailable.'}`);
    } finally {
      setScanningItemId(null);
    }
  };

  // Batch Scan UK Retailer Prices across Entire Wishlist
  const handleBatchScanAllWishlistItems = async () => {
    if (!onUpdateWishlistItem || wishlist.length === 0) return;
    setIsBatchScanning(true);
    setFeedbackNotice(null);

    try {
      const response = await fetch('/api/research/batch-retailer-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cigars: wishlist.map((w) => ({
            id: w.id,
            brand: w.brand,
            line: w.name,
            name: w.name,
            vitola: w.vitola,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || data?.message || `Batch scanner request failed (${response.status})`);
      }
      const results: Array<{ id: string; brand: string; name: string; quotes?: VendorPriceEntry[] }> = data?.data?.results || [];
      if (!Array.isArray(results)) throw new Error('The batch scanner returned an invalid result format.');
      let updatedCount = 0;

      results.forEach((res) => {
        const item = wishlist.find(
          (w) => w.id === res.id || areCigarsMatching(w, { brand: res.brand, name: res.name, line: res.name })
        );
        const scannedQuotes = res.quotes || [];
        if (item && scannedQuotes.length > 0) {
          const currentQuotes = item.vendorPrices || [];
          const merged = [...currentQuotes];

          scannedQuotes.forEach((sp) => {
            const cVendor = canonicalizeVendorName(sp.vendor);
            const idx = merged.findIndex((q) => canonicalizeVendorName(q.vendor) === cVendor);
            const formatted: VendorPriceEntry = {
              id: sp.id || `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              vendor: cVendor,
              price: sp.price,
              currency: sp.currency || '£',
              packageType: sp.packageType || 'Single',
              recordedAt: sp.recordedAt || new Date().toISOString(),
              inStock: sp.inStock !== false,
              url: sp.url,
            };
            if (idx >= 0) {
              merged[idx] = { ...formatted, id: merged[idx].id };
            } else {
              merged.push(formatted);
            }
          });

          const bestQuote = bestComparableQuote(merged, settings?.globalCurrency);
          const minPrice = bestQuote?.price;
          const bestVendor = bestQuote?.vendor;

          onUpdateWishlistItem(item.id, {
            vendorPrices: merged,
            estimatedPrice: minPrice,
            sourceRetailer: bestVendor || item.sourceRetailer,
          });

          // Sync to research database
          const matchingResearch = findMatchingResearchCigar(
            { brand: item.brand, line: item.name, name: item.name, vitola: item.vitola },
            researchDatabase
          );
          if (matchingResearch && onUpdateResearchCigar) {
            onUpdateResearchCigar(matchingResearch.id, {
              vendorPrices: merged,
              userUpdatedAt: new Date().toISOString(),
            });
          }

          updatedCount++;
        }
      });

      setFeedbackNotice(
        `🇬🇧 UK Tobacconist scan completed! Updated quotes and best prices across ${updatedCount} wishlist items.`
      );
    } catch (err) {
      console.error('Batch scan error:', err);
      setFeedbackNotice(`UK retailer batch scan failed: ${err instanceof Error ? err.message : 'the retailer service was unavailable.'}`);
    } finally {
      setIsBatchScanning(false);
    }
  };

  // Save Quick Retailer Quote
  const handleSaveQuickQuote = (item: WishlistItem) => {
    const numPrice = parseFloat(quickQuotePrice);
    if (isNaN(numPrice) || numPrice <= 0 || !onUpdateWishlistItem) return;

    const vendorName = canonicalizeVendorName(quickQuoteVendor.trim() || 'Online Retailer');
    const newEntry: VendorPriceEntry = {
      id: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      vendor: vendorName,
      price: Math.round(numPrice * 100) / 100,
      currency: quickQuoteCurrency || '£',
      packageType: 'Single',
      recordedAt: new Date().toISOString(),
      inStock: true,
    };

    const existing = item.vendorPrices || [];
    const filtered = existing.filter((p) => p.vendor.toLowerCase() !== vendorName.toLowerCase());
    const updatedPrices = [newEntry, ...filtered];
    const bestQuote = bestComparableQuote(updatedPrices, settings?.globalCurrency);

    onUpdateWishlistItem(item.id, {
      vendorPrices: updatedPrices,
      estimatedPrice: bestQuote?.price,
      sourceRetailer: bestQuote?.vendor || vendorName,
    });

    // Also sync to research database
    const matchingResearch = findMatchingResearchCigar(
      { brand: item.brand, line: item.name, name: item.name, vitola: item.vitola },
      researchDatabase
    );
    if (matchingResearch && onUpdateResearchCigar) {
      onUpdateResearchCigar(matchingResearch.id, {
        vendorPrices: updatedPrices,
        userUpdatedAt: new Date().toISOString(),
      });
    }

    setQuickQuoteItemId(null);
    setQuickQuotePrice('');
  };

  const handleAddCustomTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (!quickQuoteCustomTags.includes(trimmed)) {
      const nextTags = [...quickQuoteCustomTags, trimmed];
      setQuickQuoteCustomTags(nextTags);
      try {
        localStorage.setItem('cigar_quick_quote_retailers', JSON.stringify(nextTags));
      } catch {}
    }
    setQuickQuoteVendor(trimmed);
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleDeleteCustomTag = (tagToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTags = quickQuoteCustomTags.filter((t) => t !== tagToDelete);
    setQuickQuoteCustomTags(nextTags);
    try {
      localStorage.setItem('cigar_quick_quote_retailers', JSON.stringify(nextTags));
    } catch {}
    if (quickQuoteVendor === tagToDelete) {
      setQuickQuoteVendor(nextTags[0] || 'C.Gars Ltd');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !name.trim()) return;

    const smokeTime = estimateAccurateSmokeTime(vitola);

    // Auto-check research database for existing quotes
    const matchingResearch = findMatchingResearchCigar(
      { brand: brand.trim(), line: name.trim(), name: name.trim(), vitola: vitola.trim() },
      researchDatabase
    );
    const existingQuotes = matchingResearch?.vendorPrices || [];
    const bestExistingQuote = bestComparableQuote(existingQuotes, settings?.globalCurrency);
    const minPrice = bestExistingQuote?.price ?? (targetPrice ? parseFloat(targetPrice) : undefined);
    const bestVendor = bestExistingQuote?.vendor;

    onAddWishlistItem({
      brand: brand.trim(),
      name: name.trim(),
      vitola: vitola.trim() || undefined,
      smokeTimeMinutes: smokeTime.minutes,
      smokeTimeRange: smokeTime.range,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      estimatedPrice: minPrice,
      vendorPrices: existingQuotes.length > 0 ? existingQuotes : undefined,
      priority,
      notes: notes.trim() || undefined,
      sourceRetailer: sourceRetailer.trim() || bestVendor || undefined,
    });

    setBrand('');
    setName('');
    setVitola('');
    setTargetPrice('');
    setNotes('');
    setSourceRetailer('');
    setShowAddForm(false);
  };

  // Unique brands in wishlist
  const uniqueBrands = useMemo(() => {
    const set = new Set<string>();
    wishlist.forEach((w) => {
      if (w.brand && w.brand.trim()) set.add(w.brand.trim());
    });
    return Array.from(set).sort();
  }, [wishlist]);

  // Filtered and searched list
  const filteredWishlist = useMemo(() => {
    const list = wishlist.filter((item) => {
      if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;
      if (brandFilter !== 'ALL' && item.brand !== brandFilter) return false;

      // Shop / Retailer Filter & Best Price at Shop Filter
      if (selectedShopFilter !== 'ALL') {
        if (shopBestPriceOnly) {
          if (!isShopBestPriceForCigar(item, selectedShopFilter)) return false;
        } else {
          if (!hasShopQuote(item, selectedShopFilter)) return false;
        }
      }

      const smokeMinutes = item.smokeTimeMinutes || estimateAccurateSmokeTime(item.vitola).minutes;
      if (smokeTimeFilter === 'quick' && smokeMinutes > 45) return false;
      if (smokeTimeFilter === 'medium' && (smokeMinutes <= 45 || smokeMinutes > 75)) return false;
      if (smokeTimeFilter === 'long' && smokeMinutes <= 75) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesBrand = item.brand?.toLowerCase().includes(query);
        const matchesName = item.name?.toLowerCase().includes(query);
        const matchesVitola = item.vitola?.toLowerCase().includes(query);
        const matchesNotes = item.notes?.toLowerCase().includes(query);
        const matchesVendor = item.sourceRetailer?.toLowerCase().includes(query) ||
          item.vendorPrices?.some((vp) => vp.vendor.toLowerCase().includes(query));
        if (!matchesBrand && !matchesName && !matchesVitola && !matchesNotes && !matchesVendor) {
          return false;
        }
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'rating-desc') {
        const rA = getItemRatings(a).rating || 0;
        const rB = getItemRatings(b).rating || 0;
        if (rB !== rA) return rB - rA;
      } else if (sortBy === 'price-asc') {
        const pA = a.targetPrice ?? (a.vendorPrices?.[0]?.price ?? 9999);
        const pB = b.targetPrice ?? (b.vendorPrices?.[0]?.price ?? 9999);
        if (pA !== pB) return pA - pB;
      } else if (sortBy === 'price-desc') {
        const pA = a.targetPrice ?? (a.vendorPrices?.[0]?.price ?? 0);
        const pB = b.targetPrice ?? (b.vendorPrices?.[0]?.price ?? 0);
        if (pB !== pA) return pB - pA;
      } else if (sortBy === 'brand-asc') {
        const bA = `${a.brand} ${a.name}`.toLowerCase();
        const bB = `${b.brand} ${b.name}`.toLowerCase();
        return bA.localeCompare(bB);
      }
      // default: priority-desc
      const pOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
      const diff = (pOrder[b.priority || 'High'] || 0) - (pOrder[a.priority || 'High'] || 0);
      if (diff !== 0) return diff;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [
    wishlist,
    priorityFilter,
    brandFilter,
    selectedShopFilter,
    shopBestPriceOnly,
    smokeTimeFilter,
    searchTerm,
    sortBy,
    researchDatabase,
  ]);

  const printShoppingBasket = () => {
    if (basket.length === 0) {
      setFeedbackNotice('Shopping basket is empty.');
      return;
    }

    const escapeHtml = (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const rows = basket
      .map((item) => {
        const lineTotal = (item.unitPrice || 0) * item.quantity;
        return `<tr>
          <td>${escapeHtml(item.brand)}</td>
          <td>${escapeHtml(item.name)}${item.vitola ? `<br><small>${escapeHtml(item.vitola)}</small>` : ''}</td>
          <td>${escapeHtml(item.vendor)}</td>
          <td class="num">${escapeHtml(formatCurrency(item.unitPrice || 0, item.currency || '£'))}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${escapeHtml(formatCurrency(lineTotal, item.currency || '£'))}</td>
        </tr>`;
      })
      .join('');

    const shops = Object.keys(basketByVendor).length;
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) {
      setFeedbackNotice('Allow pop-ups for The Humidor to create the printable basket.');
      return;
    }

    win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>The Humidor — Shopping Basket</title>
<style>
@page { size: A4; margin: 16mm; }
body { font-family: Georgia, serif; color:#222; margin:0; }
h1 { margin:0 0 4px; font-size:24px; }
.subtitle { color:#666; font:13px Arial,sans-serif; margin-bottom:20px; }
.summary { display:flex; gap:28px; padding:12px 0; border-top:2px solid #8f7442; border-bottom:1px solid #ccc; margin-bottom:18px; font-family:Arial,sans-serif; font-size:12px; }
.summary strong { display:block; font-size:16px; color:#6f572f; margin-top:3px; }
table { width:100%; border-collapse:collapse; font-family:Arial,sans-serif; font-size:11px; }
th { text-align:left; background:#f3efe7; border-bottom:2px solid #b59a65; padding:8px 6px; }
td { border-bottom:1px solid #ddd; padding:8px 6px; vertical-align:top; }
.num { text-align:right; white-space:nowrap; }
small { color:#777; }
.total { margin-top:18px; text-align:right; font:bold 16px Arial,sans-serif; }
.footer { margin-top:30px; color:#777; font:10px Arial,sans-serif; }
@media print { .no-print { display:none; } }
</style>
</head>
<body>
<h1>The Humidor</h1>
<div class="subtitle">Wishlist Shopping Basket · ${escapeHtml(new Date().toLocaleString('en-GB'))}</div>
<div class="summary">
<div>STICKS<strong>${totalBasketCount}</strong></div>
<div>RETAILERS<strong>${shops}</strong></div>
<div>ESTIMATED TOTAL<strong>${escapeHtml(formatCurrency(totalBasketPrice, '£'))}</strong></div>
</div>
<table>
<thead><tr><th>Brand</th><th>Cigar / Vitola</th><th>Retailer</th><th class="num">Unit</th><th class="num">Qty</th><th class="num">Total</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<div class="total">Grand Total: ${escapeHtml(formatCurrency(totalBasketPrice, '£'))}</div>
<div class="footer">Prices are the currently quoted basket prices in The Humidor and may change at checkout.</div>
<script>window.onload=()=>setTimeout(()=>window.print(),250);</script>
</body></html>`);
    win.document.close();
  };

  // Basket summary calculations
  const totalBasketCount = basket.reduce((acc, item) => acc + item.quantity, 0);
  const totalBasketPrice = basket.reduce((acc, item) => acc + (item.unitPrice || 0) * item.quantity, 0);

  const basketByVendor = useMemo(() => {
    const map: Record<string, { items: WishlistBasketItem[]; total: number; count: number }> = {};
    basket.forEach((item) => {
      const v = item.vendor || 'Other Retailers';
      if (!map[v]) {
        map[v] = { items: [], total: 0, count: 0 };
      }
      map[v].items.push(item);
      map[v].total += (item.unitPrice || 0) * item.quantity;
      map[v].count += item.quantity;
    });
    return map;
  }, [basket]);

  // Counts for filters
  const counts = useMemo(() => {
    return {
      all: wishlist.length,
      high: wishlist.filter((w) => w.priority === 'High').length,
      medium: wishlist.filter((w) => w.priority === 'Medium').length,
      low: wishlist.filter((w) => w.priority === 'Low').length,
      quickSmoke: wishlist.filter((w) => (w.smokeTimeMinutes || estimateAccurateSmokeTime(w.vitola).minutes) <= 45).length,
      mediumSmoke: wishlist.filter((w) => {
        const m = w.smokeTimeMinutes || estimateAccurateSmokeTime(w.vitola).minutes;
        return m > 45 && m <= 75;
      }).length,
      longSmoke: wishlist.filter((w) => (w.smokeTimeMinutes || estimateAccurateSmokeTime(w.vitola).minutes) > 75).length,
    };
  }, [wishlist]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-gradient-to-br from-card via-header to-surface border border-line rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-gold" />
            <h1 className="text-xl sm:text-2xl font-serif text-white font-normal">
              Wishlist
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            What to buy next…
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Shopping Basket Button with Badge */}
          <button
            onClick={() => setIsBasketOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm ${
              totalBasketCount > 0
                ? 'bg-gradient-to-r from-gold to-gold-hover text-ink hover:brightness-110'
                : 'bg-surface text-text border border-line hover:border-gold hover:text-gold'
            }`}
            title="Open Shopping Basket with Best Prices across Tobacconists"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>Basket</span>
            {totalBasketCount > 0 ? (
              <span className="flex items-center gap-1.5 pl-1.5 border-l border-ink/30 text-[11px]">
                <span className="bg-ink text-gold px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {totalBasketCount}
                </span>
                <span className="font-serif">{formatCurrency(totalBasketPrice, '£')}</span>
              </span>
            ) : (
              <span className="text-[10px] text-text-muted lowercase font-normal">(0 items)</span>
            )}
          </button>

          {/* Quick Add All Best Deals to Basket */}
          {filteredWishlist.length > 0 && (
            <button
              onClick={handleAddAllBestDealsToBasket}
              className="flex items-center gap-1.5 px-3 py-2 bg-card hover:bg-card-hover text-gold border border-gold/40 hover:border-gold rounded-md text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
              title="Add all currently displayed cigars to Basket using their lowest/best retailer price"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Best Deals ({filteredWishlist.length})</span>
            </button>
          )}

          {/* Add Cigar Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gold text-ink hover:bg-[#b08e4c] rounded-md text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Cigar</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-surface border border-line rounded-md p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-gold text-ink'
                  : 'text-text-muted hover:text-text'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-gold text-ink'
                  : 'text-text-muted hover:text-text'
              }`}
              title="Database Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Inline Display Settings Toggle */}
          <button
            onClick={() => setShowDisplayOptions(!showDisplayOptions)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-md text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
              showDisplayOptions
                ? 'bg-gold text-ink border-gold'
                : 'bg-surface text-text-muted border-line hover:text-text'
            }`}
            title="Inline Display Settings & Presets"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Display</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackNotice && (
        <div className="flex items-center justify-between p-3.5 bg-card border border-gold/40 rounded-lg text-xs text-text animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-text-muted hover:text-white cursor-pointer ml-3 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Inline Display Settings & Presets Panel */}
      {showDisplayOptions && (
        <div className="p-4 bg-header border border-line rounded-lg space-y-3 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-gold" />
              <span className="text-xs font-bold uppercase tracking-wider text-text">
                Inline Field Visibility & View Presets
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-semibold text-text-muted mr-1">Presets:</span>
              <button
                onClick={() => applyPreset('all')}
                className="px-2 py-1 bg-surface hover:bg-card-hover text-gold border border-line rounded text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
              >
                All Details
              </button>
              <button
                onClick={() => applyPreset('keySpecs')}
                className="px-2 py-1 bg-surface hover:bg-card-hover text-text border border-line rounded text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
              >
                Key Specs Only
              </button>
              <button
                onClick={() => applyPreset('priceHunter')}
                className="px-2 py-1 bg-surface hover:bg-card-hover text-text border border-line rounded text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
              >
                Price Hunter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
            {[
              { key: 'rating', label: 'Ratings & Scores' },
              { key: 'targetPrice', label: 'Target Price' },
              { key: 'retailerQuotes', label: 'Shop Quotes' },
              { key: 'smokeTime', label: 'Smoke Time' },
              { key: 'vitolaSpecs', label: 'Vitola / Specs' },
              { key: 'notes', label: 'Notes' },
              { key: 'priority', label: 'Priority Pill' },
            ].map((f) => {
              const active = (displayFields as any)[f.key];
              return (
                <button
                  key={f.key}
                  onClick={() =>
                    setDisplayFields((prev) => ({ ...prev, [f.key]: !(prev as any)[f.key] }))
                  }
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-medium border transition cursor-pointer ${
                    active
                      ? 'bg-section-header text-gold border-gold/40'
                      : 'bg-surface text-text-muted/60 border-line line-through'
                  }`}
                >
                  <span>{f.label}</span>
                  {active ? (
                    <Eye className="w-3 h-3 text-gold" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-text-muted/40" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 bg-header border border-line rounded-lg space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search wishlist by brand, line, vitola, notes, retailer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-line rounded-md pl-9 pr-8 py-2 text-xs text-text focus:outline-hidden focus:border-gold placeholder-text-muted/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-text-muted hover:text-text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Brand Filter Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
            >
              <option value="ALL">All Brands ({uniqueBrands.length})</option>
              {uniqueBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Shop / Tobacconist Filter Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={selectedShopFilter}
              onChange={(e) => setSelectedShopFilter(e.target.value)}
              className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
              title="Filter by Tobacconist / Shop quotes"
            >
              <option value="ALL">All Shops & Tobacconists ({availableShops.length})</option>
              {availableShops.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} {s.bestPriceCount > 0 ? `(🏆 ${s.bestPriceCount} best)` : `(${s.totalQuotes} quotes)`}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
              title="Sort Wishlist items"
            >
              <option value="priority-desc">🔥 Highest Priority</option>
              <option value="rating-desc">★ Highest Critic Score</option>
              <option value="price-asc">💰 Lowest Target/Price</option>
              <option value="price-desc">💎 Highest Price</option>
              <option value="brand-asc">🔤 Brand Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Rows: Priority, Smoke Duration, and Shop Best Price Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60">
          {/* Priority Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-text-muted uppercase font-semibold tracking-wider mr-1">
              Priority:
            </span>
            <button
              onClick={() => setPriorityFilter('ALL')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                priorityFilter === 'ALL'
                  ? 'bg-gold text-ink font-bold'
                  : 'bg-surface text-text-muted border border-line hover:text-text'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setPriorityFilter('High')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                priorityFilter === 'High'
                  ? 'bg-red-900/80 text-red-100 font-bold border border-red-700'
                  : 'bg-surface text-red-400 border border-line hover:bg-danger-bg'
              }`}
            >
              🔥 High ({counts.high})
            </button>
            <button
              onClick={() => setPriorityFilter('Medium')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                priorityFilter === 'Medium'
                  ? 'bg-cedar text-amber-100 font-bold border border-gold'
                  : 'bg-surface text-gold border border-line hover:bg-card-hover'
              }`}
            >
              ⚡ Medium ({counts.medium})
            </button>
            <button
              onClick={() => setPriorityFilter('Low')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                priorityFilter === 'Low'
                  ? 'bg-selected text-text font-bold border border-[#4A4036]'
                  : 'bg-surface text-text-muted border border-line hover:bg-card'
              }`}
            >
              🌱 Low ({counts.low})
            </button>
          </div>

          {/* Smoke Duration Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-text-muted uppercase font-semibold tracking-wider mr-1">
              ⏱️ Duration:
            </span>
            <button
              onClick={() => setSmokeTimeFilter('ALL')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                smokeTimeFilter === 'ALL'
                  ? 'bg-gold text-ink font-bold'
                  : 'bg-surface text-text-muted border border-line hover:text-text'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSmokeTimeFilter('quick')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                smokeTimeFilter === 'quick'
                  ? 'bg-gold text-ink font-bold'
                  : 'bg-surface text-text border border-line hover:border-gold'
              }`}
            >
              ⚡ Quick (&le;45m)
            </button>
            <button
              onClick={() => setSmokeTimeFilter('medium')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                smokeTimeFilter === 'medium'
                  ? 'bg-gold text-ink font-bold'
                  : 'bg-surface text-text border border-line hover:border-gold'
              }`}
            >
              ⏳ Medium (45-75m)
            </button>
            <button
              onClick={() => setSmokeTimeFilter('long')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                smokeTimeFilter === 'long'
                  ? 'bg-gold text-ink font-bold'
                  : 'bg-surface text-text border border-line hover:border-gold'
              }`}
            >
              👑 Long (&gt;75m)
            </button>
          </div>

          {/* Shop Best Price Toggle & Reset Button */}
          <div className="flex items-center gap-2 ml-auto">
            {selectedShopFilter !== 'ALL' && (
              <button
                onClick={() => setShopBestPriceOnly(!shopBestPriceOnly)}
                className={`text-[10px] px-2.5 py-1 rounded border transition cursor-pointer flex items-center gap-1.5 font-bold ${
                  shopBestPriceOnly
                    ? 'bg-emerald-900/80 text-emerald-100 border-emerald-500 shadow-xs'
                    : 'bg-surface text-text border-line hover:border-emerald-600 hover:text-emerald-300'
                }`}
                title={`Filter for cigars where ${selectedShopFilter} offers the lowest/best price among all shops`}
              >
                <span>🏆</span>
                <span>Only where {selectedShopFilter} is Best Price</span>
              </button>
            )}

            {(searchTerm ||
              priorityFilter !== 'ALL' ||
              smokeTimeFilter !== 'ALL' ||
              brandFilter !== 'ALL' ||
              selectedShopFilter !== 'ALL' ||
              shopBestPriceOnly) && (
              <button
                onClick={resetAllFilters}
                className="text-[10px] px-2.5 py-1 rounded bg-card-hover hover:bg-line text-gold hover:text-white border border-line-hover flex items-center gap-1 cursor-pointer transition"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Tobacconist Chips Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-line/40 text-[10px]">
          <span className="text-text-muted font-semibold uppercase tracking-wider flex items-center gap-1 mr-1">
            <Store className="w-3 h-3 text-gold" />
            <span>Shop Deals:</span>
          </span>
          <button
            onClick={() => setSelectedShopFilter('ALL')}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              selectedShopFilter === 'ALL'
                ? 'bg-gold text-ink font-bold'
                : 'bg-surface text-text-muted border border-line hover:text-text'
            }`}
          >
            All Shops
          </button>
          {availableShops.slice(0, 7).map((s) => {
            const isSelected = selectedShopFilter === s.name;
            return (
              <button
                key={s.name}
                onClick={() => setSelectedShopFilter(isSelected ? 'ALL' : s.name)}
                className={`px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-gold text-ink font-bold'
                    : 'bg-surface text-text border border-line hover:border-gold'
                }`}
              >
                <span>{s.name}</span>
                {s.bestPriceCount > 0 && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded-xs font-mono font-bold ${
                      isSelected ? 'bg-ink text-gold' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    🏆{s.bestPriceCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-5 bg-card border border-line rounded-lg space-y-4 shadow-sm">
          <h3 className="text-sm font-serif font-semibold text-gold">Track New Cigar on Wishlist</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Brand *</label>
              <input
                type="text"
                required
                placeholder="e.g. Arturo Fuente"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Cigar / Line Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Opus X Fuente Fuente"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Vitola / Format</label>
              <input
                type="text"
                placeholder="e.g. Corona Gorda, Robusto"
                value={vitola}
                onChange={(e) => setVitola(e.target.value)}
                className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Target Max Price (£)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 35.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
              >
                <option value="High">🔥 High (Grail / Must Buy)</option>
                <option value="Medium">⚡ Medium (Keep eye out)</option>
                <option value="Low">🌱 Low (Casual interest)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Initial Retailer (Optional)</label>
              <input
                type="text"
                placeholder="e.g. C.Gars Ltd, Sautter"
                value={sourceRetailer}
                onChange={(e) => setSourceRetailer(e.target.value)}
                className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Hunt Notes & Release Details</label>
            <textarea
              rows={2}
              placeholder="e.g. Restocks usually occur in November; look for 2022 release date box code."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-surface text-text-muted hover:text-text border border-line rounded-md text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gold hover:brightness-110 text-ink font-bold uppercase tracking-wider rounded-md text-xs shadow-sm cursor-pointer"
            >
              Save to Wishlist
            </button>
          </div>
        </form>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-line rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-serif font-semibold text-base text-white">Edit Wishlist Cigar</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-text-muted hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Vitola</label>
                  <input
                    type="text"
                    value={editVitola}
                    onChange={(e) => setEditVitola(e.target.value)}
                    className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                  >
                    <option value="High">🔥 High (Grail / Must Buy)</option>
                    <option value="Medium">⚡ Medium (Keep eye out)</option>
                    <option value="Low">🌱 Low (Casual interest)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Target Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editTargetPrice}
                    onChange={(e) => setEditTargetPrice(e.target.value)}
                    className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Source / Retailer</label>
                  <input
                    type="text"
                    value={editSourceRetailer}
                    onChange={(e) => setEditSourceRetailer(e.target.value)}
                    className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Retailer Web Link</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editSourceUrl}
                  onChange={(e) => setEditSourceUrl(e.target.value)}
                  className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Notes / Details</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-surface text-text-muted hover:text-text border border-line rounded-md text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold hover:brightness-110 text-ink font-bold uppercase tracking-wider rounded-md text-xs shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 1: Database Table View */}
      {viewMode === 'table' && (
        <div className="bg-header border border-line rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface text-text-muted text-[10px] uppercase tracking-wider font-semibold border-b border-line">
                  {displayFields.priority && <th className="py-3 px-3">Priority</th>}
                  <th className="py-3 px-3">Brand & Cigar Line</th>
                  {displayFields.rating && <th className="py-3 px-3">Rating / Score</th>}
                  {displayFields.vitolaSpecs && <th className="py-3 px-3">Vitola / Format</th>}
                  {displayFields.smokeTime && <th className="py-3 px-3">Smoke Time</th>}
                  {displayFields.targetPrice && <th className="py-3 px-3">Target Price</th>}
                  {displayFields.retailerQuotes && <th className="py-3 px-3">Best Shop Quote</th>}
                  {displayFields.notes && <th className="py-3 px-3">Notes</th>}
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredWishlist.map((item) => {
                  const smokeTime = estimateAccurateSmokeTime(item.vitola, item.lengthInches, item.ringGauge);
                  const quotes = item.vendorPrices || [];
                  const minPrice = bestComparableQuote(quotes, settings?.globalCurrency)?.price;
                  const { rating: itemRating, scores: itemScores } = getItemRatings(item);

                  return (
                    <tr key={item.id} className="hover:bg-section-header transition">
                      {displayFields.priority && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <select
                            value={item.priority || 'High'}
                            onChange={(e) => handleQuickChangePriority(item, e.target.value as any)}
                            className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border cursor-pointer ${
                              item.priority === 'High'
                                ? 'bg-danger-bg text-red-300 border-red-900/60'
                                : item.priority === 'Medium'
                                ? 'bg-[#261E14] text-gold border-gold/40'
                                : 'bg-surface text-text-muted border-line'
                            }`}
                          >
                            <option value="High">🔥 High</option>
                            <option value="Medium">⚡ Medium</option>
                            <option value="Low">🌱 Low</option>
                          </select>
                        </td>
                      )}
                      <td className="py-3 px-3">
                        {editingNameId === item.id ? (
                          <div className="space-y-1 p-2 bg-surface border border-gold rounded min-w-[180px]">
                            <input
                              type="text"
                              placeholder="Brand"
                              value={inlineBrand}
                              onChange={(e) => setInlineBrand(e.target.value)}
                              className="w-full bg-card border border-line rounded px-1.5 py-0.5 text-xs text-text focus:border-gold"
                            />
                            <input
                              type="text"
                              placeholder="Line / Name"
                              value={inlineName}
                              onChange={(e) => setInlineName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineEdit(item);
                                if (e.key === 'Escape') setEditingNameId(null);
                              }}
                              className="w-full bg-card border border-line rounded px-1.5 py-0.5 text-xs text-text focus:border-gold"
                            />
                            <div className="flex gap-1 pt-1">
                              <button
                                onClick={() => handleSaveInlineEdit(item)}
                                className="px-2 py-0.5 bg-gold text-ink rounded font-bold text-[10px]"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingNameId(null)}
                                className="px-1.5 py-0.5 bg-line text-text-muted rounded text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-gold">
                                {item.brand}
                              </span>
                              <button
                                onClick={() => handleStartInlineEdit(item)}
                                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-gold transition cursor-pointer"
                                title="Edit name inline (syncs across all tabs)"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <div
                              onClick={() => handleStartInlineEdit(item)}
                              className="font-serif font-semibold text-white hover:text-gold cursor-pointer transition"
                              title="Click to edit name inline"
                            >
                              {item.name}
                            </div>
                          </div>
                        )}
                      </td>
                      {displayFields.rating && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          {itemRating || itemScores.length > 0 ? (
                            <div className="space-y-1">
                              {itemRating && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-section-header border border-gold/40 rounded text-[11px] font-bold text-gold">
                                  <Star className="w-3 h-3 fill-gold text-gold" />
                                  <span>{itemRating}</span>
                                  <span className="text-[9px] text-text-muted font-normal">/100</span>
                                </div>
                              )}
                              {itemScores.length > 0 && (
                                <div className="flex flex-wrap gap-1 max-w-[170px]">
                                  {itemScores.slice(0, 2).map((sc, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[9px] px-1.5 py-0.5 bg-surface text-text border border-line rounded"
                                      title={`${sc.source}: ${sc.score}${sc.scale ? '/' + sc.scale : ''}${sc.award ? ' (' + sc.award + ')' : ''}`}
                                    >
                                      <span className="text-text-muted font-medium">{sc.source.split(' ')[0]}:</span> <strong className="text-gold">★{sc.score}</strong>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-text-muted/50 italic text-[10px]">Unrated</span>
                          )}
                        </td>
                      )}
                      {displayFields.vitolaSpecs && (
                        <td className="py-3 px-3 text-text-muted">{item.vitola || '—'}</td>
                      )}
                      {displayFields.smokeTime && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface border border-line rounded text-[10px] text-gold">
                            <Clock className="w-3 h-3 text-gold" />
                            <span>{item.smokeTimeRange || smokeTime.range}</span>
                          </div>
                        </td>
                      )}
                      {displayFields.targetPrice && (
                        <td className="py-3 px-3 whitespace-nowrap font-serif font-semibold text-emerald-400">
                          {item.targetPrice !== undefined ? formatCurrency(item.targetPrice, '£') : '—'}
                        </td>
                      )}
                      {displayFields.retailerQuotes && (
                        <td className="py-3 px-3">
                          {quotes.length > 0 ? (
                            <div className="space-y-1 max-w-[210px]">
                              {quotes.map((vp) => {
                                const isBest = vp.price === minPrice;
                                return (
                                  <div
                                    key={vp.id}
                                    className={`flex items-center justify-between gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                                      isBest
                                        ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/60'
                                        : 'bg-surface text-text border border-line'
                                    }`}
                                  >
                                    <span className="truncate">{vp.vendor}</span>
                                    <div className="flex items-center gap-1 font-mono font-bold">
                                      <span>{formatCurrency(vp.price, vp.currency || '£')}</span>
                                      <button
                                        onClick={() => handleAddToBasket(item, vp.vendor, vp.price, vp.url)}
                                        className="text-gold hover:text-white cursor-pointer p-0.5"
                                        title={`Add to Basket from ${vp.vendor} (${formatCurrency(vp.price, '£')})`}
                                      >
                                        <ShoppingCart className="w-2.5 h-2.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteRetailerQuote(item, vp.id)}
                                        className="text-text-muted hover:text-red-400 cursor-pointer p-0.5"
                                        title={`Delete quote from ${vp.vendor}`}
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-text-muted/50 italic text-[10px]">No quotes</span>
                              <button
                                onClick={() => handleScanRetailerPricesForWishlistItem(item)}
                                disabled={scanningItemId === item.id}
                                className="text-[10px] text-gold hover:underline flex items-center gap-0.5 cursor-pointer"
                                title="Scan UK Tobacconists"
                              >
                                {scanningItemId === item.id ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Globe className="w-2.5 h-2.5" />
                                )}
                                <span>Scan</span>
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                      {displayFields.notes && (
                        <td className="py-3 px-3 max-w-xs truncate text-text-muted italic">
                          {item.notes || '—'}
                        </td>
                      )}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleAddToBasket(item)}
                            className="p-1.5 bg-card hover:bg-gold text-gold hover:text-ink border border-gold/50 rounded cursor-pointer transition"
                            title="Add Best Price to Shopping Basket"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onAcquireItem(item)}
                            className="p-1.5 bg-surface hover:bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 rounded cursor-pointer"
                            title="Acquired! Move to Vault"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleScanRetailerPricesForWishlistItem(item)}
                            disabled={scanningItemId === item.id}
                            className={`p-1.5 bg-surface hover:bg-card-hover text-gold border border-line rounded cursor-pointer ${
                              scanningItemId === item.id ? 'opacity-70 cursor-wait' : ''
                            }`}
                            title="Scan UK Retailer Quotes (C.Gars, Havana House, Smoke King, Sautter, JJ Fox, etc.)"
                          >
                            {scanningItemId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
                            ) : (
                              <Globe className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {onOpenPriceEditor && (
                            <button
                              onClick={() =>
                                onOpenPriceEditor({
                                  brand: item.brand,
                                  name: item.name,
                                  vitola: item.vitola,
                                  price: item.targetPrice || minPrice,
                                  vendor: item.sourceRetailer,
                                })
                              }
                              className="p-1.5 bg-surface hover:bg-card-hover text-gold border border-line rounded cursor-pointer"
                              title="Compare Retailer Quotes"
                            >
                              <Store className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 bg-surface hover:bg-card-hover text-text hover:text-gold border border-line rounded cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onResearchCigar(`${item.brand} ${item.name}`)}
                            className="p-1.5 bg-surface hover:bg-card-hover text-gold border border-line rounded cursor-pointer"
                            title="AI Dossier Research"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteWishlistItem(item.id)}
                            className="p-1.5 bg-surface hover:bg-danger-bg text-text-muted hover:text-red-400 border border-line rounded cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Grid Cards View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWishlist.map((item) => {
            const smokeTime = estimateAccurateSmokeTime(item.vitola, item.lengthInches, item.ringGauge);
            const quotes = item.vendorPrices || [];
                  const minPrice = bestComparableQuote(quotes, settings?.globalCurrency)?.price;

            return (
              <div
                key={item.id}
                className="p-5 bg-card border border-line rounded-lg flex flex-col justify-between shadow-sm transition hover:border-line-hover"
              >
                <div>
                  {/* Card Header: Brand, Name & Priority */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      {editingNameId === item.id ? (
                        <div className="space-y-1.5 p-2.5 bg-surface border border-gold rounded-md mb-2">
                          <div className="text-[10px] uppercase font-bold text-gold">Edit Name (Syncs Everywhere)</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              placeholder="Brand"
                              value={inlineBrand}
                              onChange={(e) => setInlineBrand(e.target.value)}
                              className="bg-card border border-line rounded px-2 py-1 text-xs text-text focus:border-gold"
                            />
                            <input
                              type="text"
                              placeholder="Line / Name"
                              value={inlineName}
                              onChange={(e) => setInlineName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineEdit(item);
                                if (e.key === 'Escape') setEditingNameId(null);
                              }}
                              className="bg-card border border-line rounded px-2 py-1 text-xs text-text focus:border-gold"
                            />
                          </div>
                          <div className="flex gap-1.5 pt-1">
                            <button
                              onClick={() => handleSaveInlineEdit(item)}
                              className="px-2.5 py-1 bg-gold text-ink rounded font-bold text-xs"
                            >
                              Save & Sync
                            </button>
                            <button
                              onClick={() => setEditingNameId(null)}
                              className="px-2 py-1 bg-line text-text-muted rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gold">
                              {item.brand}
                            </span>
                            <button
                              onClick={() => handleStartInlineEdit(item)}
                              className="text-text-muted hover:text-gold transition cursor-pointer p-0.5"
                              title="Edit name inline (syncs across all tabs)"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <h3
                            onClick={() => handleStartInlineEdit(item)}
                            className="font-serif font-semibold text-base text-text hover:text-gold cursor-pointer transition"
                            title="Click to edit name inline"
                          >
                            {item.name}
                          </h3>
                        </div>
                      )}
                      {displayFields.vitolaSpecs && item.vitola && (
                        <span className="text-xs text-text-muted block mt-0.5">{item.vitola}</span>
                      )}
                    </div>

                    {displayFields.priority && (
                      <div className="relative group">
                        <select
                          value={item.priority || 'High'}
                          onChange={(e) => handleQuickChangePriority(item, e.target.value as any)}
                          className={`text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded border cursor-pointer appearance-none pr-5 focus:outline-hidden ${
                            item.priority === 'High'
                              ? 'bg-danger-bg text-red-300 border-red-900/60'
                              : item.priority === 'Medium'
                              ? 'bg-[#261E14] text-gold border-gold/40'
                              : 'bg-surface text-text-muted border-line'
                          }`}
                          title="Click to switch priority immediately"
                        >
                          <option value="High" className="bg-card text-red-400">🔥 High Priority</option>
                          <option value="Medium" className="bg-card text-gold">⚡ Medium Priority</option>
                          <option value="Low" className="bg-card text-text-muted">🌱 Low Priority</option>
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-2 pointer-events-none text-current opacity-70" />
                      </div>
                    )}
                  </div>

                  {/* Smoke Time Badge */}
                  {displayFields.smokeTime && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface border border-line rounded text-[10px] text-gold mb-2 font-medium">
                      <Clock className="w-3 h-3 text-gold" />
                      <span>Est. Smoke Time: {item.smokeTimeRange || smokeTime.range}</span>
                    </div>
                  )}

                  {/* Ratings and Critic Review Scores */}
                  {displayFields.rating && (() => {
                    const { rating: itemRating, scores: itemScores } = getItemRatings(item);
                    if (!itemRating && itemScores.length === 0) return null;
                    return (
                      <div className="p-2.5 bg-surface border border-line rounded-md mb-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-gold" />
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gold">
                              Critic & Panel Score
                            </span>
                          </div>
                          {itemRating && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-section-header border border-gold/40 rounded text-xs font-mono font-bold text-gold">
                              <Star className="w-3 h-3 fill-gold text-gold" />
                              <span>{itemRating}</span>
                              <span className="text-[9px] text-text-muted font-normal">/100</span>
                            </div>
                          )}
                        </div>
                        {itemScores.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-line/60">
                            {itemScores.map((sc, idx) => (
                              <div
                                key={idx}
                                className="text-[10px] px-1.5 py-0.5 bg-card text-text border border-line rounded flex items-center gap-1"
                                title={`${sc.source}: ${sc.score}${sc.scale ? '/' + sc.scale : ''}${sc.award ? ' (' + sc.award + ')' : ''}`}
                              >
                                <span className="text-text-muted font-medium">{sc.source}:</span>
                                <span className="text-gold font-bold">★{sc.score}</span>
                                {sc.award && (
                                  <span className="text-[8px] bg-gold/20 text-gold px-1 rounded font-semibold">
                                    {sc.award}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Notes */}
                  {displayFields.notes && item.notes && (
                    <p className="text-xs text-text italic bg-surface p-2.5 rounded border border-line my-2 font-serif">
                      "{item.notes}"
                    </p>
                  )}

                  {/* Pricing and Quotes */}
                  <div className="space-y-1.5 text-xs text-text-muted pt-1">
                    {displayFields.targetPrice && item.targetPrice !== undefined && (
                      <div className="flex items-center justify-between">
                        <span>Target Max Price:</span>
                        <strong className="text-emerald-400 font-serif font-semibold">
                          {formatCurrency(item.targetPrice, '£')}
                        </strong>
                      </div>
                    )}

                    {displayFields.retailerQuotes && (
                      <div className="pt-1.5 border-t border-line/60 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-text-muted">
                          <span className="uppercase tracking-wider">
                            Shop Quotes ({quotes.length}):
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleScanRetailerPricesForWishlistItem(item)}
                              disabled={scanningItemId === item.id}
                              className="text-gold hover:underline cursor-pointer flex items-center gap-0.5 text-[10px]"
                              title="Scan UK Tobacconists for live prices"
                            >
                              {scanningItemId === item.id ? (
                                <>
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  <span>Scanning...</span>
                                </>
                              ) : (
                                <>
                                  <Globe className="w-2.5 h-2.5" />
                                  <span>🇬🇧 Scan UK</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                if (quickQuoteItemId === item.id) {
                                  setQuickQuoteItemId(null);
                                } else {
                                  setQuickQuoteItemId(item.id);
                                  setQuickQuotePrice('');
                                }
                              }}
                              className="text-text-muted hover:text-text hover:underline cursor-pointer flex items-center gap-0.5 text-[10px]"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Quote</span>
                            </button>
                          </div>
                        </div>

                        {/* Inline Quick Add Form for this item */}
                        {quickQuoteItemId === item.id && (
                          <div className="p-2.5 bg-surface border border-gold/40 rounded-md space-y-2">
                            {/* Vendor Quick Tags */}
                            <div className="flex flex-wrap gap-1">
                              {quickQuoteCustomTags.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => setQuickQuoteVendor(tag)}
                                  className={`text-[9px] px-1.5 py-0.5 rounded transition flex items-center gap-1 cursor-pointer ${
                                    quickQuoteVendor === tag
                                      ? 'bg-gold text-ink font-bold'
                                      : 'bg-card text-text-muted border border-line hover:text-text'
                                  }`}
                                >
                                  <span>{tag}</span>
                                  <span
                                    onClick={(e) => handleDeleteCustomTag(tag, e)}
                                    className="hover:text-red-400"
                                    title="Delete tag"
                                  >
                                    ×
                                  </span>
                                </button>
                              ))}

                              {isAddingTag ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    placeholder="Shop name"
                                    value={newTagInput}
                                    onChange={(e) => setNewTagInput(e.target.value)}
                                    className="bg-header border border-gold rounded px-1.5 py-0.5 text-[9px] text-text w-20"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCustomTag();
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={handleAddCustomTag}
                                    className="text-[9px] text-gold font-bold"
                                  >
                                    ✓
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setIsAddingTag(true)}
                                  className="text-[9px] px-1.5 py-0.5 bg-card text-gold border border-dashed border-gold/50 rounded hover:bg-card-hover"
                                >
                                  + Shop Tag
                                </button>
                              )}
                            </div>

                            {/* Price input & save */}
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Price £"
                                value={quickQuotePrice}
                                onChange={(e) => setQuickQuotePrice(e.target.value)}
                                className="flex-1 bg-header border border-line rounded px-2 py-1 text-xs text-text focus:outline-hidden focus:border-gold"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveQuickQuote(item)}
                                className="px-2.5 py-1 bg-gold text-ink font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}

                        {/* List of Quotes with delete and add to basket buttons */}
                        {quotes.length > 0 ? (
                          <div className="space-y-1">
                            {quotes.map((vp) => {
                              const isBest = vp.price === minPrice && quotes.length > 1;
                              const isSelectedShop =
                                selectedShopFilter !== 'ALL' &&
                                canonicalizeVendorName(vp.vendor) === canonicalizeVendorName(selectedShopFilter);
                              return (
                                <div
                                  key={vp.id}
                                  className={`flex items-center justify-between px-2 py-1 rounded text-[11px] ${
                                    isSelectedShop
                                      ? 'bg-selected border border-gold text-white font-medium shadow-xs'
                                      : isBest
                                      ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 font-medium'
                                      : 'bg-surface border border-line text-text'
                                  }`}
                                >
                                  <div className="truncate flex items-center gap-1">
                                    <span>{vp.vendor}</span>
                                    {isBest && (
                                      <span className="px-1 py-0.2 bg-emerald-800 text-white text-[8px] font-bold uppercase rounded-xs">
                                        Best
                                      </span>
                                    )}
                                    {isSelectedShop && !isBest && (
                                      <span className="px-1 py-0.2 bg-gold text-ink text-[8px] font-bold uppercase rounded-xs">
                                        Filter
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 font-mono font-bold text-gold">
                                    <span>{formatCurrency(vp.price, vp.currency || '£')}</span>
                                    <button
                                      onClick={() => handleAddToBasket(item, vp.vendor, vp.price, vp.url)}
                                      className="text-gold hover:text-white p-0.5 cursor-pointer"
                                      title={`Add to Basket from ${vp.vendor} (${formatCurrency(vp.price, '£')})`}
                                    >
                                      <ShoppingCart className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRetailerQuote(item, vp.id)}
                                      className="text-text-muted hover:text-red-400 p-0.5 cursor-pointer ml-0.5"
                                      title={`Delete quote from ${vp.vendor}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          item.sourceRetailer && (
                            <div className="flex items-center justify-between text-xs">
                              <span>Retailer:</span>
                              <strong className="text-text">{item.sourceRetailer}</strong>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-line mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAddToBasket(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gold hover:brightness-110 text-ink rounded text-xs font-bold transition cursor-pointer shadow-xs"
                      title="Add to Shopping Basket at Best Price"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>
                        {basket.some((b) => b.wishlistItemId === item.id)
                          ? `In Basket (${basket.find((b) => b.wishlistItemId === item.id)?.quantity}) +`
                          : 'Add to Basket'}
                      </span>
                    </button>

                    <button
                      onClick={() => onAcquireItem(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-surface hover:bg-[#1E2922] text-emerald-400 border border-emerald-800/60 rounded text-xs font-medium transition cursor-pointer"
                      title="Acquired this stick! Move to inventory"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Vault</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {onOpenPriceEditor && (
                      <button
                        onClick={() =>
                          onOpenPriceEditor({
                            brand: item.brand,
                            name: item.name,
                            vitola: item.vitola,
                            price: item.targetPrice || minPrice,
                            vendor: item.sourceRetailer,
                          })
                        }
                        className="p-1.5 bg-surface hover:bg-card-hover text-gold border border-line rounded cursor-pointer"
                        title="Compare / Add multiple retailer prices"
                      >
                        <Store className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-1.5 bg-surface hover:bg-card-hover text-text hover:text-gold border border-line rounded cursor-pointer"
                      title="Edit Wishlist Item"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onResearchCigar(`${item.brand} ${item.name}`)}
                      className="p-1.5 bg-surface hover:bg-card-hover text-gold border border-line rounded cursor-pointer"
                      title="Research Blend Dossier"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteWishlistItem(item.id)}
                      className="p-1.5 bg-surface hover:bg-danger-bg text-text-muted hover:text-red-400 border border-line rounded cursor-pointer"
                      title="Delete from Wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredWishlist.length === 0 && (
            <div className="col-span-full text-center py-12 bg-card border border-line rounded-lg">
              <Bookmark className="w-8 h-8 text-text-muted/50 mx-auto mb-3" />
              <h3 className="text-sm font-serif font-semibold text-text">
                {wishlist.length === 0 ? 'No Wishlist Items Yet' : 'No Cigars Match Current Filter'}
              </h3>
              <p className="text-xs text-text-muted mt-1">
                {wishlist.length === 0
                  ? "Add rare cigars you'd love to hunt down or buy when restocked."
                  : 'Try adjusting your search query or priority filter.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* SHOPPING BASKET SLIDE-OVER / MODAL */}
      {isBasketOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center sm:justify-end p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-line rounded-lg sm:rounded-l-lg sm:rounded-r-none w-full max-w-2xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Basket Header */}
            <div className="p-4 sm:p-5 bg-header border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gold/10 text-gold border border-gold/30 rounded-md">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-base text-white flex items-center gap-2">
                    <span>Wishlist Shopping Basket</span>
                    <span className="text-xs px-2 py-0.5 bg-gold text-ink font-bold rounded-full font-sans">
                      {totalBasketCount} {totalBasketCount === 1 ? 'stick' : 'sticks'}
                    </span>
                  </h3>
                  <p className="text-xs text-text-muted">
                    Curated basket optimized for the best available retailer deals across UK tobacconists.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBasketOpen(false)}
                className="p-1.5 text-text-muted hover:text-white bg-surface hover:bg-line border border-line rounded-md transition cursor-pointer"
                title="Close Basket"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basket Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {basket.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <ShoppingCart className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
                  <h4 className="font-serif text-base text-text font-semibold">Your Basket is Empty</h4>
                  <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                    Click "Add to Basket" or "Add Best Deals" on any cigar to bundle your purchase at the best quoted prices.
                  </p>
                  {filteredWishlist.length > 0 && (
                    <button
                      onClick={handleAddAllBestDealsToBasket}
                      className="mt-4 px-4 py-2 bg-gold hover:brightness-110 text-ink font-bold text-xs uppercase tracking-wider rounded-md transition cursor-pointer shadow-sm"
                    >
                      Add All ({filteredWishlist.length}) Filtered Cigars
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Bar */}
                  <div className="p-3.5 bg-surface border border-line rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-text-muted block text-[10px] uppercase font-bold">Total Items</span>
                        <span className="font-mono font-bold text-white text-sm">{totalBasketCount} units</span>
                      </div>
                      <div className="border-l border-line pl-4">
                        <span className="text-text-muted block text-[10px] uppercase font-bold">Vendors</span>
                        <span className="font-mono font-bold text-white text-sm">{Object.keys(basketByVendor).length} shops</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-text-muted block text-[10px] uppercase font-bold">Estimated Total</span>
                      <span className="font-mono font-bold text-gold text-base">
                        {formatCurrency(totalBasketPrice, '£')}
                      </span>
                    </div>
                  </div>

                  {/* Grouped by Vendor / Tobacconist */}
                  <div className="space-y-4">
                    {Object.entries(basketByVendor).map(([vendor, group]) => (
                      <div
                        key={vendor}
                        className="bg-surface border border-line rounded-lg overflow-hidden"
                      >
                        {/* Vendor Header */}
                        <div className="p-3 bg-[#181513] border-b border-line flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-gold" />
                            <span className="font-bold text-xs text-text">{vendor}</span>
                            <span className="text-[10px] text-text-muted px-1.5 py-0.2 bg-card rounded border border-line">
                              {group.count} items
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-gold">
                              Subtotal: {formatCurrency(group.total, '£')}
                            </span>
                          </div>
                        </div>

                        {/* Items in Vendor Group */}
                        <div className="divide-y divide-line/60">
                          {group.items.map((bItem) => {
                            const lineTotal = (bItem.unitPrice || 0) * bItem.quantity;
                            return (
                              <div
                                key={bItem.id}
                                className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-header transition"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] uppercase font-bold text-gold">
                                      {bItem.brand}
                                    </span>
                                    {bItem.vitola && (
                                      <span className="text-[10px] text-text-muted">
                                        • {bItem.vitola}
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-serif font-semibold text-sm text-white truncate">
                                    {bItem.name}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted">
                                    <span className="font-mono text-emerald-400 font-bold">
                                      {formatCurrency(bItem.unitPrice || 0, '£')} each
                                    </span>
                                    {bItem.sourceUrl && (
                                      <a
                                        href={bItem.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gold hover:underline flex items-center gap-0.5"
                                      >
                                        <span>View Store</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                </div>

                                {/* Controls: Quantity Stepper & Actions */}
                                <div className="flex items-center justify-between sm:justify-end gap-3">
                                  {/* Quantity Stepper */}
                                  <div className="flex items-center border border-line rounded bg-card">
                                    <button
                                      onClick={() => handleUpdateBasketQuantity(bItem.id, -1)}
                                      className="p-1 px-2 text-text-muted hover:text-white hover:bg-line rounded-l cursor-pointer text-xs"
                                      title="Decrease quantity"
                                    >
                                      -
                                    </button>
                                    <span className="px-2.5 py-0.5 text-xs font-mono font-bold text-white min-w-[28px] text-center">
                                      {bItem.quantity}
                                    </span>
                                    <button
                                      onClick={() => handleUpdateBasketQuantity(bItem.id, 1)}
                                      className="p-1 px-2 text-text-muted hover:text-white hover:bg-line rounded-r cursor-pointer text-xs"
                                      title="Increase quantity"
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* Line Total */}
                                  <div className="font-mono font-bold text-sm text-white min-w-[65px] text-right">
                                    {formatCurrency(lineTotal, '£')}
                                  </div>

                                  {/* Individual Remove Button */}
                                  <button
                                    onClick={() => handleRemoveFromBasket(bItem.id)}
                                    className="p-1.5 text-text-muted hover:text-red-400 hover:bg-danger-bg border border-line rounded cursor-pointer transition"
                                    title="Remove from basket"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Basket Footer */}
            {basket.length > 0 && (
              <div className="p-4 sm:p-5 bg-header border-t border-line space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearBasket}
                      className="text-xs text-text-muted hover:text-red-400 underline cursor-pointer"
                    >
                      Clear Basket
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-text-muted text-[11px] mr-2">Grand Total ({totalBasketCount} sticks):</span>
                    <span className="font-mono font-bold text-lg text-gold">
                      {formatCurrency(totalBasketPrice, '£')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={printShoppingBasket}
                    className="py-2.5 px-4 bg-gold hover:brightness-110 text-ink border border-gold font-bold text-xs uppercase tracking-wider rounded-md flex items-center justify-center gap-2 cursor-pointer transition"
                    title="Print the current shopping basket or save it as a PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>

                  <button
                    onClick={handleAcquireEntireBasket}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-md flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Acquire All to Vault Inventory</span>
                  </button>

                  <button
                    onClick={() => {
                      const textSummary = basket
                        .map(
                          (b) =>
                            `• ${b.quantity}x ${b.brand} ${b.name} (${b.vitola || 'Standard'}) - ${formatCurrency(
                              b.unitPrice || 0,
                              '£'
                            )} @ ${b.vendor}${b.sourceUrl ? ` (${b.sourceUrl})` : ''}`
                        )
                        .join('\n');
                      const fullCopy = `THE HUMIDOR - WISHLIST SHOPPING LIST\nTotal: ${formatCurrency(
                        totalBasketPrice,
                        '£'
                      )} (${totalBasketCount} sticks across ${Object.keys(basketByVendor).length} shops)\n\n${textSummary}`;
                      navigator.clipboard.writeText(fullCopy);
                      setFeedbackNotice('📋 Formatted shopping list copied to clipboard!');
                    }}
                    className="py-2.5 px-4 bg-card hover:bg-card-hover text-text hover:text-white border border-line font-bold text-xs uppercase tracking-wider rounded-md flex items-center justify-center gap-2 cursor-pointer transition"
                    title="Copy formatted shopping list to clipboard"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy List</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
