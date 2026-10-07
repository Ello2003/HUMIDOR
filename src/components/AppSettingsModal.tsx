import React from 'react';
import {
  X,
  Sliders,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  LayoutGrid,
  Layers,
  Sparkles,
  Zap,
  Bookmark,
  Flame,
  Archive,
  BarChart3,
  BookOpen,
  DollarSign,
  Wine,
  Clock,
  Award,
  Maximize2,
  Minimize2,
  Store,
  Globe,
  Star,
  Tag,
  Calendar,
  MapPin,
  Activity,
  SlidersHorizontal,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Search,
} from 'lucide-react';
import { AppSettings } from '../types';
import { DEFAULT_APP_SETTINGS } from '../data/versionHistory';
import { DEFAULT_QUICK_QUOTE_RETAILERS } from '../data/retailers';
import { STORAGE_KEYS } from '../utils/storageKeys';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

type SectionId =
  | 'nav-tabs' | 'retailer-pricing' | 'dashboard' | 'cigar-fields'
  | 'wishlist-fields' | 'humidor-fields' | 'journal-fields' | 'export-suite';

const SECTION_NAV: Array<{ id: SectionId; icon: React.ComponentType<{ className?: string }>; label: string }> = [
  { id: 'nav-tabs', icon: LayoutGrid, label: 'Tabs' },
  { id: 'retailer-pricing', icon: Store, label: 'Pricing' },
  { id: 'dashboard', icon: Layers, label: 'Dashboard' },
  { id: 'cigar-fields', icon: Flame, label: 'Cigar Cards' },
  { id: 'wishlist-fields', icon: Bookmark, label: 'Wishlist' },
  { id: 'humidor-fields', icon: Archive, label: 'Humidor' },
  { id: 'journal-fields', icon: Wine, label: 'Journal' },
  { id: 'export-suite', icon: BarChart3, label: 'Export' },
];

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.settingsCollapsedSections);
      if (saved) return JSON.parse(saved);
    } catch {
      // Corrupt or inaccessible storage -- every section just starts expanded.
    }
    return {};
  });

  const toggleCollapsed = (id: SectionId) => {
    setCollapsed((current) => {
      const next = { ...current, [id]: !current[id] };
      try {
        localStorage.setItem(STORAGE_KEYS.settingsCollapsedSections, JSON.stringify(next));
      } catch {
        // Best-effort persistence; the in-memory state still updates.
      }
      return next;
    });
  };

  const setAllCollapsed = (value: boolean) => {
    const next = Object.fromEntries(SECTION_NAV.map((s) => [s.id, value]));
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEYS.settingsCollapsedSections, JSON.stringify(next));
    } catch {
      // Best-effort persistence; the in-memory state still updates.
    }
  };

  const jumpToSection = (id: SectionId) => {
    if (collapsed[id]) toggleCollapsed(id);
    requestAnimationFrame(() => {
      document.getElementById(`settings-section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  /**
   * One collapsible section wrapper, used by every section below. It owns
   * the clickable header (title, description, chevron) and the "hidden when
   * collapsed or filtered out by search" body -- previously each of the 8
   * sections had its own hand-written, always-expanded header with no way
   * to collapse it or jump to it directly from a long, single scrolling list.
   */
  function Section({
    id,
    icon: Icon,
    title,
    description,
    searchTerms,
    children,
  }: {
    id: SectionId;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    searchTerms: string[];
    children: React.ReactNode;
  }) {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [title, description, ...searchTerms]
      .some((t) => t.toLowerCase().includes(query));
    if (!matchesSearch) return null;

    const isCollapsed = Boolean(collapsed[id]) && !query; // never collapse a section actively matching a search
    return (
      <div id={`settings-section-${id}`} className="space-y-3 scroll-mt-3">
        <button
          type="button"
          onClick={() => toggleCollapsed(id)}
          className="w-full flex items-center justify-between gap-3 text-left group"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-gold" />
            <span>{title}</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-muted hidden sm:inline">{description}</span>
            <ChevronDown className={`w-4 h-4 text-text-muted group-hover:text-white transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
          </div>
        </button>
        {!isCollapsed && children}
      </div>
    );
  }

  if (!isOpen) return null;

  const toggleTab = (tabKey: keyof AppSettings['visibleTabs']) => {
    const current = settings.visibleTabs[tabKey];
    // Ensure at least one tab remains visible
    const visibleCount = Object.values(settings.visibleTabs).filter(Boolean).length;
    if (current && visibleCount <= 1) return;

    onUpdateSettings({
      ...settings,
      visibleTabs: {
        ...settings.visibleTabs,
        [tabKey]: !current,
      },
    });
  };

  const toggleDashboardSection = (secKey: keyof AppSettings['dashboardSections']) => {
    onUpdateSettings({
      ...settings,
      dashboardSections: {
        ...settings.dashboardSections,
        [secKey]: !settings.dashboardSections[secKey],
      },
    });
  };

  const toggleCigarField = (fieldKey: keyof AppSettings['cigarFieldVisibility']) => {
    onUpdateSettings({
      ...settings,
      cigarFieldVisibility: {
        ...settings.cigarFieldVisibility,
        [fieldKey]: !settings.cigarFieldVisibility[fieldKey],
      },
    });
  };

  const toggleWishlistField = (fieldKey: keyof NonNullable<AppSettings['wishlistFieldVisibility']>) => {
    const current = settings.wishlistFieldVisibility || DEFAULT_APP_SETTINGS.wishlistFieldVisibility!;
    onUpdateSettings({
      ...settings,
      wishlistFieldVisibility: {
        ...current,
        [fieldKey]: !current[fieldKey],
      },
    });
  };

  const toggleHumidorField = (fieldKey: keyof NonNullable<AppSettings['humidorFieldVisibility']>) => {
    const current = settings.humidorFieldVisibility || DEFAULT_APP_SETTINGS.humidorFieldVisibility!;
    onUpdateSettings({
      ...settings,
      humidorFieldVisibility: {
        ...current,
        [fieldKey]: !current[fieldKey],
      },
    });
  };

  const toggleJournalField = (fieldKey: keyof NonNullable<AppSettings['journalFieldVisibility']>) => {
    const current = settings.journalFieldVisibility || DEFAULT_APP_SETTINGS.journalFieldVisibility!;
    onUpdateSettings({
      ...settings,
      journalFieldVisibility: {
        ...current,
        [fieldKey]: !current[fieldKey],
      },
    });
  };

  const setAllCigarFields = (keys: Array<keyof AppSettings['cigarFieldVisibility']>, value: boolean) => {
    const next = { ...settings.cigarFieldVisibility };
    keys.forEach((k) => { next[k] = value; });
    onUpdateSettings({ ...settings, cigarFieldVisibility: next });
  };

  const setAllWishlistFields = (keys: Array<keyof NonNullable<AppSettings['wishlistFieldVisibility']>>, value: boolean) => {
    const current = settings.wishlistFieldVisibility || DEFAULT_APP_SETTINGS.wishlistFieldVisibility!;
    const next = { ...current };
    keys.forEach((k) => { next[k] = value; });
    onUpdateSettings({ ...settings, wishlistFieldVisibility: next });
  };

  const setAllHumidorFields = (keys: Array<keyof NonNullable<AppSettings['humidorFieldVisibility']>>, value: boolean) => {
    const current = settings.humidorFieldVisibility || DEFAULT_APP_SETTINGS.humidorFieldVisibility!;
    const next = { ...current };
    keys.forEach((k) => { next[k] = value; });
    onUpdateSettings({ ...settings, humidorFieldVisibility: next });
  };

  const setAllJournalFields = (keys: Array<keyof NonNullable<AppSettings['journalFieldVisibility']>>, value: boolean) => {
    const current = settings.journalFieldVisibility || DEFAULT_APP_SETTINGS.journalFieldVisibility!;
    const next = { ...current };
    keys.forEach((k) => { next[k] = value; });
    onUpdateSettings({ ...settings, journalFieldVisibility: next });
  };

  const setAllVisibleTabs = (keys: Array<keyof AppSettings['visibleTabs']>, value: boolean) => {
    const next = { ...settings.visibleTabs };
    keys.forEach((k) => { next[k] = value; });
    onUpdateSettings({ ...settings, visibleTabs: next });
  };

  const setAllDashboardSections = (keys: Array<keyof AppSettings['dashboardSections']>, value: boolean) => {
    const next = { ...settings.dashboardSections };
    keys.forEach((k) => { next[k] = value; });
    onUpdateSettings({ ...settings, dashboardSections: next });
  };

  /**
   * Shared renderer for every "grid of on/off field toggles" section
   * (Cigar Detail Cards, Wishlist, Humidor, Journal, Dashboard Modules).
   * These five sections used to each hand-roll an identical grid of toggle
   * buttons -- same markup, same classes, same Check/Off treatment -- with
   * no way to turn a whole section on or off at once. One render function
   * now backs all five, and adds that bulk action for free.
   */
  function renderToggleGrid<K extends string>(
    items: Array<{ key: K; label: string; icon?: React.ComponentType<{ className?: string }> }>,
    isVisible: (key: K) => boolean,
    onToggle: (key: K) => void,
    onSetAll: (keys: K[], value: boolean) => void,
    columns: string = 'grid-cols-2 sm:grid-cols-4',
  ) {
    const allKeys = items.map((i) => i.key);
    const visibleCount = items.filter((i) => isVisible(i.key)).length;
    return (
      <>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider shrink-0">
          <span className="text-text-muted">{visibleCount}/{items.length} shown</span>
          <button
            type="button"
            onClick={() => onSetAll(allKeys, true)}
            disabled={visibleCount === items.length}
            className="text-gold hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            All
          </button>
          <span className="text-line">/</span>
          <button
            type="button"
            onClick={() => onSetAll(allKeys, false)}
            disabled={visibleCount === 0}
            className="text-gold hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            None
          </button>
        </div>
        <div className={`grid ${columns} gap-2`}>
          {items.map(({ key, label, icon: Icon }) => {
            const visible = isVisible(key);
            return (
              <button
                key={key}
                onClick={() => onToggle(key)}
                className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                  visible
                    ? 'bg-section-header border-gold/40 text-white'
                    : 'bg-surface border-line text-text-muted opacity-50 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${visible ? 'text-gold' : 'text-text-muted'}`} />}
                  <span className="text-xs font-semibold truncate">{label}</span>
                </div>
                {visible ? (
                  <Check className="w-3.5 h-3.5 text-gold shrink-0" />
                ) : (
                  <span className="text-[10px] text-text-muted">{Icon ? 'Off' : 'Hidden'}</span>
                )}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  const toggleExportSuiteOption = (optKey: string) => {
    const currentOptions = settings.exportSuiteOptions || {
      showResearchExport: true,
      showMasterJson: true,
      showInventoryCsv: true,
      showTastingCsv: true,
      showMarkdownExport: true,
      showPrintablePdf: true,
      showRestoreBackup: true,
      includeTastingNotesInInventoryCsv: false,
    };
    onUpdateSettings({
      ...settings,
      exportSuiteOptions: {
        ...currentOptions,
        [optKey]: !((currentOptions as any)[optKey]),
      },
    });
  };

  const togglePriceSyncOption = (optKey: string) => {
    const current = settings.priceSyncBehavior || {
      autoSyncToHumidor: true,
      autoSyncToWishlist: true,
      autoMergeIdenticalSticks: true,
    };
    onUpdateSettings({
      ...settings,
      priceSyncBehavior: {
        ...current,
        [optKey]: !((current as any)[optKey]),
      },
    });
  };

  const toggleResearchOption = (optKey: string) => {
    const current = settings.researchSettings || {
      autoMergeDuplicatesOnImport: true,
      displayRetailerCount: true,
      preferLowestPriceDisplay: true,
    };
    onUpdateSettings({
      ...settings,
      researchSettings: {
        ...current,
        [optKey]: !((current as any)[optKey]),
      },
    });
  };

  const handleApplyPreset = (preset: 'all' | 'minimalist') => {
    if (preset === 'all') {
      onUpdateSettings({ ...DEFAULT_APP_SETTINGS, streamlinedMode: false });
    } else if (preset === 'minimalist') {
      onUpdateSettings({
        visibleTabs: {
          dashboard: true,
          humidors: true,
          cigars: true,
          smokes: true,
          research: true,
          wishlist: false,
          analytics: false,
        },
        dashboardSections: {
          quickStats: true,
          agingAlerts: false,
          dailyRecommendation: false,
          quickSmokeBanner: false,
          recentSmokes: true,
          humidorOverview: true,
        },
        cigarFieldVisibility: {
          flavorProfiles: false,
          tastingProgression: false,
          vendorPriceComparison: true,
          drinkPairings: false,
          criticRatings: false,
          agingTimeline: false,
          factoryDetails: false,
          dimensions: true,
        },
        wishlistFieldVisibility: {
          targetPrice: true,
          retailerQuotes: true,
          notes: true,
          smokeTime: true,
          vitolaSpecs: true,
          priority: true,
          rating: true,
        },
        humidorFieldVisibility: {
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
        },
        journalFieldVisibility: {
          dateAndLocation: true,
          scoreAndStars: true,
          vitolaAndWrapper: true,
          duration: true,
          pairing: false,
          rebuyVerdict: true,
          flavorsAndNotes: false,
          burnAndDraw: false,
        },
        quickQuoteRetailers: DEFAULT_QUICK_QUOTE_RETAILERS,
        exportSuiteOptions: {
          showResearchExport: true,
          showMasterJson: true,
          showInventoryCsv: true,
          showTastingCsv: true,
          showMarkdownExport: false,
          showPrintablePdf: true,
          showRestoreBackup: true,
          includeTastingNotesInInventoryCsv: false,
        },
        globalCurrency: '£',
        priceSyncBehavior: {
          autoSyncToHumidor: true,
          autoSyncToWishlist: true,
          autoMergeIdenticalSticks: true,
        },
        researchSettings: {
          autoMergeDuplicatesOnImport: true,
          displayRetailerCount: true,
          preferLowestPriceDisplay: true,
        },
        uiDensity: 'compact',
        streamlinedMode: true,
      });
    }
  };

  const handleResetDefaults = () => {
    onUpdateSettings({ ...DEFAULT_APP_SETTINGS });
  };

  const wishlistVisibility = settings.wishlistFieldVisibility || DEFAULT_APP_SETTINGS.wishlistFieldVisibility!;
  const humidorVisibility = settings.humidorFieldVisibility || DEFAULT_APP_SETTINGS.humidorFieldVisibility!;
  const journalVisibility = settings.journalFieldVisibility || DEFAULT_APP_SETTINGS.journalFieldVisibility!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-modal border border-line rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white">Full Suite Customization Settings</h2>
              <p className="text-xs text-text-muted">
                Customize navigation tabs, humidor sync rules, retailer price merging, and dashboard layouts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-white hover:bg-line rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search + section jump + expand/collapse all */}
        <div className="px-5 py-3 border-b border-line bg-surface space-y-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings…"
              className="w-full pl-9 pr-3 py-2 bg-modal border border-line rounded-lg text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-gold/50"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {SECTION_NAV.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => jumpToSection(id)}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-line bg-modal hover:border-gold/50 text-[11px] font-semibold text-text-muted hover:text-white transition"
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
            <span className="shrink-0 w-px h-5 bg-line mx-1" />
            <button
              type="button"
              onClick={() => setAllCollapsed(false)}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-line bg-modal hover:border-gold/50 text-[11px] font-semibold text-text-muted hover:text-white transition"
            >
              <ChevronsUpDown className="w-3 h-3" />
              Expand all
            </button>
            <button
              type="button"
              onClick={() => setAllCollapsed(true)}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-line bg-modal hover:border-gold/50 text-[11px] font-semibold text-text-muted hover:text-white transition"
            >
              <ChevronsDownUp className="w-3 h-3" />
              Collapse all
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Presets */}
          <div className="p-4 bg-surface border border-line rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Layout Presets</span>
              </span>
              <button
                onClick={handleResetDefaults}
                className="text-xs text-text-muted hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All Defaults</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleApplyPreset('all')}
                className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                  !settings.streamlinedMode
                    ? 'bg-line border-gold text-white'
                    : 'bg-modal border-line text-text-muted hover:border-line-hover'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-gold" />
                    <span>Connoisseur Full View</span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    All analytics, 3-thirds flavor wheels, pairings, aging radars
                  </p>
                </div>
                {!settings.streamlinedMode && <Check className="w-4 h-4 text-gold shrink-0" />}
              </button>

              <button
                onClick={() => handleApplyPreset('minimalist')}
                className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                  settings.streamlinedMode
                    ? 'bg-line border-gold text-white'
                    : 'bg-modal border-line text-text-muted hover:border-line-hover'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Minimize2 className="w-3.5 h-3.5 text-gold" />
                    <span>Streamlined Minimalist</span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Focus strictly on your active Humidor vault, fast search, and price tracking
                  </p>
                </div>
                {settings.streamlinedMode && <Check className="w-4 h-4 text-gold shrink-0" />}
              </button>
            </div>
          </div>

          <Section
            id="nav-tabs"
            icon={LayoutGrid}
            title="Primary Navigation Tabs"
            description="Toggle which views appear in your top bar"
            searchTerms={['dashboard', 'humidors', 'cigars', 'tasting log', 'research', 'wishlist', 'analytics']}
          >
            {renderToggleGrid(
              [
                { key: 'dashboard' as const, label: 'Dashboard', icon: Layers },
                { key: 'humidors' as const, label: 'Humidor Vaults', icon: Archive },
                { key: 'cigars' as const, label: 'Cigar Inventory', icon: Flame },
                { key: 'smokes' as const, label: 'Tasting Log', icon: Wine },
                { key: 'research' as const, label: 'Research Library', icon: BookOpen },
                { key: 'wishlist' as const, label: 'Wishlist & Hunt', icon: Bookmark },
                { key: 'analytics' as const, label: 'Cellar Analytics', icon: BarChart3 },
              ],
              (key) => settings.visibleTabs[key],
              toggleTab,
              setAllVisibleTabs,
            )}
          </Section>

          <Section
            id="retailer-pricing"
            icon={Store}
            title="Retailer Pricing, Currency & Site-Wide Sync Rules"
            description="Configure automatic price propagation"
            searchTerms={['currency', 'sync', 'merge', 'quick quote', 'retailers']}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  key: 'autoSyncToHumidor',
                  label: 'Auto-Sync Prices to Humidor Inventory',
                  desc: 'Updating a retailer price updates matched cigars in your humidor vault.',
                },
                {
                  key: 'autoSyncToWishlist',
                  label: 'Auto-Sync Prices to Wishlist Targets',
                  desc: 'Keep wishlist target sticks updated with current lowest market prices.',
                },
                {
                  key: 'autoMergeIdenticalSticks',
                  label: 'Automatic Duplicate Stick Merging',
                  desc: 'Automatically combine identical vitolas across humidor vaults upon import.',
                },
                {
                  key: 'preferLowestPriceDisplay',
                  label: 'Highlight Best Retailer Price',
                  desc: 'Show best bargain tag on price comparison tables across all cigars.',
                },
              ].map((item) => {
                const isSync = item.key in (settings.priceSyncBehavior || {});
                const isChecked = isSync
                  ? (settings.priceSyncBehavior as any)?.[item.key] ?? true
                  : (settings.researchSettings as any)?.[item.key] ?? true;

                return (
                  <button
                    key={item.key}
                    onClick={() => (isSync ? togglePriceSyncOption(item.key) : toggleResearchOption(item.key))}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-start justify-between gap-2.5 ${
                      isChecked
                        ? 'bg-section-header border-gold/40 text-white'
                        : 'bg-surface border-line text-text-muted opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-semibold text-text">{item.label}</div>
                      <div className="text-[11px] text-text-muted leading-tight">{item.desc}</div>
                    </div>
                    {isChecked ? (
                      <span className="px-1.5 py-0.5 bg-gold/20 text-gold border border-gold/30 rounded text-[10px] font-bold uppercase shrink-0">
                        Enabled
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-line text-text-muted rounded text-[10px] font-medium uppercase shrink-0">
                        Disabled
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section
            id="dashboard"
            icon={Layers}
            title="Dashboard Modules"
            description="Control widgets on the main dashboard"
            searchTerms={['vault valuation', 'aging alerts', 'sommelier', 'quick smoke', 'recent smokes', 'humidity']}
          >
            {renderToggleGrid(
              [
                { key: 'quickStats' as const, label: 'Vault Valuation & Stick Counters' },
                { key: 'agingAlerts' as const, label: 'Peak Smoking Window Alerts' },
                { key: 'dailyRecommendation' as const, label: 'AI Sommelier Cigar Pick' },
                { key: 'quickSmokeBanner' as const, label: 'Express Tasting Log Bar' },
                { key: 'recentSmokes' as const, label: 'Recent Smokes Timeline' },
                { key: 'humidorOverview' as const, label: 'Humidor Vault Humidity Gauges' },
              ],
              (key) => settings.dashboardSections[key],
              toggleDashboardSection,
              setAllDashboardSections,
              'grid-cols-1 sm:grid-cols-3',
            )}
          </Section>

          <Section
            id="cigar-fields"
            icon={Flame}
            title="Cigar Detail & Specification Cards"
            description="Show/hide analytical sections on cigar dossiers"
            searchTerms={['flavor', 'tasting', 'price', 'pairing', 'critic', 'aging', 'wrapper', 'dimensions']}
          >
            {renderToggleGrid(
              [
                { key: 'flavorProfiles' as const, label: 'Flavor Descriptors', icon: Sparkles },
                { key: 'tastingProgression' as const, label: '3-Thirds Evolution', icon: Wine },
                { key: 'vendorPriceComparison' as const, label: 'Retailer Price Grid', icon: DollarSign },
                { key: 'drinkPairings' as const, label: 'Drink Pairings', icon: Wine },
                { key: 'criticRatings' as const, label: 'Critic & Consensus', icon: Award },
                { key: 'agingTimeline' as const, label: 'Resting Timeline', icon: Clock },
                { key: 'factoryDetails' as const, label: 'Wrapper & Factory Blend', icon: Archive },
                { key: 'dimensions' as const, label: 'Ring Gauge & Length', icon: Sliders },
              ],
              (key) => settings.cigarFieldVisibility[key],
              toggleCigarField,
              setAllCigarFields,
            )}
          </Section>

          <Section
            id="wishlist-fields"
            icon={Bookmark}
            title="Wishlist & Cigar Hunting View Fields"
            description="Configure columns and card items in Wishlist"
            searchTerms={['rating', 'priority', 'target price', 'shop quotes', 'smoke time', 'vitola', 'notes']}
          >
            {renderToggleGrid(
              [
                { key: 'rating' as const, label: 'Critic & Panel Rating', icon: Star },
                { key: 'priority' as const, label: 'Priority Badge', icon: Flame },
                { key: 'targetPrice' as const, label: 'Target Max Price', icon: DollarSign },
                { key: 'retailerQuotes' as const, label: 'Live Shop Quotes', icon: Store },
                { key: 'smokeTime' as const, label: 'Smoke Duration', icon: Clock },
                { key: 'vitolaSpecs' as const, label: 'Vitola Dimensions', icon: SlidersHorizontal },
                { key: 'notes' as const, label: 'Hunter Notes', icon: Tag },
              ],
              (key) => wishlistVisibility[key] ?? true,
              toggleWishlistField,
              setAllWishlistFields,
            )}
          </Section>

          <Section
            id="humidor-fields"
            icon={Archive}
            title="Humidor Vault Inventory Columns"
            description="Configure columns and card data in Humidor"
            searchTerms={['rating', 'resting', 'pricing', 'shop quotes', 'smoke time', 'vitola', 'wrapper', 'strength', 'flavor', 'notes']}
          >
            {renderToggleGrid(
              [
                { key: 'rating' as const, label: 'Personal Rating', icon: Star },
                { key: 'humidorResting' as const, label: 'Vault & Aging Status', icon: Clock },
                { key: 'pricing' as const, label: 'Purchase Valuation', icon: DollarSign },
                { key: 'retailerQuotes' as const, label: 'Live Shop Quotes', icon: Store },
                { key: 'smokeTime' as const, label: 'Smoke Duration', icon: Clock },
                { key: 'vitolaSpecs' as const, label: 'Vitola & Ring Gauge', icon: Sliders },
                { key: 'wrapperOrigin' as const, label: 'Wrapper & Terroir', icon: Globe },
                { key: 'strength' as const, label: 'Strength Gauge', icon: Flame },
                { key: 'flavorTags' as const, label: 'Flavor Descriptors', icon: Sparkles },
                { key: 'notes' as const, label: 'Notes & Quotes', icon: Tag },
              ],
              (key) => humidorVisibility[key] ?? true,
              toggleHumidorField,
              setAllHumidorFields,
              'grid-cols-2 sm:grid-cols-5',
            )}
          </Section>

          <Section
            id="journal-fields"
            icon={Wine}
            title="Tasting Journal (Smoked) Log Fields"
            description="Configure card and table fields in Tasting Journal"
            searchTerms={['score', 'date', 'location', 'vitola', 'wrapper', 'duration', 'pairing', 'rebuy', 'flavors', 'burn', 'draw']}
          >
            {renderToggleGrid(
              [
                { key: 'scoreAndStars' as const, label: '100-Pt Score & Stars', icon: Star },
                { key: 'dateAndLocation' as const, label: 'Smoke Date & Location', icon: Calendar },
                { key: 'vitolaAndWrapper' as const, label: 'Vitola & Wrapper Specs', icon: Sliders },
                { key: 'duration' as const, label: 'Smoke Duration', icon: Clock },
                { key: 'pairing' as const, label: 'Drink & Food Pairings', icon: Wine },
                { key: 'rebuyVerdict' as const, label: 'Rebuy / Box Verdict', icon: Award },
                { key: 'flavorsAndNotes' as const, label: '3-Thirds Flavors & Notes', icon: Sparkles },
                { key: 'burnAndDraw' as const, label: 'Burn & Draw Metrics', icon: Activity },
              ],
              (key) => journalVisibility[key] ?? true,
              toggleJournalField,
              setAllJournalFields,
            )}
          </Section>

          <Section
            id="export-suite"
            icon={BarChart3}
            title="Export Suite Modules & Backup Formats"
            description="Choose which download formats & options appear in Export Suite"
            searchTerms={['research', 'master json', 'inventory csv', 'tasting csv', 'markdown', 'pdf', 'restore', 'backup']}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { key: 'showResearchExport', label: 'Cigar Research Library JSON', desc: 'Curated brand database with wrapper classifications & tasting dossiers' },
                { key: 'showMasterJson', label: 'Complete Master Vault JSON', desc: 'Full lossless backup containing inventory, humidors, logs & wishlist' },
                { key: 'showInventoryCsv', label: 'Humidor Inventory CSV', desc: 'Spreadsheet of sticks, resting days, prices, and vitola dimensions' },
                { key: 'showTastingCsv', label: 'Tasting Journal CSV', desc: 'Spreadsheet of smoke logs with 100-pt scores and flavor notes' },
                { key: 'showMarkdownExport', label: 'Obsidian / Markdown Journal', desc: 'Formatted markdown journal with YAML metadata and bulleted thirds' },
                { key: 'showPrintablePdf', label: 'Printable Cellar Dossier (PDF)', desc: 'Print-ready formatted cellar report and valuation summary' },
                { key: 'showRestoreBackup', label: 'Restore & Import Backup Box', desc: 'File picker to restore master JSON vault backups' },
              ].map((opt) => {
                const currentOpts = settings.exportSuiteOptions || {
                  showResearchExport: true,
                  showMasterJson: true,
                  showInventoryCsv: true,
                  showTastingCsv: true,
                  showMarkdownExport: true,
                  showPrintablePdf: true,
                  showRestoreBackup: true,
                };
                const isVisible = (currentOpts as any)[opt.key] ?? true;

                return (
                  <button
                    key={opt.key}
                    onClick={() => toggleExportSuiteOption(opt.key)}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-start justify-between gap-2.5 ${
                      isVisible
                        ? 'bg-section-header border-gold/40 text-white'
                        : 'bg-surface border-line text-text-muted opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-semibold text-text">{opt.label}</div>
                      <div className="text-[11px] text-text-muted leading-tight">{opt.desc}</div>
                    </div>
                    {isVisible ? (
                      <span className="px-1.5 py-0.5 bg-gold/20 text-gold border border-gold/30 rounded text-[10px] font-bold uppercase shrink-0">
                        Visible
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-line text-text-muted rounded text-[10px] font-medium uppercase shrink-0">
                        Hidden
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-surface flex items-center justify-between">
          <div className="text-xs text-text-muted">
            All configuration changes persist safely in local storage
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gold hover:brightness-110 text-ink font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition cursor-pointer"
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};
