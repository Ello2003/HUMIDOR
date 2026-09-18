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
  ShoppingCart,
} from 'lucide-react';
import { Cigar, Humidor, SmokeLog, WishlistItem, CigarResearchItem, AppSettings } from '../types';
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
  settings?: AppSettings;
  onOpenSettings?: () => void;
  onOpenBasketImporter?: () => void;
  onOpenGitHubSync?: () => void;
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
  settings,
  onOpenSettings,
  onOpenBasketImporter,
  onOpenGitHubSync,
  onImportVault,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const opts = settings?.exportSuiteOptions || {
    showResearchExport: true,
    showMasterJson: true,
    showInventoryCsv: true,
    showTastingCsv: true,
    showMarkdownExport: true,
    showPrintablePdf: true,
    showRestoreBackup: true,
  };

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
      <div className="p-6 bg-gradient-to-br from-card via-header to-surface border border-line rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-gold" />
            <h1 className="text-xl sm:text-2xl font-serif text-white font-normal">
              Vault Export, Downloads & Backup Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-3xl leading-relaxed">
            Your personal cigar collection and research library belong to you. Export your humidor inventory, resting histories,
            tasting journals, wishlist, and entire research brand database across industry-standard formats (JSON backups, CSV spreadsheets,
            Markdown logs, and printable PDF documents).
          </p>
        </div>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3.5 py-2 bg-card hover:bg-card-hover text-gold border border-line hover:border-gold/50 rounded-md text-xs font-semibold uppercase tracking-wider shrink-0 transition cursor-pointer self-start sm:self-center"
          >
            <span>⚙️ Customize Exports</span>
          </button>
        )}
      </div>

      {importStatus && (
        <div className="p-4 bg-surface border border-emerald-800/80 rounded-md text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Primary Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Research Database JSON */}
        {opts.showResearchExport && (
          <div className="p-6 bg-card border border-line rounded-lg flex flex-col justify-between shadow-sm space-y-4 hover:border-line-hover transition">
            <div>
              <div className="w-10 h-10 rounded-md bg-surface border border-line flex items-center justify-center text-gold mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-semibold text-base text-text">Cigar Research Library (JSON)</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Export {researchDatabase.length} curated cigar brands and types with wrapper classifications, origin terroir, average prices, critic notes, and your personal ratings.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => exportResearchDatabaseToJSON(researchDatabase, false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold hover:brightness-110 text-ink rounded font-bold uppercase tracking-wider text-xs shadow-sm transition cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Download research_database.json</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => exportResearchDatabaseToJSON(researchDatabase, true)}
                  className="flex items-center justify-center gap-1.5 py-2 bg-surface hover:bg-card-hover text-gold border border-line rounded font-semibold uppercase tracking-wider text-[11px] transition cursor-pointer"
                  title="Export only cigars you have rated or reviewed"
                >
                  <Star className="w-3 h-3 text-gold" />
                  <span>My Notes ({ratedResearchSticks})</span>
                </button>
                <button
                  onClick={() => exportResearchDatabaseToCSV(researchDatabase)}
                  className="flex items-center justify-center gap-1.5 py-2 bg-surface hover:bg-card-hover text-text-muted hover:text-text border border-line rounded font-semibold uppercase tracking-wider text-[11px] transition cursor-pointer"
                  title="Export research database as CSV spreadsheet"
                >
                  <FileSpreadsheet className="w-3 h-3 text-gold" />
                  <span>Research CSV</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Complete JSON Vault Backup */}
        {opts.showMasterJson && (
          <div className="p-6 bg-card border border-line rounded-lg flex flex-col justify-between shadow-sm space-y-4 hover:border-line-hover transition">
            <div>
              <div className="w-10 h-10 rounded-md bg-surface border border-line flex items-center justify-center text-gold mb-3">
                <FileCode className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-semibold text-base text-text">Complete Master Vault (JSON)</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Full lossless snapshot of humidors, stick inventory, smoke logs, wishlist, and annotated research database. Can be safely restored anytime.
              </p>
            </div>

            <button
              onClick={() => exportCompleteVaultJSON({ cigars, humidors, smokeLogs, wishlist, researchDatabase })}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface hover:bg-card-hover text-gold border border-line rounded font-bold uppercase tracking-wider text-xs shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download cigar_vault_backup.json</span>
            </button>
          </div>
        )}

        {/* CSV Inventory Spreadsheet */}
        {opts.showInventoryCsv && (
          <div className="p-6 bg-card border border-line rounded-lg flex flex-col justify-between shadow-sm space-y-4 hover:border-line-hover transition">
            <div>
              <div className="w-10 h-10 rounded-md bg-surface border border-line flex items-center justify-center text-gold mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-semibold text-base text-text">Humidor Inventory CSV</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Export all {cigars.length} cigar lines ({totalSticks} sticks, £{totalValuation.toFixed(2)} valuation) with resting days, box press, wrapper details, price per stick, and humidor assignments.
              </p>
            </div>

            <button
              onClick={() => exportInventoryToCSV(cigars, humidors)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface hover:bg-card-hover text-text border border-line rounded font-bold uppercase tracking-wider text-xs shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              <span>Download inventory.csv</span>
            </button>
          </div>
        )}

        {/* CSV Tasting Journal */}
        {opts.showTastingCsv && (
          <div className="p-6 bg-card border border-line rounded-lg flex flex-col justify-between shadow-sm space-y-4 hover:border-line-hover transition">
            <div>
              <div className="w-10 h-10 rounded-md bg-surface border border-line flex items-center justify-center text-gold mb-3">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-semibold text-base text-text">Tasting Journal CSV</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Export {smokeLogs.length} logged smoke sessions with 100-pt scores, 3-thirds flavor breakdowns, drink pairings, burn & draw metrics, and connoisseur tasting notes.
              </p>
            </div>

            <button
              onClick={() => exportSmokeLogsToCSV(smokeLogs)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface hover:bg-card-hover text-text border border-line rounded font-bold uppercase tracking-wider text-xs shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              <span>Download tasting_journal.csv</span>
            </button>
          </div>
        )}

        {/* Markdown Connoisseur Ledger */}
        {opts.showMarkdownExport && (
          <div className="p-6 bg-card border border-line rounded-lg flex flex-col justify-between shadow-sm space-y-4 hover:border-line-hover transition">
            <div>
              <div className="w-10 h-10 rounded-md bg-surface border border-line flex items-center justify-center text-gold mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-semibold text-base text-text">Obsidian / Markdown Journal</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Export an elegant formatted Markdown file suitable for Obsidian, Logseq, Notion, or personal notes with YAML metadata, bulleted thirds, and beverage notes.
              </p>
            </div>

            <button
              onClick={() => exportJournalMarkdown(smokeLogs, cigars)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface hover:bg-card-hover text-text border border-line rounded font-bold uppercase tracking-wider text-xs shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              <span>Download cigar_journal.md</span>
            </button>
          </div>
        )}

        {/* Printable / PDF Cellar Report */}
        {opts.showPrintablePdf && (
          <div className="p-6 bg-card border border-line rounded-lg flex flex-col justify-between shadow-sm space-y-4 hover:border-line-hover transition">
            <div>
              <div className="w-10 h-10 rounded-md bg-surface border border-line flex items-center justify-center text-gold mb-3">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-semibold text-base text-text">Printable Cellar Dossier (PDF)</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Opens a print-ready report in a new tab with styled cedar styling, humidor environment charts, and valuation summaries ready for saving as PDF or physical printout.
              </p>
            </div>

            <button
              onClick={() => exportPrintableReport(cigars, humidors, smokeLogs)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold hover:brightness-110 text-ink rounded font-bold uppercase tracking-wider text-xs shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Generate Printable PDF / Report</span>
            </button>
          </div>
        )}
      </div>

      {/* GitHub Encrypted Sync */}
      {onOpenGitHubSync && (
        <div className="p-6 bg-card border border-gold/30 rounded-lg flex flex-col justify-between shadow-sm space-y-4">
          <div>
            <div className="w-10 h-10 rounded-md bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-semibold text-base text-text">GitHub Vault Sync</h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Push or pull the complete Humidor vault, wishlist, research database, journal and shopping basket. The sync snapshot is encrypted before it is committed.
            </p>
          </div>
          <button
            onClick={onOpenGitHubSync}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold hover:brightness-110 text-ink rounded font-bold uppercase tracking-wider text-xs shadow-sm transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Open GitHub Push / Pull</span>
          </button>
        </div>
      )}

      {/* Restore & Import Vault Section */}
      {opts.showRestoreBackup && (
        <div className="p-6 bg-card border border-line rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-gold" />
            <h2 className="text-base font-serif font-semibold text-text">
              Restore or Merge Vault Backup
            </h2>
          </div>
          <p className="text-xs text-text-muted">
            Upload a previously downloaded <code className="text-gold font-mono">cigar_vault_backup.json</code> or <code className="text-gold font-mono">cigar_research_database.json</code> file to restore your humidor records, research library, and personal tasting notes.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleJSONImport}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-surface hover:bg-card-hover text-text border border-line rounded text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-gold" />
              <span>Select JSON Backup File</span>
            </button>

            {onOpenBasketImporter && (
              <button
                onClick={onOpenBasketImporter}
                className="px-5 py-2.5 bg-radial from-[#3A2E1D] to-[#1E1812] hover:brightness-125 text-gold border border-gold/60 font-bold uppercase tracking-wider text-xs rounded shadow-xs transition flex items-center gap-2 cursor-pointer"
                title="Import multiple cigars automatically from a retailer shopping basket / invoice HTML"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-gold" />
                <span>Import Basket HTML / Invoice</span>
                <span className="px-1.5 py-0.5 bg-gold/20 text-gold rounded text-[9px]">AI Auto</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
