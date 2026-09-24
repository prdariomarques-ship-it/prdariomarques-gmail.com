import React, { useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Scale,
  Award,
  Info,
  ChevronRight,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { Portfolio, ComplianceAlert } from '../types';
import { TabKey } from './Header';

interface AumWeightedComplianceScoreCardProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  currency?: 'USD' | 'BRL';
  onNavigateTab: (tab: TabKey) => void;
  onSelectPortfolio: (portfolioId: string) => void;
  onStartRebalance?: (portfolioId: string) => void;
}

export interface PortfolioComplianceDetail {
  id: string;
  name: string;
  code: string;
  clientName: string;
  aum: number;
  weightPct: number;
  score: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  criticalBreachesCount: number;
  warningBreachesCount: number;
  targetMisallocationPct: number;
  primaryAlertMessage?: string;
}

// Cor dinâmica com transição contínua de vermelho para verde
export const getComplianceScoreColor = (score: number): string => {
  if (score >= 90) return '#10B981'; // Emerald
  if (score >= 82) return '#22C55E'; // Green
  if (score >= 72) return '#84CC16'; // Lime
  if (score >= 60) return '#EAB308'; // Amber / Yellow
  if (score >= 45) return '#F97316'; // Orange
  return '#EF4444'; // Red
};

export const getComplianceStatusLabel = (score: number): { label: string; badgeClass: string } => {
  if (score >= 90) {
    return {
      label: 'Excelente Aderência',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    };
  }
  if (score >= 75) {
    return {
      label: 'Aderência Moderada',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    };
  }
  return {
    label: 'Risco de Desenquadramento',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };
};

