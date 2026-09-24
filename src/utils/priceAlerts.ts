import { MarketAsset } from '../data/wealthCopilotData';

export type PriceAlertType = 'STOP_LOSS' | 'TAKE_PROFIT';

export interface PriceAlert {
  id: string;
  ticker: string;
  assetName: string;
  targetPrice: number;
  initialPrice: number;
  currentPrice: number;
  type: PriceAlertType;
  note?: string;
  active: boolean;
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
  triggeredPrice?: number;
  soundEnabled?: boolean;
}

export interface InAppPriceNotification {
  id: string;
  alertId: string;
  ticker: string;
  assetName: string;
  type: PriceAlertType;
  targetPrice: number;
  triggeredPrice: number;
  timestamp: string;
  read: boolean;
  note?: string;
}

const STORAGE_KEY_ALERTS = 'flowcore_market_price_alerts';
const STORAGE_KEY_NOTIFS = 'flowcore_market_price_notifications';

/**
 * Converte a string de cotação formatada em número de ponto flutuante preciso
 */
export function parseAssetPrice(valueStr: string): number {
  if (!valueStr) return 0;

  // Remove símbolos monetários, %, 'pts', espaços
  let clean = valueStr.replace(/[R$\s%pts]/gi, '').trim();

  // Tratamento de separador de milhar e decimal
  if (clean.includes(',') && clean.includes('.')) {
    // Padrão brasileiro com ambos: 1.234,56 -> 1234.56
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    // 5,82 -> 5.82
    clean = clean.replace(',', '.');
  } else if (clean.includes('.')) {
    // Pode ser milhar (ex: 127.850 ou 88.500 ou 5.980) ou decimal simples (ex: 14.25)
    const parts = clean.split('.');
    if (parts.length === 2 && parts[1].length === 3 && Number(parts[0]) > 0) {
      // 127.850 -> 127850
      clean = clean.replace('.', '');
    }
  }

  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formata um preço numérico para exibição condizente com o padrão do ativo
 */
export function formatAssetPrice(num: number, unit?: string): string {
  if (unit && unit.includes('%')) {
    return `${num.toFixed(2).replace('.', ',')}%`;
  }
  if (num >= 1000) {
    const formatted = num.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    return unit ? `${formatted} ${unit}` : formatted;
  }
  const formatted = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Carrega alertas do localStorage
 */
export function loadSavedPriceAlerts(): PriceAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALERTS);
    if (!raw) return getDefaultSeedAlerts();
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler alertas de preço do localStorage:', e);
    return getDefaultSeedAlerts();
  }
}

/**
 * Salva alertas no localStorage
 */
export function savePriceAlerts(alerts: PriceAlert[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
  } catch (e) {
    console.error('Erro ao salvar alertas de preço no localStorage:', e);
  }
}

/**
 * Carrega notificações do localStorage
 */
export function loadSavedPriceNotifications(): InAppPriceNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler notificações do localStorage:', e);
    return [];
  }
}

/**
 * Salva notificações no localStorage
 */
export function savePriceNotifications(notifs: InAppPriceNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifs.slice(0, 50)));
  } catch (e) {
    console.error('Erro ao salvar notificações no localStorage:', e);
  }
}

/**
 * Avalia os alertas ativos contra o feed de preços atualizado.
 * Dispara notificações quando o stop-loss ou take-profit é atingido.
 */
export function checkPriceAlerts(
  alerts: PriceAlert[],
  quotes: MarketAsset[]
): {
  updatedAlerts: PriceAlert[];
  newNotifications: InAppPriceNotification[];
} {
  if (!alerts || alerts.length === 0 || !quotes || quotes.length === 0) {
    return { updatedAlerts: alerts, newNotifications: [] };
  }

  const quotesMap = new Map<string, { price: number; quote: MarketAsset }>();
  quotes.forEach((q) => {
    quotesMap.set(q.ticker.toUpperCase(), {
      price: parseAssetPrice(q.value),
      quote: q,
    });
  });

  const newNotifications: InAppPriceNotification[] = [];
  let hasChanges = false;

  const updatedAlerts = alerts.map((alert) => {
    const assetData = quotesMap.get(alert.ticker.toUpperCase());
    if (!assetData) return alert;

    const currentPrice = assetData.price;
    let isTriggered = false;

    // Se o alerta já estiver desativado ou já disparado, atualiza apenas o preço corrente
    if (!alert.active || alert.triggered) {
      if (alert.currentPrice !== currentPrice) {
        hasChanges = true;
        return { ...alert, currentPrice };
      }
      return alert;
    }

    // Avalia condição de disparo
    if (alert.type === 'TAKE_PROFIT' && currentPrice >= alert.targetPrice) {
      isTriggered = true;
    } else if (alert.type === 'STOP_LOSS' && currentPrice <= alert.targetPrice) {
      isTriggered = true;
    }

    if (isTriggered) {
      hasChanges = true;
      const nowIso = new Date().toISOString();

      newNotifications.push({
        id: `notif-${alert.id}-${Date.now()}`,
        alertId: alert.id,
        ticker: alert.ticker,
        assetName: alert.assetName,
        type: alert.type,
        targetPrice: alert.targetPrice,
        triggeredPrice: currentPrice,
        timestamp: nowIso,
        read: false,
        note: alert.note,
      });

      return {
        ...alert,
        currentPrice,
        triggered: true,
        triggeredAt: nowIso,
        triggeredPrice: currentPrice,
        active: false, // Desativa após disparar
      };
    }

    if (alert.currentPrice !== currentPrice) {
      hasChanges = true;
      return { ...alert, currentPrice };
    }

    return alert;
  });

  if (hasChanges) {
    savePriceAlerts(updatedAlerts);
  }

  return { updatedAlerts, newNotifications };
}

/**
 * Alertas iniciais demonstrativos configurados para o gestor
 */
function getDefaultSeedAlerts(): PriceAlert[] {
  return [
    {
      id: 'alert-ibov-tp',
      ticker: 'IBOV',
      assetName: 'Ibovespa',
      targetPrice: 140000,
      initialPrice: 137250,
      currentPrice: 137250,
      type: 'TAKE_PROFIT',
      note: 'Realizar lucros parciais em renda variável e rebalancear para NTN-B / Tesouro IPCA+',
      active: true,
      createdAt: new Date().toISOString(),
      triggered: false,
      soundEnabled: true,
    },
    {
      id: 'alert-dolar-sl',
      ticker: 'USDBRL',
      assetName: 'Dólar Comercial PTAX',
      targetPrice: 5.35,
      initialPrice: 5.48,
      currentPrice: 5.48,
      type: 'STOP_LOSS',
      note: 'Aumentar hedge cambial e exposição offshore nos clientes arrojados',
      active: true,
      createdAt: new Date().toISOString(),
      triggered: false,
      soundEnabled: true,
    },
  ];
}
