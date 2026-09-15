import React, { useState } from 'react';
import {
  X,
  DollarSign,
  Plus,
  Trash2,
  ExternalLink,
  Store,
  Check,
  RefreshCw,
  Globe,
  Sparkles,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { VendorPriceEntry } from '../types';
import { formatCurrency, DEFAULT_CURRENCY } from '../utils/currencyUtils';

interface GlobalPriceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cigarBrand: string;
  cigarName: string;
  vitola?: string;
  initialPrices?: VendorPriceEntry[];
  currentPrice?: number;
  currentVendor?: string;
  currentCurrency?: string;
  onSavePrices: (prices: VendorPriceEntry[], syncSiteWide: boolean) => void;
}

export const GlobalPriceEditorModal: React.FC<GlobalPriceEditorModalProps> = ({
  isOpen,
  onClose,
  cigarBrand,
  cigarName,
  vitola,
  initialPrices = [],
  currentPrice,
  currentVendor,
  currentCurrency = '£',
  onSavePrices,
}) => {
  if (!isOpen) return null;

  // Populate working prices
  const [prices, setPrices] = useState<VendorPriceEntry[]>(() => {
    if (initialPrices && initialPrices.length > 0) {
      return [...initialPrices];
    }
    if (currentPrice && currentPrice > 0) {
      return [
        {
          id: `vp-${Date.now()}-0`,
          vendor: currentVendor || 'Online Retailer',
          price: currentPrice,
          currency: currentCurrency || '£',
          packageType: 'Single',
          recordedAt: new Date().toISOString(),
          inStock: true,
        },
      ];
    }
    return [
      {
        id: `vp-${Date.now()}-0`,
        vendor: 'C.Gars Ltd (UK)',
        price: 24.5,
        currency: '£',
        packageType: 'Single',
        recordedAt: new Date().toISOString(),
        inStock: true,
      },
    ];
  });

  const [syncSiteWide, setSyncSiteWide] = useState<boolean>(true);
  const [newVendor, setNewVendor] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCurrency, setNewCurrency] = useState(currentCurrency || '£');
  const [newPackageType, setNewPackageType] = useState('Single');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.trim()) {
      setError('Please provide a retailer/vendor name.');
      return;
    }
    const numPrice = parseFloat(newPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please provide a valid price greater than 0.');
      return;
    }

    const newEntry: VendorPriceEntry = {
      id: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      vendor: newVendor.trim(),
      price: Math.round(numPrice * 100) / 100,
      currency: newCurrency,
      packageType: newPackageType || 'Single',
      url: newUrl.trim() || undefined,
      notes: newNotes.trim() || undefined,
      recordedAt: new Date().toISOString(),
      inStock: true,
    };

    setPrices((prev) => [...prev, newEntry]);
    setNewVendor('');
    setNewPrice('');
    setNewUrl('');
    setNewNotes('');
    setError(null);
  };

  const handleRemovePrice = (id?: string, index?: number) => {
    setPrices((prev) => prev.filter((p, idx) => (id ? p.id !== id : idx !== index)));
  };

  const handleUpdatePriceField = (index: number, field: keyof VendorPriceEntry, val: any) => {
    setPrices((prev) =>
      prev.map((p, idx) => {
        if (idx === index) {
          return { ...p, [field]: val };
        }
        return p;
      })
    );
  };

  const [quickQuoteTags, setQuickQuoteTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cigar_quick_quote_retailers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      'C.Gars Ltd',
      'Havana House',
      'Smoke King',
      'Sautter London',
      'Neptune',
      'Fox Cigar',
      'Davidoff London',
      "Holt's",
    ];
  });
  const [showAddTagInput, setShowAddTagInput] = useState(false);
  const [newCustomTagName, setNewCustomTagName] = useState('');

  const handleAddNewQuickTag = () => {
    if (!newCustomTagName.trim()) return;
    const trimmed = newCustomTagName.trim();
    if (!quickQuoteTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...quickQuoteTags, trimmed];
      setQuickQuoteTags(updated);
      try {
        localStorage.setItem('cigar_quick_quote_retailers', JSON.stringify(updated));
      } catch {}
    }
    setNewVendor(trimmed);
    setNewCustomTagName('');
    setShowAddTagInput(false);
  };

  const handleDeleteQuickTag = (tagToDelete: string) => {
    const updated = quickQuoteTags.filter((t) => t !== tagToDelete);
    setQuickQuoteTags(updated);
    try {
      localStorage.setItem('cigar_quick_quote_retailers', JSON.stringify(updated));
    } catch {}
  };

  const handleQuickAddKnownRetailer = (name: string, defaultPriceOffset = 0) => {
    const base = prices[0]?.price || 24.5;
    const calcPrice = Math.max(5, Math.round((base + defaultPriceOffset) * 100) / 100);
    setNewVendor(name);
    setNewPrice(String(calcPrice));
  };

  const handleSave = () => {
    if (prices.length === 0) {
      setError('Please enter at least one vendor price entry.');
      return;
    }
    onSavePrices(prices, syncSiteWide);
    onClose();
  };

  // Calculate statistics
  const validPrices = prices.map((p) => p.price).filter((p) => p && !isNaN(p) && p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;
  const avgPrice =
    validPrices.length > 0 ? Math.round((validPrices.reduce((a, b) => a + b, 0) / validPrices.length) * 100) / 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-modal border border-line rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gold">{cigarBrand}</span>
                {vitola && <span className="text-[10px] text-text-muted">({vitola})</span>}
              </div>
              <h2 className="text-ink sm:text-lg font-serif font-bold text-white leading-tight">
                Retailer Price Comparison
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-white hover:bg-line rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Price Overview Banner */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-surface border border-line rounded-xl text-center">
            <div>
              <span className="block text-[10px] uppercase font-bold text-text-muted tracking-wider">Best Price</span>
              <span className="text-sm sm:text-ink font-serif font-bold text-emerald-400">
                {minPrice > 0 ? formatCurrency(minPrice, prices[0]?.currency || '£') : '—'}
              </span>
            </div>
            <div className="border-x border-line">
              <span className="block text-[10px] uppercase font-bold text-text-muted tracking-wider">Market Avg</span>
              <span className="text-sm sm:text-ink font-serif font-bold text-gold">
                {avgPrice > 0 ? formatCurrency(avgPrice, prices[0]?.currency || '£') : '—'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-text-muted tracking-wider">High Retail</span>
              <span className="text-sm sm:text-ink font-serif font-bold text-text">
                {maxPrice > 0 ? formatCurrency(maxPrice, prices[0]?.currency || '£') : '—'}
              </span>
            </div>
          </div>

          {/* Current Tracked Retailer Prices */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider font-bold text-gold">
                Tracked Retailers ({prices.length})
              </label>
              <span className="text-[11px] text-text-muted">Editable inline</span>
            </div>

            <div className="space-y-2">
              {prices.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="p-3 bg-card border border-line rounded-lg flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex-1 min-w-[140px]">
                    <input
                      type="text"
                      value={p.vendor}
                      onChange={(e) => handleUpdatePriceField(idx, 'vendor', e.target.value)}
                      placeholder="Retailer Name"
                      className="w-full bg-surface border border-line rounded px-2 py-1 text-xs text-text font-semibold focus:outline-hidden focus:border-gold"
                    />
                  </div>

                  <div className="w-24">
                    <select
                      value={p.packageType || 'Single'}
                      onChange={(e) => handleUpdatePriceField(idx, 'packageType', e.target.value)}
                      className="w-full bg-surface border border-line rounded px-2 py-1 text-[11px] text-text-muted focus:outline-hidden focus:border-gold"
                    >
                      <option value="Single">Single</option>
                      <option value="Pack of 3">3-Pack</option>
                      <option value="Pack of 5">5-Pack</option>
                      <option value="Box of 10">Box of 10</option>
                      <option value="Box of 20">Box of 20</option>
                      <option value="Box of 25">Box of 25</option>
                    </select>
                  </div>

                  <div className="w-24 flex items-center gap-1">
                    <span className="text-xs text-gold font-bold">{p.currency || '£'}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={p.price}
                      onChange={(e) => handleUpdatePriceField(idx, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full bg-surface border border-line rounded px-2 py-1 text-xs text-white font-bold focus:outline-hidden focus:border-gold"
                    />
                  </div>

                  <div className="flex-1 min-w-[140px]">
                    <input
                      type="url"
                      value={p.url || ''}
                      onChange={(e) => handleUpdatePriceField(idx, 'url', e.target.value)}
                      placeholder="https://shop-link.com/cigar"
                      className="w-full bg-surface border border-line rounded px-2 py-1 text-[11px] text-text-muted focus:outline-hidden focus:border-gold"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-surface hover:bg-card-hover text-gold border border-line rounded cursor-pointer"
                        title="Open retailer product page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePrice(p.id, idx)}
                      className="p-1.5 bg-surface hover:bg-danger-bg text-text-muted hover:text-red-400 border border-line rounded cursor-pointer transition"
                      title="Remove retailer price"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Retailer Price Form */}
          <form onSubmit={handleAddPrice} className="p-4 bg-card border border-line rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-text flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-gold" />
                <span>Shop</span>
              </h4>

              {/* Quick suggestions with editable tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-text-muted font-medium flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5 text-gold" /> Quick Shops:
                </span>
                {quickQuoteTags.map((name) => (
                  <div
                    key={name}
                    className="group inline-flex items-center gap-1 text-[10px] pl-2 pr-1 py-0.5 bg-surface hover:bg-card-hover text-gold border border-line hover:border-gold/40 rounded transition"
                  >
                    <button
                      type="button"
                      onClick={() => handleQuickAddKnownRetailer(name)}
                      className="cursor-pointer font-medium hover:underline"
                      title={`Fill ${name} as retailer`}
                    >
                      {name}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuickTag(name);
                      }}
                      className="opacity-40 group-hover:opacity-100 hover:text-red-400 p-0.5 cursor-pointer"
                      title={`Remove ${name} from quick tags`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}

                {showAddTagInput ? (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Shop name..."
                      value={newCustomTagName}
                      onChange={(e) => setNewCustomTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewQuickTag();
                        } else if (e.key === 'Escape') {
                          setShowAddTagInput(false);
                        }
                      }}
                      autoFocus
                      className="text-[10px] px-1.5 py-0.5 bg-surface border border-gold rounded text-text w-24 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewQuickTag}
                      className="text-[10px] px-1.5 py-0.5 bg-gold text-ink font-bold rounded cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddTagInput(false)}
                      className="text-[10px] text-text-muted hover:text-white px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddTagInput(true)}
                    className="text-[10px] px-1.5 py-0.5 bg-surface hover:bg-card-hover text-text-muted hover:text-gold border border-dashed border-line hover:border-gold/40 rounded cursor-pointer flex items-center gap-0.5"
                    title="Add a new shop shortcut tag"
                  >
                    <Plus className="w-2.5 h-2.5" /> Tag
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-danger-bg border border-red-800/60 rounded text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Retailer / Shop *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sautter Cigars London, Fox Cigar"
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value)}
                  className="w-full bg-surface border border-line rounded-md px-3 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Format</label>
                <select
                  value={newPackageType}
                  onChange={(e) => setNewPackageType(e.target.value)}
                  className="w-full bg-surface border border-line rounded-md px-2 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
                >
                  <option value="Single">Single Stick</option>
                  <option value="Pack of 3">3-Pack</option>
                  <option value="Pack of 5">5-Pack</option>
                  <option value="Box of 10">Box of 10</option>
                  <option value="Box of 20">Box of 20</option>
                  <option value="Box of 25">Box of 25</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Price *</label>
                <div className="flex items-center gap-1">
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-12 bg-surface border border-line rounded-md px-1 py-1.5 text-xs text-gold font-bold focus:outline-hidden"
                  >
                    <option value="£">£</option>
                    <option value="$">$</option>
                    <option value="€">€</option>
                    <option value="CHF">CHF</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="26.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-xs text-text font-bold focus:outline-hidden focus:border-gold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Product Web Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://retailer.com/product..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-surface border border-line rounded-md px-3 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">Stock / Special Note</label>
                <input
                  type="text"
                  placeholder="e.g. Free shipping over £50; currently in stock"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-surface border border-line rounded-md px-3 py-1.5 text-xs text-text focus:outline-hidden focus:border-gold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40 rounded text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Retailer to List</span>
              </button>
            </div>
          </form>

          {/* Site-wide Sync Option */}
          <div className="p-3.5 bg-surface border border-line rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="syncSiteWide"
                checked={syncSiteWide}
                onChange={(e) => setSyncSiteWide(e.target.checked)}
                className="mt-1 w-4 h-4 rounded bg-card border-line text-gold focus:ring-0 cursor-pointer"
              />
              <label htmlFor="syncSiteWide" className="text-xs text-text cursor-pointer">
                <span className="font-semibold block text-gold">Merge & Sync Prices Site-Wide</span>
                <span className="text-text-muted text-[11px] block mt-0.5">
                  Automatically sync updated retailer prices to matching Humidor vault cigars and Wishlist target sticks.
                </span>
              </label>
            </div>
            <Sparkles className="w-5 h-5 text-gold shrink-0" />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-line bg-surface flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-card hover:bg-card-hover text-text-muted hover:text-text border border-line rounded-lg text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-gold hover:brightness-110 text-ink font-bold uppercase tracking-wider rounded-lg text-xs shadow-md transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply Retailer Prices</span>
          </button>
        </div>
      </div>
    </div>
  );
};
