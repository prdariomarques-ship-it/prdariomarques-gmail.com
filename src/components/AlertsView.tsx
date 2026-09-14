import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Sliders,
  ArrowUpRight,
  Check,
  Copy,
  FolderOpen,
  Scale,
  Info,
  BookOpen,
  AlertTriangle,
  Layers,
  Scroll,
  Building,
} from 'lucide-react';
import { ComplianceAlert, AssetClass, AiExplanation, RuleSource } from '../types';
import { ComplianceAlertCard } from './common/ComplianceAlertCard';

interface AlertsViewProps {
  alerts: ComplianceAlert[];
  onStartRebalance: (portfolioId: string) => void;
  onSelectPortfolio: (portfolioId: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onStartRebalance,
  onSelectPortfolio,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [ruleSourceFilter, setRuleSourceFilter] = useState<'ALL' | RuleSource>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((alert) => {
    const effectiveRuleSource = alert.rule_source ?? alert.ruleSource;
    const effectivePolicyId = alert.policy_id ?? alert.policyId;

    if (severityFilter !== 'ALL' && alert.severity !== severityFilter) {
      return false;
    }
    if (ruleSourceFilter !== 'ALL' && effectiveRuleSource !== ruleSourceFilter) {
      return false;
    }
    if (classFilter !== 'ALL' && alert.assetClass !== classFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchesName = alert.portfolioName.toLowerCase().includes(q);
      const matchesClient = alert.clientName.toLowerCase().includes(q);
      const matchesClass = alert.assetClass.toLowerCase().includes(q);
      const matchesPolicy = (effectivePolicyId || '').toLowerCase().includes(q);
      const matchesRule = (effectiveRuleSource || '').toLowerCase().includes(q);
      if (!matchesName && !matchesClient && !matchesClass && !matchesPolicy && !matchesRule) {
        return false;
      }
    }
    return true;
  });

  const handleCopyMemo = (alert: ComplianceAlert) => {
    const effectiveRuleSource = alert.rule_source ?? alert.ruleSource;
    const effectivePolicyId = alert.policy_id ?? alert.policyId;
    const effectiveCurrentValue = alert.current_value ?? alert.currentValue;

    const text = `PARECER DE DESENQUADRAMENTO FIDUCIÁRIO - FlowCore
Carteira: ${alert.portfolioName} (${alert.clientName})
Classe Afetada: ${alert.assetClass}
rule_source: ${effectiveRuleSource}
policy_id: ${effectivePolicyId}
limit: ${alert.limit.toFixed(1)}% | current_value: ${effectiveCurrentValue.toFixed(1)}%
Desvio: +${alert.difference.toFixed(1)} p.p. | Tolerância: ${alert.tolerancePP.toFixed(1)} p.p. | Severidade: ${alert.severity}
Excesso Financeiro em Risco: R$ ${alert.excessValueBRL.toLocaleString('pt-BR')}
Volume Sugerido para Rebalancear: R$ ${alert.recommendedTradeValue.toLocaleString('pt-BR')}

CONTEXTO FIDUCIÁRIO (MANDATO DO CLIENTE vs. POLÍTICA INTERNA):
${alert.mandateVsInternalExplanation || (effectiveRuleSource === 'MANDATO_CLIENTE' ? 'Mandato do Cliente: Contrato bilateral de alocação individual com dever fiduciário estrito.' : 'Política Interna: Diretriz prudencial do Comitê de Risco e Governança da Gestora.')}

Diagnóstico Operacional:
${alert.message}

Ação Prescritiva:
${alert.suggestedAction}`;

    navigator.clipboard.writeText(text);
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;
  const mandateCount = alerts.filter((a) => (a.rule_source ?? a.ruleSource) === 'MANDATO_CLIENTE').length;
  const internalCount = alerts.filter((a) => (a.rule_source ?? a.ruleSource) === 'POLITICA_INTERNA').length;
  const regulatoryCount = alerts.filter((a) => (a.rule_source ?? a.ruleSource) === 'REGRA_REGULATORIA').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              Central de Alertas & Desenquadramentos
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Avaliação contínua com segregação explícita entre <strong className="text-purple-300">Mandato do Cliente</strong> (IPS bilateral), <strong className="text-indigo-300">Política Interna</strong> (Governança da Casa) e <strong className="text-rose-300">Regras Regulatórias CVM 175</strong>.
            </p>
          </div>

          {/* Interactive Stat Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSeverityFilter(severityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                severityFilter === 'CRITICAL'
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
              }`}
            >
              🔴 {criticalCount} Críticos (&gt; 5 p.p.)
            </button>
            <button
              onClick={() => setSeverityFilter(severityFilter === 'WARNING' ? 'ALL' : 'WARNING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                severityFilter === 'WARNING'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
              }`}
            >
              🟡 {warningCount} Em Atenção (≤ 5 p.p.)
            </button>
            <button
              onClick={() => setRuleSourceFilter(ruleSourceFilter === 'MANDATO_CLIENTE' ? 'ALL' : 'MANDATO_CLIENTE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 ${
                ruleSourceFilter === 'MANDATO_CLIENTE'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                  : 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25'
              }`}
              title="Filtrar violações de mandato bilateral do cliente (IPS)"
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>{mandateCount} Mandato Cliente</span>
            </button>
            <button
              onClick={() => setRuleSourceFilter(ruleSourceFilter === 'POLITICA_INTERNA' ? 'ALL' : 'POLITICA_INTERNA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 ${
                ruleSourceFilter === 'POLITICA_INTERNA'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                  : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
              }`}
              title="Filtrar desvios de política prudencial interna da gestora"
            >
              <Building className="w-3.5 h-3.5" />
              <span>{internalCount} Política Interna</span>
            </button>
          </div>
        </div>

        {/* Informative Distinction Banner */}
        <div className="mt-4 p-3 bg-slate-950/70 rounded-xl border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <Scale className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="leading-snug">
              <strong className="text-white">Diferença de Governança:</strong> O <strong className="text-purple-300">Mandato do Cliente</strong> é contratual bilateral (violação atinge o titular). A <strong className="text-indigo-300">Política Interna</strong> é diretriz do Comitê de Risco (mitigação institucional).
            </span>
          </div>
          <div className="flex items-center space-x-2 shrink-0 text-[11px] font-mono">
            <span className="text-slate-400">campos ativos:</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">rule_source</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">policy_id</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">limit</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">current_value</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por carteira, cliente, classe ou policy_id..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Severity, Rule Source & Class Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Rule Source Filter */}
            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">rule_source:</span>
              <select
                value={ruleSourceFilter}
                onChange={(e) => setRuleSourceFilter(e.target.value as any)}
                className="bg-slate-950/70 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="ALL">Todas as Fontes</option>
                <option value="MANDATO_CLIENTE">MANDATO_CLIENTE</option>
                <option value="POLITICA_INTERNA">POLITICA_INTERNA</option>
                <option value="REGRA_REGULATORIA">REGRA_REGULATORIA</option>
                <option value="SUITABILITY">SUITABILITY</option>
              </select>
            </div>

            {/* Severity filter buttons */}
            <div className="flex items-center space-x-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setSeverityFilter('ALL')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  severityFilter === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({alerts.length})
              </button>
              <button
                onClick={() => setSeverityFilter('CRITICAL')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  severityFilter === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🔴 Crítico ({criticalCount})
              </button>
              <button
                onClick={() => setSeverityFilter('WARNING')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  severityFilter === 'WARNING'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🟡 Atenção ({warningCount})
              </button>
            </div>

            {/* Asset Class Filter */}
            <div className="flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-slate-950/70 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todas as Classes</option>
                <option value="Renda Variável">Renda Variável</option>
                <option value="Renda Fixa">Renda Fixa</option>
                <option value="Internacional">Internacional</option>
                <option value="Multimercado">Multimercado</option>
                <option value="Caixa">Caixa</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">Nenhum alerta localizado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Não foram encontrados alertas com os filtros selecionados. Tente ajustar o texto de busca ou o filtro de fonte normativa.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredAlerts.map((alert) => (
            <ComplianceAlertCard
              key={alert.id}
              alert={alert}
              onSelectPortfolio={onSelectPortfolio}
              onStartRebalance={onStartRebalance}
              onCopyMemo={handleCopyMemo}
              isCopied={copiedId === alert.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
