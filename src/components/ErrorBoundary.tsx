import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, ShieldCheck } from 'lucide-react';
import { storageService } from '../lib/storageService';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleResetLocalState = (): void => {
    if (window.confirm('Resetting local cached data will clear IndexedDB/SQLite cache and restore defaults. Continue?')) {
      try {
        storageService.clearAllData();
      } catch (e) {
        console.warn('Failed to clear local storage:', e);
      }
      window.location.reload();
    }
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full bg-[#090C15] text-white flex items-center justify-center p-4 font-sans select-none">
          <div className="max-w-lg w-full bg-[#0D1017] border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 shrink-0">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">
                  Application Exception
                </h1>
                <p className="text-xs text-slate-400">
                  Echo AI Assistant intercepted a runtime render error
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141A29] border border-white/10 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 block">
                Error Message
              </span>
              <p className="font-mono text-xs text-slate-200 break-words bg-black/40 p-3 rounded-xl border border-white/5">
                {this.state.error?.message || 'An unexpected error occurred during rendering.'}
              </p>
            </div>

            {this.state.errorInfo && (
              <details className="text-[11px] text-slate-400 bg-[#121622] p-3 rounded-xl border border-white/5 cursor-pointer">
                <summary className="font-semibold text-slate-300">
                  View Component Stack Trace
                </summary>
                <pre className="mt-2 font-mono text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-32">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleResetLocalState}
                className="flex-1 py-3 px-4 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Cache & Reset</span>
              </button>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Protected by Echo Graceful Error Recovery</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
