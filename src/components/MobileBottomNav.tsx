import React from 'react';
import {
  Layers,
  Box,
  Flame,
  Sparkles,
  Bookmark,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import { ActiveTab } from './Navbar';
import { AppSettings } from '../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings?: AppSettings;
  totalSticks?: number;
  smokeCount?: number;
  researchCount?: number;
  wishlistCount?: number;
}

/**
 * App-style fixed bottom tab bar — mobile only.
 * Desktop keeps the existing top Navbar tabs unchanged.
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  settings,
  totalSticks = 0,
  smokeCount = 0,
  researchCount = 0,
  wishlistCount = 0,
}) => {
  const visibleTabs = settings?.visibleTabs || {
    dashboard: true,
    humidors: true,
    cigars: true,
    smokes: true,
    research: true,
    wishlist: true,
    analytics: true,
  };

  const tabs: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    show: boolean;
    badge?: string | number;
  }[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: <Layers className="w-5 h-5" strokeWidth={1.75} />,
      show: !!visibleTabs.dashboard,
    },
    {
      id: 'inventory',
      label: 'Humidor',
      icon: <Box className="w-5 h-5" strokeWidth={1.75} />,
      show: !!visibleTabs.cigars,
      badge: totalSticks > 0 ? totalSticks : undefined,
    },
    {
      id: 'journal',
      label: 'Journal',
      icon: <Flame className="w-5 h-5" strokeWidth={1.75} />,
      show: !!visibleTabs.smokes,
      badge: smokeCount > 0 ? smokeCount : undefined,
    },
    {
      id: 'research',
      label: 'Research',
      icon: <Sparkles className="w-5 h-5" strokeWidth={1.75} />,
      show: !!visibleTabs.research,
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      icon: <Bookmark className="w-5 h-5" strokeWidth={1.75} />,
      show: !!visibleTabs.wishlist,
      badge: wishlistCount > 0 ? wishlistCount : undefined,
    },
    {
      id: 'export',
      label: 'Export',
      icon: <Download className="w-5 h-5" strokeWidth={1.75} />,
      show: !!visibleTabs.analytics,
    },
  ];

  const visible = tabs.filter((t) => t.show);

  // Prefer 5 primary items; if more, still show them (scroll is rare on phones)
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-header/95 backdrop-blur-lg border-t border-line"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around h-[3.75rem] px-1">
        {visible.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 transition-colors cursor-pointer active:scale-95 ${
                isActive ? 'text-gold' : 'text-text-muted'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="relative">
                {tab.icon}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[1.1rem] h-[1.1rem] px-0.5 flex items-center justify-center rounded-full bg-gold text-ink text-[9px] font-bold leading-none">
                    {Number(tab.badge) > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </span>
              <span
                className={`text-[10px] font-medium tracking-wide truncate max-w-full px-0.5 ${
                  isActive ? 'text-gold' : 'text-text-muted'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gold" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
