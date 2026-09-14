import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { HumidorInventory } from './components/HumidorInventory';
import { SmokeJournal } from './components/SmokeJournal';
import { CigarResearchHub } from './components/CigarResearchHub';
import { WishlistHunting } from './components/WishlistHunting';
import { ExportSuite } from './components/ExportSuite';
import { AddCigarModal } from './components/AddCigarModal';
import { LogSmokeModal } from './components/LogSmokeModal';
import { HumidorManagerModal } from './components/HumidorManagerModal';
import { HumidorManagerDrawer } from './components/HumidorManagerDrawer';
import { ShoppingBasketImporterModal } from './components/ShoppingBasketImporterModal';
import { AppSettingsModal } from './components/AppSettingsModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { GlobalPriceEditorModal } from './components/GlobalPriceEditorModal';
import { initialCigars, initialHumidors, initialSmokeLogs, initialWishlist } from './data/initialData';
import { INITIAL_RESEARCH_DATABASE } from './data/cigarDatabase';
import { Cigar, Humidor, SmokeLog, WishlistItem, CigarResearchItem, AppSettings, VendorPriceEntry } from './types';
import {
  mergeResearchBatch,
  deduplicateResearchDatabase,
  findMatchingResearchCigar,
  canonicalizeVendorName,
  normalizeString,
  areCigarsMatching,
  syncCigarAcrossAllSections,
  syncGlobalReviewScores,
  applyAccurateSmokeTimesToAllCigars,
  estimateAccurateSmokeTime,
} from './utils/researchUtils';
import { deduplicateHumidorCigars, syncGlobalCigarPrice } from './utils/humidorUtils';
import { DEFAULT_APP_SETTINGS, APP_VERSION } from './data/versionHistory';

