import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header, TabKey } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { OwnerCommandCenterView } from './components/OwnerCommandCenterView';
import { AlertsView } from './components/AlertsView';
import { PortfoliosView } from './components/PortfoliosView';
import { RebalanceSimulatorView } from './components/RebalanceSimulatorView';
import { AiComplianceChatView } from './components/AiComplianceChatView';
import { LimitsConfigurationView } from './components/LimitsConfigurationView';
import { ApiDiagnosticsView } from './components/ApiDiagnosticsView';
import { BarbellStrategyView } from './components/BarbellStrategyView';
import { ConnectivityLatencyBadge } from './components/common/ConnectivityLatencyBadge';
import {
  Portfolio,
  ComplianceAlert,
  RebalanceExecutionResult,
  DataMode,
  ComplianceNotification,
  NotificationChannelSettings,
  SecondaryDispatchLog,
  AssetClassThresholdConfig,
  PerformanceAlert,
} from './types';
import { initialPortfolios } from './server/portfolioRepo';
import { ComplianceAgent } from './server/complianceAgent';
import { RefreshCw, ShieldAlert, Sparkles, Activity, Bot, Zap, Bell, CheckCircle2, Mail, Smartphone } from 'lucide-react';
import { NotificationToastContainer } from './components/NotificationToast';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { ApiSecurityModal } from './components/common/ApiSecurityModal';
import { DataModeControlBanner } from './components/common/DataModeControlBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import {
  resolvePortfoliosAndAlertsForMode,
  SimulationScenario,
  ProjectionScenario,
} from './utils/simulationEngine';
import { authenticatedFetch, subscribeAuthStatusChange, getAuthErrorState } from './lib/apiClient';
import { playCriticalAlertSound, isSoundEnabled, setSoundEnabled } from './utils/audioNotification';

