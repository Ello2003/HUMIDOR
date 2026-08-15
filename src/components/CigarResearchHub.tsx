import React, { useState } from 'react';
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
  HelpCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Cigar, ResearchDossier, SommelierRecommendation } from '../types';

interface CigarResearchHubProps {
  cigars: Cigar[];
  onAddCigarFromResearch: (prefill: Partial<Cigar>) => void;
  onAddToWishlist: (item: { brand: string; name: string; vitola?: string; notes?: string }) => void;
  initialResearchQuery?: string;
}

export const CigarResearchHub: React.FC<CigarResearchHubProps> = ({
  cigars,
  onAddCigarFromResearch,
  onAddToWishlist,
  initialResearchQuery,
}) => {
  const [activeResearchTab, setActiveResearchTab] = useState<'dossier' | 'sommelier' | 'identify'>('dossier');

  // Dossier state
  const [searchQuery, setSearchQuery] = useState(initialResearchQuery || 'Padrón 1964 Anniversary Series Exclusivo');
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

  // Quick Preset Queries
  const presetQueries = [
    'Padrón 1964 Anniversary Exclusivo Maduro',
    'Arturo Fuente Don Carlos No. 2 Torpedo',
    'Davidoff Millennium Blend Robusto',
    'Liga Privada Unico Serie Flying Pig',
    'Montecristo No. 2 Cuban Pirámide',
    'Dunbarton Mi Querida Triqui Traca',
    'Plasencia Alma del Fuego Concepcion',
    'RoMa Craft Neanderthal HN',
  ];

  // Handler: Lookup Dossier
  const handleLookupDossier = async (customQuery?: string) => {
    const q = customQuery || searchQuery;
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

  // Handler: Run Sommelier Recommendation
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

  // Handler: Run Cigar Identification
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
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-br from-[#1C1816] via-[#161311] to-[#13110F] border border-[#2C2621] rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#13110F] text-[#D4AF37] border border-[#2C2621] text-[10px] font-semibold uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>AI Sommelier & Tobacconist Intelligence</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-serif text-white font-normal">
              Cigar Research & Tasting Laboratory
            </h1>
            <p className="text-xs sm:text-sm text-[#A89F94] mt-1 max-w-2xl">
              Uncover factory terroir, master blenders, 3-thirds transition curves, and tailored drink pairings
              for any blend in the world.
            </p>
          </div>

          {/* Sub-tab pills */}
          <div className="flex bg-[#13110F] p-1 rounded-md border border-[#2C2621] text-xs">
            <button
              onClick={() => setActiveResearchTab('dossier')}
              className={`px-3 py-1.5 rounded font-medium text-xs transition cursor-pointer ${
                activeResearchTab === 'dossier'
                  ? 'bg-[#D4AF37] text-[#0F0D0C] font-bold shadow-xs'
                  : 'text-[#A89F94] hover:text-[#E5E1DA]'
              }`}
            >
              📖 Cigar Dossier
            </button>
            <button
              onClick={() => setActiveResearchTab('sommelier')}
              className={`px-3 py-1.5 rounded font-medium text-xs transition cursor-pointer ${
                activeResearchTab === 'sommelier'
                  ? 'bg-[#D4AF37] text-[#0F0D0C] font-bold shadow-xs'
                  : 'text-[#A89F94] hover:text-[#E5E1DA]'
              }`}
            >
              🥂 "What to Smoke Tonight?"
            </button>
            <button
              onClick={() => setActiveResearchTab('identify')}
              className={`px-3 py-1.5 rounded font-medium text-xs transition cursor-pointer ${
                activeResearchTab === 'identify'
                  ? 'bg-[#D4AF37] text-[#0F0D0C] font-bold shadow-xs'
                  : 'text-[#A89F94] hover:text-[#E5E1DA]'
              }`}
            >
              🔍 Band Identifier
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Deep Dossier Lookup */}
      {activeResearchTab === 'dossier' && (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="p-5 bg-[#1C1816] border border-[#2C2621] rounded-lg space-y-3">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#D4AF37]">
              Search Any Premium Cigar or Vitola
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#A89F94] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Padrón 1926 No. 9, Arturo Fuente Opus X, Davidoff Late Hour, Liga Privada..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#A89F94] font-medium">Quick suggestions:</span>
              {presetQueries.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setSearchQuery(preset);
                    handleLookupDossier(preset);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded bg-[#13110F] border border-[#2C2621] text-[#A89F94] hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Dossier Error */}
          {dossierError && (
            <div className="p-4 bg-[#2C1515] border border-red-800/80 rounded-lg text-xs text-red-200">
              {dossierError}
            </div>
          )}

          {/* Dossier Result View */}
          {dossierResult && (
            <div className="bg-[#1C1816] border border-[#2C2621] rounded-lg p-6 sm:p-8 space-y-6 shadow-sm">
              {/* Header Info */}
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
                    {dossierResult.ringGauge ? `• ${dossierResult.ringGauge} RG` : ''}{' '}
                    • Master Blender: <strong className="text-[#E5E1DA]">{dossierResult.masterBlender || 'Master Team'}</strong>
                  </div>
                </div>

                {/* Quick Add buttons */}
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

              {/* Summary Description */}
              <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-md">
                <p className="text-xs sm:text-sm text-[#E5E1DA] leading-relaxed font-serif italic">
                  "{dossierResult.summary}"
                </p>
              </div>

              {/* Tobacco Blend & Specifications */}
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
                    <strong className="text-[#E5E1DA] text-xs sm:text-sm font-serif">{dossierResult.binder || 'Proprietary'}</strong>
                  </div>
                  <div className="p-3 bg-[#13110F] border border-[#2C2621] rounded-md">
                    <span className="text-[#A89F94] text-[10px] uppercase tracking-wider block">Filler</span>
                    <strong className="text-[#E5E1DA] text-xs sm:text-sm font-serif">{dossierResult.filler || 'Proprietary Blend'}</strong>
                  </div>
                </div>
              </div>

              {/* 3-Thirds Flavor Transition Evolution */}
              <div>
                <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[#D4AF37] mb-3">
                  💨 3-Thirds Flavor Progression Curve
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* First Third */}
                  <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-[#D4AF37] text-xs font-serif font-semibold">1st Third (Initial Light)</strong>
                      <span className="text-[10px] text-[#A89F94] font-mono">0 - 30%</span>
                    </div>
                    <p className="text-xs text-[#E5E1DA] leading-relaxed">
                      {dossierResult.flavorTransitions.firstThird.overview}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {dossierResult.flavorTransitions.firstThird.keyNotes.map((note) => (
                        <span
                          key={note}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#1C1816] text-[#E5E1DA] border border-[#2C2621]"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Second Third */}
                  <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-[#D4AF37] text-xs font-serif font-semibold">2nd Third (Sweet Spot)</strong>
                      <span className="text-[10px] text-[#A89F94] font-mono">30 - 70%</span>
                    </div>
                    <p className="text-xs text-[#E5E1DA] leading-relaxed">
                      {dossierResult.flavorTransitions.secondThird.overview}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {dossierResult.flavorTransitions.secondThird.keyNotes.map((note) => (
                        <span
                          key={note}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#1C1816] text-[#E5E1DA] border border-[#2C2621]"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Final Third */}
                  <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-[#D4AF37] text-xs font-serif font-semibold">Final Third (Nub & Finish)</strong>
                      <span className="text-[10px] text-[#A89F94] font-mono">70 - 100%</span>
                    </div>
                    <p className="text-xs text-[#E5E1DA] leading-relaxed">
                      {dossierResult.flavorTransitions.finalThird.overview}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {dossierResult.flavorTransitions.finalThird.keyNotes.map((note) => (
                        <span
                          key={note}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#1C1816] text-[#E5E1DA] border border-[#2C2621]"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ideal Beverage Pairings */}
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
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#1C1816] text-[#A89F94] border border-[#2C2621]">
                          {pairing.category}
                        </span>
                      </div>
                      <p className="text-[#E5E1DA] text-xs leading-relaxed">{pairing.whyItWorks}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aging & Smoking Guidance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-md space-y-2 text-xs">
                  <strong className="text-[#D4AF37] text-[10px] uppercase tracking-widest block">
                    🪵 Aging & Resting Science
                  </strong>
                  <div>
                    <span className="text-[#A89F94]">Recommended Rest: </span>
                    <strong className="text-[#E5E1DA]">{dossierResult.agingGuidance.idealRestMonths}</strong>
                  </div>
                  <div>
                    <span className="text-[#A89F94]">Peak Window: </span>
                    <strong className="text-[#E5E1DA]">{dossierResult.agingGuidance.peakAgingWindow}</strong>
                  </div>
                  <p className="text-[#A89F94] italic pt-1">{dossierResult.agingGuidance.agingImpact}</p>
                </div>

                <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-md space-y-2 text-xs">
                  <strong className="text-[#D4AF37] text-[10px] uppercase tracking-widest block">
                    ✂️ Recommended Cut & Lighting Method
                  </strong>
                  <div>
                    <span className="text-[#A89F94]">Cut: </span>
                    <strong className="text-[#E5E1DA]">{dossierResult.smokingTips.cutRecommendation}</strong>
                  </div>
                  <div>
                    <span className="text-[#A89F94]">Light: </span>
                    <strong className="text-[#E5E1DA]">{dossierResult.smokingTips.lightingTip}</strong>
                  </div>
                  <div>
                    <span className="text-[#A89F94]">Smoking Pace: </span>
                    <strong className="text-[#E5E1DA]">{dossierResult.smokingTips.pacingMinutes}</strong>
                  </div>
                </div>
              </div>

              {/* History & Factory Trivia */}
              {dossierResult.historyTrivia && (
                <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-md text-xs text-[#E5E1DA] leading-relaxed">
                  <span className="font-bold text-[#D4AF37] uppercase tracking-wider text-[10px] block mb-1">🏛️ Factory Heritage & Blender Trivia:</span>
                  {dossierResult.historyTrivia}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: "What to Smoke Tonight?" Sommelier */}
      {activeResearchTab === 'sommelier' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#1C1816] border border-[#2C2621] rounded-lg space-y-4">
            <h2 className="text-lg font-serif text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Personal Cigar Sommelier Consultation</span>
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
            <div className="bg-[#1C1816] border border-[#2C2621] rounded-lg p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-md text-xs sm:text-sm text-[#E5E1DA] font-serif italic leading-relaxed">
                "{sommelierResult.sommelierGreeting}"
              </div>

              {/* Best Humidor Pick */}
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

                  <div className="p-3 bg-[#1C1816] rounded border border-[#2C2621] text-xs text-[#E5E1DA]">
                    <strong className="text-[#D4AF37]">🥃 Pairing Advice:</strong> {sommelierResult.humidorPick.pairingAdvice}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {(sommelierResult.humidorPick.tastingHighlights || []).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#1C1816] text-[#D4AF37] border border-[#2C2621]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Curated Recommendations */}
              <div>
                <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[#D4AF37] mb-3">
                  ★ Curated Recommendations for this Profile
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
                            setSearchQuery(`${rec.brand} ${rec.cigarName}`);
                            setActiveResearchTab('dossier');
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

              {/* Session Tips */}
              {sommelierResult.sessionTips && sommelierResult.sessionTips.length > 0 && (
                <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-md text-xs space-y-1">
                  <strong className="text-[#D4AF37] font-semibold uppercase tracking-widest text-[10px] block mb-1">
                    💨 Sommelier Session Notes:
                  </strong>
                  {sommelierResult.sessionTips.map((tip, idx) => (
                    <div key={idx} className="text-[#E5E1DA] flex items-start gap-1.5">
                      <span className="text-[#D4AF37]">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Band & Visual Identifier */}
      {activeResearchTab === 'identify' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#1C1816] border border-[#2C2621] rounded-lg space-y-4">
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
            <div className="bg-[#1C1816] border border-[#2C2621] rounded-lg p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-serif text-white">Probable Matches Identified</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {identifyResult.matches.map((m: any, i: number) => (
                  <div key={i} className="p-4 bg-[#13110F] border border-[#2C2621] rounded-lg space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#D4AF37] uppercase text-[10px] tracking-wider">{m.brand}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C1816] text-[#A89F94] border border-[#2C2621]">
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
                          setSearchQuery(`${m.brand} ${m.line}`);
                          setActiveResearchTab('dossier');
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

              {identifyResult.identificationAdvice && (
                <div className="p-3 bg-[#13110F] border border-[#2C2621] rounded-md text-xs text-[#A89F94]">
                  <strong className="text-[#D4AF37]">Identifier Advice:</strong> {identifyResult.identificationAdvice}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
