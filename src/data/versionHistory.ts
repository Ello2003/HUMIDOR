import { VersionHistoryEntry, AppSettings } from '../types';
import { DEFAULT_QUICK_QUOTE_RETAILERS } from './retailers';

export const APP_VERSION = 'v2.14.1';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  visibleTabs: {
    dashboard: true,
    humidors: true,
    cigars: true,
    smokes: true,
    research: true,
    wishlist: true,
    analytics: true,
  },
  dashboardSections: {
    quickStats: true,
    agingAlerts: true,
    dailyRecommendation: true,
    quickSmokeBanner: true,
    recentSmokes: true,
    humidorOverview: true,
  },
  cigarFieldVisibility: {
    flavorProfiles: true,
    tastingProgression: true,
    vendorPriceComparison: true,
    drinkPairings: true,
    criticRatings: true,
    agingTimeline: true,
    factoryDetails: true,
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
    flavorTags: true,
    notes: true,
    retailerQuotes: true,
    pricing: true,
    rating: true,
  },
  journalFieldVisibility: {
    dateAndLocation: true,
    scoreAndStars: true,
    vitolaAndWrapper: true,
    duration: true,
    pairing: true,
    rebuyVerdict: true,
    flavorsAndNotes: true,
    burnAndDraw: true,
  },
  quickQuoteRetailers: DEFAULT_QUICK_QUOTE_RETAILERS,
  exportSuiteOptions: {
    showResearchExport: true,
    showMasterJson: true,
    showInventoryCsv: true,
    showTastingCsv: true,
    showMarkdownExport: true,
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
  uiDensity: 'comfortable',
  streamlinedMode: false,
};

export const VERSION_HISTORY: VersionHistoryEntry[] = [
  {
    version: 'v2.14.1',
    releaseDate: 'October 2026',
    title: 'Build Fix: Restore missing scanResults utility for Pages deployment',
    summary:
      'Restored the missing scanResults utility used by the Research Hub and wishlist price scan flows so the static Pages build can complete again.',
    type: 'patch',
    highlights: [
      'Added the missing src/utils/scanResults.ts module required by CigarResearchHub imports.',
      'Normalized retailer scan result parsing to support both current nested response shapes and legacy object layouts.',
      'The GitHub Pages build no longer fails at Rollup resolution time when the app imports retailer scan utilities.',
    ],
  },
  {
    version: 'v2.14.0',
    releaseDate: 'October 2026',
    title: 'Live Retailer Price Scan Fix, Single-Source Data & Settings Overhaul',
    summary:
      'Fixed the "Scan Live UK Retailer Prices" feature, which was silently returning fabricated placeholder prices instead of real search results due to a client/server data-format mismatch. Consolidated six duplicated copies of the retailer list and ~72 scattered storage-key strings into single shared files. Rebuilt Settings as a searchable, collapsible, section-by-section panel with "select all / none" per section.',
    type: 'major',
    highlights: [
      'Live Price Scan Fixed: the Wishlist and Research Hub scan buttons now correctly read real search results instead of discarding them; when nothing verified is found, this is now reported honestly instead of a fabricated placeholder price.',
      'Single Source of Truth: the UK retailer quick-quote list and every browser-storage key are now each defined in exactly one file (src/data/retailers.ts, src/utils/storageKeys.ts) instead of being retyped across 5+ components.',
      'Settings Redesign: a search box to jump straight to any setting, a left-hand section index, collapsible sections, and a Select All / Select None toggle on every field-visibility group.',
      'If you still see the old Settings layout or price-scan behavior after updating, check this version number first -- it should read v2.14.0 or later. If it does not, your browser or deployment has not picked up the latest build yet.',
    ],
  },
  {
    version: 'v2.13.3',
    releaseDate: 'August 2026',
    title: 'Cross-Origin Script Resilience, CORS Middleware & Storage Hardening',
    summary:
      'Fixed cross-origin script error anomalies by enabling universal CORS middleware headers on the Express server, adding explicit anonymous crossorigin attributes and inline error prevention in index.html, and guarding all remaining storage operations.',
    type: 'patch',
    highlights: [
      'Universal CORS & Preflight Middleware: Added Access-Control-Allow-Origin, Methods, and Headers handling across Express and Vite development middleware to allow seamless cross-origin iframe communication.',
      'Script Error Interception: Added early-stage window error guards in index.html to catch and resolve cross-origin script notifications from parent iframe environments without interrupting execution.',
      'Protected Storage Access: Hardened all remaining client-side storage setItem calls in Wishlist and Quick-Quote retailer tags with safe exception fallbacks.',
    ],
  },
  {
    version: 'v2.13.2',
    releaseDate: 'August 2026',
    title: 'Loading Resilience, Dev Server Reconnection & Storage Hardening',
    summary:
      'Resolved application loading issues by restarting and reconnecting the Node development server, hardening client-side persistence against iframe storage restrictions and quota exceptions, and smoothing the initial app bootstrap experience.',
    type: 'patch',
    highlights: [
      'Dev Server Reconnection: Re-established and verified server process health on port 3000 with clean Vite middleware routing.',
      'Safe Local Storage Guards: Wrapped all synchronization effects in resilient exception handlers to prevent iframe sandboxing and storage quota errors from halting execution.',
      'Instant Vault Visual Placeholder: Added an elegant branded initial loader in index.html for immediate feedback during application initialization.',
    ],
  },
  {
    version: 'v2.13.1',
    releaseDate: 'August 2026',
    title: 'Streamlined AI Research Intelligence Banner & Clean Wishlist Layout',
    summary:
      'Refined the layout architecture by dedicating the UK Retailer Price Intelligence & Cross-App Sync banner exclusively to the AI Research Dossier section and streamlining the Wishlist toolbar for a cleaner browsing experience.',
    type: 'minor',
    highlights: [
      'Dedicated AI Research Scanner: Moved the UK Retailer Price Intelligence & Cross-App Sync banner so it displays exclusively within the AI Research tab, keeping the main catalog and database screens uncluttered.',
      'Streamlined Wishlist Toolbar: Removed the redundant Scan UK Retailers batch button from the Wishlist header to provide a cleaner layout focused on basket building, price hunting, and inventory organization.',
    ],
  },
  {
    version: 'v2.13.0',
    releaseDate: 'August 2026',
    title: 'Wishlist Best-Price Shopping Basket, Shop-Specific Price Filtering & Universal Filter Architecture',
    summary:
      'Introduced a dedicated Wishlist Shopping Basket with multi-vendor price optimization, shop-specific best-deal hunting, bulk and individual basket management, and upgraded comprehensive multi-filter controls across the app.',
    type: 'major',
    highlights: [
      'Wishlist Shopping Basket Engine: Seamlessly build and manage shopping baskets with best available quoted prices across UK tobacconists, quantity steppers, shop subtotal groupings, and one-click import workflows.',
      'Tobacconist Best-Deal Filtering: Search for specific tobacconists and toggle to view only cigars where that specific retailer offers a best-value quote.',
      'Humidor Wrapper & Spec Filters: Replaced quick filters with deep wrapper origin/type filtering, comprehensive dropdowns and togglable chips for Vitola, Smoke Duration, Brand, Strength, Country, and More.',
      'Smoke Journal Advanced Multi-Filters: Added comprehensive dropdown and chip filters in the Smoke Log for Brand, Vitola, Rating tiers, Smoke Duration, Rebuy Verdict, and Occasion.',
      'Research Hub Vitola & Duration Filters: Filter the master cigar database by specific Vitola shape categories and estimated smoking durations alongside wrapper and country filters.',
    ],
  },
];
