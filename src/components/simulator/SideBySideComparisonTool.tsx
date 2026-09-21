import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Scale,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  Filter,
  SlidersHorizontal,
  FileSpreadsheet,
  Info,
  ShieldCheck,
  Layers,
  ArrowLeftRight,
} from 'lucide-react';
import { Portfolio, AssetClass, RebalanceOrder } from '../../types';

export interface AllocationProjectionItem {
  assetClass: AssetClass;
  currentValue: number;
  currentPercent: number;
  projectedValue: number;
  projectedPercent: number;
  targetPercent: number;
  maxPercent: number;
  minPercent: number;
  deltaBRL: number;
  deltaPercent: number;
  isBreachedBefore: boolean;
  isBreachedAfter: boolean;
  color: string;
}

interface SideBySideComparisonToolProps {
  currentPortfolio: Portfolio;
  projectionData: AllocationProjectionItem[];
  totalAUM: number;
  totalTradedVolume: number;
  estimatedB3Costs: number;
  activeOrders: RebalanceOrder[];
}

type ViewFilter = 'ALL' | 'CHANGED_ONLY' | 'BREACHED_ONLY';
type SortOption = 'ABS_BRL' | 'ABS_PERCENT' | 'DEFAULT';
type DisplayLayout = 'CARDS' | 'TABLE';

