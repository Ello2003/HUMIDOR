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
        className="relative w-full max-w-2xl bg-[#181412] border border-[#2C2621] rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#2C2621] flex items-center justify-between bg-[#13110F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
              <GitCommit className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-white">Version History & Changelog</h2>
                <span className="px-2 py-0.5 bg-[#C5A059] text-[#0F0D0C] font-bold text-[10px] uppercase tracking-wider rounded-xs">
                  {APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-[#A89F94]">
                Release updates, architecture evolution, and feature milestones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A89F94] hover:text-white hover:bg-[#2C2621] rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Timeline */}
        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto divide-y divide-[#2C2621]">
          {VERSION_HISTORY.map((release, index) => {
            const isCurrent = release.version === APP_VERSION;

            return (
              <div key={release.version} className={`space-y-3 ${index > 0 ? 'pt-6' : ''}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                        isCurrent
                          ? 'bg-[#C5A059] text-[#0F0D0C]'
                          : 'bg-[#2C2621] text-[#E5E1DA]'
                      }`}
                    >
                      {release.version}
                    </span>
                    <h3 className="text-sm font-serif font-bold text-white">
                      {release.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#A89F94]">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{release.releaseDate}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 text-[10px] font-bold uppercase rounded-xs">
                        Current
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#A89F94] leading-relaxed">
                  {release.summary}
                </p>

                <div className="space-y-1.5 pl-2 border-l-2 border-[#2C2621]">
                  {release.highlights.map((highlight, hIdx) => (
                    <div key={hIdx} className="flex items-start gap-2 text-xs text-[#E5E1DA]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059] mt-0.5 shrink-0" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2C2621] bg-[#13110F] flex items-center justify-between">
          <div className="text-xs text-[#A89F94] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Humidor Master &bull; Client-Side Resilient Persistence</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2C2621] hover:bg-[#3D352E] text-[#E5E1DA] font-semibold text-xs rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
