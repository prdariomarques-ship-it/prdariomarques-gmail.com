import React, { useState, useRef, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronRight,
  Globe2,
  Clock,
  RefreshCw,
  Info,
  CheckCircle2,
  Moon,
  Sun,
  AlertCircle,
  X,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { TabKey } from '../Header';
import { useMarketData } from '../../hooks/useMarketData';
import {
  MarketSessionStatus,
  MarketSessionInfo,
  checkMarketSession,
} from '../../utils/marketHours';
import { usePriceAlerts } from '../../hooks/usePriceAlerts';
import { PriceAlertModal } from './PriceAlertModal';
import { PriceAlertToast } from './PriceAlertToast';
import { MarketAsset } from '../../data/wealthCopilotData';
import { Bell, BellRing } from 'lucide-react';

interface MarketTickerProps {
  onNavigateTab?: (tab: TabKey) => void;
}

export const MarketTicker: React.FC<MarketTickerProps> = ({ onNavigateTab }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [showSessionPopover, setShowSessionPopover] = useState(false);
  // Permite ao usuário pré-visualizar ou forçar um estado de mercado para demonstração (ou 'AUTO' pelo horário real)
  const [overrideSession, setOverrideSession] = useState<'AUTO' | MarketSessionStatus>('AUTO');

  const popoverRef = useRef<HTMLDivElement>(null);

  // Hook customizado que realiza fetch periódico no endpoint de cotações reais
  const {
    quotes: marketAssets,
    isSyncing,
    lastUpdated,
    error,
    refetch,
    sessionInfo: autoSessionInfo,
  } = useMarketData({
    pollingInterval: 5000,
    endpoint: '/api/market/quotes',
  });

  // Hook de Gestão de Alertas de Preço (Stop-Loss / Take-Profit) com vigilância in-app
  const {
    alerts,
    notifications,
    unreadCount,
    activeToast,
    addAlert,
    removeAlert,
    toggleAlertActive,
    resetAlert,
    dismissToast,
    hasActiveAlertForTicker,
    getActiveAlertCountForTicker,
    simulateTriggerForTesting,
  } = usePriceAlerts(marketAssets);

  // Estados do Modal de Alertas de Preço
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedAssetForAlert, setSelectedAssetForAlert] = useState<MarketAsset | null>(null);

  const handleOpenAlertForAsset = (asset: MarketAsset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedAssetForAlert(asset);
    setIsAlertModalOpen(true);
  };

  const handleOpenAlertManager = (ticker?: string) => {
    if (ticker) {
      const match = marketAssets.find((a) => a.ticker.toUpperCase() === ticker.toUpperCase());
      if (match) setSelectedAssetForAlert(match);
    } else if (marketAssets.length > 0 && !selectedAssetForAlert) {
      setSelectedAssetForAlert(marketAssets[0]);
    }
    setIsAlertModalOpen(true);
  };

  // Fecha o popover ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowSessionPopover(false);
      }
    };
    if (showSessionPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSessionPopover]);

  // Se houver override manual, ajusta o sessionInfo para a demonstração
  const sessionInfo: MarketSessionInfo = React.useMemo(() => {
    if (overrideSession === 'AUTO') {
      return autoSessionInfo;
    }

    if (overrideSession === 'OPEN') {
      return {
        status: 'OPEN',
        label: 'PREGÃO ABERTO',
        shortLabel: 'ABERTO',
        description: 'Pregão regular em negociação contínua na B3 e mercado internacional. Liquidez plena.',
        nextEvent: 'Fecha às 17:00 (Sessão Regular)',
        brasiliaTime: `${autoSessionInfo.brasiliaTime} [Simulado]`,
        visual: {
          dotColor: 'bg-emerald-400',
          pingColor: 'bg-emerald-400/80',
          badgeBg: 'bg-emerald-500/10',
          badgeText: 'text-emerald-300',
          badgeBorder: 'border-emerald-500/30',
          statusIcon: 'ACTIVE',
        },
      };
    }

    if (overrideSession === 'AFTER_MARKET') {
      return {
        status: 'AFTER_MARKET',
        label: 'PÓS-MERCADO',
        shortLabel: 'AFTER-MKT',
        description: 'Sessão After-Market B3 ativa. Ajustes de posições, liquidez reduzida e oscilação limitada.',
        nextEvent: 'Encerramento do After-Market às 18:00',
        brasiliaTime: `${autoSessionInfo.brasiliaTime} [Simulado]`,
        visual: {
          dotColor: 'bg-amber-400',
          pingColor: 'bg-amber-400/75',
          badgeBg: 'bg-amber-500/10',
          badgeText: 'text-amber-300',
          badgeBorder: 'border-amber-500/30',
          statusIcon: 'WARNING',
        },
      };
    }

    if (overrideSession === 'PRE_MARKET') {
      return {
        status: 'PRE_MARKET',
        label: 'PRÉ-ABERTURA',
        shortLabel: 'PRÉ-MKT',
        description: 'Leilão de pré-abertura B3 em andamento. Formação de preços teóricos de abertura.',
        nextEvent: 'Abertura regular às 10:00',
        brasiliaTime: `${autoSessionInfo.brasiliaTime} [Simulado]`,
        visual: {
          dotColor: 'bg-cyan-400',
          pingColor: 'bg-cyan-400/60',
          badgeBg: 'bg-cyan-500/10',
          badgeText: 'text-cyan-300',
          badgeBorder: 'border-cyan-500/30',
          statusIcon: 'ACTIVE',
        },
      };
    }

    return {
      status: 'CLOSED',
      label: 'MERCADO FECHADO',
      shortLabel: 'FECHADO',
      description: 'Fechamento do pregão diário. Cotações consolidadas para marcação a mercado e liquidação fiduciária.',
      nextEvent: 'Abre no próximo dia útil às 10:00',
      brasiliaTime: `${autoSessionInfo.brasiliaTime} [Simulado]`,
      visual: {
        dotColor: 'bg-slate-400',
        pingColor: 'bg-slate-400/40',
        badgeBg: 'bg-slate-800/80',
        badgeText: 'text-slate-300',
        badgeBorder: 'border-slate-700/80',
        statusIcon: 'STANDBY',
      },
    };
  }, [overrideSession, autoSessionInfo]);

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--';

  // Duplicar para loop contínuo e infinito no CSS marquee
  const duplicatedAssets = [...marketAssets, ...marketAssets];

  return (
    <div
      className="bg-[#0A101D] border-b border-slate-800/80 text-xs text-slate-300 relative select-none flex items-center overflow-hidden h-10 shadow-sm z-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left Fixed Badge: Indicador Visual de Horário e Status da Sessão de Mercado */}
      <div className="shrink-0 relative flex items-center gap-2 pl-3 pr-3 bg-[#0A101D] border-r border-slate-800/80 h-full z-20">
        <button
          onClick={() => setShowSessionPopover(!showSessionPopover)}
          className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition cursor-pointer select-none group ${sessionInfo.visual.badgeBg} ${sessionInfo.visual.badgeBorder}`}
          title="Clique para ver detalhes do horário da B3 e sessões de mercado"
        >
          {/* Beacon Dinâmico ajustado pelo horário da sessão */}
          <span className="relative flex h-2 w-2">
            {sessionInfo.status === 'OPEN' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
            )}
            {sessionInfo.status === 'AFTER_MARKET' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
            )}
            {sessionInfo.status === 'PRE_MARKET' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${sessionInfo.visual.dotColor} ${
                sessionInfo.status === 'CLOSED' ? 'ring-1 ring-slate-500/50' : ''
              }`}
            />
          </span>

          {/* Rótulo da Sessão */}
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
            {sessionInfo.status === 'CLOSED' ? (
              <Moon className="w-3 h-3 text-slate-400" />
            ) : sessionInfo.status === 'AFTER_MARKET' ? (
              <Clock className="w-3 h-3 text-amber-400" />
            ) : (
              <Globe2 className="w-3 h-3 text-emerald-400" />
            )}
            <span className={`hidden sm:inline ${sessionInfo.visual.badgeText}`}>
              {sessionInfo.label}
            </span>
            <span className={`sm:hidden ${sessionInfo.visual.badgeText}`}>
              {sessionInfo.shortLabel}
            </span>
          </div>

          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition" />
        </button>

        {/* Relógio do Feed & Botão de Sincronização */}
        <button
          onClick={() => refetch()}
          title="Horário do feed • Clique para sincronizar agora"
          className="hidden md:inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-300 font-mono pl-1 border-l border-slate-800 transition cursor-pointer"
        >
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{formattedTime}</span>
          <RefreshCw
            className={`w-2.5 h-2.5 ml-0.5 text-slate-500 hover:text-cyan-400 ${
              isSyncing ? 'animate-spin text-cyan-400' : ''
            }`}
          />
        </button>

        {/* Popover Explicativo de Horário e Sessões */}
        {showSessionPopover && (
          <div
            ref={popoverRef}
            className="absolute left-3 top-11 w-80 sm:w-96 p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 animate-fadeIn text-xs space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${sessionInfo.visual.dotColor}`} />
                <h4 className="font-bold text-white text-sm">
                  Horário Oficial do Mercado (B3 / Bovespa)
                </h4>
              </div>
              <button
                onClick={() => setShowSessionPopover(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status atual em destaque */}
            <div className={`p-3 rounded-xl border ${sessionInfo.visual.badgeBg} ${sessionInfo.visual.badgeBorder}`}>
              <div className="flex items-center justify-between font-bold text-xs mb-1">
                <span className={sessionInfo.visual.badgeText}>
                  Status: {sessionInfo.label}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {sessionInfo.brasiliaTime}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {sessionInfo.description}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Próximo Marco:</span>
                <span className="font-semibold text-white">{sessionInfo.nextEvent}</span>
              </div>
            </div>

            {/* Tabela de Referência Regulamentar da B3 */}
            <div className="space-y-1.5 text-[11px]">
              <span className="font-semibold text-slate-300 block text-[10px] uppercase tracking-wider">
                Grade de Negociação B3 (Horário de Brasília)
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <span className="text-cyan-400 font-bold">09:45 – 10:00</span>
                  <span className="text-slate-300 font-medium">Pré-Abertura (Leilão)</span>
                  <span className="text-slate-500 text-[9px]">Formação de preço teórico</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <span className="text-emerald-400 font-bold">10:00 – 17:00</span>
                  <span className="text-slate-300 font-medium">Pregão Regular</span>
                  <span className="text-slate-500 text-[9px]">Negociação contínua</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <span className="text-amber-400 font-bold">17:00 – 18:00</span>
                  <span className="text-slate-300 font-medium">After-Market</span>
                  <span className="text-slate-500 text-[9px]">Pós-mercado e ajustes</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-400 font-bold">18:00 – 09:45</span>
                  <span className="text-slate-300 font-medium">Mercado Fechado</span>
                  <span className="text-slate-500 text-[9px]">Liquidação &amp; Overnight</span>
                </div>
              </div>
            </div>

            {/* Simulador / Demonstração de Estados */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3 h-3" />
                  Simular Sessão no Ticker:
                </span>
                {overrideSession !== 'AUTO' && (
                  <button
                    onClick={() => setOverrideSession('AUTO')}
                    className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Restaurar Horário Real
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    { id: 'AUTO', label: 'Horário Real' },
                    { id: 'OPEN', label: 'Aberto' },
                    { id: 'AFTER_MARKET', label: 'Pós-Mkt' },
                    { id: 'CLOSED', label: 'Fechado' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setOverrideSession(opt.id)}
                    className={`py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                      overrideSession === opt.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Marquee Ticker Track */}
      <div
        className="relative flex-1 overflow-hidden flex items-center h-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={`flex items-center gap-6 whitespace-nowrap will-change-transform ${
            isPaused ? '' : 'animate-marquee'
          }`}
          style={{
            animation: isPaused ? 'none' : 'marquee 45s linear infinite',
          }}
        >
          {duplicatedAssets.map((asset, idx) => {
            const hasAlert = hasActiveAlertForTicker(asset.ticker);
            return (
              <div
                key={`${asset.ticker}-${idx}`}
                onClick={() => handleOpenAlertForAsset(asset)}
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md hover:bg-slate-800/80 cursor-pointer transition text-xs group"
                title={`${asset.name} (${asset.category}) - Clique para definir Alerta Stop-Loss / Take-Profit`}
              >
                <span className="font-bold text-slate-200 group-hover:text-cyan-300 transition font-mono flex items-center gap-1">
                  {asset.ticker}
                  {hasAlert && (
                    <span
                      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                      title="Alerta de preço configurado neste ativo"
                    >
                      <Bell className="w-2 h-2 animate-pulse" />
                    </span>
                  )}
                </span>
                <span className="font-mono text-white font-semibold flex items-center gap-0.5">
                  <span>{asset.value}</span>
                  {asset.unit ? (
                    <span className="text-[10px] text-slate-400 font-normal">
                      {asset.unit}
                    </span>
                  ) : null}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 text-[11px] font-semibold font-mono ${
                    asset.isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {asset.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {asset.change}
                </span>

                {/* Ícone rápido para abrir modal de alerta no hover */}
                <button
                  type="button"
                  onClick={(e) => handleOpenAlertForAsset(asset, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-700/60 transition cursor-pointer"
                  title={`Definir Stop-Loss ou Take-Profit para ${asset.ticker}`}
                >
                  <Bell className="w-3 h-3" />
                </button>

                <span className="text-slate-700 mx-1">•</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Fixed Buttons: Alertas de Preço + Acessar Inteligência Macro */}
      <div className="shrink-0 hidden sm:flex items-center gap-2 pr-3 pl-3 bg-[#0A101D] border-l border-slate-800/80 shadow-[-12px_0_16px_-4px_rgba(10,16,29,0.95)] h-full z-10">
        <button
          onClick={() => handleOpenAlertManager()}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition shadow-xs cursor-pointer ${
            alerts.some((a) => a.active && !a.triggered)
              ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/70'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Definir e gerenciar limites de alerta (Stop-Loss / Take-Profit)"
        >
          <Bell className="w-3 h-3 text-cyan-400" />
          <span>Alertas</span>
          {alerts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
              {alerts.filter((a) => a.active && !a.triggered).length}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigateTab?.('market')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition shadow-xs cursor-pointer"
        >
          <Activity className="w-3 h-3 text-indigo-400" />
          <span>Painel Macro</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Modal de Alertas de Preço (Stop-Loss / Take-Profit) */}
      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        selectedAsset={selectedAssetForAlert}
        allAssets={marketAssets}
        alerts={alerts}
        onAddAlert={addAlert}
        onRemoveAlert={removeAlert}
        onToggleAlertActive={toggleAlertActive}
        onResetAlert={resetAlert}
        onSimulateTrigger={simulateTriggerForTesting}
      />

      {/* Notificação Toast In-App ao Atingir Limite de Preço */}
      <PriceAlertToast
        notification={activeToast}
        onDismiss={dismissToast}
        onOpenAlertManager={handleOpenAlertManager}
      />

      {/* Embedded CSS for smooth marquee keyframe */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};
