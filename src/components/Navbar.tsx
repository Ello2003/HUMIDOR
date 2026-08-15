import React from 'react';
import {
  Layers,
  Flame,
  BookOpen,
  Sparkles,
  Download,
  Bookmark,
  Plus,
  Box,
} from 'lucide-react';
import { Cigar, Humidor, SmokeLog } from '../types';

export type ActiveTab = 'dashboard' | 'inventory' | 'journal' | 'research' | 'wishlist' | 'export';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  cigars: Cigar[];
  humidors: Humidor[];
  smokeLogs: SmokeLog[];
  onOpenAddCigar: () => void;
  onOpenLogSmoke: () => void;
  onOpenHumidors: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cigars,
  humidors,
  smokeLogs,
  onOpenAddCigar,
  onOpenLogSmoke,
  onOpenHumidors,
}) => {
  const totalSticks = cigars.reduce((acc, c) => acc + (c.quantity || 0), 0);
  const totalValuation = cigars.reduce((acc, c) => acc + (c.purchasePrice || 0) * (c.quantity || 0), 0);
  const avgRating =
    smokeLogs.length > 0
      ? (smokeLogs.reduce((acc, l) => acc + l.overallScore, 0) / smokeLogs.length).toFixed(1)
      : null;

  return (
    <header className="sticky top-0 z-40 bg-[#161311] border-b border-[#2C2621] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand matching design */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 bg-[#8B5E3C] rounded-md flex items-center justify-center shadow-lg border border-[#A89F94]/20 flex-shrink-0">
              <span className="text-white font-serif text-2xl italic font-bold">H</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl sm:text-2xl tracking-tight text-[#E5E1DA]">
                  The Humidor Ledger
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-[0.2em] font-medium px-2 py-0.5 rounded bg-[#1C1816] text-[#D4AF37] border border-[#2C2621]">
                  Private Vault
                </span>
              </div>
              <p className="text-[11px] text-[#A89F94] tracking-wide hidden sm:block">
                Connoisseur Cellar • Tasting Journal • Sommelier Suite
              </p>
            </div>
          </div>

          {/* Quick Metrics (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 px-4 py-2 bg-[#1C1816] border border-[#2C2621] rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-[#A89F94]">Sticks:</span>
              <span className="font-serif font-semibold text-[#D4AF37]">{totalSticks}</span>
            </div>
            <div className="h-3 w-px bg-[#2C2621]" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-[#A89F94]">Value:</span>
              <span className="font-serif font-semibold text-[#E5E1DA]">${totalValuation.toFixed(0)}</span>
            </div>
            <div className="h-3 w-px bg-[#2C2621]" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-[#A89F94]">Cabinets:</span>
              <span className="font-serif font-semibold text-[#E5E1DA]">{humidors.length}</span>
            </div>
            {avgRating && (
              <>
                <div className="h-3 w-px bg-[#2C2621]" />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#A89F94]">Avg:</span>
                  <span className="font-serif font-semibold text-[#D4AF37]">★ {avgRating}</span>
                </div>
              </>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenLogSmoke}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] font-bold text-xs uppercase tracking-widest rounded-md shadow-sm transition hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-[#0F0D0C]" />
              <span>Log Smoke</span>
            </button>

            <button
              onClick={onOpenAddCigar}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1C1816] hover:bg-[#241E1B] text-[#E5E1DA] border border-[#2C2621] hover:border-[#8B5E3C] font-medium text-xs uppercase tracking-wider rounded-md transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Add Stick</span>
            </button>

            <button
              onClick={onOpenHumidors}
              title="Manage Humidor Cabinets"
              className="p-2 bg-[#1C1816] hover:bg-[#241E1B] text-[#A89F94] hover:text-[#E5E1DA] border border-[#2C2621] hover:border-[#8B5E3C] rounded-md transition cursor-pointer"
            >
              <Box className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs styled to match uppercase elegant tracking */}
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto py-2.5 scrollbar-none border-t border-[#2C2621] text-xs uppercase tracking-widest font-medium">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-[#D4AF37] bg-[#1C1816] border border-[#2C2621]'
                : 'text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1C1816]/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
              activeTab === 'inventory'
                ? 'text-[#D4AF37] bg-[#1C1816] border border-[#2C2621]'
                : 'text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1C1816]/60'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Inventory ({totalSticks})</span>
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
              activeTab === 'journal'
                ? 'text-[#D4AF37] bg-[#1C1816] border border-[#2C2621]'
                : 'text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1C1816]/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Journal ({smokeLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('research')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
              activeTab === 'research'
                ? 'text-[#D4AF37] bg-[#1C1816] border border-[#2C2621]'
                : 'text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1C1816]/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Sommelier & Research</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
              activeTab === 'wishlist'
                ? 'text-[#D4AF37] bg-[#1C1816] border border-[#2C2621]'
                : 'text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1C1816]/60'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Wishlist ({cigars.filter((c) => c.quantity === 0).length + 3})</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
              activeTab === 'export'
                ? 'text-[#D4AF37] bg-[#1C1816] border border-[#2C2621]'
                : 'text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1C1816]/60'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Export Suite</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

