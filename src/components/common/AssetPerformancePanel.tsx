import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Asset } from '../../types';

interface AssetPerformancePanelProps {
  asset: Asset;
}




export const AssetPerformancePanel: React.FC<AssetPerformancePanelProps> = ({ asset }) => {
  

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
                  <span className={`text-xs font-mono font-bold ${window.val >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs italic flex-col gap-2">
                 <AlertCircle className="w-5 h-5 opacity-50" />
                 <span>Dados da série histórica mensal (cotas) não disponíveis para plotagem.</span>
               </div>
          </div>
        </>
      )}
      
      <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
        {asset.cnpj && <span>CNPJ: {asset.cnpj}</span>}
        {asset.productType && <span className="uppercase">TIPO: {asset.productType.replace('_', ' ')}</span>}
        {asset.isTaxExempt !== undefined && <span>IR: {asset.isTaxExempt ? 'ISENTO' : 'TRIBUTADO'}</span>}
      </div>
    </div>
  );
};
