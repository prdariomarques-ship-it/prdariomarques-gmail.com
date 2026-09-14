import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  Wifi,
  WifiOff,
  Radio,
  RefreshCw,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { authenticatedFetch } from '../../lib/apiClient';

export interface LatencyRecord {
  id: number;
  timestamp: number;
  latencyMs: number;
  success: boolean;
  statusText?: string;
}

export interface ConnectivityLatencyBadgeProps {
  /**
   * Intervalo em milissegundos entre verificações de ping (padrão: 8000ms)
   */
  pingIntervalMs?: number;
  /**
   * Endpoint de verificação de integridade (padrão: '/api/health')
   */
  endpoint?: string;
  /**
   * Callback opcional quando a latência for atualizada
   */
  onLatencyUpdate?: (latestLatency: number) => void;
  className?: string;
}

export const ConnectivityLatencyBadge: React.FC<ConnectivityLatencyBadgeProps> = ({
  pingIntervalMs = 8000,
  endpoint = '/api/health',
  onLatencyUpdate,
  className = '',
}) => {
  const [latencyHistory, setLatencyHistory] = useState<LatencyRecord[]>([
    { id: 1, timestamp: Date.now() - 24000, latencyMs: 22, success: true },
    { id: 2, timestamp: Date.now() - 16000, latencyMs: 26, success: true },
    { id: 3, timestamp: Date.now() - 8000, latencyMs: 19, success: true },
  ]);
  const [currentLatency, setCurrentLatency] = useState<number>(24);
  const [status, setStatus] = useState<'online' | 'degraded' | 'offline' | 'checking'>('online');
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const [uptimeSeconds, setUptimeSeconds] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Executa teste de conectividade e latência contra o endpoint
  const executePing = useCallback(async () => {
    setIsPinging(true);
    const startTime = performance.now();
    try {
      // Usa timestamp para evitar cache do browser
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await authenticatedFetch(`${endpoint}?_t=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const endTime = performance.now();
      const measuredLatency = Math.max(1, Math.round(endTime - startTime));

      if (res.ok) {
        try {
          const data = await res.json();
          if (typeof data.uptime === 'number') {
            setUptimeSeconds(data.uptime);
          }
        } catch {
          // Ignora se o json de resposta for diferente
        }

        setCurrentLatency(measuredLatency);
        setLastCheckTime(new Date());

        let newStatus: 'online' | 'degraded' | 'offline' = 'online';
        if (measuredLatency > 280) {
          newStatus = 'degraded';
        }

        setStatus(newStatus);
        setLatencyHistory((prev) => {
          const updated = [
            ...prev.slice(-14),
            {
              id: Date.now(),
              timestamp: Date.now(),
              latencyMs: measuredLatency,
              success: true,
            },
          ];
          return updated;
        });

        if (onLatencyUpdate) {
          onLatencyUpdate(measuredLatency);
        }
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn('Falha no ping de conectividade:', err);
      setStatus('offline');
      setLatencyHistory((prev) => [
        ...prev.slice(-14),
        {
          id: Date.now(),
          timestamp: Date.now(),
          latencyMs: 999,
          success: false,
          statusText: 'Timeout / Erro de Rede',
        },
      ]);
    } finally {
      setIsPinging(false);
    }
  }, [endpoint, onLatencyUpdate]);

  // Intervalo periódico de ping e listener de rede nativo do navegador
  useEffect(() => {
    // Primeiro ping inicial
    executePing();

    const interval = setInterval(() => {
      executePing();
    }, pingIntervalMs);

    const handleOnline = () => executePing();
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [executePing, pingIntervalMs]);

  // Fecha o popover ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  // Métricas agregadas
  const successfulPings = latencyHistory.filter((p) => p.success);
  const averageLatency =
    successfulPings.length > 0
      ? Math.round(
          successfulPings.reduce((sum, p) => sum + p.latencyMs, 0) / successfulPings.length
        )
      : currentLatency;

  const minLatency =
    successfulPings.length > 0
      ? Math.min(...successfulPings.map((p) => p.latencyMs))
      : currentLatency;

  const maxLatency =
    successfulPings.length > 0
      ? Math.max(...successfulPings.map((p) => p.latencyMs))
      : currentLatency;

  const slaPercentage =
    latencyHistory.length > 0
      ? ((successfulPings.length / latencyHistory.length) * 100).toFixed(1)
      : '100.0';

  // Configurações de cores e níveis de sinal
  const getQualityBadge = () => {
    if (status === 'offline') {
      return {
        label: 'Desconectado',
        colorClass: 'text-rose-400',
        bgClass: 'bg-rose-500/10 border-rose-500/30',
        barColor: 'bg-rose-500',
        barsActive: 0,
      };
    }
    if (currentLatency < 50) {
      return {
        label: 'Ultra-Rápida',
        colorClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/15 border-emerald-500/30',
        barColor: 'bg-emerald-400',
        barsActive: 4,
      };
    }
    if (currentLatency < 120) {
      return {
        label: 'Excelente',
        colorClass: 'text-teal-400',
        bgClass: 'bg-teal-500/15 border-teal-500/30',
        barColor: 'bg-teal-400',
        barsActive: 3,
      };
    }
    if (currentLatency < 250) {
      return {
        label: 'Moderada',
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-500/15 border-amber-500/30',
        barColor: 'bg-amber-400',
        barsActive: 2,
      };
    }
    return {
      label: 'Alta Latência',
      colorClass: 'text-rose-400',
      bgClass: 'bg-rose-500/15 border-rose-500/30',
      barColor: 'bg-rose-400',
      barsActive: 1,
    };
  };

  const quality = getQualityBadge();

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={popoverRef}>
      {/* Botão Badge Principal na barra de status */}
      <button
        id="FlowCore-connectivity-badge"
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        title="Clique para ver métricas detalhadas de conectividade e telemetria da API"
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition cursor-pointer select-none text-[11px] ${quality.bgClass} hover:brightness-110`}
      >
        {/* Ícone de status de conexão com animação sutil */}
        <div className="flex items-center">
          {status === 'offline' ? (
            <WifiOff className="w-3 h-3 text-rose-400 animate-pulse" />
          ) : (
            <span className="relative flex h-2 w-2 mr-1">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  quality.barColor
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${quality.barColor}`}
              />
            </span>
          )}
        </div>

        {/* Barras visuais de qualidade do sinal (4 barras progressivas) */}
        <div className="flex items-end gap-[1.5px] h-2.5 px-0.5" title={`Qualidade: ${quality.label}`}>
          <span
            className={`w-[2px] rounded-xs transition-all ${
              quality.barsActive >= 1 ? quality.barColor : 'bg-slate-700'
            }`}
            style={{ height: '3px' }}
          />
          <span
            className={`w-[2px] rounded-xs transition-all ${
              quality.barsActive >= 2 ? quality.barColor : 'bg-slate-700'
            }`}
            style={{ height: '5px' }}
          />
          <span
            className={`w-[2px] rounded-xs transition-all ${
              quality.barsActive >= 3 ? quality.barColor : 'bg-slate-700'
            }`}
            style={{ height: '7px' }}
          />
          <span
            className={`w-[2px] rounded-xs transition-all ${
              quality.barsActive >= 4 ? quality.barColor : 'bg-slate-700'
            }`}
            style={{ height: '9px' }}
          />
        </div>

        {/* Texto do valor da latência e unidade */}
        <div className="flex items-baseline gap-0.5 font-mono">
          <span className="text-slate-400 text-[10px] hidden sm:inline">API:</span>
          {status === 'offline' ? (
            <span className="text-rose-400 font-bold">OFFLINE</span>
          ) : (
            <>
              <span className={`font-bold ${quality.colorClass}`}>
                {currentLatency}
              </span>
              <span className="text-slate-400 text-[9px]">ms</span>
            </>
          )}
        </div>

        {/* Indicador de ping em andamento */}
        {isPinging && (
          <RefreshCw className="w-2.5 h-2.5 text-slate-400 animate-spin ml-0.5" />
        )}
      </button>

      {/* POPOVER TELEMETRIA DETALHADA */}
      {isPopoverOpen && (
        <div
          id="connectivity-telemetry-popover"
          className="absolute top-full left-0 mt-2 w-80 sm:w-88 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-xs z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header do Popover */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${quality.bgClass}`}
              >
                {status === 'offline' ? (
                  <WifiOff className="w-4 h-4 text-rose-400" />
                ) : (
                  <Radio className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  Telemetria de Conectividade
                </h4>
                <p className="text-[10px] text-slate-400">
                  Monitoramento contínuo da API Sentinel
                </p>
              </div>
            </div>

            <button
              onClick={executePing}
              disabled={isPinging}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-medium transition cursor-pointer disabled:opacity-50"
              title="Disparar ping manual imediatamente"
            >
              <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isPinging ? 'Testando...' : 'Ping'}</span>
            </button>
          </div>

          {/* Destaque Principal: Status & Latência Atual */}
          <div className="my-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Estado da Conexão
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {status === 'online' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : status === 'degraded' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span className="text-white font-bold text-xs">
                  {status === 'online'
                    ? 'Conectado (Alta Disponibilidade)'
                    : status === 'degraded'
                    ? 'Conectado (Latência Alta)'
                    : 'Sem Conexão'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                Classificação: <strong className={quality.colorClass}>{quality.label}</strong>
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Tempo de Resposta
              </span>
              <div className="text-lg font-mono font-bold text-white flex items-baseline justify-end gap-0.5">
                <span className={quality.colorClass}>{currentLatency}</span>
                <span className="text-xs text-slate-400">ms</span>
              </div>
            </div>
          </div>

          {/* Spark-bars do Histórico Recente de Latência */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Histórico de Amostragem (Últimas medições)</span>
              <span className="font-mono text-slate-300">
                SLA: <strong className="text-emerald-400">{slaPercentage}%</strong>
              </span>
            </div>

            <div className="h-10 bg-slate-950/80 rounded-lg p-1.5 border border-slate-800/80 flex items-end gap-1.5">
              {latencyHistory.map((item, idx) => {
                const heightPercent = item.success
                  ? Math.min(100, Math.max(15, (item.latencyMs / Math.max(1, maxLatency * 1.2)) * 100))
                  : 100;
                const barColor = !item.success
                  ? 'bg-rose-500'
                  : item.latencyMs < 50
                  ? 'bg-emerald-400 hover:bg-emerald-300'
                  : item.latencyMs < 150
                  ? 'bg-teal-400 hover:bg-teal-300'
                  : item.latencyMs < 280
                  ? 'bg-amber-400 hover:bg-amber-300'
                  : 'bg-rose-400 hover:bg-rose-300';

                return (
                  <div
                    key={item.id || idx}
                    className="flex-1 flex flex-col justify-end items-center group relative h-full cursor-pointer"
                  >
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-xs transition-all ${barColor}`}
                    />
                    {/* Tooltip do ponto no histórico */}
                    <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-30 border border-slate-700 pointer-events-none">
                      {item.success ? `${item.latencyMs} ms` : 'Falha'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid de Estatísticas Detalhadas */}
          <div className="grid grid-cols-3 gap-2 py-2 border-t border-slate-800 text-center text-[10px]">
            <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block">Média</span>
              <span className="text-slate-200 font-mono font-bold text-[11px]">
                {averageLatency} ms
              </span>
            </div>
            <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block">Mínima</span>
              <span className="text-emerald-400 font-mono font-bold text-[11px]">
                {minLatency} ms
              </span>
            </div>
            <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block">Máxima</span>
              <span className="text-amber-400 font-mono font-bold text-[11px]">
                {maxLatency} ms
              </span>
            </div>
          </div>

          {/* Informações Técnicas de Infraestrutura */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1 text-[10px] text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Server className="w-3 h-3 text-slate-500" /> Endpoint:
              </span>
              <span className="font-mono text-slate-300">{endpoint}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Protocolo:</span>
              <span className="font-mono text-slate-300">HTTP/1.1 REST Keep-Alive</span>
            </div>
            {uptimeSeconds !== null && (
              <div className="flex items-center justify-between">
                <span>Uptime do Servidor:</span>
                <span className="font-mono text-emerald-400 font-medium">
                  {Math.floor(uptimeSeconds / 60)}m {uptimeSeconds % 60}s
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Última checagem:</span>
              <span className="font-mono text-slate-300">
                {lastCheckTime.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
