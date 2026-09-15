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
    <header className="sticky top-0 z-40 bg-header border-b border-line backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand matching design */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 bg-cedar rounded-md flex items-center justify-center shadow-lg border border-text-muted/20 flex-shrink-0">
              <span className="text-white font-serif text-2xl italic font-bold">H</span>
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl tracking-tight text-text">
                The Humidor
              </h1>
              <p className="text-[11px] text-text-muted tracking-wide hidden sm:block">
                Cigar Dashboard
              </p>
            </div>
          </div>

          {/* Quick Metrics (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 px-4 py-2 bg-card border border-line rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-text-muted">Sticks:</span>
              <span className="font-serif font-semibold text-gold">{totalSticks}</span>
            </div>
            <div className="h-3 w-px bg-line" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-text-muted">Value:</span>
              <span className="font-serif font-semibold text-text">{formatCurrency(totalValuation, '£')}</span>
            </div>
            <div className="h-3 w-px bg-line" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-text-muted">Humidors:</span>
              <span className="font-serif font-semibold text-text">{humidors.length}</span>
            </div>
            {avgRating && (
              <>
                <div className="h-3 w-px bg-line" />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-text-muted">Avg:</span>
                  <span className="font-serif font-semibold text-gold">★ {avgRating}</span>
                </div>
              </>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={onOpenLogSmoke}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gold hover:brightness-110 text-ink font-bold text-xs uppercase tracking-widest rounded-md shadow-sm transition hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-ink" />
              <span className="hidden sm:inline">Log Smoke</span>
              <span className="sm:hidden">Log</span>
            </button>

            {/* Combined Add Stick & Basket Import Menu */}
            <div className="relative" ref={addMenuRef}>
              <div className="inline-flex rounded-md shadow-xs">
                <button
                  onClick={onOpenAddCigar}
                  className="flex items-center gap-1.5 px-3 py-2 bg-card hover:bg-card-hover text-text border border-line hover:border-cedar font-medium text-xs uppercase tracking-wider rounded-l-md transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-gold" />
                  <span>Add Stick</span>
                </button>
                {onOpenBasketImporter && (
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    aria-label="Add options"
                    className="px-2 py-2 bg-card hover:bg-card-hover text-text-muted hover:text-text border-y border-r border-line hover:border-cedar rounded-r-md transition cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown Options */}
              {showAddMenu && onOpenBasketImporter && (
                <div className="absolute right-0 mt-1.5 w-60 bg-card border border-line rounded-md shadow-xl py-1 z-50 text-xs">
                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      onOpenAddCigar();
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-card-hover text-text flex items-start gap-2.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Add Single Stick</div>
                      <div className="text-[11px] text-text-muted">Manual entry with vitola, price & aging</div>
                    </div>
                  </button>

                  <div className="h-px bg-line my-1" />

                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      onOpenBasketImporter();
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-card-hover text-text flex items-start gap-2.5 transition cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gold">Basket Batch Importer</div>
                      <div className="text-[11px] text-text-muted">Live URL, Local HTML, Paste Code, & Carts</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto py-2.5 scrollbar-none border-t border-line text-xs uppercase tracking-widest font-medium">
          {visibleTabs.dashboard && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-gold bg-card border border-line'
                  : 'text-text-muted hover:text-text hover:bg-card/60'
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
                  ? 'text-gold bg-card border border-line'
                  : 'text-text-muted hover:text-text hover:bg-card/60'
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
                  ? 'text-gold bg-card border border-line'
                  : 'text-text-muted hover:text-text hover:bg-card/60'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-gold" />
              <span>Smoked ({smokeLogs.length})</span>
            </button>
          )}

          {visibleTabs.research && (
            <button
              onClick={() => setActiveTab('research')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
                activeTab === 'research'
                  ? 'text-gold bg-card border border-line'
                  : 'text-text-muted hover:text-text hover:bg-card/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Research ({researchCount})</span>
            </button>
          )}

          {visibleTabs.wishlist && (
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'text-gold bg-card border border-line'
                  : 'text-text-muted hover:text-text hover:bg-card/60'
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
                  ? 'text-gold bg-card border border-line'
                  : 'text-text-muted hover:text-text hover:bg-card/60'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              <span>Export Suite</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

