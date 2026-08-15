import React, { useState } from 'react';
import { X, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { Cigar, Humidor, StrengthRating, CigarStatus } from '../types';
import { FLAVOR_CATEGORIES } from '../data/initialData';

interface AddCigarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cigar: Omit<Cigar, 'id' | 'createdAt' | 'updatedAt'>, idToEdit?: string) => void;
  humidors: Humidor[];
  cigarToEdit?: Cigar | null;
  prefillData?: Partial<Cigar> | null;
}

export const AddCigarModal: React.FC<AddCigarModalProps> = ({
  isOpen,
  onClose,
  onSave,
  humidors,
  cigarToEdit,
  prefillData,
}) => {
  if (!isOpen) return null;

  const [brand, setBrand] = useState(cigarToEdit?.brand || prefillData?.brand || '');
  const [name, setName] = useState(cigarToEdit?.name || prefillData?.name || '');
  const [line, setLine] = useState(cigarToEdit?.line || prefillData?.line || '');
  const [vitola, setVitola] = useState(cigarToEdit?.vitola || prefillData?.vitola || 'Robusto');
  const [lengthInches, setLengthInches] = useState<string>(
    cigarToEdit?.lengthInches ? String(cigarToEdit.lengthInches) : prefillData?.lengthInches ? String(prefillData.lengthInches) : '5.0'
  );
  const [ringGauge, setRingGauge] = useState<string>(
    cigarToEdit?.ringGauge ? String(cigarToEdit.ringGauge) : prefillData?.ringGauge ? String(prefillData.ringGauge) : '50'
  );
  const [wrapper, setWrapper] = useState(cigarToEdit?.wrapper || prefillData?.wrapper || 'Nicaraguan Habano');
  const [binder, setBinder] = useState(cigarToEdit?.binder || prefillData?.binder || 'Nicaragua');
  const [filler, setFiller] = useState(cigarToEdit?.filler || prefillData?.filler || 'Nicaragua');
  const [countryOrigin, setCountryOrigin] = useState(
    cigarToEdit?.countryOrigin || prefillData?.countryOrigin || 'Nicaragua'
  );
  const [strength, setStrength] = useState<StrengthRating>(
    (cigarToEdit?.strength as StrengthRating) || (prefillData?.strength as StrengthRating) || 'Medium-Full'
  );
  const [quantity, setQuantity] = useState<number>(cigarToEdit?.quantity ?? prefillData?.quantity ?? 1);
  const [humidorId, setHumidorId] = useState<string>(
    cigarToEdit?.humidorId || prefillData?.humidorId || humidors[0]?.id || ''
  );
  const [purchaseDate, setPurchaseDate] = useState<string>(
    cigarToEdit?.purchaseDate || prefillData?.purchaseDate || new Date().toISOString().split('T')[0]
  );
  const [boxDate, setBoxDate] = useState<string>(cigarToEdit?.boxDate || prefillData?.boxDate || '');
  const [purchasePrice, setPurchasePrice] = useState<string>(
    cigarToEdit?.purchasePrice !== undefined
      ? String(cigarToEdit.purchasePrice)
      : prefillData?.purchasePrice !== undefined
      ? String(prefillData.purchasePrice)
      : '14.00'
  );
  const [currency] = useState<string>(cigarToEdit?.currency || '$');
  const [vendor, setVendor] = useState<string>(cigarToEdit?.vendor || prefillData?.vendor || '');
  const [boxCode, setBoxCode] = useState<string>(cigarToEdit?.boxCode || '');
  const [targetRestMonths, setTargetRestMonths] = useState<number>(
    cigarToEdit?.targetRestMonths ?? prefillData?.targetRestMonths ?? 6
  );
  const [personalRating, setPersonalRating] = useState<string>(
    cigarToEdit?.personalRating ? String(cigarToEdit.personalRating) : ''
  );
  const [status, setStatus] = useState<CigarStatus>(cigarToEdit?.status || 'ready');
  const [isFavorite, setIsFavorite] = useState<boolean>(cigarToEdit?.isFavorite || false);
  const [notes, setNotes] = useState<string>(cigarToEdit?.notes || prefillData?.notes || '');
  const [flavorTags, setFlavorTags] = useState<string[]>(
    cigarToEdit?.flavorTags || prefillData?.flavorTags || ['Spanish Cedar', 'Dark Chocolate']
  );
  const [customTagInput, setCustomTagInput] = useState('');

  const toggleFlavorTag = (tag: string) => {
    if (flavorTags.includes(tag)) {
      setFlavorTags(flavorTags.filter((t) => t !== tag));
    } else {
      setFlavorTags([...flavorTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim() && !flavorTags.includes(customTagInput.trim())) {
      setFlavorTags([...flavorTags, customTagInput.trim()]);
      setCustomTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !name.trim()) {
      alert('Please provide both a brand and cigar name.');
      return;
    }

    onSave(
      {
        brand: brand.trim(),
        name: name.trim(),
        line: line.trim() || name.trim(),
        vitola: vitola.trim() || 'Robusto',
        lengthInches: lengthInches ? parseFloat(lengthInches) : undefined,
        ringGauge: ringGauge ? parseInt(ringGauge, 10) : undefined,
        wrapper: wrapper.trim(),
        binder: binder.trim() || undefined,
        filler: filler.trim() || undefined,
        countryOrigin: countryOrigin.trim() || 'Nicaragua',
        strength,
        quantity: Math.max(0, quantity),
        humidorId,
        purchaseDate,
        boxDate: boxDate.trim() || undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        currency,
        vendor: vendor.trim() || undefined,
        boxCode: boxCode.trim() || undefined,
        targetRestMonths: Math.max(0, targetRestMonths),
        notes: notes.trim() || undefined,
        personalRating: personalRating ? parseInt(personalRating, 10) : undefined,
        isFavorite,
        status,
        flavorTags,
      },
      cigarToEdit?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-[#1C1816] border border-[#2C2621] rounded-lg shadow-2xl overflow-hidden text-[#E5E1DA]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#13110F] border-b border-[#2C2621] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#D4AF37] text-lg">🍂</span>
            <h2 className="text-base font-serif font-semibold text-[#E5E1DA]">
              {cigarToEdit ? 'Edit Humidor Stick' : 'Add Cigar to Humidor'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#A89F94] hover:text-[#E5E1DA] p-1.5 rounded hover:bg-[#241E1B] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Basic Details */}
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37] mb-3 flex items-center gap-1.5">
              <span>Identification & Maker</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Brand / Maker *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arturo Fuente, Padrón"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Cigar Name / Series *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpusX, 1926 Serie"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Line / Sub-Series</label>
                <input
                  type="text"
                  placeholder="e.g. Maduro, Rare Pink"
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          {/* Dimensions & Blend */}
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37] mb-3 flex items-center gap-1.5">
              <span>Vitola, Dimensions & Tobacco Blend</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Vitola / Shape</label>
                <input
                  type="text"
                  placeholder="Robusto, Toro, Churchill, Figurado"
                  value={vitola}
                  onChange={(e) => setVitola(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Length (inches)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="5.25"
                  value={lengthInches}
                  onChange={(e) => setLengthInches(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Ring Gauge</label>
                <input
                  type="number"
                  placeholder="52"
                  value={ringGauge}
                  onChange={(e) => setRingGauge(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Origin Country</label>
                <select
                  value={countryOrigin}
                  onChange={(e) => setCountryOrigin(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="Nicaragua">Nicaragua</option>
                  <option value="Dominican Republic">Dominican Republic</option>
                  <option value="Cuba">Cuba</option>
                  <option value="Honduras">Honduras</option>
                  <option value="Ecuador">Ecuador</option>
                  <option value="Mexico">Mexico</option>
                  <option value="Costa Rica">Costa Rica</option>
                  <option value="United States">United States</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Wrapper Leaf</label>
                <input
                  type="text"
                  placeholder="e.g. Ecuadorian Habano, Maduro, Broadleaf"
                  value={wrapper}
                  onChange={(e) => setWrapper(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Binder</label>
                <input
                  type="text"
                  placeholder="e.g. San Andrés, Estelí"
                  value={binder}
                  onChange={(e) => setBinder(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Filler</label>
                <input
                  type="text"
                  placeholder="e.g. Jalapa, Condega, Ometepe"
                  value={filler}
                  onChange={(e) => setFiller(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          {/* Humidor Placement & Inventory */}
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37] mb-3 flex items-center gap-1.5">
              <span>Humidor Placement, Quantity & Aging</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Humidor Location *</label>
                <select
                  value={humidorId}
                  onChange={(e) => setHumidorId(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  {humidors.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.currentHumidity}% RH)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Quantity in Stock *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Strength Profile</label>
                <select
                  value={strength}
                  onChange={(e) => setStrength(e.target.value as StrengthRating)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="Mild">Mild</option>
                  <option value="Mild-Medium">Mild-Medium</option>
                  <option value="Medium">Medium</option>
                  <option value="Medium-Full">Medium-Full</option>
                  <option value="Full">Full</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Resting Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CigarStatus)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="ready">Ready to Smoke 💨</option>
                  <option value="resting">Resting in Humidor ⏳</option>
                  <option value="aging">Long-term Aging 🪵</option>
                  <option value="special_occasion">Special Occasion Reserve 🌟</option>
                  <option value="archived">Archived / Emptied</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Target Rest (Months)</label>
                <input
                  type="number"
                  min="0"
                  value={targetRestMonths}
                  onChange={(e) => setTargetRestMonths(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Price per Stick ($)</label>
                <input
                  type="number"
                  step="0.25"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Vendor / B&M Shop</label>
                <input
                  type="text"
                  placeholder="e.g. Local B&M, Fox Cigar"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          {/* Flavor Profile Tags */}
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37] mb-2 flex items-center gap-1.5">
              <span>Flavor Profile Tags</span>
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {FLAVOR_CATEGORIES.flatMap((c) => c.notes).map((note) => {
                const isSelected = flavorTags.includes(note);
                return (
                  <button
                    type="button"
                    key={note}
                    onClick={() => toggleFlavorTag(note)}
                    className={`text-xs px-2.5 py-1 rounded border transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#241E1B] border-[#D4AF37] text-[#D4AF37] font-semibold'
                        : 'bg-[#13110F] border-[#2C2621] text-[#A89F94] hover:border-[#3D352E]'
                    }`}
                  >
                    {note}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom flavor note..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                className="bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-1.5 text-xs text-[#E5E1DA] flex-1 focus:outline-hidden focus:border-[#D4AF37]"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 bg-[#13110F] hover:bg-[#241E1B] rounded-md text-xs text-[#D4AF37] border border-[#2C2621] flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Tag
              </button>
            </div>
          </div>

          {/* Personal Rating, Favorite & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Personal Rating (1-100)</label>
              <input
                type="number"
                min="50"
                max="100"
                placeholder="e.g. 95"
                value={personalRating}
                onChange={(e) => setPersonalRating(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Box Date / Box Code</label>
              <input
                type="text"
                placeholder="e.g. DIC 24, CF-08"
                value={boxCode}
                onChange={(e) => setBoxCode(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="w-4 h-4 rounded-xs border-[#2C2621] bg-[#13110F] text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-xs text-[#E5E1DA]">Mark as Connoisseur Favorite ⭐</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Collector Notes / Aging Expectations</label>
            <textarea
              rows={3}
              placeholder="Pairing ideas, box purchase memories, wrapper notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
            ></textarea>
          </div>

          {/* Action Buttons */}
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
              <span>{cigarToEdit ? 'Save Changes' : 'Store in Humidor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
