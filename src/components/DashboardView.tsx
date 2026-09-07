import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Sliders,
  DollarSign,
  AlertCircle,
  Clock,
  Award,
  Sparkles,
} from 'lucide-react';
import { Portfolio, ComplianceAlert, AiExplanation } from '../types';
import { AIInsightCard } from './AIInsightCard';

interface DashboardViewProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  onSelectPortfolio: (id: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'owner' | 'alerts' | 'portfolios' | 'simulator' | 'agent') => void;
  onStartRebalance: (portfolioId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  portfolios,
  alerts,
  onSelectPortfolio,
  onNavigateTab,
  onStartRebalance,
}) => {
  const [aiInsightTab, setAiInsightTab] = useState<'COMPLIANCE' | 'OPPORTUNITIES'>('COMPLIANCE');

  const totalAum = portfolios.reduce((sum, p) => sum + p.totalAum, 0);
  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');
  const warningAlerts = alerts.filter((a) => a.severity === 'WARNING');
  const normalPortfolios = portfolios.filter((p) => p.status === 'NORMAL');

  // Total de capital excedente a rebalancear
  const totalExcessBRL = alerts.reduce((sum, a) => sum + a.excessValueBRL, 0);
  const complianceRate = portfolios.length > 0 ? (normalPortfolios.length / portfolios.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Regras do ComplianceAgent */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Motor FlowCore de Desenquadramento CVM & Política de Investimento (IPS)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Classificação automática por severidade de desvio e sugestão imediata de ordens de rebalanceamento.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => onNavigateTab('owner')}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold transition shadow-sm"
            >
              <Award className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              <span>Abrir Owner Command Center (Tela 15)</span>
            </button>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />
              <strong>NORMAL:</strong> No limite
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5" />
              <strong>ATENÇÃO:</strong> Até +5.0 p.p.
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-400 mr-1.5 animate-pulse" />
              <strong>DESENQUADRADO:</strong> &gt; +5.0 p.p.
            </span>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total AUM */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Patrimônio sob Gestão (AUM)</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              R$ {(totalAum / 1000000).toFixed(2)}M
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>{portfolios.length} carteiras monitoradas</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">LIVE DATA</span>
            </div>
          </div>
        </div>

        {/* Card 2: Desenquadradas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Desenquadramentos Críticos</span>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-400 tracking-tight flex items-baseline gap-2">
              {criticalAlerts.length}
              <span className="text-xs font-normal text-slate-400">carteira(s)</span>
            </div>
            <div className="text-xs text-rose-300/80 mt-1">
              Desvio &gt; 5 p.p. acima do mandato
            </div>
          </div>
        </div>

        {/* Card 3: Em Atenção */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Alertas em Atenção</span>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-400 tracking-tight flex items-baseline gap-2">
              {warningAlerts.length}
              <span className="text-xs font-normal text-slate-400">aviso(s)</span>
            </div>
            <div className="text-xs text-amber-300/80 mt-1">
              Desvio de até 5 p.p. (tolerância)
            </div>
          </div>
        </div>

        {/* Card 4: Volume a Rebalancear */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Volume a Rebalancear</span>
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-cyan-400 tracking-tight">
              R$ {(totalExcessBRL / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Taxa de conformidade: {complianceRate.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* ADVISOR EXPERIENCE: Actionable Priority Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Prioridades Acionáveis do Assessor / Gestor (Fila de Decisão)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ações recomendadas com base nas infrações fiduciárias de maior impacto patrimonial.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            3 Ações Pendentes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action Card 1: Critical breach */}
          <div className="bg-slate-950/80 border border-rose-900/40 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-rose-500/50 transition">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                  Urgente • CVM 175
                </span>
                <span className="text-[10px] text-slate-400 font-mono">5 dias em desvio</span>
              </div>
              <h4 className="text-xs font-bold text-white">Rebalancear João Silva Multi-Mercado</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Renda Variável atingiu <strong className="text-rose-400">43.0%</strong> (Teto IPS: 35.0%). Excesso de R$ 1.48M requer desinvestimento tático.
              </p>
            </div>
            <button
              onClick={() => onStartRebalance('port-001')}
              className="w-full py-2 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              <span>Simular Rebalanceamento</span>
            </button>
          </div>

          {/* Action Card 2: Warning monitoring */}
          <div className="bg-slate-950/80 border border-amber-800/40 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-amber-500/50 transition">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Preventivo • Tolerância
                </span>
                <span className="text-[10px] text-slate-400 font-mono">2 dias em desvio</span>
              </div>
              <h4 className="text-xs font-bold text-white">Revisar Mariana Rios Offshore</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Ativos Internacionais em <strong className="text-amber-400">23.0%</strong> (Teto IPS: 20.0%). Desvio de +3.0 p.p. se aproxima do gatilho crítico de 5 p.p.
              </p>
            </div>
            <button
              onClick={() => onSelectPortfolio('port-004')}
              className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>Inspecionar Posições</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          {/* Action Card 3: Executive Comitê */}
          <div className="bg-slate-950/80 border border-cyan-800/40 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-cyan-500/50 transition">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                  Comitê • Tela 15
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">R$ 18.5M Pipeline</span>
              </div>
              <h4 className="text-xs font-bold text-white">Conferir Parecer para Sócios</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Revisar projeção de ARR de R$ 437k, funil de propostas em onboarding e matriz de risco para a reunião executiva.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('owner')}
              className="w-full py-2 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>Abrir Owner Command Center</span>
            </button>
          </div>
        </div>
      </div>

      {/* FLOWCORE AI INSIGHT ENGINE: Prescriptive Intelligence in 6 Pillars */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Inteligência Prescritiva FlowCore IA
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Recomendações fiduciárias estruturadas no padrão obrigatório: <strong className="text-slate-300">WHAT, WHY, IMPACT, ACTION, CONFIDENCE e SOURCE</strong>.
            </p>
          </div>

          {/* Tab Pill Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/[0.08] text-xs">
            <button
              onClick={() => setAiInsightTab('COMPLIANCE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                aiInsightTab === 'COMPLIANCE'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Compliance & Risco ({alerts.length})</span>
            </button>
            <button
              onClick={() => setAiInsightTab('OPPORTUNITIES')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                aiInsightTab === 'OPPORTUNITIES'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Oportunidades de Carteira (2)</span>
            </button>
          </div>
        </div>

        {/* Insight Cards Grid */}
        {aiInsightTab === 'COMPLIANCE' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {alerts.slice(0, 2).map((alert) => (
              <AIInsightCard
                key={alert.id}
                id={`insight-${alert.id}`}
                insight={
                  alert.aiExplanation || {
                    what: `A exposição em ${alert.assetClass} atingiu ${alert.currentValue.toFixed(1)}%, ultrapassando o limite normativo de ${alert.limit.toFixed(1)}% em +${alert.difference.toFixed(1)} p.p. (Excesso: R$ ${alert.excessValueBRL.toLocaleString('pt-BR')}).`,
                    why: `Variação acumulada de mercado e valorização relativa dos ativos da classe sem rebalanceamento de caixa recente.`,
                    impact: `${alert.ruleSource === 'MANDATO_CLIENTE' ? 'Violação formal de mandato bilateral do cliente.' : 'Desvio de diretriz interna da gestora.'} Risco regulatório perante CVM 175.`,
                    action: `${alert.suggestedAction} (Volume sugerido: R$ ${alert.recommendedTradeValue.toLocaleString('pt-BR')}).`,
                    confidence: alert.severity === 'CRITICAL' ? 98 : 92,
                    source: `${alert.ruleSource} • Política ${alert.policyId} • Resolução CVM 175 Anexo I`,
                  }
                }
                title={`Recomendação de Compliance • ${alert.portfolioName}`}
                subtitle={`Titular: ${alert.clientName} • Classe: ${alert.assetClass}`}
                category="COMPLIANCE"
                severity={alert.severity}
                ruleSource={alert.ruleSource}
                policyId={alert.policyId}
                limit={alert.limit}
                currentValue={alert.currentValue}
                difference={alert.difference}
                mandateVsInternalExplanation={alert.mandateVsInternalExplanation}
                portfolioName={alert.portfolioName}
                clientName={alert.clientName}
                onApplyAction={() => onStartRebalance(alert.portfolioId)}
                actionLabel="Simular Rebalanceamento"
                collapsible={true}
                defaultExpanded={true}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AIInsightCard
              id="opportunity-cash-yield"
              insight={{
                what: 'Acúmulo de R$ 1.850.000 em caixa D+0 (100% CDI) na carteira Moderada de Pedro Henrique Silveira, enquanto o mandato prevê meta de IPCA + 6.2% a.a.',
                why: 'Amortização extraordinária de crédito privado e proventos de debêntures acumulados nos últimos 45 dias sem reinvestimento programado.',
                impact: 'Arrasto de rentabilidade estimado em ~0.85% a.a. em relação ao benchmark IMA-B e custo de oportunidade em ambiente de juros reais elevados.',
                action: 'Alocar R$ 1.200.000 em NTN-B com vencimento em 2029 (IPCA + 6.45% a.a.) e R$ 450.000 em Debêntures Incentivadas AAA isentas de IR.',
                confidence: 96,
                source: 'Política IPS-PHS-2024 • Resolução CVM 175 Anexo Normativo I • Lei 12.431/11 (Incentivadas)',
              }}
              title="Oportunidade de Alocação de Caixa & Carry Yield"
              subtitle="Carteira Pedro Henrique Silveira • Perfil Moderado"
              category="OPPORTUNITY"
              severity="INFO"
              portfolioName="Pedro Henrique Silveira"
              clientName="Pedro Henrique Silveira"
              onApplyAction={() => onSelectPortfolio('port-002')}
              actionLabel="Ver Posições & Alocar"
              collapsible={true}
              defaultExpanded={true}
            />

            <AIInsightCard
              id="opportunity-tax-efficiency"
              insight={{
                what: 'Espaço regulatório de R$ 380.000 para otimização de curva prefixada na carteira Conservadora de Clara Mendes sem violar o teto de risco bancário.',
                why: 'Abertura de 35 bps na inclinação da curva DI permitiu trava de taxa atrativa de 12.85% a.a. em títulos do Tesouro Nacional.',
                impact: 'Melhoria na convexidade da carteira, eliminação do risco de crédito bancário secundário e ampliação da liquidez imediata para D+1.',
                action: 'Realizar swap de R$ 380.000 de CDB bancário de emissor médio para NTN-F 2027 com liquidação via mesa de operações.',
                confidence: 93,
                source: 'Política IPS-CM-002 • Diretrizes ANBIMA de Gestão de Liquidez & Renda Fixa',
              }}
              title="Otimização Tributária & Ganho de Curva"
              subtitle="Carteira Clara Mendes • Perfil Conservador"
              category="OPPORTUNITY"
              severity="INFO"
              portfolioName="Clara Mendes"
              clientName="Clara Mendes"
              onApplyAction={() => onSelectPortfolio('port-003')}
              actionLabel="Inspecionar Carteira"
              collapsible={true}
              defaultExpanded={true}
            />
          </div>
        )}
      </div>

      {/* Main Grid: Alertas Recentes & Carteiras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col (2/3): Alertas Ativos do ComplianceAgent */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                Alertas Ativos do ComplianceAgent ({alerts.length})
              </h3>
              <p className="text-xs text-slate-400">
                Detecção imediata de violação de limites por classe de ativo
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center font-medium transition"
            >
              Ver todos os alertas <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-200">Nenhum desenquadramento ativo!</p>
              <p className="text-xs text-slate-400 mt-1">Todas as carteiras estão dentro dos limites estabelecidos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 4).map((alert) => {
                const isCritical = alert.severity === 'CRITICAL';
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border transition ${
                      isCritical
                        ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700/60'
                        : 'bg-amber-950/20 border-amber-800/40 hover:border-amber-700/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-bold tracking-wide ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {isCritical ? '🔴 CRÍTICO' : '🟡 ATENÇÃO'}
                        </span>
                        <h4 className="text-sm font-semibold text-white">
                          {alert.portfolioName}
                        </h4>
                        <span className="text-xs text-slate-400">({alert.clientName})</span>
                        
                        {/* Explicit rule_source badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          alert.ruleSource === 'MANDATO_CLIENTE'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        }`}>
                          rule_source: {alert.ruleSource}
                        </span>

                        {/* Explicit policy_id badge */}
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          policy_id: {alert.policyId}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-300">
                        Classe: <span className="text-white">{alert.assetClass}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-300 leading-relaxed">
                      {alert.message}
                    </div>

                    {/* Contextual difference pill between client mandate and internal policy */}
                    <div className="mt-2 text-[11px] p-2 rounded-lg bg-black/40 border border-white/[0.06] text-slate-300 flex items-start space-x-2">
                      <span className="font-bold text-cyan-400 uppercase font-mono text-[10px] shrink-0 mt-0.5">
                        {alert.ruleSource === 'MANDATO_CLIENTE' ? '📜 Mandato Bilateral:' : '🏛️ Política Interna:'}
                      </span>
                      <span className="leading-snug">
                        {alert.mandateVsInternalExplanation || (alert.ruleSource === 'MANDATO_CLIENTE' 
                          ? 'Cláusula do contrato de gestão firmado com o cliente. Desenquadramento gera risco fiduciário direto.' 
                          : 'Parâmetro prudencial da gestora para mitigar risco global, sem violação direta de contrato bilateral.')}
                      </span>
                    </div>

                    {/* Allocation metrics comparison: limit vs current_value */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 py-2 px-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-400 font-mono text-[11px]">current_value:</span>{' '}
                        <strong className={isCritical ? 'text-rose-400 font-mono' : 'text-amber-400 font-mono'}>
                          {alert.currentValue.toFixed(1)}%
                        </strong>
                      </div>
                      <span className="text-slate-700">•</span>
                      <div>
                        <span className="text-slate-400 font-mono text-[11px]">limit:</span>{' '}
                        <strong className="text-slate-200 font-mono">{alert.limit.toFixed(1)}%</strong>
                      </div>
                      <span className="text-slate-700">•</span>
                      <div>
                        <span className="text-slate-400 font-mono text-[11px]">desvio:</span>{' '}
                        <strong className={isCritical ? 'text-rose-400 font-mono' : 'text-amber-400 font-mono'}>
                          +{alert.difference.toFixed(1)} p.p.
                        </strong>
                      </div>
                      <span className="text-slate-700">•</span>
                      <div>
                        <span className="text-slate-400">Excesso Estimado:</span>{' '}
                        <strong className="text-emerald-400 font-mono">
                          R$ {alert.excessValueBRL.toLocaleString('pt-BR')}
                        </strong>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <p className="text-xs text-slate-400 italic line-clamp-1">
                        Ação: {alert.suggestedAction}
                      </p>
                      <button
                        onClick={() => onStartRebalance(alert.portfolioId)}
                        className="ml-2 inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition whitespace-nowrap"
                      >
                        <Sliders className="w-3.5 h-3.5 mr-1.5" />
                        Rebalancear
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col (1/3): Resumo de Carteiras Monitoradas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Carteiras Monitoradas
            </h3>
            <button
              onClick={() => onNavigateTab('portfolios')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center font-medium transition"
            >
              Ver todas <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>

          <div className="space-y-2.5">
            {portfolios.map((portfolio) => {
              const isCrit = portfolio.status === 'CRITICAL';
              const isWarn = portfolio.status === 'WARNING';
              const isNorm = portfolio.status === 'NORMAL';

              return (
                <div
                  key={portfolio.id}
                  onClick={() => onSelectPortfolio(portfolio.id)}
                  className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-white hover:text-emerald-400 transition">
                        {portfolio.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{portfolio.profile}</span>
                      <span>•</span>
                      <span>R$ {(portfolio.totalAum / 1000000).toFixed(2)}M</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded ${
                        isCrit
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isWarn
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isCrit && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1 animate-pulse" />}
                      {isWarn && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1" />}
                      {isNorm && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />}
                      {isCrit ? 'CRÍTICO' : isWarn ? 'ATENÇÃO' : 'ENQUADRADA'}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-end">
                      <Clock className="w-2.5 h-2.5 mr-1" />
                      {portfolio.lastRebalanced}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick AI Advice card */}
          <div className="p-4 bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl border border-cyan-500/20 space-y-2.5">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>FlowCore AI Copilot</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Precisa justificar o desenquadramento ao Comitê de Risco ou avaliar a eficiência fiscal do rebalanceamento?
            </p>
            <button
              onClick={() => onNavigateTab('agent')}
              className="w-full py-2 px-3 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 transition flex items-center justify-center space-x-1.5"
            >
              <span>Consultar Agente de Compliance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
