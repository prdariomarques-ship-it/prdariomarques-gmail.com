import React, { useEffect } from 'react';
import {
  BellRing,
  X,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { InAppPriceNotification, formatAssetPrice } from '../../utils/priceAlerts';

interface PriceAlertToastProps {
  notification: InAppPriceNotification | null;
  onDismiss: () => void;
  onOpenAlertManager?: (ticker: string) => void;
}

export const PriceAlertToast: React.FC<PriceAlertToastProps> = ({
  notification,
  onDismiss,
  onOpenAlertManager,
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const isTp = notification.type === 'TAKE_PROFIT';

  return (
    <div className="fixed top-20 right-6 z-50 max-w-sm w-full animate-slideInRight">
      <div
        className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all ${
          isTp
            ? 'bg-slate-950/95 border-emerald-500/60 shadow-emerald-950/50'
            : 'bg-slate-950/95 border-rose-500/60 shadow-rose-950/50'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                isTp
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono ${
                    isTp
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {isTp ? 'TAKE-PROFIT ATINGIDO' : 'STOP-LOSS DISPARADO'}
                </span>
                <span className="text-[10px] text-slate-400">Agora</span>
              </div>
              <h4 className="text-sm font-black text-white mt-1 flex items-center gap-1.5 font-mono">
                <span>{notification.ticker}</span>
                <span className="text-slate-400 text-xs font-normal">
                  ({notification.assetName})
                </span>
              </h4>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cotação atingida vs Alvo */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-sans">
              Preço Executado
            </span>
            <span
              className={`text-base font-bold ${
                isTp ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatAssetPrice(notification.triggeredPrice)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-sans">
              Limite Definido
            </span>
            <span className="text-sm font-semibold text-white">
              {formatAssetPrice(notification.targetPrice)}
            </span>
          </div>
        </div>

        {notification.note && (
          <p className="text-[11px] text-slate-300 mt-2 px-1 italic">
            &ldquo;{notification.note}&rdquo;
          </p>
        )}

        {/* Rodapé com Ações */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Sentinel Price Watch
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Dispensar
            </button>
            {onOpenAlertManager && (
              <button
                onClick={() => {
                  onOpenAlertManager(notification.ticker);
                  onDismiss();
                }}
                className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
              >
                <span>Gerenciar</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
