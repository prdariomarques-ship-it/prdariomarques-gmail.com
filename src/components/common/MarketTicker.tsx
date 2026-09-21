import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronRight,
  Globe2,
  Clock,
  Sparkles,
  Flame,
} from 'lucide-react';
import { INITIAL_MARKET_ASSETS, MarketAsset } from '../../data/wealthCopilotData';
import { TabKey } from '../Header';

interface MarketTickerProps {
  onNavigateTab?: (tab: TabKey) => void;
}

export const MarketTicker: React.FC<MarketTickerProps> = ({ onNavigateTab }) => {
  const [marketAssets, setMarketAssets] = useState<MarketAsset[]>(INITIAL_MARKET_ASSETS);
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLastUpdatedTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // Subtle live tick simulation for market atmosphere
    const tickInterval = setInterval(() => {
      setMarketAssets((prev) =>
        prev.map((asset) => {
          // 25% chance of subtle fluctuation
          if (Math.random() < 0.25) {
            const isJuros = asset.category === 'JUROS';
            const isCambio = asset.category === 'CAMBIO';
            const numVal = parseFloat(asset.value.replace('.', '').replace(',', '.'));
            if (!isNaN(numVal)) {
              const delta = (Math.random() - 0.48) * (isCambio ? 0.01 : isJuros ? 0.02 : 25);
              const newVal = Math.max(0.1, numVal + delta);
              const formatted = isCambio
                ? newVal.toFixed(2).replace('.', ',')
                : isJuros
                ? newVal.toFixed(2).replace('.', ',')
                : Math.round(newVal).toLocaleString('pt-BR');
              return {
                ...asset,
                value: formatted,
                isPositive: delta >= 0 ? true : false,
              };
            }
          }
          return asset;
        })
      );
    }, 4000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(tickInterval);
    };
  }, []);

  // Duplicate for seamless infinite marquee scroll
  const duplicatedAssets = [...marketAssets, ...marketAssets];

  return (
    <div
      className="bg-[#0A101D] border-b border-slate-800/80 text-xs text-slate-300 relative select-none flex items-center overflow-hidden h-10 shadow-sm z-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left Fixed Badge: Status da Sessão */}
      <div className="shrink-0 flex items-center gap-2 pl-3 pr-4 bg-[#0A101D] border-r border-slate-800/80 h-full z-10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200 uppercase tracking-wider">
          <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">MERCADOS EM TEMPO REAL</span>
          <span className="sm:hidden">MERCADOS</span>
        </div>
        <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono pl-1 border-l border-slate-800">
          <Clock className="w-3 h-3 text-slate-500" />
          {lastUpdatedTime || '14:35:00'}
        </span>
      </div>

      {/* Marquee Ticker Track */}
      <div className="relative flex-1 overflow-hidden flex items-center h-full">
        <div
          className={`flex items-center gap-6 whitespace-nowrap will-change-transform ${
            isPaused ? '' : 'animate-marquee'
          }`}
          style={{
            animation: isPaused ? 'none' : 'marquee 45s linear infinite',
          }}
        >
          {duplicatedAssets.map((asset, idx) => (
            <div
              key={`${asset.ticker}-${idx}`}
              onClick={() => onNavigateTab?.('market')}
              className="inline-flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-800/60 cursor-pointer transition text-xs group"
              title={`${asset.name} (${asset.category}) - Clique para ver inteligência macro`}
            >
              <span className="font-bold text-slate-200 group-hover:text-cyan-300 transition font-mono">
                {asset.ticker}
              </span>
              <span className="font-mono text-white font-semibold">{asset.value}</span>
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-semibold font-mono ${
                  asset.isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {asset.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {asset.change}
              </span>
              <span className="text-slate-700 mx-1">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Fixed Button: Acessar Inteligência Macro */}
      <div className="shrink-0 hidden lg:flex items-center pr-3 pl-4 bg-gradient-to-l from-[#0A101D] via-[#0A101D] to-transparent h-full z-10">
        <button
          onClick={() => onNavigateTab?.('market')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition shadow-xs"
        >
          <Activity className="w-3 h-3 text-indigo-400" />
          <span>Painel Macro</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Embedded CSS for smooth marquee keyframe */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};
