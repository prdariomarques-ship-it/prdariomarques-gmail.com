import React from 'react';
import {
  Home,
  Target,
  FolderOpen,
  Users,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  Key,
  Flame,
  Network,
} from 'lucide-react';
import { TabKey } from '../Header';

interface WealthCopilotSidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  criticalAlertsCount: number;
  warningAlertsCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenApiSecurity?: () => void;
}

export const WealthCopilotSidebar: React.FC<WealthCopilotSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  criticalAlertsCount,
  warningAlertsCount,
  soundEnabled,
  onToggleSound,
  onOpenApiSecurity,
}) => {
  const menuItems = [
    {
      id: 'cockpit' as TabKey,
      label: 'Ações',
      icon: Home,
      badge: undefined,
      description: 'Cockpit Executivo Principal',
    },
    {
      id: 'command-center' as TabKey,
      label: 'Comando',
      icon: Target,
      badge: 'Prioridades',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Prioridades, Recalibração & Overrides',
    },
    {
      id: 'portfolios' as TabKey,
      label: 'Carteiras',
      icon: FolderOpen,
      badge: undefined,
      description: 'Gestão de Mandatos & Ativos',
    },
    {
      id: 'clients' as TabKey,
      label: 'Clientes',
      icon: Users,
      badge: '27',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      description: 'Diretório de 27 Clientes Sob Monitoramento',
    },
    {
      id: 'market' as TabKey,
      label: 'Mercado',
      icon: TrendingUp,
      badge: undefined,
      description: 'Inteligência Macro, Índices & Câmbio',
    },
    {
      id: 'alerts' as TabKey,
      label: 'Insights',
      icon: Lightbulb,
      badge: criticalAlertsCount > 0 ? `${criticalAlertsCount}` : undefined,
      badgeColor: 'bg-rose-500/30 text-rose-300 border-rose-500/40 animate-pulse',
      description: 'Central de Alertas & Conformidade CVM 175',
    },
    {
      id: 'agent' as TabKey,
      label: 'Chat IA',
      icon: MessageSquare,
      badge: 'Copilot',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      description: 'Assistente IA Regulatório e Alocação',
    },
    {
      id: 'correlation' as TabKey,
      label: 'Correlação',
      icon: Network,
      badge: 'Cluster',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      description: 'Matriz de Correlação & Clustering Sistêmico',
    },
    {
      id: 'barbell' as TabKey,
      label: 'Estratégias',
      icon: Layers,
      badge: undefined,
      description: 'Estratégia Barbell & Simulação',
    },
    {
      id: 'owner' as TabKey,
      label: 'Relatórios',
      icon: FileText,
      badge: undefined,
      description: 'Governança CVM 175 & Trilha de Auditoria',
    },
    {
      id: 'limits' as TabKey,
      label: 'Configurações',
      icon: Settings,
      badge: undefined,
      description: 'Limites de Risco, Canais & Token',
    },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col bg-[#070D18] border-r border-slate-800/80 text-slate-300 transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      } shrink-0`}
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center px-4 border-b border-slate-800/60 justify-between">
        <div
          onClick={() => onSelectTab('cockpit')}
          className="flex items-center space-x-3 cursor-pointer group"
          title="FlowCore Wealth Copilot"
        >
          {/* Stylized Logo Waves */}
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center p-2 shadow-lg shadow-cyan-950/50 group-hover:scale-105 transition-transform shrink-0">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12c3-4 6-4 9 0s6 4 9 0" />
              <path d="M2 16c3-4 6-4 9 0s6 4 9 0" opacity="0.6" />
              <path d="M2 8c3-4 6-4 9 0s6 4 9 0" opacity="0.3" />
            </svg>
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg text-white tracking-tight leading-none">
                  FlowCore
                </span>
              </div>
              <span className="text-xs text-cyan-400/90 font-medium tracking-wide mt-1">
                Wealth Copilot
              </span>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title={isCollapsed ? 'Expandir Menu Lateral' : 'Recolher Menu Lateral'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={isCollapsed ? `${item.label} - ${item.description}` : undefined}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-blue-600/20 text-white border border-blue-500/40 shadow-sm shadow-blue-900/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              {/* Active glow indicator line */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-sm shadow-cyan-400/80" />
              )}

              <Icon
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Secondary Fast Tools Section */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-slate-800/60 bg-slate-950/40 space-y-2">
          <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-1">
            Ferramentas Avançadas
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onSelectTab('simulator')}
              className={`px-2.5 py-1.5 rounded-lg border text-left transition flex items-center gap-1.5 ${
                activeTab === 'simulator'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">Simulador</span>
            </button>
            <button
              onClick={() => onSelectTab('correlation')}
              className={`px-2.5 py-1.5 rounded-lg border text-left transition flex items-center gap-1.5 ${
                activeTab === 'correlation'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate">Clusters</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Profile & System Bar */}
      <div className="p-3 border-t border-slate-800/80 bg-[#060A13]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
                  DM
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#060A13] animate-pulse" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-white truncate">
                  Dário Marques
                </span>
                <span className="text-[11px] text-cyan-400/90 font-medium truncate">
                  MPX Wealth Management
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={onToggleSound}
                className={`p-1.5 rounded-lg transition ${
                  soundEnabled
                    ? 'text-cyan-400 hover:bg-cyan-500/20'
                    : 'text-slate-500 hover:bg-slate-800'
                }`}
                title={soundEnabled ? 'Áudio Sentinel Ativo' : 'Áudio Sentinel Mudo'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
              {onOpenApiSecurity && (
                <button
                  onClick={onOpenApiSecurity}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                  title="Segurança e Token API CVM 175"
                >
                  <Key className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative cursor-pointer"
              onClick={() => onSelectTab('cockpit')}
              title="Dário Marques - Especialista em Investimentos"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
                DM
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#060A13]" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