export const AumWeightedComplianceScoreCard: React.FC<AumWeightedComplianceScoreCardProps> = ({
  portfolios,
  alerts,
  currency = 'BRL',
  onNavigateTab,
  onSelectPortfolio,
  onStartRebalance,
}) => {
  // Cálculo do Compliance Score individual e médio ponderado pelo AUM
  const {
    totalAum,
    weightedScore,
    portfolioDetails,
    criticalPortfoliosCount,
    warningPortfoliosCount,
    compliantPortfoliosCount,
  } = useMemo(() => {
    const total = portfolios.reduce((sum, p) => sum + (p.totalAum || 0), 0) || 1;

    const details: PortfolioComplianceDetail[] = portfolios.map((p) => {
      const portAum = p.totalAum || 0;
      const weightPct = total > 0 ? (portAum / total) * 100 : 0;

      // Calcular desvios em relação ao Target de cada classe de ativo
      const classTotals: Record<string, number> = {
        'Renda Fixa': 0,
        'Renda Variável': 0,
        'Internacional': 0,
        'Multimercado': 0,
        'Caixa': 0,
      };

      (p.assets || []).forEach((a) => {
        if (classTotals[a.assetClass] !== undefined) {
          classTotals[a.assetClass] += a.totalValue || 0;
        }
      });
      classTotals['Caixa'] += p.cashBalance || 0;

      const totalVal = portAum > 0 ? portAum : Object.values(classTotals).reduce((s, v) => s + v, 0) || 1;

      let totalMisallocation = 0;
      if (p.mandateLimits && p.mandateLimits.length > 0) {
        p.mandateLimits.forEach((limit) => {
          const actualVal = classTotals[limit.assetClass] || 0;
          const actualPct = (actualVal / totalVal) * 100;
          totalMisallocation += Math.abs(actualPct - limit.targetPercent);
        });
      }

      const targetMisallocationPct = totalMisallocation / 2;

      // Alertas específicos desta carteira
      const portAlerts = alerts.filter((a) => a.portfolioId === p.id);
      const criticalBreachesCount = portAlerts.filter((a) => a.severity === 'CRITICAL').length;
      const warningBreachesCount = portAlerts.filter((a) => a.severity === 'WARNING').length;

      // Cálculo do Score Fiduciário Individual (0 a 100)
      const baseAdherence = Math.max(0, 100 - targetMisallocationPct);
      const penalty = criticalBreachesCount * 12 + warningBreachesCount * 4;
      let score = Math.max(10, Math.min(100, baseAdherence - penalty));

      // Calibração de consistência com status da carteira
      if (p.status === 'CRITICAL' && score > 78) {
        score = 74.0;
      } else if (p.status === 'WARNING' && score > 88) {
        score = 86.0;
      } else if (p.status === 'NORMAL' && criticalBreachesCount === 0 && warningBreachesCount === 0 && score < 92) {
        score = 96.5;
      }

      const primaryAlert = portAlerts[0]?.message;

      return {
        id: p.id,
        name: p.name,
        code: p.code,
        clientName: p.clientName,
        aum: portAum,
        weightPct,
        score: Number(score.toFixed(1)),
        status: p.status as 'NORMAL' | 'WARNING' | 'CRITICAL',
        criticalBreachesCount,
        warningBreachesCount,
        targetMisallocationPct: Number(targetMisallocationPct.toFixed(1)),
        primaryAlertMessage: primaryAlert,
      };
    });

    // Média ponderada pelo AUM
    const weightedSum = details.reduce((sum, item) => sum + item.score * item.aum, 0);
    const weightedAvg = total > 0 ? weightedSum / total : 100;

    // Contadores
    const criticals = details.filter((d) => d.status === 'CRITICAL').length;
    const warnings = details.filter((d) => d.status === 'WARNING').length;
    const compliants = details.filter((d) => d.status === 'NORMAL').length;

    // Ordena do maior peso de AUM para o menor
    details.sort((a, b) => b.aum - a.aum);

    return {
      totalAum: total,
      weightedScore: Number(weightedAvg.toFixed(1)),
      portfolioDetails: details,
      criticalPortfoliosCount: criticals,
      warningPortfoliosCount: warnings,
      compliantPortfoliosCount: compliants,
    };
  }, [portfolios, alerts]);

  // Geometria do Indicador Circular
  const radius = 54;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~339.29
  const clampedScore = Math.max(0, Math.min(100, weightedScore));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;
  const scoreColor = getComplianceScoreColor(clampedScore);
  const statusInfo = getComplianceStatusLabel(clampedScore);

  // Formatação de AUM
  const formattedTotalAum =
    currency === 'USD'
      ? `$ ${(totalAum / 5.82 / 1_000_000).toFixed(2)}M`
      : `R$ ${(totalAum / 1_000_000).toFixed(2)}M`;

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0D1527] via-[#0A1220] to-[#070D18] border border-blue-500/30 shadow-2xl relative overflow-hidden">
      {/* Luz ambiente de fundo */}
      <div
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-15 blur-3xl pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: scoreColor }}
      />

      {/* Header do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner transition-colors duration-500"
            style={{
              backgroundColor: `${scoreColor}15`,
              borderColor: `${scoreColor}40`,
              color: scoreColor,
            }}
          >
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Compliance Score Ponderado (AUM)
              </h3>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border transition-colors duration-500 ${statusInfo.badgeClass}`}
              >
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Média fiduciária ponderada pelo patrimônio líquido sob custódia • Diretrizes CVM 175 & IPS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('alerts')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700/80 transition shadow-sm cursor-pointer"
          >
            <span>Ver Alertas</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {criticalPortfoliosCount > 0 && onStartRebalance && (
            <button
              onClick={() => onStartRebalance(portfolioDetails[0]?.id || 'port-miguel-001')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-950/40 transition cursor-pointer"
            >
              <span>Rebalancear Prioritário</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid Principal: Indicador Circular + Métricas + Ponderação por Carteira */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5 items-center relative z-10">
        {/* Coluna 1 (lg:col-span-4): Indicador Visual Circular com Transição Vermelho -> Verde */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Radial Meter com Gradiente Vermelho-Verde */}
            <svg className="w-full h-full -rotate-90 transform overflow-visible" viewBox="0 0 130 130">
              <defs>
                {/* Gradiente Fiduciário Red -> Orange -> Yellow -> Green */}
                <linearGradient id="scoreRedToGreenGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="25%" stopColor="#F97316" />
                  <stop offset="50%" stopColor="#EAB308" />
                  <stop offset="75%" stopColor="#84CC16" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>

                {/* Filtro Neon Glow */}
                <filter id="scoreGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Anel de Fundo (Track Cinza) */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke="#1E293B"
                strokeWidth={strokeWidth}
                className="opacity-60"
              />

              {/* Anel Ativo com Gradiente e StrokeDashoffset */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke="url(#scoreRedToGreenGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                filter="url(#scoreGlowFilter)"
              />
            </svg>

            {/* Conteúdo Central do Círculo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span
                className="text-3xl font-black tracking-tight drop-shadow-md transition-colors duration-500"
                style={{ color: scoreColor }}
              >
                {clampedScore.toFixed(1)}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Score Global
              </span>
            </div>
          </div>

          {/* Barra de Transição Espectral (Vermelho -> Verde) */}
          <div className="w-full mt-4 px-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-semibold">
              <span className="text-rose-400">0% Crítico</span>
              <span className="text-amber-400">50% Alerta</span>
              <span className="text-emerald-400">100% Conforme</span>
            </div>
            <div className="relative h-2 w-full rounded-full overflow-hidden bg-slate-800 shadow-inner">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'linear-gradient(to right, #EF4444 0%, #F97316 25%, #EAB308 50%, #84CC16 75%, #10B981 100%)',
                }}
              />
              {/* Marcador de Agulha na Posição Exata */}
              <div
                className="absolute top-0 bottom-0 w-2 bg-white shadow-[0_0_8px_#ffffff] rounded-full transform -translate-x-1/2 transition-all duration-700"
                style={{ left: `${clampedScore}%` }}
              />
            </div>
            <div className="text-center mt-1.5">
              <span className="text-[11px] text-slate-400">
                Ponderação por AUM: <strong className="text-white">{formattedTotalAum}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Coluna 2 (lg:col-span-8): Detalhamento Ponderado das Carteiras */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-3">
          {/* 3 Mini Indicadores de Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">Patrimônio Ponderado</span>
              <span className="text-lg font-bold text-white tracking-tight">{formattedTotalAum}</span>
              <span className="text-[10px] text-cyan-400 block mt-0.5 font-medium">
                {portfolioDetails.length} carteiras sob gestão
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">Violações Críticas</span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-lg font-bold ${
                    criticalPortfoliosCount > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {criticalPortfoliosCount}
                </span>
                <span className="text-[10px] text-slate-400">carteira(s)</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {criticalPortfoliosCount > 0 ? 'Prioridade CVM 175' : 'Conformidade plena'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">Fórmula de Ponderação</span>
              <span className="text-xs font-mono font-bold text-slate-300 block">
                Σ(Score_i × AUM_i) / Σ AUM
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Impacto proporcional ao volume
              </span>
            </div>
          </div>

          {/* Lista de Carteiras com Peso no AUM e Score */}
          <div className="space-y-2 mt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              <span>Carteira & Código</span>
              <span>Peso no AUM / Score Individual</span>
            </div>

            {portfolioDetails.map((item) => {
              const itemColor = getComplianceScoreColor(item.score);
              const formattedItemAum =
                currency === 'USD'
                  ? `$ ${(item.aum / 5.82 / 1_000_000).toFixed(2)}M`
                  : `R$ ${(item.aum / 1_000_000).toFixed(2)}M`;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectPortfolio(item.id);
                    onNavigateTab('portfolios');
                  }}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/70 hover:border-slate-700 transition cursor-pointer gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: itemColor }}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">({item.code})</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formattedItemAum} •{' '}
                        <strong className="text-slate-300">{item.weightPct.toFixed(1)}% do AUM</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Mini Barra de Progresso */}
                    <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${item.score}%`,
                          backgroundColor: itemColor,
                        }}
                      />
                    </div>

                    {/* Badge do Score */}
                    <div className="text-right">
                      <span
                        className="text-xs font-black px-2 py-0.5 rounded border inline-block"
                        style={{
                          color: itemColor,
                          backgroundColor: `${itemColor}15`,
                          borderColor: `${itemColor}30`,
                        }}
                      >
                        {item.score.toFixed(1)}%
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
