import React, { useState } from 'react';
import {
  AlertTriangle,
  Play,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  ShieldCheck,
  Zap,
  Sliders,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  DollarSign,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  STRESS_SCENARIOS,
  StressScenarioId,
  SimulationScenario,
  ProjectionScenario,
} from '../../utils/simulationEngine';
import { TabKey } from '../Header';

interface DataModeControlBannerProps {
  dataMode: 'LIVE' | 'SIMULATION' | 'PROJECTION';
  onSetDataMode: (mode: 'LIVE' | 'SIMULATION' | 'PROJECTION') => void;
  simulationScenario: SimulationScenario;
  onSelectSimulationScenario: (scenario: SimulationScenario) => void;
  projectionScenario?: ProjectionScenario;
  onSelectProjectionScenario?: (scenario: ProjectionScenario) => void;
  onNavigateTab?: (tab: TabKey) => void;
  baseAum?: number;
  effectiveAum?: number;
  criticalAlertsCount?: number;
  complianceRate?: number;
}

export const DataModeControlBanner: React.FC<DataModeControlBannerProps> = ({
  dataMode,
  onSetDataMode,
  simulationScenario,
  onSelectSimulationScenario,
  projectionScenario = 'BASELINE',
  onSelectProjectionScenario,
  onNavigateTab,
  baseAum = 28500000,
  effectiveAum = 28500000,
  criticalAlertsCount = 0,
  complianceRate = 94.2,
}) => {
  const [showHypothesis, setShowHypothesis] = useState(false);

  const activeScenarioDef =
    STRESS_SCENARIOS[simulationScenario as StressScenarioId] || STRESS_SCENARIOS.BASELINE;

  const aumDiff = effectiveAum - baseAum;
  const aumDiffPercent = baseAum > 0 ? (aumDiff / baseAum) * 100 : 0;
  const isLoss = aumDiff < 0;

  const quickScenarios: StressScenarioId[] = [
    'BASELINE',
    'EQUITY_DROP_10',
    'RATES_HIKE_200',
    'EQUITY_DROP_20',
    'RATES_HIKE_400',
    'STRESS_CRISIS',
    'FX_SHOCK_15',
    'CREDIT_SPREAD_300',
  ];

  return (
    <div className="w-full bg-[#0B1120] border-b border-blue-900/40 shadow-2xl relative z-40 transition-all animate-fadeIn">
      {/* Top Warning Strip */}
      <div className="bg-gradient-to-r from-amber-600/30 via-blue-600/30 to-purple-600/30 px-4 py-1.5 flex items-center justify-between text-xs border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
            {dataMode === 'SIMULATION'
              ? 'Ambiente de Simulação de Estresse de Mercado Ativo'
              : dataMode === 'PROJECTION'
              ? 'Modo Projeção Estatística Ativo'
              : 'Simulação Rápida de Resiliência'}
          </span>
          <span className="hidden md:inline text-slate-400 text-[11px]">
            — Os valores patrimoniais abaixo refletem choques macroeconômicos aplicados em tempo real.
          </span>
        </div>

        <div className="flex items-center gap-3">
          {dataMode !== 'LIVE' && (
            <button
              onClick={() => onSetDataMode('LIVE')}
              className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium transition border border-slate-700"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              Sair e Voltar ao Modo Live
            </button>
          )}
        </div>
      </div>

      {/* Main Banner Controls Container */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Scenario Selector */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                Cenário de Estresse de Mercado:
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${activeScenarioDef.colorBadge}`}
              >
                Severidade: {activeScenarioDef.severity}
              </span>
            </div>

            {/* Scenario Pills Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              {quickScenarios.map((scenId) => {
                const scen = STRESS_SCENARIOS[scenId];
                const isSelected = simulationScenario === scenId;
                return (
                  <button
                    key={scenId}
                    onClick={() => {
                      if (dataMode !== 'SIMULATION') {
                        onSetDataMode('SIMULATION');
                      }
                      onSelectSimulationScenario(scenId);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/20 scale-[1.02]'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {scenId === 'EQUITY_DROP_10' && <TrendingDown className="w-3.5 h-3.5 text-amber-400" />}
                    {scenId === 'EQUITY_DROP_20' && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                    {scenId === 'RATES_HIKE_200' && <TrendingUp className="w-3.5 h-3.5 text-amber-400" />}
                    {scenId === 'RATES_HIKE_400' && <TrendingUp className="w-3.5 h-3.5 text-rose-400" />}
                    {scenId === 'STRESS_CRISIS' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                    {scenId === 'FX_SHOCK_15' && <DollarSign className="w-3.5 h-3.5 text-purple-400" />}
                    {scenId === 'BASELINE' && <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />}
                    {scen.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Shock Metrics & Resilience Card */}
          <div className="flex flex-wrap items-center gap-3 lg:border-l lg:border-slate-800 lg:pl-6">
            {/* Impact Metric */}
            <div className="p-2.5 px-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Variação AUM sob Estresse
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-base font-black font-mono tracking-tight ${
                    isLoss ? 'text-rose-400' : aumDiff > 0 ? 'text-emerald-400' : 'text-slate-200'
                  }`}
                >
                  {aumDiff === 0 ? 'Neutro (0,0%)' : `${aumDiff > 0 ? '+' : ''}${aumDiffPercent.toFixed(1)}%`}
                </span>
                {aumDiff !== 0 && (
                  <span className="text-xs text-slate-400 font-mono">
                    ({aumDiff > 0 ? '+' : ''}R$ {(aumDiff / 1_000_000).toFixed(2)}M)
                  </span>
                )}
              </div>
            </div>

            {/* Compliance & Resilience Badge */}
            <div className="p-2.5 px-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Resiliência / CVM 175
              </span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-slate-100">
                  {simulationScenario === 'STRESS_CRISIS'
                    ? '82/100 (Moderada)'
                    : simulationScenario === 'EQUITY_DROP_20'
                    ? '85/100 (Sólida)'
                    : '91/100 (Alta)'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab && onNavigateTab('simulator')}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                Ver no Simulador
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>

              <button
                onClick={() => setShowHypothesis(!showHypothesis)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition"
                title="Detalhes da hipótese de mercado"
              >
                {showHypothesis ? <ChevronUp className="w-4 h-4" /> : <Info className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Hypothesis & Shocks Details */}
        {showHypothesis && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-200">{activeScenarioDef.name}: </span>
                <span className="text-slate-300">{activeScenarioDef.description}</span>
                <p className="text-slate-400 text-[11px] mt-0.5 font-mono">
                  Hipótese: {activeScenarioDef.hypothesis}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-300">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                Ações: {activeScenarioDef.shocks.equitiesPercent}%
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                DI/Pré: {activeScenarioDef.shocks.fixedIncomePrePercent}%
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                FIIs: {activeScenarioDef.shocks.realEstatePercent}%
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                Dólar/Offshore: {activeScenarioDef.shocks.offshoreFxPercent >= 0 ? '+' : ''}
                {activeScenarioDef.shocks.offshoreFxPercent}%
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                Selic Estimada: {activeScenarioDef.shocks.cdiNewRate}% a.a.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