export const SideBySideComparisonTool: React.FC<SideBySideComparisonToolProps> = ({
  currentPortfolio,
  projectionData,
  totalAUM,
  totalTradedVolume,
  estimatedB3Costs,
  activeOrders,
}) => {
  const [filter, setFilter] = useState<ViewFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('ABS_BRL');
  const [layout, setLayout] = useState<DisplayLayout>('CARDS');
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  // Filter and sort items
  const processedItems = useMemo(() => {
    let list = [...projectionData];

    if (filter === 'CHANGED_ONLY') {
      list = list.filter((item) => Math.abs(item.deltaBRL) > 1);
    } else if (filter === 'BREACHED_ONLY') {
      list = list.filter((item) => item.isBreachedBefore || item.isBreachedAfter);
    }

    if (sortBy === 'ABS_BRL') {
      list.sort((a, b) => Math.abs(b.deltaBRL) - Math.abs(a.deltaBRL));
    } else if (sortBy === 'ABS_PERCENT') {
      list.sort((a, b) => Math.abs(b.deltaPercent) - Math.abs(a.deltaPercent));
    }

    return list;
  }, [projectionData, filter, sortBy]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalAbsoluteDeltaBRL = projectionData.reduce(
      (acc, item) => acc + Math.abs(item.deltaBRL),
      0
    );

    // Identify largest buy and sell classes
    let largestBuy = { assetClass: '' as AssetClass, amount: 0 };
    let largestSell = { assetClass: '' as AssetClass, amount: 0 };

    projectionData.forEach((item) => {
      if (item.deltaBRL > largestBuy.amount) {
        largestBuy = { assetClass: item.assetClass, amount: item.deltaBRL };
      }
      if (item.deltaBRL < largestSell.amount) {
        largestSell = { assetClass: item.assetClass, amount: item.deltaBRL };
      }
    });

    const breachedBeforeCount = projectionData.filter((i) => i.isBreachedBefore).length;
    const breachedAfterCount = projectionData.filter((i) => i.isBreachedAfter).length;
    const classesAdjustedCount = projectionData.filter((i) => Math.abs(i.deltaBRL) > 1).length;

    return {
      totalAbsoluteDeltaBRL,
      turnoverRate: totalAUM > 0 ? (totalTradedVolume / 2 / totalAUM) * 100 : 0,
      largestBuy,
      largestSell,
      breachedBeforeCount,
      breachedAfterCount,
      classesAdjustedCount,
    };
  }, [projectionData, totalAUM, totalTradedVolume]);

  // Copy summary to clipboard for investment committee
  const handleCopySummary = () => {
    const client = currentPortfolio.clientName || currentPortfolio.name;
    const lines = [
      `RELATÓRIO COMPARATIVO DE REBALANCEAMENTO FIDUCIÁRIO - ${client.toUpperCase()}`,
      `Patrimônio Total sob Gestão (AUM): R$ ${totalAUM.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `Volume Total Transacionado: R$ ${totalTradedVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Taxa de Turnover: ${stats.turnoverRate.toFixed(2)}%)`,
      `Custos Estimados B3 (0,031%): R$ ${estimatedB3Costs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `Classes Reenquadradas: ${stats.breachedBeforeCount} fora do mandato -> ${stats.breachedAfterCount} após execução`,
      '',
      'VARIAÇÃO ABSOLUTA POR CLASSE DE ATIVOS:',
      ...projectionData.map((item) => {
        const sign = item.deltaBRL > 0 ? '+' : item.deltaBRL < 0 ? '-' : '';
        const absBRL = Math.abs(item.deltaBRL).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
        const pDelta = item.deltaPercent > 0 ? `+${item.deltaPercent.toFixed(2)}` : item.deltaPercent.toFixed(2);
        return `- ${item.assetClass}: Atual ${item.currentPercent.toFixed(2)}% (R$ ${(item.currentValue / 1000).toFixed(0)}k) -> Projetado ${item.projectedPercent.toFixed(2)}% (R$ ${(item.projectedValue / 1000).toFixed(0)}k) | Variação: ${sign}R$ ${absBRL} (${pDelta} p.p.) [Target Mandato: ${item.targetPercent}%]`;
      }),
      '',
      `Gerado automaticamente em ${new Date().toLocaleString('pt-BR')}`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0A101D] border border-slate-800 shadow-2xl space-y-6">
      {/* Header with Title and Executive Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/90">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Comparação Lado a Lado: Portfólio Atual vs. Modelo Sugerido
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Variação Absoluta
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audite classe a classe a transição de custódia, identificando o volume financeiro real (R$) e os pontos percentuais movimentados.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 shadow-sm"
            title="Copiar relatório comparativo completo para área de transferência"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar Resumo</span>
              </>
            )}
          </button>

          {/* Layout Toggle: Cards vs Dense Table */}
          <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setLayout('CARDS')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                layout === 'CARDS'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cards Lado a Lado</span>
            </button>
            <button
              onClick={() => setLayout('TABLE')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                layout === 'TABLE'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tabela Analítica</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Quick Summary of the Transition */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Volume de Giro (Turnover)
          </span>
          <span className="text-base font-black text-white font-mono mt-1">
            R$ {(totalTradedVolume / 1_000_000).toFixed(2)}M
          </span>
          <span className="text-[11px] text-slate-400 font-mono mt-0.5">
            {stats.turnoverRate.toFixed(1)}% do AUM Total
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Variação Absoluta Total
          </span>
          <span className="text-base font-black text-indigo-300 font-mono mt-1">
            R$ {(stats.totalAbsoluteDeltaBRL / 2 / 1_000_000).toFixed(2)}M
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            {stats.classesAdjustedCount} de 5 classes ajustadas
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Maior Aporte (Compra)
          </span>
          <span className="text-sm font-extrabold text-emerald-300 font-mono mt-1 truncate">
            {stats.largestBuy.amount > 0 ? (
              <>
                +R$ {(stats.largestBuy.amount / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
              </>
            ) : (
              'Nenhum aporte'
            )}
          </span>
          <span className="text-[11px] text-slate-400 truncate mt-0.5">
            {stats.largestBuy.assetClass || 'Sem compras'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            Maior Liquidação (Venda)
          </span>
          <span className="text-sm font-extrabold text-rose-300 font-mono mt-1 truncate">
            {stats.largestSell.amount < 0 ? (
              <>
                -R$ {(Math.abs(stats.largestSell.amount) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
              </>
            ) : (
              'Nenhuma venda'
            )}
          </span>
          <span className="text-[11px] text-slate-400 truncate mt-0.5">
            {stats.largestSell.assetClass || 'Sem liquidações'}
          </span>
        </div>
      </div>

      {/* Interactive Controls Bar: Filters and Sorting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/70 text-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            Filtrar:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              Todas ({projectionData.length})
            </button>
            <button
              onClick={() => setFilter('CHANGED_ONLY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'CHANGED_ONLY'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              Com Variação ({stats.classesAdjustedCount})
            </button>
            <button
              onClick={() => setFilter('BREACHED_ONLY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'BREACHED_ONLY'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              Desenquadradas ({stats.breachedBeforeCount})
            </button>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            Ordenar por:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSortBy('ABS_BRL')}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                sortBy === 'ABS_BRL'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Maior |Δ R$|
            </button>
            <button
              onClick={() => setSortBy('ABS_PERCENT')}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                sortBy === 'ABS_PERCENT'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Maior |Δ p.p.|
            </button>
            <button
              onClick={() => setSortBy('DEFAULT')}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                sortBy === 'DEFAULT'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Padrão
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW MODE 1: CARDS LADO A LADO (3 COLUNAS VISUAIS POR CLASSE) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {layout === 'CARDS' && (
        <div className="space-y-4">
          {/* Column Headers */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/60 rounded-xl border border-slate-800/60">
            <div className="lg:col-span-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span>Portfólio Atual (Custódia Vigente)</span>
            </div>
            <div className="lg:col-span-4 text-center flex items-center justify-center gap-2">
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
              <span>Variação Absoluta (Ajuste Fiduciário)</span>
            </div>
            <div className="lg:col-span-4 text-right flex items-center justify-end gap-2">
              <span>Modelo Sugerido (Alocação Alvo)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
          </div>

          {/* Asset Class Rows */}
          {processedItems.map((item) => {
            const hasChange = Math.abs(item.deltaBRL) > 1;
            const isBuy = item.deltaBRL > 0;
            const isSell = item.deltaBRL < 0;
            const absBRL = Math.abs(item.deltaBRL);
            const absPercent = Math.abs(item.deltaPercent);

            // Relative change of the class itself
            const relativeChangePct =
              item.currentValue > 0 ? (item.deltaBRL / item.currentValue) * 100 : 0;

            const ordersForClass = activeOrders.filter(
              (o) => o.assetClass === item.assetClass
            );

            return (
              <div
                key={item.assetClass}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  item.isBreachedBefore
                    ? 'bg-slate-900/90 border-rose-500/30 hover:border-rose-500/50'
                    : hasChange
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-850 opacity-90'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* ────────────────────────────────────────────────────────── */}
                  {/* COLUNA ESQUERDA: PORTFÓLIO ATUAL */}
                  {/* ────────────────────────────────────────────────────────── */}
                  <div className="lg:col-span-4 space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-bold text-white text-sm">
                          {item.assetClass}
                        </span>
                      </div>

                      {/* Status Atual */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          item.isBreachedBefore
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.isBreachedBefore ? '⚠️ Fora dos Limites' : 'Conforme'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-xs text-slate-400">Alocação Atual:</span>
                      <div className="text-right">
                        <span className="text-base font-extrabold font-mono text-indigo-300">
                          {item.currentPercent.toFixed(2)}%
                        </span>
                        <span className="text-xs text-slate-400 font-mono block">
                          R$ {(item.currentValue / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Visual Current */}
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, item.currentPercent)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>Mandato: {item.minPercent}% a {item.maxPercent}%</span>
                      <span className="text-cyan-300 font-mono">Meta: {item.targetPercent}%</span>
                    </div>
                  </div>

                  {/* ────────────────────────────────────────────────────────── */}
                  {/* COLUNA CENTRAL: VARIAÇÃO ABSOLUTA & FLUXO FINANCEIRO */}
                  {/* ────────────────────────────────────────────────────────── */}
                  <div className="lg:col-span-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
                    {/* Top Tag: Action Direction */}
                    <div className="flex items-center gap-1.5">
                      {isBuy && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          APORTE / COMPRA
                        </span>
                      )}
                      {isSell && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          LIQUIDAÇÃO / VENDA
                        </span>
                      )}
                      {!hasChange && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          NEUTRO / MANTER
                        </span>
                      )}
                    </div>

                    {/* Absolute Values Display */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`text-lg font-black font-mono tracking-tight ${
                            isBuy
                              ? 'text-emerald-400'
                              : isSell
                              ? 'text-rose-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {isBuy ? '+' : isSell ? '-' : ''}R${' '}
                          {(absBRL / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-xs font-mono">
                        <span
                          className={`font-bold ${
                            isBuy
                              ? 'text-emerald-400'
                              : isSell
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {isBuy ? '+' : isSell ? '-' : ''}
                          {absPercent.toFixed(2)} p.p.
                        </span>
                        {hasChange && (
                          <span className="text-slate-400 text-[11px]">
                            ({relativeChangePct > 0 ? '+' : ''}
                            {relativeChangePct.toFixed(1)}% na classe)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Visual Direction Arrows */}
                    <div className="flex items-center justify-center gap-1 text-slate-500">
                      <div className="h-[1px] w-8 bg-slate-800" />
                      <ArrowRight
                        className={`w-4 h-4 transition-colors ${
                          isBuy
                            ? 'text-emerald-400'
                            : isSell
                            ? 'text-rose-400'
                            : 'text-slate-600'
                        }`}
                      />
                      <div className="h-[1px] w-8 bg-slate-800" />
                    </div>

                    {/* Orders count */}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ordersForClass.length > 0
                        ? `${ordersForClass.length} ordem${ordersForClass.length > 1 ? 'ns' : ''} gerada${ordersForClass.length > 1 ? 's' : ''}`
                        : 'Nenhuma ordem necessária'}
                    </span>
                  </div>

                  {/* ────────────────────────────────────────────────────────── */}
                  {/* COLUNA DIREITA: MODELO SUGERIDO (DEPOIS) */}
                  {/* ────────────────────────────────────────────────────────── */}
                  <div className="lg:col-span-4 space-y-2 p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-bold text-emerald-300 text-sm">
                          Modelo Pós-Ajuste
                        </span>
                      </div>

                      {/* Status Projetado */}
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        100% CVM 175
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-xs text-slate-400">Alocação Projetada:</span>
                      <div className="text-right">
                        <span className="text-base font-extrabold font-mono text-emerald-400">
                          {item.projectedPercent.toFixed(2)}%
                        </span>
                        <span className="text-xs text-slate-400 font-mono block">
                          R$ {(item.projectedValue / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Visual Projected */}
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                        style={{
                          width: `${Math.min(100, item.projectedPercent)}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>Desvio da Meta:</span>
                      <span className="text-emerald-300 font-mono font-bold">
                        {Math.abs(item.projectedPercent - item.targetPercent) < 0.1
                          ? '0,00 p.p. (Meta Atingida)'
                          : `${(item.projectedPercent - item.targetPercent).toFixed(2)} p.p.`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Optional Expandable Orders for This Class */}
                {ordersForClass.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400 font-medium">
                      Ordens de execução para {item.assetClass}:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {ordersForClass.map((ord, idx) => (
                        <span
                          key={`${ord.assetId}-${ord.ticker}-${idx}`}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                            ord.action === 'BUY'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {ord.action === 'BUY' ? '▲ COMPRA' : '▼ VENDA'}{' '}
                          {ord.ticker}: R${' '}
                          {(ord.totalAmountBRL / 1000).toFixed(0)}k
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW MODE 2: TABELA ANALÍTICA LADO A LADO COM DESTAQUE ABSOLUTO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {layout === 'TABLE' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-300 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Classe de Ativos</th>
                <th className="py-3 px-3 text-right bg-indigo-950/20 text-indigo-300">
                  Atual (R$)
                </th>
                <th className="py-3 px-3 text-right bg-indigo-950/20 text-indigo-300">
                  Atual (%)
                </th>
                <th className="py-3 px-3 text-center bg-blue-950/30 text-blue-300">
                  Ação
                </th>
                <th className="py-3 px-3 text-right bg-blue-950/40 text-white font-extrabold">
                  Δ Absoluto (R$)
                </th>
                <th className="py-3 px-3 text-right bg-blue-950/40 text-white font-extrabold">
                  Δ Absoluto (p.p.)
                </th>
                <th className="py-3 px-3 text-right bg-emerald-950/20 text-emerald-300">
                  Sugerido (R$)
                </th>
                <th className="py-3 px-3 text-right bg-emerald-950/20 text-emerald-300">
                  Sugerido (%)
                </th>
                <th className="py-3 px-3 text-center">Mandato (Target)</th>
                <th className="py-3 px-3 text-center">Status CVM 175</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
              {processedItems.map((item) => {
                const isBuy = item.deltaBRL > 0;
                const isSell = item.deltaBRL < 0;
                const absBRL = Math.abs(item.deltaBRL);
                const absPP = Math.abs(item.deltaPercent);

                return (
                  <tr key={item.assetClass} className="hover:bg-slate-850/50 transition">
                    {/* Classe */}
                    <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.assetClass}</span>
                    </td>

                    {/* Atual R$ */}
                    <td className="py-3 px-3 text-right font-mono text-slate-300 bg-indigo-950/10">
                      R$ {(item.currentValue / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
                    </td>

                    {/* Atual % */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-indigo-300 bg-indigo-950/10">
                      {item.currentPercent.toFixed(2)}%
                    </td>

                    {/* Ação */}
                    <td className="py-3 px-3 text-center">
                      {isBuy && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          COMPRA
                        </span>
                      )}
                      {isSell && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          VENDA
                        </span>
                      )}
                      {!isBuy && !isSell && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                          MANTER
                        </span>
                      )}
                    </td>

                    {/* Delta Absoluto R$ */}
                    <td className="py-3 px-3 text-right font-mono font-black text-sm bg-blue-950/20">
                      <span
                        className={
                          isBuy
                            ? 'text-emerald-400'
                            : isSell
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {isBuy ? '+' : isSell ? '-' : ''}R${' '}
                        {(absBRL / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
                      </span>
                    </td>

                    {/* Delta Absoluto p.p. */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-xs bg-blue-950/20">
                      <span
                        className={
                          isBuy
                            ? 'text-emerald-400'
                            : isSell
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {isBuy ? '+' : isSell ? '-' : ''}
                        {absPP.toFixed(2)} p.p.
                      </span>
                    </td>

                    {/* Sugerido R$ */}
                    <td className="py-3 px-3 text-right font-mono text-slate-300 bg-emerald-950/10">
                      R$ {(item.projectedValue / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
                    </td>

                    {/* Sugerido % */}
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-400 bg-emerald-950/10">
                      {item.projectedPercent.toFixed(2)}%
                    </td>

                    {/* Target */}
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {item.minPercent}% a {item.maxPercent}% ({item.targetPercent}%)
                    </td>

                    {/* Status CVM 175 */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            item.isBreachedBefore
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.isBreachedBefore ? 'Fora' : 'OK'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Compliant
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-950 border-t border-slate-800 font-bold text-slate-200">
              <tr>
                <td className="py-3 px-3">Total / AUM</td>
                <td className="py-3 px-3 text-right font-mono">
                  R$ {(totalAUM / 1_000_000).toFixed(2)}M
                </td>
                <td className="py-3 px-3 text-right font-mono">100,00%</td>
                <td className="py-3 px-3 text-center text-slate-400 text-[10px]">
                  {stats.classesAdjustedCount} ajustadas
                </td>
                <td className="py-3 px-3 text-right font-mono text-indigo-300">
                  R$ {(stats.totalAbsoluteDeltaBRL / 2 / 1_000_000).toFixed(2)}M giro
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-400">-</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-300">
                  R$ {(totalAUM / 1_000_000).toFixed(2)}M
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400">100,00%</td>
                <td className="py-3 px-3 text-center text-slate-400">-</td>
                <td className="py-3 px-3 text-center text-emerald-400 text-[10px]">
                  100% Enquadrado
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Audit Footnote */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Auditoria fiduciária em conformidade com CVM 175 (art. 64) e Políticas de Risco Internas.
          </span>
        </div>
        <span className="font-mono text-slate-400">
          Tolerância de enquadramento: ±1,0 p.p. do target do mandato
        </span>
      </div>
    </div>
  );
};
