import React from 'react';
import { X, Box, Plus, Droplets, Thermometer, Calendar, Edit2, Trash2 } from 'lucide-react';
import { Humidor, Cigar } from '../types';

interface HumidorManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  humidors: Humidor[];
  cigars: Cigar[];
  onOpenAddHumidor: () => void;
  onEditHumidor: (humidor: Humidor) => void;
  onDeleteHumidor: (id: string) => void;
}

export const HumidorManagerDrawer: React.FC<HumidorManagerDrawerProps> = ({
  isOpen,
  onClose,
  humidors,
  cigars,
  onOpenAddHumidor,
  onEditHumidor,
  onDeleteHumidor,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[#1C1816] border border-[#2C2621] rounded-lg shadow-2xl overflow-hidden text-[#E5E1DA]">
        <div className="px-6 py-4 bg-[#13110F] border-b border-[#2C2621] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#1C1816] border border-[#2C2621] flex items-center justify-center text-[#D4AF37]">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-semibold text-[#E5E1DA]">Humidor Vaults & Storage</h2>
              <p className="text-xs text-[#A89F94]">Manage climate control, capacity & sensor monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddHumidor}
              className="px-3 py-1.5 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Humidor</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#A89F94] hover:text-[#E5E1DA] p-1.5 rounded hover:bg-[#241E1B] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {humidors.map((h) => {
            const count = cigars.filter((c) => c.humidorId === h.id).reduce((a, b) => a + b.quantity, 0);
            const percent = Math.min(100, Math.round((count / (h.maxCapacity || 50)) * 100));

            return (
              <div
                key={h.id}
                className="p-5 bg-[#13110F] border border-[#2C2621] rounded-lg space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif font-semibold text-[#E5E1DA] text-sm">{h.name}</h3>
                    <p className="text-xs text-[#A89F94]">
                      {h.type} • 📍 {h.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditHumidor(h)}
                      className="p-1.5 bg-[#1C1816] hover:bg-[#241E1B] text-[#A89F94] hover:text-[#E5E1DA] rounded border border-[#2C2621] transition cursor-pointer"
                      title="Edit Humidor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {humidors.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${h.name}? Cigars in this humidor will become unassigned.`)) {
                            onDeleteHumidor(h.id);
                          }
                        }}
                        className="p-1.5 bg-[#1C1816] hover:bg-[#241E1B] text-[#A89F94] hover:text-red-400 rounded border border-[#2C2621] transition cursor-pointer"
                        title="Delete Humidor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 bg-[#1C1816] rounded-md border border-[#2C2621]">
                  <div>
                    <span className="text-[#A89F94] text-[9px] uppercase tracking-wider block">Current RH</span>
                    <strong className="text-[#D4AF37] text-sm">{h.currentHumidity}%</strong>{' '}
                    <span className="text-[10px] text-[#A89F94]/70">(Target {h.targetHumidity}%)</span>
                  </div>
                  <div>
                    <span className="text-[#A89F94] text-[9px] uppercase tracking-wider block">Temp</span>
                    <strong className="text-[#E5E1DA] text-sm">
                      {h.currentTemp}°{h.tempUnit || 'F'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#A89F94] text-[9px] uppercase tracking-wider block">Capacity</span>
                    <strong className="text-[#E5E1DA] text-sm">
                      {count} / {h.maxCapacity} ({percent}%)
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#A89F94] text-[9px] uppercase tracking-wider block">Hygrometer</span>
                    <strong className="text-[#A89F94] text-xs truncate block">{h.hygrometerModel || 'Digital'}</strong>
                  </div>
                </div>

                {/* Humidification note */}
                <div className="flex flex-wrap items-center justify-between text-xs text-[#A89F94] pt-1">
                  <span>📦 Pack: {h.bovedaPackType}</span>
                  <span>🗓️ Refreshed: {h.bovedaInstalledDate || 'Recently'}</span>
                </div>

                {h.notes && <p className="text-xs text-[#A89F94] italic bg-[#1C1816] p-2 rounded border border-[#2C2621]/60">"{h.notes}"</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
