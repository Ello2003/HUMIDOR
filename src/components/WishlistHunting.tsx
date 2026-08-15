import React, { useState } from 'react';
import { Bookmark, Plus, Check, Trash2, Sparkles, ExternalLink, Tag, Star } from 'lucide-react';
import { WishlistItem, Cigar } from '../types';
import { formatCurrency, DEFAULT_CURRENCY } from '../utils/currencyUtils';

interface WishlistHuntingProps {
  wishlist: WishlistItem[];
  onAddWishlistItem: (item: Omit<WishlistItem, 'id' | 'createdAt'>) => void;
  onDeleteWishlistItem: (id: string) => void;
  onAcquireItem: (item: WishlistItem) => void;
  onResearchCigar: (query: string) => void;
}

export const WishlistHunting: React.FC<WishlistHuntingProps> = ({
  wishlist,
  onAddWishlistItem,
  onDeleteWishlistItem,
  onAcquireItem,
  onResearchCigar,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [vitola, setVitola] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [notes, setNotes] = useState('');
  const [sourceRetailer, setSourceRetailer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !name.trim()) return;

    onAddWishlistItem({
      brand: brand.trim(),
      name: name.trim(),
      vitola: vitola.trim() || undefined,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      priority,
      notes: notes.trim() || undefined,
      sourceRetailer: sourceRetailer.trim() || undefined,
    });

    setBrand('');
    setName('');
    setVitola('');
    setTargetPrice('');
    setNotes('');
    setSourceRetailer('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-gradient-to-br from-[#1C1816] via-[#161311] to-[#13110F] border border-[#2C2621] rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#D4AF37]" />
            <h1 className="text-xl sm:text-2xl font-serif text-white font-normal">
              Personal Wishlist & Box Hunt
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A89F94] mt-1">
            Track elusive vitolas, limited annual releases, and dream sticks you plan to acquire.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] rounded font-bold uppercase tracking-wider text-xs shadow-sm transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Close Form' : 'Add Target Stick'}</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-5 bg-[#1C1816] border border-[#2C2621] rounded-lg space-y-4 shadow-sm">
          <h3 className="text-sm font-serif font-semibold text-[#D4AF37]">Track New Cigar on Wishlist</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Brand / Maker *</label>
              <input
                type="text"
                required
                placeholder="e.g. Arturo Fuente, Dunbarton, Tatuaje"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Blend / Cigar Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Opus X ForbiddenX, Sin Compromiso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Vitola / Format</label>
              <input
                type="text"
                placeholder="e.g. Churchill, Lancero, Toro"
                value={vitola}
                onChange={(e) => setVitola(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Target Price (£/stick or box)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 28.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              >
                <option value="High">🔥 High (Grail / Must Buy)</option>
                <option value="Medium">⚡ Medium (Keep eye out)</option>
                <option value="Low">🌱 Low (Casual interest)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Retailer / Source</label>
              <input
                type="text"
                placeholder="e.g. Corona Cigar, Neptune, Local B&M"
                value={sourceRetailer}
                onChange={(e) => setSourceRetailer(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Notes / Why You Want It</label>
            <input
              type="text"
              placeholder="e.g. Highly rated on Halfwheel; rare Cameroon wrapper"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-[#13110F] text-[#A89F94] hover:text-[#E5E1DA] border border-[#2C2621] rounded text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] font-bold uppercase tracking-wider rounded text-xs shadow-sm cursor-pointer"
            >
              Save to Wishlist
            </button>
          </div>
        </form>
      )}

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishlist.map((item) => (
          <div
            key={item.id}
            className="p-5 bg-[#1C1816] border border-[#2C2621] rounded-lg flex flex-col justify-between shadow-sm transition hover:border-[#3D352E]"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">{item.brand}</span>
                  <h3 className="font-serif font-semibold text-base text-[#E5E1DA]">{item.name}</h3>
                  {item.vitola && <span className="text-xs text-[#A89F94]">{item.vitola}</span>}
                </div>

                <span
                  className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                    item.priority === 'High'
                      ? 'bg-[#2C1515] text-red-300 border-red-900/60'
                      : item.priority === 'Medium'
                      ? 'bg-[#13110F] text-[#D4AF37] border-[#2C2621]'
                      : 'bg-[#13110F] text-[#A89F94] border-[#2C2621]'
                  }`}
                >
                  {item.priority} Priority
                </span>
              </div>

              {item.notes && (
                <p className="text-xs text-[#E5E1DA] italic bg-[#13110F] p-2.5 rounded border border-[#2C2621] my-2.5 font-serif">
                  "{item.notes}"
                </p>
              )}

              <div className="space-y-1 text-xs text-[#A89F94] pt-1">
                {item.targetPrice !== undefined && (
                  <div>
                    Target: <strong className="text-[#E5E1DA]">{formatCurrency(item.targetPrice, '£')}</strong>
                  </div>
                )}
                {item.sourceRetailer && (
                  <div>
                    Source: <strong className="text-[#E5E1DA]">{item.sourceRetailer}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#2C2621] mt-3 flex items-center justify-between gap-2">
              <button
                onClick={() => onAcquireItem(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13110F] hover:bg-[#1E2922] text-emerald-400 border border-emerald-800/60 rounded text-xs font-semibold transition cursor-pointer"
                title="Acquired this stick! Move to inventory"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Acquired → Vault</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onResearchCigar(`${item.brand} ${item.name}`)}
                  className="p-1.5 bg-[#13110F] hover:bg-[#241E1B] text-[#D4AF37] border border-[#2C2621] rounded cursor-pointer"
                  title="Research Blend Dossier"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteWishlistItem(item.id)}
                  className="p-1.5 bg-[#13110F] hover:bg-[#2C1515] text-[#A89F94] hover:text-red-400 border border-[#2C2621] rounded cursor-pointer"
                  title="Delete from Wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {wishlist.length === 0 && (
          <div className="col-span-full text-center py-12 bg-[#1C1816] border border-[#2C2621] rounded-lg">
            <Bookmark className="w-8 h-8 text-[#A89F94]/50 mx-auto mb-3" />
            <h3 className="text-sm font-serif font-semibold text-[#E5E1DA]">No Wishlist Items Yet</h3>
            <p className="text-xs text-[#A89F94] mt-1">
              Add rare cigars you'd love to hunt down or buy when restocked.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