export function App() {
  // App-wide Customization Settings State with LocalStorage persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('cedar_ash_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_APP_SETTINGS,
          ...parsed,
          visibleTabs: { ...DEFAULT_APP_SETTINGS.visibleTabs, ...(parsed.visibleTabs || {}) },
          dashboardSections: { ...DEFAULT_APP_SETTINGS.dashboardSections, ...(parsed.dashboardSections || {}) },
          cigarFieldVisibility: { ...DEFAULT_APP_SETTINGS.cigarFieldVisibility, ...(parsed.cigarFieldVisibility || {}) },
          wishlistFieldVisibility: { ...DEFAULT_APP_SETTINGS.wishlistFieldVisibility, ...(parsed.wishlistFieldVisibility || {}) },
          humidorFieldVisibility: { ...DEFAULT_APP_SETTINGS.humidorFieldVisibility, ...(parsed.humidorFieldVisibility || {}) },
          journalFieldVisibility: { ...DEFAULT_APP_SETTINGS.journalFieldVisibility, ...(parsed.journalFieldVisibility || {}) },
        };
      }
    } catch (e) {
      console.warn('Failed to parse saved settings, using defaults:', e);
    }
    return DEFAULT_APP_SETTINGS;
  });

  // Primary state with localStorage persistence and resilient error handling
  const [cigars, setCigars] = useState<Cigar[]>(() => {
    try {
      const saved = localStorage.getItem('cedar_ash_cigars');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved cigars from storage, using defaults:', e);
    }
    return initialCigars;
  });

  const [humidors, setHumidors] = useState<Humidor[]>(() => {
    try {
      const saved = localStorage.getItem('cedar_ash_humidors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved humidors from storage, using defaults:', e);
    }
    return initialHumidors;
  });

  const [smokeLogs, setSmokeLogs] = useState<SmokeLog[]>(() => {
    try {
      const saved = localStorage.getItem('cedar_ash_smokelogs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved smoke logs from storage, using defaults:', e);
    }
    return initialSmokeLogs;
  });

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('cedar_ash_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved wishlist from storage, using defaults:', e);
    }
    return initialWishlist;
  });

  // Local Searchable Cigar Research Database
  const [researchDatabase, setResearchDatabase] = useState<CigarResearchItem[]>(() => {
    try {
      const saved = localStorage.getItem('cedar_ash_research_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved research db, using defaults:', e);
    }
    return INITIAL_RESEARCH_DATABASE;
  });

  // Safe localStorage helper to prevent crashing in sandboxed iframes or quota exhaustion
  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[The Humidor] Storage quota or access limitation for ${key}:`, e);
    }
  };

  // Sync to localStorage
  useEffect(() => {
    safeSetItem('cedar_ash_cigars', JSON.stringify(cigars));
  }, [cigars]);

  useEffect(() => {
    safeSetItem('cedar_ash_humidors', JSON.stringify(humidors));
  }, [humidors]);

  useEffect(() => {
    safeSetItem('cedar_ash_smokelogs', JSON.stringify(smokeLogs));
  }, [smokeLogs]);

  useEffect(() => {
    safeSetItem('cedar_ash_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    safeSetItem('cedar_ash_research_db', JSON.stringify(researchDatabase));
  }, [researchDatabase]);

  useEffect(() => {
    safeSetItem('cedar_ash_settings', JSON.stringify(settings));
  }, [settings]);

  // Initial auto-migration & enrichment: ensure accurate multi-source consensus smoke times across all cigars
  useEffect(() => {
    try {
      const enrichment = applyAccurateSmokeTimesToAllCigars({
        cigars,
        wishlist,
        researchDatabase,
        smokeLogs,
      });
      if (enrichment.totalEnriched > 0) {
        setCigars(enrichment.updatedCigars);
        setWishlist(enrichment.updatedWishlist);
        setResearchDatabase(enrichment.updatedResearchDb);
      }
    } catch (e) {
      console.warn('Smoke time auto-enrichment warning:', e);
    }
  }, []);

  // Navigation tab state with persistence
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_active_tab');
      if (saved && ['dashboard', 'inventory', 'journal', 'research', 'wishlist', 'export'].includes(saved)) {
        return saved as ActiveTab;
      }
    } catch {}
    return 'dashboard';
  });

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  // Modals state
  const [isAddCigarOpen, setIsAddCigarOpen] = useState(false);
  const [cigarToEdit, setCigarToEdit] = useState<Cigar | null>(null);
  const [prefilledCigarData, setPrefilledCigarData] = useState<Partial<Cigar> | null>(null);

  const [isLogSmokeOpen, setIsLogSmokeOpen] = useState(false);
  const [selectedCigarForSmoke, setSelectedCigarForSmoke] = useState<Cigar | null>(null);
  const [logToEdit, setLogToEdit] = useState<SmokeLog | null>(null);

  const [isHumidorManagerOpen, setIsHumidorManagerOpen] = useState(false);
  const [isAddHumidorOpen, setIsAddHumidorOpen] = useState(false);
  const [humidorToEdit, setHumidorToEdit] = useState<Humidor | null>(null);

  // Multi-Cigar Shopping Basket Importer modal
  const [isBasketImporterOpen, setIsBasketImporterOpen] = useState(false);

  // Global Price Editor modal state
  const [priceEditorTarget, setPriceEditorTarget] = useState<{
    brand: string;
    name: string;
    vitola?: string;
    price?: number;
    vendor?: string;
    currency?: string;
    existingPrices?: VendorPriceEntry[];
  } | null>(null);

  // Quick Settings & Version History modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  // Cross-tab research query
  const [researchQuery, setResearchQuery] = useState<string>('');

  // Handlers: Cigars
  const handleSaveCigar = (cigarData: Omit<Cigar, 'id' | 'createdAt' | 'updatedAt'>, idToEdit?: string) => {
    const now = new Date().toISOString();
    const estSmoke = estimateAccurateSmokeTime({
      vitola: cigarData.vitola,
      lengthInches: cigarData.lengthInches,
      ringGauge: cigarData.ringGauge,
      brand: cigarData.brand,
      name: cigarData.name,
      line: cigarData.line,
      smokeLogs,
      customMinutes: cigarData.smokeTimeMinutes,
      customRange: cigarData.smokeTimeRange,
    });

    const enrichedCigarData = {
      ...cigarData,
      smokeTimeMinutes: estSmoke.minutes,
      smokeTimeRange: estSmoke.range,
    };

    if (idToEdit) {
      setCigars((prev) =>
        prev.map((c) =>
          c.id === idToEdit ? { ...c, ...enrichedCigarData, id: idToEdit, updatedAt: now } : c
        )
      );
    } else {
      const newCigar: Cigar = {
        ...enrichedCigarData,
        id: `cigar-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setCigars((prev) => {
        const combined = [newCigar, ...prev];
        const dedup = deduplicateHumidorCigars(combined, humidors);
        return dedup.cleanedCigars;
      });
    }

    // If vendor and price provided, sync quote site-wide across Research and Wishlist
    if (cigarData.vendor && cigarData.purchasePrice) {
      const quote: VendorPriceEntry = {
        id: `vp-${Date.now()}`,
        vendor: cigarData.vendor,
        price: cigarData.purchasePrice,
        currency: cigarData.currency || '£',
        inStock: true,
        recordedAt: cigarData.purchaseDate || now,
      };
      setResearchDatabase((prevRes) => {
        const syncRes = syncGlobalCigarPrice({
          brand: cigarData.brand,
          nameOrLine: cigarData.line || cigarData.name,
          vitola: cigarData.vitola,
          vendorPriceEntry: quote,
          researchDatabase: prevRes,
          cigars: [],
          wishlist: [],
          updateHumidorMatches: false,
        });
        return syncRes.updatedResearchDb;
      });
    }
  };

  const handleDeleteCigar = (cigarId: string) => {
    setCigars((prev) => prev.filter((c) => c.id !== cigarId));
  };

  const handleUpdateCigarDirectly = (
    cigarOrId: Cigar | string,
    maybeUpdates?: Partial<Cigar>
  ) => {
    if (typeof cigarOrId === 'string') {
      setCigars((prev) =>
        prev.map((c) => (c.id === cigarOrId ? { ...c, ...maybeUpdates } : c))
      );
    } else {
      setCigars((prev) =>
        prev.map((c) => (c.id === cigarOrId.id ? cigarOrId : c))
      );
    }
  };

  const handleDeleteHumidorCigarQuote = (
    cigarId: string,
    quoteId?: string,
    vendorName?: string
  ) => {
    setCigars((prev) =>
      prev.map((c) => {
        if (c.id === cigarId) {
          const currentPrices = c.vendorPrices ? [...c.vendorPrices] : [];
          const updatedPrices = quoteId
            ? currentPrices.filter((vp) => vp.id !== quoteId)
            : vendorName
            ? currentPrices.filter((vp) => normalizeString(vp.vendor) !== normalizeString(vendorName))
            : currentPrices.slice(1);

          const lowestPrice =
            updatedPrices.length > 0
              ? Math.min(...updatedPrices.map((p) => p.price))
              : c.purchasePrice;
          const lowestVendor =
            updatedPrices.length > 0
              ? updatedPrices.find((p) => p.price === lowestPrice)?.vendor || c.vendor
              : c.vendor;

          return {
            ...c,
            vendorPrices: updatedPrices,
            purchasePrice: lowestPrice,
            vendor: lowestVendor,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const handleSaveHumidorCigarQuote = (
    cigar: Cigar,
    vendorName: string,
    price: number,
    currency: string = '£'
  ) => {
    const canonicalVendor = canonicalizeVendorName(vendorName);
    const quote: VendorPriceEntry = {
      id: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      vendor: canonicalVendor,
      price: Math.round(price * 100) / 100,
      currency,
      inStock: true,
      recordedAt: new Date().toISOString(),
    };

    // 1. Update humidor cigar
    setCigars((prev) =>
      prev.map((c) => {
        if (c.id === cigar.id) {
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

          const idx = currentPrices.findIndex(
            (v) => canonicalizeVendorName(v.vendor).toLowerCase() === canonicalVendor.toLowerCase()
          );
          if (idx >= 0) {
            currentPrices[idx] = quote;
          } else {
            currentPrices.push(quote);
          }
          currentPrices.sort((a, b) => a.price - b.price);
          return {
            ...c,
            purchasePrice: currentPrices[0].price,
            vendor: currentPrices[0].vendor,
            vendorPrices: currentPrices,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );

    // 2. Sync site-wide across Research Database & Wishlist
    setResearchDatabase((prevRes) => {
      const syncRes = syncGlobalCigarPrice({
        brand: cigar.brand,
        nameOrLine: cigar.line || cigar.name,
        vitola: cigar.vitola,
        vendorPriceEntry: quote,
        researchDatabase: prevRes,
        cigars: [],
        wishlist: [],
        updateHumidorMatches: false,
      });
      return syncRes.updatedResearchDb;
    });

    setWishlist((prevWish) => {
      const syncRes = syncGlobalCigarPrice({
        brand: cigar.brand,
        nameOrLine: cigar.line || cigar.name,
        vitola: cigar.vitola,
        vendorPriceEntry: quote,
        researchDatabase: [],
        cigars: [],
        wishlist: prevWish,
        updateHumidorMatches: false,
      });
      return syncRes.updatedWishlist;
    });
  };

  const handleUpdateQuantity = (cigarId: string, newQty: number) => {
    setCigars((prev) => prev.map((c) => (c.id === cigarId ? { ...c, quantity: newQty } : c)));
  };

  const handleToggleFavorite = (cigarId: string) => {
    setCigars((prev) =>
      prev.map((c) => (c.id === cigarId ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  // Handlers: Smoking a cigar
  const handleTriggerSmoke = (cigarId: string) => {
    const cigar = cigars.find((c) => c.id === cigarId);
    if (cigar) {
      setSelectedCigarForSmoke(cigar);
      setLogToEdit(null);
      setIsLogSmokeOpen(true);
    }
  };

  const handleSaveSmokeLog = (
    logData: Omit<SmokeLog, 'id' | 'createdAt'>,
    deductStock: boolean,
    cigarId?: string,
    idToEdit?: string
  ) => {
    if (idToEdit) {
      setSmokeLogs((prev) =>
        prev.map((l) => (l.id === idToEdit ? { ...logData, id: idToEdit, createdAt: l.createdAt } : l))
      );
    } else {
      const newLog: SmokeLog = {
        ...logData,
        id: `smoke-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setSmokeLogs((prev) => [newLog, ...prev]);

      // Deduct stock if requested
      if (deductStock && cigarId) {
        setCigars((prev) =>
          prev.map((c) => (c.id === cigarId ? { ...c, quantity: Math.max(0, c.quantity - 1) } : c))
        );
      }
    }
  };

  const handleDeleteSmokeLog = (logId: string) => {
    setSmokeLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  // Handlers: Humidors
  const handleSaveHumidor = (hData: Omit<Humidor, 'id' | 'createdAt'>, idToEdit?: string) => {
    if (idToEdit) {
      setHumidors((prev) =>
        prev.map((h) => (h.id === idToEdit ? { ...hData, id: idToEdit, createdAt: h.createdAt } : h))
      );
    } else {
      const newHum: Humidor = {
        ...hData,
        id: `hum-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setHumidors((prev) => [...prev, newHum]);
    }
  };

  const handleDeleteHumidor = (id: string) => {
    setHumidors((prev) => prev.filter((h) => h.id !== id));
  };

  const handleUpdateHumidorDirectly = (humidorId: string, updates: Partial<Humidor>) => {
    setHumidors((prev) =>
      prev.map((h) => (h.id === humidorId ? { ...h, ...updates } : h))
    );
  };

  // Handlers: Wishlist
  const handleAddWishlistItem = (item: Omit<WishlistItem, 'id' | 'createdAt'>) => {
    const estSmoke = estimateAccurateSmokeTime({
      vitola: item.vitola,
      lengthInches: item.lengthInches,
      ringGauge: item.ringGauge,
      brand: item.brand,
      name: item.name,
      smokeLogs,
      customMinutes: item.smokeTimeMinutes,
      customRange: item.smokeTimeRange,
    });

    const newItem: WishlistItem = {
      ...item,
      smokeTimeMinutes: estSmoke.minutes,
      smokeTimeRange: estSmoke.range,
      id: `wish-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setWishlist((prev) => [newItem, ...prev]);
  };

  const handleDeleteWishlistItem = (id: string) => {
    setWishlist((prev) => prev.filter((w) => w.id !== id));
  };

  const handleUpdateWishlistItem = (id: string, updates: Partial<WishlistItem>) => {
    setWishlist((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const handleDeduplicateHumidor = (): { mergedCount: number } => {
    const result = deduplicateHumidorCigars(cigars, humidors);
    if (result.mergedCount > 0) {
      setCigars(result.cleanedCigars);
    }
    return { mergedCount: result.mergedCount };
  };

  const handleOpenPriceEditorForCigar = (item: {
    brand: string;
    name: string;
    vitola?: string;
    price?: number;
    vendor?: string;
    currency?: string;
  }) => {
    // Find matching research item to fetch existing vendor quotes if available
    const matchingResearch = findMatchingResearchCigar(
      { brand: item.brand, line: item.name, name: item.name, vitola: item.vitola },
      researchDatabase
    );

    setPriceEditorTarget({
      ...item,
      existingPrices: matchingResearch?.vendorPrices || [],
    });
  };

  const handleSaveGlobalPrices = (prices: VendorPriceEntry[], syncSiteWide: boolean) => {
    if (!priceEditorTarget) return;

    const syncResult = syncGlobalCigarPrice({
      brand: priceEditorTarget.brand,
      nameOrLine: priceEditorTarget.name,
      vitola: priceEditorTarget.vitola,
      vendorPriceEntry: prices,
      researchDatabase: researchDatabase,
      cigars: cigars,
      wishlist: wishlist,
      updateHumidorMatches: syncSiteWide,
    });

    setResearchDatabase(syncResult.updatedResearchDb);
    if (syncSiteWide) {
      setCigars(syncResult.updatedCigars);
      setWishlist(syncResult.updatedWishlist);
    }

    setPriceEditorTarget(null);
  };

  const handleAcquireWishlistItem = (item: WishlistItem) => {
    // Open Add Cigar modal with prefilled data
    setPrefilledCigarData({
      brand: item.brand,
      name: item.name,
      vitola: item.vitola || 'Robusto',
      purchasePrice: item.targetPrice,
      notes: item.notes,
      quantity: 1,
    });
    setCigarToEdit(null);
    setIsAddCigarOpen(true);
    // Remove from wishlist
    handleDeleteWishlistItem(item.id);
  };

  // Global Multi-Tab Cigar Synchronization: In-line rename & attributes propagation
  const handleInlineRenameCigar = (
    cigarItem: { brand: string; name?: string; line?: string; vitola?: string },
    newBrand: string,
    newName: string
  ) => {
    const syncRes = syncCigarAcrossAllSections({
      cigars,
      researchDatabase,
      wishlist,
      smokeLogs,
      matchCriteria: {
        brand: cigarItem.brand,
        name: cigarItem.name,
        line: cigarItem.line || cigarItem.name,
        vitola: cigarItem.vitola,
      },
      update: {
        newBrand: newBrand.trim(),
        newName: newName.trim(),
      },
    });

    setCigars(syncRes.updatedCigars);
    setResearchDatabase(syncRes.updatedResearchDb);
    setWishlist(syncRes.updatedWishlist);
    setSmokeLogs(syncRes.updatedSmokeLogs);
  };

  // Global AI Review Scores synchronization across Research, Humidor, and Wishlist
  const handleSyncReviewScores = (
    brand: string,
    name: string,
    vitola: string | undefined,
    reviewScores: any[],
    criticRating: number
  ) => {
    const syncRes = syncGlobalReviewScores({
      brand,
      name,
      vitola,
      reviewScores,
      criticRating,
      cigars,
      researchDatabase,
      wishlist,
    });

    setCigars(syncRes.updatedCigars);
    setResearchDatabase(syncRes.updatedResearchDb);
    setWishlist(syncRes.updatedWishlist);
  };

  // Handlers: Research Database
  const handleUpdateResearchCigar = (cigarId: string, updates: Partial<CigarResearchItem>) => {
    setResearchDatabase((prev) =>
      prev.map((item) => (item.id === cigarId ? { ...item, ...updates } : item))
    );
  };

  const handleAddCustomResearchCigar = (newCigar: CigarResearchItem) => {
    setResearchDatabase((prev) => {
      const result = mergeResearchBatch([newCigar], prev);
      if (newCigar.vendorPrices && newCigar.vendorPrices.length > 0) {
        setTimeout(() => {
          setWishlist((curW) => {
            const syn = syncGlobalCigarPrice({
              brand: newCigar.brand,
              nameOrLine: newCigar.line,
              vitola: newCigar.vitola,
              vendorPriceEntry: newCigar.vendorPrices!,
              researchDatabase: result.updatedDatabase,
              cigars: cigars,
              wishlist: curW,
              updateHumidorMatches: false,
            });
            return syn.updatedWishlist;
          });
        }, 0);
      }
      return result.updatedDatabase;
    });
  };

  const handleAddMultipleResearchCigars = (newCigars: CigarResearchItem[]): { addedCount: number; updatedPricesCount: number } => {
    let stats = { addedCount: 0, updatedPricesCount: 0 };
    setResearchDatabase((prev) => {
      const result = mergeResearchBatch(newCigars, prev);
      stats = { addedCount: result.addedCount, updatedPricesCount: result.updatedPricesCount };

      // Propagate any newly ingested vendor price quotes across matching Wishlist items
      setTimeout(() => {
        for (const item of newCigars) {
          if (item.vendorPrices && item.vendorPrices.length > 0) {
            setWishlist((curW) => {
              const syn = syncGlobalCigarPrice({
                brand: item.brand,
                nameOrLine: item.line,
                vitola: item.vitola,
                vendorPriceEntry: item.vendorPrices!,
                researchDatabase: result.updatedDatabase,
                cigars: cigars,
                wishlist: curW,
                updateHumidorMatches: false,
              });
              return syn.updatedWishlist;
            });
          }
        }
      }, 0);

      return result.updatedDatabase;
    });
    return stats;
  };

  const handleAddMultipleHumidorCigars = (newCigars: Omit<Cigar, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const now = new Date().toISOString();
    const formatted: Cigar[] = newCigars.map((c, idx) => ({
      ...c,
      id: `cigar-${Date.now()}-${idx}`,
      createdAt: now,
      updatedAt: now,
    }));

    // Deduplicate and merge with existing Humidor cigars (combining quantities, updating quotes)
    setCigars((prev) => {
      const combined = [...formatted, ...prev];
      const dedupResult = deduplicateHumidorCigars(combined, humidors);
      return dedupResult.cleanedCigars;
    });

    // Also sync all extracted vendor price quotes to Research Database and Wishlist!
    for (const c of newCigars) {
      const quotes = c.vendorPrices && c.vendorPrices.length > 0
        ? c.vendorPrices
        : (c.vendor && c.purchasePrice ? [{
            id: `vp-${Date.now()}`,
            vendor: c.vendor,
            price: c.purchasePrice,
            currency: c.currency || '£',
            inStock: true,
            recordedAt: c.purchaseDate || now,
          }] : []);

      if (quotes.length > 0) {
        setResearchDatabase((prevRes) => {
          const syncRes = syncGlobalCigarPrice({
            brand: c.brand,
            nameOrLine: c.line || c.name,
            vitola: c.vitola,
            vendorPriceEntry: quotes,
            researchDatabase: prevRes,
            cigars: [],
            wishlist: [],
            updateHumidorMatches: false,
          });
          return syncRes.updatedResearchDb;
        });

        setWishlist((prevWish) => {
          const syncRes = syncGlobalCigarPrice({
            brand: c.brand,
            nameOrLine: c.line || c.name,
            vitola: c.vitola,
            vendorPriceEntry: quotes,
            researchDatabase: [],
            cigars: [],
            wishlist: prevWish,
            updateHumidorMatches: false,
          });
          return syncRes.updatedWishlist;
        });
      }
    }
  };

  const handleAddMultipleWishlistItems = (items: Omit<WishlistItem, 'id' | 'createdAt'>[]) => {
    setWishlist((prev) => {
      let updated = [...prev];
      for (const item of items) {
        const matchIdx = updated.findIndex((w) =>
          areCigarsMatching(
            { brand: w.brand, line: w.name, name: w.name, vitola: w.vitola },
            { brand: item.brand, line: item.name, name: item.name, vitola: item.vitola }
          )
        );

        if (matchIdx >= 0) {
          // Merge vendor prices into existing wishlist item
          const existing = updated[matchIdx];
          const combinedPrices: VendorPriceEntry[] = existing.vendorPrices ? [...existing.vendorPrices] : [];
          for (const vp of item.vendorPrices || []) {
            const normV = normalizeString(vp.vendor);
            const idx = combinedPrices.findIndex((cv) => normalizeString(cv.vendor) === normV);
            if (idx >= 0) {
              combinedPrices[idx] = vp;
            } else {
              combinedPrices.push(vp);
            }
          }
          combinedPrices.sort((a, b) => a.price - b.price);
          const best = combinedPrices.length > 0 ? combinedPrices[0].price : existing.estimatedPrice;

          updated[matchIdx] = {
            ...existing,
            estimatedPrice: best,
            sourceRetailer: combinedPrices.length > 0 ? combinedPrices[0].vendor : existing.sourceRetailer,
            vendorPrices: combinedPrices,
          };
        } else {
          updated.unshift({
            ...item,
            id: `wish-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            createdAt: new Date().toISOString(),
          });
        }
      }
      return updated;
    });
  };

  const handleResetResearchDatabase = () => {
    setResearchDatabase(INITIAL_RESEARCH_DATABASE);
  };

  const handleClearResearchDatabase = () => {
    setResearchDatabase([]);
  };

  const handleDeleteResearchCigar = (cigarId: string) => {
    setResearchDatabase((prev) => prev.filter((item) => item.id !== cigarId));
  };

  const handleDeduplicateResearchDatabase = (): { mergedCount: number } => {
    let merged = 0;
    setResearchDatabase((prev) => {
      const result = deduplicateResearchDatabase(prev);
      merged = result.mergedCount;
      return result.cleanedDatabase;
    });
    return { mergedCount: merged };
  };

  // Handlers: Research jump
  const handleOpenResearchForCigar = (cigar: Cigar) => {
    setResearchQuery(`${cigar.brand} ${cigar.name}`);
    setActiveTab('research');
  };

  const handleResearchFromExternal = (query: string) => {
    setResearchQuery(query);
    setActiveTab('research');
  };

  // Direct smoke logger from research
  const handleLogSmokeFromResearch = (
    cigarName: string,
    brand: string,
    vitola: string,
    wrapper: string,
    origin: string
  ) => {
    // Find matching cigar in humidor if exists
    const matchingCigar = cigars.find(
      (c) => c.brand.toLowerCase() === brand.toLowerCase() && c.name.toLowerCase().includes(cigarName.toLowerCase())
    );

    if (matchingCigar) {
      setSelectedCigarForSmoke(matchingCigar);
    } else {
      setSelectedCigarForSmoke(null);
    }
    setLogToEdit(null);
    setIsLogSmokeOpen(true);
  };

  // Vault import
  const handleImportVault = (data: {
    cigars?: Cigar[];
    humidors?: Humidor[];
    smokeLogs?: SmokeLog[];
    wishlist?: WishlistItem[];
    researchDatabase?: CigarResearchItem[];
  }) => {
    if (data.cigars) setCigars(data.cigars);
    if (data.humidors) setHumidors(data.humidors);
    if (data.smokeLogs) setSmokeLogs(data.smokeLogs);
    if (data.wishlist) setWishlist(data.wishlist);
    if (data.researchDatabase) setResearchDatabase(data.researchDatabase);
  };

  return (
    <div className="min-h-screen bg-[#0F0D0C] text-[#E5E1DA] flex flex-col font-sans selection:bg-[#2C2621] selection:text-[#C5A059]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cigars={cigars}
        humidors={humidors}
        smokeLogs={smokeLogs}
        wishlist={wishlist}
        researchCount={researchDatabase.length}
        settings={settings}
        onOpenAddCigar={() => {
          setCigarToEdit(null);
          setPrefilledCigarData(null);
          setIsAddCigarOpen(true);
        }}
        onOpenLogSmoke={() => {
          setSelectedCigarForSmoke(null);
          setLogToEdit(null);
          setIsLogSmokeOpen(true);
        }}
        onOpenHumidors={() => setIsHumidorManagerOpen(true)}
        onOpenBasketImporter={() => setIsBasketImporterOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            cigars={cigars}
            humidors={humidors}
            smokeLogs={smokeLogs}
            settings={settings}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNavigate={(tab) => setActiveTab(tab)}
            onSmokeCigar={handleTriggerSmoke}
            onOpenAddCigar={() => {
              setCigarToEdit(null);
              setPrefilledCigarData(null);
              setIsAddCigarOpen(true);
            }}
            onOpenHumidors={() => setIsHumidorManagerOpen(true)}
            onUpdateCigarDirectly={handleUpdateCigarDirectly}
            onUpdateHumidorDirectly={handleUpdateHumidorDirectly}
          />
        )}

        {activeTab === 'inventory' && (
          <HumidorInventory
            cigars={cigars}
            humidors={humidors}
            onOpenHumidors={() => setIsHumidorManagerOpen(true)}
            onAddCigar={() => {
              setCigarToEdit(null);
              setPrefilledCigarData(null);
              setIsAddCigarOpen(true);
            }}
            onEditCigar={(cigar) => {
              setCigarToEdit(cigar);
              setPrefilledCigarData(null);
              setIsAddCigarOpen(true);
            }}
            onDeleteCigar={handleDeleteCigar}
            onUpdateQuantity={handleUpdateQuantity}
            onToggleFavorite={handleToggleFavorite}
            onSmokeCigar={handleTriggerSmoke}
            onOpenResearchForCigar={handleOpenResearchForCigar}
            onAddToWishlist={(item) => {
              handleAddWishlistItem({
                brand: item.brand,
                name: item.name,
                vitola: item.vitola,
                notes: item.notes,
                priority: item.priority || 'Medium',
                targetPrice: item.targetPrice,
              });
            }}
            onAddToResearch={handleAddCustomResearchCigar}
            onDeduplicateHumidor={handleDeduplicateHumidor}
            onOpenPriceEditor={handleOpenPriceEditorForCigar}
            onSaveHumidorQuote={handleSaveHumidorCigarQuote}
            onDeleteHumidorQuote={handleDeleteHumidorCigarQuote}
            onUpdateCigarDirectly={handleUpdateCigarDirectly}
            onInlineRenameCigar={handleInlineRenameCigar}
            settings={settings}
          />
        )}

        {activeTab === 'journal' && (
          <SmokeJournal
            logs={smokeLogs}
            cigars={cigars}
            settings={settings}
            onOpenLogSmoke={() => {
              setSelectedCigarForSmoke(null);
              setLogToEdit(null);
              setIsLogSmokeOpen(true);
            }}
            onEditLog={(log) => {
              setLogToEdit(log);
              setSelectedCigarForSmoke(null);
              setIsLogSmokeOpen(true);
            }}
            onDeleteLog={handleDeleteSmokeLog}
          />
        )}

        {activeTab === 'research' && (
          <CigarResearchHub
            cigars={cigars}
            researchDatabase={researchDatabase}
            smokeLogs={smokeLogs}
            wishlist={wishlist}
            settings={settings}
            onUpdateResearchCigar={handleUpdateResearchCigar}
            onAddCustomResearchCigar={handleAddCustomResearchCigar}
            onDeleteResearchCigar={handleDeleteResearchCigar}
            onDeduplicateResearchDatabase={handleDeduplicateResearchDatabase}
            onResetResearchDatabase={handleResetResearchDatabase}
            onClearResearchDatabase={handleClearResearchDatabase}
            onUpdateWishlistItem={handleUpdateWishlistItem}
            onUpdateCigarDirectly={handleUpdateCigarDirectly}
            onInlineRenameCigar={handleInlineRenameCigar}
            onSyncReviewScores={handleSyncReviewScores}
            initialResearchQuery={researchQuery}
            onOpenBasketImporter={() => setIsBasketImporterOpen(true)}
            onAddCigarFromResearch={(prefill) => {
              setPrefilledCigarData(prefill);
              setCigarToEdit(null);
              setIsAddCigarOpen(true);
            }}
            onAddToWishlist={(item) => {
              handleAddWishlistItem({
                brand: item.brand,
                name: item.name,
                vitola: item.vitola,
                notes: item.notes,
                priority: 'High',
              });
              setActiveTab('wishlist');
            }}
            onLogSmokeFromResearch={handleLogSmokeFromResearch}
            onOpenPriceEditor={handleOpenPriceEditorForCigar}
          />
        )}

        {activeTab === 'wishlist' && (
          <WishlistHunting
            wishlist={wishlist}
            settings={settings}
            researchDatabase={researchDatabase}
            onUpdateResearchCigar={handleUpdateResearchCigar}
            onAddWishlistItem={handleAddWishlistItem}
            onUpdateWishlistItem={handleUpdateWishlistItem}
            onDeleteWishlistItem={handleDeleteWishlistItem}
            onAcquireItem={handleAcquireWishlistItem}
            onResearchCigar={handleResearchFromExternal}
            onOpenPriceEditor={handleOpenPriceEditorForCigar}
            onInlineRenameWishlistItem={(item, newB, newN) => handleInlineRenameCigar(item, newB, newN)}
          />
        )}

        {activeTab === 'export' && (
          <ExportSuite
            cigars={cigars}
            humidors={humidors}
            smokeLogs={smokeLogs}
            wishlist={wishlist}
            researchDatabase={researchDatabase}
            settings={settings}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenBasketImporter={() => setIsBasketImporterOpen(true)}
            onImportVault={handleImportVault}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <AddCigarModal
        isOpen={isAddCigarOpen}
        onClose={() => {
          setIsAddCigarOpen(false);
          setCigarToEdit(null);
          setPrefilledCigarData(null);
        }}
        onSave={handleSaveCigar}
        humidors={humidors}
        cigarToEdit={cigarToEdit}
        prefillData={prefilledCigarData}
        onAddToWishlist={(item) => {
          handleAddWishlistItem({
            brand: item.brand,
            name: item.name,
            vitola: item.vitola,
            notes: item.notes,
            priority: item.priority || 'High',
            targetPrice: item.targetPrice,
            sourceRetailer: item.sourceRetailer,
            sourceUrl: item.sourceUrl,
          });
        }}
        onAddToResearch={handleAddCustomResearchCigar}
        onOpenBasketImporter={() => {
          setIsAddCigarOpen(false);
          setIsBasketImporterOpen(true);
        }}
      />

      <ShoppingBasketImporterModal
        isOpen={isBasketImporterOpen}
        onClose={() => setIsBasketImporterOpen(false)}
        humidors={humidors}
        researchDatabase={researchDatabase}
        onAddMultipleToResearch={handleAddMultipleResearchCigars}
        onAddMultipleToHumidor={handleAddMultipleHumidorCigars}
        onAddMultipleToWishlist={handleAddMultipleWishlistItems}
        onSingleAddToResearch={handleAddCustomResearchCigar}
        onSingleAddCigar={(cigar) => handleSaveCigar(cigar)}
        onSingleAddToWishlist={handleAddWishlistItem}
        onLogSmoke={(cigarData) => {
          if (cigarData.brand && (cigarData.name || cigarData.line)) {
            handleLogSmokeFromResearch(
              cigarData.name || cigarData.line || 'Cigar',
              cigarData.brand,
              cigarData.vitola || 'Robusto',
              cigarData.wrapper || 'Natural',
              cigarData.countryOrigin || 'Cuba'
            );
          } else {
            setSelectedCigarForSmoke(null);
            setIsLogSmokeOpen(true);
          }
        }}
      />

      <LogSmokeModal
        isOpen={isLogSmokeOpen}
        onClose={() => {
          setIsLogSmokeOpen(false);
          setSelectedCigarForSmoke(null);
          setLogToEdit(null);
        }}
        onSave={(log, deductCigarId) =>
          handleSaveSmokeLog(log, !!deductCigarId, deductCigarId, logToEdit?.id)
        }
        cigars={cigars}
        preselectedCigarId={selectedCigarForSmoke?.id}
        logToEdit={logToEdit}
      />

      <HumidorManagerDrawer
        isOpen={isHumidorManagerOpen}
        onClose={() => setIsHumidorManagerOpen(false)}
        humidors={humidors}
        cigars={cigars}
        onOpenAddHumidor={() => {
          setHumidorToEdit(null);
          setIsAddHumidorOpen(true);
        }}
        onEditHumidor={(h) => {
          setHumidorToEdit(h);
          setIsAddHumidorOpen(true);
        }}
        onDeleteHumidor={handleDeleteHumidor}
      />

      <HumidorManagerModal
        isOpen={isAddHumidorOpen}
        onClose={() => {
          setIsAddHumidorOpen(false);
          setHumidorToEdit(null);
        }}
        onSave={handleSaveHumidor}
        humidorToEdit={humidorToEdit}
      />

      {/* App Settings Modal */}
      <AppSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      {/* Version History & Changelog Modal */}
      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
      />

      {/* Global Multi-Retailer Price Editor Modal */}
      {priceEditorTarget && (
        <GlobalPriceEditorModal
          isOpen={!!priceEditorTarget}
          onClose={() => setPriceEditorTarget(null)}
          cigarBrand={priceEditorTarget.brand}
          cigarName={priceEditorTarget.name}
          vitola={priceEditorTarget.vitola}
          initialPrices={priceEditorTarget.existingPrices}
          currentPrice={priceEditorTarget.price}
          currentVendor={priceEditorTarget.vendor}
          currentCurrency={priceEditorTarget.currency || settings.globalCurrency || '£'}
          onSavePrices={handleSaveGlobalPrices}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto py-5 border-t border-[#2C2621] bg-[#13110F] text-xs text-[#A89F94]">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif tracking-wider text-[#C5A059] font-medium">The Humidor</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <button
              onClick={() => setIsSettingsOpen(true)}
              id="footer-quick-settings-btn"
              className="flex items-center gap-1.5 text-[#C5A059] hover:text-white px-2.5 py-1 rounded bg-[#1C1816] border border-[#2C2621] hover:border-[#C5A059]/60 transition cursor-pointer font-medium"
            >
              <span>⚙️ Quick Settings</span>
            </button>
            <button
              onClick={() => setIsVersionHistoryOpen(true)}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1816] text-[#C5A059] border border-[#2C2621] hover:border-[#C5A059]/50 transition cursor-pointer"
              title="View Release Changelog"
            >
              v{APP_VERSION}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
