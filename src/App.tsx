import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardOverview } from './components/DashboardOverview';
import { HumidorInventory } from './components/HumidorInventory';
import { SmokeJournal } from './components/SmokeJournal';
// Code-split the heaviest, not-always-visited panels so the initial
// bundle for Dashboard/Inventory/Journal -- what most sessions actually
// open first -- is meaningfully smaller. (Vite/Rollup flagged the single
// 870KB+ bundle; CigarResearchHub and WishlistHunting alone are ~3,900 and
// ~2,800 lines respectively.)
const CigarResearchHub = lazy(() =>
  import('./components/CigarResearchHub').then((m) => ({ default: m.CigarResearchHub }))
);
const WishlistHunting = lazy(() =>
  import('./components/WishlistHunting').then((m) => ({ default: m.WishlistHunting }))
);
const ExportSuite = lazy(() => import('./components/ExportSuite').then((m) => ({ default: m.ExportSuite })));
const ShoppingBasketImporterModal = lazy(() =>
  import('./components/ShoppingBasketImporterModal').then((m) => ({ default: m.ShoppingBasketImporterModal }))
);

const PanelLoading = () => (
  <div className="flex items-center justify-center py-24 text-text-muted text-sm">Loading…</div>
);
import { AddCigarModal } from './components/AddCigarModal';
import { LogSmokeModal } from './components/LogSmokeModal';
import { HumidorManagerModal } from './components/HumidorManagerModal';
import { HumidorManagerDrawer } from './components/HumidorManagerDrawer';

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
import { generateId } from './utils/idUtils';
import { DEFAULT_APP_SETTINGS, APP_VERSION } from './data/versionHistory';
import { STORAGE_KEYS } from './utils/storageKeys';

export function App() {
  // App-wide Customization Settings State with LocalStorage persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.cedarAshSettings);
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
      const saved = localStorage.getItem(STORAGE_KEYS.cedarAshCigars);
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
      const saved = localStorage.getItem(STORAGE_KEYS.cedarAshHumidors);
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
      const saved = localStorage.getItem(STORAGE_KEYS.cedarAshSmokelogs);
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
      const saved = localStorage.getItem(STORAGE_KEYS.cedarAshWishlist);
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
      const saved = localStorage.getItem(STORAGE_KEYS.cedarAshResearchDb);
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
    safeSetItem(STORAGE_KEYS.cedarAshCigars, JSON.stringify(cigars));
  }, [cigars]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.cedarAshHumidors, JSON.stringify(humidors));
  }, [humidors]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.cedarAshSmokelogs, JSON.stringify(smokeLogs));
  }, [smokeLogs]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.cedarAshWishlist, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.cedarAshResearchDb, JSON.stringify(researchDatabase));
  }, [researchDatabase]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.cedarAshSettings, JSON.stringify(settings));
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
      const saved = localStorage.getItem(STORAGE_KEYS.activeTab);
      if (saved && ['dashboard', 'inventory', 'journal', 'research', 'wishlist', 'export'].includes(saved)) {
        return saved as ActiveTab;
      }
    } catch {}
    return 'dashboard';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.activeTab, activeTab);
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
