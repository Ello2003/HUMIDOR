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
  wrapper?: string;
  targetPrice?: number;
  estimatedPrice?: number;
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
  sourceRetailer?: string;
  sourceUrl?: string;
  createdAt: string;
  addedAt?: string;
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

export interface CigarResearchItem {
  id: string;
  brand: string;
  line: string;
  vitola: string;
  lengthInches: number;
  ringGauge: number;
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
  factoryTerroir?: string;
  masterBlender?: string;
  reviewTastingNotes: CigarReviewNotes;
  recommendedPairings: string[];
  agingWindowMonths?: number;
  isCuban?: boolean;
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
