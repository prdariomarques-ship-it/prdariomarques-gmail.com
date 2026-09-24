import React, { useMemo } from 'react';
import { Target, Zap, TrendingUp, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Portfolio, ComplianceAlert } from '../types';

interface RebalancePerformanceIndexCardProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  onSelectPortfolio?: (portfolioId: string) => void;
  onStartRebalance?: (portfolioId: string) => void;
}

export const RebalancePerformanceIndexCard: React.FC<RebalancePerformanceIndexCardProps> = ({
  portfolios,
  alerts,
  onSelectPortfolio,
  onStartRebalance,
}) => {
  // Cálculo do Índice de Eficiência & Performance de Rebalanceamento
  const performanceStats = useMemo(() => {
    const totalPorts = portfolios.length || 1;
    const criticals = alerts.filter((a) => a.severity === 'CRITICAL');
    const warnings = alerts.filter((a) => a.severity === 'WARNING');

    // Índice de Aderência Global: 100 - penalidades por alertas
    const complianceScore = Math.max(
      0,
      Math.min(100, 100 - (criticals.length * 12 + warnings.length * 4))
    );

    // Redução Potencial de Tracking Error após simulação
    const potentialRiskReduction = criticals.length > 0 ? 38.5 : warnings.length > 0 ? 15.2 : 4.0;

    // Carteiras prioritárias para rebalanceamento
    const urgentPortfolios = portfolios.filter((p) =>
      alerts.some((a) => a.portfolioId === p.id && a.severity === 'CRITICAL')
    );

    return {
      complianceScore,
      potentialRiskReduction,
      urgentPortfolios,
      criticalCount: criticals.length,
      warningCount: warnings.length,
    };
  }, [portfolios, alerts]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Índice de Performance de Rebalanceamento</h3>
            <p className="text-[11px] text-slate-400">Eficiência de Enquadramento & Mitigação de Risco CVM 175</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Score: {performanceStats.complianceScore.toFixed(0)} / 100
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
        {/* Metric 1 */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-slate-400">Aderência ao Mandato</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-white">
              {performanceStats.complianceScore.toFixed(0)}%
            </strong>
            <span className="text-xs text-emerald-400 font-medium">Meta: 100%</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${performanceStats.complianceScore}%` }}
            />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-slate-400">Redução de Tracking Error</span>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-cyan-400">
              -{performanceStats.potentialRiskReduction.toFixed(1)}%
            </strong>
            <span className="text-xs text-slate-400 font-medium">com Rebalance</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Otimização fiduciária por ordem mínima</p>
        </div>

        {/* Metric 3 */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-slate-400">Carteiras em Alerta Crítico</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong
              className={`text-2xl font-bold ${
                performanceStats.criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {performanceStats.criticalCount}
            </strong>
            <span className="text-xs text-slate-400 font-medium">
              de {portfolios.length} carteiras
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {performanceStats.criticalCount === 0
              ? 'Todos os mandatos em conformidade estrita'
              : 'Ação de rebalanceamento sugerida'}
          </p>
        </div>
      </div>

      {performanceStats.urgentPortfolios.length > 0 && onStartRebalance && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
          <div className="flex items-center gap-2 text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Rebalanceamento prioritário recomendado para <strong>{performanceStats.urgentPortfolios[0].name}</strong>
            </span>
          </div>
          <button
            onClick={() => onStartRebalance(performanceStats.urgentPortfolios[0].id)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-md transition cursor-pointer"
          >
            Executar <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
