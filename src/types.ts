export type StrengthRating = 'Mild' | 'Mild-Medium' | 'Medium' | 'Medium-Full' | 'Full' | 'Full-Bodied';

export type CigarStatus = 'resting' | 'ready' | 'aging' | 'special_occasion' | 'archived';

export type HumidorType =
  | 'Spanish Cedar Desktop'
  | 'Aging Cabinet'
  | 'Airtight Tupperdor'
  | 'Coolerdor / Wineador'
  | 'Travel Herf-a-Dor'
  | 'Other';

export interface Cigar {
  id: string;
  name: string;
  brand: string;
  line: string;
  vitola: string;
  lengthInches?: number;
  ringGauge?: number;
  smokeTimeMinutes?: number;
  smokeTimeRange?: string;
  wrapper: string;
  binder?: string;
  filler?: string;
  countryOrigin: string;
  strength: StrengthRating;
  quantity: number;
  humidorId: string;
  purchaseDate: string;
  boxDate?: string;
  purchasePrice?: number;
  currency: string;
  vendor?: string;
  boxCode?: string;
  targetRestMonths: number;
  notes?: string;
  personalRating?: number; // 1-100 or 1-5
  isFavorite: boolean;
  status: CigarStatus;
  flavorTags: string[];
  imageUrl?: string;
  vendorPrices?: VendorPriceEntry[];
  criticRating?: number; // 1-100 critic consensus score
  reviewScores?: ReviewScoreEntry[]; // Multi-publication review scores (Cigar Aficionado, Smoke King, Halfwheel, etc.)
  createdAt: string;
  updatedAt: string;
}

export interface Humidor {
  id: string;
  name: string;
  location: string;
  type: HumidorType;
  currentHumidity: number;
  targetHumidity: number;
  currentTemp: number;
  targetTemp: number;
  tempUnit: 'F' | 'C';
  maxCapacity: number;
  bovedaPackType: string; // e.g. "65% 60g x 2"
  bovedaInstalledDate?: string;
  bovedaRechargeDays?: number;
  hygrometerModel?: string;
  notes?: string;
  createdAt: string;
}

export interface FlavorNoteCategory {
  category: string;
  icon?: string;
  notes: string[];
}

export interface SmokeLog {
  id: string;
  cigarId?: string;
  cigarName: string;
  cigarBrand: string;
  vitola: string;
  wrapper: string;
  origin?: string;
  smokedAt: string; // ISO date string
  location: string; // e.g. "Backyard Patio", "Cigar Lounge", "Lakeside Cabin"
  occasion?: string; // e.g. "Weekend unwind", "Birthday celebration"
  durationMinutes: number;
  drawQuality: 'Tight' | 'Snug' | 'Perfect' | 'Slightly Open' | 'Loose';
  burnQuality: 'Razor Sharp' | 'Great' | 'Wavy / Minor Touchup' | 'Canoeing' | 'Relights Needed';
  ashQuality: 'Firm White & Grey' | 'Dense Ribbed' | 'Flaky Light Grey' | 'Loose / Dark';
  firstThirdNotes: string[];
  secondThirdNotes: string[];
  finalThirdNotes: string[];
  dominantFlavors: string[];
  pairingDrink: string;
  pairingNotes?: string;
  overallScore: number; // 1-100
  starRating: number; // 1-5
  wouldRebuy: 'Box Worthy' | '5-Pack Buy' | 'Single Occasionally' | 'Never Again';
  detailedReview: string;
  restDaysWhenSmoked?: number;
  cutType?: 'Straight Cut' | 'Deep V-Cut' | 'Punch Cut' | 'Shave / Angle';
  lightType?: 'Soft Flame / Cedar Spill' | 'Single Torch' | 'Triple Torch' | 'Matches';
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  brand: string;
  name: string;
  vitola?: string;
  lengthInches?: number;
  ringGauge?: number;
  smokeTimeMinutes?: number;
  smokeTimeRange?: string;
  countryOrigin?: string;
  wrapper?: string;
  strength?: StrengthRating;
  targetPrice?: number;
  estimatedPrice?: number;
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
  flavorTags?: string[];
  sourceRetailer?: string;
  sourceUrl?: string;
  vendorPrices?: VendorPriceEntry[];
  criticRating?: number;
  reviewScores?: ReviewScoreEntry[];
  createdAt: string;
  addedAt?: string;
}

export interface WishlistBasketItem {
  id: string;
  wishlistItemId?: string;
  brand: string;
  name: string;
  vitola?: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  vendor: string;
  sourceUrl?: string;
  notes?: string;
  smokeTimeRange?: string;
  criticRating?: number;
  addedAt: string;
}

