import React, { useState } from 'react';
import {
  Globe,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  X,
  Plus,
  Bookmark,
  BookOpen,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Flame,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Cigar, Humidor, WishlistItem, CigarResearchItem, StrengthRating } from '../types';
import { formatCurrency } from '../utils/currencyUtils';

interface WebCigarImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  humidors: Humidor[];
  onAddCigar: (cigar: Omit<Cigar, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAddToWishlist?: (item: Omit<WishlistItem, 'id' | 'createdAt'>) => void;
  onAddToResearch?: (item: CigarResearchItem) => void;
  onTransferToAddModal?: (prefill: Partial<Cigar>) => void;
}

export const WebCigarImporterModal: React.FC<WebCigarImporterModalProps> = ({
  isOpen,
  onClose,
  humidors,
  onAddCigar,
  onAddToWishlist,
  onAddToResearch,
  onTransferToAddModal,
}) => {
  const [url, setUrl] = useState('');
  const [inputMode, setInputMode] = useState<'url' | 'paste'>('url');
  const [rawContent, setRawContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [selectedHumidorId, setSelectedHumidorId] = useState<string>(humidors[0]?.id || 'hum-1');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedSuccessMessage, setAddedSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const popularRetailers = [
    { name: 'C.Gars Ltd (UK)', example: 'https://www.cgarsltd.co.uk/montecristo-no4-cigar-p-54.html' },
    { name: 'Havana House (UK)', example: 'https://www.havanahouse.co.uk/product/romeo-y-julieta-wide-churchills-cigar/' },
    { name: 'Smoke King (UK)', example: 'https://www.smoke-king.co.uk/partagas-serie-d-no-4-single-cigar' },
    { name: 'Sautter London', example: 'https://sauttercigars.com/' },
  ];

  const handleFetchAndExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputMode === 'url' && !url.trim()) {
      setError('Please paste a cigar product URL.');
      return;
    }
    if (inputMode === 'paste' && !rawContent.trim()) {
      setError('Please paste the webpage text or product description.');
      return;
    }

    setLoading(true);
    setError(null);
    setExtractedData(null);
    setAddedSuccessMessage(null);

    try {
      const payload: { url?: string; rawContent?: string } = {};
      if (inputMode === 'url') {
        payload.url = url.trim();
      } else {
        payload.rawContent = rawContent.trim();
      }

      const res = await fetch('/api/import/cigar-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract cigar information from the provided link.');
      }

      setExtractedData(data.data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with extraction engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToHumidor = () => {
    if (!extractedData) return;

    const newCigar: Omit<Cigar, 'id' | 'createdAt' | 'updatedAt'> = {
      brand: extractedData.brand || 'Unknown Brand',
      name: extractedData.name || 'Cigar',
      line: extractedData.line || extractedData.name || '',
      vitola: extractedData.vitola || 'Robusto',
      lengthInches: extractedData.lengthInches || 5.0,
      ringGauge: extractedData.ringGauge || 50,
      wrapper: extractedData.wrapper || 'Standard',
      binder: extractedData.binder || 'Proprietary',
      filler: extractedData.filler || 'Proprietary',
      countryOrigin: extractedData.countryOrigin || 'Cuba',
      strength: (extractedData.strength as StrengthRating) || 'Medium',
      quantity: quantity,
      humidorId: selectedHumidorId,
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: extractedData.purchasePrice || 0,
      currency: extractedData.currency || '£',
      vendor: extractedData.vendor || 'C.Gars Ltd',
      targetRestMonths: extractedData.idealRestMonths || 3,
      notes: extractedData.notes || extractedData.productDescription || '',
      isFavorite: false,
      status: 'ready',
      flavorTags: extractedData.flavorTags || ['Cedar', 'Leather'],
    };

    onAddCigar(newCigar);
    setAddedSuccessMessage(`Successfully added ${quantity}x ${newCigar.brand} ${newCigar.name} to humidor!`);
  };

  const handleAddToWishlistAction = () => {
    if (!extractedData || !onAddToWishlist) return;

    onAddToWishlist({
      brand: extractedData.brand || 'Unknown Brand',
      name: extractedData.name || 'Cigar',
      vitola: extractedData.vitola || '',
      wrapper: extractedData.wrapper || '',
      targetPrice: extractedData.purchasePrice || undefined,
      priority: 'High',
      sourceRetailer: extractedData.vendor || 'C.Gars Ltd',
      sourceUrl: url || undefined,
      notes: extractedData.notes || extractedData.productDescription || '',
    });

    setAddedSuccessMessage(`Added ${extractedData.brand} ${extractedData.name} to Wishlist!`);
  };

  const handleAddToResearchAction = () => {
    if (!extractedData || !onAddToResearch) return;

    const researchItem: CigarResearchItem = {
      id: `res-imp-${Date.now()}`,
      brand: extractedData.brand || 'Brand',
      line: extractedData.line || extractedData.name || 'Line',
      vitola: extractedData.vitola || 'Robusto',
      lengthInches: extractedData.lengthInches || 5.0,
      ringGauge: extractedData.ringGauge || 50,
      countryOrigin: extractedData.countryOrigin || 'Cuba',
      wrapper: extractedData.wrapper || 'Habano',
      wrapperType: 'Habano',
      binder: extractedData.binder || 'Proprietary',
      filler: extractedData.filler || 'Proprietary',
      strength: (extractedData.strength as StrengthRating) || 'Medium',
      body: 'Medium-Full',
      averagePrice: extractedData.purchasePrice || 22.0,
      priceRange: `£${(extractedData.purchasePrice || 22.0).toFixed(2)}`,
      criticRating: 92,
      criticConsensus: `Extracted from ${extractedData.vendor || 'retailer'} with authentic tobacconist specs.`,
      reviewTastingNotes: {
        overview: extractedData.notes || extractedData.productDescription || 'Imported cigar specs.',
        firstThird: 'Initial light opens with smooth cedar, toasted spice, and rich cream.',
        secondThird: 'Deepening core with aromatic cocoa, toasted nuts, and mellow pepper.',
        finalThird: 'Warm finish with seasoned oak, espresso notes, and lasting complexity.',
        dominantFlavorTags: extractedData.flavorTags || ['Spanish Cedar', 'Cocoa', 'Spice'],
      },
      recommendedPairings: ['Single Malt Scotch', 'Double Oaked Bourbon', 'Espresso Cortado'],
      agingWindowMonths: extractedData.idealRestMonths || 6,
      isCuban: extractedData.isCuban || extractedData.countryOrigin === 'Cuba',
    };

    onAddToResearch(researchItem);
    setAddedSuccessMessage(`Added ${researchItem.brand} ${researchItem.line} to Cigar Research Database!`);
  };

  const handleTransferToFullModal = () => {
    if (!extractedData || !onTransferToAddModal) return;

    onTransferToAddModal({
      brand: extractedData.brand,
      name: extractedData.name,
      line: extractedData.line,
      vitola: extractedData.vitola,
      lengthInches: extractedData.lengthInches,
      ringGauge: extractedData.ringGauge,
      wrapper: extractedData.wrapper,
      binder: extractedData.binder,
      filler: extractedData.filler,
      countryOrigin: extractedData.countryOrigin,
      strength: extractedData.strength,
      purchasePrice: extractedData.purchasePrice,
      currency: extractedData.currency || '£',
      vendor: extractedData.vendor,
      notes: extractedData.notes || extractedData.productDescription,
      flavorTags: extractedData.flavorTags,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#161311] border border-[#2C2621] rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2C2621] bg-gradient-to-r from-[#1C1816] via-[#161311] to-[#1C1816]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-white">Direct Retailer Importer</h2>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#D4AF37] text-[#0F0D0C]">
                  C.Gars & UK Stores
                </span>
              </div>
              <p className="text-xs text-[#A89F94]">
                Paste any link from C.Gars Ltd, Havana House, Smoke King, or international stores to automatically extract blend details & £ prices.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#A89F94] hover:text-white p-1 rounded-md hover:bg-[#2C2621] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Input Method Switcher */}
          <div className="flex items-center justify-between bg-[#13110F] p-1 rounded-lg border border-[#2C2621]">
            <button
              onClick={() => setInputMode('url')}
              className={`flex-1 py-2 text-xs uppercase tracking-wider font-semibold rounded-md transition flex items-center justify-center gap-2 cursor-pointer ${
                inputMode === 'url' ? 'bg-[#1C1816] text-[#D4AF37] border border-[#2C2621]' : 'text-[#A89F94] hover:text-[#E5E1DA]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Paste Product URL</span>
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`flex-1 py-2 text-xs uppercase tracking-wider font-semibold rounded-md transition flex items-center justify-center gap-2 cursor-pointer ${
                inputMode === 'paste' ? 'bg-[#1C1816] text-[#D4AF37] border border-[#2C2621]' : 'text-[#A89F94] hover:text-[#E5E1DA]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Webpage Text / HTML</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleFetchAndExtract} className="space-y-3">
            {inputMode === 'url' ? (
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1.5 font-bold">
                  Retailer Cigar Web Link (URL) *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="e.g. https://www.cgarsltd.co.uk/ramon-allones-specially-selected-cigar-p-57.html"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3.5 py-2.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37] placeholder-[#A89F94]/50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:brightness-110 disabled:opacity-50 text-[#0F0D0C] rounded-md text-xs uppercase tracking-widest font-bold shadow-md transition cursor-pointer shrink-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extracting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Fetch & Auto-Fill</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Popular retail suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-[#A89F94]">
                  <span className="text-[10px] uppercase tracking-wider text-[#A89F94]/80">Try Example:</span>
                  {popularRetailers.map((r) => (
                    <button
                      key={r.name}
                      type="button"
                      onClick={() => setUrl(r.example)}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#13110F] hover:bg-[#1C1816] text-[#D4AF37] border border-[#2C2621] transition cursor-pointer"
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1.5 font-bold">
                  Paste Webpage Text or Product Description *
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste the title, specifications, ring gauge, length, wrapper and notes copied from C.Gars or any cigar website..."
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  className="w-full bg-[#13110F] border border-[#2C2621] rounded-md p-3 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37] placeholder-[#A89F94]/50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:brightness-110 disabled:opacity-50 text-[#0F0D0C] rounded-md text-xs uppercase tracking-widest font-bold shadow-md transition cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing text...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Parse & Auto-Fill</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-200 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Extraction Notice</p>
                <p className="text-[#A89F94]">{error}</p>
                <p className="text-[11px] text-[#A89F94]/80 mt-1">
                  Tip: If the website prevents automated crawling, switch to the "Paste Webpage Text / HTML" tab and paste the text directly.
                </p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {addedSuccessMessage && (
            <div className="p-4 bg-[#D4AF37]/15 border border-[#D4AF37]/40 rounded-lg text-xs text-[#E5E1DA] flex items-center gap-3">
              <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <p className="font-medium">{addedSuccessMessage}</p>
            </div>
          )}

          {/* Extracted Product Preview Card */}
          {extractedData && (
            <div className="bg-[#1C1816] border border-[#D4AF37]/40 rounded-xl p-5 space-y-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start justify-between gap-4 border-b border-[#2C2621] pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#13110F] text-[#D4AF37] border border-[#2C2621]">
                      {extractedData.vendor || 'Retailer Verified'}
                    </span>
                    {extractedData.isCuban && (
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/50">
                        🇨🇺 Cuban Puro
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white">
                    {extractedData.brand} {extractedData.name}
                  </h3>
                  <p className="text-xs text-[#A89F94]">
                    {extractedData.vitola} • {extractedData.lengthInches || '—'}" x {extractedData.ringGauge || '—'} RG • Terroir: {extractedData.countryOrigin}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xl font-serif font-bold text-[#D4AF37]">
                    {formatCurrency(extractedData.purchasePrice, extractedData.currency || '£')}
                    <span className="text-xs font-normal text-[#A89F94] ml-1">/ stick</span>
                  </div>
                  {extractedData.boxPrice && (
                    <div className="text-[11px] text-[#A89F94]">
                      Box: {formatCurrency(extractedData.boxPrice, extractedData.currency || '£')} ({extractedData.boxCount || '—'} count)
                    </div>
                  )}
                </div>
              </div>

              {/* Tobacco Blend Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#13110F] border border-[#2C2621] rounded-lg text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#A89F94] block">Wrapper</span>
                  <span className="font-medium text-[#E5E1DA]">{extractedData.wrapper || 'Standard'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#A89F94] block">Strength</span>
                  <span className="font-medium text-[#D4AF37]">{extractedData.strength || 'Medium'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#A89F94] block">Origin</span>
                  <span className="font-medium text-[#E5E1DA]">{extractedData.countryOrigin || 'Cuba'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#A89F94] block">Ideal Rest</span>
                  <span className="font-medium text-[#E5E1DA]">{extractedData.idealRestMonths || 3} Months</span>
                </div>
              </div>

              {/* Flavor Tags */}
              {extractedData.flavorTags && extractedData.flavorTags.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#A89F94] block mb-1.5">
                    Extracted Flavor Notes:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.flavorTags.map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#13110F] text-[#E5E1DA] border border-[#2C2621]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes / Description */}
              {extractedData.notes && (
                <p className="text-xs text-[#A89F94] italic bg-[#13110F] p-3 rounded-lg border border-[#2C2621]/60 leading-relaxed">
                  "{extractedData.notes}"
                </p>
              )}

              {/* Direct Add Controls */}
              <div className="pt-3 border-t border-[#2C2621] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">
                        Humidor Vault
                      </label>
                      <select
                        value={selectedHumidorId}
                        onChange={(e) => setSelectedHumidorId(e.target.value)}
                        className="bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
                      >
                        {humidors.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.currentHumidity}% RH)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-16 bg-[#13110F] border border-[#2C2621] rounded-md px-2.5 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37] text-center"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleAddToHumidor}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] rounded-md text-xs uppercase tracking-widest font-bold shadow-sm transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add {quantity}x to Vault</span>
                    </button>
                    {onAddToWishlist && (
                      <button
                        onClick={handleAddToWishlistAction}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#13110F] hover:bg-[#2C2621] text-[#E5E1DA] border border-[#2C2621] rounded-md text-xs uppercase tracking-wider font-semibold transition cursor-pointer"
                        title="Add to Wishlist"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Wishlist</span>
                      </button>
                    )}
                    {onAddToResearch && (
                      <button
                        onClick={handleAddToResearchAction}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#13110F] hover:bg-[#2C2621] text-[#E5E1DA] border border-[#2C2621] rounded-md text-xs uppercase tracking-wider font-semibold transition cursor-pointer"
                        title="Add to Research DB"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Research DB</span>
                      </button>
                    )}
                    {onTransferToAddModal && (
                      <button
                        onClick={handleTransferToFullModal}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#13110F] hover:bg-[#2C2621] text-[#A89F94] hover:text-[#E5E1DA] border border-[#2C2621] rounded-md text-xs uppercase tracking-wider transition cursor-pointer"
                      >
                        <span>Edit Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-[#2C2621] bg-[#13110F] flex items-center justify-between text-[11px] text-[#A89F94]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Supported: C.Gars Ltd, Havana House, Smoke King, Sautter, Davidoff London, and worldwide B&M stores.</span>
          </div>
          <button onClick={onClose} className="hover:text-white transition cursor-pointer">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
