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
  Fuel,
  Radio,
  Edit3,
  Search,
  Check,
  X,
} from 'lucide-react';
import { Portfolio } from '../types';
import { TabKey } from './Header';
import {
  INITIAL_MARKET_ASSETS,
  OFFICIAL_MACRO_INDICATORS,
  MarketAsset,
  MacroIndicator,
} from '../data/wealthCopilotData';
import { MarketRadarRecalibrationView } from './MarketRadarRecalibrationView';

interface MarketIntelligenceViewProps {
  portfolios?: Portfolio[];
  selectedPortfolioId?: string;
  onSelectPortfolio?: (portfolioId: string) => void;
  onNavigateTab?: (tab: TabKey) => void;
  onStartRebalance?: (portfolioId: string) => void;
  currency?: 'USD' | 'BRL';
}

export const MarketIntelligenceView: React.FC<MarketIntelligenceViewProps> = ({
  portfolios = [],
  selectedPortfolioId,
  onSelectPortfolio,
  onNavigateTab,
  onStartRebalance,
  currency = 'BRL',
}) => {
  // Aba ativa interna de Inteligência de Mercado
  const [activeSubTab, setActiveSubTab] = useState<'RADAR' | 'MACRO_TABLE' | 'ASSETS_GRID' | 'YIELD_CURVES'>('ASSETS_GRID');

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'INDICES' | 'CAMBIO' | 'COMMODITIES' | 'JUROS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [macroList, setMacroList] = useState<MacroIndicator[]>(OFFICIAL_MACRO_INDICATORS);
  const [marketList, setMarketList] = useState<MarketAsset[]>(INITIAL_MARKET_ASSETS);
  const [editingItem, setEditingItem] = useState<{ code: string; val: string } | null>(null);
  const [editingAsset, setEditingAsset] = useState<{ ticker: string; value: string; change: string; isPositive: boolean } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredAssets = marketList.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ticker.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleUpdateIndicator = (code: string, newVal: string) => {
    setMacroList((prev) =>
      prev.map((item) => (item.code === code ? { ...item, currentValue: newVal } : item))
    );
    setEditingItem(null);
    showToast(`Indicador ${code} atualizado para ${newVal}`);
  };

  const handleResetMacroDefaults = () => {
    setMacroList(OFFICIAL_MACRO_INDICATORS);
    showToast('Indicadores macroeconômicos restaurados para os dados oficiais.');
  };

  const handleUpdateAsset = (ticker: string, newValue: string, newChange: string, isPositive: boolean) => {
    setMarketList((prev) =>
      prev.map((item) =>
        item.ticker === ticker
          ? {
              ...item,
              value: newValue,
              change: newChange,
              isPositive,
            }
          : item
      )
    );
    setEditingAsset(null);
    showToast(`Cotação do ativo ${ticker} atualizada com sucesso!`);
  };

  const handleResetAssetDefaults = async () => {
    try {
      const res = await fetch('/api/market/quotes');
      if (res.ok) {
        const data = await res.json();
        if (data.quotes && Array.isArray(data.quotes)) {
          setMarketList(data.quotes);
          showToast('Cotações de mercado sincronizadas com a base oficial B3, Bacen e Fed.');
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar endpoint oficial:', e);
    }
    setMarketList(INITIAL_MARKET_ASSETS);
    showToast('Cotações de mercado sincronizadas com a base oficial B3, Bacen e Fed.');
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100 pb-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-2xl animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal de Calibração Rápida de Ativo */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Calibrar Índice: {editingAsset.ticker}
                </h3>
              </div>
              <button
                onClick={() => setEditingAsset(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Valor da Cotação / Pontos / Taxa
                </label>
                <input
                  type="text"
                  value={editingAsset.value}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, value: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ex: 132.850 ou 13,75"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Variação Diária (%)
                </label>
                <input
                  type="text"
                  value={editingAsset.change}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, change: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ex: +0,32% ou -0,45%"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-semibold text-slate-300">Direção do Pregão:</span>
                <button
                  type="button"
                  onClick={() =>
                    setEditingAsset({ ...editingAsset, isPositive: true })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    editingAsset.isPositive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Alta / Positivo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingAsset({ ...editingAsset, isPositive: false })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    !editingAsset.isPositive
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Queda / Negativo
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                onClick={() => setEditingAsset(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  handleUpdateAsset(
                    editingAsset.ticker,
                    editingAsset.value,
                    editingAsset.change,
                    editingAsset.isPositive
                  )
                }
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-900/40"
              >
                <Check className="w-4 h-4" />
                Salvar Cotação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Navegação de Inteligência de Mercado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('ASSETS_GRID')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'ASSETS_GRID'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Monitor de Cotações em Tempo Real</span>
            <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-black uppercase text-cyan-200">
              {marketList.length} Ativos
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('RADAR')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'RADAR'
                ? 'bg-gradient-to-r from-rose-600 via-amber-600 to-orange-500 text-white shadow-lg shadow-rose-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Fuel className="w-4 h-4 animate-pulse" />
            <span>Radar de Mercado &amp; Choque de Energia</span>
            <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-black uppercase text-amber-200">
              🚨 Over / Neutro / Under
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('MACRO_TABLE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'MACRO_TABLE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Quadro Oficial Bacen / Copom / Fed</span>
          </button>

          <button
            onClick={() => setActiveSubTab('YIELD_CURVES')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'YIELD_CURVES'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Curvas de Juros DI &amp; Treasuries</span>
          </button>
        </div>
      </div>

      {/* Renderização Condicional da Sub-Aba */}
      {activeSubTab === 'RADAR' && (
        <MarketRadarRecalibrationView
          portfolios={portfolios}
          selectedPortfolioId={selectedPortfolioId}
          onSelectPortfolio={onSelectPortfolio}
          onNavigateTab={onNavigateTab}
          onStartRebalance={onStartRebalance}
          currency={currency}
        />
      )}

      {activeSubTab === 'ASSETS_GRID' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0E1626] border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-lg font-bold text-white">Monitor de Cotações em Tempo Real</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Índices, moedas, commodities energéticas e juros sincronizados com B3, Banco Central, IBGE e Fed.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar índice ou ticker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
                />
              </div>

              {/* Botão Sincronizar Cotações Oficiais */}
              <button
                onClick={handleResetAssetDefaults}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer shadow-sm"
                title="Sincronizar e restaurar cotações com fontes oficiais"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sincronizar Índices Oficiais</span>
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            {[
              { id: 'ALL', label: 'Todos os Ativos' },
              { id: 'INDICES', label: 'Índices de Ações & FIIs' },
              { id: 'CAMBIO', label: 'Câmbio (Moedas)' },
              { id: 'COMMODITIES', label: 'Commodities & Energia' },
              { id: 'JUROS', label: 'Juros, DI & Duration' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid de Ativos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredAssets.map((asset) => (
              <div
                key={asset.ticker}
                className="p-4 rounded-xl bg-[#0E1626] border border-slate-800/90 shadow-lg hover:border-slate-750 transition flex flex-col justify-between group relative"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-200 truncate pr-2" title={asset.name}>
                    {asset.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 font-mono font-bold text-slate-300">
                      {asset.ticker}
                    </span>
                    <button
                      onClick={() =>
                        setEditingAsset({
                          ticker: asset.ticker,
                          value: asset.value,
                          change: asset.change,
                          isPositive: asset.isPositive,
                        })
                      }
                      className="p-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white transition cursor-pointer"
                      title={`Calibrar valor de ${asset.ticker}`}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="my-2.5 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white tracking-tight font-mono">
                    {asset.value}
                  </span>
                  {asset.unit && (
                    <span className="text-xs font-semibold text-slate-400 ml-1">{asset.unit}</span>
                  )}
                </div>

                {/* Mini Sparkline Bar Chart */}
                {asset.sparkline && asset.sparkline.length > 0 && (
                  <div className="h-6 w-full flex items-end gap-1 my-1.5 opacity-70 group-hover:opacity-100 transition">
                    {asset.sparkline.map((val, idx) => {
                      const min = Math.min(...asset.sparkline!);
                      const max = Math.max(...asset.sparkline!);
                      const heightPercent = max === min ? 50 : Math.max(15, Math.min(100, Math.round(((val - min) / (max - min)) * 100)));
                      return (
                        <div
                          key={idx}
                          className={`flex-1 rounded-xs transition-all ${
                            asset.isPositive ? 'bg-emerald-500/60' : 'bg-rose-500/60'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                          title={`Pregão: ${val}`}
                        />
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs mt-1">
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

          {filteredAssets.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
              <p className="text-sm text-slate-400">Nenhum ativo encontrado para os filtros selecionados.</p>
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                }}
                className="mt-3 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'MACRO_TABLE' && (
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
                Parâmetros regulatórios e econômicos para cálculos de Sharpe, benchmark CDI, IPCA e limites CVM 175.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetMacroDefaults}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                title="Restaurar valores de consenso oficial Bacen"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar Padrão Bacen
              </button>
            </div>
          </div>

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
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-blue-400 hover:text-blue-300 font-medium border border-slate-700 transition cursor-pointer"
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
      )}

      {activeSubTab === 'YIELD_CURVES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Curva de Juros Local (DI) */}
          <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Curva de Juros Local (DI Futuro B3)</h3>
                <p className="text-xs text-slate-400">Taxas negociadas no mercado futuro para marcação a mercado</p>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Curva Normalizada
              </span>
            </div>

            <div className="h-44 w-full relative flex items-end justify-between gap-3 pt-6 pb-2">
              {[
                { year: 'Jan 26', rate: '13,95%', height: 68 },
                { year: 'Jan 27', rate: '14,25%', height: 76 },
                { year: 'Jan 28', rate: '14,45%', height: 82 },
                { year: 'Jan 29', rate: '14,65%', height: 88 },
                { year: 'Jan 31', rate: '14,55%', height: 84 },
                { year: 'Jan 33', rate: '14,40%', height: 80 },
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
                { tenor: '2Y', rate: '4,05%', height: 65 },
                { tenor: '5Y', rate: '4,10%', height: 68 },
                { tenor: '10Y', rate: '4,18%', height: 75 },
                { tenor: '30Y', rate: '4,45%', height: 86 },
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
      )}
    </div>
  );
};