import { MarketTicker } from './components/common/MarketTicker';
import { PWAInstallButton } from './components/PWAInstallButton';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [dataMode, setDataMode] = useState<DataMode>('LIVE');
  const [simulationScenario, setSimulationScenario] = useState<SimulationScenario>('REBALANCE_IDEAL');
  const [projectionScenario, setProjectionScenario] = useState<ProjectionScenario>('FULL_PIPELINE');
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [performanceAlerts, setPerformanceAlerts] = useState<PerformanceAlert[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('port-001');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [agentInitialQuery, setAgentInitialQuery] = useState<string>('');

  // Notificações e Monitoramento em Tempo Real
  const [notifications, setNotifications] = useState<ComplianceNotification[]>([]);
  const [activeToasts, setActiveToasts] = useState<ComplianceNotification[]>([]);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(isSoundEnabled);
  const [isSimulatingShock, setIsSimulatingShock] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScanTime, setLastScanTime] = useState<string>('agora');

  // Canais Secundários de Notificação (E-mail e SMS)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [channelSettings, setChannelSettings] = useState<NotificationChannelSettings>({
    email: {
      enabled: true,
      recipient: 'compliance.officer@FlowCore.investments',
      sendOnCriticalOnly: true,
      includeReportAttachment: true,
    },
    sms: {
      enabled: true,
      phoneNumber: '+55 (11) 91234-5678',
      sendOnCriticalOnly: true,
    },
    inAppAudio: true,
  });
  const [dispatchLogs, setDispatchLogs] = useState<SecondaryDispatchLog[]>([]);

  // Autenticação da API (Bearer Token)
  const [isApiSecurityModalOpen, setIsApiSecurityModalOpen] = useState<boolean>(false);
  const [hasAuthError, setHasAuthError] = useState<boolean>(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string>('');

  useEffect(() => {
    return subscribeAuthStatusChange((hasErr, msg) => {
      setHasAuthError(hasErr);
      setAuthErrorMessage(msg || '');
    });
  }, []);

  const seenAlertIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  // Helper para buscar e fazer parse seguro de JSON com cabeçalho de autenticação Bearer
  const safeJsonFetch = async (url: string, init?: RequestInit) => {
    try {
      const res = await authenticatedFetch(url, init);
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        console.warn(`[API] Resposta não-JSON recebida de ${url} (status ${res.status})`);
        return null;
      }
    } catch (err) {
      console.warn(`[API] Falha de rede ao requisitar ${url}:`, err);
      return null;
    }
  };

  // Carrega configurações de canais secundários do backend
  const fetchNotificationSettings = async () => {
    try {
      const data = await safeJsonFetch('/api/notifications/settings');
      if (data && data.success && data.settings) {
        setChannelSettings(data.settings);
      }
    } catch (e) {
      console.error('Erro ao carregar configurações de canais:', e);
    }
  };

  // Carrega histórico de despachos de canais secundários
  const fetchDispatchLogs = async () => {
    try {
      const data = await safeJsonFetch('/api/notifications/dispatches');
      if (data && data.success && data.logs) {
        setDispatchLogs(data.logs);
      }
    } catch (e) {
      console.error('Erro ao carregar registros de despacho:', e);
    }
  };

  // Salva configurações de canais secundários
  const handleSaveNotificationSettings = async (newSettings: NotificationChannelSettings) => {
    try {
      const data = await safeJsonFetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (data && data.success && data.settings) {
        setChannelSettings(data.settings);
      }
    } catch (e) {
      console.error('Erro ao salvar preferências de canais:', e);
      throw e;
    }
  };

  // Despacha teste sob demanda
  const handleTestDispatch = async (channel: 'EMAIL' | 'SMS' | 'ALL', recipient?: string) => {
    try {
      const data = await safeJsonFetch('/api/notifications/dispatches/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, recipient }),
      });
      await fetchDispatchLogs();
      return {
        success: data?.success ?? true,
        message: data?.message || 'Notificação de teste enviada com sucesso.',
      };
    } catch (e) {
      console.error('Erro ao despachar teste:', e);
      return {
        success: false,
        message: 'Falha ao conectar com o serviço de canais de notificação.',
      };
    }
  };

  // Limpa histórico de despachos
  const handleClearDispatchLogs = async () => {
    try {
      await authenticatedFetch('/api/notifications/dispatches/clear', { method: 'POST' });
      setDispatchLogs([]);
    } catch (e) {
      console.error('Erro ao limpar histórico de despachos:', e);
    }
  };

  // Processa alertas recebidos para identificar novos alertas críticos
  const processAlertsForNotifications = (newAlerts: ComplianceAlert[], portsList: Portfolio[]) => {
    const criticals = newAlerts.filter((a) => a.severity === 'CRITICAL');
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (isInitialLoadRef.current) {
      // Carga inicial: registra no histórico como já lidos e marca os IDs no Set
      const initialNotifs: ComplianceNotification[] = criticals.map((a) => {
        const port = portsList.find((p) => p.id === a.portfolioId);
        seenAlertIdsRef.current.add(a.id);
        return {
          id: `notif-${a.id}-${Date.now()}`,
          alertId: a.id,
          portfolioId: a.portfolioId,
          portfolioName: a.portfolioName,
          portfolioCode: port?.code,
          clientName: a.clientName,
          assetClass: a.assetClass,
          severity: a.severity,
          currentPercent: a.currentPercent,
          maxPercent: a.maxPercent,
          minPercent: a.minPercent,
          deviationPP: a.deviationPP,
          excessValueBRL: a.excessValueBRL,
          ruleSource: a.ruleSource,
          policyId: a.policyId,
          limit: a.limit,
          currentValue: a.currentValue,
          difference: a.difference,
          rule_source: a.ruleSource,
          policy_id: a.policyId,
          current_value: a.currentValue,
          mandateVsInternalExplanation: a.mandateVsInternalExplanation,
          message: a.message,
          suggestedAction: a.suggestedAction,
          timestamp: timeFormatted,
          createdAt: Date.now(),
          read: true,
        };
      });
      setNotifications(initialNotifs);
      isInitialLoadRef.current = false;
      return;
    }

    // Monitoramento contínuo: identifica novos alertas críticos
    const newCriticals: ComplianceAlert[] = [];
    for (const c of criticals) {
      if (!seenAlertIdsRef.current.has(c.id)) {
        newCriticals.push(c);
        seenAlertIdsRef.current.add(c.id);
      }
    }

    if (newCriticals.length > 0) {
      // 🔔 Toca sinal sonoro imediatamente
      playCriticalAlertSound();

      const createdNotifs: ComplianceNotification[] = newCriticals.map((a) => {
        const port = portsList.find((p) => p.id === a.portfolioId);
        return {
          id: `notif-${a.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          alertId: a.id,
          portfolioId: a.portfolioId,
          portfolioName: a.portfolioName,
          portfolioCode: port?.code,
          clientName: a.clientName,
          assetClass: a.assetClass,
          severity: a.severity,
          currentPercent: a.currentPercent,
          maxPercent: a.maxPercent,
          minPercent: a.minPercent,
          deviationPP: a.deviationPP,
          excessValueBRL: a.excessValueBRL,
          ruleSource: a.ruleSource,
          policyId: a.policyId,
          limit: a.limit,
          currentValue: a.currentValue,
          difference: a.difference,
          rule_source: a.ruleSource,
          policy_id: a.policyId,
          current_value: a.currentValue,
          mandateVsInternalExplanation: a.mandateVsInternalExplanation,
          message: a.message,
          suggestedAction: a.suggestedAction,
          timestamp: timeFormatted,
          createdAt: Date.now(),
          read: false,
        };
      });

      // Atualiza a lista da central de notificações e dispara o Toast flutuante imediatamente
      setNotifications((prev) => [...createdNotifs, ...prev]);
      setActiveToasts((prev) => [...createdNotifs, ...prev]);

      // Dispara canais secundários (E-mail / SMS) no backend se configurados
      try {
        authenticatedFetch('/api/notifications/dispatches/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alerts: newCriticals }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && Array.isArray(data.dispatched)) {
              setDispatchLogs((prev) => [...data.dispatched, ...prev]);
            }
          })
          .catch((err) => console.error('Erro ao registrar despachos secundários:', err));
      } catch (err) {
        console.error('Falha ao disparar canais secundários:', err);
      }
    }
  };

  // Fetch data from backend with resilient fallback
  const fetchData = async (isBackgroundPoll = false) => {
    if (!isBackgroundPoll) {
      setIsScanning(true);
    }
    try {
      const [portsData, alertsData] = await Promise.all([
        safeJsonFetch('/api/portfolios'),
        safeJsonFetch('/api/alerts'),
      ]);

      let currentPorts = portfolios;
      if (portsData && portsData.success && Array.isArray(portsData.portfolios)) {
        currentPorts = portsData.portfolios;
        setPortfolios(portsData.portfolios);
        if (portsData.portfolios.length > 0 && !selectedPortfolioId) {
          setSelectedPortfolioId(portsData.portfolios[0].id);
        }
      } else if (portfolios.length === 0) {
        // Fallback robusto se o backend estiver em transição ou iniciando
        currentPorts = initialPortfolios;
        setPortfolios(initialPortfolios);
        if (initialPortfolios.length > 0 && !selectedPortfolioId) {
          setSelectedPortfolioId(initialPortfolios[0].id);
        }
      }

      if (alertsData && alertsData.success && Array.isArray(alertsData.alerts)) {
        setAlerts(alertsData.alerts);
        if (Array.isArray(alertsData.performanceAlerts)) {
          setPerformanceAlerts(alertsData.performanceAlerts);
        }
        processAlertsForNotifications(alertsData.alerts, currentPorts);
      } else if (alerts.length === 0 && currentPorts.length > 0) {
        const computedAlerts = ComplianceAgent.evaluateAllPortfolios(currentPorts);
        setAlerts(computedAlerts);
        const computedPerf = currentPorts.flatMap(p => ComplianceAgent.evaluatePerformance(p));
        setPerformanceAlerts(computedPerf);
        processAlertsForNotifications(computedAlerts, currentPorts);
      }

      setLastScanTime(
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchNotificationSettings();
    fetchDispatchLogs();

    // Sentinel Polling Interval: monitoramento contínuo automático a cada 12 segundos
    const monitorInterval = setInterval(() => {
      fetchData(true);
    }, 12000);

    return () => clearInterval(monitorInterval);
  }, []);

  // Reset demo data
  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await authenticatedFetch('/api/portfolios/reset', { method: 'POST' });
      seenAlertIdsRef.current.clear();
      isInitialLoadRef.current = true;
      setActiveToasts([]);
      await fetchData();
    } catch (err) {
      console.error('Error resetting data:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Simular choque de mercado para testar a notificação em tempo real imediatamente
  const handleSimulateShock = async () => {
    setIsSimulatingShock(true);
    try {
      // Prioriza a carteira que estiver normal ou a carteira 4
      const normalPort = portfolios.find((p) => p.status === 'NORMAL') || portfolios[0];
      const data = await safeJsonFetch('/api/portfolios/simulate-shock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId: normalPort?.id || 'port-004' }),
      });
      if (data && data.success) {
        if (data.secondaryDispatches && Array.isArray(data.secondaryDispatches)) {
          setDispatchLogs((prev) => [...data.secondaryDispatches, ...prev]);
        }
        if (data.portfolios) setPortfolios(data.portfolios);
        if (data.alerts) {
          setAlerts(data.alerts);
          processAlertsForNotifications(data.alerts, data.portfolios || portfolios);
        } else {
          await fetchData(true);
        }
      }
    } catch (err) {
      console.error('Error simulating shock:', err);
    } finally {
      setIsSimulatingShock(false);
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

  // Handlers para o Módulo de Configuração de Limites & Tolerâncias
  const handleUpdateLimits = async (configs: AssetClassThresholdConfig[], portfolioId?: string) => {
    try {
      const res = await authenticatedFetch('/api/limits/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs, portfolioId }),
      });
      const data = await res.json();
      if (data && data.success) {
        if (Array.isArray(data.portfolios)) {
          setPortfolios(data.portfolios);
        }
        if (Array.isArray(data.alerts)) {
          setAlerts(data.alerts);
          processAlertsForNotifications(data.alerts, data.portfolios || portfolios);
        }
      }
    } catch (e) {
      console.error('Erro ao atualizar limites via API:', e);
      // Fallback robusto no cliente
      const updatedPortfolios = portfolios.map((port) => {
        if (!portfolioId || portfolioId === 'all' || port.id === portfolioId) {
          const cloned = { ...port, mandateLimits: [...port.mandateLimits] };
          for (const cfg of configs) {
            const limit = cloned.mandateLimits.find((l) => l.assetClass === cfg.assetClass);
            if (limit) {
              limit.minPercent = cfg.minPercent;
              limit.targetPercent = cfg.targetPercent;
              limit.maxPercent = cfg.maxPercent;
              limit.warningTolerancePP = cfg.warningTolerancePP;
              limit.criticalTolerancePP = cfg.criticalTolerancePP;
              limit.tolerancePP = cfg.criticalTolerancePP;
              limit.warningTriggerPercent = cfg.warningTriggerPercent;
              limit.criticalTriggerPercent = cfg.criticalTriggerPercent;
            }
          }
          return cloned;
        }
        return port;
      });
      setPortfolios(updatedPortfolios);
      const computed = ComplianceAgent.evaluateAllPortfolios(updatedPortfolios);
      setAlerts(computed);
      processAlertsForNotifications(computed, updatedPortfolios);
    }
  };

  const handleResetLimits = async () => {
    try {
      const res = await authenticatedFetch('/api/limits/reset', { method: 'POST' });
      const data = await res.json();
      if (data && data.success) {
        if (Array.isArray(data.portfolios)) {
          setPortfolios(data.portfolios);
        }
        if (Array.isArray(data.alerts)) {
          setAlerts(data.alerts);
          processAlertsForNotifications(data.alerts, data.portfolios || portfolios);
        }
      }
    } catch (e) {
      console.error('Erro ao restaurar limites via API:', e);
      await fetchData();
    }
  };

  // Handlers para o Sistema de Notificações
  const handleDismissToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setActiveToasts([]);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundEnabled(next);
  };

  // Transição de modo com seleção de cenário inteligente
  const handleSetDataMode = (newMode: DataMode) => {
    setDataMode(newMode);
    if (newMode === 'SIMULATION') {
      setSimulationScenario('REBALANCE_IDEAL');
    } else if (newMode === 'PROJECTION') {
      setProjectionScenario('FULL_PIPELINE');
    }
  };

  // Conjunto de carteiras e alertas resolvidos conforme o modo selecionado
  const { portfolios: effectivePortfolios, alerts: effectiveAlerts } = useMemo(() => {
    return resolvePortfoliosAndAlertsForMode(
      portfolios,
      alerts,
      dataMode,
      simulationScenario,
      projectionScenario
    );
  }, [portfolios, alerts, dataMode, simulationScenario, projectionScenario]);

  const baseAum = portfolios.reduce((sum, p) => sum + p.totalAum, 0);
  const effectiveAum = effectivePortfolios.reduce((sum, p) => sum + p.totalAum, 0);
  const criticalCount = effectiveAlerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = effectiveAlerts.filter((a) => a.severity === 'WARNING').length;
  const normalCount = effectivePortfolios.filter((p) => p.status === 'NORMAL').length;
  const complianceRate = effectivePortfolios.length > 0 ? (normalCount / effectivePortfolios.length) * 100 : 0;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200 relative">
      {/* Toast flutuante de Notificação Imediata quando novo alerta crítico for detectado */}
      <NotificationToastContainer
        notifications={activeToasts}
        onDismiss={handleDismissToast}
        onRebalance={handleStartRebalance}
        onViewAlerts={() => setActiveTab('alerts')}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Global Market Overview Ticker */}
      <MarketTicker />

      {/* Top Application Header com Sino e Central de Notificações */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        criticalAlertsCount={criticalCount}
        warningAlertsCount={warningCount}
        onResetData={handleResetData}
        isResetting={isResetting}
        dataMode={dataMode}
        setDataMode={handleSetDataMode}
        notifications={notifications}
        unreadNotificationsCount={unreadNotificationsCount}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onClearNotifications={handleClearNotifications}
        onNotificationRebalance={handleStartRebalance}
        onNotificationViewAlerts={() => setActiveTab('alerts')}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onSimulateShock={handleSimulateShock}
        isSimulatingShock={isSimulatingShock}
        onForceScan={() => fetchData()}
        isScanning={isScanning}
        channelSettings={channelSettings}
        onOpenNotificationSettings={() => setIsSettingsModalOpen(true)}
        onOpenApiSecurity={() => setIsApiSecurityModalOpen(true)}
        hasAuthError={hasAuthError}
      />

      {/* Banner de Alerta Crítico quando a API responder com 401 Unauthorized */}
      {hasAuthError && (
        <div
          id="auth-error-banner"
          className="bg-rose-950/95 border-b border-rose-500/50 px-4 sm:px-6 lg:px-8 py-2.5 text-xs text-rose-200 flex flex-wrap items-center justify-between gap-2 shadow-lg"
        >
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
            <span>
              <strong>Acesso Negado (HTTP 401):</strong> {authErrorMessage || 'Token de API ausente ou inválido.'} Todas as rotas /api/* exigem autenticação Bearer válida.
            </span>
          </div>
          <button
            onClick={() => setIsApiSecurityModalOpen(true)}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            Configurar Token de API
          </button>
        </div>
      )}

      {/* FlowCore ACTIVE: Background Agent Status Bar com Sentinela e Verificação Imediata */}
      <div className="bg-slate-950/90 border-b border-white/[0.06] px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-white text-[11px] tracking-wider uppercase flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              FlowCore ACTIVE
            </span>
            <ConnectivityLatencyBadge />
            <span className="hidden sm:inline-block"><PWAInstallButton /></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 text-[11px] hidden sm:inline">
              Sentinel v2.4 monitorando {portfolios.length} carteiras, mandatos CVM 175 e IPS com alerta imediato ativo.
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            {/* Quick button to manage Secondary Notification Channels (Email/SMS) */}
            <button
              id="open-channel-settings-bar-btn"
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-[11px]"
              title="Configurar canais secundários de notificação (E-mail & SMS)"
            >
              <div className="flex items-center gap-1">
                <span className={channelSettings.email.enabled ? 'text-sky-400' : 'text-slate-500'}>
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <span className={channelSettings.sms.enabled ? 'text-amber-400' : 'text-slate-500'}>
                  <Smartphone className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="hidden md:inline text-slate-300 font-medium">Canais:</span>
              <span className="font-semibold text-emerald-400">
                {(channelSettings.email.enabled ? 1 : 0) + (channelSettings.sms.enabled ? 1 : 0)} ativos
              </span>
            </button>

            <span className="text-slate-600 hidden sm:inline">•</span>

            <span className="text-slate-400">
              Última varredura: <span className="text-slate-200 font-mono font-medium">{lastScanTime}</span>
            </span>

            <button
              onClick={() => fetchData()}
              disabled={isScanning}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-400 font-medium transition cursor-pointer disabled:opacity-50"
              title="Executar varredura do Sentinel agora"
            >
              <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isScanning ? 'Verificando...' : 'Varredura'}</span>
            </button>

            <span className="text-slate-600 hidden sm:inline">•</span>

            <button
              onClick={handleSimulateShock}
              disabled={isSimulatingShock}
              className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold transition cursor-pointer disabled:opacity-50 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 hover:bg-rose-500/20"
              title="Gera um choque de volatilidade em tempo real para disparar a notificação imediata na interface"
            >
              <Zap className={`w-3 h-3 ${isSimulatingShock ? 'animate-bounce' : ''}`} />
              <span>Simular Alerta Crítico</span>
            </button>

            <span className="text-slate-600 hidden sm:inline">•</span>

            <span className="text-slate-400">
              Modo:
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
          </div>
        </div>
      </div>

      {/* Banner de Controle Interativo para Modo Simulação Sandbox e Modo Projeção Estatística */}
      <DataModeControlBanner
        dataMode={dataMode}
        onSetDataMode={handleSetDataMode}
        simulationScenario={simulationScenario}
        onSelectSimulationScenario={setSimulationScenario}
        projectionScenario={projectionScenario}
        onSelectProjectionScenario={setProjectionScenario}
        onNavigateTab={(tab) => setActiveTab(tab)}
        baseAum={baseAum}
        effectiveAum={effectiveAum}
        criticalAlertsCount={criticalCount}
        complianceRate={complianceRate}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ErrorBoundary
          key={activeTab}
          fallbackTitle="Falha na Renderização do Modo Selecionado"
          onReset={() => handleSetDataMode('LIVE')}
        >
          {activeTab === 'dashboard' && (
            <DashboardView
              portfolios={effectivePortfolios}
              alerts={effectiveAlerts}
              onSelectPortfolio={handleSelectPortfolio}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onStartRebalance={handleStartRebalance}
              dataMode={dataMode}
            />
          )}

          {activeTab === 'owner' && (
            <OwnerCommandCenterView
              portfolios={effectivePortfolios}
              alerts={effectiveAlerts}
              onSelectPortfolio={handleSelectPortfolio}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onStartRebalance={handleStartRebalance}
              dataMode={dataMode}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsView
              alerts={effectiveAlerts}
              onStartRebalance={handleStartRebalance}
              onSelectPortfolio={handleSelectPortfolio}
            />
          )}

          {activeTab === 'portfolios' && (
            <PortfoliosView
              portfolios={effectivePortfolios}
              selectedPortfolioId={selectedPortfolioId}
              onSelectPortfolio={setSelectedPortfolioId}
              onStartRebalance={handleStartRebalance}
              onOpenAgentWithPortfolio={handleOpenAgentWithPortfolio}
            />
          )}

          {activeTab === 'simulator' && (
            <RebalanceSimulatorView
              portfolios={effectivePortfolios}
              selectedPortfolioId={selectedPortfolioId}
              onSelectPortfolio={setSelectedPortfolioId}
              onRebalanceExecuted={handleRebalanceExecuted}
            />
          )}

          {activeTab === 'agent' && (
            <AiComplianceChatView
              portfolios={effectivePortfolios}
              alerts={effectiveAlerts}
              initialQuery={agentInitialQuery}
            />
          )}

          {activeTab === 'limits' && (
            <LimitsConfigurationView
              portfolios={effectivePortfolios}
              onUpdateLimits={handleUpdateLimits}
              onResetLimits={handleResetLimits}
              currentAlerts={effectiveAlerts}
            />
          )}

          
          {activeTab === 'barbell' && (
            <BarbellStrategyView
              portfolios={effectivePortfolios}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSelectPortfolio={handleSelectPortfolio}
            />
          )}
          {activeTab === 'api-diagnostics' && (
            <ApiDiagnosticsView />
          )}
        </ErrorBoundary>
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

      {/* Modal de Configuração de Canais Secundários de Alerta (E-mail & SMS) */}
      <NotificationSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={channelSettings}
        onSaveSettings={handleSaveNotificationSettings}
        dispatchLogs={dispatchLogs}
        onRefreshLogs={fetchDispatchLogs}
        onClearLogs={handleClearDispatchLogs}
        onTestDispatch={handleTestDispatch}
      />

      {/* Modal de Segurança & Token Bearer da API (CVM 175 / ISO 27001) */}
      <ApiSecurityModal
        isOpen={isApiSecurityModalOpen}
        onClose={() => setIsApiSecurityModalOpen(false)}
      />
    </div>
  );
}
