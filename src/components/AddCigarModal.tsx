import React, { useState } from 'react';
import { X, Sparkles, Plus, AlertCircle, Globe, Loader2, Check } from 'lucide-react';
import { Cigar, Humidor, StrengthRating, CigarStatus } from '../types';
import { FLAVOR_CATEGORIES } from '../data/initialData';
import { DEFAULT_CURRENCY } from '../utils/currencyUtils';

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
    cigarToEdit?.countryOrigin || prefillData?.countryOrigin || 'Cuba'
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
      : '24.50'
  );
  const [currency, setCurrency] = useState<string>(cigarToEdit?.currency || prefillData?.currency || DEFAULT_CURRENCY);
  const [vendor, setVendor] = useState<string>(cigarToEdit?.vendor || prefillData?.vendor || 'C.Gars Ltd');
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

  // Web link auto-fill state
  const [importUrl, setImportUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlFetchNotice, setUrlFetchNotice] = useState<string | null>(null);
  const [urlFetchError, setUrlFetchError] = useState<string | null>(null);

  const handleAutoFillFromUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!importUrl.trim()) return;

    setIsFetchingUrl(true);
    setUrlFetchError(null);
    setUrlFetchNotice(null);

    try {
      const res = await fetch('/api/import/cigar-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to auto-populate from URL.');
      }

      const extracted = data.data;
      if (extracted.brand) setBrand(extracted.brand);
      if (extracted.name) setName(extracted.name);
      if (extracted.line) setLine(extracted.line);
      if (extracted.vitola) setVitola(extracted.vitola);
      if (extracted.lengthInches) setLengthInches(String(extracted.lengthInches));
      if (extracted.ringGauge) setRingGauge(String(extracted.ringGauge));
      if (extracted.wrapper) setWrapper(extracted.wrapper);
      if (extracted.binder) setBinder(extracted.binder);
      if (extracted.filler) setFiller(extracted.filler);
      if (extracted.countryOrigin) setCountryOrigin(extracted.countryOrigin);
      if (extracted.strength) setStrength(extracted.strength as StrengthRating);
      if (extracted.purchasePrice !== undefined) setPurchasePrice(String(extracted.purchasePrice));
      if (extracted.currency) setCurrency(extracted.currency);
      if (extracted.vendor) setVendor(extracted.vendor);
      if (extracted.idealRestMonths) setTargetRestMonths(extracted.idealRestMonths);
      if (extracted.notes || extracted.productDescription) setNotes(extracted.notes || extracted.productDescription);
      if (extracted.flavorTags && extracted.flavorTags.length > 0) setFlavorTags(extracted.flavorTags);

      setUrlFetchNotice(`✨ Auto-populated specs and £ price from ${extracted.vendor || 'retailer'}!`);
    } catch (err: any) {
      setUrlFetchError(err.message || 'Could not auto-populate from website. Please enter details manually.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

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
        countryOrigin: countryOrigin.trim() || 'Cuba',
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

        {/* Quick URL Auto-Fill Bar */}
        {!cigarToEdit && (
          <div className="px-6 py-3 bg-gradient-to-r from-[#191513] via-[#1F1916] to-[#191513] border-b border-[#2C2621]">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Auto-Fill from Website Link (C.Gars Ltd, Havana House, etc.)</span>
              </span>
              <span className="text-[10px] text-[#A89F94]">⚡ Instant AI Specs & £ Pricing</span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste C.Gars or retailer link, e.g. https://www.cgarsltd.co.uk/montecristo-no4-cigar-p-54.html"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="flex-1 bg-[#13110F] border border-[#2C2621] rounded px-3 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37] placeholder-[#A89F94]/50"
              />
              <button
                type="button"
                onClick={handleAutoFillFromUrl}
                disabled={isFetchingUrl || !importUrl.trim()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#D4AF37] hover:brightness-110 disabled:opacity-50 text-[#0F0D0C] rounded text-xs uppercase tracking-wider font-bold shadow-sm transition cursor-pointer shrink-0"
              >
                {isFetchingUrl ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Fill Form</span>
                  </>
                )}
              </button>
            </div>
            {urlFetchNotice && (
              <div className="flex items-center gap-1.5 text-xs text-[#D4AF37] font-medium mt-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{urlFetchNotice}</span>
              </div>
            )}
            {urlFetchError && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{urlFetchError}</span>
              </div>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
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
                  placeholder="e.g. Montecristo, Padrón, Partagás"
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
                  placeholder="e.g. No. 4, Serie D No. 4, 1926 Serie"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Line / Sub-Series</label>
                <input
                  type="text"
                  placeholder="e.g. Classic, Rare Pink, Linea 1492"
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
                  placeholder="Robusto, Petit Corona, Toro, Churchill"
                  value={vitola}
                  onChange={(e) => setVitola(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Length (inches)</label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="5.12"
                  value={lengthInches}
                  onChange={(e) => setLengthInches(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Ring Gauge</label>
                <input
                  type="number"
                  placeholder="42"
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
                  <option value="Cuba">Cuba 🇨🇺</option>
                  <option value="Nicaragua">Nicaragua 🇳🇮</option>
                  <option value="Dominican Republic">Dominican Republic 🇩🇴</option>
                  <option value="Honduras">Honduras 🇭🇳</option>
                  <option value="Ecuador">Ecuador 🇪🇨</option>
                  <option value="Mexico">Mexico 🇲🇽</option>
                  <option value="Costa Rica">Costa Rica 🇨🇷</option>
                  <option value="United States">United States 🇺🇸</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Wrapper Leaf</label>
                <input
                  type="text"
                  placeholder="e.g. Cuban, Ecuadorian Habano, Maduro"
                  value={wrapper}
                  onChange={(e) => setWrapper(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Binder</label>
                <input
                  type="text"
                  placeholder="e.g. Cuba, San Andrés, Estelí"
                  value={binder}
                  onChange={(e) => setBinder(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Filler</label>
                <input
                  type="text"
                  placeholder="e.g. Vuelta Abajo, Jalapa, Condega"
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
              <span>Humidor Placement, Quantity & Pricing</span>
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
                  <option value="Full-Bodied">Full-Bodied</option>
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
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">
                  Price per Stick ({currency})
                </label>
                <div className="flex gap-1">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-[#13110F] border border-[#2C2621] rounded-md px-2 py-2 text-xs text-[#D4AF37] focus:outline-hidden focus:border-[#D4AF37]"
                  >
                    <option value="£">£ (GBP)</option>
                    <option value="$">$ (USD)</option>
                    <option value="€">€ (EUR)</option>
                  </select>
                  <input
                    type="number"
                    step="0.25"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Vendor / B&M Shop</label>
                <input
                  type="text"
                  placeholder="e.g. C.Gars Ltd, Havana House"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          {/* Flavor Notes & Collector Tags */}
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37] mb-3 flex items-center gap-1.5">
              <span>Primary Flavor Profile & Tasting Notes</span>
            </h3>
            
            <div className="space-y-3">
              {FLAVOR_CATEGORIES.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="text-[11px] text-[#A89F94] font-medium">{cat.category}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.notes.map((tag) => {
                      const isSelected = flavorTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleFlavorTag(tag)}
                          className={`text-xs px-2.5 py-1 rounded transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#D4AF37] text-[#0F0D0C] font-semibold'
                              : 'bg-[#13110F] text-[#A89F94] hover:text-[#E5E1DA] border border-[#2C2621]'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="mt-3 flex gap-2">
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
                className="flex-1 bg-[#13110F] border border-[#2C2621] rounded px-3 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 bg-[#2C2621] hover:bg-[#3D352E] text-[#E5E1DA] rounded text-xs transition cursor-pointer"
              >
                + Add Tag
              </button>
            </div>
          </div>

          {/* Personal Tasting Notes / Quote */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">
              Personal Vault Notes / Sommelier Insights
            </label>
            <textarea
              rows={3}
              placeholder="Record initial impressions, pre-light aroma, cold draw, or aging expectations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md p-3 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#2C2621]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#13110F] hover:bg-[#2C2621] text-[#A89F94] hover:text-[#E5E1DA] rounded text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] rounded text-xs uppercase tracking-widest font-bold shadow-md transition cursor-pointer"
            >
              {cigarToEdit ? 'Save Changes' : 'Add to Humidor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
