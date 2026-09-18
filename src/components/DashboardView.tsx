import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sliders,
  DollarSign,
  AlertCircle,
  Clock,
  Award,
  Sparkles,
  Download,
  FileText,
  Check,
  Scroll,
  Building,
  Scale,
  Activity,
  Calendar,
  Info,
} from 'lucide-react';
import { Portfolio, ComplianceAlert, PerformanceAlert, AiExplanation, DataMode, AlertComplianceSnapshot } from '../types';
import { AIInsightCard } from './AIInsightCard';
import { ComplianceBreachHistoryChart } from './ComplianceBreachHistoryChart';
import { ThirtyDayComplianceHistoryChart } from './ThirtyDayComplianceHistoryChart';
import { RebalancePerformanceIndexCard } from './RebalancePerformanceIndexCard';
import { ImmediateLiquidityIndexCard } from './ImmediateLiquidityIndexCard';
import { SelectedPortfolioHistoryChart } from './SelectedPortfolioHistoryChart';
import { AssetCorrelationMap } from './AssetCorrelationMap';
import { AssetClassFilterBar } from './AssetClassFilterBar';
import { PortfolioSectorRiskHeatmap } from './PortfolioSectorRiskHeatmap';
import { GlobalAssetDistributionChart } from './GlobalAssetDistributionChart';
import { downloadPortfolioComplianceReportCSV, downloadThirtyDayComplianceHistoryCSV } from '../utils/csvExport';
import { downloadPortfolioComplianceReportPDF } from '../utils/pdfExport';
import { generateThirtyDayComplianceSnapshots } from '../utils/complianceHistory';

