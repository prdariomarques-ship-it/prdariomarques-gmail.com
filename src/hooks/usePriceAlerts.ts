import { useState, useEffect, useCallback, useRef } from 'react';
import { MarketAsset } from '../data/wealthCopilotData';
import {
  PriceAlert,
  PriceAlertType,
  InAppPriceNotification,
  loadSavedPriceAlerts,
  savePriceAlerts,
  loadSavedPriceNotifications,
  savePriceNotifications,
  checkPriceAlerts,
  parseAssetPrice,
} from '../utils/priceAlerts';
import { playCriticalAlertSound } from '../utils/audioNotification';

export interface UsePriceAlertsReturn {
  alerts: PriceAlert[];
  notifications: InAppPriceNotification[];
  unreadCount: number;
  activeToast: InAppPriceNotification | null;
  addAlert: (params: {
    ticker: string;
    assetName: string;
    targetPrice: number;
    initialPrice: number;
    type: PriceAlertType;
    note?: string;
    soundEnabled?: boolean;
  }) => PriceAlert;
  removeAlert: (id: string) => void;
  toggleAlertActive: (id: string) => void;
  resetAlert: (id: string) => void;
  dismissToast: () => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  hasActiveAlertForTicker: (ticker: string) => boolean;
  getActiveAlertCountForTicker: (ticker: string) => number;
  simulateTriggerForTesting: (ticker: string) => void;
}

export function usePriceAlerts(quotes: MarketAsset[] = []): UsePriceAlertsReturn {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => loadSavedPriceAlerts());
  const [notifications, setNotifications] = useState<InAppPriceNotification[]>(() =>
    loadSavedPriceNotifications()
  );
  const [activeToast, setActiveToast] = useState<InAppPriceNotification | null>(null);

  const quotesRef = useRef<MarketAsset[]>(quotes);
  quotesRef.current = quotes;

  // Avalia alertas sempre que as cotações chegam
  useEffect(() => {
    if (!quotes || quotes.length === 0) return;

    setAlerts((currentAlerts) => {
      const { updatedAlerts, newNotifications } = checkPriceAlerts(currentAlerts, quotes);

      if (newNotifications.length > 0) {
        // Toca som de alerta se configurado
        const shouldPlaySound = newNotifications.some((n) => {
          const matchedAlert = currentAlerts.find((a) => a.id === n.alertId);
          return matchedAlert?.soundEnabled !== false;
        });

        if (shouldPlaySound) {
          playCriticalAlertSound();
        }

        // Adiciona às notificações
        setNotifications((prevNotifs) => {
          const updated = [...newNotifications, ...prevNotifs];
          savePriceNotifications(updated);
          return updated;
        });

        // Mostra o toast mais recente
        setActiveToast(newNotifications[0]);
      }

      return updatedAlerts;
    });
  }, [quotes]);

  // Adicionar novo alerta
  const addAlert = useCallback(
    ({
      ticker,
      assetName,
      targetPrice,
      initialPrice,
      type,
      note,
      soundEnabled = true,
    }: {
      ticker: string;
      assetName: string;
      targetPrice: number;
      initialPrice: number;
      type: PriceAlertType;
      note?: string;
      soundEnabled?: boolean;
    }) => {
      const newAlert: PriceAlert = {
        id: `alert-${ticker}-${Date.now()}`,
        ticker: ticker.toUpperCase(),
        assetName,
        targetPrice,
        initialPrice,
        currentPrice: initialPrice,
        type,
        note,
        active: true,
        createdAt: new Date().toISOString(),
        triggered: false,
        soundEnabled,
      };

      setAlerts((prev) => {
        const updated = [newAlert, ...prev];
        savePriceAlerts(updated);
        return updated;
      });

      return newAlert;
    },
    []
  );

  // Remover alerta
  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      savePriceAlerts(updated);
      return updated;
    });
  }, []);

  // Alternar ativo/pausado
  const toggleAlertActive = useCallback((id: string) => {
    setAlerts((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a));
      savePriceAlerts(updated);
      return updated;
    });
  }, []);

  // Resetar alerta disparado para monitorar novamente
  const resetAlert = useCallback((id: string) => {
    setAlerts((prev) => {
      const currentQuote = quotesRef.current.find((q) => q.ticker.toUpperCase() === id.toUpperCase());
      const currentPrice = currentQuote ? parseAssetPrice(currentQuote.value) : undefined;

      const updated = prev.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            active: true,
            triggered: false,
            triggeredAt: undefined,
            triggeredPrice: undefined,
            currentPrice: currentPrice !== undefined ? currentPrice : a.currentPrice,
          };
        }
        return a;
      });
      savePriceAlerts(updated);
      return updated;
    });
  }, []);

  // Fechar toast
  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Marcar como lida
  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      savePriceNotifications(updated);
      return updated;
    });
  }, []);

  // Limpar notificações
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    savePriceNotifications([]);
    setActiveToast(null);
  }, []);

  // Helpers
  const hasActiveAlertForTicker = useCallback(
    (ticker: string) => {
      return alerts.some((a) => a.ticker.toUpperCase() === ticker.toUpperCase() && a.active && !a.triggered);
    },
    [alerts]
  );

  const getActiveAlertCountForTicker = useCallback(
    (ticker: string) => {
      return alerts.filter((a) => a.ticker.toUpperCase() === ticker.toUpperCase() && a.active && !a.triggered)
        .length;
    },
    [alerts]
  );

  // Simular disparo para teste imediato na UI
  const simulateTriggerForTesting = useCallback(
    (ticker: string) => {
      const targetAlert = alerts.find((a) => a.ticker.toUpperCase() === ticker.toUpperCase());
      if (!targetAlert) return;

      const simulatedPrice =
        targetAlert.type === 'TAKE_PROFIT'
          ? targetAlert.targetPrice * 1.01
          : targetAlert.targetPrice * 0.99;

      const newNotif: InAppPriceNotification = {
        id: `notif-sim-${Date.now()}`,
        alertId: targetAlert.id,
        ticker: targetAlert.ticker,
        assetName: targetAlert.assetName,
        type: targetAlert.type,
        targetPrice: targetAlert.targetPrice,
        triggeredPrice: simulatedPrice,
        timestamp: new Date().toISOString(),
        read: false,
        note: targetAlert.note || 'Disparo simulado para validação operacional',
      };

      playCriticalAlertSound();

      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        savePriceNotifications(updated);
        return updated;
      });

      setAlerts((prev) => {
        const updated = prev.map((a) =>
          a.id === targetAlert.id
            ? {
                ...a,
                active: false,
                triggered: true,
                triggeredAt: new Date().toISOString(),
                triggeredPrice: simulatedPrice,
              }
            : a
        );
        savePriceAlerts(updated);
        return updated;
      });

      setActiveToast(newNotif);
    },
    [alerts]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    alerts,
    notifications,
    unreadCount,
    activeToast,
    addAlert,
    removeAlert,
    toggleAlertActive,
    resetAlert,
    dismissToast,
    markNotificationAsRead,
    clearAllNotifications,
    hasActiveAlertForTicker,
    getActiveAlertCountForTicker,
    simulateTriggerForTesting,
  };
}
