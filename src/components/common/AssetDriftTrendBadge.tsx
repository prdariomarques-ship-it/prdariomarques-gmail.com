import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AssetClass } from '../../types';

interface AssetDriftTrendBadgeProps {
  currentPercent: number;
  targetPercent: number;
  tolerancePP?: number; // Padrão 2.5 p.p.
  criticalTolerancePP?: number; // Padrão 5.0 p.p.
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AssetDriftTrendBadge: React.FC<AssetDriftTrendBadgeProps> = ({
  currentPercent,
  targetPercent,
  tolerancePP = 2.5,
  criticalTolerancePP = 5.0,
  showDetails = true,
  size = 'md',
  className = '',
}) => {
  const diff = Number((currentPercent - targetPercent).toFixed(2));
  const absDiff = Math.abs(diff);

  const isOverweight = diff > 0.05;
  const isUnderweight = diff < -0.05;
  const isDriftAlert = absDiff > tolerancePP;
  const isCritical = absDiff > criticalTolerancePP;

  // Icon sizing
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const textClass = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-xs' : 'text-[11px]';
  const paddingClass = size === 'sm' ? 'px-1.5 py-0.5' : size === 'lg' ? 'px-2.5 py-1' : 'px-2 py-0.5';

  if (!isDriftAlert) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${paddingClass} ${textClass} ${className}`}
        title={`Alocação em linha com a meta estratégica (${targetPercent.toFixed(1)}%). Desvio de ${diff > 0 ? '+' : ''}${diff.toFixed(2)} p.p. dentro da tolerância de ±${tolerancePP} p.p.`}
      >
        <CheckCircle2 className={`${iconSize} text-emerald-400 shrink-0`} />
        <span>{diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`} p.p.</span>
        {showDetails && <span className="text-emerald-500/70 text-[10px]">Meta</span>}
      </span>
    );
  }

  // Desvio acima da meta (Sobre-alocado)
  if (isOverweight) {
    const isHardStop = isCritical;
    const bg = isHardStop ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    const pulse = isHardStop ? 'animate-pulse' : '';

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md font-mono font-bold border ${bg} ${paddingClass} ${textClass} ${pulse} ${className}`}
        title={`${isHardStop ? 'DESVIO CRÍTICO' : 'ALERTA DE DRIFT'}: Ativo sobre-alocado em +${diff.toFixed(2)} p.p. vs meta (${targetPercent.toFixed(1)}%). Ultrapassou a tolerância tática de ${tolerancePP} p.p.`}
      >
        <TrendingUp className={`${iconSize} ${isHardStop ? 'text-rose-400' : 'text-amber-400'} shrink-0`} />
        <span>+{diff.toFixed(1)} p.p.</span>
        {showDetails && (
          <span className={`text-[9px] px-1 py-0.2 rounded font-sans uppercase font-bold tracking-wider ${isHardStop ? 'bg-rose-900/60 text-rose-200' : 'bg-amber-900/60 text-amber-200'}`}>
            {isHardStop ? 'Crítico' : 'Drift > 2.5%'}
          </span>
        )}
      </span>
    );
  }

  // Desvio abaixo da meta (Sub-alocado)
  const isHardStop = isCritical;
  const bg = isHardStop ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
  const pulse = isHardStop ? 'animate-pulse' : '';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-mono font-bold border ${bg} ${paddingClass} ${textClass} ${pulse} ${className}`}
      title={`${isHardStop ? 'DESVIO CRÍTICO' : 'ALERTA DE DRIFT'}: Ativo sub-alocado em ${diff.toFixed(2)} p.p. vs meta (${targetPercent.toFixed(1)}%). Ultrapassou a tolerância tática de ${tolerancePP} p.p.`}
    >
      <TrendingDown className={`${iconSize} ${isHardStop ? 'text-purple-400' : 'text-cyan-400'} shrink-0`} />
      <span>{diff.toFixed(1)} p.p.</span>
      {showDetails && (
        <span className={`text-[9px] px-1 py-0.2 rounded font-sans uppercase font-bold tracking-wider ${isHardStop ? 'bg-purple-900/60 text-purple-200' : 'bg-cyan-900/60 text-cyan-200'}`}>
          {isHardStop ? 'Crítico' : 'Drift > 2.5%'}
        </span>
      )}
    </span>
  );
};
