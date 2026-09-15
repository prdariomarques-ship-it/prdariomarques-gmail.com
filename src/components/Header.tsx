import React from 'react';
import {
  ShieldAlert,
  PieChart,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Award,
  Radio,
  Eye,
  Activity,
  Cpu,
  Key,
  Lock,
} from 'lucide-react';
import { DataMode, ComplianceNotification, NotificationChannelSettings } from '../types';
import { NotificationCenterDropdown } from './NotificationCenterDropdown';

export type TabKey =
  | 'dashboard'
  | 'owner'
  | 'alerts'
  | 'portfolios'
  | 'simulator'
  | 'agent'
  | 'limits'
  | 'api-diagnostics';

interface HeaderProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  criticalAlertsCount: number;
  warningAlertsCount: number;
  onResetData: () => void;
  isResetting: boolean;
  dataMode: DataMode;
  setDataMode: (mode: DataMode) => void;
  // Notificações de monitoramento Sentinel
  notifications: ComplianceNotification[];
  unreadNotificationsCount: number;
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  onClearNotifications: () => void;
  onNotificationRebalance: (portfolioId: string) => void;
  onNotificationViewAlerts: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSimulateShock: () => Promise<void>;
  isSimulatingShock: boolean;
  onForceScan: () => Promise<void>;
  isScanning: boolean;
  channelSettings?: NotificationChannelSettings;
  onOpenNotificationSettings: () => void;
  // Segurança da API (Bearer Token)
  onOpenApiSecurity?: () => void;
  hasAuthError?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  criticalAlertsCount,
  warningAlertsCount,
  onResetData,
  isResetting,
  dataMode,
  setDataMode,
  notifications,
  unreadNotificationsCount,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearNotifications,
  onNotificationRebalance,
  onNotificationViewAlerts,
  soundEnabled,
  onToggleSound,
  onSimulateShock,
  isSimulatingShock,
  onForceScan,
  isScanning,
  channelSettings,
  onOpenNotificationSettings,
  onOpenApiSecurity,
  hasAuthError = false,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-white">FlowCore</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Conformidade v1.2
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Monitor de Desenquadramento & Rebalanceamento de Carteiras
              </p>
            </div>
          </div>

          {/* Permanent Data Mode Visual Indicator & Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-white/[0.08] shadow-inner text-xs">
              <button
                onClick={() => setDataMode('LIVE')}
                title="Conexão direta"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition ${
                  dataMode === 'LIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${dataMode === 'LIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="font-semibold">LIVE DATA</span>
              </button>
              <button
                onClick={() => setDataMode('SIMULATION')}
                title="Modo Sandbox: ordens de teste sem efeito regulatório/mercado externo"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition ${
                  dataMode === 'SIMULATION'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${dataMode === 'SIMULATION' ? 'bg-amber-400' : 'bg-slate-600'}`} />
                <span className="hidden md:inline font-semibold">SIMULATION</span>
              </button>
              <button
                onClick={() => setDataMode('PROJECTION')}
                title="Projeção estatística e modelos de expansão comercial"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition ${
                  dataMode === 'PROJECTION'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${dataMode === 'PROJECTION' ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                <span className="hidden md:inline font-semibold">PROJECTION</span>
              </button>
            </div>
          </div>

          {/* Quick status counters */}
          <div className="hidden xl:flex items-center space-x-3 bg-slate-950/60 py-1.5 px-3 rounded-lg border border-slate-800 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-slate-300 font-medium">{criticalAlertsCount} Desenquadradas</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-300 font-medium">{warningAlertsCount} Em Atenção</span>
            </div>
          </div>

          {/* Action Buttons & Notification Bell */}
          <div className="flex items-center space-x-2">
            {/* Botão de Autenticação / Segurança da API */}
            <button
              id="header-api-security-btn"
              onClick={onOpenApiSecurity}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                hasAuthError
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title={
                hasAuthError
                  ? 'Erro 401: Token de API inválido. Clique para configurar.'
                  : 'Gerenciador de Token Bearer de API (Segurança CVM 175)'
              }
            >
              {hasAuthError ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Key className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden sm:inline">
                {hasAuthError ? 'Token Inválido (401)' : 'Segurança API'}
              </span>
            </button>

            {/* Notification Center Bell & Dropdown */}
            <NotificationCenterDropdown
              notifications={notifications}
              unreadCount={unreadNotificationsCount}
              onMarkAsRead={onMarkNotificationAsRead}
              onMarkAllAsRead={onMarkAllNotificationsAsRead}
              onClearAll={onClearNotifications}
              onRebalance={onNotificationRebalance}
              onViewAlerts={onNotificationViewAlerts}
              soundEnabled={soundEnabled}
              onToggleSound={onToggleSound}
              onSimulateShock={onSimulateShock}
              isSimulatingShock={isSimulatingShock}
              onForceScan={onForceScan}
              isScanning={isScanning}
              channelSettings={channelSettings}
              onOpenSettings={onOpenNotificationSettings}
            />

            <button
              onClick={onResetData}
              disabled={isResetting}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
              title="Restaurar dados iniciais para testes"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Resetar Demo</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <PieChart className="w-4 h-4 mr-2" />
            Visão Geral
          </button>

          <button
            onClick={() => setActiveTab('owner')}
            className={`flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'owner'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                : 'text-slate-400 hover:text-amber-200 hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-4 h-4 mr-2 text-amber-400" />
            Comando do Proprietário (Tela 15)
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap relative ${
              activeTab === 'alerts'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4 mr-2" />
            Central de Alertas
            {(criticalAlertsCount > 0 || warningAlertsCount > 0) && (
              <span className={`ml-2 px-1.5 py-0.2 text-xs font-bold rounded-full ${
                criticalAlertsCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-900'
              }`}>
                {criticalAlertsCount + warningAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('portfolios')}
            className={`flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'portfolios'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Carteiras & Mandatos
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4 mr-2" />
            Simulador de Reequilíbrio
          </button>

          <button
            onClick={() => setActiveTab('agent')}
            className={`flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'agent'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 mr-2 text-cyan-400" />
            Agente IA FlowCore
          </button>

          <button
            id="header-tab-limits"
            onClick={() => setActiveTab('limits')}
            className={`flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'limits'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2 text-emerald-400" />
            Configuração de Limites
          </button>

          <button
            onClick={() => setActiveTab('api-diagnostics')}
            className={`flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'api-diagnostics'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow'
                : 'text-slate-400 hover:text-indigo-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4 mr-2 text-indigo-400" />
            Saúde da API
          </button>
        </div>
      </div>
    </header>
  );
};
