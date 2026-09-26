import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Cedar & Ash Uncaught Runtime Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetStorage = () => {
    try {
      localStorage.removeItem('cedar_ash_cigars');
      localStorage.removeItem('cedar_ash_humidors');
      localStorage.removeItem('cedar_ash_smokelogs');
      localStorage.removeItem('cedar_ash_wishlist');
      localStorage.removeItem('cedar_ash_research_db');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-ink text-text flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full bg-card border border-line rounded-xl p-8 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-line text-gold flex items-center justify-center mx-auto mb-5 border border-line-hover">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <h1 className="font-serif text-2xl font-bold text-white mb-2 tracking-wide">
              Vault Recovery Mode
            </h1>
            <p className="text-xs text-text-muted leading-relaxed mb-6">
              A script error occurred during rendering. Your data vault is safeguarded. You can reload or reset the cache below.
            </p>

            {this.state.error && (
              <div className="bg-surface border border-line rounded-lg p-3 text-left mb-6 overflow-x-auto text-[11px] text-text-muted font-mono">
                <span className="text-red-400 font-bold block mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </span>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[10px] text-[#7A7067] whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack.slice(0, 300)}...
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-gold hover:brightness-110 text-ink font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload App</span>
              </button>
              <button
                onClick={this.handleResetStorage}
                className="px-5 py-2.5 bg-card-hover hover:bg-red-950/40 text-red-300 border border-red-900/40 hover:border-red-700/60 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset Cache to Defaults</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
