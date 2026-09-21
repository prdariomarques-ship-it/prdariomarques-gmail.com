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
  ShieldAlert,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  INITIAL_MARKET_ASSETS,
  OFFICIAL_MACRO_INDICATORS,
  MarketAsset,
  MacroIndicator,
} from '../data/wealthCopilotData';

export const MarketIntelligenceView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'INDICES' | 'CAMBIO' | 'COMMODITIES' | 'JUROS'>('ALL');
  const [macroList, setMacroList] = useState<MacroIndicator[]>(OFFICIAL_MACRO_INDICATORS);
  const [isEditingMacro, setIsEditingMacro] = useState(false);
  const [editingItem, setEditingItem] = useState<{ code: string; val: string } | null>(null);

  const filtered = INITIAL_MARKET_ASSETS.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  const handleUpdateIndicator = (code: string, newVal: string) => {
    setMacroList((prev) =>
      prev.map((item) => (item.code === code ? { ...item, currentValue: newVal } : item))
    );
    setEditingItem(null);
  };

  const handleResetDefaults = () => {
    setMacroList(OFFICIAL_MACRO_INDICATORS);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Inteligência Macroeconômica &amp; Mercado de Capitais
              </h1>
              <p className="text-xs text-slate-400">
                Dados oficiais vigentes (Banco Central, Copom, IBGE, B3 e Fed) e monitoramento de curvas em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs gap-1">
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

      {/* Grid of All Filtered Market Assets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {filtered.map((asset) => (
          <div
            key={asset.ticker}
            className="p-4 rounded-xl bg-[#0E1626] border border-slate-800/90 shadow-lg hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-slate-200 truncate pr-2">{asset.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 font-mono">
                {asset.ticker}
              </span>
            </div>
            <div className="my-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white tracking-tight font-mono">
                {asset.value}
              </span>
              {asset.unit && (
                <span className="text-xs font-semibold text-slate-400">{asset.unit}</span>
              )}
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
                {asset.change}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Pregão Atual</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quadro Oficial de Indicadores Macroeconômicos (Banco Central / IBGE / B3 / Fed) */}
      <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-bold text-white">
                Quadro Oficial de Indicadores Macroeconômicos Vigentes
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Parâmetros regulatórios e econômicos para cálculos de Sharpe, benchmark CDI, IPCA e limite CVM 175.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition border border-slate-700"
              title="Restaurar valores de consenso oficial Bacen"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restaurar Padrão Bacen
            </button>
          </div>
        </div>

        {/* Indicators Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-2.5 font-semibold">Indicador Econômico</th>
                <th className="pb-2.5 font-semibold">Valor Vigente</th>
                <th className="pb-2.5 font-semibold">Anterior</th>
                <th className="pb-2.5 font-semibold">Fonte Oficial</th>
                <th className="pb-2.5 font-semibold">Frequência</th>
                <th className="pb-2.5 font-semibold">Impacto Fiduciário</th>
                <th className="pb-2.5 font-semibold text-right">Ajuste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {macroList.map((ind) => (
                <tr key={ind.code} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 pr-3 font-semibold text-slate-200 flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        ind.trend === 'UP'
                          ? 'bg-amber-400'
                          : ind.trend === 'DOWN'
                          ? 'bg-blue-400'
                          : 'bg-slate-400'
                      }`}
                    />
                    {ind.name}
                  </td>
                  <td className="py-3 pr-3">
                    {editingItem?.code === ind.code ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editingItem.val}
                          onChange={(e) =>
                            setEditingItem({ code: ind.code, val: e.target.value })
                          }
                          className="w-20 px-2 py-0.5 rounded bg-slate-950 border border-blue-500 text-white font-mono text-xs focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateIndicator(ind.code, editingItem.val)}
                          className="px-2 py-0.5 rounded bg-blue-600 text-white font-medium hover:bg-blue-500"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono font-black text-sm text-emerald-300">
                        {ind.currentValue} <span className="text-[11px] font-normal text-slate-400">{ind.unit}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3 font-mono text-slate-400">
                    {ind.previousValue} {ind.unit}
                  </td>
                  <td className="py-3 pr-3 text-slate-300 font-medium">
                    {ind.source}
                  </td>
                  <td className="py-3 pr-3 text-slate-400">
                    {ind.frequency}
                  </td>
                  <td className="py-3 pr-3 text-slate-300 max-w-xs">
                    {ind.impactDescription}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() =>
                        setEditingItem({ code: ind.code, val: ind.currentValue })
                      }
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-blue-400 hover:text-blue-300 font-medium border border-slate-700 transition"
                    >
                      Calibrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Macro Yield Curves & Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Curva de Juros Local (DI) */}
        <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Curva de Juros Local (DI Futuro B3)</h3>
              <p className="text-xs text-slate-400">Taxas negociadas no mercado futuro para marcação a mercado</p>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Curva Inclinada (Pré 15%+)
            </span>
          </div>

          <div className="h-44 w-full relative flex items-end justify-between gap-3 pt-6 pb-2">
            {[
              { year: 'Jan 26', rate: '14,85%', height: 68 },
              { year: 'Jan 27', rate: '15,10%', height: 78 },
              { year: 'Jan 28', rate: '15,25%', height: 85 },
              { year: 'Jan 29', rate: '15,35%', height: 92 },
              { year: 'Jan 31', rate: '15,28%', height: 88 },
              { year: 'Jan 33', rate: '15,20%', height: 84 },
            ].map((node) => (
              <div key={node.year} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-cyan-300">
                  {node.rate}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-blue-700 to-cyan-400 rounded-t-lg transition-all shadow-sm"
                  style={{ height: `${node.height}%` }}
                />
                <span className="text-[10px] text-slate-300 font-medium">
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
              <h3 className="text-sm font-bold text-white">US Treasuries Yield Curve (Fed)</h3>
              <p className="text-xs text-slate-400">Balizador para carteiras offshore, bonds soberanos e ETFs em USD</p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Normalizada 10Y-2Y
            </span>
          </div>

          <div className="h-44 w-full relative flex items-end justify-between gap-3 pt-6 pb-2">
            {[
              { tenor: '3M', rate: '4,50%', height: 82 },
              { tenor: '2Y', rate: '4,25%', height: 68 },
              { tenor: '5Y', rate: '4,32%', height: 72 },
              { tenor: '10Y', rate: '4,48%', height: 80 },
              { tenor: '30Y', rate: '4,68%', height: 92 },
            ].map((node) => (
              <div key={node.tenor} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-emerald-300">
                  {node.rate}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-indigo-700 to-emerald-400 rounded-t-lg transition-all shadow-sm"
                  style={{ height: `${node.height}%` }}
                />
                <span className="text-[10px] text-slate-300 font-medium">
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
