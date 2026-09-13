import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  X,
  Sliders,
  ShieldAlert,
  Volume2,
  VolumeX,
  ArrowRight,
  Clock,
  DollarSign,
  Scale,
  Mail,
  Smartphone,
} from 'lucide-react';
import { ComplianceNotification } from '../types';

interface NotificationToastProps {
  notifications: ComplianceNotification[];
  onDismiss: (id: string) => void;
  onRebalance: (portfolioId: string) => void;
  onViewAlerts: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const NotificationToastContainer: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
  onRebalance,
  onViewAlerts,
  soundEnabled,
  onToggleSound,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div
      id="compliance-notification-toasts"
      className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-full sm:max-w-md w-full pointer-events-none"
    >
      {notifications.map((notif, index) => (
        <SingleNotificationToast
          key={notif.id}
          notification={notif}
          index={index}
          total={notifications.length}
          onDismiss={() => onDismiss(notif.id)}
          onRebalance={() => onRebalance(notif.portfolioId)}
          onViewAlerts={onViewAlerts}
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
        />
      ))}
    </div>
  );
};

interface SingleToastProps {
  notification: ComplianceNotification;
  index: number;
  total: number;
  onDismiss: () => void;
  onRebalance: () => void;
  onViewAlerts: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const SingleNotificationToast: React.FC<SingleToastProps> = ({
  notification,
  index,
  total,
  onDismiss,
  onRebalance,
  onViewAlerts,
  soundEnabled,
  onToggleSound,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);

  // Auto-dismiss countdown de 12 segundos (pausa se o usuário passar o mouse por cima)
  useEffect(() => {
    if (isHovered) return;

    const intervalTime = 100;
    const totalDuration = 12000;
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isHovered, onDismiss]);

  const effectiveRuleSource = notification.rule_source ?? notification.ruleSource;
  const effectivePolicyId = notification.policy_id ?? notification.policyId;
  const effectiveLimit = notification.limit ?? notification.maxPercent;
  const effectiveCurrentValue = notification.current_value ?? notification.currentPercent;

  const isMandate = effectiveRuleSource === 'MANDATO_CLIENTE';
  const isInternal = effectiveRuleSource === 'POLITICA_INTERNA';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="alert"
      aria-live="assertive"
      className={`pointer-events-auto w-full bg-slate-900/95 border-2 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300 transform translate-y-0 ${
        isMandate
          ? 'border-purple-500/90 shadow-purple-950/80 ring-1 ring-purple-500/40'
          : isInternal
          ? 'border-indigo-500/90 shadow-indigo-950/80 ring-1 ring-indigo-500/40'
          : 'border-rose-500/80 shadow-rose-950/70'
      }`}
    >
      {/* Top Warning Accent Bar with Progress countdown */}
      <div className="h-1.5 w-full bg-slate-800 relative overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ease-linear ${
            isMandate
              ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-amber-500'
              : isInternal
              ? 'bg-gradient-to-r from-indigo-500 via-blue-500 to-amber-500'
              : 'bg-gradient-to-r from-rose-500 via-red-500 to-amber-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Scope Ribbon: Mandato vs Política Interna */}
      <div
        className={`px-3.5 py-1.5 text-[11px] font-bold border-b flex items-center justify-between ${
          isMandate
            ? 'bg-purple-950/70 border-purple-500/30 text-purple-200'
            : isInternal
            ? 'bg-indigo-950/70 border-indigo-500/30 text-indigo-200'
            : 'bg-rose-950/70 border-rose-500/30 text-rose-200'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Scale className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isMandate
              ? '📜 MANDATO DO CLIENTE (IPS BILATERAL)'
              : isInternal
              ? '🏛️ POLÍTICA INTERNA DA GESTORA'
              : '⚖️ DESENQUADRAMENTO REGULATÓRIO'}
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-black/40 border border-white/10 shrink-0">
          {isMandate ? 'Risco Fiduciário' : isInternal ? 'Governança' : 'Compliance'}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        {/* Header with Badges & Close Button */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                isMandate
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : isInternal
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              <span className="flex h-2 w-2 relative">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isMandate ? 'bg-purple-400' : isInternal ? 'bg-indigo-400' : 'bg-rose-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isMandate ? 'bg-purple-500' : isInternal ? 'bg-indigo-500' : 'bg-rose-500'
                  }`}
                ></span>
              </span>
              Desenquadramento Crítico
            </span>

            {total > 1 && (
              <span className="text-[10px] text-slate-400 font-medium">
                ({index + 1} de {total})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Silenciar avisos sonoros' : 'Ativar avisos sonoros'}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
            <button
              onClick={onDismiss}
              title="Dispensar aviso"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Portfolio & Client Identity */}
        <div className="mb-2.5">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5 leading-tight">
            <ShieldAlert
              className={`w-4 h-4 shrink-0 ${
                isMandate ? 'text-purple-400' : isInternal ? 'text-indigo-400' : 'text-rose-400'
              }`}
            />
            <span>{notification.portfolioName}</span>
            {notification.portfolioCode && (
              <span className="text-xs font-mono text-slate-400">({notification.portfolioCode})</span>
            )}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Titular: <span className="text-slate-200 font-medium">{notification.clientName}</span>
          </p>
        </div>

        {/* Quantitative Breach Breakdown Box with Explicit rule_source, policy_id, limit, current_value */}
        <div className="bg-slate-950/80 rounded-lg p-3 border border-white/[0.08] mb-3 text-xs space-y-2">
          {/* Explicit Normative Tags: rule_source & policy_id */}
          <div className="flex flex-wrap items-center gap-2 pb-1.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                rule_source:
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isMandate
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : isInternal
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {effectiveRuleSource}
              </span>
            </div>

            {effectivePolicyId && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                  policy_id:
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-200 border border-white/[0.08]">
                  {effectivePolicyId}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Classe com Desvio:</span>
            <span className="font-bold text-white">{notification.assetClass}</span>
          </div>

          {/* Comparison with explicit limit & current_value labels */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">limit:</span>
              <strong className="font-mono text-slate-300">{effectiveLimit.toFixed(1)}%</strong>
            </div>
            <span className="text-slate-500 font-bold text-[11px]">vs</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">current_value:</span>
              <strong
                className={`font-mono ${
                  isMandate ? 'text-purple-300 font-extrabold' : isInternal ? 'text-indigo-300 font-extrabold' : 'text-rose-400 font-extrabold'
                }`}
              >
                {effectiveCurrentValue.toFixed(1)}%
              </strong>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
              +{notification.deviationPP > 0 ? notification.deviationPP.toFixed(1) : Math.abs(notification.deviationPP).toFixed(1)} p.p.
            </span>
          </div>

          {notification.excessValueBRL > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Excesso Estimado:</span>
              <span className="font-mono font-bold text-emerald-400">
                R$ {notification.excessValueBRL.toLocaleString('pt-BR')}
              </span>
            </div>
          )}

          {/* Secondary Channels dispatched badge */}
          <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-800/80">
            <span className="text-slate-400">Despacho ativo:</span>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">
                <Mail className="w-2.5 h-2.5" /> E-mail
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                <Smartphone className="w-2.5 h-2.5" /> SMS
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onRebalance}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-950/50 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Rebalancear Imediato</span>
          </button>

          <button
            onClick={onViewAlerts}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <span>Ver Alerta</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            onClick={onDismiss}
            className="px-2.5 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            Dispensar
          </button>
        </div>

        {/* Footer timestamp & hint */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            Detectado às {notification.timestamp} pelo Sentinel
          </span>
          <span className="text-slate-400">Passe o mouse para congelar</span>
        </div>
      </div>
    </div>
  );
};