export interface ResearchDossier {
  cigarName: string;
  brand: string;
  line: string;
  countryOrigin: string;
  factory?: string;
  masterBlender?: string;
  vitolaCommon?: string;
  lengthInches?: string;
  ringGauge?: string;
  smokeTimeMinutes?: number;
  smokeTimeRange?: string;
  wrapper: string;
  binder?: string;
  filler?: string;
  strength: string;
  body: string;
  summary: string;
  flavorTransitions: {
    firstThird: {
      overview: string;
      keyNotes: string[];
    };
    secondThird: {
      overview: string;
      keyNotes: string[];
    };
    finalThird: {
      overview: string;
      keyNotes: string[];
    };
  };
  dominantFlavorTags: string[];
  idealPairings: Array<{
    category: string;
    beverageName: string;
    whyItWorks: string;
  }>;
  agingGuidance: {
    idealRestMonths: string;
    peakAgingWindow: string;
    agingImpact: string;
  };
  smokingTips: {
    cutRecommendation: string;
    lightingTip: string;
    pacingMinutes: string;
  };
  historyTrivia?: string;
  estimatedRatingScore?: number;
}

export interface SommelierRecommendation {
  sommelierGreeting: string;
  humidorPick?: {
    cigarId?: string;
    cigarName: string;
    reason: string;
    expectedSmokeDuration: string;
    pairingAdvice: string;
    tastingHighlights: string[];
  };
  curatedRecommendations: Array<{
    brand: string;
    cigarName: string;
    vitola: string;
    strength: string;
    whyItFits: string;
    flavorHighlights: string[];
  }>;
  sessionTips: string[];
}

export type WrapperType =
  | 'Habano'
  | 'Maduro'
  | 'Connecticut Shade'
  | 'Connecticut Broadleaf'
  | 'Corojo'
  | 'San Andrés'
  | 'Cameroon'
  | 'Sumatra'
  | 'Candela'
  | 'Oscuro'
  | 'Criollo'
  | 'Other';

export interface CigarReviewNotes {
  overview: string;
  firstThird: string;
  secondThird: string;
  finalThird: string;
  dominantFlavorTags: string[];
  criticQuote?: string;
  criticScore?: number;
}

export interface ReviewScoreEntry {
  id?: string;
  source: string; // e.g. "Cigar Aficionado", "Smoke King", "Halfwheel", "Cigar Journal", "Cigar Coop", "Cigar Snob", "Katman"
  score: number; // e.g. 94 or 4.8
  maxScore?: number; // default 100 (or 5 for star systems)
  scale?: string; // e.g. "100-Point", "5-Star"
  ratingDate?: string;
  summary?: string;
  award?: string; // e.g. "Top 25 Cigars of 2023 - #4", "Cigar Trophy Winner"
  url?: string;
}

export interface VendorPriceEntry {
  id?: string;
  vendor: string;
  price: number;
  currency?: string;
  packageType?: string; // e.g. 'Single', 'Box of 10', 'Box of 25', 'Pack of 5'
  url?: string;
  recordedAt?: string;
  inStock?: boolean;
  notes?: string;
}

export interface CigarResearchItem {
  id: string;
  brand: string;
  line: string;
  vitola: string;
  lengthInches: number;
  ringGauge: number;
  smokeTimeMinutes?: number;
  smokeTimeRange?: string;
  countryOrigin: string;
  wrapper: string;
  wrapperType: WrapperType;
  binder: string;
  filler: string;
  strength: StrengthRating;
  body: 'Mild' | 'Mild-Medium' | 'Medium' | 'Medium-Full' | 'Full' | 'Full-Bodied';
  averagePrice: number;
  priceRange: string;
  criticRating: number;
  criticConsensus: string;
  reviewScores?: ReviewScoreEntry[]; // Multi-publication critic review scores
  factoryTerroir?: string;
  masterBlender?: string;
  reviewTastingNotes: CigarReviewNotes;
  recommendedPairings: string[];
  agingWindowMonths?: number;
  isCuban?: boolean;
  // Multiple shop / vendor price tracking & price comparison
  vendorPrices?: VendorPriceEntry[];
  // User personal annotations
  personalRating?: number; // 1-100 score
  personalNotes?: string;
  personalFavorite?: boolean;
  personalTried?: boolean;
  personalWouldRebuy?: 'Box Worthy' | '5-Pack Buy' | 'Single Occasionally' | 'Never Again' | 'Not Smoked Yet';
  personalPairingNotes?: string;
  userUpdatedAt?: string;
}

export interface CigarAppData {
  cigars: Cigar[];
  humidors: Humidor[];
  smokeLogs: SmokeLog[];
  wishlist: WishlistItem[];
  researchDatabase?: CigarResearchItem[];
  version: string;
  exportedAt?: string;
}

