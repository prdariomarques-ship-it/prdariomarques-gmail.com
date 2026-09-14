import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Sliders,
  ChevronRight,
  ChevronDown,
  User,
  Clock,
  ArrowRight,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Layers,
  Activity,
  HeartPulse,
  Send,
  Building2,
  Coins,
  Scale,
  Sparkles,
  Briefcase,
  FileSpreadsheet,
  X,
  Share2,
} from 'lucide-react';
import { Portfolio, ComplianceAlert, ClientRiskProfile, HealthScoreFactors } from '../types';
import { AIInsightCard } from './common/AIInsightCard';

export interface ClientsAtRiskProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  onSelectPortfolio: (id: string) => void;
  onStartRebalance: (portfolioId: string) => void;
  onAuditClient?: (portfolioId: string) => void;
}

export type RiskSeverityFilter = 'ALL' | 'CRITICAL' | 'WARNING' | 'HIGH_AUM' | 'SAFE';

export const ClientsAtRisk: React.FC<ClientsAtRiskProps> = ({
  portfolios,
  alerts,
  onSelectPortfolio,
  onStartRebalance,
  onAuditClient,
}) => {
  const [severityFilter, setSeverityFilter] = useState<RiskSeverityFilter>('ALL');
  const [sortBy, setSortBy] = useState<'SCORE_ASC' | 'AUM_DESC' | 'EXCESS_DESC' | 'DAYS_DESC'>('SCORE_ASC');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [escalatedClientId, setEscalatedClientId] = useState<string | null>(null);
  const [escalationSuccessToast, setEscalationSuccessToast] = useState<string | null>(null);

  // Derive comprehensive client risk profiles with 8 health score factors
  const clientRiskProfiles = useMemo<ClientRiskProfile[]>(() => {
    return portfolios.map((port) => {
      const portAlerts = alerts.filter((a) => a.portfolioId === port.id);
      const criticalAlerts = portAlerts.filter((a) => a.severity === 'CRITICAL');
      const warningAlerts = portAlerts.filter((a) => a.severity === 'WARNING');

      let primaryIssue = 'Alocação em conformidade com o mandato';
      let maxDeviation = 0;
      let totalExcessBRL = 0;

      if (portAlerts.length > 0) {
        const sortedAlerts = [...portAlerts].sort((a, b) => b.deviationPP - a.deviationPP);
        const worst = sortedAlerts[0];
        primaryIssue = `${worst.assetClass}: +${worst.deviationPP.toFixed(1)} p.p. acima do limite (${worst.ruleSource})`;
        maxDeviation = worst.deviationPP;
        totalExcessBRL = portAlerts.reduce((s, a) => s + a.excessValueBRL, 0);
      }

      // 8 FATORES INDEPENDENTES DO HEALTH SCORE
      // 1. Compliance: aderência formal a mandatos e limites CVM 175 / CMN 4.963
      const complianceScore = criticalAlerts.length > 0
        ? Math.max(28, Math.round(58 - maxDeviation * 2.5))
        : warningAlerts.length > 0
        ? Math.max(65, Math.round(85 - maxDeviation * 2.8))
        : 98;

      // 2. Concentração: peso do maior ativo individual
      const maxAssetWeight = port.assets.length > 0
        ? Math.max(...port.assets.map((a) => (a.totalValue / (port.totalAum || 1)) * 100))
        : 10;
      const concentrationScore = maxAssetWeight > 30
        ? Math.max(38, Math.round(100 - (maxAssetWeight - 30) * 3))
        : maxAssetWeight > 20
        ? 75
        : 95;

      // 3. Liquidez: parcela em caixa e ativos D+0 / D+1
      const cashAsset = port.assets.find((a) => a.assetClass === 'Caixa');
      const cashPct = cashAsset && port.totalAum > 0 ? (cashAsset.totalValue / port.totalAum) * 100 : 0;
      const liquidityScore = cashPct < 2 ? 52 : cashPct < 5 ? 74 : 92;

      // 4. Portfolio: aderência ao benchmark da carteira
      const portfolioScore = port.status === 'CRITICAL' ? 60 : port.status === 'WARNING' ? 76 : 95;

      // 5. Relacionamento: contato proativo e SLA de atendimento
      const relationshipScore = port.id === 'port-001' ? 88 : port.id === 'port-004' ? 62 : 86;

      // 6. Engajamento: presença em reuniões de comitê e leitura de relatórios
      const engagementScore = port.id === 'port-004' ? 58 : port.id === 'port-002' ? 92 : 84;

      // 7. Operações: cadastro em dia, suitability CVM 30 atualizado
      const operationsScore = port.id === 'port-004' ? 66 : 96;

      // 8. Oportunidades: potencial de captação e eficiência fiscal
      const opportunitiesScore = port.totalAum > 15000000 ? 92 : 78;

      const factors: HealthScoreFactors = {
        relationship: relationshipScore,
        engagement: engagementScore,
        portfolio: portfolioScore,
        liquidity: liquidityScore,
        concentration: concentrationScore,
        compliance: complianceScore,
        operations: operationsScore,
        opportunities: opportunitiesScore,
      };

      // Média ponderada com ênfase fiduciária e de governança
      const compositeScore = Math.round(
        complianceScore * 0.30 +
        concentrationScore * 0.15 +
        liquidityScore * 0.10 +
        portfolioScore * 0.15 +
        relationshipScore * 0.10 +
        engagementScore * 0.08 +
        operationsScore * 0.07 +
        opportunitiesScore * 0.05
      );

      const daysInBreach = port.status === 'CRITICAL' ? 5 : port.status === 'WARNING' ? 2 : 0;
      const healthTrend: 'UP' | 'STABLE' | 'DOWN' =
        compositeScore < 65 ? 'DOWN' : compositeScore < 80 ? 'STABLE' : 'UP';

      return {
        portfolioId: port.id,
        portfolioCode: port.code,
        portfolioName: port.name,
        clientName: port.clientName,
        profile: port.profile,
        manager: port.manager,
        totalAum: port.totalAum,
        healthScore: compositeScore,
        status: port.status,
        primaryIssue,
        deviationPP: maxDeviation,
        excessValueBRL: totalExcessBRL,
        daysInBreach,
        factors,
        healthFactors: factors,
        healthTrend,
      };
    });
  }, [portfolios, alerts]);

  // Executive KPI Aggregations
  const executiveMetrics = useMemo(() => {
    const criticalClients = clientRiskProfiles.filter((c) => c.status === 'CRITICAL' || c.healthScore < 65);
    const warningClients = clientRiskProfiles.filter((c) => c.status === 'WARNING' || (c.healthScore >= 65 && c.healthScore < 80));
    const totalAumCritical = criticalClients.reduce((s, c) => s + c.totalAum, 0);
    const totalExcessCritical = criticalClients.reduce((s, c) => s + c.excessValueBRL, 0);

    const scores = clientRiskProfiles.map((c) => c.healthScore);
    const minScore = scores.length > 0 ? Math.min(...scores) : 100;
    const lowestScoreClient = clientRiskProfiles.find((c) => c.healthScore === minScore);

    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 100;

    return {
      criticalCount: criticalClients.length,
      warningCount: warningClients.length,
      totalAumCritical,
      totalExcessCritical,
      minScore,
      lowestScoreClient,
      avgScore,
      totalClients: clientRiskProfiles.length,
    };
  }, [clientRiskProfiles]);

  // Filtered and Sorted Client List
  const filteredAndSortedClients = useMemo(() => {
    return clientRiskProfiles
      .filter((client) => {
        // Severity Filter
        if (severityFilter === 'CRITICAL') {
          return client.status === 'CRITICAL' || client.healthScore < 65;
        }
        if (severityFilter === 'WARNING') {
          return client.status === 'WARNING' || (client.healthScore >= 65 && client.healthScore < 80);
        }
        if (severityFilter === 'HIGH_AUM') {
          return client.totalAum >= 10000000;
        }
        if (severityFilter === 'SAFE') {
          return client.status === 'NORMAL' && client.healthScore >= 80;
        }

        return true;
      })
      .filter((client) => {
        // Search Query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          client.clientName.toLowerCase().includes(q) ||
          client.portfolioName.toLowerCase().includes(q) ||
          client.portfolioCode.toLowerCase().includes(q) ||
          client.manager.toLowerCase().includes(q) ||
          client.profile.toLowerCase().includes(q) ||
          client.primaryIssue.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'SCORE_ASC') {
          return a.healthScore - b.healthScore;
        }
        if (sortBy === 'AUM_DESC') {
          return b.totalAum - a.totalAum;
        }
        if (sortBy === 'EXCESS_DESC') {
          return b.excessValueBRL - a.excessValueBRL;
        }
        if (sortBy === 'DAYS_DESC') {
          return b.daysInBreach - a.daysInBreach;
        }
        return 0;
      });
  }, [clientRiskProfiles, severityFilter, searchQuery, sortBy]);

  // Handlers
  const handleToggleExpand = (clientId: string) => {
    setExpandedClientId((prev) => (prev === clientId ? null : clientId));
  };

  const handleEscalateToManager = (client: ClientRiskProfile) => {
    setEscalatedClientId(client.portfolioId);
    setEscalationSuccessToast(
      `Alerta executivo de conformidade enviado com sucesso para ${client.manager} sobre a conta de ${client.clientName}.`
    );
    setTimeout(() => {
      setEscalationSuccessToast(null);
      setEscalatedClientId(null);
    }, 4000);
  };

  return (
    <div
      id="owner-clients-at-risk"
      aria-label="Supervisão Executiva: Clientes em Risco & Health Score"
      className="relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-b from-slate-800/70 via-slate-900/80 to-slate-950/90 border border-white/[0.09] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_12px_32px_rgba(0,0,0,0.35)] space-y-5"
    >
      {/* Toast Notification */}
      {escalationSuccessToast && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{escalationSuccessToast}</span>
          </div>
          <button
            onClick={() => setEscalationSuccessToast(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 1. EXECUTIVE HEADER & SUPERVISION TELEMETRY                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 via-amber-500/15 to-slate-900 border border-rose-500/30 text-rose-400 shadow-sm mt-0.5">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Supervisão Executiva: Clientes em Risco &amp; Health Score
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/35 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                Alta Exposição &amp; Governança
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Supervisão de mandatos fiduciários sob gestão. Identificação precoce de contas com desenquadramento da Resolução CVM 175, desvio de limites contratuais (IPS) ou fragilidade multidimensional nos 8 pilares de saúde da carteira.
            </p>
          </div>
        </div>

        {/* Global Health Badge */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-white/[0.08] shrink-0 self-start sm:self-center">
          <Activity className="w-4 h-4 text-emerald-400" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Score Médio da Casa:</span>
            <span className="text-sm font-extrabold text-white font-mono">{executiveMetrics.avgScore} / 100</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. FOUR EXECUTIVE KPI TILES (EXPOSURE & SEVERITY METRICS)          */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Clientes em Risco Crítico */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800/90 rounded-xl hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Contas Críticas
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-rose-400">
              {executiveMetrics.criticalCount}
            </span>
            <span className="text-xs text-slate-400">de {executiveMetrics.totalClients} carteiras</span>
          </div>
          <div className="mt-1 text-[10px] text-rose-300/90 flex items-center gap-1 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>Score &lt; 65 ou Violação CVM</span>
          </div>
        </div>

        {/* Metric 2: AUM Sob Estresse Fiduciário */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800/90 rounded-xl hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              AUM Sob Risco
            </span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl font-black text-amber-300">
              R$ {(executiveMetrics.totalAumCritical / 1000000).toFixed(1)}
            </span>
            <span className="text-sm font-bold text-amber-400">M</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Excesso a rebalancear: <strong className="text-amber-200 font-mono">R$ {(executiveMetrics.totalExcessCritical / 1000).toFixed(0)}k</strong>
          </div>
        </div>

        {/* Metric 3: Menor Health Score */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800/90 rounded-xl hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Pior Score Registrado
            </span>
            <AlertTriangle className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-rose-400">
              {executiveMetrics.minScore}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-300 truncate">
            {executiveMetrics.lowestScoreClient?.clientName || 'N/A'}
          </div>
        </div>

        {/* Metric 4: Prazo em Apontamento */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800/90 rounded-xl hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              SLA Máximo Decorrido
            </span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl font-black text-indigo-300">5</span>
            <span className="text-xs text-slate-400">dias úteis</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Limite regulatório CVM 175: 15 dias
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. CONTROLS: SEVERITY FILTERS, SEARCH & SORT                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Severity Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/[0.08] text-xs">
          <button
            onClick={() => setSeverityFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              severityFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Todos ({clientRiskProfiles.length})</span>
          </button>

          <button
            onClick={() => setSeverityFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              severityFilter === 'CRITICAL'
                ? 'bg-rose-500/25 text-rose-200 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span>Críticos ({executiveMetrics.criticalCount})</span>
          </button>

          <button
            onClick={() => setSeverityFilter('WARNING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              severityFilter === 'WARNING'
                ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Atenção ({executiveMetrics.warningCount})</span>
          </button>

          <button
            onClick={() => setSeverityFilter('HIGH_AUM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              severityFilter === 'HIGH_AUM'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/35 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Alta Exposição (&gt;R$ 10M)</span>
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente ou sócio..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="SCORE_ASC">Pior Health Score</option>
            <option value="AUM_DESC">Maior Volume AUM</option>
            <option value="EXCESS_DESC">Maior Excesso (R$)</option>
            <option value="DAYS_DESC">Dias em Violação</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. CLIENTS AT RISK: EXECUTIVE LIST                                 */}
      {/* ------------------------------------------------------------------ */}
      {filteredAndSortedClients.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
          Nenhum cliente atende aos critérios de filtro aplicados.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedClients.map((client) => {
            const isExpanded = expandedClientId === client.portfolioId;
            const isCritical = client.status === 'CRITICAL' || client.healthScore < 65;
            const isWarning = !isCritical && (client.status === 'WARNING' || client.healthScore < 80);

            // Visual severity tokens
            let borderClass = 'border-slate-800/90 hover:border-slate-700';
            let bgGradient = 'bg-slate-950/70';
            let severityBadge = {
              label: '🟢 Conforme',
              className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
              glow: '',
            };

            if (isCritical) {
              borderClass = 'border-rose-500/40 hover:border-rose-400';
              bgGradient = 'bg-gradient-to-r from-rose-950/30 via-slate-950/90 to-slate-950';
              severityBadge = {
                label: '🔴 Crítico • Desenquadrado',
                className: 'bg-rose-500/20 text-rose-200 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.25)]',
                glow: 'border-l-4 border-l-rose-500',
              };
            } else if (isWarning) {
              borderClass = 'border-amber-500/40 hover:border-amber-300';
              bgGradient = 'bg-gradient-to-r from-amber-950/25 via-slate-950/90 to-slate-950';
              severityBadge = {
                label: '🟡 Atenção • Próximo ao Limite',
                className: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
                glow: 'border-l-4 border-l-amber-500',
              };
            }

            return (
              <div
                key={client.portfolioId}
                className={`rounded-2xl border transition-all duration-200 ${borderClass} ${bgGradient} ${severityBadge.glow} shadow-sm overflow-hidden`}
              >
                {/* Main Row Content */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Client, Code, Mandate & Manager */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-extrabold text-white tracking-tight">
                        {client.clientName}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-white/[0.08]">
                        {client.portfolioCode}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-300 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.07]">
                        {client.profile}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${severityBadge.className}`}>
                        {severityBadge.label}
                      </span>
                    </div>

                    {/* Primary Diagnostic Issue */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">Motivo Principal:</span>
                      <span className={`font-semibold ${isCritical ? 'text-rose-300' : isWarning ? 'text-amber-300' : 'text-slate-200'}`}>
                        {client.primaryIssue}
                      </span>
                    </div>

                    {/* Meta info: Advisor & Days */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Sócio/Gestor: <strong className="text-slate-300">{client.manager}</strong></span>
                      </span>
                      {client.daysInBreach > 0 && (
                        <span className="flex items-center gap-1 text-rose-300 font-mono font-bold">
                          <Clock className="w-3 h-3 text-rose-400" />
                          <span>{client.daysInBreach} dias em violação</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: AUM & Excess Values */}
                  <div className="flex items-center gap-5 sm:gap-6 shrink-0 font-mono">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">
                        Volume AUM
                      </span>
                      <span className="text-base font-black text-white">
                        R$ {(client.totalAum / 1000000).toFixed(2)}M
                      </span>
                    </div>

                    {client.excessValueBRL > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-sans font-bold text-rose-400 block">
                          Excesso Fiduciário
                        </span>
                        <span className="text-base font-black text-rose-400">
                          R$ {(client.excessValueBRL / 1000).toFixed(0)}k
                        </span>
                      </div>
                    )}

                    {/* Health Score Gauge */}
                    <div className="text-right min-w-[70px]">
                      <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">
                        Health Score
                      </span>
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={`text-xl font-black ${
                          client.healthScore < 65
                            ? 'text-rose-400'
                            : client.healthScore < 80
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}>
                          {client.healthScore}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">/100</span>
                      </div>
                      {/* Mini bar */}
                      <div className="w-16 bg-slate-900 h-1.5 rounded-full overflow-hidden mt-0.5 border border-white/[0.08]">
                        <div
                          className={`h-full rounded-full ${
                            client.healthScore < 65
                              ? 'bg-rose-500'
                              : client.healthScore < 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${client.healthScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Executive Quick Actions */}
                  <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.06] shrink-0">
                    <button
                      onClick={() => onStartRebalance(client.portfolioId)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      title="Abrir simulação de rebalanceamento fiduciário para zerar a infração"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Rebalancear</span>
                    </button>

                    <button
                      onClick={() => handleEscalateToManager(client)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1.5 cursor-pointer"
                      title="Disparar notificação executiva de SLA ao sócio responsável"
                    >
                      <Send className="w-3 h-3" />
                      <span>Acionar Sócio</span>
                    </button>

                    <button
                      onClick={() => handleToggleExpand(client.portfolioId)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-white/[0.08] transition cursor-pointer"
                      title={isExpanded ? 'Recolher diagnóstico' : 'Expandir raio-x fiduciário dos 8 fatores'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* -------------------------------------------------------- */}
                {/* 5. EXPANDED VIEW: 8-FACTOR HEALTH SCORE BREAKDOWN        */}
                {/* -------------------------------------------------------- */}
                {isExpanded && client.factors && (
                  <div className="px-5 pb-5 pt-2 border-t border-white/[0.08] bg-slate-950/90 space-y-4 animate-in fade-in duration-200">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                          Raio-X Executivo dos 8 Fatores Fiduciários
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Matriz proprietária de governança FlowCore
                        </span>
                      </div>

                      {/* 8-Factor Tiles Bento Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mt-3">
                        {/* 1. Compliance */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Compliance CVM</span>
                          <span className={`text-sm font-black font-mono ${client.factors.compliance < 65 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {client.factors.compliance}
                          </span>
                          <span className="text-[9px] text-slate-500 block">Res. CVM 175</span>
                        </div>

                        {/* 2. Concentração */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Concentração</span>
                          <span className={`text-sm font-black font-mono ${client.factors.concentration < 65 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {client.factors.concentration}
                          </span>
                          <span className="text-[9px] text-slate-500 block">Teto Emissor</span>
                        </div>

                        {/* 3. Liquidez */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Liquidez</span>
                          <span className={`text-sm font-black font-mono ${client.factors.liquidity < 65 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {client.factors.liquidity}
                          </span>
                          <span className="text-[9px] text-slate-500 block">Caixa D+0</span>
                        </div>

                        {/* 4. Portfolio */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Mandato IPS</span>
                          <span className={`text-sm font-black font-mono ${client.factors.portfolio < 65 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {client.factors.portfolio}
                          </span>
                          <span className="text-[9px] text-slate-500 block">Aderência</span>
                        </div>

                        {/* 5. Relacionamento */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Relacionamento</span>
                          <span className="text-sm font-black font-mono text-emerald-400">
                            {client.factors.relationship}
                          </span>
                          <span className="text-[9px] text-slate-500 block">SLA Contato</span>
                        </div>

                        {/* 6. Engajamento */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Engajamento</span>
                          <span className={`text-sm font-black font-mono ${client.factors.engagement < 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {client.factors.engagement}
                          </span>
                          <span className="text-[9px] text-slate-500 block">Comitês</span>
                        </div>

                        {/* 7. Operações */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Operações</span>
                          <span className="text-sm font-black font-mono text-emerald-400">
                            {client.factors.operations}
                          </span>
                          <span className="text-[9px] text-slate-500 block">Suitability CVM</span>
                        </div>

                        {/* 8. Oportunidades */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Oportunidades</span>
                          <span className="text-sm font-black font-mono text-cyan-300">
                            {client.factors.opportunities}
                          </span>
                          <span className="text-[9px] text-slate-500 block">Novos Aportes</span>
                        </div>
                      </div>
                    </div>

                    {/* Executive Prescriptive Guidance Card using AIInsightCard Architecture */}
                    {(() => {
                      const clientAlert = alerts.find((a) => a.portfolioId === client.portfolioId);
                      return (
                        <div className="pt-2">
                          <AIInsightCard
                            id={`client-insight-${client.portfolioId}`}
                            insight={{
                              what: isCritical
                                ? `Conta em estado crítico por estouro de ${client.primaryIssue} na carteira ${client.portfolioName}. Patrimônio sob risco de R$ ${(client.totalAum / 1000000).toFixed(2)}M.`
                                : `Posição com proximidade no limite regulatório em ${client.primaryIssue}. Monitoramento de risco preventivo ativo.`,
                              why:
                                clientAlert?.aiExplanation?.why ||
                                `Oscilações de cotações na B3 e ausência de rebalanceamento sistemático nos últimos ${
                                  client.factors.engagement < 60 ? '60+' : '30'
                                } dias com score de engajamento em ${client.factors.engagement}/100.`,
                              impact: isCritical
                                ? 'Risco fiduciário de desenquadramento compulsório e descumprimento de dever de diligência regulatória perante Resolução CVM 175.'
                                : 'Risco de arrasto de rentabilidade e aproximação perigosa da banda de tolerância do mandato bilateral do cliente.',
                              action: isCritical
                                ? `Executar o plano de rebalanceamento pré-validado no simulador e agendar alinhamento fiduciário com o titular ${client.clientName}.`
                                : 'Direcionar os próximos fluxos de proventos e amortizações para recomposição da folga de segurança sem giro desnecessário.',
                              confidence: isCritical ? 97 : 91,
                              source: clientAlert?.ruleSource
                                ? `${clientAlert.ruleSource} • Política ${clientAlert.policyId} • Resolução CVM 175`
                                : 'Matriz Multidimensional de Risco Fiduciário FlowCore • CVM 175',
                            }}
                            title={`Parecer Prescritivo de Risco • ${client.clientName}`}
                            subtitle={`Nível: ${client.status} • Health Score: ${client.healthScore}/100 • AUM: R$ ${(client.totalAum / 1000000).toFixed(2)}M`}
                            category={isCritical ? 'COMPLIANCE' : 'RISK'}
                            severity={isCritical ? 'CRITICAL' : 'WARNING'}
                            ruleSource={clientAlert?.ruleSource}
                            rule_source={clientAlert?.ruleSource}
                            policyId={clientAlert?.policyId}
                            policy_id={clientAlert?.policyId}
                            limit={clientAlert?.limit}
                            currentValue={clientAlert?.currentValue}
                            current_value={clientAlert?.currentValue}
                            difference={clientAlert?.difference}
                            mandateVsInternalExplanation={clientAlert?.mandateVsInternalExplanation}
                            portfolioName={client.portfolioName}
                            clientName={client.clientName}
                            onApplyAction={() => onStartRebalance(client.portfolioId)}
                            actionLabel="Executar Rebalanceamento"
                            secondaryActionLabel="Ver Carteira Completa"
                            onSecondaryAction={() => onSelectPortfolio(client.portfolioId)}
                            collapsible={true}
                            defaultExpanded={true}
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 6. COMPLIANCE & LEGAL NOTICE                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Diretrizes de Governança Fiduciária: Resolução CVM 175, Resolução CMN 4.963 e Código ANBIMA de Administração de Recursos de Terceiros.</span>
        </span>
        <span className="font-mono text-[11px] text-slate-500 shrink-0">
          Atualização Contínua em D+0
        </span>
      </div>
    </div>
  );
};

// Export also as ClientsAtRiskList for backward compatibility
export { ClientsAtRisk as ClientsAtRiskList };
export default ClientsAtRisk;
