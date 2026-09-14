import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Calendar,
  TrendingUp,
  TrendingDown,
  Info,
  ShieldCheck,
  Filter,
  Download,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import { Portfolio, ComplianceAlert, AlertComplianceSnapshot } from '../types';
import { generateThirtyDayComplianceSnapshots, calculateCompliancePeriodStats } from '../utils/complianceHistory';
import { downloadThirtyDayComplianceHistoryCSV } from '../utils/csvExport';

export interface ThirtyDayComplianceHistoryChartProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  snapshots?: AlertComplianceSnapshot[];
  onExportReport?: () => void;
  className?: string;
}

export type TimeframeRange = '7D' | '15D' | '30D';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const Custom30DayTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data: AlertComplianceSnapshot = payload[0].payload;
    const isTargetMet = data.complianceRate >= 80;

    return (
      <div className="bg-slate-950 border border-slate-700/90 rounded-xl p-3.5 shadow-2xl text-xs space-y-2.5 z-50 pointer-events-none min-w-[250px] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold text-white">{data.dayLabel}</span>
            <span className="text-[10px] text-slate-400 font-mono">({data.date})</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              isTargetMet
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : data.complianceRate >= 60
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}
          >
            {isTargetMet ? 'Meta Atingida' : 'Abaixo da Meta'}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-4">
          <span className="text-slate-400 font-medium">Taxa de Conformidade:</span>
          <span
            className={`text-lg font-extrabold font-mono ${
              isTargetMet
                ? 'text-emerald-400'
                : data.complianceRate >= 60
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {data.complianceRate.toFixed(1)}%
          </span>
        </div>

        <div className="space-y-1.5 text-[11px] pt-1.5 text-slate-300 border-t border-slate-800/80">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Carteiras em Conformidade:</span>
            <span className="font-semibold text-slate-200">
              {data.compliantPortfolios} de {data.totalPortfolios} (
              {Math.round((data.compliantPortfolios / Math.max(1, data.totalPortfolios)) * 100)}%)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Desenquadramentos Críticos:</span>
            <span
              className={`font-semibold font-mono ${
                data.criticalAlerts > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {data.criticalAlerts} {data.criticalAlerts === 1 ? 'carteira' : 'carteiras'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Alertas em Tolerância (Atenção):</span>
            <span
              className={`font-semibold font-mono ${
                data.warningAlerts > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {data.warningAlerts} {data.warningAlerts === 1 ? 'aviso' : 'avisos'}
            </span>
          </div>
          {data.totalExcessBRL > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Volume a Rebalancear:</span>
              <span className="font-semibold text-cyan-400 font-mono">
                R$ {(data.totalExcessBRL / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
              </span>
            </div>
          )}
        </div>

        {data.marketContext && (
          <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/80 leading-snug flex items-start gap-1.5">
            <Info className="w-3 h-3 text-sky-400 shrink-0 mt-0.5" />
            <span className="italic">{data.marketContext}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const ThirtyDayComplianceHistoryChart: React.FC<ThirtyDayComplianceHistoryChartProps> = ({
  portfolios,
  alerts,
  snapshots: initialSnapshots,
  onExportReport,
  className = '',
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeRange>('30D');
  const [showTargetLine, setShowTargetLine] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Geração ou reaproveitamento dos snapshots dos últimos 30 dias
  const fullThirtyDaysData: AlertComplianceSnapshot[] = useMemo(() => {
    if (initialSnapshots && initialSnapshots.length > 0) {
      return initialSnapshots;
    }
    return generateThirtyDayComplianceSnapshots(portfolios, alerts);
  }, [initialSnapshots, portfolios, alerts]);

  // Filtro pelo intervalo selecionado (30D, 15D, 7D)
  const filteredData = useMemo(() => {
    if (timeframe === '7D') {
      return fullThirtyDaysData.slice(-7);
    }
    if (timeframe === '15D') {
      return fullThirtyDaysData.slice(-15);
    }
    return fullThirtyDaysData; // 30D
  }, [fullThirtyDaysData, timeframe]);

  // Estatísticas calculadas pelo helper institucional
  const stats = useMemo(() => {
    return calculateCompliancePeriodStats(filteredData);
  }, [filteredData]);

  // Handler de exportação do CSV com histórico de 30 dias
  const handleExportCSV = () => {
    if (onExportReport) {
      onExportReport();
      return;
    }

    setIsExporting(true);
    try {
      downloadThirtyDayComplianceHistoryCSV(fullThirtyDaysData, portfolios, alerts);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (err) {
      console.error('Erro ao exportar relatório CSV do histórico de 30 dias:', err);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
      }, 1000);
    }
  };

  // Intervalo dos ticks do eixo X para não sobrecarregar no modo 30 dias
  const tickInterval = useMemo(() => {
    if (timeframe === '30D') return 4; // Mostra de ~4 em 4 dias
    if (timeframe === '15D') return 2;
    return 0; // Mostra todos os 7 dias
  }, [timeframe]);

  return (
    <div
      id="thirty-day-compliance-history-section"
      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700/80 transition space-y-4 ${className}`}
    >
      {/* Cabeçalho do Componente */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Evolução Histórica da Conformidade (Últimos 30 Dias)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-emerald-400 border border-emerald-500/30">
                Resolução CVM 175
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-800">
                {filteredData.length} Snapshots
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Trajetória diária da taxa de aderência aos mandatos de investimento (IPS) e tetos regulatórios.
            </p>
          </div>
        </div>

        {/* Controles de Período, Ações e Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão de Exportar Relatório em CSV */}
          <button
            id="export-30day-history-chart-btn"
            onClick={handleExportCSV}
            disabled={isExporting}
            title="Exportar arquivo CSV com o histórico de conformidade dos últimos 30 dias exibido no gráfico"
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-sm border border-emerald-500/50 cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-3.5 h-3.5 mr-1.5 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Gerando CSV...' : 'Exportar Relatório'}</span>
          </button>

          {exportSuccess && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
              <Check className="w-3 h-3 mr-1 text-emerald-400" />
              CSV Baixado!
            </span>
          )}

          {/* Seletor de Intervalo (30D, 15D, 7D) */}
          <div className="inline-flex rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs font-medium">
            <button
              id="compliance-timeframe-30d-btn"
              onClick={() => setTimeframe('30D')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                timeframe === '30D'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              30 Dias
            </button>
            <button
              id="compliance-timeframe-15d-btn"
              onClick={() => setTimeframe('15D')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                timeframe === '15D'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              15 Dias
            </button>
            <button
              id="compliance-timeframe-7d-btn"
              onClick={() => setTimeframe('7D')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                timeframe === '7D'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              7 Dias
            </button>
          </div>

          {/* Toggle Linha de Meta 80% */}
          <button
            onClick={() => setShowTargetLine(!showTargetLine)}
            title="Alternar visibilidade da linha de meta normativa (80%)"
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showTargetLine
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                showTargetLine ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
            <span>Meta: 80%</span>
          </button>

          {/* Badge Variação do Período */}
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Variação {timeframe}:</span>
            <span
              className={`font-bold font-mono flex items-center gap-0.5 ${
                stats.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {stats.delta >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>
                {stats.delta >= 0 ? '+' : ''}
                {stats.delta.toFixed(1)} p.p.
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico de Linha Interativo com Recharts */}
      <div className="w-full h-60 pt-1 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{ top: 12, right: 20, left: -20, bottom: 6 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.28} vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={11}
              interval={tickInterval}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(val, idx) => {
                const item = filteredData[idx];
                return item?.dayLabel === 'Hoje' ? 'Hoje' : val;
              }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(val) => `${val}%`}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip content={<Custom30DayTooltip />} />

            {showTargetLine && (
              <ReferenceLine
                y={80}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                label={{
                  value: 'Meta CVM 175 / IPS (80%)',
                  position: 'insideTopLeft',
                  fill: '#10b981',
                  fontSize: 10.5,
                  fontWeight: 600,
                }}
              />
            )}

            <Line
              type="monotone"
              dataKey="complianceRate"
              name="Taxa de Conformidade"
              stroke="#10b981"
              strokeWidth={2.8}
              dot={{
                r: timeframe === '30D' ? 3 : 4.5,
                fill: '#10b981',
                stroke: '#0f172a',
                strokeWidth: 2,
              }}
              activeDot={{
                r: 7,
                fill: '#34d399',
                stroke: '#022c22',
                strokeWidth: 2.5,
              }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Grid de Métricas Consolidadas dos 30 Dias */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
        {/* Métrica 1: Taxa Atual */}
        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/70">
          <span className="text-slate-400 block text-[10.5px]">Taxa Atual (Hoje)</span>
          <span
            className={`text-sm font-bold font-mono mt-0.5 block ${
              stats.current >= 80
                ? 'text-emerald-400'
                : stats.current >= 60
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {stats.current.toFixed(1)}%
          </span>
        </div>

        {/* Métrica 2: Média Histórica */}
        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/70">
          <span className="text-slate-400 block text-[10.5px]">Média ({timeframe})</span>
          <span className="text-sm font-bold text-white font-mono mt-0.5 block">
            {stats.avg.toFixed(1)}%
          </span>
        </div>

        {/* Métrica 3: Mínimo Registrado */}
        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/70">
          <span className="text-slate-400 block text-[10.5px]">Piso Registrado (Mín)</span>
          <span className="text-sm font-bold text-amber-400 font-mono mt-0.5 block">
            {stats.min.toFixed(1)}%
          </span>
        </div>

        {/* Métrica 4: Pico Registrado */}
        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/70">
          <span className="text-slate-400 block text-[10.5px]">Pico Registrado (Máx)</span>
          <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
            {stats.max.toFixed(1)}%
          </span>
        </div>

        {/* Métrica 5: Dias Acima da Meta */}
        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/70">
          <span className="text-slate-400 block text-[10.5px]">Dias em Conformidade</span>
          <span className="text-sm font-bold text-emerald-300 font-mono mt-0.5 block">
            {stats.daysAboveTarget} / {filteredData.length} ({stats.pctDaysAboveTarget}%)
          </span>
        </div>

        {/* Métrica 6: Status da Casa */}
        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/70">
          <span className="text-slate-400 block text-[10.5px]">Status da Casa</span>
          <span
            className={`text-sm font-bold mt-0.5 flex items-center gap-1 ${
              stats.current >= 80 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {stats.current >= 80 ? 'Conformidade Alta' : 'Atenção Necessária'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
