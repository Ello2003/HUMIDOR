import React, { useState } from 'react';
import {
  X,
  Plus,
  Bookmark,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  DollarSign,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { Cigar, Humidor, StrengthRating, CigarStatus, WishlistItem, CigarResearchItem, WrapperType, STRENGTH_LEVELS } from '../types';
import { FLAVOR_CATEGORIES } from '../data/initialData';
import { DEFAULT_CURRENCY } from '../utils/currencyUtils';
import { suggestVitolaDimensions, areCigarsMatching } from '../utils/researchUtils';

interface AddCigarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cigar: Omit<Cigar, 'id' | 'createdAt' | 'updatedAt'>, idToEdit?: string) => void;
  humidors: Humidor[];
  cigarToEdit?: Cigar | null;
  prefillData?: Partial<Cigar> | null;
  onAddToWishlist?: (item: Omit<WishlistItem, 'id' | 'createdAt'>) => void;
  onAddToResearch?: (cigar: CigarResearchItem) => void;
  onOpenBasketImporter?: () => void;
  researchDatabase?: CigarResearchItem[];
}

export const AddCigarModal: React.FC<AddCigarModalProps> = ({
  isOpen,
  onClose,
  onSave,
  humidors,
  cigarToEdit,
  prefillData,
  onAddToWishlist,
  onAddToResearch,
  onOpenBasketImporter,
  researchDatabase,
}) => {
  // Note: the early `isOpen` bail-out must come after every Hook call
  // (React's Rules of Hooks) -- moved to just before the JSX return below.

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
  const [wrapper, setWrapper] = useState(cigarToEdit?.wrapper || prefillData?.wrapper || 'Habano');
  const [binder, setBinder] = useState(cigarToEdit?.binder || prefillData?.binder || 'Proprietary');
  const [filler, setFiller] = useState(cigarToEdit?.filler || prefillData?.filler || 'Proprietary');
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

  // Auto-populate vitola/size/wrapper/origin/strength for a specific named
  // cigar (e.g. "Davidoff No. 2") -- checks the local Research DB first
  // (instant, free), then falls back to a real grounded web search via
  // /api/research/quick-lookup. Only fires for genuinely new entries, and
  // only fills fields still at their untouched defaults so it never
  // clobbers something already typed in.
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<string>('');
  const [lookupSourceUrl, setLookupSourceUrl] = useState<string | undefined>(undefined);
  const isUntouchedDefaults =
    vitola === 'Robusto' &&
    lengthInches === '5.0' &&
    ringGauge === '50' &&
    wrapper === 'Habano';

  const performGroundedLookup = async (): Promise<void> => {
    const searchName = name.trim() || line.trim();
    setIsLookingUp(true);
    try {
      const res = await fetch('/api/research/quick-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, name: searchName }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.grounded) {
        const d = data.data;
        if (d.vitola) setVitola(d.vitola);
        if (d.lengthInches) setLengthInches(String(d.lengthInches));
        if (d.ringGauge) setRingGauge(String(d.ringGauge));
        if (d.wrapper) setWrapper(d.wrapper);
        if (d.binder) setBinder(d.binder);
        if (d.filler) setFiller(d.filler);
        if (d.countryOrigin) setCountryOrigin(d.countryOrigin);
        if (d.strength) setStrength(d.strength as StrengthRating);
        setLookupStatus(`Auto-filled from a live search${d.sourceName ? ` (${d.sourceName})` : ''}.`);
        setLookupSourceUrl(d.sourceUrl);
      } else {
        const suggested = suggestVitolaDimensions(vitola);
        if (suggested) {
          setLengthInches(String(suggested.lengthInches));
          setRingGauge(String(suggested.ringGauge));
        }
        setLookupStatus('No live source found for this exact cigar -- please check the specs manually.');
        setLookupSourceUrl(undefined);
      }
    } catch {
      setLookupStatus('Lookup failed -- please check the specs manually.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleQuickLookup = async () => {
    if (cigarToEdit || !brand.trim() || !(name.trim() || line.trim())) return;
    if (!isUntouchedDefaults) return; // user's already customized these fields -- don't overwrite

    const searchName = name.trim() || line.trim();

    // 1. Check the local Research DB first -- free, instant, and likely
    // more curated than a fresh AI guess if this exact cigar's been
    // researched before.
    if (researchDatabase && researchDatabase.length > 0) {
      const localMatch = researchDatabase.find((r) => areCigarsMatching({ brand, line: searchName }, r));
      if (localMatch) {
        setVitola(localMatch.vitola);
        setLengthInches(String(localMatch.lengthInches));
        setRingGauge(String(localMatch.ringGauge));
        setWrapper(localMatch.wrapper);
        setBinder(localMatch.binder);
        setFiller(localMatch.filler);
        setCountryOrigin(localMatch.countryOrigin);
        setStrength(localMatch.strength);
        setLookupStatus(`Auto-filled from your Research DB (already researched this cigar).`);
        setLookupSourceUrl(undefined);
        return;
      }
    }

    // 2. Fall back to a real, grounded live search for this specific cigar.
    setLookupStatus('');
    await performGroundedLookup();
  };
  const [status, setStatus] = useState<CigarStatus>(cigarToEdit?.status || 'ready');
  const [isFavorite, setIsFavorite] = useState<boolean>(cigarToEdit?.isFavorite || false);
  const [notes, setNotes] = useState<string>(cigarToEdit?.notes || prefillData?.notes || '');
  const [flavorTags, setFlavorTags] = useState<string[]>(
    cigarToEdit?.flavorTags || prefillData?.flavorTags || ['Spanish Cedar', 'Dark Chocolate']
  );
  const [customTagInput, setCustomTagInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Auto add every import to research automatically toggle
  const [autoAddToResearch, setAutoAddToResearch] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('the_humidor_auto_add_import_to_research');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  // Collapsible sections
  const [openSections, setOpenSections] = useState({
    identity: true,
    dimensions: true,
    blend: true,
    placement: true,
    flavors: true,
    notes: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAllSections = () => {
    setOpenSections({
      identity: true,
      dimensions: true,
      blend: true,
      placement: true,
      flavors: true,
      notes: true,
    });
  };

  const collapseAllSections = () => {
    setOpenSections({
      identity: false,
      dimensions: false,
      blend: false,
      placement: false,
      flavors: false,
      notes: false,
    });
  };

  const buildResearchItem = (data: {
    brand: string;
    name: string;
    line?: string;
    vitola?: string;
    lengthInches?: number;
    ringGauge?: number;
    wrapper?: string;
    binder?: string;
    filler?: string;
    countryOrigin?: string;
    strength?: StrengthRating;
    purchasePrice?: number;
    notes?: string;
    flavorTags?: string[];
  }): CigarResearchItem => {
    const wLower = (data.wrapper || '').toLowerCase();
    let derivedWrapperType: WrapperType = 'Habano';
    if (wLower.includes('maduro')) derivedWrapperType = 'Maduro';
    else if (wLower.includes('broadleaf')) derivedWrapperType = 'Connecticut Broadleaf';
    else if (wLower.includes('connecticut') || wLower.includes('shade')) derivedWrapperType = 'Connecticut Shade';
    else if (wLower.includes('san andrés') || wLower.includes('san andres')) derivedWrapperType = 'San Andrés';
    else if (wLower.includes('oscuro')) derivedWrapperType = 'Oscuro';
    else if (wLower.includes('corojo')) derivedWrapperType = 'Corojo';
    else if (wLower.includes('sumatra')) derivedWrapperType = 'Sumatra';
    else if (wLower.includes('cameroon')) derivedWrapperType = 'Cameroon';
    else if (wLower.includes('candela')) derivedWrapperType = 'Candela';
    else if (wLower.includes('criollo')) derivedWrapperType = 'Criollo';
    else derivedWrapperType = 'Other';

    const b = data.brand.trim() || 'Montecristo';
    const n = data.name.trim() || 'No. 2';
    const v = data.vitola?.trim() || 'Robusto';
    const price = data.purchasePrice || 25;
    const origin = data.countryOrigin?.trim() || 'Cuba';

    return {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      brand: b,
      line: data.line?.trim() || n,
      vitola: v,
      lengthInches: data.lengthInches || 5.0,
      ringGauge: data.ringGauge || 50,
      countryOrigin: origin,
      wrapperType: derivedWrapperType,
      wrapper: data.wrapper?.trim() || 'Habano',
      binder: data.binder?.trim() || 'Selected',
      filler: data.filler?.trim() || 'Selected',
      strength: data.strength || 'Medium-Full',
      body: 'Medium-Full',
      averagePrice: price,
      priceRange: `£${(price * 0.9).toFixed(0)} - £${(price * 1.2).toFixed(0)}`,
      criticRating: 92,
      criticConsensus: data.notes?.trim() || `${b} ${n} connoisseur entry.`,
      reviewTastingNotes: {
        overview: data.notes?.trim() || `${b} ${n} — ${v} vitola with ${data.wrapper || 'Habano'} wrapper.`,
        firstThird: 'Smooth initial draw with cedar and delicate spice.',
        secondThird: 'Rich cocoa, coffee bean, and toasted nuts.',
        finalThird: 'Deep oak, leather, and lingering warm pepper.',
        dominantFlavorTags: data.flavorTags && data.flavorTags.length > 0 ? data.flavorTags : ['Cedar', 'Leather', 'Spices'],
      },
      recommendedPairings: ['Single Malt Scotch', 'Espresso'],
      agingWindowMonths: 6,
      isCuban: origin.toLowerCase().includes('cuba'),
    };
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

  const handleSaveToWishlist = () => {
    if (!brand.trim() || !name.trim()) {
      setFormError('Please provide at least a brand and cigar name before adding to Wishlist.');
      return;
    }
    if (onAddToWishlist) {
      onAddToWishlist({
        brand: brand.trim(),
        name: `${name.trim()} (${vitola.trim() || 'Robusto'})`,
        vitola: vitola.trim() || 'Robusto',
        priority: 'Medium',
        targetPrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        sourceRetailer: vendor.trim() || undefined,
        notes: notes.trim() || `Wrapper: ${wrapper}, Origin: ${countryOrigin}, Strength: ${strength}`,
      });
      setActionSuccessNotice(`Added "${brand} ${name}" to Wishlist!`);
      setTimeout(() => setActionSuccessNotice(null), 4000);
    }
  };

  const handleSaveToResearch = () => {
    if (!brand.trim() || !name.trim()) {
      setFormError('Please provide at least a brand and cigar name before adding to Research.');
      return;
    }
    if (onAddToResearch) {
      const resItem = buildResearchItem({
        brand,
        name,
        line,
        vitola,
        lengthInches: lengthInches ? parseFloat(lengthInches) : undefined,
        ringGauge: ringGauge ? parseInt(ringGauge, 10) : undefined,
        wrapper,
        binder,
        filler,
        countryOrigin,
        strength,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        notes,
        flavorTags,
      });

      onAddToResearch(resItem);
      setActionSuccessNotice(`Saved "${brand} ${name}" to Research Catalog!`);
      setTimeout(() => setActionSuccessNotice(null), 4000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!brand.trim() || !name.trim()) {
      setFormError('Please provide both a brand and cigar name.');
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

    // If auto add to research is enabled and not editing, save to research database too
    if (autoAddToResearch && onAddToResearch && !cigarToEdit) {
      const resItem = buildResearchItem({
        brand,
        name,
        line,
        vitola,
        lengthInches: lengthInches ? parseFloat(lengthInches) : undefined,
        ringGauge: ringGauge ? parseInt(ringGauge, 10) : undefined,
        wrapper,
        binder,
        filler,
        countryOrigin,
        strength,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        notes,
        flavorTags,
      });
      onAddToResearch(resItem);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-card border border-line rounded-lg shadow-2xl overflow-hidden text-text">
        {/* Header */}
        <div className="px-6 py-4 bg-surface border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gold text-lg">🍂</span>
            <h2 className="text-base font-serif font-semibold text-text">
              {cigarToEdit ? 'Edit Humidor Stick' : 'Add Single Stick (Manual Entry)'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openSections.identity && openSections.dimensions ? collapseAllSections : expandAllSections}
              className="text-[11px] px-2 py-1 bg-card-hover hover:bg-line text-text-muted hover:text-text rounded border border-line transition cursor-pointer flex items-center gap-1"
              title="Expand or Condense all form sections"
            >
              <Layers className="w-3 h-3 text-gold" />
              <span>{openSections.identity && openSections.dimensions ? 'Condense All' : 'Expand All'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text p-1.5 rounded hover:bg-card-hover transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Batch Importer Quick Banner */}
        {onOpenBasketImporter && !cigarToEdit && (
          <div className="px-6 py-2.5 bg-[#171412] border-b border-line flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-text-muted text-[11px]">
              Want to import multiple cigars or extract directly from a URL, HTML file, or cart?
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBasketImporter();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-card-hover hover:bg-line text-gold border border-gold/30 rounded text-xs font-semibold transition cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Open Basket Batch Importer →</span>
            </button>
          </div>
        )}

        {/* Form Error or Success Notice */}
        {formError && (
          <div className="mx-6 mt-4 p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded">
            {formError}
          </div>
        )}

        {actionSuccessNotice && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs rounded">
            {actionSuccessNotice}
          </div>
        )}

        {/* Manual Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Stick Identity */}
          <div className="border border-line rounded-lg overflow-hidden bg-header">
            <div
              onClick={() => toggleSection('identity')}
              className="px-4 py-2.5 bg-section-header flex items-center justify-between cursor-pointer border-b border-line select-none"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-gold">
                1. Stick Identity & Brand
              </span>
              {openSections.identity ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
            </div>

            {openSections.identity && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Montecristo, Partagás, Padrón"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    onBlur={handleQuickLookup}
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                    Cigar Name / Line *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. No. 2, Serie D No. 4, 1964 Anniversary"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!line) setLine(e.target.value);
                    }}
                    onBlur={handleQuickLookup}
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                  />
                </div>

                {(isLookingUp || lookupStatus) && !cigarToEdit && (
                  <div className="sm:col-span-2 -mt-1">
                    <div className="flex items-center gap-2 text-[10px] text-text-muted bg-surface border border-line rounded px-2.5 py-1.5">
                      {isLookingUp ? (
                        <>
                          <Sparkles className="w-3 h-3 text-gold animate-pulse" />
                          <span>Searching for "{brand} {name || line}" specs...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-gold" />
                          <span>{lookupStatus}</span>
                          {lookupSourceUrl && (
                            <a
                              href={lookupSourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gold hover:underline ml-auto"
                            >
                              View source
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setLookupStatus('');
                              performGroundedLookup();
                            }}
                            className={lookupSourceUrl ? '' : 'ml-auto text-gold hover:underline cursor-pointer'}
                          >
                            {!lookupSourceUrl && 'Retry lookup'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Vitola & Dimensions */}
          <div className="border border-line rounded-lg overflow-hidden bg-header">
            <div
              onClick={() => toggleSection('dimensions')}
              className="px-4 py-2.5 bg-section-header flex items-center justify-between cursor-pointer border-b border-line select-none"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-gold">
                2. Vitola & Dimensions
              </span>
              {openSections.dimensions ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
            </div>

            {openSections.dimensions && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                    Vitola Shape
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Robusto, Pirámides, Churchill"
                    value={vitola}
                    onChange={(e) => setVitola(e.target.value)}
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                    Length (inches)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="5.0"
                    value={lengthInches}
                    onChange={(e) => setLengthInches(e.target.value)}
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                    Ring Gauge (RG)
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    value={ringGauge}
                    onChange={(e) => setRingGauge(e.target.value)}
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Blend & Origin */}
          <div className="border border-line rounded-lg overflow-hidden bg-header">
            <div
              onClick={() => toggleSection('blend')}
              className="px-4 py-2.5 bg-section-header flex items-center justify-between cursor-pointer border-b border-line select-none"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-gold">
                3. Blend & Terroir
              </span>
              {openSections.blend ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
            </div>

            {openSections.blend && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cuba, Nicaragua, Dominican Republic"
                    value={countryOrigin}
                    onChange={(e) => setCountryOrigin(e.target.value)}
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                    Wrapper Leaf
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cuban Habano, Ecuadorian Shade, Maduro"
                    value={wrapper}
                    onChange={(e) => setWrapper(e.target.value)}
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                    Strength Profile
                  </label>
                  <select
                    value={strength}
                    onChange={(e) => setStrength(e.target.value as StrengthRating)}
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                  >
                    {STRENGTH_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Humidor Placement & Pricing */}
          <div className="border border-line rounded-lg overflow-hidden bg-header">
            <div
              onClick={() => toggleSection('placement')}
              className="px-4 py-2.5 bg-section-header flex items-center justify-between cursor-pointer border-b border-line select-none"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-gold">
                4. Humidor Placement, Pricing & Aging
              </span>
              {openSections.placement ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
            </div>

            {openSections.placement && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                      Target Humidor *
                    </label>
                    <select
                      value={humidorId}
                      onChange={(e) => setHumidorId(e.target.value)}
                      className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                    >
                      {humidors.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                      Quantity (Sticks) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                      Target Rest (Months)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={targetRestMonths}
                      onChange={(e) => setTargetRestMonths(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as CigarStatus)}
                      className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                    >
                      <option value="ready">Ready to Smoke 💨</option>
                      <option value="resting">Resting in Humidor ⏳</option>
                      <option value="aging">Long-term Aging 🪵</option>
                      <option value="special_occasion">Special Occasion Reserve 🌟</option>
                      <option value="archived">Archived / Emptied</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                      <span>Personal Rating</span>
                      <span className="text-gold normal-case tracking-normal">
                        {personalRating ? `${personalRating}/100` : 'Not rated'}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={personalRating || '0'}
                      onChange={(e) => setPersonalRating(e.target.value)}
                      className="w-full accent-gold mt-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                      Purchase Price per Stick ({currency})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="24.50"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                      Shop / Retailer
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. C.Gars Ltd, Havana House, Smoke King"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Flavor Tags & Notes */}
          <div className="border border-line rounded-lg overflow-hidden bg-header">
            <div
              onClick={() => toggleSection('flavors')}
              className="px-4 py-2.5 bg-section-header flex items-center justify-between cursor-pointer border-b border-line select-none"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-gold">
                5. Flavor Profile & Notes
              </span>
              {openSections.flavors ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
            </div>

            {openSections.flavors && (
              <div className="p-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {FLAVOR_CATEGORIES.flatMap((c) => c.notes).slice(0, 16).map((tag) => {
                    const isSelected = flavorTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleFlavorTag(tag)}
                        className={`px-2 py-1 rounded text-xs transition cursor-pointer ${
                          isSelected
                            ? 'bg-gold text-ink font-semibold'
                            : 'bg-surface text-text-muted hover:text-text border border-line'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                    Personal Notes / Aging Goals
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Gifted from friends; rest for 12 months before lighting."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-surface border border-line rounded px-3 py-2 text-xs text-text focus:border-gold focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {onAddToWishlist && (
                <button
                  type="button"
                  onClick={handleSaveToWishlist}
                  className="px-3 py-2 bg-surface hover:bg-card-hover text-text-muted hover:text-gold border border-line text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1.5"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save to Wishlist</span>
                </button>
              )}
              {onAddToResearch && (
                <button
                  type="button"
                  onClick={handleSaveToResearch}
                  className="px-3 py-2 bg-surface hover:bg-card-hover text-text-muted hover:text-gold border border-line text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Save to Research</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-surface hover:bg-card-hover text-text-muted hover:text-text rounded text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:brightness-110 text-ink font-bold text-xs uppercase tracking-wider rounded shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{cigarToEdit ? 'Save Changes' : 'Stock Cigar to Humidor'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
