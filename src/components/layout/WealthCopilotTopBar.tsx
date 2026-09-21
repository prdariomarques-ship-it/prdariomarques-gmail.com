import React, { useState, useEffect } from 'react';
import { Search, Bell, Sparkles, Filter, X, ChevronDown, ShieldCheck, Activity } from 'lucide-react';
import { DataMode } from '../../types';

interface WealthCopilotTopBarProps {
  onSearchQuery?: (q: string) => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  dataMode?: DataMode;
  onToggleDataMode?: () => void;
  onProfileClick?: () => void;
  onOpenAiAssistant?: (prompt?: string) => void;
  onOpenApiSecurity?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const WealthCopilotTopBar: React.FC<WealthCopilotTopBarProps> = ({
  onSearchQuery,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  dataMode = 'LIVE',
  onToggleDataMode,
  onProfileClick,
  onOpenAiAssistant,
  onOpenApiSecurity,
  soundEnabled,
  onToggleSound,
}) => {
  const [query, setQuery] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const months = [
        'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
        'jul', 'ago', 'set', 'out', 'nov', 'dez'
      ];
      const weekday = weekdays[now.getDay()];
      const day = now.getDate();
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');

      setCurrentDateTime(`${weekday}, ${day} de ${month} de ${year} | ${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      if (onSearchQuery) {
        onSearchQuery(query);
      }
      if (query.includes('?') || query.toLowerCase().startsWith('como') || query.toLowerCase().startsWith('qual')) {
        onOpenAiAssistant?.(query);
      }
    }
  };

  return (
    <header className="h-16 px-6 bg-[#080D18]/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Search Bar matching screenshot */}
      <div className="flex-1 max-w-xl relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearchQuery?.(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar cliente, carteira, ativo ou fazer uma pergunta..."
            className="w-full bg-[#101828] border border-slate-700/60 rounded-xl pl-10 pr-10 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition shadow-inner"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                onSearchQuery?.('');
              }}
              className="absolute right-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-3 text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
              Enter
            </kbd>
          )}
        </div>
      </div>

      {/* Right Controls: Date, Notifications, User Chip */}
      <div className="flex items-center space-x-4 shrink-0">
        {/* Live Date / Time */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs text-slate-300 font-medium tracking-tight">
            {currentDateTime || 'Seg, 24 de mar de 2025 | 08:12'}
          </span>
          <span className="text-[10px] text-slate-400">
            Mercado B3 &amp; NY em Monitoramento
          </span>
        </div>

        {/* Data Mode Indicator */}
        {onToggleDataMode && (
          <button
            onClick={onToggleDataMode}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
              dataMode === 'LIVE'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
            title="Alternar Modo Live / Simulação"
          >
            <span className={`w-2 h-2 rounded-full ${dataMode === 'LIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{dataMode === 'LIVE' ? 'LIVE DATA' : 'SIMULAÇÃO'}</span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Notificações e Alertas CVM 175"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#080D18] animate-pulse">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* User Profile Chip matching screenshot */}
        <div
          onClick={onProfileClick}
          className="flex items-center gap-2.5 pl-2 py-1 pr-3 rounded-xl bg-[#101828] border border-slate-800 hover:border-slate-700 cursor-pointer transition select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-white text-xs shadow-sm">
            DM
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-slate-200 leading-tight">
              Dário Marques
            </span>
            <span className="text-[10px] text-cyan-400/90 font-medium leading-tight">
              MPX Wealth Management
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
