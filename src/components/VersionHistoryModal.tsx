import React from 'react';
import { X, GitCommit, Sparkles, CheckCircle2, Shield, Calendar, Layers } from 'lucide-react';
import { VERSION_HISTORY, APP_VERSION } from '../data/versionHistory';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-modal border border-line rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
              <GitCommit className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-white">Version History & Changelog</h2>
                <span className="px-2 py-0.5 bg-gold text-ink font-bold text-[10px] uppercase tracking-wider rounded-xs">
                  {APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Release updates, architecture evolution, and feature milestones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-white hover:bg-line rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Timeline */}
        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto divide-y divide-line">
          {VERSION_HISTORY.map((release, index) => {
            const isCurrent = release.version === APP_VERSION;

            return (
              <div key={release.version} className={`space-y-3 ${index > 0 ? 'pt-6' : ''}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                        isCurrent
                          ? 'bg-gold text-ink'
                          : 'bg-line text-text'
                      }`}
                    >
                      {release.version}
                    </span>
                    <h3 className="text-sm font-serif font-bold text-white">
                      {release.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Calendar className="w-3.5 h-3.5 text-gold" />
                    <span>{release.releaseDate}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 text-[10px] font-bold uppercase rounded-xs">
                        Current
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-text-muted leading-relaxed">
                  {release.summary}
                </p>

                <div className="space-y-1.5 pl-2 border-l-2 border-line">
                  {release.highlights.map((highlight, hIdx) => (
                    <div key={hIdx} className="flex items-start gap-2 text-xs text-text">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-surface flex items-center justify-between">
          <div className="text-xs text-text-muted flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-gold" />
            <span>Humidor Master &bull; Client-Side Resilient Persistence</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-line hover:bg-line-hover text-text font-semibold text-xs rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
