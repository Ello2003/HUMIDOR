import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Flame,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Star,
  Layers,
  Box,
  Clock,
  Sparkles,
  ArrowUpDown,
  Check,
  Grid,
  List,
  LayoutGrid,
  SlidersHorizontal,
  Eye,
  EyeOff,
  X,
  Bookmark,
  BookOpen,
  Copy,
  Store,
} from 'lucide-react';
import { Cigar, Humidor, StrengthRating, CigarStatus, WishlistItem, CigarResearchItem, VendorPriceEntry, AppSettings, STRENGTH_LEVELS } from '../types';
import { generateId } from '../utils/idUtils';
import { calculateRestDays } from '../utils/exportUtils';
import { formatCurrency } from '../utils/currencyUtils';
import { canonicalizeVendorName, estimateAccurateSmokeTime } from '../utils/researchUtils';

interface HumidorInventoryProps {
  cigars: Cigar[];
  humidors: Humidor[];
  settings?: AppSettings;
  onOpenHumidors?: () => void;
  onAddCigar: () => void;
  onEditCigar: (cigar: Cigar) => void;
  onDeleteCigar: (cigarId: string) => void;
  onUpdateQuantity: (cigarId: string, newQty: number) => void;
  onToggleFavorite: (cigarId: string) => void;
  onSmokeCigar: (cigarId: string) => void;
  onOpenResearchForCigar: (cigar: Cigar) => void;
  onAddToWishlist?: (item: Omit<WishlistItem, 'id' | 'createdAt'>) => void;
  onAddToResearch?: (cigar: CigarResearchItem) => void;
  onDeduplicateHumidor?: () => void;
  onOpenPriceEditor?: (item: { brand: string; name: string; vitola?: string; price?: number; vendor?: string; currency?: string }) => void;
  onSaveHumidorQuote?: (cigar: Cigar, vendor: string, price: number, currency?: string) => void;
  onDeleteHumidorQuote?: (cigarId: string, quoteId?: string, vendorName?: string) => void;
  onUpdateCigarDirectly?: (cigar: Cigar) => void;
  onInlineRenameCigar?: (cigar: Cigar, newBrand: string, newName: string) => void;
}

