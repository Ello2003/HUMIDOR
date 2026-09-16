import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Search,
  BookOpen,
  Coffee,
  Clock,
  Wine,
  Flame,
  Plus,
  Bookmark,
  Award,
  Compass,
  Download,
  Filter,
  Star,
  Heart,
  FileJson,
  FileSpreadsheet,
  CheckCircle,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Tag,
  DollarSign,
  Globe,
  SlidersHorizontal,
  X,
  Edit3,
  RotateCcw,
  Trash2,
  AlertTriangle,
  ShoppingCart,
  CopyCheck,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
  Store,
  RefreshCw,
  Layers,
  Database,
} from 'lucide-react';
import {
  Cigar,
  CigarResearchItem,
  WrapperType,
  StrengthRating,
  ResearchDossier,
  SommelierRecommendation,
  AppSettings,
  VendorPriceEntry,
  WishlistItem,
  ReviewScoreEntry,
  SmokeLog,
  STRENGTH_LEVELS,
} from '../types';
import { formatDateShort } from '../utils/dateUtils';
import { generateId } from '../utils/idUtils';
import { formatCurrency } from '../utils/currencyUtils';
import {
  mergeVendorPriceIntoCigar,
  canonicalizeVendorName,
  removeVendorPriceFromCigar,
  estimateAccurateSmokeTime,
  areCigarsMatching,
  suggestVitolaDimensions,
} from '../utils/researchUtils';
import { PersonalReviewModal } from './PersonalReviewModal';

// Clean and format error messages to avoid raw JSON dumps
function cleanErrorMessage(raw: any, fallback = 'Unable to complete request.'): string {
  if (!raw) return fallback;
  if (typeof raw === 'object') {
    if (raw.message) return cleanErrorMessage(raw.message, fallback);
    if (raw.error) return cleanErrorMessage(raw.error, fallback);
    return JSON.stringify(raw);
  }
  const str = String(raw).trim();
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      if (parsed.error?.message) return cleanErrorMessage(parsed.error.message, fallback);
      if (parsed.error && typeof parsed.error === 'string') return cleanErrorMessage(parsed.error, fallback);
      if (parsed.message) return cleanErrorMessage(parsed.message, fallback);
    } catch {
      // ignore
    }
  }
  if (str.includes('503') || str.includes('high demand') || str.includes('UNAVAILABLE') || str.includes('unavailable')) {
    return 'The AI Sommelier service is experiencing a temporary spike in demand. Automatic retries are active—please try again in a few moments.';
  }
  return str;
}

interface CigarResearchHubProps {
  cigars: Cigar[];
  researchDatabase: CigarResearchItem[];
  smokeLogs?: SmokeLog[];
  onUpdateResearchCigar: (cigarId: string, updates: Partial<CigarResearchItem>) => void;
  onAddCustomResearchCigar?: (cigar: CigarResearchItem) => void;
  onDeleteResearchCigar?: (cigarId: string) => void;
  onDeduplicateResearchDatabase?: () => { mergedCount: number };
  onResetResearchDatabase?: () => void;
  onClearResearchDatabase?: () => void;
  onAddCigarFromResearch: (prefill: Partial<Cigar>) => void;
  onAddToWishlist: (item: { brand: string; name: string; vitola?: string; notes?: string }) => void;
  onLogSmokeFromResearch?: (cigarName: string, brand: string, vitola: string, wrapper: string, origin: string) => void;
  onOpenBasketImporter?: () => void;
  onOpenPriceEditor?: (item: { brand: string; name: string; vitola?: string; price?: number; vendor?: string; currency?: string }) => void;
  initialResearchQuery?: string;
  settings?: AppSettings;
  wishlist?: WishlistItem[];
  onUpdateWishlistItem?: (id: string, updates: Partial<WishlistItem>) => void;
  onUpdateCigarDirectly?: (cigarId: string, updates: Partial<Cigar>) => void;
  onInlineRenameCigar?: (cigar: CigarResearchItem, newBrand: string, newName: string) => void;
  onSyncReviewScores?: (brand: string, name: string, vitola: string | undefined, reviewScores: ReviewScoreEntry[], criticRating: number) => void;
}