export interface ExtractedBasketItem {
  id?: string;
  brand: string;
  name: string;
  line: string;
  vitola: string;
  lengthInches?: number;
  ringGauge?: number;
  smokeTimeMinutes?: number;
  smokeTimeRange?: string;
  countryOrigin: string;
  wrapper: string;
  wrapperType?: WrapperType;
  binder?: string;
  filler?: string;
  strength: StrengthRating;
  quantity: number;
  purchasePrice?: number;
  totalPrice?: number;
  currency: string;
  vendor?: string;
  notes?: string;
  flavorTags: string[];
  idealRestMonths: number;
  isCuban: boolean;
  imageUrl?: string;
  criticRating?: number;
  reviewScores?: ReviewScoreEntry[];
  selected?: boolean;
}

export interface ShoppingBasketExtractResult {
  vendorName: string;
  basketTotal?: number;
  currency: string;
  itemCount: number;
  items: ExtractedBasketItem[];
  orderNumber?: string;
  orderDate?: string;
  notes?: string;
}

export interface VersionHistoryEntry {
  version: string;
  releaseDate: string;
  title: string;
  summary: string;
  highlights: string[];
  type?: 'major' | 'minor' | 'patch';
}

export interface AppSettings {
  visibleTabs: {
    dashboard: boolean;
    humidors: boolean;
    cigars: boolean;
    smokes: boolean;
    research: boolean;
    wishlist: boolean;
    analytics: boolean;
  };
  dashboardSections: {
    quickStats: boolean;
    agingAlerts: boolean;
    dailyRecommendation: boolean;
    quickSmokeBanner: boolean;
    recentSmokes: boolean;
    humidorOverview: boolean;
  };
  cigarFieldVisibility: {
    flavorProfiles: boolean;
    tastingProgression: boolean;
    vendorPriceComparison: boolean;
    drinkPairings: boolean;
    criticRatings: boolean;
    agingTimeline: boolean;
    factoryDetails: boolean;
    dimensions: boolean;
  };
  wishlistFieldVisibility?: {
    targetPrice: boolean;
    retailerQuotes: boolean;
    notes: boolean;
    smokeTime: boolean;
    vitolaSpecs: boolean;
    priority: boolean;
    rating: boolean;
  };
  humidorFieldVisibility?: {
    smokeTime: boolean;
    vitolaSpecs: boolean;
    wrapperOrigin: boolean;
    strength: boolean;
    humidorResting: boolean;
    flavorTags: boolean;
    notes: boolean;
    retailerQuotes: boolean;
    pricing: boolean;
    rating: boolean;
  };
  journalFieldVisibility?: {
    dateAndLocation: boolean;
    scoreAndStars: boolean;
    vitolaAndWrapper: boolean;
    duration: boolean;
    pairing: boolean;
    rebuyVerdict: boolean;
    flavorsAndNotes: boolean;
    burnAndDraw: boolean;
  };
  quickQuoteRetailers?: string[];
  exportSuiteOptions?: {
    showResearchExport: boolean;
    showMasterJson: boolean;
    showInventoryCsv: boolean;
    showTastingCsv: boolean;
    showMarkdownExport: boolean;
    showPrintablePdf: boolean;
    showRestoreBackup: boolean;
    includeTastingNotesInInventoryCsv?: boolean;
  };
  globalCurrency?: '£' | '$' | '€' | 'CHF';
  priceSyncBehavior?: {
    autoSyncToHumidor: boolean;
    autoSyncToWishlist: boolean;
    autoMergeIdenticalSticks: boolean;
  };
  researchSettings?: {
    autoMergeDuplicatesOnImport: boolean;
    displayRetailerCount: boolean;
    preferLowestPriceDisplay: boolean;
  };
  uiDensity: 'compact' | 'comfortable' | 'spacious';
  streamlinedMode: boolean;
}

export interface SmokeTimeSourceDetail {
  sourceName: string;
  sourceType: 'habanos_official' | 'critic_panel' | 'retailer_consensus' | 'physics_volume' | 'specific_benchmark' | 'journal_logs';
  minutes: number;
  range: string;
  weight: number;
  notes?: string;
}

export interface SmokeTimeConsensus {
  minutes: number;
  range: string;
  shortLabel: string;
  category: 'quick' | 'medium' | 'long';
  pacingNote?: string;
  confidenceScore: number;
  sources: SmokeTimeSourceDetail[];
  sourceCount: number;
  isPersonalizedFromJournal?: boolean;
  userEmpiricalAverageMinutes?: number;
}

