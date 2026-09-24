import React, { useMemo } from 'react';
import { Droplet, ShieldCheck, AlertCircle, ArrowUpRight, Gauge } from 'lucide-react';
import { Portfolio } from '../types';

interface ImmediateLiquidityIndexCardProps {
  portfolios: Portfolio[];
  onSelectPortfolio?: (portfolioId: string) => void;
  onStartRebalance?: (portfolioId: string) => void;
}

export const ImmediateLiquidityIndexCard: React.FC<ImmediateLiquidityIndexCardProps> = ({
  portfolios,
  onSelectPortfolio,
  onStartRebalance,
}) => {
  // Cálculo do Índice Consolidado de Liquidez Imediata (D+0 / D+1)
  const liquidityStats = useMemo(() => {
    let totalAum = 0;
    let totalImmediateLiquidity = 0;

    const breakdownByPortfolio = portfolios.map((p) => {
      const portAum = p.totalAum || 0;
      totalAum += portAum;

      // Caixa e ativos pós-fixados CDI/Selic ou de liquidez imediata
      const cashAssets = p.assets.filter(
        (a) =>
          a.assetClass === 'Caixa' ||
          a.sector?.toLowerCase().includes('cdi') ||
          a.name.toLowerCase().includes('selic') ||
          a.name.toLowerCase().includes('compromissada') ||
          a.ticker.toLowerCase().includes('cdi')
      );

      const portLiquidity = (p.cashBalance || 0) + cashAssets.reduce((sum, a) => sum + (a.totalValue || 0), 0);
      totalImmediateLiquidity += portLiquidity;

      const liquidityRatio = portAum > 0 ? (portLiquidity / portAum) * 100 : 0;
      const isAdequate = liquidityRatio >= 5.0; // Recomendação regulatória CVM 175 (mínimo 5%)

      return {
        id: p.id,
        name: p.name,
        code: p.code,
        aum: portAum,
        liquidityValue: portLiquidity,
        liquidityRatio,
        isAdequate,
      };
    });

    const consolidatedRatio = totalAum > 0 ? (totalImmediateLiquidity / totalAum) * 100 : 0;
    const portfoliosNeedingLiquidity = breakdownByPortfolio.filter((p) => !p.isAdequate);

    return {
      totalAum,
      totalImmediateLiquidity,
      consolidatedRatio,
      breakdownByPortfolio,
      portfoliosNeedingLiquidity,
    };
  }, [portfolios]);

  const targetMinimumPercent = 5.0;
  const isHealthy = liquidityStats.consolidatedRatio >= targetMinimumPercent;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Índice de Liquidez Imediata (D+0)</h3>
              <p className="text-[11px] text-slate-400">Caixa, CDI e Reservas Operacionais CVM 175</p>
            </div>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              isHealthy
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {isHealthy ? 'Índice Conforme' : 'Liquidez Baixa'}
          </span>
        </div>

        {/* Big Metric Display */}
        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block mb-0.5">Índice Consolidado</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{liquidityStats.consolidatedRatio.toFixed(1)}%</span>
              <span className="text-xs text-slate-400">do AUM</span>
            </div>
            <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${isHealthy ? 'bg-cyan-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, (liquidityStats.consolidatedRatio / 15) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block mb-0.5">Volume Disponível</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-400">
                R$ {(liquidityStats.totalImmediateLiquidity / 1_000_000).toFixed(2)}M
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1.5">Mínimo sugerido: 5,0%</span>
          </div>
        </div>

        {/* Portfolio Breakdown List */}
        <div className="space-y-2 mt-3">
          <span className="text-xs font-medium text-slate-400 block">Monitoramento por Carteira:</span>
          {liquidityStats.breakdownByPortfolio.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/40 transition cursor-pointer"
              onClick={() => onSelectPortfolio?.(item.id)}
            >
              <div className="flex items-center gap-2">
                {item.isAdequate ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span className="text-slate-200 font-medium truncate max-w-[140px] sm:max-w-[200px]">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-semibold ${
                    item.isAdequate ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {item.liquidityRatio.toFixed(1)}%
                </span>
                <span className="text-slate-500">
                  (R$ {(item.liquidityValue / 1_000_000).toFixed(2)}M)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {liquidityStats.portfoliosNeedingLiquidity.length > 0 && onStartRebalance && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-rose-300">
            {liquidityStats.portfoliosNeedingLiquidity.length} carteira(s) abaixo do piso de liquidez
          </span>
          <button
            onClick={() => onStartRebalance(liquidityStats.portfoliosNeedingLiquidity[0].id)}
            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
          >
            Aportar Caixa <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
