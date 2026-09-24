import React, { useState, useMemo, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  SlidersHorizontal,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Save,
  Activity,
  Layers,
  Info,
  Scale,
  Target,
  ArrowUpRight,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { Portfolio, AssetClassThresholdConfig, AssetClass, ComplianceAlert } from '../types';

interface LimitsConfigurationViewProps {
  portfolios: Portfolio[];
  onUpdateLimits: (configs: AssetClassThresholdConfig[], portfolioId?: string) => Promise<void>;
  onResetLimits?: () => Promise<void>;
  currentAlerts?: ComplianceAlert[];
}

// Configurações regulatórias padrão alinhadas à Resolução CVM 175 e CMN 4.963
const DEFAULT_CONFIGS: AssetClassThresholdConfig[] = [
  {
    assetClass: 'Renda Fixa',
    minPercent: 40,
    targetPercent: 50,
    maxPercent: 65,
    warningTolerancePP: 3.0,
    criticalTolerancePP: 5.0,
    warningTriggerPercent: 62.0,
    criticalTriggerPercent: 70.0,
    sourceDescription: 'Resolução CMN 4.963 / ANBIMA',
    notes: 'Títulos públicos federais (LFT, NTN-B), Debêntures incentivadas, CDBs bancários',
  },
  {
    assetClass: 'Renda Variável',
    minPercent: 10,
    targetPercent: 25,
    maxPercent: 35,
    warningTolerancePP: 2.0,
    criticalTolerancePP: 5.0,
    warningTriggerPercent: 33.0,
    criticalTriggerPercent: 40.0,
    sourceDescription: 'Mandato Bilateral IPS & CVM 175',
    notes: 'Ações B3, ETFs locais de índice (BOVA11, SMAL11), BDRs Nível I/II',
  },
  {
    assetClass: 'Internacional',
    minPercent: 0,
    targetPercent: 15,
    maxPercent: 20,
    warningTolerancePP: 2.0,
    criticalTolerancePP: 5.0,
    warningTriggerPercent: 18.0,
    criticalTriggerPercent: 25.0,
    sourceDescription: 'Resolução CVM 175 Anexo I (Teto Geral 20%)',
    notes: 'ETFs globais (IVVB11, ACWI), fundos offshore Avenue/Interactive, ADRs',
  },
  {
    assetClass: 'Multimercado',
    minPercent: 0,
    targetPercent: 10,
    maxPercent: 15,
    warningTolerancePP: 2.0,
    criticalTolerancePP: 3.0,
    warningTriggerPercent: 13.0,
    criticalTriggerPercent: 18.0,
    sourceDescription: 'Diretriz Interna de Risco & Alocação',
    notes: 'Fundos Macro, Quantitativos, Long & Short, Arbitragem',
  },
  {
    assetClass: 'Caixa',
    minPercent: 2,
    targetPercent: 5,
    maxPercent: 10,
    warningTolerancePP: 1.0,
    criticalTolerancePP: 2.0,
    warningTriggerPercent: 9.0,
    criticalTriggerPercent: 12.0,
    sourceDescription: 'Gestão de Liquidez Imediata (D+0)',
    notes: 'Operações compromissadas overnight, CDI diário, Tesouro Selic',
  },
];

// Volatilidades históricas anualizadas estimadas por classe
const ASSET_CLASS_VOLATILITIES: Record<string, number> = {
  'Renda Fixa': 4.5,
  'Renda Variável': 19.8,
  'Internacional': 16.5,
  'Multimercado': 7.2,
  'Caixa': 0.8,
};

export const LimitsConfigurationView: React.FC<LimitsConfigurationViewProps> = ({
  portfolios,
  onUpdateLimits,
  onResetLimits,
  currentAlerts = [],
}) => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('all');
  const [configs, setConfigs] = useState<AssetClassThresholdConfig[]>(DEFAULT_CONFIGS);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inicializa configs com base nos mandateLimits da carteira selecionada ou dados do backend
  useEffect(() => {
    if (selectedPortfolioId !== 'all') {
      const selectedPort = portfolios.find((p) => p.id === selectedPortfolioId);
      if (selectedPort && selectedPort.mandateLimits.length > 0) {
        const merged = DEFAULT_CONFIGS.map((def) => {
          const limit = selectedPort.mandateLimits.find((l) => l.assetClass === def.assetClass);
          if (limit) {
            return {
              ...def,
              minPercent: limit.minPercent,
              targetPercent: limit.targetPercent,
              maxPercent: limit.maxPercent,
              warningTolerancePP: limit.warningTolerancePP ?? def.warningTolerancePP,
              criticalTolerancePP: limit.criticalTolerancePP ?? limit.tolerancePP ?? def.criticalTolerancePP,
              warningTriggerPercent: limit.warningTriggerPercent ?? limit.maxPercent - (limit.warningTolerancePP ?? 2),
              criticalTriggerPercent: limit.criticalTriggerPercent ?? limit.maxPercent + (limit.criticalTolerancePP ?? 5),
            };
          }
          return def;
        });
        setConfigs(merged);
        return;
      }
    }
    // Consolidado
    setConfigs(DEFAULT_CONFIGS);
  }, [selectedPortfolioId, portfolios]);

  // Carteiras ativas a avaliar
  const activePortfolios = useMemo(() => {
    if (selectedPortfolioId === 'all') return portfolios;
    const found = portfolios.find((p) => p.id === selectedPortfolioId);
    return found ? [found] : portfolios;
  }, [selectedPortfolioId, portfolios]);

  // Alocações reais calculadas por classe de ativos
  const realAllocations = useMemo(() => {
    let totalAum = 0;
    const classValues: Record<string, number> = {
      'Renda Fixa': 0,
      'Renda Variável': 0,
      'Internacional': 0,
      'Multimercado': 0,
      'Caixa': 0,
    };

    activePortfolios.forEach((port) => {
      totalAum += port.totalAum || 0;
      classValues['Caixa'] += port.cashBalance || 0;

      (port.assets || []).forEach((asset) => {
        const ac = asset.assetClass || 'Renda Fixa';
        if (classValues[ac] !== undefined) {
          classValues[ac] += asset.totalValue || 0;
        } else {
          classValues[ac] = (classValues[ac] || 0) + (asset.totalValue || 0);
        }
      });
    });

    const breakdown: Record<string, { aum: number; percent: number }> = {};
    Object.keys(classValues).forEach((ac) => {
      const aum = classValues[ac];
      const percent = totalAum > 0 ? (aum / totalAum) * 100 : 0;
      breakdown[ac] = { aum, percent };
    });

    return { totalAum, breakdown };
  }, [activePortfolios]);

  // Dados formatados para o GRÁFICO DE DISPERSÃO (ScatterChart) do Recharts
  // Eixo X: Tolerância Configurada (criticalTolerancePP em p.p.)
  // Eixo Y: Risco Atual / Desvio Observado (p.p. de desvio em relação ao alvo/teto regulamentar)
  // Eixo Z: Volume Financeiro (AUM em R$)
  const scatterData = useMemo(() => {
    return configs.map((cfg) => {
      const alloc = realAllocations.breakdown[cfg.assetClass] || { aum: 0, percent: 0 };
      const currentPercent = alloc.percent;
      const targetPercent = cfg.targetPercent;
      const maxPercent = cfg.maxPercent;
      const minPercent = cfg.minPercent;

      // Desvio Realizado em relação ao Alvo (p.p.)
      const deviationFromTarget = Math.abs(currentPercent - targetPercent);

      // Desvio Excedente acima do teto ou abaixo do piso
      const breachExcess =
        currentPercent > maxPercent
          ? currentPercent - maxPercent
          : currentPercent < minPercent
          ? minPercent - currentPercent
          : 0;

      // Risco Atual: Considera o desvio em p.p. somado à volatilidade proporcional
      const riskDeviationPP = Number(
        (breachExcess > 0 ? breachExcess + cfg.warningTolerancePP : deviationFromTarget).toFixed(2)
      );

      // Tolerância Configurada (Eixo X)
      const configuredTolerance = Number(cfg.criticalTolerancePP.toFixed(2));
      const warningTolerance = Number(cfg.warningTolerancePP.toFixed(2));

      // Índice de Consumo da Tolerância: (Risco Atual / Tolerância Configurada) * 100
      const toleranceConsumptionRatio = configuredTolerance > 0
        ? Number(((riskDeviationPP / configuredTolerance) * 100).toFixed(1))
        : 0;

      // Status de Severidade
      let status: 'COMPLIANT' | 'WARNING' | 'CRITICAL' = 'COMPLIANT';
      if (riskDeviationPP >= configuredTolerance || breachExcess > 0) {
        status = 'CRITICAL';
      } else if (riskDeviationPP >= warningTolerance) {
        status = 'WARNING';
      }

      // Cor do Ponto
      let fillColor = '#10b981'; // Emerald (Seguro)
      if (status === 'CRITICAL') fillColor = '#f43f5e'; // Rose (Crítico)
      else if (status === 'WARNING') fillColor = '#f59e0b'; // Amber (Atenção)

      const annualizedVol = ASSET_CLASS_VOLATILITIES[cfg.assetClass] || 10.0;

      return {
        assetClass: cfg.assetClass,
        configuredTolerance, // Eixo X: Tolerância Máxima (p.p.)
        currentRisk: riskDeviationPP, // Eixo Y: Risco Atual / Desvio Observado (p.p.)
        warningTolerance,
        toleranceConsumptionRatio,
        aum: Math.max(100000, alloc.aum),
        aumFormatted: `R$ ${(alloc.aum / 1_000_000).toFixed(2)}M`,
        currentPercent: Number(currentPercent.toFixed(1)),
        targetPercent,
        minPercent,
        maxPercent,
        breachExcess: Number(breachExcess.toFixed(1)),
        annualizedVol,
        status,
        fillColor,
        sourceDescription: cfg.sourceDescription,
        notes: cfg.notes,
      };
    });
  }, [configs, realAllocations]);

  // Índices Globais de Risco & Tolerância Corrigidos
  const globalIndices = useMemo(() => {
    if (scatterData.length === 0) {
      return {
        avgToleranceConsumption: 0,
        compliantRatio: 100,
        hhiConcentration: 0,
        totalRiskBudgetPP: 0,
      };
    }

    const totalConsumption = scatterData.reduce((sum, d) => sum + d.toleranceConsumptionRatio, 0);
    const avgToleranceConsumption = Number((totalConsumption / scatterData.length).toFixed(1));

    const compliantCount = scatterData.filter((d) => d.status === 'COMPLIANT').length;
    const compliantRatio = Number(((compliantCount / scatterData.length) * 100).toFixed(1));

    // Índice de Concentração de Risco HHI (Herfindahl-Hirschman)
    const hhiConcentration = scatterData.reduce((sum, d) => {
      const share = d.currentPercent;
      return sum + Math.pow(share, 2);
    }, 0);

    const totalRiskBudgetPP = scatterData.reduce((sum, d) => sum + d.configuredTolerance, 0);

    return {
      avgToleranceConsumption,
      compliantRatio,
      hhiConcentration: Math.round(hhiConcentration),
      totalRiskBudgetPP: Number(totalRiskBudgetPP.toFixed(1)),
    };
  }, [scatterData]);

  // Atualização de campo individual de limites
  const handleFieldChange = (
    assetClass: AssetClass,
    field: keyof AssetClassThresholdConfig,
    value: number
  ) => {
    setConfigs((prev) =>
      prev.map((item) => {
        if (item.assetClass === assetClass) {
          const updated = { ...item, [field]: value };
          // Atualiza gatilhos calculados
          if (field === 'maxPercent' || field === 'warningTolerancePP') {
            updated.warningTriggerPercent = Number(
              (updated.maxPercent - updated.warningTolerancePP).toFixed(1)
            );
          }
          if (field === 'maxPercent' || field === 'criticalTolerancePP') {
            updated.criticalTriggerPercent = Number(
              (updated.maxPercent + updated.criticalTolerancePP).toFixed(1)
            );
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Salvar configurações
  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage(null);
    try {
      await onUpdateLimits(configs, selectedPortfolioId === 'all' ? undefined : selectedPortfolioId);
      setSuccessMessage('Limites e tolerâncias atualizados com sucesso no motor Sentinel!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Erro ao salvar limites:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Resetar para padrões CVM 175
  const handleReset = async () => {
    setIsResetting(true);
    setSuccessMessage(null);
    try {
      if (onResetLimits) {
        await onResetLimits();
      }
      setConfigs(DEFAULT_CONFIGS);
      setSuccessMessage('Limites restaurados para os padrões regulatórios CVM 175.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Erro ao resetar limites:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Custom Tooltip do Gráfico de Dispersão Recharts
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3.5 rounded-xl shadow-xl text-xs backdrop-blur-md max-w-xs z-50">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-white text-sm flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: data.fillColor }}
              />
              {data.assetClass}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                data.status === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : data.status === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {data.status === 'CRITICAL'
                ? 'VIOLAÇÃO CRÍTICA'
                : data.status === 'WARNING'
                ? 'ALERTA DE AVISO'
                : 'CONFORME'}
            </span>
          </div>

          <div className="space-y-1.5 mt-2.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Risco Atual (Desvio):</span>
              <strong className="text-white">+{data.currentRisk.toFixed(2)} p.p.</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tolerância Configurada:</span>
              <strong className="text-white">±{data.configuredTolerance.toFixed(2)} p.p.</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Consumo da Tolerância:</span>
              <strong
                className={
                  data.toleranceConsumptionRatio > 100
                    ? 'text-rose-400'
                    : data.toleranceConsumptionRatio > 70
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }
              >
                {data.toleranceConsumptionRatio}%
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Alocação Atual vs Faixa:</span>
              <span className="text-slate-200">
                <strong>{data.currentPercent}%</strong> (Teto {data.maxPercent}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Volume Alocado (AUM):</span>
              <span className="text-cyan-400 font-semibold">{data.aumFormatted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Volatilidade Anualizada:</span>
              <span className="text-slate-200">{data.annualizedVol}% a.a.</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-400 italic">
            {data.sourceDescription || 'Diretriz Fiduciária CVM 175'}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Configuração de Limites & Tolerâncias de Risco
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Calibre a sensibilidade fiduciária CVM 175, tetos de concentração e margens de tolerância por classe de ativo.
              </p>
            </div>
          </div>

          {/* Portfolio Selector & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <Layers className="w-4 h-4 text-cyan-400" />
              <select
                id="limits-portfolio-select"
                aria-label="Selecionar carteira para visualização de limites"
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-slate-100">
                  Todas as Carteiras (Consolidado)
                </option>
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              id="reset-limits-btn"
              onClick={handleReset}
              disabled={isResetting}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Restaurar parâmetros recomendados da CVM 175 e CMN 4.963"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isResetting ? 'animate-spin' : ''}`} />
              Padrões CVM
            </button>

            <button
              id="save-limits-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm border border-emerald-500/50 cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 mr-1.5 ${isSaving ? 'animate-spin' : ''}`} />
              {isSaving ? 'Salvando...' : 'Salvar e Aplicar Limites'}
            </button>
          </div>
        </div>

        {/* Feedback message */}
        {successMessage && (
          <div className="mt-4 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* ÍNDICES DE RISCO & TOLERÂNCIA CORRIGIDOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Consumo Médio de Tolerância */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Consumo Médio de Tolerância</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                globalIndices.avgToleranceConsumption > 80
                  ? 'text-rose-400'
                  : globalIndices.avgToleranceConsumption > 50
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {globalIndices.avgToleranceConsumption}%
            </span>
            <span className="text-xs text-slate-400">orçamento consumido</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                globalIndices.avgToleranceConsumption > 80
                  ? 'bg-rose-500'
                  : globalIndices.avgToleranceConsumption > 50
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, globalIndices.avgToleranceConsumption)}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Índice de Conformidade */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Aderência aos Limites</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {globalIndices.compliantRatio}%
            </span>
            <span className="text-xs text-emerald-400 font-medium">das classes conformes</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {scatterData.filter((d) => d.status === 'CRITICAL').length} violação(ões) crítica(s)
          </p>
        </div>

        {/* KPI 3: Concentração de Risco (HHI) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Índice HHI Concentração</span>
            <Scale className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400">
              {globalIndices.hhiConcentration}
            </span>
            <span className="text-xs text-slate-400 font-medium">pontos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {globalIndices.hhiConcentration < 2500 ? 'Alocação Diversificada' : 'Alta Concentração'}
          </p>
        </div>

        {/* KPI 4: Orçamento Total de Risco */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Orçamento Agregado de Tolerância</span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-300">
              ±{globalIndices.totalRiskBudgetPP} p.p.
            </span>
            <span className="text-xs text-slate-400 font-medium">soma das tolerâncias</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Margem de desvio permitida</p>
        </div>
      </div>

      {/* GRÁFICO DE DISPERSÃO (SCATTER PLOT) COM RECHARTS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Activity className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-white">
                Dispersão: Risco Atual vs. Tolerância Configurada por Classe de Ativo
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visualização fiduciária da fronteira de risco. Pontos acima da linha de referência indicam risco superior à tolerância. O tamanho da bolha reflete o AUM alocado.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Conforme</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-300">Atenção (Warning)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-300">Crítico (Violação)</span>
            </div>
          </div>
        </div>

        {/* Scatter Chart Container */}
        <div className="w-full h-[380px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 25, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              
              <XAxis
                type="number"
                dataKey="configuredTolerance"
                name="Tolerância Configurada"
                unit=" p.p."
                domain={[0, 8]}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#475569' }}
                label={{
                  value: 'Tolerância Configurada (p.p.) — Margem Máxima Permitida',
                  position: 'insideBottom',
                  offset: -15,
                  fill: '#94a3b8',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              />

              <YAxis
                type="number"
                dataKey="currentRisk"
                name="Risco Atual (Desvio)"
                unit=" p.p."
                domain={[0, 10]}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#475569' }}
                label={{
                  value: 'Risco Atual Observado (Desvio p.p.)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: -5,
                  fill: '#94a3b8',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              />

              <ZAxis
                type="number"
                dataKey="aum"
                range={[200, 900]}
                name="Volume Alocado (AUM)"
              />

              {/* Linha de Referência Fiduciária: Linha de Equilíbrio / Alerta */}
              <ReferenceLine
                y={5.0}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{
                  value: 'Teto Fiduciário Geral (5.0 p.p.)',
                  fill: '#f43f5e',
                  fontSize: 10,
                  position: 'top',
                }}
              />

              <ReferenceLine
                y={2.0}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{
                  value: 'Gatilho de Aviso Médio (2.0 p.p.)',
                  fill: '#f59e0b',
                  fontSize: 10,
                  position: 'bottom',
                }}
              />

              <RechartsTooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />

              <Scatter name="Classes de Ativos" data={scatterData}>
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fillColor}
                    stroke="#0f172a"
                    strokeWidth={2}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Rodapé explicativo do gráfico */}
        <div className="mt-2 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Bolhas maiores indicam maior volume financeiro alocado na classe de ativos.
            </span>
          </div>
          <div>
            <span>Modelo: Interceptador Fiduciário Sentinel & CVM 175</span>
          </div>
        </div>
      </div>

      {/* TABELA INTERATIVA DE CONFIGURAÇÃO DE LIMITES & TOLERÂNCIAS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">
              Tabela de Calibração de Tetos & Tolerâncias por Classe
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Valores em percentual (%) e pontos percentuais (p.p.)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[11px]">
              <tr>
                <th className="p-3.5">Classe de Ativo</th>
                <th className="p-3.5">Alocação Real</th>
                <th className="p-3.5">Piso Mín (%)</th>
                <th className="p-3.5">Alvo Target (%)</th>
                <th className="p-3.5">Teto Máx (%)</th>
                <th className="p-3.5">Tolerância Warning (p.p.)</th>
                <th className="p-3.5">Tolerância Crítica (p.p.)</th>
                <th className="p-3.5">Consumo Risco</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              {configs.map((cfg) => {
                const scatterItem = scatterData.find((d) => d.assetClass === cfg.assetClass);
                const currentPct = scatterItem ? scatterItem.currentPercent : 0;
                const status = scatterItem ? scatterItem.status : 'COMPLIANT';
                const consumption = scatterItem ? scatterItem.toleranceConsumptionRatio : 0;

                return (
                  <tr
                    key={cfg.assetClass}
                    className="hover:bg-slate-800/40 transition duration-150"
                  >
                    {/* Classe de Ativo */}
                    <td className="p-3.5 font-medium text-white">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-100">{cfg.assetClass}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          {cfg.notes}
                        </span>
                      </div>
                    </td>

                    {/* Alocação Real */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-white text-xs">{currentPct}%</strong>
                        <span className="text-[10px] text-slate-400">
                          ({scatterItem?.aumFormatted})
                        </span>
                      </div>
                    </td>

                    {/* Piso Mín % */}
                    <td className="p-3.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={cfg.minPercent}
                        onChange={(e) =>
                          handleFieldChange(
                            cfg.assetClass,
                            'minPercent',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-medium text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </td>

                    {/* Alvo Target % */}
                    <td className="p-3.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={cfg.targetPercent}
                        onChange={(e) =>
                          handleFieldChange(
                            cfg.assetClass,
                            'targetPercent',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-medium text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </td>

                    {/* Teto Máx % */}
                    <td className="p-3.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={cfg.maxPercent}
                        onChange={(e) =>
                          handleFieldChange(
                            cfg.assetClass,
                            'maxPercent',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-medium text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </td>

                    {/* Tolerância Warning (p.p.) */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">±</span>
                        <input
                          type="number"
                          min="0.5"
                          max="10"
                          step="0.5"
                          value={cfg.warningTolerancePP}
                          onChange={(e) =>
                            handleFieldChange(
                              cfg.assetClass,
                              'warningTolerancePP',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-medium text-amber-300 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </td>

                    {/* Tolerância Crítica (p.p.) */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">±</span>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          step="0.5"
                          value={cfg.criticalTolerancePP}
                          onChange={(e) =>
                            handleFieldChange(
                              cfg.assetClass,
                              'criticalTolerancePP',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-medium text-rose-300 focus:border-rose-500 focus:outline-none"
                        />
                      </div>
                    </td>

                    {/* Consumo Risco */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            consumption > 100
                              ? 'text-rose-400'
                              : consumption > 70
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {consumption}%
                        </span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              consumption > 100
                                ? 'bg-rose-500'
                                : consumption > 70
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, consumption)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          status === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : status === 'WARNING'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {status === 'CRITICAL'
                          ? 'Crítico'
                          : status === 'WARNING'
                          ? 'Atenção'
                          : 'Conforme'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Explicação regulatória CVM 175 */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            * Em conformidade com a <strong>Resolução CVM 175</strong>: Desenquadramentos passivos decorrentes de oscilações de mercado contam com prazo regulatório para reenquadramento antes de sanção fiduciária.
          </span>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center self-end sm:self-auto gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Aplicar Ajustes
          </button>
        </div>
      </div>
    </div>
  );
};
