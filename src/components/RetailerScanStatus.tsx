import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, CircleSlash, Copy, ExternalLink, RefreshCw, XCircle } from 'lucide-react';
import {
  SCAN_RESULTS_STALE_AFTER_HOURS,
  describeAge,
  loadScanResults,
  missingFromScan,
  retailerSummaryLine,
  scanAgeHours,
  type RetailerReport,
  type ScanResultsFile,
} from '../utils/scanResults';

interface Props {
  /** The cigars currently on screen, used to spot ones the scanner doesn't know about. */
  cigars: Array<{ brand: string; line: string; vitola?: string }>;
  /** Bump to force a reload (e.g. after a scan button press). */
  refreshKey?: number;
}

const STATUS_ICON: Record<RetailerReport['status'], React.ReactNode> = {
  ok: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
  partial: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
  no_matches: <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />,
  failed: <XCircle className="w-4 h-4 text-red-500 shrink-0" />,
  disabled: <CircleSlash className="w-4 h-4 text-stone-400 shrink-0" />,
};

export default function RetailerScanStatus({ cigars, refreshKey = 0 }: Props) {
  const [results, setResults] = useState<ScanResultsFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResults(await loadScanResults());
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load scan results.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const hours = results ? scanAgeHours(results) : null;
  const stale = hours !== null && hours > SCAN_RESULTS_STALE_AFTER_HOURS;
  const active = results?.retailers.filter((r) => r.status !== 'disabled') ?? [];
  const working = active.filter((r) => r.status === 'ok' || r.status === 'partial').length;
  const missing = results ? missingFromScan(results, cigars) : [];

  const tone = error || !results?.scannedAt || (active.length > 0 && working === 0)
    ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200'
    : stale || working < active.length
      ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
      : 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200';

  const headline = error
    ? error
    : !results?.scannedAt
      ? 'Retailer scanner has not run yet. Run the "Scan retailer prices" workflow in GitHub Actions.'
      : `Last scanned ${describeAge(hours)} · ${working} of ${active.length} retailers returned prices${stale ? ' · out of date' : ''}`;

  const copyMissing = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(missing, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('Copy these into "extra" in scanner/watchlist.json:', JSON.stringify(missing));
    }
  };

  return (
    <div className={`rounded-xl border px-3 py-2 text-sm ${tone}`} data-testid="retailer-scan-status">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex flex-1 items-center gap-2 text-left" aria-expanded={open}>
          <span className="font-semibold">Retailer scan</span>
          <span className="flex-1 opacity-90">{headline}</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button type="button" onClick={load} disabled={loading} title="Reload scan results" className="p-1 rounded hover:bg-black/5">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {open && results && (
        <div className="mt-2 space-y-2">
          <ul className="divide-y divide-black/10 dark:divide-white/10">
            {results.retailers.map((r) => (
              <li key={r.id} className="flex items-start gap-2 py-1.5">
                {STATUS_ICON[r.status]}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs opacity-70">
                      {r.status === 'disabled' ? 'disabled' : `${r.queriesOk}/${r.queries} lookups · ${r.quotesKept} prices${r.strategyUsed ? ` · ${r.strategyUsed}` : ''}`}
                    </span>
                  </div>
                  <div className="text-xs opacity-80 break-words">{retailerSummaryLine(r)}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {results.runUrl && (
              <a href={results.runUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                Open the Action run <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {missing.length > 0 && (
              <button type="button" onClick={copyMissing} className="inline-flex items-center gap-1 underline">
                <Copy className="w-3 h-3" />
                {copied ? 'Copied!' : `${missing.length} cigar${missing.length === 1 ? '' : 's'} here aren't scanned — copy for scanner/watchlist.json`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
