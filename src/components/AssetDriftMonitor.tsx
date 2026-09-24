import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Download,
  ShieldAlert,
  Target,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Building2,
  DollarSign,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { Portfolio, AssetClass, Asset } from '../types';
import { TabKey } from './Header';
import {
  AssetDriftItem,
  analyzeAllPortfoliosDrift,
  calculateAssetDrift,
  getAssetStrategicTarget,
} from '../utils/assetDrift';
import { AssetDriftTrendBadge } from './common/AssetDriftTrendBadge';
import { RebalanceSimulationModal } from './RebalanceSimulationModal';

interface AssetDriftMonitorProps {
  portfolios: Portfolio[];
  onSelectPortfolio?: (portfolioId: string) => void;
  onNavigateTab?: (tab: TabKey) => void;
  onOpenAgentWithAsset?: (portfolioId: string, assetTicker: string, prompt: string) => void;
}

export const AssetDriftMonitor: React.FC<AssetDriftMonitorProps> = ({
  portfolios,
  onSelectPortfolio,
  onNavigateTab,
  onOpenAgentWithAsset,
}) => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('ALL');
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRIFT_ONLY' | 'OVERWEIGHT' | 'UNDERWEIGHT' | 'IN_TARGET'>('DRIFT_ONLY');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toleranceThreshold, setToleranceThreshold] = useState<number>(2.5); // Padrão: 2.5 p.p.
  const [activeViewMode, setActiveViewMode] = useState<'table' | 'cards'>('table');
  const [rebalancePortfolio, setRebalancePortfolio] = useState<Portfolio | null>(null);

  // Análise consolidada com a tolerância dinâmica
  const analysis = useMemo(() => {
    return analyzeAllPortfoliosDrift(portfolios, toleranceThreshold);
  }, [portfolios, toleranceThreshold]);

  // Itens filtrados
  const filteredItems = useMemo(() => {
    return analysis.allDriftItems.filter((item) => {
      // Filtro por Carteira
      if (selectedPortfolioId !== 'ALL' && item.portfolioId !== selectedPortfolioId) {
        return false;
      }
      // Filtro por Classe de Ativo
      if (selectedAssetClass !== 'ALL' && item.assetClass !== selectedAssetClass) {
        return false;
      }
      // Filtro por Status
      if (statusFilter === 'DRIFT_ONLY' && !item.isDriftAlert) {
        return false;
      }
      if (statusFilter === 'OVERWEIGHT' && item.driftPP <= toleranceThreshold) {
        return false;
      }
      if (statusFilter === 'UNDERWEIGHT' && item.driftPP >= -toleranceThreshold) {
        return false;
      }
      if (statusFilter === 'IN_TARGET' && item.isDriftAlert) {
        return false;
      }
      // Filtro de Busca
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTicker = item.ticker.toLowerCase().includes(q);
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesClient = item.clientName.toLowerCase().includes(q);
        const matchesSector = item.sector?.toLowerCase().includes(q);
        if (!matchesTicker && !matchesName && !matchesClient && !matchesSector) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => b.absDriftPP - a.absDriftPP); // Ordenar pelo maior desvio
  }, [analysis, selectedPortfolioId, selectedAssetClass, statusFilter, searchQuery, toleranceThreshold]);

  // Download do relatório de Asset Drift
  const handleExportCSV = () => {
    const headers = [
      'Carteira',
      'Cliente',
      'Ticker',
      'Nome do Ativo',
      'Classe',
      'Setor',
      'Valor Atual (R$)',
      'Alocacao Atual (%)',
      'Meta Estrategica (%)',
      'Desvio Tatico (p.p.)',
      'Direcao Tendencia',
      'Status Preventivo',
      'Delta Rebalanceamento (R$)',
      'Acao Sugerida',
    ];

    const rows = filteredItems.map((item) => [
      `"${item.portfolioName}"`,
      `"${item.clientName}"`,
      `"${item.ticker}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.assetClass}"`,
      `"${item.sector || ''}"`,
      item.currentValueBRL.toFixed(2),
      item.currentAllocationPercent.toFixed(2),
      item.targetPercent.toFixed(2),
      item.driftPP.toFixed(2),
      item.direction === 'UP' ? 'ALTA (Sobre-alocado)' : item.direction === 'DOWN' ? 'BAIXA (Sub-alocado)' : 'EM META',
      `"${item.statusLabel}"`,
      item.rebalanceDeltaBRL.toFixed(2),
      `"${item.actionSummary}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FlowCore_Asset_Drift_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenRebalance = (portfolioId: string) => {
    const target = portfolios.find((p) => p.id === portfolioId) || portfolios[0];
    setRebalancePortfolio(target);
  };

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Asset Drift Monitor</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                Alerta Antecipado: ±{toleranceThreshold.toFixed(1)}% p.p.
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Monitor de Desvio Tático &amp; Drift de Ativos
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mt-1">
              Identificação precoce de desalocação por ativo com ícones de tendência quando o peso atual se afasta mais de <strong className="text-amber-300">2.5%</strong> da meta estratégica — agindo preventivamente antes de atingir o limite crítico de compliance ou desenquadramento de mandato.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Exportar dados de Drift para CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Exportar CSV</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('portfolios')}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ver Carteiras</span>
              </button>
            )}
          </div>
        </div>

        {/* Resumo de KPIs do Monitor */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Ativos Monitorados</span>
              <Layers className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-xl font-black text-white font-mono">
              {analysis.totalAssetsCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Em {portfolios.length} carteiras</div>
          </div>

          <div className="bg-amber-950/20 rounded-xl p-3 border border-amber-800/40">
            <div className="flex items-center justify-between text-amber-300 text-xs mb-1">
              <span>Alertas de Drift</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300 font-mono flex items-center gap-1.5">
              <span>{analysis.totalDriftAlertsCount}</span>
              <span className="text-xs px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200">
                &gt; {toleranceThreshold}%
              </span>
            </div>
            <div className="text-[11px] text-amber-400/80 mt-0.5">Requerem ajuste</div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between text-emerald-300 text-xs mb-1">
              <span>Sobre-alocados</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono flex items-center gap-1">
              <span>+{analysis.totalOverweightCount}</span>
              <span className="text-[10px] text-emerald-500 font-normal">↗ Acima</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Drift &gt; +{toleranceThreshold}%</div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between text-cyan-300 text-xs mb-1">
              <span>Sub-alocados</span>
              <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-black text-cyan-400 font-mono flex items-center gap-1">
              <span>{analysis.totalUnderweightCount}</span>
              <span className="text-[10px] text-cyan-500 font-normal">↘ Abaixo</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Drift &lt; -{toleranceThreshold}%</div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Em Conformidade</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-slate-200 font-mono">
              {analysis.totalAssetsCount - analysis.totalDriftAlertsCount}
            </div>
            <div className="text-[11px] text-emerald-500/80 mt-0.5">Dentro de ±{toleranceThreshold}%</div>
          </div>

          <div className="bg-indigo-950/20 rounded-xl p-3 border border-indigo-800/40">
            <div className="flex items-center justify-between text-indigo-300 text-xs mb-1">
              <span>Volume p/ Meta</span>
              <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-lg font-black text-indigo-300 font-mono">
              R$ {(analysis.totalRebalanceVolumeBRL / 1000).toFixed(0)}k
            </div>
            <div className="text-[11px] text-indigo-400/80 mt-0.5">Volume de ajuste</div>
          </div>
        </div>

        {/* Barra de Calibração da Tolerância Tática (Drift Trigger) */}
        <div className="mt-5 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-slate-200">Gatilho de Alerta de Drift:</span>
              <span className="text-xs text-slate-400 ml-1.5">
                Notificar quando o desvio da meta exceder <strong className="text-amber-300 font-mono">±{toleranceThreshold.toFixed(1)} p.p.</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Sensibilidade:</span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {[1.5, 2.0, 2.5, 3.0, 5.0].map((val) => (
                <button
                  key={val}
                  onClick={() => setToleranceThreshold(val)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition cursor-pointer ${
                    toleranceThreshold === val
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {val === 2.5 ? '±2.5% (Padrão)' : `±${val.toFixed(1)}%`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Seletor de Status */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('DRIFT_ONLY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'DRIFT_ONLY'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60 border border-slate-800'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Apenas Alertas de Drift ({analysis.totalDriftAlertsCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('OVERWEIGHT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'OVERWEIGHT'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60 border border-slate-800'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Sobre-alocados ↗ ({analysis.totalOverweightCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('UNDERWEIGHT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'UNDERWEIGHT'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60 border border-slate-800'
              }`}
            >
              <TrendingDown className="w-3 h-3 text-cyan-400" />
              <span>Sub-alocados ↘ ({analysis.totalUnderweightCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('IN_TARGET')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'IN_TARGET'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60 border border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Na Meta ({analysis.totalAssetsCount - analysis.totalDriftAlertsCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60 border border-slate-800'
              }`}
            >
              Todos ({analysis.totalAssetsCount})
            </button>
          </div>

          {/* Toggle Modo Tabela / Cards */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveViewMode('table')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition cursor-pointer ${
                activeViewMode === 'table'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tabela Detalhada
            </button>
            <button
              onClick={() => setActiveViewMode('cards')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition cursor-pointer ${
                activeViewMode === 'cards'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cards de Risco
            </button>
          </div>
        </div>

        {/* Linha Secundária de Filtros (Carteira, Classe e Busca) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/60">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por ticker, nome, cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <select
              value={selectedPortfolioId}
              onChange={(e) => setSelectedPortfolioId(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Todas as Carteiras ({portfolios.length})</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.clientName} ({p.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedAssetClass}
              onChange={(e) => setSelectedAssetClass(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Todas as Classes de Ativo</option>
              <option value="Renda Fixa">Renda Fixa</option>
              <option value="Renda Variável">Renda Variável</option>
              <option value="Multimercado">Multimercado</option>
              <option value="Internacional">Internacional</option>
              <option value="Caixa">Caixa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visualização em Tabela */}
      {activeViewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Auditoria de Ativos &amp; Desvios em Tempo Real
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                {filteredItems.length} ativos listados
              </span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Alerta acionado quando |Desvio| &gt; 2.50%
            </span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-white">Nenhum ativo corresponde aos filtros selecionados.</p>
              <p className="text-xs">Todos os ativos monitorados estão alinhados dentro da banda de tolerância estipulada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-300 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Ticker / Código</th>
                    <th className="py-3 px-3">Ativo &amp; Carteira</th>
                    <th className="py-3 px-3">Classe</th>
                    <th className="py-3 px-3 text-right">Valor Custodiado</th>
                    <th className="py-3 px-3 text-right">Alocação Atual</th>
                    <th className="py-3 px-3 text-right">Meta Estratégica</th>
                    <th className="py-3 px-3 text-center">Desvio Tático (Drift)</th>
                    <th className="py-3 px-3 text-center">Corredor de Tolerância</th>
                    <th className="py-3 px-3 text-right">Ação Tática Sugerida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.map((item) => {
                    const isHighDrift = item.absDriftPP > 2.5;
                    const isCritical = item.absDriftPP > 5.0;

                    return (
                      <tr
                        key={`${item.portfolioId}-${item.assetId}`}
                        className={`hover:bg-slate-800/40 transition ${
                          isCritical
                            ? 'bg-rose-950/10'
                            : isHighDrift
                            ? 'bg-amber-950/10'
                            : ''
                        }`}
                      >
                        {/* Ticker */}
                        <td className="py-3 px-3 font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-xs">
                              {item.ticker}
                            </span>
                          </div>
                        </td>

                        {/* Nome do Ativo & Cliente */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white max-w-xs truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span className="text-slate-300 font-medium">{item.clientName}</span>
                            <span>•</span>
                            <span className="text-slate-500">{item.portfolioName}</span>
                          </div>
                        </td>

                        {/* Classe */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/60">
                            {item.assetClass}
                          </span>
                        </td>

                        {/* Valor Atual R$ */}
                        <td className="py-3 px-3 text-right font-mono text-slate-200">
                          R$ {item.currentValueBRL.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </td>

                        {/* Alocação Atual % */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-white text-xs">
                          {item.currentAllocationPercent.toFixed(2)}%
                        </td>

                        {/* Meta Estratégica % */}
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-300 text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-indigo-500/20">
                            {item.targetPercent.toFixed(2)}%
                          </span>
                        </td>

                        {/* Desvio Tático com Ícone de Tendência */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center">
                            <AssetDriftTrendBadge
                              currentPercent={item.currentAllocationPercent}
                              targetPercent={item.targetPercent}
                              tolerancePP={toleranceThreshold}
                              showDetails={true}
                              size="md"
                            />
                          </div>
                        </td>

                        {/* Corredor de Tolerância Visual (Mini Gauge) */}
                        <td className="py-3 px-3 text-center min-w-[130px]">
                          <div className="w-full max-w-[120px] mx-auto space-y-1">
                            {/* Barra visual com zona verde central e marcadores */}
                            <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                              {/* Zona abaixo da tolerância */}
                              <div className="w-[30%] h-full bg-cyan-950/60 border-r border-slate-700" title="Subponderado" />
                              {/* Zona segura da meta ±2.5% */}
                              <div className="w-[40%] h-full bg-emerald-500/20 border-r border-slate-700 relative" title="Banda de Tolerância Segura">
                                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-indigo-400" title="Meta (Target)" />
                              </div>
                              {/* Zona acima da tolerância */}
                              <div className="w-[30%] h-full bg-amber-950/60" title="Sobreponderado" />

                              {/* Posição atual do ativo como indicador */}
                              {(() => {
                                // Mapeia driftPP de -6 a +6 para 0% a 100%
                                const clampedDrift = Math.max(-6, Math.min(6, item.driftPP));
                                const leftPercent = ((clampedDrift + 6) / 12) * 100;
                                const dotColor = isCritical
                                  ? 'bg-rose-500 ring-rose-400'
                                  : isHighDrift
                                  ? item.driftPP > 0 ? 'bg-amber-400 ring-amber-300' : 'bg-cyan-400 ring-cyan-300'
                                  : 'bg-emerald-400 ring-emerald-300';

                                return (
                                  <div
                                    className={`absolute top-0 bottom-0 w-2 -ml-1 rounded-full ${dotColor} ring-2 ring-offset-1 ring-offset-slate-900 shadow-xs`}
                                    style={{ left: `${leftPercent}%` }}
                                    title={`Posição atual: ${item.currentAllocationPercent.toFixed(1)}% (Meta: ${item.targetPercent.toFixed(1)}%)`}
                                  />
                                );
                              })()}
                            </div>
                            <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5">
                              <span>-2.5%</span>
                              <span className="text-indigo-400 font-bold">Meta</span>
                              <span>+2.5%</span>
                            </div>
                          </div>
                        </td>

                        {/* Ação Tática Sugerida & Botões */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="text-right">
                              {item.suggestedAction === 'REDUZIR' ? (
                                <span className="font-bold text-amber-300 font-mono text-xs block">
                                  Vender R$ {Math.abs(item.rebalanceDeltaBRL).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                </span>
                              ) : item.suggestedAction === 'APORTAR' ? (
                                <span className="font-bold text-cyan-300 font-mono text-xs block">
                                  Aportar R$ {Math.abs(item.rebalanceDeltaBRL).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-mono text-xs block">
                                  Manter alocação
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500">
                                {item.suggestedAction === 'MANTER' ? 'Em conformidade' : 'Restaurar meta'}
                              </span>
                            </div>

                            <button
                              onClick={() => handleOpenRebalance(item.portfolioId)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                              title={`Simular rebalanceamento para ${item.clientName}`}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Visualização em Cards */}
      {activeViewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isHighDrift = item.absDriftPP > 2.5;
            const isCritical = item.absDriftPP > 5.0;

            return (
              <div
                key={`${item.portfolioId}-${item.assetId}`}
                className={`bg-slate-900 border rounded-xl p-4 shadow-sm transition hover:border-slate-700 flex flex-col justify-between ${
                  isCritical
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : isHighDrift
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold text-xs">
                          {item.ticker}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {item.assetClass}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-sm mt-1.5 line-clamp-1" title={item.name}>
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.clientName} • {item.portfolioName}
                      </p>
                    </div>

                    <AssetDriftTrendBadge
                      currentPercent={item.currentAllocationPercent}
                      targetPercent={item.targetPercent}
                      tolerancePP={toleranceThreshold}
                      size="md"
                    />
                  </div>

                  {/* Detalhes de Alocação */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Atual</span>
                      <span className="font-mono font-bold text-white text-xs">
                        {item.currentAllocationPercent.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-400 uppercase font-semibold block">Meta (Target)</span>
                      <span className="font-mono font-bold text-indigo-300 text-xs">
                        {item.targetPercent.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Desvio Tático</span>
                      <span className={`font-mono font-bold text-xs ${item.driftPP > 0 ? 'text-amber-400' : item.driftPP < 0 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                        {item.driftPP > 0 ? `+${item.driftPP.toFixed(2)}` : `${item.driftPP.toFixed(2)}`} p.p.
                      </span>
                    </div>
                  </div>

                  {/* Valor Custodiado */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Patrimônio Alocado:</span>
                    <span className="font-mono font-semibold text-slate-200">
                      R$ {item.currentValueBRL.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  {/* Mensagem de Ação */}
                  <div className="mt-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300">
                    <div className="flex items-start gap-1.5">
                      {item.direction === 'UP' ? (
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      ) : item.direction === 'DOWN' ? (
                        <TrendingDown className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <span>{item.actionSummary}</span>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {item.isDriftAlert ? 'Ação Tática Recomendada' : 'Em Conformidade'}
                  </span>

                  <button
                    onClick={() => handleOpenRebalance(item.portfolioId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition cursor-pointer"
                  >
                    <span>Rebalancear</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Rebalanceamento Rápido */}
      {rebalancePortfolio && (
        <RebalanceSimulationModal
          isOpen={true}
          onClose={() => setRebalancePortfolio(null)}
          portfolio={rebalancePortfolio}
        />
      )}
    </div>
  );
};
