import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Scale,
  FolderOpen,
  Copy,
  Check,
  Sliders,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Building,
  Scroll,
  FileCheck,
  Gavel,
} from 'lucide-react';
import { ComplianceAlert } from '../../types';
import { AIInsightCard } from './AIInsightCard';

export interface ComplianceAlertCardProps {
  alert: ComplianceAlert;
  onStartRebalance?: (portfolioId: string) => void;
  onSelectPortfolio?: (portfolioId: string) => void;
  onCopyMemo?: (alert: ComplianceAlert) => void;
  isCopied?: boolean;
}

export const ComplianceAlertCard: React.FC<ComplianceAlertCardProps> = ({
  alert,
  onStartRebalance,
  onSelectPortfolio,
  onCopyMemo,
  isCopied = false,
}) => {
  const isCritical = alert.severity === 'CRITICAL';
  const effectiveRuleSource = alert.rule_source ?? alert.ruleSource;
  const effectivePolicyId = alert.policy_id ?? alert.policyId;
  const effectiveCurrentValue = alert.current_value ?? alert.currentValue;
  const effectiveLimit = alert.limit;

  const isMandate = effectiveRuleSource === 'MANDATO_CLIENTE';
  const isInternal = effectiveRuleSource === 'POLITICA_INTERNA';
  const isRegulatory = effectiveRuleSource === 'REGRA_REGULATORIA';
  const isSuitability = effectiveRuleSource === 'SUITABILITY';

  const progressRatio = Math.min(100, Math.max(0, (effectiveCurrentValue / (alert.limit * 1.35)) * 100));

  return (
    <div
      id={`alert-card-${alert.id}`}
      className={`rounded-2xl p-6 shadow-sm transition space-y-5 backdrop-blur-xl border ${
        isMandate
          ? isCritical
            ? 'bg-slate-900/95 border-purple-600/60 shadow-[0_12px_32px_rgba(168,85,247,0.18)] ring-1 ring-purple-500/40'
            : 'bg-slate-900/95 border-purple-700/40 shadow-[0_8px_24px_rgba(168,85,247,0.1)]'
          : isInternal
          ? isCritical
            ? 'bg-slate-900/95 border-indigo-600/60 shadow-[0_12px_32px_rgba(99,102,241,0.18)] ring-1 ring-indigo-500/40'
            : 'bg-slate-900/95 border-indigo-700/40 shadow-[0_8px_24px_rgba(99,102,241,0.1)]'
          : isCritical
          ? 'bg-slate-900/90 border-rose-800/50 hover:border-rose-700/70 shadow-[0_8px_30px_rgba(244,63,94,0.1)]'
          : 'bg-slate-900/90 border-amber-800/50 hover:border-amber-700/70 shadow-[0_8px_30px_rgba(245,158,11,0.1)]'
      }`}
    >
      {/* ------------------------------------------------------------- */}
      {/* SCOPE BANNER: Mandato do Cliente vs Política Interna           */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`px-4 py-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold ${
          isMandate
            ? 'bg-purple-950/60 border-purple-500/50 text-purple-200'
            : isInternal
            ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-200'
            : isRegulatory
            ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200'
        }`}
      >
        <div className="flex items-center space-x-2">
          {isMandate && <Scroll className="w-4 h-4 text-purple-300 shrink-0" />}
          {isInternal && <Building className="w-4 h-4 text-indigo-300 shrink-0" />}
          {isRegulatory && <Gavel className="w-4 h-4 text-rose-300 shrink-0" />}
          {isSuitability && <FileCheck className="w-4 h-4 text-cyan-300 shrink-0" />}
          <span>
            {isMandate
              ? '📜 VIOLAÇÃO DE MANDATO DO CLIENTE (IPS CONTRATUAL BILATERAL)'
              : isInternal
              ? '🏛️ DESVIO DE POLÍTICA INTERNA DA GESTORA (COMITÊ DE RISCO E ALOCAÇÃO)'
              : isRegulatory
              ? '⚖️ VIOLAÇÃO DE ENQUADRAMENTO REGULATÓRIO (CVM 175)'
              : '📋 DESENQUADRAMENTO DE SUITABILITY (CVM 30)'}
          </span>
        </div>
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border shrink-0 ${
            isMandate
              ? 'bg-purple-500/20 text-purple-200 border-purple-400/40'
              : isInternal
              ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40'
              : 'bg-black/40 text-slate-200 border-white/10'
          }`}
        >
          {isMandate ? 'Risco Fiduciário Individual' : isInternal ? 'Governança da Gestora' : 'Conformidade Externa'}
        </span>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Top Header: Severity, Portfolio/Client, Quick Actions          */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
          <span
            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isCritical
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-rose-400 animate-pulse' : 'bg-amber-400'}`} />
            {isCritical ? 'DESENQUADRADO (CRITICAL)' : 'ATENÇÃO (WARNING)'}
          </span>

          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{alert.portfolioName}</span>
              <span className="text-xs text-slate-400 font-normal">({alert.clientName})</span>
            </h3>
          </div>
        </div>

        {/* Actions Header */}
        <div className="flex items-center space-x-2">
          {onSelectPortfolio && (
            <button
              onClick={() => onSelectPortfolio(alert.portfolioId)}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-white/[0.08] transition flex items-center gap-1.5 shadow-sm"
              title="Abrir detalhes da carteira"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Ver Carteira</span>
            </button>
          )}

          {onCopyMemo && (
            <button
              onClick={() => onCopyMemo(alert)}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-white/[0.08] transition flex items-center gap-1.5 shadow-sm"
              title="Copiar parecer formal de compliance com rule_source, policy_id e desvio"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-medium">Copiar Parecer</span>
                </>
              )}
            </button>
          )}

          {onStartRebalance && (
            <button
              onClick={() => onStartRebalance(alert.portfolioId)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Simular Rebalanceamento</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DYNAMIC AUDIT STRIP: rule_source, policy_id, limit, current_value */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3.5 bg-slate-950/90 rounded-xl border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Dynamic rule_source with distinct visual branding */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">rule_source:</span>
            <span
              className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold border flex items-center gap-1.5 shadow-sm ${
                isMandate
                  ? 'bg-purple-500/20 text-purple-200 border-purple-500/40 shadow-purple-500/10'
                  : isInternal
                  ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40 shadow-indigo-500/10'
                  : isRegulatory
                  ? 'bg-rose-500/20 text-rose-200 border-rose-500/40 shadow-rose-500/10'
                  : 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-cyan-500/10'
              }`}
            >
              {isMandate && <Scroll className="w-3.5 h-3.5 text-purple-400" />}
              {isInternal && <Building className="w-3.5 h-3.5 text-indigo-400" />}
              {isRegulatory && <Gavel className="w-3.5 h-3.5 text-rose-400" />}
              {isSuitability && <FileCheck className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{effectiveRuleSource}</span>
            </span>
          </div>

          {/* Dynamic policy_id */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">policy_id:</span>
            <span className="px-2.5 py-1 rounded-md font-mono text-xs font-semibold bg-slate-800/90 text-slate-200 border border-white/[0.08]">
              {effectivePolicyId}
            </span>
          </div>

          {/* Dynamic limit */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">limit:</span>
            <span className="px-2.5 py-1 rounded-md font-mono text-xs font-bold bg-slate-800/90 text-slate-200 border border-white/[0.08]">
              {effectiveLimit.toFixed(1)}%
            </span>
          </div>

          {/* Dynamic current_value */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">current_value:</span>
            <span
              className={`px-2.5 py-1 rounded-md font-mono text-xs font-extrabold border ${
                isCritical
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {effectiveCurrentValue.toFixed(1)}%
            </span>
          </div>

          {/* Class identification */}
          <div className="flex items-center space-x-1.5 text-slate-300">
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Classe:</span>
            <strong className="text-white font-semibold">{alert.assetClass}</strong>
          </div>
        </div>

        {/* Metadata info: Vigência e Tolerância */}
        <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
          <span>vigência: <strong className="text-slate-200">{alert.effectiveDate || '01/01/2026'}</strong></span>
          <span className="text-slate-600">•</span>
          <span>tolerância: <strong className="text-slate-200">±{alert.tolerancePP.toFixed(1)} p.p.</strong></span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DYNAMIC COMPARISON TILES: limit vs. current_value             */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-950/90 p-4 rounded-xl border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Comparativo de Enquadramento: limit vs. current_value
            </h4>
          </div>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
              isCritical
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            Desvio: +{alert.difference.toFixed(1)} p.p.
          </span>
        </div>

        {/* 4-Box Metrics Comparison Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* LIMIT box */}
          <div className="p-3 bg-slate-900/90 rounded-lg border border-white/[0.06] text-center sm:text-left">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">
              limit (teto regulamentar)
            </span>
            <strong className="text-lg font-mono font-extrabold text-slate-200">
              {alert.limit.toFixed(1)}%
            </strong>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Limite máximo estipulado
            </span>
          </div>

          {/* CURRENT_VALUE box */}
          <div
            className={`p-3 rounded-lg border text-center sm:text-left ${
              isCritical
                ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
            }`}
          >
            <span className="text-[10px] uppercase font-mono font-bold text-slate-300 block tracking-wider">
              current_value (real em custódia)
            </span>
            <strong className={`text-lg font-mono font-extrabold ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
              {effectiveCurrentValue.toFixed(1)}%
            </strong>
            <span className="text-[10px] opacity-80 block mt-0.5">
              Posição apurada em carteira
            </span>
          </div>

          {/* DIFFERENCE / EXCESS box */}
          <div className="p-3 bg-slate-900/90 rounded-lg border border-white/[0.06] text-center sm:text-left">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">
              excesso patrimonial
            </span>
            <strong className="text-lg font-mono font-extrabold text-emerald-400">
              R$ {alert.excessValueBRL.toLocaleString('pt-BR')}
            </strong>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Capital exposto acima do teto
            </span>
          </div>

          {/* REBALANCE SUGGESTION box */}
          <div className="p-3 bg-slate-900/90 rounded-lg border border-white/[0.06] text-center sm:text-left">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">
              rebalancear p/ meta ({alert.targetPercent}%)
            </span>
            <strong className="text-lg font-mono font-extrabold text-cyan-400">
              R$ {alert.recommendedTradeValue.toLocaleString('pt-BR')}
            </strong>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Volume financeiro para retorno à meta
            </span>
          </div>
        </div>

        {/* Visual Range Gauge */}
        <div className="pt-2">
          <div className="relative w-full h-3 bg-slate-800/90 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCritical
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600'
                  : 'bg-gradient-to-r from-emerald-500 to-amber-500'
              }`}
              style={{ width: `${progressRatio}%` }}
            />
          </div>

          {/* Markers & Legend */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 font-mono">
            <span>Piso (Min): {alert.minPercent.toFixed(0)}%</span>
            <span>Meta (Target): {alert.targetPercent.toFixed(0)}%</span>
            <span className="text-slate-300 font-bold">limit: {effectiveLimit.toFixed(1)}%</span>
            <span className={`font-bold ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
              current_value: {effectiveCurrentValue.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FIDUCIARY DISTINCTION: Mandato do Cliente vs. Política Interna */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`p-4 rounded-xl border transition-all ${
          isMandate
            ? 'bg-purple-950/20 border-purple-800/40 text-purple-100'
            : isInternal
            ? 'bg-indigo-950/20 border-indigo-800/40 text-indigo-100'
            : isRegulatory
            ? 'bg-rose-950/20 border-rose-800/40 text-rose-100'
            : 'bg-slate-950/80 border-slate-800 text-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-white/[0.08] gap-2">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-purple-400 shrink-0" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Governança & Enquadramento Normativo: Mandato do Cliente vs. Política Interna
            </h4>
          </div>

          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border shrink-0 ${
              isMandate
                ? 'bg-purple-500/25 text-purple-300 border-purple-500/50'
                : isInternal
                ? 'bg-indigo-500/25 text-indigo-300 border-indigo-500/50'
                : 'bg-rose-500/25 text-rose-300 border-rose-500/50'
            }`}
          >
            {isMandate
              ? '📜 Violação de Mandato Bilateral (IPS)'
              : isInternal
              ? '🏛️ Desvio de Política Interna da Gestora'
              : '⚖️ Violação Regulatória CVM'}
          </span>
        </div>

        {/* Contextual Narrative tailored to this alert */}
        <p className="text-xs leading-relaxed font-medium">
          {alert.mandateVsInternalExplanation ||
            (isMandate
              ? `Este alerta [${effectivePolicyId}] está classificado como MANDATO_CLIENTE: decorre do contrato bilateral (IPS) firmado diretamente entre a gestora e ${alert.clientName}. O desenquadramento compromete o dever fiduciário contratual individualizado, exigindo rebalanceamento compulsório prioritário ou formalização de termo de anuência prévia com o titular.`
              : `Este alerta [${effectivePolicyId}] está classificado como POLITICA_INTERNA: decorre de diretriz prudencial aprovada pelo Comitê de Risco e Alocação da gestora para salvaguardar a instituição e mitigar concentração sistêmica. Não configura quebra direta do contrato com o cliente, mas exige deliberação do Comitê de Risco interno para autorização de contingência ou enquadramento gradual.`)}
        </p>

        {/* Side-by-side Comparative Guide Pill */}
        <div className="mt-3 pt-2.5 border-t border-white/[0.07] grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
          <div
            className={`p-2.5 rounded-lg border transition-all ${
              isMandate
                ? 'bg-purple-900/30 border-purple-500/40 ring-1 ring-purple-500/20'
                : 'bg-black/30 border-white/[0.06] opacity-75'
            }`}
          >
            <span className="font-bold text-purple-300 flex items-center gap-1.5 mb-1">
              <Scroll className="w-3.5 h-3.5" />
              <span>Mandato do Cliente (IPS Contratual):</span>
            </span>
            <p className="text-slate-300 leading-snug">
              Compromisso fiduciário bilateral direto com o investidor. O descumprimento gera responsabilidade fiduciária perante o titular. Exige reenquadramento tempestivo ou assinatura de termo de alinhamento com o cliente.
            </p>
          </div>

          <div
            className={`p-2.5 rounded-lg border transition-all ${
              isInternal
                ? 'bg-indigo-900/30 border-indigo-500/40 ring-1 ring-indigo-500/20'
                : 'bg-black/30 border-white/[0.06] opacity-75'
            }`}
          >
            <span className="font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
              <Building className="w-3.5 h-3.5" />
              <span>Política Interna (Governança da Gestora):</span>
            </span>
            <p className="text-slate-300 leading-snug">
              Parâmetro prudencial estipulado pelo Comitê de Risco interno para salvaguardar liquidez global e concentração da casa. Não fere diretamente o contrato do cliente, sendo reportada e tratada no comitê de governança.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* AI Structured Insight Card (WHAT, WHY, IMPACT, ACTION...)      */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-1">
        <AIInsightCard
          insight={
            alert.aiExplanation || {
              what: `A exposição em ${alert.assetClass} atingiu ${alert.currentValue.toFixed(1)}%, ultrapassando o limite normativo de ${alert.limit.toFixed(1)}% em +${alert.difference.toFixed(1)} p.p. (Excesso: R$ ${alert.excessValueBRL.toLocaleString('pt-BR')}).`,
              why: `Variação de mercado e rendimento acumulado dos ativos componentes aumentaram a participação relativa da classe de forma desproporcional sem intervenção recente de caixa.`,
              impact: `${
                isMandate
                  ? 'Violação fiduciária de contrato de mandato bilateral do cliente.'
                  : 'Desvio de diretriz interna de risco da gestora.'
              } Risco de tracking error e não conformidade perante regulamentação CVM.`,
              action: `${alert.suggestedAction} (Volume sugerido para rebalancear: R$ ${alert.recommendedTradeValue.toLocaleString('pt-BR')}).`,
              confidence: alert.severity === 'CRITICAL' ? 98 : 92,
              source: `${effectiveRuleSource} • Política ${effectivePolicyId} • Resolução CVM 175 Anexo I`,
            }
          }
          title={`Parecer Fiduciário de IA • ${alert.assetClass}`}
          category="COMPLIANCE"
          severity={alert.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING'}
          ruleSource={effectiveRuleSource}
          rule_source={effectiveRuleSource}
          policyId={effectivePolicyId}
          policy_id={effectivePolicyId}
          limit={alert.limit}
          currentValue={effectiveCurrentValue}
          current_value={effectiveCurrentValue}
          difference={alert.difference}
          mandateVsInternalExplanation={alert.mandateVsInternalExplanation}
          onApplyAction={onStartRebalance ? () => onStartRebalance(alert.portfolioId) : undefined}
          actionLabel="Simular Rebalanceamento"
          collapsible={true}
          defaultExpanded={true}
        />
      </div>
    </div>
  );
};
