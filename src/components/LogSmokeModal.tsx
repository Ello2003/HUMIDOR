import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Flame,
  Coffee,
  Star,
  CheckCircle,
  Award,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Clock,
  Sparkles,
  Check,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { Cigar, SmokeLog } from '../types';
import { FLAVOR_CATEGORIES } from '../data/initialData';
import confetti from 'canvas-confetti';

interface LogSmokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<SmokeLog, 'id' | 'createdAt'>, deductCigarId?: string) => void;
  cigars: Cigar[];
  preselectedCigarId?: string | null;
  logToEdit?: SmokeLog | null;
}

export const LogSmokeModal: React.FC<LogSmokeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cigars,
  preselectedCigarId,
  logToEdit,
}) => {
  // Note: the early `isOpen` bail-out must come after every Hook call
  // (React's Rules of Hooks) -- moved to just before the JSX return below.

  const [selectedCigarId, setSelectedCigarId] = useState<string>(
    logToEdit?.cigarId || preselectedCigarId || (cigars.length > 0 ? cigars[0].id : '')
  );
  const [isCustomCigar, setIsCustomCigar] = useState<boolean>(!selectedCigarId && !!logToEdit);
  const [deductFromStock, setDeductFromStock] = useState<boolean>(!logToEdit && !!selectedCigarId);

  // Cigar attributes
  const [cigarBrand, setCigarBrand] = useState<string>(logToEdit?.cigarBrand || '');
  const [cigarName, setCigarName] = useState<string>(logToEdit?.cigarName || '');
  const [vitola, setVitola] = useState<string>(logToEdit?.vitola || 'Robusto');
  const [wrapper, setWrapper] = useState<string>(logToEdit?.wrapper || 'Habano');
  const [origin, setOrigin] = useState<string>(logToEdit?.origin || 'Nicaragua');

  // Session context
  const [smokedAt, setSmokedAt] = useState<string>(
    logToEdit?.smokedAt ? logToEdit.smokedAt.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [location, setLocation] = useState<string>(logToEdit?.location || 'Backyard Patio');
  const [occasion, setOccasion] = useState<string>(logToEdit?.occasion || 'Evening relaxation');
  const [durationMinutes, setDurationMinutes] = useState<number>(logToEdit?.durationMinutes || 70);

  // Construction & Mechanics
  const [drawQuality, setDrawQuality] = useState<SmokeLog['drawQuality']>(logToEdit?.drawQuality || 'Perfect');
  const [burnQuality, setBurnQuality] = useState<SmokeLog['burnQuality']>(logToEdit?.burnQuality || 'Razor Sharp');
  const [ashQuality, setAshQuality] = useState<SmokeLog['ashQuality']>(logToEdit?.ashQuality || 'Firm White & Grey');
  const [cutType, setCutType] = useState<SmokeLog['cutType']>(logToEdit?.cutType || 'Deep V-Cut');
  const [lightType, setLightType] = useState<SmokeLog['lightType']>(logToEdit?.lightType || 'Single Torch');

  // 3-Thirds Flavors
  const [firstThirdNotes, setFirstThirdNotes] = useState<string[]>(
    logToEdit?.firstThirdNotes || ['Spanish Cedar', 'White Pepper (Retrohale)']
  );
  const [secondThirdNotes, setSecondThirdNotes] = useState<string[]>(
    logToEdit?.secondThirdNotes || ['Dark Chocolate', 'Espresso']
  );
  const [finalThirdNotes, setFinalThirdNotes] = useState<string[]>(
    logToEdit?.finalThirdNotes || ['Charred Oak', 'Baking Spice']
  );
  const [dominantFlavors, setDominantFlavors] = useState<string[]>(
    logToEdit?.dominantFlavors || ['Spanish Cedar', 'Dark Chocolate']
  );

  // Beverage Pairing
  const [pairingDrink, setPairingDrink] = useState<string>(
    logToEdit?.pairingDrink || 'Bourbon / Whiskey'
  );
  const [pairingNotes, setPairingNotes] = useState<string>(logToEdit?.pairingNotes || '');

  // Scores & Verdict
  const [overallScore, setOverallScore] = useState<number>(logToEdit?.overallScore || 92);
  const [starRating, setStarRating] = useState<number>(logToEdit?.starRating || 5);
  const [wouldRebuy, setWouldRebuy] = useState<SmokeLog['wouldRebuy']>(
    logToEdit?.wouldRebuy || 'Box Worthy'
  );
  const [detailedReview, setDetailedReview] = useState<string>(logToEdit?.detailedReview || '');

  // Live Smoking Stopwatch Timer
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerAppliedFeedback, setTimerAppliedFeedback] = useState<boolean>(false);
  const [showAutoSuggestNotice, setShowAutoSuggestNotice] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Collapsible & customizable sections with persistence
  const [openSections, setOpenSections] = useState<{
    cigarSelection: boolean;
    sessionTimer: boolean;
    sessionSetting: boolean;
    flavorEvolution: boolean;
    pairing: boolean;
    scoreVerdict: boolean;
    detailedReview: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_log_smoke_sections');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      cigarSelection: true,
      sessionTimer: true,
      sessionSetting: true,
      flavorEvolution: true,
      pairing: true,
      scoreVerdict: true,
      detailedReview: true,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('the_humidor_log_smoke_sections', JSON.stringify(openSections));
    } catch {}
  }, [openSections]);

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAllSections = () => {
    setOpenSections({
      cigarSelection: true,
      sessionTimer: true,
      sessionSetting: true,
      flavorEvolution: true,
      pairing: true,
      scoreVerdict: true,
      detailedReview: true,
    });
  };

  const collapseAllSections = () => {
    setOpenSections({
      cigarSelection: false,
      sessionTimer: false,
      sessionSetting: false,
      flavorEvolution: false,
      pairing: false,
      scoreVerdict: false,
      detailedReview: false,
    });
  };

  // Stopwatch ticking effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    setShowAutoSuggestNotice(false);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    if (timerSeconds >= 30) {
      setShowAutoSuggestNotice(true);
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setShowAutoSuggestNotice(false);
  };

  const handleApplyTimerToDuration = () => {
    const elapsedMinutes = Math.max(1, Math.round(timerSeconds / 60));
    setDurationMinutes(elapsedMinutes);
    setTimerAppliedFeedback(true);
    setShowAutoSuggestNotice(false);
    setTimeout(() => setTimerAppliedFeedback(false), 3000);
  };

  const formatStopwatch = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Sync selected cigar from humidor
  useEffect(() => {
    if (selectedCigarId && !isCustomCigar) {
      const found = cigars.find((c) => c.id === selectedCigarId);
      if (found) {
        setCigarBrand(found.brand);
        setCigarName(found.name);
        setVitola(found.vitola);
        setWrapper(found.wrapper);
        setOrigin(found.countryOrigin);
        if (found.flavorTags && found.flavorTags.length > 0) {
          setDominantFlavors(found.flavorTags.slice(0, 4));
        }
      }
    }
  }, [selectedCigarId, isCustomCigar, cigars]);

  const toggleArrayItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!cigarBrand.trim() || !cigarName.trim()) {
      setFormError('Please provide brand and cigar name.');
      return;
    }

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#C5A059', '#8B5E3C', '#5C3A21', '#A67C52'],
      });
    } catch (_) {}

    onSave(
      {
        cigarId: isCustomCigar ? undefined : selectedCigarId || undefined,
        cigarBrand: cigarBrand.trim(),
        cigarName: cigarName.trim(),
        vitola: vitola.trim(),
        wrapper: wrapper.trim(),
        origin: origin.trim(),
        smokedAt: new Date(smokedAt).toISOString(),
        location: location.trim(),
        occasion: occasion.trim() || undefined,
        durationMinutes,
        drawQuality,
        burnQuality,
        ashQuality,
        firstThirdNotes,
        secondThirdNotes,
        finalThirdNotes,
        dominantFlavors,
        pairingDrink: pairingDrink.trim(),
        pairingNotes: pairingNotes.trim() || undefined,
        overallScore,
        starRating,
        wouldRebuy,
        detailedReview: detailedReview.trim(),
        cutType,
        lightType,
      },
      deductFromStock && !isCustomCigar && selectedCigarId ? selectedCigarId : undefined
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-card border border-line rounded-lg shadow-2xl overflow-hidden text-text">
        {/* Header */}
        <div className="px-6 py-4 bg-surface border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-card border border-line flex items-center justify-center text-gold">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-semibold text-text">
                {logToEdit ? 'Edit Tasting Session' : 'Log a Cigar Smoke Session'}
              </h2>
              <p className="text-xs text-text-muted">Capture flavor transitions, pairings, burn notes and rating</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openSections.sessionSetting && openSections.flavorEvolution ? collapseAllSections : expandAllSections}
              className="text-[11px] px-2.5 py-1 bg-card-hover hover:bg-line text-text-muted hover:text-text rounded border border-line transition cursor-pointer flex items-center gap-1"
              title="Expand or Condense all form sections"
            >
              <Layers className="w-3 h-3 text-gold" />
              <span>{openSections.sessionSetting && openSections.flavorEvolution ? 'Condense All' : 'Expand All'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text p-1.5 rounded hover:bg-card-hover transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body with Collapsible Accordion Sections */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Section 1: Cigar Source Selection */}
          <div className="border border-line rounded-lg bg-surface overflow-hidden">
            <div
              onClick={() => toggleSection('cigarSelection')}
              className="px-4 py-2.5 bg-section-header hover:bg-section-header-hover flex items-center justify-between cursor-pointer transition select-none"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gold uppercase tracking-wider">
                  1. Cigar Selection & Origin
                </span>
                {cigarBrand && cigarName && (
                  <span className="text-xs text-text font-normal lowercase tracking-normal">
                    ({cigarBrand} &bull; {cigarName} &bull; {vitola})
                  </span>
                )}
              </div>
              <div className="text-text-muted">
                {openSections.cigarSelection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {openSections.cigarSelection && (
              <div className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomCigar(false)}
                      className={`text-xs px-2.5 py-1 rounded transition cursor-pointer ${
                        !isCustomCigar
                          ? 'bg-card-hover text-gold border border-gold/60 font-semibold'
                          : 'text-text-muted hover:text-text'
                      }`}
                    >
                      From Humidor Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCigar(true);
                        setDeductFromStock(false);
                      }}
                      className={`text-xs px-2.5 py-1 rounded transition cursor-pointer ${
                        isCustomCigar
                          ? 'bg-card-hover text-gold border border-gold/60 font-semibold'
                          : 'text-text-muted hover:text-text'
                      }`}
                    >
                      Custom Stick / Lounge Smoke
                    </button>
                  </div>

                  {!isCustomCigar && selectedCigarId && !logToEdit && (
                    <label className="flex items-center gap-2 text-xs text-gold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deductFromStock}
                        onChange={(e) => setDeductFromStock(e.target.checked)}
                        className="rounded-xs border-line bg-surface text-gold focus:ring-gold"
                      />
                      <span>Deduct 1 stick from humidor inventory</span>
                    </label>
                  )}
                </div>

                {!isCustomCigar ? (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">
                      Select from Humidor Stock
                    </label>
                    <select
                      value={selectedCigarId}
                      onChange={(e) => setSelectedCigarId(e.target.value)}
                      className="w-full bg-card border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                    >
                      {cigars.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.brand} {c.name} ({c.vitola}) — {c.quantity} in stock ({c.wrapper})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Brand *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Padrón"
                        value={cigarBrand}
                        onChange={(e) => setCigarBrand(e.target.value)}
                        className="w-full bg-card border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Cigar Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1964 Anniversary"
                        value={cigarName}
                        onChange={(e) => setCigarName(e.target.value)}
                        className="w-full bg-card border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Vitola / Shape</label>
                      <input
                        type="text"
                        placeholder="e.g. Exclusivo Maduro"
                        value={vitola}
                        onChange={(e) => setVitola(e.target.value)}
                        className="w-full bg-card border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Interactive Smoking Timer Feature */}
          <div className="border border-line-warm rounded-lg bg-gradient-to-br from-[#161210] via-[#1E1815] to-[#14100E] overflow-hidden shadow-inner">
            <div
              onClick={() => toggleSection('sessionTimer')}
              className="px-4 py-2.5 bg-section-header/80 hover:bg-section-header-hover flex items-center justify-between cursor-pointer transition select-none"
            >
              <div className="flex items-center gap-2">
                <Timer className="w-3.5 h-3.5 text-gold" />
                <span className="text-[11px] font-bold text-gold uppercase tracking-wider">
                  2. Live Smoking Stopwatch Timer & Progression
                </span>
                {timerSeconds > 0 && (
                  <span className="text-xs font-mono text-gold font-bold ml-2">
                    [{formatStopwatch(timerSeconds)}]
                  </span>
                )}
              </div>
              <div className="text-text-muted">
                {openSections.sessionTimer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {openSections.sessionTimer && (
              <div className="p-4 space-y-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left: Info & Status */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                        isTimerRunning
                          ? 'bg-cedar/30 border-gold text-gold shadow-[0_0_15px_rgba(197,160,89,0.35)] animate-pulse'
                          : timerSeconds > 0
                          ? 'bg-card-hover border-gold/50 text-gold'
                          : 'bg-surface border-line text-text-muted'
                      }`}
                    >
                      <Timer className={`w-5 h-5 ${isTimerRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-serif font-bold text-text tracking-wide">Stopwatch Session Tracker</span>
                        {isTimerRunning ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/20 text-gold border border-gold/40 animate-pulse">
                            <Flame className="w-3 h-3 fill-gold text-gold" />
                            <span>Smoking Active</span>
                          </span>
                        ) : timerSeconds > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-card-hover text-text-muted border border-line">
                            <span>Paused</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-text-muted/70">Ready to track stick duration</span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Track your smoke time live with 1-click automatic duration logging
                      </p>
                    </div>
                  </div>

                  {/* Right: Digital Timer Display & Controls */}
                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
                    {/* Digital clock display */}
                    <div className="px-3.5 py-1.5 bg-ink border border-line rounded-md font-mono text-xl md:text-2xl font-bold tracking-wider text-gold shadow-inner flex items-center gap-2">
                      <Clock className="w-4 h-4 text-text-muted/60" />
                      <span>{formatStopwatch(timerSeconds)}</span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1.5">
                      {!isTimerRunning ? (
                        <button
                          type="button"
                          onClick={handleStartTimer}
                          className="flex items-center gap-1.5 px-3 py-2 bg-gold hover:brightness-110 text-ink rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 fill-base" />
                          <span>{timerSeconds > 0 ? 'Resume' : 'Start'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePauseTimer}
                          className="flex items-center gap-1.5 px-3 py-2 bg-cedar hover:bg-[#9C6B45] text-white rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                        >
                          <Pause className="w-3.5 h-3.5 fill-white" />
                          <span>Pause</span>
                        </button>
                      )}

                      {timerSeconds > 0 && (
                        <button
                          type="button"
                          onClick={handleResetTimer}
                          title="Reset stopwatch"
                          className="p-2 bg-surface hover:bg-card-hover text-text-muted hover:text-text border border-line rounded text-xs transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {timerSeconds > 0 && (
                        <button
                          type="button"
                          onClick={handleApplyTimerToDuration}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer border ${
                            timerAppliedFeedback
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                              : 'bg-card-hover hover:bg-[#2F2723] text-gold border-gold/50'
                          }`}
                        >
                          {timerAppliedFeedback ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Applied {durationMinutes}m!</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-gold" />
                              <span>Set Duration ({Math.max(1, Math.round(timerSeconds / 60))}m)</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Auto-suggest duration callout bar when paused */}
                {showAutoSuggestNotice && timerSeconds >= 30 && (
                  <div className="mt-3 pt-2.5 border-t border-line/80 flex flex-wrap items-center justify-between gap-2 text-xs bg-surface/70 px-3 py-2 rounded border border-line">
                    <div className="flex items-center gap-2 text-text">
                      <Sparkles className="w-3.5 h-3.5 text-gold" />
                      <span>
                        Stopwatch logged <strong>{Math.max(1, Math.round(timerSeconds / 60))} minutes</strong> of smoking time. Populate this into the session duration?
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyTimerToDuration}
                      className="text-[11px] font-bold text-ink bg-gold hover:brightness-110 px-2.5 py-1 rounded transition flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>Apply ({Math.max(1, Math.round(timerSeconds / 60))} min)</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Thirds Progression Visual Guide */}
                {timerSeconds > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-line/60">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-text-muted mb-1.5">
                      <span>Vitola Thirds Progression</span>
                      <span className="text-gold font-semibold">
                        {timerSeconds < 1200
                          ? '🔥 1st Third (Initial Light & Cedar Aroma)'
                          : timerSeconds < 2700
                          ? '💨 2nd Third (Sweet Spot, Cream & Complexity)'
                          : '🪵 Final Third / Nub (Rich Dark Notes & Spice)'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-ink rounded-full overflow-hidden flex gap-1 p-0.5 border border-line">
                      <div
                        className={`h-full rounded-xs transition-all duration-500 ${
                          timerSeconds > 0 ? 'bg-gold flex-1' : 'bg-transparent flex-1'
                        }`}
                      />
                      <div
                        className={`h-full rounded-xs transition-all duration-500 ${
                          timerSeconds >= 1200 ? 'bg-gold flex-1' : 'bg-card-hover flex-1'
                        }`}
                      />
                      <div
                        className={`h-full rounded-xs transition-all duration-500 ${
                          timerSeconds >= 2700 ? 'bg-cedar flex-1' : 'bg-card-hover flex-1'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Session Setting & Construction Mechanics */}
          <div className="border border-line rounded-lg bg-header overflow-hidden">
            <div
              onClick={() => toggleSection('sessionSetting')}
              className="px-4 py-2.5 bg-section-header hover:bg-section-header-hover flex items-center justify-between cursor-pointer transition select-none"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                <span>3. Session Setting & Construction</span>
                <span className="text-text-muted font-normal tracking-normal text-[11px] ml-1">
                  ({location} &bull; {durationMinutes} mins &bull; {drawQuality} Draw)
                </span>
              </h3>
              <div className="text-text-muted">
                {openSections.sessionSetting ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {openSections.sessionSetting && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Date Smoked</label>
                    <input
                      type="date"
                      value={smokedAt}
                      onChange={(e) => setSmokedAt(e.target.value)}
                      className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="Backyard, Cigar Lounge, Porch"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Occasion / Vibe</label>
                    <input
                      type="text"
                      placeholder="Weekend unwind, Celebration"
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] uppercase tracking-wider text-text-muted">Duration (Minutes)</label>
                      {timerSeconds > 0 && (
                        <button
                          type="button"
                          onClick={handleApplyTimerToDuration}
                          className="text-[9px] text-gold hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                          title="Sync with stopwatch timer"
                        >
                          <Timer className="w-2.5 h-2.5" />
                          <span>Sync ({Math.max(1, Math.round(timerSeconds / 60))}m)</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="360"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
                      className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Draw Quality</label>
                    <select
                      value={drawQuality}
                      onChange={(e) => setDrawQuality(e.target.value as SmokeLog['drawQuality'])}
                      className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                    >
                      <option value="Perfect">Perfect / Effortless</option>
                      <option value="Slightly Open">Slightly Open</option>
                      <option value="Snug">Snug / Moderate Resistance</option>
                      <option value="Tight">Tight (Needs Draw Tool)</option>
                      <option value="Loose">Loose / Windy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Burn Quality</label>
                    <select
                      value={burnQuality}
                      onChange={(e) => setBurnQuality(e.target.value as SmokeLog['burnQuality'])}
                      className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                    >
                      <option value="Razor Sharp">Razor Sharp</option>
                      <option value="Great">Great (Minimal Drift)</option>
                      <option value="Wavy / Minor Touchup">Wavy / Minor Touchup</option>
                      <option value="Canoeing">Canoeing / Uneven</option>
                      <option value="Relights Needed">Relights Needed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Ash Character</label>
                    <select
                      value={ashQuality}
                      onChange={(e) => setAshQuality(e.target.value as SmokeLog['ashQuality'])}
                      className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                    >
                      <option value="Firm White & Grey">Firm White & Grey (2+ in)</option>
                      <option value="Dense Ribbed">Dense Ribbed Stack of Dimes</option>
                      <option value="Flaky Light Grey">Flaky Light Grey</option>
                      <option value="Loose / Dark">Loose / Dark Flakes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Cut & Light Method</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={cutType}
                        onChange={(e) => setCutType(e.target.value as SmokeLog['cutType'])}
                        className="w-full bg-surface border border-line rounded-md px-2 py-2 text-[11px] text-text focus:outline-hidden focus:border-gold"
                      >
                        <option value="Deep V-Cut">V-Cut</option>
                        <option value="Straight Cut">Straight</option>
                        <option value="Punch Cut">Punch</option>
                        <option value="Shave / Angle">Crown/Angle</option>
                      </select>
                      <select
                        value={lightType}
                        onChange={(e) => setLightType(e.target.value as SmokeLog['lightType'])}
                        className="w-full bg-surface border border-line rounded-md px-2 py-2 text-[11px] text-text focus:outline-hidden focus:border-gold"
                      >
                        <option value="Single Torch">Torch</option>
                        <option value="Triple Torch">Triple</option>
                        <option value="Soft Flame / Cedar Spill">Soft/Cedar</option>
                        <option value="Matches">Matches</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: 3-Thirds Flavor Evolution */}
          <div className="border border-line rounded-lg bg-header overflow-hidden">
            <div
              onClick={() => toggleSection('flavorEvolution')}
              className="px-4 py-2.5 bg-section-header hover:bg-section-header-hover flex items-center justify-between cursor-pointer transition select-none"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                <span>4. 3-Thirds Sensory Progression</span>
                <span className="text-text-muted font-normal tracking-normal text-[11px] ml-1">
                  ({firstThirdNotes.length + secondThirdNotes.length + finalThirdNotes.length} evolution notes)
                </span>
              </h3>
              <div className="text-text-muted">
                {openSections.flavorEvolution ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {openSections.flavorEvolution && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 1st Third */}
                  <div className="p-3.5 bg-surface border border-line rounded-lg">
                    <div className="text-xs font-serif font-semibold text-gold mb-2">1st Third (Initial Light & Warmup)</div>
                    <div className="flex flex-wrap gap-1 mb-2 min-h-[44px] p-2 bg-card rounded border border-line/60">
                      {firstThirdNotes.length === 0 ? (
                        <span className="text-[11px] text-text-muted/60 italic">No notes selected</span>
                      ) : (
                        firstThirdNotes.map((note) => (
                          <span
                            key={note}
                            onClick={() => toggleArrayItem(firstThirdNotes, setFirstThirdNotes, note)}
                            className="text-[10px] bg-card-hover border border-gold/60 text-gold px-2 py-0.5 rounded cursor-pointer hover:bg-red-950 hover:text-red-300 transition"
                          >
                            {note} ✕
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {['Spanish Cedar', 'White Pepper (Retrohale)', 'Cream / Milk', 'Baking Spice', 'Toasted Bread', 'Vanilla Bean', 'Citrus Zest'].map(
                        (n) => (
                          <button
                            type="button"
                            key={n}
                            onClick={() => toggleArrayItem(firstThirdNotes, setFirstThirdNotes, n)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                              firstThirdNotes.includes(n) ? 'bg-card-hover border-gold text-gold font-semibold' : 'bg-card border-line text-text-muted'
                            }`}
                          >
                            + {n}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* 2nd Third */}
                  <div className="p-3.5 bg-surface border border-line rounded-lg">
                    <div className="text-xs font-serif font-semibold text-gold mb-2">2nd Third (Sweet Spot & Core)</div>
                    <div className="flex flex-wrap gap-1 mb-2 min-h-[44px] p-2 bg-card rounded border border-line/60">
                      {secondThirdNotes.length === 0 ? (
                        <span className="text-[11px] text-text-muted/60 italic">No notes selected</span>
                      ) : (
                        secondThirdNotes.map((note) => (
                          <span
                            key={note}
                            onClick={() => toggleArrayItem(secondThirdNotes, setSecondThirdNotes, note)}
                            className="text-[10px] bg-card-hover border border-gold/60 text-gold px-2 py-0.5 rounded cursor-pointer hover:bg-red-950 hover:text-red-300 transition"
                          >
                            {note} ✕
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {['Dark Chocolate', 'Espresso', 'Caramel', 'Leather', 'Toasted Almond', 'Nutmeg', 'Cocoa Powder', 'Nougat'].map(
                        (n) => (
                          <button
                            type="button"
                            key={n}
                            onClick={() => toggleArrayItem(secondThirdNotes, setSecondThirdNotes, n)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                              secondThirdNotes.includes(n) ? 'bg-card-hover border-gold text-gold font-semibold' : 'bg-card border-line text-text-muted'
                            }`}
                          >
                            + {n}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Final Third */}
                  <div className="p-3.5 bg-surface border border-line rounded-lg">
                    <div className="text-xs font-serif font-semibold text-gold mb-2">Final Third (The Nub & Finish)</div>
                    <div className="flex flex-wrap gap-1 mb-2 min-h-[44px] p-2 bg-card rounded border border-line/60">
                      {finalThirdNotes.length === 0 ? (
                        <span className="text-[11px] text-text-muted/60 italic">No notes selected</span>
                      ) : (
                        finalThirdNotes.map((note) => (
                          <span
                            key={note}
                            onClick={() => toggleArrayItem(finalThirdNotes, setFinalThirdNotes, note)}
                            className="text-[10px] bg-card-hover border border-gold/60 text-gold px-2 py-0.5 rounded cursor-pointer hover:bg-red-950 hover:text-red-300 transition"
                          >
                            {note} ✕
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {['Charred Oak', 'Rich Soil', 'Black Pepper', 'Dark Roast Coffee', 'Molasses', 'Mesquite', 'Leather'].map(
                        (n) => (
                          <button
                            type="button"
                            key={n}
                            onClick={() => toggleArrayItem(finalThirdNotes, setFinalThirdNotes, n)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                              finalThirdNotes.includes(n) ? 'bg-card-hover border-gold text-gold font-semibold' : 'bg-card border-line text-text-muted'
                            }`}
                          >
                            + {n}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Drink Pairing Section */}
          <div className="border border-line rounded-lg bg-header overflow-hidden">
            <div
              onClick={() => toggleSection('pairing')}
              className="px-4 py-2.5 bg-section-header hover:bg-section-header-hover flex items-center justify-between cursor-pointer transition select-none"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-gold" />
                <span>5. Beverage Accompaniment & Pairing Synergy</span>
                <span className="text-text-muted font-normal tracking-normal text-[11px] ml-1">
                  ({pairingDrink})
                </span>
              </h3>
              <div className="text-text-muted">
                {openSections.pairing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {openSections.pairing && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Pairing Beverage</label>
                  <input
                    type="text"
                    placeholder="e.g. Woodford Reserve Double Oaked Bourbon, Espresso, Dr Pepper"
                    value={pairingDrink}
                    onChange={(e) => setPairingDrink(e.target.value)}
                    className="w-full bg-card border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Pairing Flavor Interactions</label>
                  <input
                    type="text"
                    placeholder="How did the drink cut through or elevate the tobacco oils?"
                    value={pairingNotes}
                    onChange={(e) => setPairingNotes(e.target.value)}
                    className="w-full bg-card border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Overall Rating & Verdict */}
          <div className="border border-line rounded-lg bg-header overflow-hidden">
            <div
              onClick={() => toggleSection('scoreVerdict')}
              className="px-4 py-2.5 bg-section-header hover:bg-section-header-hover flex items-center justify-between cursor-pointer transition select-none"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                <span>6. Connoisseur Score & Re-Buy Verdict</span>
                <span className="text-text-muted font-normal tracking-normal text-[11px] ml-1">
                  ({overallScore}/100 &bull; {starRating}★ &bull; {wouldRebuy})
                </span>
              </h3>
              <div className="text-text-muted">
                {openSections.scoreVerdict ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {openSections.scoreVerdict && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] uppercase tracking-wider text-text-muted">Score (1-100 Scale)</label>
                    <span className="text-base font-bold text-gold">{overallScore}/100</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="100"
                    value={overallScore}
                    onChange={(e) => setOverallScore(parseInt(e.target.value, 10))}
                    className="w-full accent-gold cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-text-muted mt-1">
                    <span>60 (Mediocre)</span>
                    <span>90 (Outstanding)</span>
                    <span>98+ (Classic)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1.5">Star Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setStarRating(star)}
                        className="p-1 text-gold hover:scale-110 transition cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            starRating >= star ? 'fill-gold text-gold' : 'text-line'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-text ml-2 font-semibold">{starRating}/5</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Re-Buy Verdict</label>
                  <select
                    value={wouldRebuy}
                    onChange={(e) => setWouldRebuy(e.target.value as SmokeLog['wouldRebuy'])}
                    className="w-full bg-card border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                  >
                    <option value="Box Worthy">📦 Box Worthy (Must Have Stock)</option>
                    <option value="5-Pack Buy">🔥 5-Pack Buy (Solid Rotation)</option>
                    <option value="Single Occasionally">🏷️ Single Occasionally</option>
                    <option value="Never Again">⛔ Pass / Never Again</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 7: Detailed Review Text */}
          <div className="border border-line rounded-lg bg-header overflow-hidden">
            <div
              onClick={() => toggleSection('detailedReview')}
              className="px-4 py-2.5 bg-section-header hover:bg-section-header-hover flex items-center justify-between cursor-pointer transition select-none"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                <span>7. Detailed Connoisseur Notes & Review</span>
              </h3>
              <div className="text-text-muted">
                {openSections.detailedReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {openSections.detailedReview && (
              <div className="p-4">
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the aroma of the wrapper pre-light, draw resistance, flavor changes across thirds, smoke texture (creamy, dry, oily), and overall satisfaction..."
                  value={detailedReview}
                  onChange={(e) => setDetailedReview(e.target.value)}
                  className="w-full bg-surface border border-line rounded-md px-3 py-2 text-xs text-text focus:outline-hidden focus:border-gold"
                />
              </div>
            )}
          </div>

          {/* Form error */}
          {formError && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-md text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-line flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface hover:bg-card-hover text-text-muted hover:text-text border border-line rounded text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gold hover:brightness-110 text-ink font-bold uppercase tracking-wider rounded text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-ink" />
              <span>{logToEdit ? 'Update Smoke Session' : 'Save Smoke Session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
