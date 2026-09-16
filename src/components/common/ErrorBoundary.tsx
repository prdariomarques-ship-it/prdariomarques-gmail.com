import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
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
    console.error('[FlowCore Sentinel] Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleResetToLive = () => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
          window.location.reload();
        }).catch(() => {
          window.location.reload();
        });
      } else {
        window.location.reload();
      }
    } catch {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 bg-slate-950 text-slate-100 rounded-2xl border border-rose-500/30 my-6 shadow-2xl">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4 animate-pulse">
            <AlertOctagon className="w-10 h-10" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            {this.props.fallbackTitle || 'Ocorreu um erro ao renderizar a visualização'}
          </h2>

          <p className="text-sm text-slate-400 max-w-lg text-center mb-6">
            O componente de interface encontrou uma inconsistência nos dados calculados.
            Clique abaixo para restaurar o estado padrão do sistema ou recarregar os dados ao vivo.
          </p>

          {this.state.error && (
            <div className="w-full max-w-xl bg-slate-900/90 rounded-xl p-4 border border-slate-800 text-xs font-mono text-rose-300 mb-6 overflow-auto max-h-40">
              <p className="font-bold text-rose-400 mb-1">Mensagem de Erro:</p>
              <p className="break-words">{this.state.error.toString()}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition cursor-pointer shadow-lg shadow-emerald-900/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Tentar Novamente</span>
            </button>

            <button
              onClick={this.handleResetToLive}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Recarregar Aplicação</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