interface DashboardViewProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  performanceAlerts?: PerformanceAlert[];
  onSelectPortfolio: (id: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'owner' | 'alerts' | 'portfolios' | 'simulator' | 'agent') => void;
  onStartRebalance: (portfolioId: string) => void;
  dataMode?: DataMode;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  portfolios,
  alerts,
  performanceAlerts = [],
  onSelectPortfolio,
  onNavigateTab,
  onStartRebalance,
  dataMode = 'LIVE',
}) => {
  const [aiInsightTab, setAiInsightTab] = useState<'COMPLIANCE' | 'OPPORTUNITIES'>('COMPLIANCE');
  const [showAllComplianceInsights, setShowAllComplianceInsights] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExporting30DayCSV, setIsExporting30DayCSV] = useState<boolean>(false);
  const [csv30DayExportSuccess, setCsv30DayExportSuccess] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [pdfExportSuccess, setPdfExportSuccess] = useState<string | null>(null);
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>('ALL');
  const [selectedDashboardPortfolioId, setSelectedDashboardPortfolioId] = useState<string>(() => {
    const crit = portfolios.find((p) => p.status === 'CRITICAL');
    return crit ? crit.id : portfolios[0]?.id || '';
  });

  const thirtyDaySnapshots: AlertComplianceSnapshot[] = useMemo(() => {
    return generateThirtyDayComplianceSnapshots(portfolios, alerts);
  }, [portfolios, alerts]);

  const handleDownload30DayHistoryCSV = () => {
    setIsExporting30DayCSV(true);
    try {
      downloadThirtyDayComplianceHistoryCSV(thirtyDaySnapshots, portfolios, alerts);
      setCsv30DayExportSuccess('Histórico de 30 dias exportado!');
      setTimeout(() => setCsv30DayExportSuccess(null), 4000);
    } catch (error) {
      console.error('Erro ao gerar relatório CSV do histórico de 30 dias:', error);
    } finally {
      setTimeout(() => {
        setIsExporting30DayCSV(false);
      }, 1200);
    }
  };

  const handleDownloadReport = () => {
    setIsExporting(true);
    try {
      downloadPortfolioComplianceReportCSV(portfolios, alerts);
    } catch (error) {
      console.error('Erro ao gerar relatório CSV de conformidade:', error);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
      }, 1500);
    }
  };

  const totalAum = portfolios.reduce((sum, p) => sum + p.totalAum, 0);
  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');
  const warningAlerts = alerts.filter((a) => a.severity === 'WARNING');
  const normalPortfolios = portfolios.filter((p) => p.status === 'NORMAL');

  // Total de capital excedente a rebalancear
  const totalExcessBRL = alerts.reduce((sum, a) => sum + a.excessValueBRL, 0);
  const complianceRate = portfolios.length > 0 ? (normalPortfolios.length / portfolios.length) * 100 : 0;

  // Histórico de snapshots de alertas dos últimos 7 dias (D-6 a D-0)
  const sevenDaysSnapshots: AlertComplianceSnapshot[] = useMemo(() => {
    const today = new Date();
    const snapshots: AlertComplianceSnapshot[] = [];
    const totalP = portfolios.length || 1;

    // Métricas vivas de hoje (D-0)
    const currentCriticals = alerts.filter((a) => a.severity === 'CRITICAL');
    const currentWarnings = alerts.filter((a) => a.severity === 'WARNING');
    const currentCompliantPortfolios = normalPortfolios.length;
    const currentRate = Number(((currentCompliantPortfolios / totalP) * 100).toFixed(1));
    const currentExcessBRL = totalExcessBRL;

    // Baseline dos 6 dias anteriores alinhado aos eventos fiduciários e volatilidade
    const baselinePastDeltas = [
      { offset: 6, compliantCount: Math.min(totalP, Math.max(1, currentCompliantPortfolios + 1)), crit: Math.max(0, currentCriticals.length - 1), warn: 1, event: 'Abertura de ciclo fiduciário semanal' },
      { offset: 5, compliantCount: Math.min(totalP, Math.max(1, currentCompliantPortfolios + 1)), crit: Math.max(0, currentCriticals.length - 1), warn: 1, event: 'Mercado estável e conformidade elevada' },
      { offset: 4, compliantCount: Math.min(totalP, Math.max(1, currentCompliantPortfolios)), crit: currentCriticals.length, warn: 2, event: 'Oscilação cambial USD/BRL gerou atenção' },
      { offset: 3, compliantCount: Math.max(1, currentCompliantPortfolios - 1), crit: currentCriticals.length + 1, warn: 2, event: 'Rali em renda variável gerou drift acima do teto' },
      { offset: 2, compliantCount: Math.max(1, currentCompliantPortfolios - 1), crit: currentCriticals.length + 1, warn: 1, event: 'Comitê de risco e emissão de alertas aos assessores' },
      { offset: 1, compliantCount: currentCompliantPortfolios, crit: currentCriticals.length, warn: currentWarnings.length, event: 'Início de rebalanceamento tático' },
    ];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const fullDateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const weekdayStr = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const dayLabel = i === 0 ? 'Hoje' : `${weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1)} ${dateStr}`;

      if (i === 0) {
        snapshots.push({
          date: dateStr,
          fullDate: fullDateStr,
          dayLabel,
          timestamp: d.getTime(),
          totalPortfolios: totalP,
          compliantPortfolios: currentCompliantPortfolios,
          criticalAlerts: currentCriticals.length,
          warningAlerts: currentWarnings.length,
          complianceRate: currentRate,
          totalExcessBRL: currentExcessBRL,
          marketContext: 'Aferição em tempo real pelo motor Sentinel CVM 175',
        });
      } else {
        const hist = baselinePastDeltas.find((h) => h.offset === i);
        const compCount = hist ? hist.compliantCount : currentCompliantPortfolios;
        const rate = Number(((compCount / totalP) * 100).toFixed(1));
        const crit = hist ? hist.crit : currentCriticals.length;
        const warn = hist ? hist.warn : currentWarnings.length;
        const excess = Math.max(0, currentExcessBRL * (crit > 0 ? (crit / Math.max(1, currentCriticals.length)) : 0.5));

        snapshots.push({
          date: dateStr,
          fullDate: fullDateStr,
          dayLabel,
          timestamp: d.getTime(),
          totalPortfolios: totalP,
          compliantPortfolios: compCount,
          criticalAlerts: crit,
          warningAlerts: warn,
          complianceRate: rate,
          totalExcessBRL: excess,
          marketContext: hist?.event || 'Snapshot fiduciário diário',
        });
      }
    }

    return snapshots;
  }, [portfolios, alerts, normalPortfolios.length, totalExcessBRL]);

  const handleDownloadReportPDF = () => {
    setIsExportingPDF(true);
    try {
      downloadPortfolioComplianceReportPDF(portfolios, alerts, sevenDaysSnapshots);
      setPdfExportSuccess('Relatório PDF exportado!');
      setTimeout(() => setPdfExportSuccess(null), 4000);
    } catch (error) {
      console.error('Erro ao gerar relatório PDF de conformidade:', error);
    } finally {
      setTimeout(() => {
        setIsExportingPDF(false);
      }, 1200);
    }
  };

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
            {/* Botão de Exportação de Relatório Resumido em PDF */}
            <button
              id="download-compliance-pdf-btn"
              onClick={handleDownloadReportPDF}
              disabled={isExportingPDF}
              title="Gerar e baixar relatório executivo resumido de conformidade em formato PDF (A4)"
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition shadow-sm border border-sky-500/50 cursor-pointer disabled:opacity-50"
            >
              <FileText className={`w-3.5 h-3.5 mr-1.5 ${isExportingPDF ? 'animate-spin' : ''}`} />
              <span>{isExportingPDF ? 'Gerando PDF...' : 'Baixar Relatório PDF'}</span>
            </button>

            {/* Botão de Exportar Relatório (CSV com histórico de 30 dias exibido no gráfico) */}
            <button
              id="download-30day-compliance-report-btn"
              onClick={handleDownload30DayHistoryCSV}
              disabled={isExporting30DayCSV}
              title="Exportar arquivo CSV com o histórico de conformidade dos últimos 30 dias exibido no gráfico"
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-sm border border-emerald-500/50 cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 mr-1.5 ${isExporting30DayCSV ? 'animate-bounce' : ''}`} />
              <span>{isExporting30DayCSV ? 'Gerando CSV...' : 'Exportar Relatório'}</span>
            </button>

            {/* Botão de Exportação de Carteiras em CSV */}
            <button
              id="download-compliance-report-btn"
              onClick={handleDownloadReport}
              disabled={isExporting}
              title="Exportar sumário de conformidade das carteiras em arquivo CSV"
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold transition shadow-sm border border-slate-700 cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 mr-1.5 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Gerando...' : 'Exportar Carteiras (CSV)'}</span>
            </button>

            {csv30DayExportSuccess && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                <Check className="w-3 h-3 mr-1 text-emerald-400" />
                {csv30DayExportSuccess}
              </span>
            )}

            {pdfExportSuccess && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-semibold">
                <Check className="w-3 h-3 mr-1 text-sky-400" />
                {pdfExportSuccess}
              </span>
            )}

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  dataMode === 'LIVE'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : dataMode === 'SIMULATION'
                    ? 'text-cyan-300 bg-cyan-500/20 border-cyan-400/40 animate-pulse'
                    : 'text-purple-300 bg-purple-500/20 border-purple-400/40 animate-pulse'
                }`}
              >
                {dataMode === 'LIVE'
                  ? 'LIVE DATA'
                  : dataMode === 'SIMULATION'
                  ? 'SIMULATION'
                  : 'PROJECTION'}
              </span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlobalAssetDistributionChart portfolios={portfolios} alerts={alerts} />
        <ImmediateLiquidityIndexCard
          portfolios={portfolios}
          onSelectPortfolio={onSelectPortfolio}
          onStartRebalance={onStartRebalance}
        />
      </div>

      {/* GRÁFICO DE LINHA COM RECHARTS: EVOLUÇÃO HISTÓRICA DO PERCENTUAL DE CONFORMIDADE (ÚLTIMOS 30 DIAS) */}
      <ThirtyDayComplianceHistoryChart
        portfolios={portfolios}
        alerts={alerts}
        snapshots={thirtyDaySnapshots}
        onExportReport={handleDownload30DayHistoryCSV}
      />

      {/* EVOLUÇÃO HISTÓRICA DO PERCENTUAL DE CONFORMIDADE DA CARTEIRA SELECIONADA */}
      <SelectedPortfolioHistoryChart
        portfolios={portfolios}
        alerts={alerts}
        selectedPortfolioId={selectedDashboardPortfolioId}
        onSelectPortfolio={setSelectedDashboardPortfolioId}
      />

      {/* MAPA DE CORRELAÇÃO DE ATIVOS (HEAT MAP) */}
      <AssetCorrelationMap 
        portfolio={portfolios.find(p => p.id === selectedDashboardPortfolioId) || portfolios[0] || null} 
      />

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
              <h4 className="text-xs font-bold text-white">Rebalancear Carteira Cliente Exemplo 1</h4>
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
              <h4 className="text-xs font-bold text-white">Revisar Carteira Exemplo Offshore</h4>
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

      {/* ÍNDICE DE PERFORMANCE DE REBALANCEAMENTO COM GRÁFICO DE BARRAS COMPARATIVO */}
      <RebalancePerformanceIndexCard
        portfolios={portfolios}
        alerts={alerts}
        onSelectPortfolio={onSelectPortfolio}
        onStartRebalance={onStartRebalance}
      />

      {/* FILTRO INTERATIVO POR CLASSE DE ATIVOS (RENDA FIXA, AÇÕES, MULTIMERCADO, INTERNACIONAL, CAIXA) */}
      <AssetClassFilterBar
        selectedAssetClass={selectedAssetClass}
        onSelectAssetClass={setSelectedAssetClass}
        alerts={alerts}
        portfolios={portfolios}
      />

      {/* HISTÓRICO DE DESENQUADRAMENTOS & VOLATILIDADE (30 DIAS) COM RECHARTS */}
      <ComplianceBreachHistoryChart
        portfolios={portfolios}
        alerts={alerts}
        onSelectPortfolio={onSelectPortfolio}
        onStartRebalance={onStartRebalance}
        selectedAssetClass={selectedAssetClass}
        onSelectAssetClass={setSelectedAssetClass}
      />

      {/* FlowCore AI INSIGHT ENGINE: Prescriptive Intelligence in 6 Pillars */}
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
              <span>Oportunidades de Carteira (4)</span>
            </button>
          </div>
        </div>

        {/* Insight Cards Grid */}
        {aiInsightTab === 'COMPLIANCE' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(showAllComplianceInsights ? alerts : alerts.slice(0, 2)).map((alert) => (
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
                  severity={alert.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING'}
                  ruleSource={alert.ruleSource}
                  rule_source={alert.ruleSource}
                  policyId={alert.policyId}
                  policy_id={alert.policyId}
                  limit={alert.limit}
                  currentValue={alert.currentValue}
                  current_value={alert.currentValue}
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

            {alerts.length > 2 && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowAllComplianceInsights(!showAllComplianceInsights)}
                  className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700/80 transition shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    {showAllComplianceInsights
                      ? 'Mostrar apenas principais (2 alertas)'
                      : `Ver todas as ${alerts.length} recomendações de compliance estruturadas`}
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* OPORTUNIDADE 1 */}
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
              ruleSource="MANDATO_CLIENTE"
              rule_source="MANDATO_CLIENTE"
              policyId="IPS-PHS-2024"
              policy_id="IPS-PHS-2024"
              portfolioName="Pedro Henrique Silveira"
              clientName="Pedro Henrique Silveira"
              onApplyAction={() => onSelectPortfolio('port-002')}
              actionLabel="Ver Posições & Alocar"
              collapsible={true}
              defaultExpanded={true}
            />

            {/* OPORTUNIDADE 2 */}
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
              title="Otimização Tributária & Ganho de Curva Pré"
              subtitle="Carteira Clara Mendes • Perfil Conservador"
              category="OPPORTUNITY"
              severity="INFO"
              ruleSource="POLITICA_INTERNA"
              rule_source="POLITICA_INTERNA"
              policyId="POL-CR-04"
              policy_id="POL-CR-04"
              portfolioName="Clara Mendes"
              clientName="Clara Mendes"
              onApplyAction={() => onSelectPortfolio('port-003')}
              actionLabel="Inspecionar Carteira"
              collapsible={true}
              defaultExpanded={true}
            />

            {/* OPORTUNIDADE 3 */}
            <AIInsightCard
              id="opportunity-credit-arbitrage"
              insight={{
                what: 'Spread atípico de +115 bps acima da NTN-B de referência em Debêntures Incentivadas AAA de infraestrutura com isenção fiscal para Cliente Demo C.',
                why: 'Emissão primária com sobreoferta institucional de lote de energia gerou taxa líquida equivalente a 142% do CDI para pessoa física.',
                impact: 'Ganho líquido anual adicional projetado em R$ 94.200 em relação a fundos DI com come-cotas, mantendo rating de crédito AAA.',
                action: 'Substituir R$ 650.000 de LFT (Tesouro Selic) por lote primário de Debêntures Incentivadas AAA com duration de 4.2 anos.',
                confidence: 95,
                source: 'Lei nº 12.431/2011 (art. 2º) • Política Interna de Crédito Privado POL-RF-09 • Resolução CVM 175',
              }}
              title="Arbitragem de Spread em Crédito Isento (AAA)"
              subtitle="Carteira Cliente Demo C • Perfil Private Wealth"
              category="OPPORTUNITY"
              severity="INFO"
              ruleSource="POLITICA_INTERNA"
              rule_source="POLITICA_INTERNA"
              policyId="POL-RF-09"
              policy_id="POL-RF-09"
              portfolioName="Cliente Demo C"
              clientName="Cliente Demo C"
              onApplyAction={() => onSelectPortfolio('port-005')}
              actionLabel="Ver Carteira & Alocar"
              collapsible={true}
              defaultExpanded={true}
            />

            {/* OPORTUNIDADE 4 */}
            <AIInsightCard
              id="opportunity-fii-discount"
              insight={{
                what: 'Desconto patrimonial de 14.8% (P/VP 0.852) em Fundos Imobiliários Prime de galpões logísticos com vacância zero na carteira de Carteira Exemplo.',
                why: 'Volatilidade momentânea de juros futuros na B3 abriu spread incomum entre a cota negociada em bolsa e o laudo de avaliação dos galpões.',
                impact: 'Dividend yield isento anualizado projetado em 10.1% a.a. somado ao potencial de valorização de +14% na reprecificação do P/VP para 1.00.',
                action: 'Rebalancear R$ 420.000 do excedente de liquidez conservadora para compras fracionadas em 2 FIIs de logística grau de investimento.',
                confidence: 92,
                source: 'Lei nº 8.668/1993 (art. 16-A) • Mandato Bilateral IPS-MR-2023 • Resolução CVM 175',
              }}
              title="Rebalanceamento Tático em FIIs com Desconto P/VP"
              subtitle="Carteira Carteira Exemplo • Perfil Offshore & FIIs"
              category="OPPORTUNITY"
              severity="INFO"
              ruleSource="MANDATO_CLIENTE"
              rule_source="MANDATO_CLIENTE"
              policyId="IPS-MR-2023"
              policy_id="IPS-MR-2023"
              portfolioName="Carteira Exemplo"
              clientName="Carteira Exemplo"
              onApplyAction={() => onSelectPortfolio('port-004')}
              actionLabel="Inspecionar Posições"
              collapsible={true}
              defaultExpanded={true}
            />
          </div>
        )}
      </div>

      {/* MAPA DE CALOR DE RISCO SETORIAL & PROXIMIDADE REGULATÓRIA (CVM 175 • CMN 4.963 • IPS) */}
      <PortfolioSectorRiskHeatmap
        portfolios={portfolios}
        alerts={alerts}
        selectedPortfolioId={selectedDashboardPortfolioId}
        onSelectPortfolio={(id) => {
          setSelectedDashboardPortfolioId(id);
          onSelectPortfolio(id);
        }}
        onStartRebalance={onStartRebalance}
      />

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
                const effectiveRuleSource = alert.rule_source ?? alert.ruleSource;
                const effectivePolicyId = alert.policy_id ?? alert.policyId;
                const effectiveLimit = alert.limit;
                const effectiveCurrentValue = alert.current_value ?? alert.currentValue;
                const isMandate = effectiveRuleSource === 'MANDATO_CLIENTE';
                const isInternal = effectiveRuleSource === 'POLITICA_INTERNA';
                const isRegulatory = effectiveRuleSource === 'REGRA_REGULATORIA';

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border transition shadow-sm ${
                      isMandate
                        ? 'bg-purple-950/20 border-purple-800/50 hover:border-purple-600/70 border-l-4 border-l-purple-500 shadow-purple-950/20'
                        : isInternal
                        ? 'bg-indigo-950/20 border-indigo-800/50 hover:border-indigo-600/70 border-l-4 border-l-indigo-500 shadow-indigo-950/20'
                        : isRegulatory
                        ? 'bg-rose-950/20 border-rose-800/50 hover:border-rose-600/70 border-l-4 border-l-rose-500 shadow-rose-950/20'
                        : isCritical
                        ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700/60'
                        : 'bg-amber-950/20 border-amber-800/40 hover:border-amber-700/60'
                    }`}
                  >
                    {/* Visual Distinction Header Ribbon: Mandate vs Internal */}
                    <div className="flex items-center justify-between text-[11px] pb-2 mb-2 border-b border-white/[0.08]">
                      <div className="flex items-center space-x-1.5 font-bold">
                        {isMandate ? (
                          <>
                            <Scroll className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-purple-300">📜 VIOLAÇÃO DE MANDATO DO CLIENTE (IPS BILATERAL)</span>
                          </>
                        ) : isInternal ? (
                          <>
                            <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="text-indigo-300">🏛️ DESVIO DE POLÍTICA INTERNA DA GESTORA</span>
                          </>
                        ) : (
                          <>
                            <Scale className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="text-rose-300">⚖️ ENQUADRAMENTO REGULATÓRIO CVM</span>
                          </>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border shrink-0 ${
                          isMandate
                            ? 'bg-purple-500/20 text-purple-200 border-purple-500/40'
                            : isInternal
                            ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40'
                            : 'bg-rose-500/20 text-rose-200 border-rose-500/40'
                        }`}
                      >
                        {isMandate ? 'Risco Fiduciário Direto' : isInternal ? 'Governança Institucional' : 'Regulatório CVM'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide ${
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
                      </div>
                      <div className="text-xs font-semibold text-slate-300">
                        Classe: <span className="text-white font-bold">{alert.assetClass}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-300 leading-relaxed">
                      {alert.message}
                    </div>

                    {/* Contextual difference pill between client mandate and internal policy */}
                    <div className="mt-2 text-[11px] p-2 rounded-lg bg-black/40 border border-white/[0.06] text-slate-300 flex items-start space-x-2">
                      <span className="font-bold uppercase font-mono text-[10px] shrink-0 mt-0.5 text-cyan-400">
                        {isMandate ? '📜 Mandato Bilateral:' : isInternal ? '🏛️ Política Interna:' : '⚖️ Norma CVM:'}
                      </span>
                      <span className="leading-snug">
                        {alert.mandateVsInternalExplanation || (isMandate 
                          ? 'Cláusula do contrato de gestão individual firmado com o cliente investidor. O descumprimento gera risco fiduciário individual perante o titular.' 
                          : isInternal
                          ? 'Diretriz prudencial do Comitê de Risco e Alocação da gestora para salvaguardar a instituição. Não fere diretamente o contrato do investidor.'
                          : 'Parâmetro de observância regulatória compulsória.')}
                      </span>
                    </div>

                    {/* Distinct 4-Field Audit Grid: rule_source, policy_id, limit, current_value */}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-slate-950/90 rounded-lg border border-white/[0.08] text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">
                          rule_source
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                            isMandate
                              ? 'bg-purple-500/20 text-purple-200 border-purple-500/40'
                              : isInternal
                              ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40'
                              : 'bg-rose-500/20 text-rose-200 border-rose-500/40'
                          }`}
                        >
                          {isMandate && <Scroll className="w-3 h-3 text-purple-400" />}
                          {isInternal && <Building className="w-3 h-3 text-indigo-400" />}
                          {isRegulatory && <Scale className="w-3 h-3 text-rose-400" />}
                          <span>{effectiveRuleSource}</span>
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">
                          policy_id
                        </span>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800/90 text-slate-200 border border-white/[0.08]">
                          {effectivePolicyId}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">
                          limit
                        </span>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800/90 text-slate-200 border border-white/[0.08]">
                          {effectiveLimit.toFixed(1)}%
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">
                          current_value
                        </span>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-extrabold border ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {effectiveCurrentValue.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Allocation metrics comparison: desvio e excesso */}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px]">desvio apurado:</span>
                        <strong className={isCritical ? 'text-rose-400 font-mono font-bold' : 'text-amber-400 font-mono font-bold'}>
                          +{alert.difference.toFixed(1)} p.p.
                        </strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">Excesso Estimado:</span>
                        <strong className="text-emerald-400 font-mono font-bold">
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
            <div className="flex items-center gap-2">
              <button
                id="download-portfolios-csv-btn"
                onClick={handleDownloadReport}
                disabled={isExporting}
                title="Download Report (CSV)"
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium transition px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => onNavigateTab('portfolios')}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center font-medium transition"
              >
                Ver todas <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>
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
