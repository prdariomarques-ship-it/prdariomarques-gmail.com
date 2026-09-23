import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[FlowCore ErrorBoundary] Erro capturado:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignorar erros se storage restrito
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'Ocorreu uma falha inesperada na visualização';
      const errorMessage = this.state.error?.message || String(this.state.error);

      return (
        <div className="min-h-[360px] w-full p-8 rounded-2xl bg-[#0B1120] border border-rose-500/30 shadow-2xl flex flex-col items-center justify-center text-center space-y-5 my-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-2xl font-bold shadow-inner">
            ⚠️
          </div>

          <div className="max-w-md space-y-2">
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-rose-300 font-mono bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/60 overflow-x-auto text-left">
              {errorMessage}
            </p>
            <p className="text-xs text-slate-400">
              Para evitar perda de dados, você pode restaurar o modo padrão ou recarregar os dados de custódia.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer"
            >
              Restaurar Visualização
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              Recarregar Página
            </button>
            <button
              onClick={this.handleClearCacheAndReload}
              className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-medium border border-rose-800/60 transition cursor-pointer"
              title="Limpa estado de sessão e recarrega a aplicação do zero"
            >
              Limpar Cache Local e Reiniciar
            </button>
          </div>

          {this.state.error?.stack && (
            <details className="w-full max-w-2xl text-left mt-4 text-[11px] text-slate-500">
              <summary className="cursor-pointer hover:text-slate-400 font-medium">
                Ver detalhes técnicos do erro (Stack Trace)
              </summary>
              <pre className="mt-2 p-3 bg-black/50 rounded-lg overflow-x-auto border border-slate-800 text-slate-400 font-mono">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