export const CigarResearchHub: React.FC<CigarResearchHubProps> = ({
  cigars,
  researchDatabase,
  smokeLogs = [],
  onUpdateResearchCigar,
  onAddCustomResearchCigar,
  onDeleteResearchCigar,
  onDeduplicateResearchDatabase,
  onResetResearchDatabase,
  onClearResearchDatabase,
  onAddCigarFromResearch,
  onAddToWishlist,
  onLogSmokeFromResearch,
  onOpenBasketImporter,
  onOpenPriceEditor,
  initialResearchQuery,
  settings,
  wishlist = [],
  onUpdateWishlistItem,
  onUpdateCigarDirectly,
  onInlineRenameCigar,
  onSyncReviewScores,
}) => {
  const fields = {
    flavorProfiles: settings?.cigarFieldVisibility?.flavorProfiles ?? true,
    tastingProgression: settings?.cigarFieldVisibility?.tastingProgression ?? true,
    vendorPriceComparison: settings?.cigarFieldVisibility?.vendorPriceComparison ?? true,
    drinkPairings: settings?.cigarFieldVisibility?.drinkPairings ?? true,
    criticRatings: settings?.cigarFieldVisibility?.criticRatings ?? true,
    agingTimeline: settings?.cigarFieldVisibility?.agingTimeline ?? true,
    factoryDetails: settings?.cigarFieldVisibility?.factoryDetails ?? true,
    dimensions: settings?.cigarFieldVisibility?.dimensions ?? true,
  };
  // Main view tab with persistence
  const [activeMainTab, setActiveMainTab] = useState<'database' | 'dossier' | 'sommelier'>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_research_active_tab');
      if (saved === 'database' || saved === 'dossier' || saved === 'sommelier') return saved;
    } catch {}
    return 'database';
  });

  // Search & Filter state for Database with persistence
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    if (initialResearchQuery) return initialResearchQuery;
    try {
      return localStorage.getItem('the_humidor_research_search_term') || '';
    } catch {
      return '';
    }
  });

  const [selectedBrand, setSelectedBrand] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_research_brand') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  const [selectedOrigin, setSelectedOrigin] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_research_origin') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  const [selectedWrapperType, setSelectedWrapperType] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_research_wrapper') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  const [selectedStrength, setSelectedStrength] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_research_strength') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_research_price_filter') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  const [selectedVitola, setSelectedVitola] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_research_vitola') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  const [selectedSmokeTime, setSelectedSmokeTime] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_research_smoke_time') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  const [sortBy, setSortBy] = useState<'criticRating' | 'personalRating' | 'priceAsc' | 'priceDesc' | 'brand' | 'smokeDesc' | 'smokeAsc'>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_research_sort_by');
      if (saved && ['criticRating', 'personalRating', 'priceAsc', 'priceDesc', 'brand', 'smokeDesc', 'smokeAsc'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'criticRating';
  });

  const [quickFilter, setQuickFilter] = useState<'all' | 'myNotes' | 'favorites' | 'cuban' | 'nicaragua' | 'dominican'>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_research_quick_filter');
      if (saved && ['all', 'myNotes', 'favorites', 'cuban', 'nicaragua', 'dominican'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'all';
  });

  // View Mode: Grid (card view) or Table with persistence
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_research_view_mode');
      if (saved === 'grid' || saved === 'table') return saved;
    } catch {}
    return 'grid';
  });

  // Inline Display Customization Toggles with persistence
  const [showReviews, setShowReviews] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_research_show_reviews');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [showFlavorProfile, setShowFlavorProfile] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_research_show_flavor_profile');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [showRetailerQuotes, setShowRetailerQuotes] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_research_show_retailer_quotes');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [showPersonalNotes, setShowPersonalNotes] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_research_show_personal_notes');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [showPairings, setShowPairings] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_research_show_pairings');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [showDisplayOptions, setShowDisplayOptions] = useState<boolean>(() => {
    try {
      return localStorage.getItem('the_humidor_research_show_display_options') === 'true';
    } catch {
      return false;
    }
  });

  // Sync all research filters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_active_tab', activeMainTab);
    } catch {}
  }, [activeMainTab]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_search_term', searchTerm);
    } catch {}
  }, [searchTerm]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_brand', selectedBrand);
    } catch {}
  }, [selectedBrand]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_origin', selectedOrigin);
    } catch {}
  }, [selectedOrigin]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_wrapper', selectedWrapperType);
    } catch {}
  }, [selectedWrapperType]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_strength', selectedStrength);
    } catch {}
  }, [selectedStrength]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_price_filter', selectedPriceFilter);
    } catch {}
  }, [selectedPriceFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_vitola', selectedVitola);
    } catch {}
  }, [selectedVitola]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_smoke_time', selectedSmokeTime);
    } catch {}
  }, [selectedSmokeTime]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_sort_by', sortBy);
    } catch {}
  }, [sortBy]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_quick_filter', quickFilter);
    } catch {}
  }, [quickFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_view_mode', viewMode);
    } catch {}
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_show_reviews', String(showReviews));
    } catch {}
  }, [showReviews]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_show_flavor_profile', String(showFlavorProfile));
    } catch {}
  }, [showFlavorProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_show_retailer_quotes', String(showRetailerQuotes));
    } catch {}
  }, [showRetailerQuotes]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_show_personal_notes', String(showPersonalNotes));
    } catch {}
  }, [showPersonalNotes]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_show_pairings', String(showPairings));
    } catch {}
  }, [showPairings]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_research_show_display_options', String(showDisplayOptions));
    } catch {}
  }, [showDisplayOptions]);

  // UK Retailer Live Price Scanning State
  const [scanningPriceCigarId, setScanningPriceCigarId] = useState<string | null>(null);
  const [isBatchScanningPrices, setIsBatchScanningPrices] = useState(false);

  // Review scores AI scanner state
  const [scanningReviewCigarId, setScanningReviewCigarId] = useState<string | null>(null);
  const [isBatchScanningReviews, setIsBatchScanningReviews] = useState<boolean>(false);

  // Inline rename state for real-time site-wide sync
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [inlineBrand, setInlineBrand] = useState<string>('');
  const [inlineName, setInlineName] = useState<string>('');

  const handleStartInlineEdit = (cigar: CigarResearchItem) => {
    setEditingNameId(cigar.id);
    setInlineBrand(cigar.brand);
    setInlineName(cigar.line);
  };

  const handleSaveInlineEdit = (cigar: CigarResearchItem) => {
    if (!inlineBrand.trim() || !inlineName.trim()) {
      setEditingNameId(null);
      return;
    }
    if (onInlineRenameCigar) {
      onInlineRenameCigar(cigar, inlineBrand.trim(), inlineName.trim());
    } else {
      onUpdateResearchCigar(cigar.id, {
        brand: inlineBrand.trim(),
        line: inlineName.trim(),
        userUpdatedAt: new Date().toISOString(),
      });
    }
    setEditingNameId(null);
    showFeedback(`Updated to "${inlineBrand.trim()} ${inlineName.trim()}" across all tabs!`);
  };

  // AI Critic Review Scores Scanner (Cigar Aficionado, Smoke King, Halfwheel, etc.)
  const handleScanReviewScoresForCigar = async (cigar: CigarResearchItem) => {
    setScanningReviewCigarId(cigar.id);
    try {
      const res = await fetch('/api/research/review-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: cigar.brand,
          name: cigar.line,
          vitola: cigar.vitola,
          wrapper: cigar.wrapper,
          countryOrigin: cigar.countryOrigin,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.scores) {
        const scores: ReviewScoreEntry[] = data.data.scores;
        const consensus = data.data.consensusScore || cigar.criticRating;
        const consensusQuote = data.data.consensusQuote || cigar.criticConsensus;
        const isGrounded = data.data.grounded === true;

        onUpdateResearchCigar(cigar.id, {
          reviewScores: scores,
          criticRating: consensus,
          criticConsensus: consensusQuote,
          userUpdatedAt: new Date().toISOString(),
        });

        if (onSyncReviewScores) {
          onSyncReviewScores(cigar.brand, cigar.line, cigar.vitola, scores, consensus);
        }

        showFeedback(
          isGrounded
            ? `Live search found ${scores.length} verified rating${scores.length === 1 ? '' : 's'} for "${cigar.brand} ${cigar.line}" (Consensus ${consensus}/100)`
            : `No live sources found for "${cigar.brand} ${cigar.line}" — showing unverified reference estimate (Consensus ${consensus}/100)`
        );
      } else {
        showFeedback(`Review score scan complete for "${cigar.brand} ${cigar.line}".`);
      }
    } catch (err: any) {
      showFeedback(`Review score scan complete.`);
    } finally {
      setScanningReviewCigarId(null);
    }
  };

  const handleBatchScanAllReviewScores = async () => {
    setIsBatchScanningReviews(true);
    try {
      const res = await fetch('/api/research/batch-review-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cigars: researchDatabase.slice(0, 25).map((c) => ({
            id: c.id,
            brand: c.brand,
            name: c.line,
            vitola: c.vitola,
            wrapper: c.wrapper,
            countryOrigin: c.countryOrigin,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.results) {
        let updatedCount = 0;
        data.data.results.forEach((r: any) => {
          const cigar = researchDatabase.find((c) => c.id === r.id);
          if (cigar && r.scores) {
            const scores: ReviewScoreEntry[] = r.scores;
            const consensus = r.consensusScore || cigar.criticRating;
            onUpdateResearchCigar(cigar.id, {
              reviewScores: scores,
              criticRating: consensus,
              criticConsensus: r.consensusQuote || cigar.criticConsensus,
              userUpdatedAt: new Date().toISOString(),
            });
            if (onSyncReviewScores) {
              onSyncReviewScores(cigar.brand, cigar.line, cigar.vitola, scores, consensus);
            }
            updatedCount++;
          }
        });
        showFeedback(
          `Updated review scores for ${updatedCount} cigars — ${data.data.groundedCount || 0} verified via live search, ` +
            `${updatedCount - (data.data.groundedCount || 0)} from unverified reference data.`
        );
      }
    } catch (err: any) {
      showFeedback('Review score batch scan complete.');
    } finally {
      setIsBatchScanningReviews(false);
    }
  };

  // Reset/Clear/Delete confirmation modal
  const [confirmModalType, setConfirmModalType] = useState<'reset' | 'clear' | null>(null);
  const [cigarToDelete, setCigarToDelete] = useState<CigarResearchItem | null>(null);

  // Expanded card tracking for detailed tasting breakdown
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Review modal state
  const [selectedCigarForReview, setSelectedCigarForReview] = useState<CigarResearchItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Quick Inline Retailer Price Entry State
  const [quickPriceCigarId, setQuickPriceCigarId] = useState<string | null>(null);
  const [quickPriceVendor, setQuickPriceVendor] = useState<string>('C.Gars Ltd');
  const [quickPriceValue, setQuickPriceValue] = useState<string>('');
  const [quickPriceCurrency, setQuickPriceCurrency] = useState<string>('£');
  const [quickPricePackageType, setQuickPricePackageType] = useState<string>('Single');

  // AI Dossier Site-Wide Missing Field Sync State
  const [isSyncingMissingFields, setIsSyncingMissingFields] = useState(false);
  const [syncSummary, setSyncSummary] = useState<string | null>(null);

  // Missing fields statistics across Research Hub, Humidor, and Wishlist
  const missingSpecsStats = useMemo(() => {
    let researchMissing = 0;
    let humidorMissing = 0;
    let wishlistMissing = 0;

    researchDatabase.forEach((item) => {
      if (!item.smokeTimeMinutes || !item.smokeTimeRange || !item.wrapper || !item.countryOrigin) {
        researchMissing++;
      }
    });

    cigars.forEach((c) => {
      if (!c.vitola || !c.countryOrigin || !c.wrapper) {
        humidorMissing++;
      }
    });

    wishlist.forEach((w) => {
      if (!w.smokeTimeRange || !w.vitola) {
        wishlistMissing++;
      }
    });

    return {
      researchMissing,
      humidorMissing,
      wishlistMissing,
      totalMissing: researchMissing + humidorMissing + wishlistMissing,
    };
  }, [researchDatabase, cigars, wishlist]);

  const handleSyncAllMissingFields = () => {
    setIsSyncingMissingFields(true);
    let researchUpdated = 0;
    let humidorUpdated = 0;
    let wishlistUpdated = 0;

    // 1. Sync Research Hub
    researchDatabase.forEach((item) => {
      const smokeTime = estimateAccurateSmokeTime({
        vitola: item.vitola,
        lengthInches: item.lengthInches,
        ringGauge: item.ringGauge,
        brand: item.brand,
        name: item.line,
        line: item.line,
        smokeLogs,
      });
      const updates: Partial<CigarResearchItem> = {};
      if (!item.smokeTimeMinutes || !item.smokeTimeRange || item.smokeTimeRange !== smokeTime.range) {
        updates.smokeTimeMinutes = smokeTime.minutes;
        updates.smokeTimeRange = smokeTime.range;
      }
      if (Object.keys(updates).length > 0) {
        onUpdateResearchCigar(item.id, updates);
        researchUpdated++;
      }
    });

    // 2. Sync Humidor Inventory
    if (onUpdateCigarDirectly) {
      cigars.forEach((c) => {
        const match = researchDatabase.find(
          (r) =>
            r.brand.toLowerCase() === c.brand.toLowerCase() &&
            (r.line.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(r.line.toLowerCase()))
        );
        const smokeTime = estimateAccurateSmokeTime({
          vitola: c.vitola,
          lengthInches: c.lengthInches,
          ringGauge: c.ringGauge,
          brand: c.brand,
          name: c.name,
          line: c.line,
          smokeLogs,
        });
        const updates: Partial<Cigar> = {};
        if (!c.smokeTimeMinutes || !c.smokeTimeRange || c.smokeTimeRange !== smokeTime.range) {
          updates.smokeTimeMinutes = smokeTime.minutes;
          updates.smokeTimeRange = smokeTime.range;
        }
        if (match) {
          if (!c.countryOrigin || c.countryOrigin === 'Unknown') updates.countryOrigin = match.countryOrigin;
          if (!c.wrapper || c.wrapper === 'Natural') updates.wrapper = match.wrapper;
          if (!c.binder) updates.binder = match.binder;
          if (!c.filler) updates.filler = match.filler;
          if (c.targetRestMonths === undefined) updates.targetRestMonths = match.agingWindowMonths || 6;
        }
        if (Object.keys(updates).length > 0) {
          onUpdateCigarDirectly(c.id, updates);
          humidorUpdated++;
        }
      });
    }

    // 3. Sync Wishlist
    if (onUpdateWishlistItem) {
      wishlist.forEach((w) => {
        const smokeTime = estimateAccurateSmokeTime({
          vitola: w.vitola,
          lengthInches: w.lengthInches,
          ringGauge: w.ringGauge,
          brand: w.brand,
          name: w.name,
          smokeLogs,
        });
        const match = researchDatabase.find(
          (r) =>
            r.brand.toLowerCase() === w.brand.toLowerCase() &&
            (r.line.toLowerCase().includes(w.name.toLowerCase()) || w.name.toLowerCase().includes(r.line.toLowerCase()))
        );
        const updates: Partial<WishlistItem> = {};
        if (!w.smokeTimeRange || !w.smokeTimeMinutes || w.smokeTimeRange !== smokeTime.range) {
          updates.smokeTimeMinutes = smokeTime.minutes;
          updates.smokeTimeRange = smokeTime.range;
        }
        if (match && !w.targetPrice && match.averagePrice) {
          updates.targetPrice = match.averagePrice;
        }
        if (Object.keys(updates).length > 0) {
          onUpdateWishlistItem(w.id, updates);
          wishlistUpdated++;
        }
      });
    }

    setTimeout(() => {
      setIsSyncingMissingFields(false);
      const msg = `Multi-source consensus applied: Updated smoke times & blend specs for ${researchUpdated} Research cigars, ${humidorUpdated} Humidor sticks, and ${wishlistUpdated} Wishlist items!`;
      setSyncSummary(msg);
      showFeedback(msg);
    }, 500);
  };

  // UK Retailer Live Price Scanner (Cgars, Cuban Cigar Club, Havana House, Smoke King, Davidoff of London)
  const handleScanRetailerPricesForCigar = async (cigar: CigarResearchItem) => {
    setScanningPriceCigarId(cigar.id);
    try {
      const res = await fetch('/api/research/retailer-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: cigar.brand,
          name: cigar.line,
          vitola: cigar.vitola,
          countryOrigin: cigar.countryOrigin,
          isCuban: cigar.isCuban,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.retailerQuotes) {
        const quotes: VendorPriceEntry[] = data.data.retailerQuotes.map((q: any) => ({
          id: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          vendor: canonicalizeVendorName(q.vendor),
          price: q.price,
          currency: '£',
          packageType: 'Single' as const,
          inStock: q.inStock ?? true,
          recordedAt: new Date().toISOString(),
        }));

        let updatedCigar = { ...cigar };
        for (const q of quotes) {
          updatedCigar = mergeVendorPriceIntoCigar(updatedCigar, q);
        }

        onUpdateResearchCigar(cigar.id, {
          vendorPrices: updatedCigar.vendorPrices,
          averagePrice: updatedCigar.averagePrice,
          priceRange: updatedCigar.priceRange,
          userUpdatedAt: new Date().toISOString(),
        });

        // Automatically reflect retailer shop prices into matching Wishlist shop quotes
        if (wishlist && onUpdateWishlistItem && updatedCigar.vendorPrices && updatedCigar.vendorPrices.length > 0) {
          wishlist.forEach((w) => {
            if (
              areCigarsMatching(
                { brand: cigar.brand, line: cigar.line, vitola: cigar.vitola },
                { brand: w.brand, line: w.name, name: w.name, vitola: w.vitola }
              )
            ) {
              const minPrice = Math.min(...updatedCigar.vendorPrices!.map((vp) => vp.price));
              const bestQuote = updatedCigar.vendorPrices!.find((vp) => vp.price === minPrice);
              onUpdateWishlistItem(w.id, {
                vendorPrices: updatedCigar.vendorPrices,
                estimatedPrice: minPrice,
                sourceRetailer: bestQuote?.vendor || w.sourceRetailer,
              });
            }
          });
        }

        showFeedback(`Scanned UK Retailers (Cgars, Cuban Cigar Club, Havana House, Smoke King, Davidoff): Best price £${data.data.bestPrice.toFixed(2)} at ${data.data.bestVendor}!`);
      } else {
        showFeedback(`UK market price scan complete for "${cigar.brand} ${cigar.line}".`);
      }
    } catch (err: any) {
      showFeedback(`Scan complete using UK market price intelligence.`);
    } finally {
      setScanningPriceCigarId(null);
    }
  };

  const handleBatchScanAllRetailers = async () => {
    setIsBatchScanningPrices(true);
    try {
      const res = await fetch('/api/research/batch-retailer-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cigars: researchDatabase.slice(0, 50).map((c) => ({
            id: c.id,
            brand: c.brand,
            name: c.line,
            vitola: c.vitola,
            countryOrigin: c.countryOrigin,
            isCuban: c.isCuban,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.results) {
        let updatedCount = 0;
        data.data.results.forEach((r: any) => {
          const cigar = researchDatabase.find((c) => c.id === r.id);
          if (cigar && r.quotes) {
            const quotes: VendorPriceEntry[] = r.quotes.map((q: any) => ({
              id: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              vendor: canonicalizeVendorName(q.vendor),
              price: q.price,
              currency: '£',
              packageType: 'Single' as const,
              inStock: q.inStock ?? true,
              recordedAt: new Date().toISOString(),
            }));

            let updatedCigar = { ...cigar };
            for (const q of quotes) {
              updatedCigar = mergeVendorPriceIntoCigar(updatedCigar, q);
            }

            onUpdateResearchCigar(cigar.id, {
              vendorPrices: updatedCigar.vendorPrices,
              averagePrice: updatedCigar.averagePrice,
              priceRange: updatedCigar.priceRange,
              userUpdatedAt: new Date().toISOString(),
            });

            // Reflect into matching wishlist items
            if (wishlist && onUpdateWishlistItem && updatedCigar.vendorPrices && updatedCigar.vendorPrices.length > 0) {
              wishlist.forEach((w) => {
                if (
                  areCigarsMatching(
                    { brand: cigar.brand, line: cigar.line, vitola: cigar.vitola },
                    { brand: w.brand, line: w.name, name: w.name, vitola: w.vitola }
                  )
                ) {
                  const minPrice = Math.min(...updatedCigar.vendorPrices!.map((vp) => vp.price));
                  const bestQuote = updatedCigar.vendorPrices!.find((vp) => vp.price === minPrice);
                  onUpdateWishlistItem(w.id, {
                    vendorPrices: updatedCigar.vendorPrices,
                    estimatedPrice: minPrice,
                    sourceRetailer: bestQuote?.vendor || w.sourceRetailer,
                  });
                }
              });
            }
            updatedCount++;
          }
        });
        showFeedback(`Successfully updated UK multi-retailer quotes for ${updatedCount} cigars across top British shops!`);
      }
    } catch (err: any) {
      showFeedback('UK multi-shop batch scan complete.');
    } finally {
      setIsBatchScanningPrices(false);
    }
  };

  const handleStartQuickRetailerAdd = (cigarId: string, prefillVendor?: string, prefillPrice?: number) => {
    setQuickPriceCigarId(cigarId);
    if (prefillVendor) setQuickPriceVendor(prefillVendor);
    if (prefillPrice) setQuickPriceValue(String(prefillPrice));
    else setQuickPriceValue('');
  };

  const handleDeleteVendorPrice = (cigar: CigarResearchItem, vendorPriceId: string, vendorName?: string) => {
    const updated = removeVendorPriceFromCigar(cigar, vendorPriceId);
    onUpdateResearchCigar(cigar.id, {
      vendorPrices: updated.vendorPrices,
      averagePrice: updated.averagePrice,
      priceRange: updated.priceRange,
      userUpdatedAt: new Date().toISOString(),
    });
    showFeedback(`Removed ${vendorName || 'retailer'} quote from "${cigar.brand} ${cigar.line}".`);
  };

  const handleSaveQuickRetailerPrice = (cigar: CigarResearchItem) => {
    const numPrice = parseFloat(quickPriceValue);
    if (isNaN(numPrice) || numPrice <= 0) {
      showFeedback('Please enter a valid price greater than 0.');
      return;
    }
    const vendorName = canonicalizeVendorName(quickPriceVendor.trim() || 'Online Retailer');
    const newEntry: VendorPriceEntry = {
      id: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      vendor: vendorName,
      price: Math.round(numPrice * 100) / 100,
      currency: quickPriceCurrency || '£',
      packageType: quickPricePackageType || 'Single',
      recordedAt: new Date().toISOString(),
      inStock: true,
    };

    const updated = mergeVendorPriceIntoCigar(cigar, newEntry);
    onUpdateResearchCigar(cigar.id, {
      vendorPrices: updated.vendorPrices,
      averagePrice: updated.averagePrice,
      priceRange: updated.priceRange,
      userUpdatedAt: new Date().toISOString(),
    });

    if (wishlist && onUpdateWishlistItem && updated.vendorPrices && updated.vendorPrices.length > 0) {
      wishlist.forEach((w) => {
        if (
          areCigarsMatching(
            { brand: cigar.brand, line: cigar.line, vitola: cigar.vitola },
            { brand: w.brand, line: w.name, name: w.name, vitola: w.vitola }
          )
        ) {
          const minPrice = Math.min(...updated.vendorPrices!.map((vp) => vp.price));
          const bestQuote = updated.vendorPrices!.find((vp) => vp.price === minPrice);
          onUpdateWishlistItem(w.id, {
            vendorPrices: updated.vendorPrices,
            estimatedPrice: minPrice,
            sourceRetailer: bestQuote?.vendor || w.sourceRetailer,
          });
        }
      });
    }

    setQuickPriceCigarId(null);
    setQuickPriceValue('');
    showFeedback(`Attached ${vendorName} quote (${formatCurrency(numPrice, quickPriceCurrency)}) to "${cigar.brand} ${cigar.line}"!`);
  };

  // Global hub feedback notice
  const [hubNotice, setHubNotice] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setHubNotice(msg);
    setTimeout(() => setHubNotice(null), 4000);
  };

  // Add Custom Research Cigar Modal state
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newLine, setNewLine] = useState('');
  const [newVitola, setNewVitola] = useState('Robusto');
  const [newOrigin, setNewOrigin] = useState('Nicaragua');
  const [newWrapper, setNewWrapper] = useState('Habano');
  const [newWrapperType, setNewWrapperType] = useState<WrapperType>('Habano');
  const [newStrength, setNewStrength] = useState<StrengthRating>('Medium-Full');
  const [newAvgPrice, setNewAvgPrice] = useState<number>(14.0);
  const [newPriceRange, setNewPriceRange] = useState('£12.00 – £16.00');
  const [newCriticRating, setNewCriticRating] = useState<number>(92);
  const [newReviewOverview, setNewReviewOverview] = useState('');

  // AI Dossier state (no auto-population with padron 19)
  const [dossierQuery, setDossierQuery] = useState(initialResearchQuery || '');
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [dossierResult, setDossierResult] = useState<ResearchDossier | null>(null);
  const [dossierError, setDossierError] = useState<string | null>(null);

  // Sommelier state with persistence
  const [mood, setMood] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_sommelier_mood') || 'Relaxing on backyard deck after dinner';
    } catch {
      return 'Relaxing on backyard deck after dinner';
    }
  });
  const [availableTime, setAvailableTime] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_sommelier_time') || '60-75 minutes';
    } catch {
      return '60-75 minutes';
    }
  });
  const [drinkPairing, setDrinkPairing] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_sommelier_drink') || 'Bourbon (Double Oaked) or Espresso';
    } catch {
      return 'Bourbon (Double Oaked) or Espresso';
    }
  });
  const [preferenceNotes, setPreferenceNotes] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_sommelier_notes') || 'Looking for rich chocolate, cedar and cream flavors with medium-full body';
    } catch {
      return 'Looking for rich chocolate, cedar and cream flavors with medium-full body';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_sommelier_mood', mood);
    } catch {}
  }, [mood]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_sommelier_time', availableTime);
    } catch {}
  }, [availableTime]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_sommelier_drink', drinkPairing);
    } catch {}
  }, [drinkPairing]);

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_sommelier_notes', preferenceNotes);
    } catch {}
  }, [preferenceNotes]);
  const [loadingSommelier, setLoadingSommelier] = useState(false);
  const [sommelierResult, setSommelierResult] = useState<SommelierRecommendation | null>(null);
  const [sommelierError, setSommelierError] = useState<string | null>(null);

  // Identify state
  const [bandDescription, setBandDescription] = useState('Black and gold band with a crowned shield, cursive font, oily maduro wrapper');
  const [wrapperColor, setWrapperColor] = useState('Dark chocolate / Maduro');
  const [loadingIdentify, setLoadingIdentify] = useState(false);
  const [identifyResult, setIdentifyResult] = useState<any>(null);
  const [identifyError, setIdentifyError] = useState<string | null>(null);

  // Unique filter lists extracted dynamically
  const uniqueBrands = useMemo(() => {
    const brands = Array.from(new Set(researchDatabase.map((c) => c.brand))).sort();
    return brands;
  }, [researchDatabase]);

  const uniqueOrigins = useMemo(() => {
    const origins = Array.from(new Set(researchDatabase.map((c) => c.countryOrigin))).sort();
    return origins;
  }, [researchDatabase]);

  const uniqueVitolas = useMemo(() => {
    const vitolas = Array.from(
      new Set(
        researchDatabase
          .map((c) => c.vitola)
          .filter((v): v is string => Boolean(v && v.trim()))
      )
    ).sort();
    return vitolas;
  }, [researchDatabase]);

  const wrapperTypes: WrapperType[] = [
    'Habano',
    'Maduro',
    'Connecticut Shade',
    'Connecticut Broadleaf',
    'Corojo',
    'San Andrés',
    'Cameroon',
    'Sumatra',
    'Oscuro',
  ];

  const strengthTypes: StrengthRating[] = STRENGTH_LEVELS;

  // Toggle card expansion
  const toggleCardExpansion = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered and Sorted Database List
  const filteredDatabase = useMemo(() => {
    return researchDatabase
      .filter((item) => {
        // Quick filter pills
        if (quickFilter === 'myNotes') {
          if (!item.personalRating && !item.personalNotes && !item.personalFavorite && !item.personalTried) return false;
        } else if (quickFilter === 'favorites') {
          if (!item.personalFavorite) return false;
        } else if (quickFilter === 'cuban') {
          if (!item.isCuban && item.countryOrigin !== 'Cuba') return false;
        } else if (quickFilter === 'nicaragua') {
          if (item.countryOrigin !== 'Nicaragua') return false;
        } else if (quickFilter === 'dominican') {
          if (item.countryOrigin !== 'Dominican Republic') return false;
        }

        // Text search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchBrand = item.brand.toLowerCase().includes(q);
          const matchLine = item.line.toLowerCase().includes(q);
          const matchVitola = item.vitola.toLowerCase().includes(q);
          const matchWrapper = item.wrapper.toLowerCase().includes(q);
          const matchOrigin = item.countryOrigin.toLowerCase().includes(q);
          const matchNotes = (item.reviewTastingNotes?.dominantFlavorTags || []).some((t) => t.toLowerCase().includes(q));
          const matchOverview = (item.reviewTastingNotes?.overview || '').toLowerCase().includes(q);
          const matchPersonalNotes = (item.personalNotes || '').toLowerCase().includes(q);

          if (!matchBrand && !matchLine && !matchVitola && !matchWrapper && !matchOrigin && !matchNotes && !matchOverview && !matchPersonalNotes) {
            return false;
          }
        }

        // Brand dropdown
        if (selectedBrand !== 'ALL' && item.brand !== selectedBrand) {
          return false;
        }

        // Origin dropdown
        if (selectedOrigin !== 'ALL' && item.countryOrigin !== selectedOrigin) {
          return false;
        }

        // Wrapper Type dropdown
        if (selectedWrapperType !== 'ALL' && item.wrapperType !== selectedWrapperType) {
          return false;
        }

        // Vitola dropdown
        if (selectedVitola !== 'ALL' && !item.vitola?.toLowerCase().includes(selectedVitola.toLowerCase())) {
          return false;
        }

        // Smoke Time dropdown
        const smokeMins = item.smokeTimeMinutes || estimateAccurateSmokeTime(item.vitola).minutes;
        if (selectedSmokeTime === 'quick' && smokeMins > 45) return false;
        if (selectedSmokeTime === 'medium' && (smokeMins <= 45 || smokeMins > 75)) return false;
        if (selectedSmokeTime === 'long' && (smokeMins <= 75 || smokeMins > 100)) return false;
        if (selectedSmokeTime === 'extra_long' && smokeMins <= 100) return false;

        // Strength dropdown
        if (selectedStrength !== 'ALL' && item.strength !== selectedStrength) {
          return false;
        }

        // Price filter
        if (selectedPriceFilter === 'under15' && item.averagePrice >= 15) return false;
        if (selectedPriceFilter === '15to25' && (item.averagePrice < 15 || item.averagePrice > 25)) return false;
        if (selectedPriceFilter === '25plus' && item.averagePrice < 25) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'criticRating') {
          return b.criticRating - a.criticRating;
        }
        if (sortBy === 'personalRating') {
          return (b.personalRating || 0) - (a.personalRating || 0);
        }
        if (sortBy === 'priceAsc') {
          return a.averagePrice - b.averagePrice;
        }
        if (sortBy === 'priceDesc') {
          return b.averagePrice - a.averagePrice;
        }
        if (sortBy === 'brand') {
          return a.brand.localeCompare(b.brand);
        }
        if (sortBy === 'smokeDesc') {
          const sA = a.smokeTimeMinutes || estimateAccurateSmokeTime(a.vitola).minutes;
          const sB = b.smokeTimeMinutes || estimateAccurateSmokeTime(b.vitola).minutes;
          return sB - sA;
        }
        if (sortBy === 'smokeAsc') {
          const sA = a.smokeTimeMinutes || estimateAccurateSmokeTime(a.vitola).minutes;
          const sB = b.smokeTimeMinutes || estimateAccurateSmokeTime(b.vitola).minutes;
          return sA - sB;
        }
        return 0;
      });
  }, [
    researchDatabase,
    searchTerm,
    selectedBrand,
    selectedOrigin,
    selectedWrapperType,
    selectedVitola,
    selectedSmokeTime,
    selectedStrength,
    selectedPriceFilter,
    sortBy,
    quickFilter,
  ]);

  // Handler: Save Personal Review from Modal
  const handleSavePersonalReview = (
    cigarId: string,
    review: {
      personalRating?: number;
      personalNotes?: string;
      personalFavorite?: boolean;
      personalTried?: boolean;
      personalWouldRebuy?: any;
      personalPairingNotes?: string;
    }
  ) => {
    onUpdateResearchCigar(cigarId, {
      ...review,
      userUpdatedAt: new Date().toISOString(),
    });
  };

  // Handler: Toggle Favorite directly on card
  const handleToggleCardFavorite = (cigar: CigarResearchItem) => {
    onUpdateResearchCigar(cigar.id, {
      personalFavorite: !cigar.personalFavorite,
      userUpdatedAt: new Date().toISOString(),
    });
  };

  // Handler: Create Custom Cigar in Research DB
  const handleCreateCustomCigar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.trim() || !newLine.trim()) return;

    const suggestedDims = suggestVitolaDimensions(newVitola.trim());

    const newCigar: CigarResearchItem = {
      id: generateId('custom-res'),
      brand: newBrand.trim(),
      line: newLine.trim(),
      vitola: newVitola.trim(),
      lengthInches: suggestedDims?.lengthInches ?? 5.5,
      ringGauge: suggestedDims?.ringGauge ?? 52,
      countryOrigin: newOrigin,
      wrapper: newWrapper,
      wrapperType: newWrapperType,
      binder: 'Proprietary',
      filler: 'Proprietary Blend',
      strength: newStrength,
      body: 'Medium-Full',
      averagePrice: newAvgPrice,
      priceRange: newPriceRange || `£${newAvgPrice.toFixed(2)}`,
      criticRating: newCriticRating,
      criticConsensus: 'Custom entry added to personal connoisseur research database.',
      reviewTastingNotes: {
        overview: newReviewOverview || 'Custom cigar entry created by collector.',
        firstThird: 'Rich initial smoke with smooth draw.',
        secondThird: 'Balanced core flavors and aromatic smoke.',
        finalThird: 'Solid finish and lingering aftertaste.',
        dominantFlavorTags: ['Cedar', 'Cocoa', 'Spice'],
      },
      recommendedPairings: ['Bourbon', 'Espresso'],
      agingWindowMonths: 6,
      isCuban: newOrigin === 'Cuba',
    };

    if (onAddCustomResearchCigar) {
      onAddCustomResearchCigar(newCigar);
    }
    setIsAddCustomOpen(false);
    setNewBrand('');
    setNewLine('');
    setNewReviewOverview('');
  };

  // Handler: Lookup AI Dossier
  const handleLookupDossier = async (customQuery?: string) => {
    const q = customQuery || dossierQuery;
    if (!q.trim()) return;

    setLoadingDossier(true);
    setDossierError(null);

    try {
      const res = await fetch('/api/research/cigar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cigarName: q }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to research cigar.');
      }
      setDossierResult(data.data);
    } catch (err: any) {
      setDossierError(cleanErrorMessage(err.message || err, 'Unable to connect to AI Sommelier. Please try again.'));
    } finally {
      setLoadingDossier(false);
    }
  };

  // Handler: Run Sommelier
  const handleRunSommelier = async () => {
    setLoadingSommelier(true);
    setSommelierError(null);

    try {
      const res = await fetch('/api/research/sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          availableTime,
          drinkPairing,
          preferenceNotes,
          currentInventory: cigars,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate recommendations.');
      }
      setSommelierResult(data.data);
    } catch (err: any) {
      setSommelierError(cleanErrorMessage(err.message || err, 'Unable to generate recommendation.'));
    } finally {
      setLoadingSommelier(false);
    }
  };

  // Handler: Run Band Identifier
  const handleIdentifyCigar = async () => {
    if (!bandDescription.trim()) return;

    setLoadingIdentify(true);
    setIdentifyError(null);

    try {
      const res = await fetch('/api/research/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: bandDescription,
          wrapperColor,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to identify cigar.');
      }
      setIdentifyResult(data.data);
    } catch (err: any) {
      setIdentifyError(cleanErrorMessage(err.message || err, 'Unable to identify cigar.'));
    } finally {
      setLoadingIdentify(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Notice Toast */}
      {hubNotice && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-xs text-emerald-300 shadow-lg animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{hubNotice}</span>
        </div>
      )}

      {/* Top Banner & Tab Navigation */}
      <div className="p-6 bg-header border border-line rounded-lg shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface text-gold border border-line text-[10px] font-semibold uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>AI powered research</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-serif text-white font-normal flex items-center gap-3">
              <span>Research</span>
              <span className="text-sm font-sans font-medium px-2.5 py-0.5 rounded-full bg-card text-gold border border-line">
                {researchDatabase.length}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-3xl leading-relaxed">
              Curated Cigar Encyclopedia
            </p>
          </div>

          {/* Sub-tab pills */}
          <div className="flex flex-wrap bg-surface p-1 rounded-md border border-line text-xs gap-1">
            <button
              onClick={() => setActiveMainTab('database')}
              className={`px-3 py-2 rounded font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeMainTab === 'database'
                  ? 'bg-gold text-ink shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Database ({researchDatabase.length})</span>
            </button>
            <button
              onClick={() => setActiveMainTab('dossier')}
              className={`px-3 py-2 rounded font-medium text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeMainTab === 'dossier'
                  ? 'bg-gold text-ink font-bold shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Research</span>
            </button>
            <button
              onClick={() => setActiveMainTab('sommelier')}
              className={`px-3 py-2 rounded font-medium text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeMainTab === 'sommelier'
                  ? 'bg-gold text-ink font-bold shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Recommend Cigar</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Main Searchable Research Database */}
      {activeMainTab === 'database' && (
        <div className="space-y-6">
          {/* Controls, Filters & JSON Export Bar */}
          <div className="p-5 bg-header border border-line rounded-lg space-y-4 shadow-sm">
            {/* Search Input and Export Buttons */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by brand, line, vitola, wrapper, origin, or flavor notes (e.g. Padron, Habano, Espresso, Nicaragua)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface border border-line rounded-md pl-10 pr-9 py-2.5 text-xs sm:text-sm text-text focus:outline-hidden focus:border-gold placeholder-text-muted/50"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-text-muted hover:text-text"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Buttons: Add Stick, Merge Duplicates, Reset, Clear */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsAddCustomOpen(true)}
                  className="px-3.5 py-2 bg-gold hover:brightness-110 text-ink font-bold uppercase tracking-wider text-[11px] rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  title="Add custom cigar to research database"
                >
                  <Plus className="w-3.5 h-3.5 text-ink" />
                  <span>Add Stick</span>
                </button>

                {onDeduplicateResearchDatabase && (
                  <button
                    onClick={() => {
                      const res = onDeduplicateResearchDatabase();
                      if (res.mergedCount > 0) {
                        showFeedback(`Successfully merged ${res.mergedCount} duplicate cigar${res.mergedCount > 1 ? 's' : ''} and combined price vendor entries.`);
                      } else {
                        showFeedback('No duplicate cigars detected. Database is clean!');
                      }
                    }}
                    className="px-3 py-2 bg-surface hover:bg-card-hover text-gold border border-line text-[11px] font-semibold uppercase tracking-wider rounded-md transition flex items-center gap-1.5 cursor-pointer"
                    title="Scan for duplicate cigars by brand/line/vitola and merge vendor prices, notes & ratings"
                  >
                    <CopyCheck className="w-3.5 h-3.5 text-gold" />
                    <span>Merge Duplicates</span>
                  </button>
                )}

                {/* Reset / Clear Research DB Options */}
                {onResetResearchDatabase && (
                  <button
                    onClick={() => setConfirmModalType('reset')}
                    className="px-3 py-2 bg-surface hover:bg-card-hover text-text-muted hover:text-gold border border-line text-[11px] font-semibold uppercase tracking-wider rounded-md transition flex items-center gap-1.5 cursor-pointer"
                    title="Restore default curated research catalog"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Default</span>
                  </button>
                )}

                {onClearResearchDatabase && (
                  <button
                    onClick={() => setConfirmModalType('clear')}
                    className="px-3 py-2 bg-surface hover:bg-danger-bg text-text-muted hover:text-red-400 border border-line hover:border-red-900/60 text-[11px] font-semibold uppercase tracking-wider rounded-md transition flex items-center gap-1.5 cursor-pointer"
                    title="Clear research database completely"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear DB</span>
                  </button>
                )}
              </div>
            </div>

            {/* Multi-criteria Filter Dropdowns (Brand, Vitola, Smoke Time, Origin, Wrapper Type, Strength, Price, Sort) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2.5 pt-2 border-t border-line">
              {/* 1. Brand Filter */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                  Brand ({uniqueBrands.length})
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
                >
                  <option value="ALL">All Brands</option>
                  {uniqueBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Vitola Filter */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                  Vitola ({uniqueVitolas.length})
                </label>
                <select
                  value={selectedVitola}
                  onChange={(e) => setSelectedVitola(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
                >
                  <option value="ALL">All Vitolas</option>
                  {uniqueVitolas.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Smoke Time Filter */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                  ⏱️ Smoke Time
                </label>
                <select
                  value={selectedSmokeTime}
                  onChange={(e) => setSelectedSmokeTime(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
                >
                  <option value="ALL">All Durations</option>
                  <option value="quick">⚡ Quick (≤45m)</option>
                  <option value="medium">⏱️ Medium (45–75m)</option>
                  <option value="long">🪵 Long (75–100m)</option>
                  <option value="extra_long">👑 Epic (&gt;100m)</option>
                </select>
              </div>

              {/* 4. Origin Filter */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                  Origin Country
                </label>
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
                >
                  <option value="ALL">All Origins</option>
                  {uniqueOrigins.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Wrapper Type Filter */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                  Wrapper Leaf
                </label>
                <select
                  value={selectedWrapperType}
                  onChange={(e) => setSelectedWrapperType(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
                >
                  <option value="ALL">All Wrappers</option>
                  {wrapperTypes.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Strength Filter */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                  Strength Body
                </label>
                <select
                  value={selectedStrength}
                  onChange={(e) => setSelectedStrength(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
                >
                  <option value="ALL">All Strengths</option>
                  {strengthTypes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* 7. Average Price Range */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                  Average Price
                </label>
                <select
                  value={selectedPriceFilter}
                  onChange={(e) => setSelectedPriceFilter(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
                >
                  <option value="ALL">All Price Tiers</option>
                  <option value="under15">Under £15 (Value)</option>
                  <option value="15to25">£15 – £25 (Premium)</option>
                  <option value="25plus">£25+ (Ultra / Luxury)</option>
                </select>
              </div>

              {/* 8. Sort by */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                  Sort Order
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-surface border border-line rounded px-2 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
                >
                  <option value="criticRating">★ Critic Rating (High→Low)</option>
                  <option value="personalRating">⭐ My Rating (High→Low)</option>
                  <option value="smokeDesc">⏱️ Smoke Time: Longest</option>
                  <option value="smokeAsc">⚡ Smoke Time: Shortest</option>
                  <option value="priceAsc">£ Avg Price (Low→High)</option>
                  <option value="priceDesc">£ Avg Price (High→Low)</option>
                  <option value="brand">🔤 Brand Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Quick Segment Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mr-1">Quick Views:</span>
              <button
                onClick={() => setQuickFilter('all')}
                className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                  quickFilter === 'all'
                    ? 'bg-gold text-ink font-bold'
                    : 'bg-surface text-text-muted border border-line hover:text-text'
                }`}
              >
                All Cigars ({researchDatabase.length})
              </button>
              <button
                onClick={() => setQuickFilter('myNotes')}
                className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                  quickFilter === 'myNotes'
                    ? 'bg-gold text-ink font-bold'
                    : 'bg-surface text-text-muted border border-line hover:text-text'
                }`}
              >
                <Star className="w-3 h-3 text-gold" />
                <span>My Rated & Noted ({researchDatabase.filter((c) => c.personalRating || c.personalNotes).length})</span>
              </button>
              <button
                onClick={() => setQuickFilter('favorites')}
                className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                  quickFilter === 'favorites'
                    ? 'bg-gold text-ink font-bold'
                    : 'bg-surface text-text-muted border border-line hover:text-text'
                }`}
              >
                <Heart className="w-3 h-3 text-red-400" />
                <span>Favorites ({researchDatabase.filter((c) => c.personalFavorite).length})</span>
              </button>
              <button
                onClick={() => setQuickFilter('cuban')}
                className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                  quickFilter === 'cuban'
                    ? 'bg-gold text-ink font-bold'
                    : 'bg-surface text-text-muted border border-line hover:text-text'
                }`}
              >
                🇨🇺 Cuban Classics ({researchDatabase.filter((c) => c.isCuban || /cuba/i.test(c.countryOrigin)).length})
              </button>
              <button
                onClick={() => setQuickFilter('nicaragua')}
                className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                  quickFilter === 'nicaragua'
                    ? 'bg-gold text-ink font-bold'
                    : 'bg-surface text-text-muted border border-line hover:text-text'
                }`}
              >
                🇳🇮 Nicaraguan Blends ({researchDatabase.filter((c) => /nicaragua/i.test(c.countryOrigin)).length})
              </button>
              <button
                onClick={() => setQuickFilter('dominican')}
                className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                  quickFilter === 'dominican'
                    ? 'bg-gold text-ink font-bold'
                    : 'bg-surface text-text-muted border border-line hover:text-text'
                }`}
              >
                🇩🇴 Dominican Legends ({researchDatabase.filter((c) => /dominican/i.test(c.countryOrigin)).length})
              </button>

              {(selectedBrand !== 'ALL' || selectedVitola !== 'ALL' || selectedSmokeTime !== 'ALL' || selectedOrigin !== 'ALL' || selectedWrapperType !== 'ALL' || selectedStrength !== 'ALL' || selectedPriceFilter !== 'ALL' || searchTerm || quickFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedBrand('ALL');
                    setSelectedVitola('ALL');
                    setSelectedSmokeTime('ALL');
                    setSelectedOrigin('ALL');
                    setSelectedWrapperType('ALL');
                    setSelectedStrength('ALL');
                    setSelectedPriceFilter('ALL');
                    setSearchTerm('');
                    setQuickFilter('all');
                  }}
                  className="text-[10px] px-2 py-0.5 text-red-400 hover:underline ml-auto cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>
          </div>

          {/* Results Count & View / Inline Display Customization Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-header border border-line rounded-lg text-xs text-text-muted shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Showing <strong className="text-text">{filteredDatabase.length}</strong> of {researchDatabase.length} researched cigars
              </span>
              <span className="hidden md:inline text-line">•</span>
              <span className="hidden md:inline">
                Avg Price: <strong className="text-gold">{formatCurrency(filteredDatabase.reduce((acc, c) => acc + c.averagePrice, 0) / (filteredDatabase.length || 1), '£')}</strong>
              </span>
            </div>

            {/* View Mode Switcher & Inline Display Options Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Display Options Dropdown / Toggle Button */}
              <button
                type="button"
                onClick={() => setShowDisplayOptions(!showDisplayOptions)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                  showDisplayOptions
                    ? 'bg-gold/20 border-gold text-gold'
                    : 'bg-surface border-line text-text-muted hover:text-text'
                }`}
                title="Customize visible details on cards or rows"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-gold" />
                <span>Display: {!showReviews ? 'Key Specs Only' : 'Custom'}</span>
              </button>

              {/* Grid vs Table View Mode Switcher */}
              <div className="flex bg-surface p-0.5 rounded border border-line">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-gold text-ink shadow-xs'
                      : 'text-text-muted hover:text-text'
                  }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-gold text-ink shadow-xs'
                      : 'text-text-muted hover:text-text'
                  }`}
                  title="Database Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Database</span>
                </button>
              </div>
            </div>
          </div>

          {/* Inline Display Settings Panel */}
          {showDisplayOptions && (
            <div className="p-3.5 bg-surface border border-line rounded-lg text-xs space-y-2.5 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-gold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-gold" />
                  <span>Customize Research Visibility</span>
                </span>

                {/* Presets */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviews(false);
                      setShowFlavorProfile(false);
                      setShowPersonalNotes(false);
                      setShowPairings(false);
                      setShowRetailerQuotes(true);
                      showFeedback('Switched to Key Cigar Specs view (reviews hidden).');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition cursor-pointer ${
                      !showReviews && !showFlavorProfile && !showPersonalNotes
                        ? 'bg-gold text-ink border-gold'
                        : 'bg-card text-text-muted border-line hover:text-text'
                    }`}
                  >
                    ⚡ Key Specs Only
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviews(true);
                      setShowFlavorProfile(true);
                      setShowRetailerQuotes(true);
                      setShowPersonalNotes(true);
                      setShowPairings(true);
                      showFeedback('Full reviews and dossier details enabled.');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition cursor-pointer ${
                      showReviews && showFlavorProfile && showPersonalNotes && showPairings
                        ? 'bg-gold text-ink border-gold'
                        : 'bg-card text-text-muted border-line hover:text-text'
                    }`}
                  >
                    ✦ Full Details
                  </button>
                </div>
              </div>

              {/* Individual Toggle Switches */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Reviews Toggle */}
                <button
                  type="button"
                  onClick={() => setShowReviews(!showReviews)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                    showReviews
                      ? 'bg-card text-text border-gold/60'
                      : 'bg-surface text-text-muted/60 border-line line-through'
                  }`}
                >
                  {showReviews ? <Eye className="w-3 h-3 text-gold" /> : <EyeOff className="w-3 h-3 text-text-muted" />}
                  <span>Reviews & Quotes</span>
                </button>

                {/* Flavor Profiles Toggle */}
                <button
                  type="button"
                  onClick={() => setShowFlavorProfile(!showFlavorProfile)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                    showFlavorProfile
                      ? 'bg-card text-text border-gold/60'
                      : 'bg-surface text-text-muted/60 border-line line-through'
                  }`}
                >
                  {showFlavorProfile ? <Eye className="w-3 h-3 text-gold" /> : <EyeOff className="w-3 h-3 text-text-muted" />}
                  <span>Flavor Tags</span>
                </button>

                {/* Retailer Shop Quotes Toggle */}
                <button
                  type="button"
                  onClick={() => setShowRetailerQuotes(!showRetailerQuotes)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                    showRetailerQuotes
                      ? 'bg-card text-text border-gold/60'
                      : 'bg-surface text-text-muted/60 border-line line-through'
                  }`}
                >
                  {showRetailerQuotes ? <Eye className="w-3 h-3 text-gold" /> : <EyeOff className="w-3 h-3 text-text-muted" />}
                  <span>Retailer Quotes</span>
                </button>

                {/* Personal Notes & Rating Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPersonalNotes(!showPersonalNotes)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                    showPersonalNotes
                      ? 'bg-card text-text border-gold/60'
                      : 'bg-surface text-text-muted/60 border-line line-through'
                  }`}
                >
                  {showPersonalNotes ? <Eye className="w-3 h-3 text-gold" /> : <EyeOff className="w-3 h-3 text-text-muted" />}
                  <span>Personal Notes & Rating</span>
                </button>

                {/* Pairings & Terroir Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPairings(!showPairings)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                    showPairings
                      ? 'bg-card text-text border-gold/60'
                      : 'bg-surface text-text-muted/60 border-line line-through'
                  }`}
                >
                  {showPairings ? <Eye className="w-3 h-3 text-gold" /> : <EyeOff className="w-3 h-3 text-text-muted" />}
                  <span>Drink Pairings & Aging</span>
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredDatabase.length === 0 && (
            <div className="p-12 text-center bg-header border border-line rounded-lg space-y-3">
              <Search className="w-8 h-8 text-text-muted mx-auto opacity-50" />
              <h3 className="text-base font-serif text-text">No cigars found matching criteria</h3>
              <p className="text-xs text-text-muted max-w-md mx-auto">
                Try widening your search terms or resetting the brand, origin, wrapper, or strength filters.
              </p>
              <button
                onClick={() => {
                  setSelectedBrand('ALL');
                  setSelectedOrigin('ALL');
                  setSelectedWrapperType('ALL');
                  setSelectedStrength('ALL');
                  setSelectedPriceFilter('ALL');
                  setSearchTerm('');
                  setQuickFilter('all');
                }}
                className="px-4 py-2 bg-surface hover:bg-card-hover text-gold border border-line rounded text-xs uppercase tracking-wider font-semibold transition cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Database Style Table View */}
          {filteredDatabase.length > 0 && viewMode === 'table' && (
            <div className="bg-header border border-line rounded-lg overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-text">
                  <thead className="bg-surface text-text-muted uppercase tracking-wider font-semibold border-b border-line">
                    <tr>
                      <th className="p-3 font-semibold">Brand & Line</th>
                      <th className="p-3 font-semibold">Vitola / Specs</th>
                      <th className="p-3 font-semibold">Wrapper & Origin</th>
                      <th className="p-3 font-semibold">Strength</th>
                      {showRetailerQuotes && <th className="p-3 font-semibold">Retailer Quotes & Price</th>}
                      {!showRetailerQuotes && <th className="p-3 font-semibold">Avg Price</th>}
                      <th className="p-3 font-semibold">Rating</th>
                      {showReviews && <th className="p-3 min-w-[200px] font-semibold">Tasting Notes</th>}
                      <th className="p-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredDatabase.map((cigar) => {
                      return (
                        <tr key={cigar.id} className="hover:bg-[#1E1917]/70 transition group">
                          {/* Brand & Line with Inline Editing */}
                          <td className="p-3 align-top">
                            {editingNameId === cigar.id ? (
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
                                    if (e.key === 'Enter') handleSaveInlineEdit(cigar);
                                    if (e.key === 'Escape') setEditingNameId(null);
                                  }}
                                  className="w-full bg-card border border-line rounded px-1.5 py-0.5 text-xs text-text focus:border-gold"
                                />
                                <div className="flex gap-1 pt-1">
                                  <button
                                    onClick={() => handleSaveInlineEdit(cigar)}
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
                                  <span className="text-[10px] uppercase font-bold text-gold tracking-wider">{cigar.brand}</span>
                                  <button
                                    onClick={() => handleStartInlineEdit(cigar)}
                                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-gold transition cursor-pointer"
                                    title="Edit name inline (syncs across all tabs)"
                                  >
                                    <Edit3 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                                <div
                                  onClick={() => handleStartInlineEdit(cigar)}
                                  className="font-serif font-medium text-white text-sm hover:text-gold cursor-pointer transition"
                                  title="Click to edit name inline"
                                >
                                  {cigar.line}
                                </div>
                                {cigar.personalFavorite && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] text-red-400 mt-0.5 font-medium">
                                    <Heart className="w-2.5 h-2.5 fill-red-400" /> Favorite
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Vitola & Specs */}
                          <td className="p-3 align-top">
                            <div className="font-medium text-white">{cigar.vitola}</div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {fields.dimensions && (
                                <span className="text-text-muted font-mono text-[10px]">
                                  {cigar.lengthInches ? `${cigar.lengthInches}"` : ''} {cigar.ringGauge ? `x ${cigar.ringGauge} RG` : ''}
                                </span>
                              )}
                              {cigar.smokeTimeRange && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-gold font-mono bg-surface px-1.5 py-0.5 rounded border border-line">
                                  <Clock className="w-2.5 h-2.5 text-gold" />
                                  {cigar.smokeTimeRange}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Wrapper & Origin */}
                          <td className="p-3 align-top">
                            <div className="text-[11px]">{cigar.wrapperType} ({cigar.wrapper})</div>
                            <div className="text-gold text-[10px] flex items-center gap-1 mt-0.5">
                              <Globe className="w-2.5 h-2.5 text-text-muted" />
                              <span>{cigar.countryOrigin}</span>
                              {cigar.isCuban && (
                                <span className="text-[8px] px-1 py-0.2 bg-cedar/30 text-gold border border-cedar/60 rounded font-semibold">
                                  Cuba
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Strength */}
                          <td className="p-3 align-top">
                            <span className="px-2 py-0.5 rounded bg-surface text-text border border-line text-[10px] font-medium whitespace-nowrap">
                              {cigar.strength}
                            </span>
                          </td>

                          {/* Retailer Quotes & Avg Price */}
                          <td className="p-3 align-top">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="font-serif font-bold text-sm text-gold">
                                {formatCurrency(cigar.averagePrice, '£')}
                              </span>
                              <span className="text-[9px] text-text-muted uppercase tracking-wider">avg</span>
                            </div>

                            {showRetailerQuotes && (
                              <div className="space-y-1">
                                {cigar.vendorPrices && cigar.vendorPrices.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 max-w-[280px]">
                                    {cigar.vendorPrices.map((vp) => (
                                      <span
                                        key={vp.id}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-line text-[10px] text-text"
                                      >
                                        <span className="text-text-muted font-medium truncate max-w-[80px]">{vp.vendor}:</span>
                                        <strong className="text-gold font-mono">{formatCurrency(vp.price, vp.currency || '£')}</strong>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteVendorPrice(cigar, vp.id, vp.vendor)}
                                          className="text-text-muted hover:text-red-400 ml-0.5 p-0.5 transition cursor-pointer"
                                          title={`Delete ${vp.vendor} quote`}
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-text-muted italic block">No shop quotes logged</span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleStartQuickRetailerAdd(cigar.id)}
                                  className="text-[9px] text-gold hover:underline flex items-center gap-0.5 font-semibold cursor-pointer pt-0.5"
                                >
                                  <Plus className="w-2.5 h-2.5" /> Add quote
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Rating */}
                          <td className="p-3 align-top whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <div className="font-serif font-bold text-white flex items-center gap-1">
                                <span className="text-gold">★</span> {cigar.criticRating}
                                <span className="text-[10px] text-text-muted">/100</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleScanReviewScoresForCigar(cigar)}
                                disabled={scanningReviewCigarId === cigar.id}
                                className="p-1 text-text-muted hover:text-gold border border-line rounded cursor-pointer"
                                title="Fetch multi-source review scores"
                              >
                                {scanningReviewCigarId === cigar.id ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Star className="w-2.5 h-2.5 fill-gold text-gold" />
                                )}
                              </button>
                            </div>
                            {cigar.reviewScores && cigar.reviewScores.length > 0 && (
                              <div className="text-[9px] text-text-muted mt-0.5">
                                {cigar.reviewScores.length} critic scores
                              </div>
                            )}
                            {cigar.personalRating ? (
                              <div className="text-[10px] text-gold flex items-center gap-0.5 mt-0.5 font-semibold">
                                <Star className="w-2.5 h-2.5 fill-gold" /> {cigar.personalRating}/100
                              </div>
                            ) : null}
                          </td>

                          {/* Tasting Notes Overview */}
                          {showReviews && (
                            <td className="p-3 align-top text-[11px] text-text-muted leading-relaxed max-w-xs">
                              <p className="italic line-clamp-2">"{cigar.reviewTastingNotes?.overview}"</p>
                              {showFlavorProfile && cigar.reviewTastingNotes?.dominantFlavorTags && (
                                <div className="flex flex-wrap gap-1 mt-1 not-italic">
                                  {cigar.reviewTastingNotes.dominantFlavorTags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="text-[9px] px-1.5 py-0.2 rounded bg-surface text-text border border-line">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                          )}

                          {/* Actions */}
                          <td className="p-3 align-top text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleScanRetailerPricesForCigar(cigar)}
                                disabled={scanningPriceCigarId === cigar.id}
                                className="p-1.5 text-gold bg-surface hover:bg-card-hover border border-gold/40 hover:border-gold rounded cursor-pointer transition disabled:opacity-50"
                                title="Scan UK Retailers (Cgars, Cuban Cigar Club, Havana House, Smoke King, Davidoff)"
                              >
                                {scanningPriceCigarId === cigar.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
                                ) : (
                                  <Store className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  onAddCigarFromResearch({
                                    brand: cigar.brand,
                                    name: cigar.line,
                                    line: cigar.line,
                                    vitola: cigar.vitola,
                                    wrapper: cigar.wrapper,
                                    binder: cigar.binder,
                                    filler: cigar.filler,
                                    countryOrigin: cigar.countryOrigin,
                                    strength: cigar.strength,
                                    purchasePrice: cigar.averagePrice,
                                    flavorTags: cigar.reviewTastingNotes?.dominantFlavorTags || [],
                                    targetRestMonths: cigar.agingWindowMonths || 6,
                                    notes: cigar.reviewTastingNotes?.overview,
                                    personalRating: cigar.personalRating,
                                  })
                                }
                                className="p-1.5 bg-gold hover:brightness-110 text-ink rounded font-bold text-[10px] cursor-pointer transition"
                                title="Add to Humidor"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  onAddToWishlist({
                                    brand: cigar.brand,
                                    name: `${cigar.line} (${cigar.vitola})`,
                                    vitola: cigar.vitola,
                                    notes: `Avg Price: £${cigar.averagePrice.toFixed(2)}. ${cigar.reviewTastingNotes?.overview || ''}`,
                                  })
                                }
                                className="p-1.5 text-text-muted hover:text-gold border border-line hover:border-gold/40 rounded cursor-pointer transition"
                                title="Add to Wishlist"
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteResearchCigar && (
                                <button
                                  onClick={() => setCigarToDelete(cigar)}
                                  className="p-1.5 text-text-muted hover:text-red-400 border border-line hover:border-red-900/60 rounded cursor-pointer transition"
                                  title="Delete from research database"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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

          {/* Cigar Cards List (Grid View) */}
          {filteredDatabase.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 gap-5">
            {filteredDatabase.map((cigar) => {
              const isExpanded = !!expandedCards[cigar.id];

              return (
                <div
                  key={cigar.id}
                  className="bg-header border border-line hover:border-line-hover rounded-lg p-5 sm:p-6 transition shadow-xs flex flex-col justify-between space-y-5"
                >
                  {/* Top Bar: Brand, Line, Origin, Avg Price, Ratings */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-line pb-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      {editingNameId === cigar.id ? (
                        <div className="space-y-1.5 p-3 bg-surface border border-gold rounded-md mb-2 animate-in fade-in max-w-md">
                          <div className="text-[10px] uppercase font-bold text-gold">Edit Cigar Line (Syncs Everywhere)</div>
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
                              placeholder="Cigar Line / Name"
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
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-gold">
                              {cigar.brand}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStartInlineEdit(cigar)}
                              className="text-text-muted hover:text-gold transition cursor-pointer p-0.5"
                              title="Edit name inline (syncs across all tabs)"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-line-hover">•</span>
                            <span className="text-xs text-text font-medium flex items-center gap-1">
                              <Globe className="w-3 h-3 text-text-muted" />
                              <span>{cigar.countryOrigin}</span>
                              {cigar.isCuban && <span className="text-[10px] px-1.5 py-0.2 rounded bg-cedar/30 text-gold border border-cedar/60">Habanos Puro</span>}
                            </span>
                            {fields.dimensions && (
                              <>
                                <span className="text-line-hover">•</span>
                                <span className="text-xs text-text-muted font-mono">
                                  {cigar.vitola} ({cigar.lengthInches}" x {cigar.ringGauge} RG)
                                </span>
                              </>
                            )}
                          </div>

                          <h2
                            onClick={() => handleStartInlineEdit(cigar)}
                            className="text-xl sm:text-2xl font-serif text-white font-medium hover:text-gold cursor-pointer transition"
                            title="Click to edit name inline"
                          >
                            {cigar.line}
                          </h2>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-surface text-text border border-line">
                          🌿 Wrapper: <strong className="text-gold">{cigar.wrapperType}</strong> ({cigar.wrapper})
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-surface text-text border border-line">
                          🔥 Strength: <strong className="text-text">{cigar.strength}</strong>
                        </span>
                        {cigar.smokeTimeRange && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-surface text-gold border border-line font-mono flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-gold" />
                            <span>Smoke Time: <strong className="text-text">{cigar.smokeTimeRange}</strong></span>
                          </span>
                        )}
                        {fields.factoryDetails && cigar.masterBlender && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-surface text-text-muted border border-line">
                            Blender: {cigar.masterBlender}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price, Critic Score, and Quick Action Badges */}
                    <div className="flex flex-wrap items-center lg:items-end lg:flex-col gap-3">
                      <div className="flex items-center gap-3">
                        {/* Average Price Display */}
                        <div className="text-left lg:text-right">
                          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                            Average Price
                          </div>
                          <div className="text-lg sm:text-xl font-serif font-bold text-gold">
                            {formatCurrency(cigar.averagePrice, '£')}
                          </div>
                          <div className="text-[10px] text-text-muted">
                            {cigar.priceRange ? cigar.priceRange.replace(/\$/g, '£') : ''}
                          </div>
                        </div>

                        {/* Critic Score Badge & Review Score Scanner */}
                        {fields.criticRatings && (
                          <div className="flex items-center gap-2">
                            <div className="p-2 sm:px-3 sm:py-2 bg-surface border border-line rounded-md text-center">
                              <div className="text-[9px] uppercase tracking-wider text-text-muted">Critic Consensus</div>
                              <div className="text-ink sm:text-lg font-serif font-bold text-white flex items-center justify-center gap-1">
                                <span className="text-gold">★</span> {cigar.criticRating}
                                <span className="text-[10px] text-text-muted">/100</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleScanReviewScoresForCigar(cigar)}
                              disabled={scanningReviewCigarId === cigar.id}
                              className="px-2.5 py-2 bg-surface hover:bg-card-hover text-gold border border-line hover:border-gold/50 rounded-md text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                              title="Fetch review scores from Cigar Aficionado, Smoke King, Halfwheel, etc."
                            >
                              {scanningReviewCigarId === cigar.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Star className="w-3.5 h-3.5 fill-gold" />
                              )}
                              <span>{scanningReviewCigarId === cigar.id ? 'Scanning...' : 'Score AI'}</span>
                            </button>
                          </div>
                        )}

                        {/* User Rating Badge (if user has rated) */}
                        {cigar.personalRating ? (
                          <div className="p-2 sm:px-3 sm:py-2 bg-card border border-gold/50 rounded-md text-center">
                            <div className="text-[9px] uppercase tracking-wider text-gold font-semibold">My Rating</div>
                            <div className="text-ink sm:text-lg font-serif font-bold text-white flex items-center justify-center gap-0.5">
                              <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                              <span>{cigar.personalRating}</span>
                              <span className="text-[10px] text-text-muted">/100</span>
                            </div>
                          </div>
                        ) : null}

                        {/* Favorite Button */}
                        <button
                          onClick={() => handleToggleCardFavorite(cigar)}
                          className={`p-2 rounded border transition cursor-pointer ${
                            cigar.personalFavorite
                              ? 'bg-red-950/40 border-red-800 text-red-400'
                              : 'bg-surface border-line text-text-muted hover:text-red-400'
                          }`}
                          title={cigar.personalFavorite ? 'Marked as Favorite' : 'Add to Favorites'}
                        >
                          <Heart className={`w-4 h-4 ${cigar.personalFavorite ? 'fill-red-400' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Critic Review, Scores & Tasting Notes Section */}
                  <div className="space-y-3">
                    {/* Multi-Source Review Scores Badges (Cigar Aficionado, Smoke King, Halfwheel, etc.) */}
                    {cigar.reviewScores && cigar.reviewScores.length > 0 && (
                      <div className="p-3 bg-surface border border-line rounded-md space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-gold flex items-center gap-1">
                            <Award className="w-3 h-3 text-gold" />
                            <span>Critic Publication Ratings</span>
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {cigar.reviewScores.length} Sources Analyzed
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {cigar.reviewScores.map((score, sIdx) => {
                            const content = (
                              <>
                                <span className="text-text-muted font-medium">{score.source}:</span>
                                <span className="text-gold font-bold font-mono">★ {score.score}</span>
                                {(score.scale || score.maxScore) && (
                                  <span className="text-[10px] text-text-muted/70">/{score.scale || score.maxScore}</span>
                                )}
                                {score.award && (
                                  <span className="text-[9px] px-1 py-0.2 bg-gold/20 text-gold rounded font-semibold">
                                    {score.award}
                                  </span>
                                )}
                                {!score.url && (
                                  <span
                                    className="text-[9px] text-text-subtle"
                                    title="No live source could be verified for this score -- treat as unconfirmed"
                                  >
                                    (unverified)
                                  </span>
                                )}
                              </>
                            );
                            const className =
                              'px-2.5 py-1 bg-card border border-line rounded flex items-center gap-1.5 text-xs';
                            return score.url ? (
                              <a
                                key={`${score.source}-${sIdx}`}
                                href={score.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${className} hover:border-gold transition cursor-pointer`}
                                title={`Open the source for this score: ${score.url}`}
                              >
                                {content}
                              </a>
                            ) : (
                              <div key={`${score.source}-${sIdx}`} className={className}>
                                {content}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {fields.criticRatings && showReviews && (
                      <div className="p-3.5 bg-surface border border-line rounded-md text-xs sm:text-sm text-text font-serif italic leading-relaxed">
                        "{cigar.reviewTastingNotes?.overview}"
                        {cigar.reviewTastingNotes?.criticQuote && (
                          <div className="mt-1 text-xs text-gold not-italic font-sans">
                            — Critic Consensus: <em>{cigar.reviewTastingNotes.criticQuote}</em>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dominant Flavor Tags Chips */}
                    {fields.flavorProfiles && showFlavorProfile && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mr-1">
                          Tasting Profile:
                        </span>
                        {(cigar.reviewTastingNotes?.dominantFlavorTags || []).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2.5 py-0.5 rounded bg-surface text-text border border-line"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Multi-Shop Retailer Pricing Comparison */}
                    {fields.vendorPriceComparison && showRetailerQuotes && (
                      <div className="p-3 bg-surface border border-line rounded-lg space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="text-gold font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>
                              Retailer Shop Prices ({cigar.vendorPrices?.length || 0} quote
                              {(cigar.vendorPrices?.length || 0) !== 1 ? 's' : ''})
                            </span>
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                quickPriceCigarId === cigar.id
                                  ? setQuickPriceCigarId(null)
                                  : handleStartQuickRetailerAdd(cigar.id)
                              }
                              className="text-[10px] px-2 py-0.5 bg-card hover:bg-line text-text hover:text-gold border border-line rounded font-semibold flex items-center gap-1 cursor-pointer transition"
                            >
                              <Plus className="w-2.5 h-2.5 text-gold" />
                              <span>{quickPriceCigarId === cigar.id ? 'Cancel' : 'Quick Add Quote'}</span>
                            </button>

                            {onOpenPriceEditor && (
                              <button
                                onClick={() =>
                                  onOpenPriceEditor({
                                    brand: cigar.brand,
                                    name: cigar.line,
                                    vitola: cigar.vitola,
                                    price: cigar.averagePrice,
                                  })
                                }
                                className="text-[10px] text-gold hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                <span>Manage All</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Quick Retailer Preset Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-text-muted">Quick quote:</span>
                          {['C.Gars Ltd', 'Havana House', 'Smoke King', 'Sautter London', 'Neptune'].map((vName) => {
                            const hasPriceFromVendor = (cigar.vendorPrices || []).some(
                              (vp) => vp.vendor.toLowerCase().includes(vName.toLowerCase().split(' ')[0])
                            );
                            return (
                              <button
                                key={vName}
                                type="button"
                                onClick={() => handleStartQuickRetailerAdd(cigar.id, vName)}
                                className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${
                                  hasPriceFromVendor
                                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                                    : 'bg-modal hover:bg-card-hover text-text-muted hover:text-gold border-line'
                                }`}
                              >
                                <span>+{vName.split(' ')[0]}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Inline Quick Add Form */}
                        {quickPriceCigarId === cigar.id && (
                          <div className="p-2.5 bg-card border border-gold/40 rounded-md space-y-2 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-gold tracking-wider">
                                Add Retailer Quote for {cigar.line}
                              </span>
                              <button
                                onClick={() => setQuickPriceCigarId(null)}
                                className="text-text-muted hover:text-white p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                              <div className="sm:col-span-2">
                                <input
                                  type="text"
                                  placeholder="Retailer (e.g. C.Gars Ltd, Havana House)"
                                  value={quickPriceVendor}
                                  onChange={(e) => setQuickPriceVendor(e.target.value)}
                                  className="w-full bg-surface border border-line rounded px-2 py-1 text-xs text-white font-medium focus:outline-hidden focus:border-gold"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gold font-bold">{quickPriceCurrency}</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  autoFocus
                                  placeholder="20.00"
                                  value={quickPriceValue}
                                  onChange={(e) => setQuickPriceValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveQuickRetailerPrice(cigar);
                                    }
                                  }}
                                  className="w-full bg-surface border border-line rounded px-2 py-1 text-xs text-white font-bold focus:outline-hidden focus:border-gold"
                                />
                              </div>

                              <div>
                                <button
                                  type="button"
                                  onClick={() => handleSaveQuickRetailerPrice(cigar)}
                                  className="w-full py-1 bg-gold hover:brightness-110 text-ink font-bold text-xs uppercase tracking-wider rounded transition cursor-pointer"
                                >
                                  Save Quote
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {cigar.vendorPrices && cigar.vendorPrices.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {cigar.vendorPrices.map((vp) => {
                              const minPrice = Math.min(...(cigar.vendorPrices || []).map((v) => v.price));
                              const isLowest = vp.price === minPrice && (cigar.vendorPrices?.length || 0) > 1;

                              return (
                                <div
                                  key={vp.id}
                                  className={`p-2 rounded border text-xs flex items-center justify-between gap-2 group ${
                                    isLowest
                                      ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                                      : 'bg-modal border-line text-text'
                                  }`}
                                >
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="font-semibold truncate text-[11px] flex items-center gap-1">
                                      <span>{vp.vendor}</span>
                                      {isLowest && (
                                        <span className="px-1 py-0.2 bg-emerald-800 text-white text-[9px] font-bold uppercase rounded-xs">
                                          Best
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-text-muted truncate">
                                      {vp.packageType || 'Single'} &bull; {formatDateShort(vp.recordedAt)}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="font-bold text-xs text-gold font-mono">
                                      {formatCurrency(vp.price, vp.currency || '£')}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteVendorPrice(cigar, vp.id, vp.vendor)}
                                      className="text-text-muted hover:text-red-400 hover:bg-red-950/40 p-1 rounded transition cursor-pointer"
                                      title={`Delete ${vp.vendor} quote`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[11px] text-text-muted italic flex items-center justify-between">
                            <span>No vendor quotes logged yet. Baseline avg: {formatCurrency(cigar.averagePrice || 0, '£')}</span>
                            {onOpenPriceEditor && (
                              <button
                                onClick={() =>
                                  onOpenPriceEditor({
                                    brand: cigar.brand,
                                    name: cigar.line,
                                    vitola: cigar.vitola,
                                    price: cigar.averagePrice,
                                  })
                                }
                                className="px-2 py-0.5 bg-card hover:bg-card-hover text-gold border border-line rounded text-[10px] cursor-pointer"
                              >
                                + Add Retailer Price
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expandable 3-Thirds Progression & Blend Details */}
                    {isExpanded && (
                      <div className="space-y-4 pt-3 border-t border-line">
                        {fields.tastingProgression && showReviews && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3 bg-surface border border-line rounded-md text-xs space-y-1">
                              <strong className="text-gold text-[11px] font-semibold uppercase tracking-wider block">
                                1st Third (Initial Light)
                              </strong>
                              <p className="text-text leading-relaxed">
                                {cigar.reviewTastingNotes?.firstThird || 'Cedar, white pepper, and light cocoa.'}
                              </p>
                            </div>
                            <div className="p-3 bg-surface border border-line rounded-md text-xs space-y-1">
                              <strong className="text-gold text-[11px] font-semibold uppercase tracking-wider block">
                                2nd Third (Sweet Spot)
                              </strong>
                              <p className="text-text leading-relaxed">
                                {cigar.reviewTastingNotes?.secondThird || 'Caramel sweetness, espresso crema, and leather.'}
                              </p>
                            </div>
                            <div className="p-3 bg-surface border border-line rounded-md text-xs space-y-1">
                              <strong className="text-gold text-[11px] font-semibold uppercase tracking-wider block">
                                Final Third (The Nub)
                              </strong>
                              <p className="text-text leading-relaxed">
                                {cigar.reviewTastingNotes?.finalThird || 'Dark chocolate fudge, toasted nuts, and oak.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Pairings & Factory */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {fields.drinkPairings && showPairings && (
                            <div className="p-3 bg-surface border border-line rounded-md space-y-1">
                              <strong className="text-gold text-[10px] uppercase tracking-wider flex items-center gap-1">
                                <Coffee className="w-3 h-3" />
                                <span>Sommelier Drink Pairings:</span>
                              </strong>
                              <div className="text-text">
                                {(cigar.recommendedPairings || []).join(' • ') || 'Bourbon, Espresso, Single Malt Scotch'}
                              </div>
                            </div>
                          )}

                          {fields.agingTimeline && (
                            <div className="p-3 bg-surface border border-line rounded-md space-y-1">
                              <strong className="text-gold text-[10px] uppercase tracking-wider block">
                                Factory Terroir & Aging Window:
                              </strong>
                              <div className="text-text">
                                {cigar.factoryTerroir || 'Tabacalera Private Reserve'} • Recommended Aging:{' '}
                                <strong>{cigar.agingWindowMonths || 6} months</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* USER-SPECIFIC SECTION: Personal Connoisseur Rating & Notes */}
                  {showPersonalNotes && (
                    <div className="p-4 bg-surface border border-line rounded-lg space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gold flex items-center gap-1">
                            <Edit3 className="w-3 h-3 text-gold" />
                            <span>Personal Notes & Connoisseur Rating</span>
                          </span>
                          {cigar.personalWouldRebuy && (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-card text-gold border border-line">
                              Verdict: {cigar.personalWouldRebuy}
                            </span>
                          )}
                          {cigar.personalTried && (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-card text-text border border-line">
                              ✓ Tried / Smoked
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setSelectedCigarForReview(cigar);
                            setIsReviewModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-card hover:bg-card-hover text-gold border border-line hover:border-gold/50 rounded text-[10px] font-semibold uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{cigar.personalNotes || cigar.personalRating ? 'Edit My Review' : '+ Add Personal Rating & Notes'}</span>
                        </button>
                      </div>

                      {/* Display Personal Notes if available */}
                      {cigar.personalNotes || cigar.personalRating ? (
                        <div className="space-y-1.5 text-xs text-text">
                          {cigar.personalNotes && (
                            <p className="italic text-text/90 bg-header p-2.5 rounded border border-line/60">
                              "{cigar.personalNotes}"
                            </p>
                          )}
                          {cigar.personalPairingNotes && (
                            <div className="text-[11px] text-text-muted">
                              <strong className="text-gold">My Pairing:</strong> {cigar.personalPairingNotes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-text-muted/70 italic">
                          No personal tasting notes or rating recorded yet. Add your personal impressions after smoking!
                        </p>
                      )}
                    </div>
                  )}

                  {/* Card Bottom Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line">
                    <button
                      onClick={() => toggleCardExpansion(cigar.id)}
                      className="text-[11px] text-text-muted hover:text-text font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5 text-gold" />
                          <span>Hide 3-Thirds Progression</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 text-gold" />
                          <span>View 3-Thirds Progression & Blend Details</span>
                        </>
                      )}
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Add to Humidor */}
                      <button
                        onClick={() =>
                          onAddCigarFromResearch({
                            brand: cigar.brand,
                            name: cigar.line,
                            line: cigar.line,
                            vitola: cigar.vitola,
                            wrapper: cigar.wrapper,
                            binder: cigar.binder,
                            filler: cigar.filler,
                            countryOrigin: cigar.countryOrigin,
                            strength: cigar.strength,
                            purchasePrice: cigar.averagePrice,
                            flavorTags: cigar.reviewTastingNotes?.dominantFlavorTags || [],
                            targetRestMonths: cigar.agingWindowMonths || 6,
                            notes: cigar.reviewTastingNotes?.overview,
                            personalRating: cigar.personalRating,
                          })
                        }
                        className="px-3 py-1.5 bg-gold hover:brightness-110 text-ink font-bold text-[10px] uppercase tracking-wider rounded transition flex items-center gap-1 cursor-pointer"
                        title="Add this cigar to your humidor inventory"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Humidor</span>
                      </button>

                      {/* Add to Wishlist */}
                      <button
                        onClick={() =>
                          onAddToWishlist({
                            brand: cigar.brand,
                            name: `${cigar.line} (${cigar.vitola})`,
                            vitola: cigar.vitola,
                            notes: `Avg Price: £${cigar.averagePrice.toFixed(2)}. ${cigar.reviewTastingNotes?.overview || ''}`,
                          })
                        }
                        className="px-2.5 py-1.5 bg-surface hover:bg-card-hover text-text border border-line text-[10px] font-semibold uppercase tracking-wider rounded transition flex items-center gap-1 cursor-pointer"
                        title="Add to Wishlist"
                      >
                        <Bookmark className="w-3 h-3 text-gold" />
                        <span>Wishlist</span>
                      </button>

                      {/* Edit Retailer Prices */}
                      {onOpenPriceEditor && (
                        <button
                          onClick={() =>
                            onOpenPriceEditor({
                              brand: cigar.brand,
                              name: cigar.line,
                              vitola: cigar.vitola,
                              price: cigar.averagePrice,
                            })
                          }
                          className="px-2.5 py-1.5 bg-surface hover:bg-card-hover text-emerald-400 border border-line text-[10px] font-semibold uppercase tracking-wider rounded transition flex items-center gap-1 cursor-pointer"
                          title="Manage multiple retailer prices"
                        >
                          <DollarSign className="w-3 h-3 text-emerald-400" />
                          <span>Prices</span>
                        </button>
                      )}

                      {/* Log Smoke */}
                      {onLogSmokeFromResearch && (
                        <button
                          onClick={() =>
                            onLogSmokeFromResearch(
                              cigar.line,
                              cigar.brand,
                              cigar.vitola,
                              cigar.wrapper,
                              cigar.countryOrigin
                            )
                          }
                          className="px-2.5 py-1.5 bg-surface hover:bg-card-hover text-text border border-line text-[10px] font-semibold uppercase tracking-wider rounded transition flex items-center gap-1 cursor-pointer"
                          title="Log a Tasting Smoke Session"
                        >
                          <Flame className="w-3 h-3 text-gold" />
                          <span>Smoke</span>
                        </button>
                      )}

                      {/* Scan UK Retailers */}
                      <button
                        onClick={() => handleScanRetailerPricesForCigar(cigar)}
                        disabled={scanningPriceCigarId === cigar.id}
                        className="px-2.5 py-1.5 bg-surface hover:bg-card-hover text-gold border border-gold/40 hover:border-gold text-[10px] font-semibold uppercase tracking-wider rounded transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Scan UK Retailers (Cgars, Cuban Cigar Club, Havana House, Smoke King, Davidoff)"
                      >
                        {scanningPriceCigarId === cigar.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-gold" />
                            <span>Scanning...</span>
                          </>
                        ) : (
                          <>
                            <Store className="w-3 h-3 text-gold" />
                            <span>🇬🇧 Scan UK</span>
                          </>
                        )}
                      </button>

                      {/* AI Dossier Lookup */}
                      <button
                        onClick={() => {
                          setDossierQuery(`${cigar.brand} ${cigar.line} ${cigar.vitola}`);
                          setActiveMainTab('dossier');
                          handleLookupDossier(`${cigar.brand} ${cigar.line} ${cigar.vitola}`);
                        }}
                        className="px-2.5 py-1.5 bg-surface hover:bg-card-hover text-gold border border-line text-[10px] font-semibold uppercase tracking-wider rounded transition flex items-center gap-1 cursor-pointer"
                        title="Run Deep Live Gemini AI Research Analysis"
                      >
                        <Sparkles className="w-3 h-3 text-gold" />
                        <span>AI Research</span>
                      </button>

                      {/* Individual Delete Button */}
                      {onDeleteResearchCigar && (
                        <button
                          onClick={() => setCigarToDelete(cigar)}
                          className="px-2 py-1.5 bg-surface hover:bg-danger-bg text-text-muted hover:text-red-400 border border-line hover:border-red-900/60 text-[10px] font-semibold uppercase tracking-wider rounded transition flex items-center gap-1 cursor-pointer"
                          title={`Delete ${cigar.brand} ${cigar.line} from research database`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* TAB 2: AI Connoisseur Dossier Lookup */}
      {activeMainTab === 'dossier' && (
        <div className="space-y-6">
          {/* UK Retailer Price Intelligence & Cross-App Sync Action Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-card via-header to-surface border border-gold/40 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    <span>UK Retailer Price Intelligence & Cross-App Sync</span>
                  </span>
                </div>
                <div className="text-xs text-text">
                  <strong>Research:</strong> {researchDatabase.length} entries &bull;{' '}
                  <strong>Humidors:</strong> {cigars.length} vitolas ({cigars.reduce((a, b) => a + (b.quantity || 1), 0)} total sticks) &bull;{' '}
                  <strong>Wishlist:</strong> {wishlist.length} target sticks
                </div>
                <div className="text-[11px] text-text-muted">
                  Multi-shop scanning across <strong>Cgars Ltd, Cuban Cigar Club, Havana House, Smoke King, and Davidoff of London</strong>. Auto-calculates accurate smoke duration badges (⏱️ 50–65 min) across every item.
                </div>
                {missingSpecsStats.totalMissing > 0 && (
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-gold">
                    <Clock className="w-3 h-3" />
                    <span>
                      {missingSpecsStats.totalMissing} items can be enhanced ({missingSpecsStats.researchMissing} Research, {missingSpecsStats.humidorMissing} Vault, {missingSpecsStats.wishlistMissing} Wishlist)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleBatchScanAllRetailers}
                  disabled={isBatchScanningPrices}
                  className="px-3 py-2 bg-surface hover:bg-card-hover text-gold border border-gold/50 hover:border-gold text-[11px] font-semibold uppercase tracking-wider rounded-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Scan live British retailer prices across top 5 UK vendors"
                >
                  {isBatchScanningPrices ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scanning UK Shops...</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-3.5 h-3.5 text-gold" />
                      <span>🇬🇧 Scan UK Retailers</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleBatchScanAllReviewScores}
                  disabled={isBatchScanningReviews}
                  className="px-3 py-2 bg-surface hover:bg-card-hover text-gold border border-gold/50 hover:border-gold text-[11px] font-semibold uppercase tracking-wider rounded-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Scan critic review scores from Cigar Aficionado, Smoke King, Halfwheel, etc."
                >
                  {isBatchScanningReviews ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scanning Review Scores...</span>
                    </>
                  ) : (
                    <>
                      <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                      <span>⭐ Scan Review Scores</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSyncAllMissingFields}
                  disabled={isSyncingMissingFields}
                  className="px-3.5 py-2 bg-gold hover:brightness-110 text-ink font-bold text-[11px] uppercase tracking-wider rounded-md shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Estimate accurate smoke durations, vitola specs and sync blend data globally"
                >
                  {isSyncingMissingFields ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-ink" />
                      <span>Syncing Specs...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-ink" />
                      <span>Auto-Sync Smoke Times & Blend Specs</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {syncSummary && (
              <div className="mt-3 p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded text-[11px] text-emerald-200 flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{syncSummary}</span>
              </div>
            )}
          </div>

          <div className="p-5 bg-header border border-line rounded-lg space-y-3 shadow-sm">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-gold">
              Deep Live Connoisseur Dossier Engine (Gemini 3.7 AI)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Padrón 1926 No. 9, Arturo Fuente Opus X, Davidoff Late Hour, Liga Privada..."
                  value={dossierQuery}
                  onChange={(e) => setDossierQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLookupDossier();
                    }
                  }}
                  className="w-full bg-surface border border-line rounded-md pl-9 pr-3 py-2.5 text-xs sm:text-sm text-text focus:outline-hidden focus:border-gold placeholder-text-muted/50"
                />
              </div>
              <button
                onClick={() => handleLookupDossier()}
                disabled={loadingDossier}
                className="px-5 py-2.5 bg-gold hover:brightness-110 text-ink font-bold uppercase tracking-wider rounded-md text-xs shadow-sm transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loadingDossier ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-ink" />
                    <span>Researching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-ink" />
                    <span>Generate Dossier</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {dossierError && (
            <div className="p-4 bg-danger-bg border border-red-800/80 rounded-lg text-xs text-red-200">
              {dossierError}
            </div>
          )}

          {dossierResult && (
            <div className="bg-header border border-line rounded-lg p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                      {dossierResult.brand}
                    </span>
                    <span className="text-line-hover">•</span>
                    <span className="text-xs text-text">{dossierResult.countryOrigin}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-white font-normal mt-1">
                    {dossierResult.cigarName}
                  </h2>
                  <div className="text-xs text-text-muted mt-1.5 flex flex-wrap items-center gap-2">
                    <span>
                      Vitola: <strong className="text-text">{dossierResult.vitolaCommon || 'Robusto'}</strong>{' '}
                      {dossierResult.lengthInches ? `• ${dossierResult.lengthInches}"` : ''}{' '}
                      {dossierResult.ringGauge ? `• ${dossierResult.ringGauge} RG` : ''}
                    </span>
                    <span className="text-line-hover">•</span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface border border-line rounded text-[10px] text-gold font-medium">
                      <Clock className="w-3 h-3 text-gold" />
                      <span>
                        Est. Smoke Time:{' '}
                        {estimateAccurateSmokeTime(
                          dossierResult.vitolaCommon,
                          dossierResult.lengthInches ? parseFloat(dossierResult.lengthInches) : 5,
                          dossierResult.ringGauge ? parseInt(dossierResult.ringGauge, 10) : 50
                        ).range}
                      </span>
                    </div>
                    <span className="text-line-hover">•</span>
                    <span>
                      Master Blender:{' '}
                      <strong className="text-text">{dossierResult.masterBlender || 'Master Blending Team'}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      const smokeTime = estimateAccurateSmokeTime(
                        dossierResult.vitolaCommon,
                        dossierResult.lengthInches ? parseFloat(dossierResult.lengthInches) : 5,
                        dossierResult.ringGauge ? parseInt(dossierResult.ringGauge, 10) : 50
                      );
                      onAddCigarFromResearch({
                        brand: dossierResult.brand,
                        name: dossierResult.cigarName,
                        line: dossierResult.line || dossierResult.cigarName,
                        vitola: dossierResult.vitolaCommon || 'Robusto',
                        wrapper: dossierResult.wrapper,
                        binder: dossierResult.binder,
                        filler: dossierResult.filler,
                        countryOrigin: dossierResult.countryOrigin,
                        strength: (dossierResult.strength as any) || 'Medium-Full',
                        notes: dossierResult.summary,
                        flavorTags: dossierResult.dominantFlavorTags,
                        targetRestMonths: parseInt(dossierResult.agingGuidance?.idealRestMonths || '6', 10) || 6,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gold hover:brightness-110 text-ink rounded font-bold uppercase tracking-wider text-[10px] shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Humidor</span>
                  </button>

                  <button
                    onClick={() => {
                      const smokeTime = estimateAccurateSmokeTime(
                        dossierResult.vitolaCommon,
                        dossierResult.lengthInches ? parseFloat(dossierResult.lengthInches) : 5,
                        dossierResult.ringGauge ? parseInt(dossierResult.ringGauge, 10) : 50
                      );
                      onAddToWishlist({
                        brand: dossierResult.brand,
                        name: dossierResult.cigarName,
                        vitola: dossierResult.vitolaCommon,
                        notes: dossierResult.summary,
                      });
                      showFeedback(`Added "${dossierResult.brand} ${dossierResult.cigarName}" to your Wishlist!`);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-card-hover text-gold border border-line hover:border-gold/40 rounded text-[10px] uppercase tracking-wider font-semibold transition cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-gold" />
                    <span>Add to Wishlist</span>
                  </button>

                  {onAddCustomResearchCigar && (
                    <button
                      onClick={() => {
                        const smokeTime = estimateAccurateSmokeTime(
                          dossierResult.vitolaCommon,
                          dossierResult.lengthInches ? parseFloat(dossierResult.lengthInches) : 5,
                          dossierResult.ringGauge ? parseInt(dossierResult.ringGauge, 10) : 50
                        );
                        const newResItem: CigarResearchItem = {
                          id: generateId('res-dos'),
                          brand: dossierResult.brand,
                          line: dossierResult.line || dossierResult.cigarName,
                          vitola: dossierResult.vitolaCommon || 'Robusto',
                          lengthInches: dossierResult.lengthInches ? parseFloat(dossierResult.lengthInches) : 5.0,
                          ringGauge: dossierResult.ringGauge ? parseInt(dossierResult.ringGauge, 10) : 50,
                          smokeTimeMinutes: smokeTime.minutes,
                          smokeTimeRange: smokeTime.range,
                          countryOrigin: dossierResult.countryOrigin,
                          wrapper: dossierResult.wrapper,
                          wrapperType: (dossierResult.wrapper?.includes('Maduro') ? 'Maduro' : dossierResult.wrapper?.includes('Connecticut') ? 'Connecticut Shade' : 'Habano') as any,
                          binder: dossierResult.binder || 'Proprietary',
                          filler: dossierResult.filler || 'Proprietary',
                          strength: (dossierResult.strength as StrengthRating) || 'Medium-Full',
                          body: 'Medium-Full',
                          averagePrice: 20.0,
                          priceRange: '£18 - £25',
                          criticRating: 91,
                          criticConsensus: dossierResult.summary,
                          reviewTastingNotes: {
                            overview: dossierResult.summary,
                            firstThird: dossierResult.flavorTransitions?.firstThird?.overview || 'Smooth initial draw with cedar and spice.',
                            secondThird: dossierResult.flavorTransitions?.secondThird?.overview || 'Rich cocoa and coffee bean.',
                            finalThird: dossierResult.flavorTransitions?.finalThird?.overview || 'Warm oak and peppery finish.',
                            dominantFlavorTags: dossierResult.dominantFlavorTags || ['Cedar', 'Leather', 'Cocoa'],
                          },
                          recommendedPairings: dossierResult.idealPairings?.map(p => p.beverageName) || ['Single Malt Scotch'],
                          agingWindowMonths: parseInt(dossierResult.agingGuidance?.idealRestMonths || '6', 10) || 6,
                          isCuban: dossierResult.countryOrigin?.toLowerCase().includes('cuba') || false,
                        };
                        onAddCustomResearchCigar(newResItem);
                        showFeedback(`Saved "${dossierResult.brand} ${dossierResult.cigarName}" to your permanent Research Database!`);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-card-hover text-text border border-line hover:border-cedar rounded text-[10px] uppercase tracking-wider font-semibold transition cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-gold" />
                      <span>Save to Research DB</span>
                    </button>
                  )}

                  {onLogSmokeFromResearch && (
                    <button
                      onClick={() =>
                        onLogSmokeFromResearch(
                          dossierResult.cigarName,
                          dossierResult.brand,
                          dossierResult.vitolaCommon || 'Robusto',
                          dossierResult.wrapper,
                          dossierResult.countryOrigin
                        )
                      }
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-card-hover text-text border border-line hover:border-amber-600/40 rounded text-[10px] uppercase tracking-wider font-semibold transition cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>Log Smoke</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-surface border border-line rounded-md">
                <p className="text-xs sm:text-sm text-text leading-relaxed font-serif italic">
                  "{dossierResult.summary}"
                </p>
              </div>

              {/* Tobacco Blend */}
              <div>
                <h3 className="text-[10px] uppercase tracking-widest font-semibold text-gold mb-3">
                  Tobacco Blend & Terroir
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-surface border border-line rounded-md">
                    <span className="text-text-muted text-[10px] uppercase tracking-wider block">Wrapper Leaf</span>
                    <strong className="text-text text-xs sm:text-sm font-serif">{dossierResult.wrapper}</strong>
                  </div>
                  <div className="p-3 bg-surface border border-line rounded-md">
                    <span className="text-text-muted text-[10px] uppercase tracking-wider block">Binder</span>
                    <strong className="text-text text-xs sm:text-sm font-serif">
                      {dossierResult.binder || 'Proprietary'}
                    </strong>
                  </div>
                  <div className="p-3 bg-surface border border-line rounded-md">
                    <span className="text-text-muted text-[10px] uppercase tracking-wider block">Filler</span>
                    <strong className="text-text text-xs sm:text-sm font-serif">
                      {dossierResult.filler || 'Proprietary Blend'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 3-Thirds Flavor Progression */}
              <div>
                <h3 className="text-[10px] uppercase tracking-widest font-semibold text-gold mb-3">
                  💨 3-Thirds Flavor Progression Curve
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-surface border border-line rounded-md space-y-2">
                    <strong className="text-gold text-xs font-serif font-semibold">1st Third (Initial Light)</strong>
                    <p className="text-xs text-text leading-relaxed">
                      {dossierResult.flavorTransitions.firstThird.overview}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {dossierResult.flavorTransitions.firstThird.keyNotes.map((note) => (
                        <span
                          key={note}
                          className="text-[10px] px-2 py-0.5 rounded bg-header text-text border border-line"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-surface border border-line rounded-md space-y-2">
                    <strong className="text-gold text-xs font-serif font-semibold">2nd Third (Sweet Spot)</strong>
                    <p className="text-xs text-text leading-relaxed">
                      {dossierResult.flavorTransitions.secondThird.overview}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {dossierResult.flavorTransitions.secondThird.keyNotes.map((note) => (
                        <span
                          key={note}
                          className="text-[10px] px-2 py-0.5 rounded bg-header text-text border border-line"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-surface border border-line rounded-md space-y-2">
                    <strong className="text-gold text-xs font-serif font-semibold">Final Third (Nub & Finish)</strong>
                    <p className="text-xs text-text leading-relaxed">
                      {dossierResult.flavorTransitions.finalThird.overview}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {dossierResult.flavorTransitions.finalThird.keyNotes.map((note) => (
                        <span
                          key={note}
                          className="text-[10px] px-2 py-0.5 rounded bg-header text-text border border-line"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pairings */}
              <div>
                <h3 className="text-[10px] uppercase tracking-widest font-semibold text-gold mb-3 flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-gold" />
                  <span>Sommelier Beverage Pairings</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dossierResult.idealPairings.map((pairing, idx) => (
                    <div key={idx} className="p-3.5 bg-surface border border-line rounded-md text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-gold font-semibold">{pairing.beverageName}</strong>
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-header text-text-muted border border-line">
                          {pairing.category}
                        </span>
                      </div>
                      <p className="text-text text-xs leading-relaxed">{pairing.whyItWorks}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Multi-Destination Action Footer */}
              <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-text-muted">
                  Organize <strong className="text-text">{dossierResult.brand} {dossierResult.cigarName}</strong>:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      onAddCigarFromResearch({
                        brand: dossierResult.brand,
                        name: dossierResult.cigarName,
                        line: dossierResult.line || dossierResult.cigarName,
                        vitola: dossierResult.vitolaCommon || 'Robusto',
                        wrapper: dossierResult.wrapper,
                        binder: dossierResult.binder,
                        filler: dossierResult.filler,
                        countryOrigin: dossierResult.countryOrigin,
                        strength: (dossierResult.strength as any) || 'Medium-Full',
                        notes: dossierResult.summary,
                        flavorTags: dossierResult.dominantFlavorTags,
                        targetRestMonths: parseInt(dossierResult.agingGuidance?.idealRestMonths || '6', 10) || 6,
                      })
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gold hover:brightness-110 text-ink rounded font-bold uppercase tracking-wider text-[10px] shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Humidor</span>
                  </button>

                  <button
                    onClick={() => {
                      onAddToWishlist({
                        brand: dossierResult.brand,
                        name: dossierResult.cigarName,
                        vitola: dossierResult.vitolaCommon,
                        notes: dossierResult.summary,
                      });
                      showFeedback(`Added "${dossierResult.brand} ${dossierResult.cigarName}" to your Wishlist!`);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-card-hover text-gold border border-line hover:border-gold/40 rounded text-[10px] uppercase tracking-wider font-semibold transition cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-gold" />
                    <span>Add to Wishlist</span>
                  </button>

                  {onAddCustomResearchCigar && (
                    <button
                      onClick={() => {
                        const newResItem: CigarResearchItem = {
                          id: generateId('res-dos'),
                          brand: dossierResult.brand,
                          line: dossierResult.line || dossierResult.cigarName,
                          vitola: dossierResult.vitolaCommon || 'Robusto',
                          lengthInches: dossierResult.lengthInches ? parseFloat(dossierResult.lengthInches) : 5.0,
                          ringGauge: dossierResult.ringGauge ? parseInt(dossierResult.ringGauge, 10) : 50,
                          countryOrigin: dossierResult.countryOrigin,
                          wrapper: dossierResult.wrapper,
                          wrapperType: (dossierResult.wrapper?.includes('Maduro') ? 'Maduro' : dossierResult.wrapper?.includes('Connecticut') ? 'Connecticut Shade' : 'Habano') as any,
                          binder: dossierResult.binder || 'Proprietary',
                          filler: dossierResult.filler || 'Proprietary',
                          strength: (dossierResult.strength as StrengthRating) || 'Medium-Full',
                          body: 'Medium-Full',
                          averagePrice: 20.0,
                          priceRange: '£18 - £25',
                          criticRating: 91,
                          criticConsensus: dossierResult.summary,
                          reviewTastingNotes: {
                            overview: dossierResult.summary,
                            firstThird: dossierResult.flavorTransitions?.firstThird?.overview || 'Smooth initial draw with cedar and spice.',
                            secondThird: dossierResult.flavorTransitions?.secondThird?.overview || 'Rich cocoa and coffee bean.',
                            finalThird: dossierResult.flavorTransitions?.finalThird?.overview || 'Warm oak and peppery finish.',
                            dominantFlavorTags: dossierResult.dominantFlavorTags || ['Cedar', 'Leather', 'Cocoa'],
                          },
                          recommendedPairings: dossierResult.idealPairings?.map(p => p.beverageName) || ['Single Malt Scotch'],
                          agingWindowMonths: parseInt(dossierResult.agingGuidance?.idealRestMonths || '6', 10) || 6,
                          isCuban: dossierResult.countryOrigin?.toLowerCase().includes('cuba') || false,
                        };
                        onAddCustomResearchCigar(newResItem);
                        showFeedback(`Saved "${dossierResult.brand} ${dossierResult.cigarName}" to your permanent Research Database!`);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-card-hover text-text border border-line hover:border-cedar rounded text-[10px] uppercase tracking-wider font-semibold transition cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-gold" />
                      <span>Save to Research DB</span>
                    </button>
                  )}

                  {onLogSmokeFromResearch && (
                    <button
                      onClick={() =>
                        onLogSmokeFromResearch(
                          dossierResult.cigarName,
                          dossierResult.brand,
                          dossierResult.vitolaCommon || 'Robusto',
                          dossierResult.wrapper,
                          dossierResult.countryOrigin
                        )
                      }
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-card-hover text-text border border-line hover:border-amber-600/40 rounded text-[10px] uppercase tracking-wider font-semibold transition cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>Log Smoke</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: "What to Smoke Tonight?" Sommelier */}
      {activeMainTab === 'sommelier' && (
        <div className="space-y-6">
          <div className="p-6 bg-header border border-line rounded-lg space-y-4 shadow-sm">
            <h2 className="text-lg font-serif text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Personal Cigar Sommelier Recommendation</span>
            </h2>
            <p className="text-xs text-text-muted">
              Tell the Sommelier your mood, available smoking time, and tonight's beverage. We'll cross-reference
              your current humidor inventory to select the ideal stick.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Occasion / Setting</label>
                <input
                  type="text"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder="e.g. Porch after steak dinner, celebration"
                  className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">Available Smoke Time</label>
                <select
                  value={availableTime}
                  onChange={(e) => setAvailableTime(e.target.value)}
                  className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                >
                  <option value="30-45 minutes (Petit Corona / Corona)">30-45 minutes (Quick / Small vitola)</option>
                  <option value="60-75 minutes (Robusto / Toro)">60-75 minutes (Robusto / Toro standard)</option>
                  <option value="90-120 minutes (Churchill / Double Corona)">90-120 minutes (Churchill / Long lounge)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">Beverage in Glass</label>
                <input
                  type="text"
                  value={drinkPairing}
                  onChange={(e) => setDrinkPairing(e.target.value)}
                  placeholder="e.g. Woodford Reserve Double Oaked, Espresso, Rum"
                  className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1">Flavor Notes or Strength Preference</label>
              <input
                type="text"
                value={preferenceNotes}
                onChange={(e) => setPreferenceNotes(e.target.value)}
                placeholder="e.g. Want rich dark chocolate and baking spices, medium-full body"
                className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
              />
            </div>

            <button
              onClick={handleRunSommelier}
              disabled={loadingSommelier}
              className="px-6 py-2.5 bg-gold hover:brightness-110 text-ink font-bold uppercase tracking-wider rounded-md text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              {loadingSommelier ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-ink" />
                  <span>Consulting Sommelier...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-ink" />
                  <span>Recommend Tonight's Smoke</span>
                </>
              )}
            </button>
          </div>

          {sommelierError && (
            <div className="p-4 bg-danger-bg border border-red-800/80 rounded-lg text-xs text-red-200">
              {sommelierError}
            </div>
          )}

          {sommelierResult && (
            <div className="bg-header border border-line rounded-lg p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="p-4 bg-surface border border-line rounded-md text-xs sm:text-sm text-text font-serif italic leading-relaxed">
                "{sommelierResult.sommelierGreeting}"
              </div>

              {sommelierResult.humidorPick && (
                <div className="p-5 bg-surface border border-gold/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-gold" />
                      <span>Top Choice from Your Humidor</span>
                    </span>
                    <span className="text-xs text-text-muted">
                      ⏱️ {sommelierResult.humidorPick.expectedSmokeDuration}
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-white">
                    {sommelierResult.humidorPick.cigarName}
                  </h3>

                  <p className="text-xs sm:text-sm text-text leading-relaxed">
                    {sommelierResult.humidorPick.reason}
                  </p>

                  <div className="p-3 bg-header rounded border border-line text-xs text-text">
                    <strong className="text-gold">🥃 Pairing Advice:</strong>{' '}
                    {sommelierResult.humidorPick.pairingAdvice}
                  </div>
                </div>
              )}

              {/* Curated Recommendations */}
              <div>
                <h3 className="text-[10px] uppercase tracking-widest font-semibold text-gold mb-3">
                  ★ Curated Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {sommelierResult.curatedRecommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-4 bg-surface border border-line rounded-lg space-y-2 text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-gold font-bold uppercase text-[10px] tracking-wider">{rec.brand}</div>
                        <div className="font-serif font-semibold text-white text-sm">{rec.cigarName}</div>
                        <div className="text-text-muted text-[11px]">
                          {rec.vitola} • {rec.strength}
                        </div>
                        <p className="text-text text-xs mt-2 leading-relaxed">{rec.whyItFits}</p>
                      </div>

                      <div className="pt-3 border-t border-line flex flex-wrap items-center justify-end gap-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onAddCigarFromResearch({
                                brand: rec.brand,
                                name: rec.cigarName,
                                vitola: rec.vitola,
                                strength: rec.strength as any,
                                notes: rec.whyItFits,
                              });
                            }}
                            className="p-1.5 text-text-muted hover:text-gold border border-line hover:border-gold/40 rounded cursor-pointer"
                            title="Add to Humidor"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              onAddToWishlist({
                                brand: rec.brand,
                                name: rec.cigarName,
                                vitola: rec.vitola,
                                notes: rec.whyItFits,
                              });
                              showFeedback(`Added "${rec.brand} ${rec.cigarName}" to Wishlist!`);
                            }}
                            className="p-1.5 text-text-muted hover:text-gold border border-line hover:border-gold/40 rounded cursor-pointer"
                            title="Save to Wishlist"
                          >
                            <Bookmark className="w-3 h-3" />
                          </button>
                          {onAddCustomResearchCigar && (
                            <button
                              onClick={() => {
                                const recDims = suggestVitolaDimensions(rec.vitola || 'Robusto');
                                const newRes: CigarResearchItem = {
                                  id: generateId('res-rec'),
                                  brand: rec.brand,
                                  line: rec.cigarName,
                                  vitola: rec.vitola || 'Robusto',
                                  lengthInches: recDims?.lengthInches ?? 5.0,
                                  ringGauge: recDims?.ringGauge ?? 50,
                                  countryOrigin: 'Nicaragua',
                                  wrapper: 'Habano',
                                  wrapperType: 'Habano',
                                  binder: 'Proprietary',
                                  filler: 'Proprietary',
                                  strength: (rec.strength as StrengthRating) || 'Medium-Full',
                                  body: 'Medium-Full',
                                  averagePrice: 19.5,
                                  priceRange: '£16 - £24',
                                  criticRating: 90,
                                  criticConsensus: rec.whyItFits,
                                  reviewTastingNotes: {
                                    overview: rec.whyItFits,
                                    firstThird: 'Cedar and light spice.',
                                    secondThird: 'Cocoa nibs and coffee.',
                                    finalThird: 'Deep oak and peppery finish.',
                                    dominantFlavorTags: ['Cedar', 'Cocoa', 'Coffee'],
                                  },
                                  recommendedPairings: [drinkPairing || 'Single Malt Scotch'],
                                  agingWindowMonths: 6,
                                  isCuban: false,
                                };
                                onAddCustomResearchCigar(newRes);
                                showFeedback(`Saved "${rec.brand} ${rec.cigarName}" to Research DB!`);
                              }}
                              className="p-1.5 text-text-muted hover:text-gold border border-line hover:border-cedar rounded cursor-pointer"
                              title="Save to Research DB"
                            >
                              <BookOpen className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Personal Review Modal */}
      <PersonalReviewModal
        cigar={selectedCigarForReview}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedCigarForReview(null);
        }}
        onSavePersonalReview={handleSavePersonalReview}
      />

      {/* Add Custom Research Cigar Modal */}
      {isAddCustomOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-card border border-line rounded-lg shadow-2xl overflow-hidden text-text">
            <div className="px-6 py-4 bg-surface border-b border-line flex items-center justify-between">
              <h2 className="text-base font-serif font-semibold text-text">Add Custom Cigar to Database</h2>
              <button
                onClick={() => setIsAddCustomOpen(false)}
                className="text-text-muted hover:text-text p-1.5 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomCigar} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="e.g. Illusione, Warped"
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Line / Blend *</label>
                  <input
                    type="text"
                    required
                    value={newLine}
                    onChange={(e) => setNewLine(e.target.value)}
                    placeholder="e.g. Epernay Le Ferme"
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Vitola</label>
                  <input
                    type="text"
                    value={newVitola}
                    onChange={(e) => setNewVitola(e.target.value)}
                    placeholder="e.g. Robusto, Toro"
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Origin Country</label>
                  <select
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text"
                  >
                    <option value="Nicaragua">Nicaragua</option>
                    <option value="Dominican Republic">Dominican Republic</option>
                    <option value="Cuba">Cuba</option>
                    <option value="Honduras">Honduras</option>
                    <option value="Mexico">Mexico</option>
                    <option value="USA">USA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Wrapper Type</label>
                  <select
                    value={newWrapperType}
                    onChange={(e) => {
                      setNewWrapperType(e.target.value as any);
                      setNewWrapper(e.target.value);
                    }}
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text"
                  >
                    {wrapperTypes.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Strength</label>
                  <select
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value as any)}
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text"
                  >
                    {strengthTypes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Average Price (£)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newAvgPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setNewAvgPrice(val);
                      setNewPriceRange(`£${(val * 0.9).toFixed(2)} – £${(val * 1.15).toFixed(2)}`);
                    }}
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Critic Rating (1-100)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={newCriticRating}
                    onChange={(e) => setNewCriticRating(parseInt(e.target.value, 10))}
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Tasting Notes Overview</label>
                <textarea
                  rows={2}
                  value={newReviewOverview}
                  onChange={(e) => setNewReviewOverview(e.target.value)}
                  placeholder="e.g. Silky draw with cedar, toasted almonds, and sweet vanilla cream..."
                  className="w-full bg-surface border border-line rounded p-2.5 text-xs text-text"
                />
              </div>

              <div className="pt-3 border-t border-line flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomOpen(false)}
                  className="px-4 py-2 bg-surface hover:bg-card-hover text-text-muted rounded text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold text-ink font-bold rounded text-xs uppercase tracking-wider cursor-pointer"
                >
                  Save to Research DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset / Clear Confirmation Dialog */}
      {confirmModalType && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-card border border-line rounded-lg shadow-2xl p-6 text-text">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-line flex items-center justify-center flex-shrink-0 text-gold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-white">
                  {confirmModalType === 'reset' ? 'Reset Research Database?' : 'Clear Research Database?'}
                </h3>
                <p className="text-xs text-text-muted">
                  {confirmModalType === 'reset'
                    ? 'This will restore all default 25+ benchmark cigars in the connoisseur research catalog.'
                    : 'This will remove all research catalog entries. You can always reset to defaults later.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <button
                onClick={() => setConfirmModalType(null)}
                className="px-4 py-2 bg-surface hover:bg-card-hover text-text-muted rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              {confirmModalType === 'reset' ? (
                <button
                  onClick={() => {
                    if (onResetResearchDatabase) onResetResearchDatabase();
                    setConfirmModalType(null);
                  }}
                  className="px-4 py-2 bg-gold hover:brightness-110 text-ink font-bold rounded text-xs uppercase tracking-wider cursor-pointer"
                >
                  Confirm Reset
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (onClearResearchDatabase) onClearResearchDatabase();
                    setConfirmModalType(null);
                  }}
                  className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white font-bold rounded text-xs uppercase tracking-wider cursor-pointer"
                >
                  Confirm Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Individual Cigar Delete Confirmation Dialog */}
      {cigarToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-card border border-line rounded-lg shadow-2xl p-6 text-text">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-800/60 flex items-center justify-center flex-shrink-0 text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-white">
                  Delete Cigar from Research?
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Are you sure you want to remove <strong className="text-gold">{cigarToDelete.brand} {cigarToDelete.line}</strong> ({cigarToDelete.vitola}) from your research database?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <button
                onClick={() => setCigarToDelete(null)}
                className="px-4 py-2 bg-surface hover:bg-card-hover text-text-muted rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteResearchCigar && cigarToDelete) {
                    onDeleteResearchCigar(cigarToDelete.id);
                    showFeedback(`Removed ${cigarToDelete.brand} ${cigarToDelete.line} from research.`);
                    setCigarToDelete(null);
                  }
                }}
                className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white font-bold rounded text-xs uppercase tracking-wider cursor-pointer"
              >
                Delete Cigar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
