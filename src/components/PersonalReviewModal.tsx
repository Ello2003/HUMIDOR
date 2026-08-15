import React, { useState, useEffect } from 'react';
import { X, Star, Heart, Flame, Sparkles, Check, Bookmark, Coffee, Award } from 'lucide-react';
import { CigarResearchItem } from '../types';
import { FLAVOR_CATEGORIES } from '../data/initialData';

interface PersonalReviewModalProps {
  cigar: CigarResearchItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSavePersonalReview: (cigarId: string, review: {
    personalRating?: number;
    personalNotes?: string;
    personalFavorite?: boolean;
    personalTried?: boolean;
    personalWouldRebuy?: 'Box Worthy' | '5-Pack Buy' | 'Single Occasionally' | 'Never Again' | 'Not Smoked Yet';
    personalPairingNotes?: string;
  }) => void;
}

export const PersonalReviewModal: React.FC<PersonalReviewModalProps> = ({
  cigar,
  isOpen,
  onClose,
  onSavePersonalReview,
}) => {
  const [personalRating, setPersonalRating] = useState<number>(cigar?.personalRating || 92);
  const [personalNotes, setPersonalNotes] = useState<string>(cigar?.personalNotes || '');
  const [personalFavorite, setPersonalFavorite] = useState<boolean>(cigar?.personalFavorite || false);
  const [personalTried, setPersonalTried] = useState<boolean>(cigar?.personalTried ?? true);
  const [personalWouldRebuy, setPersonalWouldRebuy] = useState<'Box Worthy' | '5-Pack Buy' | 'Single Occasionally' | 'Never Again' | 'Not Smoked Yet'>(
    cigar?.personalWouldRebuy || 'Box Worthy'
  );
  const [personalPairingNotes, setPersonalPairingNotes] = useState<string>(cigar?.personalPairingNotes || '');

  useEffect(() => {
    if (cigar) {
      setPersonalRating(cigar.personalRating || 92);
      setPersonalNotes(cigar.personalNotes || '');
      setPersonalFavorite(cigar.personalFavorite || false);
      setPersonalTried(cigar.personalTried ?? true);
      setPersonalWouldRebuy(cigar.personalWouldRebuy || 'Box Worthy');
      setPersonalPairingNotes(cigar.personalPairingNotes || '');
    }
  }, [cigar]);

  if (!isOpen || !cigar) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePersonalReview(cigar.id, {
      personalRating,
      personalNotes,
      personalFavorite,
      personalTried,
      personalWouldRebuy,
      personalPairingNotes,
    });
    onClose();
  };

  const addFlavorTag = (tag: string) => {
    if (!personalNotes.includes(tag)) {
      setPersonalNotes((prev) => (prev ? `${prev}, ${tag}` : tag));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[#1C1816] border border-[#2C2621] rounded-lg shadow-2xl overflow-hidden text-[#E5E1DA]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#13110F] border-b border-[#2C2621] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#1C1816] border border-[#2C2621] flex items-center justify-center text-[#D4AF37]">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-semibold text-[#E5E1DA]">Personal Rating & Sommelier Notes</h2>
              <p className="text-xs text-[#A89F94]">
                {cigar.brand} {cigar.line} ({cigar.vitola})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A89F94] hover:text-[#E5E1DA] p-1.5 rounded hover:bg-[#241E1B] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Quick Specs Strip */}
          <div className="p-3 bg-[#13110F] border border-[#2C2621] rounded-md grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#A89F94] block">Origin</span>
              <span className="font-semibold text-[#E5E1DA]">{cigar.countryOrigin}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#A89F94] block">Wrapper</span>
              <span className="font-semibold text-[#E5E1DA] truncate block">{cigar.wrapper}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#A89F94] block">Avg Price</span>
              <span className="font-semibold text-[#D4AF37]">${cigar.averagePrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#A89F94] block">Critic Score</span>
              <span className="font-semibold text-[#E5E1DA]">★ {cigar.criticRating}/100</span>
            </div>
          </div>

          {/* Rating Slider (1-100) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                Your Connoisseur Rating
              </label>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-serif font-bold text-white">{personalRating}</span>
                <span className="text-xs text-[#A89F94]">/ 100</span>
              </div>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={personalRating}
              onChange={(e) => setPersonalRating(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-[#13110F] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
            />
            <div className="flex justify-between text-[10px] text-[#A89F94]">
              <span>50 (Mediocre)</span>
              <span>75 (Solid Everyday)</span>
              <span>90 (Outstanding)</span>
              <span className="text-[#D4AF37] font-semibold">95-100 (Masterpiece)</span>
            </div>
          </div>

          {/* Toggles: Tried / Favorite / Rebuy Verdict */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2.5 p-3 rounded bg-[#13110F] border border-[#2C2621] cursor-pointer hover:border-[#3D352E] transition">
              <input
                type="checkbox"
                checked={personalTried}
                onChange={(e) => setPersonalTried(e.target.checked)}
                className="w-4 h-4 rounded bg-[#1C1816] border-[#2C2621] text-[#D4AF37] focus:ring-0"
              />
              <span className="text-xs font-medium text-[#E5E1DA]">Mark as Smoked / Tried</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded bg-[#13110F] border border-[#2C2621] cursor-pointer hover:border-[#3D352E] transition">
              <input
                type="checkbox"
                checked={personalFavorite}
                onChange={(e) => setPersonalFavorite(e.target.checked)}
                className="w-4 h-4 rounded bg-[#1C1816] border-[#2C2621] text-[#D4AF37] focus:ring-0"
              />
              <span className="text-xs font-medium text-[#E5E1DA] flex items-center gap-1">
                <Heart className={`w-3.5 h-3.5 ${personalFavorite ? 'text-red-400 fill-red-400' : 'text-[#A89F94]'}`} />
                <span>Personal Favorite</span>
              </span>
            </label>

            <div>
              <label className="block text-[10px] text-[#A89F94] uppercase tracking-wider mb-1">Rebuy Verdict</label>
              <select
                value={personalWouldRebuy}
                onChange={(e) => setPersonalWouldRebuy(e.target.value as any)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              >
                <option value="Box Worthy">📦 Box Worthy</option>
                <option value="5-Pack Buy">🖐️ 5-Pack Buy</option>
                <option value="Single Occasionally">🏷️ Single Occasionally</option>
                <option value="Never Again">🚫 Never Again</option>
                <option value="Not Smoked Yet">⏳ Not Smoked Yet</option>
              </select>
            </div>
          </div>

          {/* Personal Tasting Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                Personal Tasting Notes & Impressions
              </label>
              <span className="text-[10px] text-[#A89F94]">Saved in your private research ledger</span>
            </div>
            <textarea
              rows={4}
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder="e.g. Sublime retrohale with heavy baker's cocoa and roasted espresso. Draw was open and effortless throughout the 80 minutes..."
              className="w-full bg-[#13110F] border border-[#2C2621] rounded p-3 text-xs sm:text-sm text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37] placeholder-[#A89F94]/50"
            />
          </div>

          {/* Quick Flavor Chips Helper */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-[#A89F94] uppercase tracking-wider block">Click to append tasting notes:</span>
            <div className="flex flex-wrap gap-1">
              {['Dark Chocolate', 'Espresso', 'Spanish Cedar', 'White Pepper', 'Caramel', 'Leather', 'Cream', 'Vanilla Bean', 'Toasted Almond', 'Cinnamon', 'Baking Spice', 'Earth'].map(
                (tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => addFlavorTag(tag)}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#13110F] border border-[#2C2621] text-[#A89F94] hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition cursor-pointer"
                  >
                    + {tag}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Personal Beverage Pairing Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Personal Pairing Notes (Bourbon, Coffee, Scotch, Wine)</span>
            </label>
            <input
              type="text"
              value={personalPairingNotes}
              onChange={(e) => setPersonalPairingNotes(e.target.value)}
              placeholder="e.g. Paired with Woodford Reserve Double Oaked and a shot of espresso"
              className="w-full bg-[#13110F] border border-[#2C2621] rounded px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37] placeholder-[#A89F94]/50"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#2C2621] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#13110F] hover:bg-[#241E1B] text-[#A89F94] hover:text-[#E5E1DA] border border-[#2C2621] rounded text-xs uppercase tracking-wider font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] rounded text-xs uppercase tracking-wider font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Rating & Notes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
