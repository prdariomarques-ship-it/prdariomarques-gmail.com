import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from 'recharts';
import { Shield, Activity, BarChart3, Info } from 'lucide-react';
import { Portfolio } from '../types';

interface RiskAnalyticsProps {
  portfolio: Portfolio;
}

export const RiskAnalytics: React.FC<RiskAnalyticsProps> = ({ portfolio }) => {
  // Generate deterministic mock historical data based on portfolio ID to show volatility
  const volatilityData = useMemo(() => {
    const data = [];
    const baseVal = portfolio.totalAum;
    const isConservative = portfolio.profile === 'Conservador';
    const isAggressive = portfolio.profile === 'Arrojado' || portfolio.profile === 'Agressivo';
    
    let currentVal = baseVal * 0.95; // start 12 months ago at 95%
    const seed = portfolio.id.charCodeAt(0) || 1;
    
    for (let i = 12; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const monthStr = month.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      // deterministic random walk
      const volatilityMult = isAggressive ? 0.05 : isConservative ? 0.01 : 0.03;
      const change = (Math.sin(i * seed) * volatilityMult);
      currentVal = currentVal * (1 + change);
      
      // Also calculate benchmark (CDI) which is smooth
      const cdiReturn = 0.0103; // approx 1.03% a.m. (~13,15% a.a.)
      const benchmarkVal = baseVal * 0.95 * Math.pow(1 + cdiReturn, 12 - i);

      data.push({
        date: monthStr,
        portfolio: currentVal,
        benchmark: benchmarkVal,
      });
    }
    return data;
  }, [portfolio.id, portfolio.totalAum, portfolio.profile]);

  // Derive Risk Metrics deterministically based on profile
  const riskMetrics = useMemo(() => {
    const isAggressive = portfolio.profile === 'Arrojado' || portfolio.profile === 'Agressivo';
    const isConservative = portfolio.profile === 'Conservador';

    const beta = isAggressive ? 1.25 : isConservative ? 0.45 : 0.85;
    const sharpe = isAggressive ? 1.1 : isConservative ? 0.6 : 0.9;
    const volatility = isAggressive ? 18.5 : isConservative ? 4.2 : 9.5;
    const var95 = isAggressive ? 4.5 : isConservative ? 0.8 : 2.1;

    return { beta, sharpe, volatility, var95 };
  }, [portfolio.profile]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">Risk Analytics & Volatilidade</h3>
        </div>
        <div className="text-xs text-slate-300 font-medium bg-slate-900 px-2 py-1 rounded border border-slate-700 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          Modelo de Risco Quantitativo
        </div>
      </div>
      
      <div className="p-5 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Metrics Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-300 font-medium">Beta (vs IBOV)</span>
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <strong className="text-2xl font-bold text-white">{riskMetrics.beta.toFixed(2)}</strong>
              <span className="text-xs text-slate-300 font-medium">{riskMetrics.beta > 1 ? 'Mais Volátil' : 'Defensivo'}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-300 font-medium">Índice Sharpe</span>
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <strong className="text-2xl font-bold text-white">{riskMetrics.sharpe.toFixed(2)}</strong>
              <span className="text-xs text-slate-300 font-medium">Prêmio por Risco</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[11px] text-slate-300 font-medium block mb-1">Volatilidade (a.a)</span>
              <strong className="text-lg font-bold text-white">{riskMetrics.volatility}%</strong>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[11px] text-slate-300 font-medium block mb-1">VaR (95% 1M)</span>
              <strong className="text-lg font-bold text-rose-400">{riskMetrics.var95}%</strong>
            </div>
          </div>
        </div>

        {/* Volatility Chart */}
        <div className="lg:col-span-2 flex flex-col">
          <h4 className="text-xs font-semibold text-slate-200 mb-4">Evolução Patrimonial vs Benchmark (12M)</h4>
          <div className="flex-1 min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volatilityData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" 
                  tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 500 }}
                  tickLine={false} 
                  axisLine={{ stroke: '#475569' }} 
                />
                <YAxis 
                  stroke="#475569" 
                  tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#475569' }}
                  tickFormatter={(val) => `R$${(val / 1000000).toFixed(1)}M`}
                  width={65}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#090F1D', borderColor: '#334155', fontSize: '12px', borderRadius: '8px' }}
                  itemStyle={{ color: '#F8FAFC' }}
                  labelStyle={{ color: '#CBD5E1', fontWeight: 600, marginBottom: '4px' }}
                  formatter={(value: number) => `R$ ${(value / 1000000).toFixed(2)}M`}
                />
                <Area 
                  type="monotone" 
                  dataKey="portfolio" 
                  name="Carteira" 
                  stroke="#818cf8" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPortfolio)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="benchmark" 
                  name="CDI (Benchmark)" 
                  stroke="#94A3B8" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
