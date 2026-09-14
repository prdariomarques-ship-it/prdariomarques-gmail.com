import React from 'react';
import {
  Sliders,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  Building2,
  DollarSign,
  Activity,
  Zap,
} from 'lucide-react';
import { DataMode } from '../../types';
import { TabKey } from '../Header';
import { SimulationScenario, ProjectionScenario } from '../../utils/simulationEngine';

interface DataModeControlBannerProps {
  dataMode: DataMode;
  onSetDataMode: (mode: DataMode) => void;
  simulationScenario: SimulationScenario;
  onSelectSimulationScenario: (scenario: SimulationScenario) => void;
  projectionScenario: ProjectionScenario;
  onSelectProjectionScenario: (scenario: ProjectionScenario) => void;
  onNavigateTab: (tab: TabKey) => void;
  baseAum: number;
  effectiveAum: number;
  criticalAlertsCount: number;
  complianceRate: number;
}

export const DataModeControlBanner: React.FC<DataModeControlBannerProps> = ({
  dataMode,
  onSetDataMode,
  simulationScenario,
  onSelectSimulationScenario,
  projectionScenario,
  onSelectProjectionScenario,
  onNavigateTab,
  baseAum,
  effectiveAum,
  criticalAlertsCount,
  complianceRate,
}) => {
  if (dataMode === 'LIVE') return null;

  const formatBRL = (val: number) => {
    return (val / 1_000_000).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div
      className={`border-b transition-all duration-300 ${
        dataMode === 'SIMULATION'
          ? 'bg-gradient-to-r from-cyan-950/80 via-slate-900 to-cyan-950/80 border-cyan-500/40 text-cyan-100'
          : 'bg-gradient-to-r from-purple-950/80 via-slate-900 to-purple-950/80 border-purple-500/40 text-purple-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status & Description */}
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`p-2 rounded-lg border shrink-0 ${
                dataMode === 'SIMULATION'
                  ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                  : 'bg-purple-500/20 border-purple-500/30 text-purple-300'
              }`}
            >
              {dataMode === 'SIMULATION' ? (
                <Sliders className="w-5 h-5 animate-pulse" />
              ) : (
                <TrendingUp className="w-5 h-5 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    dataMode === 'SIMULATION'
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                      : 'bg-purple-500/20 text-purple-200 border-purple-400/40'
                  }`}
                >
                  {dataMode === 'SIMULATION'
                    ? '⚡ Modo Simulação Ativo (Sandbox)'
                    : '📈 Modo Projeção Estatística Q1/Q2'}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {dataMode === 'SIMULATION'
                    ? 'Modelagem fiduciária e teste de cenários em tempo real'
                    : 'Incorporando mandatos do pipeline comercial fiduciário (+R$ 18.5M)'}
                </span>
              </div>

              {/* Dynamic Metrics Badge */}
              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                <span className="inline-flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                  <Activity className="w-3 h-3 text-slate-400" />
                  AUM:{' '}
                  <strong className="text-white font-mono">
                    R$ {formatBRL(effectiveAum)}M
                  </strong>
                  {dataMode === 'PROJECTION' && (
                    <span className="text-purple-400 font-bold ml-0.5">
                      (+R$ {formatBRL(effectiveAum - baseAum)}M)
                    </span>
                  )}
                </span>

                <span className="inline-flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Conformidade:{' '}
                  <strong
                    className={`font-mono font-bold ${
                      complianceRate >= 90
                        ? 'text-emerald-400'
                        : complianceRate >= 70
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {complianceRate.toFixed(1)}%
                  </strong>
                </span>

                <span className="inline-flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                  <AlertTriangle
                    className={`w-3 h-3 ${
                      criticalAlertsCount === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  />
                  Alertas Críticos:{' '}
                  <strong
                    className={`font-mono font-bold ${
                      criticalAlertsCount === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {criticalAlertsCount}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Scenario Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {dataMode === 'SIMULATION' ? (
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-cyan-500/30">
                <span className="text-[10px] text-cyan-300/80 font-bold uppercase px-2">
                  Cenário:
                </span>
                <button
                  onClick={() => onSelectSimulationScenario('REBALANCE_IDEAL')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    simulationScenario === 'REBALANCE_IDEAL'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-cyan-200 hover:bg-cyan-500/20'
                  }`}
                  title="Simula a execução do rebalanceamento prescrito pelo ComplianceAgent (0 alertas)"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Rebalanceamento Ideal (100% Ok)
                </button>

                <button
                  onClick={() => onSelectSimulationScenario('MARKET_STRESS')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    simulationScenario === 'MARKET_STRESS'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-cyan-200 hover:bg-rose-500/20'
                  }`}
                  title="Simula choque de mercado (+18% Ações, -8% Renda Fixa) para testar bandas"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Estresse de Mercado (+18% Vol)
                </button>

                <button
                  onClick={() => onSelectSimulationScenario('LIQUIDITY_INJECTION')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    simulationScenario === 'LIQUIDITY_INJECTION'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-cyan-200 hover:bg-emerald-500/20'
                  }`}
                  title="Simula injeção de R$ 10M de liquidez distribuídos entre as carteiras"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Aporte de Liquidez (+R$ 10M)
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-purple-500/30">
                <span className="text-[10px] text-purple-300/80 font-bold uppercase px-2">
                  Cenário:
                </span>
                <button
                  onClick={() => onSelectProjectionScenario('FULL_PIPELINE')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    projectionScenario === 'FULL_PIPELINE'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'text-purple-200 hover:bg-purple-500/20'
                  }`}
                  title="Incorpora todos os 4 mandatos previstos no pipeline comercial fiduciário"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Pipeline Completo (+4 Clientes / +R$ 18.5M)
                </button>

                <button
                  onClick={() => onSelectProjectionScenario('WEIGHTED_PIPELINE')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    projectionScenario === 'WEIGHTED_PIPELINE'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'text-purple-200 hover:bg-purple-500/20'
                  }`}
                  title="Apenas mandatos com probabilidade de fechamento > 70%"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ponderado por Probabilidade (R$ 65.1M)
                </button>
              </div>
            )}

            {/* Quick Navigation and Reset */}
            <div className="flex items-center gap-2">
              {dataMode === 'SIMULATION' ? (
                <button
                  onClick={() => onNavigateTab('simulator')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <span>Abrir Boletas</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={() => onNavigateTab('owner')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <span>Ver DRE &amp; Receita</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={() => onSetDataMode('LIVE')}
                className="px-2.5 py-1 rounded bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors"
                title="Sair do modo atual e restaurar base demonstrativa padrão"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Voltar Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
