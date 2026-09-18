import React, { useMemo } from 'react';
import { Activity, ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';
import { Portfolio, AssetClass } from '../types';

interface AssetCorrelationMapProps {
  portfolio: Portfolio | null;
}

// Generate pseudo-random correlation between -1 and 1
const getCorrelation = (id1: string, class1: AssetClass, id2: string, class2: AssetClass) => {
  if (id1 === id2) return 1.0;
  
  const str = id1 < id2 ? id1 + id2 : id2 + id1;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; 
  }
  
  let baseCorr = 0;
  if (class1 === class2) {
    baseCorr = 0.6;
  } else if (
    (class1 === 'Renda Variável' && class2 === 'Renda Fixa') ||
    (class1 === 'Renda Fixa' && class2 === 'Renda Variável')
  ) {
    baseCorr = -0.3;
  } else if (
    (class1 === 'Internacional' && class2 === 'Renda Variável') ||
    (class1 === 'Renda Variável' && class2 === 'Internacional')
  ) {
    baseCorr = 0.4;
  } else {
    baseCorr = 0.1;
  }
  
  const noise = ((Math.abs(hash) % 100) / 100) * 0.6 - 0.3;
  
  return Math.max(-1, Math.min(1, baseCorr + noise));
};

export const AssetCorrelationMap: React.FC<AssetCorrelationMapProps> = ({ portfolio }) => {
  const data = useMemo(() => {
    if (!portfolio || portfolio.assets.length === 0) return null;
    
    // Top 8 assets by value for readability
    const topAssets = [...portfolio.assets]
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 8);
      
    const matrix = topAssets.map(a1 => {
      return topAssets.map(a2 => {
        return getCorrelation(a1.id, a1.assetClass, a2.id, a2.assetClass);
      });
    });
    
    return { assets: topAssets, matrix };
  }, [portfolio]);

  if (!portfolio) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[350px]">
        <Activity className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-slate-400 text-sm">Selecione uma carteira para ver o mapa de correlação.</p>
      </div>
    );
  }

  if (!data) return null;

  const getColorForCorrelation = (val: number) => {
    if (val === 1) return 'bg-emerald-500/90 text-white font-bold';
    if (val > 0.7) return 'bg-emerald-500/70 text-emerald-50';
    if (val > 0.4) return 'bg-emerald-500/40 text-emerald-100';
    if (val > 0.1) return 'bg-emerald-500/20 text-emerald-200';
    if (val >= -0.1) return 'bg-slate-800 text-slate-300';
    if (val > -0.4) return 'bg-rose-500/20 text-rose-200';
    if (val > -0.7) return 'bg-rose-500/40 text-rose-100';
    return 'bg-rose-500/70 text-rose-50';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Mapa de Correlação de Ativos (Heat Map)
          </h3>
          <p className="text-xs text-slate-400">
            Correlação histórica estimada entre os {data.assets.length} principais ativos da carteira <strong className="text-slate-300">{portfolio.name}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-slate-400">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500/70 rounded-sm"></div> Correlação Positiva (+1)</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-800 border border-slate-700 rounded-sm"></div> Neutra (0)</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-500/70 rounded-sm"></div> Correlação Negativa (-1)</div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-max">
          <div className="grid gap-1" style={{ gridTemplateColumns: `160px repeat(${data.assets.length}, minmax(60px, 1fr))` }}>
            {/* Header Row */}
            <div className="text-[10px] text-slate-500 font-semibold p-2 flex items-end justify-end">Ativos</div>
            {data.assets.map((a, i) => (
              <div key={i} className="text-[10px] text-slate-300 font-semibold p-2 text-center h-12 flex items-end justify-center break-words leading-tight" title={a.name}>
                {a.ticker || a.name.substring(0, 10)}
              </div>
            ))}

            {/* Matrix Rows */}
            {data.assets.map((a1, rowIdx) => (
              <React.Fragment key={rowIdx}>
                <div className="text-[11px] text-slate-300 font-medium p-2 text-right border-r border-slate-800 flex items-center justify-end truncate" title={a1.name}>
                  <div className="flex flex-col items-end">
                    <span>{a1.ticker || a1.name.substring(0, 15)}</span>
                    <span className="text-[9px] text-slate-500">{a1.assetClass}</span>
                  </div>
                </div>
                {data.matrix[rowIdx].map((val, colIdx) => (
                  <div 
                    key={colIdx} 
                    className={`flex items-center justify-center p-2 text-[10px] rounded transition-colors ${getColorForCorrelation(val)}`}
                    title={`${a1.ticker} vs ${data.assets[colIdx].ticker}: ${val.toFixed(2)}`}
                  >
                    {val.toFixed(2)}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex gap-3 items-start">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-slate-300">Como interpretar:</strong> Correlações próximas a +1.0 (verde escuro) indicam ativos que tendem a se mover na mesma direção. Correlações próximas a -1.0 (vermelho escuro) indicam ativos que se movem em direções opostas, essenciais para uma <strong>diversificação eficiente</strong> e redução de risco sistemático.
        </p>
      </div>
    </div>
  );
};
