import React, { useRef, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  Printer,
  Upload,
  CheckCircle,
  ShieldCheck,
  Sparkles,
  Layers,
  Box,
  Flame,
  Bookmark,
  BookOpen,
  Star,
  FileJson,
} from 'lucide-react';
import { Cigar, Humidor, SmokeLog, WishlistItem, CigarResearchItem } from '../types';
import {
  exportInventoryToCSV,
  exportSmokeLogsToCSV,
  exportWishlistToCSV,
  exportCompleteVaultJSON,
  exportJournalMarkdown,
  exportPrintableReport,
  exportResearchDatabaseToJSON,
  exportResearchDatabaseToCSV,
} from '../utils/exportUtils';

interface ExportSuiteProps {
  cigars: Cigar[];
  humidors: Humidor[];
  smokeLogs: SmokeLog[];
  wishlist: WishlistItem[];
  researchDatabase?: CigarResearchItem[];
  onImportVault: (data: {
    cigars?: Cigar[];
    humidors?: Humidor[];
    smokeLogs?: SmokeLog[];
    wishlist?: WishlistItem[];
    researchDatabase?: CigarResearchItem[];
  }) => void;
}

export const ExportSuite: React.FC<ExportSuiteProps> = ({
  cigars,
  humidors,
  smokeLogs,
  wishlist,
  researchDatabase = [],
  onImportVault,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.cigars || json.humidors || json.smokeLogs || json.researchDatabase) {
          onImportVault(json);
          setImportStatus(
            `Successfully restored ${json.cigars?.length || 0} cigars, ${json.smokeLogs?.length || 0} tasting logs, and ${json.researchDatabase?.length || 0} research entries!`
          );
        } else {
          setImportStatus('Invalid vault JSON file format.');
        }
      } catch (err) {
        setImportStatus('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const totalSticks = cigars.reduce((a, b) => a + (b.quantity || 0), 0);
  const totalValuation = cigars.reduce((a, b) => a + (b.purchasePrice || 0) * (b.quantity || 0), 0);
  const ratedResearchSticks = researchDatabase.filter((c) => c.personalRating || c.personalNotes).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-br from-[#1C1816] via-[#161311] to-[#13110F] border border-[#2C2621] rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-[#D4AF37]" />
          <h1 className="text-xl sm:text-2xl font-serif text-white font-normal">
            Vault Export, Downloads & Backup Hub
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#A89F94] mt-1 max-w-3xl leading-relaxed">
          Your personal cigar collection and research library belong to you. Export your humidor inventory, resting histories,
          tasting journals, wishlist, and entire research brand database across industry-standard formats (JSON backups, CSV spreadsheets,
          Markdown logs, and printable PDF documents).
        </p>
      </div>

      {importStatus && (
        <div className="p-4 bg-[#13110F] border border-emerald-800/80 rounded-md text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Primary Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Research Database JSON */}
        <div className="p-6 bg-[#1C1816] border border-[#2C2621] rounded-lg flex flex-col justify-between shadow-sm space-y-4 hover:border-[#3D352E] transition">
          <div>
            <div className="w-10 h-10 rounded-md bg-[#13110F] border border-[#2C2621] flex items-center justify-center text-[#D4AF37] mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-semibold text-base text-[#E5E1DA]">Cigar Research Library (JSON)</h3>
            <p className="text-xs text-[#A89F94] mt-1 leading-relaxed">
              Export {researchDatabase.length} curated cigar brands and types with wrapper classifications, origin terroir, average prices, critic notes, and your personal ratings.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => exportResearchDatabaseToJSON(researchDatabase, false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] rounded font-bold uppercase tracking-wider text-xs shadow-sm transition cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Download research_database.json</span>
            </button>
            <button
              onClick={() => exportResearchDatabaseToJSON(researchDatabase, true)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#13110F] hover:bg-[#241E1B] text-[#D4AF37] border border-[#2C2621] rounded font-semibold uppercase tracking-wider text-[11px] transition cursor-pointer"
            >
              <Star className="w-3 h-3 text-[#D4AF37]" />
              <span>Export Only My Ratings ({ratedResearchSticks})</span>
            </button>
          </div>
        </div>

        {/* Complete JSON Vault Backup */}
        <div className="p-6 bg-[#1C1816] border border-[#2C2621] rounded-lg flex flex-col justify-between shadow-sm space-y-4 hover:border-[#3D352E] transition">
          <div>
            <div className="w-10 h-10 rounded-md bg-[#13110F] border border-[#2C2621] flex items-center justify-center text-[#D4AF37] mb-3">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-semibold text-base text-[#E5E1DA]">Complete Master Vault (JSON)</h3>
            <p className="text-xs text-[#A89F94] mt-1 leading-relaxed">
              Full lossless snapshot of humidors, stick inventory, smoke logs, wishlist, and annotated research database. Can be safely restored anytime.
            </p>
          </div>

          <button
            onClick={() => exportCompleteVaultJSON({ cigars, humidors, smokeLogs, wishlist, researchDatabase })}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#13110F] hover:bg-[#241E1B] text-[#D4AF37] border border-[#2C2621] rounded font-bold uppercase tracking-wider text-xs shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download cigar_vault_backup.json</span>
          </button>
        </div>

        {/* CSV Inventory Spreadsheet */}
        <div className="p-6 bg-[#1C1816] border border-[#2C2621] rounded-lg flex flex-col justify-between shadow-sm space-y-4 hover:border-[#3D352E] transition">
          <div>
            <div className="w-10 h-10 rounded-md bg-[#13110F] border border-[#2C2621] flex items-center justify-center text-[#D4AF37] mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-semibold text-base text-[#E5E1DA]">Humidor Inventory CSV</h3>
            <p className="text-xs text-[#A89F94] mt-1 leading-relaxed">
              Export all {cigars.length} cigar lines ({totalSticks} sticks, ${totalValuation.toFixed(2)} valuation) with resting days, box press, wrapper details, price per stick, and humidor assignments.
            </p>
          </div>

          <button
            onClick={() => exportInventoryToCSV(cigars, humidors)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#13110F] hover:bg-[#241E1B] text-[#E5E1DA] border border-[#2C2621] rounded font-bold uppercase tracking-wider text-xs shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Download inventory.csv</span>
          </button>
        </div>

        {/* CSV Tasting Journal */}
        <div className="p-6 bg-[#1C1816] border border-[#2C2621] rounded-lg flex flex-col justify-between shadow-sm space-y-4 hover:border-[#3D352E] transition">
          <div>
            <div className="w-10 h-10 rounded-md bg-[#13110F] border border-[#2C2621] flex items-center justify-center text-[#D4AF37] mb-3">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-semibold text-base text-[#E5E1DA]">Tasting Journal CSV</h3>
            <p className="text-xs text-[#A89F94] mt-1 leading-relaxed">
              Export {smokeLogs.length} logged smoke sessions with 100-pt scores, 3-thirds flavor breakdowns, drink pairings, burn & draw metrics, and connoisseur tasting notes.
            </p>
          </div>

          <button
            onClick={() => exportSmokeLogsToCSV(smokeLogs)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#13110F] hover:bg-[#241E1B] text-[#E5E1DA] border border-[#2C2621] rounded font-bold uppercase tracking-wider text-xs shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Download tasting_journal.csv</span>
          </button>
        </div>

        {/* Markdown Connoisseur Ledger */}
        <div className="p-6 bg-[#1C1816] border border-[#2C2621] rounded-lg flex flex-col justify-between shadow-sm space-y-4 hover:border-[#3D352E] transition">
          <div>
            <div className="w-10 h-10 rounded-md bg-[#13110F] border border-[#2C2621] flex items-center justify-center text-[#D4AF37] mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-semibold text-base text-[#E5E1DA]">Obsidian / Markdown Journal</h3>
            <p className="text-xs text-[#A89F94] mt-1 leading-relaxed">
              Export an elegant formatted Markdown file suitable for Obsidian, Logseq, Notion, or personal notes with YAML metadata, bulleted thirds, and beverage notes.
            </p>
          </div>

          <button
            onClick={() => exportJournalMarkdown(smokeLogs, cigars)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#13110F] hover:bg-[#241E1B] text-[#E5E1DA] border border-[#2C2621] rounded font-bold uppercase tracking-wider text-xs shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Download cigar_journal.md</span>
          </button>
        </div>

        {/* Printable / PDF Cellar Report */}
        <div className="p-6 bg-[#1C1816] border border-[#2C2621] rounded-lg flex flex-col justify-between shadow-sm space-y-4 hover:border-[#3D352E] transition">
          <div>
            <div className="w-10 h-10 rounded-md bg-[#13110F] border border-[#2C2621] flex items-center justify-center text-[#D4AF37] mb-3">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-semibold text-base text-[#E5E1DA]">Printable Cellar Dossier (PDF)</h3>
            <p className="text-xs text-[#A89F94] mt-1 leading-relaxed">
              Opens a print-ready report in a new tab with styled cedar styling, humidor environment charts, and valuation summaries ready for saving as PDF or physical printout.
            </p>
          </div>

          <button
            onClick={() => exportPrintableReport(cigars, humidors, smokeLogs)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] rounded font-bold uppercase tracking-wider text-xs shadow-sm transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate Printable PDF / Report</span>
          </button>
        </div>
      </div>

      {/* Restore & Import Vault Section */}
      <div className="p-6 bg-[#1C1816] border border-[#2C2621] rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#D4AF37]" />
          <h2 className="text-base font-serif font-semibold text-[#E5E1DA]">
            Restore or Merge Vault Backup
          </h2>
        </div>
        <p className="text-xs text-[#A89F94]">
          Upload a previously downloaded <code className="text-[#D4AF37] font-mono">cigar_vault_backup.json</code> or <code className="text-[#D4AF37] font-mono">cigar_research_database.json</code> file to restore your humidor records, research library, and personal tasting notes.
        </p>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleJSONImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-[#13110F] hover:bg-[#241E1B] text-[#E5E1DA] border border-[#2C2621] rounded text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Select JSON Backup File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
