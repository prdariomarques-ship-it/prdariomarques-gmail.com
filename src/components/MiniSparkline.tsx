import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  YAxis,
  XAxis,
} from 'recharts';

interface DataPoint {
  label: string;
  value: number;
}

interface MiniSparklineProps {
  data: DataPoint[];
  color: 'emerald' | 'amber' | 'cyan' | 'indigo' | 'rose';
  valuePrefix?: string;
  valueSuffix?: string;
  growthLabel?: string;
  trendTitle?: string;
  height?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: DataPoint;
  }>;
  valuePrefix?: string;
  valueSuffix?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  valuePrefix = '',
  valueSuffix = '',
}) => {
  if (active && payload && payload.length) {
    const current = payload[0].payload;
    return (
      <div className="bg-slate-950/95 backdrop-blur-sm border border-slate-700 px-2.5 py-1 rounded-md shadow-2xl text-[10px] pointer-events-none z-50">
        <span className="text-slate-400 font-medium">{current.label}: </span>
        <span className="font-bold text-white font-mono">
          {valuePrefix}
          {current.value.toLocaleString('pt-BR')}
          {valueSuffix}
        </span>
      </div>
    );
  }
  return null;
};

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  color,
  valuePrefix = '',
  valueSuffix = '',
  growthLabel,
  trendTitle = 'Evolução Trimestral (3M)',
  height = 46,
}) => {
  const instanceId = React.useId ? React.useId().replace(/:/g, '') : 'spark';

  if (!data || data.length < 2) return null;

  const colorMap = {
    emerald: {
      stroke: '#10b981',
      gradientStart: '#10b981',
      gradientEnd: '#10b981',
      text: 'text-emerald-400',
    },
    amber: {
      stroke: '#f59e0b',
      gradientStart: '#f59e0b',
      gradientEnd: '#f59e0b',
      text: 'text-amber-400',
    },
    cyan: {
      stroke: '#06b6d4',
      gradientStart: '#06b6d4',
      gradientEnd: '#06b6d4',
      text: 'text-cyan-400',
    },
    indigo: {
      stroke: '#818cf8',
      gradientStart: '#818cf8',
      gradientEnd: '#818cf8',
      text: 'text-indigo-300',
    },
    rose: {
      stroke: '#f43f5e',
      gradientStart: '#f43f5e',
      gradientEnd: '#f43f5e',
      text: 'text-rose-400',
    },
  };

  const theme = colorMap[color];
  const gradientId = `recharts-sparkline-grad-${color}-${instanceId}`;

  // Domain computation with breathing room for the curve
  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const diff = maxVal - minVal;
  const padding = diff === 0 ? (minVal === 0 ? 1 : minVal * 0.1) : diff * 0.22;
  const yDomain: [number, number] = [Math.max(0, minVal - padding), maxVal + padding];

  // Dynamic growth calculation across the quarter
  const firstVal = data[0].value;
  const lastVal = data[data.length - 1].value;
  const pctDelta = firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0;
  const autoGrowthLabel = `${pctDelta >= 0 ? '+' : ''}${pctDelta.toFixed(1)}% no tri`;
  const displayGrowth = growthLabel || autoGrowthLabel;

  return (
    <div className="w-full pt-0.5 min-w-0">
      {/* Header with Title and Growth */}
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-slate-400 font-medium flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${color === 'emerald' ? 'bg-emerald-400 shadow-emerald-500/50' : color === 'amber' ? 'bg-amber-400 shadow-amber-500/50' : color === 'cyan' ? 'bg-cyan-400 shadow-cyan-500/50' : 'bg-indigo-400 shadow-indigo-500/50'}`} />
          {trendTitle}
        </span>
        <span className={`font-extrabold font-mono text-[11px] ${theme.text}`}>
          {displayGrowth}
        </span>
      </div>

      {/* Recharts Container */}
      <div style={{ width: '100%', height, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.gradientStart} stopOpacity={0.45} />
                <stop offset="100%" stopColor={theme.gradientEnd} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis domain={yDomain} hide />
            <Tooltip
              content={
                <CustomTooltip
                  valuePrefix={valuePrefix}
                  valueSuffix={valueSuffix}
                />
              }
              cursor={{
                stroke: theme.stroke,
                strokeWidth: 1.5,
                strokeDasharray: '3 3',
                opacity: 0.6,
              }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={theme.stroke}
              strokeWidth={2.2}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              activeDot={{
                r: 4.5,
                fill: '#ffffff',
                stroke: theme.stroke,
                strokeWidth: 2.5,
              }}
              isAnimationActive={true}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer labels: Quarter timeframe endpoints */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
        <span className="font-mono text-[10px]">
          {data[0].label}: <strong className="text-slate-400">{valuePrefix}{data[0].value}{valueSuffix}</strong>
        </span>
        <span className="text-[9px] text-slate-500/80 uppercase tracking-wider font-semibold">
          Recharts • 3M
        </span>
        <span className="font-mono text-[10px] text-slate-300 font-medium">
          {data[data.length - 1].label}: <strong className="text-white">{valuePrefix}{data[data.length - 1].value}{valueSuffix}</strong>
        </span>
      </div>
    </div>
  );
};
