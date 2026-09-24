import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  FolderOpen,
  User,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  Download,
  Activity,
  Target,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { Portfolio, AssetClass } from '../types';
import { TabKey } from './Header';
import { AssetPerformancePanel } from './common/AssetPerformancePanel';
import { PortfolioHealth } from './PortfolioHealth';
import { RebalanceSimulationModal } from './RebalanceSimulationModal';
import { RiskAnalytics } from './RiskAnalytics';
import { StressTestModal } from './StressTestModal';
import { AssetDriftTrendBadge } from './common/AssetDriftTrendBadge';
import { getAssetStrategicTarget, calculateAssetDrift } from '../utils/assetDrift';

interface PortfoliosViewProps {
  portfolios: Portfolio[];
  selectedPortfolioId: string;
  onSelectPortfolio: (id: string) => void;
  onStartRebalance: (portfolioId: string) => void;
  onOpenAgentWithPortfolio: (portfolioId: string) => void;
  onNavigateTab?: (tab: TabKey) => void;
}

export const PortfoliosView: React.FC<PortfoliosViewProps> = ({
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  onStartRebalance,
  onOpenAgentWithPortfolio,
  onNavigateTab,
}) => {
  const currentPortfolio =
    portfolios.find((p) => p.id === selectedPortfolioId) || portfolios[0];
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [isRebalanceModalOpen, setIsRebalanceModalOpen] = useState(false);
  const [isStressTestModalOpen, setIsStressTestModalOpen] = useState(false);
  const [filterDriftOnly, setFilterDriftOnly] = useState(false);

  // Helper to calculate actual totals by class
  const classTotals: Record<string, number> = {
    'Renda Fixa': 0,
    'Renda Variável': 0,
    'Internacional': 0,
    'Multimercado': 0,
    'Caixa': 0,
  };

  if (currentPortfolio) {
    for (const a of currentPortfolio.assets) {
      if (classTotals[a.assetClass] !== undefined) {
        classTotals[a.assetClass] += a.totalValue;
      }
    }
  }

  const totalVal = currentPortfolio ? currentPortfolio.assets.reduce((s, a) => s + a.totalValue, 0) : 0;

  const handleDownloadReport = () => {
    if (!currentPortfolio) return;

    const lines = [
      `RELATÓRIO DE CONFORMIDADE DA CARTEIRA`,
      `=====================================`,
      `Data do Relatório: ${new Date().toLocaleDateString('pt-BR')}`,
      ``,
      `[ DADOS DO CLIENTE ]`,
      `Nome: ${currentPortfolio.clientName}`,
      `Código: ${currentPortfolio.code}`,
      `Gestor Responsável: ${currentPortfolio.manager}`,
      `Perfil: ${currentPortfolio.profile}`,
      `Benchmark: ${currentPortfolio.benchmark}`,
      ``,
      `[ RESUMO FINANCEIRO ]`,
      `AUM (Patrimônio Total): R$ ${currentPortfolio.totalAum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `Último Rebalanceamento: ${currentPortfolio.lastRebalanced}`,
      `Status de Conformidade: ${currentPortfolio.status === 'CRITICAL' ? 'DESENQUADRADA' : currentPortfolio.status === 'WARNING' ? 'EM ATENÇÃO' : 'CONFORME (ENQUADRADA)'}`,
      ``,
      `[ ALOCAÇÃO ATUAL VS MANDATO (IPS) ]`
    ];

    currentPortfolio.mandateLimits.forEach(limit => {
      const actualVal = classTotals[limit.assetClass] || 0;
      const actualPct = totalVal > 0 ? (actualVal / totalVal) * 100 : 0;
      
      const dev = actualPct - limit.targetPercent;
      let status = 'Normal';
      if (actualPct > limit.maxPercent) status = 'Acima do Teto';
      if (actualPct < limit.minPercent) status = 'Abaixo do Piso';

      lines.push(`- ${limit.assetClass}:`);
      lines.push(`  Alocação Real: ${actualPct.toFixed(2)}% (R$ ${actualVal.toLocaleString('pt-BR')})`);
      lines.push(`  Limites do Mandato: Mínimo ${limit.minPercent}% | Target ${limit.targetPercent}% | Máximo ${limit.maxPercent}%`);
      lines.push(`  Desvio do Target: ${dev > 0 ? '+' : ''}${dev.toFixed(2)} p.p.`);
      lines.push(`  Status: ${status}`);
    });

    lines.push(``);
    lines.push(`Gerado por: FlowCore Compliance System`);

    const textContent = lines.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FlowCore_Relatorio_${currentPortfolio.code}_${new Date().toISOString().slice(0, 10)}.txt`;
    
    // Fallback for copy to clipboard if possible, but mainly download it
    navigator.clipboard.writeText(textContent).catch(() => {});

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Selector Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Selecione a Carteira para Auditoria
          </span>
          <span className="text-xs text-slate-500">
            {portfolios.length} carteiras cadastradas
          </span>
        </div>

        <div className="flex overflow-x-auto pb-4 pt-1 snap-x snap-mandatory gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:pb-0 sm:pt-0 hide-scrollbar">
          {portfolios.map((p) => {
            const isSelected = p.id === currentPortfolio?.id;
            const isCrit = p.status === 'CRITICAL';
            const isWarn = p.status === 'WARNING';

            return (
              <button
                key={p.id}
                onClick={() => onSelectPortfolio(p.id)}
                className={`w-[85vw] sm:w-auto shrink-0 snap-center p-3.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{p.clientName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {p.profile} • R$ {(p.totalAum / 1000000).toFixed(2)}M
                  </p>
                </div>

                <span
                  className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded ${
                    isCrit
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : isWarn
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isCrit ? '🔴 CRÍTICO' : isWarn ? '🟡 ATENÇÃO' : '🟢 NORMAL'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {currentPortfolio && (
        <div className="space-y-6">
          {/* Portfolio Health Summary Component */}
          <PortfolioHealth portfolio={currentPortfolio} />

          {/* Portfolio Header Details Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-white">{currentPortfolio.name}</h2>
                  <span
                    className={`px-3 py-0.5 text-xs font-bold rounded-full ${
                      currentPortfolio.status === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : currentPortfolio.status === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {currentPortfolio.status === 'CRITICAL'
                      ? '🔴 DESENQUADRADA'
                      : currentPortfolio.status === 'WARNING'
                      ? '🟡 EM ATENÇÃO'
                      : '🟢 CONFORME (ENQUADRADA)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Código: <strong className="text-slate-300">{currentPortfolio.code}</strong> • Cliente:{' '}
                  <strong className="text-slate-300">{currentPortfolio.clientName}</strong> • Gestor:{' '}
                  <strong className="text-slate-300">{currentPortfolio.manager}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={handleDownloadReport}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Relatório</span>
                </button>
                <button
                  onClick={() => setIsStressTestModalOpen(true)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Stress Test CVM</span>
                </button>
                <button
                  onClick={() => onOpenAgentWithPortfolio(currentPortfolio.id)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auditar com IA</span>
                </button>
                <button
                  onClick={() => setIsRebalanceModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Simulador de Rebalanceamento</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Patrimônio Total (AUM)</span>
                <strong className="text-white text-base font-bold">
                  R$ {currentPortfolio.totalAum.toLocaleString('pt-BR')}
                </strong>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Perfil de Risco (IPS)</span>
                <strong className="text-cyan-400 text-base font-bold">
                  {currentPortfolio.profile}
                </strong>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Benchmark de Referência</span>
                <strong className="text-white text-base font-bold">
                  {currentPortfolio.benchmark}
                </strong>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Último Rebalanceamento</span>
                <strong className="text-slate-300 text-base font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {currentPortfolio.lastRebalanced}
                </strong>
              </div>
            </div>
          </div>

          {/* Allocation vs Mandate Limits Table & Bars */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Alocação por Classe vs Limites do Mandato (IPS)
              </h3>
              <p className="text-xs text-slate-300">
                Comparativo direto dos limites regulatórios mínimos, meta (target) e teto máximo tolerado.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/90 text-slate-200 uppercase tracking-wider text-[11px] font-semibold border-y border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Classe de Ativo</th>
                    <th className="py-2.5 px-3 text-right">Valor Atual (R$)</th>
                    <th className="py-2.5 px-3 text-right">Alocação Real</th>
                    <th className="py-2.5 px-3 text-right">Mínimo</th>
                    <th className="py-2.5 px-3 text-right">Meta (Target)</th>
                    <th className="py-2.5 px-3 text-right">Teto Máximo</th>
                    <th className="py-2.5 px-3 text-right">Desvio p.p.</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {currentPortfolio.mandateLimits.map((limit) => {
                    const actualVal = classTotals[limit.assetClass] || 0;
                    const actualPct = totalVal > 0 ? (actualVal / totalVal) * 100 : 0;
                    let dev = 0;
                    let statusColor = 'text-emerald-400';
                    let badgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                    let statusLabel = '🟢 Normal';

                    if (actualPct > limit.maxPercent) {
                      dev = actualPct - limit.maxPercent;
                      if (dev > 5.0) {
                        statusColor = 'text-rose-400 font-bold';
                        badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                        statusLabel = '🔴 Desenquadrado';
                      } else {
                        statusColor = 'text-amber-400 font-bold';
                        badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                        statusLabel = '🟡 Atenção';
                      }
                    } else if (actualPct < limit.minPercent) {
                      dev = actualPct - limit.minPercent;
                      if (Math.abs(dev) > 5.0) {
                        statusColor = 'text-rose-400 font-bold';
                        badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                        statusLabel = '🔴 Subalocado';
                      } else {
                        statusColor = 'text-amber-400 font-bold';
                        badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                        statusLabel = '🟡 Abaixo';
                      }
                    }

                    return (
                      <tr key={limit.assetClass} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-semibold text-white">
                          {limit.assetClass}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-200">
                          R$ {actualVal.toLocaleString('pt-BR')}
                        </td>
                        <td className={`py-3 px-3 text-right ${statusColor}`}>
                          {actualPct.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300 font-medium">
                          {limit.minPercent}%
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-200">
                          {limit.targetPercent}%
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300 font-medium">
                          {limit.maxPercent}%
                        </td>
                        <td className={`py-3 px-3 text-right ${statusColor}`}>
                          {dev > 0 ? `+${dev.toFixed(1)} p.p.` : dev < 0 ? `${dev.toFixed(1)} p.p.` : '0.0 p.p.'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${badgeClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Analytics */}
          <RiskAnalytics portfolio={currentPortfolio} />

          {/* Holdings Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            {/* Asset Drift Calculation & Banner */}
            {(() => {
              const driftItems = currentPortfolio.assets.map((asset) => {
                const target = getAssetStrategicTarget(asset, currentPortfolio);
                const diff = Number((asset.allocationPercent - target).toFixed(2));
                const isDrift = Math.abs(diff) > 2.5;
                return { asset, target, diff, isDrift };
              });
              const driftedCount = driftItems.filter((i) => i.isDrift).length;

              return (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-cyan-400" />
                        Composição dos Ativos em Carteira ({currentPortfolio.assets.length})
                      </h3>
                      <p className="text-xs text-slate-300">
                        Custódia de títulos públicos, ações, ETFs, FIIs e fundos de investimento com monitor de drift tático.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {driftedCount > 0 && (
                        <button
                          onClick={() => setFilterDriftOnly(!filterDriftOnly)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            filterDriftOnly
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                          }`}
                          title="Filtrar apenas ativos com desvio da meta superior a 2.5%"
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>{filterDriftOnly ? 'Ver Todos' : `Apenas Drift > 2.5% (${driftedCount})`}</span>
                        </button>
                      )}

                      {onNavigateTab && (
                        <button
                          onClick={() => onNavigateTab('asset-drift')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>Monitor Completo</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  {driftedCount > 0 && !filterDriftOnly && (
                    <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-amber-200">
                          <strong>Alerta Preventivo de Asset Drift:</strong> {driftedCount} {driftedCount === 1 ? 'ativo excede' : 'ativos excedem'} o corredor de tolerância tática de <strong>±2.5% p.p.</strong> em relação à meta estratégica, antes de violar os limites críticos de compliance.
                        </span>
                      </div>
                      <button
                        onClick={() => setFilterDriftOnly(true)}
                        className="text-amber-300 hover:text-white underline font-bold shrink-0 text-[11px] cursor-pointer"
                      >
                        Filtrar ({driftedCount})
                      </button>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/90 text-slate-200 uppercase tracking-wider text-[11px] font-semibold border-y border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Ticker / Código</th>
                    <th className="py-2.5 px-3">Nome do Ativo</th>
                    <th className="py-2.5 px-3">Classe</th>
                    <th className="py-2.5 px-3 text-right">Quantidade</th>
                    <th className="py-2.5 px-3 text-right">Preço Unitário</th>
                    <th className="py-2.5 px-3 text-right">Valor Total (R$)</th>
                    <th className="py-2.5 px-3 text-right">Peso Atual</th>
                    <th className="py-2.5 px-3 text-right">Meta (Target)</th>
                    <th className="py-2.5 px-3 text-center">Drift Tático (Tendência)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {currentPortfolio.assets
                    .filter((asset) => {
                      if (!filterDriftOnly) return true;
                      const target = getAssetStrategicTarget(asset, currentPortfolio);
                      const diff = Math.abs(asset.allocationPercent - target);
                      return diff > 2.5;
                    })
                    .map((asset) => {
                      const targetPercent = getAssetStrategicTarget(asset, currentPortfolio);
                      const diff = asset.allocationPercent - targetPercent;
                      const isDrift = Math.abs(diff) > 2.5;

                      return (
                        <React.Fragment key={asset.id}>
                        <tr 
                          className={`hover:bg-slate-800/40 transition cursor-pointer ${
                            isDrift ? 'bg-amber-950/10' : ''
                          }`}
                          onClick={() => setExpandedAssetId(expandedAssetId === asset.id ? null : asset.id)}
                        >
                          <td className="py-2.5 px-3 font-bold text-white">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-mono">
                              {asset.ticker}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-200 font-medium">
                            {asset.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-medium">
                            {asset.assetClass}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-200 font-mono">
                            {asset.quantity !== undefined ? asset.quantity.toLocaleString('pt-BR') : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-200 font-mono">
                            {asset.currentPrice !== undefined ? `R$ ${asset.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-white font-mono">
                            R$ {asset.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white font-mono">
                            {asset.allocationPercent.toFixed(2)}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-indigo-300 font-mono">
                            {targetPercent.toFixed(2)}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <AssetDriftTrendBadge
                              currentPercent={asset.allocationPercent}
                              targetPercent={targetPercent}
                              tolerancePP={2.5}
                              size="sm"
                            />
                          </td>
                        </tr>
                        {expandedAssetId === asset.id && (
                          <tr className="bg-slate-900/50">
                            <td colSpan={9} className="p-0 border-b border-white/[0.05]">
                              <AssetPerformancePanel asset={asset} />
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {currentPortfolio && (
        <RebalanceSimulationModal
          isOpen={isRebalanceModalOpen}
          onClose={() => setIsRebalanceModalOpen(false)}
          portfolio={currentPortfolio}
        />
      )}

      {currentPortfolio && (
        <StressTestModal
          isOpen={isStressTestModalOpen}
          onClose={() => setIsStressTestModalOpen(false)}
          portfolio={currentPortfolio}
        />
      )}
    </div>
  );
};
