import React, { useState, useMemo } from 'react';
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
  Loader2,
  ChevronDown,
  ChevronUp,
  Tag,
  DollarSign,
  Globe,
  SlidersHorizontal,
  X,
  Edit3,
} from 'lucide-react';
import { Cigar, CigarResearchItem, WrapperType, StrengthRating, ResearchDossier, SommelierRecommendation } from '../types';
import { exportResearchDatabaseToJSON, exportResearchDatabaseToCSV } from '../utils/exportUtils';
import { formatCurrency } from '../utils/currencyUtils';
import { PersonalReviewModal } from './PersonalReviewModal';

interface CigarResearchHubProps {
  cigars: Cigar[];
  researchDatabase: CigarResearchItem[];
  onUpdateResearchCigar: (cigarId: string, updates: Partial<CigarResearchItem>) => void;
  onAddCustomResearchCigar?: (cigar: CigarResearchItem) => void;
  onAddCigarFromResearch: (prefill: Partial<Cigar>) => void;
  onAddToWishlist: (item: { brand: string; name: string; vitola?: string; notes?: string }) => void;
  onLogSmokeFromResearch?: (cigarName: string, brand: string, vitola: string, wrapper: string, origin: string) => void;
  initialResearchQuery?: string;
}

export const CigarResearchHub: React.FC<CigarResearchHubProps> = ({
  cigars,
  researchDatabase,
  onUpdateResearchCigar,
  onAddCustomResearchCigar,
  onAddCigarFromResearch,
  onAddToWishlist,
  onLogSmokeFromResearch,
  initialResearchQuery,
}) => {
  // Main view tab
  const [activeMainTab, setActiveMainTab] = useState<'database' | 'dossier' | 'sommelier' | 'identify'>('database');

  // Search & Filter state for Database
  const [searchTerm, setSearchTerm] = useState(initialResearchQuery || '');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('ALL');
  const [selectedWrapperType, setSelectedWrapperType] = useState<string>('ALL');
  const [selectedStrength, setSelectedStrength] = useState<string>('ALL');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'criticRating' | 'personalRating' | 'priceAsc' | 'priceDesc' | 'brand'>('criticRating');
  const [quickFilter, setQuickFilter] = useState<'all' | 'myNotes' | 'favorites' | 'cuban' | 'nicaragua' | 'dominican'>('all');

  // Expanded card tracking for detailed tasting breakdown
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Review modal state
  const [selectedCigarForReview, setSelectedCigarForReview] = useState<CigarResearchItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

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
  const [newPriceRange, setNewPriceRange] = useState('$12.00 – $16.00');
  const [newCriticRating, setNewCriticRating] = useState<number>(92);
  const [newReviewOverview, setNewReviewOverview] = useState('');

  // AI Dossier state
  const [dossierQuery, setDossierQuery] = useState(initialResearchQuery || 'Padrón 1964 Anniversary Series Exclusivo');
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [dossierResult, setDossierResult] = useState<ResearchDossier | null>(null);
  const [dossierError, setDossierError] = useState<string | null>(null);

  // Sommelier state
  const [mood, setMood] = useState('Relaxing on backyard deck after dinner');
  const [availableTime, setAvailableTime] = useState('60-75 minutes');
  const [drinkPairing, setDrinkPairing] = useState('Bourbon (Double Oaked) or Espresso');
  const [preferenceNotes, setPreferenceNotes] = useState('Looking for rich chocolate, cedar and cream flavors with medium-full body');
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

  const strengthTypes: StrengthRating[] = ['Mild', 'Mild-Medium', 'Medium', 'Medium-Full', 'Full'];

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
        return 0;
      });
  }, [
    researchDatabase,
    searchTerm,
    selectedBrand,
    selectedOrigin,
    selectedWrapperType,
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

    const newCigar: CigarResearchItem = {
      id: `custom-res-${Date.now()}`,
      brand: newBrand.trim(),
      line: newLine.trim(),
      vitola: newVitola.trim(),
      lengthInches: 5.5,
      ringGauge: 52,
      countryOrigin: newOrigin,
      wrapper: newWrapper,
      wrapperType: newWrapperType,
      binder: 'Proprietary',
      filler: 'Proprietary Blend',
      strength: newStrength,
      body: 'Medium-Full',
      averagePrice: newAvgPrice,
      priceRange: newPriceRange || `$${newAvgPrice.toFixed(2)}`,
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
      setDossierError(err.message || 'Unable to connect to AI Sommelier. Please try again.');
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
      setSommelierError(err.message || 'Unable to generate recommendation.');
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
      setIdentifyError(err.message || 'Unable to identify cigar.');
    } finally {
      setLoadingIdentify(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="p-6 bg-[#161311] border border-[#2C2621] rounded-lg shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#13110F] text-[#D4AF37] border border-[#2C2621] text-[10px] font-semibold uppercase tracking-widest mb-2">
              <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Connoisseur Cigar Encyclopedia & Sommelier Lab</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-serif text-white font-normal">
              Cigar Research & Brand Database
            </h1>
            <p className="text-xs sm:text-sm text-[#A89F94] mt-1 max-w-3xl leading-relaxed">
              Explore a curated database of premium cigar brands, origins, wrapper varieties, average pricing, and Sommelier tasting notes. Add your personal ratings, tasting impressions, and export everything cleanly as JSON.
            </p>
          </div>

          {/* Sub-tab pills */}
          <div className="flex flex-wrap bg-[#13110F] p-1 rounded-md border border-[#2C2621] text-xs gap-1">
            <button
              onClick={() => setActiveMainTab('database')}
              className={`px-3 py-2 rounded font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeMainTab === 'database'
                  ? 'bg-[#D4AF37] text-[#0F0D0C] shadow-xs'
                  : 'text-[#A89F94] hover:text-[#E5E1DA]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Database & Library ({researchDatabase.length})</span>
            </button>
            <button
              onClick={() => setActiveMainTab('dossier')}
              className={`px-3 py-2 rounded font-medium text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeMainTab === 'dossier'
                  ? 'bg-[#D4AF37] text-[#0F0D0C] font-bold shadow-xs'
                  : 'text-[#A89F94] hover:text-[#E5E1DA]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Dossier</span>
            </button>
            <button
              onClick={() => setActiveMainTab('sommelier')}
              className={`px-3 py-2 rounded font-medium text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeMainTab === 'sommelier'
                  ? 'bg-[#D4AF37] text-[#0F0D0C] font-bold shadow-xs'
                  : 'text-[#A89F94] hover:text-[#E5E1DA]'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Sommelier Pick</span>
            </button>
            <button
              onClick={() => setActiveMainTab('identify')}
              className={`px-3 py-2 rounded font-medium text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeMainTab === 'identify'
                  ? 'bg-[#D4AF37] text-[#0F0D0C] font-bold shadow-xs'
                  : 'text-[#A89F94] hover:text-[#E5E1DA]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Band Identifier</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Main Searchable Research Database */}
      {activeMainTab === 'database' && (
        <div className="space-y-6">
          {/* Controls, Filters & JSON Export Bar */}
          <div className="p-5 bg-[#161311] border border-[#2C2621] rounded-lg space-y-4 shadow-sm">
            {/* Search Input and Export Buttons */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#A89F94] absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by brand, line, vitola, wrapper, origin, or flavor notes (e.g. Padron, Habano, Espresso, Nicaragua)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md pl-10 pr-9 py-2.5 text-xs sm:text-sm text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37] placeholder-[#A89F94]/50"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-[#A89F94] hover:text-[#E5E1DA]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* JSON & Data Export Suite Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => exportResearchDatabaseToJSON(researchDatabase, false)}
                  className="px-3.5 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] font-bold uppercase tracking-wider text-[11px] rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  title="Export complete research catalog including brand data, tasting notes, pricing, and personal reviews as JSON"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>

                <button
                  onClick={() => exportResearchDatabaseToJSON(researchDatabase, true)}
                  className="px-3 py-2 bg-[#13110F] hover:bg-[#241E1B] text-[#D4AF37] border border-[#2C2621] text-[11px] font-semibold uppercase tracking-wider rounded-md transition flex items-center gap-1.5 cursor-pointer"
                  title="Export only cigars you have rated or added notes for as JSON"
                >
                  <Star className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>My Notes (JSON)</span>
                </button>

                <button
                  onClick={() => exportResearchDatabaseToCSV(researchDatabase)}
                  className="px-3 py-2 bg-[#13110F] hover:bg-[#241E1B] text-[#A89F94] hover:text-[#E5E1DA] border border-[#2C2621] text-[11px] font-semibold uppercase tracking-wider rounded-md transition flex items-center gap-1.5 cursor-pointer"
                  title="Export database as CSV spreadsheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>

                <button
                  onClick={() => setIsAddCustomOpen(true)}
                  className="px-3 py-2 bg-[#13110F] hover:bg-[#241E1B] text-[#E5E1DA] border border-[#2C2621] text-[11px] font-semibold uppercase tracking-wider rounded-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Add Stick</span>
                </button>
              </div>
            </div>

            {/* 4 Multi-criteria Filter Dropdowns (Brand, Origin, Wrapper Type, Strength, Price) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-[#2C2621]">
              {/* 1. Brand Filter */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-[#A89F94] font-semibold mb-1">
                  Brand ({uniqueBrands.length})
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="ALL">All Brands</option>
                  {uniqueBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Origin Filter */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-[#A89F94] font-semibold mb-1">
                  Origin Country
                </label>
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="ALL">All Origins</option>
                  {uniqueOrigins.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Wrapper Type Filter */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-[#A89F94] font-semibold mb-1">
                  Wrapper Leaf
                </label>
                <select
                  value={selectedWrapperType}
                  onChange={(e) => setSelectedWrapperType(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="ALL">All Wrappers</option>
                  {wrapperTypes.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Strength Filter */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-[#A89F94] font-semibold mb-1">
                  Strength Body
                </label>
                <select
                  value={selectedStrength}
                  onChange={(e) => setSelectedStrength(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="ALL">All Strengths</option>
                  {strengthTypes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Average Price Range */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-[#A89F94] font-semibold mb-1">
                  Average Price
                </label>
                <select
                  value={selectedPriceFilter}
                  onChange={(e) => setSelectedPriceFilter(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="ALL">All Price Tiers</option>
                  <option value="under15">Under $15 (Value)</option>
                  <option value="15to25">$15 – $25 (Premium)</option>
                  <option value="25plus">$25+ (Ultra / Luxury)</option>
                </select>
              </div>

              {/* 6. Sort by */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-[#A89F94] font-semibold mb-1">
                  Sort Order
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="criticRating">★ Critic Rating (High→Low)</option>
                  <option value="personalRating">⭐ My Rating (High→Low)</option>
                  <option value="priceAsc">💲 Avg Price (Low→High)</option>
                  <option value="priceDesc">💲 Avg Price (High→Low)</option>
                  <option value="brand">🔤 Brand Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Quick Segment Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-[#A89F94] font-semibold uppercase tracking-wider mr-1">Quick Views:</span>
              <button
                onClick={() => setQuickFilter('all')}
                className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                  quickFilter === 'all'
                    ? 'bg-[#D4AF37] text-[#0F0D0C] font-bold'
                    : 'bg-[#13110F] text-[#A89F94] border border-[#2C2621] hover:text-[#E5E1DA]'
                }`}
              >
                All Cigars ({researchDatabase.length})
              </button>
              <button
                onClick={() => setQuickFilter('myNotes')}
                className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                  quickFilter === 'myNotes'
                    ? 'bg-[#D4AF37] text-[#0F0D0C] font-bold'
                    : 'bg-[#13110F] text-[#A89F94] border border-[#2C2621] hover:text-[#E5E1DA]'
                }`}
              >
                <Star className="w-3 h-3 text-[#D4AF37]" />
                <span>My Rated & Noted ({researchDatabase.filter((c) => c.personalRating || c.personalNotes).length})</span>
              </button>
              <button
                onClick={() => setQuickFilter('favorites')}
                className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                  quickFilter === 'favorites'
                    ? 'bg-[#D4AF37] text-[#0F0D0C] font-bold'
                    : 'bg-[#13110F] text-[#A89F94] border border-[#2C2621] hover:text-[#E5E1DA]'
                }`}
              >
                <Heart className="w-3 h-3 text-red-400" />
                <span>Favorites ({researchDatabase.filter((c) => c.personalFavorite).length})</span>
              </button>
              <button
                onClick={() => setQuickFilter('cuban')}
                className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                  quickFilter === 'cuban'
                    ? 'bg-[#D4AF37] text-[#0F0D0C] font-bold'
                    : 'bg-[#13110F] text-[#A89F94] border border-[#2C2621] hover:text-[#E5E1DA]'
                }`}
              >
                🇨🇺 Cuban Classics
              </button>
              <button
                onClick={() => setQuickFilter('nicaragua')}
                className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                  quickFilter === 'nicaragua'
                    ? 'bg-[#D4AF37] text-[#0F0D0C] font-bold'
                    : 'bg-[#13110F] text-[#A89F94] border border-[#2C2621] hover:text-[#E5E1DA]'
                }`}
              >
                🇳🇮 Nicaraguan Blends
              </button>
              <button
                onClick={() => setQuickFilter('dominican')}
                className={`text-[10px] px-2.5 py-1 rounded transition cursor-pointer ${
                  quickFilter === 'dominican'
                    ? 'bg-[#D4AF37] text-[#0F0D0C] font-bold'
                    : 'bg-[#13110F] text-[#A89F94] border border-[#2C2621] hover:text-[#E5E1DA]'
                }`}
              >
                🇩🇴 Dominican Legends
              </button>

              {(selectedBrand !== 'ALL' || selectedOrigin !== 'ALL' || selectedWrapperType !== 'ALL' || selectedStrength !== 'ALL' || selectedPriceFilter !== 'ALL' || searchTerm) && (
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
                  className="text-[10px] px-2 py-0.5 text-red-400 hover:underline ml-auto cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>
          </div>

          {/* Results Count Header */}
          <div className="flex items-center justify-between text-xs text-[#A89F94] px-1">
            <span>
              Showing <strong className="text-[#E5E1DA]">{filteredDatabase.length}</strong> of {researchDatabase.length} researched cigars
            </span>
            <span>
              Average Catalog Price: <strong className="text-[#D4AF37]">{formatCurrency(filteredDatabase.reduce((acc, c) => acc + c.averagePrice, 0) / (filteredDatabase.length || 1), '£')}</strong>
            </span>
          </div>

          {/* Empty State */}
          {filteredDatabase.length === 0 && (
            <div className="p-12 text-center bg-[#161311] border border-[#2C2621] rounded-lg space-y-3">
              <Search className="w-8 h-8 text-[#A89F94] mx-auto opacity-50" />
              <h3 className="text-base font-serif text-[#E5E1DA]">No cigars found matching criteria</h3>
              <p className="text-xs text-[#A89F94] max-w-md mx-auto">
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
                className="px-4 py-2 bg-[#13110F] hover:bg-[#241E1B] text-[#D4AF37] border border-[#2C2621] rounded text-xs uppercase tracking-wider font-semibold transition cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Cigar Cards List */}
          <div className="grid grid-cols-1 gap-5">
            {filteredDatabase.map((cigar) => {
              const isExpanded = !!expandedCards[cigar.id];

              return (
                <div
                  key={cigar.id}
                  className="bg-[#161311] border border-[#2C2621] hover:border-[#3D352E] rounded-lg p-5 sm:p-6 transition shadow-xs flex flex-col justify-between space-y-5"
                >
                  {/* Top Bar: Brand, Line, Origin, Avg Price, Ratings */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-[#2C2621] pb-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
                          {cigar.brand}
                        </span>
                        <span className="text-[#3D352E]">•</span>
                        <span className="text-xs text-[#E5E1DA] font-medium flex items-center gap-1">
                          <Globe className="w-3 h-3 text-[#A89F94]" />
                          <span>{cigar.countryOrigin}</span>
                          {cigar.isCuban && <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50">Habanos Puro</span>}
                        </span>
                        <span className="text-[#3D352E]">•</span>
                        <span className="text-xs text-[#A89F94] font-mono">
                          {cigar.vitola} ({cigar.lengthInches}" x {cigar.ringGauge} RG)
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-serif text-white font-medium">
                        {cigar.line}
                      </h2>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#13110F] text-[#E5E1DA] border border-[#2C2621]">
                          🌿 Wrapper: <strong className="text-[#D4AF37]">{cigar.wrapperType}</strong> ({cigar.wrapper})
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#13110F] text-[#E5E1DA] border border-[#2C2621]">
                          🔥 Strength: <strong className="text-[#E5E1DA]">{cigar.strength}</strong>
                        </span>
                        {cigar.masterBlender && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#13110F] text-[#A89F94] border border-[#2C2621]">
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
                          <div className="text-[10px] uppercase tracking-wider text-[#A89F94] font-semibold">
                            Average Price
                          </div>
                          <div className="text-lg sm:text-xl font-serif font-bold text-[#D4AF37]">
                            {formatCurrency(cigar.averagePrice, '£')}
                          </div>
                          <div className="text-[10px] text-[#A89F94]">{cigar.priceRange}</div>
                        </div>

                        {/* Critic Score Badge */}
                        <div className="p-2 sm:px-3 sm:py-2 bg-[#13110F] border border-[#2C2621] rounded-md text-center">
                          <div className="text-[9px] uppercase tracking-wider text-[#A89F94]">Critic Score</div>
                          <div className="text-base sm:text-lg font-serif font-bold text-white flex items-center justify-center gap-1">
                            <span className="text-[#D4AF37]">★</span> {cigar.criticRating}
                            <span className="text-[10px] text-[#A89F94]">/100</span>
                          </div>
                        </div>

                        {/* User Rating Badge (if user has rated) */}
                        {cigar.personalRating ? (
                          <div className="p-2 sm:px-3 sm:py-2 bg-[#1C1816] border border-[#D4AF37]/50 rounded-md text-center">
                            <div className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-semibold">My Rating</div>
                            <div className="text-base sm:text-lg font-serif font-bold text-white flex items-center justify-center gap-0.5">
                              <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                              <span>{cigar.personalRating}</span>
                              <span className="text-[10px] text-[#A89F94]">/100</span>
                            </div>
                          </div>
                        ) : null}

                        {/* Favorite Button */}
                        <button
                          onClick={() => handleToggleCardFavorite(cigar)}
                          className={`p-2 rounded border transition cursor-pointer ${
                            cigar.personalFavorite
                              ? 'bg-red-950/40 border-red-800 text-red-400'
                              : 'bg-[#13110F] border-[#2C2621] text-[#A89F94] hover:text-red-400'
                          }`}
                          title={cigar.personalFavorite ? 'Marked as Favorite' : 'Add to Favorites'}
                        >
                          <Heart className={`w-4 h-4 ${cigar.personalFavorite ? 'fill-red-400' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Critic Review & Tasting Notes Section */}
                  <div className="space-y-3">
                    <div className="p-3.5 bg-[#13110F] border border-[#2C2621] rounded-md text-xs sm:text-sm text-[#E5E1DA] font-serif italic leading-relaxed">
                      "{cigar.reviewTastingNotes?.overview}"
                      {cigar.reviewTastingNotes?.criticQuote && (
                        <div className="mt-1 text-xs text-[#D4AF37] not-italic font-sans">
                          — Critic Consensus: <em>{cigar.reviewTastingNotes.criticQuote}</em>
                        </div>
                      )}
                    </div>

                    {/* Dominant Flavor Tags Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-[#A89F94] font-semibold uppercase tracking-wider mr-1">
                        Tasting Profile:
                      </span>
                      {(cigar.reviewTastingNotes?.dominantFlavorTags || []).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2.5 py-0.5 rounded bg-[#13110F] text-[#E5E1DA] border border-[#2C2621]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Expandable 3-Thirds Progression & Blend Details */}
                    {isExpanded && (
                      <div className="space-y-4 pt-3 border-t border-[#2C2621]">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-[#13110F] border border-[#2C2621] rounded-md text-xs space-y-1">
                            <strong className="text-[#D4AF37] text-[11px] font-semibold uppercase tracking-wider block">
                              1st Third (Initial Light)
                            </strong>
                            <p className="text-[#E5E1DA] leading-relaxed">
                              {cigar.reviewTastingNotes?.firstThird || 'Cedar, white pepper, and light cocoa.'}
                            </p>
                          </div>
                          <div className="p-3 bg-[#13110F] border border-[#2C2621] rounded-md text-xs space-y-1">
                            <strong className="text-[#D4AF37] text-[11px] font-semibold uppercase tracking-wider block">
                              2nd Third (Sweet Spot)
                            </strong>
                            <p className="text-[#E5E1DA] leading-relaxed">
                              {cigar.reviewTastingNotes?.secondThird || 'Caramel sweetness, espresso crema, and leather.'}
                            </p>
                          </div>
                          <div className="p-3 bg-[#13110F] border border-[#2C2621] rounded-md text-xs space-y-1">
                            <strong className="text-[#D4AF37] text-[11px] font-semibold uppercase tracking-wider block">
                              Final Third (The Nub)
                            </strong>
                            <p className="text-[#E5E1DA] leading-relaxed">
                              {cigar.reviewTastingNotes?.finalThird || 'Dark chocolate fudge, toasted nuts, and oak.'}
                            </p>
                          </div>
                        </div>

                        {/* Pairings & Factory */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-[#13110F] border border-[#2C2621] rounded-md space-y-1">
                            <strong className="text-[#D4AF37] text-[10px] uppercase tracking-wider flex items-center gap-1">
                              <Coffee className="w-3 h-3" />
                              <span>Sommelier Drink Pairings:</span>
                            </strong>
                            <div className="text-[#E5E1DA]">
                              {(cigar.recommendedPairings || []).join(' • ') || 'Bourbon, Espresso, Single Malt Scotch'}
                            </div>
                          </div>

                          <div className="p-3 bg-[#13110F] border border-[#2C2621] rounded-md space-y-1">
                            <strong className="text-[#D4AF37] text-[10px] uppercase tracking-wider block">
                              Factory Terroir & Aging Window:
                            </strong>
                            <div className="text-[#E5E1DA]">
                              {cigar.factoryTerroir || 'Tabacalera Private Reserve'} • Recommended Aging:{' '}
                              <strong>{cigar.agingWindowMonths || 6} months</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* USER-SPECIFIC SECTION: Personal Connoisseur Rating & Notes */}
                  <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-lg space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1">
                          <Edit3 className="w-3 h-3 text-[#D4AF37]" />
                          <span>Personal Notes & Connoisseur Rating</span>
                        </span>
                        {cigar.personalWouldRebuy && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-[#1C1816] text-[#D4AF37] border border-[#2C2621]">
                            Verdict: {cigar.personalWouldRebuy}
                          </span>
                        )}
                        {cigar.personalTried && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-[#1C1816] text-[#E5E1DA] border border-[#2C2621]">
                            ✓ Tried / Smoked
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCigarForReview(cigar);
                          setIsReviewModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-[#1C1816] hover:bg-[#241E1B] text-[#D4AF37] border border-[#2C2621] hover:border-[#D4AF37]/50 rounded text-[10px] font-semibold uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{cigar.personalNotes || cigar.personalRating ? 'Edit My Review' : '+ Add Personal Rating & Notes'}</span>
                      </button>
                    </div>

                    {/* Display Personal Notes if available */}
                    {cigar.personalNotes || cigar.personalRating ? (
                      <div className="space-y-1.5 text-xs text-[#E5E1DA]">
                        {cigar.personalNotes && (
                          <p className="italic text-[#E5E1DA]/90 bg-[#161311] p-2.5 rounded border border-[#2C2621]/60">
                            "{cigar.personalNotes}"
                          </p>
                        )}
                        {cigar.personalPairingNotes && (
                          <div className="text-[11px] text-[#A89F94]">
                            <strong className="text-[#D4AF37]">My Pairing:</strong> {cigar.personalPairingNotes}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#A89F94]/70 italic">
                        No personal tasting notes logged yet. Click "+ Add Personal Rating & Notes" to record your score and impressions.
                      </p>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2C2621]">
                    <button
                      onClick={() => toggleCardExpansion(cigar.id)}
                      className="text-[11px] text-[#A89F94] hover:text-[#E5E1DA] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Hide 3-Thirds Progression</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 text-[#D4AF37]" />
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
                        className="px-3 py-1.5 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] font-bold text-[10px] uppercase tracking-wider rounded transition flex items-center gap-1 cursor-pointer"
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
                            notes: `Avg Price: $${cigar.averagePrice.toFixed(2)}. ${cigar.reviewTastingNotes?.overview || ''}`,
                          })
                        }
                        className="px-2.5 py-1.5 bg-[#13110F] hover:bg-[#241E1B] text-[#E5E1DA] border border-[#2C2621] text-[10px] font-semibold uppercase tracking-wider rounded transition flex items-center gap-1 cursor-pointer"
                        title="Add to Wishlist"
                      >
                        <Bookmark className="w-3 h-3 text-[#D4AF37]" />
                        <span>Wishlist</span>
                      </button>

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
                          className="px-2.5 py-1.5 bg-[#13110F] hover:bg-[#241E1B] text-[#E5E1DA] border border-[#2C2621] text-[10px] font-semibold uppercase tracking-wider rounded transition flex items-center gap-1 cursor-pointer"
                          title="Log a Tasting Smoke Session"
                        >
                          <Flame className="w-3 h-3 text-amber-500" />
                          <span>Smoke</span>
                        </button>
                      )}

                      {/* AI Dossier Lookup */}
                      <button
                        onClick={() => {
                          setDossierQuery(`${cigar.brand} ${cigar.line} ${cigar.vitola}`);
                          setActiveMainTab('dossier');
                          handleLookupDossier(`${cigar.brand} ${cigar.line} ${cigar.vitola}`);
                        }}
                        className="px-2.5 py-1.5 bg-[#13110F] hover:bg-[#241E1B] text-[#D4AF37] border border-[#2C2621] text-[10px] font-semibold uppercase tracking-wider rounded transition flex items-center gap-1 cursor-pointer"
                        title="Run Deep Live Gemini AI Dossier Analysis"
                      >
                        <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                        <span>AI Dossier</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: AI Connoisseur Dossier Lookup */}
      {activeMainTab === 'dossier' && (
        <div className="space-y-6">
          <div className="p-5 bg-[#161311] border border-[#2C2621] rounded-lg space-y-3 shadow-sm">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#D4AF37]">
              Deep Live Connoisseur Dossier Engine (Gemini 3.7 AI)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#A89F94] absolute left-3 top-3" />
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
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md pl-9 pr-3 py-2.5 text-xs sm:text-sm text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37] placeholder-[#A89F94]/50"
                />
              </div>
              <button
                onClick={() => handleLookupDossier()}
                disabled={loadingDossier}
                className="px-5 py-2.5 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] font-bold uppercase tracking-wider rounded-md text-xs shadow-sm transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loadingDossier ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0F0D0C]" />
                    <span>Researching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#0F0D0C]" />
                    <span>Generate Dossier</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {dossierError && (
            <div className="p-4 bg-[#2C1515] border border-red-800/80 rounded-lg text-xs text-red-200">
              {dossierError}
            </div>
          )}

          {dossierResult && (
            <div className="bg-[#161311] border border-[#2C2621] rounded-lg p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#2C2621] pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                      {dossierResult.brand}
                    </span>
                    <span className="text-[#3D352E]">•</span>
                    <span className="text-xs text-[#E5E1DA]">{dossierResult.countryOrigin}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-white font-normal mt-1">
                    {dossierResult.cigarName}
                  </h2>
                  <div className="text-xs text-[#A89F94] mt-1">
                    Vitola: <strong className="text-[#E5E1DA]">{dossierResult.vitolaCommon || 'Robusto'}</strong>{' '}
                    {dossierResult.lengthInches ? `• ${dossierResult.lengthInches}"` : ''}{' '}
                    {dossierResult.ringGauge ? `• ${dossierResult.ringGauge} RG` : ''} • Master Blender:{' '}
                    <strong className="text-[#E5E1DA]">{dossierResult.masterBlender || 'Master Blending Team'}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
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
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] rounded font-bold uppercase tracking-wider text-[10px] shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Humidor</span>
                  </button>

                  <button
                    onClick={() =>
                      onAddToWishlist({
                        brand: dossierResult.brand,
                        name: dossierResult.cigarName,
                        vitola: dossierResult.vitolaCommon,
                        notes: dossierResult.summary,
                      })
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#13110F] hover:bg-[#241E1B] text-[#E5E1DA] border border-[#2C2621] rounded text-[10px] uppercase tracking-wider font-semibold transition cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Add to Wishlist</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-md">
                <p className="text-xs sm:text-sm text-[#E5E1DA] leading-relaxed font-serif italic">
                  "{dossierResult.summary}"
                </p>
              </div>

              {/* Tobacco Blend */}
              <div>
                <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[#D4AF37] mb-3">
                  Tobacco Blend & Terroir
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#13110F] border border-[#2C2621] rounded-md">
                    <span className="text-[#A89F94] text-[10px] uppercase tracking-wider block">Wrapper Leaf</span>
                    <strong className="text-[#E5E1DA] text-xs sm:text-sm font-serif">{dossierResult.wrapper}</strong>
                  </div>
                  <div className="p-3 bg-[#13110F] border border-[#2C2621] rounded-md">
                    <span className="text-[#A89F94] text-[10px] uppercase tracking-wider block">Binder</span>
                    <strong className="text-[#E5E1DA] text-xs sm:text-sm font-serif">
                      {dossierResult.binder || 'Proprietary'}
                    </strong>
                  </div>
                  <div className="p-3 bg-[#13110F] border border-[#2C2621] rounded-md">
                    <span className="text-[#A89F94] text-[10px] uppercase tracking-wider block">Filler</span>
                    <strong className="text-[#E5E1DA] text-xs sm:text-sm font-serif">
                      {dossierResult.filler || 'Proprietary Blend'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 3-Thirds Flavor Progression */}
              <div>
                <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[#D4AF37] mb-3">
                  💨 3-Thirds Flavor Progression Curve
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-md space-y-2">
                    <strong className="text-[#D4AF37] text-xs font-serif font-semibold">1st Third (Initial Light)</strong>
                    <p className="text-xs text-[#E5E1DA] leading-relaxed">
                      {dossierResult.flavorTransitions.firstThird.overview}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {dossierResult.flavorTransitions.firstThird.keyNotes.map((note) => (
                        <span
                          key={note}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#161311] text-[#E5E1DA] border border-[#2C2621]"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-md space-y-2">
                    <strong className="text-[#D4AF37] text-xs font-serif font-semibold">2nd Third (Sweet Spot)</strong>
                    <p className="text-xs text-[#E5E1DA] leading-relaxed">
                      {dossierResult.flavorTransitions.secondThird.overview}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {dossierResult.flavorTransitions.secondThird.keyNotes.map((note) => (
                        <span
                          key={note}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#161311] text-[#E5E1DA] border border-[#2C2621]"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-md space-y-2">
                    <strong className="text-[#D4AF37] text-xs font-serif font-semibold">Final Third (Nub & Finish)</strong>
                    <p className="text-xs text-[#E5E1DA] leading-relaxed">
                      {dossierResult.flavorTransitions.finalThird.overview}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {dossierResult.flavorTransitions.finalThird.keyNotes.map((note) => (
                        <span
                          key={note}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#161311] text-[#E5E1DA] border border-[#2C2621]"
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
                <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[#D4AF37] mb-3 flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Sommelier Beverage Pairings</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dossierResult.idealPairings.map((pairing, idx) => (
                    <div key={idx} className="p-3.5 bg-[#13110F] border border-[#2C2621] rounded-md text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-[#D4AF37] font-semibold">{pairing.beverageName}</strong>
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#161311] text-[#A89F94] border border-[#2C2621]">
                          {pairing.category}
                        </span>
                      </div>
                      <p className="text-[#E5E1DA] text-xs leading-relaxed">{pairing.whyItWorks}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: "What to Smoke Tonight?" Sommelier */}
      {activeMainTab === 'sommelier' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#161311] border border-[#2C2621] rounded-lg space-y-4 shadow-sm">
            <h2 className="text-lg font-serif text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Personal Cigar Sommelier Recommendation</span>
            </h2>
            <p className="text-xs text-[#A89F94]">
              Tell the Sommelier your mood, available smoking time, and tonight's beverage. We'll cross-reference
              your current humidor inventory to select the ideal stick.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[#A89F94] mb-1">Occasion / Setting</label>
                <input
                  type="text"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder="e.g. Porch after steak dinner, celebration"
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#A89F94] mb-1">Available Smoke Time</label>
                <select
                  value={availableTime}
                  onChange={(e) => setAvailableTime(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="30-45 minutes (Petit Corona / Corona)">30-45 minutes (Quick / Small vitola)</option>
                  <option value="60-75 minutes (Robusto / Toro)">60-75 minutes (Robusto / Toro standard)</option>
                  <option value="90-120 minutes (Churchill / Double Corona)">90-120 minutes (Churchill / Long lounge)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#A89F94] mb-1">Beverage in Glass</label>
                <input
                  type="text"
                  value={drinkPairing}
                  onChange={(e) => setDrinkPairing(e.target.value)}
                  placeholder="e.g. Woodford Reserve Double Oaked, Espresso, Rum"
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#A89F94] mb-1">Flavor Notes or Strength Preference</label>
              <input
                type="text"
                value={preferenceNotes}
                onChange={(e) => setPreferenceNotes(e.target.value)}
                placeholder="e.g. Want rich dark chocolate and baking spices, medium-full body"
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>

            <button
              onClick={handleRunSommelier}
              disabled={loadingSommelier}
              className="px-6 py-2.5 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] font-bold uppercase tracking-wider rounded-md text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              {loadingSommelier ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F0D0C]" />
                  <span>Consulting Sommelier...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#0F0D0C]" />
                  <span>Recommend Tonight's Smoke</span>
                </>
              )}
            </button>
          </div>

          {sommelierError && (
            <div className="p-4 bg-[#2C1515] border border-red-800/80 rounded-lg text-xs text-red-200">
              {sommelierError}
            </div>
          )}

          {sommelierResult && (
            <div className="bg-[#161311] border border-[#2C2621] rounded-lg p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-md text-xs sm:text-sm text-[#E5E1DA] font-serif italic leading-relaxed">
                "{sommelierResult.sommelierGreeting}"
              </div>

              {sommelierResult.humidorPick && (
                <div className="p-5 bg-[#13110F] border border-[#D4AF37]/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Top Choice from Your Humidor</span>
                    </span>
                    <span className="text-xs text-[#A89F94]">
                      ⏱️ {sommelierResult.humidorPick.expectedSmokeDuration}
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-white">
                    {sommelierResult.humidorPick.cigarName}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#E5E1DA] leading-relaxed">
                    {sommelierResult.humidorPick.reason}
                  </p>

                  <div className="p-3 bg-[#161311] rounded border border-[#2C2621] text-xs text-[#E5E1DA]">
                    <strong className="text-[#D4AF37]">🥃 Pairing Advice:</strong>{' '}
                    {sommelierResult.humidorPick.pairingAdvice}
                  </div>
                </div>
              )}

              {/* Curated Recommendations */}
              <div>
                <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[#D4AF37] mb-3">
                  ★ Curated Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {sommelierResult.curatedRecommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-4 bg-[#13110F] border border-[#2C2621] rounded-lg space-y-2 text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-[#D4AF37] font-bold uppercase text-[10px] tracking-wider">{rec.brand}</div>
                        <div className="font-serif font-semibold text-white text-sm">{rec.cigarName}</div>
                        <div className="text-[#A89F94] text-[11px]">
                          {rec.vitola} • {rec.strength}
                        </div>
                        <p className="text-[#E5E1DA] text-xs mt-2 leading-relaxed">{rec.whyItFits}</p>
                      </div>

                      <div className="pt-3 border-t border-[#2C2621] flex items-center justify-between">
                        <button
                          onClick={() => {
                            setDossierQuery(`${rec.brand} ${rec.cigarName}`);
                            setActiveMainTab('dossier');
                            handleLookupDossier(`${rec.brand} ${rec.cigarName}`);
                          }}
                          className="text-xs text-[#D4AF37] hover:underline font-semibold cursor-pointer"
                        >
                          View Full Dossier →
                        </button>
                        <button
                          onClick={() =>
                            onAddToWishlist({
                              brand: rec.brand,
                              name: rec.cigarName,
                              vitola: rec.vitola,
                              notes: rec.whyItFits,
                            })
                          }
                          className="p-1 text-[#A89F94] hover:text-[#D4AF37] cursor-pointer"
                          title="Save to Wishlist"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Cigar Band Identifier */}
      {activeMainTab === 'identify' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#161311] border border-[#2C2621] rounded-lg space-y-4 shadow-sm">
            <h2 className="text-lg font-serif text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#D4AF37]" />
              <span>Cigar & Band Identification Assistant</span>
            </h2>
            <p className="text-xs text-[#A89F94]">
              Have an unbanded or mysterious stick? Describe the embossed band colors, typography, logos, and
              wrapper shade to narrow down probable makers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#A89F94] mb-1">
                  Band Visuals / Embossed Symbols / Font Markings
                </label>
                <textarea
                  rows={3}
                  value={bandDescription}
                  onChange={(e) => setBandDescription(e.target.value)}
                  placeholder="e.g. Red and gold band with a crowned lion, says 1926 on the side..."
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#A89F94] mb-1">Wrapper Shade & Texture</label>
                <input
                  type="text"
                  value={wrapperColor}
                  onChange={(e) => setWrapperColor(e.target.value)}
                  placeholder="e.g. Dark oily maduro with toothy texture, silky golden connecticut"
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <button
              onClick={handleIdentifyCigar}
              disabled={loadingIdentify}
              className="px-5 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] font-bold uppercase tracking-wider rounded-md text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              {loadingIdentify ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F0D0C]" />
                  <span>Identifying Matches...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-[#0F0D0C]" />
                  <span>Identify Possible Cigars</span>
                </>
              )}
            </button>
          </div>

          {identifyError && (
            <div className="p-4 bg-[#2C1515] border border-red-800/80 rounded-lg text-xs text-red-200">
              {identifyError}
            </div>
          )}

          {identifyResult && (
            <div className="bg-[#161311] border border-[#2C2621] rounded-lg p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-serif text-white">Probable Matches Identified</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {identifyResult.matches.map((m: any, i: number) => (
                  <div key={i} className="p-4 bg-[#13110F] border border-[#2C2621] rounded-lg space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#D4AF37] uppercase text-[10px] tracking-wider">{m.brand}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#161311] text-[#A89F94] border border-[#2C2621]">
                        {m.confidence} match
                      </span>
                    </div>
                    <div className="font-serif font-semibold text-white text-sm">{m.line}</div>
                    <div className="text-[#A89F94] text-[11px]">
                      Wrapper: <strong className="text-[#E5E1DA]">{m.wrapper}</strong> ({m.origin})
                    </div>
                    <p className="text-[#E5E1DA] text-xs leading-relaxed mt-1">{m.keyFeatures}</p>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setDossierQuery(`${m.brand} ${m.line}`);
                          setActiveMainTab('dossier');
                          handleLookupDossier(`${m.brand} ${m.line}`);
                        }}
                        className="text-xs text-[#D4AF37] hover:underline font-semibold cursor-pointer"
                      >
                        Research This Stick →
                      </button>
                    </div>
                  </div>
                ))}
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
          <div className="relative w-full max-w-lg bg-[#1C1816] border border-[#2C2621] rounded-lg shadow-2xl overflow-hidden text-[#E5E1DA]">
            <div className="px-6 py-4 bg-[#13110F] border-b border-[#2C2621] flex items-center justify-between">
              <h2 className="text-base font-serif font-semibold text-[#E5E1DA]">Add Custom Cigar to Database</h2>
              <button
                onClick={() => setIsAddCustomOpen(false)}
                className="text-[#A89F94] hover:text-[#E5E1DA] p-1.5 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomCigar} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#A89F94] uppercase tracking-wider mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="e.g. Illusione, Warped"
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded px-3 py-2 text-xs text-[#E5E1DA]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#A89F94] uppercase tracking-wider mb-1">Line / Blend *</label>
                  <input
                    type="text"
                    required
                    value={newLine}
                    onChange={(e) => setNewLine(e.target.value)}
                    placeholder="e.g. Epernay Le Ferme"
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded px-3 py-2 text-xs text-[#E5E1DA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#A89F94] uppercase tracking-wider mb-1">Vitola</label>
                  <input
                    type="text"
                    value={newVitola}
                    onChange={(e) => setNewVitola(e.target.value)}
                    placeholder="e.g. Robusto, Toro"
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded px-3 py-2 text-xs text-[#E5E1DA]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#A89F94] uppercase tracking-wider mb-1">Origin Country</label>
                  <select
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded px-3 py-2 text-xs text-[#E5E1DA]"
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
                  <label className="block text-[10px] text-[#A89F94] uppercase tracking-wider mb-1">Wrapper Type</label>
                  <select
                    value={newWrapperType}
                    onChange={(e) => {
                      setNewWrapperType(e.target.value as any);
                      setNewWrapper(e.target.value);
                    }}
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded px-3 py-2 text-xs text-[#E5E1DA]"
                  >
                    {wrapperTypes.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#A89F94] uppercase tracking-wider mb-1">Strength</label>
                  <select
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value as any)}
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded px-3 py-2 text-xs text-[#E5E1DA]"
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
                  <label className="block text-[10px] text-[#A89F94] uppercase tracking-wider mb-1">Average Price ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newAvgPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setNewAvgPrice(val);
                      setNewPriceRange(`$${(val * 0.9).toFixed(2)} – $${(val * 1.15).toFixed(2)}`);
                    }}
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded px-3 py-2 text-xs text-[#E5E1DA]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#A89F94] uppercase tracking-wider mb-1">Critic Rating (1-100)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={newCriticRating}
                    onChange={(e) => setNewCriticRating(parseInt(e.target.value, 10))}
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded px-3 py-2 text-xs text-[#E5E1DA]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#A89F94] uppercase tracking-wider mb-1">Tasting Notes Overview</label>
                <textarea
                  rows={2}
                  value={newReviewOverview}
                  onChange={(e) => setNewReviewOverview(e.target.value)}
                  placeholder="e.g. Silky draw with cedar, toasted almonds, and sweet vanilla cream..."
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded p-2.5 text-xs text-[#E5E1DA]"
                />
              </div>

              <div className="pt-3 border-t border-[#2C2621] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomOpen(false)}
                  className="px-4 py-2 bg-[#13110F] hover:bg-[#241E1B] text-[#A89F94] rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#D4AF37] text-[#0F0D0C] font-bold rounded text-xs uppercase tracking-wider"
                >
                  Save to Research DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
