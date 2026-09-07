import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Sliders,
  Scale,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Zap,
  Copy,
  Check,
  FileText,
  Activity,
  Compass,
} from 'lucide-react';
import { AiExplanation } from '../../types';

export interface AIInsightCardProps {
  /**
   * Primary structured AI explanation containing the 6 required pillars:
   * WHAT, WHY, IMPACT, ACTION, CONFIDENCE, SOURCE.
   */
  insight?: AiExplanation;

  // Individual pillar overrides or direct props for flexibility
  what?: string;
  why?: string;
  impact?: string;
  action?: string;
  confidence?: number;
  source?: string;

  /** Header display title */
  title?: string;
  /** Subtitle or contextual note */
  subtitle?: string;

  /** Functional domain of the insight */
  category?: 'COMPLIANCE' | 'OPPORTUNITY' | 'REBALANCE' | 'ALLOCATION' | 'RISK';
  /** Alert severity tier */
  severity?: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';

  /** Normative rule source (e.g. MANDATO_CLIENTE, POLITICA_INTERNA, REGRA_REGULATORIA) */
  ruleSource?: string;
  /** Linked policy ID */
  policyId?: string;

  /** Threshold limit percentage (e.g., 20.0%) */
  limit?: number;
  /** Current exposure percentage (e.g., 26.8%) */
  currentValue?: number;
  /** Deviation in percentage points (e.g., +6.8 p.p.) */
  difference?: number;

  /**
   * Explicit fiduciary distinction contextualizing the difference between
   * a contractual client mandate (IPS) and an office-wide internal policy.
   */
  mandateVsInternalExplanation?: string;

  /** Primary action callback (e.g. open rebalance simulator) */
  onApplyAction?: () => void;
  /** Label for the primary action button */
  actionLabel?: string;

  /** Optional secondary action */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;

  /** Whether the card can be collapsed */
  collapsible?: boolean;
  /** Initial expansion state when collapsible is true */
  defaultExpanded?: boolean;

  /** Portfolio and client metadata */
  portfolioName?: string;
  clientName?: string;

  /** Custom styling classes */
  className?: string;
  /** DOM element ID */
  id?: string;
}

/**
 * AIInsightCard
 *
 * Glassmorphic UI component designed for AI-driven portfolio insights and
 * compliance audits. Rigorously structured around 6 essential analytical pillars:
 * 1. WHAT       - Objective diagnostic of exposure or opportunity
 * 2. WHY        - Root cause, market factors, and causal mechanics
 * 3. IMPACT     - Fiduciary, regulatory (CVM 175), and financial consequences
 * 4. ACTION     - Prescriptive, pre-validated rebalancing action
 * 5. CONFIDENCE - Model certainty level with dynamic visual gauge
 * 6. SOURCE     - Legal instrument, normative policy rule, and audit trail
 */
