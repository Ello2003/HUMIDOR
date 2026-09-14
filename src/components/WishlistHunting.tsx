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
} from 'lucide-react';
import { WishlistItem, Cigar, AppSettings, VendorPriceEntry, CigarResearchItem, ReviewScoreEntry, WishlistBasketItem } from '../types';
import { formatCurrency, DEFAULT_CURRENCY } from '../utils/currencyUtils';
import {
  estimateAccurateSmokeTime,
  canonicalizeVendorName,
  findMatchingResearchCigar,
  areCigarsMatching,
} from '../utils/researchUtils';

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
      const sorted = [...quotes].sort((a, b) => a.price - b.price);
      return {
        price: sorted[0].price,
        vendor: canonicalizeVendorName(sorted[0].vendor),
        currency: sorted[0].currency || '£',
        url: sorted[0].url || item.sourceUrl,
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
    const minPrice = Math.min(...quotes.map((q) => q.price));
    const shopQuotes = quotes.filter((q) => canonicalizeVendorName(q.vendor).toLowerCase() === targetCanonical);
    if (shopQuotes.length === 0) return false;
    return shopQuotes.some((sq) => sq.price <= minPrice + 0.001);
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
        const minPrice = Math.min(...quotes.map((q) => q.price));
        quotes.forEach((q) => {
          const c = canonicalizeVendorName(q.vendor);
          const current = shopMap.get(c) || { totalQuotes: 0, bestPriceCount: 0 };
          current.totalQuotes += 1;
          if (q.price <= minPrice + 0.001) {
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
          merged.sort((a, b) => a.price - b.price);
          const minPrice = merged[0]?.price;
          const bestVendor = merged[0]?.vendor;
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
    basket.forEach((bItem) => {
      const match = wishlist.find(
        (w) => w.id === bItem.wishlistItemId || (w.brand === bItem.brand && w.name === bItem.name)
      );
      if (match) {
        onAcquireItem(match);
      } else {
        onAcquireItem({
          id: `acquired-basket-${bItem.id}`,
          brand: bItem.brand,
          name: bItem.name,
          vitola: bItem.vitola,
          targetPrice: bItem.unitPrice,
          priority: 'High',
          sourceRetailer: bItem.vendor,
          sourceUrl: bItem.sourceUrl,
          createdAt: new Date().toISOString(),
        });
      }
    });
    setBasket([]);
    setIsBasketOpen(false);
    setFeedbackNotice(`✨ Acquired all ${basket.reduce((a, b) => a + b.quantity, 0)} cigars into your Humidor Vault!`);
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
      estimatedPrice: remainingQuotes.length > 0 ? Math.min(...remainingQuotes.map((q) => q.price)) : undefined,
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

      if (!response.ok) {
        throw new Error('Scanner request failed');
      }

      const data = await response.json();
      const scannedPrices: VendorPriceEntry[] = data.prices || [];

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

        merged.sort((a, b) => a.price - b.price);
        const minPrice = merged[0]?.price;
        const bestVendor = merged[0]?.vendor;

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

        setFeedbackNotice(
          `🇬🇧 Updated shop quotes for ${item.brand} ${item.name}! Best quote: £${minPrice.toFixed(2)} at ${bestVendor}.`
        );
      } else {
        setFeedbackNotice(`Scanned UK retailers — no direct matches found for ${item.brand} ${item.name}.`);
      }
    } catch (err) {
      console.error('Error scanning retailer prices:', err);
      setFeedbackNotice(`Price scan completed for ${item.brand} ${item.name}.`);
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

      if (!response.ok) {
        throw new Error('Batch scanner request failed');
      }

      const data = await response.json();
      const results: Array<{ id: string; brand: string; name: string; prices: VendorPriceEntry[] }> = data.results || [];
      let updatedCount = 0;

      results.forEach((res) => {
        const item = wishlist.find(
          (w) => w.id === res.id || areCigarsMatching(w, { brand: res.brand, name: res.name, line: res.name })
        );
        if (item && res.prices && res.prices.length > 0) {
          const currentQuotes = item.vendorPrices || [];
          const merged = [...currentQuotes];

          res.prices.forEach((sp) => {
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

          merged.sort((a, b) => a.price - b.price);
          const minPrice = merged[0]?.price;
          const bestVendor = merged[0]?.vendor;

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
      setFeedbackNotice('Completed batch scan across UK retailers.');
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
    updatedPrices.sort((a, b) => a.price - b.price);

    onUpdateWishlistItem(item.id, {
      vendorPrices: updatedPrices,
      estimatedPrice: updatedPrices[0]?.price,
      sourceRetailer: vendorName,
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
    const minPrice = existingQuotes.length > 0 ? Math.min(...existingQuotes.map((p) => p.price)) : (targetPrice ? parseFloat(targetPrice) : undefined);
    const bestVendor = existingQuotes.length > 0 ? existingQuotes.find((p) => p.price === minPrice)?.vendor : undefined;

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
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-gradient-to-br from-[#1C1816] via-[#161311] to-[#13110F] border border-[#2C2621] rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#C5A059]" />
            <h1 className="text-xl sm:text-2xl font-serif text-white font-normal">
              Wishlist
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A89F94] mt-1">
            What to buy next…
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Shopping Basket Button with Badge */}
          <button
            onClick={() => setIsBasketOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm ${
              totalBasketCount > 0
                ? 'bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F0D0C] hover:brightness-110'
                : 'bg-[#13110F] text-[#E5E1DA] border border-[#2C2621] hover:border-[#C5A059] hover:text-[#C5A059]'
            }`}
            title="Open Shopping Basket with Best Prices across Tobacconists"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>Basket</span>
            {totalBasketCount > 0 ? (
              <span className="flex items-center gap-1.5 pl-1.5 border-l border-[#0F0D0C]/30 text-[11px]">
                <span className="bg-[#0F0D0C] text-[#C5A059] px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {totalBasketCount}
                </span>
                <span className="font-serif">{formatCurrency(totalBasketPrice, '£')}</span>
              </span>
            ) : (
              <span className="text-[10px] text-[#A89F94] lowercase font-normal">(0 items)</span>
            )}
          </button>

          {/* Quick Add All Best Deals to Basket */}
          {filteredWishlist.length > 0 && (
            <button
              onClick={handleAddAllBestDealsToBasket}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1C1816] hover:bg-[#241E1B] text-[#C5A059] border border-[#C5A059]/40 hover:border-[#C5A059] rounded-md text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
              title="Add all currently displayed cigars to Basket using their lowest/best retailer price"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Best Deals ({filteredWishlist.length})</span>
            </button>
          )}

          {/* Add Cigar Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#C5A059] text-[#0F0D0C] hover:bg-[#b08e4c] rounded-md text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Cigar</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#13110F] border border-[#2C2621] rounded-md p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#C5A059] text-[#0F0D0C]'
                  : 'text-[#A89F94] hover:text-[#E5E1DA]'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#C5A059] text-[#0F0D0C]'
                  : 'text-[#A89F94] hover:text-[#E5E1DA]'
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
                ? 'bg-[#C5A059] text-[#0F0D0C] border-[#C5A059]'
                : 'bg-[#13110F] text-[#A89F94] border-[#2C2621] hover:text-[#E5E1DA]'
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
        <div className="flex items-center justify-between p-3.5 bg-[#1C1816] border border-[#C5A059]/40 rounded-lg text-xs text-[#E5E1DA] animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-[#A89F94] hover:text-white cursor-pointer ml-3 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Inline Display Settings & Presets Panel */}
      {showDisplayOptions && (
        <div className="p-4 bg-[#161311] border border-[#2C2621] rounded-lg space-y-3 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2C2621] pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#E5E1DA]">
                Inline Field Visibility & View Presets
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-semibold text-[#A89F94] mr-1">Presets:</span>
              <button
                onClick={() => applyPreset('all')}
                className="px-2 py-1 bg-[#13110F] hover:bg-[#241E1B] text-[#C5A059] border border-[#2C2621] rounded text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
              >
                All Details
              </button>
              <button
                onClick={() => applyPreset('keySpecs')}
                className="px-2 py-1 bg-[#13110F] hover:bg-[#241E1B] text-[#E5E1DA] border border-[#2C2621] rounded text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
              >
                Key Specs Only
              </button>
              <button
                onClick={() => applyPreset('priceHunter')}
                className="px-2 py-1 bg-[#13110F] hover:bg-[#241E1B] text-[#E5E1DA] border border-[#2C2621] rounded text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
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
                      ? 'bg-[#1F1A17] text-[#C5A059] border-[#C5A059]/40'
                      : 'bg-[#13110F] text-[#A89F94]/60 border-[#2C2621] line-through'
                  }`}
                >
                  <span>{f.label}</span>
                  {active ? (
                    <Eye className="w-3 h-3 text-[#C5A059]" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-[#A89F94]/40" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 bg-[#161311] border border-[#2C2621] rounded-lg space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search className="w-3.5 h-3.5 text-[#A89F94] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search wishlist by brand, line, vitola, notes, retailer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md pl-9 pr-8 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059] placeholder-[#A89F94]/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-[#A89F94] hover:text-[#E5E1DA]"
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
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
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
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
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
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
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
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#2C2621]/60">
          {/* Priority Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-[#A89F94] uppercase font-semibold tracking-wider mr-1">
              Priority:
            </span>
            <button
              onClick={() => setPriorityFilter('ALL')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                priorityFilter === 'ALL'
                  ? 'bg-[#C5A059] text-[#0F0D0C] font-bold'
                  : 'bg-[#13110F] text-[#A89F94] border border-[#2C2621] hover:text-[#E5E1DA]'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setPriorityFilter('High')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                priorityFilter === 'High'
                  ? 'bg-red-900/80 text-red-100 font-bold border border-red-700'
                  : 'bg-[#13110F] text-red-400 border border-[#2C2621] hover:bg-[#2C1515]'
              }`}
            >
              🔥 High ({counts.high})
            </button>
            <button
              onClick={() => setPriorityFilter('Medium')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                priorityFilter === 'Medium'
                  ? 'bg-[#8B5E3C] text-amber-100 font-bold border border-[#C5A059]'
                  : 'bg-[#13110F] text-[#C5A059] border border-[#2C2621] hover:bg-[#241E1B]'
              }`}
            >
              ⚡ Medium ({counts.medium})
            </button>
            <button
              onClick={() => setPriorityFilter('Low')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                priorityFilter === 'Low'
                  ? 'bg-[#2A241F] text-[#E5E1DA] font-bold border border-[#4A4036]'
                  : 'bg-[#13110F] text-[#A89F94] border border-[#2C2621] hover:bg-[#1C1816]'
              }`}
            >
              🌱 Low ({counts.low})
            </button>
          </div>

          {/* Smoke Duration Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-[#A89F94] uppercase font-semibold tracking-wider mr-1">
              ⏱️ Duration:
            </span>
            <button
              onClick={() => setSmokeTimeFilter('ALL')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                smokeTimeFilter === 'ALL'
                  ? 'bg-[#C5A059] text-[#0F0D0C] font-bold'
                  : 'bg-[#13110F] text-[#A89F94] border border-[#2C2621] hover:text-[#E5E1DA]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSmokeTimeFilter('quick')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                smokeTimeFilter === 'quick'
                  ? 'bg-[#C5A059] text-[#0F0D0C] font-bold'
                  : 'bg-[#13110F] text-[#E5E1DA] border border-[#2C2621] hover:border-[#C5A059]'
              }`}
            >
              ⚡ Quick (&le;45m)
            </button>
            <button
              onClick={() => setSmokeTimeFilter('medium')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                smokeTimeFilter === 'medium'
                  ? 'bg-[#C5A059] text-[#0F0D0C] font-bold'
                  : 'bg-[#13110F] text-[#E5E1DA] border border-[#2C2621] hover:border-[#C5A059]'
              }`}
            >
              ⏳ Medium (45-75m)
            </button>
            <button
              onClick={() => setSmokeTimeFilter('long')}
              className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                smokeTimeFilter === 'long'
                  ? 'bg-[#C5A059] text-[#0F0D0C] font-bold'
                  : 'bg-[#13110F] text-[#E5E1DA] border border-[#2C2621] hover:border-[#C5A059]'
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
                    : 'bg-[#13110F] text-[#E5E1DA] border-[#2C2621] hover:border-emerald-600 hover:text-emerald-300'
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
                className="text-[10px] px-2.5 py-1 rounded bg-[#241E1B] hover:bg-[#2C2621] text-[#C5A059] hover:text-white border border-[#3D352E] flex items-center gap-1 cursor-pointer transition"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Tobacconist Chips Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#2C2621]/40 text-[10px]">
          <span className="text-[#A89F94] font-semibold uppercase tracking-wider flex items-center gap-1 mr-1">
            <Store className="w-3 h-3 text-[#C5A059]" />
            <span>Shop Deals:</span>
          </span>
          <button
            onClick={() => setSelectedShopFilter('ALL')}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              selectedShopFilter === 'ALL'
                ? 'bg-[#C5A059] text-[#0F0D0C] font-bold'
                : 'bg-[#13110F] text-[#A89F94] border border-[#2C2621] hover:text-[#E5E1DA]'
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
                    ? 'bg-[#C5A059] text-[#0F0D0C] font-bold'
                    : 'bg-[#13110F] text-[#E5E1DA] border border-[#2C2621] hover:border-[#C5A059]'
                }`}
              >
                <span>{s.name}</span>
                {s.bestPriceCount > 0 && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded-xs font-mono font-bold ${
                      isSelected ? 'bg-[#0F0D0C] text-[#C5A059]' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
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
        <form onSubmit={handleSubmit} className="p-5 bg-[#1C1816] border border-[#2C2621] rounded-lg space-y-4 shadow-sm">
          <h3 className="text-sm font-serif font-semibold text-[#C5A059]">Track New Cigar on Wishlist</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Brand *</label>
              <input
                type="text"
                required
                placeholder="e.g. Arturo Fuente"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Cigar / Line Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Opus X Fuente Fuente"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Vitola / Format</label>
              <input
                type="text"
                placeholder="e.g. Corona Gorda, Robusto"
                value={vitola}
                onChange={(e) => setVitola(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Target Max Price (£)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 35.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
              >
                <option value="High">🔥 High (Grail / Must Buy)</option>
                <option value="Medium">⚡ Medium (Keep eye out)</option>
                <option value="Low">🌱 Low (Casual interest)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Initial Retailer (Optional)</label>
              <input
                type="text"
                placeholder="e.g. C.Gars Ltd, Sautter"
                value={sourceRetailer}
                onChange={(e) => setSourceRetailer(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Hunt Notes & Release Details</label>
            <textarea
              rows={2}
              placeholder="e.g. Restocks usually occur in November; look for 2022 release date box code."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-[#13110F] text-[#A89F94] hover:text-[#E5E1DA] border border-[#2C2621] rounded-md text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#C5A059] hover:brightness-110 text-[#0F0D0C] font-bold uppercase tracking-wider rounded-md text-xs shadow-sm cursor-pointer"
            >
              Save to Wishlist
            </button>
          </div>
        </form>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1816] border border-[#2C2621] rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#2C2621] pb-3">
              <h3 className="font-serif font-semibold text-base text-white">Edit Wishlist Cigar</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-[#A89F94] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Vitola</label>
                  <input
                    type="text"
                    value={editVitola}
                    onChange={(e) => setEditVitola(e.target.value)}
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
                  >
                    <option value="High">🔥 High (Grail / Must Buy)</option>
                    <option value="Medium">⚡ Medium (Keep eye out)</option>
                    <option value="Low">🌱 Low (Casual interest)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Target Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editTargetPrice}
                    onChange={(e) => setEditTargetPrice(e.target.value)}
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Source / Retailer</label>
                  <input
                    type="text"
                    value={editSourceRetailer}
                    onChange={(e) => setEditSourceRetailer(e.target.value)}
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Retailer Web Link</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editSourceUrl}
                  onChange={(e) => setEditSourceUrl(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#A89F94] mb-1">Notes / Details</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#2C2621]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-[#13110F] text-[#A89F94] hover:text-[#E5E1DA] border border-[#2C2621] rounded-md text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C5A059] hover:brightness-110 text-[#0F0D0C] font-bold uppercase tracking-wider rounded-md text-xs shadow-sm cursor-pointer"
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
        <div className="bg-[#161311] border border-[#2C2621] rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#13110F] text-[#A89F94] text-[10px] uppercase tracking-wider font-semibold border-b border-[#2C2621]">
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
              <tbody className="divide-y divide-[#2C2621]">
                {filteredWishlist.map((item) => {
                  const smokeTime = estimateAccurateSmokeTime(item.vitola, item.lengthInches, item.ringGauge);
                  const quotes = item.vendorPrices || [];
                  const minPrice = quotes.length > 0 ? Math.min(...quotes.map((q) => q.price)) : undefined;
                  const { rating: itemRating, scores: itemScores } = getItemRatings(item);

                  return (
                    <tr key={item.id} className="hover:bg-[#1F1A17] transition">
                      {displayFields.priority && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <select
                            value={item.priority || 'High'}
                            onChange={(e) => handleQuickChangePriority(item, e.target.value as any)}
                            className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border cursor-pointer ${
                              item.priority === 'High'
                                ? 'bg-[#2C1515] text-red-300 border-red-900/60'
                                : item.priority === 'Medium'
                                ? 'bg-[#261E14] text-[#C5A059] border-[#C5A059]/40'
                                : 'bg-[#13110F] text-[#A89F94] border-[#2C2621]'
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
                          <div className="space-y-1 p-2 bg-[#13110F] border border-[#C5A059] rounded min-w-[180px]">
                            <input
                              type="text"
                              placeholder="Brand"
                              value={inlineBrand}
                              onChange={(e) => setInlineBrand(e.target.value)}
                              className="w-full bg-[#1C1816] border border-[#2C2621] rounded px-1.5 py-0.5 text-xs text-[#E5E1DA] focus:border-[#C5A059]"
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
                              className="w-full bg-[#1C1816] border border-[#2C2621] rounded px-1.5 py-0.5 text-xs text-[#E5E1DA] focus:border-[#C5A059]"
                            />
                            <div className="flex gap-1 pt-1">
                              <button
                                onClick={() => handleSaveInlineEdit(item)}
                                className="px-2 py-0.5 bg-[#C5A059] text-[#0F0D0C] rounded font-bold text-[10px]"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingNameId(null)}
                                className="px-1.5 py-0.5 bg-[#2C2621] text-[#A89F94] rounded text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-[#C5A059]">
                                {item.brand}
                              </span>
                              <button
                                onClick={() => handleStartInlineEdit(item)}
                                className="opacity-0 group-hover:opacity-100 text-[#A89F94] hover:text-[#C5A059] transition cursor-pointer"
                                title="Edit name inline (syncs across all tabs)"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <div
                              onClick={() => handleStartInlineEdit(item)}
                              className="font-serif font-semibold text-white hover:text-[#C5A059] cursor-pointer transition"
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
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1F1A17] border border-[#C5A059]/40 rounded text-[11px] font-bold text-[#C5A059]">
                                  <Star className="w-3 h-3 fill-[#C5A059] text-[#C5A059]" />
                                  <span>{itemRating}</span>
                                  <span className="text-[9px] text-[#A89F94] font-normal">/100</span>
                                </div>
                              )}
                              {itemScores.length > 0 && (
                                <div className="flex flex-wrap gap-1 max-w-[170px]">
                                  {itemScores.slice(0, 2).map((sc, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[9px] px-1.5 py-0.5 bg-[#13110F] text-[#E5E1DA] border border-[#2C2621] rounded"
                                      title={`${sc.source}: ${sc.score}${sc.scale ? '/' + sc.scale : ''}${sc.award ? ' (' + sc.award + ')' : ''}`}
                                    >
                                      <span className="text-[#A89F94] font-medium">{sc.source.split(' ')[0]}:</span> <strong className="text-[#C5A059]">★{sc.score}</strong>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#A89F94]/50 italic text-[10px]">Unrated</span>
                          )}
                        </td>
                      )}
                      {displayFields.vitolaSpecs && (
                        <td className="py-3 px-3 text-[#A89F94]">{item.vitola || '—'}</td>
                      )}
                      {displayFields.smokeTime && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#13110F] border border-[#2C2621] rounded text-[10px] text-[#C5A059]">
                            <Clock className="w-3 h-3 text-[#C5A059]" />
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
                                        : 'bg-[#13110F] text-[#E5E1DA] border border-[#2C2621]'
                                    }`}
                                  >
                                    <span className="truncate">{vp.vendor}</span>
                                    <div className="flex items-center gap-1 font-mono font-bold">
                                      <span>{formatCurrency(vp.price, vp.currency || '£')}</span>
                                      <button
                                        onClick={() => handleAddToBasket(item, vp.vendor, vp.price, vp.url)}
                                        className="text-[#C5A059] hover:text-white cursor-pointer p-0.5"
                                        title={`Add to Basket from ${vp.vendor} (${formatCurrency(vp.price, '£')})`}
                                      >
                                        <ShoppingCart className="w-2.5 h-2.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteRetailerQuote(item, vp.id)}
                                        className="text-[#A89F94] hover:text-red-400 cursor-pointer p-0.5"
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
                              <span className="text-[#A89F94]/50 italic text-[10px]">No quotes</span>
                              <button
                                onClick={() => handleScanRetailerPricesForWishlistItem(item)}
                                disabled={scanningItemId === item.id}
                                className="text-[10px] text-[#C5A059] hover:underline flex items-center gap-0.5 cursor-pointer"
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
                        <td className="py-3 px-3 max-w-xs truncate text-[#A89F94] italic">
                          {item.notes || '—'}
                        </td>
                      )}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleAddToBasket(item)}
                            className="p-1.5 bg-[#1C1816] hover:bg-[#C5A059] text-[#C5A059] hover:text-[#0F0D0C] border border-[#C5A059]/50 rounded cursor-pointer transition"
                            title="Add Best Price to Shopping Basket"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onAcquireItem(item)}
                            className="p-1.5 bg-[#13110F] hover:bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 rounded cursor-pointer"
                            title="Acquired! Move to Vault"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleScanRetailerPricesForWishlistItem(item)}
                            disabled={scanningItemId === item.id}
                            className={`p-1.5 bg-[#13110F] hover:bg-[#241E1B] text-[#C5A059] border border-[#2C2621] rounded cursor-pointer ${
                              scanningItemId === item.id ? 'opacity-70 cursor-wait' : ''
                            }`}
                            title="Scan UK Retailer Quotes (C.Gars, Havana House, Smoke King, Sautter, JJ Fox, etc.)"
                          >
                            {scanningItemId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
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
                              className="p-1.5 bg-[#13110F] hover:bg-[#241E1B] text-[#C5A059] border border-[#2C2621] rounded cursor-pointer"
                              title="Compare Retailer Quotes"
                            >
                              <Store className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 bg-[#13110F] hover:bg-[#241E1B] text-[#E5E1DA] hover:text-[#C5A059] border border-[#2C2621] rounded cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onResearchCigar(`${item.brand} ${item.name}`)}
                            className="p-1.5 bg-[#13110F] hover:bg-[#241E1B] text-[#C5A059] border border-[#2C2621] rounded cursor-pointer"
                            title="AI Dossier Research"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteWishlistItem(item.id)}
                            className="p-1.5 bg-[#13110F] hover:bg-[#2C1515] text-[#A89F94] hover:text-red-400 border border-[#2C2621] rounded cursor-pointer"
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
            const minPrice = quotes.length > 0 ? Math.min(...quotes.map((q) => q.price)) : undefined;

            return (
              <div
                key={item.id}
                className="p-5 bg-[#1C1816] border border-[#2C2621] rounded-lg flex flex-col justify-between shadow-sm transition hover:border-[#3D352E]"
              >
                <div>
                  {/* Card Header: Brand, Name & Priority */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      {editingNameId === item.id ? (
                        <div className="space-y-1.5 p-2.5 bg-[#13110F] border border-[#C5A059] rounded-md mb-2">
                          <div className="text-[10px] uppercase font-bold text-[#C5A059]">Edit Name (Syncs Everywhere)</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              placeholder="Brand"
                              value={inlineBrand}
                              onChange={(e) => setInlineBrand(e.target.value)}
                              className="bg-[#1C1816] border border-[#2C2621] rounded px-2 py-1 text-xs text-[#E5E1DA] focus:border-[#C5A059]"
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
                              className="bg-[#1C1816] border border-[#2C2621] rounded px-2 py-1 text-xs text-[#E5E1DA] focus:border-[#C5A059]"
                            />
                          </div>
                          <div className="flex gap-1.5 pt-1">
                            <button
                              onClick={() => handleSaveInlineEdit(item)}
                              className="px-2.5 py-1 bg-[#C5A059] text-[#0F0D0C] rounded font-bold text-xs"
                            >
                              Save & Sync
                            </button>
                            <button
                              onClick={() => setEditingNameId(null)}
                              className="px-2 py-1 bg-[#2C2621] text-[#A89F94] rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#C5A059]">
                              {item.brand}
                            </span>
                            <button
                              onClick={() => handleStartInlineEdit(item)}
                              className="text-[#A89F94] hover:text-[#C5A059] transition cursor-pointer p-0.5"
                              title="Edit name inline (syncs across all tabs)"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <h3
                            onClick={() => handleStartInlineEdit(item)}
                            className="font-serif font-semibold text-base text-[#E5E1DA] hover:text-[#C5A059] cursor-pointer transition"
                            title="Click to edit name inline"
                          >
                            {item.name}
                          </h3>
                        </div>
                      )}
                      {displayFields.vitolaSpecs && item.vitola && (
                        <span className="text-xs text-[#A89F94] block mt-0.5">{item.vitola}</span>
                      )}
                    </div>

                    {displayFields.priority && (
                      <div className="relative group">
                        <select
                          value={item.priority || 'High'}
                          onChange={(e) => handleQuickChangePriority(item, e.target.value as any)}
                          className={`text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded border cursor-pointer appearance-none pr-5 focus:outline-hidden ${
                            item.priority === 'High'
                              ? 'bg-[#2C1515] text-red-300 border-red-900/60'
                              : item.priority === 'Medium'
                              ? 'bg-[#261E14] text-[#C5A059] border-[#C5A059]/40'
                              : 'bg-[#13110F] text-[#A89F94] border-[#2C2621]'
                          }`}
                          title="Click to switch priority immediately"
                        >
                          <option value="High" className="bg-[#1C1816] text-red-400">🔥 High Priority</option>
                          <option value="Medium" className="bg-[#1C1816] text-[#C5A059]">⚡ Medium Priority</option>
                          <option value="Low" className="bg-[#1C1816] text-[#A89F94]">🌱 Low Priority</option>
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-2 pointer-events-none text-current opacity-70" />
                      </div>
                    )}
                  </div>

                  {/* Smoke Time Badge */}
                  {displayFields.smokeTime && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#13110F] border border-[#2C2621] rounded text-[10px] text-[#C5A059] mb-2 font-medium">
                      <Clock className="w-3 h-3 text-[#C5A059]" />
                      <span>Est. Smoke Time: {item.smokeTimeRange || smokeTime.range}</span>
                    </div>
                  )}

                  {/* Ratings and Critic Review Scores */}
                  {displayFields.rating && (() => {
                    const { rating: itemRating, scores: itemScores } = getItemRatings(item);
                    if (!itemRating && itemScores.length === 0) return null;
                    return (
                      <div className="p-2.5 bg-[#13110F] border border-[#2C2621] rounded-md mb-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#C5A059]">
                              Critic & Panel Score
                            </span>
                          </div>
                          {itemRating && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#1F1A17] border border-[#C5A059]/40 rounded text-xs font-mono font-bold text-[#C5A059]">
                              <Star className="w-3 h-3 fill-[#C5A059] text-[#C5A059]" />
                              <span>{itemRating}</span>
                              <span className="text-[9px] text-[#A89F94] font-normal">/100</span>
                            </div>
                          )}
                        </div>
                        {itemScores.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-[#2C2621]/60">
                            {itemScores.map((sc, idx) => (
                              <div
                                key={idx}
                                className="text-[10px] px-1.5 py-0.5 bg-[#1C1816] text-[#E5E1DA] border border-[#2C2621] rounded flex items-center gap-1"
                                title={`${sc.source}: ${sc.score}${sc.scale ? '/' + sc.scale : ''}${sc.award ? ' (' + sc.award + ')' : ''}`}
                              >
                                <span className="text-[#A89F94] font-medium">{sc.source}:</span>
                                <span className="text-[#C5A059] font-bold">★{sc.score}</span>
                                {sc.award && (
                                  <span className="text-[8px] bg-[#C5A059]/20 text-[#C5A059] px-1 rounded font-semibold">
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
                    <p className="text-xs text-[#E5E1DA] italic bg-[#13110F] p-2.5 rounded border border-[#2C2621] my-2 font-serif">
                      "{item.notes}"
                    </p>
                  )}

                  {/* Pricing and Quotes */}
                  <div className="space-y-1.5 text-xs text-[#A89F94] pt-1">
                    {displayFields.targetPrice && item.targetPrice !== undefined && (
                      <div className="flex items-center justify-between">
                        <span>Target Max Price:</span>
                        <strong className="text-emerald-400 font-serif font-semibold">
                          {formatCurrency(item.targetPrice, '£')}
                        </strong>
                      </div>
                    )}

                    {displayFields.retailerQuotes && (
                      <div className="pt-1.5 border-t border-[#2C2621]/60 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-[#A89F94]">
                          <span className="uppercase tracking-wider">
                            Shop Quotes ({quotes.length}):
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleScanRetailerPricesForWishlistItem(item)}
                              disabled={scanningItemId === item.id}
                              className="text-[#C5A059] hover:underline cursor-pointer flex items-center gap-0.5 text-[10px]"
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
                              className="text-[#A89F94] hover:text-[#E5E1DA] hover:underline cursor-pointer flex items-center gap-0.5 text-[10px]"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Quote</span>
                            </button>
                          </div>
                        </div>

                        {/* Inline Quick Add Form for this item */}
                        {quickQuoteItemId === item.id && (
                          <div className="p-2.5 bg-[#13110F] border border-[#C5A059]/40 rounded-md space-y-2">
                            {/* Vendor Quick Tags */}
                            <div className="flex flex-wrap gap-1">
                              {quickQuoteCustomTags.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => setQuickQuoteVendor(tag)}
                                  className={`text-[9px] px-1.5 py-0.5 rounded transition flex items-center gap-1 cursor-pointer ${
                                    quickQuoteVendor === tag
                                      ? 'bg-[#C5A059] text-[#0F0D0C] font-bold'
                                      : 'bg-[#1C1816] text-[#A89F94] border border-[#2C2621] hover:text-[#E5E1DA]'
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
                                    className="bg-[#161311] border border-[#C5A059] rounded px-1.5 py-0.5 text-[9px] text-[#E5E1DA] w-20"
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
                                    className="text-[9px] text-[#C5A059] font-bold"
                                  >
                                    ✓
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setIsAddingTag(true)}
                                  className="text-[9px] px-1.5 py-0.5 bg-[#1C1816] text-[#C5A059] border border-dashed border-[#C5A059]/50 rounded hover:bg-[#241E1B]"
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
                                className="flex-1 bg-[#161311] border border-[#2C2621] rounded px-2 py-1 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveQuickQuote(item)}
                                className="px-2.5 py-1 bg-[#C5A059] text-[#0F0D0C] font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer"
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
                                      ? 'bg-[#2A241F] border border-[#C5A059] text-white font-medium shadow-xs'
                                      : isBest
                                      ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 font-medium'
                                      : 'bg-[#13110F] border border-[#2C2621] text-[#E5E1DA]'
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
                                      <span className="px-1 py-0.2 bg-[#C5A059] text-[#0F0D0C] text-[8px] font-bold uppercase rounded-xs">
                                        Filter
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 font-mono font-bold text-[#C5A059]">
                                    <span>{formatCurrency(vp.price, vp.currency || '£')}</span>
                                    <button
                                      onClick={() => handleAddToBasket(item, vp.vendor, vp.price, vp.url)}
                                      className="text-[#C5A059] hover:text-white p-0.5 cursor-pointer"
                                      title={`Add to Basket from ${vp.vendor} (${formatCurrency(vp.price, '£')})`}
                                    >
                                      <ShoppingCart className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRetailerQuote(item, vp.id)}
                                      className="text-[#A89F94] hover:text-red-400 p-0.5 cursor-pointer ml-0.5"
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
                              <strong className="text-[#E5E1DA]">{item.sourceRetailer}</strong>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-[#2C2621] mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAddToBasket(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A059] hover:brightness-110 text-[#0F0D0C] rounded text-xs font-bold transition cursor-pointer shadow-xs"
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
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#13110F] hover:bg-[#1E2922] text-emerald-400 border border-emerald-800/60 rounded text-xs font-medium transition cursor-pointer"
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
                        className="p-1.5 bg-[#13110F] hover:bg-[#241E1B] text-[#C5A059] border border-[#2C2621] rounded cursor-pointer"
                        title="Compare / Add multiple retailer prices"
                      >
                        <Store className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-1.5 bg-[#13110F] hover:bg-[#241E1B] text-[#E5E1DA] hover:text-[#C5A059] border border-[#2C2621] rounded cursor-pointer"
                      title="Edit Wishlist Item"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onResearchCigar(`${item.brand} ${item.name}`)}
                      className="p-1.5 bg-[#13110F] hover:bg-[#241E1B] text-[#C5A059] border border-[#2C2621] rounded cursor-pointer"
                      title="Research Blend Dossier"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteWishlistItem(item.id)}
                      className="p-1.5 bg-[#13110F] hover:bg-[#2C1515] text-[#A89F94] hover:text-red-400 border border-[#2C2621] rounded cursor-pointer"
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
            <div className="col-span-full text-center py-12 bg-[#1C1816] border border-[#2C2621] rounded-lg">
              <Bookmark className="w-8 h-8 text-[#A89F94]/50 mx-auto mb-3" />
              <h3 className="text-sm font-serif font-semibold text-[#E5E1DA]">
                {wishlist.length === 0 ? 'No Wishlist Items Yet' : 'No Cigars Match Current Filter'}
              </h3>
              <p className="text-xs text-[#A89F94] mt-1">
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
          <div className="bg-[#1C1816] border border-[#2C2621] rounded-lg sm:rounded-l-lg sm:rounded-r-none w-full max-w-2xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Basket Header */}
            <div className="p-4 sm:p-5 bg-[#161311] border-b border-[#2C2621] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 rounded-md">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-base text-white flex items-center gap-2">
                    <span>Wishlist Shopping Basket</span>
                    <span className="text-xs px-2 py-0.5 bg-[#C5A059] text-[#0F0D0C] font-bold rounded-full font-sans">
                      {totalBasketCount} {totalBasketCount === 1 ? 'stick' : 'sticks'}
                    </span>
                  </h3>
                  <p className="text-xs text-[#A89F94]">
                    Curated basket optimized for the best available retailer deals across UK tobacconists.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBasketOpen(false)}
                className="p-1.5 text-[#A89F94] hover:text-white bg-[#13110F] hover:bg-[#2C2621] border border-[#2C2621] rounded-md transition cursor-pointer"
                title="Close Basket"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basket Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {basket.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <ShoppingCart className="w-12 h-12 text-[#A89F94]/30 mx-auto mb-3" />
                  <h4 className="font-serif text-base text-[#E5E1DA] font-semibold">Your Basket is Empty</h4>
                  <p className="text-xs text-[#A89F94] mt-1 max-w-sm mx-auto">
                    Click "Add to Basket" or "Add Best Deals" on any cigar to bundle your purchase at the best quoted prices.
                  </p>
                  {filteredWishlist.length > 0 && (
                    <button
                      onClick={handleAddAllBestDealsToBasket}
                      className="mt-4 px-4 py-2 bg-[#C5A059] hover:brightness-110 text-[#0F0D0C] font-bold text-xs uppercase tracking-wider rounded-md transition cursor-pointer shadow-sm"
                    >
                      Add All ({filteredWishlist.length}) Filtered Cigars
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Bar */}
                  <div className="p-3.5 bg-[#13110F] border border-[#2C2621] rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-[#A89F94] block text-[10px] uppercase font-bold">Total Items</span>
                        <span className="font-mono font-bold text-white text-sm">{totalBasketCount} units</span>
                      </div>
                      <div className="border-l border-[#2C2621] pl-4">
                        <span className="text-[#A89F94] block text-[10px] uppercase font-bold">Vendors</span>
                        <span className="font-mono font-bold text-white text-sm">{Object.keys(basketByVendor).length} shops</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[#A89F94] block text-[10px] uppercase font-bold">Estimated Total</span>
                      <span className="font-mono font-bold text-[#C5A059] text-base">
                        {formatCurrency(totalBasketPrice, '£')}
                      </span>
                    </div>
                  </div>

                  {/* Grouped by Vendor / Tobacconist */}
                  <div className="space-y-4">
                    {Object.entries(basketByVendor).map(([vendor, group]) => (
                      <div
                        key={vendor}
                        className="bg-[#13110F] border border-[#2C2621] rounded-lg overflow-hidden"
                      >
                        {/* Vendor Header */}
                        <div className="p-3 bg-[#181513] border-b border-[#2C2621] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-[#C5A059]" />
                            <span className="font-bold text-xs text-[#E5E1DA]">{vendor}</span>
                            <span className="text-[10px] text-[#A89F94] px-1.5 py-0.2 bg-[#1C1816] rounded border border-[#2C2621]">
                              {group.count} items
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#C5A059]">
                              Subtotal: {formatCurrency(group.total, '£')}
                            </span>
                          </div>
                        </div>

                        {/* Items in Vendor Group */}
                        <div className="divide-y divide-[#2C2621]/60">
                          {group.items.map((bItem) => {
                            const lineTotal = (bItem.unitPrice || 0) * bItem.quantity;
                            return (
                              <div
                                key={bItem.id}
                                className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#161311] transition"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] uppercase font-bold text-[#C5A059]">
                                      {bItem.brand}
                                    </span>
                                    {bItem.vitola && (
                                      <span className="text-[10px] text-[#A89F94]">
                                        • {bItem.vitola}
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-serif font-semibold text-sm text-white truncate">
                                    {bItem.name}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[#A89F94]">
                                    <span className="font-mono text-emerald-400 font-bold">
                                      {formatCurrency(bItem.unitPrice || 0, '£')} each
                                    </span>
                                    {bItem.sourceUrl && (
                                      <a
                                        href={bItem.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#C5A059] hover:underline flex items-center gap-0.5"
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
                                  <div className="flex items-center border border-[#2C2621] rounded bg-[#1C1816]">
                                    <button
                                      onClick={() => handleUpdateBasketQuantity(bItem.id, -1)}
                                      className="p-1 px-2 text-[#A89F94] hover:text-white hover:bg-[#2C2621] rounded-l cursor-pointer text-xs"
                                      title="Decrease quantity"
                                    >
                                      -
                                    </button>
                                    <span className="px-2.5 py-0.5 text-xs font-mono font-bold text-white min-w-[28px] text-center">
                                      {bItem.quantity}
                                    </span>
                                    <button
                                      onClick={() => handleUpdateBasketQuantity(bItem.id, 1)}
                                      className="p-1 px-2 text-[#A89F94] hover:text-white hover:bg-[#2C2621] rounded-r cursor-pointer text-xs"
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
                                    className="p-1.5 text-[#A89F94] hover:text-red-400 hover:bg-[#2C1515] border border-[#2C2621] rounded cursor-pointer transition"
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
              <div className="p-4 sm:p-5 bg-[#161311] border-t border-[#2C2621] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearBasket}
                      className="text-xs text-[#A89F94] hover:text-red-400 underline cursor-pointer"
                    >
                      Clear Basket
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-[#A89F94] text-[11px] mr-2">Grand Total ({totalBasketCount} sticks):</span>
                    <span className="font-mono font-bold text-lg text-[#C5A059]">
                      {formatCurrency(totalBasketPrice, '£')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
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
                    className="py-2.5 px-4 bg-[#1C1816] hover:bg-[#241E1B] text-[#E5E1DA] hover:text-white border border-[#2C2621] font-bold text-xs uppercase tracking-wider rounded-md flex items-center justify-center gap-2 cursor-pointer transition"
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
