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
  RefreshCw,
  Globe,
  Star,
  Tag,
  Calendar,
  MapPin,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import { AppSettings } from '../types';
import { DEFAULT_APP_SETTINGS } from '../data/versionHistory';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
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
        quickQuoteRetailers: [
          'C.Gars Ltd',
          'Havana House',
          'Smoke King',
          'Sautter London',
          'Neptune',
          'Fox Cigar',
          'Davidoff London',
          "Holt's",
        ],
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

          {/* Section 1: Navigation Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <LayoutGrid className="w-3.5 h-3.5 text-gold" />
                <span>Primary Navigation Tabs</span>
              </h3>
              <span className="text-[11px] text-text-muted">Toggle which views appear in your top bar</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'dashboard' as const, label: 'Dashboard', icon: Layers },
                { key: 'humidors' as const, label: 'Humidor Vaults', icon: Archive },
                { key: 'cigars' as const, label: 'Cigar Inventory', icon: Flame },
                { key: 'smokes' as const, label: 'Tasting Log', icon: Wine },
                { key: 'research' as const, label: 'Research Library', icon: BookOpen },
                { key: 'wishlist' as const, label: 'Wishlist & Hunt', icon: Bookmark },
                { key: 'analytics' as const, label: 'Cellar Analytics', icon: BarChart3 },
              ].map(({ key, label, icon: Icon }) => {
                const isVisible = settings.visibleTabs[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleTab(key)}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                      isVisible
                        ? 'bg-section-header border-gold/40 text-white'
                        : 'bg-surface border-line text-text-muted opacity-50 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isVisible ? 'text-gold' : 'text-text-muted'}`} />
                      <span className="text-xs font-semibold truncate">{label}</span>
                    </div>
                    {isVisible ? (
                      <Eye className="w-3.5 h-3.5 text-gold shrink-0" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Global Retailer Pricing & Multi-Shop Deduplication */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-gold" />
                <span>Retailer Pricing, Currency & Site-Wide Sync Rules</span>
              </h3>
              <span className="text-[11px] text-text-muted">Configure automatic price propagation</span>
            </div>

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
          </div>

          {/* Section 3: Dashboard Modules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-gold" />
                <span>Dashboard Modules</span>
              </h3>
              <span className="text-[11px] text-text-muted">Control widgets on the main dashboard</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { key: 'quickStats' as const, label: 'Vault Valuation & Stick Counters' },
                { key: 'agingAlerts' as const, label: 'Peak Smoking Window Alerts' },
                { key: 'dailyRecommendation' as const, label: 'AI Sommelier Cigar Pick' },
                { key: 'quickSmokeBanner' as const, label: 'Express Tasting Log Bar' },
                { key: 'recentSmokes' as const, label: 'Recent Smokes Timeline' },
                { key: 'humidorOverview' as const, label: 'Humidor Vault Humidity Gauges' },
              ].map(({ key, label }) => {
                const isVisible = settings.dashboardSections[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleDashboardSection(key)}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                      isVisible
                        ? 'bg-section-header border-gold/40 text-white'
                        : 'bg-surface border-line text-text-muted opacity-50 hover:opacity-100'
                    }`}
                  >
                    <span className="text-xs font-medium">{label}</span>
                    {isVisible ? (
                      <Check className="w-3.5 h-3.5 text-gold shrink-0" />
                    ) : (
                      <span className="text-[10px] text-text-muted">Hidden</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Cigar Detail Card Fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-gold" />
                <span>Cigar Detail & Specification Cards</span>
              </h3>
              <span className="text-[11px] text-text-muted">Show/hide analytical sections on cigar dossiers</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'flavorProfiles' as const, label: 'Flavor Descriptors', icon: Sparkles },
                { key: 'tastingProgression' as const, label: '3-Thirds Evolution', icon: Wine },
                { key: 'vendorPriceComparison' as const, label: 'Retailer Price Grid', icon: DollarSign },
                { key: 'drinkPairings' as const, label: 'Drink Pairings', icon: Wine },
                { key: 'criticRatings' as const, label: 'Critic & Consensus', icon: Award },
                { key: 'agingTimeline' as const, label: 'Resting Timeline', icon: Clock },
                { key: 'factoryDetails' as const, label: 'Wrapper & Factory Blend', icon: Archive },
                { key: 'dimensions' as const, label: 'Ring Gauge & Length', icon: Sliders },
              ].map(({ key, label, icon: Icon }) => {
                const isVisible = settings.cigarFieldVisibility[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleCigarField(key)}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                      isVisible
                        ? 'bg-section-header border-gold/40 text-white'
                        : 'bg-surface border-line text-text-muted opacity-50 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isVisible ? 'text-gold' : 'text-text-muted'}`} />
                      <span className="text-xs font-semibold truncate">{label}</span>
                    </div>
                    {isVisible ? (
                      <Check className="w-3.5 h-3.5 text-gold shrink-0" />
                    ) : (
                      <span className="text-[10px] text-text-muted">Off</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Wishlist & Hunt View Display Fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Bookmark className="w-3.5 h-3.5 text-gold" />
                <span>Wishlist & Cigar Hunting View Fields</span>
              </h3>
              <span className="text-[11px] text-text-muted">Configure columns and card items in Wishlist</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'rating' as const, label: 'Critic & Panel Rating', icon: Star },
                { key: 'priority' as const, label: 'Priority Badge', icon: Flame },
                { key: 'targetPrice' as const, label: 'Target Max Price', icon: DollarSign },
                { key: 'retailerQuotes' as const, label: 'Live Shop Quotes', icon: Store },
                { key: 'smokeTime' as const, label: 'Smoke Duration', icon: Clock },
                { key: 'vitolaSpecs' as const, label: 'Vitola Dimensions', icon: SlidersHorizontal },
                { key: 'notes' as const, label: 'Hunter Notes', icon: Tag },
              ].map(({ key, label, icon: Icon }) => {
                const isVisible = wishlistVisibility[key] ?? true;
                return (
                  <button
                    key={key}
                    onClick={() => toggleWishlistField(key)}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                      isVisible
                        ? 'bg-section-header border-gold/40 text-white'
                        : 'bg-surface border-line text-text-muted opacity-50 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isVisible ? 'text-gold' : 'text-text-muted'}`} />
                      <span className="text-xs font-semibold truncate">{label}</span>
                    </div>
                    {isVisible ? (
                      <Check className="w-3.5 h-3.5 text-gold shrink-0" />
                    ) : (
                      <span className="text-[10px] text-text-muted">Off</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 6: Humidor Inventory Display Fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Archive className="w-3.5 h-3.5 text-gold" />
                <span>Humidor Vault Inventory Columns</span>
              </h3>
              <span className="text-[11px] text-text-muted">Configure columns and card data in Humidor</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
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
              ].map(({ key, label, icon: Icon }) => {
                const isVisible = humidorVisibility[key] ?? true;
                return (
                  <button
                    key={key}
                    onClick={() => toggleHumidorField(key)}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                      isVisible
                        ? 'bg-section-header border-gold/40 text-white'
                        : 'bg-surface border-line text-text-muted opacity-50 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isVisible ? 'text-gold' : 'text-text-muted'}`} />
                      <span className="text-xs font-semibold truncate">{label}</span>
                    </div>
                    {isVisible ? (
                      <Check className="w-3.5 h-3.5 text-gold shrink-0" />
                    ) : (
                      <span className="text-[10px] text-text-muted">Off</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 7: Tasting Journal (Smoked) Display Fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Wine className="w-3.5 h-3.5 text-gold" />
                <span>Tasting Journal (Smoked) Log Fields</span>
              </h3>
              <span className="text-[11px] text-text-muted">Configure card and table fields in Tasting Journal</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'scoreAndStars' as const, label: '100-Pt Score & Stars', icon: Star },
                { key: 'dateAndLocation' as const, label: 'Smoke Date & Location', icon: Calendar },
                { key: 'vitolaAndWrapper' as const, label: 'Vitola & Wrapper Specs', icon: Sliders },
                { key: 'duration' as const, label: 'Smoke Duration', icon: Clock },
                { key: 'pairing' as const, label: 'Drink & Food Pairings', icon: Wine },
                { key: 'rebuyVerdict' as const, label: 'Rebuy / Box Verdict', icon: Award },
                { key: 'flavorsAndNotes' as const, label: '3-Thirds Flavors & Notes', icon: Sparkles },
                { key: 'burnAndDraw' as const, label: 'Burn & Draw Metrics', icon: Activity },
              ].map(({ key, label, icon: Icon }) => {
                const isVisible = journalVisibility[key] ?? true;
                return (
                  <button
                    key={key}
                    onClick={() => toggleJournalField(key)}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                      isVisible
                        ? 'bg-section-header border-gold/40 text-white'
                        : 'bg-surface border-line text-text-muted opacity-50 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isVisible ? 'text-gold' : 'text-text-muted'}`} />
                      <span className="text-xs font-semibold truncate">{label}</span>
                    </div>
                    {isVisible ? (
                      <Check className="w-3.5 h-3.5 text-gold shrink-0" />
                    ) : (
                      <span className="text-[10px] text-text-muted">Off</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 8: Export Suite Customization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-gold" />
                <span>Export Suite Modules & Backup Formats</span>
              </h3>
              <span className="text-[11px] text-text-muted">
                Choose which download formats & options appear in Export Suite
              </span>
            </div>

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
          </div>
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
