import React, { useState, useMemo } from 'react';
import {
  Flame,
  Star,
  Coffee,
  Calendar,
  MapPin,
  Clock,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Eye,
  Check,
  Save,
  Tag,
  X,
  Search,
} from 'lucide-react';
import { SmokeLog, Cigar, AppSettings } from '../types';

interface SmokeJournalProps {
  logs: SmokeLog[];
  cigars: Cigar[];
  settings?: AppSettings;
  onOpenLogSmoke?: () => void;
  onEditLog: (log: SmokeLog) => void;
  onDeleteLog: (logId: string) => void;
  onUpdateLogDirectly?: (logId: string, updates: Partial<SmokeLog>) => void;
}

export const SmokeJournal: React.FC<SmokeJournalProps> = ({
  logs,
  cigars,
  settings,
  onOpenLogSmoke,
  onEditLog,
  onDeleteLog,
  onUpdateLogDirectly,
}) => {
  // Search and filter states with persistence
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_journal_search') || '';
    } catch {
      return '';
    }
  });

  const [ratingFilter, setRatingFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_journal_rating_filter') || 'all';
    } catch {
      return 'all';
    }
  });

  const [rebuyFilter, setRebuyFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_journal_rebuy_filter') || 'all';
    } catch {
      return 'all';
    }
  });

  const [brandFilter, setBrandFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_journal_brand_filter') || 'all';
    } catch {
      return 'all';
    }
  });

  const [vitolaFilter, setVitolaFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_journal_vitola_filter') || 'all';
    } catch {
      return 'all';
    }
  });

  const [wrapperFilter, setWrapperFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_journal_wrapper_filter') || 'all';
    } catch {
      return 'all';
    }
  });

  const [durationFilter, setDurationFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_journal_duration_filter') || 'all';
    } catch {
      return 'all';
    }
  });

  const [cutTypeFilter, setCutTypeFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_journal_cut_filter') || 'all';
    } catch {
      return 'all';
    }
  });

  const [sortBy, setSortBy] = useState<string>(() => {
    try {
      return localStorage.getItem('the_humidor_journal_sort_by') || 'date-desc';
    } catch {
      return 'date-desc';
    }
  });

  const [expandedLogId, setExpandedLogId] = useState<string | null>(logs[0]?.id || null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // View Mode: Cards or Database Table with persistence
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_journal_view_mode');
      if (saved === 'cards' || saved === 'table') return saved;
    } catch {}
    return 'cards';
  });

  // Inline Display Settings with persistence
  const [showDisplayOptions, setShowDisplayOptions] = useState<boolean>(() => {
    try {
      return localStorage.getItem('the_humidor_journal_show_display_options') === 'true';
    } catch {
      return false;
    }
  });

  const [displayFields, setDisplayFields] = useState(() => {
    const defaultFields = {
      dateAndLocation: settings?.journalFieldVisibility?.dateAndLocation ?? true,
      scoreAndStars: settings?.journalFieldVisibility?.scoreAndStars ?? true,
      vitolaAndWrapper: settings?.journalFieldVisibility?.vitolaAndWrapper ?? true,
      duration: settings?.journalFieldVisibility?.duration ?? true,
      pairing: settings?.journalFieldVisibility?.pairing ?? true,
      rebuyVerdict: settings?.journalFieldVisibility?.rebuyVerdict ?? true,
      flavorsAndNotes: settings?.journalFieldVisibility?.flavorsAndNotes ?? true,
      burnAndDraw: settings?.journalFieldVisibility?.burnAndDraw ?? true,
    };
    try {
      const saved = localStorage.getItem('the_humidor_journal_display_fields');
      if (saved) {
        return { ...defaultFields, ...JSON.parse(saved) };
      }
    } catch {}
    return defaultFields;
  });

  // Sync settings when parent changes
  React.useEffect(() => {
    if (settings?.journalFieldVisibility) {
      setDisplayFields((prev) => ({
        ...prev,
        ...settings.journalFieldVisibility,
      }));
    }
  }, [settings?.journalFieldVisibility]);

  // Sync state to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_journal_search', searchQuery);
    } catch {}
  }, [searchQuery]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_journal_rating_filter', ratingFilter);
    } catch {}
  }, [ratingFilter]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_journal_rebuy_filter', rebuyFilter);
    } catch {}
  }, [rebuyFilter]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_journal_brand_filter', brandFilter);
    } catch {}
  }, [brandFilter]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_journal_vitola_filter', vitolaFilter);
    } catch {}
  }, [vitolaFilter]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_journal_wrapper_filter', wrapperFilter);
    } catch {}
  }, [wrapperFilter]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_journal_duration_filter', durationFilter);
    } catch {}
  }, [durationFilter]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_journal_cut_filter', cutTypeFilter);
    } catch {}
  }, [cutTypeFilter]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_journal_sort_by', sortBy);
    } catch {}
  }, [sortBy]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_journal_view_mode', viewMode);
    } catch {}
  }, [viewMode]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_journal_show_display_options', String(showDisplayOptions));
    } catch {}
  }, [showDisplayOptions]);

  React.useEffect(() => {
    try {
      localStorage.setItem('the_humidor_journal_display_fields', JSON.stringify(displayFields));
    } catch {}
  }, [displayFields]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setRatingFilter('all');
    setRebuyFilter('all');
    setBrandFilter('all');
    setVitolaFilter('all');
    setWrapperFilter('all');
    setDurationFilter('all');
    setCutTypeFilter('all');
    setSortBy('date-desc');
  };

  // Unique sets from logs
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.cigarBrand && l.cigarBrand.trim()) set.add(l.cigarBrand.trim());
    });
    return Array.from(set).sort();
  }, [logs]);

  const availableVitolas = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.vitola && l.vitola.trim()) set.add(l.vitola.trim());
    });
    return Array.from(set).sort();
  }, [logs]);

  const availableWrappers = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.wrapper && l.wrapper.trim()) set.add(l.wrapper.trim());
    });
    return Array.from(set).sort();
  }, [logs]);

  // Inline table editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [inlineScore, setInlineScore] = useState<number>(90);
  const [inlineStars, setInlineStars] = useState<number>(4.5);
  const [inlinePairing, setInlinePairing] = useState<string>('');
  const [inlineLocation, setInlineLocation] = useState<string>('');
  const [inlineRebuy, setInlineRebuy] = useState<any>('Box Worthy');
  const [inlineReview, setInlineReview] = useState<string>('');

  const startInlineEdit = (log: SmokeLog) => {
    setEditingRowId(log.id);
    setInlineScore(log.overallScore || 90);
    setInlineStars(log.starRating || 4.5);
    setInlinePairing(log.pairingDrink || '');
    setInlineLocation(log.location || '');
    setInlineRebuy(log.wouldRebuy || 'Box Worthy');
    setInlineReview(log.detailedReview || '');
  };

  const saveInlineEdit = (logId: string) => {
    if (onUpdateLogDirectly) {
      onUpdateLogDirectly(logId, {
        overallScore: Number(inlineScore) || 90,
        starRating: Number(inlineStars) || 4.5,
        pairingDrink: inlinePairing.trim(),
        location: inlineLocation.trim(),
        wouldRebuy: inlineRebuy,
        detailedReview: inlineReview.trim(),
      });
    }
    setEditingRowId(null);
  };

  const applyPreset = (preset: 'all' | 'essential' | 'tastingFocus') => {
    if (preset === 'all') {
      setDisplayFields({
        dateAndLocation: true,
        scoreAndStars: true,
        vitolaAndWrapper: true,
        duration: true,
        pairing: true,
        rebuyVerdict: true,
        flavorsAndNotes: true,
        burnAndDraw: true,
      });
    } else if (preset === 'essential') {
      setDisplayFields({
        dateAndLocation: true,
        scoreAndStars: true,
        vitolaAndWrapper: true,
        duration: false,
        pairing: true,
        rebuyVerdict: true,
        flavorsAndNotes: false,
        burnAndDraw: false,
      });
    } else if (preset === 'tastingFocus') {
      setDisplayFields({
        dateAndLocation: false,
        scoreAndStars: true,
        vitolaAndWrapper: true,
        duration: true,
        pairing: true,
        rebuyVerdict: true,
        flavorsAndNotes: true,
        burnAndDraw: true,
      });
    }
  };

  const filteredLogs = useMemo(() => {
    return logs
      .filter((l) => {
        // Rating Filter
        if (ratingFilter === '95+' && l.overallScore < 95) return false;
        if (ratingFilter === '90+' && l.overallScore < 90) return false;
        if (ratingFilter === '85+' && l.overallScore < 85) return false;
        if (ratingFilter === '80+' && l.overallScore < 80) return false;

        // Rebuy Filter
        if (rebuyFilter !== 'all' && l.wouldRebuy !== rebuyFilter) return false;

        // Brand Filter
        if (brandFilter !== 'all' && l.cigarBrand.toLowerCase() !== brandFilter.toLowerCase()) return false;

        // Vitola Filter
        if (vitolaFilter !== 'all' && (!l.vitola || !l.vitola.toLowerCase().includes(vitolaFilter.toLowerCase()))) return false;

        // Wrapper Filter
        if (wrapperFilter !== 'all' && (!l.wrapper || !l.wrapper.toLowerCase().includes(wrapperFilter.toLowerCase()))) return false;

        // Duration Filter
        if (durationFilter === 'quick' && (l.durationMinutes || 0) > 45) return false;
        if (durationFilter === 'medium' && ((l.durationMinutes || 0) <= 45 || (l.durationMinutes || 0) > 75)) return false;
        if (durationFilter === 'long' && ((l.durationMinutes || 0) <= 75 || (l.durationMinutes || 0) > 100)) return false;
        if (durationFilter === 'extra_long' && (l.durationMinutes || 0) <= 100) return false;

        // Cut Type Filter
        if (cutTypeFilter !== 'all' && l.cutType !== cutTypeFilter) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            l.cigarBrand.toLowerCase().includes(q) ||
            l.cigarName.toLowerCase().includes(q) ||
            (l.vitola && l.vitola.toLowerCase().includes(q)) ||
            (l.wrapper && l.wrapper.toLowerCase().includes(q)) ||
            l.location.toLowerCase().includes(q) ||
            (l.occasion && l.occasion.toLowerCase().includes(q)) ||
            (l.pairingDrink && l.pairingDrink.toLowerCase().includes(q)) ||
            (l.detailedReview && l.detailedReview.toLowerCase().includes(q)) ||
            (l.dominantFlavors && l.dominantFlavors.some((f) => f.toLowerCase().includes(q)));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.smokedAt).getTime() - new Date(a.smokedAt).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.smokedAt).getTime() - new Date(b.smokedAt).getTime();
        }
        if (sortBy === 'score-desc') {
          return (b.overallScore || 0) - (a.overallScore || 0);
        }
        if (sortBy === 'score-asc') {
          return (a.overallScore || 0) - (b.overallScore || 0);
        }
        if (sortBy === 'duration-desc') {
          return (b.durationMinutes || 0) - (a.durationMinutes || 0);
        }
        if (sortBy === 'duration-asc') {
          return (a.durationMinutes || 0) - (b.durationMinutes || 0);
        }
        if (sortBy === 'brand-asc') {
          return a.cigarBrand.localeCompare(b.cigarBrand) || a.cigarName.localeCompare(b.cigarName);
        }
        return 0;
      });
  }, [
    logs,
    ratingFilter,
    rebuyFilter,
    brandFilter,
    vitolaFilter,
    wrapperFilter,
    durationFilter,
    cutTypeFilter,
    sortBy,
    searchQuery,
  ]);

  const avgOverallScore =
    logs.length > 0 ? (logs.reduce((acc, l) => acc + l.overallScore, 0) / logs.length).toFixed(1) : 'N/A';

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-gradient-to-br from-[#1C1816] via-[#161311] to-[#13110F] border border-[#2C2621] rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#C5A059]" />
            <h1 className="text-xl sm:text-2xl font-serif text-white font-normal">
              Cigars Smoked
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A89F94] mt-1">
            Tasting Journey.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-2 bg-[#13110F] border border-[#2C2621] rounded-md text-xs">
            <span className="text-[#A89F94]">Total Smokes: </span>
            <strong className="text-[#C5A059] font-serif">{logs.length}</strong>
            <span className="text-[#3D352E] mx-2">|</span>
            <span className="text-[#A89F94]">Avg Score: </span>
            <strong className="text-[#C5A059] font-serif">★ {avgOverallScore}</strong>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#13110F] border border-[#2C2621] rounded-md p-0.5">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#C5A059] text-[#0F0D0C]'
                  : 'text-[#A89F94] hover:text-[#E5E1DA]'
              }`}
              title="Tasting Cards View"
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
              title="Database Table & Inline Edit View"
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

      {/* Inline Display Settings & Presets Panel */}
      {showDisplayOptions && (
        <div className="p-4 bg-[#161311] border border-[#2C2621] rounded-lg space-y-3 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2C2621] pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#E5E1DA]">
                Smoked Journal &bull; Field Visibility & Presets
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#A89F94] uppercase tracking-wider">Presets:</span>
              <button
                onClick={() => applyPreset('all')}
                className="px-2 py-0.5 rounded bg-[#13110F] border border-[#2C2621] hover:border-[#C5A059] text-[10px] uppercase font-semibold text-[#E5E1DA] transition cursor-pointer"
              >
                All Fields
              </button>
              <button
                onClick={() => applyPreset('essential')}
                className="px-2 py-0.5 rounded bg-[#13110F] border border-[#2C2621] hover:border-[#C5A059] text-[10px] uppercase font-semibold text-[#E5E1DA] transition cursor-pointer"
              >
                Essential
              </button>
              <button
                onClick={() => applyPreset('tastingFocus')}
                className="px-2 py-0.5 rounded bg-[#13110F] border border-[#2C2621] hover:border-[#C5A059] text-[10px] uppercase font-semibold text-[#E5E1DA] transition cursor-pointer"
              >
                Tasting Focus
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {[
              { key: 'scoreAndStars', label: 'Score & Rating' },
              { key: 'vitolaAndWrapper', label: 'Vitola & Wrapper' },
              { key: 'dateAndLocation', label: 'Date & Location' },
              { key: 'duration', label: 'Smoke Duration' },
              { key: 'pairing', label: 'Beverage Pairing' },
              { key: 'rebuyVerdict', label: 'Re-Buy Verdict' },
              { key: 'flavorsAndNotes', label: 'Flavor Notes & Review' },
              { key: 'burnAndDraw', label: 'Draw & Mechanics' },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 p-2 bg-[#13110F] border border-[#2C2621] rounded text-xs text-[#E5E1DA] cursor-pointer hover:border-[#3D352E] select-none"
              >
                <input
                  type="checkbox"
                  checked={(displayFields as any)[key]}
                  onChange={(e) =>
                    setDisplayFields((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                  className="rounded border-[#2C2621] text-[#C5A059] focus:ring-[#C5A059]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 bg-[#1C1816] border border-[#2C2621] rounded-lg space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 text-[#A89F94] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search smokes, locations, pairings, flavor notes, wrapper..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md pl-9 pr-8 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059] placeholder-[#A89F94]/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#A89F94] hover:text-[#E5E1DA] p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-[#A89F94] font-semibold mb-1">
              Brand ({availableBrands.length})
            </label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
            >
              <option value="all">All Brands</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Vitola Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-[#A89F94] font-semibold mb-1">
              Vitola ({availableVitolas.length})
            </label>
            <select
              value={vitolaFilter}
              onChange={(e) => setVitolaFilter(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
            >
              <option value="all">All Vitolas</option>
              {availableVitolas.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Wrapper Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-[#A89F94] font-semibold mb-1">
              Wrapper ({availableWrappers.length})
            </label>
            <select
              value={wrapperFilter}
              onChange={(e) => setWrapperFilter(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
            >
              <option value="all">All Wrappers</option>
              {availableWrappers.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Smoke Duration Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-[#A89F94] font-semibold mb-1">
              ⏱️ Smoke Duration
            </label>
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
            >
              <option value="all">All Durations</option>
              <option value="quick">⚡ Quick (≤45m)</option>
              <option value="medium">⏱️ Medium (45–75m)</option>
              <option value="long">🪵 Long (75–100m)</option>
              <option value="extra_long">👑 Epic (&gt;100m)</option>
            </select>
          </div>

          {/* Score Rating Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-[#A89F94] font-semibold mb-1">
              Rating Score
            </label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
            >
              <option value="all">All Score Ratings</option>
              <option value="95+">★ 95+ Points (World-Class Masters)</option>
              <option value="90+">★ 90+ Points (Outstanding)</option>
              <option value="85+">★ 85+ Points (Very Good)</option>
              <option value="80+">★ 80+ Points (Good Standard)</option>
            </select>
          </div>

          {/* Re-Buy Verdict Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-[#A89F94] font-semibold mb-1">
              Re-Buy Verdict
            </label>
            <select
              value={rebuyFilter}
              onChange={(e) => setRebuyFilter(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
            >
              <option value="all">All Re-Buy Verdicts</option>
              <option value="Box Worthy">📦 Box Worthy</option>
              <option value="5-Pack Buy">🔥 5-Pack Buy</option>
              <option value="Single Occasionally">🏷️ Single Occasionally</option>
              <option value="Never Again">⛔ Pass / Never Again</option>
            </select>
          </div>

          {/* Cut Type Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-[#A89F94] font-semibold mb-1">
              Cut Type
            </label>
            <select
              value={cutTypeFilter}
              onChange={(e) => setCutTypeFilter(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
            >
              <option value="all">All Cut Types</option>
              <option value="Straight Cut">Straight Cut ✂️</option>
              <option value="Deep V-Cut">Deep V-Cut 📐</option>
              <option value="Punch Cut">Punch Cut ⭕</option>
              <option value="Shave / Angle">Shave / Angle 🗡️</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-[#A89F94] font-semibold mb-1">
              Sort Order
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059]"
            >
              <option value="date-desc">📅 Date: Newest First</option>
              <option value="date-asc">📅 Date: Oldest First</option>
              <option value="score-desc">★ Score: High to Low</option>
              <option value="score-asc">★ Score: Low to High</option>
              <option value="duration-desc">⏱️ Duration: Longest</option>
              <option value="duration-asc">⚡ Duration: Shortest</option>
              <option value="brand-asc">🔤 Brand (A to Z)</option>
            </select>
          </div>
        </div>

        {(searchQuery || ratingFilter !== 'all' || rebuyFilter !== 'all' || brandFilter !== 'all' || vitolaFilter !== 'all' || wrapperFilter !== 'all' || durationFilter !== 'all' || cutTypeFilter !== 'all' || sortBy !== 'date-desc') && (
          <div className="flex items-center justify-between pt-1 border-t border-[#2C2621]/60 text-xs text-[#A89F94]">
            <span>
              Showing <strong className="text-[#C5A059] font-serif">{filteredLogs.length}</strong> of{' '}
              <strong className="text-[#E5E1DA]">{logs.length}</strong> logged smokes
            </span>
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] px-2.5 py-0.5 rounded bg-[#241E1B] hover:bg-[#2C2621] text-[#C5A059] hover:text-white border border-[#3D352E] flex items-center gap-1 cursor-pointer transition"
            >
              <X className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Database Table View */}
      {viewMode === 'table' ? (
        <div className="bg-[#1C1816] border border-[#2C2621] rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#13110F] border-b border-[#2C2621] text-[#A89F94] uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Cigar & Vitola</th>
                  {displayFields.scoreAndStars && <th className="py-3 px-4">Score</th>}
                  {displayFields.dateAndLocation && <th className="py-3 px-4">Date & Location</th>}
                  {displayFields.duration && <th className="py-3 px-4">Duration</th>}
                  {displayFields.pairing && <th className="py-3 px-4">Pairing</th>}
                  {displayFields.rebuyVerdict && <th className="py-3 px-4">Re-Buy</th>}
                  {displayFields.flavorsAndNotes && <th className="py-3 px-4">Tasting Notes</th>}
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2621]/60">
                {filteredLogs.map((log) => {
                  const isEditing = editingRowId === log.id;
                  const dateFormatted = log.smokedAt
                    ? new Date(log.smokedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '';

                  return (
                    <tr key={log.id} className="hover:bg-[#241E1B]/50 transition">
                      {/* Cigar & Vitola */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#E5E1DA]">{log.cigarBrand}</div>
                        <div className="text-[#A89F94] text-[11px]">
                          {log.cigarName} &bull; <span className="italic">{log.vitola}</span>
                        </div>
                      </td>

                      {/* Score & Rating */}
                      {displayFields.scoreAndStars && (
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={50}
                                max={100}
                                value={inlineScore}
                                onChange={(e) => setInlineScore(Number(e.target.value))}
                                className="w-14 bg-[#13110F] border border-[#2C2621] rounded px-1.5 py-1 text-[#C5A059] font-bold text-xs"
                              />
                              <span className="text-[10px] text-[#A89F94]">pts</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-[#13110F] border border-[#2C2621] text-[#C5A059] font-bold font-serif">
                                {log.overallScore}
                              </span>
                              <span className="text-[#C5A059] text-[11px]">★ {log.starRating}</span>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Date & Location */}
                      {displayFields.dateAndLocation && (
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={inlineLocation}
                              onChange={(e) => setInlineLocation(e.target.value)}
                              placeholder="Location"
                              className="w-full bg-[#13110F] border border-[#2C2621] rounded px-2 py-1 text-xs text-[#E5E1DA]"
                            />
                          ) : (
                            <div>
                              <div className="text-[#E5E1DA]">{dateFormatted}</div>
                              <div className="text-[#A89F94] text-[10px]">{log.location}</div>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Duration */}
                      {displayFields.duration && (
                        <td className="py-3 px-4 text-[#A89F94]">
                          {log.durationMinutes ? `${log.durationMinutes} min` : '—'}
                        </td>
                      )}

                      {/* Pairing */}
                      {displayFields.pairing && (
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={inlinePairing}
                              onChange={(e) => setInlinePairing(e.target.value)}
                              placeholder="Drink pairing"
                              className="w-full bg-[#13110F] border border-[#2C2621] rounded px-2 py-1 text-xs text-[#E5E1DA]"
                            />
                          ) : (
                            <span className="text-[#E5E1DA]">🥃 {log.pairingDrink || 'None'}</span>
                          )}
                        </td>
                      )}

                      {/* Re-Buy Verdict */}
                      {displayFields.rebuyVerdict && (
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <select
                              value={inlineRebuy}
                              onChange={(e) => setInlineRebuy(e.target.value)}
                              className="bg-[#13110F] border border-[#2C2621] rounded px-2 py-1 text-xs text-[#E5E1DA]"
                            >
                              <option value="Box Worthy">📦 Box Worthy</option>
                              <option value="5-Pack Buy">🔥 5-Pack Buy</option>
                              <option value="Single Occasionally">🏷️ Single Occasionally</option>
                              <option value="Never Again">⛔ Pass / Never Again</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                log.wouldRebuy === 'Box Worthy'
                                  ? 'bg-[#13110F] text-[#C5A059] border-[#C5A059]/40'
                                  : 'bg-[#13110F] text-[#A89F94] border-[#2C2621]'
                              }`}
                            >
                              {log.wouldRebuy}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Tasting Notes */}
                      {displayFields.flavorsAndNotes && (
                        <td className="py-3 px-4 max-w-xs truncate">
                          {isEditing ? (
                            <input
                              type="text"
                              value={inlineReview}
                              onChange={(e) => setInlineReview(e.target.value)}
                              placeholder="Tasting notes"
                              className="w-full bg-[#13110F] border border-[#2C2621] rounded px-2 py-1 text-xs text-[#E5E1DA]"
                            />
                          ) : (
                            <span className="text-[#A89F94] italic truncate block">
                              "{log.detailedReview || 'No notes written.'}"
                            </span>
                          )}
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => saveInlineEdit(log.id)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-[#C5A059] text-[#0F0D0C] font-bold rounded text-[11px] cursor-pointer hover:brightness-110"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={() => setEditingRowId(null)}
                              className="px-2 py-1 bg-[#13110F] text-[#A89F94] rounded text-[11px] border border-[#2C2621] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startInlineEdit(log)}
                              className="p-1 text-[#A89F94] hover:text-[#C5A059] transition cursor-pointer"
                              title="Quick Inline Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteLog(log.id)}
                              className="p-1 text-[#A89F94] hover:text-red-400 transition cursor-pointer"
                              title="Delete Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tasting Cards View */
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const dateFormatted = log.smokedAt
              ? new Date(log.smokedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '';

            return (
              <div
                key={log.id}
                className="bg-[#1C1816] border border-[#2C2621] rounded-lg overflow-hidden shadow-sm transition hover:border-[#3D352E]"
              >
                {/* Log Header Summary */}
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-5 cursor-pointer hover:bg-[#241E1B] flex flex-wrap items-center justify-between gap-4 select-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-[#13110F] border border-[#2C2621] flex flex-col items-center justify-center text-[#C5A059]">
                      <span className="text-base font-serif font-bold leading-none">{log.overallScore}</span>
                      <span className="text-[8px] uppercase tracking-widest text-[#A89F94] mt-0.5">pts</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-[#C5A059]">{log.cigarBrand}</span>
                        <span className="text-xs text-[#3D352E]">•</span>
                        <span className="text-xs text-[#A89F94]">{log.wrapper} wrapper</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-serif font-semibold text-[#E5E1DA]">
                        {log.cigarName}{' '}
                        <span className="text-xs font-normal text-[#A89F94]">({log.vitola})</span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#A89F94] mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                          {dateFormatted}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                          {log.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                          {log.durationMinutes} mins
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded border ${
                          log.wouldRebuy === 'Box Worthy'
                            ? 'bg-[#13110F] text-[#C5A059] border-[#2C2621]'
                            : 'bg-[#13110F] text-[#A89F94] border-[#2C2621]'
                        }`}
                      >
                        {log.wouldRebuy}
                      </span>
                      <div className="text-xs text-[#A89F94] mt-1">🥃 {log.pairingDrink}</div>
                    </div>

                    <div className="text-[#A89F94] hover:text-white p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Log View */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-[#2C2621] bg-[#13110F] space-y-4 text-xs">
                    {/* Dominant Flavor Tags */}
                    <div>
                      <span className="text-[#A89F94] font-semibold uppercase tracking-wider text-[10px] block mb-2">
                        Dominant Flavor Impressions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(log.dominantFlavors || []).map((flavor) => (
                          <span
                            key={flavor}
                            className="px-2.5 py-1 rounded bg-[#1C1816] border border-[#2C2621] text-[#E5E1DA] font-medium text-[11px]"
                          >
                            {flavor}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 3-Thirds Flavor Transitions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3.5 bg-[#1C1816] border border-[#2C2621] rounded-md">
                        <div className="font-serif text-[#C5A059] text-xs mb-1.5 font-semibold">1st Third (Initial Light)</div>
                        <div className="flex flex-wrap gap-1">
                          {(log.firstThirdNotes || []).map((n) => (
                            <span
                              key={n}
                              className="px-2 py-0.5 rounded bg-[#13110F] text-[#A89F94] text-[10px] border border-[#2C2621]"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 bg-[#1C1816] border border-[#2C2621] rounded-md">
                        <div className="font-serif text-[#C5A059] text-xs mb-1.5 font-semibold">2nd Third (Sweet Spot)</div>
                        <div className="flex flex-wrap gap-1">
                          {(log.secondThirdNotes || []).map((n) => (
                            <span
                              key={n}
                              className="px-2 py-0.5 rounded bg-[#13110F] text-[#A89F94] text-[10px] border border-[#2C2621]"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 bg-[#1C1816] border border-[#2C2621] rounded-md">
                        <div className="font-serif text-[#C5A059] text-xs mb-1.5 font-semibold">Final Third (Nub / Finish)</div>
                        <div className="flex flex-wrap gap-1">
                          {(log.finalThirdNotes || []).map((n) => (
                            <span
                              key={n}
                              className="px-2 py-0.5 rounded bg-[#13110F] text-[#A89F94] text-[10px] border border-[#2C2621]"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Construction & Mechanics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#1C1816] border border-[#2C2621] rounded-md text-[11px]">
                      <div>
                        <span className="text-[#A89F94] block">Draw Quality</span>
                        <strong className="text-[#E5E1DA]">{log.drawQuality}</strong>
                      </div>
                      <div>
                        <span className="text-[#A89F94] block">Burn Consistency</span>
                        <strong className="text-[#E5E1DA]">{log.burnQuality}</strong>
                      </div>
                      <div>
                        <span className="text-[#A89F94] block">Ash Characteristics</span>
                        <strong className="text-[#E5E1DA]">{log.ashQuality}</strong>
                      </div>
                      <div>
                        <span className="text-[#A89F94] block">Cut & Light</span>
                        <strong className="text-[#E5E1DA]">
                          {log.cutType || 'Straight'} / {log.lightType || 'Torch'}
                        </strong>
                      </div>
                    </div>

                    {/* Pairing & Review */}
                    <div className="p-4 bg-[#1C1816] border border-[#2C2621] rounded-md space-y-2.5">
                      <div>
                        <strong className="text-[#C5A059] uppercase tracking-wider text-[10px]">🥃 Beverage Accompaniment:</strong>{' '}
                        <span className="text-[#E5E1DA] ml-1">{log.pairingDrink}</span>
                        {log.pairingNotes && (
                          <p className="text-[#A89F94] italic mt-0.5 ml-4">"{log.pairingNotes}"</p>
                        )}
                      </div>
                      <div>
                        <strong className="text-[#C5A059] uppercase tracking-wider text-[10px]">📝 Connoisseur Tasting Notes:</strong>
                        <p className="text-[#E5E1DA] leading-relaxed mt-1 font-serif text-sm italic">
                          "{log.detailedReview}"
                        </p>
                      </div>
                    </div>

                    {/* Actions (Edit / Delete) */}
                    <div className="flex justify-end gap-4 pt-2 text-xs text-[#A89F94]">
                      <button
                        onClick={() => onEditLog(log)}
                        className="flex items-center gap-1.5 hover:text-[#E5E1DA] transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Tasting Note</span>
                      </button>
                      {confirmDeleteId === log.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 text-xs font-semibold">Delete note?</span>
                          <button
                            onClick={() => {
                              onDeleteLog(log.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold cursor-pointer transition"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 bg-[#2C2621] hover:bg-[#3D352E] text-[#A89F94] rounded text-[11px] cursor-pointer transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(log.id)}
                          className="flex items-center gap-1.5 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 bg-[#1C1816] border border-[#2C2621] rounded-lg">
              <Flame className="w-8 h-8 text-[#C5A059]/50 mx-auto mb-3" />
              <h3 className="text-base font-serif font-semibold text-[#E5E1DA]">No Tasting Logs Found</h3>
              <p className="text-xs text-[#A89F94] max-w-sm mx-auto mt-1">
                Your past smoking sessions and tasting notes will appear here once logged from your humidor sticks.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