export const HumidorInventory: React.FC<HumidorInventoryProps> = ({
  cigars,
  humidors,
  settings,
  onOpenHumidors,
  onAddCigar,
  onEditCigar,
  onDeleteCigar,
  onUpdateQuantity,
  onToggleFavorite,
  onSmokeCigar,
  onOpenResearchForCigar,
  onAddToWishlist,
  onAddToResearch,
  onDeduplicateHumidor,
  onOpenPriceEditor,
  onSaveHumidorQuote,
  onDeleteHumidorQuote,
  onUpdateCigarDirectly,
  onInlineRenameCigar,
}) => {
  // Persistent Filter & Display States
  const [selectedHumidorId, setSelectedHumidorId] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_inventory_selected_humidor') || 'all';
    } catch {
      return 'all';
    }
  });

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_inventory_search') || '';
    } catch {
      return '';
    }
  });

  const [statusFilter, setStatusFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_inventory_status') || 'all';
    } catch {
      return 'all';
    }
  });

  const [strengthFilter, setStrengthFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_inventory_strength') || 'all';
    } catch {
      return 'all';
    }
  });

  const [brandFilter, setBrandFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_inventory_brand') || 'all';
    } catch {
      return 'all';
    }
  });

  const [wrapperFilter, setWrapperFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_inventory_wrapper') || 'all';
    } catch {
      return 'all';
    }
  });

  const [vitolaFilter, setVitolaFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_inventory_vitola') || 'all';
    } catch {
      return 'all';
    }
  });

  const [smokeTimeFilter, setSmokeTimeFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_inventory_smoke_time') || 'all';
    } catch {
      return 'all';
    }
  });

  const [originFilter, setOriginFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_inventory_origin') || 'all';
    } catch {
      return 'all';
    }
  });

  const [activePillCategory, setActivePillCategory] = useState<'wrapper' | 'vitola' | 'smokeTime' | 'strength' | 'status'>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_inventory_pill_category');
      if (saved === 'wrapper' || saved === 'vitola' || saved === 'smokeTime' || saved === 'strength' || saved === 'status') return saved;
    } catch {}
    return 'wrapper';
  });

  const [showQuickPillBar, setShowQuickPillBar] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_inventory_show_pills');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [sortBy, setSortBy] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_inventory_sort') || 'rating-desc';
    } catch {
      return 'rating-desc';
    }
  });

  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_inventory_view_mode');
      if (saved === 'grid' || saved === 'table') return saved;
    } catch {}
    return 'grid';
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [inventoryNotice, setInventoryNotice] = useState<string | null>(null);

  // Inline rename state for real-time site-wide sync
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [inlineBrand, setInlineBrand] = useState<string>('');
  const [inlineName, setInlineName] = useState<string>('');

  const handleStartInlineEdit = (cigar: Cigar) => {
    setEditingNameId(cigar.id);
    setInlineBrand(cigar.brand);
    setInlineName(cigar.name);
  };

  const handleSaveInlineEdit = (cigar: Cigar) => {
    if (!inlineBrand.trim() || !inlineName.trim()) {
      setEditingNameId(null);
      return;
    }
    if (onInlineRenameCigar) {
      onInlineRenameCigar(cigar, inlineBrand.trim(), inlineName.trim());
    } else if (onUpdateCigarDirectly) {
      onUpdateCigarDirectly({
        ...cigar,
        brand: inlineBrand.trim(),
        name: inlineName.trim(),
        line: cigar.line === cigar.name ? inlineName.trim() : cigar.line,
      });
    }
    setEditingNameId(null);
    showNotice(`Updated to "${inlineBrand.trim()} ${inlineName.trim()}" across all tabs!`);
  };

  // Inline Display Settings & Presets with persistence
  const [showDisplayOptions, setShowDisplayOptions] = useState<boolean>(() => {
    try {
      return localStorage.getItem('the_humidor_inventory_show_display_options') === 'true';
    } catch {
      return false;
    }
  });

  const [displayFields, setDisplayFields] = useState(() => {
    const defaultFields = {
      smokeTime: settings?.humidorFieldVisibility?.smokeTime ?? true,
      vitolaSpecs: settings?.humidorFieldVisibility?.vitolaSpecs ?? true,
      wrapperOrigin: settings?.humidorFieldVisibility?.wrapperOrigin ?? true,
      strength: settings?.humidorFieldVisibility?.strength ?? true,
      humidorResting: settings?.humidorFieldVisibility?.humidorResting ?? true,
      flavorTags: settings?.humidorFieldVisibility?.flavorTags ?? true,
      notes: settings?.humidorFieldVisibility?.notes ?? true,
      retailerQuotes: settings?.humidorFieldVisibility?.retailerQuotes ?? true,
      pricing: settings?.humidorFieldVisibility?.pricing ?? true,
      rating: settings?.humidorFieldVisibility?.rating ?? true,
    };
    try {
      const saved = localStorage.getItem('the_humidor_inventory_display_fields');
      if (saved) {
        return { ...defaultFields, ...JSON.parse(saved) };
      }
    } catch {}
    return defaultFields;
  });

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_selected_humidor', selectedHumidorId);
    } catch {}
  }, [selectedHumidorId]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_search', searchQuery);
    } catch {}
  }, [searchQuery]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_status', statusFilter);
    } catch {}
  }, [statusFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_strength', strengthFilter);
    } catch {}
  }, [strengthFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_brand', brandFilter);
    } catch {}
  }, [brandFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_wrapper', wrapperFilter);
    } catch {}
  }, [wrapperFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_vitola', vitolaFilter);
    } catch {}
  }, [vitolaFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_smoke_time', smokeTimeFilter);
    } catch {}
  }, [smokeTimeFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_origin', originFilter);
    } catch {}
  }, [originFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_pill_category', activePillCategory);
    } catch {}
  }, [activePillCategory]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_show_pills', String(showQuickPillBar));
    } catch {}
  }, [showQuickPillBar]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_sort', sortBy);
    } catch {}
  }, [sortBy]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_view_mode', viewMode);
    } catch {}
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_show_display_options', String(showDisplayOptions));
    } catch {}
  }, [showDisplayOptions]);

  // Sync settings when parent changes
  useEffect(() => {
    if (settings?.humidorFieldVisibility) {
      setDisplayFields((prev) => ({
        ...prev,
        ...settings.humidorFieldVisibility,
      }));
    }
  }, [settings?.humidorFieldVisibility]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_inventory_display_fields', JSON.stringify(displayFields));
    } catch {}
  }, [displayFields]);

  const resetAllFilters = () => {
    setSelectedHumidorId('all');
    setSearchQuery('');
    setStatusFilter('all');
    setStrengthFilter('all');
    setBrandFilter('all');
    setWrapperFilter('all');
    setVitolaFilter('all');
    setSmokeTimeFilter('all');
    setOriginFilter('all');
    setSortBy('rating-desc');
  };

  const applyPreset = (preset: 'all' | 'keySpecs' | 'agingFocus' | 'priceHunter') => {
    if (preset === 'all') {
      setDisplayFields({
        smokeTime: true,
        vitolaSpecs: true,
        wrapperOrigin: true,
        strength: true,
        humidorResting: true,
        flavorTags: true,
        notes: true,
        retailerQuotes: true,
        pricing: true,
        rating: true,
      });
    } else if (preset === 'keySpecs') {
      setDisplayFields({
        smokeTime: true,
        vitolaSpecs: true,
        wrapperOrigin: true,
        strength: true,
        humidorResting: true,
        flavorTags: false,
        notes: false,
        retailerQuotes: false,
        pricing: true,
        rating: true,
      });
    } else if (preset === 'agingFocus') {
      setDisplayFields({
        smokeTime: true,
        vitolaSpecs: true,
        wrapperOrigin: true,
        strength: true,
        humidorResting: true,
        flavorTags: false,
        notes: true,
        retailerQuotes: false,
        pricing: false,
        rating: true,
      });
    } else if (preset === 'priceHunter') {
      setDisplayFields({
        smokeTime: true,
        vitolaSpecs: true,
        wrapperOrigin: false,
        strength: false,
        humidorResting: false,
        flavorTags: false,
        notes: false,
        retailerQuotes: true,
        pricing: true,
        rating: true,
      });
    }
  };

  // Inline Quick Quote state for Humidor cards
  const [quickQuoteCigarId, setQuickQuoteCigarId] = useState<string | null>(null);
  const [quickQuoteVendor, setQuickQuoteVendor] = useState<string>('C.Gars Ltd');
  const [quickQuoteValue, setQuickQuoteValue] = useState<string>('');
  const [quickQuoteCurrency, setQuickQuoteCurrency] = useState<string>('£');

  // Configurable quick shop tags
  const [quickQuoteTags, setQuickQuoteTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cigar_quick_quote_retailers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ['C.Gars Ltd', 'Havana House', 'Smoke King', 'Sautter London', 'Neptune', 'Fox Cigar', 'Davidoff London', "Holt's"];
  });
  const [showAddTagInput, setShowAddTagInput] = useState(false);
  const [newCustomTag, setNewCustomTag] = useState('');

  const handleAddNewQuickTag = () => {
    const trimmed = newCustomTag.trim();
    if (!trimmed) return;
    if (!quickQuoteTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...quickQuoteTags, trimmed];
      setQuickQuoteTags(updated);
      try {
        localStorage.setItem('cigar_quick_quote_retailers', JSON.stringify(updated));
      } catch {}
    }
    setQuickQuoteVendor(trimmed);
    setNewCustomTag('');
    setShowAddTagInput(false);
  };

  const handleDeleteQuickTag = (tag: string) => {
    const updated = quickQuoteTags.filter((t) => t !== tag);
    setQuickQuoteTags(updated);
    try {
      localStorage.setItem('cigar_quick_quote_retailers', JSON.stringify(updated));
    } catch {}
  };

  const showNotice = (msg: string) => {
    setInventoryNotice(msg);
    setTimeout(() => setInventoryNotice(null), 4000);
  };

  const handleStartQuickQuote = (cigarId: string, prefillVendor?: string, prefillPrice?: number) => {
    setQuickQuoteCigarId(cigarId);
    if (prefillVendor) setQuickQuoteVendor(prefillVendor);
    if (prefillPrice) setQuickQuoteValue(String(prefillPrice));
    else setQuickQuoteValue('');
  };

  const handleSaveQuickQuote = (cigar: Cigar) => {
    const numPrice = parseFloat(quickQuoteValue);
    if (isNaN(numPrice) || numPrice <= 0) {
      showNotice('Please enter a valid price greater than 0.');
      return;
    }
    const vendorName = canonicalizeVendorName(quickQuoteVendor.trim() || 'Online Retailer');
    if (onSaveHumidorQuote) {
      onSaveHumidorQuote(cigar, vendorName, numPrice, quickQuoteCurrency);
    }
    setQuickQuoteCigarId(null);
    setQuickQuoteValue('');
    showNotice(`Attached ${vendorName} quote (${formatCurrency(numPrice, quickQuoteCurrency)}) to "${cigar.brand} ${cigar.name}"!`);
  };

  const handleDeleteQuote = (cigar: Cigar, quoteId?: string, vendorName?: string) => {
    if (onDeleteHumidorQuote) {
      onDeleteHumidorQuote(cigar.id, quoteId, vendorName);
    } else if (onUpdateCigarDirectly) {
      const currentPrices = cigar.vendorPrices || [];
      const updatedPrices = quoteId ? currentPrices.filter((vp) => vp.id !== quoteId) : currentPrices.slice(1);
      const lowestPrice = updatedPrices.length > 0 ? Math.min(...updatedPrices.map((p) => p.price)) : (cigar.purchasePrice || 0);
      const lowestVendor = updatedPrices.length > 0 ? (updatedPrices.find((p) => p.price === lowestPrice)?.vendor || cigar.vendor) : cigar.vendor;
      onUpdateCigarDirectly({
        ...cigar,
        vendorPrices: updatedPrices,
        purchasePrice: lowestPrice,
        vendor: lowestVendor,
        updatedAt: new Date().toISOString(),
      });
    }
    showNotice(`Deleted ${vendorName || 'retailer'} quote from ${cigar.brand} ${cigar.name}.`);
  };

  const humidorMap = useMemo(() => new Map(humidors.map((h) => [h.id, h])), [humidors]);

  // Unique origins
  const availableOrigins = useMemo(() => {
    const set = new Set<string>();
    cigars.forEach((c) => {
      if (c.countryOrigin && c.countryOrigin.trim()) set.add(c.countryOrigin.trim());
    });
    return Array.from(set).sort();
  }, [cigars]);

  // Unique brands
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    cigars.forEach((c) => {
      if (c.brand && c.brand.trim()) set.add(c.brand.trim());
    });
    return Array.from(set).sort();
  }, [cigars]);

  // Unique wrappers
  const availableWrappers = useMemo(() => {
    const set = new Set<string>();
    cigars.forEach((c) => {
      if (c.wrapper && c.wrapper.trim()) set.add(c.wrapper.trim());
    });
    return Array.from(set).sort();
  }, [cigars]);

  // Unique vitolas
  const availableVitolas = useMemo(() => {
    const set = new Set<string>();
    cigars.forEach((c) => {
      if (c.vitola && c.vitola.trim()) set.add(c.vitola.trim());
    });
    return Array.from(set).sort();
  }, [cigars]);

  // Filtered & Sorted Cigars
  const filteredCigars = useMemo(() => {
    return cigars
      .filter((c) => {
        // Humidor Filter
        if (selectedHumidorId !== 'all' && c.humidorId !== selectedHumidorId) {
          return false;
        }
        // Status Filter
        if (statusFilter !== 'all' && c.status !== statusFilter) {
          return false;
        }
        // Strength Filter
        if (strengthFilter !== 'all' && c.strength !== strengthFilter) {
          return false;
        }
        // Brand Filter
        if (brandFilter !== 'all' && c.brand?.toLowerCase() !== brandFilter.toLowerCase()) {
          return false;
        }
        // Wrapper Filter
        if (wrapperFilter !== 'all' && !c.wrapper?.toLowerCase().includes(wrapperFilter.toLowerCase())) {
          return false;
        }
        // Vitola Filter
        if (vitolaFilter !== 'all' && !c.vitola?.toLowerCase().includes(vitolaFilter.toLowerCase())) {
          return false;
        }
        // Smoke Time Filter
        const smokeMins = c.smokeTimeMinutes || estimateAccurateSmokeTime(c.vitola).minutes;
        if (smokeTimeFilter === 'quick' && smokeMins > 45) {
          return false;
        }
        if (smokeTimeFilter === 'medium' && (smokeMins <= 45 || smokeMins > 75)) {
          return false;
        }
        if (smokeTimeFilter === 'long' && (smokeMins <= 75 || smokeMins > 100)) {
          return false;
        }
        if (smokeTimeFilter === 'extra_long' && smokeMins <= 100) {
          return false;
        }
        // Origin Filter
        if (originFilter !== 'all' && c.countryOrigin !== originFilter) {
          return false;
        }
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            c.brand.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.vitola.toLowerCase().includes(q) ||
            c.wrapper.toLowerCase().includes(q) ||
            c.countryOrigin.toLowerCase().includes(q) ||
            (c.notes && c.notes.toLowerCase().includes(q)) ||
            (c.flavorTags && c.flavorTags.some((t) => t.toLowerCase().includes(q)));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating-desc') {
          return (b.personalRating || 0) - (a.personalRating || 0);
        }
        if (sortBy === 'brand-asc') {
          return a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name);
        }
        if (sortBy === 'qty-desc') {
          return b.quantity - a.quantity;
        }
        if (sortBy === 'rest-desc') {
          return calculateRestDays(b.purchaseDate) - calculateRestDays(a.purchaseDate);
        }
        if (sortBy === 'price-desc') {
          return (b.purchasePrice || 0) - (a.purchasePrice || 0);
        }
        if (sortBy === 'price-asc') {
          return (a.purchasePrice || 0) - (b.purchasePrice || 0);
        }
        if (sortBy === 'smoke-desc') {
          const sA = a.smokeTimeMinutes || estimateAccurateSmokeTime(a.vitola).minutes;
          const sB = b.smokeTimeMinutes || estimateAccurateSmokeTime(b.vitola).minutes;
          return sB - sA;
        }
        if (sortBy === 'smoke-asc') {
          const sA = a.smokeTimeMinutes || estimateAccurateSmokeTime(a.vitola).minutes;
          const sB = b.smokeTimeMinutes || estimateAccurateSmokeTime(b.vitola).minutes;
          return sA - sB;
        }
        return 0;
      });
  }, [
    cigars,
    selectedHumidorId,
    statusFilter,
    strengthFilter,
    brandFilter,
    wrapperFilter,
    vitolaFilter,
    smokeTimeFilter,
    originFilter,
    searchQuery,
    sortBy,
  ]);

  const totalFilteredSticks = filteredCigars.reduce((acc, c) => acc + (c.quantity || 0), 0);
  const totalFilteredValue = filteredCigars.reduce((acc, c) => acc + (c.purchasePrice || 0) * (c.quantity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {inventoryNotice && (
        <div className="p-3 bg-card border border-gold/40 rounded-lg text-xs text-text flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-gold" />
            <span>{inventoryNotice}</span>
          </div>
          <button
            onClick={() => setInventoryNotice(null)}
            className="text-text-muted hover:text-text text-xs cursor-pointer p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Humidor Selectors Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-line">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedHumidorId('all')}
            className={`px-3.5 py-1.5 rounded-md text-xs uppercase tracking-wider font-semibold transition cursor-pointer ${
              selectedHumidorId === 'all'
                ? 'bg-gold text-ink'
                : 'bg-card text-text-muted hover:text-text border border-line'
            }`}
          >
            All Vaults ({cigars.reduce((a, b) => a + b.quantity, 0)} sticks)
          </button>
          {humidors.map((h) => {
            const count = cigars.filter((c) => c.humidorId === h.id).reduce((a, b) => a + b.quantity, 0);
            return (
              <button
                key={h.id}
                onClick={() => setSelectedHumidorId(h.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs uppercase tracking-wider font-medium transition flex items-center gap-2 cursor-pointer ${
                  selectedHumidorId === h.id
                    ? 'bg-gold text-ink'
                    : 'bg-card text-text-muted hover:text-text border border-line'
                }`}
              >
                <span>{h.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${selectedHumidorId === h.id ? 'bg-ink text-gold' : 'bg-surface text-gold'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {onOpenHumidors && (
            <button
              onClick={onOpenHumidors}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-card hover:bg-card-hover text-text hover:text-gold border border-line hover:border-gold/50 rounded-md text-xs uppercase tracking-wider font-semibold transition cursor-pointer"
            >
              <Box className="w-3.5 h-3.5 text-gold" />
              <span>Humidor Setup</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 bg-card border border-line rounded-lg space-y-3 shadow-sm">
        {/* Search Bar + Primary Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by brand, name, vitola, notes, wrapper, or flavor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-line rounded-md pl-9 pr-8 py-2 text-xs text-text focus:outline-hidden focus:border-gold placeholder-text-muted/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-text-muted hover:text-text p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 1. Brand Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
              Brand ({availableBrands.length})
            </label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
            >
              <option value="all">All Brands</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Wrapper Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
              Wrapper Leaf ({availableWrappers.length})
            </label>
            <select
              value={wrapperFilter}
              onChange={(e) => setWrapperFilter(e.target.value)}
              className="w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
            >
              <option value="all">All Wrappers</option>
              {availableWrappers.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Vitola Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
              Vitola Shape ({availableVitolas.length})
            </label>
            <select
              value={vitolaFilter}
              onChange={(e) => setVitolaFilter(e.target.value)}
              className="w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
            >
              <option value="all">All Vitolas</option>
              {availableVitolas.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Smoke Time Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
              ⏱️ Smoke Duration
            </label>
            <select
              value={smokeTimeFilter}
              onChange={(e) => setSmokeTimeFilter(e.target.value)}
              className="w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
            >
              <option value="all">All Durations</option>
              <option value="quick">⚡ Quick (≤45m)</option>
              <option value="medium">⏱️ Medium (45–75m)</option>
              <option value="long">🪵 Long (75–100m)</option>
              <option value="extra_long">👑 Epic (&gt;100m)</option>
            </select>
          </div>

          {/* 5. Strength Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
              Strength Body
            </label>
            <select
              value={strengthFilter}
              onChange={(e) => setStrengthFilter(e.target.value)}
              className="w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
            >
              <option value="all">All Strengths</option>
              <option value="Mild">Mild</option>
              <option value="Mild-Medium">Mild-Medium</option>
              <option value="Medium">Medium</option>
              <option value="Medium-Full">Medium-Full</option>
              <option value="Full">Full</option>
              <option value="Full-Bodied">Full-Bodied</option>
            </select>
          </div>

          {/* 6. Resting Status */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
              Resting Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
            >
              <option value="all">All Resting Statuses</option>
              <option value="ready">Ready to Smoke 💨</option>
              <option value="resting">Resting in Vault ⏳</option>
              <option value="aging">Long-term Aging 🪵</option>
              <option value="special_occasion">Special Reserves 🌟</option>
            </select>
          </div>

          {/* 7. Origin Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
              Country Origin ({availableOrigins.length})
            </label>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
            >
              <option value="all">All Origins</option>
              {availableOrigins.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* 8. Sort By */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
              Sort Order
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
            >
              <option value="rating-desc">★ Rating: Highest First</option>
              <option value="brand-asc">🔤 Brand (A to Z)</option>
              <option value="qty-desc">📦 Quantity in Stock</option>
              <option value="rest-desc">⏳ Resting Time (Days)</option>
              <option value="price-desc">💰 Price: High to Low</option>
              <option value="price-asc">💵 Price: Low to High</option>
              <option value="smoke-desc">⏱️ Smoke Time: Longest</option>
              <option value="smoke-asc">⚡ Smoke Time: Quickest</option>
            </select>
          </div>
        </div>

        {/* Togglable Quick Filter Chips Bar */}
        <div className="pt-2 border-t border-line/60 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Pill Category Switcher */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              <span className="text-[10px] uppercase font-bold text-text-muted mr-1 shrink-0">
                Quick Toggle:
              </span>
              {[
                { id: 'wrapper', label: 'Wrappers' },
                { id: 'vitola', label: 'Vitolas' },
                { id: 'smokeTime', label: 'Smoke Times' },
                { id: 'strength', label: 'Strengths' },
                { id: 'status', label: 'Statuses' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActivePillCategory(cat.id as any)}
                  className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer font-medium shrink-0 ${
                    activePillCategory === cat.id
                      ? 'bg-gold/20 text-gold border border-gold/50 font-bold'
                      : 'bg-surface text-text-muted hover:text-text border border-line'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Hide/Show Toggle */}
            <button
              type="button"
              onClick={() => setShowQuickPillBar(!showQuickPillBar)}
              className="text-[10px] text-text-muted hover:text-gold flex items-center gap-1 cursor-pointer ml-auto"
            >
              <span>{showQuickPillBar ? 'Collapse Chips' : 'Expand Chips'}</span>
            </button>
          </div>

          {/* Active Category Chips */}
          {showQuickPillBar && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 animate-in fade-in duration-150">
              {/* Wrappers Chips */}
              {activePillCategory === 'wrapper' && (
                <>
                  <button
                    type="button"
                    onClick={() => setWrapperFilter('all')}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full transition cursor-pointer border ${
                      wrapperFilter === 'all'
                        ? 'bg-gold text-ink border-gold font-bold'
                        : 'bg-surface text-text-muted hover:text-text border-line'
                    }`}
                  >
                    All Wrappers
                  </button>
                  {['Habano', 'Maduro', 'Connecticut', 'Corojo', 'San Andrés', 'Oscuro', 'Cameroon', 'Sumatra', 'Candela', 'Natural'].map((wType) => {
                    const isActive = wrapperFilter.toLowerCase() === wType.toLowerCase();
                    return (
                      <button
                        key={wType}
                        type="button"
                        onClick={() => setWrapperFilter(isActive ? 'all' : wType)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full transition cursor-pointer border ${
                          isActive
                            ? 'bg-gold text-ink border-gold font-bold'
                            : 'bg-surface text-text-muted hover:text-text border-line hover:border-line-hover'
                        }`}
                      >
                        {wType}
                      </button>
                    );
                  })}
                </>
              )}

              {/* Vitolas Chips */}
              {activePillCategory === 'vitola' && (
                <>
                  <button
                    type="button"
                    onClick={() => setVitolaFilter('all')}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full transition cursor-pointer border ${
                      vitolaFilter === 'all'
                        ? 'bg-gold text-ink border-gold font-bold'
                        : 'bg-surface text-text-muted hover:text-text border-line'
                    }`}
                  >
                    All Vitolas
                  </button>
                  {['Robusto', 'Toro', 'Churchill', 'Corona', 'Lancero', 'Petit Corona', 'Gordo', 'Figurado', 'Pirámide', 'Panetela', 'Lonsdale'].map((vType) => {
                    const isActive = vitolaFilter.toLowerCase() === vType.toLowerCase();
                    return (
                      <button
                        key={vType}
                        type="button"
                        onClick={() => setVitolaFilter(isActive ? 'all' : vType)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full transition cursor-pointer border ${
                          isActive
                            ? 'bg-gold text-ink border-gold font-bold'
                            : 'bg-surface text-text-muted hover:text-text border-line hover:border-line-hover'
                        }`}
                      >
                        {vType}
                      </button>
                    );
                  })}
                </>
              )}

              {/* Smoke Time Chips */}
              {activePillCategory === 'smokeTime' && (
                <>
                  <button
                    type="button"
                    onClick={() => setSmokeTimeFilter('all')}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full transition cursor-pointer border ${
                      smokeTimeFilter === 'all'
                        ? 'bg-gold text-ink border-gold font-bold'
                        : 'bg-surface text-text-muted hover:text-text border-line'
                    }`}
                  >
                    All Durations
                  </button>
                  {[
                    { id: 'quick', label: '⚡ Quick (≤45m)' },
                    { id: 'medium', label: '⏱️ Medium (45–75m)' },
                    { id: 'long', label: '🪵 Long (75–100m)' },
                    { id: 'extra_long', label: '👑 Epic (>100m)' },
                  ].map((dur) => {
                    const isActive = smokeTimeFilter === dur.id;
                    return (
                      <button
                        key={dur.id}
                        type="button"
                        onClick={() => setSmokeTimeFilter(isActive ? 'all' : (dur.id as any))}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full transition cursor-pointer border ${
                          isActive
                            ? 'bg-gold text-ink border-gold font-bold'
                            : 'bg-surface text-text-muted hover:text-text border-line hover:border-line-hover'
                        }`}
                      >
                        {dur.label}
                      </button>
                    );
                  })}
                </>
              )}

              {/* Strength Chips */}
              {activePillCategory === 'strength' && (
                <>
                  <button
                    type="button"
                    onClick={() => setStrengthFilter('all')}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full transition cursor-pointer border ${
                      strengthFilter === 'all'
                        ? 'bg-gold text-ink border-gold font-bold'
                        : 'bg-surface text-text-muted hover:text-text border-line'
                    }`}
                  >
                    All Strengths
                  </button>
                  {STRENGTH_LEVELS.map((str) => {
                    const isActive = strengthFilter === str;
                    return (
                      <button
                        key={str}
                        type="button"
                        onClick={() => setStrengthFilter(isActive ? 'all' : str)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full transition cursor-pointer border ${
                          isActive
                            ? 'bg-gold text-ink border-gold font-bold'
                            : 'bg-surface text-text-muted hover:text-text border-line hover:border-line-hover'
                        }`}
                      >
                        {str}
                      </button>
                    );
                  })}
                </>
              )}

              {/* Status Chips */}
              {activePillCategory === 'status' && (
                <>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full transition cursor-pointer border ${
                      statusFilter === 'all'
                        ? 'bg-gold text-ink border-gold font-bold'
                        : 'bg-surface text-text-muted hover:text-text border-line'
                    }`}
                  >
                    All Statuses
                  </button>
                  {[
                    { id: 'ready', label: 'Ready to Smoke 💨' },
                    { id: 'resting', label: 'Resting in Vault ⏳' },
                    { id: 'aging', label: 'Long-term Aging 🪵' },
                    { id: 'special_occasion', label: 'Special Reserves 🌟' },
                  ].map((st) => {
                    const isActive = statusFilter === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStatusFilter(isActive ? 'all' : st.id)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full transition cursor-pointer border ${
                          isActive
                            ? 'bg-gold text-ink border-gold font-bold'
                            : 'bg-surface text-text-muted hover:text-text border-line hover:border-line-hover'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </>
              )}

              {/* Reset/Clear Button */}
              {(brandFilter !== 'all' || wrapperFilter !== 'all' || vitolaFilter !== 'all' || smokeTimeFilter !== 'all' || strengthFilter !== 'all' || statusFilter !== 'all' || originFilter !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-card-hover text-gold hover:text-white border border-line-warm flex items-center gap-1 cursor-pointer ml-auto"
                >
                  <X className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* View Switcher, Inline Display Settings & Result Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line text-xs text-text-muted">
          <div className="flex items-center gap-2 flex-wrap">
            <div>
              Showing <strong className="text-gold font-serif">{filteredCigars.length}</strong> distinct lines (
              <strong className="text-gold font-serif">{totalFilteredSticks}</strong> total sticks,{' '}
              <strong className="text-text">{formatCurrency(totalFilteredValue, '£')}</strong> valuation)
            </div>
            {(selectedHumidorId !== 'all' || searchQuery || statusFilter !== 'all' || strengthFilter !== 'all' || brandFilter !== 'all' || wrapperFilter !== 'all' || vitolaFilter !== 'all' || smokeTimeFilter !== 'all' || originFilter !== 'all' || sortBy !== 'rating-desc') && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[11px] px-2 py-0.5 rounded bg-card-hover hover:bg-line text-gold hover:text-white border border-line-hover flex items-center gap-1 cursor-pointer transition"
                title="Reset all filters back to default"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Inline Display Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowDisplayOptions(!showDisplayOptions)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                showDisplayOptions
                  ? 'bg-gold text-ink border-gold'
                  : 'bg-surface text-text-muted border-line hover:text-text'
              }`}
              title="Inline Display Settings & Presets"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Display</span>
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-surface p-0.5 rounded border border-line">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-gold text-ink' : 'text-text-muted hover:text-text'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-gold text-ink' : 'text-text-muted hover:text-text'
                }`}
                title="Database Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Display Settings & Presets Panel */}
      {showDisplayOptions && (
        <div className="p-4 bg-header border border-line rounded-lg space-y-3 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-gold" />
              <span className="text-xs font-bold uppercase tracking-wider text-text">
                Humidor Field Visibility & View Presets
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-semibold text-text-muted mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('all')}
                className="px-2 py-1 bg-surface hover:bg-card-hover text-gold border border-line rounded text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
              >
                All Details
              </button>
              <button
                type="button"
                onClick={() => applyPreset('keySpecs')}
                className="px-2 py-1 bg-surface hover:bg-card-hover text-text border border-line rounded text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
              >
                Key Specs
              </button>
              <button
                type="button"
                onClick={() => applyPreset('agingFocus')}
                className="px-2 py-1 bg-surface hover:bg-card-hover text-text border border-line rounded text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
              >
                Resting & Aging
              </button>
              <button
                type="button"
                onClick={() => applyPreset('priceHunter')}
                className="px-2 py-1 bg-surface hover:bg-card-hover text-text border border-line rounded text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
              >
                Price Hunter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {[
              { key: 'smokeTime', label: 'Smoke Duration' },
              { key: 'vitolaSpecs', label: 'Vitola / Specs' },
              { key: 'wrapperOrigin', label: 'Wrapper & Terroir' },
              { key: 'strength', label: 'Strength Rating' },
              { key: 'humidorResting', label: 'Vault & Resting' },
              { key: 'flavorTags', label: 'Flavor Tags' },
              { key: 'notes', label: 'Notes & Quotes' },
              { key: 'retailerQuotes', label: 'Retailer Quotes' },
              { key: 'pricing', label: 'Purchase Valuation' },
              { key: 'rating', label: 'Personal Rating' },
            ].map((f) => {
              const active = (displayFields as any)[f.key];
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() =>
                    setDisplayFields((prev) => ({ ...prev, [f.key]: !(prev as any)[f.key] }))
                  }
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-medium border transition cursor-pointer ${
                    active
                      ? 'bg-[#1F1A16] border-gold/50 text-gold'
                      : 'bg-surface border-line text-text-muted/60 line-through'
                  }`}
                >
                  <span className="truncate mr-1">{f.label}</span>
                  {active ? (
                    <Check className="w-3 h-3 text-gold shrink-0" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-text-muted/40 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State when no results match search/filter */}
      {filteredCigars.length === 0 && (
        <div className="text-center py-16 px-4 bg-card border border-line rounded-lg">
          <Search className="w-10 h-10 text-text-muted/50 mx-auto mb-3" />
          <h3 className="text-base font-serif font-bold text-text">No Cigars Found</h3>
          <p className="text-xs text-text-muted mt-1 max-w-md mx-auto">
            {searchQuery
              ? `No sticks in your inventory matched "${searchQuery}". Try searching for a different brand, name, or wrapper type.`
              : 'No sticks match the currently active filters in your vault.'}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-card-hover hover:bg-line text-gold border border-line-warm rounded text-xs font-semibold cursor-pointer"
              >
                Clear Search Term
              </button>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setStrengthFilter('all');
                setOriginFilter('all');
                setSelectedHumidorId('all');
              }}
              className="px-4 py-2 bg-gold hover:brightness-110 text-ink rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* Cards View */}
      {filteredCigars.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCigars.map((cigar) => {
            const restDays = calculateRestDays(cigar.purchaseDate);
            const humidor = humidorMap.get(cigar.humidorId);
            const isOutOfStock = cigar.quantity <= 0;
            const smokeEstimate = estimateAccurateSmokeTime(cigar.vitola, cigar.lengthInches, cigar.ringGauge);
            const smokeDurationText = cigar.smokeTimeRange || smokeEstimate.range;

            return (
              <div
                key={cigar.id}
                className={`rounded-lg border transition-all duration-200 flex flex-col justify-between p-5 ${
                  isOutOfStock
                    ? 'bg-surface border-line opacity-60'
                    : 'bg-card border-line hover:border-line-hover shadow-sm'
                }`}
              >
                <div>
                  {/* Top Header with Inline Editing */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      {editingNameId === cigar.id ? (
                        <div className="space-y-1.5 p-2 bg-surface border border-gold rounded-md mb-2 animate-in fade-in">
                          <div className="text-[10px] uppercase font-bold text-gold">Edit Cigar Name (Syncs Everywhere)</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Brand"
                              value={inlineBrand}
                              onChange={(e) => setInlineBrand(e.target.value)}
                              className="bg-card border border-line rounded px-2 py-1 text-xs text-text focus:border-gold focus:outline-hidden"
                            />
                            <input
                              type="text"
                              placeholder="Cigar Name / Line"
                              value={inlineName}
                              onChange={(e) => setInlineName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineEdit(cigar);
                                if (e.key === 'Escape') setEditingNameId(null);
                              }}
                              className="bg-card border border-line rounded px-2 py-1 text-xs text-text focus:border-gold focus:outline-hidden"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveInlineEdit(cigar)}
                              className="px-2.5 py-1 bg-gold text-ink rounded font-bold text-xs hover:brightness-110 cursor-pointer"
                            >
                              Save & Sync
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNameId(null)}
                              className="px-2 py-1 bg-line text-text-muted hover:text-white rounded text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5 group">
                            <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gold">
                              {cigar.brand}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartInlineEdit(cigar)}
                              className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-gold transition cursor-pointer p-0.5"
                              title="Edit name inline (syncs across humidor, wishlist, research & smoke logs)"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <h3
                            onClick={() => handleStartInlineEdit(cigar)}
                            className="font-serif font-semibold text-base text-text leading-snug hover:text-gold cursor-pointer transition"
                            title="Click to edit name inline"
                          >
                            {cigar.name}
                          </h3>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {displayFields.vitolaSpecs && (
                          <span className="text-xs text-text-muted">
                            {cigar.vitola}{' '}
                            {cigar.lengthInches ? `• ${cigar.lengthInches}"` : ''}
                            {cigar.ringGauge ? ` x ${cigar.ringGauge} RG` : ''}
                          </span>
                        )}
                        {displayFields.smokeTime && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-surface text-gold border border-line font-mono font-medium"
                            title="Calculated smoke duration based on vitola & gauge"
                          >
                            <Clock className="w-3 h-3 text-gold" />
                            <span>⏱️ {smokeDurationText}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleFavorite(cigar.id)}
                      className="p-1 rounded text-gold hover:bg-line transition cursor-pointer"
                      title={cigar.isFavorite ? 'Remove favorite' : 'Mark favorite'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          cigar.isFavorite ? 'fill-gold text-gold' : 'text-line-hover hover:text-gold'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Wrapper & Blend Info */}
                  {(displayFields.wrapperOrigin || displayFields.strength) && (
                    <div className="p-3 bg-surface border border-line rounded-md text-xs space-y-1.5 my-3">
                      {displayFields.wrapperOrigin && (
                        <div className="flex justify-between">
                          <span className="text-text-muted">Wrapper:</span>
                          <span className="font-medium text-text truncate ml-2">{cigar.wrapper}</span>
                        </div>
                      )}
                      {displayFields.wrapperOrigin && (
                        <div className="flex justify-between">
                          <span className="text-text-muted">Origin / Terroir:</span>
                          <span className="font-serif text-gold">{cigar.countryOrigin}</span>
                        </div>
                      )}
                      {displayFields.strength && (
                        <div className="flex justify-between">
                          <span className="text-text-muted">Strength:</span>
                          <span className="font-medium text-text">{cigar.strength}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Humidor & Resting Pill */}
                  {displayFields.humidorResting && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-wider mb-3">
                      <span className="px-2 py-0.5 rounded bg-surface text-text-muted border border-line">
                        📍 {humidor?.name || 'Vault'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface text-gold border border-line font-serif">
                        ⏳ {restDays}d rested
                      </span>
                    </div>
                  )}

                  {/* Flavor Tags */}
                  {displayFields.flavorTags && cigar.flavorTags && cigar.flavorTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {cigar.flavorTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded bg-surface text-text-muted border border-line"
                        >
                          {tag}
                        </span>
                      ))}
                      {cigar.flavorTags.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-text-muted">
                          +{cigar.flavorTags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes / Collector Quote */}
                  {displayFields.notes && cigar.notes && (
                    <p className="text-xs text-text-muted italic line-clamp-2 mb-3 bg-surface p-2.5 rounded border border-line/60">
                      "{cigar.notes}"
                    </p>
                  )}

                  {/* Multi-Retailer Price Comparison Section */}
                  {displayFields.retailerQuotes && ((cigar.vendorPrices && cigar.vendorPrices.length > 0) || quickQuoteCigarId === cigar.id) && (
                    <div className="mb-3 p-2.5 rounded bg-surface border border-line text-xs">
                      <div className="flex items-center justify-between text-[11px] text-text-muted mb-2 font-medium">
                        <span className="flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-gold" />
                          <span className="text-text font-semibold">
                            Retailer Quotes ({cigar.vendorPrices?.length || 0})
                          </span>
                        </span>
                        {quickQuoteCigarId !== cigar.id && (
                          <button
                            onClick={() => handleStartQuickQuote(cigar.id)}
                            className="text-gold hover:underline flex items-center gap-0.5 text-[10px] font-semibold cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Quote
                          </button>
                        )}
                      </div>

                      {/* Quotes List */}
                      {cigar.vendorPrices && cigar.vendorPrices.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          {cigar.vendorPrices.map((vp, idx) => (
                            <div
                              key={vp.id || idx}
                              className="flex items-center justify-between text-[11px] py-0.5 border-b border-line/40 last:border-0 group/quote"
                            >
                              <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                                <span className="text-text truncate">{vp.vendor}</span>
                                {vp.packageType && vp.packageType !== 'Single' && (
                                  <span className="text-[9px] text-text-muted">({vp.packageType})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {idx === 0 && cigar.vendorPrices && cigar.vendorPrices.length > 1 && (
                                  <span className="text-[9px] px-1 py-0.2 bg-gold/20 text-gold font-bold rounded border border-gold/40">
                                    Best
                                  </span>
                                )}
                                <span className="font-serif font-semibold text-text">
                                  {formatCurrency(vp.price, vp.currency || cigar.currency || '£')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuote(cigar, vp.id, vp.vendor)}
                                  className="text-text-muted hover:text-red-400 p-0.5 rounded transition cursor-pointer"
                                  title={`Delete ${vp.vendor} quote`}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline Quick Add Form */}
                      {quickQuoteCigarId === cigar.id && (
                        <div className="pt-2 border-t border-line space-y-2">
                          <div className="text-[10px] uppercase font-bold tracking-wider text-gold">
                            Add Retailer Price Quote:
                          </div>

                          {/* Quick Retailer Presets */}
                          <div className="flex flex-wrap items-center gap-1">
                            {quickQuoteTags.map((preset) => (
                              <div
                                key={preset}
                                className={`group inline-flex items-center gap-0.5 text-[10px] pl-1.5 pr-1 py-0.5 rounded border transition ${
                                  quickQuoteVendor === preset
                                    ? 'bg-gold text-ink border-gold font-bold'
                                    : 'bg-card text-text-muted border-line hover:text-text'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => setQuickQuoteVendor(preset)}
                                  className="cursor-pointer"
                                >
                                  +{preset}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteQuickTag(preset);
                                  }}
                                  className="opacity-30 group-hover:opacity-100 hover:text-red-400 p-0.5 cursor-pointer ml-0.5"
                                  title={`Remove ${preset}`}
                                >
                                  ×
                                </button>
                              </div>
                            ))}

                            {showAddTagInput ? (
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder="Shop..."
                                  value={newCustomTag}
                                  onChange={(e) => setNewCustomTag(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddNewQuickTag();
                                    } else if (e.key === 'Escape') {
                                      setShowAddTagInput(false);
                                    }
                                  }}
                                  autoFocus
                                  className="text-[10px] px-1 py-0.5 bg-surface border border-gold rounded text-text w-20 focus:outline-hidden"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddNewQuickTag}
                                  className="text-[10px] px-1 py-0.5 bg-gold text-ink font-bold rounded cursor-pointer"
                                >
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowAddTagInput(false)}
                                  className="text-[10px] text-text-muted hover:text-white px-0.5 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setShowAddTagInput(true)}
                                className="text-[10px] px-1.5 py-0.5 bg-card text-text-muted hover:text-gold border border-dashed border-line rounded cursor-pointer"
                                title="Add custom quick shop tag"
                              >
                                + Tag
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              value={quickQuoteVendor}
                              onChange={(e) => setQuickQuoteVendor(e.target.value)}
                              placeholder="Retailer name..."
                              className="px-2 py-1 bg-card border border-line rounded text-[11px] text-text focus:border-gold outline-none"
                            />
                            <div className="flex gap-1">
                              <select
                                value={quickQuoteCurrency}
                                onChange={(e) => setQuickQuoteCurrency(e.target.value)}
                                className="px-1.5 py-1 bg-card border border-line rounded text-[11px] text-text focus:border-gold outline-none"
                              >
                                <option value="£">£</option>
                                <option value="$">$</option>
                                <option value="€">€</option>
                                <option value="CHF">CHF</option>
                              </select>
                              <input
                                type="number"
                                step="0.01"
                                value={quickQuoteValue}
                                onChange={(e) => setQuickQuoteValue(e.target.value)}
                                placeholder="Price..."
                                className="w-full px-2 py-1 bg-card border border-line rounded text-[11px] text-text focus:border-gold outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setQuickQuoteCigarId(null);
                                setQuickQuoteValue('');
                              }}
                              className="px-2 py-1 text-[10px] text-text-muted hover:text-text rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveQuickQuote(cigar)}
                              className="px-2.5 py-1 bg-gold hover:brightness-110 text-ink font-bold text-[10px] rounded transition cursor-pointer"
                            >
                              Save Quote
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-line space-y-3">
                  {/* Stock Stepper & Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateQuantity(cigar.id, Math.max(0, cigar.quantity - 1))}
                        className="w-7 h-7 rounded bg-surface hover:bg-line text-text flex items-center justify-center border border-line transition cursor-pointer"
                        title="Deduct 1 stick"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-base font-serif font-bold text-white min-w-[28px] text-center">
                        {cigar.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(cigar.id, cigar.quantity + 1)}
                        className="w-7 h-7 rounded bg-surface hover:bg-line text-text flex items-center justify-center border border-line transition cursor-pointer"
                        title="Add 1 stick"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-text-muted">sticks</span>
                    </div>

                    <div className="text-right">
                      {displayFields.pricing && (
                        <div className="text-xs font-serif text-text">
                          {cigar.purchasePrice !== undefined ? `${formatCurrency(cigar.purchasePrice, cigar.currency || '£')}/ea` : '—'}
                        </div>
                      )}
                      {displayFields.rating && cigar.personalRating && (
                        <div className="text-[11px] font-serif font-bold text-gold">
                          ★ {cigar.personalRating}/100
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div>
                    <button
                      onClick={() => onSmokeCigar(cigar.id)}
                      disabled={isOutOfStock}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded text-xs uppercase tracking-wider font-bold transition cursor-pointer shadow-sm ${
                        isOutOfStock
                          ? 'bg-surface text-line-hover border border-line cursor-not-allowed'
                          : 'bg-gold hover:brightness-110 text-ink'
                      }`}
                    >
                      <Flame className="w-4 h-4" />
                      <span>Smoke Stick</span>
                    </button>
                  </div>

                  {/* Mini actions row */}
                  <div className="flex justify-between items-center gap-2 text-text-muted text-xs pt-1.5 border-t border-line/60">
                    <div className="flex items-center gap-2">
                      {onAddToWishlist && (
                        <button
                          onClick={() => {
                            onAddToWishlist({
                              brand: cigar.brand,
                              name: cigar.name,
                              vitola: cigar.vitola,
                              notes: cigar.notes || `Stocked in ${humidor?.name || 'Humidor'}`,
                              targetPrice: cigar.purchasePrice,
                              priority: 'Medium',
                            });
                            showNotice(`Added "${cigar.brand} ${cigar.name}" to your Wishlist!`);
                          }}
                          className="hover:text-gold flex items-center gap-1 cursor-pointer text-[11px]"
                          title="Bookmark to Wishlist"
                        >
                          <Bookmark className="w-3 h-3 text-gold" />
                          <span>Wishlist</span>
                        </button>
                      )}
                      {onAddToResearch && (
                        <button
                          onClick={() => {
                            const newRes: CigarResearchItem = {
                              id: generateId('res-inv'),
                              brand: cigar.brand,
                              line: cigar.line || cigar.name,
                              vitola: cigar.vitola || 'Robusto',
                              lengthInches: cigar.lengthInches || 5.0,
                              ringGauge: cigar.ringGauge || 50,
                              countryOrigin: cigar.countryOrigin || 'Cuba',
                              wrapper: cigar.wrapper || 'Habano',
                              wrapperType: (cigar.wrapper?.includes('Maduro') ? 'Maduro' : cigar.wrapper?.includes('Connecticut') ? 'Connecticut Shade' : 'Habano') as any,
                              binder: cigar.binder || 'Proprietary',
                              filler: cigar.filler || 'Proprietary',
                              strength: cigar.strength || 'Medium-Full',
                              body: 'Medium-Full',
                              averagePrice: cigar.purchasePrice || 22.0,
                              priceRange: cigar.purchasePrice ? `£${(cigar.purchasePrice * 0.9).toFixed(0)} - £${(cigar.purchasePrice * 1.2).toFixed(0)}` : '£20 - £30',
                              criticRating: cigar.personalRating || 91,
                              criticConsensus: cigar.notes || `${cigar.brand} ${cigar.name} from personal humidor collection.`,
                              reviewTastingNotes: {
                                overview: cigar.notes || 'Full tasting profile.',
                                firstThird: 'Smooth cedar and soft baking spice.',
                                secondThird: 'Rich cocoa, leather and roasted nuts.',
                                finalThird: 'Deep oak and peppery finish.',
                                dominantFlavorTags: cigar.flavorTags?.length ? cigar.flavorTags : ['Cedar', 'Leather', 'Cocoa'],
                              },
                              recommendedPairings: ['Single Malt Scotch', 'Espresso'],
                              agingWindowMonths: cigar.targetRestMonths || 6,
                              isCuban: cigar.countryOrigin?.toLowerCase().includes('cuba') || false,
                            };
                            onAddToResearch(newRes);
                            showNotice(`Saved "${cigar.brand} ${cigar.name}" to Research Database!`);
                          }}
                          className="hover:text-gold flex items-center gap-1 cursor-pointer text-[11px]"
                          title="Save to Research Database"
                        >
                          <BookOpen className="w-3 h-3 text-gold" />
                          <span>Research DB</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {onOpenPriceEditor && (
                        <button
                          onClick={() =>
                            onOpenPriceEditor({
                              brand: cigar.brand,
                              name: cigar.name,
                              vitola: cigar.vitola,
                              price: cigar.purchasePrice,
                              vendor: cigar.vendor,
                              currency: cigar.currency,
                            })
                          }
                          className="hover:text-emerald-400 flex items-center gap-1 cursor-pointer text-[11px]"
                          title="Compare & edit multiple retailer prices"
                        >
                          <Store className="w-3 h-3 text-emerald-400" />
                          <span>Prices</span>
                        </button>
                      )}

                      <button
                        onClick={() => onEditCigar(cigar)}
                        className="hover:text-text flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <span>•</span>
                      {confirmDeleteId === cigar.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-red-400 text-[11px] font-semibold">Delete?</span>
                          <button
                            onClick={() => {
                              onDeleteCigar(cigar.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer transition"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 bg-line hover:bg-line-hover text-text-muted rounded text-[10px] cursor-pointer transition"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(cigar.id)}
                          className="hover:text-red-400 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {filteredCigars.length > 0 && viewMode === 'table' && (
        <div className="bg-card border border-line rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text">
              <thead className="bg-surface text-text-muted uppercase tracking-wider font-semibold border-b border-line">
                <tr>
                  <th className="p-3">Brand & Name</th>
                  {displayFields.vitolaSpecs && <th className="p-3">Vitola / Specs</th>}
                  {displayFields.smokeTime && <th className="p-3">Smoke Duration</th>}
                  {displayFields.wrapperOrigin && <th className="p-3">Wrapper & Terroir</th>}
                  {displayFields.strength && <th className="p-3">Strength</th>}
                  {displayFields.humidorResting && <th className="p-3">Humidor</th>}
                  {displayFields.humidorResting && <th className="p-3">Resting</th>}
                  <th className="p-3">Qty</th>
                  {displayFields.pricing && <th className="p-3">Price</th>}
                  {displayFields.rating && <th className="p-3">Rating</th>}
                  {displayFields.notes && <th className="p-3 max-w-xs">Notes</th>}
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredCigars.map((c) => {
                  const rest = calculateRestDays(c.purchaseDate);
                  const hum = humidorMap.get(c.humidorId);
                  const smokeEstimate = estimateAccurateSmokeTime(c.vitola, c.lengthInches, c.ringGauge);
                  const smokeDurationText = c.smokeTimeRange || smokeEstimate.range;

                  return (
                    <tr key={c.id} className="hover:bg-card-hover transition">
                      <td className="p-3">
                        <div className="font-semibold text-white">{c.brand}</div>
                        <div className="text-text-muted">{c.name}</div>
                      </td>
                      {displayFields.vitolaSpecs && (
                        <td className="p-3">
                          <div>{c.vitola}</div>
                          <div className="text-text-muted text-[10px]">
                            {c.lengthInches ? `${c.lengthInches}"` : ''} {c.ringGauge ? `x ${c.ringGauge}` : ''}
                          </div>
                        </td>
                      )}
                      {displayFields.smokeTime && (
                        <td className="p-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface text-gold border border-line font-mono text-[11px] font-medium">
                            <Clock className="w-3 h-3 text-gold" />
                            <span>⏱️ {smokeDurationText}</span>
                          </span>
                        </td>
                      )}
                      {displayFields.wrapperOrigin && (
                        <td className="p-3">
                          <div>{c.wrapper}</div>
                          <div className="text-gold font-serif text-[10px]">{c.countryOrigin}</div>
                        </td>
                      )}
                      {displayFields.strength && (
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-surface text-text border border-line text-[11px]">
                            {c.strength}
                          </span>
                        </td>
                      )}
                      {displayFields.humidorResting && (
                        <td className="p-3 text-text-muted">{hum?.name || 'Main Vault'}</td>
                      )}
                      {displayFields.humidorResting && (
                        <td className="p-3">
                          <div className="font-serif text-gold">{rest}d</div>
                          <div className="text-[10px] text-text-muted">{c.status}</div>
                        </td>
                      )}
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onUpdateQuantity(c.id, Math.max(0, c.quantity - 1))}
                            className="p-1 text-text-muted hover:text-text"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-serif font-bold text-white w-6 text-center">{c.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(c.id, c.quantity + 1)}
                            className="p-1 text-text-muted hover:text-text"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      {displayFields.pricing && (
                        <td className="p-3 font-serif text-text">
                          <div>{c.purchasePrice !== undefined ? formatCurrency(c.purchasePrice, c.currency || '£') : '—'}</div>
                          {displayFields.retailerQuotes && c.vendorPrices && c.vendorPrices.length > 0 && (
                            <div className="text-[10px] text-gold font-sans font-medium">
                              {c.vendorPrices.length} quote{c.vendorPrices.length > 1 ? 's' : ''} ({c.vendorPrices.map((v) => v.vendor).slice(0, 2).join(', ')}{c.vendorPrices.length > 2 ? '...' : ''})
                            </div>
                          )}
                        </td>
                      )}
                      {displayFields.rating && (
                        <td className="p-3 font-serif font-bold text-gold">
                          {c.personalRating ? `★ ${c.personalRating}` : '—'}
                        </td>
                      )}
                      {displayFields.notes && (
                        <td className="p-3 max-w-xs truncate text-text-muted italic">
                          {c.notes || '—'}
                        </td>
                      )}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onAddToWishlist && (
                            <button
                              onClick={() => {
                                onAddToWishlist({
                                  brand: c.brand,
                                  name: c.name,
                                  vitola: c.vitola,
                                  notes: c.notes || `Stocked in ${hum?.name || 'Humidor'}`,
                                  targetPrice: c.purchasePrice,
                                  priority: 'Medium',
                                });
                                showNotice(`Added "${c.brand} ${c.name}" to Wishlist!`);
                              }}
                              className="p-1.5 text-text-muted hover:text-gold border border-line hover:border-gold/40 rounded cursor-pointer transition"
                              title="Add to Wishlist"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onSmokeCigar(c.id)}
                            className="px-3 py-1 bg-gold hover:brightness-110 text-ink rounded font-bold text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          >
                            <Flame className="w-3 h-3" />
                            <span>Smoke</span>
                          </button>
                          <button
                            onClick={() => onEditCigar(c)}
                            className="p-1 text-text-muted hover:text-text cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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
    </div>
  );
};

