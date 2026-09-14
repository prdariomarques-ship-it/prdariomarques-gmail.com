import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Activity,
  Calendar,
  Layers,
  Sliders,
  Info,
  Flame,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Portfolio, ComplianceAlert } from '../types';
import { matchesAssetClass, ASSET_CLASS_OPTIONS } from './AssetClassFilterBar';

interface ComplianceBreachHistoryChartProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  onSelectPortfolio?: (portfolioId: string) => void;
  onStartRebalance?: (portfolioId: string) => void;
  selectedAssetClass?: string;
  onSelectAssetClass?: (assetClass: string) => void;
}

export type ChartMode = 'AREA' | 'BAR' | 'LINES';
export type MetricType = 'OCCURRENCES' | 'DEVIATION_PP' | 'EXCESS_BRL';

interface DayHistoryPoint {
  date: string;
  dayIndex: number;
  totalBreaches: number;
  criticalCount: number;
  warningCount: number;
  totalExcessBRL: number; // in R$
  maxDeviationPP: number; // in percentage points (+p.p.)
  marketEvent?: string;
  volatilityTag?: string;
  portfolioBreakdown: {
    [portfolioId: string]: {
      name: string;
      deviationPP: number;
      excessBRL: number;
      severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
      assetClass: string;
    };
  };
  // Dynamic portfolio fields for recharts series
  [key: string]: any;
}

