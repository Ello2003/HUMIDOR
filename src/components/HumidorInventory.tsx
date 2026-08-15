import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Flame,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Star,
  Layers,
  Box,
  Clock,
  Sparkles,
  ArrowUpDown,
  Check,
  Grid,
  List,
  X,
} from 'lucide-react';
import { Cigar, Humidor, StrengthRating, CigarStatus } from '../types';
import { calculateRestDays } from '../utils/exportUtils';
import { formatCurrency } from '../utils/currencyUtils';

interface HumidorInventoryProps {
  cigars: Cigar[];
  humidors: Humidor[];
  onAddCigar: () => void;
  onEditCigar: (cigar: Cigar) => void;
  onDeleteCigar: (cigarId: string) => void;
  onUpdateQuantity: (cigarId: string, newQty: number) => void;
  onToggleFavorite: (cigarId: string) => void;
  onSmokeCigar: (cigarId: string) => void;
  onOpenResearchForCigar: (cigar: Cigar) => void;
}

export const HumidorInventory: React.FC<HumidorInventoryProps> = ({
  cigars,
  humidors,
  onAddCigar,
  onEditCigar,
  onDeleteCigar,
  onUpdateQuantity,
  onToggleFavorite,
  onSmokeCigar,
  onOpenResearchForCigar,
}) => {
  const [selectedHumidorId, setSelectedHumidorId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [strengthFilter, setStrengthFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const humidorMap = useMemo(() => new Map(humidors.map((h) => [h.id, h])), [humidors]);

  // Unique origins
  const availableOrigins = useMemo(() => {
    const set = new Set(cigars.map((c) => c.countryOrigin));
    return Array.from(set).sort();
  }, [cigars]);

  // Filtered & Sorted Cigars
  const filteredCigars = useMemo(() => {
    return cigars
      .filter((c) => {
        // Humidor Filter
        if (selectedHumidorId !== 'all' && c.humidorId !== selectedHumidorId) {
          return false;
        }
        // Status Filter
        if (statusFilter !== 'all' && c.status !== statusFilter) {
          return false;
        }
        // Strength Filter
        if (strengthFilter !== 'all' && c.strength !== strengthFilter) {
          return false;
        }
        // Origin Filter
        if (originFilter !== 'all' && c.countryOrigin !== originFilter) {
          return false;
        }
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            c.brand.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.vitola.toLowerCase().includes(q) ||
            c.wrapper.toLowerCase().includes(q) ||
            c.countryOrigin.toLowerCase().includes(q) ||
            (c.notes && c.notes.toLowerCase().includes(q)) ||
            (c.flavorTags && c.flavorTags.some((t) => t.toLowerCase().includes(q)));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating-desc') {
          return (b.personalRating || 0) - (a.personalRating || 0);
        }
        if (sortBy === 'brand-asc') {
          return a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name);
        }
        if (sortBy === 'qty-desc') {
          return b.quantity - a.quantity;
        }
        if (sortBy === 'rest-desc') {
          return calculateRestDays(b.purchaseDate) - calculateRestDays(a.purchaseDate);
        }
        if (sortBy === 'price-desc') {
          return (b.purchasePrice || 0) - (a.purchasePrice || 0);
        }
        return 0;
      });
  }, [cigars, selectedHumidorId, statusFilter, strengthFilter, originFilter, searchQuery, sortBy]);

  const totalFilteredSticks = filteredCigars.reduce((acc, c) => acc + (c.quantity || 0), 0);
  const totalFilteredValue = filteredCigars.reduce((acc, c) => acc + (c.purchasePrice || 0) * (c.quantity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Humidor Selectors Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[#2C2621]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedHumidorId('all')}
            className={`px-3.5 py-1.5 rounded-md text-xs uppercase tracking-wider font-semibold transition cursor-pointer ${
              selectedHumidorId === 'all'
                ? 'bg-[#D4AF37] text-[#0F0D0C]'
                : 'bg-[#1C1816] text-[#A89F94] hover:text-[#E5E1DA] border border-[#2C2621]'
            }`}
          >
            All Vaults ({cigars.reduce((a, b) => a + b.quantity, 0)} sticks)
          </button>
          {humidors.map((h) => {
            const count = cigars.filter((c) => c.humidorId === h.id).reduce((a, b) => a + b.quantity, 0);
            return (
              <button
                key={h.id}
                onClick={() => setSelectedHumidorId(h.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs uppercase tracking-wider font-medium transition flex items-center gap-2 cursor-pointer ${
                  selectedHumidorId === h.id
                    ? 'bg-[#D4AF37] text-[#0F0D0C]'
                    : 'bg-[#1C1816] text-[#A89F94] hover:text-[#E5E1DA] border border-[#2C2621]'
                }`}
              >
                <span>{h.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${selectedHumidorId === h.id ? 'bg-[#0F0D0C] text-[#D4AF37]' : 'bg-[#13110F] text-[#D4AF37]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onAddCigar}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] rounded-md text-xs uppercase tracking-widest font-bold shadow-sm transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Stick</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 bg-[#1C1816] border border-[#2C2621] rounded-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-[#A89F94] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by brand, name, or wrapper type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md pl-9 pr-8 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37] placeholder-[#A89F94]/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#A89F94] hover:text-[#E5E1DA] p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-2.5 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
            >
              <option value="all">All Resting Statuses</option>
              <option value="ready">Ready to Smoke 💨</option>
              <option value="resting">Resting in Vault ⏳</option>
              <option value="aging">Long-term Aging 🪵</option>
              <option value="special_occasion">Special Reserves 🌟</option>
            </select>
          </div>

          {/* Strength Filter */}
          <div>
            <select
              value={strengthFilter}
              onChange={(e) => setStrengthFilter(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-2.5 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
            >
              <option value="all">All Strengths</option>
              <option value="Mild">Mild</option>
              <option value="Mild-Medium">Mild-Medium</option>
              <option value="Medium">Medium</option>
              <option value="Medium-Full">Medium-Full</option>
              <option value="Full">Full</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-2.5 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
            >
              <option value="rating-desc">Rating: Highest First</option>
              <option value="brand-asc">Brand (A to Z)</option>
              <option value="qty-desc">Quantity in Stock</option>
              <option value="rest-desc">Resting Time (Days)</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Quick Wrapper Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] uppercase font-bold text-[#A89F94] mr-1">Quick Wrapper:</span>
          {['Habano', 'Maduro', 'Connecticut', 'Corojo', 'San Andrés', 'Oscuro', 'Cameroon', 'Sumatra'].map((wType) => {
            const isActive = searchQuery.toLowerCase() === wType.toLowerCase();
            return (
              <button
                key={wType}
                type="button"
                onClick={() => setSearchQuery(isActive ? '' : wType)}
                className={`text-[11px] px-2 py-0.5 rounded-full transition cursor-pointer border ${
                  isActive
                    ? 'bg-[#D4AF37] text-[#0F0D0C] border-[#D4AF37] font-semibold'
                    : 'bg-[#13110F] text-[#A89F94] hover:text-[#E5E1DA] border-[#2C2621] hover:border-[#3D352E]'
                }`}
              >
                {wType}
              </button>
            );
          })}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[11px] px-2 py-0.5 rounded-full bg-[#241E1B] text-[#D4AF37] hover:text-white border border-[#382E26] flex items-center gap-1 cursor-pointer ml-auto"
            >
              <X className="w-3 h-3" />
              <span>Clear Search</span>
            </button>
          )}
        </div>

        {/* View Switcher & Result Summary */}
        <div className="flex items-center justify-between pt-3 border-t border-[#2C2621] text-xs text-[#A89F94]">
          <div>
            Showing <strong className="text-[#D4AF37] font-serif">{filteredCigars.length}</strong> distinct lines (
            <strong className="text-[#D4AF37] font-serif">{totalFilteredSticks}</strong> total sticks,{' '}
            <strong className="text-[#E5E1DA]">{formatCurrency(totalFilteredValue, '£')}</strong> valuation)
          </div>

          <div className="flex items-center gap-1 bg-[#13110F] p-1 rounded border border-[#2C2621]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#2C2621] text-[#D4AF37]' : 'text-[#A89F94] hover:text-[#E5E1DA]'
              }`}
              title="Card Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition cursor-pointer ${
                viewMode === 'table' ? 'bg-[#2C2621] text-[#D4AF37]' : 'text-[#A89F94] hover:text-[#E5E1DA]'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State when no results match search/filter */}
      {filteredCigars.length === 0 && (
        <div className="text-center py-16 px-4 bg-[#1C1816] border border-[#2C2621] rounded-lg">
          <Search className="w-10 h-10 text-[#A89F94]/50 mx-auto mb-3" />
          <h3 className="text-base font-serif font-bold text-[#E5E1DA]">No Cigars Found</h3>
          <p className="text-xs text-[#A89F94] mt-1 max-w-md mx-auto">
            {searchQuery
              ? `No sticks in your inventory matched "${searchQuery}". Try searching for a different brand, name, or wrapper type.`
              : 'No sticks match the currently active filters in your vault.'}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-[#241E1B] hover:bg-[#2C2621] text-[#D4AF37] border border-[#382E26] rounded text-xs font-semibold cursor-pointer"
              >
                Clear Search Term
              </button>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setStrengthFilter('all');
                setOriginFilter('all');
                setSelectedHumidorId('all');
              }}
              className="px-4 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* Cards View */}
      {filteredCigars.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCigars.map((cigar) => {
            const restDays = calculateRestDays(cigar.purchaseDate);
            const humidor = humidorMap.get(cigar.humidorId);
            const isOutOfStock = cigar.quantity <= 0;

            return (
              <div
                key={cigar.id}
                className={`rounded-lg border transition-all duration-200 flex flex-col justify-between p-5 ${
                  isOutOfStock
                    ? 'bg-[#13110F] border-[#2C2621] opacity-60'
                    : 'bg-[#1C1816] border-[#2C2621] hover:border-[#3D352E] shadow-sm'
                }`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37]">
                        {cigar.brand}
                      </div>
                      <h3 className="font-serif font-semibold text-base text-[#E5E1DA] leading-snug">
                        {cigar.name}
                      </h3>
                      <div className="text-xs text-[#A89F94]">
                        {cigar.vitola}{' '}
                        {cigar.lengthInches ? `• ${cigar.lengthInches}"` : ''}
                        {cigar.ringGauge ? ` x ${cigar.ringGauge} RG` : ''}
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleFavorite(cigar.id)}
                      className="p-1 rounded text-[#D4AF37] hover:bg-[#2C2621] transition cursor-pointer"
                      title={cigar.isFavorite ? 'Remove favorite' : 'Mark favorite'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          cigar.isFavorite ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#3D352E] hover:text-[#D4AF37]'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Wrapper & Blend Info */}
                  <div className="p-3 bg-[#13110F] border border-[#2C2621] rounded-md text-xs space-y-1.5 my-3">
                    <div className="flex justify-between">
                      <span className="text-[#A89F94]">Wrapper:</span>
                      <span className="font-medium text-[#E5E1DA] truncate ml-2">{cigar.wrapper}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A89F94]">Origin / Terroir:</span>
                      <span className="font-serif text-[#D4AF37]">{cigar.countryOrigin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A89F94]">Strength:</span>
                      <span className="font-medium text-[#E5E1DA]">{cigar.strength}</span>
                    </div>
                  </div>

                  {/* Humidor & Resting Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-wider mb-3">
                    <span className="px-2 py-0.5 rounded bg-[#13110F] text-[#A89F94] border border-[#2C2621]">
                      📍 {humidor?.name || 'Vault'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#13110F] text-[#D4AF37] border border-[#2C2621] font-serif">
                      ⏳ {restDays}d rested
                    </span>
                  </div>

                  {/* Flavor Tags */}
                  {cigar.flavorTags && cigar.flavorTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {cigar.flavorTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#13110F] text-[#A89F94] border border-[#2C2621]"
                        >
                          {tag}
                        </span>
                      ))}
                      {cigar.flavorTags.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-[#A89F94]">
                          +{cigar.flavorTags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes / Collector Quote */}
                  {cigar.notes && (
                    <p className="text-xs text-[#A89F94] italic line-clamp-2 mb-3 bg-[#13110F] p-2.5 rounded border border-[#2C2621]/60">
                      "{cigar.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-[#2C2621] space-y-3">
                  {/* Stock Stepper & Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateQuantity(cigar.id, Math.max(0, cigar.quantity - 1))}
                        className="w-7 h-7 rounded bg-[#13110F] hover:bg-[#2C2621] text-[#E5E1DA] flex items-center justify-center border border-[#2C2621] transition cursor-pointer"
                        title="Deduct 1 stick"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-base font-serif font-bold text-white min-w-[28px] text-center">
                        {cigar.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(cigar.id, cigar.quantity + 1)}
                        className="w-7 h-7 rounded bg-[#13110F] hover:bg-[#2C2621] text-[#E5E1DA] flex items-center justify-center border border-[#2C2621] transition cursor-pointer"
                        title="Add 1 stick"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-[#A89F94]">sticks</span>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-serif text-[#E5E1DA]">
                        {cigar.purchasePrice !== undefined ? `${formatCurrency(cigar.purchasePrice, cigar.currency || '£')}/ea` : '—'}
                      </div>
                      {cigar.personalRating && (
                        <div className="text-[11px] font-serif font-bold text-[#D4AF37]">
                          ★ {cigar.personalRating}/100
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onSmokeCigar(cigar.id)}
                      disabled={isOutOfStock}
                      className={`col-span-2 flex items-center justify-center gap-1.5 py-2 rounded text-xs uppercase tracking-wider font-bold transition cursor-pointer ${
                        isOutOfStock
                          ? 'bg-[#13110F] text-[#3D352E] border border-[#2C2621] cursor-not-allowed'
                          : 'bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C]'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Smoke Stick</span>
                    </button>

                    <button
                      onClick={() => onOpenResearchForCigar(cigar)}
                      className="flex items-center justify-center gap-1 py-2 bg-[#13110F] hover:bg-[#2C2621] text-[#E5E1DA] border border-[#2C2621] rounded text-xs uppercase tracking-wider transition cursor-pointer"
                      title="AI Sommelier Research"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Dossier</span>
                    </button>
                  </div>

                  {/* Edit & Delete Mini row */}
                  <div className="flex justify-end gap-3 text-[#A89F94] text-xs pt-1">
                    <button
                      onClick={() => onEditCigar(cigar)}
                      className="hover:text-[#E5E1DA] flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${cigar.brand} ${cigar.name} from inventory?`)) {
                          onDeleteCigar(cigar.id);
                        }
                      }}
                      className="hover:text-red-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {filteredCigars.length > 0 && viewMode === 'table' && (
        <div className="bg-[#1C1816] border border-[#2C2621] rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#E5E1DA]">
              <thead className="bg-[#13110F] text-[#A89F94] uppercase tracking-wider font-semibold border-b border-[#2C2621]">
                <tr>
                  <th className="p-3">Brand & Name</th>
                  <th className="p-3">Vitola / Specs</th>
                  <th className="p-3">Wrapper & Terroir</th>
                  <th className="p-3">Strength</th>
                  <th className="p-3">Humidor</th>
                  <th className="p-3">Resting</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2621]">
                {filteredCigars.map((c) => {
                  const rest = calculateRestDays(c.purchaseDate);
                  const hum = humidorMap.get(c.humidorId);
                  return (
                    <tr key={c.id} className="hover:bg-[#241E1B] transition">
                      <td className="p-3">
                        <div className="font-semibold text-white">{c.brand}</div>
                        <div className="text-[#A89F94]">{c.name}</div>
                      </td>
                      <td className="p-3">
                        <div>{c.vitola}</div>
                        <div className="text-[#A89F94] text-[10px]">
                          {c.lengthInches ? `${c.lengthInches}"` : ''} {c.ringGauge ? `x ${c.ringGauge}` : ''}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>{c.wrapper}</div>
                        <div className="text-[#D4AF37] font-serif text-[10px]">{c.countryOrigin}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-[#13110F] text-[#E5E1DA] border border-[#2C2621] text-[11px]">
                          {c.strength}
                        </span>
                      </td>
                      <td className="p-3 text-[#A89F94]">{hum?.name || 'Main Vault'}</td>
                      <td className="p-3">
                        <div className="font-serif text-[#D4AF37]">{rest}d</div>
                        <div className="text-[10px] text-[#A89F94]">{c.status}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onUpdateQuantity(c.id, Math.max(0, c.quantity - 1))}
                            className="p-1 text-[#A89F94] hover:text-[#E5E1DA]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-serif font-bold text-white w-6 text-center">{c.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(c.id, c.quantity + 1)}
                            className="p-1 text-[#A89F94] hover:text-[#E5E1DA]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 font-serif text-[#E5E1DA]">
                        {c.purchasePrice !== undefined ? formatCurrency(c.purchasePrice, c.currency || '£') : '—'}
                      </td>
                      <td className="p-3 font-serif font-bold text-[#D4AF37]">
                        {c.personalRating ? `★ ${c.personalRating}` : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSmokeCigar(c.id)}
                            className="px-2.5 py-1 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] rounded font-bold text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          >
                            <Flame className="w-3 h-3" />
                            <span>Smoke</span>
                          </button>
                          <button
                            onClick={() => onEditCigar(c)}
                            className="p-1 text-[#A89F94] hover:text-[#E5E1DA] cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

