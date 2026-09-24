import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, Target, Flame, CheckCircle2, TrendingDown } from 'lucide-react';
import { Asset } from '../../types';
import { AssetDriftTrendBadge } from './AssetDriftTrendBadge';
import { getAssetStrategicTarget } from '../../utils/assetDrift';

interface AssetPerformancePanelProps {
  asset: Asset;
}

export const AssetPerformancePanel: React.FC<AssetPerformancePanelProps> = ({ asset }) => {
  const isPositive = asset.historicalPerformance?.twelveMonths !== undefined && asset.historicalPerformance.twelveMonths >= 0;
  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const fillColor = isPositive ? '#10b981' : '#f43f5e';

  const targetPercent = getAssetStrategicTarget(asset);
  const diff = Number((asset.allocationPercent - targetPercent).toFixed(2));
  const absDiff = Math.abs(diff);
  const isDrift = absDiff > 2.5;

  return (
    <div className="p-4 border-l-2 border-emerald-500/50 m-2 rounded-r-lg bg-slate-950/40 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Performance &amp; Diagnóstico Tático - {asset.ticker} ({asset.name})
          </h4>
        </div>

        <AssetDriftTrendBadge
          currentPercent={asset.allocationPercent}
          targetPercent={targetPercent}
          tolerancePP={2.5}
          size="md"
        />
      </div>

      {/* Asset Drift Diagnostic Box */}
      <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDrift
          ? diff > 0
            ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
            : 'bg-cyan-950/20 border-cyan-500/40 text-cyan-200'
          : 'bg-slate-900/60 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
            {diff > 0.05 ? (
              <TrendingUp className="w-4 h-4 text-amber-400" />
            ) : diff < -0.05 ? (
              <TrendingDown className="w-4 h-4 text-cyan-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-2">
              <span>Alocação Atual: <strong className="text-white font-mono">{asset.allocationPercent.toFixed(2)}%</strong></span>
              <span className="text-slate-500">•</span>
              <span>Meta IPS: <strong className="text-indigo-300 font-mono">{targetPercent.toFixed(2)}%</strong></span>
              <span className="text-slate-500">•</span>
              <span>Desvio: <strong className={`font-mono ${diff > 0 ? 'text-amber-300' : diff < 0 ? 'text-cyan-300' : 'text-emerald-300'}`}>{diff > 0 ? `+${diff.toFixed(2)}` : `${diff.toFixed(2)}`} p.p.</strong></span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isDrift
                ? diff > 0
                  ? 'Ativo sobre-alocado além da margem de 2.5% p.p. Sugerida realização ou corte tático preventivo antes do teto crítico regulatório.'
                  : 'Ativo sub-alocado além da margem de 2.5% p.p. Sugerido aporte para recomposição da meta estratégica.'
                : 'Alocação equilibrada dentro do corredor de tolerância tática de ±2.5% p.p.'}
            </p>
          </div>
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
