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
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-card border border-line rounded-lg shadow-2xl overflow-hidden text-text">
        <div className="px-6 py-4 bg-surface border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-card border border-line flex items-center justify-center text-gold">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-semibold text-text">Humidor Vaults & Storage</h2>
              <p className="text-xs text-text-muted">Manage climate control, capacity & sensor monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddHumidor}
              className="px-3 py-1.5 bg-gold hover:brightness-110 text-ink rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Humidor</span>
            </button>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text p-1.5 rounded hover:bg-card-hover transition cursor-pointer"
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
                className="p-5 bg-surface border border-line rounded-lg space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif font-semibold text-text text-sm">{h.name}</h3>
                    <p className="text-xs text-text-muted">
                      {h.type} • 📍 {h.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditHumidor(h)}
                      className="p-1.5 bg-card hover:bg-card-hover text-text-muted hover:text-text rounded border border-line transition cursor-pointer"
                      title="Edit Humidor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {humidors.length > 1 && (
                      confirmDeleteId === h.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onDeleteHumidor(h.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded transition cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 bg-line hover:bg-line-hover text-text-muted text-[11px] rounded transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(h.id)}
                          className="p-1.5 bg-card hover:bg-card-hover text-text-muted hover:text-red-400 rounded border border-line transition cursor-pointer"
                          title="Delete Humidor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 bg-card rounded-md border border-line">
                  <div>
                    <span className="text-text-muted text-[9px] uppercase tracking-wider block">Current RH</span>
                    <strong className="text-gold text-sm">{h.currentHumidity}%</strong>{' '}
                    <span className="text-[10px] text-text-muted/70">(Target {h.targetHumidity}%)</span>
                  </div>
                  <div>
                    <span className="text-text-muted text-[9px] uppercase tracking-wider block">Temp</span>
                    <strong className="text-text text-sm">
                      {h.currentTemp}°{h.tempUnit || 'F'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-text-muted text-[9px] uppercase tracking-wider block">Capacity</span>
                    <strong className="text-text text-sm">
                      {count} / {h.maxCapacity} ({percent}%)
                    </strong>
                  </div>
                  <div>
                    <span className="text-text-muted text-[9px] uppercase tracking-wider block">Hygrometer</span>
                    <strong className="text-text-muted text-xs truncate block">{h.hygrometerModel || 'Digital'}</strong>
                  </div>
                </div>

                {/* Humidification note */}
                <div className="flex flex-wrap items-center justify-between text-xs text-text-muted pt-1">
                  <span>📦 Pack: {h.bovedaPackType}</span>
                  <span>🗓️ Refreshed: {h.bovedaInstalledDate || 'Recently'}</span>
                </div>

                {h.notes && <p className="text-xs text-text-muted italic bg-card p-2 rounded border border-line/60">"{h.notes}"</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
