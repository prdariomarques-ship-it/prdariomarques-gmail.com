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
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Download,
  Calendar,
  Activity,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Portfolio, ComplianceAlert, AlertComplianceSnapshot } from '../types';

interface ThirtyDayComplianceHistoryChartProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  snapshots: AlertComplianceSnapshot[];
  onExportReport?: () => void;
}

export const ThirtyDayComplianceHistoryChart: React.FC<ThirtyDayComplianceHistoryChartProps> = ({
  portfolios,
  alerts,
  snapshots,
  onExportReport,
}) => {
  const [timeRange, setTimeRange] = useState<'7D' | '15D' | '30D'>('30D');
  const [metricView, setMetricView] = useState<'SCORE' | 'ALL'>('SCORE');

  // Filtra dados com base no período selecionado
  const filteredData = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];
    if (timeRange === '7D') return snapshots.slice(-7);
    if (timeRange === '15D') return snapshots.slice(-15);
    return snapshots;
  }, [snapshots, timeRange]);

  // Estatísticas do período
  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        current: 0,
        initial: 0,
        min: 0,
        max: 0,
        delta: 0,
        isPositive: true,
        avgScore: 0,
      };
    }

    const scores = filteredData.map((d) => d.complianceRate);
    const initial = scores[0];
    const current = scores[scores.length - 1];
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const delta = Number((current - initial).toFixed(1));
    const isPositive = delta >= 0;
    const avgScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));

    return {
      current,
      initial,
      min,
      max,
      delta,
      isPositive,
      avgScore,
    };
  }, [filteredData]);

  // Meta regulatória mínima de compliance
  const complianceTarget = 85;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl animate-fadeIn">
      {/* Cabeçalho do Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Evolução Histórica do Compliance Score</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Últimos 30 Dias • CVM 175
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Acompanhamento temporal da aderência aos mandatos e mitigação de risco de desenquadramento da frota de carteiras.
              </p>
            </div>
          </div>
        </div>

        {/* Controles: Filtro de Janela e Exportação */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Seletor de Período */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['7D', '15D', '30D'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range === '7D' ? '7 Dias' : range === '15D' ? '15 Dias' : '30 Dias'}
              </button>
            ))}
          </div>

          {/* Botão de Exportação CSV */}
          {onExportReport && (
            <button
              onClick={onExportReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer shadow-xs"
              title="Exportar série temporal de 30 dias em formato CSV auditável"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Score Atual</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-white font-mono">{stats.current}%</span>
            <span
              className={`inline-flex items-center text-xs font-bold ${
                stats.isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {stats.isPositive ? (
                <TrendingUp className="w-3 h-3 mr-0.5" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-0.5" />
              )}
              {stats.delta > 0 ? `+${stats.delta}%` : `${stats.delta}%`}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">vs início da janela ({stats.initial}%)</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Média da Janela</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1.5">{stats.avgScore}%</div>
          <span className="text-[10px] text-slate-500 block mt-1">Meta prudencial: {complianceTarget}%</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Mínima Registrada</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1.5">{stats.min}%</div>
          <span className="text-[10px] text-slate-500 block mt-1">Ponto de maior estresse</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Máxima Atingida</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1.5">{stats.max}%</div>
          <span className="text-[10px] text-slate-500 block mt-1">Pico de conformidade da frota</span>
        </div>
      </div>

      {/* Gráfico Recharts */}
      <div className="relative pt-2">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 12, right: 16, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="scoreGlowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="dayLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              <YAxis
                domain={[50, 100]}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val) => `${val}%`}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as AlertComplianceSnapshot;
                    return (
                      <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs min-w-56 space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            {data.fullDate}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              data.complianceRate >= complianceTarget
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            Score: {data.complianceRate}%
                          </span>
                        </div>

                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex justify-between text-slate-300">
                            <span className="text-slate-400">Carteiras Conformes:</span>
                            <span className="font-bold text-emerald-400">
                              {data.compliantPortfolios} / {data.totalPortfolios}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span className="text-slate-400">Alertas Críticos:</span>
                            <span className="font-bold text-rose-400">{data.criticalAlerts}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span className="text-slate-400">Alertas de Atenção:</span>
                            <span className="font-bold text-amber-400">{data.warningAlerts}</span>
                          </div>
                          {data.totalExcessBRL > 0 && (
                            <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800/80">
                              <span className="text-slate-400">Capital a Rebalancear:</span>
                              <span className="font-bold text-amber-300">
                                {data.totalExcessBRL.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {data.marketContext && (
                          <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 leading-tight">
                            <span className="text-cyan-400 font-semibold">Evento: </span>
                            {data.marketContext}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Linha de Meta Regulatória */}
              <ReferenceLine
                y={complianceTarget}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: `Meta: ${complianceTarget}%`,
                  position: 'insideTopLeft',
                  fill: '#f59e0b',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />

              {/* Linha Principal de Compliance Score */}
              <Line
                type="monotone"
                dataKey="complianceRate"
                name="Compliance Score (%)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{
                  r: 3,
                  fill: '#059669',
                  stroke: '#10b981',
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 6,
                  fill: '#34d399',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda e Notas de Rodapé */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-[11px] text-slate-400 border-t border-slate-800/60 mt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-500 rounded-full" />
              <span className="text-slate-300 font-medium">Compliance Score Frota (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 border-b border-dashed border-amber-500" />
              <span className="text-slate-400">Meta Prudencial ({complianceTarget}%)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Calculado automaticamente via Sentinel e matrizes de suitability da CVM 175</span>
          </div>
        </div>
      </div>
    </div>
  );
};
