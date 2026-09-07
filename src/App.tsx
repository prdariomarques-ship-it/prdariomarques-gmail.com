import React, { useState, useEffect } from 'react';
import { Header, TabKey } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { OwnerCommandCenterView } from './components/OwnerCommandCenterView';
import { AlertsView } from './components/AlertsView';
import { PortfoliosView } from './components/PortfoliosView';
import { RebalanceSimulatorView } from './components/RebalanceSimulatorView';
import { AiComplianceChatView } from './components/AiComplianceChatView';
import { Portfolio, ComplianceAlert, RebalanceExecutionResult, DataMode } from './types';
import { RefreshCw, ShieldAlert, Sparkles, Activity, Bot } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [dataMode, setDataMode] = useState<DataMode>('LIVE');
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('port-001');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [agentInitialQuery, setAgentInitialQuery] = useState<string>('');

  // Fetch data from backend
  const fetchData = async () => {
    try {
      const [portsRes, alertsRes] = await Promise.all([
        fetch('/api/portfolios'),
        fetch('/api/alerts'),
      ]);
      const portsData = await portsRes.json();
      const alertsData = await alertsRes.json();

      if (portsData.success) {
        setPortfolios(portsData.portfolios);
        if (portsData.portfolios.length > 0 && !selectedPortfolioId) {
          setSelectedPortfolioId(portsData.portfolios[0].id);
        }
      }
      if (alertsData.success) {
        setAlerts(alertsData.alerts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset demo data
  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await fetch('/api/portfolios/reset', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Error resetting data:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Rebalance executed callback
  const handleRebalanceExecuted = (result: RebalanceExecutionResult) => {
    // Refresh alerts and portfolios
    fetchData();
  };

  // Quick navigation handlers
  const handleStartRebalance = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId);
    setActiveTab('simulator');
  };

  const handleSelectPortfolio = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId);
    setActiveTab('portfolios');
  };

  const handleOpenAgentWithPortfolio = (portfolioId: string) => {
    const port = portfolios.find((p) => p.id === portfolioId);
    if (port) {
      setAgentInitialQuery(`Faça uma auditoria minuciosa da ${port.name} (${port.code}) e sugira o plano ótimo de reenquadramento.`);
    }
    setActiveTab('agent');
  };

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center animate-pulse">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center space-x-2 text-slate-300 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Carregando custódia e executando ComplianceAgent...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        criticalAlertsCount={criticalCount}
        warningAlertsCount={warningCount}
        onResetData={handleResetData}
        isResetting={isResetting}
        dataMode={dataMode}
        onDataModeChange={setDataMode}
      />

      {/* FLOWCORE ACTIVE: Background Agent Status Bar */}
      <div className="bg-slate-950/90 border-b border-white/[0.06] px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-white text-[11px] tracking-wider uppercase flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              FLOWCORE ACTIVE
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 text-[11px]">
              ComplianceAgent Sentinel v2.4 monitorando 4 carteiras, mandatos CVM 175 e IPS em tempo real.
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-slate-400">
              Modo Atual:
              <strong className={`ml-1 px-2 py-0.5 rounded font-mono font-bold ${
                dataMode === 'LIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : dataMode === 'SIMULATION'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}>
                {dataMode === 'LIVE' ? 'LIVE DATA' : dataMode === 'SIMULATION' ? 'SIMULAÇÃO' : 'PROJEÇÃO'}
              </strong>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">Última checagem: <span className="text-slate-200 font-mono">agora</span></span>
          </div>
        </div>
      </div>

      {/* Persistent Disclaimer for Non-Live Modes */}
      {dataMode === 'SIMULATION' && (
        <div className="bg-cyan-950/60 border-b border-cyan-500/40 px-4 py-2 text-center text-xs text-cyan-200">
          <strong>MODO SIMULAÇÃO ATIVO:</strong> Os valores de alocação e rebalanceamento estão sendo modelados em ambiente sandbox. Nenhuma ordem é transmitida a corretoras.
        </div>
      )}
      {dataMode === 'PROJECTION' && (
        <div className="bg-purple-950/60 border-b border-purple-500/40 px-4 py-2 text-center text-xs text-purple-200">
          <strong>MODO PROJEÇÃO ESTATÍSTICA:</strong> Incorporando aportes previstos do pipeline comercial (+R$ 18.5M) e projeções de rendimento Q1/Q2.
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            portfolios={portfolios}
            alerts={alerts}
            onSelectPortfolio={handleSelectPortfolio}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onStartRebalance={handleStartRebalance}
          />
        )}

        {activeTab === 'owner' && (
          <OwnerCommandCenterView
            portfolios={portfolios}
            alerts={alerts}
            onSelectPortfolio={handleSelectPortfolio}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onStartRebalance={handleStartRebalance}
            dataMode={dataMode}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            alerts={alerts}
            onStartRebalance={handleStartRebalance}
            onSelectPortfolio={handleSelectPortfolio}
          />
        )}

        {activeTab === 'portfolios' && (
          <PortfoliosView
            portfolios={portfolios}
            selectedPortfolioId={selectedPortfolioId}
            onSelectPortfolio={setSelectedPortfolioId}
            onStartRebalance={handleStartRebalance}
            onOpenAgentWithPortfolio={handleOpenAgentWithPortfolio}
          />
        )}

        {activeTab === 'simulator' && (
          <RebalanceSimulatorView
            portfolios={portfolios}
            selectedPortfolioId={selectedPortfolioId}
            onSelectPortfolio={setSelectedPortfolioId}
            onRebalanceExecuted={handleRebalanceExecuted}
          />
        )}

        {activeTab === 'agent' && (
          <AiComplianceChatView
            portfolios={portfolios}
            alerts={alerts}
            initialQuery={agentInitialQuery}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-4 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">FlowCore Compliance System</span>
            <span>•</span>
            <span>Regras CVM 175, Anbima &amp; Governança de Portfólio</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>🟢 Normal: No limite</span>
            <span>🟡 Atenção: ≤ 5 p.p.</span>
            <span>🔴 Crítico: &gt; 5 p.p.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
