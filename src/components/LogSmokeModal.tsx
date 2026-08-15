import React, { useState, useEffect } from 'react';
import { X, Flame, Coffee, Star, CheckCircle, Award } from 'lucide-react';
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
  if (!isOpen) return null;

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
    if (!cigarBrand.trim() || !cigarName.trim()) {
      alert('Please provide brand and cigar name.');
      return;
    }

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#d97706', '#b45309', '#78350f', '#f59e0b'],
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

  const allAvailableFlavorNotes = FLAVOR_CATEGORIES.flatMap((c) => c.notes);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-[#1C1816] border border-[#2C2621] rounded-lg shadow-2xl overflow-hidden text-[#E5E1DA]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#13110F] border-b border-[#2C2621] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#1C1816] border border-[#2C2621] flex items-center justify-center text-[#D4AF37]">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-semibold text-[#E5E1DA]">
                {logToEdit ? 'Edit Tasting Session' : 'Log a Cigar Smoke Session'}
              </h2>
              <p className="text-xs text-[#A89F94]">Capture flavor transitions, pairings, burn notes and rating</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A89F94] hover:text-[#E5E1DA] p-1.5 rounded hover:bg-[#241E1B] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Cigar Source Selection */}
          <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Cigar Selection</span>
                <span className="text-xs text-[#A89F94]/40">|</span>
                <button
                  type="button"
                  onClick={() => setIsCustomCigar(false)}
                  className={`text-xs px-2.5 py-1 rounded transition cursor-pointer ${
                    !isCustomCigar
                      ? 'bg-[#241E1B] text-[#D4AF37] border border-[#D4AF37]/60 font-semibold'
                      : 'text-[#A89F94] hover:text-[#E5E1DA]'
                  }`}
                >
                  From Humidor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCigar(true);
                    setDeductFromStock(false);
                  }}
                  className={`text-xs px-2.5 py-1 rounded transition cursor-pointer ${
                    isCustomCigar
                      ? 'bg-[#241E1B] text-[#D4AF37] border border-[#D4AF37]/60 font-semibold'
                      : 'text-[#A89F94] hover:text-[#E5E1DA]'
                  }`}
                >
                  Custom Stick / Lounge Smoke
                </button>
              </div>

              {!isCustomCigar && selectedCigarId && !logToEdit && (
                <label className="flex items-center gap-2 text-xs text-[#D4AF37] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deductFromStock}
                    onChange={(e) => setDeductFromStock(e.target.checked)}
                    className="rounded-xs border-[#2C2621] bg-[#13110F] text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <span>Deduct 1 stick from humidor inventory</span>
                </label>
              )}
            </div>

            {!isCustomCigar ? (
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Select from Humidor Stock</label>
                <select
                  value={selectedCigarId}
                  onChange={(e) => setSelectedCigarId(e.target.value)}
                  className="w-full bg-[#1C1816] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
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
                  <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Padrón"
                    value={cigarBrand}
                    onChange={(e) => setCigarBrand(e.target.value)}
                    className="w-full bg-[#1C1816] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Cigar Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1964 Anniversary"
                    value={cigarName}
                    onChange={(e) => setCigarName(e.target.value)}
                    className="w-full bg-[#1C1816] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Vitola / Shape</label>
                  <input
                    type="text"
                    placeholder="e.g. Exclusivo Maduro"
                    value={vitola}
                    onChange={(e) => setVitola(e.target.value)}
                    className="w-full bg-[#1C1816] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Session Context & Mechanics */}
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37] mb-3">
              Session Setting & Construction
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Date Smoked</label>
                <input
                  type="date"
                  value={smokedAt}
                  onChange={(e) => setSmokedAt(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Location</label>
                <input
                  type="text"
                  placeholder="Backyard, Cigar Lounge, Porch"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Occasion / Vibe</label>
                <input
                  type="text"
                  placeholder="Weekend unwind, Celebration"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min="15"
                  max="240"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Draw Quality</label>
                <select
                  value={drawQuality}
                  onChange={(e) => setDrawQuality(e.target.value as SmokeLog['drawQuality'])}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="Perfect">Perfect / Effortless</option>
                  <option value="Slightly Open">Slightly Open</option>
                  <option value="Snug">Snug / Moderate Resistance</option>
                  <option value="Tight">Tight (Needs Draw Tool)</option>
                  <option value="Loose">Loose / Windy</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Burn Quality</label>
                <select
                  value={burnQuality}
                  onChange={(e) => setBurnQuality(e.target.value as SmokeLog['burnQuality'])}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="Razor Sharp">Razor Sharp</option>
                  <option value="Great">Great (Minimal Drift)</option>
                  <option value="Wavy / Minor Touchup">Wavy / Minor Touchup</option>
                  <option value="Canoeing">Canoeing / Uneven</option>
                  <option value="Relights Needed">Relights Needed</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Ash Character</label>
                <select
                  value={ashQuality}
                  onChange={(e) => setAshQuality(e.target.value as SmokeLog['ashQuality'])}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="Firm White & Grey">Firm White & Grey (2+ in)</option>
                  <option value="Dense Ribbed">Dense Ribbed Stack of Dimes</option>
                  <option value="Flaky Light Grey">Flaky Light Grey</option>
                  <option value="Loose / Dark">Loose / Dark Flakes</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Cut & Light Method</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={cutType}
                    onChange={(e) => setCutType(e.target.value as SmokeLog['cutType'])}
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-2 py-2 text-[11px] text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                  >
                    <option value="Deep V-Cut">V-Cut</option>
                    <option value="Straight Cut">Straight</option>
                    <option value="Punch Cut">Punch</option>
                    <option value="Shave / Angle">Crown/Angle</option>
                  </select>
                  <select
                    value={lightType}
                    onChange={(e) => setLightType(e.target.value as SmokeLog['lightType'])}
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-2 py-2 text-[11px] text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
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

          {/* 3-Thirds Tasting Evolution */}
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37] mb-3 flex items-center justify-between">
              <span>💨 3-Thirds Flavor Evolution</span>
              <span className="text-[10px] text-[#A89F94] font-normal lowercase tracking-normal">Click notes to assign to each third</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1st Third */}
              <div className="p-3.5 bg-[#13110F] border border-[#2C2621] rounded-lg">
                <div className="text-xs font-serif font-semibold text-[#D4AF37] mb-2">1st Third (Initial Light & Warmup)</div>
                <div className="flex flex-wrap gap-1 mb-2 min-h-[44px] p-2 bg-[#1C1816] rounded border border-[#2C2621]/60">
                  {firstThirdNotes.length === 0 ? (
                    <span className="text-[11px] text-[#A89F94]/60 italic">No notes selected</span>
                  ) : (
                    firstThirdNotes.map((note) => (
                      <span
                        key={note}
                        onClick={() => toggleArrayItem(firstThirdNotes, setFirstThirdNotes, note)}
                        className="text-[10px] bg-[#241E1B] border border-[#D4AF37]/60 text-[#D4AF37] px-2 py-0.5 rounded cursor-pointer hover:bg-red-950 hover:text-red-300 transition"
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
                          firstThirdNotes.includes(n) ? 'bg-[#241E1B] border-[#D4AF37] text-[#D4AF37] font-semibold' : 'bg-[#1C1816] border-[#2C2621] text-[#A89F94]'
                        }`}
                      >
                        + {n}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* 2nd Third */}
              <div className="p-3.5 bg-[#13110F] border border-[#2C2621] rounded-lg">
                <div className="text-xs font-serif font-semibold text-[#D4AF37] mb-2">2nd Third (Sweet Spot & Core)</div>
                <div className="flex flex-wrap gap-1 mb-2 min-h-[44px] p-2 bg-[#1C1816] rounded border border-[#2C2621]/60">
                  {secondThirdNotes.length === 0 ? (
                    <span className="text-[11px] text-[#A89F94]/60 italic">No notes selected</span>
                  ) : (
                    secondThirdNotes.map((note) => (
                      <span
                        key={note}
                        onClick={() => toggleArrayItem(secondThirdNotes, setSecondThirdNotes, note)}
                        className="text-[10px] bg-[#241E1B] border border-[#D4AF37]/60 text-[#D4AF37] px-2 py-0.5 rounded cursor-pointer hover:bg-red-950 hover:text-red-300 transition"
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
                          secondThirdNotes.includes(n) ? 'bg-[#241E1B] border-[#D4AF37] text-[#D4AF37] font-semibold' : 'bg-[#1C1816] border-[#2C2621] text-[#A89F94]'
                        }`}
                      >
                        + {n}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Final Third */}
              <div className="p-3.5 bg-[#13110F] border border-[#2C2621] rounded-lg">
                <div className="text-xs font-serif font-semibold text-[#D4AF37] mb-2">Final Third (The Nub & Finish)</div>
                <div className="flex flex-wrap gap-1 mb-2 min-h-[44px] p-2 bg-[#1C1816] rounded border border-[#2C2621]/60">
                  {finalThirdNotes.length === 0 ? (
                    <span className="text-[11px] text-[#A89F94]/60 italic">No notes selected</span>
                  ) : (
                    finalThirdNotes.map((note) => (
                      <span
                        key={note}
                        onClick={() => toggleArrayItem(finalThirdNotes, setFinalThirdNotes, note)}
                        className="text-[10px] bg-[#241E1B] border border-[#D4AF37]/60 text-[#D4AF37] px-2 py-0.5 rounded cursor-pointer hover:bg-red-950 hover:text-red-300 transition"
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
                          finalThirdNotes.includes(n) ? 'bg-[#241E1B] border-[#D4AF37] text-[#D4AF37] font-semibold' : 'bg-[#1C1816] border-[#2C2621] text-[#A89F94]'
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

          {/* Drink Pairing Section */}
          <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-lg">
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37] mb-3 flex items-center gap-2">
              <Coffee className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Beverage Accompaniment & Pairing Synergy</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Pairing Beverage</label>
                <input
                  type="text"
                  placeholder="e.g. Woodford Reserve Double Oaked Bourbon, Espresso, Dr Pepper"
                  value={pairingDrink}
                  onChange={(e) => setPairingDrink(e.target.value)}
                  className="w-full bg-[#1C1816] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Pairing Flavor Interactions</label>
                <input
                  type="text"
                  placeholder="How did the drink cut through or elevate the tobacco oils?"
                  value={pairingNotes}
                  onChange={(e) => setPairingNotes(e.target.value)}
                  className="w-full bg-[#1C1816] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          {/* Overall Rating & Verdict */}
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37] mb-3">
              Connoisseur Score & Verdict
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#13110F] border border-[#2C2621] rounded-lg">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#A89F94]">Score (1-100 Scale)</label>
                  <span className="text-base font-bold text-[#D4AF37]">{overallScore}/100</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="100"
                  value={overallScore}
                  onChange={(e) => setOverallScore(parseInt(e.target.value, 10))}
                  className="w-full accent-[#D4AF37] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-[#A89F94] mt-1">
                  <span>60 (Mediocre)</span>
                  <span>90 (Outstanding)</span>
                  <span>98+ (Classic)</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1.5">Star Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setStarRating(star)}
                      className="p-1 text-[#D4AF37] hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          starRating >= star ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#2C2621]'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-[#E5E1DA] ml-2 font-semibold">{starRating}/5</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Re-Buy Verdict</label>
                <select
                  value={wouldRebuy}
                  onChange={(e) => setWouldRebuy(e.target.value as SmokeLog['wouldRebuy'])}
                  className="w-full bg-[#1C1816] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="Box Worthy">📦 Box Worthy (Must Have Stock)</option>
                  <option value="5-Pack Buy">🔥 5-Pack Buy (Solid Rotation)</option>
                  <option value="Single Occasionally">🏷️ Single Occasionally</option>
                  <option value="Never Again">⛔ Pass / Never Again</option>
                </select>
              </div>
            </div>
          </div>

          {/* Detailed Review Text */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1 font-semibold">
              Detailed Connoisseur Notes & Review
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe the aroma of the wrapper pre-light, draw resistance, flavor changes across thirds, smoke texture (creamy, dry, oily), and overall satisfaction..."
              value={detailedReview}
              onChange={(e) => setDetailedReview(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
            ></textarea>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#2C2621] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#13110F] hover:bg-[#241E1B] text-[#A89F94] hover:text-[#E5E1DA] border border-[#2C2621] rounded text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] font-bold uppercase tracking-wider rounded text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-[#0F0D0C]" />
              <span>{logToEdit ? 'Update Smoke Session' : 'Save Smoke Session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
