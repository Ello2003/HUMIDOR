import React from 'react';
import {
  Droplets,
  Thermometer,
  Calendar,
  Flame,
  Star,
  Sparkles,
  TrendingUp,
  Box,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  BarChart3,
  Award,
  Timer,
  Coffee,
  Heart,
} from 'lucide-react';
import { Cigar, Humidor, SmokeLog } from '../types';
import { calculateRestDays } from '../utils/exportUtils';
import { formatCurrency } from '../utils/currencyUtils';

interface DashboardOverviewProps {
  cigars: Cigar[];
  humidors: Humidor[];
  smokeLogs: SmokeLog[];
  onNavigate: (tab: 'inventory' | 'journal' | 'research' | 'wishlist' | 'export') => void;
  onSmokeCigar: (cigarId: string) => void;
  onOpenAddCigar: () => void;
  onOpenHumidors: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  cigars,
  humidors,
  smokeLogs,
  onNavigate,
  onSmokeCigar,
  onOpenAddCigar,
  onOpenHumidors,
}) => {
  const totalSticks = cigars.reduce((acc, c) => acc + (c.quantity || 0), 0);
  const totalValuation = cigars.reduce((acc, c) => acc + (c.purchasePrice || 0) * (c.quantity || 0), 0);
  const readyToSmoke = cigars.filter((c) => c.status === 'ready' && c.quantity > 0);
  const agingSticks = cigars.filter((c) => (c.status === 'aging' || c.status === 'resting') && c.quantity > 0);
  const specialOccasionSticks = cigars.filter((c) => c.status === 'special_occasion' && c.quantity > 0);

  // Group origins
  const originCounts: Record<string, number> = cigars.reduce((acc: Record<string, number>, c) => {
    acc[c.countryOrigin] = (acc[c.countryOrigin] || 0) + (c.quantity || 0);
    return acc;
  }, {});

  const sortedOrigins: [string, number][] = Object.entries(originCounts).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  );

  // Group strengths
  const strengthCounts: Record<string, number> = cigars.reduce((acc: Record<string, number>, c) => {
    acc[c.strength] = (acc[c.strength] || 0) + (c.quantity || 0);
    return acc;
  }, {});

  const primaryHumidor = humidors[0] || {
    id: 'primary',
    name: 'Main Cabinet Humidor',
    currentHumidity: 69.2,
    targetHumidity: 69.0,
    currentTemp: 70.4,
    targetTemp: 70.0,
    tempUnit: 'F',
    maxCapacity: 150,
  };

  // Personal Smoke Statistics from Smoke Logs
  const totalCigarsSmoked = smokeLogs.length;
  const totalDurationMinutes = smokeLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
  const avgDurationMinutes = totalCigarsSmoked > 0 ? Math.round(totalDurationMinutes / totalCigarsSmoked) : 0;
  const totalHoursInvested = (totalDurationMinutes / 60).toFixed(1);
  const avgOverallScore =
    totalCigarsSmoked > 0
      ? (smokeLogs.reduce((acc, log) => acc + (log.overallScore || 0), 0) / totalCigarsSmoked).toFixed(1)
      : '0';
  const avgStars =
    totalCigarsSmoked > 0
      ? (smokeLogs.reduce((acc, log) => acc + (log.starRating || 0), 0) / totalCigarsSmoked).toFixed(1)
      : '0';

  // Favorite Wrapper Types from smoke logs
  const wrapperCounts: Record<string, number> = smokeLogs.reduce((acc: Record<string, number>, log) => {
    if (log.wrapper && log.wrapper.trim()) {
      const cleanWrapper = log.wrapper.trim();
      acc[cleanWrapper] = (acc[cleanWrapper] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedWrappers: [string, number][] = Object.entries(wrapperCounts).sort(
    (a, b) => b[1] - a[1]
  );

  // Top Smoked Brands
  const brandCounts: Record<string, number> = smokeLogs.reduce((acc: Record<string, number>, log) => {
    if (log.cigarBrand && log.cigarBrand.trim()) {
      const cleanBrand = log.cigarBrand.trim();
      acc[cleanBrand] = (acc[cleanBrand] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedBrands: [string, number][] = Object.entries(brandCounts).sort(
    (a, b) => b[1] - a[1]
  );

  // Top Drink Pairings
  const drinkCounts: Record<string, number> = smokeLogs.reduce((acc: Record<string, number>, log) => {
    if (log.pairingDrink && log.pairingDrink.trim()) {
      const cleanDrink = log.pairingDrink.trim();
      acc[cleanDrink] = (acc[cleanDrink] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedDrinks: [string, number][] = Object.entries(drinkCounts).sort(
    (a, b) => b[1] - a[1]
  );

  // Box-Worthy Rebuy Percentage
  const boxWorthyCount = smokeLogs.filter(
    (l) => l.wouldRebuy === 'Box Worthy' || l.wouldRebuy === '5-Pack Buy'
  ).length;
  const boxWorthyRate = totalCigarsSmoked > 0 ? Math.round((boxWorthyCount / totalCigarsSmoked) * 100) : 0;

  // Dominant Flavor Frequency across all logs
  const flavorCounts: Record<string, number> = smokeLogs.reduce((acc: Record<string, number>, log) => {
    const allNotes = [
      ...(log.dominantFlavors || []),
      ...(log.firstThirdNotes || []),
      ...(log.secondThirdNotes || []),
      ...(log.finalThirdNotes || []),
    ];
    allNotes.forEach((flavor) => {
      if (flavor && flavor.trim()) {
        const cleanFlavor = flavor.trim();
        acc[cleanFlavor] = (acc[cleanFlavor] || 0) + 1;
      }
    });
    return acc;
  }, {});

  const sortedFlavors: [string, number][] = Object.entries(flavorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Inspiration */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#1C1816] via-[#161311] to-[#13110F] border border-[#2C2621] p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#1C1816] border border-[#2C2621] text-[#D4AF37] text-[10px] font-semibold uppercase tracking-[0.25em] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Master Tobacconist & Vault Control</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-normal text-white tracking-tight mb-3">
            Personal Humidor & Tasting Sanctuary
          </h1>
          <p className="text-sm sm:text-base text-[#A89F94] mb-6 leading-relaxed">
            Manage Spanish cedar vaults, monitor climate curves, record multi-third tasting sessions, and summon
            AI-powered sommelier dossiers for rare vitolas and bespoke pairings.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('research')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] font-bold text-xs uppercase tracking-widest rounded-md shadow-sm transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0F0D0C]" />
              <span>Ask Sommelier: "What to smoke tonight?"</span>
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1816] hover:bg-[#241E1B] text-[#E5E1DA] border border-[#2C2621] hover:border-[#8B5E3C] text-xs uppercase tracking-wider font-medium rounded-md transition cursor-pointer"
            >
              <Box className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Explore Humidor Inventory</span>
            </button>
            <button
              onClick={() => onNavigate('export')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1816] hover:bg-[#241E1B] text-[#A89F94] hover:text-[#E5E1DA] border border-[#2C2621] text-xs uppercase tracking-wider font-medium rounded-md transition cursor-pointer"
            >
              <span>Download Backups & Reports</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none text-9xl font-serif select-none translate-x-8 translate-y-8 text-[#D4AF37]">
          🍂
        </div>
      </div>

      {/* Main Status Cards Grid matching Design layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Cabinet Status (8 cols) */}
        <div className="lg:col-span-8 bg-gradient-to-br from-[#1C1816] to-[#161311] border border-[#2C2621] rounded-lg p-6 flex flex-col justify-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] mb-3">
            {primaryHumidor.name} • Climate Status
          </div>
          <div className="flex flex-wrap items-end justify-between gap-6 sm:gap-10">
            <div className="flex items-baseline">
              <span className="text-5xl sm:text-6xl font-serif text-white">{primaryHumidor.currentHumidity}</span>
              <span className="text-xl sm:text-2xl text-[#A89F94] ml-2">% RH</span>
            </div>
            <div className="flex items-baseline">
              <span className="text-4xl sm:text-5xl font-serif text-white">{primaryHumidor.currentTemp}</span>
              <span className="text-lg sm:text-xl text-[#A89F94] ml-1.5">°{primaryHumidor.tempUnit || 'F'}</span>
            </div>
            <div className="flex-1 min-w-[200px] border-t sm:border-t-0 sm:border-l border-[#2C2621] sm:pl-8 pt-4 sm:pt-0">
              <div className="text-xs text-[#A89F94] mb-2 italic">Cellar Stability: Optimal Range (68-70%)</div>
              <div className="h-1.5 bg-[#2C2621] rounded-full overflow-hidden">
                <div className="h-full bg-[#D4AF37] w-[92%] rounded-full"></div>
              </div>
              <div className="flex justify-between text-[10px] text-[#A89F94] uppercase tracking-wider mt-2">
                <span>Target {primaryHumidor.targetHumidity}% RH</span>
                <span className="text-[#D4AF37]">Calibrated Sensor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Collection Valuation (4 cols) */}
        <div className="lg:col-span-4 bg-[#1C1816] border border-[#2C2621] rounded-lg p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#A89F94]">Vault Valuation</h3>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#13110F] text-[#D4AF37] border border-[#2C2621]">
              {totalSticks} Sticks
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-serif text-white">{formatCurrency(totalValuation, '£')}</div>
            <div className="text-xs text-[#D4AF37] mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Curated across {humidors.length} active humidors</span>
            </div>
          </div>
          <div className="text-[11px] text-[#A89F94] border-t border-[#2C2621] pt-3 flex justify-between">
            <span>Avg Stick: {formatCurrency(totalSticks > 0 ? totalValuation / totalSticks : 0, '£')}</span>
            <span className="text-[#E5E1DA] font-medium">Ready: {readyToSmoke.reduce((a, b) => a + b.quantity, 0)}</span>
          </div>
        </div>
      </div>

      {/* Humidor Environment Monitoring Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Box className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#E5E1DA]">Humidor Vault Monitoring</h2>
          </div>
          <button
            onClick={onOpenHumidors}
            className="text-xs uppercase tracking-wider text-[#D4AF37] hover:brightness-125 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <span>Configure Humidors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {humidors.map((h) => {
            const cigarsInHum = cigars.filter((c) => c.humidorId === h.id);
            const count = cigarsInHum.reduce((acc, c) => acc + (c.quantity || 0), 0);
            const capacityPercent = Math.min(100, Math.round((count / (h.maxCapacity || 50)) * 100));
            const isRhOptimal = Math.abs(h.currentHumidity - h.targetHumidity) <= 2;

            return (
              <div
                key={h.id}
                className="bg-[#1C1816] border border-[#2C2621] rounded-lg p-5 shadow-sm flex flex-col justify-between hover:border-[#3D352E] transition"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-serif font-semibold text-[#E5E1DA] text-sm">{h.name}</h3>
                      <p className="text-[11px] text-[#A89F94]">{h.location} • {h.type}</p>
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                        isRhOptimal
                          ? 'bg-[#13110F] text-[#D4AF37] border-[#2C2621]'
                          : 'bg-[#8B5E3C]/20 text-amber-300 border-[#8B5E3C]'
                      }`}
                    >
                      {isRhOptimal ? 'Optimal' : 'Check RH'}
                    </span>
                  </div>

                  {/* RH% & Temp Gauges */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-[#13110F] border border-[#2C2621] rounded-md">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded bg-[#1C1816] text-[#D4AF37] border border-[#2C2621]">
                        <Droplets className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-base font-serif font-bold text-white">{h.currentHumidity}%</div>
                        <div className="text-[10px] text-[#A89F94]">Target {h.targetHumidity}% RH</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded bg-[#1C1816] text-[#D4AF37] border border-[#2C2621]">
                        <Thermometer className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-base font-serif font-bold text-white">
                          {h.currentTemp}°{h.tempUnit || 'F'}
                        </div>
                        <div className="text-[10px] text-[#A89F94]">Target {h.targetTemp}°</div>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1 my-3">
                    <div className="flex justify-between text-xs text-[#A89F94]">
                      <span>Occupancy</span>
                      <span className="font-medium text-[#E5E1DA]">
                        {count} / {h.maxCapacity} sticks ({capacityPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#13110F] rounded-full h-1.5 overflow-hidden border border-[#2C2621]">
                      <div
                        className="bg-[#D4AF37] h-full rounded-full transition-all duration-500"
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2C2621] text-[11px] text-[#A89F94] flex items-center justify-between">
                  <span className="truncate">📦 {h.bovedaPackType}</span>
                  <span className="text-[#D4AF37] font-medium">
                    {h.hygrometerModel || 'Digital'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Readiness & Aging Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ready to Smoke */}
        <div className="bg-[#1C1816] border border-[#2C2621] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💨</span>
              <h3 className="text-xs uppercase tracking-widest font-semibold text-[#E5E1DA]">Ready to Smoke</h3>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37] px-2 py-0.5 bg-[#13110F] border border-[#2C2621] rounded">
              {readyToSmoke.reduce((a, b) => a + b.quantity, 0)} sticks
            </span>
          </div>
          <p className="text-xs text-[#A89F94] mb-3">
            Properly acclimated and at peak resting window for tonight's smoke.
          </p>

          <div className="space-y-2">
            {readyToSmoke.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2.5 rounded bg-[#13110F] border border-[#2C2621] text-xs"
              >
                <div className="truncate mr-2">
                  <div className="font-semibold text-[#E5E1DA] truncate">{c.brand} {c.name}</div>
                  <div className="text-[10px] text-[#A89F94]">{c.vitola} • {c.strength}</div>
                </div>
                <button
                  onClick={() => onSmokeCigar(c.id)}
                  className="px-2.5 py-1 bg-[#2C2621] hover:bg-[#8B5E3C] text-[#E5E1DA] hover:text-white rounded text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap transition cursor-pointer"
                >
                  Smoke 1
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Long-term Aging Vault */}
        <div className="bg-[#1C1816] border border-[#2C2621] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🪵</span>
              <h3 className="text-xs uppercase tracking-widest font-semibold text-[#E5E1DA]">Aging Vault</h3>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#A89F94] px-2 py-0.5 bg-[#13110F] border border-[#2C2621] rounded">
              {agingSticks.reduce((a, b) => a + b.quantity, 0)} sticks
            </span>
          </div>
          <p className="text-xs text-[#A89F94] mb-3">
            Gaining complexity and mellowing strong tannins in cedar boxes.
          </p>

          <div className="space-y-2">
            {agingSticks.slice(0, 3).map((c) => {
              const restDays = calculateRestDays(c.purchaseDate);
              const targetDays = c.targetRestMonths * 30;
              const progress = Math.min(100, Math.round((restDays / (targetDays || 1)) * 100));

              return (
                <div
                  key={c.id}
                  className="p-2.5 rounded bg-[#13110F] border border-[#2C2621] text-xs space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#E5E1DA] truncate">{c.brand} {c.name}</span>
                    <span className="text-[10px] text-[#D4AF37] font-serif">{restDays}d rested</span>
                  </div>
                  <div className="w-full bg-[#1C1816] rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-[#D4AF37] h-full rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Special Occasion Reserves */}
        <div className="bg-[#1C1816] border border-[#2C2621] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌟</span>
              <h3 className="text-xs uppercase tracking-widest font-semibold text-[#E5E1DA]">Special Reserves</h3>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37] px-2 py-0.5 bg-[#13110F] border border-[#2C2621] rounded">
              {specialOccasionSticks.reduce((a, b) => a + b.quantity, 0)} sticks
            </span>
          </div>
          <p className="text-xs text-[#A89F94] mb-3">
            Rare vitolas, cask-aged blends, and vintage box-press sticks.
          </p>

          <div className="space-y-2">
            {specialOccasionSticks.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2.5 rounded bg-[#13110F] border border-[#2C2621] text-xs"
              >
                <div className="truncate">
                  <div className="font-semibold text-[#E5E1DA] truncate">{c.brand} {c.name}</div>
                  <div className="text-[10px] text-[#A89F94]">{c.vitola} • {c.countryOrigin}</div>
                </div>
                <span className="text-[#D4AF37] font-serif font-bold text-xs">
                  {c.personalRating ? `★ ${c.personalRating}` : 'Rare'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Personal Statistics & Connoisseur Insights Section */}
      <div className="bg-gradient-to-br from-[#1C1816] via-[#171311] to-[#13110F] border border-[#2C2621] rounded-lg p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2C2621]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#241E1B] border border-[#382E26] flex items-center justify-center text-[#D4AF37] shadow-inner">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-[#E5E1DA]">Personal Smoking Statistics</h2>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded">
                  Palate Insights
                </span>
              </div>
              <p className="text-xs text-[#A89F94] mt-0.5">
                Calculated in real-time from {totalCigarsSmoked} documented smoke logs in your tasting journal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSmokeCigar('')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
            >
              <Flame className="w-3.5 h-3.5 fill-[#0F0D0C]" />
              <span>Log Smoke</span>
            </button>
            <button
              onClick={() => onNavigate('journal')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#241E1B] hover:bg-[#2C2621] text-[#E5E1DA] border border-[#382E26] rounded text-xs uppercase tracking-wider font-semibold transition cursor-pointer"
            >
              <span>View Journal</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
          </div>
        </div>

        {totalCigarsSmoked > 0 ? (
          <div className="space-y-6 pt-5">
            {/* Top 4 Key Metric Tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Total Smoked */}
              <div className="p-4 rounded-lg bg-[#13110F] border border-[#2C2621] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#A89F94] mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold">Total Cigars Smoked</span>
                  <Flame className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                    {totalCigarsSmoked}
                  </div>
                  <div className="text-[11px] text-[#A89F94] mt-1">
                    {totalHoursInvested} hrs total tasting time
                  </div>
                </div>
              </div>

              {/* Metric 2: Average Smoke Duration */}
              <div className="p-4 rounded-lg bg-[#13110F] border border-[#2C2621] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#A89F94] mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold">Avg Smoke Duration</span>
                  <Timer className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#D4AF37] tracking-tight">
                    {avgDurationMinutes} <span className="text-sm font-sans text-[#A89F94] font-normal">min</span>
                  </div>
                  <div className="text-[11px] text-[#A89F94] mt-1">
                    Paced leisurely draw
                  </div>
                </div>
              </div>

              {/* Metric 3: Average Rating */}
              <div className="p-4 rounded-lg bg-[#13110F] border border-[#2C2621] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#A89F94] mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold">Average Rating</span>
                  <Star className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                    {avgOverallScore} <span className="text-sm font-sans text-[#A89F94] font-normal">/ 100</span>
                  </div>
                  <div className="text-[11px] text-[#D4AF37] mt-1">
                    ★ {avgStars} / 5 • {boxWorthyRate}% rebuy rate
                  </div>
                </div>
              </div>

              {/* Metric 4: Top Favorite Wrapper */}
              <div className="p-4 rounded-lg bg-[#13110F] border border-[#2C2621] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#A89F94] mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold">Favorite Wrapper</span>
                  <Award className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-serif font-bold text-[#E5E1DA] truncate" title={sortedWrappers[0]?.[0] || 'N/A'}>
                    {sortedWrappers[0]?.[0] || 'None'}
                  </div>
                  <div className="text-[11px] text-[#A89F94] mt-1">
                    {sortedWrappers[0] ? `${sortedWrappers[0][1]} sticks (${Math.round((sortedWrappers[0][1] / totalCigarsSmoked) * 100)}%)` : 'No logs yet'}
                  </div>
                </div>
              </div>
            </div>

            {/* In-Depth Breakdown Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Breakdown 1: Favorite Wrapper Types */}
              <div className="p-4 rounded-lg bg-[#13110F] border border-[#2C2621] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#2C2621]">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#E5E1DA] flex items-center gap-1.5">
                    <span className="text-sm">🍂</span>
                    <span>Favorite Wrapper Types</span>
                  </h3>
                  <span className="text-[10px] text-[#D4AF37] font-medium">{sortedWrappers.length} varieties</span>
                </div>
                <div className="space-y-2.5">
                  {sortedWrappers.slice(0, 4).map(([wrapper, count], idx) => {
                    const percentage = Math.round((count / totalCigarsSmoked) * 100);
                    return (
                      <div key={wrapper} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#E5E1DA] font-medium truncate pr-2">
                            {idx + 1}. {wrapper}
                          </span>
                          <span className="text-[#D4AF37] font-mono text-[11px] whitespace-nowrap">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#1C1816] rounded-full h-1.5 overflow-hidden border border-[#2C2621]">
                          <div
                            className="bg-[#D4AF37] h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Breakdown 2: Top Smoked Brands */}
              <div className="p-4 rounded-lg bg-[#13110F] border border-[#2C2621] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#2C2621]">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#E5E1DA] flex items-center gap-1.5">
                    <span className="text-sm">🏷️</span>
                    <span>Top Smoked Brands</span>
                  </h3>
                  <span className="text-[10px] text-[#D4AF37] font-medium">{sortedBrands.length} marcas</span>
                </div>
                <div className="space-y-2.5">
                  {sortedBrands.slice(0, 4).map(([brand, count], idx) => {
                    const percentage = Math.round((count / totalCigarsSmoked) * 100);
                    return (
                      <div key={brand} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#E5E1DA] font-medium truncate pr-2">
                            {idx + 1}. {brand}
                          </span>
                          <span className="text-[#D4AF37] font-mono text-[11px] whitespace-nowrap">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#1C1816] rounded-full h-1.5 overflow-hidden border border-[#2C2621]">
                          <div
                            className="bg-[#8B5E3C] h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Breakdown 3: Preferred Drink Pairings & Flavors */}
              <div className="p-4 rounded-lg bg-[#13110F] border border-[#2C2621] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#2C2621]">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#E5E1DA] flex items-center gap-1.5">
                    <span className="text-sm">🥃</span>
                    <span>Pairings & Palate Profile</span>
                  </h3>
                  <span className="text-[10px] text-[#D4AF37] font-medium">Trends</span>
                </div>

                {/* Top Drinks */}
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-[#A89F94]">Top Beverages:</div>
                  <div className="space-y-1">
                    {sortedDrinks.slice(0, 2).map(([drink, count]) => (
                      <div key={drink} className="flex justify-between text-xs text-[#E5E1DA]">
                        <span className="truncate pr-2">🍹 {drink}</span>
                        <span className="text-[#D4AF37] font-serif font-bold text-[11px]">{count}x</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Flavor Tags */}
                {sortedFlavors.length > 0 && (
                  <div className="pt-2 border-t border-[#2C2621] space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-[#A89F94]">Frequent Flavor Notes:</div>
                    <div className="flex flex-wrap gap-1">
                      {sortedFlavors.map(([flavor]) => (
                        <span
                          key={flavor}
                          className="px-2 py-0.5 bg-[#1C1816] border border-[#2C2621] text-[#D4AF37] rounded text-[10px] font-medium"
                        >
                          {flavor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <Flame className="w-8 h-8 text-[#A89F94]/50 mx-auto" />
            <div className="text-sm font-serif font-bold text-[#E5E1DA]">No Smoking Sessions Logged Yet</div>
            <p className="text-xs text-[#A89F94] max-w-md mx-auto">
              Start logging your cigar smoking sessions with tasting notes, burn ratings, and the live smoking timer to generate your personal connoisseur statistics.
            </p>
            <button
              onClick={() => onSmokeCigar('')}
              className="mt-2 px-4 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Log First Cigar Session
            </button>
          </div>
        )}
      </div>

      {/* Curated Tasting Notes & Collection Breakdown matching design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Curated Tasting Notes (8 cols) */}
        <div className="lg:col-span-8 bg-[#13110F] border border-[#2C2621] rounded-lg overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#2C2621] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="font-serif italic text-lg text-[#E5E1DA]">Curated Tasting Notes</h3>
              <span className="text-[10px] bg-[#2C2621] px-2 py-0.5 rounded text-[#D4AF37] uppercase tracking-widest font-medium">
                Private Archive
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate('export')}
                className="px-3.5 py-1.5 bg-[#2C2621] text-xs uppercase tracking-widest text-[#E5E1DA] hover:bg-[#3D352E] rounded transition cursor-pointer"
              >
                Export PDF
              </button>
              <button
                onClick={() => onNavigate('journal')}
                className="px-3.5 py-1.5 bg-[#D4AF37] text-[#0F0D0C] text-xs font-bold uppercase tracking-widest hover:brightness-110 rounded transition cursor-pointer"
              >
                View Journal
              </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            {smokeLogs.slice(0, 3).map((l) => {
              const formattedDate = l.smokedAt ? new Date(l.smokedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() : 'RECENT';
              const stars = '★'.repeat(l.starRating || 5) + '☆'.repeat(Math.max(0, 5 - (l.starRating || 5)));
              return (
                <div
                  key={l.id}
                  className="bg-[#1C1816] border border-[#2C2621] p-4 rounded-md flex flex-col justify-between gap-3 hover:border-[#3D352E] transition"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-[10px] uppercase font-serif text-[#D4AF37]">{formattedDate}</div>
                      <div className="text-xs text-[#D4AF37]">{stars}</div>
                    </div>
                    <div className="text-sm font-semibold uppercase tracking-tight text-[#E5E1DA]">
                      {l.cigarBrand} {l.cigarName}
                    </div>
                    <p className="text-xs text-[#A89F94] leading-relaxed italic line-clamp-3">
                      "{l.detailedReview}"
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#2C2621] flex items-center justify-between text-[10px] text-[#A89F94]">
                    <span>🥃 {l.pairingDrink}</span>
                    <span className="text-[#D4AF37] font-serif font-bold">{l.overallScore}/100</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-12 bg-[#1C1816] border-t border-[#2C2621] px-6 flex items-center justify-between text-[10px] text-[#A89F94] uppercase tracking-[0.2em]">
            <div>Total Sticks: {totalSticks}</div>
            <div>Avg Rating: ★ {smokeLogs.length > 0 ? (smokeLogs.reduce((a, b) => a + b.overallScore, 0) / smokeLogs.length).toFixed(1) : 'N/A'}</div>
            <div>Cabinets: {humidors.length} Active</div>
          </div>
        </div>

        {/* Terroir & Strength Breakdown (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Origins */}
          <div className="bg-[#1C1816] border border-[#2C2621] rounded-lg p-5">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#E5E1DA] mb-3 flex items-center gap-2">
              <span>🌍 Terroir & Origin</span>
            </h3>
            <div className="space-y-2.5">
              {sortedOrigins.slice(0, 4).map(([origin, count]) => {
                const percent = Math.round((count / totalSticks) * 100) || 0;
                return (
                  <div key={origin} className="space-y-1">
                    <div className="flex justify-between text-xs text-[#A89F94]">
                      <span>{origin}</span>
                      <span className="font-serif text-[#D4AF37]">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#13110F] rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-[#D4AF37] h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strength Distribution */}
          <div className="bg-[#1C1816] border border-[#2C2621] rounded-lg p-5">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#E5E1DA] mb-3">
              <span>⚡ Strength Distribution</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['Mild', 'Mild-Medium', 'Medium', 'Medium-Full', 'Full'].map((lvl) => (
                <div key={lvl} className="p-2 rounded bg-[#13110F] border border-[#2C2621]">
                  <div className="text-[#A89F94] text-[10px] uppercase font-semibold">{lvl}</div>
                  <div className="text-sm font-serif font-bold text-[#E5E1DA]">
                    {strengthCounts[lvl] || 0} <span className="text-[10px] text-[#A89F94] font-normal">sticks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