export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  insight,
  what = insight?.what || '',
  why = insight?.why || '',
  impact = insight?.impact || '',
  action = insight?.action || '',
  confidence: confidenceProp = insight?.confidence,
  source = insight?.source || 'Política Interna • Resolução CVM 175',
  title,
  subtitle,
  category = 'COMPLIANCE',
  severity = 'INFO',
  ruleSource,
  policyId,
  limit,
  currentValue,
  difference,
  mandateVsInternalExplanation,
  onApplyAction,
  actionLabel = 'Executar Ação Sugerida',
  secondaryActionLabel,
  onSecondaryAction,
  collapsible = false,
  defaultExpanded = true,
  portfolioName,
  clientName,
  className = '',
  id,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [copied, setCopied] = useState<boolean>(false);

  // Confidence calculation (0 - 100)
  const confidence = Math.min(100, Math.max(0, confidenceProp ?? 95));

  // Determine confidence status and chromatic theme
  let confidenceLabel = 'Alta Certeza';
  let confidenceBadgeClass = 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25';
  let confidenceProgressColor = 'bg-emerald-400';

  if (confidence < 75) {
    confidenceLabel = 'Certeza Moderada';
    confidenceBadgeClass = 'text-amber-300 bg-amber-500/10 border-amber-500/25';
    confidenceProgressColor = 'bg-amber-400';
  } else if (confidence < 88) {
    confidenceLabel = 'Boa Certeza';
    confidenceBadgeClass = 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25';
    confidenceProgressColor = 'bg-cyan-400';
  }

  // Visual categorization and accent colors
  const isOpportunity = category === 'OPPORTUNITY';
  const isCritical = severity === 'CRITICAL';
  const isWarning = severity === 'WARNING';

  let themeConfig = {
    badgeLabel: 'COMPLIANCE AGENT',
    badgeStyle: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    topHighlight: 'before:via-emerald-400/40',
    cardBorderGlow: 'hover:border-emerald-500/30 focus-within:border-emerald-500/40',
    icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
    actionBtnBg: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/30 text-white',
  };

  if (isOpportunity) {
    themeConfig = {
      badgeLabel: 'OPORTUNIDADE IA',
      badgeStyle: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      topHighlight: 'before:via-cyan-400/40',
      cardBorderGlow: 'hover:border-cyan-500/30 focus-within:border-cyan-500/40',
      icon: <TrendingUp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />,
      actionBtnBg: 'bg-cyan-600 hover:bg-cyan-500 border-cyan-400/30 text-white',
    };
  } else if (isCritical) {
    themeConfig = {
      badgeLabel: 'DESENQUADRAMENTO CRÍTICO',
      badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      topHighlight: 'before:via-rose-400/50',
      cardBorderGlow: 'hover:border-rose-500/40 focus-within:border-rose-500/50',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
      actionBtnBg: 'bg-rose-600 hover:bg-rose-500 border-rose-400/30 text-white',
    };
  } else if (isWarning) {
    themeConfig = {
      badgeLabel: 'MONITORAMENTO PREVENTIVO',
      badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      topHighlight: 'before:via-amber-400/40',
      cardBorderGlow: 'hover:border-amber-500/30 focus-within:border-amber-500/40',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
      actionBtnBg: 'bg-amber-600 hover:bg-amber-500 border-amber-400/30 text-white',
    };
  }

  // Copy full structured audit insight
  const handleCopyReport = () => {
    let report = `=== FLOWCORE AI COMPLIANCE INSIGHT ===\n`;
    report += `WHAT: ${what}\n`;
    report += `WHY: ${why}\n`;
    report += `IMPACT: ${impact}\n`;
    report += `ACTION: ${action}\n`;
    report += `CONFIDENCE: ${confidence}% (${confidenceLabel})\n`;
    report += `SOURCE: ${source}\n`;

    if (ruleSource) report += `RULE_SOURCE: ${ruleSource}\n`;
    if (policyId) report += `POLICY_ID: ${policyId}\n`;
    if (limit !== undefined && currentValue !== undefined) {
      report += `LIMIT: ${limit.toFixed(1)}% | CURRENT: ${currentValue.toFixed(1)}% | DESVIO: ${difference !== undefined ? `${difference > 0 ? '+' : ''}${difference.toFixed(1)} p.p.` : 'N/A'}\n`;
    }
    if (mandateVsInternalExplanation) {
      report += `CONTEXTO FIDUCIÁRIO: ${mandateVsInternalExplanation}\n`;
    }

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article
      id={id}
      className={`group relative rounded-2xl p-5 backdrop-blur-xl bg-slate-900/80 border border-white/[0.08] shadow-[0_16px_36px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.12)] transition-all duration-300 overflow-hidden ${themeConfig.cardBorderGlow} before:absolute before:inset-x-0 before:top-0 before:h-[1.5px] before:bg-gradient-to-r before:from-transparent ${themeConfig.topHighlight} before:to-transparent ${className}`}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER & METADATA BAR (Category, Portfolios & Controls) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
        {/* Left: Category Badge & Entity context */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider uppercase border shadow-sm ${themeConfig.badgeStyle}`}
          >
            {themeConfig.icon}
            <span>{themeConfig.badgeLabel}</span>
          </span>

          {portfolioName && (
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-200">
              <span className="text-white font-bold">{portfolioName}</span>
              {clientName && (
                <span className="text-slate-400 font-normal">({clientName})</span>
              )}
            </div>
          )}
        </div>

        {/* Right: Confidence Gauge, Copy Button & Collapse Toggle */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* CONFIDENCE PILLAR: Visual Gauge */}
          <div
            id={`${id || 'ai-insight'}-confidence-pill`}
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold shadow-sm backdrop-blur-md ${confidenceBadgeClass}`}
            title={`Certeza Algorítmica do Modelo: ${confidence}% (${confidenceLabel})`}
          >
            <div className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-current animate-pulse" />
              <span>{confidence}%</span>
            </div>

            {/* Gauge progress bar */}
            <div className="w-12 bg-slate-950/70 border border-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${confidenceProgressColor}`}
                style={{ width: `${confidence}%` }}
              />
            </div>

            <span className="text-[10px] uppercase font-sans tracking-tight text-slate-300 hidden md:inline">
              {confidenceLabel}
            </span>
          </div>

          {/* Copy Report Action */}
          <button
            type="button"
            onClick={handleCopyReport}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white text-xs border border-white/[0.08] transition shadow-sm flex items-center justify-center"
            title="Copiar Parecer Completo da IA (Estrutura Fiduciária)"
            aria-label="Copiar parecer estruturado"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Collapse Toggle */}
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white text-xs border border-white/[0.08] transition shadow-sm"
              aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Title & Subtitle banner */}
      {title && (
        <div className="pt-3 pb-1">
          <h4 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
            {title}
          </h4>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* Normative Context Strip: rule_source, policy_id, limit vs current_value */}
      {(ruleSource || policyId || limit !== undefined) && (
        <div className="my-2.5 p-2.5 bg-slate-950/70 rounded-xl border border-white/[0.06] flex flex-wrap items-center gap-3 text-xs">
          {ruleSource && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                Origem:
              </span>
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                  ruleSource === 'MANDATO_CLIENTE'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : ruleSource === 'POLITICA_INTERNA'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : ruleSource === 'REGRA_REGULATORIA'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                {ruleSource}
              </span>
            </div>
          )}

          {policyId && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                Policy:
              </span>
              <span className="px-2 py-0.5 rounded font-mono font-semibold text-[11px] bg-slate-800 text-slate-200 border border-white/[0.08]">
                {policyId}
              </span>
            </div>
          )}

          {limit !== undefined && currentValue !== undefined && (
            <div className="flex items-center gap-2 sm:pl-2 sm:border-l border-white/[0.08]">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                  Limite:
                </span>
                <strong className="text-slate-200 font-mono text-[11px]">
                  {limit.toFixed(1)}%
                </strong>
              </div>
              <span className="text-slate-500 font-bold text-[11px]">vs</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                  Atual:
                </span>
                <strong
                  className={`font-mono text-[11px] ${
                    isCritical ? 'text-rose-400 font-extrabold' : 'text-amber-400 font-bold'
                  }`}
                >
                  {currentValue.toFixed(1)}%
                </strong>
              </div>
              {difference !== undefined && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    difference > 0
                      ? isCritical
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {difference > 0 ? `+${difference.toFixed(1)}` : difference.toFixed(1)} p.p.
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. THE CORE PILLARS: WHAT, WHY, IMPACT, ACTION                */}
      {/* ------------------------------------------------------------- */}
      {isExpanded && (
        <div className="mt-3.5 space-y-3">
          {/* PILLAR 1: WHAT (Diagnóstico Objetivo) */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-white/[0.06] hover:border-white/[0.1] transition-colors">
            <div className="flex items-center space-x-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>WHAT • Diagnóstico da Exposição</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-normal">
              {what}
            </p>
          </div>

          {/* PILLAR 2: WHY (Causa Raiz & Drivers de Mercado) */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-white/[0.06] hover:border-white/[0.1] transition-colors">
            <div className="flex items-center space-x-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>WHY • Causa Raiz & Comportamento de Mercado</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {why}
            </p>
          </div>

          {/* PILLAR 3: IMPACT (Impacto Fiduciário, Regulatório & Financeiro) */}
          <div
            className={`p-3 rounded-xl border transition-colors ${
              isCritical
                ? 'bg-rose-950/20 border-rose-800/30 text-rose-200'
                : isOpportunity
                ? 'bg-cyan-950/20 border-cyan-800/30 text-cyan-200'
                : 'bg-amber-950/20 border-amber-800/30 text-amber-200'
            }`}
          >
            <div className="flex items-center space-x-1.5 text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCritical ? 'bg-rose-400' : isOpportunity ? 'bg-cyan-400' : 'bg-amber-400'
                }`}
              />
              <span className="text-white">IMPACT • Impacto Fiduciário & Regulatório</span>
            </div>
            <p className="text-xs leading-relaxed opacity-95 font-normal">
              {impact}
            </p>
          </div>

          {/* PILLAR 4: ACTION (Ação Recomendada & Rebalanceamento) */}
          <div className="p-3.5 bg-emerald-950/25 rounded-xl border border-emerald-500/30 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACTION • Ação Recomendada pelo FlowCore</span>
              </div>
              <span className="text-[10px] text-emerald-400/90 font-mono font-bold">
                PRÉ-VALIDADO EM SANDBOX
              </span>
            </div>
            <p className="text-xs text-slate-100 font-medium leading-relaxed">
              {action}
            </p>
          </div>

          {/* Fiduciary Distinction Card (Mandato do Cliente vs Política Interna) */}
          {mandateVsInternalExplanation && (
            <div className="p-3 bg-slate-950/70 rounded-xl border border-indigo-500/30 shadow-sm space-y-1.5">
              <div className="flex items-center space-x-2 text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
                <Scale className="w-3.5 h-3.5 text-indigo-400" />
                <span>CONTEXTO FIDUCIÁRIO • Mandato do Cliente vs. Política Interna</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {mandateVsInternalExplanation}
              </p>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 3. FOOTER: SOURCE PILLAR & EXECUTION TRIGGERS                 */}
          {/* ------------------------------------------------------------- */}
          <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-white/[0.08]">
            {/* PILLAR 6: SOURCE (Base Normativa e Regulatória) */}
            <div className="flex items-center space-x-2 text-slate-400 min-w-0">
              <Scale className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-[11px] truncate">
                <strong className="text-slate-300 font-bold">SOURCE:</strong> {source}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 shrink-0">
              {secondaryActionLabel && onSecondaryAction && (
                <button
                  type="button"
                  onClick={onSecondaryAction}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/[0.08] transition shadow-sm"
                >
                  {secondaryActionLabel}
                </button>
              )}

              {onApplyAction && (
                <button
                  type="button"
                  onClick={onApplyAction}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 ${themeConfig.actionBtnBg}`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default AIInsightCard;
