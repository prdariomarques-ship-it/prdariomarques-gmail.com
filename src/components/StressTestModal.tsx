import React, { useState, useMemo } from 'react';
import { X, Activity, AlertTriangle, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Portfolio, AssetClass } from '../types';

interface StressTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: Portfolio;
}

export const StressTestModal: React.FC<StressTestModalProps> = ({ isOpen, onClose, portfolio }) => {
  const [shocks, setShocks] = useState<Record<AssetClass, number>>({
    'Renda Fixa': 0,
    'Renda Variável': 0,
    'Internacional': 0,
    'Multimercado': 0,
    'Caixa': 0
  });

  const handleShockChange = (assetClass: AssetClass, value: number) => {
    setShocks(prev => ({ ...prev, [assetClass]: value }));
  };

  const resetShocks = () => {
    setShocks({
      'Renda Fixa': 0,
      'Renda Variável': 0,
      'Internacional': 0,
      'Multimercado': 0,
      'Caixa': 0
    });
  };

  const results = useMemo(() => {
    if (!portfolio) return null;

    let newTotalAum = 0;
    const newClassTotals: Record<string, number> = {};
    const oldClassTotals: Record<string, number> = {};

    portfolio.assets.forEach(asset => {
      const shock = shocks[asset.assetClass] || 0;
      const newValue = asset.totalValue * (1 + (shock / 100));
      
      newTotalAum += newValue;
      
      newClassTotals[asset.assetClass] = (newClassTotals[asset.assetClass] || 0) + newValue;
      oldClassTotals[asset.assetClass] = (oldClassTotals[asset.assetClass] || 0) + asset.totalValue;
    });

    const breakdown = portfolio.mandateLimits.map(limit => {
      const newVal = newClassTotals[limit.assetClass] || 0;
      const oldVal = oldClassTotals[limit.assetClass] || 0;
      
      const newPct = newTotalAum > 0 ? (newVal / newTotalAum) * 100 : 0;
      const oldPct = portfolio.totalAum > 0 ? (oldVal / portfolio.totalAum) * 100 : 0;
      
      let status: 'OK' | 'BREACH' = 'OK';
      let breachMsg = '';
      if (newPct > limit.maxPercent) {
        status = 'BREACH';
        breachMsg = `Acima do teto (${limit.maxPercent}%)`;
      } else if (newPct < limit.minPercent) {
        status = 'BREACH';
        breachMsg = `Abaixo do piso (${limit.minPercent}%)`;
      }

      return {
        assetClass: limit.assetClass,
        oldPct,
        newPct,
        status,
        breachMsg,
        min: limit.minPercent,
        max: limit.maxPercent,
        target: limit.targetPercent
      };
    });

    const isBreached = breakdown.some(b => b.status === 'BREACH');

    return {
      oldTotalAum: portfolio.totalAum,
      newTotalAum,
      aumChange: newTotalAum - portfolio.totalAum,
      aumChangePct: portfolio.totalAum > 0 ? ((newTotalAum - portfolio.totalAum) / portfolio.totalAum) * 100 : 0,
      breakdown,
      isBreached
    };

  }, [portfolio, shocks]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Stress Test CVM 175</h2>
              <p className="text-xs text-slate-400">Simule choques de mercado e verifique o enquadramento do portfólio</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Controls Panel */}
          <div className="md:col-span-1 space-y-5 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Cenários de Choque</h3>
              <button onClick={resetShocks} className="text-xs text-indigo-400 hover:text-indigo-300">Zerar</button>
            </div>
            
            <div className="space-y-4">
              {(Object.keys(shocks) as AssetClass[]).filter(c => c !== 'Caixa').map(ac => (
                <div key={ac}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">{ac}</span>
                    <span className={`font-mono font-semibold ${shocks[ac] < 0 ? 'text-rose-400' : shocks[ac] > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {shocks[ac] > 0 ? '+' : ''}{shocks[ac]}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="-50" 
                    max="50" 
                    step="1"
                    value={shocks[ac]}
                    onChange={(e) => handleShockChange(ac, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>-50%</span>
                    <span>0%</span>
                    <span>+50%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-slate-800">
              <button onClick={() => {
                setShocks({ 'Renda Fixa': 2, 'Renda Variável': -20, 'Internacional': -15, 'Multimercado': -5, 'Caixa': 0 })
              }} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded border border-slate-700 transition">
                Aplicar Cenário "Crise Global"
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Top Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Impacto no AUM</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${results?.aumChangePct && results.aumChangePct < 0 ? 'text-rose-400' : results?.aumChangePct && results.aumChangePct > 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {results?.aumChangePct! > 0 ? '+' : ''}{results?.aumChangePct?.toFixed(2)}%
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Novo AUM: R$ {results?.newTotalAum?.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </div>
              </div>
              
              <div className={`p-4 rounded-xl border ${results?.isBreached ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                <span className="text-xs text-slate-400 block mb-1">Status CVM 175 (Pós-Choque)</span>
                <div className="flex items-center gap-2 mt-1">
                  {results?.isBreached ? (
                    <>
                      <AlertTriangle className="w-6 h-6 text-rose-400" />
                      <span className="text-lg font-bold text-rose-400">Desenquadrado</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      <span className="text-lg font-bold text-emerald-400">Enquadrado</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Breakdown Table */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Repercussão na Alocação (Efeito Passivo)</h3>
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/80 text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Classe</th>
                      <th className="py-2.5 px-3 text-right">Alocação Atual</th>
                      <th className="py-2.5 px-3 text-right">Alocação Pós-Choque</th>
                      <th className="py-2.5 px-3 text-right">Limites (IPS)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {results?.breakdown.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-medium text-slate-200">{row.assetClass}</td>
                        <td className="py-3 px-3 text-right text-slate-400">{row.oldPct.toFixed(1)}%</td>
                        <td className={`py-3 px-3 text-right font-bold ${row.status === 'BREACH' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {row.newPct.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500 text-[10px]">
                          [{row.min}% - {row.max}%]
                        </td>
                        <td className="py-3 px-3 text-center">
                          {row.status === 'BREACH' ? (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              {row.breachMsg}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