export const ComplianceBreachHistoryChart: React.FC<ComplianceBreachHistoryChartProps> = ({
  portfolios,
  alerts,
  onSelectPortfolio,
  onStartRebalance,
  selectedAssetClass,
  onSelectAssetClass,
}) => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('ALL');
  const [chartMode, setChartMode] = useState<ChartMode>('AREA');
  const [metricType, setMetricType] = useState<MetricType>('OCCURRENCES');
  const [internalAssetClass, setInternalAssetClass] = useState<string>('ALL');

  // Active asset class: controlled or internal
  const activeAssetClass = selectedAssetClass !== undefined ? selectedAssetClass : internalAssetClass;

  const handleAssetClassChange = (newClass: string) => {
    setInternalAssetClass(newClass);
    if (onSelectAssetClass) {
      onSelectAssetClass(newClass);
    }
  };

  // Cores personalizadas para cada carteira
  const portfolioColorPalette: { [key: string]: string } = {
    'port-001': '#f43f5e', // Rose / Alpha Privada
    'port-002': '#06b6d4', // Cyan / Cliente Exemplo 2
    'port-003': '#10b981', // Emerald / Cliente Exemplo 3
    'port-004': '#f59e0b', // Amber / Carteira Exemplo
    'port-005': '#8b5cf6', // Violet / Família Demo
    'default': '#64748b',
  };

  const getPortfolioColor = (portId: string, index: number): string => {
    if (portfolioColorPalette[portId]) return portfolioColorPalette[portId];
    const fallbackColors = ['#f43f5e', '#06b6d4', '#f59e0b', '#10b981', '#a855f7', '#ec4899', '#3b82f6'];
    return fallbackColors[index % fallbackColors.length];
  };

  // Constrói os 30 dias de histórico correlacionando com os dados ao vivo atuais e filtrando por classe de ativos
  const historyData: DayHistoryPoint[] = useMemo(() => {
    const data: DayHistoryPoint[] = [];
    const today = new Date();

    // Eventos macro conhecidos ao longo dos últimos 30 dias que geraram choques
    const macroEvents: { [dayIndex: number]: { event: string; tag: string } } = {
      2: { event: 'Início do ciclo mensal de apuração fiduciária', tag: 'Abertura' },
      7: { event: 'Alta volatilidade cambial USD/BRL (+2.4%)', tag: 'Stress Cambial' },
      12: { event: 'Rali da Bolsa de Valores (Ibov +3.8%)', tag: 'Choque Renda Variável' },
      18: { event: 'Abertura da curva de juros futuros (DI +45 bps)', tag: 'Stress de Curva' },
      23: { event: 'Rebalanceamento tático pós-comitê de alocação', tag: 'Alívio / Normalização' },
      27: { event: 'Movimentação atípica em crédito privado', tag: 'Atenção Crédito' },
      29: { event: 'Pré-fechamento mensal e checagem de enquadramento', tag: 'Auditoria' },
    };

    // Alertas atuais mapeados por portfolioId
    const currentAlertsMap = new Map<string, ComplianceAlert>();
    alerts.forEach((alert) => {
      currentAlertsMap.set(alert.portfolioId, alert);
    });

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const dayIndex = 30 - i; // 1 to 30

      const point: DayHistoryPoint = {
        date: dateStr,
        dayIndex,
        totalBreaches: 0,
        criticalCount: 0,
        warningCount: 0,
        totalExcessBRL: 0,
        maxDeviationPP: 0,
        marketEvent: macroEvents[dayIndex]?.event,
        volatilityTag: macroEvents[dayIndex]?.tag,
        portfolioBreakdown: {},
      };

      // Se for o dia atual (i === 0), usa rigorosamente os dados reais/vivos atuais!
      if (i === 0) {
        portfolios.forEach((port) => {
          const alert = currentAlertsMap.get(port.id);
          const rawDev = alert ? alert.difference : 0;
          const rawExcess = alert ? alert.excessValueBRL : 0;
          const rawSev = alert ? alert.severity : port.status;
          const assetClass = alert ? alert.assetClass : 'Enquadrado';

          // Filtragem por classe de ativos
          const isClassMatch = matchesAssetClass(assetClass, activeAssetClass);
          const dev = isClassMatch ? rawDev : 0;
          const excess = isClassMatch ? rawExcess : 0;
          const sev = isClassMatch ? rawSev : 'NORMAL';

          point.portfolioBreakdown[port.id] = {
            name: port.name,
            deviationPP: dev,
            excessBRL: excess,
            severity: sev,
            assetClass,
          };

          point[`port_${port.id}_dev`] = dev;
          point[`port_${port.id}_excess`] = excess / 1000;
          point[`port_${port.id}_count`] = alert && isClassMatch ? 1 : 0;

          if (alert && isClassMatch) {
            point.totalBreaches += 1;
            if (alert.severity === 'CRITICAL') point.criticalCount += 1;
            else if (alert.severity === 'WARNING') point.warningCount += 1;
            point.totalExcessBRL += excess;
            if (dev > point.maxDeviationPP) point.maxDeviationPP = dev;
          }
        });
      } else {
        // Histórico sintético realista calibrado para cada carteira
        portfolios.forEach((port) => {
          let rawDev = 0;
          let rawExcess = 0;
          let rawSev: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
          let assetClass = 'Enquadrado';

          if (port.id === 'port-001') {
            // Carteira Alpha Privada: perfil arrojado com alta volatilidade em Renda Variável
            // Apresenta drift crescente e picos nos dias de rali de bolsa (dia 10 a 16 e dias 25 a 30)
            if (dayIndex >= 22) {
              rawDev = 6.5 + Math.sin(dayIndex) * 2.0;
              rawSev = 'CRITICAL';
              assetClass = 'Renda Variável';
            } else if (dayIndex >= 11 && dayIndex <= 15) {
              rawDev = 5.2 + (dayIndex - 11) * 0.8;
              rawSev = 'CRITICAL';
              assetClass = 'Renda Variável';
            } else if (dayIndex >= 7 && dayIndex <= 10) {
              rawDev = 3.2;
              rawSev = 'WARNING';
              assetClass = 'Renda Variável';
            } else {
              rawDev = 1.2;
              rawSev = 'NORMAL';
              assetClass = 'Renda Variável';
            }
            rawExcess = rawDev > 0 ? rawDev * 60000 : 0;
          } else if (port.id === 'port-004') {
            // Carteira Exemplo Offshore: sensível ao câmbio USD/BRL
            if (dayIndex >= 6 && dayIndex <= 10) {
              rawDev = 4.2;
              rawSev = 'WARNING';
              assetClass = 'Internacional';
            } else if (dayIndex >= 24) {
              rawDev = 3.1;
              rawSev = 'WARNING';
              assetClass = 'Internacional';
            } else {
              rawDev = 0.8;
              rawSev = 'NORMAL';
              assetClass = 'Internacional';
            }
            rawExcess = rawDev > 0 ? rawDev * 28000 : 0;
          } else if (port.id === 'port-002') {
            // Cliente Exemplo 2 Silveira: moderado, com stress pontual na abertura da curva (dia 17 a 19)
            if (dayIndex >= 17 && dayIndex <= 19) {
              rawDev = 3.4;
              rawSev = 'WARNING';
              assetClass = 'Renda Fixa';
            } else {
              rawDev = 0;
              rawSev = 'NORMAL';
              assetClass = 'Renda Fixa';
            }
            rawExcess = rawDev > 0 ? rawDev * 15000 : 0;
          } else if (port.id === 'port-005') {
            // Família Demo: esporádico
            if (dayIndex === 12 || dayIndex === 13) {
              rawDev = 5.5;
              rawSev = 'CRITICAL';
              assetClass = 'Multimercado';
            } else {
              rawDev = 0.5;
              rawSev = 'NORMAL';
              assetClass = 'Multimercado';
            }
            rawExcess = rawDev > 0 ? rawDev * 35000 : 0;
          } else {
            // Cliente Exemplo 3 (Conservadora) & outras: mantêm-se enquadradas
            rawDev = 0;
            rawSev = 'NORMAL';
            assetClass = 'Renda Fixa';
          }

          // Filtragem por classe de ativos
          const isClassMatch = matchesAssetClass(assetClass, activeAssetClass);
          const dev = isClassMatch ? rawDev : 0;
          const excess = isClassMatch ? rawExcess : 0;
          const sev = isClassMatch ? rawSev : 'NORMAL';

          point.portfolioBreakdown[port.id] = {
            name: port.name,
            deviationPP: parseFloat(dev.toFixed(1)),
            excessBRL: Math.round(excess),
            severity: sev,
            assetClass,
          };

          point[`port_${port.id}_dev`] = parseFloat(dev.toFixed(1));
          point[`port_${port.id}_excess`] = Math.round(excess / 1000);
          point[`port_${port.id}_count`] = sev !== 'NORMAL' && isClassMatch ? 1 : 0;

          if (sev !== 'NORMAL' && isClassMatch) {
            point.totalBreaches += 1;
            if (sev === 'CRITICAL') point.criticalCount += 1;
            else point.warningCount += 1;
            point.totalExcessBRL += excess;
            if (dev > point.maxDeviationPP) point.maxDeviationPP = parseFloat(dev.toFixed(1));
          }
        });
      }

      data.push(point);
    }

    return data;
  }, [portfolios, alerts, activeAssetClass]);

  // Estatísticas agregadas dos últimos 30 dias para os badges de topo
  const stats = useMemo(() => {
    let totalBreachDays = 0;
    let criticalDays = 0;
    let peakDev = 0;
    let peakExcess = 0;
    const portfolioBreachCount: { [key: string]: { name: string; count: number; maxDev: number } } = {};

    portfolios.forEach((p) => {
      portfolioBreachCount[p.id] = { name: p.name, count: 0, maxDev: 0 };
    });

    historyData.forEach((pt) => {
      if (pt.totalBreaches > 0) totalBreachDays += 1;
      if (pt.criticalCount > 0) criticalDays += 1;
      if (pt.maxDeviationPP > peakDev) peakDev = pt.maxDeviationPP;
      if (pt.totalExcessBRL > peakExcess) peakExcess = pt.totalExcessBRL;

      Object.entries(pt.portfolioBreakdown).forEach(([portId, info]) => {
        if (info.severity !== 'NORMAL' && portfolioBreachCount[portId]) {
          portfolioBreachCount[portId].count += 1;
          if (info.deviationPP > portfolioBreachCount[portId].maxDev) {
            portfolioBreachCount[portId].maxDev = info.deviationPP;
          }
        }
      });
    });

    // Carteira com maior volatilidade/recorrência
    let mostVolatile = { id: '', name: 'Nenhuma', count: 0, maxDev: 0 };
    Object.entries(portfolioBreachCount).forEach(([id, item]) => {
      if (item.count > mostVolatile.count) {
        mostVolatile = { id, name: item.name, count: item.count, maxDev: item.maxDev };
      }
    });

    // Frequência de conformidade (% dos 30 dias em que não houve violação crítica)
    const complianceRate30d = Math.round(((30 - criticalDays) / 30) * 100);

    return {
      totalBreachDays,
      criticalDays,
      peakDev,
      peakExcess,
      mostVolatile,
      complianceRate30d,
      portfolioBreachCount,
    };
  }, [historyData, portfolios]);

  // Custom Tooltip estilizado para o padrão terminal do FlowCore
  const CustomHistoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: DayHistoryPoint = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md max-w-sm text-xs space-y-2 z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Data: {dataPoint.date} (Dia {dataPoint.dayIndex}/30)</span>
            </div>
            <div className="flex items-center gap-1.5">
              {activeAssetClass !== 'ALL' && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                  {ASSET_CLASS_OPTIONS.find((o) => o.id === activeAssetClass)?.shortLabel || activeAssetClass}
                </span>
              )}
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  dataPoint.criticalCount > 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : dataPoint.warningCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {dataPoint.criticalCount > 0
                  ? 'CRÍTICO'
                  : dataPoint.warningCount > 0
                  ? 'ATENÇÃO'
                  : '100% ENQUADRADO'}
              </span>
            </div>
          </div>

          {dataPoint.marketEvent && (
            <div className="p-1.5 bg-slate-900 border border-amber-500/30 rounded-lg text-[11px] text-amber-200/90 flex items-start gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Gatilho Macro:</span> {dataPoint.marketEvent}
              </div>
            </div>
          )}

          {/* Sumário do dia */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-400">Total Infrações:</span>{' '}
              <strong className="text-white font-mono">{dataPoint.totalBreaches}</strong>
            </div>
            <div>
              <span className="text-slate-400">Pico Desvio:</span>{' '}
              <strong className={dataPoint.maxDeviationPP > 5 ? 'text-rose-400 font-mono' : 'text-amber-400 font-mono'}>
                +{dataPoint.maxDeviationPP.toFixed(1)} p.p.
              </strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400">Capital em Risco:</span>{' '}
              <strong className="text-emerald-400 font-mono">
                R$ {dataPoint.totalExcessBRL.toLocaleString('pt-BR')}
              </strong>
            </div>
          </div>

          {/* Detalhamento por Carteira */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Status das Carteiras:
            </span>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {Object.entries(dataPoint.portfolioBreakdown)
                .filter(([portId]) => selectedPortfolioId === 'ALL' || selectedPortfolioId === portId)
                .map(([portId, item]) => {
                  const isCrit = item.severity === 'CRITICAL';
                  const isWarn = item.severity === 'WARNING';
                  return (
                    <div
                      key={portId}
                      className="flex items-center justify-between text-[11px] py-1 px-1.5 rounded bg-slate-900/40 border border-slate-800/60"
                    >
                      <div className="truncate max-w-[170px]">
                        <span className="text-white font-medium">{item.name}</span>
                        {item.severity !== 'NORMAL' && (
                          <span className="text-slate-400 text-[10px] block">
                            {item.assetClass} ({item.severity === 'CRITICAL' ? 'Crítico' : 'Atenção'})
                          </span>
                        )}
                      </div>
                      <div className="text-right font-mono">
                        {item.severity !== 'NORMAL' ? (
                          <span className={isCrit ? 'text-rose-400 font-bold' : 'text-amber-400 font-semibold'}>
                            +{item.deviationPP.toFixed(1)} p.p.
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[10px] font-sans">Ok</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="compliance-breach-history-section"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5"
    >
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Histórico de Desenquadramentos (Últimos 30 Dias)
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Padrões de Volatilidade
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Detecção de clusters de stress, persistência de desvios e recorrência de infrações às regras CVM 175 e mandatos IPS.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Asset Class Filter Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              id="compliance-history-asset-class-filter"
              value={activeAssetClass}
              onChange={(e) => handleAssetClassChange(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs pr-1"
              title="Filtrar histórico por classe de ativos"
            >
              {ASSET_CLASS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Portfolio Filter Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 shadow-sm">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="compliance-history-portfolio-filter"
              value={selectedPortfolioId}
              onChange={(e) => setSelectedPortfolioId(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs pr-1"
            >
              <option value="ALL" className="bg-slate-900 text-white">
                Todas as Carteiras ({portfolios.length})
              </option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Metric Selector Pills */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setMetricType('OCCURRENCES')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                metricType === 'OCCURRENCES'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Quantidade diária de infrações ativas"
            >
              Infrações
            </button>
            <button
              onClick={() => setMetricType('DEVIATION_PP')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                metricType === 'DEVIATION_PP'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Desvio em pontos percentuais (+p.p.) acima do teto IPS/CVM"
            >
              Desvio (+p.p.)
            </button>
            <button
              onClick={() => setMetricType('EXCESS_BRL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                metricType === 'EXCESS_BRL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Volume de capital excedente em risco (R$ mil)"
            >
              Capital em Risco (R$)
            </button>
          </div>

          {/* Chart Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setChartMode('AREA')}
              className={`px-2 py-1 rounded-lg font-semibold transition ${
                chartMode === 'AREA'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Visualização em Área contínua"
            >
              Área
            </button>
            <button
              onClick={() => setChartMode('BAR')}
              className={`px-2 py-1 rounded-lg font-semibold transition ${
                chartMode === 'BAR'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Visualização em Barras por Severidade"
            >
              Barras
            </button>
            <button
              onClick={() => setChartMode('LINES')}
              className={`px-2 py-1 rounded-lg font-semibold transition ${
                chartMode === 'LINES'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Comparativo multi-linhas por carteira"
            >
              Linhas
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Indicator Banner if filtered */}
      {activeAssetClass !== 'ALL' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-cyan-500/20 text-cyan-300">
              <Filter className="w-3.5 h-3.5" />
            </span>
            <span className="text-slate-300">
              Exibindo histórico filtrado para a classe:{' '}
              <strong className="text-cyan-200 font-bold font-mono">
                {ASSET_CLASS_OPTIONS.find((o) => o.id === activeAssetClass)?.label || activeAssetClass}
              </strong>
            </span>
            <span className="hidden md:inline text-slate-400 text-[11px]">
              (Os KPIs e séries temporais refletem exclusivamente desenquadramentos nesta classe)
            </span>
          </div>

          <button
            onClick={() => handleAssetClassChange('ALL')}
            className="self-start sm:self-auto text-[11px] font-bold text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
          >
            Ver Todas as Classes
          </button>
        </div>
      )}

      {/* Top 4 KPI Metric Chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Dias com Violação (30d)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white font-mono">{stats.totalBreachDays}</span>
            <span className="text-[11px] text-slate-400">/ 30 dias</span>
          </div>
          <span className="text-[10px] text-rose-400 font-medium">
            {stats.criticalDays} dias com severidade Crítica
          </span>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Pico Máximo de Desvio</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-rose-400 font-mono">
              +{stats.peakDev.toFixed(1)} p.p.
            </span>
            <span className="text-[10px] text-slate-400">(Teto +5.0)</span>
          </div>
          <span className="text-[10px] text-slate-400">Excesso max: R$ {(stats.peakExcess / 1000).toFixed(0)}k</span>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Carteira c/ Maior Recorrência</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1">
            <span className="text-sm font-bold text-white truncate block" title={stats.mostVolatile.name}>
              {stats.mostVolatile.name}
            </span>
          </div>
          <span className="text-[10px] text-amber-400 font-medium">
            {stats.mostVolatile.count} dias em desvio ({Math.round((stats.mostVolatile.count / 30) * 100)}% do tempo)
          </span>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Taxa de Resolução CVM</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-emerald-400 font-mono">
              {stats.complianceRate30d}%
            </span>
            <span className="text-[10px] text-slate-400">dias enquadrados</span>
          </div>
          <span className="text-[10px] text-slate-400">Monitoramento ativo 24/7</span>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-semibold text-white">Evolução Temporal:</span>
            <span className="text-slate-400">
              {metricType === 'OCCURRENCES'
                ? 'Quantidade de carteiras com violações simultâneas por dia'
                : metricType === 'DEVIATION_PP'
                ? 'Desvio máximo de alocação em relação ao limite estipulado (+ p.p.)'
                : 'Valor monetário total acumulado que excede o mandato (R$ mil)'}
            </span>
          </div>
          {selectedPortfolioId !== 'ALL' && (
            <button
              onClick={() => setSelectedPortfolioId('ALL')}
              className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
            >
              Resetar para Todas as Carteiras
            </button>
          )}
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'BAR' ? (
              <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={metricType === 'DEVIATION_PP'}
                />
                <Tooltip content={<CustomHistoryTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
                {selectedPortfolioId === 'ALL' ? (
                  <>
                    <Bar
                      dataKey={
                        metricType === 'OCCURRENCES'
                          ? 'criticalCount'
                          : metricType === 'DEVIATION_PP'
                          ? 'maxDeviationPP'
                          : 'totalExcessBRL'
                      }
                      name={
                        metricType === 'OCCURRENCES'
                          ? 'Desenquadramento Crítico'
                          : metricType === 'DEVIATION_PP'
                          ? 'Desvio Máximo (+p.p.)'
                          : 'Excesso (R$)'
                      }
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                    />
                    {metricType === 'OCCURRENCES' && (
                      <Bar
                        dataKey="warningCount"
                        name="Alertas em Atenção"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                      />
                    )}
                  </>
                ) : (
                  <Bar
                    dataKey={
                      metricType === 'OCCURRENCES'
                        ? `port_${selectedPortfolioId}_count`
                        : metricType === 'DEVIATION_PP'
                        ? `port_${selectedPortfolioId}_dev`
                        : `port_${selectedPortfolioId}_excess`
                    }
                    name={portfolios.find((p) => p.id === selectedPortfolioId)?.name || 'Carteira'}
                    fill={getPortfolioColor(selectedPortfolioId, 0)}
                    radius={[4, 4, 0, 0]}
                  />
                )}
                {metricType === 'DEVIATION_PP' && (
                  <ReferenceLine
                    y={5.0}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Gatilho Crítico (+5.0 p.p.)',
                      fill: '#f43f5e',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                )}
              </BarChart>
            ) : chartMode === 'LINES' ? (
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={metricType === 'DEVIATION_PP'}
                />
                <Tooltip content={<CustomHistoryTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
                {selectedPortfolioId === 'ALL' ? (
                  portfolios.map((port, idx) => (
                    <Line
                      key={port.id}
                      type="monotone"
                      dataKey={
                        metricType === 'OCCURRENCES'
                          ? `port_${port.id}_count`
                          : metricType === 'DEVIATION_PP'
                          ? `port_${port.id}_dev`
                          : `port_${port.id}_excess`
                      }
                      name={port.name}
                      stroke={getPortfolioColor(port.id, idx)}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  ))
                ) : (
                  <Line
                    type="monotone"
                    dataKey={
                      metricType === 'OCCURRENCES'
                        ? `port_${selectedPortfolioId}_count`
                        : metricType === 'DEVIATION_PP'
                        ? `port_${selectedPortfolioId}_dev`
                        : `port_${selectedPortfolioId}_excess`
                    }
                    name={portfolios.find((p) => p.id === selectedPortfolioId)?.name || 'Carteira'}
                    stroke={getPortfolioColor(selectedPortfolioId, 0)}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {metricType === 'DEVIATION_PP' && (
                  <ReferenceLine
                    y={5.0}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Gatilho Crítico CVM 175 (+5.0 p.p.)',
                      fill: '#f43f5e',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                )}
              </LineChart>
            ) : (
              /* AREA CHART (Default) */
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHistoryCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorHistoryWarning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorHistoryDynamic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={metricType === 'DEVIATION_PP'}
                />
                <Tooltip content={<CustomHistoryTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
                {selectedPortfolioId === 'ALL' ? (
                  <>
                    <Area
                      type="monotone"
                      dataKey={
                        metricType === 'OCCURRENCES'
                          ? 'criticalCount'
                          : metricType === 'DEVIATION_PP'
                          ? 'maxDeviationPP'
                          : 'totalExcessBRL'
                      }
                      name={
                        metricType === 'OCCURRENCES'
                          ? 'Desenquadramento Crítico'
                          : metricType === 'DEVIATION_PP'
                          ? 'Desvio Máximo (+p.p.)'
                          : 'Capital em Excesso (R$)'
                      }
                      stroke="#f43f5e"
                      fillOpacity={1}
                      fill="url(#colorHistoryCritical)"
                      strokeWidth={2}
                    />
                    {metricType === 'OCCURRENCES' && (
                      <Area
                        type="monotone"
                        dataKey="warningCount"
                        name="Alertas em Atenção"
                        stroke="#f59e0b"
                        fillOpacity={1}
                        fill="url(#colorHistoryWarning)"
                        strokeWidth={1.5}
                      />
                    )}
                  </>
                ) : (
                  <Area
                    type="monotone"
                    dataKey={
                      metricType === 'OCCURRENCES'
                        ? `port_${selectedPortfolioId}_count`
                        : metricType === 'DEVIATION_PP'
                        ? `port_${selectedPortfolioId}_dev`
                        : `port_${selectedPortfolioId}_excess`
                    }
                    name={portfolios.find((p) => p.id === selectedPortfolioId)?.name || 'Carteira'}
                    stroke={getPortfolioColor(selectedPortfolioId, 0)}
                    fillOpacity={1}
                    fill="url(#colorHistoryDynamic)"
                    strokeWidth={2.5}
                  />
                )}
                {metricType === 'DEVIATION_PP' && (
                  <ReferenceLine
                    y={5.0}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Teto de Tolerância (+5.0 p.p.)',
                      fill: '#f43f5e',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volatility Pattern Diagnoses & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pattern 1: Macro Cluster */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              CLUSTER D-18 / D-12
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Correlação Alta</span>
          </div>
          <h4 className="text-xs font-bold text-white">Sensibilidade a Choques de Mercado</h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Nos dias 12 e 18, oscilações fortes na curva de juros e no Ibovespa geraram múltiplos desenquadramentos simultâneos (clusterização de risco).
          </p>
          <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-800/80">
            <Info className="w-3 h-3 text-cyan-400" />
            <span>Recomendação: Ajustar bandas de tolerância dinâmica.</span>
          </div>
        </div>

        {/* Pattern 2: Persistence Drift */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              DRIFT PERSISTENTE
            </span>
            <span className="text-[10px] text-slate-400 font-mono">14 Dias Acumulados</span>
          </div>
          <h4 className="text-xs font-bold text-white">Carteira Alpha Privada (PORT-001)</h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Apresenta desvio crônico acima do teto de Renda Variável (+8.5 p.p. hoje), indicando necessidade urgente de rebalanceamento sistemático.
          </p>
          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Excesso: R$ 510.000</span>
            {onStartRebalance && (
              <button
                onClick={() => onStartRebalance('port-001')}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                <span>Rebalancear Agora</span>
              </button>
            )}
          </div>
        </div>

        {/* Pattern 3: Tail Risk / FX */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              VOLATILIDADE CAMBIAL
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Offshore D-7</span>
          </div>
          <h4 className="text-xs font-bold text-white">Carteira Exemplo Offshore (PORT-004)</h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Exposição internacional ultrapassou o teto em períodos de alta rápida do USD, entrando na faixa de atenção preventiva (+3.0 p.p.).
          </p>
          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Status: Sob controle</span>
            {onSelectPortfolio && (
              <button
                onClick={() => onSelectPortfolio('port-004')}
                className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Carteira</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
