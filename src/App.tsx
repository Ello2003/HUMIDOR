import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { HumidorInventory } from './components/HumidorInventory';
import { SmokeJournal } from './components/SmokeJournal';
import { CigarResearchHub } from './components/CigarResearchHub';
import { WishlistHunting } from './components/WishlistHunting';
import { ExportSuite } from './components/ExportSuite';
import { AddCigarModal } from './components/AddCigarModal';
import { LogSmokeModal } from './components/LogSmokeModal';
import { HumidorManagerModal } from './components/HumidorManagerModal';
import { HumidorManagerDrawer } from './components/HumidorManagerDrawer';
import { initialCigars, initialHumidors, initialSmokeLogs, initialWishlist } from './data/initialData';
import { INITIAL_RESEARCH_DATABASE } from './data/cigarDatabase';
import { Cigar, Humidor, SmokeLog, WishlistItem, CigarResearchItem } from './types';

export function App() {
  // Primary state with localStorage persistence
  const [cigars, setCigars] = useState<Cigar[]>(() => {
    const saved = localStorage.getItem('cedar_ash_cigars');
    return saved ? JSON.parse(saved) : initialCigars;
  });

  const [humidors, setHumidors] = useState<Humidor[]>(() => {
    const saved = localStorage.getItem('cedar_ash_humidors');
    return saved ? JSON.parse(saved) : initialHumidors;
  });

  const [smokeLogs, setSmokeLogs] = useState<SmokeLog[]>(() => {
    const saved = localStorage.getItem('cedar_ash_smokelogs');
    return saved ? JSON.parse(saved) : initialSmokeLogs;
  });

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const saved = localStorage.getItem('cedar_ash_wishlist');
    return saved ? JSON.parse(saved) : initialWishlist;
  });

  // Local Searchable Cigar Research Database
  const [researchDatabase, setResearchDatabase] = useState<CigarResearchItem[]>(() => {
    const saved = localStorage.getItem('cedar_ash_research_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved research db', e);
      }
    }
    return INITIAL_RESEARCH_DATABASE;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('cedar_ash_cigars', JSON.stringify(cigars));
  }, [cigars]);

  useEffect(() => {
    localStorage.setItem('cedar_ash_humidors', JSON.stringify(humidors));
  }, [humidors]);

  useEffect(() => {
    localStorage.setItem('cedar_ash_smokelogs', JSON.stringify(smokeLogs));
  }, [smokeLogs]);

  useEffect(() => {
    localStorage.setItem('cedar_ash_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('cedar_ash_research_db', JSON.stringify(researchDatabase));
  }, [researchDatabase]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals state
  const [isAddCigarOpen, setIsAddCigarOpen] = useState(false);
  const [cigarToEdit, setCigarToEdit] = useState<Cigar | null>(null);
  const [prefilledCigarData, setPrefilledCigarData] = useState<Partial<Cigar> | null>(null);

  const [isLogSmokeOpen, setIsLogSmokeOpen] = useState(false);
  const [selectedCigarForSmoke, setSelectedCigarForSmoke] = useState<Cigar | null>(null);
  const [logToEdit, setLogToEdit] = useState<SmokeLog | null>(null);

  const [isHumidorManagerOpen, setIsHumidorManagerOpen] = useState(false);
  const [isAddHumidorOpen, setIsAddHumidorOpen] = useState(false);
  const [humidorToEdit, setHumidorToEdit] = useState<Humidor | null>(null);

  // Cross-tab research query
  const [researchQuery, setResearchQuery] = useState<string>('Padrón 1964 Anniversary Series Exclusivo');

  // Handlers: Cigars
  const handleSaveCigar = (cigarData: Omit<Cigar, 'id' | 'createdAt'>, idToEdit?: string) => {
    if (idToEdit) {
      setCigars((prev) =>
        prev.map((c) => (c.id === idToEdit ? { ...cigarData, id: idToEdit, createdAt: c.createdAt } : c))
      );
    } else {
      const newCigar: Cigar = {
        ...cigarData,
        id: `cigar-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setCigars((prev) => [newCigar, ...prev]);
    }
  };

  const handleDeleteCigar = (cigarId: string) => {
    setCigars((prev) => prev.filter((c) => c.id !== cigarId));
  };

  const handleUpdateQuantity = (cigarId: string, newQty: number) => {
    setCigars((prev) => prev.map((c) => (c.id === cigarId ? { ...c, quantity: newQty } : c)));
  };

  const handleToggleFavorite = (cigarId: string) => {
    setCigars((prev) =>
      prev.map((c) => (c.id === cigarId ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  // Handlers: Smoking a cigar
  const handleTriggerSmoke = (cigarId: string) => {
    const cigar = cigars.find((c) => c.id === cigarId);
    if (cigar) {
      setSelectedCigarForSmoke(cigar);
      setLogToEdit(null);
      setIsLogSmokeOpen(true);
    }
  };

  const handleSaveSmokeLog = (
    logData: Omit<SmokeLog, 'id' | 'createdAt'>,
    deductStock: boolean,
    cigarId?: string,
    idToEdit?: string
  ) => {
    if (idToEdit) {
      setSmokeLogs((prev) =>
        prev.map((l) => (l.id === idToEdit ? { ...logData, id: idToEdit, createdAt: l.createdAt } : l))
      );
    } else {
      const newLog: SmokeLog = {
        ...logData,
        id: `smoke-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setSmokeLogs((prev) => [newLog, ...prev]);

      // Deduct stock if requested
      if (deductStock && cigarId) {
        setCigars((prev) =>
          prev.map((c) => (c.id === cigarId ? { ...c, quantity: Math.max(0, c.quantity - 1) } : c))
        );
      }
    }
  };

  const handleDeleteSmokeLog = (logId: string) => {
    setSmokeLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  // Handlers: Humidors
  const handleSaveHumidor = (hData: Omit<Humidor, 'id' | 'createdAt'>, idToEdit?: string) => {
    if (idToEdit) {
      setHumidors((prev) =>
        prev.map((h) => (h.id === idToEdit ? { ...hData, id: idToEdit, createdAt: h.createdAt } : h))
      );
    } else {
      const newHum: Humidor = {
        ...hData,
        id: `hum-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setHumidors((prev) => [...prev, newHum]);
    }
  };

  const handleDeleteHumidor = (id: string) => {
    setHumidors((prev) => prev.filter((h) => h.id !== id));
  };

  // Handlers: Wishlist
  const handleAddWishlistItem = (item: Omit<WishlistItem, 'id' | 'createdAt'>) => {
    const newItem: WishlistItem = {
      ...item,
      id: `wish-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setWishlist((prev) => [newItem, ...prev]);
  };

  const handleDeleteWishlistItem = (id: string) => {
    setWishlist((prev) => prev.filter((w) => w.id !== id));
  };

  const handleAcquireWishlistItem = (item: WishlistItem) => {
    // Open Add Cigar modal with prefilled data
    setPrefilledCigarData({
      brand: item.brand,
      name: item.name,
      vitola: item.vitola || 'Robusto',
      purchasePrice: item.targetPrice,
      notes: item.notes,
      quantity: 1,
    });
    setCigarToEdit(null);
    setIsAddCigarOpen(true);
    // Remove from wishlist
    handleDeleteWishlistItem(item.id);
  };

  // Handlers: Research Database
  const handleUpdateResearchCigar = (cigarId: string, updates: Partial<CigarResearchItem>) => {
    setResearchDatabase((prev) =>
      prev.map((item) => (item.id === cigarId ? { ...item, ...updates } : item))
    );
  };

  const handleAddCustomResearchCigar = (newCigar: CigarResearchItem) => {
    setResearchDatabase((prev) => [newCigar, ...prev]);
  };

  // Handlers: Research jump
  const handleOpenResearchForCigar = (cigar: Cigar) => {
    setResearchQuery(`${cigar.brand} ${cigar.name}`);
    setActiveTab('research');
  };

  const handleResearchFromExternal = (query: string) => {
    setResearchQuery(query);
    setActiveTab('research');
  };

  // Direct smoke logger from research
  const handleLogSmokeFromResearch = (
    cigarName: string,
    brand: string,
    vitola: string,
    wrapper: string,
    origin: string
  ) => {
    // Find matching cigar in humidor if exists
    const matchingCigar = cigars.find(
      (c) => c.brand.toLowerCase() === brand.toLowerCase() && c.name.toLowerCase().includes(cigarName.toLowerCase())
    );

    if (matchingCigar) {
      setSelectedCigarForSmoke(matchingCigar);
    } else {
      setSelectedCigarForSmoke(null);
    }
    setLogToEdit(null);
    setIsLogSmokeOpen(true);
  };

  // Vault import
  const handleImportVault = (data: {
    cigars?: Cigar[];
    humidors?: Humidor[];
    smokeLogs?: SmokeLog[];
    wishlist?: WishlistItem[];
    researchDatabase?: CigarResearchItem[];
  }) => {
    if (data.cigars) setCigars(data.cigars);
    if (data.humidors) setHumidors(data.humidors);
    if (data.smokeLogs) setSmokeLogs(data.smokeLogs);
    if (data.wishlist) setWishlist(data.wishlist);
    if (data.researchDatabase) setResearchDatabase(data.researchDatabase);
  };

  return (
    <div className="min-h-screen bg-[#0F0D0C] text-[#E5E1DA] flex flex-col font-sans selection:bg-[#2C2621] selection:text-[#D4AF37]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cigars={cigars}
        humidors={humidors}
        smokeLogs={smokeLogs}
        onOpenAddCigar={() => {
          setCigarToEdit(null);
          setPrefilledCigarData(null);
          setIsAddCigarOpen(true);
        }}
        onOpenLogSmoke={() => {
          setSelectedCigarForSmoke(null);
          setLogToEdit(null);
          setIsLogSmokeOpen(true);
        }}
        onOpenHumidors={() => setIsHumidorManagerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            cigars={cigars}
            humidors={humidors}
            smokeLogs={smokeLogs}
            onNavigate={(tab) => setActiveTab(tab)}
            onSmokeCigar={handleTriggerSmoke}
            onOpenAddCigar={() => {
              setCigarToEdit(null);
              setPrefilledCigarData(null);
              setIsAddCigarOpen(true);
            }}
            onOpenHumidors={() => setIsHumidorManagerOpen(true)}
          />
        )}

        {activeTab === 'inventory' && (
          <HumidorInventory
            cigars={cigars}
            humidors={humidors}
            onAddCigar={() => {
              setCigarToEdit(null);
              setPrefilledCigarData(null);
              setIsAddCigarOpen(true);
            }}
            onEditCigar={(cigar) => {
              setCigarToEdit(cigar);
              setPrefilledCigarData(null);
              setIsAddCigarOpen(true);
            }}
            onDeleteCigar={handleDeleteCigar}
            onUpdateQuantity={handleUpdateQuantity}
            onToggleFavorite={handleToggleFavorite}
            onSmokeCigar={handleTriggerSmoke}
            onOpenResearchForCigar={handleOpenResearchForCigar}
          />
        )}

        {activeTab === 'journal' && (
          <SmokeJournal
            logs={smokeLogs}
            cigars={cigars}
            onOpenLogSmoke={() => {
              setSelectedCigarForSmoke(null);
              setLogToEdit(null);
              setIsLogSmokeOpen(true);
            }}
            onEditLog={(log) => {
              setLogToEdit(log);
              setSelectedCigarForSmoke(null);
              setIsLogSmokeOpen(true);
            }}
            onDeleteLog={handleDeleteSmokeLog}
          />
        )}

        {activeTab === 'research' && (
          <CigarResearchHub
            cigars={cigars}
            researchDatabase={researchDatabase}
            onUpdateResearchCigar={handleUpdateResearchCigar}
            onAddCustomResearchCigar={handleAddCustomResearchCigar}
            initialResearchQuery={researchQuery}
            onAddCigarFromResearch={(prefill) => {
              setPrefilledCigarData(prefill);
              setCigarToEdit(null);
              setIsAddCigarOpen(true);
            }}
            onAddToWishlist={(item) => {
              handleAddWishlistItem({
                brand: item.brand,
                name: item.name,
                vitola: item.vitola,
                notes: item.notes,
                priority: 'High',
              });
              setActiveTab('wishlist');
            }}
            onLogSmokeFromResearch={handleLogSmokeFromResearch}
          />
        )}

        {activeTab === 'wishlist' && (
          <WishlistHunting
            wishlist={wishlist}
            onAddWishlistItem={handleAddWishlistItem}
            onDeleteWishlistItem={handleDeleteWishlistItem}
            onAcquireItem={handleAcquireWishlistItem}
            onResearchCigar={handleResearchFromExternal}
          />
        )}

        {activeTab === 'export' && (
          <ExportSuite
            cigars={cigars}
            humidors={humidors}
            smokeLogs={smokeLogs}
            wishlist={wishlist}
            researchDatabase={researchDatabase}
            onImportVault={handleImportVault}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <AddCigarModal
        isOpen={isAddCigarOpen}
        onClose={() => {
          setIsAddCigarOpen(false);
          setCigarToEdit(null);
          setPrefilledCigarData(null);
        }}
        onSave={handleSaveCigar}
        humidors={humidors}
        cigarToEdit={cigarToEdit}
        prefilledData={prefilledCigarData}
      />

      <LogSmokeModal
        isOpen={isLogSmokeOpen}
        onClose={() => {
          setIsLogSmokeOpen(false);
          setSelectedCigarForSmoke(null);
          setLogToEdit(null);
        }}
        onSave={(log, deductCigarId) =>
          handleSaveSmokeLog(log, !!deductCigarId, deductCigarId, logToEdit?.id)
        }
        cigars={cigars}
        preselectedCigarId={selectedCigarForSmoke?.id}
        logToEdit={logToEdit}
      />

      <HumidorManagerDrawer
        isOpen={isHumidorManagerOpen}
        onClose={() => setIsHumidorManagerOpen(false)}
        humidors={humidors}
        cigars={cigars}
        onOpenAddHumidor={() => {
          setHumidorToEdit(null);
          setIsAddHumidorOpen(true);
        }}
        onEditHumidor={(h) => {
          setHumidorToEdit(h);
          setIsAddHumidorOpen(true);
        }}
        onDeleteHumidor={handleDeleteHumidor}
      />

      <HumidorManagerModal
        isOpen={isAddHumidorOpen}
        onClose={() => {
          setIsAddHumidorOpen(false);
          setHumidorToEdit(null);
        }}
        onSave={handleSaveHumidor}
        humidorToEdit={humidorToEdit}
      />

      {/* Footer */}
      <footer className="mt-auto py-5 border-t border-[#2C2621] bg-[#13110F] text-center text-xs text-[#A89F94]">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span className="font-serif tracking-wider text-[#D4AF37]">🍂 Cedar & Ash Personal Humidor & Research Suite</span>
          <span className="text-[11px] text-[#A89F94]/70">Offline-First Local Storage • Curated Brand Database • Complete JSON & CSV Export</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
