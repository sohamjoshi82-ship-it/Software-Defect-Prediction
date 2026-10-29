import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-rose-900 selection:text-white">
          <div className="max-w-lg w-full bg-slate-900 border border-rose-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-rose-950/40 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
            
            <div className="h-14 w-14 rounded-2xl bg-rose-950/80 border border-rose-700/80 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <ShieldAlert className="h-8 w-8 animate-pulse" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2 font-sans">
              System Fault Safeguard Triggered
            </h2>
            
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              DefectPredict encountered an unexpected client state. Your machine learning models and data remain intact.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-slate-950 border border-slate-800 rounded-xl text-left font-mono text-[11px] text-rose-300 max-h-36 overflow-y-auto">
                <span className="text-slate-500">Error: </span>
                {this.state.error.message || 'Unknown runtime anomaly'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-950/50 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reload Application</span>
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 transition-colors cursor-pointer"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
