const fs = require('fs');
let code = fs.readFileSync('src/components/common/AssetPerformancePanel.tsx', 'utf-8');

const importRecharts = `import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';\nimport { useMemo } from 'react';`;
code = code.replace("import React from 'react';", "import React from 'react';\n" + importRecharts);

const mockService = `
// Mock History Service
const useMockHistory = (assetName: string, targetReturn12m?: number) => {
  return useMemo(() => {
    if (targetReturn12m === undefined) return null;
    
    const months = 36;
    const data = [];
    const now = new Date();
    
    let currentValue = 100;
    const targetEnd = 100 * (1 + targetReturn12m / 100);
    const monthlyDrift = (targetEnd - 100) / 12; // Distribute the 12m return over a year, roughly applying to the whole curve
    
    let seed = 0;
    for(let i = 0; i < assetName.length; i++) {
      seed += assetName.charCodeAt(i);
    }
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    }

    // Generate forwards from past to present
    for (let i = months; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const noise = (random() - 0.5) * (Math.abs(monthlyDrift) > 0 ? Math.abs(monthlyDrift) * 3 : 2); 
      
      data.push({
        date: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        value: Number(currentValue.toFixed(2)),
        // A reference index (e.g., CDI or benchmark) for comparison
        benchmark: Number((100 + ((months - i) * 0.8)).toFixed(2)) 
      });
      
      currentValue += (monthlyDrift + noise);
    }
    
    return data;
  }, [assetName, targetReturn12m]);
};
`;

code = code.replace("export const AssetPerformancePanel", mockService + "\nexport const AssetPerformancePanel");

const newContent = `
  const historyData = useMockHistory(asset.name, asset.historicalPerformance?.twelveMonths);
  const isPositive = asset.historicalPerformance?.twelveMonths !== undefined && asset.historicalPerformance.twelveMonths >= 0;
  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const fillColor = isPositive ? '#10b981' : '#f43f5e';

  return (
    <div className="p-4 border-l-2 border-emerald-500/50 m-2 rounded-r-lg bg-slate-950/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Performance Histórica - {asset.ticker}
          </h4>
        </div>
      </div>
      
      {!asset.historicalPerformance ? (
        <div className="flex items-center justify-center space-x-2 text-slate-400 text-xs italic bg-slate-900/50 p-8 rounded-lg border border-white/5 mb-3 h-48">
          <AlertCircle className="w-5 h-5 text-slate-500" />
          <span>Historical data not available (dados privados, não fornecidos ou sem cotação pública).</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
            {[
              { label: 'Diário', val: asset.historicalPerformance.daily },
              { label: 'Mensal', val: asset.historicalPerformance.monthly },
              { label: 'Semestral', val: asset.historicalPerformance.sixMonths },
              { label: 'No Ano (YTD)', val: asset.historicalPerformance.ytd },
              { label: '12 Meses', val: asset.historicalPerformance.twelveMonths },
              { label: '24 Meses', val: asset.historicalPerformance.twentyFourMonths },
              { label: '36 Meses', val: asset.historicalPerformance.thirtySixMonths },
              { label: 'Desde Início', val: asset.historicalPerformance.inception }
            ].map((window, idx) => (
              <div key={idx} className="bg-slate-900 border border-white/10 p-2 rounded flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 text-center">{window.label}</span>
                {window.val !== undefined ? (
                  <span className={\`text-xs font-mono font-bold \${window.val >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
                    {window.val > 0 ? '+' : ''}{window.val.toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-xs text-slate-600 font-mono">N/D</span>
                )}
              </div>
            ))}
          </div>

          <div className="h-56 w-full bg-slate-900/50 border border-white/5 rounded-xl p-4 mb-4">
            <h5 className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-4">Tendência 36 Meses (Cota Normalizada base 100)</h5>
            {historyData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={fillColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={fillColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    minTickGap={20}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="Ativo (Cota)"
                    stroke={strokeColor} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="benchmark" 
                    name="Benchmark Ref"
                    stroke="#64748b" 
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fill="none" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
               <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs italic">
                 Dados insuficientes para plotagem.
               </div>
            )}
          </div>
        </>
      )}
      
      <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
        {asset.cnpj && <span>CNPJ: {asset.cnpj}</span>}
        {asset.productType && <span className="uppercase">TIPO: {asset.productType.replace('_', ' ')}</span>}
        {asset.isTaxExempt !== undefined && <span>IR: {asset.isTaxExempt ? 'ISENTO' : 'TRIBUTADO'}</span>}
      </div>
    </div>
  );`;

// Replace the return block
code = code.replace(/return \([\s\S]*\);/, newContent);

fs.writeFileSync('src/components/common/AssetPerformancePanel.tsx', code);
console.log('patched asset panel');
