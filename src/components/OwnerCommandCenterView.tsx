import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Award,
  Users,
  Target,
  FileSpreadsheet,
  Download,
  Calendar,
  Sliders,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { Portfolio, ComplianceAlert, PipelineDeal, AdvisorPerformance, DataMode } from '../types';
import { ClientsAtRiskList } from './ClientsAtRiskList';
import { MiniSparkline } from './MiniSparkline';
import { AIInsightCard } from './AIInsightCard';

interface OwnerCommandCenterViewProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  onNavigateTab: (tab: 'dashboard' | 'alerts' | 'portfolios' | 'simulator' | 'agent') => void;
  onSelectPortfolio: (id: string) => void;
  onStartRebalance: (portfolioId: string) => void;
  dataMode?: DataMode;
}

export const OwnerCommandCenterView: React.FC<OwnerCommandCenterViewProps> = ({
  portfolios,
  alerts,
  onNavigateTab,
  onSelectPortfolio,
  onStartRebalance,
  dataMode = 'LIVE',
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'MÊS_ATUAL' | 'YTD_2026' | 'PROJEÇÃO_Q1'>('MÊS_ATUAL');
  const [isSimulatingPipeline, setIsSimulatingPipeline] = useState<boolean>(false);
  const [showExecutiveMemoModal, setShowExecutiveMemoModal] = useState<boolean>(false);

  // Pipeline deals for commercial mandates
  const [pipelineDeals, setPipelineDeals] = useState<PipelineDeal[]>([
    {
      id: 'deal-1',
      clientName: 'Holding Morumbi Family Office',
      segment: 'Family Office',
      targetAum: 8000000, // R$ 8.0M
      stage: 'Due Diligence',
      probability: 65,
      estimatedFeeAnnual: 56000,
      leadAdvisor: 'Carlos Eduardo Mendes (CFA)',
      expectedClose: '15/03/2026',
    },
    {
      id: 'deal-2',
      clientName: 'Dr. Paulo Sampaio Private Capital',
      segment: 'Private Wealth',
      targetAum: 4500000, // R$ 4.5M
      stage: 'Contrato em Assinatura',
      probability: 90,
      estimatedFeeAnnual: 42750,
      leadAdvisor: 'Carlos Eduardo Mendes (CFA)',
      expectedClose: '28/02/2026',
    },
    {
      id: 'deal-3',
      clientName: 'Grupo Vanguarda Previdência Corporativa',
      segment: 'Previdência',
      targetAum: 3500000, // R$ 3.5M
      stage: 'Proposta IPS',
      probability: 70,
      estimatedFeeAnnual: 24500,
      leadAdvisor: 'Marina Fagundes (CNPI)',
      expectedClose: '10/04/2026',
    },
    {
      id: 'deal-4',
      clientName: 'RPPS Fundo Previdenciário do Litoral',
      segment: 'Institucional',
      targetAum: 2500000, // R$ 2.5M
      stage: 'Integralização',
      probability: 95,
      estimatedFeeAnnual: 12500,
      leadAdvisor: 'Renata Vasconcellos (CFA)',
      expectedClose: '20/02/2026',
    },
  ]);

  // Actual Base Calculations
  const baseAum = portfolios.reduce((s, p) => s + p.totalAum, 0); // e.g. R$ 51.3M
  const pipelineTotal = pipelineDeals.reduce((s, d) => s + d.targetAum, 0); // R$ 18.5M
  const pipelineWeighted = pipelineDeals.reduce((s, d) => s + (d.targetAum * d.probability) / 100, 0); // R$ 13.8M
  const pipelineRevenueAnnual = pipelineDeals.reduce((s, d) => s + d.estimatedFeeAnnual, 0);

  // Simulated metrics when "Simular Pipeline" is active
  const effectiveAum = isSimulatingPipeline ? baseAum + pipelineWeighted : baseAum;

  // Revenue calculation: Average fee around 0.85% + performance
  const annualManagementRevenue = (effectiveAum * 0.0085);
  const monthlyRevenue = annualManagementRevenue / 12;
  const netNewMoneyYtd = 4200000 + (isSimulatingPipeline ? pipelineWeighted : 0);

  // Risk Exposure: AUM in portfolios with CRITICAL alerts
  const criticalPortfolioIds = new Set(alerts.filter((a) => a.severity === 'CRITICAL').map((a) => a.portfolioId));
  const warningPortfolioIds = new Set(alerts.filter((a) => a.severity === 'WARNING').map((a) => a.portfolioId));

  const aumAtCriticalRisk = portfolios
    .filter((p) => criticalPortfolioIds.has(p.id))
    .reduce((s, p) => s + p.totalAum, 0);

  const aumAtWarningRisk = portfolios
    .filter((p) => !criticalPortfolioIds.has(p.id) && warningPortfolioIds.has(p.id))
    .reduce((s, p) => s + p.totalAum, 0);

  const complianceRateAum = ((effectiveAum - aumAtCriticalRisk) / effectiveAum) * 100;

  // Quarterly performance trend data points for the last quarter (Nov/25, Dez/25, Jan/26, Fev/26)
  const isProjection = selectedPeriod === 'PROJEÇÃO_Q1';

  const aumQuarterlyTrend = isProjection
    ? [
        { label: 'Dez/25', value: 46.85 },
        { label: 'Jan/26', value: 48.95 },
        { label: 'Fev/26', value: Number((effectiveAum / 1000000).toFixed(2)) },
        { label: 'Mar/26 (proj)', value: Number(((effectiveAum + 3500000) / 1000000).toFixed(2)) },
      ]
    : [
        { label: 'Nov/25', value: 44.20 },
        { label: 'Dez/25', value: 46.85 },
        { label: 'Jan/26', value: 48.95 },
        { label: 'Fev/26', value: Number((effectiveAum / 1000000).toFixed(2)) },
      ];

  const revenueQuarterlyTrend = isProjection
    ? [
        { label: 'Dez/25', value: 398.2 },
        { label: 'Jan/26', value: 416.1 },
        { label: 'Fev/26', value: Number((monthlyRevenue / 1000).toFixed(1)) },
        { label: 'Mar/26 (proj)', value: Number(((monthlyRevenue * 1.06) / 1000).toFixed(1)) },
      ]
    : [
        { label: 'Nov/25', value: 375.7 },
        { label: 'Dez/25', value: 398.2 },
        { label: 'Jan/26', value: 416.1 },
        { label: 'Fev/26', value: Number((monthlyRevenue / 1000).toFixed(1)) },
      ];

  const pipelineQuarterlyTrend = isProjection
    ? [
        { label: 'Dez/25', value: 13.8 },
        { label: 'Jan/26', value: 15.6 },
        { label: 'Fev/26', value: Number((pipelineTotal / 1000000).toFixed(1)) },
        { label: 'Mar/26 (proj)', value: Number(((pipelineTotal * 1.15) / 1000000).toFixed(1)) },
      ]
    : [
        { label: 'Nov/25', value: 11.2 },
        { label: 'Dez/25', value: 13.8 },
        { label: 'Jan/26', value: 15.6 },
        { label: 'Fev/26', value: Number((pipelineTotal / 1000000).toFixed(1)) },
      ];

  const nnmQuarterlyTrend = isProjection
    ? [
        { label: 'Dez/25', value: 2.45 },
        { label: 'Jan/26', value: 3.20 },
        { label: 'Fev/26', value: Number((netNewMoneyYtd / 1000000).toFixed(2)) },
        { label: 'Mar/26 (proj)', value: Number(((netNewMoneyYtd + 2000000) / 1000000).toFixed(2)) },
      ]
    : [
        { label: 'Nov/25', value: 1.10 },
        { label: 'Dez/25', value: 2.45 },
        { label: 'Jan/26', value: 3.20 },
        { label: 'Fev/26', value: Number((netNewMoneyYtd / 1000000).toFixed(2)) },
      ];

  // Segment Breakdown
  const segmentStats = [
    { name: 'Private Wealth', aum: 23750000, fee: '0.95%', share: 46.3, revenueMonth: 188020, color: 'bg-emerald-500' },
    { name: 'Family Office', aum: 18900000, fee: '0.65%', share: 36.8, revenueMonth: 102375, color: 'bg-cyan-500' },
    { name: 'Previdência PGBL/VGBL', aum: 12400000, fee: '0.70%', share: 24.2, revenueMonth: 72330, color: 'bg-indigo-500' },
    { name: 'Institucional RPPS', aum: 9800000, fee: '0.50%', share: 19.1, revenueMonth: 40833, color: 'bg-amber-500' },
  ];

  // Advisor Leaderboard
  const advisors: AdvisorPerformance[] = [
    {
      name: 'Carlos Eduardo Mendes (CFA)',
      role: 'Sócio & Head de Wealth Management',
      totalAum: 23750000,
      monthlyRevenue: 188020,
      managedPortfoliosCount: 2,
      criticalBreachesCount: 1,
      warningBreachesCount: 0,
      complianceScore: 78,
    },
    {
      name: 'Marina Fagundes (CNPI)',
      role: 'Gestora Sênior de Previdência & Renda Fixa',
      totalAum: 14550000,
      monthlyRevenue: 105200,
      managedPortfoliosCount: 2,
      criticalBreachesCount: 0,
      warningBreachesCount: 1,
      complianceScore: 92,
    },
    {
      name: 'Renata Vasconcellos (CFA)',
      role: 'Diretora de Clientes Institucionais',
      totalAum: 9800000,
      monthlyRevenue: 68500,
      managedPortfoliosCount: 1,
      criticalBreachesCount: 0,
      warningBreachesCount: 1,
      complianceScore: 89,
    },
    {
      name: 'Guilherme Rocha (CGA)',
      role: 'Portfolio Manager Renda Variável & Tech',
      totalAum: 3200000,
      monthlyRevenue: 42100,
      managedPortfoliosCount: 1,
      criticalBreachesCount: 1,
      warningBreachesCount: 0,
      complianceScore: 72,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header / Executive Title Bar */}
      <div className="relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-b from-slate-800/70 via-slate-900/80 to-slate-950/90 border border-white/[0.09] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_12px_32px_rgba(0,0,0,0.35)] before:absolute before:inset-x-0 before:top-0 before:h-[1.5px] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-cyan-500/20 border border-amber-500/30 text-amber-400 backdrop-blur-md shadow-sm">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-xl font-extrabold text-white tracking-tight">
                    Owner Command Center
                  </h2>
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm uppercase tracking-wider">
                    Tela 15 • Diretoria Executiva
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consolidação estratégica de AUM, Receita Operacional, Pipeline Comercial e Exposição Regulatória CVM.
                </p>
              </div>
            </div>
          </div>

          {/* Period Selector & Controls */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-white/[0.08]">
              <button
                onClick={() => setSelectedPeriod('MÊS_ATUAL')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedPeriod === 'MÊS_ATUAL'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mês Atual (Fev/2026)
              </button>
              <button
                onClick={() => setSelectedPeriod('YTD_2026')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedPeriod === 'YTD_2026'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                YTD 2026
              </button>
              <button
                onClick={() => setSelectedPeriod('PROJEÇÃO_Q1')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedPeriod === 'PROJEÇÃO_Q1'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Projeção Q1/Q2
              </button>
            </div>

            {/* Pipeline Simulation Toggle */}
            <button
              onClick={() => setIsSimulatingPipeline(!isSimulatingPipeline)}
              className={`px-3.5 py-2 rounded-xl font-bold border transition-all duration-200 flex items-center gap-1.5 shadow-sm ${
                isSimulatingPipeline
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 ring-1 ring-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-800/90 text-slate-300 hover:text-white border-white/[0.08] hover:border-white/[0.15]'
              }`}
              title="Simula o impacto financeiro da conversão dos R$ 18.5M do pipeline"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isSimulatingPipeline ? 'Pipeline Ativo (+R$ 13.8M)' : 'Simular Pipeline (+R$ 18.5M)'}</span>
            </button>

            {/* Memo Modal Trigger */}
            <button
              onClick={() => setShowExecutiveMemoModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition-all duration-200 flex items-center gap-1.5 border border-emerald-500/40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Parecer para Sócios</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tier-1 Executive KPI Metric Cards (High-End Glassmorphism) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total AUM */}
        <div className="group relative rounded-2xl p-5 backdrop-blur-2xl bg-gradient-to-b from-slate-800/65 via-slate-900/85 to-slate-950/95 border border-white/[0.09] hover:border-emerald-400/50 hover:-translate-y-1 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_16px_36px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_20px_40px_rgba(16,185,129,0.15)] flex flex-col justify-between overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1.5px] before:bg-gradient-to-r before:from-transparent before:via-emerald-400/50 before:to-transparent">
          {/* Ambient Glass Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/25 transition-all duration-500" />

          <div className="relative z-10">
            {/* Header / Metric Label */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                  AUM Sob Gestão
                </span>
                <span className="mt-0.5 text-[9px] font-bold uppercase font-mono tracking-wider">
                  {isSimulatingPipeline ? (
                    <span className="text-cyan-400">● SIMULAÇÃO SANDBOX</span>
                  ) : dataMode === 'PROJECTION' || selectedPeriod === 'PROJEÇÃO_Q1' ? (
                    <span className="text-purple-400">● PROJEÇÃO ESTATÍSTICA</span>
                  ) : (
                    <span className="text-emerald-400">● LIVE DATA (CUSTÓDIA)</span>
                  )}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-400/30 rounded-xl text-emerald-300 backdrop-blur-md shadow-sm">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            {/* Primary Value & Badges */}
            <div className="mt-3.5">
              <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2 font-mono">
                R$ {(effectiveAum / 1000000).toFixed(2)}
                <span className="text-xl font-bold text-slate-400 font-sans">M</span>
                {isSimulatingPipeline && (
                  <span className="text-[10px] font-extrabold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-400/40 backdrop-blur-sm shadow-sm animate-pulse">
                    +27% Simulado
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  +4.8% MoM (+R$ 2.35M)
                </span>
                <span className="text-slate-400 text-[11px] font-medium">Meta: R$ 75M</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950/70 border border-white/[0.06] h-2 rounded-full mt-3 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                  style={{ width: `${Math.min(100, (effectiveAum / 75000000) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Docked Telemetry Chamber for Sparkline */}
          <div className="mt-4 -mx-5 -mb-5 p-4 rounded-b-2xl bg-slate-950/60 border-t border-white/[0.08] backdrop-blur-md relative z-10">
            <MiniSparkline
              data={aumQuarterlyTrend}
              color="emerald"
              valuePrefix="R$ "
              valueSuffix="M"
              trendTitle="Tendência AUM (3M)"
              growthLabel={isSimulatingPipeline ? '+47.3% tri (sim)' : '+16.1% no tri'}
            />
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="group relative rounded-2xl p-5 backdrop-blur-2xl bg-gradient-to-b from-slate-800/65 via-slate-900/85 to-slate-950/95 border border-white/[0.09] hover:border-amber-400/50 hover:-translate-y-1 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_16px_36px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_20px_40px_rgba(245,158,11,0.15)] flex flex-col justify-between overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1.5px] before:bg-gradient-to-r before:from-transparent before:via-amber-400/50 before:to-transparent">
          {/* Ambient Glass Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/25 transition-all duration-500" />

          <div className="relative z-10">
            {/* Header / Metric Label */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  Receita Total de Gestão
                </span>
                <span className="mt-0.5 text-[9px] font-bold uppercase font-mono tracking-wider">
                  {isSimulatingPipeline ? (
                    <span className="text-cyan-400">● SIMULAÇÃO SANDBOX</span>
                  ) : (
                    <span className="text-amber-400">● LIVE DATA (FATURADO)</span>
                  )}
                </span>
              </div>
              <div className="p-2.5 bg-amber-500/15 border border-amber-400/30 rounded-xl text-amber-300 backdrop-blur-md shadow-sm">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            {/* Primary Value & Badges */}
            <div className="mt-3.5">
              <div className="text-3xl font-black text-amber-300 tracking-tight flex items-baseline gap-1.5 font-mono">
                R$ {(monthlyRevenue / 1000).toFixed(1)}
                <span className="text-xl font-bold text-amber-400/80 font-sans">k</span>
                <span className="text-xs text-slate-400 font-normal font-sans ml-1">/ mês</span>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  +12.4% vs Orçado
                </span>
                <span className="text-slate-300 text-[11px] font-medium">Fee: <strong className="text-amber-200">0.85% a.a.</strong></span>
              </div>

              <div className="text-[11px] text-slate-400 mt-2.5 flex items-center justify-between bg-white/[0.02] px-2 py-1 rounded-md border border-white/[0.04]">
                <span>ARR Estimado:</span>
                <span className="font-semibold text-slate-200 font-mono">R$ {(annualManagementRevenue / 1000000).toFixed(2)}M + perf</span>
              </div>
            </div>
          </div>

          {/* Docked Telemetry Chamber for Sparkline */}
          <div className="mt-4 -mx-5 -mb-5 p-4 rounded-b-2xl bg-slate-950/60 border-t border-white/[0.08] backdrop-blur-md relative z-10">
            <MiniSparkline
              data={revenueQuarterlyTrend}
              color="amber"
              valuePrefix="R$ "
              valueSuffix="k"
              trendTitle="Tendência Receita (3M)"
            />
          </div>
        </div>

        {/* Card 3: Pipeline Value */}
        <div className="group relative rounded-2xl p-5 backdrop-blur-2xl bg-gradient-to-b from-slate-800/65 via-slate-900/85 to-slate-950/95 border border-white/[0.09] hover:border-cyan-400/50 hover:-translate-y-1 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_16px_36px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_20px_40px_rgba(6,182,212,0.15)] flex flex-col justify-between overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1.5px] before:bg-gradient-to-r before:from-transparent before:via-cyan-400/50 before:to-transparent">
          {/* Ambient Glass Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/25 transition-all duration-500" />

          <div className="relative z-10">
            {/* Header / Metric Label */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  Pipeline de Captação
                </span>
                <span className="mt-0.5 text-[9px] font-bold uppercase font-mono tracking-wider text-cyan-400">
                  ● PROJEÇÃO COMERCIAL ({pipelineDeals.length} MANDATOS)
                </span>
              </div>
              <div className="p-2.5 bg-cyan-500/15 border border-cyan-400/30 rounded-xl text-cyan-300 backdrop-blur-md shadow-sm">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>

            {/* Primary Value & Badges */}
            <div className="mt-3.5">
              <div className="text-3xl font-black text-cyan-300 tracking-tight flex items-baseline gap-2 font-mono">
                R$ {(pipelineTotal / 1000000).toFixed(1)}
                <span className="text-xl font-bold text-cyan-400/80 font-sans">M</span>
                <span className="text-xs text-slate-400 font-normal font-sans">({pipelineDeals.length} deals)</span>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                  Ponderado: <strong className="text-cyan-300 font-mono">R$ {(pipelineWeighted / 1000000).toFixed(1)}M</strong>
                </span>
                <span className="text-slate-400 text-[11px] font-medium">Conv: 74%</span>
              </div>

              <div className="text-[11px] text-slate-400 mt-2.5 flex items-center justify-between bg-white/[0.02] px-2 py-1 rounded-md border border-white/[0.04]">
                <span>Receita Anual Nova:</span>
                <span className="font-bold text-emerald-400 font-mono">+R$ {(pipelineRevenueAnnual / 1000).toFixed(0)}k/ano</span>
              </div>
            </div>
          </div>

          {/* Docked Telemetry Chamber for Sparkline */}
          <div className="mt-4 -mx-5 -mb-5 p-4 rounded-b-2xl bg-slate-950/60 border-t border-white/[0.08] backdrop-blur-md relative z-10">
            <MiniSparkline
              data={pipelineQuarterlyTrend}
              color="cyan"
              valuePrefix="R$ "
              valueSuffix="M"
              trendTitle="Tendência Pipeline (3M)"
            />
          </div>
        </div>

        {/* Card 4: Net New Money & Risk Exposure */}
        <div className="group relative rounded-2xl p-5 backdrop-blur-2xl bg-gradient-to-b from-slate-800/65 via-slate-900/85 to-slate-950/95 border border-white/[0.09] hover:border-indigo-400/50 hover:-translate-y-1 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_16px_36px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_20px_40px_rgba(99,102,241,0.15)] flex flex-col justify-between overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1.5px] before:bg-gradient-to-r before:from-transparent before:via-indigo-400/50 before:to-transparent">
          {/* Ambient Glass Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/25 transition-all duration-500" />

          <div className="relative z-10">
            {/* Header / Metric Label */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                  Captação Líquida (NNM) & Risco
                </span>
                <span className="mt-0.5 text-[9px] font-bold uppercase font-mono tracking-wider text-emerald-400">
                  ● LIVE DATA (AUDITADO)
                </span>
              </div>
              <div className="p-2.5 bg-indigo-500/15 border border-indigo-400/30 rounded-xl text-indigo-300 backdrop-blur-md shadow-sm">
                <Target className="w-4 h-4" />
              </div>
            </div>

            {/* Primary Value & Badges */}
            <div className="mt-3.5">
              <div className="text-3xl font-black text-indigo-200 tracking-tight flex items-baseline gap-1 font-mono">
                +R$ {(netNewMoneyYtd / 1000000).toFixed(2)}
                <span className="text-xl font-bold text-indigo-300/80 font-sans">M</span>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Churn: 0.0%
                </span>
                <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                  Risco: R$ {(aumAtCriticalRisk / 1000000).toFixed(1)}M
                </span>
              </div>

              <div className="text-[11px] text-slate-400 mt-2.5 flex items-center justify-between bg-white/[0.02] px-2 py-1 rounded-md border border-white/[0.04]">
                <span>Conformidade AUM:</span>
                <span className="font-semibold text-slate-200 font-mono">{complianceRateAum.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Docked Telemetry Chamber for Sparkline */}
          <div className="mt-4 -mx-5 -mb-5 p-4 rounded-b-2xl bg-slate-950/60 border-t border-white/[0.08] backdrop-blur-md relative z-10">
            <MiniSparkline
              data={nnmQuarterlyTrend}
              color="indigo"
              valuePrefix="+R$ "
              valueSuffix="M"
              trendTitle="Tendência NNM (3M)"
              growthLabel="+281% acumulado"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Mandate Risk & Revenue by Segment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Commercial Pipeline Tracker (Funil de Novos Mandatos) */}
        <div className="lg:col-span-7 relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-b from-slate-800/70 via-slate-900/80 to-slate-950/90 border border-white/[0.09] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_12px_32px_rgba(0,0,0,0.35)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-cyan-400" />
                Pipeline Comercial de Novos Mandatos (Tela 15)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Acompanhamento de propostas em onboarding para alocação em carteiras administradas.
              </p>
            </div>
            <span className="text-xs font-bold text-cyan-300 bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-500/30 shadow-sm font-mono">
              Total em Negociação: R$ {(pipelineTotal / 1000000).toFixed(1)}M
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-y border-white/[0.08]">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Cliente / Mandato</th>
                  <th className="py-2.5 px-3 font-bold">Segmento</th>
                  <th className="py-2.5 px-3 text-right font-bold">Volume AUM</th>
                  <th className="py-2.5 px-3 text-center font-bold">Fase</th>
                  <th className="py-2.5 px-3 text-right font-bold">Probabilidade</th>
                  <th className="py-2.5 px-3 text-right font-bold">Previsão Fechamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {pipelineDeals.map((deal) => {
                  let stageBadge = 'bg-slate-800 text-slate-300 border-slate-700';
                  if (deal.stage === 'Integralização') {
                    stageBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                  } else if (deal.stage === 'Contrato em Assinatura') {
                    stageBadge = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
                  } else if (deal.stage === 'Proposta IPS') {
                    stageBadge = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
                  } else if (deal.stage === 'Due Diligence') {
                    stageBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                  }

                  return (
                    <tr key={deal.id} className="hover:bg-white/[0.03] transition">
                      <td className="py-3 px-3 font-semibold text-white">
                        <div>{deal.clientName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Líder: {deal.leadAdvisor.split(' ')[0]}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {deal.segment}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-cyan-400 font-mono">
                        R$ {(deal.targetAum / 1000000).toFixed(1)}M
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stageBadge}`}>
                          {deal.stage}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <span className="font-bold text-slate-200 font-mono">{deal.probability}%</span>
                          <div className="w-12 bg-slate-950/80 border border-white/[0.08] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full rounded-full"
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 font-mono">
                        {deal.expectedClose}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* AI Commercial Opportunity Insight Card */}
          <div className="pt-2">
            <AIInsightCard
              id="opportunity-holding-morumbi"
              insight={{
                what: 'Mandato Holding Morumbi Family Office (R$ 8.0M) avançou para a fase final de Due Diligence com probabilidade de conversão de 65% para 90%.',
                why: 'Validação da política de investimentos e simulação de rebalanceamento fiduciário no sandbox do FlowCore atendeu a todas as restrições patrimoniais da família.',
                impact: 'Incremento de +R$ 8.0M no AUM consolidado da gestora e receita de taxa de administração recorrente de R$ 56.000/ano (+13.8% na meta trimestral).',
                action: 'Gerar minuta contratual com política IPS vinculada e parecer formal de conformidade do ComplianceAgent para envio ao comitê da família.',
                confidence: 94,
                source: 'Framework Comercial FlowCore v2.4 • Diretrizes CVM 30 (Suitability) • Resolução CVM 175',
              }}
              title="Oportunidade Comercial de Alta Probabilidade • IA Pipeline"
              subtitle="Mandato em Fechamento: Holding Morumbi Family Office (R$ 8.0M)"
              category="OPPORTUNITY"
              severity="INFO"
              portfolioName="Holding Morumbi"
              clientName="Family Office"
              onApplyAction={() => setShowExecutiveMemoModal(true)}
              actionLabel="Emitir Parecer Executivo"
              collapsible={true}
              defaultExpanded={true}
            />
          </div>
        </div>

        {/* Right (5 cols): Strategic Revenue & AUM by Segment */}
        <div className="lg:col-span-5 relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-b from-slate-800/70 via-slate-900/80 to-slate-950/90 border border-white/[0.09] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_12px_32px_rgba(0,0,0,0.35)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Receita & AUM por Segmento
            </h3>
            <span className="text-xs text-slate-400 font-medium">Yield médio 0.85%</span>
          </div>

          <div className="space-y-3">
            {segmentStats.map((seg) => (
              <div key={seg.name} className="p-3.5 bg-slate-950/70 rounded-xl border border-white/[0.07] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
                    <span className="font-bold text-white">{seg.name}</span>
                  </div>
                  <span className="text-slate-400">Fee: <strong className="text-slate-200">{seg.fee}</strong></span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono font-medium">
                    R$ {(seg.aum / 1000000).toFixed(1)}M ({seg.share}%)
                  </span>
                  <span className="font-bold text-emerald-400 font-mono">
                    R$ {(seg.revenueMonth / 1000).toFixed(1)}k/mês
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-900/90 border border-white/[0.05] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${seg.color} h-full rounded-full`}
                    style={{ width: `${seg.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Regulatory Risk Exposure Summary Card */}
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 space-y-2 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Exposição a Risco de Mandato CVM
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-black text-[10px] border border-rose-500/30 uppercase tracking-wider">
                15.7% AUM
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Existem <strong className="text-white">2 carteiras em desenquadramento crítico</strong> (R$ {(aumAtCriticalRisk / 1000000).toFixed(2)}M) que exigem rebalanceamento antes do comitê semanal para evitar apontamento de não-conformidade.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <button
                onClick={() => onNavigateTab('simulator')}
                className="text-xs font-bold text-rose-300 hover:text-rose-200 flex items-center gap-1 transition"
              >
                <span>Acessar Simulador de Rebalanceamento</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Condensed Clients at Risk & Health Scores */}
      <ClientsAtRiskList
        portfolios={portfolios}
        alerts={alerts}
        onSelectPortfolio={onSelectPortfolio}
        onStartRebalance={onStartRebalance}
      />

      {/* Row 4: Advisor Performance Matrix */}
      <div className="relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-b from-slate-800/70 via-slate-900/80 to-slate-950/90 border border-white/[0.09] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_12px_32px_rgba(0,0,0,0.35)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Matriz de Performance por Sócio & Gestor de Conta
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribuição de patrimônio sob gestão, faturamento gerado e índice de governança/compliance.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/[0.08]">
            {advisors.length} sócios / gestores ativos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {advisors.map((adv) => (
            <div
              key={adv.name}
              className="bg-slate-950/70 border border-white/[0.07] rounded-xl p-4 hover:border-slate-600 transition-all duration-200 space-y-3 shadow-sm"
            >
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">{adv.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{adv.role}</p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">AUM sob Gestão:</span>
                  <strong className="text-white font-mono font-bold">R$ {(adv.totalAum / 1000000).toFixed(1)}M</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Receita Estimada:</span>
                  <strong className="text-emerald-400 font-mono font-bold">R$ {(adv.monthlyRevenue / 1000).toFixed(0)}k/mês</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Score de Compliance:</span>
                  <strong className={adv.complianceScore >= 85 ? 'text-emerald-400 font-mono font-bold' : 'text-amber-400 font-mono font-bold'}>
                    {adv.complianceScore}%
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Desenquadramentos:</span>
                  <div className="flex items-center space-x-1 font-bold text-[11px]">
                    {adv.criticalBreachesCount > 0 ? (
                      <span className="text-rose-400">🔴 {adv.criticalBreachesCount}</span>
                    ) : null}
                    {adv.warningBreachesCount > 0 ? (
                      <span className="text-amber-400">🟡 {adv.warningBreachesCount}</span>
                    ) : null}
                    {adv.criticalBreachesCount === 0 && adv.warningBreachesCount === 0 ? (
                      <span className="text-emerald-400">🟢 0</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onNavigateTab('portfolios')}
                  className="w-full py-1.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-1"
                >
                  <span>Ver Carteiras do Gestor</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Parecer Executivo para Sócios */}
      {showExecutiveMemoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Relatório Executivo para Comitê de Sócios</h3>
              </div>
              <button
                onClick={() => setShowExecutiveMemoModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 bg-slate-800 rounded-lg"
              >
                Fechar
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
{`RELATÓRIO EXECUTIVO FLOWCORE - COMITÊ DE GESTÃO & SÓCIOS
Data de Referência: ${new Date().toLocaleDateString('pt-BR')}
Origem: Owner Command Center (Tela 15)

1. SÍNTESE PATRIMONIAL & RECEITA
• AUM Consolidado: R$ ${(effectiveAum / 1000000).toFixed(2)}M
• Faturamento Recorrente Mensal: R$ ${(monthlyRevenue / 1000).toFixed(1)}k
• Taxa Média Ponderada: 0.85% a.a.
• Captação Líquida YTD: +R$ ${(netNewMoneyYtd / 1000000).toFixed(2)}M (Zero churn)

2. PIPELINE COMERCIAL (ONBOARDING)
• Volume Total em Negociação: R$ ${(pipelineTotal / 1000000).toFixed(1)}M (${pipelineDeals.length} mandatos)
• Volume Ponderado (Probabilidade): R$ ${(pipelineWeighted / 1000000).toFixed(1)}M
• Receita Adicional Projetada: +R$ ${(pipelineRevenueAnnual / 1000).toFixed(0)}k/ano

3. RISCO REGULATÓRIO CVM 175 & POLÍTICA DE INVESTIMENTO
• AUM em Conformidade Total: ${complianceRateAum.toFixed(1)}%
• Volume em Desenquadramento Crítico (> 5 p.p.): R$ ${(aumAtCriticalRisk / 1000000).toFixed(1)}M
• Ações Recomendadas: Efetivar as boletas de rebalanceamento sugeridas pelo ComplianceAgent no Simulador para restabelecer os tetos de Renda Variável e Ativos Internacionais.`}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`RELATÓRIO EXECUTIVO FLOWCORE - COMITÊ DE SÓCIOS\nAUM: R$ ${(effectiveAum / 1000000).toFixed(2)}M\nReceita: R$ ${(monthlyRevenue / 1000).toFixed(1)}k/mês\nPipeline: R$ ${(pipelineTotal / 1000000).toFixed(1)}M`);
                  alert('Parecer executivo copiado para a área de transferência!');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Copiar Texto
              </button>
              <button
                onClick={() => setShowExecutiveMemoModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
