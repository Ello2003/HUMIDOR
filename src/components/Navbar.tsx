import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Flame,
  BookOpen,
  Sparkles,
  Download,
  Bookmark,
  Plus,
  Box,
  ShoppingCart,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';
import { Cigar, Humidor, SmokeLog, WishlistItem, AppSettings } from '../types';
import { formatCurrency } from '../utils/currencyUtils';

export type ActiveTab = 'dashboard' | 'inventory' | 'journal' | 'research' | 'wishlist' | 'export';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  cigars: Cigar[];
  humidors: Humidor[];
  smokeLogs: SmokeLog[];
  wishlist: WishlistItem[];
  researchCount?: number;
  settings?: AppSettings;
  onOpenAddCigar: () => void;
  onOpenLogSmoke: () => void;
  onOpenHumidors: () => void;
  onOpenBasketImporter?: () => void;
  onOpenSettings?: () => void;
  onOpenVersionHistory?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cigars,
  humidors,
  smokeLogs,
  wishlist,
  researchCount = 0,
  settings,
  onOpenAddCigar,
  onOpenLogSmoke,
  onOpenHumidors,
  onOpenBasketImporter,
  onOpenSettings,
  onOpenVersionHistory,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalSticks = cigars.reduce((acc, c) => acc + (c.quantity || 0), 0);
  const totalValuation = cigars.reduce((acc, c) => acc + (c.purchasePrice || 0) * (c.quantity || 0), 0);
  const avgRating =
    smokeLogs.length > 0
      ? (smokeLogs.reduce((acc, l) => acc + l.overallScore, 0) / smokeLogs.length).toFixed(1)
      : null;

  const visibleTabs = settings?.visibleTabs || {
    dashboard: true,
    humidors: true,
    cigars: true,
    smokes: true,
    research: true,
    wishlist: true,
    analytics: true,
  };

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
              <h1 className="font-serif text-xl sm:text-2xl tracking-tight text-[#E5E1DA]">
                The Humidor
              </h1>
              <p className="text-[11px] text-[#A89F94] tracking-wide hidden sm:block">
                Cigar Dashboard
              </p>
            </div>
          </div>

          {/* Quick Metrics (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 px-4 py-2 bg-[#1C1816] border border-[#2C2621] rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-[#A89F94]">Sticks:</span>
              <span className="font-serif font-semibold text-[#C5A059]">{totalSticks}</span>
            </div>
            <div className="h-3 w-px bg-[#2C2621]" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-[#A89F94]">Value:</span>
              <span className="font-serif font-semibold text-[#E5E1DA]">{formatCurrency(totalValuation, '£')}</span>
            </div>
            <div className="h-3 w-px bg-[#2C2621]" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-[#A89F94]">Humidors:</span>
              <span className="font-serif font-semibold text-[#E5E1DA]">{humidors.length}</span>
            </div>
            {avgRating && (
              <>
                <div className="h-3 w-px bg-[#2C2621]" />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#A89F94]">Avg:</span>
                  <span className="font-serif font-semibold text-[#C5A059]">★ {avgRating}</span>
                </div>
              </>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={onOpenLogSmoke}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C5A059] hover:brightness-110 text-[#0F0D0C] font-bold text-xs uppercase tracking-widest rounded-md shadow-sm transition hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-[#0F0D0C]" />
              <span className="hidden sm:inline">Log Smoke</span>
              <span className="sm:hidden">Log</span>
            </button>

            {/* Combined Add Stick & Basket Import Menu */}
            <div className="relative" ref={addMenuRef}>
              <div className="inline-flex rounded-md shadow-xs">
                <button
                  onClick={onOpenAddCigar}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#1C1816] hover:bg-[#241E1B] text-[#E5E1DA] border border-[#2C2621] hover:border-[#8B5E3C] font-medium text-xs uppercase tracking-wider rounded-l-md transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Add Stick</span>
                </button>
                {onOpenBasketImporter && (
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    aria-label="Add options"
                    className="px-2 py-2 bg-[#1C1816] hover:bg-[#241E1B] text-[#A89F94] hover:text-[#E5E1DA] border-y border-r border-[#2C2621] hover:border-[#8B5E3C] rounded-r-md transition cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown Options */}
              {showAddMenu && onOpenBasketImporter && (
                <div className="absolute right-0 mt-1.5 w-60 bg-[#1C1816] border border-[#2C2621] rounded-md shadow-xl py-1 z-50 text-xs">
                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      onOpenAddCigar();
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-[#241E1B] text-[#E5E1DA] flex items-start gap-2.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Add Single Stick</div>
                      <div className="text-[11px] text-[#A89F94]">Manual entry with vitola, price & aging</div>
                    </div>
                  </button>

                  <div className="h-px bg-[#2C2621] my-1" />

                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      onOpenBasketImporter();
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-[#241E1B] text-[#E5E1DA] flex items-start gap-2.5 transition cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-[#C5A059]">Basket Batch Importer</div>
                      <div className="text-[11px] text-[#A89F94]">Live URL, Local HTML, Paste Code, & Carts</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto py-2.5 scrollbar-none border-t border-[#2C2621] text-xs uppercase tracking-widest font-medium">
          {visibleTabs.dashboard && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-[#C5A059] bg-[#1C1816] border border-[#2C2621]'
                  : 'text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1C1816]/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          )}

          {visibleTabs.cigars && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
                activeTab === 'inventory'
                  ? 'text-[#C5A059] bg-[#1C1816] border border-[#2C2621]'
                  : 'text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1C1816]/60'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Humidor ({totalSticks})</span>
            </button>
          )}

          {visibleTabs.smokes && (
            <button
              onClick={() => setActiveTab('journal')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
                activeTab === 'journal'
                  ? 'text-[#C5A059] bg-[#1C1816] border border-[#2C2621]'
                  : 'text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1C1816]/60'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Smoked ({smokeLogs.length})</span>
            </button>
          )}

          {visibleTabs.research && (
            <button
              onClick={() => setActiveTab('research')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
                activeTab === 'research'
                  ? 'text-[#C5A059] bg-[#1C1816] border border-[#2C2621]'
                  : 'text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1C1816]/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Research ({researchCount})</span>
            </button>
          )}

          {visibleTabs.wishlist && (
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'text-[#C5A059] bg-[#1C1816] border border-[#2C2621]'
                  : 'text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1C1816]/60'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Wishlist ({wishlist.length})</span>
            </button>
          )}

          {visibleTabs.analytics && (
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
                activeTab === 'export'
                  ? 'text-[#C5A059] bg-[#1C1816] border border-[#2C2621]'
                  : 'text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1C1816]/60'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Export Suite</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

