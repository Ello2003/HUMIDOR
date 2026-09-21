import React, { useState } from 'react';
import { Github, UploadCloud, DownloadCloud, LockKeyhole, ShieldCheck, X, ExternalLink } from 'lucide-react';
import { Cigar, Humidor, SmokeLog, WishlistItem, CigarResearchItem, WishlistBasketItem } from '../types';
import { DEFAULT_PATH, HumidorSyncPayload, pullHumidorSync, pushHumidorSync } from '../utils/githubSync';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: HumidorSyncPayload;
  onImport: (payload: HumidorSyncPayload) => void;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({ isOpen, onClose, payload, onImport }) => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [repository, setRepository] = useState('Ello2003/HUMIDOR');
  const [path, setPath] = useState(DEFAULT_PATH);
  const [branch, setBranch] = useState('main');
  const [busy, setBusy] = useState<'push' | 'pull' | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string; url?: string } | null>(null);

  if (!isOpen) return null;

  const run = async (mode: 'push' | 'pull') => {
    setStatus(null);
    if (!token.trim()) {
      setStatus({ type: 'error', message: 'Enter a GitHub token. It is used only in this browser session and is not saved.' });
      return;
    }
    if (password.length < 8) {
      setStatus({ type: 'error', message: 'Use a sync password of at least 8 characters. This encrypts the backup before it reaches GitHub.' });
      return;
    }

    setBusy(mode);
    try {
      const config = { token, repository, path, branch };
      if (mode === 'push') {
        const result = await pushHumidorSync(config, payload, password);
        setStatus({
          type: 'success',
          message: `Push complete — ${result.path} was encrypted and committed to ${repository}.`,
          url: result.commitUrl || result.fileUrl,
        });
      } else {
        const result = await pullHumidorSync(config, password);
        onImport(result.payload);
        setStatus({
          type: 'success',
          message: `Pull complete — your local Humidor data has been replaced with the GitHub snapshot from ${result.syncedAt ? new Date(result.syncedAt).toLocaleString() : 'the latest commit'}.`,
          url: result.fileUrl,
        });
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error?.message || 'GitHub sync failed.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-line rounded-xl shadow-2xl overflow-hidden">
        <div className="p-5 bg-header border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-gold/10 border border-gold/30 text-gold"><Github className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-serif text-white">GitHub Vault Sync</h2>
              <p className="text-xs text-text-muted mt-0.5">Encrypted Push / Pull for your Humidor data</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-white rounded border border-line cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-800/50 text-xs text-amber-100">
            <div className="flex gap-2 font-semibold"><ShieldCheck className="w-4 h-4 shrink-0" /> Your HUMIDOR repository is public.</div>
            <p className="mt-1.5 text-amber-200/80 leading-relaxed">
              The sync file is encrypted with AES-256-GCM before upload, so your cigar inventory, journal, wishlist and basket are not stored as readable JSON in the public repository. Keep the sync password private.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-text-muted">
              GitHub repository
              <input value={repository} onChange={e => setRepository(e.target.value)} placeholder="owner/name" className="mt-1.5 w-full bg-surface border border-line rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-gold" />
            </label>
            <label className="text-xs text-text-muted">
              Branch
              <input value={branch} onChange={e => setBranch(e.target.value)} className="mt-1.5 w-full bg-surface border border-line rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-gold" />
            </label>
          </div>

          <label className="block text-xs text-text-muted">
            Sync file path
            <input value={path} onChange={e => setPath(e.target.value)} className="mt-1.5 w-full bg-surface border border-line rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-gold" />
          </label>

          <label className="block text-xs text-text-muted">
            GitHub token
            <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Fine-grained PAT — Contents: Read & write" className="mt-1.5 w-full bg-surface border border-line rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-gold" autoComplete="off" />
            <span className="block mt-1.5 text-[11px]">The token is never written to localStorage or the sync file.</span>
          </label>

          <label className="block text-xs text-text-muted">
            Sync password
            <div className="relative mt-1.5">
              <LockKeyhole className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8+ characters" className="w-full bg-surface border border-line rounded-md pl-9 pr-3 py-2 text-sm text-text focus:outline-none focus:border-gold" autoComplete="new-password" />
            </div>
            <span className="block mt-1.5 text-[11px]">You need the same password to decrypt a future Pull.</span>
          </label>

          <div className="p-3 bg-surface border border-line rounded-md text-xs text-text-muted">
            <div className="flex items-center gap-2 text-text"><LockKeyhole className="w-3.5 h-3.5 text-gold" /> What is synced?</div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <span>• Humidor inventory</span><span>• Humidor definitions</span>
              <span>• Smoke journal</span><span>• Wishlist</span>
              <span>• Research database</span><span>• Shopping basket</span>
            </div>
          </div>

          {status && (
            <div className={`p-3 rounded-md border text-xs ${status.type === 'success' ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200' : 'bg-red-950/30 border-red-800/60 text-red-200'}`}>
              <div>{status.message}</div>
              {status.url && (
                <a href={status.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-gold hover:underline">
                  View on GitHub <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <button onClick={() => run('push')} disabled={!!busy} className="py-3 bg-gold hover:brightness-110 disabled:opacity-50 text-ink rounded-md font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer">
              <UploadCloud className="w-4 h-4" /> {busy === 'push' ? 'Pushing…' : 'Push to GitHub'}
            </button>
            <button onClick={() => run('pull')} disabled={!!busy} className="py-3 bg-surface hover:bg-card-hover disabled:opacity-50 text-gold border border-gold/50 rounded-md font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer">
              <DownloadCloud className="w-4 h-4" /> {busy === 'pull' ? 'Pulling…' : 'Pull from GitHub'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
