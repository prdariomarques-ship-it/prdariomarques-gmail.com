import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Volume2,
  VolumeX,
  Trash2,
  CheckCheck,
  RefreshCw,
  Zap,
  Clock,
  ExternalLink,
  ChevronRight,
  Settings,
  Mail,
  Smartphone,
} from 'lucide-react';
import { ComplianceNotification, NotificationChannelSettings } from '../types';

interface NotificationCenterDropdownProps {
  notifications: ComplianceNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onRebalance: (portfolioId: string) => void;
  onViewAlerts: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSimulateShock: () => Promise<void>;
  isSimulatingShock: boolean;
  onForceScan: () => Promise<void>;
  isScanning: boolean;
  channelSettings?: NotificationChannelSettings;
  onOpenSettings: () => void;
}

export const NotificationCenterDropdown: React.FC<NotificationCenterDropdownProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onRebalance,
  onViewAlerts,
  soundEnabled,
  onToggleSound,
  onSimulateShock,
  isSimulatingShock,
  onForceScan,
  isScanning,
  channelSettings,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={
          unreadCount > 0
            ? `${unreadCount} novos alertas críticos de desenquadramento detectados`
            : 'Central de Notificações do Sentinel de Compliance'
        }
        className={`relative p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
          unreadCount > 0
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
        }`}
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-rose-400' : 'text-slate-300'}`} />

        {/* Pulsing indicator when there are unread critical alerts */}
        {unreadCount > 0 && (
          <>
            <span className="animate-ping absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-400 opacity-75"></span>
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-md border border-slate-900">
              {unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          id="notification-center-panel"
          className="absolute right-0 mt-2 w-80 sm:w-96 md:w-[440px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-950/90 z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Notificações de Compliance
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                      {unreadCount} crítica{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">Sentinel CVM 175 &amp; Mandatos IPS</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* Secondary Channels Configuration Button */}
              <button
                id="open-notification-settings-btn"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                title="Configurar canais secundários de alerta (E-mail & SMS)"
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700 text-xs transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {/* Sound Toggle */}
              <button
                onClick={onToggleSound}
                title={soundEnabled ? 'Aviso sonoro ativado (clique para mutar)' : 'Aviso sonoro mutado (clique para ativar)'}
                className={`p-1.5 rounded-lg border text-xs transition ${
                  soundEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Force Scan Button */}
              <button
                onClick={onForceScan}
                disabled={isScanning}
                title="Forçar verificação imediata do Sentinel"
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700 text-xs transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Secondary Channels Status Pill Strip */}
          {channelSettings && (
            <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] gap-2">
              <div className="flex items-center gap-2 overflow-hidden text-slate-300">
                <span className="text-slate-400 shrink-0">Canais:</span>
                
                {/* Email Pill */}
                <div
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${
                    channelSettings.email.enabled
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700 line-through'
                  }`}
                  title={
                    channelSettings.email.enabled
                      ? `Alertas via E-mail habilitados para ${channelSettings.email.recipient}`
                      : 'Alertas via E-mail desabilitados'
                  }
                >
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[120px]">
                    {channelSettings.email.enabled ? channelSettings.email.recipient : 'E-mail Inativo'}
                  </span>
                </div>

                {/* SMS Pill */}
                <div
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${
                    channelSettings.sms.enabled
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700 line-through'
                  }`}
                  title={
                    channelSettings.sms.enabled
                      ? `Alertas via SMS habilitados para ${channelSettings.sms.phoneNumber}`
                      : 'Alertas via SMS desabilitados'
                  }
                >
                  <Smartphone className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[110px]">
                    {channelSettings.sms.enabled ? channelSettings.sms.phoneNumber : 'SMS Inativo'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="text-emerald-400 hover:text-emerald-300 text-[10px] font-semibold shrink-0 cursor-pointer"
              >
                Gerenciar
              </button>
            </div>
          )}

          {/* Test & Simulation Action Bar */}
          <div className="p-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs gap-2">
            <button
              id="simulate-market-shock-btn"
              onClick={onSimulateShock}
              disabled={isSimulatingShock}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold text-[11px] transition disabled:opacity-50 cursor-pointer"
              title="Gera um choque de volatilidade em carteira para testar o alerta imediato e o despacho nos canais secundários"
            >
              <Zap className={`w-3 h-3 ${isSimulatingShock ? 'animate-bounce' : 'text-rose-400'}`} />
              <span>{isSimulatingShock ? 'Simulando choque...' : 'Testar Alerta Crítico (Choque)'}</span>
            </button>

            <div className="flex items-center space-x-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                  <span>Lidas</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-slate-800 transition"
                  title="Limpar histórico de notificações"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin scrollbar-thumb-slate-800">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-200">Nenhum alerta crítico ativo</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  O monitoramento contínuo FlowCore Sentinel está ativo e emitirá alertas visuais, sonoros e despachos secundários (E-mail/SMS) se houver violações.
                </p>
                <div className="mt-3">
                  <button
                    onClick={onSimulateShock}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-lg transition"
                  >
                    <Zap className="w-3 h-3" />
                    Simular Desenquadramento de Teste
                  </button>
                </div>
              </div>
            ) : (
              notifications.map((notif) => {
                const effectiveRuleSource = notif.rule_source ?? notif.ruleSource;
                const effectivePolicyId = notif.policy_id ?? notif.policyId;
                const effectiveLimit = notif.limit ?? notif.maxPercent;
                const effectiveCurrentValue = notif.current_value ?? notif.currentPercent;
                const isMandate = effectiveRuleSource === 'MANDATO_CLIENTE';
                const isInternal = effectiveRuleSource === 'POLITICA_INTERNA';

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition hover:bg-slate-800/40 relative ${
                      !notif.read
                        ? isMandate
                          ? 'bg-purple-950/20 border-l-2 border-purple-500'
                          : isInternal
                          ? 'bg-indigo-950/20 border-l-2 border-indigo-500'
                          : 'bg-rose-950/20 border-l-2 border-rose-500'
                        : 'bg-transparent'
                    }`}
                  >
                    {/* Visual Scope Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${
                          isMandate
                            ? 'bg-purple-500/20 text-purple-200 border-purple-500/40 shadow-sm shadow-purple-950/40'
                            : isInternal
                            ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40 shadow-sm shadow-indigo-950/40'
                            : 'bg-rose-500/20 text-rose-200 border-rose-500/40'
                        }`}
                      >
                        {isMandate ? '📜 MANDATO DO CLIENTE (IPS)' : isInternal ? '🏛️ POLÍTICA INTERNA' : `⚖️ ${effectiveRuleSource}`}
                      </span>

                      <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        {notif.timestamp}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`w-2 h-2 rounded-full animate-pulse ${
                            isMandate ? 'bg-purple-400' : isInternal ? 'bg-indigo-400' : 'bg-rose-500'
                          }`}
                        />
                        <span className="text-xs font-bold text-white leading-tight">
                          {notif.portfolioName}
                        </span>
                        {notif.portfolioCode && (
                          <span className="text-[10px] font-mono text-slate-400">({notif.portfolioCode})</span>
                        )}
                      </div>
                    </div>

                    {/* Explicit Normative Info Strip with 4 Distinct Fields: rule_source, policy_id, limit, current_value */}
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-white/[0.08] text-[11px] text-slate-300 space-y-1.5 mb-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pb-1.5 border-b border-white/[0.06]">
                        <div>
                          <span className="text-slate-400 uppercase font-bold block">rule_source:</span>
                          <span className={`font-bold ${isMandate ? 'text-purple-300' : isInternal ? 'text-indigo-300' : 'text-rose-300'}`}>
                            {effectiveRuleSource}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase font-bold block">policy_id:</span>
                          <span className="text-slate-200 font-semibold bg-slate-900 px-1 py-0.5 rounded border border-white/5">
                            {effectivePolicyId}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-slate-400">Classe: <strong className="text-white">{notif.assetClass}</strong></span>
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span className="text-slate-400 font-bold uppercase">limit:</span>
                          <span className="text-slate-200 font-bold">{effectiveLimit.toFixed(1)}%</span>
                          <span className="text-slate-600 font-bold">|</span>
                          <span className="text-slate-400 font-bold uppercase">current_value:</span>
                          <strong className={`font-extrabold ${isMandate ? 'text-purple-300' : isInternal ? 'text-indigo-300' : 'text-rose-400'}`}>
                            {effectiveCurrentValue.toFixed(1)}%
                          </strong>
                        </div>
                      </div>

                      {notif.excessValueBRL > 0 && (
                        <p className="text-[10px] text-slate-400 pt-1 border-t border-white/[0.04] flex items-center justify-between">
                          <span>Excesso financeiro:</span>
                          <strong className="text-emerald-400 font-mono">
                            R$ {notif.excessValueBRL.toLocaleString('pt-BR')}
                          </strong>
                        </p>
                      )}
                    </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onRebalance(notif.portfolioId);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition shadow-sm cursor-pointer"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Rebalancear</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onViewAlerts();
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition cursor-pointer"
                      >
                        <span>Ver</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {!notif.read && (
                      <button
                        onClick={() => onMarkAsRead(notif.id)}
                        className="text-[11px] text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                      >
                        Marcar lida
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span>Configurar E-mail &amp; SMS</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onViewAlerts();
              }}
              className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5 cursor-pointer"
            >
              <span>Ver todos os alertas</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
