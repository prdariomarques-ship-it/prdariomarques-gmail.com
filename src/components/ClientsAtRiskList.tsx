import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Sliders,
  ChevronRight,
  TrendingDown,
  ArrowRight,
  User,
  Clock,
  CheckCircle2,
  Filter,
  ChevronDown,
  Layers,
  Activity,
  HeartPulse,
  Info,
} from 'lucide-react';
import { Portfolio, ComplianceAlert, ClientRiskProfile, HealthScoreFactors } from '../types';

interface ClientsAtRiskListProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  onSelectPortfolio: (id: string) => void;
  onStartRebalance: (portfolioId: string) => void;
}

export const ClientsAtRiskList: React.FC<ClientsAtRiskListProps> = ({
  portfolios,
  alerts,
  onSelectPortfolio,
  onStartRebalance,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [sortBy, setSortBy] = useState<'SCORE_ASC' | 'AUM_DESC'>('SCORE_ASC');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Derive client risk profiles dynamically with the 8 independent factors
  const clientRiskProfiles: ClientRiskProfile[] = portfolios
    .map((port) => {
      const portAlerts = alerts.filter((a) => a.portfolioId === port.id);
      const criticalAlerts = portAlerts.filter((a) => a.severity === 'CRITICAL');
      const warningAlerts = portAlerts.filter((a) => a.severity === 'WARNING');

      let primaryIssue = 'Alocação em conformidade';
      let maxDeviation = 0;
      let totalExcessBRL = 0;

      if (portAlerts.length > 0) {
        const sortedAlerts = [...portAlerts].sort((a, b) => b.deviationPP - a.deviationPP);
        const worst = sortedAlerts[0];
        primaryIssue = `${worst.assetClass} (+${worst.deviationPP.toFixed(1)} p.p.)`;
        maxDeviation = worst.deviationPP;
        totalExcessBRL = portAlerts.reduce((s, a) => s + a.excessValueBRL, 0);
      }

      // 8 FATORES INDEPENDENTES DO HEALTH SCORE
      // 1. Compliance: aderência formal a mandatos e limites CVM
      const complianceScore = criticalAlerts.length > 0
        ? Math.max(30, Math.round(60 - maxDeviation * 2.5))
        : warningAlerts.length > 0
        ? Math.max(65, Math.round(85 - maxDeviation * 3.0))
        : 98;

      // 2. Concentração: peso do maior ativo individual
      const maxAssetWeight = port.assets.length > 0
        ? Math.max(...port.assets.map((a) => (a.totalValue / (port.totalAum || 1)) * 100))
        : 10;
      const concentrationScore = maxAssetWeight > 30
        ? Math.max(40, Math.round(100 - (maxAssetWeight - 30) * 3))
        : maxAssetWeight > 20
        ? 78
        : 95;

      // 3. Liquidez: parcela em caixa e ativos D+0 / D+1
      const cashAsset = port.assets.find((a) => a.assetClass === 'Caixa');
      const cashPct = cashAsset && port.totalAum > 0 ? (cashAsset.totalValue / port.totalAum) * 100 : 0;
      const liquidityScore = cashPct < 2 ? 55 : cashPct < 5 ? 75 : 92;

      // 4. Portfolio: aderência ao benchmark da carteira
      const portfolioScore = port.status === 'CRITICAL' ? 62 : port.status === 'WARNING' ? 78 : 94;

      // 5. Relacionamento: contato proativo e NPS do titular
      const relationshipScore = port.id === 'port-001' ? 88 : port.id === 'port-004' ? 64 : 85;

      // 6. Engajamento: presença em reuniões de comitê e leitura de relatórios mensais
      const engagementScore = port.id === 'port-004' ? 60 : port.id === 'port-002' ? 90 : 82;

      // 7. Operações: cadastro em dia, suitability CVM 30 atualizado
      const operationsScore = port.id === 'port-004' ? 68 : 96;

      // 8. Oportunidades: potencial de captação adicional e alocação de proventos
      const opportunitiesScore = port.totalAum > 15000000 ? 90 : 75;

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

      // Média ponderada com ênfase em compliance e governança fiduciária
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
      };
    })
    .filter((c) => c.status !== 'NORMAL');

  // Filter
  const filteredClients = clientRiskProfiles.filter((c) => {
    if (filterMode === 'CRITICAL') return c.status === 'CRITICAL';
    if (filterMode === 'WARNING') return c.status === 'WARNING';
    return true;
  });

  // Sort
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortBy === 'SCORE_ASC') {
      return a.healthScore - b.healthScore;
    } else {
      return b.totalAum - a.totalAum;
    }
  });

  const criticalCount = clientRiskProfiles.filter((c) => c.status === 'CRITICAL').length;
  const warningCount = clientRiskProfiles.filter((c) => c.status === 'WARNING').length;
  const totalAumAtRisk = clientRiskProfiles.reduce((s, c) => s + c.totalAum, 0);

  const getScoreColor = (score: number) => {
    if (score < 65) {
      return {
        bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        bar: 'bg-gradient-to-r from-rose-600 to-rose-400',
        text: 'text-rose-400',
        dot: 'bg-rose-400',
        glow: 'shadow-[0_0_12px_rgba(244,63,94,0.35)]',
        label: 'Crítico',
      };
    }
    if (score < 85) {
      return {
        bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        bar: 'bg-gradient-to-r from-amber-600 to-amber-400',
        text: 'text-amber-400',
        dot: 'bg-amber-400',
        glow: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]',
        label: 'Atenção',
      };
    }
    return {
      bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      bar: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      glow: '',
      label: 'Saudável',
    };
  };

  const getFactorColor = (val: number) => {
    if (val < 65) return 'text-rose-400';
    if (val < 80) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-b from-slate-800/70 via-slate-900/80 to-slate-950/90 border border-white/[0.09] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_12px_32px_rgba(0,0,0,0.35)] space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 backdrop-blur-md">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Clientes em Risco &amp; Health Score (8 Fatores)
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  Alta Exposição
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Avaliação multidimensional: Compliance, Concentração, Liquidez, Portfolio, Relacionamento, Engajamento, Operações e Oportunidades.
              </p>
            </div>
          </div>
        </div>

        {/* Aggregate Badges & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                filterMode === 'ALL'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({clientRiskProfiles.length})
            </button>
            <button
              onClick={() => setFilterMode('CRITICAL')}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                filterMode === 'CRITICAL'
                  ? 'bg-rose-500/25 text-rose-200 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔴 Críticos ({criticalCount})
            </button>
            <button
              onClick={() => setFilterMode('WARNING')}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                filterMode === 'WARNING'
                  ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🟡 Atenção ({warningCount})
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'SCORE_ASC' | 'AUM_DESC')}
            className="bg-slate-950/80 border border-white/[0.08] text-slate-200 text-[11px] font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 shadow-sm"
          >
            <option value="SCORE_ASC">Ordenar: Menor Health Score (Mais Crítico)</option>
            <option value="AUM_DESC">Ordenar: Maior Exposição (AUM)</option>
          </select>
        </div>
      </div>

      {/* Condensed List Feed */}
      {sortedClients.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-white/[0.06]">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h4 className="text-xs font-bold text-white">Nenhum cliente em risco com o filtro selecionado</h4>
          <p className="text-[11px] text-slate-400 mt-1">Todas as contas avaliadas estão dentro dos parâmetros de conformidade.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedClients.map((client) => {
            const scoreMeta = getScoreColor(client.healthScore);
            const isCritical = client.status === 'CRITICAL';
            const isHighExposure = client.totalAum >= 10000000;
            const isExpanded = expandedClientId === client.portfolioId;
            const factors = client.factors;

            return (
              <div
                key={client.portfolioId}
                className={`bg-slate-950/70 border rounded-xl transition-all duration-200 overflow-hidden ${
                  isCritical
                    ? 'border-rose-900/40 bg-gradient-to-r from-rose-950/20 via-slate-950/70 to-slate-950/70'
                    : 'border-white/[0.06]'
                }`}
              >
                {/* Main Client Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left: Health Score Indicator + Client Info */}
                  <div className="flex items-center space-x-3.5 min-w-0">
                    {/* Health Score Pill with Gauge */}
                    <div
                      className={`w-14 h-14 shrink-0 rounded-xl border flex flex-col items-center justify-center p-1 relative ${scoreMeta.bg} ${scoreMeta.glow}`}
                      title={`Health Score: ${client.healthScore}/100 (${scoreMeta.label})`}
                    >
                      <span className="text-base font-black font-mono tracking-tight leading-none">
                        {client.healthScore}
                      </span>
                      <span className="text-[8px] uppercase font-extrabold tracking-wider opacity-85 mt-0.5">
                        Score
                      </span>
                      <div className="w-9 bg-slate-950/60 h-1 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`${scoreMeta.bar} h-full rounded-full`}
                          style={{ width: `${client.healthScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Client & Portfolio Details */}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-white truncate">{client.clientName}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">({client.portfolioCode})</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">
                          {client.profile}
                        </span>
                        {isHighExposure && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            AUM &gt; R$ 10M
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border ${scoreMeta.badgeBg}`}>
                          {scoreMeta.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mt-1">
                        <span>Carteira: <strong className="text-slate-200">{client.portfolioName}</strong></span>
                        <span>•</span>
                        <span>Sócio Responsável: <strong className="text-slate-200">{client.manager}</strong></span>
                        {client.daysInBreach > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-rose-400 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 inline" />
                              {client.daysInBreach} dias em desenquadramento
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center / Right: Issue & Financial Exposure */}
                  <div className="flex items-center justify-between md:justify-end space-x-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
                    {/* Issue & Excess */}
                    <div className="text-left md:text-right">
                      <div className="text-[11px] font-semibold text-rose-300 flex items-center md:justify-end gap-1">
                        <span className={`w-2 h-2 rounded-full ${scoreMeta.dot} ${isCritical ? 'animate-pulse' : ''}`} />
                        <span>{client.primaryIssue}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Excesso: <strong className="text-white font-mono font-semibold">R$ {client.excessValueBRL.toLocaleString('pt-BR')}</strong>
                      </div>
                    </div>

                    {/* AUM Column */}
                    <div className="text-right pl-3 border-l border-white/[0.08]">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">AUM</div>
                      <div className="text-sm font-black text-white font-mono">
                        R$ {(client.totalAum / 1000000).toFixed(2)}M
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1.5 pl-2">
                      <button
                        onClick={() => setExpandedClientId(isExpanded ? null : client.portfolioId)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition border flex items-center gap-1 ${
                          isExpanded
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800/80 text-slate-300 hover:text-white border-white/[0.08]'
                        }`}
                        title="Inspecionar os 8 fatores do Health Score"
                      >
                        <HeartPulse className="w-3.5 h-3.5" />
                        <span>Fatores</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      <button
                        onClick={() => onSelectPortfolio(client.portfolioId)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium border border-white/[0.08] transition shadow-sm"
                        title="Ver carteira e ativos detalhados"
                      >
                        Ver Carteira
                      </button>

                      <button
                        onClick={() => onStartRebalance(client.portfolioId)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow-md transition flex items-center gap-1.5"
                        title="Abrir no Simulador de Rebalanceamento"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Rebalancear</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable 8-Factor Health Score Breakdown */}
                {isExpanded && factors && (
                  <div className="px-5 py-4 bg-slate-900/90 border-t border-white/[0.08] backdrop-blur-md space-y-3">
                    <div className="flex items-center justify-between text-xs border-b border-white/[0.06] pb-2">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-400" />
                        Diagnóstico Multidimensional de Saúde da Conta (8 Dimensões Independentes)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Score Geral Ponderado: <strong className="text-white font-mono">{client.healthScore}/100</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {/* Factor 1: Compliance */}
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/[0.06] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">1. Compliance</span>
                          <span className={`font-mono font-bold text-xs ${getFactorColor(factors.compliance)}`}>
                            {factors.compliance}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-rose-500 to-emerald-400 h-full rounded-full" style={{ width: `${factors.compliance}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          {factors.compliance < 60 ? 'Violação de teto CVM/IPS' : 'Mandato regular'}
                        </p>
                      </div>

                      {/* Factor 2: Concentração */}
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/[0.06] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">2. Concentração</span>
                          <span className={`font-mono font-bold text-xs ${getFactorColor(factors.concentration)}`}>
                            {factors.concentration}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full" style={{ width: `${factors.concentration}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          {factors.concentration < 75 ? 'Alta exposição em ativo topo' : 'Diversificação ótima'}
                        </p>
                      </div>

                      {/* Factor 3: Liquidez */}
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/[0.06] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">3. Liquidez</span>
                          <span className={`font-mono font-bold text-xs ${getFactorColor(factors.liquidity)}`}>
                            {factors.liquidity}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full" style={{ width: `${factors.liquidity}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Reserva operacional em caixa
                        </p>
                      </div>

                      {/* Factor 4: Portfolio */}
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/[0.06] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">4. Portfolio</span>
                          <span className={`font-mono font-bold text-xs ${getFactorColor(factors.portfolio)}`}>
                            {factors.portfolio}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full" style={{ width: `${factors.portfolio}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Aderência ao benchmark
                        </p>
                      </div>

                      {/* Factor 5: Relacionamento */}
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/[0.06] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">5. Relacionamento</span>
                          <span className={`font-mono font-bold text-xs ${getFactorColor(factors.relationship)}`}>
                            {factors.relationship}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full" style={{ width: `${factors.relationship}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Satisfação & contato com gestor
                        </p>
                      </div>

                      {/* Factor 6: Engajamento */}
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/[0.06] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">6. Engajamento</span>
                          <span className={`font-mono font-bold text-xs ${getFactorColor(factors.engagement)}`}>
                            {factors.engagement}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full" style={{ width: `${factors.engagement}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Abertura de relatórios & comitês
                        </p>
                      </div>

                      {/* Factor 7: Operações */}
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/[0.06] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">7. Operações</span>
                          <span className={`font-mono font-bold text-xs ${getFactorColor(factors.operations)}`}>
                            {factors.operations}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full rounded-full" style={{ width: `${factors.operations}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Suitability CVM 30 & custódia
                        </p>
                      </div>

                      {/* Factor 8: Oportunidades */}
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/[0.06] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">8. Oportunidades</span>
                          <span className={`font-mono font-bold text-xs ${getFactorColor(factors.opportunities)}`}>
                            {factors.opportunities}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full" style={{ width: `${factors.opportunities}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Potencial de novos aportes
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Condensed Bottom Footnote */}
      <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
        <span>
          Exposição acumulada sob atenção regulatória: <strong className="text-rose-300 font-mono font-bold">R$ {(totalAumAtRisk / 1000000).toFixed(2)}M</strong>
        </span>
        <span className="flex items-center space-x-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> 🔴 Crítico (&lt; 65)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 🟡 Atenção (65-84)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 🟢 Saudável (≥ 85)</span>
        </span>
      </div>
    </div>
  );
};
