import React, { useState, useMemo } from 'react';
import {
  Flame,
  Star,
  Coffee,
  Calendar,
  MapPin,
  Clock,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SmokeLog, Cigar } from '../types';

interface SmokeJournalProps {
  logs: SmokeLog[];
  cigars: Cigar[];
  onOpenLogSmoke: () => void;
  onEditLog: (log: SmokeLog) => void;
  onDeleteLog: (logId: string) => void;
}

export const SmokeJournal: React.FC<SmokeJournalProps> = ({
  logs,
  cigars,
  onOpenLogSmoke,
  onEditLog,
  onDeleteLog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [rebuyFilter, setRebuyFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(logs[0]?.id || null);

  const filteredLogs = useMemo(() => {
    return logs
      .filter((l) => {
        if (ratingFilter === '95+' && l.overallScore < 95) return false;
        if (ratingFilter === '90+' && l.overallScore < 90) return false;
        if (ratingFilter === '85+' && l.overallScore < 85) return false;
        if (rebuyFilter !== 'all' && l.wouldRebuy !== rebuyFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            l.cigarBrand.toLowerCase().includes(q) ||
            l.cigarName.toLowerCase().includes(q) ||
            l.location.toLowerCase().includes(q) ||
            (l.occasion && l.occasion.toLowerCase().includes(q)) ||
            (l.pairingDrink && l.pairingDrink.toLowerCase().includes(q)) ||
            (l.detailedReview && l.detailedReview.toLowerCase().includes(q)) ||
            (l.dominantFlavors && l.dominantFlavors.some((f) => f.toLowerCase().includes(q)));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.smokedAt).getTime() - new Date(a.smokedAt).getTime());
  }, [logs, ratingFilter, rebuyFilter, searchQuery]);

  const avgOverallScore =
    logs.length > 0 ? (logs.reduce((acc, l) => acc + l.overallScore, 0) / logs.length).toFixed(1) : 'N/A';

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-gradient-to-br from-[#1C1816] via-[#161311] to-[#13110F] border border-[#2C2621] rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#D4AF37]" />
            <h1 className="text-xl sm:text-2xl font-serif text-white font-normal">
              Connoisseur Tasting Journal
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A89F94] mt-1">
            Personal archive of tasting sessions, 3-thirds flavor arcs, beverage pairings, and ratings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-[#13110F] border border-[#2C2621] rounded-md text-xs">
            <span className="text-[#A89F94]">Total Smokes: </span>
            <strong className="text-[#D4AF37] font-serif">{logs.length}</strong>
            <span className="text-[#3D352E] mx-2">|</span>
            <span className="text-[#A89F94]">Avg Score: </span>
            <strong className="text-[#D4AF37] font-serif">★ {avgOverallScore}</strong>
          </div>

          <button
            onClick={onOpenLogSmoke}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] rounded-md text-xs uppercase tracking-widest font-bold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record New Smoke</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-[#1C1816] border border-[#2C2621] rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <input
            type="text"
            placeholder="Search smokes, locations, pairings, flavor notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37] placeholder-[#A89F94]/60"
          />
        </div>

        <div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
          >
            <option value="all">All Score Ratings</option>
            <option value="95+">★ 95+ Points (World-Class Masters)</option>
            <option value="90+">★ 90+ Points (Outstanding)</option>
            <option value="85+">★ 85+ Points (Very Good)</option>
          </select>
        </div>

        <div>
          <select
            value={rebuyFilter}
            onChange={(e) => setRebuyFilter(e.target.value)}
            className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
          >
            <option value="all">All Re-Buy Verdicts</option>
            <option value="Box Worthy">📦 Box Worthy</option>
            <option value="5-Pack Buy">🔥 5-Pack Buy</option>
            <option value="Single Occasionally">🏷️ Single Occasionally</option>
            <option value="Never Again">⛔ Pass / Never Again</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {filteredLogs.map((log) => {
          const isExpanded = expandedLogId === log.id;
          const dateFormatted = log.smokedAt
            ? new Date(log.smokedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '';

          return (
            <div
              key={log.id}
              className="bg-[#1C1816] border border-[#2C2621] rounded-lg overflow-hidden shadow-sm transition hover:border-[#3D352E]"
            >
              {/* Log Header Summary */}
              <div
                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                className="p-5 cursor-pointer hover:bg-[#241E1B] flex flex-wrap items-center justify-between gap-4 select-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-[#13110F] border border-[#2C2621] flex flex-col items-center justify-center text-[#D4AF37]">
                    <span className="text-base font-serif font-bold leading-none">{log.overallScore}</span>
                    <span className="text-[8px] uppercase tracking-widest text-[#A89F94] mt-0.5">pts</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[#D4AF37]">{log.cigarBrand}</span>
                      <span className="text-xs text-[#3D352E]">•</span>
                      <span className="text-xs text-[#A89F94]">{log.wrapper} wrapper</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-serif font-semibold text-[#E5E1DA]">
                      {log.cigarName}{' '}
                      <span className="text-xs font-normal text-[#A89F94]">({log.vitola})</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#A89F94] mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {dateFormatted}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {log.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {log.durationMinutes} mins
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded border ${
                        log.wouldRebuy === 'Box Worthy'
                          ? 'bg-[#13110F] text-[#D4AF37] border-[#2C2621]'
                          : 'bg-[#13110F] text-[#A89F94] border-[#2C2621]'
                      }`}
                    >
                      {log.wouldRebuy}
                    </span>
                    <div className="text-xs text-[#A89F94] mt-1">🥃 {log.pairingDrink}</div>
                  </div>

                  <div className="text-[#A89F94] hover:text-white p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Detailed Log View */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-3 border-t border-[#2C2621] bg-[#13110F] space-y-4 text-xs">
                  {/* Dominant Flavor Tags */}
                  <div>
                    <span className="text-[#A89F94] font-semibold uppercase tracking-wider text-[10px] block mb-2">
                      Dominant Flavor Impressions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(log.dominantFlavors || []).map((flavor) => (
                        <span
                          key={flavor}
                          className="px-2.5 py-1 rounded bg-[#1C1816] border border-[#2C2621] text-[#E5E1DA] font-medium text-[11px]"
                        >
                          {flavor}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 3-Thirds Flavor Transitions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-[#1C1816] border border-[#2C2621] rounded-md">
                      <div className="font-serif text-[#D4AF37] text-xs mb-1.5 font-semibold">1st Third (Initial Light)</div>
                      <div className="flex flex-wrap gap-1">
                        {(log.firstThirdNotes || []).map((n) => (
                          <span
                            key={n}
                            className="px-2 py-0.5 rounded bg-[#13110F] text-[#A89F94] text-[10px] border border-[#2C2621]"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#1C1816] border border-[#2C2621] rounded-md">
                      <div className="font-serif text-[#D4AF37] text-xs mb-1.5 font-semibold">2nd Third (Sweet Spot)</div>
                      <div className="flex flex-wrap gap-1">
                        {(log.secondThirdNotes || []).map((n) => (
                          <span
                            key={n}
                            className="px-2 py-0.5 rounded bg-[#13110F] text-[#A89F94] text-[10px] border border-[#2C2621]"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#1C1816] border border-[#2C2621] rounded-md">
                      <div className="font-serif text-[#D4AF37] text-xs mb-1.5 font-semibold">Final Third (Nub / Finish)</div>
                      <div className="flex flex-wrap gap-1">
                        {(log.finalThirdNotes || []).map((n) => (
                          <span
                            key={n}
                            className="px-2 py-0.5 rounded bg-[#13110F] text-[#A89F94] text-[10px] border border-[#2C2621]"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Construction & Mechanics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#1C1816] border border-[#2C2621] rounded-md text-[11px]">
                    <div>
                      <span className="text-[#A89F94] block">Draw Quality</span>
                      <strong className="text-[#E5E1DA]">{log.drawQuality}</strong>
                    </div>
                    <div>
                      <span className="text-[#A89F94] block">Burn Consistency</span>
                      <strong className="text-[#E5E1DA]">{log.burnQuality}</strong>
                    </div>
                    <div>
                      <span className="text-[#A89F94] block">Ash Characteristics</span>
                      <strong className="text-[#E5E1DA]">{log.ashQuality}</strong>
                    </div>
                    <div>
                      <span className="text-[#A89F94] block">Cut & Light</span>
                      <strong className="text-[#E5E1DA]">
                        {log.cutType || 'Straight'} / {log.lightType || 'Torch'}
                      </strong>
                    </div>
                  </div>

                  {/* Pairing & Review */}
                  <div className="p-4 bg-[#1C1816] border border-[#2C2621] rounded-md space-y-2.5">
                    <div>
                      <strong className="text-[#D4AF37] uppercase tracking-wider text-[10px]">🥃 Beverage Accompaniment:</strong>{' '}
                      <span className="text-[#E5E1DA] ml-1">{log.pairingDrink}</span>
                      {log.pairingNotes && (
                        <p className="text-[#A89F94] italic mt-0.5 ml-4">"{log.pairingNotes}"</p>
                      )}
                    </div>
                    <div>
                      <strong className="text-[#D4AF37] uppercase tracking-wider text-[10px]">📝 Connoisseur Tasting Notes:</strong>
                      <p className="text-[#E5E1DA] leading-relaxed mt-1 font-serif text-sm italic">
                        "{log.detailedReview}"
                      </p>
                    </div>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  <div className="flex justify-end gap-4 pt-2 text-xs text-[#A89F94]">
                    <button
                      onClick={() => onEditLog(log)}
                      className="flex items-center gap-1.5 hover:text-[#E5E1DA] transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Tasting Note</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete tasting log for ${log.cigarBrand} ${log.cigarName}?`)) {
                          onDeleteLog(log.id);
                        }
                      }}
                      className="flex items-center gap-1.5 hover:text-red-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 bg-[#1C1816] border border-[#2C2621] rounded-lg">
            <Flame className="w-8 h-8 text-[#D4AF37]/50 mx-auto mb-3" />
            <h3 className="text-base font-serif font-semibold text-[#E5E1DA]">No Tasting Logs Found</h3>
            <p className="text-xs text-[#A89F94] max-w-sm mx-auto mt-1 mb-4">
              Record your thoughts on your latest stick to start building your personal flavor archive.
            </p>
            <button
              onClick={onOpenLogSmoke}
              className="px-4 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] font-bold uppercase tracking-wider rounded text-xs cursor-pointer"
            >
              Log Your First Smoke
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

