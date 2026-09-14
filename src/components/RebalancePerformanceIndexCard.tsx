import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Scale,
  Sparkles,
  Info,
  Calendar,
  DollarSign,
  FileCheck2,
  Percent,
} from 'lucide-react';
import { Portfolio, ComplianceAlert } from '../types';
import {
  getRebalancePerformanceData,
  RebalanceActionRecord,
  RebalanceDimensionPerformance,
} from '../utils/rebalancePerformanceData';

interface RebalancePerformanceIndexCardProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  onSelectPortfolio?: (portfolioId: string) => void;
  onStartRebalance?: (portfolioId: string) => void;
  className?: string;
}

type ViewMode = 'BY_PORTFOLIO' | 'BY_DIMENSION';

export const RebalancePerformanceIndexCard: React.FC<RebalancePerformanceIndexCardProps> = ({
  portfolios,
  alerts,
  onSelectPortfolio,
  onStartRebalance,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('BY_PORTFOLIO');
  const [showRecentActionsTable, setShowRecentActionsTable] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calcula os dados de performance consolidados
  const performanceData = useMemo(() => {
    return getRebalancePerformanceData(portfolios, alerts);
  }, [portfolios, alerts]);

  // Dataset formatado para o BarChart conforme o modo selecionado
  const chartData = useMemo(() => {
    if (viewMode === 'BY_PORTFOLIO') {
      return performanceData.recentActions.map((act) => ({
        name: act.portfolioName.length > 20 ? act.portfolioName.substring(0, 18) + '...' : act.portfolioName,
        fullName: act.portfolioName,
        clientName: act.clientName,
        preScore: act.preEfficiency,
        postScore: act.postEfficiency,
        gain: act.efficiencyGain,
        gainLabel: `+${act.efficiencyGain.toFixed(1)}%`,
        volume: act.totalVolumeBRL,
        taxSaved: act.taxSavedBRL,
        protocol: act.auditProtocol,
        date: act.executionDate,
        assetClass: act.primaryAssetClass,
        deviationEliminated: act.deviationEliminatedPP,
        portfolioId: act.portfolioId,
      }));
    } else {
      return performanceData.dimensionComparison.map((dim) => ({
        name: dim.dimension.length > 18 ? dim.dimension.substring(0, 16) + '...' : dim.dimension,
        fullName: dim.dimension,
        clientName: dim.description,
        preScore: dim.preScore,
        postScore: dim.postScore,
        gain: Number((dim.postScore - dim.preScore).toFixed(1)),
        gainLabel: `+${(dim.postScore - dim.preScore).toFixed(1)} p.p.`,
        volume: 0,
        taxSaved: 0,
        protocol: 'DIMENSÃO METODOLÓGICA',
        date: 'Último ciclo fiduciário',
        assetClass: 'Multiclasses',
        deviationEliminated: dim.gainPP,
        portfolioId: '',
      }));
    }
  }, [viewMode, performanceData]);

  // Custom Tooltip do Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-2 max-w-xs z-50">
          <div className="border-b border-slate-800 pb-2">
            <div className="font-bold text-white text-sm leading-snug">{data.fullName}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{data.clientName}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Pré-Rebalanceamento</span>
              <span className="text-sm font-bold text-amber-400 font-mono">{data.preScore}%</span>
              <span className="text-[10px] text-slate-500 block">eficiência inicial</span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-300 block font-medium">Pós-Rebalanceamento</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{data.postScore}%</span>
              <span className="text-[10px] text-emerald-400/80 block font-bold">{data.gainLabel}</span>
            </div>
          </div>

          <div className="space-y-1 text-[11px] pt-1 text-slate-300">
            {data.volume > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Volume Transacionado:</span>
                <span className="font-mono text-white font-semibold">
                  R$ {(data.volume / 1000).toFixed(0)}k
                </span>
              </div>
            )}
            {data.taxSaved > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Economia Fiscal (IR):</span>
                <span className="font-mono text-emerald-400 font-bold">
                  R$ {data.taxSaved.toLocaleString('pt-BR')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Desvio Eliminado:</span>
              <span className="font-mono text-cyan-300 font-semibold">
                -{data.deviationEliminated} p.p.
              </span>
            </div>
            {data.protocol && data.protocol !== 'DIMENSÃO METODOLÓGICA' && (
              <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 font-mono">
                <span>Protocolo:</span>
                <span>{data.protocol}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="card-rebalance-performance-index"
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 transition ${className}`}
    >
      {/* Cabeçalho do Card: Título, Subtítulo e Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Índice de Performance de Rebalanceamento
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  Média: +{performanceData.averageEfficiencyGain}%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Média de ganho de eficiência operacional, risco e conformidade fiduciária após as últimas ações de rebalanceamento.
              </p>
            </div>
          </div>
        </div>

        {/* Toggle de Visualização (Por Carteira vs Por Dimensão) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex rounded-xl bg-slate-950 border border-slate-800 p-1 text-xs font-medium">
            <button
              id="view-rebalance-by-portfolio-btn"
              onClick={() => setViewMode('BY_PORTFOLIO')}
              className={`px-3 py-1.5 rounded-lg transition font-semibold cursor-pointer ${
                viewMode === 'BY_PORTFOLIO'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Últimas Carteiras
            </button>
            <button
              id="view-rebalance-by-dimension-btn"
              onClick={() => setViewMode('BY_DIMENSION')}
              className={`px-3 py-1.5 rounded-lg transition font-semibold cursor-pointer ${
                viewMode === 'BY_DIMENSION'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pilares de Eficiência
            </button>
          </div>

          <button
            id="toggle-recent-actions-table-btn"
            onClick={() => setShowRecentActionsTable(!showRecentActionsTable)}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700/80 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showRecentActionsTable ? 'Ocultar Detalhes' : 'Ver Execuções'}</span>
          </button>
        </div>
      </div>

      {/* Grid de 4 Indicadores-Chave de Eficiência (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Ganho Médio de Eficiência */}
        <div className="bg-slate-950/70 border border-emerald-500/25 rounded-xl p-3.5 hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              Ganho Médio de Eficiência
            </span>
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
              +{performanceData.averageEfficiencyGain}%
            </span>
            <span className="text-[11px] text-emerald-300/80 font-bold">
              (Δ +{(performanceData.averagePostEfficiency - performanceData.averagePreEfficiency).toFixed(1)} p.p.)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Pré: <strong className="text-amber-400">{performanceData.averagePreEfficiency}%</strong></span>
            <span>➔</span>
            <span>Pós: <strong className="text-emerald-400">{performanceData.averagePostEfficiency}%</strong></span>
          </div>
        </div>

        {/* KPI 2: Taxa de Sucesso Fiduciário */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              Taxa de Sucesso Fiduciário
            </span>
            <div className="p-1 rounded-md bg-sky-500/10 text-sky-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight font-mono">
              {performanceData.fiduciarySuccessRate}%
            </span>
            <span className="text-[11px] text-sky-400 font-bold">5 de 5 ações</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            100% de convergência aos limites mandatórios
          </div>
        </div>

        {/* KPI 3: Redução de Desvio Residual */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              Desvio Residual Médio
            </span>
            <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-cyan-400 tracking-tight font-mono">
              -{performanceData.averageDeviationReductionPP} p.p.
            </span>
            <span className="text-[11px] text-slate-400">eliminados</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Enquadramento estrito na Resolução CVM 175
          </div>
        </div>

        {/* KPI 4: Economia Fiscal Otimizada */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              Economia Fiscal & Custos
            </span>
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight font-mono">
              R$ {(performanceData.totalTaxSavedBRL / 1000).toFixed(1)}k
            </span>
            <span className="text-[11px] text-emerald-400 font-bold">em IR</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Via compensação de prejuízos e isenções
          </div>
        </div>
      </div>

      {/* Gráfico de Barras Comparativo (Recharts BarChart) */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {viewMode === 'BY_PORTFOLIO'
                ? 'Comparativo de Eficiência: Pré vs. Pós-Rebalanceamento por Carteira'
                : 'Comparativo de Eficiência: Pré vs. Pós por Dimensão Operacional'}
            </h4>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-600 border border-slate-500/50" />
              <span className="text-slate-300 text-[11px]">Pré-Rebalanceamento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400/50" />
              <span className="text-emerald-300 text-[11px] font-bold">Pós-Rebalanceamento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-b border-dashed border-cyan-400" />
              <span className="text-cyan-300 text-[10px]">Meta IPS (80%)</span>
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
              barGap={6}
              barCategoryGap="24%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />
              
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#475569' }}
                interval={0}
                tick={{ fill: '#cbd5e1' }}
              />
              
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#475569' }}
                domain={[0, 100]}
                unit="%"
                ticks={[0, 25, 50, 75, 80, 100]}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.15 }} />

              {/* Linha de referência da Meta de Eficiência CVM 175 / IPS */}
              <ReferenceLine
                y={80}
                stroke="#06b6d4"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Meta IPS (80%)',
                  fill: '#06b6d4',
                  fontSize: 10,
                  position: 'right',
                  offset: 5,
                }}
              />

              {/* Barra 1: Pré-Rebalanceamento */}
              <Bar
                dataKey="preScore"
                name="Pré-Rebalanceamento"
                fill="#64748b"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`pre-cell-${index}`}
                    fill={hoveredIndex === index ? '#94a3b8' : '#64748b'}
                    className="transition-colors"
                  />
                ))}
              </Bar>

              {/* Barra 2: Pós-Rebalanceamento */}
              <Bar
                dataKey="postScore"
                name="Pós-Rebalanceamento"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`post-cell-${index}`}
                    fill={hoveredIndex === index ? '#34d399' : '#10b981'}
                    className="transition-colors"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rodapé explicativo do gráfico com resumo das variações */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              O cálculo pondera aderência aos limites da IPS, redução de volatilidade não-sistemática e otimização fiscal.
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            {chartData.slice(0, 3).map((item, idx) => (
              <span key={idx} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                <span className="text-slate-400">{item.name.split(' ')[0]}:</span>{' '}
                <strong className="text-emerald-400">{item.gainLabel}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela Retrátil: Detalhes das Últimas Execuções de Rebalanceamento */}
      {showRecentActionsTable && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 transition">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              Auditoria das Últimas 5 Ações de Rebalanceamento
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Volume Total: R$ {(performanceData.totalRebalancedVolumeBRL / 1000000).toFixed(2)}M
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2 px-2 font-medium">Carteira & Titular</th>
                  <th className="py-2 px-2 font-medium">Data / Protocolo</th>
                  <th className="py-2 px-2 font-medium text-center">Eficiência Pré</th>
                  <th className="py-2 px-2 font-medium text-center">Eficiência Pós</th>
                  <th className="py-2 px-2 font-medium text-center">Ganho (%)</th>
                  <th className="py-2 px-2 font-medium text-right">Volume</th>
                  <th className="py-2 px-2 font-medium text-right">Economia IR</th>
                  <th className="py-2 px-2 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {performanceData.recentActions.map((action) => (
                  <tr
                    key={action.id}
                    className="hover:bg-slate-900/60 transition group"
                  >
                    <td className="py-2.5 px-2">
                      <div className="font-semibold text-white group-hover:text-emerald-400 transition">
                        {action.portfolioName}
                      </div>
                      <div className="text-[10px] text-slate-400">{action.clientName}</div>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[11px] text-slate-300">
                      <div>{action.executionDate}</div>
                      <div className="text-[10px] text-slate-500">{action.auditProtocol}</div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-400">
                      {action.preEfficiency}%
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-400">
                      {action.postEfficiency}%
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold font-mono">
                        +{action.efficiencyGain}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-200">
                      R$ {(action.totalVolumeBRL / 1000).toFixed(0)}k
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-emerald-400 font-semibold">
                      R$ {action.taxSavedBRL.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {onSelectPortfolio && (
                          <button
                            onClick={() => onSelectPortfolio(action.portfolioId)}
                            className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition"
                            title="Inspecionar Carteira"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onStartRebalance && (
                          <button
                            onClick={() => onStartRebalance(action.portfolioId)}
                            className="p-1 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition"
                            title="Simular Novo Rebalanceamento"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
