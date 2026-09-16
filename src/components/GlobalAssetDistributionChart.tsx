import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';
import { Portfolio, ComplianceAlert, AssetClass } from '../types';

interface GlobalAssetDistributionChartProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
}

export const GlobalAssetDistributionChart: React.FC<GlobalAssetDistributionChartProps> = ({ portfolios, alerts }) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const data = useMemo(() => {
    const classStats: Record<AssetClass, { currentVal: number; targetVal: number; criticalCount: number; warningCount: number }> = {
      'Renda Fixa': { currentVal: 0, targetVal: 0, criticalCount: 0, warningCount: 0 },
      'Renda Variável': { currentVal: 0, targetVal: 0, criticalCount: 0, warningCount: 0 },
      'Internacional': { currentVal: 0, targetVal: 0, criticalCount: 0, warningCount: 0 },
      'Multimercado': { currentVal: 0, targetVal: 0, criticalCount: 0, warningCount: 0 },
      'Caixa': { currentVal: 0, targetVal: 0, criticalCount: 0, warningCount: 0 },
    };

    let totalAum = 0;

    portfolios.forEach((portfolio) => {
      const pAum = portfolio.totalAum || portfolio.assets.reduce((acc, a) => acc + a.totalValue, 0);
      totalAum += pAum;

      portfolio.assets.forEach((asset) => {
        if (classStats[asset.assetClass]) {
          classStats[asset.assetClass].currentVal += asset.totalValue;
        }
      });

      portfolio.mandateLimits.forEach((limit) => {
        if (classStats[limit.assetClass]) {
          classStats[limit.assetClass].targetVal += (limit.targetPercent / 100) * pAum;
        }
      });
    });

    alerts.forEach((alert) => {
      if (classStats[alert.assetClass]) {
        if (alert.severity === 'CRITICAL') {
          classStats[alert.assetClass].criticalCount += 1;
        } else if (alert.severity === 'WARNING') {
          classStats[alert.assetClass].warningCount += 1;
        }
      }
    });

    return Object.entries(classStats)
      .map(([name, stats]) => ({
        name,
        value: stats.currentVal,
        targetValue: stats.targetVal,
        percent: totalAum > 0 ? (stats.currentVal / totalAum) * 100 : 0,
        targetPercent: totalAum > 0 ? (stats.targetVal / totalAum) * 100 : 0,
        criticalCount: stats.criticalCount,
        warningCount: stats.warningCount,
      }))
      .filter((d) => d.value > 0 || d.targetValue > 0)
      .sort((a, b) => b.value - a.value);
  }, [portfolios, alerts]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
      <g>
        <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#fff" className="font-bold text-sm">
          {payload.name}
        </text>
        <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="#94a3b8" className="text-xs">
          {(percent * 100).toFixed(1)}%
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 10}
          outerRadius={outerRadius + 12}
          fill={fill}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
          <p className="font-bold text-white mb-2">{data.name}</p>
          <div className="space-y-1 text-xs">
            <p className="text-slate-300">
              <span className="text-slate-500">Atual:</span> {formatCurrency(data.value)} ({data.percent.toFixed(1)}%)
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">Meta:</span> {formatCurrency(data.targetValue)} ({data.targetPercent.toFixed(1)}%)
            </p>
            {data.criticalCount > 0 && (
              <p className="text-rose-400 font-semibold mt-1">🔴 {data.criticalCount} Alertas Críticos</p>
            )}
            {data.warningCount > 0 && data.criticalCount === 0 && (
              <p className="text-amber-400 font-semibold mt-1">🟡 {data.warningCount} Avisos</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const getSliceColor = (entry: any) => {
    if (entry.criticalCount > 0) return '#f43f5e'; // rose-500
    if (entry.warningCount > 0) return '#fbbf24'; // amber-400
    // Default colors based on asset class
    switch (entry.name) {
      case 'Renda Fixa': return '#3b82f6'; // blue-500
      case 'Renda Variável': return '#10b981'; // emerald-500
      case 'Multimercado': return '#8b5cf6'; // violet-500
      case 'Internacional': return '#f59e0b'; // amber-500
      case 'Caixa': return '#64748b'; // slate-500
      default: return '#cbd5e1';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">Distribuição vs Meta do Mandato</h3>
        <p className="text-xs text-slate-400 mt-1">AUM atual comparado ao alvo agregado. Fatias destacadas indicam violação de limite.</p>
      </div>
      
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              
              activeShape={renderActiveShape}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getSliceColor(entry)} 
                  className="transition-all duration-300"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              content={(props) => {
                const { payload } = props;
                return (
                  <ul className="flex flex-wrap justify-center gap-4 text-xs mt-4">
                    {payload?.map((entry: any, index: number) => {
                      const d = data.find(x => x.name === entry.value);
                      const hasAlert = d && (d.criticalCount > 0 || d.warningCount > 0);
                      return (
                        <li key={`item-${index}`} className="flex items-center gap-1.5">
                          <span 
                            className="w-3 h-3 rounded-full inline-block" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className={`${hasAlert ? 'text-white font-semibold' : 'text-slate-400'}`}>
                            {entry.value}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
