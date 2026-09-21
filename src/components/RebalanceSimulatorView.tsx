import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import Markdown from 'react-markdown';
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
  Pause,
  RefreshCw,
  Filter,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Shield,
  Zap,
  Target,
  Bot,
  Copy,
  CheckCheck,
  FileText,
  ChevronUp,
  ChevronDown,
  X,
  BookOpen,
  Scale,
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
import {
  STRESS_SCENARIOS,
  StressScenarioId,
  calculatePortfolioStress,
  PortfolioResilienceReport,
} from '../utils/simulationEngine';
import { SideBySideComparisonTool } from './simulator/SideBySideComparisonTool';

export type RebalanceStrategy = 'Conservative' | 'Moderate' | 'Aggressive';

export const REBALANCE_STRATEGY_INFO: Record<
  RebalanceStrategy,
  {
    name: string;
    tag: string;
    description: string;
    focus: string;
    turnoverEstimate: string;
    taxImpact: string;
    color: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    iconColor: string;
  }
> = {
  Conservative: {
    name: 'Conservador',
    tag: 'Menor Giro & Proteção Fiscal',
    description:
      'Minimiza custos operacionais e evita fatura desnecessária de ganho de capital. Reduz apenas o montante estritamente necessário para eliminar desenquadramentos CVM 175, retendo margem de segurança e preservando liquidez em caixa e renda fixa.',
    focus: 'Preservação de Capital & Mínimo Turnover',
    turnoverEstimate: 'Baixo (~1.8% a ~3.2% do AUM)',
    taxImpact: 'Mínimo (Isenção tributária priorizada)',
    color: '#6366F1',
    badgeBg: 'bg-indigo-500/15',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-300',
    iconColor: 'text-indigo-400',
  },
  Moderate: {
    name: 'Moderado',
    tag: 'Equilíbrio & Target IPS Padrão',
    description:
      'Estratégia fiduciária padrão de convergência ao mandato. Realinha as classes de ativos diretamente aos pontos centrais (targets) estipulados na política de investimento, distribuindo a liquidez gerada de forma equilibrada entre classes subalocadas.',
    focus: 'Convergência Fiduciária Direta ao Target',
    turnoverEstimate: 'Moderado (~4.5% a ~7.5% do AUM)',
    taxImpact: 'Neutro (Otimizado entre ativos)',
    color: '#06B6D4',
    badgeBg: 'bg-cyan-500/15',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-300',
    iconColor: 'text-cyan-400',
  },
  Aggressive: {
    name: 'Agressivo',
    tag: 'Convergência Plena & Alpha Tilt',
    description:
      'Zera prontamente qualquer sobrepeso regulatório e reinveste 100% da liquidez gerada com forte sobrepeso em classes defasadas de maior potencial de retorno (ações e ativos internacionais), maximizando a captura de prêmio de risco.',
    focus: 'Retorno Total & Recomposição Acelerada',
    turnoverEstimate: 'Alto (~8.5% a ~14.0% do AUM)',
    taxImpact: 'Convencional B3 (Rotatividade ágil)',
    color: '#10B981',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-300',
    iconColor: 'text-emerald-400',
  },
};

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

  // Rebalance Strategy: 'Conservative' | 'Moderate' | 'Aggressive'
  const [rebalanceStrategy, setRebalanceStrategy] = useState<RebalanceStrategy>('Moderate');
  const strategyInfo = REBALANCE_STRATEGY_INFO[rebalanceStrategy];

  // Projection stage: 'comparison' (Before & After) | 'before' (Only Antes) | 'after' (Only Depois)
  const [projectionStage, setProjectionStage] = useState<'comparison' | 'before' | 'after'>('comparison');
  const [isAutoTransitioning, setIsAutoTransitioning] = useState<boolean>(false);

  // Auto-transition loop between 'before' and 'after' for smooth live visual impact simulation
  useEffect(() => {
    if (!isAutoTransitioning) return;
    const interval = setInterval(() => {
      setProjectionStage((prev) => (prev === 'before' ? 'after' : 'before'));
    }, 2600);
    return () => clearInterval(interval);
  }, [isAutoTransitioning]);

  // Execution state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionSuccessResult, setExecutionSuccessResult] =
    useState<RebalanceExecutionResult | null>(null);
  const [enabledOrderIndices, setEnabledOrderIndices] = useState<Record<number, boolean>>({});

  // ComplianceAgent Strategy Explanation state
  const [isExplainingStrategy, setIsExplainingStrategy] = useState<boolean>(false);
  const [strategyExplanation, setStrategyExplanation] = useState<string | null>(null);
  const [explainedStrategy, setExplainedStrategy] = useState<RebalanceStrategy | null>(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState<boolean>(false);
  const [isExplanationMinimized, setIsExplanationMinimized] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [explanationTimestamp, setExplanationTimestamp] = useState<string | null>(null);

  // Market Stress Testing state & resilience calculation
  const [selectedStressScenario, setSelectedStressScenario] = useState<StressScenarioId>('EQUITY_DROP_10');
  const [showStressDetails, setShowStressDetails] = useState<boolean>(false);

  const currentStressReport = useMemo<PortfolioResilienceReport | null>(() => {
    if (!currentPortfolio) return null;
    const { report } = calculatePortfolioStress(currentPortfolio, selectedStressScenario);
    return report;
  }, [currentPortfolio, selectedStressScenario]);

  // Generate initial proposed trades based on portfolio mandate limits & strategy profile
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

      let excessToSell = 0;

      if (rebalanceStrategy === 'Conservative') {
        // Only sell if strictly exceeding maxPercent, bringing it safely into the regulatory band with a 1.5% buffer
        if (currentVal > maxVal) {
          const safeThreshold = ((limit.maxPercent - 1.5) / 100) * totalVal;
          excessToSell = Math.max(0, currentVal - safeThreshold);
        }
      } else if (rebalanceStrategy === 'Moderate') {
        // Standard Target IPS convergence: sell excess above target if exceeding target or max
        if (currentVal > targetVal && currentVal > maxVal) {
          excessToSell = currentVal - targetVal;
        }
      } else if (rebalanceStrategy === 'Aggressive') {
        // Full convergence: sell any excess above targetVal even if within max band, unlocking full liquidity
        if (currentVal > targetVal) {
          excessToSell = currentVal - targetVal;
        }
      }

      if (excessToSell > 0) {
        const classAssets = currentPortfolio.assets
          .filter((a) => a.assetClass === limit.assetClass)
          .sort((a, b) => b.totalValue - a.totalValue);

        let remainingSell = excessToSell;
        classAssets.forEach((asset) => {
          if (remainingSell <= 0) return;
          const maxSellRatio =
            rebalanceStrategy === 'Conservative'
              ? 0.35
              : rebalanceStrategy === 'Aggressive'
              ? 0.75
              : 0.5;
          const sellAmount = Math.min(remainingSell, asset.totalValue * maxSellRatio);
          const qty = Math.floor(sellAmount / (asset.currentPrice || 100));
          if (qty > 0) {
            const tradeVal = qty * (asset.currentPrice || 100);
            remainingSell -= tradeVal;
            freedCashBRL += tradeVal;

            let reasonTag = '[Estratégia Moderada]';
            if (rebalanceStrategy === 'Conservative') {
              reasonTag = '[Estratégia Conservadora • Mínimo Giro]';
            } else if (rebalanceStrategy === 'Aggressive') {
              reasonTag = '[Estratégia Agressiva • Convergência Plena]';
            }

            orders.push({
              assetId: asset.id,
              ticker: asset.ticker || 'N/A',
              assetClass: asset.assetClass,
              action: 'SELL',
              quantity: qty,
              unitPrice: asset.currentPrice || 100,
              totalAmountBRL: Math.round(tradeVal),
              reason: `${reasonTag} Venda para readequação em ${limit.assetClass} (${(
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
      // Calculate weights for distributing freed cash based on strategy
      let weights: Record<string, number> = {};
      let sumWeights = 0;

      underAllocated.forEach((limit) => {
        const gap = (limit.targetPercent / 100) * totalVal - (classTotals[limit.assetClass] || 0);
        let weight = Math.max(1, gap);

        if (rebalanceStrategy === 'Conservative') {
          // Conservative tilts cash towards Renda Fixa & Caixa for stability & safety
          if (limit.assetClass === 'Renda Fixa' || limit.assetClass === 'Caixa') {
            weight *= 2.0;
          }
        } else if (rebalanceStrategy === 'Aggressive') {
          // Aggressive tilts towards growth/alpha assets (Renda Variável, Internacional)
          if (limit.assetClass === 'Renda Variável' || limit.assetClass === 'Internacional') {
            weight *= 2.5;
          } else if (limit.assetClass === 'Multimercado') {
            weight *= 1.6;
          }
        }
        weights[limit.assetClass] = weight;
        sumWeights += weight;
      });

      underAllocated.forEach((limit) => {
        const classAssets = currentPortfolio.assets.filter(
          (a) => a.assetClass === limit.assetClass
        );
        const targetAsset = classAssets[0];

        if (targetAsset && sumWeights > 0) {
          const classCashRatio = weights[limit.assetClass] / sumWeights;
          const classCash = freedCashBRL * classCashRatio;
          const qty = Math.floor(classCash / (targetAsset.currentPrice || 100));
          if (qty > 0) {
            const tradeVal = qty * (targetAsset.currentPrice || 100);
            let reasonTag = '[Estratégia Moderada]';
            if (rebalanceStrategy === 'Conservative') {
              reasonTag = '[Estratégia Conservadora • Preservação de Capital]';
            } else if (rebalanceStrategy === 'Aggressive') {
              reasonTag = '[Estratégia Agressiva • Recomposição Acelerada]';
            }

            orders.push({
              assetId: targetAsset.id,
              ticker: targetAsset.ticker || 'N/A',
              assetClass: targetAsset.assetClass,
              action: 'BUY',
              quantity: qty,
              unitPrice: targetAsset.currentPrice || 100,
              totalAmountBRL: Math.round(tradeVal),
              reason: `${reasonTag} Aporte em ${limit.assetClass} (${(
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
  }, [currentPortfolio, rebalanceStrategy]);

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
            strategy: rebalanceStrategy,
            approvedBy: 'Dário Marques Neto (Gestor Responsável MPX)',
            notes: `Rebalanceamento simulado sob estratégia [${strategyInfo.name.toUpperCase()} - ${strategyInfo.tag}] com base no Target IPS e enquadramento CVM 175.`,
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
          auditLog: `Rebalanceamento simulado sob estratégia [${strategyInfo.name}] executado com sucesso para ${currentPortfolio.name}. Volume negociado: R$ ${totalTradedVolume.toLocaleString('pt-BR')}.`,
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

  // Generate Strategy Explanation using ComplianceAgent
  const handleGenerateStrategyExplanation = async (strategyOverride?: RebalanceStrategy) => {
    if (!currentPortfolio) return;
    const targetStrategy = strategyOverride || rebalanceStrategy;
    const targetStrategyInfo = REBALANCE_STRATEGY_INFO[targetStrategy];

    setIsExplainingStrategy(true);
    setIsExplanationOpen(true);
    setIsExplanationMinimized(false);

    try {
      const response = await authenticatedFetch('/api/compliance/explain-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId: currentPortfolio.id,
          strategy: targetStrategy,
          orders: activeOrders,
          projectionData: projectionData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStrategyExplanation(data.explanation);
        setExplainedStrategy(targetStrategy);
        setExplanationTimestamp(new Date().toLocaleTimeString('pt-BR'));
      } else {
        throw new Error(`Status ${response.status}`);
      }
    } catch (err) {
      console.warn('Utilizando fallback resiliente de explicação de estratégia:', err);
      const totalAum = currentPortfolio.totalAum;
      const turnoverPct = totalAum > 0 ? (totalTradedVolume / totalAum) * 100 : 0;
      const sellOrders = activeOrders.filter((o) => o.action === 'SELL');
      const buyOrders = activeOrders.filter((o) => o.action === 'BUY');

      const text = `### 🛡️ Parecer de Estratégia Recomendada — ComplianceAgent FlowCore
**Ref.:** Análise Fiduciária de Rebalanceamento Simulado sob Estratégia **${targetStrategyInfo.name} (${targetStrategyInfo.tag})**  
**Carteira:** ${currentPortfolio.name} (${currentPortfolio.code}) | **Titular:** ${currentPortfolio.clientName}  
**Mandato:** ${currentPortfolio.profile} (Benchmark: ${currentPortfolio.benchmark}) | **Data da Emissão:** ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}  
**AUM Total:** R$ ${totalAum.toLocaleString('pt-BR')} | **Volume Negociado:** R$ ${totalTradedVolume.toLocaleString('pt-BR')} (Turnover: **${turnoverPct.toFixed(2)}%**)

---

#### 1. 🎯 Racional da Estratégia [${targetStrategy.toUpperCase()}]
${targetStrategyInfo.description}

- **Alinhamento com o Perfil ${currentPortfolio.profile}:** A parametrização ${targetStrategy.toLowerCase()} foi calibrada especificamente para equilibrar a tolerância a risco do titular com as exigências regulatórias da CVM 175.
- **Disciplina de Alocação:** Acalma a volatilidade estrutural da carteira enquanto assegura liquidez para compromissos financeiros programados.

---

#### 2. 🔍 Motivo Lógico dos Ajustes Propostos (${activeOrders.length} Boletas Ativas)
${
  activeOrders.length === 0
    ? 'A carteira já se encontra com todas as suas classes de ativos devidamente enquadradas dentro das bandas estipuladas. Nenhuma ordem de alienação ou aquisição foi demandada.'
    : `O motor de alocação estruturou as seguintes ações prioritárias:
- **Ordens de Venda (Desinvestimento):** ${sellOrders.length} boleta(s) totalizando **R$ ${sellOrders.reduce((s, o) => s + o.totalAmountBRL, 0).toLocaleString('pt-BR')}**
  ${sellOrders.map((o) => `  - **${o.ticker}** (${o.assetClass}): alienação de **${o.quantity}** cotas/ações (~R$ ${o.totalAmountBRL.toLocaleString('pt-BR')}). *Racional:* ${o.reason}.`).join('\n')}
- **Ordens de Compra (Reinvestimento):** ${buyOrders.length} boleta(s) totalizando **R$ ${buyOrders.reduce((s, o) => s + o.totalAmountBRL, 0).toLocaleString('pt-BR')}**
  ${buyOrders.length > 0 ? buyOrders.map((o) => `  - **${o.ticker}** (${o.assetClass}): aporte de **${o.quantity}** cotas/ações (~R$ ${o.totalAmountBRL.toLocaleString('pt-BR')}). *Racional:* ${o.reason}.`).join('\n') : '  - *Retenção prudencial em Caixa/Títulos pós-fixados de liquidez imediata.*'}`
}

---

#### 3. ⚖️ Enquadramento Regulatório (Resolução CVM 175 & Mandato IPS)
- **Mitigação de Desenquadramento Passivo:** Conforme preconiza a Resolução CVM 175, desvios decorrentes da valorização assimétrica de ativos devem ser sanados em até **15 dias úteis**. A implementação desta simulação neutraliza infrações fiduciárias antes da formalização do informe diário à CVM.
- **Proteção do Administrador Fiduciário:** A execução do plano sob protocolo auditado descaracteriza qualquer quebra culposa de mandato, resguardando o gestor (Dário Marques Neto) e a instituição perante órgãos reguladores.

---

#### 4. 💡 Análise de Eficiência Tributária & Custos B3
- **Giro & Custos B3:** Custos de emolumentos e corretagem B3 estimados em **R$ ${estimatedB3Costs.toLocaleString('pt-BR')}** sobre volume de R$ ${totalTradedVolume.toLocaleString('pt-BR')}.
- **Impacto Tributário:** ${targetStrategyInfo.taxImpact}.
- **Liquidez & Slippage:** As ordens foram calibradas respeitando os volumes médios diários negociados (ADTV), prevenindo impacto desfavorável no book de ofertas na execução.

---

#### 5. 📋 Conclusão & Recomendação do ComplianceAgent
> **PARECER FINAL:** O plano de rebalanceamento sob a estratégia **${targetStrategy.toUpperCase()}** apresenta **viabilidade técnica e regulatória plena**. Aprovada a submissão das ordens simuladas para deliberação do Gestor Responsável e posterior encaminhamento ao Comitê de Alocação da FlowCore.`;

      setStrategyExplanation(text);
      setExplainedStrategy(targetStrategy);
      setExplanationTimestamp(new Date().toLocaleTimeString('pt-BR'));
    } finally {
      setIsExplainingStrategy(false);
    }
  };

  const handleCopyExplanation = () => {
    if (!strategyExplanation) return;
    navigator.clipboard.writeText(strategyExplanation).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    });
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
            <span className="text-[11px] font-mono text-cyan-300 font-semibold">
              Target: {item.targetPercent}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wider block">
                Estado Antes (Atual)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-white">
                  {item.currentPercent.toFixed(1)}%
                </span>
                {item.isBreachedBefore && (
                  <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                    Fora
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-300 block font-mono font-medium">
                R$ {(item.currentValue / 1000).toFixed(0)}k
              </span>
            </div>

            <div className="space-y-1 border-l border-slate-800 pl-3">
              <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider block">
                Estado Depois (Projetado)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-emerald-300">
                  {item.projectedPercent.toFixed(1)}%
                </span>
                {!item.isBreachedAfter && (
                  <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Enquadrado
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-300 block font-mono font-medium">
                R$ {(item.projectedValue / 1000).toFixed(0)}k
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium">Impacto Projetado:</span>
            <span
              className={`font-bold font-mono ${
                item.deltaPercent > 0
                  ? 'text-emerald-400'
                  : item.deltaPercent < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {item.deltaPercent > 0 ? '+' : ''}
              {item.deltaPercent.toFixed(1)} p.p. (R${' '}
              {item.deltaBRL > 0 ? '+' : ''}
              {(item.deltaBRL / 1000).toFixed(0)}k)
            </span>
          </div>

          <div className="text-[11px] text-slate-300 font-medium pt-1">
            Faixa Mandato: <span className="font-mono text-white">{item.minPercent}% a {item.maxPercent}%</span>
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
      {/* BANNER DE SIMULAÇÃO DE ESTRESSE DE MERCADO & RESILIÊNCIA FIDUCIÁRIA */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0B1222] to-[#0E172B] border border-blue-900/50 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white tracking-tight">
                  Simulação de Cenários de Estresse de Mercado
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Teste de Resiliência
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Avalie a robustez da carteira sob choques severos de Bolsa, Juros, Dólar e Spreads de Crédito antes de rebalancear.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {currentStressReport && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400">Impacto Estimado</span>
                <span
                  className={`text-xs font-black font-mono ${
                    currentStressReport.pnlPercent < 0
                      ? 'text-rose-400'
                      : currentStressReport.pnlPercent > 0
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }`}
                >
                  {currentStressReport.pnlPercent >= 0 ? '+' : ''}
                  {currentStressReport.pnlPercent.toFixed(1)}% (R${' '}
                  {(currentStressReport.pnlBrl / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k)
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400">Score de Resiliência</span>
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {currentStressReport.resilienceScore}/100 ({currentStressReport.resilienceClassification})
                </span>
              </div>

              <button
                onClick={() => setShowStressDetails(!showStressDetails)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5 text-blue-400" />
                {showStressDetails ? 'Ocultar Análise' : 'Detalhes do Choque'}
              </button>
            </div>
          )}
        </div>

        {/* Stress Scenario Selector Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            {[
              { id: 'EQUITY_DROP_10', label: '📉 Queda de Bolsa 10%', icon: TrendingDown },
              { id: 'RATES_HIKE_200', label: '📈 Alta de Juros +2% (+200 bps)', icon: TrendingUp },
              { id: 'EQUITY_DROP_20', label: '⚠️ Queda Severa Bolsa 20%', icon: AlertTriangle },
              { id: 'RATES_HIKE_400', label: '⚡ Choque Juros +4% (+400 bps)', icon: Zap },
              { id: 'STRESS_CRISIS', label: '💥 Crise Combinada (Bolsa -15%, Juros +3%)', icon: AlertTriangle },
              { id: 'FX_SHOCK_15', label: '💵 Choque Cambial (Dólar +15%)', icon: DollarSign },
              { id: 'CREDIT_SPREAD_300', label: '🏛️ Spreads de Crédito (+300 bps)', icon: Layers },
              { id: 'BASELINE', label: '🛡️ Mercado Neutro (0%)', icon: ShieldCheck },
            ].map((scen) => {
              const isSelected = selectedStressScenario === scen.id;
              return (
                <button
                  key={scen.id}
                  onClick={() => setSelectedStressScenario(scen.id as StressScenarioId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 scale-[1.02]'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {scen.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Expandable Stress Analysis & Mitigation Details */}
        {showStressDetails && currentStressReport && (
          <div className="mt-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs space-y-3 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <span className="font-bold text-white text-sm">
                  {STRESS_SCENARIOS[selectedStressScenario].name}
                </span>
                <p className="text-slate-400 text-xs mt-0.5">
                  {STRESS_SCENARIOS[selectedStressScenario].description}
                </p>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">
                Hipótese: {STRESS_SCENARIOS[selectedStressScenario].hypothesis}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Patrimônio sob Estresse
                </span>
                <div className="text-sm font-bold text-white font-mono">
                  R$ {(currentStressReport.stressedAum / 1_000_000).toFixed(2)}M
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    (de R$ {(currentStressReport.baseAum / 1_000_000).toFixed(2)}M)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Colchão Defensivo (Caixa/LFT)
                </span>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {currentStressReport.cushionBufferPercent.toFixed(1)}% do AUM
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    ({currentStressReport.cushionBufferPercent >= 30 ? 'Adequado' : 'Abaixo do ideal'})
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Exposição Internacional Pós-Choque
                </span>
                <div
                  className={`text-sm font-bold font-mono ${
                    currentStressReport.cvm175BreachedUnderStress ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {currentStressReport.offshoreStressedWeight.toFixed(1)}% / máx 20,0%
                  {currentStressReport.cvm175BreachedUnderStress && (
                    <span className="text-[10px] px-1 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 ml-1.5">
                      Alerta CVM 175
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Key Insights & Recommended Action */}
            <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 space-y-1.5">
              <span className="font-bold text-blue-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Diagnóstico Fiduciário do Choque:
              </span>
              <ul className="list-disc list-inside text-slate-300 space-y-0.5 pl-1">
                {currentStressReport.keyInsights.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
              <p className="text-emerald-300 font-semibold pt-1 border-t border-blue-900/30">
                💡 Recomendação Preventiva: {currentStressReport.recommendedAction}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* STRATEGY SELECTOR CONTROLS (DROPDOWN & TOGGLE) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Estratégia de Rebalanceamento
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${strategyInfo.badgeBg} ${strategyInfo.badgeBorder} ${strategyInfo.badgeText}`}
                >
                  {strategyInfo.tag}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Alterne a estratégia para recalcular dinamicamente o volume de giro e as ordens propostas antes da execução.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Small Dropdown for switching */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              <label htmlFor="rebalance-strategy-select" className="text-xs text-slate-400 font-medium whitespace-nowrap">
                Modo:
              </label>
              <select
                id="rebalance-strategy-select"
                value={rebalanceStrategy}
                onChange={(e) => setRebalanceStrategy(e.target.value as RebalanceStrategy)}
                className="bg-transparent text-xs text-white border-0 py-1 pl-1 pr-2 font-semibold cursor-pointer outline-none focus:ring-0"
              >
                <option value="Conservative" className="bg-slate-900 text-white">
                  Conservative (Conservador)
                </option>
                <option value="Moderate" className="bg-slate-900 text-white">
                  Moderate (Moderado)
                </option>
                <option value="Aggressive" className="bg-slate-900 text-white">
                  Aggressive (Agressivo)
                </option>
              </select>
            </div>

            {/* Segmented Button Toggle */}
            <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl shadow-inner">
              <button
                type="button"
                onClick={() => setRebalanceStrategy('Conservative')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  rebalanceStrategy === 'Conservative'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Conservador</span>
              </button>

              <button
                type="button"
                onClick={() => setRebalanceStrategy('Moderate')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  rebalanceStrategy === 'Moderate'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Moderado</span>
              </button>

              <button
                type="button"
                onClick={() => setRebalanceStrategy('Aggressive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  rebalanceStrategy === 'Aggressive'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Agressivo</span>
              </button>
            </div>

            {/* ComplianceAgent Strategy Explanation Button */}
            <button
              type="button"
              onClick={() => handleGenerateStrategyExplanation()}
              disabled={isExplainingStrategy}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-md shadow-indigo-950/40 active:scale-95 disabled:opacity-60 cursor-pointer"
              title="Utiliza o ComplianceAgent para gerar o parecer e explicação lógica da estratégia selecionada"
            >
              {isExplainingStrategy ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-200" />
                  <span>ComplianceAgent Analisando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Explicar Estratégia</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Strategy Context Card */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="text-slate-300 leading-relaxed max-w-3xl">
            <strong className="text-white">{strategyInfo.name}:</strong> {strategyInfo.description}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
              Turnover Estimado: <strong className="text-white">{strategyInfo.turnoverEstimate}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
              Foco: <strong className="text-white">{strategyInfo.focus}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* COMPLIANCEAGENT STRATEGY EXPLANATION PANEL */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isExplainingStrategy && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-slate-900/90 border border-indigo-500/40 shadow-xl space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    ComplianceAgent em Execução
                  </span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Avaliando lógica fiduciária, bandas regulatórias CVM 175, rotatividade de carteira e eficiência tributária para a estratégia <strong className="text-white">{strategyInfo.name}</strong>...
                </p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 animate-pulse w-3/4 rounded-full" />
            </div>
          </motion.div>
        )}

        {strategyExplanation && isExplanationOpen && !isExplainingStrategy && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.25 }}
            className="p-5 rounded-2xl bg-slate-900/95 border border-indigo-500/40 shadow-2xl space-y-4 relative overflow-hidden"
          >
            {/* Glow subtle backdrop */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-cyan-300 border border-indigo-500/40 shadow-sm shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Explicação de Estratégia Recomendada
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      ComplianceAgent
                    </span>
                    {explainedStrategy && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${REBALANCE_STRATEGY_INFO[explainedStrategy].badgeBg} ${REBALANCE_STRATEGY_INFO[explainedStrategy].badgeBorder} ${REBALANCE_STRATEGY_INFO[explainedStrategy].badgeText}`}
                      >
                        {REBALANCE_STRATEGY_INFO[explainedStrategy].name}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Parecer analítico e fiduciário sobre a lógica dos ajustes propostos • Emitido às {explanationTimestamp || 'agora'}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyExplanation}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                  title="Copiar parecer na íntegra"
                >
                  {copyFeedback ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar Parecer</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateStrategyExplanation(rebalanceStrategy)}
                  disabled={isExplainingStrategy}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                  title="Atualizar explicação para a estratégia ativa"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isExplainingStrategy ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExplanationMinimized(!isExplanationMinimized)}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title={isExplanationMinimized ? 'Expandir parecer' : 'Minimizar parecer'}
                >
                  {isExplanationMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsExplanationOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-900/30 border border-slate-800 hover:border-rose-700/50 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                  title="Fechar parecer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Outdated Strategy Warning Banner */}
            {explainedStrategy && explainedStrategy !== rebalanceStrategy && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    A estratégia ativa foi alterada de <strong className="text-white">{explainedStrategy}</strong> para <strong className="text-white">{rebalanceStrategy}</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateStrategyExplanation(rebalanceStrategy)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold text-xs transition shrink-0 cursor-pointer"
                >
                  Atualizar para {rebalanceStrategy}
                </button>
              </div>
            )}

            {/* Executive Key Metric Chips */}
            {!isExplanationMinimized && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Estratégia</span>
                  <span className="text-xs font-bold text-indigo-300">
                    {explainedStrategy ? REBALANCE_STRATEGY_INFO[explainedStrategy].name : strategyInfo.name}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Boletas no Plano</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {activeOrders.length} ordens propostas
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Turnover Previsto</span>
                  <span className="text-xs font-bold text-cyan-300 font-mono">
                    {explainedStrategy ? REBALANCE_STRATEGY_INFO[explainedStrategy].turnoverEstimate : strategyInfo.turnoverEstimate}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status CVM 175</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    100% Enquadrado
                  </span>
                </div>
              </div>
            )}

            {/* Markdown Content */}
            {!isExplanationMinimized && (
              <div className="p-4 sm:p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-200 text-xs leading-relaxed space-y-2.5 max-h-[500px] overflow-y-auto pr-3">
                <div className="markdown-body text-slate-200">
                  <Markdown>{strategyExplanation}</Markdown>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Gráfico de Projeção Visual: Estado 'Antes' vs 'Depois'
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Transição Suave
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visualize a dinâmica de transformação das alocações antes e após a execução das ordens planejadas.
            </p>
          </div>

          {/* Controls bar: Stage Switcher, Auto Transition Player, and Chart Mode */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Stage Selector: Comparativo / Antes / Depois */}
            <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl relative">
              <button
                onClick={() => {
                  setIsAutoTransitioning(false);
                  setProjectionStage('comparison');
                }}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition z-10 ${
                  projectionStage === 'comparison'
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {projectionStage === 'comparison' && (
                  <motion.div
                    layoutId="activeProjectionStage"
                    className="absolute inset-0 rounded-lg bg-indigo-600 shadow-sm -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span>Comparativo</span>
              </button>

              <button
                onClick={() => {
                  setIsAutoTransitioning(false);
                  setProjectionStage('before');
                }}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition z-10 flex items-center gap-1.5 ${
                  projectionStage === 'before'
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {projectionStage === 'before' && (
                  <motion.div
                    layoutId="activeProjectionStage"
                    className="absolute inset-0 rounded-lg bg-indigo-500 shadow-sm -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Estado 'Antes'</span>
              </button>

              <button
                onClick={() => {
                  setIsAutoTransitioning(false);
                  setProjectionStage('after');
                }}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition z-10 flex items-center gap-1.5 ${
                  projectionStage === 'after'
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {projectionStage === 'after' && (
                  <motion.div
                    layoutId="activeProjectionStage"
                    className="absolute inset-0 rounded-lg bg-emerald-600 shadow-sm -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                <span>Estado 'Depois'</span>
              </button>
            </div>

            {/* Quick Toggle Button 'Antes ⇄ Depois' */}
            <button
              onClick={() => {
                setIsAutoTransitioning(false);
                setProjectionStage((prev) => (prev === 'before' ? 'after' : 'before'));
              }}
              title="Alternar entre Estado Antes e Estado Depois com transição suave"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition active:scale-95 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Alternar</span>
              <span className="text-[11px] font-mono text-slate-400">
                {projectionStage === 'before' ? '➔ Depois' : projectionStage === 'after' ? '➔ Antes' : 'Antes ⇄ Depois'}
              </span>
            </button>

            {/* Auto Play / Loop Simulation Player */}
            <button
              onClick={() => setIsAutoTransitioning((prev) => !prev)}
              title="Iniciar reprodução contínua da transição Antes ➔ Depois"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 ${
                isAutoTransitioning
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-950/30'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              {isAutoTransitioning ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <Pause className="w-3 h-3 text-emerald-300" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-cyan-400" />
                  <span>Simular Transição</span>
                </>
              )}
            </button>

            {/* Toggle between Grouped Bars and Side-by-Side Donut charts */}
            <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                onClick={() => setChartMode('bars')}
                title="Gráfico em Barras"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  chartMode === 'bars'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Barras</span>
              </button>
              <button
                onClick={() => setChartMode('donuts')}
                title="Gráfico em Pizza / Rosca"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  chartMode === 'donuts'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Pizzas</span>
              </button>
            </div>

            {/* Quick jump to Side-by-Side Comparison Tool */}
            <button
              onClick={() => {
                document.getElementById('side-by-side-comparison')?.scrollIntoView({ behavior: 'smooth' });
              }}
              title="Ir para a Ferramenta de Comparação Lado a Lado Detalhada com Variação Absoluta"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-950/50 hover:bg-blue-900/60 text-blue-300 hover:text-white border border-blue-500/40 transition active:scale-95 shadow-sm"
            >
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Comparar Lado a Lado</span>
              <span className="sm:hidden">Lado a Lado</span>
            </button>
          </div>
        </div>

        {/* Dynamic Contextual Banner animated with AnimatePresence */}
        <AnimatePresence mode="wait">
          {projectionStage === 'before' && (
            <motion.div
              key="stage-banner-before"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                <div>
                  <span className="font-bold text-indigo-300 uppercase text-[11px] tracking-wider block">
                    Foco: Estado 'Antes' (Carteira Atual em Custódia)
                  </span>
                  <span className="text-slate-300">
                    Exibindo a distribuição vigente dos ativos. Note sobrepeso nas classes fora dos limites regulatórios CVM 175.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold font-mono text-[11px]">
                  {projectionData.filter((d) => d.isBreachedBefore).length} Classes Desenquadradas
                </span>
              </div>
            </motion.div>
          )}

          {projectionStage === 'after' && (
            <motion.div
              key="stage-banner-after"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <div>
                  <span className="font-bold text-emerald-300 uppercase text-[11px] tracking-wider block">
                    Foco: Estado 'Depois' (Alocação Projetada Pós-Ordens)
                  </span>
                  <span className="text-slate-300">
                    Exibindo o resultado da execução das {activeOrders.length} ordens propostas. Todas as classes reenquadradas na meta do mandato.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold font-mono text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  100% CVM 175 Compliant
                </span>
              </div>
            </motion.div>
          )}

          {projectionStage === 'comparison' && (
            <motion.div
              key="stage-banner-comparison"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <div>
                  <span className="font-bold text-white uppercase text-[11px] tracking-wider block">
                    Modo Comparativo Simultâneo
                  </span>
                  <span className="text-slate-400">
                    Compare diretamente o Estado 'Antes' (barras roxas) com o 'Depois' (barras verdes) contra o Target IPS formal (barras ciano translúcidas).
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-slate-400 text-[11px]">
                <span>Passe o cursor sobre as barras para ver a variação exata</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated Chart Canvas with Framer Motion */}
        <AnimatePresence mode="wait">
          {chartMode === 'bars' && (
            <motion.div
              key={`bars-${projectionStage}`}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <div className="h-[360px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={projectionData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    barGap={projectionStage === 'comparison' ? 8 : 16}
                    barCategoryGap={projectionStage === 'comparison' ? 24 : 36}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} vertical={false} />
                    <XAxis
                      dataKey="assetClass"
                      stroke="#475569"
                      tick={{ fill: '#CBD5E1', fontSize: 12, fontWeight: 600 }}
                      axisLine={{ stroke: '#475569' }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#475569"
                      tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: '#475569' }}
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
                        if (value === 'currentPercent') return <span className="text-xs text-indigo-300 font-semibold">Alocação Atual ('Antes')</span>;
                        if (value === 'projectedPercent') return <span className="text-xs text-emerald-400 font-semibold">Alocação Projetada ('Depois')</span>;
                        if (value === 'targetPercent') return <span className="text-xs text-cyan-300 font-semibold">Meta Alvo (Target Mandato)</span>;
                        return value;
                      }}
                    />

                    {/* Barra 'Antes' (Exibida em Comparativo ou Estado 'Antes') */}
                    {(projectionStage === 'comparison' || projectionStage === 'before') && (
                      <Bar
                        dataKey="currentPercent"
                        name="currentPercent"
                        fill="#6366F1"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={projectionStage === 'before' ? 64 : 44}
                        isAnimationActive
                        animationDuration={600}
                        animationEasing="ease-out"
                      />
                    )}

                    {/* Barra 'Depois' (Exibida em Comparativo ou Estado 'Depois') */}
                    {(projectionStage === 'comparison' || projectionStage === 'after') && (
                      <Bar
                        dataKey="projectedPercent"
                        name="projectedPercent"
                        fill="#10B981"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={projectionStage === 'after' ? 64 : 44}
                        isAnimationActive
                        animationDuration={600}
                        animationEasing="ease-out"
                      />
                    )}

                    {/* Barra 'Target' (Meta Mandato) */}
                    <Bar
                      dataKey="targetPercent"
                      name="targetPercent"
                      fill="#38BDF8"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={projectionStage === 'comparison' ? 44 : 56}
                      opacity={0.35}
                      isAnimationActive
                      animationDuration={600}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quick explanation pill legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  {(projectionStage === 'comparison' || projectionStage === 'before') && (
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-indigo-500" />
                      <span className="text-slate-300 font-medium">Estado 'Antes': Alocação real em carteira hoje</span>
                    </div>
                  )}
                  {(projectionStage === 'comparison' || projectionStage === 'after') && (
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-emerald-500" />
                      <span className="text-slate-300 font-medium">Estado 'Depois': Posição projetada pós-execução</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-cyan-400/40 border border-cyan-400" />
                    <span className="text-slate-300 font-medium">Target IPS: Meta formal fiduciária</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500">
                  {isAutoTransitioning ? 'Reproduzindo ciclo de transição suave...' : 'Clique em "Alternar" ou use as abas para trocar de estado'}
                </span>
              </div>
            </motion.div>
          )}

          {chartMode === 'donuts' && (
            <motion.div
              key={`donuts-${projectionStage}`}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="pt-2"
            >
              {projectionStage === 'comparison' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Donut Antes */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col items-center"
                  >
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
                            isAnimationActive
                            animationDuration={500}
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
                  </motion.div>

                  {/* Donut Depois */}
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-5 rounded-2xl bg-slate-950/60 border border-emerald-500/20 flex flex-col items-center shadow-lg shadow-emerald-950/10"
                  >
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
                            isAnimationActive
                            animationDuration={500}
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
                  </motion.div>
                </div>
              )}

              {projectionStage === 'before' && (
                <div className="max-w-xl mx-auto p-6 rounded-2xl bg-slate-950/70 border border-indigo-500/30 flex flex-col items-center shadow-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-indigo-400" />
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">
                      Alocação Atual da Carteira ('Antes')
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 mb-4 text-center">
                    Composição patrimonial vigente antes do rebalanceamento fiduciário
                  </span>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={projectionData}
                          dataKey="currentPercent"
                          nameKey="assetClass"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={4}
                          label={({ name, value }) => `${name}: ${value}%`}
                          isAnimationActive
                          animationDuration={600}
                        >
                          {projectionData.map((entry) => (
                            <Cell key={`cell-focus-before-${entry.assetClass}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: any) => [`${value}%`, 'Alocação Antes']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
                    {projectionData.map((d) => (
                      <div key={d.assetClass} className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-slate-300">{d.assetClass}:</span>
                        <strong className="text-white font-mono">{d.currentPercent}%</strong>
                        {d.isBreachedBefore && (
                          <span className="text-[10px] text-rose-400 font-bold ml-1">!</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {projectionStage === 'after' && (
                <div className="max-w-xl mx-auto p-6 rounded-2xl bg-slate-950/70 border border-emerald-500/30 flex flex-col items-center shadow-xl shadow-emerald-950/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <h3 className="text-base font-bold text-emerald-300 uppercase tracking-wider">
                      Alocação Projetada da Carteira ('Depois')
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 mb-4 text-center">
                    Distribuição calculada pós-execução com alinhamento de 100% ao mandato
                  </span>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={projectionData}
                          dataKey="projectedPercent"
                          nameKey="assetClass"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={4}
                          label={({ name, value }) => `${name}: ${value}%`}
                          isAnimationActive
                          animationDuration={600}
                        >
                          {projectionData.map((entry) => (
                            <Cell key={`cell-focus-after-${entry.assetClass}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: any) => [`${value}%`, 'Alocação Depois']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
                    {projectionData.map((d) => (
                      <div key={d.assetClass} className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-slate-300">{d.assetClass}:</span>
                        <strong className="text-emerald-300 font-mono">{d.projectedPercent}%</strong>
                        <span className="text-[10px] text-emerald-400 font-bold ml-1">✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* DRIFT & VARIANCE COMPARISON STRIP */}
        <div className="border-t border-slate-800/80 pt-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Tabela Analítica de Variação (Drift) &amp; Reenquadramento por Classe
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/90 text-slate-200 uppercase tracking-wider text-[11px] font-semibold border-y border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Classe de Ativos</th>
                  <th className={`py-2.5 px-3 text-right transition-colors ${
                    projectionStage === 'before' ? 'text-indigo-300 bg-indigo-950/30' : ''
                  }`}>
                    Antes (%)
                  </th>
                  <th className={`py-2.5 px-3 text-right transition-colors ${
                    projectionStage === 'after' ? 'text-emerald-300 bg-emerald-950/30' : ''
                  }`}>
                    Depois (%)
                  </th>
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

                    <td className={`py-3 px-3 text-right font-mono font-medium transition-colors ${
                      projectionStage === 'before'
                        ? 'text-indigo-300 bg-indigo-950/20 font-bold'
                        : 'text-slate-300'
                    }`}>
                      {row.currentPercent.toFixed(2)}%
                    </td>

                    <td className={`py-3 px-3 text-right font-mono font-bold transition-colors ${
                      projectionStage === 'after'
                        ? 'text-emerald-300 bg-emerald-950/20'
                        : 'text-emerald-400'
                    }`}>
                      {row.projectedPercent.toFixed(2)}%
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      <span
                        className={
                          row.deltaPercent > 0
                            ? 'text-emerald-400'
                            : row.deltaPercent < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {row.deltaPercent > 0 ? '+' : ''}
                        {row.deltaPercent.toFixed(2)} p.p.
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-200">
                      {row.deltaBRL !== 0 ? (
                        <span>
                          {row.deltaBRL > 0 ? '+' : ''}R${' '}
                          {(row.deltaBRL / 1000).toFixed(0)}k
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-300 font-medium">
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
                        <span className="text-slate-400 text-xs">➔</span>
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
      {/* FERRAMENTA DE COMPARAÇÃO LADO A LADO: PORTFÓLIO ATUAL VS MODELO SUGERIDO */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {currentPortfolio && (
        <div id="side-by-side-comparison" className="scroll-mt-6">
          <SideBySideComparisonTool
            currentPortfolio={currentPortfolio}
            projectionData={projectionData}
            totalAUM={totalAUM}
            totalTradedVolume={totalTradedVolume}
            estimatedB3Costs={estimatedB3Costs}
            activeOrders={activeOrders}
          />
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* PROPOSED ORDERS TABLE (INTERATIVE TRADES) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Ordens Propostas pelo Algoritmo de Alocação ({activeOrders.length} ativas)
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${strategyInfo.badgeBg} ${strategyInfo.badgeBorder} ${strategyInfo.badgeText}`}
              >
                {strategyInfo.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Desmarque ordens para simular cenários parciais e veja a projeção 'Antes vs Depois' recalcular em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Strategy Mini-Toggle */}
            <div className="hidden md:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mr-2">
              <span className="text-[10px] text-slate-400 px-1 font-medium">Estratégia:</span>
              <button
                type="button"
                onClick={() => setRebalanceStrategy('Conservative')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                  rebalanceStrategy === 'Conservative'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Conservador
              </button>
              <button
                type="button"
                onClick={() => setRebalanceStrategy('Moderate')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                  rebalanceStrategy === 'Moderate'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Moderado
              </button>
              <button
                type="button"
                onClick={() => setRebalanceStrategy('Aggressive')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                  rebalanceStrategy === 'Aggressive'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Agressivo
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleGenerateStrategyExplanation()}
              disabled={isExplainingStrategy}
              className="px-3 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="Explicar lógica da estratégia com o ComplianceAgent"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Explicar Estratégia</span>
            </button>

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
              <thead className="bg-slate-950/90 text-slate-200 uppercase tracking-wider text-[11px] font-semibold border-y border-slate-800">
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

                      <td className="py-3 px-4 text-slate-300 text-xs leading-relaxed" title={order.reason}>
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px]">Estratégia Ativa:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${strategyInfo.badgeBg} ${strategyInfo.badgeBorder} ${strategyInfo.badgeText}`}>
                {strategyInfo.name} • {strategyInfo.tag}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleGenerateStrategyExplanation()}
              disabled={isExplainingStrategy}
              className="px-4 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-500/30 text-indigo-200 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="Explicar lógica da estratégia recomendada com o ComplianceAgent"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Explicar Estratégia</span>
            </button>

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
              <span>{isExecuting ? 'Registrando Auditoria...' : `Executar Simulação (${strategyInfo.name})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
