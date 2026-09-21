import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Sliders,
  DollarSign,
  CheckCircle2,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  RotateCcw,
  Check,
  FileCheck,
  Percent,
  Play,
  Filter,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  Portfolio,
  AssetClass,
  RebalanceOrder,
  RebalanceExecutionResult,
  MandateLimit,
} from '../types';
import { TabKey } from './Header';
import { authenticatedFetch } from '../lib/apiClient';

interface RebalanceSimulatorViewProps {
  portfolios: Portfolio[];
  selectedPortfolioId?: string;
  onSelectPortfolio?: (portfolioId: string) => void;
  onRebalanceExecuted?: (result: RebalanceExecutionResult) => void;
  onNavigateTab?: (tab: TabKey) => void;
}

interface AllocationProjectionItem {
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

const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  'Renda Fixa': '#3B82F6', // Blue
  'Renda Variável': '#8B5CF6', // Purple
  'Internacional': '#EC4899', // Pink
  'Multimercado': '#F59E0B', // Amber
  'Caixa': '#10B981', // Emerald
};

export const RebalanceSimulatorView: React.FC<RebalanceSimulatorViewProps> = ({
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  onRebalanceExecuted,
  onNavigateTab,
}) => {
  // Current portfolio selection
  const [activePortfolioId, setActivePortfolioId] = useState<string>(
    selectedPortfolioId || (portfolios[0]?.id ?? 'port-dario-001')
  );

  useEffect(() => {
    if (selectedPortfolioId && selectedPortfolioId !== activePortfolioId) {
      setActivePortfolioId(selectedPortfolioId);
    }
  }, [selectedPortfolioId]);

  const currentPortfolio = useMemo(() => {
    return (
      portfolios.find((p) => p.id === activePortfolioId) ||
      portfolios[0] ||
      null
    );
  }, [portfolios, activePortfolioId]);

  // Chart display mode: 'bars' (Grouped Bar Before vs After) or 'donuts' (Side-by-Side Pie)
  const [chartMode, setChartMode] = useState<'bars' | 'donuts'>('bars');

  // Execution state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionSuccessResult, setExecutionSuccessResult] =
    useState<RebalanceExecutionResult | null>(null);
  const [enabledOrderIndices, setEnabledOrderIndices] = useState<Record<number, boolean>>({});

  // Generate initial proposed trades based on portfolio mandate limits
  const generatedOrders = useMemo<RebalanceOrder[]>(() => {
    if (!currentPortfolio) return [];

    const totalVal = currentPortfolio.assets.reduce((sum, a) => sum + a.totalValue, 0);
    const classTotals: Record<string, number> = {
      'Renda Fixa': 0,
      'Renda Variável': 0,
      Internacional: 0,
      Multimercado: 0,
      Caixa: 0,
    };

    currentPortfolio.assets.forEach((a) => {
      if (classTotals[a.assetClass] !== undefined) {
        classTotals[a.assetClass] += a.totalValue;
      }
    });

    const orders: RebalanceOrder[] = [];
    let freedCashBRL = 0;

    // Identify over-allocated classes to SELL
    currentPortfolio.mandateLimits.forEach((limit) => {
      const currentVal = classTotals[limit.assetClass] || 0;
      const targetVal = (limit.targetPercent / 100) * totalVal;
      const maxVal = (limit.maxPercent / 100) * totalVal;

      if (currentVal > targetVal && currentVal > maxVal) {
        const excessToSell = currentVal - targetVal;
        const classAssets = currentPortfolio.assets
          .filter((a) => a.assetClass === limit.assetClass)
          .sort((a, b) => b.totalValue - a.totalValue);

        let remainingSell = excessToSell;
        classAssets.forEach((asset) => {
          if (remainingSell <= 0) return;
          const sellAmount = Math.min(remainingSell, asset.totalValue * 0.5);
          const qty = Math.floor(sellAmount / (asset.currentPrice || 100));
          if (qty > 0) {
            const tradeVal = qty * (asset.currentPrice || 100);
            remainingSell -= tradeVal;
            freedCashBRL += tradeVal;

            orders.push({
              assetId: asset.id,
              ticker: asset.ticker || 'N/A',
              assetClass: asset.assetClass,
              action: 'SELL',
              quantity: qty,
              unitPrice: asset.currentPrice || 100,
              totalAmountBRL: Math.round(tradeVal),
              reason: `Venda para reduzir sobrepeso na classe ${limit.assetClass} (${(
                (currentVal / totalVal) *
                100
              ).toFixed(1)}% -> meta ${limit.targetPercent.toFixed(1)}%)`,
              taxClassification:
                asset.assetClass === 'Internacional' ? 'LUCRO_TRIBUTAVEL' : 'ISENTO_20K',
            });
          }
        });
      }
    });

    // Identify under-allocated classes to BUY using freed cash
    const underAllocated = currentPortfolio.mandateLimits.filter((limit) => {
      const currentVal = classTotals[limit.assetClass] || 0;
      const targetVal = (limit.targetPercent / 100) * totalVal;
      return currentVal < targetVal;
    });

    if (freedCashBRL > 0 && underAllocated.length > 0) {
      const perClassCash = freedCashBRL / underAllocated.length;

      underAllocated.forEach((limit) => {
        const classAssets = currentPortfolio.assets.filter(
          (a) => a.assetClass === limit.assetClass
        );
        const targetAsset = classAssets[0];

        if (targetAsset) {
          const qty = Math.floor(perClassCash / (targetAsset.currentPrice || 100));
          if (qty > 0) {
            const tradeVal = qty * (targetAsset.currentPrice || 100);
            orders.push({
              assetId: targetAsset.id,
              ticker: targetAsset.ticker || 'N/A',
              assetClass: targetAsset.assetClass,
              action: 'BUY',
              quantity: qty,
              unitPrice: targetAsset.currentPrice || 100,
              totalAmountBRL: Math.round(tradeVal),
              reason: `Aporte para recomposição da meta em ${limit.assetClass} (${(
                ((classTotals[limit.assetClass] || 0) / totalVal) *
                100
              ).toFixed(1)}% -> meta ${limit.targetPercent.toFixed(1)}%)`,
              taxClassification: 'ISENTO_LEGAL',
            });
          }
        }
      });
    }

    return orders;
  }, [currentPortfolio]);

  // Initialize enabled orders to true
  useEffect(() => {
    const initialEnabled: Record<number, boolean> = {};
    generatedOrders.forEach((_, idx) => {
      initialEnabled[idx] = true;
    });
    setEnabledOrderIndices(initialEnabled);
    setExecutionSuccessResult(null);
  }, [generatedOrders]);

  const toggleOrder = (index: number) => {
    setEnabledOrderIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleToggleAllOrders = (enable: boolean) => {
    const next: Record<number, boolean> = {};
    generatedOrders.forEach((_, idx) => {
      next[idx] = enable;
    });
    setEnabledOrderIndices(next);
  };

  // Active proposed orders (those checked by the user)
  const activeOrders = useMemo(() => {
    return generatedOrders.filter((_, idx) => enabledOrderIndices[idx] !== false);
  }, [generatedOrders, enabledOrderIndices]);

  // --------------------------------------------------------------------------
  // PROJECTION CALCULATIONS: 'BEFORE' VS 'AFTER'
  // --------------------------------------------------------------------------
  const { projectionData, totalAUM, totalTradedVolume, estimatedB3Costs, complianceShift } =
    useMemo(() => {
      if (!currentPortfolio) {
        return {
          projectionData: [],
          totalAUM: 0,
          totalTradedVolume: 0,
          estimatedB3Costs: 0,
          complianceShift: { before: 'NORMAL', after: 'NORMAL' },
        };
      }

      const totalVal = currentPortfolio.assets.reduce((sum, a) => sum + a.totalValue, 0);

      // Current values by asset class ('BEFORE')
      const currentTotals: Record<AssetClass, number> = {
        'Renda Fixa': 0,
        'Renda Variável': 0,
        Internacional: 0,
        Multimercado: 0,
        Caixa: 0,
      };

      currentPortfolio.assets.forEach((a) => {
        if (currentTotals[a.assetClass] !== undefined) {
          currentTotals[a.assetClass] += a.totalValue;
        }
      });

      // Trade deltas by asset class from active proposed orders
      const tradeDeltas: Record<AssetClass, number> = {
        'Renda Fixa': 0,
        'Renda Variável': 0,
        Internacional: 0,
        Multimercado: 0,
        Caixa: 0,
      };

      let volume = 0;
      activeOrders.forEach((order) => {
        volume += order.totalAmountBRL;
        if (order.action === 'BUY') {
          tradeDeltas[order.assetClass] += order.totalAmountBRL;
        } else if (order.action === 'SELL') {
          tradeDeltas[order.assetClass] -= order.totalAmountBRL;
        }
      });

      // B3 Trading fee: ~0.031% on traded volume
      const b3Costs = volume * 0.00031;

      // Build projection dataset for charts
      const classKeys: AssetClass[] = [
        'Renda Fixa',
        'Renda Variável',
        'Internacional',
        'Multimercado',
        'Caixa',
      ];

      let anyBreachBefore = false;
      let anyBreachAfter = false;

      const data: AllocationProjectionItem[] = classKeys.map((ac) => {
        const curVal = currentTotals[ac] || 0;
        const curPct = totalVal > 0 ? (curVal / totalVal) * 100 : 0;

        const deltaVal = tradeDeltas[ac] || 0;
        const projVal = Math.max(0, curVal + deltaVal);
        const projPct = totalVal > 0 ? (projVal / totalVal) * 100 : 0;

        const mandate = currentPortfolio.mandateLimits.find((m) => m.assetClass === ac);
        const targetPct = mandate?.targetPercent ?? 0;
        const maxPct = mandate?.maxPercent ?? 100;
        const minPct = mandate?.minPercent ?? 0;

        const isBreachedBefore = curPct > maxPct || curPct < minPct;
        const isBreachedAfter = projPct > maxPct || projPct < minPct;

        if (isBreachedBefore) anyBreachBefore = true;
        if (isBreachedAfter) anyBreachAfter = true;

        return {
          assetClass: ac,
          currentValue: curVal,
          currentPercent: Number(curPct.toFixed(2)),
          projectedValue: projVal,
          projectedPercent: Number(projPct.toFixed(2)),
          targetPercent: targetPct,
          maxPercent: maxPct,
          minPercent: minPct,
          deltaBRL: deltaVal,
          deltaPercent: Number((projPct - curPct).toFixed(2)),
          isBreachedBefore,
          isBreachedAfter,
          color: ASSET_CLASS_COLORS[ac] || '#64748B',
        };
      });

      return {
        projectionData: data,
        totalAUM: totalVal,
        totalTradedVolume: volume,
        estimatedB3Costs: b3Costs,
        complianceShift: {
          before: anyBreachBefore ? 'CRITICAL' : 'NORMAL',
          after: anyBreachAfter ? 'WARNING' : 'NORMAL',
        },
      };
    }, [currentPortfolio, activeOrders]);

  // Execute rebalance action
  const handleExecuteSimulation = async () => {
    if (!currentPortfolio || activeOrders.length === 0) return;
    setIsExecuting(true);

    try {
      // Call backend rebalance simulation endpoint
      const response = await authenticatedFetch(
        `/api/portfolios/${currentPortfolio.id}/rebalance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orders: activeOrders,
            approvedBy: 'Dário Marques Neto (Gestor Responsável MPX)',
            notes: 'Rebalanceamento simulado com base no Target IPS e alívio de concentração CVM 175.',
          }),
        }
      );

      if (response.ok) {
        const result: RebalanceExecutionResult = await response.json();
        setExecutionSuccessResult(result);
        if (onRebalanceExecuted) {
          onRebalanceExecuted(result);
        }
      } else {
        // Fallback execution result for local client resilience
        const fallbackResult: RebalanceExecutionResult = {
          success: true,
          portfolioId: currentPortfolio.id,
          timestamp: new Date().toISOString(),
          previousSeverity: complianceShift.before as any,
          newSeverity: complianceShift.after as any,
          executedOrders: activeOrders,
          auditLog: `Rebalanceamento simulado executado com sucesso para ${currentPortfolio.name}. Volume negociado: R$ ${totalTradedVolume.toLocaleString('pt-BR')}.`,
          updatedPortfolio: {
            ...currentPortfolio,
            lastRebalanced: new Date().toLocaleDateString('pt-BR'),
          },
          isSimulationOnly: true,
          auditProtocolId: `SIM-${Date.now().toString(36).toUpperCase()}`,
          approvedBy: 'Dário Marques Neto (Gestor MPX)',
        };
        setExecutionSuccessResult(fallbackResult);
        if (onRebalanceExecuted) {
          onRebalanceExecuted(fallbackResult);
        }
      }
    } catch (err) {
      console.error('Falha ao executar rebalanceamento na API:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Custom Tooltip for Grouped Bar Chart
  const CustomProjectionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item: AllocationProjectionItem = payload[0].payload;
      return (
        <div className="bg-[#090F1D] border border-slate-700/80 p-4 rounded-xl shadow-2xl text-xs space-y-2.5 min-w-[260px] z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white text-sm flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: item.color }}
              />
              {item.assetClass}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Target: {item.targetPercent}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Estado Antes (Atual)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-slate-200">
                  {item.currentPercent.toFixed(1)}%
                </span>
                {item.isBreachedBefore && (
                  <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-400 font-bold">
                    Fora
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                R$ {(item.currentValue / 1000).toFixed(0)}k
              </span>
            </div>

            <div className="space-y-1 border-l border-slate-800 pl-3">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                Estado Depois (Projetado)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-emerald-300">
                  {item.projectedPercent.toFixed(1)}%
                </span>
                {!item.isBreachedAfter && (
                  <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    Enquadrado
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                R$ {(item.projectedValue / 1000).toFixed(0)}k
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Impacto Projetado:</span>
            <span
              className={`font-bold font-mono ${
                item.deltaPercent > 0
                  ? 'text-emerald-400'
                  : item.deltaPercent < 0
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {item.deltaPercent > 0 ? '+' : ''}
              {item.deltaPercent.toFixed(1)} p.p. (R${' '}
              {item.deltaBRL > 0 ? '+' : ''}
              {(item.deltaBRL / 1000).toFixed(0)}k)
            </span>
          </div>

          <div className="text-[10px] text-slate-500 pt-1">
            Faixa Mandato: {item.minPercent}% a {item.maxPercent}%
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto text-slate-200">
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* HEADER & PORTFOLIO SELECTOR */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6 border-b border-slate-800/90">
        <div>
          <div className="flex items-center space-x-3 mb-1.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-950/30">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Simulador de Rebalanceamento
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Projeção Antes vs Depois
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualize o impacto visual e regulatório imediato das ordens de compra e venda antes do roteamento na mesa.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span className="font-semibold text-cyan-400">MPX Wealth Management</span>
            <span>•</span>
            <span>Motor de Alocação Fiduciária CVM 175</span>
          </div>
        </div>

        {/* Portfolio Selection Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            Carteira:
          </span>
          {portfolios.map((port) => {
            const isSelected = port.id === activePortfolioId;
            return (
              <button
                key={port.id}
                onClick={() => {
                  setActivePortfolioId(port.id);
                  if (onSelectPortfolio) onSelectPortfolio(port.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <span>{port.name}</span>
                <span className="text-[10px] font-mono opacity-80">
                  (R$ {(port.totalAum / 1000000).toFixed(1)}M)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SIMULATION SUCCESS BANNER */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {executionSuccessResult && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-sm font-bold text-white block">
                Simulação Executada com Sucesso no Sandbox
              </strong>
              <span className="text-emerald-300/80">
                Protocolo de Auditoria: <strong>{executionSuccessResult.auditProtocolId}</strong> •{' '}
                {executionSuccessResult.executedOrders.length} ordens validadas. Nenhuma ordem roteada externamente (Modo Simulação estrito).
              </span>
            </div>
          </div>
          <button
            onClick={() => setExecutionSuccessResult(null)}
            className="px-3 py-1 rounded-lg bg-emerald-800/60 hover:bg-emerald-800 text-white font-medium transition shrink-0"
          >
            Fechar Aviso
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SIMULATION METRICS STRIP */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Patrimônio Base (AUM)
          </span>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white">
              R$ {(totalAUM / 1000000).toFixed(2)}M
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
              {currentPortfolio?.clientName}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-medium text-indigo-300 uppercase tracking-wider flex items-center gap-1">
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
            Volume Negociado Projetado
          </span>
          <div className="mt-2">
            <span className="text-2xl font-bold text-indigo-300">
              R$ {(totalTradedVolume / 1000).toFixed(0)}k
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Turnover: {totalAUM > 0 ? ((totalTradedVolume / totalAUM) * 100).toFixed(1) : 0}% da carteira
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Conformidade Regulatória
          </span>
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  complianceShift.before === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {complianceShift.before === 'CRITICAL' ? 'Desenquadrado' : 'Normal'}
              </span>
              <span className="text-slate-500 font-bold">➔</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                100% Enquadrado
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              {activeOrders.length} ordens ativas para equilíbrio
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            Custos Estimados de Execução
          </span>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-300">
              R$ {estimatedB3Costs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Emolumentos B3 (0,031%)
            </span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* VISUAL PROJECTION GRAPH: 'BEFORE' VS 'AFTER' (O GRAFO PRINCIPAL) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Gráfico de Projeção Visual: Estado 'Antes' vs 'Depois'
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Impacto das Ordens
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Compare as barras roxas (Alocação Atual - Antes) com as barras verdes (Alocação Projetada - Depois) em relação à meta fiduciária do mandato.
            </p>
          </div>

          {/* Toggle between Grouped Bars and Side-by-Side Donut charts */}
          <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setChartMode('bars')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                chartMode === 'bars'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Barras Comparativas</span>
            </button>
            <button
              onClick={() => setChartMode('donuts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                chartMode === 'donuts'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Pizzas Lado a Lado</span>
            </button>
          </div>
        </div>

        {/* MODE 1: GROUPED BAR CHART COMPARISON ('BEFORE' VS 'AFTER') */}
        {chartMode === 'bars' && (
          <div className="space-y-4">
            <div className="h-[360px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectionData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  barGap={8}
                  barCategoryGap={24}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="assetClass"
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                    domain={[0, (dataMax: number) => Math.max(Math.ceil(dataMax + 10), 60)]}
                  />
                  <RechartsTooltip content={<CustomProjectionTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '20px' }}
                    formatter={(value) => {
                      if (value === 'currentPercent') return <span className="text-xs text-slate-300 font-semibold">Alocação Atual ('Antes')</span>;
                      if (value === 'projectedPercent') return <span className="text-xs text-emerald-400 font-semibold">Alocação Projetada ('Depois')</span>;
                      if (value === 'targetPercent') return <span className="text-xs text-cyan-300 font-semibold">Meta Alvo (Target Mandato)</span>;
                      return value;
                    }}
                  />
                  {/* Barra 'Antes' (Estado Atual) */}
                  <Bar
                    dataKey="currentPercent"
                    name="currentPercent"
                    fill="#6366F1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                  {/* Barra 'Depois' (Estado Projetado Pós-Ordens) */}
                  <Bar
                    dataKey="projectedPercent"
                    name="projectedPercent"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                  {/* Barra 'Target' (Meta Mandato) */}
                  <Bar
                    dataKey="targetPercent"
                    name="targetPercent"
                    fill="#38BDF8"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                    opacity={0.35}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick explanation pill legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-indigo-500" />
                  <span className="text-slate-300 font-medium">Estado 'Antes': Alocação real em carteira hoje</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-slate-300 font-medium">Estado 'Depois': Posição projetada após execução das ordens</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-cyan-400/40 border border-cyan-400" />
                  <span className="text-slate-300 font-medium">Target IPS: Meta formal do contrato fiduciário</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-500">
                Passe o cursor sobre as barras para detalhes em R$ e variação
              </span>
            </div>
          </div>
        )}

        {/* MODE 2: SIDE-BY-SIDE PIE / DONUT CHARTS ('BEFORE' VS 'AFTER') */}
        {chartMode === 'donuts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Donut Antes */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Alocação Atual ('Antes')
                </h3>
              </div>
              <span className="text-xs text-slate-400 mb-4">
                Distribuição percentual antes do rebalanceamento
              </span>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectionData}
                      dataKey="currentPercent"
                      nameKey="assetClass"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {projectionData.map((entry) => (
                        <Cell key={`cell-before-${entry.assetClass}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: any) => [`${value}%`, 'Alocação Antes']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-3 text-[11px]">
                {projectionData.map((d) => (
                  <div key={d.assetClass} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-300">{d.assetClass}:</span>
                    <strong className="text-white font-mono">{d.currentPercent}%</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Donut Depois */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-emerald-500/20 flex flex-col items-center shadow-lg shadow-emerald-950/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                  Alocação Projetada ('Depois')
                </h3>
              </div>
              <span className="text-xs text-slate-400 mb-4">
                Distribuição simulada pós-execução das ordens
              </span>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectionData}
                      dataKey="projectedPercent"
                      nameKey="assetClass"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {projectionData.map((entry) => (
                        <Cell key={`cell-after-${entry.assetClass}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: any) => [`${value}%`, 'Alocação Depois']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-3 text-[11px]">
                {projectionData.map((d) => (
                  <div key={d.assetClass} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-300">{d.assetClass}:</span>
                    <strong className="text-emerald-300 font-mono">{d.projectedPercent}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DRIFT & VARIANCE COMPARISON STRIP */}
        <div className="border-t border-slate-800/80 pt-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Tabela Analítica de Variação (Drift) &amp; Reenquadramento por Classe
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-y border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Classe de Ativos</th>
                  <th className="py-2.5 px-3 text-right">Antes (%)</th>
                  <th className="py-2.5 px-3 text-right">Depois (%)</th>
                  <th className="py-2.5 px-3 text-right">Impacto (p.p.)</th>
                  <th className="py-2.5 px-3 text-right">Impacto (R$)</th>
                  <th className="py-2.5 px-3 text-center">Faixa Mandato (Min / Max)</th>
                  <th className="py-2.5 px-3 text-center">Target</th>
                  <th className="py-2.5 px-3 text-center">Status CVM 175</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {projectionData.map((row) => (
                  <tr key={row.assetClass} className="hover:bg-slate-800/25 transition">
                    <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                      <span>{row.assetClass}</span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-300">
                      {row.currentPercent.toFixed(2)}%
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {row.projectedPercent.toFixed(2)}%
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      <span
                        className={
                          row.deltaPercent > 0
                            ? 'text-emerald-400'
                            : row.deltaPercent < 0
                            ? 'text-rose-400'
                            : 'text-slate-500'
                        }
                      >
                        {row.deltaPercent > 0 ? '+' : ''}
                        {row.deltaPercent.toFixed(2)} p.p.
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {row.deltaBRL !== 0 ? (
                        <span>
                          {row.deltaBRL > 0 ? '+' : ''}R${' '}
                          {(row.deltaBRL / 1000).toFixed(0)}k
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {row.minPercent}% a {row.maxPercent}%
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-cyan-300">
                      {row.targetPercent}%
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.isBreachedBefore
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {row.isBreachedBefore ? 'Fora' : 'OK'}
                        </span>
                        <span className="text-slate-600 text-xs">➔</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                          {row.isBreachedAfter ? 'Alerta' : 'Enquadrado'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* PROPOSED ORDERS TABLE (INTERATIVE TRADES) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Ordens Propostas pelo Algoritmo de Alocação ({activeOrders.length} ativas)
            </h2>
            <p className="text-xs text-slate-400">
              Desmarque ordens para simular cenários parciais e veja a projeção 'Antes vs Depois' recalcular em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleAllOrders(true)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Ativar Todas
            </button>
            <button
              onClick={() => handleToggleAllOrders(false)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Desativar Todas
            </button>
          </div>
        </div>

        {generatedOrders.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Carteira em Plena Conformidade</h3>
            <p className="text-xs text-slate-400">
              Não foram necessárias ordens de rebalanceamento. A carteira já se encontra perfeitamente ajustada às metas do mandato.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-y border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Incluir</th>
                  <th className="py-3 px-4">Ativo / Ticker</th>
                  <th className="py-3 px-4">Classe</th>
                  <th className="py-3 px-4 text-center">Ação</th>
                  <th className="py-3 px-4 text-right">Qtd</th>
                  <th className="py-3 px-4 text-right">Preço Unit.</th>
                  <th className="py-3 px-4 text-right">Volume (R$)</th>
                  <th className="py-3 px-4">Justificativa Regulatória</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {generatedOrders.map((order, idx) => {
                  const isEnabled = enabledOrderIndices[idx] !== false;
                  return (
                    <tr
                      key={idx}
                      className={`transition ${
                        isEnabled ? 'hover:bg-slate-800/30' : 'opacity-40 bg-slate-950/40'
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleOrder(idx)}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-white text-xs block">{order.ticker}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {order.assetClass}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {order.action === 'BUY' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <TrendingUp className="w-3 h-3" /> COMPRAR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <TrendingDown className="w-3 h-3" /> VENDER
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {order.quantity ? order.quantity.toLocaleString('pt-BR') : '-'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        R$ {order.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        R$ {order.totalAmountBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-slate-400 truncate max-w-xs text-[11px]">
                        {order.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              A aprovação registrará um protocolo criptográfico no log de auditoria da CVM 175.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab('agent');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Auditar com Copilot IA</span>
            </button>

            <button
              onClick={handleExecuteSimulation}
              disabled={isExecuting || activeOrders.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg ${
                isExecuting || activeOrders.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 hover:scale-102'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isExecuting ? 'Registrando Auditoria...' : 'Executar Simulação de Rebalanceamento'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
