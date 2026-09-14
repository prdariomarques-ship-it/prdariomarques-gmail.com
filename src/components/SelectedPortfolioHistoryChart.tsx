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
import { Activity, Calendar, ShieldCheck, Download, Check, Briefcase } from 'lucide-react';
import { Portfolio, ComplianceAlert } from '../types';
import { generateSinglePortfolioHistory, SinglePortfolioHistorySnapshot } from '../utils/complianceHistory';

export interface SelectedPortfolioHistoryChartProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  selectedPortfolioId: string;
  onSelectPortfolio: (id: string) => void;
  className?: string;
}

export type TimeframeRange = '7D' | '15D' | '30D';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomPortfolioTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data: SinglePortfolioHistorySnapshot = payload[0].payload;
    const isTargetMet = data.complianceRate >= 100; // Para carteira individual, meta é 100%
    const isWarning = data.complianceRate >= 80 && data.complianceRate < 100;

    return (
      <div className="bg-slate-950 border border-slate-700/90 rounded-xl p-3.5 shadow-2xl text-xs space-y-2.5 z-50 pointer-events-none min-w-[200px] backdrop-blur-md">
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
                : isWarning
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}
          >
            {isTargetMet ? 'Enquadrada' : 'Desenquadrada'}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-4">
          <span className="text-slate-400 font-medium">Conformidade:</span>
          <span
            className={`text-lg font-extrabold font-mono ${
              isTargetMet
                ? 'text-emerald-400'
                : isWarning
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {data.complianceRate.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const SelectedPortfolioHistoryChart: React.FC<SelectedPortfolioHistoryChartProps> = ({
  portfolios,
  alerts,
  selectedPortfolioId,
  onSelectPortfolio,
  className = '',
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeRange>('30D');

  const selectedPortfolio = portfolios.find((p) => p.id === selectedPortfolioId) || portfolios[0];

  const fullThirtyDaysData: SinglePortfolioHistorySnapshot[] = useMemo(() => {
    if (!selectedPortfolio) return [];
    return generateSinglePortfolioHistory(selectedPortfolio, alerts);
  }, [selectedPortfolio, alerts]);

  const filteredData = useMemo(() => {
    if (timeframe === '7D') {
      return fullThirtyDaysData.slice(-7);
    }
    if (timeframe === '15D') {
      return fullThirtyDaysData.slice(-15);
    }
    return fullThirtyDaysData;
  }, [fullThirtyDaysData, timeframe]);

  const tickInterval = useMemo(() => {
    if (timeframe === '30D') return 4;
    if (timeframe === '15D') return 2;
    return 0;
  }, [timeframe]);

  if (!selectedPortfolio) return null;

  return (
    <div
      id="selected-portfolio-history-chart"
      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Evolução da Conformidade por Carteira
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhamento diário do enquadramento fiduciário da carteira selecionada.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPortfolioId}
              onChange={(e) => onSelectPortfolio(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900">
                  {p.name} ({p.clientName})
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs font-medium">
            <button
              onClick={() => setTimeframe('7D')}
              className={`px-3 py-1 rounded-md transition ${
                timeframe === '7D'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setTimeframe('15D')}
              className={`px-3 py-1 rounded-md transition ${
                timeframe === '15D'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              15D
            </button>
            <button
              onClick={() => setTimeframe('30D')}
              className={`px-3 py-1 rounded-md transition ${
                timeframe === '30D'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              30D
            </button>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={tickInterval}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}%`}
              domain={[0, 105]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip content={<CustomPortfolioTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <ReferenceLine
              y={100}
              stroke="#10b981"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
              label={{
                position: 'insideTopLeft',
                value: 'Meta: 100%',
                fill: '#10b981',
                fontSize: 10,
                opacity: 0.8,
              }}
            />
            <Line
              type="monotone"
              dataKey="complianceRate"
              stroke="#0ea5e9"
              strokeWidth={3}
              dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#38bdf8', stroke: '#0284c7', strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
