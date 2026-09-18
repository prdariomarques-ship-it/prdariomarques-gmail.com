import React from 'react';
import { Activity } from 'lucide-react';
import { Portfolio } from '../types';

interface PortfolioHealthProps {
  portfolio: Portfolio;
}

export const PortfolioHealth: React.FC<PortfolioHealthProps> = ({ portfolio }) => {
  // Helper to calculate actual totals by class
  const classTotals: Record<string, number> = {
    'Renda Fixa': 0,
    'Renda Variável': 0,
    'Internacional': 0,
    'Multimercado': 0,
    'Caixa': 0,
  };

  for (const a of portfolio.assets) {
    if (classTotals[a.assetClass] !== undefined) {
      classTotals[a.assetClass] += a.totalValue;
    }
  }

  const totalVal = portfolio.assets.reduce((s, a) => s + a.totalValue, 0);

  // Calculando Saúde da Carteira (Aderência ao Mandato)
  let totalMisallocation = 0;
  if (totalVal > 0) {
    portfolio.mandateLimits.forEach((limit) => {
      const actualVal = classTotals[limit.assetClass] || 0;
      const actualPct = (actualVal / totalVal) * 100;
      const target = limit.targetPercent;
      totalMisallocation += Math.abs(actualPct - target);
    });
  }

  // totalMisallocation count is doubled (e.g. +10% in one means -10% in another)
  const actualMisallocatedPct = totalMisallocation / 2;
  const healthScore = Math.max(0, 100 - actualMisallocatedPct);

  const healthColor =
    portfolio.status === 'CRITICAL' ? 'bg-rose-500' :
    portfolio.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Saúde da Carteira (Aderência ao Mandato)
            </h3>
            <span className="text-sm font-bold text-white">{healthScore.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${healthColor}`}
              style={{ width: `${healthScore}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {actualMisallocatedPct > 0.1
              ? `Aproximadamente ${actualMisallocatedPct.toFixed(1)}% do patrimônio encontra-se distante da alocação ideal (Target).`
              : 'A carteira está perfeitamente alocada de acordo com as metas estipuladas no mandato.'}
          </p>
        </div>
      </div>
    </div>
  );
};
