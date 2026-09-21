import React, { useState } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
  Globe,
  BarChart2,
  Calendar,
  Layers,
} from 'lucide-react';
import { INITIAL_MARKET_ASSETS, MarketAsset } from '../data/wealthCopilotData';

export const MarketIntelligenceView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'INDICES' | 'CAMBIO' | 'COMMODITIES' | 'JUROS'>('ALL');

  const filtered = INITIAL_MARKET_ASSETS.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Inteligência Global de Mercado &amp; Indicadores
              </h1>
              <p className="text-xs text-slate-400">
                Curvas de juros DI, US Treasuries, câmbio B3/NY e commodities essenciais.
              </p>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          {[
            { id: 'ALL', label: 'Todos os Ativos' },
            { id: 'INDICES', label: 'Índices' },
            { id: 'CAMBIO', label: 'Câmbio' },
            { id: 'COMMODITIES', label: 'Commodities' },
            { id: 'JUROS', label: 'Juros & Duration' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Key Market Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.slice(0, 4).map((asset) => (
          <div
            key={asset.ticker}
            className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-slate-300">{asset.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                {asset.ticker}
              </span>
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-white tracking-tight font-mono">
                {asset.value} {asset.unit}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <span
                className={`flex items-center gap-1 font-bold ${
                  asset.isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {asset.isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {asset.change} hoje
              </span>
              <span className="text-[11px] text-slate-500">Tempo Real</span>
            </div>
          </div>
        ))}
      </div>

      {/* Macro Yield Curves & Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Curva de Juros Local (DI) */}
        <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Curva de Juros Local (DI Futuro)</h3>
              <p className="text-xs text-slate-400">Impacto direto no rebalanceamento de debêntures e CDBs</p>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Inclinação Positiva
            </span>
          </div>

          <div className="h-44 w-full relative flex items-end justify-between gap-3 pt-6 pb-2">
            {[
              { year: 'Jan 25', rate: '12,15%', height: 45 },
              { year: 'Jan 26', rate: '13,15%', height: 60 },
              { year: 'Jan 27', rate: '13,42%', height: 72 },
              { year: 'Jan 29', rate: '13,80%', height: 85 },
              { year: 'Jan 31', rate: '13,95%', height: 92 },
            ].map((node) => (
              <div key={node.year} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-cyan-300">
                  {node.rate}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg transition-all"
                  style={{ height: `${node.height}%` }}
                />
                <span className="text-[10px] text-slate-400 font-medium">
                  {node.year}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Curva de Juros Americana (Treasuries) */}
        <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">US Treasuries Yield Curve</h3>
              <p className="text-xs text-slate-400">Balizador para a carteira offshore Avenue &amp; ETFs</p>
            </div>
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Desinversão 10Y-2Y
            </span>
          </div>

          <div className="h-44 w-full relative flex items-end justify-between gap-3 pt-6 pb-2">
            {[
              { tenor: '3M', rate: '5,25%', height: 95 },
              { tenor: '2Y', rate: '4,10%', height: 65 },
              { tenor: '5Y', rate: '4,05%', height: 60 },
              { tenor: '10Y', rate: '4,22%', height: 70 },
              { tenor: '30Y', rate: '4,45%', height: 80 },
            ].map((node) => (
              <div key={node.tenor} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-emerald-300">
                  {node.rate}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-indigo-600 to-emerald-400 rounded-t-lg transition-all"
                  style={{ height: `${node.height}%` }}
                />
                <span className="text-[10px] text-slate-400 font-medium">
                  {node.tenor}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
