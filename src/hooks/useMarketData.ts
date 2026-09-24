import { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_MARKET_ASSETS, MarketAsset } from '../data/wealthCopilotData';
import {
  checkMarketSession,
  MarketSessionInfo,
  MarketSessionStatus,
} from '../utils/marketHours';

export interface UseMarketDataOptions {
  /**
   * Intervalo em milissegundos para polling periódico.
   * Padrão: 5000 ms (5 segundos).
   */
  pollingInterval?: number;
  /**
   * URL do endpoint da API de cotações.
   * Padrão: '/api/market/quotes'.
   */
  endpoint?: string;
  /**
   * Se a sincronização periódica está ativa.
   * Padrão: true.
   */
  enabled?: boolean;
  /**
   * Ativos iniciais/fallback caso a requisição inicial falhe ou esteja carregando.
   */
  initialData?: MarketAsset[];
  /**
   * Callback disparado após sincronização bem-sucedida.
   */
  onSuccess?: (quotes: MarketAsset[]) => void;
  /**
   * Callback disparado em caso de erro na requisição.
   */
  onError?: (error: Error) => void;
}

export interface UseMarketDataReturn {
  /**
   * Lista de cotações sincronizadas em tempo real com o backend/mercado.
   */
  quotes: MarketAsset[];
  /**
   * Indica se a primeira carga de cotações ainda está em andamento.
   */
  isLoading: boolean;
  /**
   * Indica se um ciclo de atualização/fetch em background está ocorrendo.
   */
  isSyncing: boolean;
  /**
   * Data/hora da última sincronização bem-sucedida.
   */
  lastUpdated: Date | null;
  /**
   * Mensagem de erro caso a requisição falhe.
   */
  error: string | null;
  /**
   * Status simplificado do pregão ('OPEN', 'PRE_MARKET', 'AFTER_MARKET', 'CLOSED').
   */
  marketStatus: MarketSessionStatus;
  /**
   * Detalhamento rico da sessão de mercado (horário B3, rótulo, descrição, próximo evento, cores).
   */
  sessionInfo: MarketSessionInfo;
  /**
   * Fonte das informações (ex: B3, Bacen, Fed, ICE).
   */
  source: string;
  /**
   * Força uma atualização imediata via fetch.
   */
  refetch: () => Promise<void>;
  /**
   * Indica se o canal de streaming/polling está operacional.
   */
  isLive: boolean;
}

/**
 * Hook customizado para consumo e sincronização em tempo real de cotações de mercado.
 * Realiza chamadas periódicas via fetch no endpoint de cotações configurado,
 * garantindo resiliência com fallback e cancelamento limpo no unmount.
 */
export function useMarketData(options: UseMarketDataOptions = {}): UseMarketDataReturn {
  const {
    pollingInterval = 5000,
    endpoint = '/api/market/quotes',
    enabled = true,
    initialData = INITIAL_MARKET_ASSETS,
    onSuccess,
    onError,
  } = options;

  const [quotes, setQuotes] = useState<MarketAsset[]>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<MarketSessionInfo>(() => checkMarketSession());
  const [source, setSource] = useState<string>('B3 / Bacen / ICE / Fed');
  const [isLive, setIsLive] = useState<boolean>(true);

  // Evita memory leaks e referências desatualizadas
  const isMountedRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFirstLoadRef = useRef<boolean>(true);

  const fetchQuotes = useCallback(async () => {
    if (!enabled) return;

    // Atualiza a cada ciclo a verificação de horário local do mercado
    setSessionInfo(checkMarketSession());

    // Cancela requisição anterior se ainda estiver pendente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    if (isFirstLoadRef.current) {
      setIsLoading(true);
    } else {
      setIsSyncing(true);
    }

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: Falha ao buscar cotações do mercado`);
      }

      const data = await response.json();

      if (!isMountedRef.current) return;

      if (data && Array.isArray(data.quotes) && data.quotes.length > 0) {
        setQuotes(data.quotes);
        setLastUpdated(data.timestamp ? new Date(data.timestamp) : new Date());
        if (data.source) setSource(data.source);
        setError(null);
        setIsLive(true);

        if (onSuccess) {
          onSuccess(data.quotes);
        }
      }
    } catch (err: any) {
      // Ignora erro de abort proposital
      if (err.name === 'AbortError') return;

      if (!isMountedRef.current) return;

      console.warn('[useMarketData] Erro ao sincronizar cotações:', err.message);
      setError(err.message || 'Falha na conexão com o servidor de cotações');
      setIsLive(false);

      if (onError) {
        onError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsSyncing(false);
        isFirstLoadRef.current = false;
      }
    }
  }, [endpoint, enabled, onSuccess, onError]);

  // Efeito principal: carga inicial e agendamento de polling periódico
  useEffect(() => {
    isMountedRef.current = true;

    // Dispara a primeira busca imediatamente
    fetchQuotes();

    if (!enabled || pollingInterval <= 0) {
      return () => {
        isMountedRef.current = false;
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }

    // Polling periódico contínuo via setInterval
    const intervalId = setInterval(() => {
      fetchQuotes();
    }, pollingInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchQuotes, pollingInterval, enabled]);

  return {
    quotes,
    isLoading,
    isSyncing,
    lastUpdated,
    error,
    marketStatus: sessionInfo.status,
    sessionInfo,
    source,
    refetch: fetchQuotes,
    isLive,
  };
}
